import pandas as pd
import os

def load_data(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")

    if os.path.getsize(path) == 0:
        raise ValueError("CSV file is empty.")

    df = pd.read_csv(path)
    return df

def clean_data(df):
    df = df.dropna()
    return df

def split_features_target(df):
    X = df[['NDVI','EVI','NIR','RED','SWIR','Area']]
    y = df['Biomass']
    return X, y
