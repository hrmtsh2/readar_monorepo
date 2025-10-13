from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
import os
from datetime import datetime, timedelta
import json

# Optional Razorpay import for production use
try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False
    print("Warning: Razorpay not installed. Using mock payment system.")

from database import get_db
from models import Book, User, Reservation, Payment, BookStatus, ReservationStatus, PaymentStatus
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

# Razorpay client initialization (only if available)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_dummy")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "dummy_secret")

if RAZORPAY_AVAILABLE:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    client = None

class ReservationCreate(BaseModel):
    book_id: int
    advance_percentage: float = 20.0  # Default 20% advance

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    reservation_id: int

class ReservationResponse(BaseModel):
    id: int
    book_id: int
    reservation_fee: float
    razorpay_order_id: str
    key_id: str  # For frontend Razorpay integration
    amount: int  # Amount in paise
    currency: str
    book_title: str
    seller_contact: str = None  # Only shown after payment

@router.post("/reserve", response_model=ReservationResponse)
async def create_reservation(
    reservation_data: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a reservation and Razorpay order for advance payment"""
    
    # Get the book
    result = await db.execute(select(Book).where(Book.id == reservation_data.book_id))
    book = result.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.status != BookStatus.IN_STOCK:
        raise HTTPException(status_code=400, detail="Book is not available for reservation")
    
    if book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot reserve your own book")
    
    # Calculate advance amount (20% of book price)
    advance_amount = (book.price * reservation_data.advance_percentage) / 100
    amount_in_paise = int(advance_amount * 100)  # Convert to paise
    
    # Create Razorpay order
    order_data = {
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": f"book_reservation_{book.id}_{current_user.id}_{int(datetime.now().timestamp())}",
        "notes": {
            "book_id": str(book.id),
            "book_title": book.title,
            "buyer_id": str(current_user.id),
            "buyer_email": current_user.email
        }
    }
    
    try:
        razorpay_order = client.order.create(data=order_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")
    
    # Create reservation in database
    reservation = Reservation(
        book_id=book.id,
        user_id=current_user.id,
        reservation_fee=advance_amount,
        razorpay_order_id=razorpay_order["id"],
        expires_at=datetime.utcnow() + timedelta(hours=24),  # 24 hour expiry
        status=ReservationStatus.PENDING
    )
    
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)
    
    # Create payment record
    payment = Payment(
        reservation_id=reservation.id,
        razorpay_order_id=razorpay_order["id"],
        amount=advance_amount,
        currency="INR",
        status=PaymentStatus.PENDING
    )
    
    db.add(payment)
    await db.commit()
    
    return ReservationResponse(
        id=reservation.id,
        book_id=book.id,
        reservation_fee=advance_amount,
        razorpay_order_id=razorpay_order["id"],
        key_id=RAZORPAY_KEY_ID,
        amount=amount_in_paise,
        currency="INR",
        book_title=book.title
    )

@router.post("/verify-payment")
async def verify_payment(
    payment_data: PaymentVerification,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify Razorpay payment and complete reservation"""
    
    # Get reservation
    result = await db.execute(
        select(Reservation).where(Reservation.id == payment_data.reservation_id)
    )
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to verify this payment")
    
    # Verify payment signature
    params_dict = {
        'razorpay_order_id': payment_data.razorpay_order_id,
        'razorpay_payment_id': payment_data.razorpay_payment_id,
        'razorpay_signature': payment_data.razorpay_signature
    }
    
    try:
        client.utility.verify_payment_signature(params_dict)
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    # Get payment details from Razorpay
    try:
        payment_details = client.payment.fetch(payment_data.razorpay_payment_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch payment details")
    
    # Update reservation and payment status
    reservation.payment_id = payment_data.razorpay_payment_id
    reservation.status = ReservationStatus.CONFIRMED
    
    # Update payment record
    result = await db.execute(
        select(Payment).where(Payment.reservation_id == reservation.id)
    )
    payment = result.scalar_one_or_none()
    
    if payment:
        payment.razorpay_payment_id = payment_data.razorpay_payment_id
        payment.status = PaymentStatus.PAID
        payment.gateway_response = json.dumps(payment_details)
    
    # Update book status to reserved
    result = await db.execute(select(Book).where(Book.id == reservation.book_id))
    book = result.scalar_one_or_none()
    
    if book:
        book.status = BookStatus.RESERVED
    
    await db.commit()
    
    return {"message": "Payment verified successfully", "reservation_id": reservation.id}

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
        "status": reservation.status,
        "created_at": reservation.created_at
    }
    
    # Only show seller contact if payment is confirmed
    if reservation.status == ReservationStatus.CONFIRMED:
        response_data["seller_contact"] = {
            "name": f"{seller.first_name} {seller.last_name}",
            "email": seller.email,
            "phone": seller.phone,
            "address": f"{seller.address}, {seller.city}, {seller.state} {seller.zip_code}".strip(", ")
        }
        response_data["pickup_instructions"] = "Contact the seller to arrange pickup. Remaining amount to be paid during pickup."
    
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
        reservations.append({
            "id": reservation.id,
            "book_title": book.title,
            "book_author": book.author,
            "total_price": float(book.price),
            "amount_paid": float(reservation.reservation_fee),
            "remaining_amount": float(book.price - reservation.reservation_fee),
            "buyer_name": f"{buyer_first_name} {buyer_last_name}",
            "buyer_email": buyer_email,
            "buyer_phone": buyer_phone,
            "status": reservation.status.value,
            "payment_status": "PAID",  # Since we only show confirmed reservations
            "created_at": reservation.created_at.isoformat(),
            "valid_until": reservation.expires_at.isoformat()
        })
    
    return reservations


# Mock payment endpoints for testing without Razorpay account
@router.post("/mock-reserve")
async def create_mock_reservation(
    reservation_data: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a mock reservation without Razorpay integration"""
    
    # Get the book
    result = await db.execute(select(Book).where(Book.id == reservation_data.book_id))
    book = result.scalar_one_or_none()
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.status != BookStatus.IN_STOCK:
        raise HTTPException(status_code=400, detail="Book is not available for reservation")
    
    if book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot reserve your own book")
    
    # Calculate advance amount (20% of book price)
    advance_amount = (book.price * reservation_data.advance_percentage) / 100
    
    # Create mock order ID
    mock_order_id = f"mock_order_{book.id}_{current_user.id}_{int(datetime.now().timestamp())}"
    
    # Create reservation in database
    reservation = Reservation(
        book_id=book.id,
        user_id=current_user.id,
        reservation_fee=advance_amount,
        razorpay_order_id=mock_order_id,  # Store mock order ID here
        expires_at=datetime.utcnow() + timedelta(hours=24),  # 24 hour expiry
        status=ReservationStatus.PENDING
    )
    
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)
    
    # Create mock payment record
    payment = Payment(
        reservation_id=reservation.id,
        razorpay_order_id=mock_order_id,
        amount=advance_amount,
        currency="INR",
        status=PaymentStatus.PENDING
    )
    
    db.add(payment)
    await db.commit()
    
    return {
        "id": reservation.id,
        "book_id": book.id,
        "reservation_fee": advance_amount,
        "mock_order_id": mock_order_id,
        "book_title": book.title
    }


@router.post("/mock-verify-payment")
async def mock_verify_payment(
    payment_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mock payment verification for testing"""
    
    reservation_id = payment_data.get("reservation_id")
    mock_order_id = payment_data.get("mock_order_id")
    mock_payment_id = payment_data.get("mock_payment_id")
    
    # Get reservation
    result = await db.execute(
        select(Reservation).where(Reservation.id == reservation_id)
    )
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update reservation status
    reservation.status = ReservationStatus.CONFIRMED
    reservation.payment_id = mock_payment_id
    
    # Update payment status
    result = await db.execute(
        select(Payment).where(Payment.reservation_id == reservation_id)
    )
    payment = result.scalar_one_or_none()
    
    if payment:
        payment.status = PaymentStatus.PAID
        payment.razorpay_payment_id = mock_payment_id
    
    # Update book status
    result = await db.execute(
        select(Book).where(Book.id == reservation.book_id)
    )
    book = result.scalar_one_or_none()
    
    if book:
        book.status = BookStatus.RESERVED
    
    await db.commit()
    
    return {"status": "success", "message": "Mock payment verified successfully"}