from fastapi import FastAPI
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import uvicorn
import os

from core.config import settings
from core.database import Base, engine
from middleware.cors import setup_cors
from api.v1.endpoints import prediction, auth, analytics, settings as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    pass

app = FastAPI(
    title="AI Sports Betting Analytics API",
    description="Backend API for the AI Sports Betting Analytics Platform.",
    version="0.1.0",
    lifespan=lifespan
)

# Setup CORS
setup_cors(app)

# Include routers
app.include_router(prediction.router, prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["Settings"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Server is running",
        "api_url": settings.API_BASE_URL
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
