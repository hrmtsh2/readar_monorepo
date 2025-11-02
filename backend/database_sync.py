from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./readar.db")

# Convert to sync database URL for alembic
if DATABASE_URL.startswith("sqlite+aiosqlite"):
    DATABASE_URL = DATABASE_URL.replace("sqlite+aiosqlite://", "sqlite://")
elif DATABASE_URL.startswith("postgresql+asyncpg"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

# Create sync engine for migrations
sync_engine = create_engine(DATABASE_URL, echo=False)

# Create sync session for migrations
SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)