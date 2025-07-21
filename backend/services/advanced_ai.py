import openai
import os
from typing import List, Dict, Optional
from services import question_generator, scoring_engine

openai.api_key = os.getenv('OPENAI_API_KEY')

def generate_contextual_questions(skills: List[str], role: str, previous_answers: List[str] = None) -> List[str]:
    """Generate contextual questions based on previous answers and skills"""
    context = f"Role: {role}\nSkills: {', '.join(skills)}"
    if previous_answers:
        context += f"\nPrevious answers: {len(previous_answers)} provided"
    
    prompt = f"""
    Generate 3-5 interview questions for a {role} position.
    Candidate skills: {', '.join(skills)}
    
    Requirements:
    - Questions should be specific to their skills
    - Include behavioral and technical questions
    - Adapt based on previous answers if any
    - Questions should be clear and professional
    
    Return only the questions, one per line.
    """
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )
        questions = response.choices[0].message.content.strip().split('\n')
        return [q.strip() for q in questions if q.strip()]
    except Exception as e:
        print(f"Error generating questions: {e}")
        return question_generator.generate_questions(skills, role)

def evaluate_answer_advanced(question: str, answer: str, context: str = "") -> Dict:
    """Advanced answer evaluation using GPT-4"""
    prompt = f"""
    Evaluate this interview answer:
    
    Question: {question}
    Answer: {answer}
    Context: {context}
    
    Provide:
    1. Score (1-10)
    2. Technical depth assessment
    3. Communication clarity
    4. Specific feedback
    5. Areas for improvement
    
    Format as JSON:
    {{
        "score": number,
        "technical_depth": "high/medium/low",
        "communication": "excellent/good/fair/poor",
        "feedback": "detailed feedback",
        "improvements": ["list", "of", "suggestions"]
    }}
    """
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400
        )
        import json
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error evaluating answer: {e}")
        return scoring_engine.score_answer(question, answer)

def generate_interview_summary(answers: List[str], scores: List[Dict], role: str) -> str:
    """Generate comprehensive interview summary"""
    prompt = f"""
    Create a professional interview summary for a {role} position.
    
    Answers: {answers}
    Scores: {scores}
    
    Include:
    - Overall assessment
    - Strengths identified
    - Areas for improvement
    - Technical competency
    - Communication skills
    - Recommendation
    
    Write in a professional, objective tone.
    """
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating summary: {e}")
        return f"Candidate provided {len(answers)} answers with average score."

def adapt_interview_flow(answers: List[str], scores: List[Dict], skills: List[str]) -> Dict:
    """Adapt interview flow based on performance"""
    avg_score = sum(s.get('score', 0) for s in scores) / len(scores) if scores else 0
    
    if avg_score >= 8:
        return {"difficulty": "increase", "focus": "advanced_technical"}
    elif avg_score >= 6:
        return {"difficulty": "maintain", "focus": "balanced"}
    else:
        return {"difficulty": "decrease", "focus": "fundamentals"} 