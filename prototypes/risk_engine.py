"""
risk_engine.py — Predictive Environmental Risk Engine

Pipeline 3 of Smart Farm AI.
Fetches a 7-day weather forecast from OpenWeatherMap and applies rule-based
anomaly detection to flag agricultural threats: frost, drought, and fungal
infection risk.
"""

import datetime
from typing import Dict, List, Optional

import requests


# ──────────────────────────────────────────────
#  Constants & Thresholds
# ──────────────────────────────────────────────
OWM_FORECAST_URL: str = "https://api.openweathermap.org/data/2.5/forecast"

# Risk thresholds (all temps in °C)
FROST_TEMP_C: float = 4.0
DROUGHT_HUMIDITY_MAX: int = 30
DROUGHT_RAIN_THRESHOLD_MM: float = 0.5
FUNGAL_HUMIDITY_MIN: int = 85
FUNGAL_TEMP_MIN_C: float = 15.0
FUNGAL_TEMP_MAX_C: float = 35.0

# Mitigation suggestions
MITIGATIONS: Dict[str, str] = {
    "Frost Warning": (
        "Cover sensitive crops with frost cloth or row covers overnight. "
        "Consider smudge pots or wind machines for orchards."
    ),
    "Drought Risk": (
        "Activate drip irrigation schedules and apply mulch to conserve "
        "soil moisture. Prioritize watering for young or shallow-rooted crops."
    ),
    "Fungal Infection Risk": (
        "Apply preventive fungicide spray. Ensure proper plant spacing for "
        "airflow and avoid overhead irrigation."
    ),
}


