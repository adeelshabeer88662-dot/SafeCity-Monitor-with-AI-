import requests
import os

def test_detect():
    url = "http://localhost:5000/detect"
    image_path = r"backend/uploads/det_20251231_140509_445576.jpg"
    
    if not os.path.exists(image_path):
        print(f"Error: Sample image {image_path} not found.")
        return

    with open(image_path, "rb") as f:
        files = {"image": f}
        data = {"source": "TEST-VERIFICATION"}
        print(f"Sending request to {url}...")
        try:
            response = requests.post(url, files=files, data=data)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print("Detection successful!")
                print(f"Number of detections: {len(result['detections'])}")
                for i, det in enumerate(result['detections']):
                    print(f"  {i+1}. Type: {det['type']}, Label: {det['label']}, Confidence: {det['confidence']:.2f}")
                
                if result.get('annotated_image'):
                    print("Annotated image received (base64).")
                else:
                    print("Warning: No annotated image received.")
            else:
                print(f"Error response: {response.text}")
        except Exception as e:
            print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_detect()
