import cv2
import sys
import os
from ultralytics import YOLO

base_dir = r"c:\Users\Administrator\Desktop\safecity-monitor\backend"
model1_path = os.path.join(base_dir, 'best (1).pt')
model2_path = os.path.join(base_dir, 'license-plate-finetune-v1l.pt')

print("--- Model 1: best (1).pt ---")
try:
    model1 = YOLO(model1_path)
    print(f"Classes: {model1.names}")
except Exception as e:
    print(f"Error loading model 1: {e}")

print("\n--- Model 2: license-plate-finetune-v1l.pt ---")
try:
    model2 = YOLO(model2_path)
    print(f"Classes: {model2.names}")
except Exception as e:
    print(f"Error loading model 2: {e}")

# Load image
image_path = r"C:\Users\Administrator\.gemini\antigravity\brain\d22c5693-7ae9-4e4a-804f-7516198c8fa7\uploaded_image_1767320474146.png"
frame = cv2.imread(image_path)

print("\n--- Running Inference with BOTH models on default settings ---")

print("Running Model 1 (best (1).pt)...")
res1 = model1(frame, verbose=False)[0]
for box in res1.boxes:
    cls_id = int(box.cls[0])
    print(f"Detected: {model1.names[cls_id]} Conf: {box.conf[0]:.2f}")

print("\nRunning Model 2 (license-plate-finetune-v1l.pt)...")
res2 = model2(frame, verbose=False)[0]
for box in res2.boxes:
    cls_id = int(box.cls[0])
    print(f"Detected: {model2.names[cls_id]} Conf: {box.conf[0]:.2f}")
