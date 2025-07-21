from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from db.queries.session import get_db
from db.models.models import Candidate, Interview, Answer
from services import question_generator, scoring_engine
from pydantic import BaseModel
import json

router = APIRouter(prefix="/interview", tags=["Interview"])

class StartInterviewRequest(BaseModel):
    candidate_id: int
    role: str = "Software Engineer"

class NextQuestionRequest(BaseModel):
    interview_id: int
    answer: str

@router.post("/start")
async def start_interview(
    request: StartInterviewRequest,
    db: AsyncSession = Depends(get_db)
):
    # Get candidate and their skills
    candidate = await db.get(Candidate, request.candidate_id)
    if not candidate:
        return JSONResponse({"error": "Candidate not found"}, status_code=404)
    
    skills = json.loads(candidate.skills) if candidate.skills else []
    
    # Generate questions
    questions = question_generator.generate_questions(skills, request.role)
    
    # Create interview in database
    interview = Interview(
        candidate_id=request.candidate_id,
        role=request.role
    )
    db.add(interview)
    await db.commit()
    await db.refresh(interview)
    
    return JSONResponse({
        "status": "started",
        "interview_id": interview.id,
        "question": questions[0] if questions else None
    })

@router.post("/next")
async def next_question(
    request: NextQuestionRequest,
    db: AsyncSession = Depends(get_db)
):
    interview = await db.get(Interview, request.interview_id)
    if not interview:
        return JSONResponse({"error": "Interview not found"}, status_code=404)
    
    # Get candidate for skills
    candidate = await db.get(Candidate, interview.candidate_id)
    skills = json.loads(candidate.skills) if candidate.skills else []
    questions = question_generator.generate_questions(skills, interview.role)
    
    # Get answers count properly
    answers_query = select(func.count(Answer.id)).where(Answer.interview_id == request.interview_id)
    result = await db.execute(answers_query)
    current_q_idx = result.scalar() or 0
    
    if current_q_idx < len(questions):
        question = questions[current_q_idx]
        score_data = scoring_engine.score_answer(question, request.answer)
        
        # Store answer in database
        db_answer = Answer(
            interview_id=request.interview_id,
            question=question,
            answer=request.answer,
            score=score_data['score'],
            feedback=score_data['feedback']
        )
        db.add(db_answer)
        await db.commit()
        
        # Check if interview is complete
        if current_q_idx + 1 >= len(questions):
            interview.completed_at = func.now()
            await db.commit()
            return JSONResponse({"message": "Interview complete", "score": score_data})
        else:
            return JSONResponse({
                "question": questions[current_q_idx + 1], 
                "score": score_data
            })
    else:
        return JSONResponse({"message": "Interview already complete"}) 