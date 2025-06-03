import os
from dotenv import load_dotenv
from sportradar import NBA

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

def fetch_sportradar_nba():
    # Replace with your real Sportradar API key
    API_KEY = os.getenv("SPORTRADAR_API_KEY")
    nba = NBA(API_KEY)
    # Example: get all NBA players (mocked, real call may differ)
    try:
        players = nba.players()
        return players
    except Exception as e:
        print(f"Sportradar error: {e}")
        return []

if __name__ == "__main__":
    stats = fetch_sportradar_nba()
    print(stats)
