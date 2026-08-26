import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base
from backend.api import api_router
from backend.seed_data import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("revivepay")

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RevivePay AI API",
    description="Enterprise-Grade Autonomous Revenue Recovery & Payment Failure Resolution Platform",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set up CORS for frontend dev origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes under /api
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def on_startup():
    logger.info("⚡ Starting RevivePay AI Autonomous Revenue Engine...")
    try:
        seed_database()
    except Exception as e:
        logger.error(f"Error seeding database: {e}")

@app.get("/")
def root():
    return {
        "service": "revivepay-api",
        "name": "RevivePay AI",
        "tagline": "Recover Revenue Before It's Lost.",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "revivepay-api",
        "version": "1.0.0"
    }
