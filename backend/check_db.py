from app import app
from models import Detection, db

def check_db():
    with app.app_context():
        total = Detection.query.count()
        last_5 = Detection.query.order_by(Detection.timestamp.desc()).limit(5).all()
        print(f"Total detections in DB: {total}")
        for d in last_5:
            print(f"[{d.timestamp}] Type: {d.type}, Plate: {d.plate_number}, Path: {d.image_path}")

if __name__ == "__main__":
    check_db()
