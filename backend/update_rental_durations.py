"""
Script to randomly assign rental_duration (1, 2, or 3 weeks) to existing books that are available for rent.
Run this once to populate the rental_duration field for existing data.
"""
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Book

# Database URL - adjust if needed
DATABASE_URL = "sqlite:///./readar.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def update_rental_durations():
    db = SessionLocal()
    try:
        # Find all books that are available for rent
        rental_books = db.query(Book).filter(Book.is_for_rent == True).all()
        
        print(f"Found {len(rental_books)} books available for rent")
        
        updated_count = 0
        for book in rental_books:
            # Randomly assign 1, 2, or 3 weeks
            book.rental_duration = random.randint(1, 3)
            updated_count += 1
            print(f"Book ID {book.id} '{book.title}' - assigned {book.rental_duration} weeks")
        
        db.commit()
        print(f"\n✓ Successfully updated {updated_count} books with random rental durations")
        
    except Exception as e:
        print(f"Error updating rental durations: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting rental duration update...\n")
    update_rental_durations()
