import shap
import matplotlib.pyplot as plt
import joblib
import pandas as pd

from src.preprocessing import load_data, clean_data, split_features_target


def explain_model(data_path, model_path):

    model = joblib.load(model_path)

    df = load_data(data_path)
    df = clean_data(df)
    X, _ = split_features_target(df)

    explainer = shap.Explainer(model)
    shap_values = explainer(X)

    shap.plots.bar(shap_values)
    plt.show()
