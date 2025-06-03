from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timezone
import os
import logging
import requests
from dotenv import load_dotenv

router = APIRouter()
logger = logging.getLogger("data_scraping_route")
load_dotenv()

# --- Data Models ---
class DailyFantasyProjection(BaseModel):
    player_id: str
    player_name: str
    team: str
    position: str
    projection: float
    salary: Optional[int]
    source: str
    game_date: date
    league: str

class ScrapingJobStatus(BaseModel):
    job_id: str
    status: str # e.g., "pending", "in_progress", "completed", "failed"
    message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    result_summary: Optional[Dict[str, Any]] = None

# --- Real Data Fetching Functions ---
async def fetch_theoddsapi_lines(game_date: date, league: str) -> List[DailyFantasyProjection]:
    API_KEY = os.getenv("THEODDS_API_KEY")
    if not API_KEY:
        logger.warning("THEODDS_API_KEY not set in .env. Returning empty projections.")
        return []
    url = f"https://api.the-odds-api.com/v4/sports/{league.lower()}/odds"
    params = {
        "apiKey": API_KEY,
        "regions": "us",
        "markets": "h2h,spreads,totals",
        "dateFormat": "iso",
        "oddsFormat": "american"
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        projections = []
        for event in data:
            for bookmaker in event.get("bookmakers", []):
                for market in bookmaker.get("markets", []):
                    for outcome in market.get("outcomes", []):
                        projections.append(DailyFantasyProjection(
                            player_id=outcome.get("participant", "unknown"),
                            player_name=outcome.get("participant", "unknown"),
                            team=event.get("home_team", "unknown"),
                            position=market.get("key", "unknown"),
                            projection=outcome.get("price", 0.0),
                            salary=None,
                            source="TheOddsAPI",
                            game_date=game_date,
                            league=league
                        ))
        return projections
    except Exception as e:
        logger.error(f"Error fetching TheOddsAPI lines: {e}", exc_info=True)
        return []

@router.get("/data-scraping/daily-fantasy-projections", 
            response_model=List[DailyFantasyProjection],
            summary="Get Daily Fantasy Projections (Real)")
async def get_daily_fantasy_projections(
    game_date: date = Query(..., description="The date for which to fetch projections (YYYY-MM-DD)"),
    league: str = Query(..., description="The league (e.g., NBA, NFL, MLB)")
):
    logger.info(f"Request for daily fantasy projections for {league} on {game_date}")
    if league.upper() not in ["NBA", "NFL", "MLB"]:
        raise HTTPException(status_code=400, detail=f"League '{league}' not supported for DFS projections.")
    projections = await fetch_theoddsapi_lines(game_date, league)
    return projections[:20]  # Limit to 20 for performance

@router.post("/data-scraping/trigger-job", 
             response_model=ScrapingJobStatus,
             summary="Trigger a Data Scraping Job (Real)")
async def trigger_scraping_job(
    background_tasks: BackgroundTasks,
    job_type: str = Query("daily_fantasy", description="Type of scraping job to trigger (e.g., daily_fantasy, odds_update)"),
    league: Optional[str] = Query(None, description="League for the job, if applicable (e.g., NBA, NFL)"),
    target_date_str: Optional[str] = Query(None, description="Target date for job (YYYY-MM-DD), if applicable", alias="target_date")
):
    job_id = f"job_{job_type}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    logger.info(f"[{job_id}] Received request to trigger scraping job: type='{job_type}', league='{league}', date='{target_date_str}'")
    if job_type == "daily_fantasy":
        if not league or not target_date_str:
            raise HTTPException(status_code=400, detail="'league' and 'target_date' are required for 'daily_fantasy' job type.")
        try:
            parsed_date = date.fromisoformat(target_date_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid target_date format. Please use YYYY-MM-DD.")
        # In a real app, this would enqueue a background job
        message = f"Daily fantasy scraping job for {league} on {parsed_date} started. (Simulated)"
        status = "pending"
    elif job_type == "odds_update":
        message = "Odds update job started. (Simulated)"
        status = "pending"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown job_type: '{job_type}'")
    return ScrapingJobStatus(
        job_id=job_id,
        status=status,
        message=message,
        created_at=datetime.now(timezone.utc)
    ) 