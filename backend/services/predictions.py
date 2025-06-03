from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np
from ..advanced.meta_model import MetaModel
from ..models.prediction import Prediction
from ..models.user import User
from ..database import get_db
from sqlalchemy.orm import Session
from fastapi import HTTPException

class PredictionService:
    def __init__(self):
        self.meta_model = MetaModel()
        self.db: Session = next(get_db())

    async def get_predictions(
        self,
        sport: str,
        date: datetime
    ) -> List[Prediction]:
        """
        Get predictions for a specific sport and date.
        """
        try:
            # Get predictions from database
            predictions = self.db.query(Prediction).filter(
                Prediction.sport == sport,
                Prediction.game_time >= date,
                Prediction.game_time < date.replace(hour=23, minute=59, second=59)
            ).all()

            if not predictions:
                # Generate new predictions if none exist
                predictions = await self._generate_predictions(sport, date)
                
            return predictions
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching predictions: {str(e)}"
            )

    async def optimize_lineup(
        self,
        prediction_ids: List[str],
        legs: int
    ) -> Dict[str, Any]:
        """
        Optimize a lineup based on selected predictions.
        """
        try:
            # Get predictions from database
            predictions = self.db.query(Prediction).filter(
                Prediction.id.in_(prediction_ids)
            ).all()

            if len(predictions) != len(prediction_ids):
                raise HTTPException(
                    status_code=400,
                    detail="Some predictions not found"
                )

            # Prepare features for optimization
            features = np.array([p.features for p in predictions])
            
            # Get predictions and probabilities
            preds, probs = self.meta_model.predict(features)
            
            # Calculate expected payout and confidence
            expected_payout = self._calculate_expected_payout(predictions, probs)
            confidence_score = self._calculate_confidence_score(probs)
            risk_score = self._calculate_risk_score(predictions, probs)
            
            return {
                "predictions": predictions,
                "expectedPayout": expected_payout,
                "confidenceScore": confidence_score,
                "riskScore": risk_score
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error optimizing lineup: {str(e)}"
            )

    async def get_feature_importance(self, prediction_id: str) -> Dict[str, float]:
        """
        Get feature importance for a specific prediction.
        """
        try:
            prediction = self.db.query(Prediction).filter(
                Prediction.id == prediction_id
            ).first()

            if not prediction:
                raise HTTPException(
                    status_code=404,
                    detail="Prediction not found"
                )

            features = np.array([prediction.features])
            importance = self.meta_model.get_feature_importance(features)
            
            return importance
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching feature importance: {str(e)}"
            )

    async def get_model_performance(self) -> Dict[str, Dict[str, float]]:
        """
        Get model performance metrics.
        """
        try:
            # Get test data from database
            test_predictions = self.db.query(Prediction).filter(
                Prediction.is_test == True
            ).all()

            if not test_predictions:
                raise HTTPException(
                    status_code=404,
                    detail="No test data available"
                )

            # Prepare features and labels
            features = np.array([p.features for p in test_predictions])
            labels = np.array([p.actual_outcome for p in test_predictions])
            
            # Get performance metrics
            performance = self.meta_model.get_model_performance(features, labels)
            
            return performance
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching model performance: {str(e)}"
            )

    async def get_odds_updates(self, prediction_ids: List[str]) -> Dict[str, float]:
        """
        Get real-time odds updates for selected predictions.
        """
        try:
            predictions = self.db.query(Prediction).filter(
                Prediction.id.in_(prediction_ids)
            ).all()

            if len(predictions) != len(prediction_ids):
                raise HTTPException(
                    status_code=400,
                    detail="Some predictions not found"
                )

            # Get latest odds from external API
            updates = {}
            for prediction in predictions:
                latest_odds = await self._fetch_latest_odds(prediction)
                updates[prediction.id] = latest_odds

            return updates
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching odds updates: {str(e)}"
            )

    async def _generate_predictions(
        self,
        sport: str,
        date: datetime
    ) -> List[Prediction]:
        """
        Generate new predictions using the meta-model.
        """
        # Implementation depends on data source and feature engineering
        pass

    def _calculate_expected_payout(
        self,
        predictions: List[Prediction],
        probabilities: np.ndarray
    ) -> float:
        """
        Calculate expected payout for a lineup.
        """
        # Implementation depends on payout calculation logic
        pass

    def _calculate_confidence_score(self, probabilities: np.ndarray) -> float:
        """
        Calculate overall confidence score for a lineup.
        """
        return float(np.mean(probabilities) * 100)

    def _calculate_risk_score(
        self,
        predictions: List[Prediction],
        probabilities: np.ndarray
    ) -> float:
        """
        Calculate risk score for a lineup.
        """
        # Implementation depends on risk calculation logic
        pass

    async def _fetch_latest_odds(self, prediction: Prediction) -> float:
        """
        Fetch latest odds from external API.
        """
        # Implementation depends on odds API integration
        pass 