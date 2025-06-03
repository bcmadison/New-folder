import os
import joblib
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from xgboost import XGBClassifier
import lightgbm as lgb
from sklearn.calibration import CalibratedClassifierCV
from typing import Dict, List, Tuple, Any, Union
from datetime import datetime

class MLService:
    def __init__(self, model_dir: str = "advanced/models_store"):
        self.model_dir = model_dir
        self.scaler = StandardScaler()
        self.models: Dict[str, Any] = {}
        self.feature_importance: Dict[str, Dict[str, float]] = {}
        self.model_metrics: Dict[str, Dict[str, Union[float, List[List[float]]]]] = {}
        self.training_history: List[Dict[str, Any]] = []
        os.makedirs(model_dir, exist_ok=True)
        
    def prepare_features(self, data: pd.DataFrame, target_col: str) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and target for training"""
        X = data.drop(columns=[target_col])
        y = data[target_col].values
        X_scaled = self.scaler.fit_transform(X)
        return X_scaled, y
    
    def evaluate_model(self, model: Any, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Union[float, List[List[float]]]]:
        """Evaluate model performance with multiple metrics"""
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        metrics: Dict[str, Union[float, List[List[float]]]] = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred)),
            'recall': float(recall_score(y_test, y_pred)),
            'f1': float(f1_score(y_test, y_pred)),
            'roc_auc': float(roc_auc_score(y_test, y_pred_proba))
        }
        
        # Add confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        metrics['confusion_matrix'] = cm.tolist()
        
        return metrics
    
    def train_models(self, data: pd.DataFrame, target_col: str, test_size: float = 0.2) -> Tuple[str, float]:
        """Train multiple models and select the best one"""
        X, y = self.prepare_features(data, target_col)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        
        base_models: Dict[str, Any] = {
            'rf': RandomForestClassifier(n_estimators=100, random_state=42),
            'gb': GradientBoostingClassifier(n_estimators=100, random_state=42),
            'xgb': XGBClassifier(n_estimators=100, random_state=42),
            'lgb': lgb.LGBMClassifier(n_estimators=100, random_state=42)
        }
        
        best_score = 0.0
        best_model_name = ''
        
        for name, model in base_models.items():
            # Train model
            model.fit(X_train, y_train)
            
            # Evaluate model
            metrics = self.evaluate_model(model, X_test, y_test)
            self.model_metrics[name] = metrics
            
            # Store model and feature importance
            self.models[name] = model
            self.feature_importance[name] = dict(zip(data.drop(columns=[target_col]).columns,
                                                   model.feature_importances_))
            
            # Update best model
            if isinstance(metrics['roc_auc'], float) and metrics['roc_auc'] > best_score:
                best_score = metrics['roc_auc']
                best_model_name = name
        
        # Train calibrated model
        best_model = self.models[best_model_name]
        calibrated_model = CalibratedClassifierCV(best_model, cv=5)
        calibrated_model.fit(X_train, y_train)
        self.models['calibrated'] = calibrated_model
        
        # Record training history
        training_record = {
            'timestamp': datetime.now().isoformat(),
            'best_model': best_model_name,
            'best_score': best_score,
            'metrics': self.model_metrics
        }
        self.training_history.append(training_record)
        
        self.save_models()
        return best_model_name, best_score
    
    def predict(self, features: Dict[str, Any], feature_order: List[str]) -> Tuple[Any, float, Dict[str, Any]]:
        """Make predictions using the calibrated model with additional insights"""
        if 'calibrated' not in self.models:
            raise ValueError("No calibrated model available. Train models first.")
        
        # Create DataFrame with correct feature order
        input_values = [features[feature] for feature in feature_order]
        features_df = pd.DataFrame([input_values], columns=feature_order)
        
        # Scale features
        X_scaled = self.scaler.transform(features_df)
        
        # Get predictions and probabilities
        predictions = self.models['calibrated'].predict(X_scaled)
        probabilities = self.models['calibrated'].predict_proba(X_scaled)
        
        predicted_outcome = predictions[0]
        confidence = float(np.max(probabilities[0]))
        
        # Generate prediction insights
        insights = {
            'confidence': confidence,
            'feature_contributions': self._get_feature_contributions(features_df, feature_order),
            'model_metrics': self.model_metrics.get('calibrated', {}),
            'prediction_timestamp': datetime.now().isoformat()
        }
        
        return predicted_outcome, confidence, insights
    
    def _get_feature_contributions(self, features_df: pd.DataFrame, feature_order: List[str]) -> Dict[str, float]:
        """Calculate feature contributions to the prediction"""
        contributions: Dict[str, float] = {}
        for feature in feature_order:
            if feature in self.feature_importance.get('rf', {}):
                contributions[feature] = float(self.feature_importance['rf'][feature])
        return contributions
    
    def save_models(self) -> None:
        """Save trained models and artifacts"""
        # Save models
        for name, model in self.models.items():
            joblib.dump(model, f"{self.model_dir}/{name}_model.joblib")
        
        # Save scaler
        joblib.dump(self.scaler, f"{self.model_dir}/scaler.joblib")
        
        # Save feature importance
        with open(f"{self.model_dir}/feature_importance.json", 'w') as f:
            json.dump(self.feature_importance, f)
        
        # Save model metrics
        with open(f"{self.model_dir}/model_metrics.json", 'w') as f:
            json.dump(self.model_metrics, f)
        
        # Save training history
        with open(f"{self.model_dir}/training_history.json", 'w') as f:
            json.dump(self.training_history, f)
    
    def load_models(self) -> None:
        """Load trained models and artifacts"""
        # Load models
        for name in ['rf', 'gb', 'xgb', 'lgb', 'calibrated']:
            model_path = f"{self.model_dir}/{name}_model.joblib"
            if os.path.exists(model_path):
                self.models[name] = joblib.load(model_path)
        
        # Load scaler
        scaler_path = f"{self.model_dir}/scaler.joblib"
        if os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)
        
        # Load feature importance
        importance_path = f"{self.model_dir}/feature_importance.json"
        if os.path.exists(importance_path):
            with open(importance_path, 'r') as f:
                self.feature_importance = json.load(f)
        
        # Load model metrics
        metrics_path = f"{self.model_dir}/model_metrics.json"
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                self.model_metrics = json.load(f)
        
        # Load training history
        history_path = f"{self.model_dir}/training_history.json"
        if os.path.exists(history_path):
            with open(history_path, 'r') as f:
                self.training_history = json.load(f)

# Singleton instance
ml_service = MLService()

def get_ml_service() -> MLService:
    """Get the singleton ML service instance"""
    return ml_service 