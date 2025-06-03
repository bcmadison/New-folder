import asyncio
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
import os
from typing import Dict, Any

from services.data_service import DataService
from services.websocket_service import WebSocketService
from services.ml_service import MLService
from core.prediction_engine import PredictionEngine
from core.database import init_db
from core.middleware import setup_middleware
from api.auth import router as auth_router
from api.predictions import router as predictions_router
from api.lineups import router as lineups_router
from api.players import router as players_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Sports Betting Analytics Platform",
    description="Advanced sports betting analytics and prediction platform",
    version="1.0.0"
)

# Setup middleware
setup_middleware(app)

# Initialize services
services: Dict[str, Any] = {
    'data_service': DataService(),
    'websocket_service': WebSocketService.get_instance(),
    'prediction_engine': PredictionEngine(),
    'ml_service': MLService()
}

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(predictions_router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(lineups_router, prefix="/api/lineups", tags=["Lineups"])
app.include_router(players_router, prefix="/api/players", tags=["Players"])

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    try:
        # Initialize database
        init_db()
        logger.info("Database initialized successfully")
        
        # Initialize data service
        await services['data_service'].initialize()
        
        # Initialize ML service
        model_path = os.getenv("MODEL_PATH", "models/prediction_model.joblib")
        if os.path.exists(model_path):
            await services['ml_service'].load_model(model_path)
            logger.info("ML model loaded successfully")
        
        # Initialize prediction engine
        services['prediction_engine'].initialize(services['ml_service'])
        logger.info("Prediction engine initialized successfully")
        
        # Start WebSocket service
        await services['websocket_service'].start_server(
            host=os.getenv("WS_HOST", "localhost"),
            port=int(os.getenv("WS_PORT", "8765"))
        )
        logger.info("WebSocket service started successfully")
        
        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    try:
        # Shutdown services in reverse order
        await services['websocket_service'].stop_server()
        await services['data_service'].close()
        await services['ml_service'].close()
        logger.info("All services shut down successfully")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")
        raise

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    try:
        await websocket.accept()
        await services['websocket_service'].handle_client(websocket, "/ws")
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        raise

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check all services
        health_status = {
            'status': 'healthy',
            'services': {
                'data_service': await services['data_service'].check_health(),
                'websocket_service': services['websocket_service'].is_healthy(),
                'ml_service': await services['ml_service'].check_health(),
                'prediction_engine': services['prediction_engine'].is_healthy()
            }
        }
        return health_status
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed")

if __name__ == "__main__":
    # Start FastAPI server
    uvicorn.run(
        "server:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True
    )
