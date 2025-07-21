import os
import google.generativeai as genai
from typing import Dict, Any

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

def score_answer(question: str, answer: str) -> Dict[str, Any]:
    """
    Score an answer using Gemini AI with rigorous evaluation criteria
    """
    try:
        # Check if API key is available
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("No Google API key found, using fallback scoring")
            return _fallback_scoring(question, answer)
        
        prompt = f"""
        You are an expert technical interviewer conducting a rigorous evaluation of a candidate's answer.
        
        Question: {question}
        Candidate's Answer: {answer}
        
        Please evaluate this answer using the following strict criteria:
        
        1. TECHNICAL DEPTH (0-10 points):
           - Demonstrates deep understanding of concepts
           - Shows practical experience and real-world application
           - Mentions specific technologies, frameworks, or methodologies
           - Explains complex concepts clearly
        
        2. PROBLEM-SOLVING APPROACH (0-10 points):
           - Shows systematic thinking and logical reasoning
           - Demonstrates analytical skills
           - Provides step-by-step solutions
           - Considers edge cases and trade-offs
        
        3. COMMUNICATION SKILLS (0-10 points):
           - Clear, concise, and well-structured response
           - Uses appropriate technical terminology
           - Explains complex ideas in understandable terms
           - Shows confidence and professionalism
        
        4. EXPERIENCE & EXAMPLES (0-10 points):
           - Provides specific, relevant examples from experience
           - Shows hands-on experience with technologies
           - Demonstrates learning from challenges and failures
           - Shows growth and continuous learning
        
        5. CRITICAL THINKING (0-10 points):
           - Questions assumptions and considers alternatives
           - Shows awareness of industry trends and best practices
           - Demonstrates strategic thinking
           - Shows ability to think beyond immediate solutions
        
        Calculate the average score from all 5 criteria (0-10 scale).
        
        Format your response as JSON:
        {{
            "score": <average_score_0-10>,
            "technical_depth": <score_0-10>,
            "problem_solving": <score_0-10>,
            "communication": <score_0-10>,
            "experience": <score_0-10>,
            "critical_thinking": <score_0-10>,
            "feedback": "<detailed_feedback_explaining_scores>",
            "strengths": ["<strength1>", "<strength2>", "<strength3>"],
            "improvements": ["<improvement1>", "<improvement2>", "<improvement3>"],
            "suggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"],
            "overall_assessment": "<comprehensive_assessment>"
        }}
        
        Be strict and honest in your evaluation. A score of 8-10 should be reserved for truly exceptional answers.
        """
        
        response = model.generate_content(prompt)
        
        # Try to parse JSON response
        try:
            import json
            # Extract JSON from response
            response_text = response.text
            # Find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)
                
                return {
                    "score": result.get("score", 6),
                    "technical_depth": result.get("technical_depth", 6),
                    "problem_solving": result.get("problem_solving", 6),
                    "communication": result.get("communication", 6),
                    "experience": result.get("experience", 6),
                    "critical_thinking": result.get("critical_thinking", 6),
                    "feedback": result.get("feedback", "Good answer with room for improvement."),
                    "strengths": result.get("strengths", []),
                    "improvements": result.get("improvements", []),
                    "suggestions": result.get("suggestions", []),
                    "overall_assessment": result.get("overall_assessment", "Solid performance with areas for growth.")
                }
        except:
            # Fallback parsing
            return _parse_gemini_response(response.text, question, answer)
            
    except Exception as e:
        print(f"Error in Gemini scoring: {e}")
        return _fallback_scoring(question, answer)

