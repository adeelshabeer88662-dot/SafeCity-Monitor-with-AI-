import cv2
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Patch for OCR just in case (though we are testing detection mainly)
import PIL.Image
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.LANCZOS

from processor import AIProcessor
from ultralytics import YOLO

# Initialize processor
print("Initializing processor...")
try:
    processor = AIProcessor()
except Exception as e:
    print(f"Failed to init processor: {e}")
    sys.exit(1)

# Load image
image_path = r"C:\Users\Administrator\.gemini\antigravity\brain\d22c5693-7ae9-4e4a-804f-7516198c8fa7\uploaded_image_1767320474146.png"
print(f"Loading image from {image_path}")
frame = cv2.imread(image_path)

if frame is None:
    print("Error: Could not load image.")
    sys.exit(1)

print("\n--- Testing Plate Detection with different parameters ---")

if processor.plate_model:
    # Test 1: Standard settings (from current code)
    print("\nTest 1: Standard Settings (conf=0.05, imgsz=1280)")
    results = processor.plate_model(frame, conf=0.05, imgsz=1280, agnostic_nms=True, verbose=False)[0]
    print(f"Found {len(results.boxes)} boxes")
    for i, box in enumerate(results.boxes):
        print(f"  Box {i}: Conf={box.conf[0]:.4f}, XYXY={box.xyxy[0].tolist()}")

    # Test 2: Lower confidence
    print("\nTest 2: Lower Confidence (conf=0.01, imgsz=1280)")
    results = processor.plate_model(frame, conf=0.01, imgsz=1280, agnostic_nms=True, verbose=False)[0]
    print(f"Found {len(results.boxes)} boxes")
    for i, box in enumerate(results.boxes):
        print(f"  Box {i}: Conf={box.conf[0]:.4f}, XYXY={box.xyxy[0].tolist()}")

    # Test 3: Standard resolution (sometimes upscaling hurts)
    print("\nTest 3: Standard Resolution (conf=0.05, imgsz=640)")
    results = processor.plate_model(frame, conf=0.05, imgsz=640, agnostic_nms=True, verbose=False)[0]
    print(f"Found {len(results.boxes)} boxes")
    for i, box in enumerate(results.boxes):
        print(f"  Box {i}: Conf={box.conf[0]:.4f}, XYXY={box.xyxy[0].tolist()}")

