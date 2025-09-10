# script to populate the database with synthetic book data
# run this after setting up the database with python populate_data.py

import sys
import os
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import AsyncSessionLocal
from models import User, Book, UserType, BookStatus, Transaction

# sample books data (ai-generated)
SAMPLE_BOOKS = [
    {
        "title": "The God of Small Things",
        "search_text": "The God of Small Things Arundhati Roy Fiction Literary Contemporary Indian Literature",
        "isbn": "9780006550686",
        "description": "A beautiful story of love, loss, and family secrets in Kerala.",
        "price": 350.0,
        "condition": "Good"
    },
    {
        "title": "Midnight's Children",
        "search_text": "Midnight's Children Salman Rushdie Fiction Magical Realism Indian Literature",
        "isbn": "9780099578512",
        "description": "Epic tale of independence and partition through magical realism.",
        "price": 450.0,
        "condition": "Very Good"
    },
    {
        "title": "The White Tiger",
        "search_text": "The White Tiger Aravind Adiga Fiction Social Commentary Modern India",
        "isbn": "9781416562603",
        "description": "Dark comedy about class and corruption in modern India.",
        "price": 320.0,
        "condition": "New"
    },
    {
        "title": "A Suitable Boy",
        "search_text": "A Suitable Boy Vikram Seth Fiction Romance Epic Indian Family Saga",
        "isbn": "9780060926564",
        "description": "Sweeping novel of love and politics in 1950s India.",
        "price": 600.0,
        "condition": "Good"
    },
    {
        "title": "The Mahabharata: A Modern Rendering",
        "search_text": "The Mahabharata Modern Rendering Ramesh Menon Mythology Epic Ancient Indian Literature",
        "isbn": "9780595264438",
        "description": "Modern retelling of the ancient Indian epic.",
        "price": 550.0,
        "condition": "Very Good"
    },
    {
        "title": "Harry Potter and the Philosopher's Stone",
        "search_text": "Harry Potter Philosopher's Stone J.K. Rowling Fantasy Young Adult Magic Adventure",
        "isbn": "9780747532699",
        "description": "The boy who lived begins his magical journey.",
        "price": 400.0,
        "condition": "Good"
    },
    {
        "title": "To Kill a Mockingbird",
        "search_text": "To Kill a Mockingbird Harper Lee Fiction Classic American Literature Social Issues",
        "isbn": "9780061120084",
        "description": "Classic tale of racial injustice and moral growth.",
        "price": 380.0,
        "condition": "Very Good"
    },
    {
        "title": "1984",
        "search_text": "1984 George Orwell Dystopian Fiction Science Fiction Political Thriller",
        "isbn": "9780451524935",
        "description": "Chilling vision of totalitarian future.",
        "price": 300.0,
        "condition": "Good"
    },
    {
        "title": "The Kite Runner",
        "search_text": "The Kite Runner Khaled Hosseini Fiction Drama Afghanistan Friendship Redemption",
        "isbn": "9781594631931",
        "description": "Powerful story of friendship and redemption in Afghanistan.",
        "price": 350.0,
        "condition": "Very Good"
    },
    {
        "title": "Life of Pi",
        "search_text": "Life of Pi Yann Martel Adventure Fiction Survival Philosophy Spirituality",
        "isbn": "9780156027328",
        "description": "Extraordinary tale of survival at sea.",
        "price": 330.0,
        "condition": "New"
    },
    {
        "title": "The Alchemist",
        "search_text": "The Alchemist Paulo Coelho Fiction Philosophical Adventure Inspirational Self-Discovery",
        "isbn": "9780061122415",
        "description": "Journey of self-discovery and following dreams.",
        "price": 250.0,
        "condition": "Good"
    },
    {
        "title": "Sapiens: A Brief History of Humankind",
        "search_text": "Sapiens Brief History Humankind Yuval Noah Harari Non-Fiction History Anthropology Science",
        "isbn": "9780062316097",
        "description": "Fascinating exploration of human evolution and society.",
        "price": 500.0,
        "condition": "New"
    },
    {
        "title": "The Lean Startup",
        "search_text": "The Lean Startup Eric Ries Business Entrepreneurship Innovation Management Startup",
        "isbn": "9780307887894",
        "description": "Revolutionary approach to building successful businesses.",
        "price": 450.0,
        "condition": "Very Good"
    },
    {
        "title": "Thinking, Fast and Slow",
        "search_text": "Thinking Fast and Slow Daniel Kahneman Psychology Behavioral Economics Decision Making",
        "isbn": "9780374533557",
        "description": "Groundbreaking exploration of how we think and make decisions.",
        "price": 480.0,
        "condition": "Good"
    },
    {
        "title": "The Immortals of Meluha",
        "search_text": "The Immortals of Meluha Amish Tripathi Fiction Mythology Shiva Trilogy Indian Fantasy",
        "isbn": "9789380658742",
        "description": "First book in the Shiva Trilogy reimagining Indian mythology.",
        "price": 280.0,
        "condition": "Good"
    },
    {
        "title": "The Palace of Illusions",
        "search_text": "The Palace of Illusions Chitra Banerjee Divakaruni Fiction Mythology Draupadi Mahabharata Retelling",
        "isbn": "9780307416940",
        "description": "Mahabharata retold from Draupadi's perspective.",
        "price": 320.0,
        "condition": "Very Good"
    },
    {
        "title": "Shantaram",
        "search_text": "Shantaram Gregory David Roberts Fiction Adventure Crime Mumbai India Autobiography",
        "isbn": "9780312330521",
        "description": "Epic adventure through the slums and underworld of Bombay.",
        "price": 420.0,
        "condition": "Good"
    },
    {
        "title": "The Rozabal Line",
        "search_text": "The Rozabal Line Ashwin Sanghi Fiction Thriller Historical Kashmir Jesus Mystery",
        "isbn": "9789380658308",
        "description": "Historical thriller about Jesus and Kashmir.",
        "price": 350.0,
        "condition": "Very Good"
    },
    {
        "title": "The Girl with the Dragon Tattoo",
        "search_text": "The Girl with the Dragon Tattoo Stieg Larsson Crime Thriller Mystery Nordic Noir",
        "isbn": "9780307454546",
        "description": "Dark Swedish crime thriller with unforgettable characters.",
        "price": 380.0,
        "condition": "Good"
    },
    {
        "title": "The Hitchhiker's Guide to the Galaxy",
        "search_text": "Hitchhiker's Guide Galaxy Douglas Adams Science Fiction Comedy Humor Space Adventure",
        "isbn": "9780345391803",
        "description": "Hilarious space adventure with answer to life, universe, everything.",
        "price": 300.0,
        "condition": "Very Good"
    },
    {
        "title": "Dune",
        "search_text": "Dune Frank Herbert Science Fiction Space Opera Politics Ecology Desert Planet",
        "isbn": "9780441172719",
        "description": "Epic space opera on the desert planet Arrakis.",
        "price": 450.0,
        "condition": "New"
    },
    {
        "title": "The Namesake",
        "search_text": "The Namesake Jhumpa Lahiri Fiction Literary Immigration Identity Bengali American Culture",
        "isbn": "9780618485222",
        "description": "Beautiful story of identity and belonging.",
        "price": 340.0,
        "condition": "Good"
    },
    {
        "title": "The Guide",
        "search_text": "The Guide R.K. Narayan Fiction Classic Indian Literature Malgudi Small Town",
        "isbn": "9780226568607",
        "description": "Classic tale of transformation in fictional Malgudi.",
        "price": 280.0,
        "condition": "Very Good"
    }
]