def _parse_gemini_response(response_text: str, question: str, answer: str) -> Dict[str, Any]:
    """Parse Gemini response when JSON parsing fails"""
    lines = response_text.split('\n')
    score = 6
    feedback = "Good answer with room for improvement."
    
    for line in lines:
        line = line.strip().lower()
        if 'score' in line and any(char.isdigit() for char in line):
            # Extract score
            for word in line.split():
                if word.isdigit():
                    score = min(10, max(1, int(word)))
                    break
        elif 'feedback' in line or 'evaluation' in line:
            feedback = line.replace('feedback:', '').replace('evaluation:', '').strip()
    
    return {
        "score": score,
        "technical_depth": score,
        "problem_solving": score,
        "communication": score,
        "experience": score,
        "critical_thinking": score,
        "feedback": feedback,
        "strengths": ["Good technical understanding"],
        "improvements": ["Could provide more specific examples"],
        "suggestions": ["Consider adding more context and examples"],
        "overall_assessment": "Solid performance with areas for growth."
    }

def _fallback_scoring(question: str, answer: str) -> Dict[str, Any]:
    """Fallback scoring when Gemini is not available - more rigorous"""
    # Initialize scores for each criterion
    technical_depth = 5
    problem_solving = 5
    communication = 5
    experience = 5
    critical_thinking = 5
    
    # Analyze answer length and structure
    if len(answer) > 200:
        communication += 2
        experience += 1
    elif len(answer) < 100:
        communication -= 2
        experience -= 1
    
    # Check for technical keywords and depth
    tech_keywords = ['algorithm', 'complexity', 'optimization', 'architecture', 'framework', 'methodology', 'pattern']
    found_tech_keywords = [word for word in tech_keywords if word.lower() in answer.lower()]
    
    if len(found_tech_keywords) >= 3:
        technical_depth += 3
        problem_solving += 2
    elif len(found_tech_keywords) >= 1:
        technical_depth += 1
        problem_solving += 1
    else:
        technical_depth -= 1
    
    # Check for specific examples and experience
    experience_indicators = ['project', 'experience', 'worked on', 'implemented', 'developed', 'built']
    found_experience = [word for word in experience_indicators if word.lower() in answer.lower()]
    
    if len(found_experience) >= 2:
        experience += 3
        technical_depth += 1
    elif len(found_experience) >= 1:
        experience += 1
    else:
        experience -= 2
    
    # Check for problem-solving approach
    problem_solving_indicators = ['step', 'approach', 'process', 'method', 'strategy', 'solution']
    found_problem_solving = [word for word in problem_solving_indicators if word.lower() in answer.lower()]
    
    if len(found_problem_solving) >= 2:
        problem_solving += 2
        critical_thinking += 1
    elif len(found_problem_solving) >= 1:
        problem_solving += 1
    
    # Check for critical thinking indicators
    critical_thinking_indicators = ['consider', 'trade-off', 'alternative', 'challenge', 'limitation', 'future']
    found_critical_thinking = [word for word in critical_thinking_indicators if word.lower() in answer.lower()]
    
    if len(found_critical_thinking) >= 2:
        critical_thinking += 3
    elif len(found_critical_thinking) >= 1:
        critical_thinking += 1
    else:
        critical_thinking -= 1
    
    # Check for communication quality
    communication_indicators = ['clearly', 'specifically', 'example', 'because', 'therefore', 'however']
    found_communication = [word for word in communication_indicators if word.lower() in answer.lower()]
    
    if len(found_communication) >= 3:
        communication += 2
    elif len(found_communication) >= 1:
        communication += 1
    
    # Ensure scores are within bounds
    technical_depth = max(1, min(10, technical_depth))
    problem_solving = max(1, min(10, problem_solving))
    communication = max(1, min(10, communication))
    experience = max(1, min(10, experience))
    critical_thinking = max(1, min(10, critical_thinking))
    
    # Calculate average score
    avg_score = (technical_depth + problem_solving + communication + experience + critical_thinking) / 5
    
    # Generate feedback based on scores
    strengths = []
    improvements = []
    suggestions = []
    
    if technical_depth >= 7:
        strengths.append("Strong technical knowledge")
    else:
        improvements.append("Could demonstrate deeper technical understanding")
        suggestions.append("Provide more technical details and specific technologies")
    
    if problem_solving >= 7:
        strengths.append("Good problem-solving approach")
    else:
        improvements.append("Could show more systematic problem-solving")
        suggestions.append("Break down problems into steps and explain your reasoning")
    
    if communication >= 7:
        strengths.append("Clear communication")
    else:
        improvements.append("Could improve clarity and structure")
        suggestions.append("Organize your thoughts and provide specific examples")
    
    if experience >= 7:
        strengths.append("Good practical experience")
    else:
        improvements.append("Could provide more specific examples")
        suggestions.append("Share concrete examples from your work experience")
    
    if critical_thinking >= 7:
        strengths.append("Shows critical thinking")
    else:
        improvements.append("Could demonstrate more analytical thinking")
        suggestions.append("Consider trade-offs and alternative approaches")
    
    if avg_score >= 8:
        overall_assessment = "Excellent answer demonstrating strong technical knowledge, problem-solving skills, and communication."
    elif avg_score >= 6:
        overall_assessment = "Good answer showing solid understanding with room for improvement in specific areas."
    else:
        overall_assessment = "Answer needs improvement in multiple areas. Focus on providing more specific examples and technical depth."
    
    return {
        "score": round(avg_score, 1),
        "technical_depth": technical_depth,
        "problem_solving": problem_solving,
        "communication": communication,
        "experience": experience,
        "critical_thinking": critical_thinking,
        "feedback": f"Technical Depth: {technical_depth}/10, Problem Solving: {problem_solving}/10, Communication: {communication}/10, Experience: {experience}/10, Critical Thinking: {critical_thinking}/10",
        "strengths": strengths,
        "improvements": improvements,
        "suggestions": suggestions,
        "overall_assessment": overall_assessment
    }

