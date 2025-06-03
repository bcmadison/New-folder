from fastapi import APIRouter, HTTPException, Request, Query
import pandas as pd
import os
from datetime import datetime
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from typing import Optional, List, Dict, Any

# Import the new prizepicks service
from services import prizepicks_service
from core.auto_logger import logger

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

router = APIRouter()

# --- ESPN Integration: Load/refresh player stats from ESPN ---
def update_espn_stats():
    url = "https://www.espn.com/nba/stats/player"
    # Add more robust error handling and logging
    try:
        logger.logger.info("Updating ESPN player stats...")
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('table')
        if not table:
            logger.logger.warning("ESPN player stats table not found.")
            return None
        
        headers_row = table.find('thead')
        if not headers_row:
            logger.logger.warning("ESPN player stats table header (thead) not found.")
            return None
        headers = [th.get_text(strip=True) for th in headers_row.find_all('th')]
        
        players = []
        tbody = table.find('tbody')
        if not tbody:
            logger.logger.warning("ESPN player stats table body (tbody) not found.")
            return None
            
        for row in tbody.find_all('tr'):
            cols = row.find_all('td')
            if len(cols) == len(headers):
                player_data = {headers[i]: cols[i].get_text(strip=True) for i in range(len(headers))}
                players.append(player_data)
            else:
                logger.logger.debug(f"Skipping ESPN stats row due to column mismatch. Expected {len(headers)}, got {len(cols)}.")

        if not players:
            logger.logger.warning("No player data extracted from ESPN stats table.")
            return None

        df = pd.DataFrame(players)
        # Ensure backend/data directory exists
        data_dir = os.path.join("backend", "data")
        os.makedirs(data_dir, exist_ok=True)
        out_path = os.path.join(data_dir, "espn_player_stats.csv")
        df.to_csv(out_path, index=False)
        logger.logger.info(f"ESPN player stats updated and saved to {out_path}")
        return df
    except requests.RequestException as e:
        logger.logger.error(f"Error fetching ESPN stats: {e}", exc_info=True)
        return None
    except Exception as e:
        logger.logger.error(f"Error processing ESPN stats: {e}", exc_info=True)
        return None

# --- PrizePicks Projections Endpoint --- 
@router.get("/prizepicks/projections", 
            response_model=prizepicks_service.PrizePicksAPIResponse, # Use the response model from service
            summary="Get PrizePicks Projections",
            description="Fetches player projections from PrizePicks API. league_id 7=NBA, 2=NFL, 9=MLB etc.")
async def get_prizepicks_projections_route(league_id: Optional[str] = Query("7", description="PrizePicks League ID")):
    try:
        # Use the new service function
        data = prizepicks_service.fetch_projections_from_api(league_id=league_id)
        return data # FastAPI will serialize according to response_model
    except HTTPException as e:
        # Logged in service, re-raise for FastAPI to handle client response
        raise e 
    except Exception as e:
        logger.logger.error(f"Unhandled error in prizepicks/projections route: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error fetching PrizePicks projections.")

@router.get("/prizepicks/player/{player_id}", 
            response_model=Dict[str, Any], # The service returns the 'data' attribute of the player object
            summary="Get PrizePicks Player Details",
            description="Fetches a specific player by their ID from PrizePicks API.")
async def get_prizepicks_player_route(player_id: str):
    try:
        player_data = prizepicks_service.fetch_player_from_api(player_id=player_id)
        return player_data
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.logger.error(f"Unhandled error in prizepicks/player/{player_id} route: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error fetching player {player_id}.")

@router.get("/prizepicks/prop/{prop_id}", 
            response_model=prizepicks_service.RawPrizePicksProjection, # Service returns the projection object
            summary="Get Single PrizePicks Projection (Prop) Details",
            description="Fetches details for a single projection (prop) by its ID from PrizePicks API.")
async def get_prizepicks_single_prop_route(prop_id: str):
    try:
        projection_data = prizepicks_service.fetch_single_projection_from_api(projection_id=prop_id)
        return projection_data
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.logger.error(f"Unhandled error in prizepicks/prop/{prop_id} route: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error fetching prop {prop_id}.")