# sample users data (ai-generated)
SAMPLE_USERS = [
    {
        "email": "reader1@delhi.com",
        "username": "delhireader1",
        "first_name": "Priya",
        "last_name": "Sharma",
        "city": "New Delhi",
        "state": "Delhi"
    },
    {
        "email": "reader2@delhi.com", 
        "username": "delhireader2",
        "first_name": "Arjun",
        "last_name": "Kumar",
        "city": "New Delhi", 
        "state": "Delhi"
    },
    {
        "email": "reader3@mumbai.com",
        "username": "mumbaireader1", 
        "first_name": "Sneha",
        "last_name": "Patel",
        "city": "Mumbai",
        "state": "Maharashtra"
    },
    {
        "email": "reader4@bangalore.com",
        "username": "blrreader1",
        "first_name": "Rahul", 
        "last_name": "Reddy",
        "city": "Bangalore",
        "state": "Karnataka"
    },
    {
        "email": "reader5@chennai.com",
        "username": "chennaireader1",
        "first_name": "Lakshmi",
        "last_name": "Iyer", 
        "city": "Chennai",
        "state": "Tamil Nadu"
    },
    {
        "email": "reader6@pune.com",
        "username": "punereader1",
        "first_name": "Aditya",
        "last_name": "Joshi",
        "city": "Pune", 
        "state": "Maharashtra"
    }
]

