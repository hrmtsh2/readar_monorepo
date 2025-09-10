from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import Charity, Donation, User
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class CharityResponse(BaseModel):
    id: int
    name: str
    description: str = None
    email: str
    phone: str = None
    address: str = None
    website: str = None
    is_verified: bool

class DonationCreate(BaseModel):
    charity_id: int
    book_details: str  # json string of book details
    pickup_address: str

class DonationResponse(BaseModel):
    id: int
    charity_id: int
    book_details: str
    pickup_address: str
    pickup_date: str = None
    status: str

@router.get("/", response_model=List[CharityResponse])
async def get_charities(
    skip: int = 0,
    limit: int = 100,
    verified_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    query = select(Charity)
    
    if verified_only:
        query = query.where(Charity.is_verified == True)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    charities = result.scalars().all()
    return charities

@router.post("/donate", response_model=DonationResponse)
async def create_donation(
    donation: DonationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if charity exists
    charity_query = select(Charity).where(Charity.id == donation.charity_id)
    charity_result = await db.execute(charity_query)
    charity = charity_result.scalar_one_or_none()
    
    if not charity:
        raise HTTPException(status_code=404, detail="charity not found")
    
    db_donation = Donation(
        user_id=current_user.id,
        charity_id=donation.charity_id,
        book_details=donation.book_details,
        pickup_address=donation.pickup_address
    )
    
    db.add(db_donation)
    await db.commit()
    await db.refresh(db_donation)
    
    return db_donation

@router.get("/my-donations", response_model=List[DonationResponse])
async def get_my_donations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Donation).where(
        Donation.user_id == current_user.id
    ).order_by(Donation.created_at.desc())
    
    result = await db.execute(query)
    donations = result.scalars().all()
    
    return donations
    
    return donations
