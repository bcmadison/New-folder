from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import custom modules
from advanced.meta_model import MetaModel
from advanced.player_embeddings import PlayerEmbeddings
from advanced.social_sentiment import SocialSentimentAnalyzer
from advanced.train_predict import ModelTrainer

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI Sports Betting Analytics API",
    description="API for sports betting analytics powered by AI and machine learning",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
model_trainer = ModelTrainer(model_dir=os.getenv('MODEL_DIR'))
player_embeddings = PlayerEmbeddings(embedding_dim=int(os.getenv('EMBEDDING_DIM')))
sentiment_analyzer = SocialSentimentAnalyzer()

# Load models
try:
    model_trainer.load_models()
    player_embeddings.load_model(os.path.join(os.getenv('MODEL_DIR'), 'player_embeddings'))
except Exception as e:
    print(f"Warning: Error loading models: {e}")

# Pydantic models for request/response validation
class MatchPrediction(BaseModel):
    home_team: str
    away_team: str
    match_date: datetime
    home_goals_avg: float
    home_goals_against_avg: float
    away_goals_avg: float
    away_goals_against_avg: float

class PlayerSimilarity(BaseModel):
    player_id: str
    top_k: Optional[int] = 5

class TeamSentiment(BaseModel):
    team: str
    days_back: Optional[int] = 7

# API endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to the AI Sports Betting Analytics API"}

@app.post("/predict")
async def predict_match(prediction: MatchPrediction):
    """Predict match outcome"""
    try:
        # Prepare features
        features = pd.DataFrame([{
            'home_goals_avg': prediction.home_goals_avg,
            'home_goals_against_avg': prediction.home_goals_against_avg,
            'away_goals_avg': prediction.away_goals_avg,
            'away_goals_against_avg': prediction.away_goals_against_avg,
            'day_of_week': prediction.match_date.weekday(),
            'month': prediction.match_date.month,
            'year': prediction.match_date.year
        }])
        
        # Get prediction
        predictions, probabilities = model_trainer.predict(features)
        
        # Get sentiment scores
        sentiment_scores = sentiment_analyzer.aggregate_sentiment(prediction.home_team)
        
        return {
            "prediction": int(predictions[0]),
            "probability": float(probabilities[0][1]),
            "sentiment_score": sentiment_scores['overall_score'],
            "sentiment_confidence": sentiment_scores['confidence']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/similar-players")
async def get_similar_players(request: PlayerSimilarity):
    """Get similar players based on embeddings"""
    try:
        # Load player embeddings
        player_embeddings.load_model(os.path.join(os.getenv('MODEL_DIR'), 'player_embeddings'))
        
        # Get similar players
        similar_players = player_embeddings.get_similar_players(
            request.player_id,
            player_embeddings.get_embeddings(pd.DataFrame()),  # Load from saved embeddings
            request.top_k
        )
        
        return {"similar_players": similar_players}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/team-sentiment")
async def get_team_sentiment(request: TeamSentiment):
    """Get team sentiment analysis"""
    try:
        # Get sentiment scores
        sentiment_scores = sentiment_analyzer.aggregate_sentiment(request.team)
        
        return {
            "team": request.team,
            "sentiment_score": sentiment_scores['overall_score'],
            "confidence": sentiment_scores['confidence'],
            "volume": sentiment_scores['volume']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info")
async def get_model_info():
    """Get information about trained models"""
    try:
        # Get model information
        model_info = {
            "prediction_model": {
                "feature_importance": model_trainer.feature_importance,
                "last_training": None
            },
            "player_embeddings": {
                "embedding_dim": int(os.getenv('EMBEDDING_DIM')),
                "last_training": None
            }
        }
        
        # Get last training dates
        last_training_file = os.path.join(os.getenv('MODEL_DIR'), 'last_training.txt')
        if os.path.exists(last_training_file):
            with open(last_training_file, 'r') as f:
                last_training = f.read().strip()
                model_info["prediction_model"]["last_training"] = last_training
                model_info["player_embeddings"]["last_training"] = last_training
        
        return model_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv('API_HOST', '0.0.0.0'),
        port=int(os.getenv('API_PORT', 8000)),
        reload=os.getenv('DEBUG', 'False').lower() == 'true'
    ) 