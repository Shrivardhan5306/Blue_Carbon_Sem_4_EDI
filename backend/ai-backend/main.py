from src.train_rf import train_random_forest
from src.train_xgb import train_xgboost

DATA_PATH = "data/raw/dummy_satellite_data.csv"

print("----- TRAINING RANDOM FOREST -----")
rf_model, rf_r2, rf_mae, rf_rmse = train_random_forest(DATA_PATH)

print("\n----- TRAINING XGBOOST -----")
xgb_model, xgb_r2, xgb_mae, xgb_rmse = train_xgboost(DATA_PATH)

print("\n----- MODEL COMPARISON -----")

if rf_r2 > xgb_r2:
    print("Random Forest is better based on R2 score.")
else:
    print("XGBoost is better based on R2 score.")
from src.tune_rf import tune_random_forest
from src.explain_model import explain_model

print("\n----- TUNING RANDOM FOREST -----")
tuned_model = tune_random_forest(DATA_PATH)

print("\n----- EXPLAINING MODEL -----")
explain_model(DATA_PATH, "models/rf_tuned.pkl")
from src.train_lstm import train_lstm

print("\n----- TRAINING LSTM FORECAST MODEL -----")
train_lstm("data/raw/dummy_timeseries.csv")
from src.anomaly import train_anomaly_detector

print("\n----- TRAINING ANOMALY DETECTOR -----")
train_anomaly_detector(DATA_PATH)
