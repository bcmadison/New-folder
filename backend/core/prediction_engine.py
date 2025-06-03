from typing import Dict, List, Optional
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import logging

class PredictionEngine:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.logger = logging.getLogger(__name__)

    def train(self, features: np.ndarray, targets: np.ndarray) -> None:
        """Train the prediction model on historical data."""
        try:
            # Scale features
            scaled_features = self.scaler.fit_transform(features)
            
            # Initialize and train model
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            self.model.fit(scaled_features, targets)
            
            self.logger.info("Model trained successfully")
        except Exception as e:
            self.logger.error(f"Error training model: {str(e)}")
            raise

    def predict(self, features: np.ndarray) -> np.ndarray:
        """Make predictions using the trained model."""
        if self.model is None:
            raise ValueError("Model not trained")
        
        try:
            # Scale features
            scaled_features = self.scaler.transform(features)
            
            # Make predictions
            predictions = self.model.predict(scaled_features)
            return predictions
        except Exception as e:
            self.logger.error(f"Error making predictions: {str(e)}")
            raise

    def save_model(self, path: str) -> None:
        """Save the trained model to disk."""
        if self.model is None:
            raise ValueError("No model to save")
        
        try:
            joblib.dump({
                'model': self.model,
                'scaler': self.scaler
            }, path)
            self.logger.info(f"Model saved to {path}")
        except Exception as e:
            self.logger.error(f"Error saving model: {str(e)}")
            raise

    def load_model(self, path: str) -> None:
        """Load a trained model from disk."""
        try:
            saved_data = joblib.load(path)
            self.model = saved_data['model']
            self.scaler = saved_data['scaler']
            self.logger.info(f"Model loaded from {path}")
        except Exception as e:
            self.logger.error(f"Error loading model: {str(e)}")
            raise

    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores from the model."""
        if self.model is None:
            raise ValueError("Model not trained")
        
        try:
            importance = self.model.feature_importances_
            return dict(zip(self.model.feature_names_in_, importance))
        except Exception as e:
            self.logger.error(f"Error getting feature importance: {str(e)}")
            raise 