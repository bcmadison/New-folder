import os
import sys
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import custom modules
from advanced.meta_model import MetaModel
from advanced.player_embeddings import PlayerEmbeddings
from advanced.social_sentiment import SocialSentimentAnalyzer
from advanced.train_predict import ModelTrainer

# Load environment variables
load_dotenv()

def load_training_data():
    """Load and prepare training data"""
    try:
        # Load match data
        matches_df = pd.read_csv('backend/data/matches.csv')
        matches_df['match_date'] = pd.to_datetime(matches_df['match_date'])
        
        # Load player stats
        player_stats_df = pd.read_csv('backend/data/player_stats.csv')
        
        # Load team data
        teams_df = pd.read_csv('backend/data/teams.csv')
        
        return matches_df, player_stats_df, teams_df
    except Exception as e:
        print(f"Error loading training data: {e}")
        sys.exit(1)

def prepare_features(matches_df, player_stats_df, teams_df):
    """Prepare features for model training"""
    # Merge data
    df = matches_df.merge(
        player_stats_df,
        left_on='id',
        right_on='match_id',
        how='left'
    )
    
    # Add team features
    df = df.merge(
        teams_df,
        left_on='home_team_id',
        right_on='id',
        how='left',
        suffixes=('', '_home')
    )
    
    df = df.merge(
        teams_df,
        left_on='away_team_id',
        right_on='id',
        how='left',
        suffixes=('', '_away')
    )
    
    # Calculate rolling averages
    for team_id in df['home_team_id'].unique():
        team_matches = df[df['home_team_id'] == team_id].sort_values('match_date')
        df.loc[df['home_team_id'] == team_id, 'home_goals_avg'] = team_matches['home_score'].rolling(5, min_periods=1).mean()
        df.loc[df['home_team_id'] == team_id, 'home_goals_against_avg'] = team_matches['away_score'].rolling(5, min_periods=1).mean()
    
    for team_id in df['away_team_id'].unique():
        team_matches = df[df['away_team_id'] == team_id].sort_values('match_date')
        df.loc[df['away_team_id'] == team_id, 'away_goals_avg'] = team_matches['away_score'].rolling(5, min_periods=1).mean()
        df.loc[df['away_team_id'] == team_id, 'away_goals_against_avg'] = team_matches['home_score'].rolling(5, min_periods=1).mean()
    
    # Add time-based features
    df['day_of_week'] = df['match_date'].dt.dayofweek
    df['month'] = df['match_date'].dt.month
    df['year'] = df['match_date'].dt.year
    
    # Create target variable (1 if home team wins, 0 if away team wins or draw)
    df['target'] = (df['home_score'] > df['away_score']).astype(int)
    
    # Select features for training
    feature_cols = [
        'home_goals_avg', 'home_goals_against_avg',
        'away_goals_avg', 'away_goals_against_avg',
        'day_of_week', 'month', 'year'
    ]
    
    return df[feature_cols + ['target']]

def train_models():
    """Train all models"""
    try:
        # Load data
        matches_df, player_stats_df, teams_df = load_training_data()
        
        # Prepare features
        training_data = prepare_features(matches_df, player_stats_df, teams_df)
        
        # Train prediction model
        model_trainer = ModelTrainer(model_dir=os.getenv('MODEL_DIR'))
        best_model, accuracy = model_trainer.train_models(training_data, 'target')
        print(f"Best model: {best_model}, Accuracy: {accuracy:.4f}")
        
        # Train player embeddings
        player_embeddings = PlayerEmbeddings(embedding_dim=int(os.getenv('EMBEDDING_DIM')))
        player_embeddings.train_model(player_stats_df)
        player_embeddings.save_model(os.path.join(os.getenv('MODEL_DIR'), 'player_embeddings'))
        print("Player embeddings model trained and saved")
        
        # Initialize social sentiment analyzer
        sentiment_analyzer = SocialSentimentAnalyzer()
        print("Social sentiment analyzer initialized")
        
        # Save latest training date
        with open(os.path.join(os.getenv('MODEL_DIR'), 'last_training.txt'), 'w') as f:
            f.write(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        print("All models trained successfully")
        
    except Exception as e:
        print(f"Error training models: {e}")
        sys.exit(1)

if __name__ == "__main__":
    train_models() 