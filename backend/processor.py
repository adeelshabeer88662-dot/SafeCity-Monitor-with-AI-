import cv2
import numpy as np
from ultralytics import YOLO
import easyocr
try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False
    print("WARNING: PaddleOCR not available, falling back to EasyOCR")
import os

import PIL.Image
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.LANCZOS

class AIProcessor:
    def __init__(self):
        # Base directory for models
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Load YOLOv8 models with absolute paths
        helmet_model_path = os.path.join(self.base_dir, 'best (1).pt')
        plate_model_path = os.path.join(self.base_dir, 'best (4).pt')
        
        self.helmet_model = None
        self.plate_model = None
        self.paddle_ocr = None
        self.easyocr_reader = None
        self.ocr_engine = None  # Will be 'paddle' or 'easy'

        try:
            if os.path.exists(helmet_model_path):
                # Load helmet model explicitly on CPU
                self.helmet_model = YOLO(helmet_model_path, task='detect')
                self.helmet_model.to('cpu')
                print(f"DEBUG: Helmet model loaded. Classes: {self.helmet_model.names}")
            else:
                print(f"ERROR: Helmet model not found at {helmet_model_path}")
        except Exception as e:
            print(f"CRITICAL: Failed to load helmet model: {e}")

        try:
            if os.path.exists(plate_model_path):
                # Load plate model explicitly on CPU
                self.plate_model = YOLO(plate_model_path, task='detect')
                self.plate_model.to('cpu')
                print(f"DEBUG: Plate model loaded from {plate_model_path}")
            else:
                print(f"ERROR: Plate model not found at {plate_model_path}")
        except Exception as e:
            print(f"CRITICAL: Failed to load plate model: {e}")
        
        # Pre-initialize OCR to avoid lag during first detection
        self._init_ocr()
        
    def _init_ocr(self):
        """Initialize OCR engine, trying PaddleOCR first, then EasyOCR as fallback"""
        if self.ocr_engine is not None:
            return  # Already initialized
        
        # Try PaddleOCR first (better for license plates)
        if PADDLEOCR_AVAILABLE and self.paddle_ocr is None:
            try:
                print("DEBUG: Initializing PaddleOCR...")
                self.paddle_ocr = PaddleOCR(
                    use_angle_cls=True,
                    lang='en',
                    use_gpu=False,
                    show_log=False
                )
                self.ocr_engine = 'paddle'
                print("DEBUG: PaddleOCR initialized successfully")
                return
            except Exception as e:
                print(f"WARN: PaddleOCR initialization failed: {e}, falling back to EasyOCR")
        
        # Fallback to EasyOCR
        if self.easyocr_reader is None:
            try:
                print("DEBUG: Initializing EasyOCR...")
                self.easyocr_reader = easyocr.Reader(['en'], gpu=False)
                self.ocr_engine = 'easy'
                print("DEBUG: EasyOCR initialized successfully")
            except Exception as e:
                print(f"ERROR: All OCR engines failed to initialize: {e}")
                self.ocr_engine = None

    def process_frame(self, frame):
        results = []
        if frame is None:
            return results

        # 1. Detect helmets/riders
        if self.helmet_model:
            try:
                # Lowered helmet conf to 0.3 for better sensitivity on multi-bike images
                helmet_results = self.helmet_model(frame, conf=0.3, imgsz=640, verbose=False)[0]
                print(f"DEBUG: Helmet model found {len(helmet_results.boxes)} raw boxes")
                for box in helmet_results.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    label = "with helmets" if cls == 0 else "No_helmets"
                    color = (0, 255, 0) if cls == 0 else (0, 0, 255) # BGR
                    results.append({
                        "type": "COMPLIANT" if cls == 0 else "NO_HELMET",
                        "box": [x1, y1, x2, y2],
                        "label": label,
                        "color": color,
                        "confidence": conf
                    })
            except Exception as e:
                print(f"ERROR: Helmet inference failed: {e}")
        
        # 2. Detect license plates
        if self.plate_model:
            try:
                # Hyper-sensitivity mode: 0.05 conf, 1280px res, and agnostic NMS to prevent suppression
                print(f"DEBUG: Running plate detection on frame size {frame.shape[:2]} with imgz=1280, conf=0.05")
                plate_results = self.plate_model(frame, conf=0.05, imgsz=1280, agnostic_nms=True, verbose=False)[0]
                print(f"DEBUG: Plate model found {len(plate_results.boxes)} raw boxes")
                
                for box in plate_results.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    
                    # Crop plate with slightly more padding for context
                    h, w = frame.shape[:2]
                    padding = 15
                    crop_x1, crop_y1 = max(0, int(x1) - padding), max(0, int(y1) - padding)
                    crop_x2, crop_y2 = min(w, int(x2) + padding), min(h, int(y2) + padding)
                    plate_img = frame[crop_y1:crop_y2, crop_x1:crop_x2]
                    
                    plate_text = "NUMBER PLATE"
                    if plate_img.size > 0:
                        # Upscale if too small
                        orig_h, orig_w = plate_img.shape[:2]
                        if orig_w < 200:
                            scale = 200 / orig_w
                            plate_img = cv2.resize(plate_img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

                        self._init_ocr()
                        if self.ocr_engine:
                            try:
                                # Enhanced preprocessing for better OCR accuracy
                                gray_plate = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
                                
                                # CLAHE for contrast enhancement
                                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                                enhanced = clahe.apply(gray_plate)
                                
                                # Denoise
                                denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
                                
                                # Run OCR based on available engine
                                if self.ocr_engine == 'paddle':
                                    try:
                                        # PaddleOCR returns: [[[bbox], (text, confidence)]]
                                        result = self.paddle_ocr.ocr(denoised, cls=True)
                                        
                                        if result and result[0]:
                                            # Extract text and confidence, sort left to right
                                            detections = [(box[0][0][0], box[1][0], box[1][1]) for box in result[0]]
                                            detections.sort(key=lambda x: x[0])  # Sort by x-coordinate
                                            
                                            # Concatenate text, filter alphanumeric
                                            text = "".join([d[1] for d in detections]).upper()
                                            text = "".join([c for c in text if c.isalnum()])
                                            
                                            avg_conf = sum([d[2] for d in detections]) / len(detections) if detections else 0
                                            
                                            if len(text) >= 4:
                                                plate_text = text
                                                print(f"DEBUG: PaddleOCR read '{plate_text}' (conf: {avg_conf:.2f})")
                                    except Exception as e:
                                        print(f"ERROR: PaddleOCR failed: {e}")
                                
                                elif self.ocr_engine == 'easy':
                                    # Multi-technique approach for EasyOCR
                                    candidates = []
                                    
                                    # Technique 1: Enhanced + Adaptive Threshold
                                    try:
                                        adaptive = cv2.adaptiveThreshold(
                                            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                            cv2.THRESH_BINARY, 15, 3
                                        )
                                        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2,2))
                                        cleaned = cv2.morphologyEx(adaptive, cv2.MORPH_CLOSE, kernel)
                                        
                                        result1 = self.easyocr_reader.readtext(
                                            cleaned, 
                                            allowlist='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                                        )
                                        if result1:
                                            result1.sort(key=lambda x: x[0][0][0])
                                            text1 = "".join([res[1] for res in result1]).upper()
                                            avg_conf1 = sum([res[2] for res in result1]) / len(result1)
                                            candidates.append((text1, avg_conf1, "adaptive"))
                                    except Exception as e:
                                        print(f"WARN: EasyOCR adaptive failed: {e}")
                                    
                                    # Technique 2: Enhanced + OTSU
                                    try:
                                        _, otsu = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                                        result2 = self.easyocr_reader.readtext(
                                            otsu, 
                                            allowlist='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                                        )
                                        if result2:
                                            result2.sort(key=lambda x: x[0][0][0])
                                            text2 = "".join([res[1] for res in result2]).upper()
                                            avg_conf2 = sum([res[2] for res in result2]) / len(result2)
                                            candidates.append((text2, avg_conf2, "otsu"))
                                    except Exception as e:
                                        print(f"WARN: EasyOCR otsu failed: {e}")
                                    
                                    # Select best candidate
                                    if candidates:
                                        valid_candidates = [(t, c, m) for t, c, m in candidates if len(t) >= 4]
                                        
                                        if valid_candidates:
                                            def score_candidate(text, conf):
                                                has_numbers = any(c.isdigit() for c in text)
                                                has_letters = any(c.isalpha() for c in text)
                                                both = has_numbers and has_letters
                                                return (both, len(text), conf)
                                            
                                            valid_candidates.sort(key=lambda x: score_candidate(x[0], x[1]), reverse=True)
                                            plate_text = valid_candidates[0][0]
                                            print(f"DEBUG: EasyOCR selected '{plate_text}' (method: {valid_candidates[0][2]}, conf: {valid_candidates[0][1]:.2f})")
                                
                            except Exception as ocr_e:
                                print(f"ERROR: OCR processing failed: {ocr_e}")
                    
                    results.append({
                        "type": "plate",
                        "box": [x1, y1, x2, y2],
                        "label": plate_text,
                        "color": (0, 255, 255), # Yellow in BGR
                        "confidence": conf,
                        "plate_number": plate_text
                    })
            except Exception as e:
                print(f"ERROR: Plate inference failed: {e}")
            
        return results

    def annotate_frame(self, frame, detections):
        if frame is None:
            return None
        
        # Dynamic thickness based on resolution
        h, w = frame.shape[:2]
        thickness = max(1, int(w / 640))
        font_scale = max(0.4, w / 1280)

        for det in detections:
            try:
                x1, y1, x2, y2 = map(int, det["box"])
                color = det.get("color", (255, 255, 255))
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
                cv2.putText(frame, f"{det['label']} ({det['confidence']:.2f})", 
                            (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, thickness)
            except Exception as e:
                print(f"ERROR: Annotation failed for detection {det}: {e}")
        return frame