# ──────────────────────────────────────────────
#  1. Fetch 7-Day Weather Forecast
# ──────────────────────────────────────────────
def fetch_weather_forecast(
    lat: float,
    lon: float,
    api_key: str,
) -> Optional[List[dict]]:
    """
    Fetch 5-day / 3-hour forecast from OpenWeatherMap.

    Note: OWM free tier provides 5-day data in 3-hour intervals (40 records).
    We bucket them by date to approximate a 7-day daily view.

    Parameters
    ----------
    lat     : float – latitude
    lon     : float – longitude
    api_key : str   – OpenWeatherMap API key

    Returns
    -------
    list[dict] | None – raw forecast entries, or None on failure
    """
    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
    }

    try:
        resp = requests.get(OWM_FORECAST_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data.get("list", [])
    except requests.RequestException as exc:
        print(f"[ERROR] Weather fetch failed: {exc}")
        return None


# ──────────────────────────────────────────────
#  2. Simulated Forecast (offline dev)
# ──────────────────────────────────────────────
def fetch_weather_simulated() -> List[dict]:
    """
    Return a 7-day synthetic forecast for development and testing.
    Includes a mix of normal, cold, hot-humid, and dry days to trigger
    all risk branches.
    """
    base = datetime.datetime.utcnow()
    daily_profiles = [
        {"temp": 22.0, "humidity": 55, "rain_mm": 2.0},   # Day 1 – Normal
        {"temp": 18.0, "humidity": 60, "rain_mm": 5.0},   # Day 2 – Normal
        {"temp":  2.5, "humidity": 70, "rain_mm": 0.0},   # Day 3 – FROST
        {"temp": 28.0, "humidity": 90, "rain_mm": 1.5},   # Day 4 – FUNGAL
        {"temp": 35.0, "humidity": 20, "rain_mm": 0.0},   # Day 5 – Dry/hot
        {"temp": 34.0, "humidity": 22, "rain_mm": 0.0},   # Day 6 – Dry/hot
        {"temp": 33.0, "humidity": 18, "rain_mm": 0.0},   # Day 7 – Dry/hot
    ]

    forecast: List[dict] = []
    for i, prof in enumerate(daily_profiles):
        dt = base + datetime.timedelta(days=i)
        forecast.append({
            "dt": int(dt.timestamp()),
            "dt_txt": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "main": {
                "temp": prof["temp"],
                "temp_min": prof["temp"] - 2.0,
                "temp_max": prof["temp"] + 2.0,
                "humidity": prof["humidity"],
            },
            "rain": {"3h": prof["rain_mm"]} if prof["rain_mm"] > 0 else {},
            "weather": [{"main": "Clear", "description": "simulated"}],
        })
    return forecast


# ──────────────────────────────────────────────
#  3. Aggregate daily stats from 3-hour slots
# ──────────────────────────────────────────────
def aggregate_daily(forecast_entries: List[dict]) -> List[dict]:
    """
    Bucket 3-hour forecast entries into calendar-day summaries.

    Returns a list of dicts, each with:
        date, temp_min, temp_max, temp_avg, humidity_avg, total_rain_mm
    """
    from collections import defaultdict

    buckets: dict = defaultdict(list)
    for entry in forecast_entries:
        date_str = entry["dt_txt"][:10]  # "YYYY-MM-DD"
        buckets[date_str].append(entry)

    daily: List[dict] = []
    for date_str in sorted(buckets.keys()):
        entries = buckets[date_str]
        temps = [e["main"]["temp"] for e in entries]
        humidities = [e["main"]["humidity"] for e in entries]
        rain_mm = sum(e.get("rain", {}).get("3h", 0.0) for e in entries)

        daily.append({
            "date": date_str,
            "temp_min": round(min(temps), 1),
            "temp_max": round(max(temps), 1),
            "temp_avg": round(sum(temps) / len(temps), 1),
            "humidity_avg": round(sum(humidities) / len(humidities), 1),
            "total_rain_mm": round(rain_mm, 2),
        })
    return daily


# ──────────────────────────────────────────────
#  4. Risk Detection Rules
# ──────────────────────────────────────────────
def detect_frost(day: dict) -> Optional[dict]:
    """Flag frost risk if minimum temperature ≤ threshold."""
    if day["temp_min"] <= FROST_TEMP_C:
        return {
            "risk": "Frost Warning",
            "severity": "HIGH" if day["temp_min"] <= 0 else "MODERATE",
            "trigger_date": day["date"],
            "details": f"Min temp {day['temp_min']}°C (threshold: ≤{FROST_TEMP_C}°C)",
            "mitigation": MITIGATIONS["Frost Warning"],
        }
    return None


def detect_fungal(day: dict) -> Optional[dict]:
    """Flag fungal infection risk if humidity is high + warm temps."""
    if (
        day["humidity_avg"] >= FUNGAL_HUMIDITY_MIN
        and FUNGAL_TEMP_MIN_C <= day["temp_avg"] <= FUNGAL_TEMP_MAX_C
    ):
        return {
            "risk": "Fungal Infection Risk",
            "severity": "HIGH" if day["humidity_avg"] >= 92 else "MODERATE",
            "trigger_date": day["date"],
            "details": (
                f"Humidity {day['humidity_avg']}% & temp {day['temp_avg']}°C "
                f"(thresholds: ≥{FUNGAL_HUMIDITY_MIN}%, "
                f"{FUNGAL_TEMP_MIN_C}-{FUNGAL_TEMP_MAX_C}°C)"
            ),
            "mitigation": MITIGATIONS["Fungal Infection Risk"],
        }
    return None


def detect_drought(daily_data: List[dict]) -> Optional[dict]:
    """
    Flag drought risk if the entire forecast window shows low humidity
    and near-zero rainfall.
    """
    total_rain = sum(d["total_rain_mm"] for d in daily_data)
    avg_humidity = sum(d["humidity_avg"] for d in daily_data) / max(len(daily_data), 1)

    if total_rain < DROUGHT_RAIN_THRESHOLD_MM and avg_humidity < DROUGHT_HUMIDITY_MAX:
        return {
            "risk": "Drought Risk",
            "severity": "HIGH" if avg_humidity < 20 else "MODERATE",
            "trigger_date": daily_data[0]["date"],
            "trigger_end": daily_data[-1]["date"],
            "details": (
                f"Total rainfall {total_rain} mm over {len(daily_data)} days, "
                f"avg humidity {avg_humidity:.1f}% "
                f"(thresholds: rain <{DROUGHT_RAIN_THRESHOLD_MM} mm, "
                f"humidity <{DROUGHT_HUMIDITY_MAX}%)"
            ),
            "mitigation": MITIGATIONS["Drought Risk"],
        }
    return None


# ──────────────────────────────────────────────
#  5. Main Entry-Point
# ──────────────────────────────────────────────
def predict_environmental_risk(
    lat: float,
    lon: float,
    api_key: str = "",
) -> Dict[str, object]:
    """
    End-to-end environmental risk prediction for a farm location.

    Workflow
    --------
    1. Fetch 7-day weather data  (live API or simulation)
    2. Aggregate into daily summaries
    3. Run all anomaly detection rules
    4. Return structured risk report

    Parameters
    ----------
    lat     : float – field latitude
    lon     : float – field longitude
    api_key : str   – OpenWeatherMap API key; empty → simulation mode

    Returns
    -------
    dict with keys:
        "location"       : dict  – lat/lon
        "forecast_days"  : int   – number of days analysed
        "daily_summary"  : list  – per-day weather stats
        "alerts"         : list  – detected risk objects
        "overall_risk"   : str   – "LOW" / "MODERATE" / "HIGH"
        "source"         : str   – "api" or "simulation"
        "generated_at"   : str   – ISO-8601 timestamp
    """
    use_simulation: bool = (api_key == "")

    # ── Step 1: Fetch ──
    if use_simulation:
        print("[INFO] No API key — running in SIMULATION mode.")
        raw_forecast = fetch_weather_simulated()
    else:
        raw_forecast = fetch_weather_forecast(lat, lon, api_key)
        if raw_forecast is None:
            return {"error": "Failed to fetch weather data from API."}

    # ── Step 2: Aggregate ──
    daily_data: List[dict] = aggregate_daily(raw_forecast)

    # ── Step 3: Detect Risks ──
    alerts: List[dict] = []

    for day in daily_data:
        frost = detect_frost(day)
        if frost:
            alerts.append(frost)

        fungal = detect_fungal(day)
        if fungal:
            alerts.append(fungal)

    drought = detect_drought(daily_data)
    if drought:
        alerts.append(drought)

    # ── Step 4: Overall Risk Level ──
    if any(a["severity"] == "HIGH" for a in alerts):
        overall_risk = "HIGH"
    elif alerts:
        overall_risk = "MODERATE"
    else:
        overall_risk = "LOW"

    result: Dict[str, object] = {
        "location": {"latitude": lat, "longitude": lon},
        "forecast_days": len(daily_data),
        "daily_summary": daily_data,
        "alerts": alerts,
        "alert_count": len(alerts),
        "overall_risk": overall_risk,
        "source": "simulation" if use_simulation else "api",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
    }

    # Console summary
    print(f"\n[RISK REPORT] Overall: {overall_risk}  |  Alerts: {len(alerts)}")
    for a in alerts:
        print(f"  ⚠ {a['severity']} — {a['risk']} on {a['trigger_date']}")

    return result


# ──────────────────────────────────────────────
#  6. CLI Demo
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import json

    report = predict_environmental_risk(
        lat=20.0011,
        lon=73.7850,
        api_key="",    # empty → simulation mode
    )

    print("\n" + json.dumps(report, indent=2))