async def create_sample_data():
    async with AsyncSessionLocal() as db:
        try:
            # create sample users
            users = []
            for user_data in SAMPLE_USERS:
                # check if user already exists
                result = await db.execute(select(User).filter(User.email == user_data["email"]))
                existing_user = result.scalar_one_or_none()
                
                if not existing_user:
                    user = User(
                        email=user_data["email"],
                        username=user_data["username"],
                        hashed_password="$2b$12$dummy_hash_for_demo_users_only",  # demo password
                        user_type=UserType.BUYER,  # default to BUYER type
                        first_name=user_data["first_name"],
                        last_name=user_data["last_name"],
                        phone="+91" + str(9000000000 + len(users)),
                        address=f"{len(users) + 1}, Sample Street",
                        city=user_data["city"],
                        state=user_data["state"],
                        zip_code="110001" if user_data["city"] == "New Delhi" else "400001"
                    )
                    db.add(user)
                    users.append(user)
                else:
                    users.append(existing_user)
            
            await db.commit()
            print(f"Created {len([u for u in users if hasattr(u, 'id') or not u.id])} new users")
            
            # refresh users to get IDs
            for user in users:
                if hasattr(user, 'id') and user.id is None:
                    await db.refresh(user)
            
            # create sample books distributed among users
            books_created = 0
            created_books = []
            for i, book_data in enumerate(SAMPLE_BOOKS):
                # check if book already exists by title
                result = await db.execute(select(Book).filter(Book.title == book_data["title"]))
                existing_book = result.scalar_one_or_none()
                
                if not existing_book:
                    # assign books to different users (cycle through them)
                    owner = users[i % len(users)]
                    
                    book = Book(
                        title=book_data["title"],
                        search_text=book_data["search_text"],
                        isbn=book_data["isbn"],
                        description=book_data["description"],
                        price=book_data["price"],
                        owner_id=owner.id,
                        condition=book_data["condition"],
                        status=BookStatus.IN_STOCK,
                        is_for_sale=True,
                        is_for_rent=bool(i % 3),  # some books for rent
                        rental_price_per_day=book_data["price"] * 0.1 if i % 3 else None
                    )
                    db.add(book)
                    created_books.append(book)
                    books_created += 1
            
            await db.commit()
            print(f"Created {books_created} new books")
            
            # refresh books to get IDs
            for book in created_books:
                await db.refresh(book)
            
            # create sample transactions (sales history)
            print("Creating sample transactions...")
            transactions_created = 0
            
            # get all sellers and buyers
            sellers = [u for u in users if u.user_type in [UserType.SELLER, UserType.LENDER]]
            buyers = [u for u in users if u.user_type == UserType.BUYER]
            
            if sellers and buyers and created_books:
                # create some transactions for the first few books
                books_to_sell = created_books[:min(10, len(created_books))]  # first 10 books
                
                for i, book in enumerate(books_to_sell):
                    if i < len(buyers):  # ensure we have a buyer
                        transaction = Transaction(
                            book_id=book.id,
                            seller_id=book.owner_id,
                            buyer_id=buyers[i % len(buyers)].id,
                            price=book.price * 0.9,  # sold at 10% discount
                            transaction_type="sale",
                            status="completed",
                            created_at=datetime.now() - timedelta(days=i*3)  # spread over time
                        )
                        db.add(transaction)
                        transactions_created += 1
                        
                        # update book status to sold
                        book.status = BookStatus.SOLD
                        book.stock = 0
            
            await db.commit()
            print(f"Created {transactions_created} sample transactions")
            
            # log summary
            print("\n=== DATA POPULATION COMPLETE ===")
            print(f"Users by city:")
            city_counts = {}
            for user in users:
                city = user.city
                city_counts[city] = city_counts.get(city, 0) + 1
            
            for city, count in city_counts.items():
                print(f"  {city}: {count} users")
            
            print(f"\nTotal books: {len(SAMPLE_BOOKS)}")
            print("Books distributed across all cities based on user locations")
            
        except Exception as e:
            await db.rollback()
            print(f"Error creating sample data: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(create_sample_data())
