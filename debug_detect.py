import requests
import base64
import os

def test_detect():
    url = "http://127.0.0.1:5000/detect"
    # Find a sample image in uploads
    uploads_dir = "c:/Users/Administrator/Desktop/safecity-monitor/backend/uploads"
    files = [f for f in os.listdir(uploads_dir) if f.endswith('.jpg')]
    if not files:
        print("No images in uploads to test with.")
        return
    
    img_path = os.path.join(uploads_dir, files[0])
    print(f"Testing with {img_path}")
    
    with open(img_path, "rb") as f:
        response = requests.post(url, files={"image": f}, data={"source": "TEST-SYSTEM"})
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Detections found: {len(data.get('detections', []))}")
        for i, det in enumerate(data.get('detections', [])):
            print(f"Det {i}: {det}")
        if data.get('annotated_image'):
            print("Annotated image returned (base64 length: {})".format(len(data['annotated_image'])))
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_detect()
