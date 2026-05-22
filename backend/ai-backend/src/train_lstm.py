import numpy as np
import pandas as pd
import os
import joblib
import matplotlib.pyplot as plt

from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense


def create_sequences(data, sequence_length=3):
    X, y = [], []
    for i in range(len(data) - sequence_length):
        X.append(data[i:i+sequence_length])
        y.append(data[i+sequence_length])
    return np.array(X), np.array(y)


def train_lstm(data_path):

    df = pd.read_csv(data_path)
    values = df["NDVI"].values.reshape(-1, 1)

    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(values)

    sequence_length = 3
    X, y = create_sequences(scaled_data, sequence_length)

    X = X.reshape((X.shape[0], X.shape[1], 1))

    model = Sequential()
    model.add(LSTM(50, return_sequences=True, input_shape=(sequence_length, 1)))
    model.add(LSTM(50))
    model.add(Dense(1))

    model.compile(optimizer="adam", loss="mse")

    model.fit(X, y, epochs=50, verbose=1)

    os.makedirs("models", exist_ok=True)
    model.save("models/lstm_carbon_forecast.h5")

    print("LSTM model saved.")

    # Forecast next value
    last_sequence = scaled_data[-sequence_length:]
    last_sequence = last_sequence.reshape((1, sequence_length, 1))

    next_prediction = model.predict(last_sequence)
    next_prediction = scaler.inverse_transform(next_prediction)

    print("Next Month Predicted NDVI:", next_prediction[0][0])

    return model
