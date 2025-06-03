import sys
import os
import requests
import json
from pathlib import Path

def verify_ml_system():
    """Verify the ML system is working correctly"""
    print("Verifying ML system...")
    
    # Check if model files exist
    model_dir = Path("backend/advanced/models_store")
    required_files = [
        "calibrated_model.joblib",
        "scaler.joblib",
        "feature_importance.json"
    ]
    
    for file in required_files:
        file_path = model_dir / file
        if not file_path.exists():
            print(f"❌ Missing required file: {file}")
            return False
        print(f"✅ Found {file}")
    
    # Test prediction endpoint
    try:
        # Sample prediction request
        test_data = {
            "propId": "test_prop_1",
            "modelId": "default_v1",
            "context": {"sport": "NBA"},
            "prediction_input": {
                "features": {
                    "player_points": 25,
                    "team_points": 100,
                    "opponent_points": 95,
                    "minutes_played": 30,
                    "home_game": 1,
                    "days_rest": 2
                }
            }
        }
        
        response = requests.post(
            "http://localhost:8000/api/v1/predictions/predict",
            json=test_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction endpoint working")
            print(f"Prediction result: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Prediction endpoint failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to prediction endpoint. Is the server running?")
        return False
    except Exception as e:
        print(f"❌ Error testing prediction endpoint: {e}")
        return False
    
    print("\n✅ ML system verification complete!")
    return True

if __name__ == "__main__":
    success = verify_ml_system()
    sys.exit(0 if success else 1) 