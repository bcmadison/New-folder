import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from fastapi.testclient import TestClient
from server import app

def test_api_root():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200 