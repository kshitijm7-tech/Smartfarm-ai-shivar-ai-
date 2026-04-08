"""
test_pipeline.py — Comprehensive Pipeline Integration Test

Segment 1.5 of Smart Farm AI.
This script acts as a robust test harness that triggers the Vision Model, 
Geospatial Map Analytics, and the Risk Engine. It aggregates everything 
into the exact JSON structure the Backend Developer needs.
"""

import sys
import json
import traceback
from typing import Dict, Any

# Import the main interface pipeline functions
from ai_interface import predict_disease, calculate_land_health, predict_environmental_risk, VISION_AVAILABLE


# ──────────────────────────────────────────────
#  Helper: Create Dummy Image
# ──────────────────────────────────────────────
def create_dummy_image(image_path: str = "test_leaf.jpg") -> None:
    """
    Creates a small solid green JPEG file to prevent predict_disease()
    from crashing if no real image is provided.
    """
    import os
    if os.path.exists(image_path):
        return

    try:
        from PIL import Image
        img = Image.new('RGB', (224, 224), color=(34, 139, 34)) # Forest Green
        img.save(image_path)
        print(f"[SETUP] Created dummy test image → {image_path}")
    except ImportError:
        # Fallback if Pillow is not installed
        # Write minimal valid solid black 1x1 JPEG structure
        # (Enough to pass basic file existence checks, but not Keras parsing)
        print("[WARN] Pillow library not found. Creating a blank placeholder file.")
        with open(image_path, "wb") as f:
            f.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x03\x02\x02\x03\x02\x02\x03\x03\x03\x03\x04\x03\x03\x04\x05\x08\x05\x05\x04\x04\x05\n\x07\x07\x06\x08\x0c\n\x0c\x0c\x0b\n\x0b\x0b\r\x0e\x12\x10\r\x0e\x11\x0e\x0b\x0b\x10\x16\x10\x11\x13\x14\x15\x15\x15\x0c\x0f\x17\x18\x16\x14\x18\x12\x14\x15\x14\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfd\xfc\xff\xd9')


# ──────────────────────────────────────────────
#  Backend JSON Response Builder
# ──────────────────────────────────────────────
def run_integration_test() -> Dict[str, Any]:
    """
    Executes all three ML pipelines and unifies their output.
    Gracefully falls back to mock data if Live API keys fail.
    """
    print("\n[TEST] Initializing Smart Farm AI Integration Test...\n")

    # 1. Setup Test Inputs
    TEST_IMAGE_PATH = "test_leaf.jpg"
    TEST_MODEL_PATH = "crop_disease_model.h5"
    TEST_LAT = 18.5204
    TEST_LON = 73.8567
    TEST_POLYGON = [
        [73.8500, 18.5200], [73.8600, 18.5200], 
        [73.8600, 18.5300], [73.8500, 18.5300], 
        [73.8500, 18.5200]
    ]
    TEST_API_KEY = "dummy_test_api_key_12345"

    create_dummy_image(TEST_IMAGE_PATH)

    # Dictionary that will hold the exact structure for the Backend
    backend_payload: Dict[str, Any] = {
        "status": "success",
        "location": {"lat": TEST_LAT, "lon": TEST_LON},
        "models": {
            "disease_detection": None,
            "land_health": None,
            "environmental_risk": None
        }
    }

    # ──────────────────────────────────────────
    #  Run Model 1: Disease Detection
    # ──────────────────────────────────────────
    print("[RUN] Executing Vision Model...")
    try:
        import os
        if VISION_AVAILABLE and os.path.exists(TEST_MODEL_PATH) and os.path.exists(TEST_IMAGE_PATH):
            disease_result = predict_disease(TEST_IMAGE_PATH, TEST_MODEL_PATH)
            backend_payload["models"]["disease_detection"] = disease_result
        else:
            print("  [WARN] Vision setup incomplete. Returning mocked vision data.")
            backend_payload["models"]["disease_detection"] = {
                "predicted_class": "Tomato___healthy (Mocked)",
                "confidence": 0.985,
                "note": "Vision model or test image not found/configured."
            }
    except Exception as e:
        print(f"  [ERROR] Vision Model crashed: {e}")
        backend_payload["models"]["disease_detection"] = {"error": str(e)}

    # ──────────────────────────────────────────
    #  Run Model 2: Geospatial Map Analytics
    # ──────────────────────────────────────────
    print("[RUN] Executing Geospatial Analytics...")
    try:
        # Pass the dummy key to trigger the Live API path (which will fail)
        land_result = calculate_land_health(
            lat=TEST_LAT, 
            lon=TEST_LON, 
            polygon_coords=TEST_POLYGON, 
            api_key=TEST_API_KEY
        )
        
        # Check if error returned due to dummy key
        if isinstance(land_result, dict) and "error" in land_result:
            raise ValueError(land_result["error"])
            
        backend_payload["models"]["land_health"] = land_result

    except Exception as e:
        print(f"  [API MOCK] Agro API failed with dummy key ({e}). Falling back to MOCK data.")
        backend_payload["models"]["land_health"] = {
            "latitude": TEST_LAT,
            "longitude": TEST_LON,
            "ndvi_score": 0.72,
            "health_status": "Healthy",
            "source": "Mocked JSON Response (API Fallback)",
            "error_caught": str(e)
        }

    # ──────────────────────────────────────────
    #  Run Model 3: Environmental Risk Engine
    # ──────────────────────────────────────────
    print("[RUN] Executing Risk Engine...")
    try:
        # Pass the dummy key
        risk_result = predict_environmental_risk(
            lat=TEST_LAT, 
            lon=TEST_LON, 
            api_key=TEST_API_KEY
        )

        if isinstance(risk_result, dict) and "error" in risk_result:
            raise ValueError(risk_result["error"])

        backend_payload["models"]["environmental_risk"] = risk_result

    except Exception as e:
        print(f"  [API MOCK] OWM API failed with dummy key ({e}). Falling back to MOCK data.")
        backend_payload["models"]["environmental_risk"] = {
            "overall_risk": "Low Risk",
            "alert_count": 0,
            "alerts": [],
            "source": "Mocked JSON Response (API Fallback)",
            "error_caught": str(e)
        }

    return backend_payload


# ──────────────────────────────────────────────
#  Main Execution
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import datetime

    # Suppress datetime deprecation warnings in stdout to keep JSON clean
    import warnings
    warnings.filterwarnings("ignore", category=DeprecationWarning)

    final_payload = run_integration_test()

    print("\n")
    print("═" * 70)
    print(" 📡 FINAL BACKEND JSON PAYLOAD")
    print("═" * 70)
    
    # Pretty print the final dictionary for the Backend Developer
    print(json.dumps(final_payload, indent=2))
    print("═" * 70)
    print("\n[SUCCESS] Pipeline Integration Test Complete.\n")
