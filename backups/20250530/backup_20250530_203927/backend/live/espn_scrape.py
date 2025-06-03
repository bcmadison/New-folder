import requests
import pandas as pd
import os
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

def fetch_espn_player_stats():
    url = "https://www.espn.com/nba/stats/player"
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    if response.status_code != 200:
        print("Failed to fetch ESPN stats")
        return []
    soup = BeautifulSoup(response.text, 'html.parser')
    players = []
    # ESPN's table structure: find the main stats table
    table = soup.find('table')
    if not table:
        print("No table found on ESPN stats page.")
        return []
    headers = [th.get_text(strip=True) for th in table.find('thead').find_all('th')]
    for row in table.find('tbody').find_all('tr'):
        cols = row.find_all('td')
        if len(cols) == len(headers):
            player_data = {headers[i]: cols[i].get_text(strip=True) for i in range(len(headers))}
            players.append(player_data)
    # Save to CSV for backend use
    df = pd.DataFrame(players)
    out_path = os.path.join("backend", "data", "espn_player_stats.csv")
    df.to_csv(out_path, index=False)
    print(f"Saved {len(df)} ESPN player stats to {out_path}")
    return players

if __name__ == "__main__":
    fetch_espn_player_stats()
