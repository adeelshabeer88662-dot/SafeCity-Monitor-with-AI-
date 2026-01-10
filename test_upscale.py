import cv2
import sys
import os
from ultralytics import YOLO

base_dir = r"c:\Users\Administrator\Desktop\safecity-monitor\backend"
model2_path = os.path.join(base_dir, 'license-plate-finetune-v1l.pt')

try:
    model2 = YOLO(model2_path)
except Exception as e:
    print(f"Error loading model: {e}")
    sys.exit(1)

image_path = r"C:\Users\Administrator\.gemini\antigravity\brain\d22c5693-7ae9-4e4a-804f-7516198c8fa7\uploaded_image_1767320474146.png"
frame = cv2.imread(image_path)
h, w = frame.shape[:2]

print(f"Original Size: {w}x{h}")

# Upscale 2x
scale = 2.0
frame_large = cv2.resize(frame, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
print(f"Upscaled Size: {frame_large.shape[1]}x{frame_large.shape[0]}")

print("\n--- Running Inference on Upscaled Image ---")
# Use larger inference size since image is larger
results = model2(frame_large, conf=0.1, imgsz=1280, agnostic_nms=True, verbose=False)[0]

print(f"Found {len(results.boxes)} boxes")
for i, box in enumerate(results.boxes):
    cls_id = int(box.cls[0])
    conf = box.conf[0]
    x1, y1, x2, y2 = box.xyxy[0].tolist()
    
    # Map back to original size
    ox1, oy1, ox2, oy2 = x1/scale, y1/scale, x2/scale, y2/scale
    
    print(f"  Box {i}: {model2.names[cls_id]} Conf: {conf:.4f} OrigCoords: [{ox1:.1f}, {oy1:.1f}, {ox2:.1f}, {oy2:.1f}]")
    cv2.rectangle(frame, (int(ox1), int(oy1)), (int(ox2), int(oy2)), (0, 0, 255), 2)

cv2.imwrite("debug_upscale_result.jpg", frame)
