from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from db.queries.session import get_db
from db.models.models import Candidate
from services import resume_parser
import tempfile
import os
import json

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(None), 
    linkedin_url: str = Form(None),
    name: str = Form(None),
    email: str = Form(None),
    db: AsyncSession = Depends(get_db)
):
    if file:
        # Save uploaded PDF to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        result = resume_parser.parse_resume(pdf_path=tmp_path)
        os.remove(tmp_path)
    elif linkedin_url:
        result = resume_parser.parse_resume(linkedin_url=linkedin_url)
    else:
        return JSONResponse({"error": "No file or LinkedIn URL provided"}, status_code=400)
    
    # Store candidate in database
    candidate = Candidate(
        name=name,
        email=email,
        resume_text=result.get('text', ''),
        skills=json.dumps(result.get('skills', []))
    )
    db.add(candidate)
    await db.commit()
    await db.refresh(candidate)
    
    return JSONResponse({
        "candidate_id": candidate.id,
        "skills": result.get('skills', []),
        "text": result.get('text', '')[:500]  # Truncate for response
    }) 