"""
test_intelligence.py — Verify Context Bridge Intelligence Report
Tests that the /analyze_farm response contains the intelligence block
with cross-linked chat guidance, risk alerts, knowledge hub, and marketplace prompt.
"""

import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

REQUIRED_INTEL_KEYS = ["chat_guidance", "risk_alerts", "knowledge_hub", "soil_summary", "marketplace_prompt"]
REQUIRED_DEEP_KEYS = ["risk_details", "nutrient_profile", "scheme_matches"]
REQUIRED_CHAT_KEYS = ["auto_message", "cure_steps", "products", "urgency", "voice_summary", "disease_detected"]
REQUIRED_MARKET_KEYS = ["should_list", "message", "pre_filled", "confidence_reason"]
BACKWARD_COMPAT_KEYS = ["disease", "soil", "npk", "weather", "profit", "crop", "fertilizer", "ndvi", "land_health", "environment"]


def run_tests():
    all_ok = True
    coords = [
        {"name": "Pune (Deccan)", "lat": 18.52, "lon": 73.86},
        {"name": "Delhi (IGP)", "lat": 28.61, "lon": 77.21},
    ]

    for tc in coords:
        print(f"\n{'='*60}")
        print(f"  Testing: {tc['name']}  ({tc['lat']}, {tc['lon']})")
        print(f"{'='*60}")

        try:
            r = requests.post(f"{BASE_URL}/analyze_farm", json={
                "farmer_id": 1, "lat": tc["lat"], "lon": tc["lon"],
            }, timeout=30)

            if r.status_code != 200:
                print(f"  [FAIL] HTTP {r.status_code}")
                all_ok = False
                continue

            data = r.json()
            intel = data.get("intelligence", {})

            # --- Check intelligence block exists ---
            has_intel = "intelligence" in data
            print(f"  {'[PASS]' if has_intel else '[FAIL]'}  intelligence block exists")
            if not has_intel:
                all_ok = False
                continue

            # --- Check all intelligence sub-keys ---
            for key in REQUIRED_INTEL_KEYS:
                ok = key in intel
                print(f"  {'[PASS]' if ok else '[FAIL]'}  intelligence.{key} present")
                if not ok:
                    all_ok = False

            # --- Check chat_guidance structure ---
            cg = intel.get("chat_guidance", {})
            for key in REQUIRED_CHAT_KEYS:
                ok = key in cg
                print(f"  {'[PASS]' if ok else '[FAIL]'}  chat_guidance.{key}")
                if not ok:
                    all_ok = False

            print(f"  >> disease_detected={cg.get('disease_detected')}, urgency={cg.get('urgency')}")
            print(f"  >> auto_message: {str(cg.get('auto_message',''))[:100]}...")

            # --- Check marketplace_prompt structure ---
            mp = intel.get("marketplace_prompt", {})
            for key in REQUIRED_MARKET_KEYS:
                ok = key in mp
                print(f"  {'[PASS]' if ok else '[FAIL]'}  marketplace_prompt.{key}")
                if not ok:
                    all_ok = False

            print(f"  >> should_list={mp.get('should_list')}, reason={str(mp.get('confidence_reason',''))[:80]}")

            # --- Check soil_summary ---
            ss = intel.get("soil_summary", {})
            for key in ["moisture_status", "vegetation_status", "overall_land_grade"]:
                ok = key in ss
                print(f"  {'[PASS]' if ok else '[FAIL]'}  soil_summary.{key}={ss.get(key)}")
                if not ok:
                    all_ok = False

            # --- Backward compatibility ---
            bc_ok = all(k in data for k in BACKWARD_COMPAT_KEYS)
            print(f"  {'[PASS]' if bc_ok else '[FAIL]'}  backward compatibility (all legacy keys)")
            if not bc_ok:
                missing = [k for k in BACKWARD_COMPAT_KEYS if k not in data]
                print(f"    MISSING: {missing}")
                all_ok = False

            # --- Risk alerts + knowledge hub ---
            ra = intel.get("risk_alerts", [])
            kh = intel.get("knowledge_hub", [])
            print(f"  >> risk_alerts: {len(ra)} alerts, knowledge_hub: {len(kh)} topics")
            for alert in ra:
                print(f"     - {alert.get('type')} ({alert.get('severity')}): {alert.get('trigger')}")
            for topic in kh[:3]:
                print(f"     * {topic.get('topic')} [{topic.get('priority')}]")

            # --- Check deep_insights block ---
            has_deep_intel = "deep_insights" in data
            print(f"  {'[PASS]' if has_deep_intel else '[FAIL]'}  deep_insights block exists")
            if not has_deep_intel:
                all_ok = False
                continue

            deep = data.get("deep_insights", {})
            for key in REQUIRED_DEEP_KEYS:
                ok = key in deep and len(deep[key]) > 0
                print(f"  {'[PASS]' if ok else '[FAIL]'}  deep_insights.{key} populated")
                if not ok:
                    all_ok = False

            # Sample Deep Insights printout
            risk = deep.get("risk_details", [])[0] if deep.get("risk_details") else {}
            nutr = deep.get("nutrient_profile", [])[0] if deep.get("nutrient_profile") else {}
            schm = deep.get("scheme_matches", [])[0] if deep.get("scheme_matches") else {}
            
            print(f"  >> Top Risk: {risk.get('name')} ({risk.get('probability_score')}%, {risk.get('time_to_impact')})")
            print(f"  >> N Status: {nutr.get('status')} ({nutr.get('value')} {nutr.get('unit')}, target {nutr.get('optimal_range')})")
            print(f"  >> Top Scheme: {schm.get('scheme_name')} (Score {schm.get('match_score')})")

        except Exception as e:
            print(f"  [FAIL] Request error: {e}")
            all_ok = False

    print(f"\n{'='*60}")
    if all_ok:
        print("  [PASS] ALL INTELLIGENCE REPORT TESTS PASSED")
    else:
        print("  [FAIL] SOME TESTS FAILED")
    print(f"{'='*60}\n")

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(run_tests())
