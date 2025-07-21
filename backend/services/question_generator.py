import os
from typing import List
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

def generate_questions(skills: List[str], role: str = "Software Engineer", n: int = 10) -> List[str]:
    # Check if API key is available
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("No Google API key found, using fallback questions")
        return _generate_fallback_questions(skills, role, n)
    
    skills_str = ", ".join(skills) if skills else "general skills"
    prompt = (
        f"You are an expert technical interviewer conducting a comprehensive interview. "
        f"Generate {n} diverse, challenging, and role-specific interview questions for a candidate applying for the role of '{role}'. "
        f"The candidate's key skills are: {skills_str}. "
        f"Questions should cover:\n"
        f"1. Technical depth and problem-solving (3-4 questions)\n"
        f"2. System design and architecture (2-3 questions)\n"
        f"3. Behavioral and leadership (2-3 questions)\n"
        f"4. Industry knowledge and trends (1-2 questions)\n"
        f"5. Code quality and best practices (1-2 questions)\n"
        f"Make questions progressively more challenging. "
        f"Return the questions as a numbered list (1. Question 1, 2. Question 2, etc.)."
    )
    
    try:
        response = model.generate_content(prompt)
        # Parse the response into a list of questions
        questions = []
        for line in response.text.split("\n"):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith("-")):
                # Remove numbering and clean up
                if ". " in line:
                    q = line.split(". ", 1)[1].strip()
                elif line.startswith("-"):
                    q = line[1:].strip()
                else:
                    q = line
                if q:
                    questions.append(q)
            elif line and len(line) > 10:  # Add non-numbered lines that look like questions
                questions.append(line)
        
        # Ensure we return the requested number of questions
        return questions[:n]
    except Exception as e:
        print(f"Error generating questions with Gemini: {e}")
        return _generate_fallback_questions(skills, role, n)

def _generate_fallback_questions(skills: List[str], role: str, n: int) -> List[str]:
    """Generate fallback questions when AI is not available"""
    questions = []
    
    # Technical depth questions
    questions.extend([
        "Can you walk me through a complex algorithm you've implemented? What was the time complexity and how did you optimize it?",
        "Describe a challenging debugging scenario you encountered. What was the root cause and how did you solve it?",
        "Tell me about a performance optimization you made to an existing system. What metrics did you use to measure improvement?",
        "How would you design a scalable microservices architecture? What considerations would you keep in mind?"
    ])
    
    # System design questions
    questions.extend([
        "Design a real-time chat application that can handle millions of users. What components would you use?",
        "How would you design a distributed cache system? What challenges would you face?",
        "Explain how you would implement a recommendation system. What algorithms would you consider?"
    ])
    
    # Skill-specific questions
    for skill in skills[:3]:  # Limit to first 3 skills
        if skill.lower() in ['python', 'java', 'javascript', 'react', 'node']:
            questions.append(f"Can you walk me through a project where you used {skill}? What were the challenges and how did you solve them?")
        elif skill.lower() in ['machine learning', 'deep learning', 'ai']:
            questions.append(f"Tell me about your experience with {skill}. What algorithms or frameworks have you worked with?")
        elif skill.lower() in ['sql', 'database', 'aws', 'cloud']:
            questions.append(f"Describe a database or cloud project you've worked on. What technologies did you use and what was the outcome?")
        else:
            questions.append(f"How have you applied {skill} in your previous work?")
    
    # Role-specific questions
    if role.lower() in ['software engineer', 'developer', 'programmer']:
        questions.extend([
            "Describe your development workflow. How do you approach debugging and problem-solving?",
            "Tell me about a time when you had to learn a new technology quickly for a project.",
            "How do you handle code reviews and collaboration with team members?",
            "What's your approach to testing? How do you ensure code quality?"
        ])
    elif role.lower() in ['data scientist', 'ml engineer']:
        questions.extend([
            "Walk me through a machine learning project from start to finish.",
            "How do you evaluate model performance and handle overfitting?",
            "Describe a time when you had to explain complex technical concepts to non-technical stakeholders.",
            "What's your experience with A/B testing and statistical analysis?"
        ])
    else:
        questions.extend([
            "Describe a challenging project you worked on. What was your role and what was the outcome?",
            "How do you stay updated with industry trends and new technologies?",
            "Tell me about a time when you had to work under pressure or meet a tight deadline.",
            "How do you handle conflicting requirements from different stakeholders?"
        ])
    
    # Behavioral and leadership questions
    questions.extend([
        "Tell me about a time when you had to lead a team through a difficult technical challenge.",
        "Describe a situation where you had to mentor a junior developer. What was your approach?",
        "How do you handle disagreements with team members about technical decisions?",
        "What's your approach to learning new technologies and staying current with industry trends?"
    ])
    
    # Industry knowledge questions
    questions.extend([
        "What emerging technologies do you think will have the biggest impact on our industry in the next 5 years?",
        "How do you think AI and machine learning will change software development?",
        "What's your opinion on the current state of software development practices and tools?"
    ])
    
    # Code quality and best practices
    questions.extend([
        "How do you ensure your code is maintainable and readable? What practices do you follow?",
        "Tell me about your experience with CI/CD pipelines. What tools have you used?",
        "How do you approach security in your applications? What considerations do you keep in mind?"
    ])
    
    return questions[:n] 