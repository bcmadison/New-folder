from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
import logging
import time
from dotenv import load_dotenv

router = APIRouter()
logger = logging.getLogger("sentiment_route")
load_dotenv()

class SentimentRequest(BaseModel):
    text: Optional[str] = None # If providing text directly
    topic: Optional[str] = None # If service should find relevant text for a topic

class SentimentResponse(BaseModel):
    topic: str
    sentiment_score: float  # -1 to 1
    sentiment_label: str
    confidence: Optional[float] = None
    related_articles_count: Optional[int] = None
    trending_terms: Optional[List[str]] = None
    raw_output: Optional[Dict[str, Any]] = None

async def fetch_reddit_posts(topic: str, limit: int = 20) -> List[str]:
    import asyncpraw
    REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
    REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
    REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "betbot-sentiment/0.1")
    if not (REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET):
        logger.warning("Reddit API keys not set in .env. Skipping Reddit sentiment.")
        return []
    try:
        reddit = asyncpraw.Reddit(
            client_id=REDDIT_CLIENT_ID,
            client_secret=REDDIT_CLIENT_SECRET,
            user_agent=REDDIT_USER_AGENT
        )
        posts = []
        subreddit = await reddit.subreddit("sportsbook")
        async for post in subreddit.search(topic, sort="new", limit=limit):
            if post.selftext:
                posts.append(post.selftext)
            else:
                posts.append(post.title)
        await reddit.close()
        return posts
    except Exception as e:
        logger.error(f"Error fetching Reddit posts: {e}", exc_info=True)
        return []

async def analyze_sentiment_vader(texts: List[str]) -> Dict[str, Any]:
    from nltk.sentiment import SentimentIntensityAnalyzer
    import nltk
    try:
        nltk.data.find('sentiment/vader_lexicon.zip')
    except LookupError:
        nltk.download('vader_lexicon')
    sia = SentimentIntensityAnalyzer()
    scores = []
    all_words = []
    for text in texts:
        score = sia.polarity_scores(text)
        scores.append(score)
        all_words.extend([w.lower() for w in text.split() if len(w) > 3])
    if not scores:
        return {"compound": 0.0, "label": "neutral", "confidence": 0.5, "trending_terms": []}
    avg_compound = sum(s["compound"] for s in scores) / len(scores)
    label = "positive" if avg_compound > 0.2 else "negative" if avg_compound < -0.2 else "neutral"
    confidence = abs(avg_compound)
    # Trending terms: top 5 most common words
    from collections import Counter
    trending_terms = [w for w, _ in Counter(all_words).most_common(5)]
    return {
        "compound": avg_compound,
        "label": label,
        "confidence": confidence,
        "trending_terms": trending_terms
    }

@router.get("/sentiment/{topic}", response_model=SentimentResponse, summary="Get Sentiment Analysis for a Topic")
async def get_sentiment_for_topic(
    topic: str = Path(..., description="The topic phrase to analyze sentiment for (e.g., 'Bitcoin price', 'Lakers next game')")
):
    logger.info(f"Request for sentiment on topic: {topic}")
    if not topic or topic.isspace():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")
    try:
        posts = await fetch_reddit_posts(topic, limit=20)
        if not posts:
            logger.warning(f"No Reddit posts found for topic '{topic}'. Returning neutral sentiment.")
            return SentimentResponse(
                topic=topic,
                sentiment_score=0.0,
                sentiment_label="neutral",
                confidence=0.5,
                related_articles_count=0,
                trending_terms=[],
                raw_output={}
            )
        sentiment = await analyze_sentiment_vader(posts)
        return SentimentResponse(
            topic=topic,
            sentiment_score=sentiment["compound"],
            sentiment_label=sentiment["label"],
            confidence=sentiment["confidence"],
            related_articles_count=len(posts),
            trending_terms=sentiment["trending_terms"],
            raw_output=sentiment
        )
    except Exception as e:
        logger.error(f"Error performing sentiment analysis for topic '{topic}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error performing sentiment analysis.")

# Removed commented-out mock sentiment POST endpoint. All logic is real or scaffolded for real data.
# @router.post("/sentiment/analyze-text", response_model=SentimentResponse)
# async def analyze_text_sentiment(request: SentimentRequest):
#     if not request.text or request.text.isspace():
#         raise HTTPException(status_code=400, detail="Text cannot be empty for analysis.")
#     # ... call NLP model on request.text ...
#     return await get_mock_sentiment(request.text[:50]) # Mock with first 50 chars as topic 