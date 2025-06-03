from sqlalchemy.orm import Session
from typing import List, Dict, Any
from fastapi.testclient import TestClient

from app.models.player import Player

def test_get_lineup(client: TestClient, db: Session) -> None:
    """Test getting available players for lineup building"""
    # Create test players
    players: List[Player] = [
        Player(
            id="1",
            name="Test Player 1",
            position="QB",
            team="TEAM1",
            salary=5000.0,
            projectedPoints=20.0,
            confidence=0.8,
            status="active"
        ),
        Player(
            id="2",
            name="Test Player 2",
            position="RB",
            team="TEAM2",
            salary=6000.0,
            projectedPoints=25.0,
            confidence=0.9,
            status="active"
        )
    ]
    for player in players:
        db.add(player)
    db.commit()

    # Test getting lineup
    response = client.get("/api/v1/lineup")
    assert response.status_code == 200
    data: List[Dict[str, Any]] = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "Test Player 1"
    assert data[1]["name"] == "Test Player 2"

def test_submit_lineup(client: TestClient, db: Session) -> None:
    """Test submitting a lineup"""
    # Create test players
    players: List[Player] = [
        Player(
            id="1",
            name="Test Player 1",
            position="QB",
            team="TEAM1",
            salary=5000.0,
            projectedPoints=20.0,
            confidence=0.8,
            status="active"
        ),
        Player(
            id="2",
            name="Test Player 2",
            position="RB",
            team="TEAM2",
            salary=6000.0,
            projectedPoints=25.0,
            confidence=0.9,
            status="active"
        )
    ]
    for player in players:
        db.add(player)
    db.commit()

    # Test submitting valid lineup
    lineup_data: Dict[str, Any] = {
        "players": ["1", "2"],
        "sport": "NFL",
        "contestId": "contest123"
    }
    response = client.post("/api/v1/lineup/submit", json=lineup_data)
    assert response.status_code == 200
    data: Dict[str, Any] = response.json()
    assert data["success"] is True
    assert "lineup" in data
    assert data["lineup"]["sport"] == "NFL"
    assert data["lineup"]["contestId"] == "contest123"
    assert len(data["lineup"]["players"]) == 2

def test_submit_invalid_lineup(client: TestClient, db: Session) -> None:
    """Test submitting an invalid lineup"""
    # Test submitting lineup with non-existent player
    lineup_data: Dict[str, Any] = {
        "players": ["999"],
        "sport": "NFL",
        "contestId": "contest123"
    }
    response = client.post("/api/v1/lineup/submit", json=lineup_data)
    assert response.status_code == 400
    assert "Player 999 not found" in response.json()["detail"]

def test_submit_lineup_validation(client: TestClient, db: Session) -> None:
    """Test lineup validation"""
    # Create test players with invalid positions for NFL
    players: List[Player] = [
        Player(
            id="1",
            name="Test Player 1",
            position="QB",
            team="TEAM1",
            salary=5000.0,
            projectedPoints=20.0,
            confidence=0.8,
            status="active"
        ),
        Player(
            id="2",
            name="Test Player 2",
            position="QB",  # Invalid: can't have two QBs
            team="TEAM2",
            salary=6000.0,
            projectedPoints=25.0,
            confidence=0.9,
            status="active"
        )
    ]
    for player in players:
        db.add(player)
    db.commit()

    # Test submitting invalid lineup
    lineup_data: Dict[str, Any] = {
        "players": ["1", "2"],
        "sport": "NFL",
        "contestId": "contest123"
    }
    response = client.post("/api/v1/lineup/submit", json=lineup_data)
    assert response.status_code == 400
    data: Dict[str, Any] = response.json()
    assert "errors" in data["detail"]
    assert any("QB" in error for error in data["detail"]["errors"]) 