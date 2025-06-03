import pytest
from datetime import datetime, timedelta
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import custom modules
from frontend.components.match_prediction import MatchPrediction
from frontend.components.player_stats import PlayerStats
from frontend.components.team_stats import TeamStats
from frontend.components.league_table import LeagueTable
from frontend.components.prediction_history import PredictionHistory

# Load environment variables
load_dotenv()

@pytest.fixture
def sample_match_data():
    """Create sample match data"""
    return {
        'id': 1,
        'home_team': 'Manchester United',
        'away_team': 'Liverpool',
        'match_date': datetime.now() + timedelta(days=1),
        'home_win_prob': 0.4,
        'draw_prob': 0.3,
        'away_win_prob': 0.3,
        'confidence': 0.85
    }

@pytest.fixture
def sample_player_data():
    """Create sample player data"""
    return {
        'id': 'player1',
        'name': 'John Doe',
        'team': 'Manchester United',
        'goals': 10,
        'assists': 5,
        'minutes_played': 1800,
        'form': [1, 1, 0, 1, 0]  # Last 5 matches: 1=win, 0=loss
    }

@pytest.fixture
def sample_team_data():
    """Create sample team data"""
    return {
        'id': 1,
        'name': 'Manchester United',
        'league': 'Premier League',
        'goals_scored': 25,
        'goals_conceded': 15,
        'wins': 8,
        'draws': 2,
        'losses': 3,
        'points': 26
    }

def test_match_prediction(sample_match_data):
    """Test MatchPrediction component"""
    # Initialize component
    prediction = MatchPrediction(sample_match_data)
    
    # Test prediction display
    display = prediction.render()
    assert 'Manchester United' in display
    assert 'Liverpool' in display
    assert '0.4' in display  # Home win probability
    assert '0.85' in display  # Confidence
    
    # Test prediction update
    new_data = sample_match_data.copy()
    new_data['home_win_prob'] = 0.5
    new_data['confidence'] = 0.9
    prediction.update(new_data)
    
    updated_display = prediction.render()
    assert '0.5' in updated_display
    assert '0.9' in updated_display

def test_player_stats(sample_player_data):
    """Test PlayerStats component"""
    # Initialize component
    stats = PlayerStats(sample_player_data)
    
    # Test stats display
    display = stats.render()
    assert 'John Doe' in display
    assert 'Manchester United' in display
    assert '10' in display  # Goals
    assert '5' in display  # Assists
    
    # Test form display
    form_display = stats.render_form()
    assert len(form_display) == 5  # Last 5 matches
    assert all(x in ['W', 'L'] for x in form_display)
    
    # Test stats update
    new_data = sample_player_data.copy()
    new_data['goals'] = 12
    new_data['assists'] = 6
    stats.update(new_data)
    
    updated_display = stats.render()
    assert '12' in updated_display
    assert '6' in updated_display

def test_team_stats(sample_team_data):
    """Test TeamStats component"""
    # Initialize component
    stats = TeamStats(sample_team_data)
    
    # Test stats display
    display = stats.render()
    assert 'Manchester United' in display
    assert 'Premier League' in display
    assert '25' in display  # Goals scored
    assert '15' in display  # Goals conceded
    assert '26' in display  # Points
    
    # Test stats update
    new_data = sample_team_data.copy()
    new_data['goals_scored'] = 30
    new_data['points'] = 29
    stats.update(new_data)
    
    updated_display = stats.render()
    assert '30' in updated_display
    assert '29' in updated_display

def test_league_table():
    """Test LeagueTable component"""
    # Create sample league data
    league_data = [
        {
            'id': 1,
            'name': 'Manchester United',
            'points': 26,
            'goals_scored': 25,
            'goals_conceded': 15
        },
        {
            'id': 2,
            'name': 'Liverpool',
            'points': 24,
            'goals_scored': 22,
            'goals_conceded': 18
        }
    ]
    
    # Initialize component
    table = LeagueTable(league_data)
    
    # Test table display
    display = table.render()
    assert 'Manchester United' in display
    assert 'Liverpool' in display
    assert '26' in display
    assert '24' in display
    
    # Test sorting
    sorted_display = table.render(sort_by='points')
    assert sorted_display[0]['name'] == 'Manchester United'
    assert sorted_display[1]['name'] == 'Liverpool'

def test_prediction_history():
    """Test PredictionHistory component"""
    # Create sample prediction history
    history_data = [
        {
            'match_id': 1,
            'home_team': 'Manchester United',
            'away_team': 'Liverpool',
            'prediction': 'home_win',
            'confidence': 0.85,
            'actual_result': 'home_win',
            'correct': True
        },
        {
            'match_id': 2,
            'home_team': 'Arsenal',
            'away_team': 'Chelsea',
            'prediction': 'draw',
            'confidence': 0.75,
            'actual_result': 'away_win',
            'correct': False
        }
    ]
    
    # Initialize component
    history = PredictionHistory(history_data)
    
    # Test history display
    display = history.render()
    assert 'Manchester United' in display
    assert 'Liverpool' in display
    assert 'Arsenal' in display
    assert 'Chelsea' in display
    assert '0.85' in display
    assert '0.75' in display
    
    # Test filtering
    filtered_display = history.render(filter_correct=True)
    assert len(filtered_display) == 1
    assert filtered_display[0]['match_id'] == 1
    
    # Test accuracy calculation
    accuracy = history.calculate_accuracy()
    assert accuracy == 0.5  # 1 correct out of 2 predictions

def test_component_interaction():
    """Test interaction between components"""
    # Create sample data
    match_data = {
        'id': 1,
        'home_team': 'Manchester United',
        'away_team': 'Liverpool',
        'match_date': datetime.now() + timedelta(days=1),
        'home_win_prob': 0.4,
        'draw_prob': 0.3,
        'away_win_prob': 0.3,
        'confidence': 0.85
    }
    
    player_data = {
        'id': 'player1',
        'name': 'John Doe',
        'team': 'Manchester United',
        'goals': 10,
        'assists': 5,
        'minutes_played': 1800,
        'form': [1, 1, 0, 1, 0]
    }
    
    # Initialize components
    prediction = MatchPrediction(match_data)
    player_stats = PlayerStats(player_data)
    
    # Test data sharing
    prediction.add_player_stats(player_stats)
    display = prediction.render()
    assert 'John Doe' in display
    assert '10' in display  # Goals
    
    # Test event handling
    def on_prediction_update(new_data):
        player_stats.update({'form': [1, 1, 1, 1, 1]})
    
    prediction.on_update(on_prediction_update)
    prediction.update({'home_win_prob': 0.5})
    
    updated_player_display = player_stats.render_form()
    assert all(x == 'W' for x in updated_player_display) 