def generate_overall_feedback(answers: list) -> Dict[str, Any]:
    """
    Generate overall interview feedback using Gemini AI with rigorous analysis
    """
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return _fallback_overall_feedback(answers)
        
        # Prepare answers summary with detailed scores
        answers_summary = []
        total_score = 0
        category_scores = {
            "technical_depth": 0,
            "problem_solving": 0,
            "communication": 0,
            "experience": 0,
            "critical_thinking": 0
        }
        
        for i, answer in enumerate(answers):
            score_details = f"Technical: {answer.get('technical_depth', answer['score'])}/10, "
            score_details += f"Problem Solving: {answer.get('problem_solving', answer['score'])}/10, "
            score_details += f"Communication: {answer.get('communication', answer['score'])}/10, "
            score_details += f"Experience: {answer.get('experience', answer['score'])}/10, "
            score_details += f"Critical Thinking: {answer.get('critical_thinking', answer['score'])}/10"
            
            answers_summary.append(f"Q{i+1}: {answer['question']}\nA: {answer['answer']}\nScores: {score_details}")
            total_score += answer['score']
            
            # Aggregate category scores
            for category in category_scores:
                category_scores[category] += answer.get(category, answer['score'])
        
        avg_score = total_score / len(answers) if answers else 0
        avg_category_scores = {k: v/len(answers) for k, v in category_scores.items()} if answers else {}
        
        prompt = f"""
        You are an expert technical interviewer providing comprehensive feedback for a candidate.
        
        Interview Summary:
        - Total Questions: {len(answers)}
        - Average Score: {avg_score:.1f}/10
        - Category Averages: {avg_category_scores}
        
        Individual Answers:
        {chr(10).join(answers_summary)}
        
        Please provide rigorous evaluation including:
        1. Overall assessment with specific strengths and weaknesses
        2. Detailed analysis of each evaluation category (technical depth, problem-solving, communication, experience, critical thinking)
        3. Specific areas where the candidate excels
        4. Critical areas that need improvement
        5. Actionable recommendations for growth
        6. Whether the candidate shows potential for the role (be strict and honest)
        7. Next steps for the candidate's development
        
        Format as JSON:
        {{
            "overall_assessment": "<comprehensive_assessment>",
            "category_analysis": {{
                "technical_depth": "<analysis>",
                "problem_solving": "<analysis>",
                "communication": "<analysis>",
                "experience": "<analysis>",
                "critical_thinking": "<analysis>"
            }},
            "strengths": ["<strength1>", "<strength2>", "<strength3>"],
            "critical_weaknesses": ["<weakness1>", "<weakness2>"],
            "recommendations": ["<rec1>", "<rec2>", "<rec3>"],
            "potential": "<high/medium/low>",
            "next_steps": ["<step1>", "<step2>"],
            "hiring_recommendation": "<strong_hire/consider/reject>"
        }}
        
        Be strict and honest. Reserve "high potential" and "strong hire" for truly exceptional candidates.
        """
        
        response = model.generate_content(prompt)
        
        try:
            import json
            response_text = response.text
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)
                
                return {
                    "overall_feedback": result.get("overall_assessment", "Good performance overall."),
                    "category_analysis": result.get("category_analysis", {}),
                    "strengths": result.get("strengths", []),
                    "critical_weaknesses": result.get("critical_weaknesses", []),
                    "recommendations": result.get("recommendations", []),
                    "potential": result.get("potential", "medium"),
                    "next_steps": result.get("next_steps", []),
                    "hiring_recommendation": result.get("hiring_recommendation", "consider")
                }
        except:
            return _fallback_overall_feedback(answers)
            
    except Exception as e:
        print(f"Error in Gemini overall feedback: {e}")
        return _fallback_overall_feedback(answers)

