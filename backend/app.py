from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models import db, User, Detection, bcrypt
from processor import AIProcessor
import os
import cv2
import base64
import numpy as np
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///safecity.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key' # Change in production
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)

processor = AIProcessor()

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

start_time = datetime.utcnow()

@app.route('/')
def index():
    return jsonify({
        "status": "SafeCity AI Core Online",
        "version": "1.0.0",
        "endpoints": ["/login", "/signup", "/detect", "/stats", "/logs"]
    }), 200

@app.route('/signup', methods=['POST'])
def signup():
    print(f"DEBUG: Signup request received: {request.remote_addr}")
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        print(f"DEBUG: Signup failed - User {data['username']} already exists")
        return jsonify({"msg": "Username already exists"}), 400
    
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        username=data['username'], 
        password=hashed_pw, 
        role=data.get('role', 'Sector Chief'),
        full_name=data.get('fullName'),
        agency=data.get('agency')
    )
    db.session.add(new_user)
    db.session.commit()
    print(f"DEBUG: User created successfully: {data['username']}")
    return jsonify({"msg": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    print(f"DEBUG: Login request received: {request.remote_addr}")
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity={"username": user.username, "role": user.role})
        print(f"DEBUG: Login successful: {data['username']}")
        return jsonify(access_token=access_token, user={"username": user.username, "role": user.role}), 200
    print(f"DEBUG: Login failed for user: {data.get('username')}")
    return jsonify({"msg": "Invalid credentials"}), 401

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    img_bytes = file.read()
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    source_tag = request.form.get('source', 'IMAGE-EVIDENCE')
    print(f"DEBUG: Processing frame from {source_tag}...")
    detections = processor.process_frame(frame)
    if detections is None:
        print(f"ERROR: Detection failed for {source_tag}")
        return jsonify({"error": "Processing failed"}), 500
    
    print(f"DEBUG: Processor returned {len(detections)} raw detections")
    
    # Standardize result mapping to ensure frontend compatibility (NO_HELMET, COMPLIANT, plate)
    for det in detections:
        raw_type = str(det.get('type', '')).upper()
        raw_label = str(det.get('label', '')).upper()
        
        if 'PLATE' in raw_type:
            det['type'] = 'plate'
        elif 'NO_HELMET' in raw_type or 'WITHOUT' in raw_label or 'NO_HELMETS' in raw_label:
            det['type'] = 'NO_HELMET'
        else:
            det['type'] = 'COMPLIANT'
        
        print(f"DEBUG: Mapped {det['type']} (Raw: {raw_type}/{raw_label})")

    # Extract plate if exists
    plate_text = "UNKNOWN"
    for det in detections:
        if det['type'] == 'plate' and det['label'] != 'UNKNOWN' and det['label']:
            plate_text = det['label']
            break

    # Save annotated image
    filename = f"det_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
    image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    annotated_frame = None
    try:
        annotated_frame = processor.annotate_frame(frame.copy(), detections)
        if annotated_frame is not None:
            cv2.imwrite(image_path, annotated_frame)
        else:
            cv2.imwrite(image_path, frame)
    except Exception as e:
        print(f"ERROR: Image saving failed: {e}")
        cv2.imwrite(image_path, frame)
    
    # Database storage - Save individual records for accurate counts and matching UI
    try:
        if detections:
            # Filter plates to find the most relevant one for the frame
            best_plate = "UNKNOWN"
            for d in detections:
                if d['type'] == 'plate' and d['label'] not in ['UNKNOWN', 'NUMBER PLATE'] and d['label']:
                    best_plate = d['label']
                    break

            saved_count = 0
            seen_in_batch = set()

            for det in detections:
                # We save all NO_HELMET, COMPLIANT, and plate detections as unique entries
                d_type = det['type']
                # Correct type normalization
                if d_type == 'no_helmet': d_type = 'NO_HELMET'
                if d_type == 'compliant': d_type = 'COMPLIANT'
                
                # Determine plate number
                p_num = det.get('label') if det['type'] == 'plate' else best_plate
                if not p_num or p_num == "NUMBER PLATE": p_num = "UNKNOWN"

                # 1. Deduplicate within the same frame/batch
                batch_sig = (d_type, p_num)
                if batch_sig in seen_in_batch:
                    # heuristic: allow multiple compliant riders? no, debounce them too
                    print(f"DEBUG: Skipped batch duplicate: {d_type} - {p_num}")
                    continue
                seen_in_batch.add(batch_sig)

                # 2. Strict Deduplication against recent history (Time-based)
                # Goal: "one violation = one record" per event.
                # Window: 8 seconds
                cutoff_time = datetime.utcnow() - timedelta(seconds=8)
                
                is_duplicate = False
                base_query = Detection.query.filter(
                    Detection.source == source_tag,
                    Detection.timestamp >= cutoff_time,
                    Detection.type == d_type
                )
                
                if len(p_num) > 3 and p_num != "UNKNOWN":
                    # Strong check: must match specific plate
                    if base_query.filter(Detection.plate_number == p_num).first():
                        is_duplicate = True
                else:
                    # Weak check: If plate is unknown, we assume ANY recent violation 
                    # of the same type from this camera is the same event.
                    # This prevents 50 records of "NO_HELMET - UNKNOWN" as a bike drives by.
                    if base_query.first():
                        is_duplicate = True

                if is_duplicate:
                    print(f"DEBUG: Skipped recent duplicate (debounce): {d_type} - {p_num}")
                    continue

                new_det = Detection(
                    type=d_type,
                    confidence=det['confidence'],
                    plate_number=p_num,
                    image_path=f"uploads/{filename}",
                    source=source_tag
                )
                db.session.add(new_det)
                saved_count += 1
            
            db.session.commit()
            print(f"DEBUG: Saved {saved_count} new unique records for {source_tag}")
    except Exception as e:
        print(f"ERROR: Database saving failed: {e}")
        db.session.rollback()
    
    # Encode for immediate preview
    try:
        if annotated_frame is not None:
            _, buffer = cv2.imencode('.jpg', annotated_frame)
        else:
            _, buffer = cv2.imencode('.jpg', frame)
        encoded_image = base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        print(f"ERROR: Image encoding failed: {e}")
        encoded_image = ""
    
    return jsonify({
        "detections": detections,
        "annotated_image": f"data:image/jpeg;base64,{encoded_image}" if encoded_image else None
    })

@app.route('/stats', methods=['GET'])
def get_stats():
    total = Detection.query.count()
    violations = Detection.query.filter_by(type='NO_HELMET').count()
    compliant = Detection.query.filter_by(type='COMPLIANT').count()
    plates = Detection.query.filter(Detection.plate_number != 'UNKNOWN').count()
    
    # Calculate Uptime
    uptime_delta = datetime.utcnow() - start_time
    hours, remainder = divmod(int(uptime_delta.total_seconds()), 3600)
    minutes, _ = divmod(remainder, 60)
    uptime_str = f"{hours}h {minutes}m"
    
    # Last detection
    last_det = Detection.query.order_by(Detection.timestamp.desc()).first()
    last_event = last_det.timestamp.isoformat() + "Z" if last_det else None

    # Dynamic trends (mocked for now, but linked to real data)
    return jsonify({
        "total": total,
        "violations": violations,
        "compliant": compliant,
        "plates": plates,
        "uptime": uptime_str,
        "last_event": last_event,
        "peak_hour": "14:00",
        "trends": {
            "total": min(15, total // 10),
            "violations": min(10, violations // 5),
            "plates": min(12, plates // 2)
        }
    })

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/logs', methods=['GET'])
def get_logs():
    logs = Detection.query.order_by(Detection.timestamp.desc()).all()
    return jsonify([{
        "id": l.id,
        "type": l.type,
        "plate_number": l.plate_number,
        "confidence": l.confidence,
        "timestamp": l.timestamp.isoformat() + "Z",
        "source": l.source,
        "image_path": l.image_path
    } for l in logs])

@app.route('/purge', methods=['POST'])
def purge_detections():
    try:
        data = request.json or {}
        start_str = data.get('start')
        end_str = data.get('end')
        
        query = Detection.query
        if start_str:
            start_date = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
            query = query.filter(Detection.timestamp >= start_date)
        if end_str:
            end_date = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
            query = query.filter(Detection.timestamp <= end_date)
            
        count = query.count()
        query.delete()
        
        # Also clean physical files in uploads
        if not start_str and not end_str:
            for f in os.listdir(app.config['UPLOAD_FOLDER']):
                if f.endswith('.jpg'):
                    try: os.remove(os.path.join(app.config['UPLOAD_FOLDER'], f))
                    except: pass
                    
        db.session.commit()
        return jsonify({"msg": f"Successfully purged {count} records."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    # Disable debug mode for stable model loading (prevents double-init)
    app.run(host='0.0.0.0', port=5000, debug=False)
