from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
from typing import List, Dict, Any, Optional
import json
import re

class CodeAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("EMERGENT_LLM_KEY")
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment")
    
    async def analyze_code(self, code: str, language: str, filename: Optional[str] = None, context_files: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Analyze code using Claude Sonnet 4.5
        Returns structured analysis with suggestions, complexity, and maintainability scores
        """
        
        # Create a new chat session for each analysis
        session_id = f"code_analysis_{os.urandom(8).hex()}"
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=self._get_system_prompt()
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        # Build analysis prompt
        prompt = self._build_analysis_prompt(code, language, filename, context_files)
        
        # Send message to Claude
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the response
        analysis_result = self._parse_analysis_response(response, language)
        
        return analysis_result
    
    def _get_system_prompt(self) -> str:
        return """You are an expert code reviewer with deep knowledge of software architecture, security, and best practices across multiple programming languages.

Your role is to provide:
1. **Architectural Improvements**: Suggest better design patterns, structure, and organization
2. **Security Issues**: Identify potential vulnerabilities and security risks
3. **Code Quality**: Assess maintainability, readability, and adherence to best practices
4. **Performance Optimization**: Suggest improvements for better performance
5. **Best Practices**: Ensure code follows language-specific conventions

Provide your analysis in the following JSON format:
{
  "suggestions": [
    {
      "category": "architecture|security|quality|performance|best_practices",
      "severity": "critical|high|medium|low",
      "title": "Brief title",
      "description": "Detailed explanation",
      "line_start": <number or null>,
      "line_end": <number or null>,
      "code_snippet": "relevant code if applicable",
      "recommendation": "Specific fix or improvement"
    }
  ],
  "complexity": <0-100>,
  "maintainability": <0-100>,
  "summary": "Overall assessment of the code"
}

Be thorough but practical. Focus on issues that matter."""
    
    def _build_analysis_prompt(self, code: str, language: str, filename: Optional[str], context_files: Optional[List[Dict[str, str]]]) -> str:
        prompt = f"""Please analyze the following {language} code and provide a comprehensive review.

**Filename**: {filename or 'N/A'}
**Language**: {language}

**Code to analyze**:
```{language}
{code}
```
"""
        
        if context_files:
            prompt += "\n**Context Files** (for reference):\n"
            for ctx_file in context_files[:3]:  # Limit to 3 context files
                prompt += f"\n**{ctx_file.get('filename', 'unknown')}**:\n```\n{ctx_file.get('code', '')[:500]}\n```\n"
        
        prompt += "\n\nProvide your analysis in the JSON format specified in the system message."
        
        return prompt
    
    def _parse_analysis_response(self, response: str, language: str) -> Dict[str, Any]:
        """
        Parse Claude's response and extract structured data
        """
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                analysis_data = json.loads(json_match.group())
                return analysis_data
        except json.JSONDecodeError:
            pass
        
        # Fallback: Create structured response from text
        return {
            "suggestions": self._extract_suggestions_from_text(response),
            "complexity": self._estimate_complexity(response),
            "maintainability": self._estimate_maintainability(response),
            "summary": response[:500] if len(response) > 500 else response
        }
    
    def _extract_suggestions_from_text(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract suggestions from unstructured text response
        """
        suggestions = []
        
        # Look for common patterns in code reviews
        patterns = {
            "security": ["security", "vulnerability", "exploit", "injection", "xss", "csrf"],
            "architecture": ["architecture", "design pattern", "structure", "organization"],
            "performance": ["performance", "optimize", "efficiency", "slow", "bottleneck"],
            "quality": ["maintainability", "readability", "clean code", "refactor"],
            "best_practices": ["best practice", "convention", "standard", "idiomatic"]
        }
        
        lines = text.split('\n')
        current_suggestion = None
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            
            # Detect category
            category = "quality"
            for cat, keywords in patterns.items():
                if any(keyword in line_lower for keyword in keywords):
                    category = cat
                    break
            
            # Check if this line starts a new suggestion
            if any(marker in line for marker in ["1.", "2.", "3.", "•", "-", "*"]) and len(line.strip()) > 5:
                if current_suggestion:
                    suggestions.append(current_suggestion)
                
                current_suggestion = {
                    "category": category,
                    "severity": "medium",
                    "title": line.strip()[:100],
                    "description": line.strip(),
                    "line_start": None,
                    "line_end": None,
                    "code_snippet": "",
                    "recommendation": ""
                }
            elif current_suggestion and line.strip():
                current_suggestion["description"] += " " + line.strip()
        
        if current_suggestion:
            suggestions.append(current_suggestion)
        
        return suggestions[:10]  # Limit to 10 suggestions
    
    def _estimate_complexity(self, text: str) -> int:
        """
        Estimate code complexity from review text
        """
        complexity_keywords = ["complex", "complicated", "nested", "difficult"]
        simple_keywords = ["simple", "straightforward", "clear", "clean"]
        
        text_lower = text.lower()
        complexity_score = 50  # Default medium
        
        for keyword in complexity_keywords:
            if keyword in text_lower:
                complexity_score += 10
        
        for keyword in simple_keywords:
            if keyword in text_lower:
                complexity_score -= 10
        
        return max(0, min(100, complexity_score))
    
    def _estimate_maintainability(self, text: str) -> int:
        """
        Estimate maintainability score from review text
        """
        positive_keywords = ["maintainable", "readable", "clean", "well-structured", "documented"]
        negative_keywords = ["hard to maintain", "difficult to read", "messy", "unclear", "undocumented"]
        
        text_lower = text.lower()
        maintainability_score = 70  # Default good
        
        for keyword in positive_keywords:
            if keyword in text_lower:
                maintainability_score += 5
        
        for keyword in negative_keywords:
            if keyword in text_lower:
                maintainability_score -= 10
        
        return max(0, min(100, maintainability_score))
