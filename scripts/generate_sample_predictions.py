# This script creates a sample predictions_latest.csv file in backend/data
import os
import pandas as pd

# Ensure the directory exists
os.makedirs("backend/data", exist_ok=True)

# Sample data
sample_data = [
    {"player": "LeBron James", "team": "LAL", "matchup": "LAL vs BOS", "predicted": 28.4, "actual": 30, "outcome": "Over"},
    {"player": "Jayson Tatum", "team": "BOS", "matchup": "LAL vs BOS", "predicted": 26.1, "actual": 25, "outcome": "Under"},
    {"player": "Stephen Curry", "team": "GSW", "matchup": "GSW vs MIA", "predicted": 30.2, "actual": 30, "outcome": "Push"},
]

# Create the DataFrame and save
csv_path = os.path.join("backend", "data", "predictions_latest.csv")
df = pd.DataFrame(sample_data)
df.to_csv(csv_path, index=False)

print(f"✅ Sample predictions written to {csv_path}")
