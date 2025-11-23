#!/usr/bin/env python3
"""
Complete database reset script - creates fresh database with correct enum values
"""

import os
import asyncio
import random
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
            # Create three demo users: alice, bob, carol
            users_data = [
                {"first_name": "Alice", "last_name": "Example", "email": "alice@test.com", "password": "password123", "city": "Delhi", "state": "Delhi", "phone": "+91-9000000001"},
                {"first_name": "Bob",   "last_name": "Example", "email": "bob@test.com",   "password": "password123", "city": "Mumbai", "state": "Maharashtra", "phone": "+91-9000000002"},
                {"first_name": "Carol", "last_name": "Example", "email": "carol@test.com", "password": "password123", "city": "Bengaluru", "state": "Karnataka", "phone": "+91-9000000003"}
            ]

            created_users = []
            for user_data in users_data:
                hashed_password = pwd_context.hash(user_data["password"])
                user = User(
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    email=user_data["email"],
                    username=user_data["email"].split("@")[0],
                    hashed_password=hashed_password,
                    city=user_data.get("city"),
                    state=user_data.get("state"),
                    phone=user_data.get("phone"),
                    is_active=True,
                    is_verified=True
                )
                session.add(user)
                created_users.append(user)

            await session.flush()  # get ids

            # More varied synthesis: unique + shared titles, varying authors/tags/prices/stock, some rentables
            SHARED_TITLES = ["Common Stories", "Shared Tales", "Anthology Volume 1"]
            alice_unique = ["Alice's Adventures", "Riverwalk", "City of Dreams", "Notes from Home", "Sunlit Paths", "Local Flora", "Evening Sketches"]
            bob_unique = ["Bob's Journey", "Market Days", "Moonlight Run", "Trader's Tale", "Harbor Lights", "Tide and Time", "Midnight Memoirs"]
            carol_unique = ["Carol's Cookbook", "Garden Tales", "Silent Echoes", "Parallel Lives", "Crossroads", "Wandering Strings", "Letters Home"]

            SAMPLE_AUTHORS = [
                "R. K. Narayan", "Ruskin Bond", "Jhumpa Lahiri", "A. K. Singh", "Priya Kumar",
                "Anita Desai", "Chetan Bhagat", "Vikram Seth", "Amitav Ghosh", "N. K. Sharma"
            ]
            SAMPLE_TAGS = ["fiction", "non-fiction", "history", "biography", "science", "romance", "thriller", "fantasy", "mystery", "travel"]

            def make_titles(unique_list):
                # include the SHARED_TITLES (3) + 7 picks from the unique list or other lists to create overlaps
                titles = list(SHARED_TITLES)
                picks = random.sample(unique_list, k=min(7, len(unique_list)))
                titles.extend(picks)
                # introduce 0-2 extra overlaps by randomly borrowing from other users' unique pools
                if random.random() < 0.6:
                    # pick 1 extra from combined pool
                    other_pool = [x for x in (alice_unique + bob_unique + carol_unique) if x not in titles]
                    if other_pool:
                        extra = random.choice(other_pool)
                        titles[random.randint(3, len(titles)-1)] = extra
                return titles[:10]

            all_users_spec = [
                (created_users[0], make_titles(alice_unique)),
                (created_users[1], make_titles(bob_unique)),
                (created_users[2], make_titles(carol_unique)),
            ]

            created_books = []
            for owner, titles in all_users_spec:
                for idx, t in enumerate(titles, start=1):
                    price = round(random.uniform(80, 900), 2)
                    author = random.choice(SAMPLE_AUTHORS) if random.random() < 0.7 else f"{owner.first_name} {owner.last_name}"
                    tags = ", ".join(random.sample(SAMPLE_TAGS, k=2))
                    is_for_rent = random.random() < 0.25
                    weekly_fee = round(max(15.0, price * random.uniform(0.06, 0.18)), 2) if is_for_rent else None
                    stock = random.randint(1, 4)
                    isbn = f"ISBN-{owner.username[:3]}-{idx:03d}"
                    description = f"{t} — copy owned by {owner.first_name}. {random.choice(['Good condition.', 'Lightly used.', 'Like new.', 'Slightly worn'])}"

                    book = Book(
                        isbn=isbn,
                        title=t,
                        author=author,
                        description=description,
                        tags=tags,
                        search_text=f"{t} {author} {tags} {description}",
                        price=price,
                        owner_id=owner.id,
                        status=BookStatus.IN_STOCK,
                        stock=stock,
                        is_for_sale=not is_for_rent,
                        is_for_rent=is_for_rent,
                        weekly_fee=weekly_fee
                    )
                    session.add(book)
                    created_books.append(book)
            
            await session.commit()
            
            print("✅ Created test users:")
            for user in created_users:
                print(f"   - {user.first_name} {user.last_name} ({user.email})")
            
            print(f"✅ Created {len(created_books)} test books:")
            # print a short sample of created books
            for book in created_books[:10]:
                rent_info = f" (rent: ₹{book.weekly_fee}/week)" if book.is_for_rent and book.weekly_fee else ""
                print(f"   - {book.title} by {book.author} - ₹{book.price}{rent_info}")
            if len(created_books) > 10:
                print(f"   ... and {len(created_books)-10} more books created")
                
            print("\n🎉 Database reset complete!")
            print("You can now:")
            print("1. Start the backend server: python main.py")
            print("2. Go to http://localhost:3000")
            print("3. Login with one of the test users:")
            print("   - alice@test.com / password123")
            print("   - bob@test.com / password123")
            print("   - carol@test.com / password123")
            print("4. Try the search page - you should see books!")
            
    except Exception as e:
        print(f"Error resetting database: {e}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    print("🔄 Resetting database...")
    asyncio.run(reset_database())