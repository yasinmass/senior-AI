# core/ml_predictor.py
# Handles MFCC feature extraction and dementia model inference

import numpy as np
import joblib
import librosa
import os
import tempfile
from django.conf import settings

# Path to the model file (one level up from /backend/)
MODEL_PATH = settings.BASE_DIR.parent / 'dementia_model (1).pkl'

# Lazy-load model to avoid reloading on every request
_model = None


def get_model():
    global _model
    if _model is None:
        try:
            _model = joblib.load(str(MODEL_PATH))
            print(f"[ML] Dementia model loaded from: {MODEL_PATH}")
        except Exception as e:
            print(f"[ML] ERROR loading model: {e}")
    return _model


def extract_26_features(file_path: str) -> np.ndarray:
    """
    Extract 26 MFCC-based features from an audio file:
    - 13 MFCC means (time-averaged)
    - 13 MFCC standard deviations (time variance)

    Returns shape (1, 26).
    """
    y, sr = librosa.load(file_path, sr=16000, mono=True)

    # Trim leading/trailing silence
    y, _ = librosa.effects.trim(y, top_db=20)

    if len(y) < 1600:  # Less than 0.1 seconds
        raise ValueError("Audio too short for analysis (minimum 0.1 seconds).")

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

    mfcc_mean = np.mean(mfcc, axis=1)   # shape (13,)
    mfcc_std  = np.std(mfcc, axis=1)    # shape (13,)

    features = np.concatenate([mfcc_mean, mfcc_std]).reshape(1, -1)  # shape (1, 26)
    return features


def predict_dementia(file_path: str) -> dict:
    """
    Run the dementia model on the given audio file.
    Returns a dict with:
      - prediction: 'dementia' or 'normal'
      - dementia_probability: float (0-100)
      - normal_probability: float (0-100)
    """
    model = get_model()
    if model is None:
        raise RuntimeError("Dementia model could not be loaded.")

    features = extract_26_features(file_path)

    prediction = model.predict(features)[0]          # 'dementia' or 'normal'
    probabilities = model.predict_proba(features)[0]  # [P(dementia), P(normal)]

    # classes_ = ['dementia', 'normal'] — index 0 = dementia, index 1 = normal
    class_list = list(model.classes_)
    dem_idx = class_list.index('dementia')
    nor_idx = class_list.index('normal')

    return {
        'prediction': prediction,
        'dementia_probability': round(float(probabilities[dem_idx]) * 100, 1),
        'normal_probability':   round(float(probabilities[nor_idx]) * 100, 1),
    }


def combined_risk_level(ml_prediction: str, ml_dementia_prob: float, quiz_total: int) -> str:
    """
    Combines ML audio model output + cognitive quiz score into one final risk level.

    Logic:
    - HIGH:     ML says dementia (prob > 55%)  AND  quiz score < 20
    - MODERATE: ML says dementia  OR  quiz score < 20
    - LOW:      ML says normal    AND  quiz score >= 20
    """
    ml_positive = ml_prediction == 'dementia' and ml_dementia_prob > 55.0
    quiz_poor   = quiz_total < 20

    if ml_positive and quiz_poor:
        return 'High'
    elif ml_positive or quiz_poor:
        return 'Moderate'
    else:
        return 'Low'
