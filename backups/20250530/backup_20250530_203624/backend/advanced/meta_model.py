import pandas as pd
import os
from .train_predict import train_final_model


def predict_optimal_lineup():
    df = pd.read_csv(os.path.join("data", "predictions_latest.csv")) if os.path.exists("data/predictions_latest.csv") else pd.DataFrame()
    model, accuracy = train_final_model()
    df["predicted_outcome"] = model.predict(df.drop(columns=["actual_outcome"], errors='ignore'))
    return df, accuracy