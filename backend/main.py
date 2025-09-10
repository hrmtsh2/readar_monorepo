from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Optional, List
import uvicorn
import os
from dotenv import load_dotenv

from database import get_db
from models import Book, User
from routers import auth, users, auctions, reservations, charity, reading_data, books

load_dotenv()

# tables created via Alembic migrations, no need for Base.metadata.create_all()

app = FastAPI(title="readar", version="1.0.0")

# security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.readar.com"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.readar.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(books.router, prefix="/api/books", tags=["books"])
# Temporarily commented out until we fix async issues
# app.include_router(auctions.router, prefix="/api/auctions", tags=["auctions"])
# app.include_router(reservations.router, prefix="/api/reservations", tags=["reservations"])
# app.include_router(reading_data.router, prefix="/api/reading", tags=["reading"])
app.include_router(charity.router, prefix="/api/charity", tags=["charity"])

@app.get("/")
async def root():
    return {"message": "readar api"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/books")
async def search_books(
    q: Optional[str] = Query(None, description="Search query for books"),
    city: Optional[str] = Query(None, description="Filter by city"),
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    for_sale: Optional[bool] = Query(None, description="Filter for books for sale"),
    for_rent: Optional[bool] = Query(None, description="Filter for books for rent"),
    db: AsyncSession = Depends(get_db)
):
    """Search books with various filters"""
    try:
        # build the base query
        query = select(Book, User).join(User, Book.owner_id == User.id)
        
        conditions = []
        
        # text search across search_text field
        if q:
            search_term = f"%{q.lower()}%"
            conditions.append(Book.search_text.ilike(search_term))
        if city:
            conditions.append(User.city.ilike(f"%{city}%"))
        if min_price is not None:
            conditions.append(Book.price >= min_price)
        if max_price is not None:
            conditions.append(Book.price <= max_price)
        
        # availability filters
        if for_sale is not None:
            conditions.append(Book.is_for_sale == for_sale)
        if for_rent is not None:
            conditions.append(Book.is_for_rent == for_rent)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        result = await db.execute(query)
        books_with_users = result.all()
        
        # format response
        books_data = []
        for book, user in books_with_users:
            books_data.append({
                "id": book.id,
                "title": book.title,
                "search_text": book.search_text,
                "description": book.description,
                "condition": book.condition if book.condition else "good",
                "price": book.price,
                "owner": {
                    "id": user.id,
                    "name": f"{user.first_name} {user.last_name}",
                    "city": user.city,
                    "email": user.email
                },
                "created_at": book.created_at.isoformat() if book.created_at else None,
                "status": book.status if book.status else "in_stock",
                "is_for_sale": book.is_for_sale,
                "is_for_rent": book.is_for_rent,
                "rental_price_per_day": book.rental_price_per_day,
                "owner_id": book.owner_id
            })
        
        return books_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
