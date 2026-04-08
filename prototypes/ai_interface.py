"""
ai_interface.py -- Unified AI Interface for Smart Farm AI

This is the CLEAN ENTRY POINT for the Backend Developer.
Import any of the three pipeline functions below and call them directly
from your Flask / FastAPI routes.

Pipelines
---------
1. predict_disease()            -> Crop disease classification (image)
2. calculate_land_health()      -> Geospatial NDVI analysis (coordinates)
3. predict_environmental_risk() -> Weather-based threat detection (coordinates)
"""

# --------------------------------------------------
#  Pipeline Imports
# --------------------------------------------------
try:
    from vision_model import predict_disease
    VISION_AVAILABLE: bool = True
except ImportError as _e:
    VISION_AVAILABLE = False
    predict_disease = None  # type: ignore
    print(f"[WARN] Vision pipeline unavailable ({_e}). Pipelines 2 & 3 still active.")

from geo_analytics import calculate_land_health
from risk_engine import predict_environmental_risk


# --------------------------------------------------
#  Unified Test Suite
# --------------------------------------------------
if __name__ == "__main__":
    import os
    import json

    SEPARATOR = "=" * 60
    SUB_SEP   = "-" * 60

    def pretty_print(title: str, data: dict) -> None:
        """Pretty-print a pipeline result with a styled header."""
        print(f"\n{SEPARATOR}")
        print(f"  {title}")
        print(SEPARATOR)
        print(json.dumps(data, indent=2, default=str))
        print(SUB_SEP)

    # --------------------------------------------------
    #  Dummy test inputs
    # --------------------------------------------------
    DUMMY_IMAGE_PATH: str  = "test_leaf.jpg"
    DUMMY_MODEL_PATH: str  = "crop_disease_model.h5"
    DUMMY_LAT: float       = 20.0011
    DUMMY_LON: float       = 73.7850
    DUMMY_POLYGON: list    = [
        [73.7800, 19.9975],
        [73.7900, 19.9975],
        [73.7900, 20.0050],
        [73.7800, 20.0050],
        [73.7800, 19.9975],
    ]
    DUMMY_API_KEY: str     = ""   # empty -> simulation mode for all pipelines

    print("\n")
    print("+============================================================+")
    print("|       SMART FARM AI  --  Pipeline Test Suite               |")
    print("+============================================================+")

    # --------------------------------------------------
    #  Pipeline 1: Crop Disease Detection
    # --------------------------------------------------
    print(f"\n{SEPARATOR}")
    print("  [Pipeline 1] Crop Disease Detection")
    print(SEPARATOR)

    if VISION_AVAILABLE and os.path.exists(DUMMY_MODEL_PATH) and os.path.exists(DUMMY_IMAGE_PATH):
        disease_result = predict_disease(
            image_path=DUMMY_IMAGE_PATH,
            model_path=DUMMY_MODEL_PATH,
        )
        pretty_print("[Pipeline 1] Disease Detection Result", disease_result)
    else:
        print("  >> SKIPPED")
        if not VISION_AVAILABLE:
            print("     TensorFlow not installed on this Python version.")
        else:
            print(f"     Model : {DUMMY_MODEL_PATH}  ->  {'OK' if os.path.exists(DUMMY_MODEL_PATH) else 'NOT FOUND'}")
            print(f"     Image : {DUMMY_IMAGE_PATH}  ->  {'OK' if os.path.exists(DUMMY_IMAGE_PATH) else 'NOT FOUND'}")
        print(f"\n  Tip: Train the model first:")
        print(f'     py vision_model.py --data_dir "<PlantVillage folder>"')
        print(SUB_SEP)

    # --------------------------------------------------
    #  Pipeline 2: Geospatial Land Health
    # --------------------------------------------------
    land_result = calculate_land_health(
        lat=DUMMY_LAT,
        lon=DUMMY_LON,
        polygon_coords=DUMMY_POLYGON,
        api_key=DUMMY_API_KEY,
    )
    pretty_print("[Pipeline 2] Land Health (NDVI) Result", land_result)

    # --------------------------------------------------
    #  Pipeline 3: Environmental Risk Engine
    # --------------------------------------------------
    risk_result = predict_environmental_risk(
        lat=DUMMY_LAT,
        lon=DUMMY_LON,
        api_key=DUMMY_API_KEY,
    )
    pretty_print("[Pipeline 3] Environmental Risk Result", risk_result)

    # --------------------------------------------------
    #  Summary Table
    # --------------------------------------------------
    print("\n+============================================================+")
    print("|                    Test Summary                            |")
    print("+============================================================+")

    vision_status = "RAN" if (VISION_AVAILABLE and os.path.exists(DUMMY_MODEL_PATH)) else "SKIPPED"
    print(f"|  [1] Disease Detection  :  {vision_status:>30}  |")
    print(f"|  [2] Land Health (NDVI) :  {'RAN':>30}  |")
    print(f"|      -> NDVI Score      :  {str(land_result.get('ndvi_score', 'N/A')):>30}  |")
    print(f"|      -> Status          :  {str(land_result.get('health_status', 'N/A')):>30}  |")
    print(f"|  [3] Risk Engine        :  {'RAN':>30}  |")
    print(f"|      -> Overall Risk    :  {str(risk_result.get('overall_risk', 'N/A')):>30}  |")
    print(f"|      -> Alerts Found    :  {str(risk_result.get('alert_count', 0)):>30}  |")
    print("+============================================================+\n")
