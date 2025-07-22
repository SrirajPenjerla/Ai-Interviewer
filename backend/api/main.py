from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from .resume import router as resume_router
from .interview import router as interview_router
from .report import router as report_router
from .websocket import router as websocket_router

# -- Database Imports --
from sqlalchemy.ext.asyncio import create_async_engine
from db.models.models import Base
from db.queries.session import DATABASE_URL


# 1. Define the lifespan manager for the application
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    This function runs on application startup.
    It creates the database tables before the app starts listening for requests.
    """
    print("Application startup: creating database tables...")
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        # Use run_sync for the synchronous create_all method
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("Database tables are ready.")
    
    yield  # The application runs here
    
    # Code below yield runs on shutdown, if needed
    print("Application shutdown.")


# 2. Create the FastAPI app and pass it the lifespan manager
app = FastAPI(lifespan=lifespan)


# --- 3. ADD MIDDLEWARE AND ROUTES AS BEFORE ---

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

