from flask import Blueprint, request, jsonify, current_app
import time
import base64
import numpy as np
from PIL import Image
import io
from deepface import DeepFace
from mtcnn import MTCNN
from pymongo import MongoClient
from bson.objectid import ObjectId
import logging

student_registration_bp = Blueprint("student_registration", __name__)

logger = logging.getLogger(__name__)

def read_image_from_bytes(b):
    img = Image.open(io.BytesIO(b)).convert('RGB')
    return np.array(img)

def detect_faces_rgb(rgb_image):
    """Detect faces with strict quality requirements for registration"""
    model_manager = current_app.config.get("MODEL_MANAGER")
    detector = current_app.config.get("MTCNN_DETECTOR")
    
    if not model_manager or not detector:
        logger.error("ModelManager or detector not available in config")
        return []

    with model_manager.lock:
        detections = detector.detect_faces(rgb_image)
    
    faces = []
    for d in detections:
        if d['confidence'] > 0.65:  # Lowered from 0.8 to 0.65 to allow easier registration
            x, y, w, h = d['box']
            x, y = max(0, x), max(0, y)
            # Lowered min size from 80 to 60 pixels
            if w > 60 and h > 60:
                face_rgb = rgb_image[y:y+h, x:x+w]
                faces.append({'box': (x, y, w, h), 'face': face_rgb, 'confidence': d['confidence']})
    return faces

def extract_face_data(face_rgb):
    """Extract face features using ArcFace model with thread safety"""
    try:
        model_manager = current_app.config.get("MODEL_MANAGER")
        if not model_manager:
            return None

        # Resize to ArcFace input size (112x112) with high-quality interpolation
        face_pil = Image.fromarray(face_rgb.astype('uint8')).resize((112, 112), Image.Resampling.LANCZOS)
        face_array = np.array(face_pil)
        
        with model_manager.lock:
            # Extract face data using ArcFace (upgraded from Facenet512)
            from deepface import DeepFace
            rep = DeepFace.represent(
                face_array, 
                model_name='ArcFace',  # Changed from Facenet512
                detector_backend='skip',
                enforce_detection=False
            )
        
        # Convert to numpy array with float32 for efficiency
        face_data = np.array(rep[0]['embedding'], dtype=np.float32)
        
        # Normalize face data (L2 normalization)
        norm = np.linalg.norm(face_data)
        if norm > 0:
            face_data = face_data / norm
        
        return face_data
    except Exception as e:
        logger.error(f"Face data extraction error: {e}")
        return None

@student_registration_bp.route('/api/register-student', methods=['POST'])
def register_student():
    # ── ROLE GUARD: Admin only ──────────────────────────────
    user_type = request.headers.get('X-User-Type', '')
    if user_type != 'admin':
        return jsonify({"success": False, "error": "Access denied. Only admins can register students."}), 403
    # ────────────────────────────────────────────────────────

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON data"}), 400

    # Get logged-in user info from headers
    # Simplified: only validate fields and ensure uniqueness of studentId and email
    db = current_app.config.get("DB")
    students_col = db.students

    # Check required fields
    required_fields = ['studentName', 'studentId', 'department', 'year', 'division', 'semester', 'email', 'phoneNumber', 'images']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"success": False, "error": f"{field} is required"}), 400

    # Check uniqueness of studentId and email
    if students_col.find_one({'studentId': data['studentId']}):
        return jsonify({"success": False, "error": "Student ID already exists"}), 400
    if students_col.find_one({'email': data['email']}):
        return jsonify({"success": False, "error": "Email already registered"}), 400

    # Validate images
    images = data.get('images')
    if not isinstance(images, list) or len(images) != 5:
        return jsonify({"success": False, "error": "Exactly 5 images are required"}), 400

    face_data_list = []
    for idx, img_b64 in enumerate(images):
        try:
            if img_b64.startswith("data:"):
                img_b64 = img_b64.split(",", 1)[1]
            rgb = read_image_from_bytes(base64.b64decode(img_b64))
        except Exception:
            return jsonify({"success": False, "error": f"Invalid image data at index {idx}"}), 400

        faces = detect_faces_rgb(rgb)
        if len(faces) != 1:
            return jsonify({"success": False, "error": f"Ensure exactly one face in each image (failed at image {idx+1})"}), 400

        face_data = extract_face_data(faces[0]['face'])
        if face_data is None:
            return jsonify({"success": False, "error": f"Failed to extract face features for image {idx+1}"}), 500
        # Convert numpy array to list for JSON serialization
        face_data_list.append(face_data.tolist())

    # Hash password if provided
    login_password = data.get('loginPassword')
    hashed_password = None
    if login_password:
        from flask_bcrypt import Bcrypt
        bcrypt = Bcrypt()
        hashed_password = bcrypt.generate_password_hash(login_password).decode('utf-8')
        print(f"DEBUG: Hashing password for {data.get('email')}")

    student_data = {
        "studentId":       data['studentId'],
        "studentName":     data['studentName'],
        "department":      data['department'],
        "year":            data['year'],
        "division":        data['division'],
        "semester":        data['semester'],
        "email":           data['email'],
        "phoneNumber":     data['phoneNumber'],
        "status":          "active",
        "face_data":       list(face_data_list), # Ensure list
        "role":            "student"
    }

    if hashed_password:
        student_data['password'] = hashed_password
        print(f"DEBUG: Password field set for {data.get('email')}")

    result = students_col.insert_one(student_data)
    return jsonify({"success": True, "studentId": data['studentId'], "record_id": str(result.inserted_id)})


@student_registration_bp.route('/api/students/count', methods=['GET'])
def get_student_count():
    db = current_app.config.get("DB")
    return jsonify({"success": True, "count": db.students.count_documents({})})

@student_registration_bp.route('/api/students/departments', methods=['GET'])
def get_departments():
    db = current_app.config.get("DB")
    departments = db.students.distinct("department")
    return jsonify({"success": True, "departments": departments, "count": len(departments)})
