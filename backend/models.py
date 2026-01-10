from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), default='Sector Chief')
    full_name = db.Column(db.String(120))
    agency = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Detection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(50))  # 'NO_HELMET' or 'COMPLIANT'
    plate_number = db.Column(db.String(50))
    confidence = db.Column(db.Float)
    image_path = db.Column(db.String(255))
    source = db.Column(db.String(100), default='IMAGE-EVIDENCE')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
