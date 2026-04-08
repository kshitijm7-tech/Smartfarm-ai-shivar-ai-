import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report
import joblib
import argparse
import os

def create_mock_data(num_samples=1000, save_path=None):
    """Generates mock crop recommendation data."""
    # N, P, K, temperature, humidity, ph, rainfall, label
    np.random.seed(42)
    crops = ['rice', 'maize', 'chickpea', 'kidneybeans', 'pigeonpeas', 'mothbeans', 
             'mungbean', 'blackgram', 'lentil', 'pomegranate', 'banana', 'mango', 
             'grapes', 'watermelon', 'muskmelon', 'apple', 'orange', 'papaya', 
             'coconut', 'cotton', 'jute', 'coffee']
    
    data = {
        'N': np.random.randint(0, 140, num_samples),
        'P': np.random.randint(5, 145, num_samples),
        'K': np.random.randint(5, 205, num_samples),
        'temperature': np.random.uniform(8.0, 45.0, num_samples),
        'humidity': np.random.uniform(14.0, 100.0, num_samples),
        'ph': np.random.uniform(3.5, 9.9, num_samples),
        'rainfall': np.random.uniform(20.0, 298.0, num_samples),
        'label': np.random.choice(crops, num_samples)
    }
    
    df = pd.DataFrame(data)
    if save_path:
        df.to_csv(save_path, index=False)
        print(f"Mock data saved to {save_path}")
    return df

def train_model(data_path=None, model_save_path='crop_recommender.pkl'):
    """Trains a RandomForestClassifier for crop recommendation."""
    print("Starting crop recommendation model training...")
    
    # 1. Load Data
    if data_path and os.path.exists(data_path):
        print(f"Loading data from {data_path}...")
        df = pd.read_csv(data_path)
    else:
        print("No valid data path provided. Generating mock data...")
        df = create_mock_data()
        
    required_cols = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'label']
    if not all(col in df.columns for col in required_cols):
        raise ValueError(f"Data must contain all required columns: {required_cols}")

    X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
    y = df['label']
    
    # 2. Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Create Pipeline
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    # 4. Train Model
    print("Training model...")
    pipeline.fit(X_train, y_train)
    
    # 5. Evaluate Model
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    
    # Generating classification report without zero division warnings if a mock class is missing
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))
    
    # 6. Save Model
    joblib.dump(pipeline, model_save_path)
    print(f"Model successfully saved to {model_save_path}")
    
    return pipeline

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Crop Recommendation Model")
    parser.add_argument("--data", type=str, help="Path to CSV dataset. If not provided, mock data is used.", default=None)
    parser.add_argument("--output", type=str, help="Path to save the trained model (.pkl).", default="crop_recommender.pkl")
    
    args = parser.parse_args()
    
    train_model(data_path=args.data, model_save_path=args.output)
