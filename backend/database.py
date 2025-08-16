from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./readar.db")

# Configure async engine based on database type
if DATABASE_URL.startswith("sqlite"):
    # Convert to async SQLite
    if not DATABASE_URL.startswith("sqlite+aiosqlite"):
        DATABASE_URL = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
else:
    # Use asyncpg for PostgreSQL
    if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

# Async dependency to get database session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
