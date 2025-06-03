from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Optional
import json
import logging
from ..services.websocket_service import ConnectionManager
from ..auth import get_current_user
from ..models.user import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
manager = ConnectionManager()

@router.websocket("/ws/live-matches/{client_id}")
async def websocket_live_matches(
    websocket: WebSocket,
    client_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """WebSocket endpoint for live match updates."""
    try:
        await manager.connect(websocket, client_id, "live_matches")
        while True:
            try:
                # Keep connection alive and handle any client messages
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages if needed
                if message.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
                    
            except WebSocketDisconnect:
                await manager.disconnect(websocket)
                break
            except Exception as e:
                logger.error(f"Error in live matches websocket: {str(e)}")
                await manager.disconnect(websocket)
                break
                
    except Exception as e:
        logger.error(f"Error in live matches websocket connection: {str(e)}")
        await manager.disconnect(websocket)

@router.websocket("/ws/odds-updates/{client_id}")
async def websocket_odds_updates(
    websocket: WebSocket,
    client_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """WebSocket endpoint for odds updates."""
    try:
        await manager.connect(websocket, client_id, "odds_updates")
        while True:
            try:
                # Keep connection alive and handle any client messages
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages if needed
                if message.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
                    
            except WebSocketDisconnect:
                await manager.disconnect(websocket)
                break
            except Exception as e:
                logger.error(f"Error in odds updates websocket: {str(e)}")
                await manager.disconnect(websocket)
                break
                
    except Exception as e:
        logger.error(f"Error in odds updates websocket connection: {str(e)}")
        await manager.disconnect(websocket)

@router.websocket("/ws/match-events/{client_id}")
async def websocket_match_events(
    websocket: WebSocket,
    client_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """WebSocket endpoint for match events."""
    try:
        await manager.connect(websocket, client_id, "match_events")
        while True:
            try:
                # Keep connection alive and handle any client messages
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages if needed
                if message.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
                elif message.get("type") == "subscribe_match":
                    match_id = message.get("match_id")
                    if match_id:
                        await manager.handle_match_events(match_id)
                    
            except WebSocketDisconnect:
                await manager.disconnect(websocket)
                break
            except Exception as e:
                logger.error(f"Error in match events websocket: {str(e)}")
                await manager.disconnect(websocket)
                break
                
    except Exception as e:
        logger.error(f"Error in match events websocket connection: {str(e)}")
        await manager.disconnect(websocket)

@router.websocket("/ws/model-predictions/{client_id}")
async def websocket_model_predictions(
    websocket: WebSocket,
    client_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """WebSocket endpoint for model predictions."""
    try:
        await manager.connect(websocket, client_id, "model_predictions")
        while True:
            try:
                # Keep connection alive and handle any client messages
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages if needed
                if message.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
                    
            except WebSocketDisconnect:
                await manager.disconnect(websocket)
                break
            except Exception as e:
                logger.error(f"Error in model predictions websocket: {str(e)}")
                await manager.disconnect(websocket)
                break
                
    except Exception as e:
        logger.error(f"Error in model predictions websocket connection: {str(e)}")
        await manager.disconnect(websocket)

@router.get("/ws/connections")
async def get_connections(current_user: User = Depends(get_current_user)):
    """Get information about active WebSocket connections."""
    return manager.get_connection_metadata() 