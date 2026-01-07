"""
Service module for generating questions using AI APIs
"""
import json
import requests
from django.conf import settings
from openai import OpenAI


class QuestionGenerator:
    """Service class for generating exam questions using AI APIs"""
    
    def __init__(self):
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.manus_api_key = settings.MANUS_API_KEY
        self.manus_api_url = settings.MANUS_API_URL
    
    def generate_questions_openai(self, exam_name: str, num_questions: int = 50, domain: str = None) -> list:
        """
        Generate exam questions using OpenAI API
        
        Args:
            exam_name: Name of the exam (e.g., "AWS Solutions Architect")
            num_questions: Number of questions to generate
            domain: Optional AWS service domain filter
        
        Returns:
            List of question dictionaries
        """
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")
        
        domain_context = f" focusing on {domain}" if domain else ""
        
        prompt = f"""Generate {num_questions} multiple-choice questions for the {exam_name} certification exam{domain_context}.

For each question, provide:
1. A clear, relevant question text about AWS services, architectures, or best practices
2. Exactly 4 answer options labeled A, B, C, D
3. The correct answer letter (A, B, C, or D)
4. A detailed explanation of why the correct answer is correct
5. An AWS service domain (e.g., EC2, S3, Lambda, VPC, IAM, etc.)

Return the response as a JSON array with this exact structure:
[
  {{
    "question_text": "Question text here",
    "domain": "AWS service name",
    "options": [
      {{"letter": "A", "text": "Option A text"}},
      {{"letter": "B", "text": "Option B text"}},
      {{"letter": "C", "text": "Option C text"}},
      {{"letter": "D", "text": "Option D text"}}
    ],
    "correct_answer_letter": "A",
    "explanation": "Detailed explanation here"
  }}
]

Make questions realistic and aligned with AWS best practices and official exam content."""
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",  # Using gpt-4o-mini for cost efficiency
                messages=[
                    {"role": "system", "content": "You are an expert AWS certification exam question writer. Generate accurate, realistic questions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Extract JSON from markdown code blocks if present
            if '```json' in content:
                start = content.find('```json') + 7
                end = content.find('```', start)
                content = content[start:end].strip()
            elif '```' in content:
                start = content.find('```') + 3
                end = content.find('```', start)
                if end == -1:
                    end = len(content)
                content = content[start:end].strip()
            
            # Try to parse JSON
            try:
                questions = json.loads(content)
                if not isinstance(questions, list):
                    questions = [questions]
            except json.JSONDecodeError:
                # Try to extract JSON array from text
                import re
                json_match = re.search(r'\[.*\]', content, re.DOTALL)
                if json_match:
                    questions = json.loads(json_match.group())
                else:
                    raise ValueError(f"Could not parse JSON from response: {content[:200]}")
            
            return questions
            
        except Exception as e:
            raise Exception(f"Error generating questions with OpenAI: {str(e)}")
    
    def generate_questions_manus(self, exam_name: str, num_questions: int = 50, domain: str = None, prompt: str = None) -> list:
        """
        Generate exam questions using Manus API
        
        Args:
            exam_name: Name of the exam
            num_questions: Number of questions to generate
            domain: Optional AWS service domain filter
            prompt: Optional custom prompt (if provided, this will be used instead of exam_name)
        
        Returns:
            List of question dictionaries
        """
        if not self.manus_api_key:
            raise ValueError("Manus API key not configured")
        
        headers = {
            "Authorization": f"Bearer {self.manus_api_key}",
            "Content-Type": "application/json"
        }
        
        # If prompt is provided, use it; otherwise construct from exam_name
        if prompt:
            api_prompt = prompt
        else:
            # Construct prompt from exam name
            exam_display_name = exam_name.replace('_', ' ').title()
            api_prompt = f"generate {num_questions} multiple choice questions for the {exam_display_name}"
        
        payload = {
            "prompt": api_prompt,
            "exam_type": exam_name,
            "num_questions": num_questions,
            "domain": domain
        }
        
        try:
            response = requests.post(
                f"{self.manus_api_url}/generate-questions",
                headers=headers,
                json=payload,
                timeout=60  # Increased timeout for 100 questions
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            # Re-raise HTTP errors so they can be caught by the fallback logic
            raise Exception(f"Error generating questions with Manus API: {str(e)}")
        except Exception as e:
            # Re-raise other exceptions so they can be caught by the fallback logic
            raise Exception(f"Error generating questions with Manus API: {str(e)}")
    
    def generate_questions(self, exam_name: str, num_questions: int = 50, domain: str = None, use_manus: bool = True, prompt: str = None) -> list:
        """
        Generate questions using the specified API
        Defaults to Manus API if available, with automatic fallback to OpenAI on failure
        
        Args:
            exam_name: Name of the exam
            num_questions: Number of questions to generate
            domain: Optional domain filter
            use_manus: If True, try Manus API first; otherwise use OpenAI (default: True)
            prompt: Optional custom prompt for Manus API (e.g., "generate 100 multiple choice questions for the solution architect")
        
        Returns:
            List of question dictionaries
        """
        # Try Manus API first if requested and available
        if use_manus and self.manus_api_key:
            try:
                return self.generate_questions_manus(exam_name, num_questions, domain, prompt)
            except Exception as e:
                # Log the error but don't fail - fallback to OpenAI
                print(f"Manus API failed: {str(e)}. Falling back to OpenAI...")
                if self.openai_client:
                    return self.generate_questions_openai(exam_name, num_questions, domain)
                else:
                    # Re-raise if no fallback available
                    raise Exception(f"Manus API failed and OpenAI is not configured. Original error: {str(e)}")
        
        # Use OpenAI if explicitly requested or if Manus is not available
        if self.openai_client:
            return self.generate_questions_openai(exam_name, num_questions, domain)
        elif self.manus_api_key:
            # Last resort: try Manus even if not explicitly requested
            try:
                return self.generate_questions_manus(exam_name, num_questions, domain, prompt)
            except Exception as e:
                raise Exception(f"Both Manus and OpenAI APIs failed. Manus error: {str(e)}")
        else:
            raise ValueError("No AI API configured. Please set MANUS_API_KEY or OPENAI_API_KEY in environment variables.")

