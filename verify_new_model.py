import cv2
import sys
import os
from ultralytics import YOLO

base_dir = r"c:\Users\Administrator\Desktop\safecity-monitor\backend"
model_path = os.path.join(base_dir, 'best (4).pt')

print(f"--- Checking Model: {model_path} ---")
try:
    model = YOLO(model_path)
    print(f"Classes: {model.names}")
except Exception as e:
    print(f"Error loading model: {e}")

# Test on the image
image_path = r"C:\Users\Administrator\.gemini\antigravity\brain\d22c5693-7ae9-4e4a-804f-7516198c8fa7\uploaded_image_1767320474146.png"
frame = cv2.imread(image_path)
print("\n--- Running Inference ---")
results = model(frame, verbose=False)[0]
for box in results.boxes:
    cls_id = int(box.cls[0])
    print(f"Detected: {model.names[cls_id]} Conf: {box.conf[0]:.2f}")
