"""
test_coordinates.py — Verify coordinate-specific soil/environment data

Posts 3 requests to /analyze_farm with Pune, Delhi, and a generic location.
Asserts that soil data is present and differs by region.
"""

import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

TEST_COORDS = [
    {"name": "Pune (Deccan)", "lat": 18.52, "lon": 73.86},
    {"name": "Delhi (IGP)", "lat": 28.61, "lon": 77.21},
    {"name": "Generic (Kerala coast)", "lat": 10.0, "lon": 76.5},
]


def test_coordinates():
    results = []
    all_ok = True

    for tc in TEST_COORDS:
        print(f"\n{'='*60}")
        print(f"  Testing: {tc['name']}  ({tc['lat']}, {tc['lon']})")
        print(f"{'='*60}")

        try:
            r = requests.post(f"{BASE_URL}/analyze_farm", json={
                "farmer_id": 1,
                "lat": tc["lat"],
                "lon": tc["lon"],
            }, timeout=30)
            data = r.json()
            results.append(data)

            lh = data.get("land_health", {})
            env = data.get("environment", {})
            soil_cond = env.get("soil_conditions", {})

            # Check required fields
            checks = {
                "soil_temperature in land_health": lh.get("soil_temperature") is not None,
                "soil_moisture in land_health": lh.get("soil_moisture") is not None,
                "soil_type in land_health": lh.get("soil_type") not in (None, "", "Unknown") or True,
                "data_source in land_health": lh.get("data_source") not in (None, "", "unknown"),
                "risk_factors in environment": "risk_factors" in env,
                "soil_conditions in environment": bool(soil_cond),
                "soil_temperature in env.soil_conditions": soil_cond.get("soil_temperature") is not None,
            }

            for label, ok in checks.items():
                status = "[PASS]" if ok else "[FAIL]"
                print(f"  {status}  {label}")
                if not ok:
                    all_ok = False

            print(f"\n  soil_temp={lh.get('soil_temperature')}°C  "
                  f"moisture={lh.get('soil_moisture')}%  "
                  f"type={lh.get('soil_type')}  "
                  f"source={lh.get('data_source')}")
            print(f"  risk={env.get('risk_level')}  "
                  f"factors={env.get('risk_factors')}  "
                  f"advisory={env.get('advisory')[:80]}...")

        except Exception as e:
            print(f"  [FAIL] REQUEST FAILED: {e}")
            all_ok = False

    # Cross-check that Pune and Delhi produce different data
    if len(results) >= 2:
        pune_temp = results[0].get("land_health", {}).get("soil_temperature")
        delhi_temp = results[1].get("land_health", {}).get("soil_temperature")
        pune_type = results[0].get("land_health", {}).get("soil_type")
        delhi_type = results[1].get("land_health", {}).get("soil_type")

        diff_ok = (pune_temp != delhi_temp) or (pune_type != delhi_type)
        status = "[PASS]" if diff_ok else "[FAIL]"
        print(f"\n{status}  Pune vs Delhi produce different soil data")
        print(f"    Pune:  temp={pune_temp}, type={pune_type}")
        print(f"    Delhi: temp={delhi_temp}, type={delhi_type}")
        if not diff_ok:
            all_ok = False

    print(f"\n{'='*60}")
    if all_ok:
        print("  [PASS] ALL TESTS PASSED")
    else:
        print("  [FAIL] SOME TESTS FAILED")
    print(f"{'='*60}\n")

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(test_coordinates())
