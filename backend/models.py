from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

class UserType(enum.Enum):
    BUYER = "buyer"
    SELLER = "seller"
    LENDER = "lender"
    CHARITY = "charity"

class BookStatus(enum.Enum):
    IN_STOCK = "in_stock"
    EXPECTED = "expected"
    LENT = "lent"
    SOLD = "sold"

class AuctionStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ReservationStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    user_type = Column(Enum(UserType), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    books = relationship("Book", back_populates="owner")
    created_auctions = relationship("Auction", foreign_keys="Auction.creator_id", back_populates="creator")
    won_auctions = relationship("Auction", foreign_keys="Auction.winner_id", back_populates="winner")
    bids = relationship("Bid", back_populates="bidder")
    reservations = relationship("Reservation", back_populates="user")
    reading_data = relationship("ReadingData", back_populates="user")

class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String, index=True)
    title = Column(String, nullable=False, index=True)
    # combine search text including title, author, genre for easier searching
    search_text = Column(Text, nullable=False, index=True)  # "The Great Gatsby F. Scott Fitzgerald Fiction Classic..."
    description = Column(Text)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=1)
    status = Column(Enum(BookStatus), default=BookStatus.IN_STOCK)
    expected_date = Column(DateTime(timezone=True))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_for_sale = Column(Boolean, default=True)
    is_for_rent = Column(Boolean, default=False)
    rental_price_per_day = Column(Float)
    condition = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="books")
    auctions = relationship("Auction", back_populates="book")
    reservations = relationship("Reservation", back_populates="book")

class Auction(Base):
    __tablename__ = "auctions"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    starting_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    min_increment = Column(Float, default=1.0)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(AuctionStatus), default=AuctionStatus.ACTIVE)
    winner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    book = relationship("Book", back_populates="auctions")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_auctions")
    winner = relationship("User", foreign_keys=[winner_id], back_populates="won_auctions")
    bids = relationship("Bid", back_populates="auction")

class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    auction = relationship("Auction", back_populates="bids")
    bidder = relationship("User", back_populates="bids")

class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reservation_fee = Column(Float, nullable=False)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.PENDING)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # relationships
    book = relationship("Book", back_populates="reservations")
    user = relationship("User", back_populates="reservations")

class ReadingData(Base):
    __tablename__ = "reading_data"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_isbn = Column(String, nullable=False)
    book_title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    genre = Column(String)
    rating = Column(Integer)  # 1-5 scale
    review = Column(Text)
    date_read = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # relationships
    user = relationship("User", back_populates="reading_data")

class Charity(Base):
    __tablename__ = "charities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    email = Column(String, nullable=False)
    phone = Column(String)
    address = Column(Text)
    website = Column(String)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    price = Column(Float, nullable=False)
    transaction_type = Column(String, default="sale")  # sale, rent, etc.
    status = Column(String, default="completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # relationships
    book = relationship("Book")
    seller = relationship("User", foreign_keys=[seller_id])
    buyer = relationship("User", foreign_keys=[buyer_id])

class Donation(Base):
    __tablename__ = "donations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    charity_id = Column(Integer, ForeignKey("charities.id"), nullable=False)
    book_details = Column(Text)  # json string of book details
    pickup_address = Column(Text)
    pickup_date = Column(DateTime(timezone=True))
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
