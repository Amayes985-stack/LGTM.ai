from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import uuid
import hmac
import hashlib

load_dotenv()

app = FastAPI(title="LGTM.ai - AI Code Review Assistant")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/lgtm_ai")
client = MongoClient(MONGO_URL)
db = client.get_database()

# Collections
repositories_collection = db.repositories
reviews_collection = db.reviews
metrics_collection = db.metrics
vulnerabilities_collection = db.vulnerabilities

# Import services
from services.code_analyzer import CodeAnalyzer
from services.github_service import GitHubService
from services.security_scanner import SecurityScanner

code_analyzer = CodeAnalyzer()
github_service = GitHubService()
security_scanner = SecurityScanner()

# Models
class CodeAnalysisRequest(BaseModel):
    code: str
    language: str
    filename: Optional[str] = None
    context_files: Optional[List[Dict[str, str]]] = None

class RepositoryCreate(BaseModel):
    repo_url: str
    repo_name: str
    owner: str
    webhook_id: Optional[str] = None

class ReviewResponse(BaseModel):
    review_id: str
    suggestions: List[Dict[str, Any]]
    security_issues: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    overall_score: float
    analysis_time: float

# Health Check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "LGTM.ai"}

# Manual Code Analysis
@app.post("/api/analyze/manual", response_model=ReviewResponse)
async def analyze_code_manual(request: CodeAnalysisRequest):
    """Manually analyze code and return AI-powered review"""
    try:
        review_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        # Perform code analysis
        analysis_result = await code_analyzer.analyze_code(
            code=request.code,
            language=request.language,
            filename=request.filename,
            context_files=request.context_files
        )
        
        # Perform security scanning
        security_issues = await security_scanner.scan_code(
            code=request.code,
            language=request.language
        )
        
        # Calculate metrics
        metrics = {
            "lines_of_code": len(request.code.split('\n')),
            "complexity_score": analysis_result.get("complexity", 0),
            "maintainability_score": analysis_result.get("maintainability", 0),
            "security_score": 100 - (len(security_issues) * 10)
        }
        
        # Calculate overall score
        overall_score = (
            metrics["maintainability_score"] * 0.4 +
            metrics["security_score"] * 0.4 +
            (100 - min(metrics["complexity_score"], 100)) * 0.2
        )
        
        analysis_time = (datetime.now() - start_time).total_seconds()
        
        # Store review
        review_data = {
            "review_id": review_id,
            "type": "manual",
            "language": request.language,
            "filename": request.filename,
            "suggestions": analysis_result.get("suggestions", []),
            "security_issues": security_issues,
            "metrics": metrics,
            "overall_score": overall_score,
            "analysis_time": analysis_time,
            "created_at": datetime.now()
        }
        
        reviews_collection.insert_one(review_data)
        
        # Store metrics
        metrics_collection.insert_one({
            "review_id": review_id,
            "timestamp": datetime.now(),
            **metrics
        })
        
        return ReviewResponse(
            review_id=review_id,
            suggestions=analysis_result.get("suggestions", []),
            security_issues=security_issues,
            metrics=metrics,
            overall_score=overall_score,
            analysis_time=analysis_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Repository Management
@app.post("/api/repositories")
async def create_repository(repo: RepositoryCreate):
    """Add a new repository for monitoring"""
    try:
        repo_id = str(uuid.uuid4())
        repo_data = {
            "repo_id": repo_id,
            "repo_url": repo.repo_url,
            "repo_name": repo.repo_name,
            "owner": repo.owner,
            "webhook_id": repo.webhook_id,
            "created_at": datetime.now(),
            "active": True
        }
        
        repositories_collection.insert_one(repo_data)
        
        return {"repo_id": repo_id, "message": "Repository added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/repositories")
async def get_repositories():
    """Get all repositories"""
    try:
        repos = list(repositories_collection.find({}, {"_id": 0}).sort("created_at", -1))
        return {"repositories": repos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GitHub Webhook
@app.post("/api/webhooks/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle GitHub webhook events"""
    try:
        # Verify webhook signature
        signature = request.headers.get("X-Hub-Signature-256")
        body = await request.body()
        
        # Verify signature if webhook secret is set
        webhook_secret = os.getenv("GITHUB_WEBHOOK_SECRET")
        if webhook_secret and webhook_secret != "your_webhook_secret_here":
            expected_signature = "sha256=" + hmac.new(
                webhook_secret.encode(),
                body,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature or "", expected_signature):
                raise HTTPException(status_code=401, detail="Invalid signature")
        
        payload = await request.json()
        event_type = request.headers.get("X-GitHub-Event")
        
        # Handle pull request events
        if event_type == "pull_request":
            action = payload.get("action")
            
            if action in ["opened", "synchronize", "reopened"]:
                # Process PR in background
                background_tasks.add_task(
                    process_pull_request,
                    payload
                )
                
                return {"message": "Webhook received, processing PR"}
        
        return {"message": "Webhook received"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_pull_request(payload: Dict):
    """Process pull request and post review comments"""
    try:
        pr_data = payload.get("pull_request", {})
        repo_data = payload.get("repository", {})
        
        pr_number = pr_data.get("number")
        repo_full_name = repo_data.get("full_name")
        
        # Get PR files
        files = await github_service.get_pr_files(repo_full_name, pr_number)
        
        # Analyze each file
        all_suggestions = []
        all_security_issues = []
        
        for file in files:
            if file.get("status") == "removed":
                continue
                
            filename = file.get("filename", "")
            patch = file.get("patch", "")
            
            # Detect language
            language = detect_language(filename)
            
            if language in ["python", "javascript", "typescript", "html", "css", "sql", "cpp", "c"]:
                # Analyze code
                analysis = await code_analyzer.analyze_code(
                    code=patch,
                    language=language,
                    filename=filename
                )
                
                # Scan for security issues
                security_issues = await security_scanner.scan_code(
                    code=patch,
                    language=language
                )
                
                all_suggestions.extend(analysis.get("suggestions", []))
                all_security_issues.extend(security_issues)
        
        # Post review comment
        if all_suggestions or all_security_issues:
            comment_body = github_service.format_review_comment(
                all_suggestions,
                all_security_issues
            )
            
            # Store review
            review_id = str(uuid.uuid4())
            reviews_collection.insert_one({
                "review_id": review_id,
                "type": "github_pr",
                "repo": repo_full_name,
                "pr_number": pr_number,
                "suggestions": all_suggestions,
                "security_issues": all_security_issues,
                "created_at": datetime.now()
            })
            
    except Exception as e:
        print(f"Error processing PR: {e}")

def detect_language(filename: str) -> str:
    """Detect programming language from filename"""
    ext_map = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".html": "html",
        ".css": "css",
        ".sql": "sql",
        ".cpp": "cpp",
        ".cc": "cpp",
        ".cxx": "cpp",
        ".hpp": "cpp",
        ".h": "cpp",
        ".c": "c"
    }
    
    for ext, lang in ext_map.items():
        if filename.endswith(ext):
            return lang
    
    return "unknown"

# Reviews
@app.get("/api/reviews/{review_id}")
async def get_review(review_id: str):
    """Get review details"""
    try:
        review = reviews_collection.find_one({"review_id": review_id}, {"_id": 0})
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return review
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reviews")
async def get_all_reviews(limit: int = 20):
    """Get all reviews"""
    try:
        reviews = list(
            reviews_collection.find({}, {"_id": 0})
            .sort("created_at", -1)
            .limit(limit)
        )
        return {"reviews": reviews}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Metrics Dashboard
@app.get("/api/metrics/dashboard")
async def get_dashboard_metrics():
    """Get code quality metrics for dashboard"""
    try:
        # Get recent metrics
        recent_metrics = list(
            metrics_collection.find({}, {"_id": 0})
            .sort("timestamp", -1)
            .limit(30)
        )
        
        # Calculate aggregates
        total_reviews = reviews_collection.count_documents({})
        total_vulnerabilities = vulnerabilities_collection.count_documents({})
        
        avg_security_score = 0
        avg_maintainability = 0
        
        if recent_metrics:
            avg_security_score = sum(m.get("security_score", 0) for m in recent_metrics) / len(recent_metrics)
            avg_maintainability = sum(m.get("maintainability_score", 0) for m in recent_metrics) / len(recent_metrics)
        
        return {
            "total_reviews": total_reviews,
            "total_vulnerabilities": total_vulnerabilities,
            "avg_security_score": round(avg_security_score, 2),
            "avg_maintainability": round(avg_maintainability, 2),
            "recent_metrics": recent_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Vulnerabilities
@app.get("/api/vulnerabilities")
async def get_vulnerabilities(limit: int = 50):
    """Get all security vulnerabilities"""
    try:
        vulnerabilities = list(
            vulnerabilities_collection.find({}, {"_id": 0})
            .sort("severity", -1)
            .limit(limit)
        )
        return {"vulnerabilities": vulnerabilities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)