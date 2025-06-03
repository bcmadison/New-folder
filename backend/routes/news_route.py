from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from pydantic import BaseModel
import aiohttp
import feedparser
import os
import time
import logging
from functools import lru_cache
from dotenv import load_dotenv

# Load .env for API keys if needed
load_dotenv()

router = APIRouter()
logger = logging.getLogger("news_route")

# In-memory cache for headlines (source -> (timestamp, headlines))
NEWS_CACHE = {}
CACHE_TTL = 300  # seconds

class ESPNHeadline(BaseModel):
    id: str
    title: str
    summary: str
    link: str
    publishedAt: str  # ISO date string
    source: str
    imageUrl: Optional[str] = None
    category: Optional[str] = None

async def fetch_espn_rss_headlines(limit: int = 10) -> List[ESPNHeadline]:
    """Fetch headlines from ESPN's public RSS feed."""
    url = "https://www.espn.com/espn/rss/news"
    try:
        feed = feedparser.parse(url)
        headlines = []
        for entry in feed.entries[:limit]:
            headlines.append(ESPNHeadline(
                id=entry.get('id', entry.get('link', 'espn_' + entry.get('title', ''))),
                title=entry.get('title', ''),
                summary=entry.get('summary', ''),
                link=entry.get('link', ''),
                publishedAt=entry.get('published', ''),
                source='ESPN',
                imageUrl=None,  # ESPN RSS may not provide image
                category=entry.get('category', None)
            ))
        return headlines
    except Exception as e:
        logger.error(f"Error fetching ESPN RSS: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to fetch ESPN news.")

async def fetch_reddit_headlines(limit: int = 10, subreddit: str = "sportsbook") -> List[ESPNHeadline]:
    """Fetch top posts from a sports betting subreddit."""
    import asyncpraw
    REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
    REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
    REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "betbot-news/0.1")
    if not (REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET):
        logger.warning("Reddit API keys not set in .env. Skipping Reddit news.")
        return []
    try:
        reddit = asyncpraw.Reddit(
            client_id=REDDIT_CLIENT_ID,
            client_secret=REDDIT_CLIENT_SECRET,
            user_agent=REDDIT_USER_AGENT
        )
        headlines = []
        subreddit_obj = await reddit.subreddit(subreddit)
        async for post in subreddit_obj.hot(limit=limit):
            headlines.append(ESPNHeadline(
                id=post.id,
                title=post.title,
                summary=post.selftext[:200] if post.selftext else '',
                link=f"https://reddit.com{post.permalink}",
                publishedAt=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(post.created_utc)),
                source=f"Reddit/{subreddit}",
                imageUrl=post.url if post.url and post.url.endswith(('.jpg', '.png', '.jpeg')) else None,
                category=None
            ))
        await reddit.close()
        return headlines
    except Exception as e:
        logger.error(f"Error fetching Reddit headlines: {e}", exc_info=True)
        return []

async def get_cached_headlines(source: str, limit: int) -> List[ESPNHeadline]:
    now = time.time()
    cache_key = f"{source}:{limit}"
    if cache_key in NEWS_CACHE:
        ts, headlines = NEWS_CACHE[cache_key]
        if now - ts < CACHE_TTL:
            logger.info(f"Returning cached headlines for {source} (limit {limit})")
            return headlines
    # Fetch fresh
    if source == "espn":
        headlines = await fetch_espn_rss_headlines(limit)
    elif source == "reddit":
        headlines = await fetch_reddit_headlines(limit)
    else:
        raise HTTPException(status_code=404, detail=f"News source '{source}' not found or not implemented.")
    NEWS_CACHE[cache_key] = (now, headlines)
    return headlines

@router.get("/news/headlines", response_model=List[ESPNHeadline], summary="Get News Headlines")
async def get_news_headlines(
    source: Optional[str] = Query("espn", description="News source: espn, reddit"),
    limit: int = Query(10, description="Max headlines", ge=1, le=50)
):
    logger.info(f"Request for news headlines from source: {source}, limit: {limit}")
    try:
        headlines = await get_cached_headlines(source.lower(), limit)
        return headlines
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching headlines: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Could not fetch headlines from {source}.")

# Future: Add endpoint for article details if needed
# @router.get("/news/article/{article_id}")
# async def get_article_content(article_id: str):
#     # Fetch full article content logic
#     pass 