import pytest
from fastapi.testclient import TestClient
from server import app
from typing import Dict, Any
import json

client = TestClient(app)

def test_auth_endpoints():
    """Test authentication endpoints"""
    # Test registration
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Test123!"
    }
    register_response = client.post("/auth/register", json=register_data)
    assert register_response.status_code == 200
    
    # Test login
    login_data = {
        "username": "testuser",
        "password": "Test123!"
    }
    login_response = client.post("/auth/login", json=login_data)
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # Test protected route
    headers = {"Authorization": f"Bearer {token}"}
    protected_response = client.get("/auth/me", headers=headers)
    assert protected_response.status_code == 200

def test_entries_endpoints():
    """Test entries endpoints"""
    # Create entry
    entry_data = {
        "sport": "NBA",
        "teams": ["Lakers", "Celtics"],
        "prediction": "Lakers",
        "confidence": 0.85,
        "stake": 100
    }
    create_response = client.post("/api/entries", json=entry_data)
    assert create_response.status_code == 200
    entry_id = create_response.json()["id"]
    
    # Get all entries
    get_all_response = client.get("/api/entries")
    assert get_all_response.status_code == 200
    assert len(get_all_response.json()) > 0
    
    # Get single entry
    get_one_response = client.get(f"/api/entries/{entry_id}")
    assert get_one_response.status_code == 200
    assert get_one_response.json()["sport"] == entry_data["sport"]
    
    # Update entry
    update_data = {"confidence": 0.90}
    update_response = client.patch(f"/api/entries/{entry_id}", json=update_data)
    assert update_response.status_code == 200
    
    # Delete entry
    delete_response = client.delete(f"/api/entries/{entry_id}")
    assert delete_response.status_code == 200

def test_analytics_endpoints():
    """Test analytics endpoints"""
    # Get summary
    summary_response = client.get("/analytics/summary")
    assert summary_response.status_code == 200
    assert "total_entries" in summary_response.json()
    
    # Get trends
    trends_response = client.get("/analytics/trends")
    assert trends_response.status_code == 200
    assert "sport_distribution" in trends_response.json()
    
    # Get performance
    performance_response = client.get("/analytics/performance")
    assert performance_response.status_code == 200
    assert "roi" in performance_response.json()

def test_predictions_endpoints():
    """Test predictions endpoints"""
    # Get predictions
    predictions_response = client.get("/ml/predict")
    assert predictions_response.status_code == 200
    
    # Create prediction
    prediction_data = {
        "sport": "NBA",
        "teams": ["Lakers", "Celtics"],
        "historical_data": True
    }
    create_prediction = client.post("/ml/predict", json=prediction_data)
    assert create_prediction.status_code == 200
    assert "prediction" in create_prediction.json()
    
    # Get model metrics
    metrics_response = client.get("/ml/metrics")
    assert metrics_response.status_code == 200
    assert "accuracy" in metrics_response.json()

def test_websocket_endpoints():
    """Test WebSocket endpoints"""
    with client.websocket_connect("/ws") as websocket:
        # Test subscription
        websocket.send_json({"type": "subscribe", "channel": "live_updates"})
        response = websocket.receive_json()
        assert response["type"] == "subscribed"
        
        # Test message handling
        websocket.send_json({"type": "ping"})
        response = websocket.receive_json()
        assert response["type"] == "pong"

def test_error_handling():
    """Test error handling"""
    # Test 404
    not_found_response = client.get("/nonexistent")
    assert not_found_response.status_code == 404
    
    # Test 422 (validation error)
    invalid_data = {"invalid": "data"}
    validation_response = client.post("/api/entries", json=invalid_data)
    assert validation_response.status_code == 422
    
    # Test 401 (unauthorized)
    unauthorized_response = client.get("/auth/me")
    assert unauthorized_response.status_code == 401

def test_rate_limiting():
    """Test rate limiting"""
    # Make multiple requests in quick succession
    for _ in range(10):
        response = client.get("/api/entries")
        assert response.status_code in [200, 429]  # Either success or rate limited
    
    # Verify rate limit headers
    response = client.get("/api/entries")
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers

def test_caching():
    """Test caching behavior"""
    # First request
    first_response = client.get("/analytics/summary")
    assert first_response.status_code == 200
    
    # Second request should be cached
    second_response = client.get("/analytics/summary")
    assert second_response.status_code == 200
    assert "X-Cache" in second_response.headers 