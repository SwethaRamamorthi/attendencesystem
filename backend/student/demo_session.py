# student/demo_session.py - OPTIMIZED VERSION
from flask import Blueprint, request, jsonify, current_app
import time
import base64
import numpy as np
from PIL import Image
import io
import logging
import threading
from student.registration import extract_face_data

logger = logging.getLogger(__name__)

demo_session_bp = Blueprint("demo_session", __name__)

def read_image_from_bytes_optimized(b, target_size=(640, 480)):
    """Optimized image reading with size constraints"""
    img = Image.open(io.BytesIO(b)).convert("RGB")

    # Resize large images to reduce processing time
    if img.width > target_size[0] or img.height > target_size[1]:
        img.thumbnail(target_size, Image.Resampling.LANCZOS)

    return np.array(img)

def detect_faces_rgb_optimized(rgb_image, detector):
    """Optimized face detection using preloaded MTCNN detector"""
    # Skip detection if image is too small
    if rgb_image.shape[0] < 50 or rgb_image.shape[1] < 50:
        logger.warning(f"Image too small: {rgb_image.shape}")
        return []

    try:
        model_manager = current_app.config.get("MODEL_MANAGER")
        if not model_manager:
            return []
            
        with model_manager.lock:
            detections = detector.detect_faces(rgb_image)
            logger.info(f"MTCNN raw detections: {len(detections)} faces found")
        
        faces = []

        for d in detections:
            confidence = d.get("confidence", 0)
            logger.info(f"Face detected with confidence: {confidence:.2f}")
            
            # Lowered confidence threshold for better detection
            if confidence > 0.70:  # Reduced from 0.75 to 0.70
                x, y, w, h = d["box"]
                x, y = max(0, x), max(0, y)
                
                # Reduced minimum size for better detection
                if w > 30 and h > 30:  # Reduced from 40 to 30
                    face_rgb = rgb_image[y:y+h, x:x+w]
                    faces.append({
                        "box": (x, y, w, h), 
                        "face": face_rgb, 
                        "confidence": confidence
                    })
                    logger.info(f"✓ Valid face added: {w}x{h} at ({x},{y}), conf={confidence:.2f}")
                else:
                    logger.warning(f"Face too small: {w}x{h}, skipped")
            else:
                logger.warning(f"Low confidence face: {confidence:.2f}, skipped")

        logger.info(f"Returning {len(faces)} valid faces")
        return faces
        
    except Exception as e:
        logger.error(f"Face detection error: {str(e)}")
        return []

def extract_face_data_optimized(face_rgb):
    """Optimized face data extraction with ArcFace model and thread safety"""
    try:
        model_manager = current_app.config.get("MODEL_MANAGER")
        if not model_manager:
            return None

        # Resize face to ArcFace input size (112x112) with high-quality interpolation
        face_pil = Image.fromarray(face_rgb.astype("uint8")).resize((112, 112), Image.Resampling.LANCZOS)
        face_array = np.array(face_pil)

        with model_manager.lock:
            # Use DeepFace ArcFace model (upgraded from Facenet512)
            from deepface import DeepFace
            rep = DeepFace.represent(
                face_array, 
                model_name="ArcFace",  # Changed from Facenet512
                detector_backend="skip",
                enforce_detection=False
            )
        
        face_data = np.array(rep[0]["embedding"], dtype=np.float32)
        
        # L2 normalization for cosine similarity
        norm = np.linalg.norm(face_data)
        if norm > 0:
            face_data = face_data / norm
        
        return face_data

    except Exception as e:
        logger.error(f"Face data extraction error: {e}")
        return None

# In-memory cache for student face data (optional optimization)
class FaceDataCache:
    def __init__(self):
        self.student_face_data = None
        self.last_update = 0
        self.cache_duration = 300  # 5 minutes
        self.lock = threading.Lock()

    def get_face_data(self, students_col):
        current_time = time.time()

        # Thread-safe cache check
        with self.lock:
            if (self.student_face_data is None or 
                current_time - self.last_update > self.cache_duration):

                logger.info("Refreshing face data cache...")

                # Fetch students with face data
                students = list(students_col.find(
                    {"face_data": {"$exists": True, "$ne": None}},
                    {"studentId": 1, "studentName": 1, "face_data": 1}
                ))

                # Process face data
                self.student_face_data = []
                for student in students:
                    face_data_list = student.get('face_data', [])
                    if face_data_list:
                        # Average multiple face data entries if available
                        avg_face_data = np.mean(face_data_list, axis=0).astype(np.float32)
                        self.student_face_data.append({
                            'face_data': avg_face_data,
                            'studentId': student.get('studentId'),
                            'studentName': student.get('studentName')
                        })

                self.last_update = current_time
                logger.info(f"Cache refreshed with {len(self.student_face_data)} students")

        return self.student_face_data

