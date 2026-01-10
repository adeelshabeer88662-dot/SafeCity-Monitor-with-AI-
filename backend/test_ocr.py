import cv2
import sys
import os

# Add current directory to path so we can import processor
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processor import AIProcessor

def test_ocr():
    print("Initializing Processor...")
    processor = AIProcessor()
    
    image_path = r"C:/Users/Administrator/.gemini/antigravity/brain/e37b3af3-d653-4384-a2e5-0b898160bf08/uploaded_image_1767691707796.png"
    print(f"Loading image from: {image_path}")
    
    if not os.path.exists(image_path):
        print("Image not found!")
        return

    frame = cv2.imread(image_path)
    if frame is None:
        print("Failed to read image")
        return

    print("Processing frame...")
    results = processor.process_frame(frame)
    
    print("\n--- RESULTS ---")
    for r in results:
        if r['type'] == 'plate':
            print(f"Plate: {r['label']} (Conf: {r['confidence']:.2f})")

if __name__ == "__main__":
    test_ocr()
