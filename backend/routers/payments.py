from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
import os
from datetime import datetime, timedelta
import json

from database import get_db
from models import Book, User, Reservation, Payment, BookStatus, ReservationStatus, PaymentStatus
from routers.auth import get_current_user
from pydantic import BaseModel
from services.phonepe_service import create_payment_order, check_payment_status

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

router = APIRouter()

class ReservationCreate(BaseModel):
    book_id: int
    payment_type: str = "purchase"  # "purchase" or "rental"
    rental_weeks: int = None  # Number of weeks for rental (1, 2, or 3)

class PaymentPageCreate(BaseModel):
    book_id: int
    payment_type: str = "purchase"  # "purchase" or "rental"
    rental_weeks: int = None  # Number of weeks for rental (1, 2, or 3)

class PaymentVerification(BaseModel):
    phonepe_order_id: str
    phonepe_payment_id: str
    reservation_id: int

class ReservationResponse(BaseModel):
    id: int
    book_id: int
    reservation_fee: float
    phonepe_order_id: str
    payment_url: str  # PhonePe payment page URL
    amount: float  # Amount in rupees
    currency: str
    book_title: str
    seller_contact: str = None  # Only shown after payment

# create a reservation and PhonePe order for advance payment
@router.post("/reserve", response_model=ReservationResponse)
@router.post("/phonepe/initiate", response_model=ReservationResponse)  # Alias for PhonePe-specific flow
async def create_reservation(
    reservation_data: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
        
    # Get the book
    result = await db.execute(select(Book).where(Book.id == reservation_data.book_id))
    book = result.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.status != BookStatus.IN_STOCK:
        raise HTTPException(status_code=400, detail="Book is not available for reservation")
    
    if book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot reserve your own book")
    
    # Calculate payment amount based on type
    if reservation_data.payment_type == 'rental':
        if not book.is_for_rent or book.weekly_fee is None:
            raise HTTPException(status_code=400, detail="Book is not available for rental")
        
        # Validate rental_weeks
        if not reservation_data.rental_weeks or reservation_data.rental_weeks not in [1, 2, 3]:
            raise HTTPException(status_code=400, detail="Rental weeks must be 1, 2, or 3")
        
        # Calculate rental fee based on weeks
        advance_amount = float(book.weekly_fee) * reservation_data.rental_weeks
    else:
        # For purchase, use full book price
        advance_amount = float(book.price)
    
    # Create reservation in database first
    reservation = Reservation(
        book_id=book.id,
        user_id=current_user.id,
        reservation_fee=advance_amount,
        expires_at=datetime.now() + timedelta(hours=24),  # 24 hour expiry
        status=ReservationStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        payment_type=reservation_data.payment_type,
        rental_weeks=reservation_data.rental_weeks if reservation_data.payment_type == 'rental' else None
    )
    
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)
    
    # Generate merchant order ID
    merchant_order_id = f"RES_{reservation.id}_{int(datetime.now().timestamp())}"
    
    # Create redirect URL
    redirect_url = f"{BACKEND_URL}/api/payments/phonepe/callback?reservation_id={reservation.id}"
    
    # Create PhonePe payment order
    payment_response = create_payment_order(
        amount=advance_amount,
        redirect_url=redirect_url,
        merchant_order_id=merchant_order_id,
        metadata={
            "udf1": str(reservation.id),
            "udf2": str(book.id),
            "udf3": str(current_user.id),
            "udf4": reservation_data.payment_type,
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
    
    # Create payment record
    payment = Payment(
        reservation_id=reservation.id,
        phonepe_order_id=merchant_order_id,
        amount=advance_amount,
        currency="INR",
        status=PaymentStatus.PENDING,
        payment_method="phonepe"
    )
    
    db.add(payment)
    await db.commit()
    
    return ReservationResponse(
        id=reservation.id,
        book_id=book.id,
        reservation_fee=advance_amount,
        phonepe_order_id=merchant_order_id,
        payment_url=payment_response["payment_url"],
        amount=advance_amount,
        currency="INR",
        book_title=book.title
    )

@router.post("/verify-payment")
async def verify_payment(
    payment_data: PaymentVerification,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify PhonePe payment and complete reservation"""
    
    # Get reservation
    result = await db.execute(
        select(Reservation).where(Reservation.id == payment_data.reservation_id)
    )
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to verify this payment")
    
    # Check payment status with PhonePe
    merchant_order_id = reservation.phonepe_order_id
    
    if not merchant_order_id:
        raise HTTPException(status_code=400, detail="No PhonePe order found for this reservation")
    
    status_response = check_payment_status(merchant_order_id)
    
    if not status_response.get("success"):
        raise HTTPException(status_code=500, detail="Failed to verify payment status with PhonePe")
    
    payment_state = status_response.get("state")
    
    if payment_state != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"Payment not completed. Current status: {payment_state}")
    
    # Update reservation and payment status
    reservation.phonepe_payment_id = payment_data.phonepe_payment_id
    reservation.payment_status = PaymentStatus.PAID
    reservation.status = ReservationStatus.CONFIRMED
    
    # Update payment record
    result = await db.execute(
        select(Payment).where(Payment.reservation_id == reservation.id)
    )
    payment = result.scalar_one_or_none()
    
    if payment:
        payment.phonepe_payment_id = payment_data.phonepe_payment_id
        payment.transaction_id = status_response.get("transaction_id")
        payment.status = PaymentStatus.PAID
        payment.gateway_response = json.dumps(status_response)
    
    # Update book status to reserved
    result = await db.execute(select(Book).where(Book.id == reservation.book_id))
    book = result.scalar_one_or_none()
    
    if book:
        book.status = BookStatus.RESERVED
    
    await db.commit()
    
    return {"message": "Payment verified successfully", "reservation_id": reservation.id}


# PhonePe Callback Handler
@router.get("/phonepe/callback")
async def phonepe_payment_callback(
    request: Request,
    reservation_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle PhonePe payment callback/redirect
    Verifies payment and updates reservation status
    """
    
    # Log all query parameters to debug
    print(f"=== PhonePe Callback Triggered ===")
    print(f"Full URL: {request.url}")
    print(f"Query params: {dict(request.query_params)}")
    
    # Get reservation
    result = await db.execute(select(Reservation).where(Reservation.id == reservation_id))
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        print(f"Reservation {reservation_id} not found")
        return RedirectResponse(url=f"{FRONTEND_URL}/payment-failed")
    
    # Check payment status with PhonePe
    merchant_order_id = reservation.phonepe_order_id
    print(f"Checking payment status for merchant_order_id: {merchant_order_id}")
    
    if not merchant_order_id:
        print("No merchant_order_id found, treating as failed")
        return RedirectResponse(url=f"{FRONTEND_URL}/payment-failed?reservation_id={reservation_id}")
    
    status_response = check_payment_status(merchant_order_id)
    print(f"PhonePe status response: {status_response}")
    
    if not status_response.get("success"):
        print(f"PhonePe status check failed: {status_response.get('error')}")
        return RedirectResponse(url=f"{FRONTEND_URL}/payment-failed?reservation_id={reservation_id}")
    
    payment_state = status_response.get("state")
    print(f"Payment state received: '{payment_state}'")
    
    # Check payment state and redirect accordingly
    if payment_state == "COMPLETED":
        print("Payment COMPLETED - updating reservation to CONFIRMED")
        # Update reservation status
        reservation.payment_status = PaymentStatus.PAID
        reservation.status = ReservationStatus.CONFIRMED
        
        # Set rental start date and due date for rentals
        if reservation.payment_type == 'rental' and reservation.rental_weeks:
            reservation.rental_start_date = datetime.now()
            reservation.due_date = datetime.now() + timedelta(weeks=reservation.rental_weeks)
        
        # Update book status
        result = await db.execute(select(Book).where(Book.id == reservation.book_id))
        book = result.scalar_one_or_none()
        if book:
            book.status = BookStatus.RESERVED
        
        # Create payment record if not exists
        payment_exists = await db.execute(
            select(Payment).where(Payment.reservation_id == reservation.id)
        )
        existing_payment = payment_exists.scalar_one_or_none()
        
        if not existing_payment:
            payment = Payment(
                reservation_id=reservation.id,
                amount=reservation.reservation_fee,
                payment_method="phonepe",
                transaction_id=status_response.get("transaction_id"),
                status=PaymentStatus.PAID
            )
            db.add(payment)
        
        await db.commit()
        
        print(f"Redirecting to payment-success page for reservation {reservation_id}")
        return RedirectResponse(url=f"{FRONTEND_URL}/payment-success?reservation_id={reservation_id}")
    
    else:
        print(f"Payment not completed (state: {payment_state}) - updating reservation to CANCELLED")
        # Update reservation as failed/cancelled for any non-completed state
        reservation.payment_status = PaymentStatus.FAILED
        reservation.status = ReservationStatus.CANCELLED
        await db.commit()
        
        print(f"Redirecting to payment-failed page for reservation {reservation_id}")
        return RedirectResponse(url=f"{FRONTEND_URL}/payment-failed?reservation_id={reservation_id}")


# PhonePe Status Check
@router.get("/phonepe/status/{reservation_id}")
async def get_phonepe_payment_status(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get real-time PhonePe payment status for a reservation
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
    phonepe_status = None
    transaction_id = None
    
    if reservation.phonepe_order_id:
        status_response = check_payment_status(reservation.phonepe_order_id)
        
        if status_response.get("success"):
            phonepe_status = status_response.get("state")
            transaction_id = status_response.get("transaction_id")
            
            # Update reservation status based on PhonePe status if it changed
            if phonepe_status == "COMPLETED" and reservation.payment_status != PaymentStatus.PAID:
                reservation.payment_status = PaymentStatus.PAID
                reservation.status = ReservationStatus.CONFIRMED
                
                # Update book status
                result = await db.execute(select(Book).where(Book.id == reservation.book_id))
                book = result.scalar_one_or_none()
                if book:
                    book.status = BookStatus.RESERVED
                
                # Create payment record if not exists
                payment_exists = await db.execute(
                    select(Payment).where(Payment.reservation_id == reservation.id)
                )
                if not payment_exists.scalar_one_or_none():
                    payment = Payment(
                        reservation_id=reservation.id,
                        amount=reservation.reservation_fee,
                        payment_method="phonepe",
                        transaction_id=transaction_id,
                        status=PaymentStatus.PAID
                    )
                    db.add(payment)
                
                await db.commit()
                
            elif phonepe_status in ["FAILED", "PENDING"] and reservation.payment_status != PaymentStatus.FAILED:
                reservation.payment_status = PaymentStatus.FAILED
                reservation.status = ReservationStatus.CANCELLED
                await db.commit()
    
    return {
        "reservation_id": reservation.id,
        "payment_status": reservation.payment_status.value if reservation.payment_status else None,
        "reservation_status": reservation.status.value if reservation.status else None,
        "phonepe_status": phonepe_status,
        "transaction_id": transaction_id,
        "amount": reservation.reservation_fee
    }


@router.get("/reservation/{reservation_id}")
async def get_reservation_details(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get reservation details including seller contact (only after payment)"""
    
    result = await db.execute(
        select(Reservation).where(Reservation.id == reservation_id)
    )
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this reservation")
    
    # Get book and seller details
    result = await db.execute(
        select(Book).where(Book.id == reservation.book_id)
    )
    book = result.scalar_one_or_none()
    
    result = await db.execute(
        select(User).where(User.id == book.owner_id)
    )
    seller = result.scalar_one_or_none()
    
    response_data = {
        "id": reservation.id,
        "book": {
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "price": book.price,
            "condition": book.condition,
            "description": book.description
        },
        "reservation_fee": reservation.reservation_fee,
        "payment_type": reservation.payment_type,
        "status": reservation.status.value,
        "created_at": reservation.created_at.isoformat() if reservation.created_at else None,
        "expires_at": reservation.expires_at.isoformat() if reservation.expires_at else None
    }
    
    # Add rental information if it's a rental
    if reservation.payment_type == 'rental':
        response_data["rental_weeks"] = reservation.rental_weeks
        response_data["rental_start_date"] = reservation.rental_start_date.isoformat() if reservation.rental_start_date else None
        response_data["due_date"] = reservation.due_date.isoformat() if reservation.due_date else None
        
        # Check if overdue
        if reservation.due_date and datetime.now() > reservation.due_date:
            response_data["is_overdue"] = True
            days_overdue = (datetime.now() - reservation.due_date).days
            response_data["days_overdue"] = days_overdue
        else:
            response_data["is_overdue"] = False
    
    # Only show seller contact if payment is confirmed
    if reservation.status == ReservationStatus.CONFIRMED:
        response_data["seller_contact"] = {
            "name": f"{seller.first_name} {seller.last_name}",
            "email": seller.email,
            "phone": seller.phone,
            "address": f"{seller.address}, {seller.city}, {seller.state} {seller.zip_code}".strip(", ")
        }
        
        if reservation.payment_type == 'rental':
            response_data["pickup_instructions"] = "Contact the seller to arrange pickup. Return the book before the due date."
        else:
            response_data["pickup_instructions"] = "Contact the seller to arrange pickup."
    
    return response_data

@router.post("/mark-collected/{reservation_id}")
async def mark_book_collected(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark book as collected (to be called by seller)"""
    
    result = await db.execute(
        select(Reservation).where(Reservation.id == reservation_id)
    )
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Get book to check if current user is the seller
    result = await db.execute(
        select(Book).where(Book.id == reservation.book_id)
    )
    book = result.scalar_one_or_none()
    
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the seller can mark book as collected")
    
    if reservation.status != ReservationStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Reservation must be confirmed before collection")
    
    # Update statuses
    reservation.status = ReservationStatus.COMPLETED
    book.status = BookStatus.SOLD
    
    await db.commit()
    
    return {"message": "Book marked as collected and sold successfully"}


@router.get("/seller-reservations")
async def get_seller_reservations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all reservations for books owned by the current user"""
    
    query = select(
        Reservation,
        Book,
        User.first_name.label("buyer_first_name"),
        User.last_name.label("buyer_last_name"), 
        User.email.label("buyer_email"),
        User.phone.label("buyer_phone")
    ).join(
        Book, Reservation.book_id == Book.id
    ).join(
        User, Reservation.user_id == User.id
    ).where(
        Book.owner_id == current_user.id
    ).order_by(Reservation.created_at.desc())
    
    result = await db.execute(query)
    reservations_data = result.all()
    
    reservations = []
    for reservation, book, buyer_first_name, buyer_last_name, buyer_email, buyer_phone in reservations_data:
        reservation_dict = {
            "id": reservation.id,
            "book_title": book.title,
            "book_author": book.author,
            "total_price": float(book.price),
            "amount_paid": float(reservation.reservation_fee),
            "remaining_amount": float(book.price - reservation.reservation_fee),
            "buyer_name": f"{buyer_first_name} {buyer_last_name}",
            "buyer_email": buyer_email,
            "buyer_phone": buyer_phone,
            "payment_type": reservation.payment_type,
            "status": reservation.status.value,
            "payment_status": "PAID",  # Since we only show confirmed reservations
            "created_at": reservation.created_at.isoformat(),
            "valid_until": reservation.expires_at.isoformat()
        }
        
        # Add rental information if applicable
        if reservation.payment_type == 'rental':
            reservation_dict["rental_weeks"] = reservation.rental_weeks
            reservation_dict["rental_start_date"] = reservation.rental_start_date.isoformat() if reservation.rental_start_date else None
            reservation_dict["due_date"] = reservation.due_date.isoformat() if reservation.due_date else None
            
            # Check if overdue
            if reservation.due_date and datetime.now() > reservation.due_date:
                reservation_dict["is_overdue"] = True
                reservation_dict["days_overdue"] = (datetime.now() - reservation.due_date).days
            else:
                reservation_dict["is_overdue"] = False
        
        reservations.append(reservation_dict)
    
    return reservations


# Payment Page Integration for Model A (Book Purchases)
@router.post("/payment-page/create")
async def create_payment_page(
    payment_data: PaymentPageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a PhonePe Payment Page for full book purchase (Model A)"""
    
    # Get the book
    result = await db.execute(select(Book).where(Book.id == payment_data.book_id))
    book = result.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.status != BookStatus.IN_STOCK:
        raise HTTPException(status_code=400, detail="Book is not available for purchase")
    
    if book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot buy your own book")
    
    # Create reservation record for tracking
    reservation = Reservation(
        book_id=book.id,
        user_id=current_user.id,
        reservation_fee=book.price,
        status=ReservationStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        payment_type=payment_data.payment_type,
        expires_at=datetime.now() + timedelta(hours=24)
    )
    
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)
    
    # Generate merchant order ID
    merchant_order_id = f"RES_{reservation.id}_{int(datetime.now().timestamp())}"
    
    # Create redirect URL
    redirect_url = f"{BACKEND_URL}/api/payments/phonepe/callback?reservation_id={reservation.id}"
    
    # Create PhonePe payment order
    payment_response = create_payment_order(
        amount=float(book.price),
        redirect_url=redirect_url,
        merchant_order_id=merchant_order_id,
        metadata={
            "udf1": str(reservation.id),
            "udf2": str(book.id),
            "udf3": str(current_user.id),
            "udf4": payment_data.payment_type,
            "udf5": book.title
        }
    )
    
    if not payment_response.get("success"):
        await db.delete(reservation)
        await db.commit()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create PhonePe order: {payment_response.get('error')}"
        )
    
    # Update reservation with PhonePe order details
    reservation.phonepe_order_id = merchant_order_id
    reservation.phonepe_payment_id = payment_response.get("order_id")
    
    # Create Payment record
    payment = Payment(
        reservation_id=reservation.id,
        phonepe_order_id=merchant_order_id,
        amount=book.price,
        currency="INR",
        status=PaymentStatus.PENDING,
        payment_method="phonepe"
    )
    
    db.add(payment)
    await db.commit()
    
    # Return Payment Page configuration
    return {
        "reservation_id": reservation.id,
        "payment_url": payment_response["payment_url"],
        "book_title": book.title,
        "amount": book.price,
        "currency": "INR",
        "success_url": f"{FRONTEND_URL}/payment-success?reservation_id={reservation.id}",
        "cancel_url": f"{FRONTEND_URL}/payment-failed?reservation_id={reservation.id}"
    }

@router.post("/payment-page/verify")
async def verify_payment_page_payment(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify payment from PhonePe Payment Page and complete purchase"""
    
    # Get reservation
    result = await db.execute(
        select(Reservation).where(Reservation.id == reservation_id)
    )
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check payment status with PhonePe
    merchant_order_id = reservation.phonepe_order_id
    
    if merchant_order_id:
        status_response = check_payment_status(merchant_order_id)
        
        if status_response.get("success") and status_response.get("state") == "COMPLETED":
            # Update reservation status
            reservation.status = ReservationStatus.CONFIRMED
            reservation.payment_status = PaymentStatus.PAID
            
            # Update payment record
            result = await db.execute(
                select(Payment).where(Payment.reservation_id == reservation.id)
            )
            payment = result.scalar_one_or_none()
            
            if payment:
                payment.status = PaymentStatus.PAID
                payment.phonepe_payment_id = status_response.get("transaction_id")
                payment.transaction_id = status_response.get("transaction_id")
            
            # Update book status to reserved
            result = await db.execute(select(Book).where(Book.id == reservation.book_id))
            book = result.scalar_one_or_none()
            
            if book:
                book.status = BookStatus.RESERVED
            
            await db.commit()
            
            return {
                "status": "success",
                "message": "Payment verified successfully",
                "reservation_id": reservation.id,
                "next_steps": [
                    "Contact the seller to arrange pickup",
                    "Collect the book within 24 hours",
                    "Confirm collection to release payment to seller"
                ]
            }
    
    raise HTTPException(status_code=400, detail="Payment not completed or verification failed")