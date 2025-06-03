import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import custom modules
from backend.model_training.trainer import ModelTrainer
from backend.model_training.hyperparameter_tuning import HyperparameterTuner
from backend.model_training.model_selection import ModelSelector
from backend.model_training.feature_selection import FeatureSelector

# Load environment variables
load_dotenv()

@pytest.fixture
def sample_training_data():
    """Create sample training data"""
    # Create sample features
    X = pd.DataFrame({
        'home_goals_avg': [2.0, 1.5, 2.5, 1.8, 2.2, 1.7, 2.1, 1.9, 2.3, 1.6],
        'home_goals_against_avg': [1.0, 1.5, 1.0, 1.2, 1.3, 1.4, 1.1, 1.3, 1.2, 1.5],
        'away_goals_avg': [1.5, 2.0, 1.0, 1.8, 1.5, 1.9, 1.4, 1.7, 1.6, 1.8],
        'away_goals_against_avg': [1.5, 1.0, 1.5, 1.2, 1.4, 1.3, 1.5, 1.2, 1.4, 1.3],
        'home_form': [0.8, 0.6, 0.7, 0.5, 0.9, 0.7, 0.8, 0.6, 0.7, 0.5],
        'away_form': [0.7, 0.8, 0.6, 0.7, 0.8, 0.6, 0.7, 0.8, 0.6, 0.7],
        'home_rank': [1, 3, 2, 4, 1, 3, 2, 4, 1, 3],
        'away_rank': [2, 1, 4, 2, 3, 1, 4, 2, 3, 1],
        'home_attendance': [75000, 54000, 74500, 60000, 54200, 74800, 59800, 53800, 74600, 60100],
        'away_attendance': [54000, 75000, 60000, 74500, 74800, 54200, 59800, 53800, 74600, 60100]
    })
    
    # Create sample target
    y = pd.Series([1, 0, 1, 0, 1, 0, 1, 0, 1, 0])  # 1 for home win, 0 for away win/draw
    
    return X, y

def test_model_trainer(sample_training_data):
    """Test ModelTrainer class"""
    X, y = sample_training_data
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize trainer
    trainer = ModelTrainer()
    
    # Test model training
    model = trainer.train(X_train, y_train)
    assert model is not None
    
    # Test prediction
    y_pred = trainer.predict(X_test)
    assert len(y_pred) == len(y_test)
    assert all(pred in [0, 1] for pred in y_pred)
    
    # Test prediction probabilities
    y_pred_proba = trainer.predict_proba(X_test)
    assert y_pred_proba.shape == (len(y_test), 2)
    assert all(0 <= prob <= 1 for prob in y_pred_proba.flatten())
    
    # Test model evaluation
    metrics = trainer.evaluate(X_test, y_test)
    assert 'accuracy' in metrics
    assert 'precision' in metrics
    assert 'recall' in metrics
    assert 'f1' in metrics
    assert all(0 <= score <= 1 for score in metrics.values())

def test_hyperparameter_tuning(sample_training_data):
    """Test HyperparameterTuner class"""
    X, y = sample_training_data
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize tuner
    tuner = HyperparameterTuner()
    
    # Test parameter tuning
    best_params = tuner.tune(X_train, y_train)
    assert best_params is not None
    assert isinstance(best_params, dict)
    
    # Test with custom parameter grid
    custom_grid = {
        'n_estimators': [100, 200],
        'max_depth': [3, 5],
        'learning_rate': [0.01, 0.1]
    }
    best_params_custom = tuner.tune(X_train, y_train, param_grid=custom_grid)
    assert best_params_custom is not None
    assert all(param in best_params_custom for param in custom_grid.keys())

def test_model_selection(sample_training_data):
    """Test ModelSelector class"""
    X, y = sample_training_data
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize selector
    selector = ModelSelector()
    
    # Test model selection
    best_model = selector.select_best_model(X_train, y_train)
    assert best_model is not None
    
    # Test model comparison
    comparison = selector.compare_models(X_train, y_train)
    assert 'models' in comparison
    assert 'metrics' in comparison
    assert len(comparison['models']) > 0
    assert len(comparison['metrics']) > 0
    
    # Test with custom models
    custom_models = ['rf', 'gb', 'xgb']
    best_model_custom = selector.select_best_model(X_train, y_train, models=custom_models)
    assert best_model_custom is not None

def test_feature_selection(sample_training_data):
    """Test FeatureSelector class"""
    X, y = sample_training_data
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize selector
    selector = FeatureSelector()
    
    # Test feature selection
    selected_features = selector.select_features(X_train, y_train)
    assert len(selected_features) <= len(X.columns)
    assert all(feature in X.columns for feature in selected_features)
    
    # Test feature importance
    importance = selector.get_feature_importance(X_train, y_train)
    assert len(importance) == len(X.columns)
    assert all(0 <= imp <= 1 for imp in importance.values())
    
    # Test with custom threshold
    selected_features_threshold = selector.select_features(X_train, y_train, threshold=0.1)
    assert len(selected_features_threshold) <= len(selected_features)

def test_training_pipeline(sample_training_data):
    """Test integration of all training components"""
    X, y = sample_training_data
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize components
    trainer = ModelTrainer()
    tuner = HyperparameterTuner()
    selector = ModelSelector()
    feature_selector = FeatureSelector()
    
    # Select features
    selected_features = feature_selector.select_features(X_train, y_train)
    X_train_selected = X_train[selected_features]
    X_test_selected = X_test[selected_features]
    
    # Tune hyperparameters
    best_params = tuner.tune(X_train_selected, y_train)
    
    # Select best model
    best_model = selector.select_best_model(X_train_selected, y_train)
    
    # Train model
    model = trainer.train(X_train_selected, y_train, **best_params)
    
    # Evaluate model
    metrics = trainer.evaluate(X_test_selected, y_test)
    assert all(0 <= score <= 1 for score in metrics.values())
    
    # Verify feature importance
    importance = feature_selector.get_feature_importance(X_train_selected, y_train)
    assert len(importance) == len(selected_features)
    assert all(0 <= imp <= 1 for imp in importance.values())
    
    # Test model persistence
    model_path = "test_model.pkl"
    trainer.save_model(model_path)
    loaded_model = trainer.load_model(model_path)
    assert loaded_model is not None
    
    # Clean up
    os.remove(model_path) 