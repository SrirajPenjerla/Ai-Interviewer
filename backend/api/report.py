from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.queries.session import get_db
from db.models.models import Interview, Answer, Candidate
from services import transcript_summarizer, pdf_reporter, scoring_engine
import os
import json

router = APIRouter(prefix="/report", tags=["Report"])

@router.get("/{interview_id}")
async def get_report(
    interview_id: int,
    db: AsyncSession = Depends(get_db)
):
    interview = await db.get(Interview, interview_id)
    if not interview:
        return JSONResponse({"error": "Interview not found"}, status_code=404)
    
    # Get candidate info
    candidate = await db.get(Candidate, interview.candidate_id)
    
    # Get all answers for this interview
    result = await db.execute(
        select(Answer).where(Answer.interview_id == interview_id)
    )
    answers = result.scalars().all()
    
    if not answers:
        return JSONResponse({"error": "No answers found for this interview"}, status_code=404)
    
    # Prepare answers data for enhanced report
    answers_data = []
    total_score = 0
    
    for ans in answers:
        answers_data.append({
            "question": ans.question,
            "answer": ans.answer,
            "score": ans.score,
            "feedback": ans.feedback
        })
        total_score += ans.score
    
    avg_score = total_score / len(answers_data)
    
    # Generate enhanced overall feedback using Gemini AI
    overall_feedback = scoring_engine.generate_overall_feedback(answers_data)
    
    # Create comprehensive report data
    report_data = {
        "interview_id": interview_id,
        "candidate_name": candidate.name if candidate else "Unknown",
        "role": interview.role,
        "total_score": total_score,
        "average_score": round(avg_score, 1),
        "answers": answers_data,
        "overall_feedback": overall_feedback["overall_feedback"],
        "strengths": overall_feedback["strengths"],
        "areas_for_improvement": overall_feedback.get("critical_weaknesses", []),
        "recommendations": overall_feedback["recommendations"],
        "potential": overall_feedback.get("potential", "medium"),
        "next_steps": overall_feedback.get("next_steps", []),
        "category_analysis": overall_feedback.get("category_analysis", {}),
        "critical_weaknesses": overall_feedback.get("critical_weaknesses", []),
        "hiring_recommendation": overall_feedback.get("hiring_recommendation", "consider")
    }
    
    # Generate PDF with enhanced data
    pdf_path = pdf_reporter.generate_enhanced_pdf_report(report_data)
    
    return FileResponse(
        pdf_path, 
        filename=f"interview_report_{interview_id}.pdf", 
        media_type="application/pdf"
    )

@router.get("/{interview_id}/data")
async def get_report_data(
    interview_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get report data as JSON for frontend display"""
    interview = await db.get(Interview, interview_id)
    if not interview:
        return JSONResponse({"error": "Interview not found"}, status_code=404)
    
    # Get candidate info
    candidate = await db.get(Candidate, interview.candidate_id)
    
    # Get all answers for this interview
    result = await db.execute(
        select(Answer).where(Answer.interview_id == interview_id)
    )
    answers = result.scalars().all()
    
    if not answers:
        return JSONResponse({"error": "No answers found for this interview"}, status_code=404)
    
    # Prepare answers data
    answers_data = []
    total_score = 0
    
    for ans in answers:
        answers_data.append({
            "question": ans.question,
            "answer": ans.answer,
            "score": ans.score,
            "feedback": ans.feedback
        })
        total_score += ans.score
    
    avg_score = total_score / len(answers_data)
    
    # Generate enhanced overall feedback using Gemini AI
    overall_feedback = scoring_engine.generate_overall_feedback(answers_data)
    
    # Return comprehensive report data
    return JSONResponse({
        "interview_id": interview_id,
        "candidate_name": candidate.name if candidate else "Unknown",
        "role": interview.role,
        "total_score": total_score,
        "average_score": round(avg_score, 1),
        "answers": answers_data,
        "overall_feedback": overall_feedback["overall_feedback"],
        "strengths": overall_feedback["strengths"],
        "areas_for_improvement": overall_feedback.get("critical_weaknesses", []),
        "recommendations": overall_feedback["recommendations"],
        "potential": overall_feedback.get("potential", "medium"),
        "next_steps": overall_feedback.get("next_steps", []),
        "category_analysis": overall_feedback.get("category_analysis", {}),
        "critical_weaknesses": overall_feedback.get("critical_weaknesses", []),
        "hiring_recommendation": overall_feedback.get("hiring_recommendation", "consider")
    }) 