def _fallback_overall_feedback(answers: list) -> Dict[str, Any]:
    """Fallback overall feedback generation with rigorous analysis"""
    if not answers:
        return {
            "overall_feedback": "No answers provided for evaluation.",
            "category_analysis": {},
            "strengths": [],
            "critical_weaknesses": ["Complete the interview to receive feedback"],
            "recommendations": ["Please complete the interview process"],
            "potential": "unknown",
            "next_steps": ["Complete the interview"],
            "hiring_recommendation": "incomplete"
        }
    
    total_score = sum(answer['score'] for answer in answers)
    avg_score = total_score / len(answers)
    
    # Analyze category scores
    category_scores = {
        "technical_depth": 0,
        "problem_solving": 0,
        "communication": 0,
        "experience": 0,
        "critical_thinking": 0
    }
    
    for answer in answers:
        for category in category_scores:
            category_scores[category] += answer.get(category, answer['score'])
    
    avg_category_scores = {k: v/len(answers) for k, v in category_scores.items()}
    
    # Generate category analysis
    category_analysis = {}
    for category, score in avg_category_scores.items():
        if score >= 8:
            category_analysis[category] = f"Excellent {category.replace('_', ' ')} demonstrated consistently."
        elif score >= 6:
            category_analysis[category] = f"Good {category.replace('_', ' ')} with room for improvement."
        else:
            category_analysis[category] = f"Needs significant improvement in {category.replace('_', ' ')}."
    
    if avg_score >= 8:
        overall = "Excellent performance demonstrating strong technical knowledge, problem-solving skills, and communication."
        potential = "high"
        hiring_rec = "strong_hire"
    elif avg_score >= 6:
        overall = "Good performance with solid technical foundation and room for growth."
        potential = "medium"
        hiring_rec = "consider"
    else:
        overall = "Performance indicates need for improvement in technical knowledge and communication."
        potential = "low"
        hiring_rec = "reject"
    
    return {
        "overall_feedback": overall,
        "category_analysis": category_analysis,
        "strengths": ["Technical knowledge", "Communication skills"],
        "critical_weaknesses": ["Could provide more specific examples", "Consider expanding technical depth"],
        "recommendations": ["Continue learning new technologies", "Practice technical interviews", "Build more projects"],
        "potential": potential,
        "next_steps": ["Review technical concepts", "Practice coding problems", "Build portfolio projects"],
        "hiring_recommendation": hiring_rec
    } 