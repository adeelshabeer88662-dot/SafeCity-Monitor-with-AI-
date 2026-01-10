import requests
import os

url = "http://localhost:5000/detect"
image_path = r"C:\Users\Administrator\.gemini\antigravity\brain\bcdedbb9-c391-4058-beec-94ed55f97edf\uploaded_image_1767186357544.png"

if not os.path.exists(image_path):
    print(f"Error: Image not found at {image_path}")
    exit()

with open(image_path, "rb") as f:
    files = {"image": f}
    data = {"source": "VERIFICATION-UNIT"}
    print(f"Sending request to {url}...")
    try:
        response = requests.post(url, files=files, data=data)
        if response.status_code == 200:
            print("Success!")
            result = response.json()
            print(f"Detections found: {len(result.get('detections', []))}")
            for det in result.get('detections', []):
                print(f"- Type: {det['type']}, Label: {det['label']}, Confidence: {det['confidence']:.2f}")
                print(f"  Box: {det['box']}")
        else:
            print(f"Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
