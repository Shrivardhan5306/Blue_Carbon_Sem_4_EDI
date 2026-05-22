import optuna
import numpy as np
import joblib
import os

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score

from src.preprocessing import load_data, clean_data, split_features_target


def objective(trial, X_train, y_train, X_test, y_test):

    n_estimators = trial.suggest_int("n_estimators", 100, 500)
    max_depth = trial.suggest_int("max_depth", 5, 20)

    model = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    return r2_score(y_test, preds)


def tune_random_forest(data_path):

    df = load_data(data_path)
    df = clean_data(df)
    X, y = split_features_target(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    study = optuna.create_study(direction="maximize")
    study.optimize(
        lambda trial: objective(trial, X_train, y_train, X_test, y_test),
        n_trials=20
    )

    print("Best Parameters:", study.best_params)

    best_model = RandomForestRegressor(
        **study.best_params,
        random_state=42,
        n_jobs=-1
    )

    best_model.fit(X_train, y_train)

    os.makedirs("models", exist_ok=True)
    joblib.dump(best_model, "models/rf_tuned.pkl")

    print("Tuned model saved.")

    return best_model
