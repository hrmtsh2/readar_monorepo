"""
Synchronous database configuration for Alembic migrations.
This is separate from the main async database configuration.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./readar.db")

# Convert async URLs to sync for Alembic
if DATABASE_URL.startswith("sqlite+aiosqlite://"):
    DATABASE_URL = DATABASE_URL.replace("sqlite+aiosqlite://", "sqlite:///")
elif DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

# Create synchronous engine for migrations
if DATABASE_URL.startswith("sqlite"):
    sync_engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    sync_engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
