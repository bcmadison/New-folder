import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import custom modules
from backend.api.main import app
from backend.database.models import Base, Match, Player, Team, Prediction
from backend.database.operations import DatabaseOperations
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

# Create test database
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def test_db():
    """Create test database and tables"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        os.remove("./test.db")

@pytest.fixture
def client(test_db):
    """Create test client"""
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

@pytest.fixture
def sample_data(test_db):
    """Create sample data in test database"""
    # Create teams
    teams = [
        Team(id=1, name="Manchester United", league="Premier League"),
        Team(id=2, name="Liverpool", league="Premier League"),
        Team(id=3, name="Arsenal", league="Premier League")
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
            match_date=datetime.now() + timedelta(days=i),
            home_score=None,
            away_score=None
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

def test_root_endpoint(client):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["message"] == "AI Sports Betting Analytics API"

def test_predict_match(client, sample_data):
    """Test match prediction endpoint"""
    # Test valid prediction request
    response = client.post(
        "/predict",
        json={
            "home_team_id": 1,
            "away_team_id": 2,
            "match_date": (datetime.now() + timedelta(days=1)).isoformat()
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "confidence" in data
    assert 0 <= data["prediction"]["home_win_prob"] <= 1
    assert 0 <= data["prediction"]["draw_prob"] <= 1
    assert 0 <= data["prediction"]["away_win_prob"] <= 1
    assert 0 <= data["confidence"] <= 1
    
    # Test invalid team IDs
    response = client.post(
        "/predict",
        json={
            "home_team_id": 999,
            "away_team_id": 2,
            "match_date": (datetime.now() + timedelta(days=1)).isoformat()
        }
    )
    assert response.status_code == 404
    
    # Test missing required fields
    response = client.post(
        "/predict",
        json={
            "home_team_id": 1,
            "away_team_id": 2
        }
    )
    assert response.status_code == 422

def test_get_similar_players(client, sample_data):
    """Test similar players endpoint"""
    # Test valid request
    response = client.get("/players/similar/player1")
    assert response.status_code == 200
    data = response.json()
    assert "similar_players" in data
    assert len(data["similar_players"]) > 0
    assert all("player_id" in p for p in data["similar_players"])
    assert all("similarity" in p for p in data["similar_players"])
    
    # Test invalid player ID
    response = client.get("/players/similar/invalid_player")
    assert response.status_code == 404

def test_get_team_sentiment(client, sample_data):
    """Test team sentiment endpoint"""
    # Test valid request
    response = client.get("/teams/1/sentiment")
    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert "confidence" in data
    assert "volume" in data
    assert 0 <= data["overall_score"] <= 1
    assert 0 <= data["confidence"] <= 1
    assert data["volume"] >= 0
    
    # Test invalid team ID
    response = client.get("/teams/999/sentiment")
    assert response.status_code == 404

def test_get_model_info(client):
    """Test model information endpoint"""
    response = client.get("/models/info")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert "accuracy" in data
    assert "last_trained" in data
    assert "features" in data
    assert isinstance(data["features"], list)

def test_get_prediction_history(client, sample_data):
    """Test prediction history endpoint"""
    # Test valid request
    response = client.get("/predictions/history")
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) > 0
    assert all("match_id" in p for p in data["predictions"])
    assert all("confidence" in p for p in data["predictions"])
    
    # Test filtering
    response = client.get("/predictions/history?min_confidence=0.8")
    assert response.status_code == 200
    data = response.json()
    assert all(p["confidence"] >= 0.8 for p in data["predictions"])

def test_update_match_result(client, sample_data):
    """Test match result update endpoint"""
    # Test valid update
    response = client.put(
        "/matches/1/result",
        json={
            "home_score": 2,
            "away_score": 1
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "Match result updated successfully"
    
    # Test invalid match ID
    response = client.put(
        "/matches/999/result",
        json={
            "home_score": 2,
            "away_score": 1
        }
    )
    assert response.status_code == 404
    
    # Test invalid score values
    response = client.put(
        "/matches/1/result",
        json={
            "home_score": -1,
            "away_score": 1
        }
    )
    assert response.status_code == 422

def test_error_handling(client):
    """Test error handling"""
    # Test 404 error
    response = client.get("/nonexistent")
    assert response.status_code == 404
    assert "detail" in response.json()
    
    # Test 422 error (validation error)
    response = client.post(
        "/predict",
        json={
            "home_team_id": "invalid",
            "away_team_id": 2,
            "match_date": "invalid_date"
        }
    )
    assert response.status_code == 422
    assert "detail" in response.json()
    
    # Test 500 error (server error)
    # This would require mocking a server error condition
    # For now, we'll just test that the error handler exists
    assert hasattr(app, "exception_handlers")
    assert 500 in app.exception_handlers 