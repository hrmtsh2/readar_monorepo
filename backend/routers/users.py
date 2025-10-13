from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import User
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class UserUpdate(BaseModel):
    first_name: str = None
    last_name: str = None
    phone: str = None
    address: str = None
    city: str = None
    state: str = None
    zip_code: str = None
    latitude: float = None
    longitude: float = None

class UserProfile(BaseModel):
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    phone: str = None
    address: str = None
    city: str = None
    state: str = None
    zip_code: str = None
    is_active: bool
    is_verified: bool

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/admin/all", response_model=List[UserProfile])
async def get_all_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Simple admin check - you can enhance this with proper role-based access
    # For now, any logged-in user can view this (remove this in production)
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return users

@router.put("/profile", response_model=UserProfile)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user