# --- Lineup Data Loading and Endpoint (reading from predictions_latest.csv for now) ---
def load_lineup_data_from_csv():
    # This path should be relative to the backend directory, or use absolute paths
    # For consistency, let's assume 'data' is a subfolder of 'backend'
    data_path = os.path.join(os.path.dirname(__file__), "../data", "predictions_latest.csv")
    if not os.path.exists(data_path):
        logger.logger.error(f"Lineup data file not found: {data_path}")
        raise HTTPException(status_code=404, detail="Core prediction data (predictions_latest.csv) not found.")
    try:
        df = pd.read_csv(data_path)
        # Ensure required columns more robustly
        if 'player' not in df.columns and 'name' not in df.columns:
             raise HTTPException(status_code=500, detail="CSV missing 'player' or 'name' column.")
        if 'name' not in df.columns: df['name'] = df['player']
        if 'id' not in df.columns: df['id'] = range(len(df))
        
        today_str = datetime.now().strftime('%Y-%m-%d')
        if 'date' not in df.columns: df['date'] = today_str # Default to today if missing
        if 'status' not in df.columns: df['status'] = df['date'].apply(lambda d: 'live' if d == today_str else 'future')
        
        # Ensure other common columns exist, even if empty, for consistency
        for col in ['team', 'sport', 'position', 'stats', 'matchup', 'predicted_points']:
            if col not in df.columns:
                df[col] = None # Use None for missing data, or pd.NA for newer pandas
        return df
    except pd.errors.EmptyDataError:
        logger.logger.error(f"Lineup data file is empty: {data_path}")
        raise HTTPException(status_code=404, detail="Prediction data file is empty.")
    except Exception as e:
        logger.logger.error(f"Error loading lineup data CSV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing prediction data file.")

@router.get("/lineup", summary="Get Filterable Game/Player Lineup from Predictions")
async def get_lineup_endpoint(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"), 
    status: Optional[str] = Query(None, description="Filter by status (e.g., live, future)"), 
    team: Optional[str] = Query(None, description="Filter by team name"), 
    sport: Optional[str] = Query(None, description="Filter by sport (e.g., NBA, NFL)"), 
    refresh_espn: bool = Query(False, description="Force refresh ESPN player stats")
):
    if refresh_espn:
        update_espn_stats() # This saves to CSV, consider returning DataFrame if used immediately
    
    df = load_lineup_data_from_csv()
    
    espn_path = os.path.join(os.path.dirname(__file__), "../data", "espn_player_stats.csv")
    if os.path.exists(espn_path):
        try:
            espn_df = pd.read_csv(espn_path)
            # Merge on player name. Ensure consistent naming or use fuzzy matching for better results.
            # For ESPN 'PLAYER' column and our 'name' column.
            if 'PLAYER' in espn_df.columns and 'name' in df.columns:
                # Standardize names for better matching if possible (e.g., lowercasing)
                # espn_df['_match_name'] = espn_df['PLAYER'].str.lower()
                # df['_match_name'] = df['name'].str.lower()
                # df = df.merge(espn_df, on='_match_name', how='left', suffixes=['', '_espn'])
                # df.drop(columns=['_match_name'], inplace=True)
                df = pd.merge(df, espn_df, left_on='name', right_on='PLAYER', how='left', suffixes=['', '_espn'])
        except Exception as e:
            logger.logger.warning(f"Could not merge ESPN stats: {e}", exc_info=True)

    # Filtering logic
    if date: df = df[df['date'] == date]
    if status and status.lower() != 'all': df = df[df['status'].str.lower() == status.lower()]
    if team and team.lower() != 'all': df = df[df['team'].astype(str).str.lower() == team.lower()]
    if sport and sport.lower() != 'all': df = df[df['sport'].astype(str).str.lower() == sport.lower()]
    
    # Replace NaN with None for JSON serialization compatibility
    df = df.where(pd.notnull(df), None)

    teams_list = sorted(df['team'].dropna().astype(str).unique().tolist()) if 'team' in df else []
    sports_list = sorted(df['sport'].dropna().astype(str).unique().tolist()) if 'sport' in df else []
    
    return {
        "lineup": df.to_dict(orient="records"), 
        "filtersAvailable": {
            "teams": teams_list,
            "sports": sports_list,
            "dates": sorted(df['date'].dropna().astype(str).unique().tolist()) if 'date' in df else [],
            "statuses": sorted(df['status'].dropna().astype(str).unique().tolist()) if 'status' in df else []
        }
    }

@router.post("/lineup/save", summary="Save a User-Defined Lineup")
async def save_lineup_endpoint(request: Request):
    try:
        data = await request.json()
        logger.logger.info(f"Received lineup save request: {data}")
        # TODO: Implement real saving logic (e.g., save to DB or file)
        # Scaffold: Save to a JSON file as a minimal persistent store
        save_path = os.path.join(os.path.dirname(__file__), "../data", "user_lineups.json")
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        import json
        if os.path.exists(save_path):
            with open(save_path, "r") as f:
                all_lineups = json.load(f)
        else:
            all_lineups = []
        all_lineups.append(data)
        with open(save_path, "w") as f:
            json.dump(all_lineups, f, indent=2)
        return JSONResponse(content={"status": "success", "message": "Lineup saved.", "lineup": data})
    except Exception as e:
        logger.logger.error(f"Error saving lineup: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save lineup.")