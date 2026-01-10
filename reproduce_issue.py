import cv2
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from processor import AIProcessor

# Initialize processor
print("Initializing processor...")
try:
    processor = AIProcessor()
except Exception as e:
    print(f"Failed to init processor: {e}")
    sys.exit(1)

# Load image
image_path = r"C:\Users\Administrator\.gemini\antigravity\brain\d22c5693-7ae9-4e4a-804f-7516198c8fa7\uploaded_image_1767318243639.png"
print(f"Loading image from {image_path}")
frame = cv2.imread(image_path)

if frame is None:
    print("Error: Could not load image.")
    sys.exit(1)

# Debug: Run OCR specifically on this frame
print("Processing frame...")
results = processor.process_frame(frame)

print("\n--- Detection Results ---")
for res in results:
    print(res)

print("\n--- Deep Dive into Plate Detection ---")
# Manually redo the plate logic to see intermediate steps if needed, 
# but process_frame print statements should give us good info if we enable them or add more.
# Let's add specific debug hook here by copying minimal logic to save the crop
if processor.plate_model:
    plate_results = processor.plate_model(frame, conf=0.05, imgsz=1280, agnostic_nms=True, verbose=False)[0]
    for i, box in enumerate(plate_results.boxes):
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        print(f"Plate Box {i}: {x1, y1, x2, y2}, Conf: {box.conf[0]}")
        
        h, w = frame.shape[:2]
        padding = 15
        crop_x1, crop_y1 = max(0, int(x1) - padding), max(0, int(y1) - padding)
        crop_x2, crop_y2 = min(w, int(x2) + padding), min(h, int(y2) + padding)
        plate_img = frame[crop_y1:crop_y2, crop_x1:crop_x2]
        
        # Save crop
        debug_crop_path = f"debug_plate_crop_{i}.jpg"
        cv2.imwrite(debug_crop_path, plate_img)
        print(f"Saved crop to {debug_crop_path}")
        
        # Run raw OCR
        if processor.reader:
            raw_ocr = processor.reader.readtext(plate_img)
            print(f"Raw OCR Result for Plate {i}: {raw_ocr}")
