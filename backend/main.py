from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from typing import List
import logging

from .routes import auth, users, matches, predictions, websocket
from .services.websocket_service import ConnectionManager
from .database import engine, Base
from .models import user, match, prediction

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Sports Betting Analytics API",
    description="API for sports betting analytics and predictions",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize WebSocket connection manager
manager = ConnectionManager()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(matches.router, prefix="/api/matches", tags=["Matches"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(websocket.router, prefix="/api", tags=["WebSocket"])

@app.on_event("startup")
async def startup_event():
    """Start background tasks on application startup."""
    # Start live updates task
    asyncio.create_task(manager.start_live_updates())
    logger.info("Started live updates task")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on application shutdown."""
    # Close all WebSocket connections
    for subscription_type in manager.active_connections:
        for connection in manager.active_connections[subscription_type]:
            await manager.disconnect(connection)
    logger.info("Closed all WebSocket connections")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to the Sports Betting Analytics API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 