import os
import httpx
from typing import List, Dict, Any

class GitHubService:
    def __init__(self):
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.base_url = "https://api.github.com"
    
    async def get_pr_files(self, repo_full_name: str, pr_number: int) -> List[Dict[str, Any]]:
        """
        Get files changed in a pull request
        """
        if not self.github_token:
            return []
        
        url = f"{self.base_url}/repos/{repo_full_name}/pulls/{pr_number}/files"
        headers = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
        
        return []
    
    async def post_review_comment(self, repo_full_name: str, pr_number: int, comment_body: str):
        """
        Post a review comment on a pull request
        """
        if not self.github_token:
            return None
        
        url = f"{self.base_url}/repos/{repo_full_name}/issues/{pr_number}/comments"
        headers = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        data = {"body": comment_body}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=data)
            return response.json() if response.status_code == 201 else None
    
    def format_review_comment(self, suggestions: List[Dict], security_issues: List[Dict]) -> str:
        """
        Format review suggestions into a markdown comment
        """
        comment = "## 🤖 LGTM.ai Code Review\n\n"
        
        if security_issues:
            comment += "### 🔒 Security Issues\n\n"
            for issue in security_issues[:5]:
                severity_emoji = {"critical": "🚨", "high": "⚠️", "medium": "⚡", "low": "ℹ️"}
                emoji = severity_emoji.get(issue.get("severity", "medium"), "ℹ️")
                comment += f"{emoji} **{issue.get('title', 'Security Issue')}**\n"
                comment += f"{issue.get('description', '')}\n\n"
        
        if suggestions:
            comment += "### 💡 Suggestions\n\n"
            
            # Group by category
            by_category = {}
            for suggestion in suggestions:
                category = suggestion.get("category", "quality")
                if category not in by_category:
                    by_category[category] = []
                by_category[category].append(suggestion)
            
            category_names = {
                "architecture": "🏗️ Architecture",
                "security": "🔐 Security",
                "performance": "⚡ Performance",
                "quality": "✨ Code Quality",
                "best_practices": "📚 Best Practices"
            }
            
            for category, items in by_category.items():
                comment += f"#### {category_names.get(category, category.title())}\n\n"
                for item in items[:3]:
                    comment += f"- **{item.get('title', '')}**: {item.get('description', '')}\n"
                comment += "\n"
        
        comment += "\n---\n*Powered by LGTM.ai - AI Code Review Assistant*"
        
        return comment
