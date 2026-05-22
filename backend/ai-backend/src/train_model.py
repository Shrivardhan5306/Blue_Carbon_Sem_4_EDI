import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
from xgboost import XGBRegressor


# Load dataset
df = pd.read_csv("data/raw/satellite_dataset.csv")

print("Dataset shape:", df.shape)
print(df.head())


# Clean dataset
df = df.dropna()

df = df[df["NDVI"] <= 1]
df = df[df["NDVI"] >= -1]


# Select features (NIR removed because it doesn't exist)
X = df[['NDVI','EVI','RED','SWIR','Area']]
y = df['Biomass']


# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Training rows:", len(X_train))
print("Testing rows:", len(X_test))


# Train Random Forest
rf_model = RandomForestRegressor(
    n_estimators=300,
    max_depth=10,
    random_state=42
)

rf_model.fit(X_train, y_train)


# Train XGBoost
xgb_model = XGBRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=6
)

xgb_model.fit(X_train, y_train)


# Evaluate models
rf_pred = rf_model.predict(X_test)
xgb_pred = xgb_model.predict(X_test)

print("\nModel Evaluation")

print("Random Forest R2:", r2_score(y_test, rf_pred))
print("XGBoost R2:", r2_score(y_test, xgb_pred))

print("RF MAE:", mean_absolute_error(y_test, rf_pred))
print("XGB MAE:", mean_absolute_error(y_test, xgb_pred))


# Save best model
joblib.dump(xgb_model, "models/biomass_model.pkl")

print("\nModel saved successfully in models/biomass_model.pkl")


# Test prediction
sample = [[0.6,0.4,0.1,0.25,250000]]

prediction = xgb_model.predict(sample)

print("\nSample Prediction:")
print("Predicted Biomass:", prediction)
