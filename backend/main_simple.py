from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Optional, List
import uvicorn

from database import get_db
from models import Book, User

app = FastAPI(title="Readar", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Readar - Local Book Exchange Platform"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "readar-backend"}

@app.get("/api/books")
async def search_books(
    db: AsyncSession = Depends(get_db),
    q: Optional[str] = Query(None, description="Search query for title, author, genre"),
    city: Optional[str] = Query(None, description="Filter by city"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    for_sale: Optional[bool] = Query(None, description="Filter books for sale"),
    for_rent: Optional[bool] = Query(None, description="Filter books for rent"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return")
):
    """Search books with various filters"""
    try:
        # Start with base query joining Book and User (owner)
        query = select(Book).join(User, Book.owner_id == User.id)
        
        conditions = []
        
        # Search in search_text field (title, author, genre combined)
        if q:
            conditions.append(Book.search_text.ilike(f"%{q}%"))
        
        # Filter by city (from book owner)
        if city:
            conditions.append(User.city.ilike(f"%{city}%"))
        
        # Price filters
        if min_price is not None:
            conditions.append(Book.price >= min_price)
        if max_price is not None:
            conditions.append(Book.price <= max_price)
        
        # Availability filters
        if for_sale is True:
            conditions.append(Book.is_for_sale == True)
        if for_rent is True:
            conditions.append(Book.is_for_rent == True)
        
        # Apply all conditions
        if conditions:
            query = query.where(and_(*conditions))
        
        # Add pagination
        query = query.offset(skip).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        books = result.scalars().all()
        
        # Convert to dict format
        books_data = []
        for book in books:
            books_data.append({
                "id": book.id,
                "title": book.title,
                "search_text": book.search_text,
                "description": book.description,
                "price": book.price,
                "condition": book.condition,
                "status": book.status.value if book.status else "in_stock",
                "is_for_sale": book.is_for_sale,
                "is_for_rent": book.is_for_rent,
                "rental_price_per_day": book.rental_price_per_day,
                "owner_id": book.owner_id
            })
        
        return books_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
