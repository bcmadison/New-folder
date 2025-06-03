from typing import Dict, List, Optional
import aiohttp
import asyncio
import logging
from datetime import datetime, timedelta
import json

class DataService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.session = None
        self.cache = {}
        self.cache_ttl = timedelta(minutes=5)

    async def initialize(self):
        """Initialize the aiohttp session."""
        if self.session is None:
            self.session = aiohttp.ClientSession()

    async def close(self):
        """Close the aiohttp session."""
        if self.session:
            await self.session.close()
            self.session = None

    async def fetch_prizepicks_data(self) -> Dict:
        """Fetch data from PrizePicks API."""
        try:
            await self.initialize()
            async with self.session.get('https://api.prizepicks.com/props') as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    raise Exception(f"PrizePicks API returned status {response.status}")
        except Exception as e:
            self.logger.error(f"Error fetching PrizePicks data: {str(e)}")
            raise

    async def fetch_espn_data(self) -> Dict:
        """Fetch data from ESPN API."""
        try:
            await self.initialize()
            async with self.session.get('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard') as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    raise Exception(f"ESPN API returned status {response.status}")
        except Exception as e:
            self.logger.error(f"Error fetching ESPN data: {str(e)}")
            raise

    async def fetch_odds_data(self) -> Dict:
        """Fetch data from The Odds API."""
        try:
            await self.initialize()
            api_key = "YOUR_API_KEY"  # Should be loaded from environment
            async with self.session.get(
                f'https://api.the-odds-api.com/v4/sports/basketball_nba/odds',
                params={'apiKey': api_key}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    raise Exception(f"The Odds API returned status {response.status}")
        except Exception as e:
            self.logger.error(f"Error fetching odds data: {str(e)}")
            raise

    def get_cached_data(self, key: str) -> Optional[Dict]:
        """Get data from cache if it's still valid."""
        if key in self.cache:
            timestamp, data = self.cache[key]
            if datetime.now() - timestamp < self.cache_ttl:
                return data
        return None

    def set_cached_data(self, key: str, data: Dict):
        """Store data in cache with timestamp."""
        self.cache[key] = (datetime.now(), data)

    async def aggregate_data(self) -> Dict:
        """Aggregate data from all sources."""
        try:
            # Check cache first
            cached_data = self.get_cached_data('aggregated')
            if cached_data:
                return cached_data

            # Fetch data from all sources concurrently
            prizepicks_task = self.fetch_prizepicks_data()
            espn_task = self.fetch_espn_data()
            odds_task = self.fetch_odds_data()

            prizepicks_data, espn_data, odds_data = await asyncio.gather(
                prizepicks_task,
                espn_task,
                odds_task
            )

            # Combine and process data
            aggregated_data = {
                'prizepicks': prizepicks_data,
                'espn': espn_data,
                'odds': odds_data,
                'timestamp': datetime.now().isoformat()
            }

            # Cache the result
            self.set_cached_data('aggregated', aggregated_data)

            return aggregated_data
        except Exception as e:
            self.logger.error(f"Error aggregating data: {str(e)}")
            raise

    async def get_player_stats(self, player_id: str) -> Dict:
        """Get detailed stats for a specific player."""
        try:
            await self.initialize()
            # Implement player stats fetching logic
            # This is a placeholder - implement actual API calls
            return {
                'player_id': player_id,
                'stats': {},
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error fetching player stats: {str(e)}")
            raise 