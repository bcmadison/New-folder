import requests
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from core.auto_logger import logger # Use absolute import for logger
from pydantic import BaseModel, Field
import time
import os
import json

# Define a more structured response, similar to frontend's PrizePicksAPI.ts
class RawPrizePicksProjection(BaseModel):
    id: str = ""
    type: str = "projection" # Default type
    attributes: Dict[str, Any] = Field(default_factory=dict)
    relationships: Dict[str, Any] = Field(default_factory=dict)

class PrizePicksAPIResponse(BaseModel):
    data: List[RawPrizePicksProjection] = Field(default_factory=list)
    included: List[Dict[str, Any]] = Field(default_factory=list)
    # links, meta could be added if needed

    def __init__(self, **data):
        super().__init__(**data)


PRIZEPICKS_API_URL = "https://api.prizepicks.com/projections"
PRIZEPICKS_PLAYERS_URL = "https://api.prizepicks.com/new_players" # Base URL for players
PRIZEPICKS_APP_URL = "https://app.prizepicks.com/projections" # For session cookies if needed

# Simple in-memory cache for projections
_projections_cache = {
    'data': None,
    'timestamp': 0,
    'ttl': 60  # cache for 60 seconds
}

SAMPLE_FILE_PATH = os.path.join(os.path.dirname(__file__), '../data/sample_prizepicks.json')

