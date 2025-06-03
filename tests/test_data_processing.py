import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import custom modules
from backend.data_processing.feature_engineering import FeatureEngineer
from backend.data_processing.data_cleaning import DataCleaner
from backend.data_processing.data_validation import DataValidator
from backend.data_processing.data_transformation import DataTransformer

# Load environment variables
load_dotenv()

@pytest.fixture
def sample_raw_data():
    """Create sample raw data"""
    # Create sample match data
    matches_df = pd.DataFrame({
        'id': range(1, 11),
        'home_team_id': [1, 2, 1, 3, 2, 1, 3, 2, 1, 3],
        'away_team_id': [2, 1, 3, 1, 3, 2, 1, 3, 2, 1],
        'match_date': [datetime.now() - timedelta(days=i) for i in range(10)],
        'home_score': [2, 1, 3, 0, 2, 1, 2, 0, 3, 1],
        'away_score': [1, 2, 1, 2, 1, 2, 0, 3, 1, 2],
        'venue': ['Old Trafford', 'Anfield', 'Old Trafford', 'Emirates', 'Anfield',
                 'Old Trafford', 'Emirates', 'Anfield', 'Old Trafford', 'Emirates'],
        'attendance': [75000, 54000, 74500, 60000, 54200, 74800, 59800, 53800, 74600, 60100],
        'referee': ['Ref1', 'Ref2', 'Ref1', 'Ref3', 'Ref2', 'Ref1', 'Ref3', 'Ref2', 'Ref1', 'Ref3']
    })
    
    # Create sample player stats
    player_stats_df = pd.DataFrame({
        'player_id': [f'player{i}' for i in range(1, 6)],
        'match_id': [1, 2, 3, 4, 5],
        'goals': [1, 0, 2, 1, 0],
        'assists': [1, 2, 0, 1, 1],
        'minutes_played': [90, 90, 90, 90, 90],
        'shots': [3, 1, 4, 2, 1],
        'shots_on_target': [2, 0, 3, 1, 0],
        'passes': [45, 50, 40, 55, 48],
        'pass_accuracy': [0.85, 0.88, 0.82, 0.90, 0.86],
        'fouls': [1, 2, 0, 1, 2],
        'yellow_cards': [0, 1, 0, 0, 1],
        'red_cards': [0, 0, 0, 0, 0]
    })
    
    # Create sample team stats
    team_stats_df = pd.DataFrame({
        'team_id': [1, 2, 3],
        'name': ['Manchester United', 'Liverpool', 'Arsenal'],
        'league': ['Premier League'] * 3,
        'season': ['2023/24'] * 3,
        'goals_scored': [25, 22, 20],
        'goals_conceded': [15, 18, 19],
        'clean_sheets': [5, 4, 3],
        'shots': [150, 140, 130],
        'shots_on_target': [75, 70, 65],
        'possession_avg': [0.55, 0.52, 0.48],
        'pass_accuracy': [0.85, 0.83, 0.81],
        'fouls': [120, 130, 140],
        'yellow_cards': [25, 30, 35],
        'red_cards': [1, 2, 1]
    })
    
    return matches_df, player_stats_df, team_stats_df

def test_data_cleaning(sample_raw_data):
    """Test DataCleaner class"""
    matches_df, player_stats_df, team_stats_df = sample_raw_data
    
    # Initialize cleaner
    cleaner = DataCleaner()
    
    # Test cleaning matches data
    cleaned_matches = cleaner.clean_matches(matches_df)
    assert not cleaned_matches.isnull().any().any()
    assert all(cleaned_matches['home_score'] >= 0)
    assert all(cleaned_matches['away_score'] >= 0)
    assert all(cleaned_matches['attendance'] > 0)
    
    # Test cleaning player stats
    cleaned_player_stats = cleaner.clean_player_stats(player_stats_df)
    assert not cleaned_player_stats.isnull().any().any()
    assert all(cleaned_player_stats['goals'] >= 0)
    assert all(cleaned_player_stats['assists'] >= 0)
    assert all(cleaned_player_stats['minutes_played'] >= 0)
    assert all(cleaned_player_stats['pass_accuracy'] <= 1)
    
    # Test cleaning team stats
    cleaned_team_stats = cleaner.clean_team_stats(team_stats_df)
    assert not cleaned_team_stats.isnull().any().any()
    assert all(cleaned_team_stats['goals_scored'] >= 0)
    assert all(cleaned_team_stats['goals_conceded'] >= 0)
    assert all(cleaned_team_stats['possession_avg'] <= 1)
    assert all(cleaned_team_stats['pass_accuracy'] <= 1)

