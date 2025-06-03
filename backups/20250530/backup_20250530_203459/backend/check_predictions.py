import os
import pandas as pd

csv_path = os.path.join("backend", "data", "predictions_latest.csv")

# Check existence and contents
if not os.path.exists(csv_path):
    print("File not found:", csv_path)
else:
    df = pd.read_csv(csv_path)
    print("File found. Number of rows:", len(df))
    print("Columns:", df.columns.tolist())
    print(df.head())
