import sys
sys.path.append('core')
from auto_logger import logger
logger.logger.info("Backend server starting...")

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime
import pandas as pd
import os
from dotenv import load_dotenv
from pathlib import Path
import json
from typing import Any, Dict

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from routes.settings import router as settings_router
from routes.analytics_route import router as analytics_router
from routes.predictions import router as predictions_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(settings_router)
app.include_router(analytics_router)
app.include_router(predictions_router, prefix="/api/predictions")

logger = logging.getLogger(__name__)

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Predictions endpoint (no prefix)
@app.get("/predictions")
def get_predictions():
    csv_path = os.path.join(os.path.dirname(__file__), "data", "predictions_latest.csv")
    if not os.path.exists(csv_path):
        return []
    df = pd.read_csv(csv_path)
    return df.to_dict(orient="records")

# Lineup endpoint
@app.get("/api/lineup")
async def get_lineup():
    # TODO: integrate real optimization logic
    sample = {"sport": "nba", "lineup": ["Player A", "Player B", "Player C"]}
    return {"status": "success", "data": sample}

# Analytics endpoint
@app.get("/api/analytics")
async def get_analytics():
    # TODO: compute ROI and performance trends
    trends = {"ROI": [5.2, 6.1, 4.8], "dates": ["2025-05-27", "2025-05-28", "2025-05-29"]}
    return {"status": "success", "trends": trends}

# SHAP explainability endpoint
@app.get("/api/shap")
async def get_shap():
    # TODO: integrate SHAP values generation
    return {"status": "success", "values": []}

# Settings endpoint
@app.get("/api/settings")
async def get_settings():
    # Return UI + strategy config
    settings = {"sports": ["All Sports", "NBA", "MLB", "NHL", "Soccer"], "confidenceLevels": [50, 60, 70, 80, 90]}
    return {"status": "success", "settings": settings}

# Feedback endpoint
@app.post("/api/feedback")
async def post_feedback(request: dict):
    # TODO: capture and store user feedback
    return {"status": "success", "received": request}

# WebSocket for live scores (example)
@app.websocket("/ws/scores")
async def websocket_scores(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        logger.info("Client disconnected")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Use the global logger from auto_logger
    import core.auto_logger
    core.auto_logger.logger.logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

@app.post("/api/logs/export")
async def receive_frontend_logs(log_data: Dict[str, Any]) -> Any:
    """Receive and store frontend logs from the frontend app."""
    try:
        import core.auto_logger
        core.auto_logger.logger.logger.info(f"Received frontend logs for session: {log_data.get('sessionId', 'unknown')}")
        frontend_log_dir = Path("logs/frontend")
        frontend_log_dir.mkdir(parents=True, exist_ok=True)
        log_file = frontend_log_dir / f"frontend_{log_data.get('sessionId', 'unknown')}.json"
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(log_data, f, indent=2)
        return {"status": "success", "message": "Frontend logs saved."}
    except Exception as e:
        import core.auto_logger
        core.auto_logger.logger.logger.error(f"Failed to save frontend logs: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Failed to save frontend logs."})
