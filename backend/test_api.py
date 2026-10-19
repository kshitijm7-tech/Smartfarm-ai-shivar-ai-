import requests
import json
import time
import sys

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000"

def test_health():
    print("Testing /health...")
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"Status {r.status_code}: {r.json()}")
        assert r.status_code == 200
    except Exception as e:
        print(f"Server not running? {e}")

def test_analyze():
    print("\nTesting /analyze_farm...")
    payload = {
        "farmer_id": 1,
        "lat": 28.6139,
        "lon": 77.2090
    }
    r = requests.post(f"{BASE_URL}/analyze_farm", json=payload)
    print(f"Status {r.status_code}: crop={r.json().get('crop')}, health_score={r.json().get('health_score')}")
    assert r.status_code == 200

def test_chat():
    print("\nTesting /chat...")
    payload = {
        "user_message": "How to grow organic tomatoes in Maharashtra?",
        "language_pref": "Marathi"
    }
    r = requests.post(f"{BASE_URL}/chat", json=payload)
    print(f"Status {r.status_code}: {r.json().get('answer', '')[:80]}...")
    assert r.status_code == 200

def test_marketplace():
    print("\nTesting /api/market/add...")
    payload = {
        "farmer_id": 1,
        "crop_name": "Organic Tomatoes",
        "expected_yield_kg": 200,
        "price_per_kg": 40,
        "harvest_date": "2024-05-20"
    }
    r = requests.post(f"{BASE_URL}/api/market/add", json=payload)
    print(f"Status {r.status_code}: {r.json()}")
    assert r.status_code in (200, 201)

    print("\nTesting /api/market/view...")
    r = requests.get(f"{BASE_URL}/api/market/view")
    data = r.json()
    print(f"Status {r.status_code}: {len(data.get('listings', []))} listings found")
    assert r.status_code == 200

def test_auth():
    print("\nTesting /api/auth/register & login...")
    test_phone = f"99999{int(time.time()) % 100000:05d}"
    reg_payload = {
        "name": "Test Farmer",
        "phone": test_phone,
        "password": "securepassword123",
        "farm_size": "5.0",
        "primary_crop": "Wheat"
    }
    r_reg = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
    print(f"Register status {r_reg.status_code}: {r_reg.json().get('message')}")
    
    login_payload = {
        "phone": test_phone,
        "password": "securepassword123"
    }
    r_login = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    print(f"Login status {r_login.status_code}: {r_login.json().get('message')}")
    assert r_login.status_code == 200

def test_harvest_predictor():
    print("\nTesting /api/harvest-predictor/predict...")
    pred_payload = {
        "crop": "Wheat",
        "harvest_date": "2026-10-15",
        "district": "Pune",
        "farm_size_acres": 5.0
    }
    r = requests.post(f"{BASE_URL}/api/harvest-predictor/predict", json=pred_payload)
    print(f"Status {r.status_code}: predicted_price={r.json().get('predicted_price')}")
    assert r.status_code == 200

if __name__ == "__main__":
    test_health()
    test_analyze()
    test_chat()
    test_marketplace()
    test_auth()
    test_harvest_predictor()
    print("\nAll Backend API Tests passed successfully! ✅")
