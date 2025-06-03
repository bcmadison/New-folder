from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, UTC
from sqlalchemy.orm import Session

from core.auto_logger import logger
from app.core.database import get_db
from app.services.player_service import PlayerService
from app.services.lineup_service import LineupService
from app.models.player import Player

router = APIRouter()

class PlayerResponse(BaseModel):
    id: str
    name: str
    position: str
    team: str
    salary: float
    projectedPoints: float
    confidence: float
    status: str

class LineupSubmission(BaseModel):
    players: List[str]
    sport: str
    contestId: Optional[str] = None

@router.get("/lineup", response_model=List[PlayerResponse])
async def get_lineup(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get available players for lineup building"""
    try:
        players = PlayerService.get_players(db)
        return [player.to_dict() for player in players]
    except Exception as e:
        logger.logger.error(f"Error fetching lineup: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch lineup data")

@router.post("/lineup/submit")
async def submit_lineup(lineup: LineupSubmission, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Submit a lineup for a contest"""
    try:
        # Get all players from the database
        players: List[Player] = []
        for player_id in lineup.players:
            player = PlayerService.get_player_by_id(db, player_id)
            if not player:
                raise HTTPException(status_code=400, detail=f"Player {player_id} not found")
            players.append(player)

        # Validate the lineup
        validation = LineupService.validate_lineup(players, lineup.sport)
        if not validation["isValid"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Invalid lineup",
                    "errors": validation["errors"]
                }
            )

        # Create the lineup
        lineup_data: Dict[str, Any] = {
            "sport": lineup.sport,
            "contestId": lineup.contestId,
            "players": players
        }
        db_lineup = LineupService.create_lineup(db, lineup_data)

        return {
            "success": True,
            "message": "Lineup submitted successfully",
            "lineup": db_lineup.to_dict(),
            "timestamp": datetime.now(UTC).isoformat()
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.logger.error(f"Error submitting lineup: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit lineup") 