import sys
import os
import pandas as pd
from pathlib import Path

# Add backend root to Python path
backend_root = Path(__file__).parent.parent
sys.path.append(str(backend_root))

from services.ml_service import get_ml_service
from core.auto_logger import logger

def load_training_data():
    """Load and prepare training data"""
    # TODO: Replace with actual data loading logic
    # For now, create sample data
    data = {
        'player_points': [25, 30, 15, 20, 35],
        'team_points': [100, 110, 90, 95, 115],
        'opponent_points': [95, 105, 85, 90, 110],
        'minutes_played': [30, 35, 25, 28, 38],
        'home_game': [1, 0, 1, 0, 1],
        'days_rest': [2, 3, 1, 4, 2],
        'win': [1, 1, 0, 1, 1]  # Target variable
    }
    return pd.DataFrame(data)

def main():
    """Train and save the initial ML model"""
    logger.logger.info("Starting initial model training...")
    
    try:
        # Load training data
        data = load_training_data()
        logger.logger.info(f"Loaded training data with shape: {data.shape}")
        
        # Initialize ML service
        ml_service = get_ml_service()
        
        # Train models
        best_model_name, best_score = ml_service.train_models(
            data=data,
            target_col='win',
            test_size=0.2
        )
        
        logger.logger.info(f"Training complete. Best model: {best_model_name} with score: {best_score}")
        logger.logger.info("Model artifacts saved successfully.")
        
    except Exception as e:
        logger.logger.error(f"Error during model training: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main() 