import requests
import json
import os

def test_server():
    print("🔍 Testing Smart Kiosk Server (Localhost:5000)...")
    
    # 1. Test Static / (UI)
    try:
        res = requests.get("http://127.0.0.1:5000/", timeout=5)
        if res.status_code == 200:
            print("✅ Main UI is accessible.")
        else:
            print(f"❌ Main UI returned status: {res.status_code}")
    except Exception as e:
        print(f"❌ Could not reach UI: {e}")

    # 2. Test News API
    try:
        res = requests.get("http://127.0.0.1:5000/api/news", timeout=5)
        if res.status_code == 200:
            print(f"✅ News API is working. Found {len(res.json())} news items.")
        else:
            print(f"❌ News API returned error: {res.status_code}")
    except Exception as e:
        print(f"❌ News API test failed: {e}")

    # 3. Test Bot /ask
    print("\n🤖 Testing AI Chat Connection...")
    payload = {"question": "مرحباً، من أنت؟"}
    try:
        # Long timeout because AI takes time to think
        res = requests.post("http://127.0.0.1:5000/ask", json=payload, timeout=30)
        if res.status_code == 200:
            answer = res.json().get('answer', '')
            print(f"✅ Full Response received from Bot: {answer[:100]}...")
        else:
            print(f"❌ Ask API returned status: {res.status_code}")
    except requests.exceptions.Timeout:
        print("🕒 Bot took too long to answer (likely AI still downloading or thinking).")
    except Exception as e:
        print(f"❌ Bot test failed: {e}")

if __name__ == "__main__":
    test_server()
