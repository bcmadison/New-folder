import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys
from dotenv import load_dotenv
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import custom modules
from backend.model_evaluation.evaluator import ModelEvaluator
from backend.model_evaluation.metrics import ModelMetrics
from backend.model_evaluation.cross_validation import CrossValidator
from backend.model_evaluation.feature_importance import FeatureImportanceAnalyzer

# Load environment variables
load_dotenv()

@pytest.fixture
def sample_prediction_data():
    """Create sample prediction data"""
    # Create sample features
    X = pd.DataFrame({
        'home_goals_avg': [2.0, 1.5, 2.5, 1.8, 2.2],
        'home_goals_against_avg': [1.0, 1.5, 1.0, 1.2, 1.3],
        'away_goals_avg': [1.5, 2.0, 1.0, 1.8, 1.5],
        'away_goals_against_avg': [1.5, 1.0, 1.5, 1.2, 1.4],
        'home_form': [0.8, 0.6, 0.7, 0.5, 0.9],
        'away_form': [0.7, 0.8, 0.6, 0.7, 0.8]
    })
    
    # Create sample target
    y = pd.Series([1, 0, 1, 0, 1])  # 1 for home win, 0 for away win/draw
    
    # Create sample predictions
    y_pred = pd.Series([1, 0, 1, 1, 1])
    y_pred_proba = pd.DataFrame({
        'home_win': [0.8, 0.3, 0.7, 0.6, 0.9],
        'draw': [0.1, 0.4, 0.2, 0.3, 0.05],
        'away_win': [0.1, 0.3, 0.1, 0.1, 0.05]
    })
    
    return X, y, y_pred, y_pred_proba

def test_model_evaluator(sample_prediction_data):
    """Test ModelEvaluator class"""
    X, y, y_pred, y_pred_proba = sample_prediction_data
    
    # Initialize evaluator
    evaluator = ModelEvaluator()
    
    # Test basic metrics
    metrics = evaluator.evaluate(y, y_pred, y_pred_proba)
    assert 'accuracy' in metrics
    assert 'precision' in metrics
    assert 'recall' in metrics
    assert 'f1' in metrics
    assert 'log_loss' in metrics
    assert 'roc_auc' in metrics
    
    # Verify metric values
    assert 0 <= metrics['accuracy'] <= 1
    assert 0 <= metrics['precision'] <= 1
    assert 0 <= metrics['recall'] <= 1
    assert 0 <= metrics['f1'] <= 1
    assert metrics['log_loss'] >= 0
    assert 0 <= metrics['roc_auc'] <= 1
    
    # Test custom threshold
    metrics_threshold = evaluator.evaluate(y, y_pred, y_pred_proba, threshold=0.7)
    assert metrics_threshold['accuracy'] != metrics['accuracy']

def test_model_metrics(sample_prediction_data):
    """Test ModelMetrics class"""
    X, y, y_pred, y_pred_proba = sample_prediction_data
    
    # Initialize metrics
    metrics = ModelMetrics()
    
    # Test individual metric calculations
    accuracy = metrics.calculate_accuracy(y, y_pred)
    precision = metrics.calculate_precision(y, y_pred)
    recall = metrics.calculate_recall(y, y_pred)
    f1 = metrics.calculate_f1(y, y_pred)
    log_loss = metrics.calculate_log_loss(y, y_pred_proba)
    roc_auc = metrics.calculate_roc_auc(y, y_pred_proba)
    
    # Verify metric values
    assert 0 <= accuracy <= 1
    assert 0 <= precision <= 1
    assert 0 <= recall <= 1
    assert 0 <= f1 <= 1
    assert log_loss >= 0
    assert 0 <= roc_auc <= 1
    
    # Test metric aggregation
    all_metrics = metrics.calculate_all_metrics(y, y_pred, y_pred_proba)
    assert len(all_metrics) == 6
    assert all(0 <= v <= 1 for v in all_metrics.values() if v != log_loss)

def test_cross_validation(sample_prediction_data):
    """Test CrossValidator class"""
    X, y, y_pred, y_pred_proba = sample_prediction_data
    
    # Initialize validator
    validator = CrossValidator(n_splits=3)
    
    # Test cross validation
    cv_scores = validator.cross_validate(X, y)
    assert 'accuracy' in cv_scores
    assert 'precision' in cv_scores
    assert 'recall' in cv_scores
    assert 'f1' in cv_scores
    
    # Verify score structure
    assert len(cv_scores['accuracy']) == 3  # n_splits
    assert all(0 <= score <= 1 for score in cv_scores['accuracy'])
    
    # Test stratified cross validation
    stratified_scores = validator.stratified_cross_validate(X, y)
    assert len(stratified_scores['accuracy']) == 3
    assert all(0 <= score <= 1 for score in stratified_scores['accuracy'])

def test_feature_importance(sample_prediction_data):
    """Test FeatureImportanceAnalyzer class"""
    X, y, y_pred, y_pred_proba = sample_prediction_data
    
    # Initialize analyzer
    analyzer = FeatureImportanceAnalyzer()
    
    # Test feature importance calculation
    importance = analyzer.calculate_importance(X, y)
    assert len(importance) == len(X.columns)
    assert all(0 <= imp <= 1 for imp in importance.values())
    
    # Test feature ranking
    ranked_features = analyzer.rank_features(X, y)
    assert len(ranked_features) == len(X.columns)
    assert all(feature in X.columns for feature in ranked_features)
    
    # Test feature selection
    selected_features = analyzer.select_features(X, y, threshold=0.1)
    assert len(selected_features) <= len(X.columns)
    assert all(feature in X.columns for feature in selected_features)

def test_evaluation_pipeline(sample_prediction_data):
    """Test integration of all evaluation components"""
    X, y, y_pred, y_pred_proba = sample_prediction_data
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize components
    evaluator = ModelEvaluator()
    metrics = ModelMetrics()
    validator = CrossValidator(n_splits=3)
    analyzer = FeatureImportanceAnalyzer()
    
    # Perform cross validation
    cv_scores = validator.cross_validate(X_train, y_train)
    assert all(0 <= score <= 1 for scores in cv_scores.values() for score in scores)
    
    # Calculate feature importance
    importance = analyzer.calculate_importance(X_train, y_train)
    assert len(importance) == len(X.columns)
    
    # Select important features
    selected_features = analyzer.select_features(X_train, y_train, threshold=0.1)
    X_test_selected = X_test[selected_features]
    
    # Evaluate on test set
    test_metrics = evaluator.evaluate(y_test, y_pred, y_pred_proba)
    assert all(0 <= score <= 1 for score in test_metrics.values() if score != test_metrics['log_loss'])
    
    # Calculate detailed metrics
    detailed_metrics = metrics.calculate_all_metrics(y_test, y_pred, y_pred_proba)
    assert len(detailed_metrics) == 6
    
    # Verify metric consistency
    assert abs(test_metrics['accuracy'] - detailed_metrics['accuracy']) < 1e-10
    assert abs(test_metrics['precision'] - detailed_metrics['precision']) < 1e-10
    assert abs(test_metrics['recall'] - detailed_metrics['recall']) < 1e-10
    assert abs(test_metrics['f1'] - detailed_metrics['f1']) < 1e-10 