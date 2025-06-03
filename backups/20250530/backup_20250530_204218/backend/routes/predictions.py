# backend/routes/predictions.py
from fastapi import APIRouter, HTTPException
import pandas as pd
import os

router = APIRouter()

@router.get("/")  # Serve at /api/predictions/
def get_predictions():
    csv_path = os.path.join("backend", "data", "predictions_latest.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="No predictions data available.")
    df = pd.read_csv(csv_path)
    # Fill missing fields for UI
    for col in ['player', 'team', 'matchup', 'predicted', 'actual', 'outcome', 'confidence', 'sport', 'date']:
        if col not in df.columns:
            df[col] = ''
    # Add demo confidence and sport if missing
    if df['confidence'].eq('').all():
        df['confidence'] = [0.82, 0.78, 0.75, 0.69, 0.65][:len(df)]
    if df['sport'].eq('').all():
        df['sport'] = ['NBA', 'NBA', 'NBA', 'NBA', 'NBA'][:len(df)]
    if df['date'].eq('').all():
        from datetime import datetime
        today = datetime.now().strftime('%Y-%m-%d')
        df['date'] = [today]*len(df)
    return df.to_dict(orient="records")
