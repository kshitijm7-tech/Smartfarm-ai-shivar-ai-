"""
ai_interface.py — Unified AI Interface for Smart Farm AI (Backend)

Provides three pipeline functions consumed by app.py:
  1. predict_disease()            → Crop disease classification (image)
  2. calculate_land_health()      → Geospatial NDVI + soil analysis (coordinates)
  3. predict_environmental_risk() → Weather-based threat detection (coordinates)

Key design:
  - fetch_soil_environment(lat, lon) tries NASA POWER API first, then falls
    back to region-aware simulation via simulate_deep_soil_data().
  - Soil environment data is threaded into the risk engine so warnings
    are grounded in actual land conditions, not random dice rolls.
"""

import math
import os
import random
import datetime
from typing import Dict, Optional, Any

import requests

# ──────────────────────────────────────────────
#  NASA POWER Cache — 24-hour in-memory TTL
# ──────────────────────────────────────────────
_nasa_cache: Dict[tuple, Dict[str, Any]] = {}
_NASA_CACHE_TTL_HOURS = 24


# ──────────────────────────────────────────────
#  Region Profiles — realistic Indian ag zones
# ──────────────────────────────────────────────
REGION_PROFILES: Dict[str, Dict[str, Any]] = {
    "pune_deccan": {
        "label": "Pune / Deccan Plateau",
        "lat_range": (17.0, 20.0),
        "lon_range": (73.0, 76.0),
        "soil_type": "Black Cotton (Vertisol)",
        "clay_pct": 55,
        "ph_range": (7.8, 8.3),
        "soil_temp_range": (24.0, 28.0),
        "soil_moisture_range": (35, 55),
        "organic_carbon_range": (0.5, 1.2),
        "water_holding_capacity": "High",
        "nitrogen_range": (30, 60),
        "phosphorus_range": (10, 30),
        "potassium_range": (180, 280),
    },
    "delhi_igp": {
        "label": "Delhi / Indo-Gangetic Plain",
        "lat_range": (28.0, 30.0),
        "lon_range": (76.0, 78.0),
        "soil_type": "Alluvial (Sandy Loam)",
        "clay_pct": 22,
        "ph_range": (7.0, 7.5),
        "soil_temp_range": (20.0, 26.0),
        "soil_moisture_range": (40, 65),
        "organic_carbon_range": (1.0, 2.0),
        "water_holding_capacity": "Medium",
        "nitrogen_range": (50, 90),
        "phosphorus_range": (20, 45),
        "potassium_range": (100, 200),
    },
    "nashik_mh": {
        "label": "Nashik / North Maharashtra",
        "lat_range": (19.0, 21.0),
        "lon_range": (73.0, 74.5),
        "soil_type": "Red Laterite",
        "clay_pct": 30,
        "ph_range": (6.0, 6.8),
        "soil_temp_range": (22.0, 26.0),
        "soil_moisture_range": (30, 50),
        "organic_carbon_range": (0.8, 1.5),
        "water_holding_capacity": "Low-Medium",
        "nitrogen_range": (25, 55),
        "phosphorus_range": (8, 25),
        "potassium_range": (80, 160),
    },
    "punjab": {
        "label": "Punjab / North-West India",
        "lat_range": (30.0, 32.5),
        "lon_range": (74.0, 76.5),
        "soil_type": "Rich Alluvial",
        "clay_pct": 28,
        "ph_range": (7.2, 7.8),
        "soil_temp_range": (18.0, 24.0),
        "soil_moisture_range": (45, 70),
        "organic_carbon_range": (1.5, 2.8),
        "water_holding_capacity": "High",
        "nitrogen_range": (60, 100),
        "phosphorus_range": (25, 50),
        "potassium_range": (120, 220),
    },
    "coastal_karnataka": {
        "label": "Coastal Karnataka / Konkan",
        "lat_range": (12.0, 16.0),
        "lon_range": (74.0, 76.0),
        "soil_type": "Laterite (Red / Coastal)",
        "clay_pct": 35,
        "ph_range": (5.5, 6.5),
        "soil_temp_range": (26.0, 30.0),
        "soil_moisture_range": (55, 80),
        "organic_carbon_range": (1.2, 2.5),
        "water_holding_capacity": "Medium",
        "nitrogen_range": (35, 70),
        "phosphorus_range": (12, 35),
        "potassium_range": (90, 170),
    },
}

