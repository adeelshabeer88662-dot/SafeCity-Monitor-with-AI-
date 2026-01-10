import requests
import json
import base64
import os

def test_backend():
    url = "http://127.0.0.1:5000/detect"
    print(f"Testing {url}...")
    
    # Try reaching root first
    try:
        r = requests.get("http://127.0.0.1:5000/", timeout=5)
        print(f"Root status: {r.status_code}")
    except Exception as e:
        print(f"FAILED to reach root: {e}")
        return

    # Test /logs
    try:
        r = requests.get("http://127.0.0.1:5000/logs", timeout=5)
        print(f"Logs status: {r.status_code}, Found {len(r.json())} history items")
    except Exception as e:
        print(f"FAILED to reach /logs: {e}")

    # Test /detect with a dummy image if possible
    dummy_img = "test_frame.jpg"
    import cv2
    import numpy as np
    cv2.imwrite(dummy_img, np.zeros((480, 640, 3), dtype=np.uint8))
    
    try:
        with open(dummy_img, 'rb') as f:
            files = {'image': f}
            data = {'source': 'DIAGNOSTIC-TOOL'}
            r = requests.post(url, files=files, data=data, timeout=15)
            print(f"Detect status: {r.status_code}")
            if r.status_code == 200:
                res = r.json()
                print(f"Detections found: {len(res.get('detections', []))}")
            else:
                print(f"Response: {r.text}")
    except Exception as e:
        print(f"FAILED /detect: {e}")
    finally:
        if os.path.exists(dummy_img): os.remove(dummy_img)

if __name__ == "__main__":
    test_backend()
