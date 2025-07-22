from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .resume import router as resume_router
from .interview import router as interview_router
from .report import router as report_router
from .websocket import router as websocket_router


# -- Database Imports --
from sqlalchemy.ext.asyncio import create_async_engine
from .db.models.models import Base
from .db.queries.session import DATABASE_URL


# -- 1. Define the function to create tables --
async def create_db_tables():
    """This async function creates the database tables."""
    print("Checking and creating database tables...")
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("Tables are ready.")


# -- 2. Run the function right here, one time --
# This is the simplest way to execute your async code on startup.
asyncio.run(create_db_tables())

app = FastAPI()

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "AI Interviewer Backend Running"}

app.include_router(resume_router)
app.include_router(interview_router)
app.include_router(report_router)
app.include_router(websocket_router) 
