import os
import joblib
import numpy as np

from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

from src.preprocessing import load_data, clean_data, split_features_target


def train_xgboost(data_path):

    print("Loading dataset...")
    df = load_data(data_path)
    df = clean_data(df)

    X, y = split_features_target(df)

    print("Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("Training XGBoost model...")
    model = XGBRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        random_state=42
    )

    model.fit(X_train, y_train)

    print("Evaluating model...")
    predictions = model.predict(X_test)

    r2 = r2_score(y_test, predictions)
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))

    print(f"R2 Score: {r2}")
    print(f"MAE: {mae}")
    print(f"RMSE: {rmse}")

    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/xgboost_biomass.pkl")

    print("Model saved successfully.")

    return model, r2, mae, rmse
