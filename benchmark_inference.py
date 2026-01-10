import cv2
import sys
import os
import time
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Patch OCR
import PIL.Image
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.LANCZOS

from processor import AIProcessor

print("Initializing processor...")
processor = AIProcessor()

image_path = r"C:\Users\Administrator\.gemini\antigravity\brain\d22c5693-7ae9-4e4a-804f-7516198c8fa7\uploaded_image_1767320474146.png"
frame = cv2.imread(image_path)
if frame is None:
    print("Error loading image")
    sys.exit(1)

def benchmark(name, func, runs=3):
    print(f"\n--- Benchmarking: {name} ---")
    times = []
    for i in range(runs):
        start = time.time()
        func()
        end = time.time()
        duration = end - start
        print(f"Run {i+1}: {duration:.4f}s")
        times.append(duration)
    avg = sum(times) / len(times)
    print(f"Average: {avg:.4f}s")
    return avg

# Test 1: Current Heavy Logic (via processor.class)
def run_current():
    processor.process_frame(frame)

benchmark("Current Implementation (Includes Helmet + Plate@1280 + OCR)", run_current, runs=3)

# Test 2: Optimized Plate Settings
if processor.plate_model:
    def run_optimized():
        # Helmet (Standard 640)
        processor.helmet_model(frame, conf=0.3, imgsz=640, verbose=False)
        # Plate (Standard 640)
        processor.plate_model(frame, conf=0.2, imgsz=640, verbose=False)
    
    benchmark("Proposed Optimized (Helmet@640 + Plate@640, No OCR)", run_optimized, runs=3)
