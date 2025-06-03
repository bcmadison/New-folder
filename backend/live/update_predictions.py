# live/update_predictions.py
import requests
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

# Configuration
ODDS_API_KEY = os.getenv("THEODDS_API_KEY")
BASE_URL_TEMPLATE = "https://api.the-odds-api.com/v4/sports/{sport}/odds"
DATA_DIR = os.path.join("backend", "data")
CSV_PATH = os.path.join(DATA_DIR, "predictions_latest.csv")

# Helper: fetch odds for a given market
def fetch_odds(sport, market):
    url = BASE_URL_TEMPLATE.format(sport=sport)
    params = {
        "apiKey": ODDS_API_KEY,
        "regions": "us",
        "markets": market,
        "oddsFormat": "decimal"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"API returned {response.status_code} for market '{market}'.")
        return []

# Main update function
def update_predictions():
    os.makedirs(DATA_DIR, exist_ok=True)
    # Try player props market first
    data = fetch_odds("basketball_nba", "player_points")
    if not data:
        # Fallback to head-to-head moneyline
        print("Falling back to h2h odds.")
        data = fetch_odds("basketball_nba", "h2h")
        # We'll map team moneyline to predictions table
        predictions = []
        for game in data:
            matchup = f"{game['home_team']} vs {game['away_team']}"
            for bookmaker in game.get("bookmakers", []):
                for market in bookmaker.get("markets", []):
                    if market.get("key") == "h2h":
                        for outcome in market.get("outcomes", []):
                            predictions.append({
                                "entity": outcome.get("name"),
                                "matchup": matchup,
                                "odds": outcome.get("price"),
                                "type": "moneyline"
                            })
        df = pd.DataFrame(predictions)
    else:
        # Format player props data
        predictions = []
        for game in data:
            home = game.get("home_team")
            away = game.get("away_team")
            for bookmaker in game.get("bookmakers", []):
                for market in bookmaker.get("markets", []):
                    if market.get("key") == "player_points":
                        for outcome in market.get("outcomes", []):
                            predictions.append({
                                "player": outcome.get("name"),
                                "team": outcome.get("name", "").split()[-1],
                                "matchup": f"{away} vs {home}",
                                "predicted_points": outcome.get("point"),
                                "actual_points": None,
                                "outcome": None
                            })
        df = pd.DataFrame(predictions)

    df.to_csv(CSV_PATH, index=False)
    print(f"Saved {len(df)} entries to {CSV_PATH}")

if __name__ == "__main__":
    update_predictions()
