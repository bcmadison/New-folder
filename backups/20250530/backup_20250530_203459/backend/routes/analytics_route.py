from fastapi import APIRouter
import shap
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

router = APIRouter()

@router.get("/api/shap")
def get_shap_summary():
    # dummy example SHAP summary for placeholder until hooked into ensemble
    X = pd.DataFrame({
        "fatigue": np.random.rand(100),
        "travel": np.random.rand(100),
        "pts": np.random.rand(100),
        "odds_shift": np.random.rand(100),
    })
    y = np.random.randint(0, 2, 100)
    model = RandomForestClassifier().fit(X, y)

    explainer = shap.Explainer(model, X)
    shap_values = explainer(X[:1])
    summary = dict(zip(X.columns, shap_values.values[0]))

    return {"shap": summary}

@router.get("/api/analytics")
async def get_analytics():
    # Example: return realistic, non-empty metrics
    return {
        "roi": 0.124,
        "model_accuracy": 0.72,
        "value_bet_success": 0.68,
        "top_players": ["Jokic", "Judge", "McDavid", "Curry", "Tatum"],
        "bets_per_day": [
            {"date": "2025-05-28", "count": 12},
            {"date": "2025-05-29", "count": 15},
            {"date": "2025-05-30", "count": 18}
        ],
        "accuracy_over_time": [
            {"date": "2025-05-28", "accuracy": 0.68},
            {"date": "2025-05-29", "accuracy": 0.71},
            {"date": "2025-05-30", "accuracy": 0.72}
        ]
    }