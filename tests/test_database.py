import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import custom modules
from backend.database.models import Base, Match, Player, Team, Prediction
from backend.database.operations import DatabaseOperations

# Load environment variables
load_dotenv()

@pytest.fixture
def test_db():
    """Create a test database"""
    # Create test database URL
    test_db_url = "sqlite:///test.db"
    
    # Create engine and session
    engine = create_engine(test_db_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Create tables
    Base.metadata.create_all(engine)
    
    yield session
    
    # Clean up
    session.close()
    Base.metadata.drop_all(engine)
    os.remove("test.db")

@pytest.fixture
def sample_data(test_db):
    """Create sample data in test database"""
    # Create teams
    teams = [
        Team(id=1, name="Team A", league="Premier League"),
        Team(id=2, name="Team B", league="Premier League"),
        Team(id=3, name="Team C", league="Premier League")
    ]
    test_db.add_all(teams)
    
    # Create players
    players = [
        Player(id=f"player{i}", name=f"Player {i}", team_id=i%3+1)
        for i in range(1, 6)
    ]
    test_db.add_all(players)
    
    # Create matches
    matches = [
        Match(
            id=i,
            home_team_id=i%3+1,
            away_team_id=(i+1)%3+1,
            match_date=datetime.now() - timedelta(days=i),
            home_score=i%3,
            away_score=(i+1)%3
        )
        for i in range(1, 11)
    ]
    test_db.add_all(matches)
    
    # Create predictions
    predictions = [
        Prediction(
            match_id=i,
            home_win_prob=0.6,
            draw_prob=0.2,
            away_win_prob=0.2,
            confidence=0.8,
            model_version="1.0"
        )
        for i in range(1, 11)
    ]
    test_db.add_all(predictions)
    
    test_db.commit()
    return test_db

def test_database_operations(sample_data):
    """Test DatabaseOperations class"""
    # Initialize operations
    db_ops = DatabaseOperations(sample_data)
    
    # Test get_recent_matches
    matches = db_ops.get_recent_matches(limit=5)
    assert len(matches) == 5
    assert all(isinstance(m, Match) for m in matches)
    
    # Test get_team_stats
    team_stats = db_ops.get_team_stats(1)
    assert isinstance(team_stats, dict)
    assert 'goals_scored' in team_stats
    assert 'goals_conceded' in team_stats
    assert 'win_rate' in team_stats
    
    # Test get_player_stats
    player_stats = db_ops.get_player_stats("player1")
    assert isinstance(player_stats, dict)
    assert 'goals' in player_stats
    assert 'assists' in player_stats
    assert 'minutes_played' in player_stats
    
    # Test save_prediction
    new_prediction = {
        'match_id': 11,
        'home_win_prob': 0.7,
        'draw_prob': 0.2,
        'away_win_prob': 0.1,
        'confidence': 0.85,
        'model_version': "1.0"
    }
    db_ops.save_prediction(new_prediction)
    
    # Verify prediction was saved
    saved_prediction = sample_data.query(Prediction).filter_by(match_id=11).first()
    assert saved_prediction is not None
    assert saved_prediction.home_win_prob == 0.7
    assert saved_prediction.confidence == 0.85

def test_data_validation(sample_data):
    """Test data validation in database operations"""
    db_ops = DatabaseOperations(sample_data)
    
    # Test invalid team ID
    with pytest.raises(ValueError):
        db_ops.get_team_stats(999)
    
    # Test invalid player ID
    with pytest.raises(ValueError):
        db_ops.get_player_stats("invalid_player")
    
    # Test invalid prediction data
    invalid_prediction = {
        'match_id': 999,  # Non-existent match
        'home_win_prob': 0.7,
        'draw_prob': 0.2,
        'away_win_prob': 0.1,
        'confidence': 0.85,
        'model_version': "1.0"
    }
    with pytest.raises(ValueError):
        db_ops.save_prediction(invalid_prediction)

def test_data_aggregation(sample_data):
    """Test data aggregation functions"""
    db_ops = DatabaseOperations(sample_data)
    
    # Test get_league_stats
    league_stats = db_ops.get_league_stats("Premier League")
    assert isinstance(league_stats, dict)
    assert 'total_matches' in league_stats
    assert 'avg_goals' in league_stats
    assert 'home_win_rate' in league_stats
    
    # Test get_player_rankings
    player_rankings = db_ops.get_player_rankings(limit=3)
    assert len(player_rankings) == 3
    assert all(isinstance(p, dict) for p in player_rankings)
    assert all('player_id' in p for p in player_rankings)
    assert all('goals' in p for p in player_rankings)
    
    # Test get_team_rankings
    team_rankings = db_ops.get_team_rankings(limit=3)
    assert len(team_rankings) == 3
    assert all(isinstance(t, dict) for t in team_rankings)
    assert all('team_id' in t for t in team_rankings)
    assert all('points' in t for t in team_rankings)

def test_transaction_handling(sample_data):
    """Test transaction handling"""
    db_ops = DatabaseOperations(sample_data)
    
    # Test successful transaction
    try:
        with db_ops.transaction():
            new_prediction = {
                'match_id': 12,
                'home_win_prob': 0.7,
                'draw_prob': 0.2,
                'away_win_prob': 0.1,
                'confidence': 0.85,
                'model_version': "1.0"
            }
            db_ops.save_prediction(new_prediction)
    except Exception:
        pytest.fail("Transaction failed unexpectedly")
    
    # Verify prediction was saved
    saved_prediction = sample_data.query(Prediction).filter_by(match_id=12).first()
    assert saved_prediction is not None
    
    # Test failed transaction
    with pytest.raises(ValueError):
        with db_ops.transaction():
            invalid_prediction = {
                'match_id': 999,
                'home_win_prob': 0.7,
                'draw_prob': 0.2,
                'away_win_prob': 0.1,
                'confidence': 0.85,
                'model_version': "1.0"
            }
            db_ops.save_prediction(invalid_prediction)
    
    # Verify no invalid prediction was saved
    invalid_saved = sample_data.query(Prediction).filter_by(match_id=999).first()
    assert invalid_saved is None 