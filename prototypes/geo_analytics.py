"""
geo_analytics.py — Geospatial Land Health Analysis (NDVI)

Pipeline 2 of Smart Farm AI.
Fetches satellite-derived vegetation indices via a REST API (e.g. OpenWeather
Agro / Agromonitoring) and classifies land health from the NDVI score.
"""

import datetime
from typing import Dict, List, Tuple, Optional

import requests


# ──────────────────────────────────────────────
#  Constants
# ──────────────────────────────────────────────
AGRO_API_BASE: str = "http://api.agromonitoring.com/agro/1.0"

# NDVI classification thresholds
NDVI_THRESHOLDS: Dict[str, Tuple[float, float]] = {
    "Healthy":              (0.60, 1.00),
    "Moderate Health":      (0.40, 0.60),
    "Light Stress":         (0.30, 0.40),
    "Severe Stress/Drought": (0.00, 0.30),
    "No Vegetation / Water": (-1.00, 0.00),
}


# ──────────────────────────────────────────────
#  1. NDVI Health Classification
# ──────────────────────────────────────────────
def classify_ndvi(ndvi_score: float) -> str:
    """
    Map a raw NDVI value to a human-readable health status.

    Parameters
    ----------
    ndvi_score : float  – value in range [-1.0, 1.0]

    Returns
    -------
    str – one of the labels defined in NDVI_THRESHOLDS
    """
    for label, (low, high) in NDVI_THRESHOLDS.items():
        if low <= ndvi_score <= high:
            return label
    return "Unknown"


# ──────────────────────────────────────────────
#  2. Polygon creation helper
# ──────────────────────────────────────────────
def create_polygon(
    polygon_coords: List[List[float]],
    api_key: str,
    name: str = "SmartFarm_Field",
) -> Optional[str]:
    """
    Register a polygon (field boundary) with the Agro API.

    Parameters
    ----------
    polygon_coords : list  – list of [lon, lat] pairs forming a closed ring
    api_key        : str   – Agromonitoring API key
    name           : str   – human-readable field name

    Returns
    -------
    polygon_id : str | None – API-assigned polygon ID, or None on failure
    """
    url = f"{AGRO_API_BASE}/polygons?appid={api_key}"

    payload = {
        "name": name,
        "geo_json": {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon_coords],
            },
        },
    }

    try:
        resp = requests.post(url, json=payload, timeout=15)
        resp.raise_for_status()
        polygon_id: str = resp.json().get("id", "")
        print(f"[INFO] Polygon registered → id={polygon_id}")
        return polygon_id
    except requests.RequestException as exc:
        print(f"[ERROR] Polygon creation failed: {exc}")
        return None


# ──────────────────────────────────────────────
#  3. Satellite NDVI Fetch
# ──────────────────────────────────────────────
def fetch_ndvi(
    polygon_id: str,
    api_key: str,
) -> Optional[Dict[str, object]]:
    """
    Retrieve the latest satellite NDVI statistics for a registered polygon.

    Parameters
    ----------
    polygon_id : str – polygon ID from `create_polygon()`
    api_key    : str – Agromonitoring API key

    Returns
    -------
    dict | None – raw JSON entry with NDVI stats, or None on failure
    """
    url = (
        f"{AGRO_API_BASE}/ndvi/history"
        f"?polyid={polygon_id}"
        f"&start=0"
        f"&end={int(datetime.datetime.utcnow().timestamp())}"
        f"&appid={api_key}"
    )

    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data: list = resp.json()
        if not data:
            print("[WARN] No NDVI records found for this polygon.")
            return None
        # Return the most recent entry
        latest = data[-1]
        return latest
    except requests.RequestException as exc:
        print(f"[ERROR] NDVI fetch failed: {exc}")
        return None


