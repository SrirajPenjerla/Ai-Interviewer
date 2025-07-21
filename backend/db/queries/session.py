import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Get the backend directory path
BACKEND_DIR = Path(__file__).parent.parent.parent

# Try to get DATABASE_URL from environment, fallback to SQLite in backend directory
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    f"sqlite+aiosqlite:///{BACKEND_DIR}/ai_interviewer.db"
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    # For SQLite, we need to enable foreign keys
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close() 