def _get_prizepicks_session():
    """Helper to get a session, potentially with pre-warmed cookies."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": PRIZEPICKS_APP_URL,
        "Origin": "https://app.prizepicks.com",
    }
    session = requests.Session()
    session.headers.update(headers)
    try:
        session.get(PRIZEPICKS_APP_URL, timeout=10)
    except requests.RequestException as e:
        logger.logger.warning(f"PrizePicks service: Failed to establish initial session with app URL: {e}")
    return session

def fetch_projections_from_api(league_id: Optional[str] = "7", per_page: int = 1000) -> PrizePicksAPIResponse:
    """
    Fetches projections directly from the PrizePicks API.
     league_id: e.g., "7" for NBA, "2" for NFL, "9" for MLB. Defaults to NBA.
     per_page: Number of projections to fetch.
    """
    now = time.time()
    if _projections_cache['data'] and now - _projections_cache['timestamp'] < _projections_cache['ttl']:
        return _projections_cache['data']
    params: Dict[str, Any] = {"per_page": per_page, "single_stat": "true"}
    if league_id:
        params["league_id"] = league_id
    session = _get_prizepicks_session()
    response_text_for_error = ""
    response_status_for_error = 0
    try:
        logger.logger.info(f"PrizePicks service: Fetching projections from API with params: {params}")
        response = session.get(PRIZEPICKS_API_URL, params=params, timeout=15)
        response_text_for_error = response.text
        response_status_for_error = response.status_code
        response.raise_for_status()
        api_data = response.json()
        result = PrizePicksAPIResponse(
            data=[RawPrizePicksProjection(**item) for item in api_data.get('data', [])],
            included=api_data.get('included', [])
        )
        _projections_cache['data'] = result
        _projections_cache['timestamp'] = now
        return result
    except Exception as e:
        logger.logger.error(f"PrizePicks service: Exception occurred: {e}")
        # Try to load from local sample file
        if os.path.exists(SAMPLE_FILE_PATH):
            try:
                with open(SAMPLE_FILE_PATH, 'r') as f:
                    sample_data = json.load(f)
                result = PrizePicksAPIResponse(
                    data=[RawPrizePicksProjection(**item) for item in sample_data.get('data', [])],
                    included=sample_data.get('included', [])
                )
                logger.logger.info("PrizePicks service: Served fallback sample_prizepicks.json data.")
                return result
            except Exception as sample_e:
                logger.logger.error(f"PrizePicks service: Failed to load sample_prizepicks.json: {sample_e}")
        if _projections_cache['data']:
            return _projections_cache['data']
        raise HTTPException(status_code=503, detail="Failed to fetch PrizePicks data and no fallback available.")

def fetch_player_from_api(player_id: str) -> Dict[str, Any]: # Returns the 'data' part of the player response
    """Fetches a single player by ID from the PrizePicks API."""
    session = _get_prizepicks_session()
    url = f"{PRIZEPICKS_PLAYERS_URL}/{player_id}"
    response_text_for_error = ""
    response_status_for_error = 0
    try:
        logger.logger.info(f"PrizePicks service: Fetching player from API: {url}")
        response = session.get(url, timeout=10)
        response_text_for_error = response.text
        response_status_for_error = response.status_code
        response.raise_for_status()
        player_data = response.json()
        if 'data' not in player_data:
            logger.logger.warning(f"Player data for {player_id} missing 'data' field. Response: {player_data}")
            raise HTTPException(status_code=404, detail=f"Player {player_id} data format unexpected.")
        return player_data['data'] # Usually the response is like { "data": { player_attributes ... } }
    except requests.exceptions.HTTPError as http_err:
        if response_status_for_error == 404:
            logger.logger.warning(f"PrizePicks service: Player {player_id} not found. Status: {response_status_for_error}")
            raise HTTPException(status_code=404, detail=f"Player {player_id} not found.")
        logger.logger.error(f"PrizePicks service: HTTP error for player {player_id}: {http_err} - Status: {response_status_for_error} - Response: {response_text_for_error[:500]}")
        raise HTTPException(status_code=response_status_for_error, detail=f"Failed to fetch player {player_id}.")
    except requests.exceptions.RequestException as req_err:
        logger.logger.error(f"PrizePicks service: Request exception for player {player_id}: {req_err}")
        raise HTTPException(status_code=503, detail=f"Failed to connect to PrizePicks for player {player_id}.")
    except ValueError as json_err:
        logger.logger.error(f"PrizePicks service: Failed to parse JSON for player {player_id}: {json_err} - Response: {response_text_for_error[:500]}")
        raise HTTPException(status_code=500, detail=f"Failed to parse PrizePicks data for player {player_id}.")

def fetch_single_projection_from_api(projection_id: str) -> RawPrizePicksProjection:
    """Fetches a single projection by ID from the PrizePicks API."""
    session = _get_prizepicks_session()
    url = f"{PRIZEPICKS_API_URL}/{projection_id}" # Main projections endpoint with ID
    response_text_for_error = ""
    response_status_for_error = 0
    try:
        logger.logger.info(f"PrizePicks service: Fetching single projection from API: {url}")
        response = session.get(url, timeout=10)
        response_text_for_error = response.text
        response_status_for_error = response.status_code
        response.raise_for_status()
        projection_api_data = response.json()
        if 'data' not in projection_api_data or not isinstance(projection_api_data['data'], dict):
            logger.logger.warning(f"Projection data for {projection_id} missing 'data' field or not a dict. Response: {projection_api_data}")
            raise HTTPException(status_code=404, detail=f"Projection {projection_id} data format unexpected.")
        # The single projection response is { data: projection_object, included: [...] }
        # We want to return the projection_object which matches RawPrizePicksProjection structure.
        return RawPrizePicksProjection(**projection_api_data['data']) # Construct and return
    except requests.exceptions.HTTPError as http_err:
        if response_status_for_error == 404:
            logger.logger.warning(f"PrizePicks service: Projection {projection_id} not found. Status: {response_status_for_error}")
            raise HTTPException(status_code=404, detail=f"Projection {projection_id} not found.")
        logger.logger.error(f"PrizePicks service: HTTP error for projection {projection_id}: {http_err} - Status: {response_status_for_error} - Response: {response_text_for_error[:500]}")
        raise HTTPException(status_code=response_status_for_error, detail=f"Failed to fetch projection {projection_id}.")
    except requests.exceptions.RequestException as req_err:
        logger.logger.error(f"PrizePicks service: Request exception for projection {projection_id}: {req_err}")
        raise HTTPException(status_code=503, detail=f"Failed to connect to PrizePicks for projection {projection_id}.")
    except ValueError as json_err:
        logger.logger.error(f"PrizePicks service: Failed to parse JSON for projection {projection_id}: {json_err} - Response: {response_text_for_error[:500]}")
        raise HTTPException(status_code=500, detail=f"Failed to parse PrizePicks data for projection {projection_id}.")

# Example of how this service might be used in a route:
# from ..services import prizepicks_service
# @router.get("/prizepicks/projections")
# async def get_prizepicks_projections_route(league_id: Optional[str] = Query("7", description="League ID, e.g., 7 for NBA")):
#     try:
#         data = prizepicks_service.fetch_projections_from_api(league_id=league_id)
#         return data # FastAPI will serialize PrizePicksAPIResponse
#     except HTTPException as e:
#         raise e # Re-raise HTTPException to let FastAPI handle it
#     except Exception as e:
#         logger.logger.error(f"Unhandled error in prizepicks projections route: {e}", exc_info=True)
#         raise HTTPException(status_code=500, detail="Internal server error fetching PrizePicks projections.") 