import os
import time
from typing import Dict, List, Optional, Any, Union
import httpx
from datetime import datetime, timedelta
import json
from functools import lru_cache
import asyncio
from ratelimit import limits, sleep_and_retry
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SportsAPIService:
    def __init__(self):
        # API Keys
        self.sportradar_key = os.getenv("SPORTRADAR_API_KEY")
        self.odds_api_key = os.getenv("ODDS_API_KEY")
        
        # Base URLs
        self.sportradar_base_url = "https://api.sportradar.com/soccer/v4"
        self.odds_api_base_url = "https://api.the-odds-api.com/v4"
        
        # Rate limiting
        self.sportradar_calls_per_minute = 60
        self.odds_api_calls_per_minute = 30
        
        # Cache settings
        self.cache_dir = Path("cache/sports_api")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_ttl = timedelta(minutes=5)
        
        # HTTP client
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    @sleep_and_retry
    @limits(calls=60, period=60)
    async def get_sportradar_data(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get data from Sportradar API with rate limiting."""
        try:
            url = f"{self.sportradar_base_url}/{endpoint}"
            params = params or {}
            params["api_key"] = self.sportradar_key
            
            # Check cache
            cache_key = f"sportradar_{endpoint}_{hash(str(params))}"
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Cache response
            self._save_to_cache(cache_key, data)
            
            return data
        except Exception as e:
            logger.error(f"Error fetching Sportradar data: {str(e)}")
            raise
    
    @sleep_and_retry
    @limits(calls=30, period=60)
    async def get_odds_data(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get data from The Odds API with rate limiting."""
        try:
            url = f"{self.odds_api_base_url}/{endpoint}"
            params = params or {}
            params["api_key"] = self.odds_api_key
            
            # Check cache
            cache_key = f"odds_{endpoint}_{hash(str(params))}"
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Cache response
            self._save_to_cache(cache_key, data)
            
            return data
        except Exception as e:
            logger.error(f"Error fetching Odds API data: {str(e)}")
            raise
    
    def _get_from_cache(self, key: str) -> Optional[Dict[str, Any]]:
        """Get data from cache if it exists and is not expired."""
        cache_file = self.cache_dir / f"{key}.json"
        if not cache_file.exists():
            return None
            
        try:
            with open(cache_file, "r") as f:
                cached_data = json.load(f)
                
            # Check if cache is expired
            cache_time = datetime.fromisoformat(cached_data["timestamp"])
            if datetime.now() - cache_time > self.cache_ttl:
                cache_file.unlink()
                return None
                
            return cached_data["data"]
        except Exception as e:
            logger.error(f"Error reading from cache: {str(e)}")
            return None
    
    def _save_to_cache(self, key: str, data: Dict[str, Any]) -> None:
        """Save data to cache with timestamp."""
        try:
            cache_file = self.cache_dir / f"{key}.json"
            cache_data = {
                "timestamp": datetime.now().isoformat(),
                "data": data
            }
            
            with open(cache_file, "w") as f:
                json.dump(cache_data, f)
        except Exception as e:
            logger.error(f"Error saving to cache: {str(e)}")
    
    async def get_live_matches(self) -> List[Dict[str, Any]]:
        """Get live matches from both APIs."""
        try:
            # Get live matches from Sportradar
            sportradar_matches = await self.get_sportradar_data("schedules/live.json")
            
            # Get live odds from The Odds API
            odds_data = await self.get_odds_data("sports/soccer/odds")
            
            # Combine and process data
            matches = []
            for match in sportradar_matches.get("sport_events", []):
                match_id = match["id"]
                odds = next((o for o in odds_data if o["id"] == match_id), None)
                
                if odds:
                    matches.append({
                        "id": match_id,
                        "home_team": match["competitors"][0]["name"],
                        "away_team": match["competitors"][1]["name"],
                        "start_time": match["scheduled"],
                        "status": match["status"],
                        "odds": odds["bookmakers"][0]["markets"][0]["outcomes"]
                    })
            
            return matches
        except Exception as e:
            logger.error(f"Error getting live matches: {str(e)}")
            raise
    
    async def get_match_history(self, team_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get match history for a team."""
        try:
            # Get match history from Sportradar
            history = await self.get_sportradar_data(
                f"teams/{team_id}/results.json",
                {"limit": limit}
            )
            
            return history.get("results", [])
        except Exception as e:
            logger.error(f"Error getting match history: {str(e)}")
            raise
    
    async def get_team_statistics(self, team_id: str) -> Dict[str, Any]:
        """Get team statistics."""
        try:
            # Get team statistics from Sportradar
            stats = await self.get_sportradar_data(
                f"teams/{team_id}/statistics.json"
            )
            
            return stats
        except Exception as e:
            logger.error(f"Error getting team statistics: {str(e)}")
            raise
    
    async def get_player_statistics(self, player_id: str) -> Dict[str, Any]:
        """Get player statistics."""
        try:
            # Get player statistics from Sportradar
            stats = await self.get_sportradar_data(
                f"players/{player_id}/statistics.json"
            )
            
            return stats
        except Exception as e:
            logger.error(f"Error getting player statistics: {str(e)}")
            raise
    
    async def get_league_standings(self, league_id: str) -> List[Dict[str, Any]]:
        """Get league standings."""
        try:
            # Get league standings from Sportradar
            standings = await self.get_sportradar_data(
                f"tournaments/{league_id}/standings.json"
            )
            
            return standings.get("standings", [])
        except Exception as e:
            logger.error(f"Error getting league standings: {str(e)}")
            raise
    
    async def get_historical_odds(self, match_id: str) -> List[Dict[str, Any]]:
        """Get historical odds for a match."""
        try:
            # Get historical odds from The Odds API
            odds = await self.get_odds_data(
                f"sports/soccer/odds/history/{match_id}"
            )
            
            return odds
        except Exception as e:
            logger.error(f"Error getting historical odds: {str(e)}")
            raise 