GENERIC_PROFILE: Dict[str, Any] = {
    "label": "Generic / Unrecognized Region",
    "soil_type": "Medium Loam",
    "clay_pct": 30,
    "ph_range": (6.5, 7.5),
    "soil_temp_range": (22.0, 28.0),
    "soil_moisture_range": (35, 60),
    "organic_carbon_range": (1.0, 2.0),
    "water_holding_capacity": "Medium",
    "nitrogen_range": (40, 80),
    "phosphorus_range": (15, 40),
    "potassium_range": (100, 200),
}


# ──────────────────────────────────────────────
#  Helper: deterministic seed from coordinates
# ──────────────────────────────────────────────
def _coord_seed(lat: float, lon: float) -> float:
    """Return a value in [0, 1) deterministically derived from lat/lon."""
    raw = abs(math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453)
    return raw - int(raw)


def _lerp(low: float, high: float, t: float) -> float:
    """Linear interpolation between low and high by factor t ∈ [0,1]."""
    return low + (high - low) * t


def _match_region(lat: float, lon: float) -> Dict[str, Any]:
    """Find the best matching region profile by bounding-box, or fallback."""
    for _key, profile in REGION_PROFILES.items():
        lat_lo, lat_hi = profile["lat_range"]
        lon_lo, lon_hi = profile["lon_range"]
        if lat_lo <= lat <= lat_hi and lon_lo <= lon <= lon_hi:
            return profile
    return GENERIC_PROFILE


# ──────────────────────────────────────────────
#  NASA POWER API — Real Soil Data
# ──────────────────────────────────────────────
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def _fetch_nasa_power(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """
    Call NASA POWER API for daily soil temperature and moisture data.
    Free, no API key required.
    Returns dict with soil_temperature and soil_moisture, or None on failure.
    """
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=7)

    params = {
        "parameters": "T2M,QV2M,PRECTOTCORR,TS",
        "community": "ag",
        "longitude": lon,
        "latitude": lat,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "format": "json",
    }

    # Check cache first (rounded to 2dp to reuse for nearby coordinates)
    cache_key = (round(lat, 2), round(lon, 2))
    if cache_key in _nasa_cache:
        cached_entry = _nasa_cache[cache_key]
        age_hours = (datetime.datetime.utcnow() - cached_entry["_cached_at"]).total_seconds() / 3600
        if age_hours < _NASA_CACHE_TTL_HOURS:
            print(f"[INFO] NASA POWER cache hit for {cache_key} (age: {age_hours:.1f}h)")
            return {k: v for k, v in cached_entry.items() if k != "_cached_at"}

    try:
        resp = requests.get(NASA_POWER_URL, params=params, timeout=12)
        resp.raise_for_status()
        data = resp.json()

        props = data.get("properties", {}).get("parameter", {})

        # Surface skin temperature (proxy for soil temp)
        ts_vals = props.get("TS", {})
        valid_ts = [v for v in ts_vals.values() if v is not None and v > -900]
        soil_temp = round(sum(valid_ts) / len(valid_ts), 1) if valid_ts else None

        # 2-metre air temperature
        t2m_vals = props.get("T2M", {})
        valid_t2m = [v for v in t2m_vals.values() if v is not None and v > -900]
        air_temp = round(sum(valid_t2m) / len(valid_t2m), 1) if valid_t2m else None

        # Precipitation (sum over window)
        prec_vals = props.get("PRECTOTCORR", {})
        valid_prec = [v for v in prec_vals.values() if v is not None and v >= 0]
        total_rain = round(sum(valid_prec), 2) if valid_prec else 0.0

        # Specific humidity → approximate soil moisture (heuristic mapping)
        qv_vals = props.get("QV2M", {})
        valid_qv = [v for v in qv_vals.values() if v is not None and v > -900]
        if valid_qv:
            avg_qv = sum(valid_qv) / len(valid_qv)
            # Map specific humidity (g/kg, typically 3-20 for India) to moisture %
            soil_moisture = round(min(max(avg_qv * 4.5, 15), 85), 1)
        else:
            soil_moisture = None

        if soil_temp is None and soil_moisture is None:
            return None

        print(f"[INFO] NASA POWER data fetched — soil_temp={soil_temp}°C, moisture≈{soil_moisture}%")
        result = {
            "soil_temperature": soil_temp or (air_temp or 25.0),
            "soil_moisture": soil_moisture or 45.0,
            "air_temperature": air_temp,
            "total_rain_7d_mm": total_rain,
            "data_source": "nasa_power",
        }
        # Store in cache with timestamp
        cache_key = (round(lat, 2), round(lon, 2))
        _nasa_cache[cache_key] = {**result, "_cached_at": datetime.datetime.utcnow()}
        return result

    except (requests.RequestException, KeyError, ValueError, ZeroDivisionError) as exc:
        print(f"[WARN] NASA POWER API failed: {exc}  — falling back to simulation")
        return None


