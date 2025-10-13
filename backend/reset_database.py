#!/usr/bin/env python3
"""
Complete database reset script - creates fresh database with correct enum values
"""

import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from passlib.context import CryptContext

# Import all models to ensure they're registered
from models import Base, User, Book, BookStatus, Reservation, Payment, ReservationStatus, PaymentStatus
from database import DATABASE_URL

# Password hashing context (same as auth.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_database():
    """Completely reset the database and create fresh tables"""
    
    # Remove existing database file if it exists
    db_file = "readar.db"
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f"Removed existing database: {db_file}")
    
    # Create new engine and session
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    try:
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Created fresh database tables")
        
        # Create some test data
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            
            # Create test users
            users_data = [
                {
                    "first_name": "Alice",
                    "last_name": "Smith", 
                    "email": "alice@test.com",
                    "username": "alice_smith",
                    "password": "password123",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "phone": "+91-9876543210"
                },
                {
                    "first_name": "Bob", 
                    "last_name": "Jones",
                    "email": "bob@test.com",
                    "username": "bob_jones", 
                    "password": "password123",
                    "city": "Mumbai",
                    "state": "Maharashtra", 
                    "phone": "+91-9876543211"
                },
                {
                    "first_name": "Carol",
                    "last_name": "Davis",
                    "email": "carol@test.com",
                    "username": "carol_davis",
                    "password": "password123", 
                    "city": "Delhi",
                    "state": "Delhi",
                    "phone": "+91-9876543212"
                }
            ]
            
            created_users = []
            for user_data in users_data:
                # Use bcrypt hashing (same as auth system)
                hashed_password = pwd_context.hash(user_data["password"])
                
                user = User(
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"], 
                    email=user_data["email"],
                    username=user_data["email"].split("@")[0],  # Use email prefix as username
                    hashed_password=hashed_password,
                    city=user_data["city"],
                    state=user_data["state"],
                    phone=user_data["phone"],
                    is_active=True,
                    is_verified=True
                )
                session.add(user)
                created_users.append(user)
            
            await session.flush()  # Get user IDs
            
            # Create test books
            books_data = [
                {
                    "title": "The God of Small Things",
                    "author": "Arundhati Roy",
                    "description": "Beautiful condition, hardly used",
                    "tags": "fiction, indian-literature, booker-prize",
                    "price": 400.0,
                    "owner": created_users[0],  # Alice
                    "status": BookStatus.IN_STOCK
                },
                {
                    "title": "Midnight's Children", 
                    "author": "Salman Rushdie",
                    "description": "Good condition paperback",
                    "tags": "fiction, magical-realism, india",
                    "price": 350.0,
                    "owner": created_users[0],  # Alice
                    "status": BookStatus.IN_STOCK
                },
                {
                    "title": "The White Tiger",
                    "author": "Aravind Adiga", 
                    "description": "Excellent condition",
                    "tags": "fiction, contemporary, booker-prize",
                    "price": 300.0,
                    "owner": created_users[2],  # Carol
                    "status": BookStatus.IN_STOCK
                },
                {
                    "title": "Shantaram",
                    "author": "Gregory David Roberts",
                    "description": "Well-read but good condition", 
                    "tags": "fiction, adventure, mumbai",
                    "price": 450.0,
                    "owner": created_users[1],  # Bob
                    "status": BookStatus.IN_STOCK
                }
            ]
            
            for book_data in books_data:
                search_text = f"{book_data['title']} {book_data['author']} {book_data['tags']} {book_data['description']}".strip()
                
                book = Book(
                    title=book_data["title"],
                    author=book_data["author"], 
                    description=book_data["description"],
                    tags=book_data["tags"],
                    search_text=search_text,
                    price=book_data["price"],
                    owner_id=book_data["owner"].id,
                    status=book_data["status"],
                    stock=1,
                    is_for_sale=True,
                    is_for_rent=False
                )
                session.add(book)
            
            await session.commit()
            
            print("✅ Created test users:")
            for user in created_users:
                print(f"   - {user.first_name} {user.last_name} ({user.email})")
            
            print("✅ Created test books:")
            for book_data in books_data: 
                print(f"   - {book_data['title']} by {book_data['author']} - ₹{book_data['price']}")
                
            print("\n🎉 Database reset complete!")
            print("You can now:")
            print("1. Start the backend server: python main.py")
            print("2. Go to http://localhost:3000")
            print("3. Login with: alice@test.com / password123")
            print("4. Try the search page - you should see books!")
            
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    print("🔄 Resetting database...")
    asyncio.run(reset_database())