def test_feature_engineering(sample_raw_data):
    """Test FeatureEngineer class"""
    matches_df, player_stats_df, team_stats_df = sample_raw_data
    
    # Initialize engineer
    engineer = FeatureEngineer()
    
    # Test creating match features
    match_features = engineer.create_match_features(matches_df)
    assert 'home_goals_avg' in match_features.columns
    assert 'away_goals_avg' in match_features.columns
    assert 'home_goals_against_avg' in match_features.columns
    assert 'away_goals_against_avg' in match_features.columns
    assert 'home_form' in match_features.columns
    assert 'away_form' in match_features.columns
    
    # Test creating player features
    player_features = engineer.create_player_features(player_stats_df)
    assert 'goals_per_90' in player_features.columns
    assert 'assists_per_90' in player_features.columns
    assert 'shots_per_90' in player_features.columns
    assert 'shot_accuracy' in player_features.columns
    assert 'pass_accuracy' in player_features.columns
    
    # Test creating team features
    team_features = engineer.create_team_features(team_stats_df)
    assert 'goals_per_game' in team_features.columns
    assert 'goals_against_per_game' in team_features.columns
    assert 'clean_sheet_rate' in team_features.columns
    assert 'shot_accuracy' in team_features.columns
    assert 'possession_avg' in team_features.columns

def test_data_validation(sample_raw_data):
    """Test DataValidator class"""
    matches_df, player_stats_df, team_stats_df = sample_raw_data
    
    # Initialize validator
    validator = DataValidator()
    
    # Test validating matches data
    assert validator.validate_matches(matches_df)
    
    # Test validating player stats
    assert validator.validate_player_stats(player_stats_df)
    
    # Test validating team stats
    assert validator.validate_team_stats(team_stats_df)
    
    # Test invalid data
    invalid_matches = matches_df.copy()
    invalid_matches.loc[0, 'home_score'] = -1
    assert not validator.validate_matches(invalid_matches)
    
    invalid_player_stats = player_stats_df.copy()
    invalid_player_stats.loc[0, 'pass_accuracy'] = 1.5
    assert not validator.validate_player_stats(invalid_player_stats)
    
    invalid_team_stats = team_stats_df.copy()
    invalid_team_stats.loc[0, 'possession_avg'] = 1.2
    assert not validator.validate_team_stats(invalid_team_stats)

def test_data_transformation(sample_raw_data):
    """Test DataTransformer class"""
    matches_df, player_stats_df, team_stats_df = sample_raw_data
    
    # Initialize transformer
    transformer = DataTransformer()
    
    # Test transforming matches data
    transformed_matches = transformer.transform_matches(matches_df)
    assert 'home_win' in transformed_matches.columns
    assert 'draw' in transformed_matches.columns
    assert 'away_win' in transformed_matches.columns
    assert all(transformed_matches['home_win'].isin([0, 1]))
    assert all(transformed_matches['draw'].isin([0, 1]))
    assert all(transformed_matches['away_win'].isin([0, 1]))
    
    # Test transforming player stats
    transformed_player_stats = transformer.transform_player_stats(player_stats_df)
    assert 'performance_score' in transformed_player_stats.columns
    assert all(transformed_player_stats['performance_score'] >= 0)
    assert all(transformed_player_stats['performance_score'] <= 1)
    
    # Test transforming team stats
    transformed_team_stats = transformer.transform_team_stats(team_stats_df)
    assert 'attack_strength' in transformed_team_stats.columns
    assert 'defense_strength' in transformed_team_stats.columns
    assert all(transformed_team_stats['attack_strength'] >= 0)
    assert all(transformed_team_stats['defense_strength'] >= 0)

def test_pipeline_integration(sample_raw_data):
    """Test integration of all data processing components"""
    matches_df, player_stats_df, team_stats_df = sample_raw_data
    
    # Initialize components
    cleaner = DataCleaner()
    engineer = FeatureEngineer()
    validator = DataValidator()
    transformer = DataTransformer()
    
    # Clean data
    cleaned_matches = cleaner.clean_matches(matches_df)
    cleaned_player_stats = cleaner.clean_player_stats(player_stats_df)
    cleaned_team_stats = cleaner.clean_team_stats(team_stats_df)
    
    # Validate cleaned data
    assert validator.validate_matches(cleaned_matches)
    assert validator.validate_player_stats(cleaned_player_stats)
    assert validator.validate_team_stats(cleaned_team_stats)
    
    # Create features
    match_features = engineer.create_match_features(cleaned_matches)
    player_features = engineer.create_player_features(cleaned_player_stats)
    team_features = engineer.create_team_features(cleaned_team_stats)
    
    # Transform data
    transformed_matches = transformer.transform_matches(match_features)
    transformed_player_stats = transformer.transform_player_stats(player_features)
    transformed_team_stats = transformer.transform_team_stats(team_features)
    
    # Verify final output
    assert not transformed_matches.isnull().any().any()
    assert not transformed_player_stats.isnull().any().any()
    assert not transformed_team_stats.isnull().any().any()
    
    # Verify feature relationships
    assert all(transformed_matches['home_win'] + transformed_matches['draw'] + 
              transformed_matches['away_win'] == 1)
    assert all(transformed_player_stats['performance_score'] >= 0)
    assert all(transformed_team_stats['attack_strength'] >= 0)
    assert all(transformed_team_stats['defense_strength'] >= 0) 