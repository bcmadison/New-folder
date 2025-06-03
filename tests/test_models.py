import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import custom modules
from backend.advanced.meta_model import MetaModel
from backend.advanced.player_embeddings import PlayerEmbeddings
from backend.advanced.social_sentiment import SocialSentimentAnalyzer
from backend.advanced.train_predict import ModelTrainer

# Load environment variables
load_dotenv()

@pytest.fixture
def sample_data():
    """Create sample data for testing"""
    # Create sample match data
    matches_df = pd.DataFrame({
        'id': range(1, 11),
        'home_team_id': [1, 2, 1, 3, 2, 1, 3, 2, 1, 3],
        'away_team_id': [2, 1, 3, 1, 3, 2, 1, 3, 2, 1],
        'match_date': [datetime.now() - timedelta(days=i) for i in range(10)],
        'home_score': [2, 1, 3, 0, 2, 1, 2, 0, 3, 1],
        'away_score': [1, 2, 1, 2, 1, 2, 0, 3, 1, 2]
    })
    
    # Create sample player stats
    player_stats_df = pd.DataFrame({
        'player_id': [f'player{i}' for i in range(1, 6)],
        'match_id': [1, 2, 3, 4, 5],
        'goals': [1, 0, 2, 1, 0],
        'assists': [1, 2, 0, 1, 1],
        'minutes_played': [90, 90, 90, 90, 90]
    })
    
    # Create sample team data
    teams_df = pd.DataFrame({
        'id': range(1, 4),
        'name': ['Team A', 'Team B', 'Team C'],
        'league': ['Premier League'] * 3
    })
    
    return matches_df, player_stats_df, teams_df

def test_model_trainer(sample_data):
    """Test ModelTrainer class"""
    matches_df, player_stats_df, teams_df = sample_data
    
    # Initialize trainer
    trainer = ModelTrainer(model_dir='test_models')
    
    # Prepare features
    features = pd.DataFrame({
        'home_goals_avg': [2.0, 1.5, 2.5],
        'home_goals_against_avg': [1.0, 1.5, 1.0],
        'away_goals_avg': [1.5, 2.0, 1.0],
        'away_goals_against_avg': [1.5, 1.0, 1.5],
        'day_of_week': [0, 1, 2],
        'month': [1, 1, 1],
        'year': [2024, 2024, 2024],
        'target': [1, 0, 1]
    })
    
    # Train models
    best_model, accuracy = trainer.train_models(features, 'target')
    assert best_model in ['rf', 'gb', 'xgb', 'lgb']
    assert 0 <= accuracy <= 1
    
    # Test prediction
    test_features = features.drop(columns=['target'])
    predictions, probabilities = trainer.predict(test_features)
    assert len(predictions) == len(test_features)
    assert len(probabilities) == len(test_features)
    assert all(0 <= p <= 1 for p in predictions)
    assert all(0 <= p <= 1 for p in probabilities.max(axis=1))

def test_player_embeddings(sample_data):
    """Test PlayerEmbeddings class"""
    _, player_stats_df, _ = sample_data
    
    # Initialize embeddings
    embeddings = PlayerEmbeddings(embedding_dim=16)
    
    # Train model
    embeddings.train_model(player_stats_df)
    
    # Get embeddings
    player_embeddings = embeddings.get_embeddings(player_stats_df)
    assert len(player_embeddings) == len(player_stats_df)
    assert all(len(emb) == 16 for emb in player_embeddings.values())
    
    # Test similar players
    similar_players = embeddings.get_similar_players(
        'player1',
        player_embeddings,
        top_k=2
    )
    assert len(similar_players) <= 2
    assert all(isinstance(p[0], str) for p in similar_players)
    assert all(0 <= p[1] <= 1 for p in similar_players)

def test_social_sentiment():
    """Test SocialSentimentAnalyzer class"""
    # Initialize analyzer
    analyzer = SocialSentimentAnalyzer()
    
    # Test sentiment analysis
    sentiment = analyzer.aggregate_sentiment('Manchester United')
    assert 'overall_score' in sentiment
    assert 'confidence' in sentiment
    assert 'volume' in sentiment
    
    assert 0 <= sentiment['overall_score'] <= 1
    assert 0 <= sentiment['confidence'] <= 1
    assert sentiment['volume'] >= 0

def test_meta_model(sample_data):
    """Test MetaModel class"""
    matches_df, player_stats_df, teams_df = sample_data
    
    # Initialize model
    model = MetaModel()
    
    # Test prediction
    prediction = model.predict_optimal_lineup(
        matches_df,
        player_stats_df,
        teams_df
    )
    
    assert isinstance(prediction, pd.DataFrame)
    assert 'prediction' in prediction.columns
    assert 'confidence' in prediction.columns
    assert all(0 <= p <= 1 for p in prediction['prediction'])
    assert all(0 <= c <= 1 for c in prediction['confidence'])

def test_model_saving_loading(sample_data):
    """Test model saving and loading"""
    matches_df, player_stats_df, teams_df = sample_data
    
    # Initialize and train models
    trainer = ModelTrainer(model_dir='test_models')
    features = pd.DataFrame({
        'home_goals_avg': [2.0, 1.5, 2.5],
        'home_goals_against_avg': [1.0, 1.5, 1.0],
        'away_goals_avg': [1.5, 2.0, 1.0],
        'away_goals_against_avg': [1.5, 1.0, 1.5],
        'day_of_week': [0, 1, 2],
        'month': [1, 1, 1],
        'year': [2024, 2024, 2024],
        'target': [1, 0, 1]
    })
    trainer.train_models(features, 'target')
    
    # Save models
    trainer.save_models()
    
    # Load models
    new_trainer = ModelTrainer(model_dir='test_models')
    new_trainer.load_models()
    
    # Compare predictions
    test_features = features.drop(columns=['target'])
    original_preds, _ = trainer.predict(test_features)
    loaded_preds, _ = new_trainer.predict(test_features)
    
    assert np.array_equal(original_preds, loaded_preds)

def test_invalid_data():
    """Test handling of invalid data"""
    # Initialize trainer
    trainer = ModelTrainer(model_dir='test_models')
    
    # Test with empty DataFrame
    with pytest.raises(ValueError):
        trainer.train_models(pd.DataFrame(), 'target')
    
    # Test with missing target column
    features = pd.DataFrame({
        'home_goals_avg': [2.0, 1.5, 2.5],
        'home_goals_against_avg': [1.0, 1.5, 1.0]
    })
    with pytest.raises(ValueError):
        trainer.train_models(features, 'target')
    
    # Test with invalid feature values
    features['home_goals_avg'] = ['invalid', 1.5, 2.5]
    with pytest.raises(ValueError):
        trainer.train_models(features, 'target') 