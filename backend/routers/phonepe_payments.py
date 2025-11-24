"""
PhonePe Payment Router
Handles payment creation, verification, and callbacks for PhonePe gateway
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime
import os

from database import get_db
from models import Book, User, Reservation, Payment, BookStatus, ReservationStatus, PaymentStatus
from routers.auth import get_current_user

# Import PhonePe service
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.phonepe_service import create_payment_order, check_payment_status

router = APIRouter()

# Get base URL from environment
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

class PhonePePaymentRequest(BaseModel):
    book_id: int
    payment_type: str = "purchase"  # "purchase" or "rental"

class PhonePePaymentResponse(BaseModel):
    success: bool
    payment_url: str
    order_id: str
    merchant_order_id: str
    reservation_id: int
    amount: float

@router.post("/initiate", response_model=PhonePePaymentResponse)
async def initiate_phonepe_payment(
    payment_request: PhonePePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate a PhonePe payment for book reservation
    Creates reservation and PhonePe order
    """
    
    # Get the book
    result = await db.execute(select(Book).where(Book.id == payment_request.book_id))
    book = result.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.status != BookStatus.IN_STOCK:
        raise HTTPException(status_code=400, detail="Book is not available for reservation")
    
    if book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot reserve your own book")
    
    # Check if book is available for rental if rental type
    if payment_request.payment_type == 'rental':
        if not book.is_for_rent or book.weekly_fee is None:
            raise HTTPException(status_code=400, detail="Book is not available for rental")
    
    # Calculate payment amount (full book price)
    payment_amount = float(book.price)
    
    # Create reservation in database
    reservation = Reservation(
        book_id=book.id,
        user_id=current_user.id,
        reservation_fee=payment_amount,
        status=ReservationStatus.RESERVED,
        payment_status=PaymentStatus.PENDING,
        payment_type=payment_request.payment_type,
        expires_at=datetime.now()
    )
    
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)
    
    # Generate merchant order ID
    merchant_order_id = f"RES_{reservation.id}_{int(datetime.now().timestamp())}"
    
    # Create redirect URL
    redirect_url = f"{BACKEND_URL}/api/phonepe/callback?reservation_id={reservation.id}"
    
    # Create PhonePe payment order
    payment_response = create_payment_order(
        amount=payment_amount,
        redirect_url=redirect_url,
        merchant_order_id=merchant_order_id,
        metadata={
            "udf1": str(reservation.id),
            "udf2": str(book.id),
            "udf3": str(current_user.id),
            "udf4": payment_request.payment_type,
            "udf5": book.title
        }
    )
    
    if not payment_response.get("success"):
        # Rollback reservation if payment creation failed
        await db.delete(reservation)
        await db.commit()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create PhonePe order: {payment_response.get('error')}"
        )
    
    # Update reservation with PhonePe order details
    reservation.phonepe_order_id = merchant_order_id
    reservation.phonepe_payment_id = payment_response.get("order_id")
    await db.commit()
    
    return PhonePePaymentResponse(
        success=True,
        payment_url=payment_response["payment_url"],
        order_id=payment_response["order_id"],
        merchant_order_id=merchant_order_id,
        reservation_id=reservation.id,
        amount=payment_amount
    )


@router.get("/callback")
async def phonepe_payment_callback(
    request: Request,
    reservation_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle PhonePe payment callback/redirect
    Verifies payment and updates reservation status
    """
    
    # Get reservation
    result = await db.execute(select(Reservation).where(Reservation.id == reservation_id))
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        return {
            "success": False,
            "message": "Reservation not found",
            "redirect_url": f"{FRONTEND_URL}/payment-failed"
        }
    
    # Check payment status with PhonePe
    merchant_order_id = reservation.phonepe_order_id
    status_response = check_payment_status(merchant_order_id)
    
    if not status_response.get("success"):
        return {
            "success": False,
            "message": "Failed to verify payment status",
            "redirect_url": f"{FRONTEND_URL}/payment-failed?reservation_id={reservation_id}"
        }
    
    payment_state = status_response.get("state")
    
    # Check if payment is successful
    if payment_state == "COMPLETED":
        # Update reservation status
        reservation.payment_status = PaymentStatus.PAID
        reservation.status = ReservationStatus.CONFIRMED
        
        # Update book status
        result = await db.execute(select(Book).where(Book.id == reservation.book_id))
        book = result.scalar_one_or_none()
        if book:
            book.status = BookStatus.RESERVED
        
        # Create payment record
        payment = Payment(
            reservation_id=reservation.id,
            amount=reservation.reservation_fee,
            payment_method="phonepe",
            transaction_id=status_response.get("transaction_id"),
            status=PaymentStatus.PAID
        )
        db.add(payment)
        
        await db.commit()
        
        # Redirect to success page
        return {
            "success": True,
            "message": "Payment successful",
            "redirect_url": f"{FRONTEND_URL}/payment-success?reservation_id={reservation_id}"
        }
    
    elif payment_state == "FAILED":
        # Update reservation as failed
        reservation.payment_status = PaymentStatus.FAILED
        await db.commit()
        
        return {
            "success": False,
            "message": "Payment failed",
            "redirect_url": f"{FRONTEND_URL}/payment-failed?reservation_id={reservation_id}"
        }
    
    else:
        # Payment still pending
        return {
            "success": False,
            "message": "Payment is pending",
            "redirect_url": f"{FRONTEND_URL}/payment-pending?reservation_id={reservation_id}"
        }


@router.get("/status/{reservation_id}")
async def get_payment_status(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get payment status for a reservation
    """
    
    # Get reservation
    result = await db.execute(select(Reservation).where(Reservation.id == reservation_id))
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check if user is authorized to view this reservation
    if reservation.user_id != current_user.id:
        result = await db.execute(select(Book).where(Book.id == reservation.book_id))
        book = result.scalar_one_or_none()
        if not book or book.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this reservation")
    
    # Check payment status with PhonePe
    if reservation.phonepe_order_id:
        status_response = check_payment_status(reservation.phonepe_order_id)
        
        return {
            "reservation_id": reservation.id,
            "payment_status": reservation.payment_status,
            "reservation_status": reservation.status,
            "phonepe_status": status_response.get("state") if status_response.get("success") else None,
            "transaction_id": status_response.get("transaction_id") if status_response.get("success") else None,
            "amount": reservation.reservation_fee
        }
    
    return {
        "reservation_id": reservation.id,
        "payment_status": reservation.payment_status,
        "reservation_status": reservation.status,
        "amount": reservation.reservation_fee
    }
