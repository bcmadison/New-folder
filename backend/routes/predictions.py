# backend/routes/predictions.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import pandas as pd
import os
import joblib
import json
import logging
import sys

router = APIRouter()
logger = logging.getLogger("ml_predict")

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BACKEND_DIR, "..", "advanced", "models_store")
MODEL_PATH = os.path.abspath(os.path.join(MODEL_DIR, "final_prediction_model.joblib"))
SCALER_PATH = os.path.abspath(os.path.join(MODEL_DIR, "scaler.joblib"))
FEATURES_PATH = os.path.abspath(os.path.join(MODEL_DIR, "selected_features.json"))

class PredictionRequest(BaseModel):
    features: Dict[str, Any]

class PredictionResponse(BaseModel):
    propId: str
    predictedOutcome: str
    confidence: float
    modelUsed: str

# Load model, scaler, and features at startup
model = None
scaler = None
selected_features = None
if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH) and os.path.exists(FEATURES_PATH):
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    with open(FEATURES_PATH, "r") as f:
        selected_features = json.load(f)
else:
    logger.warning("ML model, scaler, or features not found. /ml/predict will not work.")

@router.post("/ml/predict", response_model=PredictionResponse, summary="Run ML prediction on input features")
async def ml_predict(request: PredictionRequest):
    if not (model and scaler and selected_features):
        logger.error("ML model, scaler, or features not loaded.")
        raise HTTPException(status_code=500, detail="ML model not available.")
    try:
        # Select and order features
        input_data = {k: request.features.get(k, 0) for k in selected_features}
        X = pd.DataFrame([input_data])
        X_scaled = scaler.transform(X)
        pred = model.predict(X_scaled)[0]
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X_scaled)[0]
            confidence = float(max(proba))
        else:
            confidence = 0.5
        predicted_outcome = str(pred)
        prop_id = request.features.get("propId", "unknown")
        return PredictionResponse(
            propId=prop_id,
            predictedOutcome=predicted_outcome,
            confidence=confidence,
            modelUsed=os.path.basename(MODEL_PATH)
        )
    except Exception as e:
        logger.error(f"Error running ML prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed.")
