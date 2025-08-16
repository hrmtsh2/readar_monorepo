from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
import csv
import json
from datetime import datetime
from io import StringIO
import openpyxl

from database import get_db
from models import Book, User, BookStatus
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class BookCreate(BaseModel):
    isbn: str = None
    title: str
    author: str
    genre: str = None
    description: str = None
    price: float
    stock: int = 1
    status: BookStatus = BookStatus.IN_STOCK
    is_for_sale: bool = True
    is_for_rent: bool = False
    rental_price_per_day: float = None
    condition: str = None

class BookResponse(BaseModel):
    id: int
    isbn: str = None
    title: str
    author: str
    genre: str = None
    description: str = None
    price: float
    stock: int
    status: BookStatus
    is_for_sale: bool
    is_for_rent: bool
    rental_price_per_day: float = None
    condition: str = None
    owner_id: int

class BookUpdate(BaseModel):
    isbn: str = None
    title: str = None
    author: str = None
    genre: str = None
    description: str = None
    price: float = None
    stock: int = None
    status: BookStatus = None
    is_for_sale: bool = None
    is_for_rent: bool = None
    rental_price_per_day: float = None
    condition: str = None

@router.post("/", response_model=BookResponse)
async def create_book(
    book: BookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type not in ["seller", "lender"]:
        raise HTTPException(status_code=403, detail="only sellers and lenders can add books")
    
    db_book = Book(**book.dict(), owner_id=current_user.id)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@router.get("/", response_model=List[BookResponse])
async def search_books(
    q: str = None,
    author: str = None,
    genre: str = None,
    min_price: float = None,
    max_price: float = None,
    city: str = None,
    for_sale: bool = None,
    for_rent: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Book).join(User)
    
    if q:
        query = query.filter(
            or_(
                Book.title.ilike(f"%{q}%"),
                Book.author.ilike(f"%{q}%"),
                Book.description.ilike(f"%{q}%")
            )
        )
    
    if author:
        query = query.filter(Book.author.ilike(f"%{author}%"))
    
    if genre:
        query = query.filter(Book.genre.ilike(f"%{genre}%"))
    
    if min_price is not None:
        query = query.filter(Book.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Book.price <= max_price)
    
    if city:
        query = query.filter(User.city.ilike(f"%{city}%"))
    
    if for_sale is not None:
        query = query.filter(Book.is_for_sale == for_sale)
    
    if for_rent is not None:
        query = query.filter(Book.is_for_rent == for_rent)
    
    books = query.offset(skip).limit(limit).all()
    return books

@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="book not found")
    return book

@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: int,
    book_update: BookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="book not found")
    
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="not authorized to update this book")
    
    update_data = book_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(book, field, value)
    
    db.commit()
    db.refresh(book)
    return book

@router.delete("/{book_id}")
async def delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="book not found")
    
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="not authorized to delete this book")
    
    db.delete(book)
    db.commit()
    return {"message": "book deleted"}

@router.post("/import")
async def import_books(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type not in ["seller", "lender"]:
        raise HTTPException(status_code=403, detail="only sellers and lenders can import books")
    
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="only csv and xlsx files supported")
    
    try:
        books_created = 0
        
        if file.filename.endswith('.csv'):
            # handle csv files
            content = await file.read()
            csv_content = content.decode('utf-8')
            csv_reader = csv.DictReader(StringIO(csv_content))
            
            required_columns = ['title', 'author', 'price']
            headers = csv_reader.fieldnames
            if not all(col in headers for col in required_columns):
                raise HTTPException(
                    status_code=400, 
                    detail=f"missing required columns: {required_columns}"
                )
            
            for row in csv_reader:
                book_data = {
                    'title': row['title'],
                    'author': row['author'],
                    'price': float(row['price']),
                    'owner_id': current_user.id
                }
                
                # optional fields
                if 'isbn' in row and row['isbn']:
                    book_data['isbn'] = str(row['isbn'])
                if 'genre' in row and row['genre']:
                    book_data['genre'] = row['genre']
                if 'description' in row and row['description']:
                    book_data['description'] = row['description']
                if 'stock' in row and row['stock']:
                    book_data['stock'] = int(row['stock'])
                if 'condition' in row and row['condition']:
                    book_data['condition'] = row['condition']
                
                db_book = Book(**book_data)
                db.add(db_book)
                books_created += 1
        
        else:
            # handle xlsx files
            content = await file.read()
            wb = openpyxl.load_workbook(filename=content, read_only=True)
            ws = wb.active
            
            # get headers from first row
            headers = [cell.value for cell in ws[1]]
            required_columns = ['title', 'author', 'price']
            
            if not all(col in headers for col in required_columns):
                raise HTTPException(
                    status_code=400, 
                    detail=f"missing required columns: {required_columns}"
                )
            
            # create column index mapping
            col_indices = {header: idx for idx, header in enumerate(headers)}
            
            for row in ws.iter_rows(min_row=2, values_only=True):
                if not row[col_indices['title']]:  # skip empty rows
                    continue
                    
                book_data = {
                    'title': row[col_indices['title']],
                    'author': row[col_indices['author']],
                    'price': float(row[col_indices['price']]),
                    'owner_id': current_user.id
                }
                
                # optional fields
                if 'isbn' in col_indices and row[col_indices['isbn']]:
                    book_data['isbn'] = str(row[col_indices['isbn']])
                if 'genre' in col_indices and row[col_indices['genre']]:
                    book_data['genre'] = row[col_indices['genre']]
                if 'description' in col_indices and row[col_indices['description']]:
                    book_data['description'] = row[col_indices['description']]
                if 'stock' in col_indices and row[col_indices['stock']]:
                    book_data['stock'] = int(row[col_indices['stock']])
                if 'condition' in col_indices and row[col_indices['condition']]:
                    book_data['condition'] = row[col_indices['condition']]
                
                db_book = Book(**book_data)
                db.add(db_book)
                books_created += 1
        
        db.commit()
        return {"message": f"imported {books_created} books successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"import failed: {str(e)}")

@router.get("/my/books", response_model=List[BookResponse])
async def get_my_books(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    books = db.query(Book).filter(Book.owner_id == current_user.id).all()
    return books
