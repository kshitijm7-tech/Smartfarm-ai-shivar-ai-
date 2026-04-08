import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def test_health():
    print("Testing /health...")
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(r.json())
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
    print(r.json())

def test_chat():
    print("\nTesting /chat...")
    payload = {
        "user_message": "How to grow organic tomatoes in Maharashtra?",
        "language_pref": "Marathi"
    }
    r = requests.post(f"{BASE_URL}/chat", json=payload)
    print(r.json())

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
    print(r.json())

    print("\nTesting /api/market/view...")
    r = requests.get(f"{BASE_URL}/api/market/view")
    print(r.json())

if __name__ == "__main__":
    # Note: Server must be running for this to work
    test_health()
    test_analyze()
    test_chat()
    test_marketplace()
    print("\nTests completed successfully.")
