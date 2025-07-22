import os
import json
from typing import List
import google.generativeai as genai

# Configure Gemini
# Ensure your GOOGLE_API_KEY is set in your environment
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
except KeyError:
    print("‼️ GOOGLE_API_KEY environment variable not set.")
    # Handle the case where the key is not set, maybe exit or use a dummy mode.
    # For this example, we'll allow it to proceed and fail gracefully in the function.

model = genai.GenerativeModel('gemini-pro')

def generate_questions(skills: List[str], role: str = "Software Engineer", n: int = 10) -> List[str]:
    """
    Generates tailored interview questions using the Gemini API.
    Falls back to a static list if the API call fails.
    """
    if "GOOGLE_API_KEY" not in os.environ:
        print("API key not found. Using fallback questions.")
        return _generate_fallback_questions(skills, role, n)

    skills_str = ", ".join(skills) if skills else "general software engineering skills"
    
    # --- IMPROVEMENT 1: Enhanced Prompt Requesting JSON ---
    prompt = (
        f"You are an expert technical interviewer for a '{role}' position. "
        f"Your task is to generate exactly {n} interview questions tailored to a candidate with these key skills: {skills_str}. "
        f"Prioritize questions that directly probe their experience with these specific skills. "
        f"The questions should be insightful and progressively more challenging. "
        f"Return your response as a single, flat JSON array of strings, where each string is one question. "
        f"Example format: [\"Question 1\", \"Question 2\", ...]"
    )

    try:
        # --- IMPROVEMENT 2: Add temperature for more creative responses ---
        generation_config = genai.types.GenerationConfig(
            temperature=0.8 
        )
        
        response = model.generate_content(prompt, generation_config=generation_config)

        # --- IMPROVEMENT 3: Robust JSON Parsing ---
        # Clean the response to ensure it's valid JSON
        cleaned_text = response.text.strip().replace("`json", "").replace("`", "")
        questions = json.loads(cleaned_text)
        
        if not isinstance(questions, list):
            raise ValueError("API did not return a valid list.")
            
        return questions[:n]

    except Exception as e:
        print(f"‼️ Error generating questions with Gemini: {e}")
        print("Falling back to generic questions.")
        return _generate_fallback_questions(skills, role, n)

# The fallback function remains the same.
def _generate_fallback_questions(skills: List[str], role: str, n: int) -> List[str]:
    """Generate fallback questions when AI is not available."""
    # ... your existing fallback code ...
    questions = [
        f"Tell me about a project where you used {skills[0] if skills else 'your primary skill'}.",
        "Can you walk me through a complex algorithm you've implemented?",
        "Describe a challenging debugging scenario you encountered.",
        "How would you design a scalable microservices architecture?",
        "Design a real-time chat application that can handle millions of users.",
        "How do you ensure your code is maintainable and readable?",
        "Describe a time when you had to lead a team through a difficult technical challenge.",
        "What emerging technologies are you most excited about?",
        "How do you approach testing in your projects?",
        "Tell me about a time you had to make a critical decision with limited information."
    ]
    return questions[:n]


# Example Usage:
if __name__ == '__main__':
    # Make sure to set your GOOGLE_API_KEY in your environment to test this
    # For example, in your terminal: export GOOGLE_API_KEY='your_key_here'
    
    example_skills = ["React", "Node.js", "TypeScript", "AWS S3", "PostgreSQL"]
    generated = generate_questions(example_skills, "Senior Full-Stack Engineer")
    
    if generated:
        print("\n--- Generated Questions ---")
        for i, q in enumerate(generated, 1):
            print(f"{i}. {q}")