# ──────────────────────────────────────────────
#  4. Simulated NDVI Fetch (for offline dev)
# ──────────────────────────────────────────────
def fetch_ndvi_simulated(
    lat: float,
    lon: float,
) -> Dict[str, object]:
    """
    Return a realistic mock NDVI payload for development and testing
    when no API key is available.

    The simulated score is deterministically derived from the coordinates
    so results are reproducible.
    """
    # Deterministic pseudo-random NDVI from coordinates
    seed_value: float = abs((lat * 1000 + lon * 500) % 100) / 100.0
    simulated_ndvi: float = round(min(max(seed_value, -0.10), 0.95), 4)

    return {
        "dt": int(datetime.datetime.utcnow().timestamp()),
        "source": "simulation",
        "data": {
            "mean": simulated_ndvi,
            "std": round(simulated_ndvi * 0.05, 4),
            "min": round(simulated_ndvi - 0.08, 4),
            "max": round(simulated_ndvi + 0.06, 4),
            "median": simulated_ndvi,
            "num": 1024,
        },
    }


# ──────────────────────────────────────────────
#  5. Main Entry-Point — calculate_land_health()
# ──────────────────────────────────────────────
def calculate_land_health(
    lat: float,
    lon: float,
    polygon_coords: List[List[float]],
    api_key: str = "",
) -> Dict[str, object]:
    """
    End-to-end land health assessment for a given field.

    Workflow
    --------
    1. Register polygon with API  (skipped if no key → uses simulation)
    2. Fetch latest NDVI statistics
    3. Classify health status
    4. Return structured result dictionary

    Parameters
    ----------
    lat             : float           – centre latitude of the field
    lon             : float           – centre longitude of the field
    polygon_coords  : list            – [[lon,lat], …] ring (GeoJSON order)
    api_key         : str             – Agromonitoring API key; leave empty
                                        for simulated / offline mode

    Returns
    -------
    dict with keys:
        "latitude"       : float
        "longitude"      : float
        "ndvi_score"     : float   – mean NDVI
        "ndvi_stats"     : dict    – full statistical breakdown
        "health_status"  : str     – classified label
        "source"         : str     – "api" or "simulation"
        "timestamp"      : str     – ISO-8601 UTC timestamp
    """
    use_simulation: bool = (api_key == "")

    if use_simulation:
        print("[INFO] No API key provided — running in SIMULATION mode.")
        ndvi_payload = fetch_ndvi_simulated(lat, lon)
    else:
        # Live API path
        polygon_id = create_polygon(polygon_coords, api_key)
        if polygon_id is None:
            return {"error": "Failed to register polygon with API."}

        ndvi_payload = fetch_ndvi(polygon_id, api_key)
        if ndvi_payload is None:
            return {"error": "Failed to fetch NDVI data from API."}

    # Extract NDVI score
    ndvi_data: dict = ndvi_payload.get("data", {})
    ndvi_score: float = ndvi_data.get("mean", 0.0)

    # Classify
    health_status: str = classify_ndvi(ndvi_score)

    result: Dict[str, object] = {
        "latitude": lat,
        "longitude": lon,
        "ndvi_score": round(ndvi_score, 4),
        "ndvi_stats": ndvi_data,
        "health_status": health_status,
        "source": "simulation" if use_simulation else "api",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }

    print(f"[RESULT] NDVI={ndvi_score:.4f}  →  {health_status}")
    return result


# ──────────────────────────────────────────────
#  6. CLI Demo
# ──────────────────────────────────────────────
if __name__ == "__main__":
    # Example: a field near Nashik, Maharashtra
    demo_polygon = [
        [73.7800, 19.9975],
        [73.7900, 19.9975],
        [73.7900, 20.0050],
        [73.7800, 20.0050],
        [73.7800, 19.9975],   # close the ring
    ]

    report = calculate_land_health(
        lat=20.0011,
        lon=73.7850,
        polygon_coords=demo_polygon,
        api_key="",            # empty → simulation mode
    )

    import json
    print("\n" + json.dumps(report, indent=2))
