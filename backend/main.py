import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure the backend directory is in the python import path (crucial for Vercel vs Local)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routes import router
from auth_routes import router as auth_router
from database import init_db

# Load environmental configs (.env)
load_dotenv()

# Initialize SQLite database structure
init_db()

app = FastAPI(
    title="AI Travel Agency Dashboard API",
    description="Multi-agent orchestration backend powered by Gemini 3.5 Flash",
    version="1.0.0"
)

# Enable CORS for frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this. For development, allow all.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth and history endpoints
app.include_router(auth_router)

# Include agent planning endpoints
app.include_router(router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "AI Travel Agency Orchestrator API",
        "api_key_configured": bool(os.getenv("GEMINI_API_KEY"))
    }
