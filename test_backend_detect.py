
import requests
import io

# Test with a dummy image (black square)
from PIL import Image
img = Image.new('RGB', (640, 640), color = 'red')
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='JPEG')
img_byte_arr = img_byte_arr.getvalue()

url = 'http://127.0.0.1:5000/detect'
files = {'image': ('test.jpg', img_byte_arr, 'image/jpeg')}
data = {'source': 'VIDEO-ANALYSIS'}

try:
    response = requests.post(url, files=files, data=data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        json_resp = response.json()
        print("Detections:", len(json_resp.get('detections', [])))
        print("Annotated Image Present:", bool(json_resp.get('annotated_image')))
    else:
        print("Error:", response.text)
except Exception as e:
    print("Request failed:", e)
