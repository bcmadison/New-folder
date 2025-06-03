from fastapi import APIRouter, HTTPException, Request
import pandas as pd
import os
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

router = APIRouter()

# --- ESPN Integration: Load/refresh player stats from ESPN ---
def update_espn_stats():
    url = "https://www.espn.com/nba/stats/player"
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    if response.status_code != 200:
        return None
    soup = BeautifulSoup(response.text, 'html.parser')
    table = soup.find('table')
    if not table:
        return None
    headers = [th.get_text(strip=True) for th in table.find('thead').find_all('th')]
    players = []
    for row in table.find('tbody').find_all('tr'):
        cols = row.find_all('td')
        if len(cols) == len(headers):
            player_data = {headers[i]: cols[i].get_text(strip=True) for i in range(len(headers))}
            players.append(player_data)
    df = pd.DataFrame(players)
    out_path = os.path.join("backend", "data", "espn_player_stats.csv")
    df.to_csv(out_path, index=False)
    return df

# --- PrizePicks Integration: Scrape live lines ---
def fetch_prizepicks_lines():
    url = "https://app.prizepicks.com/projections"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json, text/plain, */*"
    }
    session = requests.Session()
    session.get(url, headers=headers)
    api_url = "https://api.prizepicks.com/projections"
    params = {"league_id": "7", "per_page": 1000}
    resp = session.get(api_url, headers=headers, params=params)
    if resp.status_code != 200:
        return []
    data = resp.json()
    lines = []
    for projection in data.get("data", []):
        player = projection.get("attributes", {}).get("name")
        stat_type = projection.get("attributes", {}).get("stat_type")
        line_score = projection.get("attributes", {}).get("line_score")
        team = projection.get("attributes", {}).get("team")
        sport = projection.get("attributes", {}).get("league")
        if player and stat_type and line_score:
            lines.append({
                "player": player,
                "line": line_score,
                "stat": stat_type,
                "team": team,
                "sport": sport
            })
    return lines

def load_lineup_data():
    data_path = os.path.join("backend", "data", "predictions_latest.csv")
    if not os.path.exists(data_path):
        raise HTTPException(status_code=404, detail="No lineup data available.")
    df = pd.read_csv(data_path)
    # Ensure required columns
    if 'id' not in df.columns:
        df['id'] = range(1, len(df) + 1)
    if 'name' not in df.columns and 'player' in df.columns:
        df['name'] = df['player']
    if 'date' not in df.columns:
        today = datetime.now().strftime('%Y-%m-%d')
        future = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        df['date'] = [today]*2 + [future]*(len(df)-2)
    if 'status' not in df.columns:
        # Mark games as 'live' if date is today, else 'future'
        today = datetime.now().strftime('%Y-%m-%d')
        df['status'] = df['date'].apply(lambda d: 'live' if d == today else 'future')
    for col in ['team', 'sport', 'position', 'stats']:
        if col not in df.columns:
            df[col] = ''
    return df

@router.get("/api/lineup")
def get_lineup(date: str = None, status: str = None, team: str = None, sport: str = None, refresh: bool = False):
    # Optionally refresh ESPN stats for latest enrichment
    if refresh:
        update_espn_stats()
    data_path = os.path.join("backend", "data", "predictions_latest.csv")
    if not os.path.exists(data_path):
        raise HTTPException(status_code=404, detail="No lineup data available.")
    df = pd.read_csv(data_path)
    # Enrich with ESPN stats if available
    espn_path = os.path.join("backend", "data", "espn_player_stats.csv")
    if os.path.exists(espn_path):
        espn_df = pd.read_csv(espn_path)
        # Merge on player name if possible
        if 'PLAYER' in espn_df.columns and 'name' in df.columns:
            df = df.merge(espn_df, left_on='name', right_on='PLAYER', how='left')
    # ...existing code for id, name, date, status, filtering, dropdowns...
    if 'id' not in df.columns:
        df['id'] = range(1, len(df) + 1)
    if 'name' not in df.columns and 'player' in df.columns:
        df['name'] = df['player']
    if 'date' not in df.columns:
        today = datetime.now().strftime('%Y-%m-%d')
        future = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        df['date'] = [today]*2 + [future]*(len(df)-2)
    if 'status' not in df.columns:
        today = datetime.now().strftime('%Y-%m-%d')
        df['status'] = df['date'].apply(lambda d: 'live' if d == today else 'future')
    for col in ['team', 'sport', 'position', 'stats']:
        if col not in df.columns:
            df[col] = ''
    # Filtering
    if date:
        df = df[df['date'] == date]
    if status and status != 'All':
        df = df[df['status'] == status]
    if team and team != 'All':
        df = df[df['team'] == team]
    if sport and sport != 'All':
        df = df[df['sport'] == sport]
    teams = sorted(df['team'].dropna().unique().tolist())
    sports = sorted(df['sport'].dropna().unique().tolist())
    return {"lineup": df.to_dict(orient="records"), "teams": teams, "sports": sports}

@router.get("/api/prizepicks")
def get_prizepicks():
    lines = fetch_prizepicks_lines()
    return {"lines": lines}

@router.post("/api/lineup/save")
def save_lineup(request: Request):
    data = request.json()
    # Here you would save the lineup to a file or database
    # For now, just return success
    return JSONResponse(content={"status": "success", "message": "Lineup saved."})