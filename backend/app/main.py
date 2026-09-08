from datetime import datetime, timezone
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import check_db_connection
from app.api.v1.chat import router as chat_router

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="0.2.0",
    description="Backend API for AI-Powered Emotional Well-Being Monitoring Assistant with Companion Chatbot",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(chat_router)


@app.get("/", tags=["General"])
async def root():
    """
    Root endpoint returning service identity and status.
    """
    return {
        "app": settings.APP_NAME,
        "version": "0.2.0",
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health", tags=["Health"], status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health check endpoint returning backend status and database connectivity status.
    """
    db_health = await check_db_connection()
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_health,
    }
