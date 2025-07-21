# AI Interviewer App (Mercor-style)

A full-stack AI-powered interviewer platform with resume ingestion, live AI interviews (voice/text), real-time feedback, and PDF reporting.

## Features
- Resume/LinkedIn upload and parsing
- AI-driven, adaptive interview (text/voice)
- Real-time transcription, scoring, and notes
- PDF feedback report with scores and recommendations
- Modern, professional UI (Next.js + MUI)
- **NEW**: Persistent PostgreSQL database
- **NEW**: Real-time voice chat with WebRTC
- **NEW**: Advanced AI with GPT-4

## Tech Stack
- **Frontend:** Next.js, React, MUI, WebRTC, Socket.io
- **Backend:** FastAPI, LangChain, OpenAI, Whisper, PostgreSQL, Pinecone/Chroma
- **Database:** PostgreSQL with async SQLAlchemy
- **Voice:** WebRTC, WebSocket, OpenAI TTS/Whisper

## Prerequisites
- Node.js and npm
- Python 3.8+
- PostgreSQL database
- OpenAI API key

## Getting Started

### 1. Database Setup
```sh
# Install PostgreSQL and create database
createdb ai_interviewer

# Set environment variable (Windows)
set DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_interviewer

# Or on Linux/Mac
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_interviewer
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_interviewer
```

### 3. Backend Setup
```sh
# Install dependencies
pip install -r requirements.txt

# Create database tables
python backend/db/migrations/create_tables.py

# Start the backend server
cd backend
uvicorn api.main:app --reload
```

### 4. Frontend Setup
```sh
cd frontend
npm install
npm run dev
```

## Usage

1. **Upload Resume**: Go to `/upload` and upload a PDF resume or provide LinkedIn URL
2. **Start Interview**: Click "Start Interview" to begin the AI interview
3. **Voice Mode**: Toggle voice mode for real-time voice chat
4. **View Report**: Download the PDF report after completing the interview

## API Endpoints

- `POST /resume/upload` - Upload and parse resume
- `POST /interview/start` - Start interview session
- `POST /interview/next` - Submit answer, get next question
- `GET /report/{interview_id}` - Download PDF report
- `WS /ws/{interview_id}` - WebSocket for voice chat

## Project Structure
```
frontend/   # Next.js app
backend/    # FastAPI app
├── api/    # API endpoints
├── services/ # AI services
└── db/     # Database models
ai/         # Prompts & chains
```

## Pages
- `/upload` – Resume/LinkedIn upload
- `/interview` – Live AI interview (chat/voice)
- `/report` – PDF feedback report

---
MIT License 