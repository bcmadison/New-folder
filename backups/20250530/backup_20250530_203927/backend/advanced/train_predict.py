
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import RFE
from sklearn.metrics import accuracy_score
from xgboost import XGBClassifier
from skopt import BayesSearchCV

def load_data(path="backend/data/predictions_latest.csv"):
    df = pd.read_csv(path)
    return df

def time_series_features(df, window=5):
    df = df.sort_values(["team", "match_date"])
    df['avg_goals_last_5'] = df.groupby('team')['goals'].rolling(window=window).mean().reset_index(level=0, drop=True)
    df['win_streak'] = df.groupby('team')['win'].apply(lambda x: x * (x.groupby((x != x.shift()).cumsum()).cumcount() + 1))
    return df

def recursive_elimination(X, y):
    model = RandomForestClassifier(n_estimators=100)
    rfe = RFE(model, n_features_to_select=10)
    X_rfe = rfe.fit_transform(X, y)
    return X_rfe

def bayesian_optimize(X, y):
    model = XGBClassifier(eval_metric='logloss', use_label_encoder=False)
    search = BayesSearchCV(
        model,
        {"max_depth": (3, 10), "learning_rate": (0.01, 0.3, 'log-uniform')},
        n_iter=20, cv=3
    )
    search.fit(X, y)
    return search.best_estimator_

def train_final_model():
    df = load_data()
    df = time_series_features(df)
    df.dropna(inplace=True)
    y = df['outcome']
    X = df.drop(columns=['match_date', 'outcome'])

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_selected = recursive_elimination(X_scaled, y)

    best_model = bayesian_optimize(X_selected, y)

    X_train, X_test, y_train, y_test = train_test_split(X_selected, y, test_size=0.2)
    best_model.fit(X_train, y_train)
    preds = best_model.predict(X_test)
    acc = accuracy_score(y_test, preds)

    return best_model, acc
