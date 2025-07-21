import fitz  # PyMuPDF
import re
from typing import List, Dict

# Simple skill/keyword list for demo
SKILL_KEYWORDS = [
    'python', 'java', 'c++', 'machine learning', 'deep learning', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes',
    'project management', 'communication', 'leadership', 'data analysis', 'nlp', 'devops', 'cloud', 'api', 'typescript', 'javascript'
]

def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = "\n".join(page.get_text() for page in doc)
    return text

def extract_skills(text: str) -> List[str]:
    found = set()
    for skill in SKILL_KEYWORDS:
        if re.search(rf'\b{re.escape(skill)}\b', text, re.IGNORECASE):
            found.add(skill)
    return list(found)

def parse_resume(pdf_path: str = None, linkedin_url: str = None) -> Dict:
    if pdf_path:
        text = extract_text_from_pdf(pdf_path)
        skills = extract_skills(text)
        # TODO: Extract roles, experience, etc.
        return {
            'text': text[:1000],  # Truncate for demo
            'skills': skills,
            'source': 'pdf',
        }
    elif linkedin_url:
        # TODO: Scrape and parse LinkedIn profile
        return {
            'text': '',
            'skills': [],
            'source': 'linkedin',
        }
    else:
        return {'error': 'No input provided'} 