import os
from ultralytics import YOLO

def check_model(model_path):
    print(f"\nChecking model: {model_path}")
    if not os.path.exists(model_path):
        print(f"Error: {model_path} does not exist.")
        return
    
    try:
        model = YOLO(model_path)
        print(f"Model {model_path} loaded successfully.")
        print(f"Names: {model.names}")
    except Exception as e:
        print(f"Error loading {model_path}: {e}")

if __name__ == "__main__":
    check_model("backend/best (1).pt")
    check_model("backend/license-plate-finetune-v1l.pt")
