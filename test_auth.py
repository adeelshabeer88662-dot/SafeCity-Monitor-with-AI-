import requests

base_url = "http://localhost:5000"

def test_signup():
    url = f"{base_url}/signup"
    data = {
        "username": "test@agency.gov",
        "password": "password123",
        "fullName": "Test User",
        "agency": "Test Agency"
    }
    print(f"Testing signup at {url}...")
    try:
        response = requests.post(url, json=data)
        print(f"Response: {response.status_code}")
        print(response.json())
    except Exception as e:
        print(f"Signup failed: {e}")

def test_login():
    url = f"{base_url}/login"
    data = {
        "username": "test@agency.gov",
        "password": "password123"
    }
    print(f"Testing login at {url}...")
    try:
        response = requests.post(url, json=data)
        print(f"Response: {response.status_code}")
        print(response.json())
    except Exception as e:
        print(f"Login failed: {e}")

if __name__ == "__main__":
    test_signup()
    test_login()
