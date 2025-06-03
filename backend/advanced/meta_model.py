import pandas as pd
import numpy as np
import os
from typing import Dict, List, Tuple, Any
import shap
from sklearn.ensemble import StackingClassifier, VotingClassifier
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
import joblib
from .train_predict import train_final_model
from .social_sentiment import get_sentiment_scores
from .player_embeddings import get_player_embeddings

class MetaModel:
    def __init__(self):
        self.base_models = {
            'xgb': XGBClassifier(),
            'lgbm': LGBMClassifier(),
            'mlp': MLPClassifier(),
            'svm': SVC(probability=True),
            'lr': LogisticRegression(),
            'rf': RandomForestClassifier()
        }
        self.meta_model = None
        self.scaler = StandardScaler()
        self.explainer = None
        
    def train(self, X: pd.DataFrame, y: pd.Series) -> float:
        """Train the meta model with stacking and voting"""
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Create stacking ensemble
        estimators = [(name, model) for name, model in self.base_models.items()]
        self.meta_model = StackingClassifier(
            estimators=estimators,
            final_estimator=LogisticRegression(),
            cv=5
        )
        
        # Train meta model
        self.meta_model.fit(X_scaled, y)
        
        # Create SHAP explainer
        self.explainer = shap.TreeExplainer(self.meta_model.final_estimator_)
        
        # Calculate accuracy
        accuracy = self.meta_model.score(X_scaled, y)
        return accuracy
    
    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """Make predictions with confidence scores and SHAP values"""
        X_scaled = self.scaler.transform(X)
        
        # Get base model predictions
        base_predictions = {}
        for name, model in self.base_models.items():
            base_predictions[name] = model.predict_proba(X_scaled)
        
        # Get meta model prediction
        meta_pred = self.meta_model.predict(X_scaled)
        meta_proba = self.meta_model.predict_proba(X_scaled)
        
        # Calculate SHAP values
        shap_values = self.explainer.shap_values(X_scaled)
        
        # Get feature importance
        feature_importance = dict(zip(X.columns, np.abs(shap_values).mean(0)))
        
        return meta_pred, meta_proba, {
            'base_predictions': base_predictions,
            'shap_values': shap_values,
            'feature_importance': feature_importance
        }
    
    def calibrate_confidence(self, predictions: np.ndarray, 
                           sentiment_scores: Dict[str, float],
                           player_embeddings: Dict[str, np.ndarray]) -> np.ndarray:
        """Calibrate prediction confidence using sentiment and player embeddings"""
        # Combine all signals
        calibrated = predictions.copy()
        
        # Adjust based on sentiment
        for idx, (team, score) in enumerate(sentiment_scores.items()):
            if score > 0.7:  # Strong positive sentiment
                calibrated[idx] *= 1.1
            elif score < 0.3:  # Strong negative sentiment
                calibrated[idx] *= 0.9
        
        # Adjust based on player embeddings
        for idx, (player, embedding) in enumerate(player_embeddings.items()):
            momentum = np.mean(embedding[-5:])  # Recent performance
            if momentum > 0.8:  # Strong momentum
                calibrated[idx] *= 1.05
        
        # Normalize to [0, 1]
        calibrated = np.clip(calibrated, 0, 1)
        return calibrated

def predict_optimal_lineup(sport: str = None, 
                         confidence_threshold: float = 0.7,
                         time_window: str = None,
                         prop_type: str = None) -> Tuple[pd.DataFrame, float, Dict[str, Any]]:
    """Get predictions with all smart features integrated"""
    # Load latest predictions
    df = pd.read_csv(os.path.join("data", "predictions_latest.csv")) if os.path.exists("data/predictions_latest.csv") else pd.DataFrame()
    
    # Apply filters
    if sport:
        df = df[df['sport'] == sport]
    if time_window:
        df = df[df['game_time'].between(*time_window)]
    if prop_type:
        df = df[df['prop_type'] == prop_type]
    
    # Initialize and train meta model
    meta_model = MetaModel()
    X = df.drop(columns=["actual_outcome", "game_time", "sport", "prop_type"], errors='ignore')
    y = df["actual_outcome"]
    accuracy = meta_model.train(X, y)
    
    # Get predictions with confidence
    predictions, probabilities, metadata = meta_model.predict(X)
    
    # Get sentiment scores
    sentiment_scores = get_sentiment_scores(df['teams'].tolist())
    
    # Get player embeddings
    player_embeddings = get_player_embeddings(df['players'].tolist())
    
    # Calibrate confidence
    calibrated_probs = meta_model.calibrate_confidence(
        probabilities[:, 1],
        sentiment_scores,
        player_embeddings
    )
    
    # Filter by confidence threshold
    high_confidence_mask = calibrated_probs >= confidence_threshold
    df = df[high_confidence_mask]
    predictions = predictions[high_confidence_mask]
    calibrated_probs = calibrated_probs[high_confidence_mask]
    
    # Add predictions and confidence to dataframe
    df["predicted_outcome"] = predictions
    df["confidence"] = calibrated_probs
    
    return df, accuracy, metadata