import pytest
from fastapi.testclient import TestClient
from server import app
from typing import Dict, Any
import json

client = TestClient(app)

def test_entry_state_sync():
    """Test that entry state is properly synchronized between frontend and backend"""
    # Create a test entry
    entry_data = {
        "sport": "NBA",
        "teams": ["Lakers", "Celtics"],
        "prediction": "Lakers",
        "confidence": 0.85,
        "stake": 100
    }
    
    # Create entry
    create_response = client.post("/api/entries", json=entry_data)
    assert create_response.status_code == 200
    entry_id = create_response.json()["id"]
    
    # Verify entry exists
    get_response = client.get(f"/api/entries/{entry_id}")
    assert get_response.status_code == 200
    assert get_response.json()["sport"] == entry_data["sport"]
    
    # Update entry
    update_data = {"confidence": 0.90}
    update_response = client.patch(f"/api/entries/{entry_id}", json=update_data)
    assert update_response.status_code == 200
    
    # Verify update
    get_updated = client.get(f"/api/entries/{entry_id}")
    assert get_updated.status_code == 200
    assert get_updated.json()["confidence"] == 0.90

def test_analytics_state_sync():
    """Test that analytics state is properly synchronized"""
    # Get initial analytics
    initial_response = client.get("/analytics/summary")
    assert initial_response.status_code == 200
    initial_data = initial_response.json()
    
    # Create a new entry to trigger analytics update
    entry_data = {
        "sport": "NFL",
        "teams": ["Chiefs", "49ers"],
        "prediction": "Chiefs",
        "confidence": 0.75,
        "stake": 50
    }
    client.post("/api/entries", json=entry_data)
    
    # Get updated analytics
    updated_response = client.get("/analytics/summary")
    assert updated_response.status_code == 200
    updated_data = updated_response.json()
    
    # Verify analytics were updated
    assert updated_data["total_entries"] > initial_data["total_entries"]
    assert updated_data["last_updated"] > initial_data["last_updated"]

def test_prediction_state_sync():
    """Test that prediction state is properly synchronized"""
    # Get initial predictions
    initial_response = client.get("/ml/predict")
    assert initial_response.status_code == 200
    initial_predictions = initial_response.json()
    
    # Trigger a new prediction
    prediction_data = {
        "sport": "NBA",
        "teams": ["Lakers", "Celtics"],
        "historical_data": True
    }
    new_prediction = client.post("/ml/predict", json=prediction_data)
    assert new_prediction.status_code == 200
    
    # Verify prediction was added to state
    updated_response = client.get("/ml/predict")
    assert updated_response.status_code == 200
    updated_predictions = updated_response.json()
    
    # Verify new prediction exists
    assert len(updated_predictions) > len(initial_predictions)
    assert any(p["teams"] == prediction_data["teams"] for p in updated_predictions)

def test_websocket_state_sync():
    """Test that WebSocket state updates are properly synchronized"""
    with client.websocket_connect("/ws") as websocket:
        # Subscribe to updates
        websocket.send_json({"type": "subscribe", "channel": "live_updates"})
        response = websocket.receive_json()
        assert response["type"] == "subscribed"
        
        # Create an entry to trigger update
        entry_data = {
            "sport": "MLB",
            "teams": ["Yankees", "Red Sox"],
            "prediction": "Yankees",
            "confidence": 0.80,
            "stake": 75
        }
        client.post("/api/entries", json=entry_data)
        
        # Verify WebSocket received update
        update = websocket.receive_json()
        assert update["type"] == "entry_created"
        assert update["data"]["sport"] == entry_data["sport"] 