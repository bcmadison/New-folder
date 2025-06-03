import sys
import joblib
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import RFE
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from xgboost import XGBClassifier
from skopt import BayesSearchCV
import xgboost as xgb
import lightgbm as lgb
from sklearn.calibration import CalibratedClassifierCV
import os
from typing import Dict, List, Tuple, Optional
from datetime import datetime

class ModelTrainer:
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.scaler = StandardScaler()
        self.models = {}
        self.feature_importance = {}
        os.makedirs(model_dir, exist_ok=True)
    
    def prepare_features(self, data: pd.DataFrame, target_col: str) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and target for training"""
        # Select features and target
        X = data.drop(columns=[target_col])
        y = data[target_col]
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y
    
    def train_models(self, data: pd.DataFrame, target_col: str, test_size: float = 0.2):
        """Train multiple models and select the best one"""
        # Prepare data
        X, y = self.prepare_features(data, target_col)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        
        # Initialize models
        base_models = {
            'rf': RandomForestClassifier(n_estimators=100, random_state=42),
            'gb': GradientBoostingClassifier(n_estimators=100, random_state=42),
            'xgb': xgb.XGBClassifier(n_estimators=100, random_state=42),
            'lgb': lgb.LGBMClassifier(n_estimators=100, random_state=42)
        }
        
        # Train and evaluate models
        best_score = 0
        best_model_name = None
        
        for name, model in base_models.items():
            # Train model
            model.fit(X_train, y_train)
            
            # Evaluate model
            y_pred = model.predict(X_test)
            score = accuracy_score(y_test, y_pred)
            
            # Store model and feature importance
            self.models[name] = model
            self.feature_importance[name] = dict(zip(data.drop(columns=[target_col]).columns,
                                                   model.feature_importances_))
            
            # Update best model
            if score > best_score:
                best_score = score
                best_model_name = name
        
        # Calibrate best model
        best_model = self.models[best_model_name]
        calibrated_model = CalibratedClassifierCV(best_model, cv=5)
        calibrated_model.fit(X_train, y_train)
        self.models['calibrated'] = calibrated_model
        
        # Save models and scaler
        self.save_models()
        
        return best_model_name, best_score
    
    def predict(self, data: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Make predictions using the calibrated model"""
        if 'calibrated' not in self.models:
            raise ValueError("No calibrated model available. Train models first.")
        
        # Scale features
        X_scaled = self.scaler.transform(data)
        
        # Get predictions and probabilities
        predictions = self.models['calibrated'].predict(X_scaled)
        probabilities = self.models['calibrated'].predict_proba(X_scaled)
        
        return predictions, probabilities
    
    def save_models(self):
        """Save trained models and scaler"""
        # Save models
        for name, model in self.models.items():
            joblib.dump(model, f"{self.model_dir}/{name}_model.joblib")
        
        # Save scaler
        joblib.dump(self.scaler, f"{self.model_dir}/scaler.joblib")
        
        # Save feature importance
        with open(f"{self.model_dir}/feature_importance.json", 'w') as f:
            json.dump(self.feature_importance, f)
    
    def load_models(self):
        """Load trained models and scaler"""
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

def train_final_model(data: pd.DataFrame, target_col: str, model_dir: str = "models") -> ModelTrainer:
    """Train the final model and return the trainer"""
    trainer = ModelTrainer(model_dir=model_dir)
    trainer.train_models(data, target_col)
    return trainer

def predict_outcomes(data: pd.DataFrame, model_dir: str = "models") -> pd.DataFrame:
    """Make predictions for new data"""
    # Load trainer
    trainer = ModelTrainer(model_dir=model_dir)
    trainer.load_models()
    
    # Make predictions
    predictions, probabilities = trainer.predict(data)
    
    # Add predictions to data
    data['prediction'] = predictions
    data['probability'] = probabilities.max(axis=1)
    
    return data

def load_data(path="backend/data/predictions_latest.csv"):
    df = pd.read_csv(path)
    return df

def time_series_features(df, window=5):
    if len(df) < window:
        df['avg_goals_last_5'] = np.nan
        df['win_streak'] = 0
        return df
    df = df.sort_values(["team", "match_date"])
    df['avg_goals_last_5'] = (
        df.groupby('team')['goals']
          .rolling(window=window, min_periods=1)
          .mean()
          .reset_index(level=0, drop=True)
    )
    df['win_streak'] = 0
    return df

def recursive_elimination(X, y):
    model = RandomForestClassifier(n_estimators=100)
    rfe = RFE(model, n_features_to_select=10)
    X_rfe = rfe.fit_transform(X, y)
    return X_rfe

def bayesian_optimize(X, y):
    model = XGBClassifier(eval_metric='logloss', use_label_encoder=False)
    search = BayesSearchCV(
        model,
        {"max_depth": (3, 10), "learning_rate": (0.01, 0.3, 'log-uniform')},
        n_iter=20, cv=3
    )
    search.fit(X, y)
    return search.best_estimator_

if __name__ == "__main__":
    train_final_model()
