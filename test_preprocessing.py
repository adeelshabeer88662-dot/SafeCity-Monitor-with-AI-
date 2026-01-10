import cv2
import sys
import os
import numpy as np
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import PIL.Image
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.LANCZOS

from processor import AIProcessor

# Initialize processor
print("Initializing processor...")
try:
    processor = AIProcessor()
except Exception as e:
    print(f"Failed to init processor: {e}")
    sys.exit(1)

image_path = r"C:\Users\Administrator\.gemini\antigravity\brain\d22c5693-7ae9-4e4a-804f-7516198c8fa7\uploaded_image_1767320474146.png"
frame = cv2.imread(image_path)

if frame is None:
    print("Error loading image")
    sys.exit(1)

def run_detect(name, img):
    print(f"\nRunning detection on: {name}")
    if processor.plate_model:
        results = processor.plate_model(img, conf=0.01, imgsz=1280, agnostic_nms=True, verbose=False)[0]
        print(f"Found {len(results.boxes)} boxes")
        for i, box in enumerate(results.boxes):
            print(f"  Box {i}: Conf={box.conf[0]:.4f}, XYXY={box.xyxy[0].tolist()}")
            # Save visual debug
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.imwrite(f"debug_preproc_{name}.jpg", img)

# 1. CLAHE (Contrast Limited Adaptive Histogram Equalization)
# Convert to LAB color space
lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
l, a, b = cv2.split(lab)
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
cl = clahe.apply(l)
limg = cv2.merge((cl,a,b))
final_clahe = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

run_detect("CLAHE", final_clahe)

# 2. Sharpening
kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
sharpened = cv2.filter2D(frame, -1, kernel)
run_detect("Sharpened", sharpened)

# 3. Gamma Correction (Brighten)
gamma = 1.5
invGamma = 1.0 / gamma
table = np.array([((i / 255.0) ** invGamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
gamma_img = cv2.LUT(frame, table)
run_detect("Gamma_1.5", gamma_img)
