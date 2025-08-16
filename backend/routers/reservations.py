from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from database import get_db
from models import Reservation, Book, User, ReservationStatus
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class ReservationCreate(BaseModel):
    book_id: int
    hours: int = 24

class ReservationResponse(BaseModel):
    id: int
    book_id: int
    user_id: int
    reservation_fee: float
    status: ReservationStatus
    expires_at: datetime
    created_at: datetime

@router.post("/", response_model=ReservationResponse)
async def create_reservation(
    reservation: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == reservation.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="book not found")
    
    if book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="cannot reserve your own book")
    
    if book.stock <= 0:
        raise HTTPException(status_code=400, detail="book not available")
    
    # check for existing active reservations
    existing = db.query(Reservation).filter(
        Reservation.book_id == reservation.book_id,
        Reservation.user_id == current_user.id,
        Reservation.status.in_([ReservationStatus.PENDING, ReservationStatus.CONFIRMED])
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="already have active reservation for this book")
    
    # calculate reservation fee (5% of book price)
    reservation_fee = book.price * 0.05
    expires_at = datetime.utcnow() + timedelta(hours=reservation.hours)
    
    db_reservation = Reservation(
        book_id=reservation.book_id,
        user_id=current_user.id,
        reservation_fee=reservation_fee,
        expires_at=expires_at
    )
    
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    
    return db_reservation

@router.get("/my", response_model=List[ReservationResponse])
async def get_my_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservations = db.query(Reservation).filter(
        Reservation.user_id == current_user.id
    ).order_by(Reservation.created_at.desc()).all()
    return reservations

@router.put("/{reservation_id}/confirm")
async def confirm_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="reservation not found")
    
    if reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="not authorized")
    
    if reservation.status != ReservationStatus.PENDING:
        raise HTTPException(status_code=400, detail="reservation cannot be confirmed")
    
    if reservation.expires_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="reservation has expired")
    
    # TODO: stripe integration for payments processing
    reservation.status = ReservationStatus.CONFIRMED
    
    db.commit()
    return {"message": "reservation confirmed"}

@router.put("/{reservation_id}/cancel")
async def cancel_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="reservation not found")
    
    if reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="not authorized")
    
    if reservation.status not in [ReservationStatus.PENDING, ReservationStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="reservation cannot be cancelled")
    
    reservation.status = ReservationStatus.CANCELLED
    
    db.commit()
    return {"message": "reservation cancelled"}
