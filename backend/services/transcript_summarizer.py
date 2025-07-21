import openai
import os
from typing import List

openai.api_key = os.getenv('OPENAI_API_KEY')

def summarize_transcript(answers: List[str]) -> str:
    # For demo, join answers and return a stub summary
    joined = ' '.join(answers)
    summary = f"Candidate provided {len(answers)} answers. Communication was clear."
    # For real use, call OpenAI API here
    # response = openai.ChatCompletion.create(...)
    return summary 