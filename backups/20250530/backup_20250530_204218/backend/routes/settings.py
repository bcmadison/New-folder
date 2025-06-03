from fastapi import APIRouter
import requests
from bs4 import BeautifulSoup

router = APIRouter()

@router.get("/api/settings")
async def get_settings():
    # Example: return realistic, non-empty settings
    return {
        "social_sentiment_enabled": True,
        "volatility_detection": True,
        "prediction_confidence_threshold": 0.75,
        "auto_refresh": False,
        "preferred_theme": "system"
    }

@router.get("/api/prizepicks")
def get_prizepicks_lines():
    url = "https://app.prizepicks.com/projections"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json, text/plain, */*"
    }
    session = requests.Session()
    # Get the main page to establish cookies/session
    session.get(url, headers=headers)
    # PrizePicks data is loaded via XHR to this endpoint:
    api_url = "https://api.prizepicks.com/projections"
    params = {"league_id": "7", "per_page": 1000}  # NBA league_id=7, adjust as needed
    resp = session.get(api_url, headers=headers, params=params)
    if resp.status_code != 200:
        return {"error": "Failed to fetch PrizePicks data"}
    data = resp.json()
    # Parse player lines
    lines = []
    for projection in data.get("data", []):
        player = projection.get("attributes", {}).get("name")
        stat_type = projection.get("attributes", {}).get("stat_type")
        line_score = projection.get("attributes", {}).get("line_score")
        team = projection.get("attributes", {}).get("team")
        sport = projection.get("attributes", {}).get("league")
        if player and stat_type and line_score:
            lines.append({
                "player": player,
                "line": line_score,
                "stat": stat_type,
                "team": team,
                "sport": sport
            })
    return {"lines": lines}