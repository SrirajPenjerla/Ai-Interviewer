from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .resume import router as resume_router
from .interview import router as interview_router
from .report import router as report_router
from .websocket import router as websocket_router

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