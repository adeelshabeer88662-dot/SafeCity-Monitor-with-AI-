import cv2
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Patch for OCR
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
frame = cv2.imread(image_path)
h, w = frame.shape[:2]

print(f"\n--- Testing Tiled/Cropped Detection ---")
print(f"Image Size: {w}x{h}")

# Define a crop for the bottom-left area where the scooter is
# visible area roughly x: 200-600, y: 300-500 based on my guess, but let's take a safe quadrant
# Bottom-Left Quadrant
crop_x1, crop_y1 = 200, 200
crop_x2, crop_y2 = 600, 501
crop_img = frame[crop_y1:crop_y2, crop_x1:crop_x2]

print(f"Testing Crop: x={crop_x1}-{crop_x2}, y={crop_y1}-{crop_y2}")

if processor.plate_model:
    # Run slightly more aggressive inference on the crop
    results = processor.plate_model(crop_img, conf=0.1, imgsz=640, agnostic_nms=True, verbose=False)[0]
    print(f"Found {len(results.boxes)} boxes in crop")
    for i, box in enumerate(results.boxes):
        bx1, by1, bx2, by2 = box.xyxy[0].tolist()
        # Map back to original coordinates
        orig_x1 = bx1 + crop_x1
        orig_y1 = by1 + crop_y1
        orig_x2 = bx2 + crop_x1
        orig_y2 = by2 + crop_y1
        print(f"  Box {i} (Global): Conf={box.conf[0]:.4f}, XYXY=[{orig_x1:.1f}, {orig_y1:.1f}, {orig_x2:.1f}, {orig_y2:.1f}]")
        
        # Save the crop debug image
        cv2.rectangle(crop_img, (int(bx1), int(by1)), (int(bx2), int(by2)), (0, 255, 0), 2)

    cv2.imwrite("debug_crop_detection.jpg", crop_img)