# Global face data cache instance
face_data_cache = FaceDataCache()

def find_best_match_optimized(query_face_data, students_col, threshold=0.50):
    """
    Enhanced database search with multi-face-data comparison.
    Compares against all stored face data instead of just averaged ones.
    Includes validation to skip corrupted data entries.
    """
    # Fetch students with face data (no caching for now to ensure fresh data)
    students = list(students_col.find(
        {"face_data": {"$exists": True, "$ne": None}},
        {"studentId": 1, "studentName": 1, "face_data": 1}
    ))
    
    if not students:
        return None, float('inf')
    
    best_match = None
    min_distance = float('inf')
    best_confidence = 0
    
    # Compare against ALL face data for each student, not just average
    for student in students:
        face_data_list = student.get('face_data', [])
        if not face_data_list:
            continue
        
        # Compare query against all 5 face data entries
        distances = []
        for stored_face_data in face_data_list:
            try:
                # Validate that stored_face_data can be converted to numpy array
                if isinstance(stored_face_data, str):
                    logger.warning(f"Skipping corrupted face data for {student.get('studentName')}: data is string instead of array")
                    continue
                
                stored_data = np.array(stored_face_data, dtype=np.float32)
                
                # Additional validation: check if array has valid shape and values
                if stored_data.size == 0 or not np.isfinite(stored_data).all():
                    logger.warning(f"Skipping invalid face data for {student.get('studentName')}: empty or non-finite values")
                    continue
                
                # Use cosine distance from scipy
                from scipy.spatial.distance import cosine
                distance = cosine(query_face_data, stored_data)
                distances.append(distance)
                
            except (ValueError, TypeError) as e:
                logger.warning(f"Skipping corrupted face data for {student.get('studentName')}: {e}")
                continue
        
        # Skip student if all face data was corrupted
        if not distances:
            logger.warning(f"All face data corrupted for {student.get('studentName')}, skipping")
            continue
        
        # Use minimum distance and calculate match quality
        student_min_distance = min(distances)
        student_avg_distance = np.mean(distances)
        
        # Count how many face data entries matched within threshold (for confidence)
        match_count = sum(1 for d in distances if d < threshold)
        confidence_score = (match_count / len(distances)) * 100  # Percentage
        
        # Debug logging
        logger.info(f"  Checking {student.get('studentName')}: min_dist={student_min_distance:.4f}, matches={match_count}/{len(distances)}, conf={confidence_score:.1f}%")
        
        # Update best match if this is better AND has good confidence
        # Require at least 1 match to handle cases where some embeddings are corrupted
        # This is more lenient but still requires the face to match at least one stored embedding
        if student_min_distance < min_distance and match_count >= 1:
            min_distance = student_min_distance
            best_confidence = confidence_score
            best_match = {
                'studentId': student.get('studentId'),
                'studentName': student.get('studentName'),
                'match_count': int(match_count),
                'confidence_score': float(confidence_score),
                'min_distance': float(student_min_distance),
                'avg_distance': float(student_avg_distance)
            }
    
    # Return only basic JSON-safe types to avoid serialization errors
    if min_distance < threshold and best_match:
        logger.info(f"✅ Matched: {best_match['studentName']} (distance={min_distance:.4f}, matches={best_match['match_count']})")
        return {
            'studentId': str(best_match['studentId']),
            'studentName': str(best_match['studentName'])
        }, float(min_distance)
    
    logger.info(f"❌ No match found. Best distance was {min_distance:.4f}, threshold is {threshold}")
    return None, float(min_distance)