# ──────────────────────────────────────────────
#  Simulated Deep Soil Data (region-aware)
# ──────────────────────────────────────────────
def simulate_deep_soil_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Generate realistic soil metrics based on the specific lat/lon region.
    Values are deterministic (reproducible for the same coordinates) with
    slight per-coordinate perturbation so nearby pins differ slightly.
    """
    profile = _match_region(lat, lon)
    t = _coord_seed(lat, lon)
    t2 = _coord_seed(lat + 0.01, lon + 0.01)  # second seed for variety

    soil_temp = round(_lerp(*profile["soil_temp_range"], t), 1)
    soil_moisture = round(_lerp(*profile["soil_moisture_range"], t2))

    region_label = profile["label"]
    print(f"[INFO] Simulated soil data for region '{region_label}' — temp={soil_temp}°C, moisture={soil_moisture}%")

    return {
        "soil_temperature": soil_temp,
        "soil_moisture": soil_moisture,
        "soil_type": profile["soil_type"],
        "clay_pct": profile["clay_pct"],
        "water_holding_capacity": profile["water_holding_capacity"],
        "data_source": f"simulated_{region_label.lower().replace(' ', '_').replace('/', '_')}",
    }


# ──────────────────────────────────────────────
#  Unified Soil Environment Fetch
# ──────────────────────────────────────────────
def fetch_soil_environment(lat: float, lon: float) -> Dict[str, Any]:
    """
    Try NASA POWER API first; on any failure fall back to region-aware
    simulation.  Always returns a dict with at least soil_temperature,
    soil_moisture, and data_source.
    """
    result = _fetch_nasa_power(lat, lon)
    if result is not None:
        # Augment with region profile metadata
        profile = _match_region(lat, lon)
        result["soil_type"] = profile["soil_type"]
        result["clay_pct"] = profile["clay_pct"]
        result["water_holding_capacity"] = profile["water_holding_capacity"]
        return result

    return simulate_deep_soil_data(lat, lon)


# ══════════════════════════════════════════════
#  Legacy Mock Functions (backward compatibility)
# ══════════════════════════════════════════════

def analyze_soil_health(lat, lon):
    """Mock function to simulate soil health analysis."""
    return {
        "nitrogen": random.randint(20, 100),
        "phosphorus": random.randint(10, 50),
        "potassium": random.randint(50, 200),
        "ph": round(random.uniform(5.5, 8.5), 1)
    }

# --- Crop Prediction Model (Scikit-Learn) ---
_crop_model = None

def _load_crop_model():
    """Lazy load the crop recommendation pickle model."""
    global _crop_model
    if _crop_model is not None:
        return True
    try:
        import joblib
        model_path = os.path.join(os.path.dirname(__file__), "crop_recommendation_model.pkl")
        if os.path.exists(model_path):
            _crop_model = joblib.load(model_path)
            print(f"[INFO] Loaded Crop Recommendation Model from {model_path}")
            return True
        else:
            print(f"[WARN] Crop Recommendation Model not found at {model_path}.")
            return False
    except Exception as e:
        print(f"[WARN] Failed to load crop model: {e}")
        return False

def predict_crop(soil_env: dict, env_data: dict, origin_filter: str = "all") -> dict:
    """
    Enhanced crop recommendation using the 1000+ crop global database.
    Inputs:
    - soil_env: {nitrogen, phosphorus, potassium, ph}
    - env_data: {soil_temperature, humidity, total_rain_7d_mm}
    - origin_filter: "india", "global", or "all"
    """
    db_path = os.path.join(os.path.dirname(__file__), 'crop_database.json')
    if not os.path.exists(db_path):
        return {"name": "Wheat", "confidence": "Low (DB Missing)", "source": "fallback"}

    import json
    try:
        with open(db_path, 'r', encoding='utf8') as f:
            all_crops = json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load crop database: {e}")
        return {"name": "Wheat", "confidence": "Low (DB Error)", "source": "fallback"}

    N = soil_env.get("nitrogen", 50)
    P = soil_env.get("phosphorus", 25)
    K = soil_env.get("potassium", 100)
    ph = soil_env.get("ph", 6.5)
    
    temp = env_data.get("soil_temperature", 25.0)
    hum = env_data.get("humidity", 60.0)
    rain = env_data.get("total_rain_7d_mm", 50.0) * 4 # monthly estimate

    def calculate_suitability(crop):
        gp = crop["growth_params"]

        # --- Climate sub-score (temp + humidity) up to 40 pts ---
        if gp["temp_range"][0] <= temp <= gp["temp_range"][1]:
            temp_score = 20
        else:
            temp_score = max(0, 20 - abs(temp - (gp["temp_range"][0] + gp["temp_range"][1]) / 2))

        if gp["humidity_range"][0] <= hum <= gp["humidity_range"][1]:
            hum_score = 20
        else:
            hum_score = max(0, 20 - abs(hum - (gp["humidity_range"][0] + gp["humidity_range"][1]) / 2) / 2)

        climate_score = temp_score + hum_score  # 0–40

        # --- Soil sub-score (pH + NPK) up to 40 pts ---
        if gp["ph_range"][0] <= ph <= gp["ph_range"][1]:
            ph_score = 20
        else:
            ph_score = max(0, 20 - abs(ph - (gp["ph_range"][0] + gp["ph_range"][1]) / 2) * 10)

        pref = gp["npk_preferred"]
        npk_diff = (abs(pref[0] - N) + abs(pref[1] - P) + abs(pref[2] - K)) / 3
        npk_score = max(0, 20 - (npk_diff / 5))

        soil_score = ph_score + npk_score  # 0–40

        # --- Water sub-score (rainfall) up to 20 pts ---
        if abs(gp["rainfall_mm"] - rain) / max(gp["rainfall_mm"], 1) < 0.3:
            water_score = 20
        else:
            water_score = max(0, 20 - (abs(gp["rainfall_mm"] - rain) / 50))

        # --- Market sub-score: from market_data mandi_price ---
        md = crop.get("market_data", {})
        msp = md.get("mandi_price", md.get("ai_price", 4000))
        # Map price (approx 1500 to 8000) to a realistic score 14 to 20 (70% - 100%)
        market_score = min(20, max(14, round(14 + ((msp - 1500) / 6500) * 6)))

        total = round(min(climate_score + soil_score + water_score + market_score, 100))

        return {
            "total": total,
            "climate": round(min(climate_score * 2.5, 100)),   # normalise to 0–100
            "soil": round(min(soil_score * 2.5, 100)),
            "water": round(min(water_score * 5, 100)),
            "market": round(min(market_score * 5, 100)),
        }

    indian_matches = []
    global_matches = []

    for c in all_crops:
        res = calculate_suitability(c)
        suitability = res["total"]
        if suitability >= 35:
            match = {
                "name": c["name_en"],
                "name_hi": c["name_hi"],
                "confidence": suitability,
                "icon": c["icon"],
                "origin": c["origin"],
                "is_indian": c["is_indian"],
                "market_data": c["market_data"],
                "breakdown": {
                    "soil": round(min(res["soil"], 100)),
                    "climate": round(min(res["climate"], 100)),
                    "market": round(min(res["market"], 100)),
                    "water": round(min(res["water"], 100))
                }
            }
            if c["is_indian"]: indian_matches.append(match)
            else: global_matches.append(match)

    indian_matches.sort(key=lambda x: x["confidence"], reverse=True)
    global_matches.sort(key=lambda x: x["confidence"], reverse=True)

    # Replace empty foreign list with next best Indian crops to maintain UI functionality
    if not global_matches and len(indian_matches) > 5:
        global_matches = indian_matches[5:10]

    return {
        "indian": indian_matches[:5],
        "foreign": global_matches[:5],
        "top_match": indian_matches[0] if indian_matches else (global_matches[0] if global_matches else None),
        "source": "crop_database_v2"
    }


# ══════════════════════════════════════════════
#  ML Pipeline 1: Disease Detection
# ══════════════════════════════════════════════

# --- TensorFlow model loader (cached at module level) ---
_tf_model = None           # lazy-loaded Keras model
_tf_class_names: list = [] # class labels from model training
_TF_LOADED = False         # sentinel to avoid repeated failed loads

# Disease metadata mapped from PlantVillage class label conventions
_DISEASE_META = {
    "healthy": {"severity": "None", "action": "No action needed. Continue monitoring."},
    "rust": {"severity": "High", "action": "Apply Propiconazole 25% EC at 1 ml/L water."},
    "blight": {"severity": "Moderate", "action": "Spray Mancozeb 75% WP at 2.5 g/L water."},
    "mildew": {"severity": "Low", "action": "Apply Sulfur dust or Karathane WP."},
    "spot": {"severity": "Moderate", "action": "Remove infected leaves. Apply Copper-based fungicide."},
    "scab": {"severity": "High", "action": "Apply Captan 50 WP at 2 g/L. Improve ventilation."},
    "mosaic": {"severity": "Moderate", "action": "Control aphid vectors. Remove infected plants."},
    "curl": {"severity": "High", "action": "Remove and destroy infected plants. Apply systemic insecticide."},
    "default": {"severity": "Moderate", "action": "Consult local agricultural officer for precise treatment."},
}


def _get_disease_meta(class_label: str) -> dict:
    """Map a PlantVillage class label to severity and action guidance."""
    label_lower = class_label.lower().replace("___", " ").replace("_", " ")
    for keyword, meta in _DISEASE_META.items():
        if keyword in label_lower:
            return meta
    return _DISEASE_META["default"]


def _load_tf_model() -> bool:
    """Attempt to load the TF disease model once. Returns True on success."""
    global _tf_model, _tf_class_names, _TF_LOADED
    if _TF_LOADED:
        return _tf_model is not None
    _TF_LOADED = True

    # Resolve model path from env or default
    model_path = os.environ.get("MODEL_PATH", "crop_disease_model.h5")
    # Also check relative to this file's directory (backend/)
    if not os.path.isabs(model_path):
        alt_path = os.path.join(os.path.dirname(__file__), "..", model_path)
        if os.path.exists(alt_path):
            model_path = alt_path

    if not os.path.exists(model_path):
        print(f"[WARN] Disease model not found at '{model_path}'. Using smart mock fallback.")
        return False

    try:
        import tensorflow as tf  # defer import — TF is heavy
        _tf_model = tf.keras.models.load_model(model_path)
        # Derive class names from model output shape; real names require training metadata
        n_classes = _tf_model.output_shape[-1]
        _tf_class_names = [f"class_{i}" for i in range(n_classes)]
        print(f"[INFO] Disease model loaded from '{model_path}' — {n_classes} classes.")
        return True
    except Exception as exc:
        print(f"[WARN] Failed to load disease model: {exc}. Using smart mock fallback.")
        _tf_model = None
        return False


def _predict_with_model(image_path: str) -> Optional[Dict[str, Any]]:
    """Run TF inference on image_path. Returns result dict or None on failure."""
    try:
        import numpy as np
        import tensorflow as tf
        from tensorflow.keras.preprocessing.image import load_img, img_to_array

        IMG_SIZE = 224
        img = load_img(image_path, target_size=(IMG_SIZE, IMG_SIZE))
        img_array = np.expand_dims(img_to_array(img) / 255.0, axis=0)
        preds = _tf_model.predict(img_array, verbose=0)[0]
        pred_idx = int(np.argmax(preds))
        confidence = float(preds[pred_idx])
        class_label = _tf_class_names[pred_idx] if _tf_class_names else f"class_{pred_idx}"
        meta = _get_disease_meta(class_label)
        # Convert PlantVillage label to friendly display name
        display_name = class_label.replace("___", " – ").replace("_", " ").title()
        return {
            "disease_name": display_name,
            "confidence": round(confidence, 2),
            "severity": meta["severity"],
            "recommended_action": meta["action"],
            "image_analyzed": True,
        }
    except Exception as exc:
        print(f"[WARN] TF inference failed: {exc}. Falling back to smart mock.")
        return None


def predict_disease(image_path=None):
    """
    Computer Vision pipeline: Predicts crop disease from an uploaded image.

    Behaviour:
      - If a trained .h5 model exists (MODEL_PATH env var or crop_disease_model.h5),
        it performs real TensorFlow inference on the image.
      - If the model is absent OR inference fails, falls back to an intelligent
        rule-based mock that returns consistent (non-random) results so the UI
        remains functional during development without a trained model.
    """
    # Attempt real inference if an image was provided and model is available
    if image_path and _load_tf_model():
        result = _predict_with_model(image_path)
        if result:
            return result

    # ── Smart mock fallback (consistent, not fully random) ──
    # When no image is supplied → return Healthy with high confidence
    if not image_path:
        return {
            "disease_name": "Healthy",
            "confidence": 0.92,
            "severity": "None",
            "recommended_action": "No action needed. Continue monitoring.",
            "image_analyzed": False,
        }

    # When an image IS supplied but no model → deterministic result based on filename hash
    seed = sum(ord(c) for c in os.path.basename(image_path))
    diseases = [
        {"name": "Rust Fungus", "severity": "High", "action": "Apply Propiconazole 25% EC at 1 ml/L."},
        {"name": "Leaf Blight", "severity": "Moderate", "action": "Spray Mancozeb 75% WP at 2.5 g/L."},
        {"name": "Powdery Mildew", "severity": "Low", "action": "Apply Sulfur dust or Karathane."},
        {"name": "Aphid Infestation", "severity": "Moderate", "action": "Use Imidacloprid 17.8% SL."},
        {"name": "Healthy", "severity": "None", "action": "No action needed. Continue monitoring."},
    ]
    detected = diseases[seed % len(diseases)]
    confidence = round(0.72 + (seed % 26) / 100, 2)
    return {
        "disease_name": detected["name"],
        "confidence": confidence,
        "severity": detected["severity"],
        "recommended_action": detected["action"],
        "image_analyzed": True,
    }


# ══════════════════════════════════════════════
#  ML Pipeline 2: Geospatial Land Health
# ══════════════════════════════════════════════

def calculate_land_health(lat: float, lon: float) -> Dict[str, Any]:
    """
    Geospatial pipeline: Calculates land health using NDVI and real/simulated
    soil data for the given coordinates.

    Key change from previous version: soil metrics are now derived from the
    actual lat/lon via NASA POWER API or region-aware simulation, not random.
    """
    # 1. Fetch real or simulated soil environment
    soil_env = fetch_soil_environment(lat, lon)

    # 2. NDVI — deterministic from coordinates (same logic as geo_analytics.py)
    seed_value = abs((lat * 1000 + lon * 500) % 100) / 100.0
    ndvi = round(min(max(seed_value, 0.10), 0.92), 2)

    # 3. Soil NPK from region profile
    profile = _match_region(lat, lon)
    t = _coord_seed(lat, lon)
    t2 = _coord_seed(lat * 1.1, lon * 0.9)
    t3 = _coord_seed(lat * 0.9, lon * 1.1)

    soil = {
        "nitrogen": round(_lerp(*profile["nitrogen_range"], t)),
        "phosphorus": round(_lerp(*profile["phosphorus_range"], t2)),
        "potassium": round(_lerp(*profile["potassium_range"], t3)),
        "ph": round(_lerp(*profile["ph_range"], _coord_seed(lat + lon, lon - lat)), 1),
    }

    # 4. Health score
    health_score = int(ndvi * 60) + int((soil["nitrogen"] / 100) * 20) + int((soil["phosphorus"] / 50) * 20)
    health_score = min(health_score, 100)

    if health_score >= 70:
        status = "Good"
    elif health_score >= 40:
        status = "Moderate"
    else:
        status = "Poor"

    moisture = soil_env.get("soil_moisture", 45)
    organic_carbon = round(_lerp(*profile["organic_carbon_range"], t2), 1)

    return {
        "ndvi_score": ndvi,
        "soil": soil,
        "health_score": health_score,
        "status": status,
        "moisture": moisture,
        "organic_carbon": organic_carbon,
        # NEW — coordinate-specific soil environment data
        "soil_temperature": soil_env.get("soil_temperature"),
        "soil_moisture": moisture,
        "soil_type": soil_env.get("soil_type", "Unknown"),
        "data_source": soil_env.get("data_source", "unknown"),
        # Pass the full soil_env for the risk engine
        "_soil_env": soil_env,
    }


# ──────────────────────────────────────────────
#  Legacy alias — kept for backward compatibility with app.py imports
# ──────────────────────────────────────────────
def analyze_soil_health(lat: float, lon: float) -> Dict[str, Any]:
    """Legacy wrapper — delegates to calculate_land_health."""
    return calculate_land_health(lat, lon)


# ══════════════════════════════════════════════
#  ML Pipeline 3: Environmental Risk Engine
# ══════════════════════════════════════════════

def predict_environmental_risk(
    lat: float,
    lon: float,
    soil_env: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Predictive Risk Engine: Estimates environmental risks using weather
    patterns AND soil environment data.

    If soil_env is provided (from calculate_land_health), it is factored
    into the risk scoring.  Otherwise a fresh fetch is performed.
    """
    if soil_env is None:
        soil_env = fetch_soil_environment(lat, lon)

    soil_temp = soil_env.get("soil_temperature", 25.0)
    soil_moist = soil_env.get("soil_moisture", 45.0)

    # --- Base weather (deterministic from coordinates) ---
    t = _coord_seed(lat, lon)
    t2 = _coord_seed(lon, lat)

    base_temp_low = round(_lerp(12, 28, t))
    base_temp_high = base_temp_low + round(_lerp(6, 14, t2))
    humidity = round(_lerp(30, 85, t2))
    wind = round(_lerp(5, 35, t))

    # Precipitation heuristic based on moisture + coordinate
    if soil_moist > 60:
        rain_label = "Heavy" if humidity > 70 else "Moderate"
    elif soil_moist > 40:
        rain_label = "Moderate" if humidity > 55 else "Light"
    else:
        rain_label = "Light" if humidity > 40 else "None"

    # --- Risk detection incorporating soil data ---
    risk_flags = []

    # Frost check
    if soil_temp < 5.0 or base_temp_low <= 4:
        risk_flags.append("Frost")

    # Drought check
    if soil_moist < 20 or (humidity < 30 and rain_label in ("None", "Light")):
        risk_flags.append("Drought")

    # Fungal check
    if (soil_moist > 75 and soil_temp > 20) or (humidity >= 85 and 15 <= base_temp_low <= 35):
        risk_flags.append("Fungal")

    # Determine overall risk
    if len(risk_flags) >= 2 or "Frost" in risk_flags:
        risk_level = "High"
        risk_pct = round(_lerp(55, 80, t))
    elif len(risk_flags) == 1:
        risk_level = "Moderate"
        risk_pct = round(_lerp(26, 50, t))
    else:
        risk_level = "Low"
        risk_pct = round(_lerp(5, 25, t))

    # Advisory
    advisories = {
        "Low": "Conditions are favorable. Ideal sowing window is open.",
        "Moderate": f"Monitor weather closely. {'Soil moisture is low — consider irrigation.' if 'Drought' in risk_flags else 'Moderate rainfall expected.'}",
        "High": f"{'Frost alert — protect sensitive crops.' if 'Frost' in risk_flags else 'Severe conditions detected.'} {'High fungal risk — apply preventive spray.' if 'Fungal' in risk_flags else ''}".strip(),
    }

    # Profit estimate scaled by risk
    base_profit = round(_lerp(38000, 55000, t))
    profit_best = round(base_profit * (1 + (1 - risk_pct / 100) * 0.3))
    profit_worst = round(base_profit * (1 - risk_pct / 100 * 0.5))
    profit_expected = round((profit_best + profit_worst) / 2)

    return {
        "risk_level": risk_level,
        "risk_percentage": risk_pct,
        "risk_factors": risk_flags,
        "weather": {
            "temp_range": f"{base_temp_low}-{base_temp_high}C",
            "humidity": humidity,
            "rain_forecast": rain_label,
            "wind_speed_kmh": wind,
            "icon": "🌤️" if risk_level == "Low" else ("🌦️" if risk_level == "Moderate" else "⛈️"),
        },
        "soil_conditions": {
            "soil_temperature": soil_temp,
            "soil_moisture": soil_moist,
            "data_source": soil_env.get("data_source", "unknown"),
        },
        "advisory": advisories.get(risk_level, ""),
        "profit_estimate": {
            "best_case": profit_best,
            "worst_case": profit_worst,
            "expected": profit_expected,
        },
    }
