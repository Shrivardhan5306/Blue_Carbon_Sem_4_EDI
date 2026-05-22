import pandas as pd
import joblib

from sklearn.ensemble import IsolationForest

# Load dataset
df = pd.read_csv("data/raw/satellite_dataset.csv")

print("Dataset shape:", df.shape)

# Select only environmental features
X = df[['NDVI','EVI','RED','SWIR','Area']]

# Train anomaly detection model
model = IsolationForest(
    n_estimators=200,
    contamination=0.02,   # assume 2% anomalies
    random_state=42
)

model.fit(X)

# Save model
joblib.dump(model, "models/anomaly_model.pkl")

print("Fraud detection model saved successfully.")