@demo_session_bp.route("/api/demo/recognize", methods=["POST"])
def demo_recognize_optimized():
    """OPTIMIZED face recognition endpoint using preloaded models"""
    start_time = time.time()

    # Get model manager from Flask config
    model_manager = current_app.config.get("MODEL_MANAGER")
    if not model_manager or not model_manager.is_ready():
        logger.error("Models not ready")
        return jsonify({
            "success": False, 
            "error": "Face recognition models not initialized"
        }), 503

    # Get preloaded detector
    detector = model_manager.get_detector()

    data = request.get_json()
    db = current_app.config.get("DB")
    students_col = db.students
    # Lower threshold for better matching - ArcFace is very accurate so we can be more lenient
    threshold = 0.55  # Lowered from 0.70 to improve recognition accuracy
    logger.info(f"Recognition threshold: {threshold}")

    image_b64 = data.get("image", "")
    if image_b64.startswith("data:"):
        image_b64 = image_b64.split(",", 1)[1]

    try:
        # Optimized image processing
        rgb = read_image_from_bytes_optimized(base64.b64decode(image_b64))
    except Exception as e:
        logger.error(f"Image processing error: {e}")
        return jsonify({"success": False, "error": "Invalid base64 image"}), 400

    # Face detection with timing
    detection_start = time.time()
    faces = detect_faces_rgb_optimized(rgb, detector)
    detection_time = time.time() - detection_start

    if len(faces) == 0:
        return jsonify({
            "success": True, 
            "faces": [],
            "processing_time": round(time.time() - start_time, 3),
            "detection_time": round(detection_time, 3)
        })

    results = []

    # Process each detected face
    for f in faces:
        face_data_start = time.time()
        face_data = extract_face_data_optimized(f["face"])
        face_data_time = time.time() - face_data_start

        if face_data is None:
            results.append({
                "match": None, 
                "distance": None, 
                "box": f["box"],
                "error": "Failed to extract face data"
            })
            continue

        # Search for best match with timing
        search_start = time.time()
        best_match, min_distance = find_best_match_optimized(face_data, students_col, threshold)
        search_time = time.time() - search_start

        if best_match:
            # Convert distance to safe value for JSON (avoid Infinity)
            safe_distance = None if min_distance == float('inf') else round(float(min_distance), 4)
            safe_confidence = round((1 - min_distance) * 100, 1) if min_distance < 1 else 0
            
            results.append({
                "match": {
                    "user_id": best_match["studentId"], 
                    "name": best_match["studentName"]
                },
                "distance": safe_distance,
                "confidence": safe_confidence,
                "box": f["box"],
                "timing": {
                    "face_data": round(face_data_time, 3),
                    "search": round(search_time, 3)
                }
            })
        else:
            # For unknown faces, set distance to None instead of infinity
            safe_distance = None if min_distance == float('inf') else round(float(min_distance), 4)
            
            results.append({
                "match": None, 
                "distance": safe_distance, 
                "box": f["box"],
                "timing": {
                    "face_data": round(face_data_time, 3),
                    "search": round(search_time, 3)
                }
            })

    total_time = time.time() - start_time

    return jsonify({
        "success": True, 
        "faces": results, 
        "processing_time": round(total_time, 3),
        "detailed_timing": {
            "detection": round(detection_time, 3),
            "total": round(total_time, 3)
        },
        "performance_info": {
            "models_preloaded": True,
            "cache_enabled": True
        }
    })

@demo_session_bp.route('/api/demo/session', methods=['POST'])
def create_demo_session():
    """Create a new demo session"""
    db = current_app.config.get("DB")
    demo_sessions_col = db.demo_sessions

    session_data = {
        "session_id": f"demo_{int(time.time())}",
        "started_at": time.time(),
        "status": "active",
        "recognitions": []
    }

    result = demo_sessions_col.insert_one(session_data)
    session_data['_id'] = str(result.inserted_id)

    return jsonify({
        "success": True,
        "session": session_data
    })

@demo_session_bp.route('/api/demo/session/<session_id>/log', methods=['POST'])
def log_recognition(session_id):
    """Log recognition result to session"""
    db = current_app.config.get("DB")
    demo_sessions_col = db.demo_sessions

    data = request.get_json()
    recognition_log = {
        "timestamp": time.time(),
        "result": data.get('result'),
        "confidence": data.get('confidence'),
        "processing_time": data.get('processing_time')
    }

    demo_sessions_col.update_one(
        {"session_id": session_id},
        {"$push": {"recognitions": recognition_log}}
    )

    return jsonify({"success": True, "message": "Recognition logged"})

@demo_session_bp.route('/api/demo/models/status', methods=['GET'])
def model_status():
    """Check model status endpoint"""
    model_manager = current_app.config.get("MODEL_MANAGER")

    if not model_manager:
        return jsonify({
            "success": False,
            "error": "Model manager not available"
        }), 500

    return jsonify({
        "success": True,
        "models_ready": model_manager.is_ready(),
        "health_check": model_manager.health_check(),
        "timestamp": time.time()
    })