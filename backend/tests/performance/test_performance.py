import pytest
import time
from fastapi.testclient import TestClient
from server import app
import asyncio
from typing import List
import statistics

client = TestClient(app)

def measure_response_time(endpoint: str, method: str = "GET", data: dict = None) -> float:
    start_time = time.time()
    if method == "GET":
        response = client.get(endpoint)
    elif method == "POST":
        response = client.post(endpoint, json=data)
    end_time = time.time()
    assert response.status_code == 200
    return end_time - start_time

def test_predictions_endpoint_performance():
    """Test the performance of the predictions endpoint"""
    times: List[float] = []
    for _ in range(10):  # Run 10 times for statistical significance
        response_time = measure_response_time("/ml/predict")
        times.append(response_time)
    
    avg_time = statistics.mean(times)
    max_time = max(times)
    
    assert avg_time < 1.0  # Average response should be under 1 second
    assert max_time < 2.0  # No single request should take more than 2 seconds

def test_analytics_endpoint_performance():
    """Test the performance of the analytics endpoint"""
    times: List[float] = []
    for _ in range(10):
        response_time = measure_response_time("/analytics/summary")
        times.append(response_time)
    
    avg_time = statistics.mean(times)
    max_time = max(times)
    
    assert avg_time < 0.5  # Analytics should be quick
    assert max_time < 1.0

def test_websocket_connection_performance():
    """Test WebSocket connection and message handling performance"""
    with client.websocket_connect("/ws") as websocket:
        start_time = time.time()
        websocket.send_json({"type": "subscribe", "channel": "live_updates"})
        response = websocket.receive_json()
        end_time = time.time()
        
        assert end_time - start_time < 0.1  # WebSocket connection should be fast
        assert response["type"] == "subscribed"

def test_concurrent_requests():
    """Test system performance under concurrent load"""
    async def make_request():
        return measure_response_time("/ml/predict")
    
    async def run_concurrent_requests():
        tasks = [make_request() for _ in range(5)]
        return await asyncio.gather(*tasks)
    
    times = asyncio.run(run_concurrent_requests())
    avg_time = statistics.mean(times)
    max_time = max(times)
    
    assert avg_time < 1.5  # Average response under concurrent load
    assert max_time < 3.0  # Max response time under load

def test_database_query_performance():
    """Test database query performance"""
    times: List[float] = []
    for _ in range(10):
        response_time = measure_response_time("/api/entries")
        times.append(response_time)
    
    avg_time = statistics.mean(times)
    max_time = max(times)
    
    assert avg_time < 0.2  # Database queries should be very fast
    assert max_time < 0.5 