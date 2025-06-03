from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
import os
import json
import numbers

from core.auto_logger import logger
from services.ml_service import get_ml_service

router = APIRouter()

# Define paths to where the model, scaler, and feature list will be saved/loaded from
# These should be relative to the backend root or use absolute paths managed by config
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.abspath(os.path.join(BACKEND_DIR, "../../../../../advanced/models_store"))
MODEL_PATH = os.path.join(MODEL_DIR, "final_prediction_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")
SELECTED_FEATURES_PATH = os.path.join(MODEL_DIR, "selected_features.json")

# Ensure MODEL_DIR exists (though model saving script should create it)
# os.makedirs(MODEL_DIR, exist_ok=True)

def load_artifacts(app):
    """Load ML models and artifacts on startup"""
    print(f"[DEBUG] load_artifacts called")
    ml_service = get_ml_service()
    try:
        ml_service.load_models()
        print("[DEBUG] Model, scaler, and feature selection data loaded successfully.")
    except Exception as e:
        print(f"[DEBUG] Error loading models: {e}")
        print("[DEBUG] Prediction endpoint will not be fully functional.")

class PredictionFeatureInput(BaseModel):
    # Define features based on what the model was trained on (from FEATURE_ORDER)
    # This is highly dependent on the actual features used in train_predict.py's X
    # Example features (replace with actual features from your training data after RFE):
    # This should match the columns in `FEATURE_ORDER` after training and saving that artifact.
    # For now, let's make it a flexible Dict and rely on FEATURE_ORDER for structure.
    features: Dict[str, Any] = Field(..., description="A dictionary of feature names and their values. Must match the training features.")
    # Example structure if known:
    # feature1: float
    # feature2: float
    # ... up to 10 selected features if RFE selects 10

class PredictionRequest(BaseModel):
    # Corresponds to PredictionRequestData from frontend service
    # PropId might be for context/logging, not a direct model feature
    propId: Optional[str] = None 
    modelId: Optional[str] = None # For future use if multiple models are supported
    context: Optional[Dict[str, Any]] = None
    # The actual features for the model
    prediction_input: PredictionFeatureInput 

class PredictionResponse(BaseModel):
    # Corresponds to PredictionOutput from frontend types
    propId: Optional[str]
    predictedOutcome: Any # e.g., string for classification, float for regression
    confidence: Optional[float] = None # if model provides probability
    modelUsed: Optional[str]
    # ... other prediction details

@router.post("/predict", response_model=PredictionResponse)
async def predict_outcome(
    request_body: PredictionRequest,
    request: Request
):
    print("[DEBUG] predict_outcome endpoint called")
    ml_service = get_ml_service()
    
    try:
        logger.logger.info(f"Received prediction request for propId: {request_body.propId}, context: {request_body.context}")
        
        # Get feature order from the model's feature importance
        feature_order = list(ml_service.feature_importance.get('rf', {}).keys())
        if not feature_order:
            raise HTTPException(status_code=503, detail="Model features not loaded. Please train the model first.")
        
        # Make prediction using ML service
        predicted_outcome, confidence = ml_service.predict(
            request_body.prediction_input.features,
            feature_order
        )
        
        # Convert numpy types to Python native types
        if isinstance(predicted_outcome, np.generic):
            predicted_outcome = predicted_outcome.item()
        if isinstance(predicted_outcome, numbers.Number):
            predicted_outcome = float(predicted_outcome) if isinstance(predicted_outcome, float) else int(predicted_outcome)
        else:
            predicted_outcome = str(predicted_outcome)

        logger.logger.info(f"Prediction for {request_body.propId}: Outcome={predicted_outcome}, Confidence={confidence}")

        response = PredictionResponse(
            propId=request_body.propId,
            predictedOutcome=predicted_outcome,
            confidence=confidence,
            modelUsed=request_body.modelId or "default_v1"
        )
        print(f"[DEBUG] PredictionResponse: {response}")
        return response

    except HTTPException as he:
        print(f"[DEBUG] HTTPException: {he.detail}")
        raise he
    except Exception as e:
        print(f"[DEBUG] Exception in predict_outcome: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during prediction: {str(e)}")

class GeneralInsightResponse(BaseModel):
    id: str
    text: str
    source: str
    confidence: Optional[float] = None
    type: Optional[str] = None # 'opportunity', 'risk', 'observation'
    relatedEntities: Optional[List[Dict[str, str]]] = None

@router.get("/insights/general", response_model=List[GeneralInsightResponse], summary="Get General ML Insights")
async def get_general_insights():
    logger.logger.info("Request for general insights received.")
    # Return mock insights for now
    return [
        GeneralInsightResponse(
            id="1",
            text="NBA: 84% of 2-leg parlays with diversified teams have a positive ROI over the last 30 days.",
            source="ML Engine",
            confidence=0.84,
            type="opportunity",
            relatedEntities=[{"type": "team", "id": "nba"}]
        ),
        GeneralInsightResponse(
            id="2",
            text="MLB: Underdog home run props have outperformed the market by 12% this week.",
            source="ML Engine",
            confidence=0.78,
            type="observation",
            relatedEntities=[{"type": "sport", "id": "mlb"}]
        ),
        GeneralInsightResponse(
            id="3",
            text="NFL: Sentiment spikes on Twitter have preceded line movement by 2 hours on average.",
            source="Sentiment Analyzer",
            confidence=0.91,
            type="observation",
            relatedEntities=[{"type": "sport", "id": "nfl"}]
        )
    ]

# TODO: Add a separate script to train and save the model, scaler, and selected_features.json
# Example content for selected_features.json after training:
# {
#   "feature_order": ["featureA", "featureB", "featureC", ...], // List of all feature names BEFORE RFE, in order
#   "selected_feature_indices": [0, 2, 5, ...] // Indices of features selected by RFE relative to feature_order
# }
