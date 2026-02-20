# app.py - OPTIMIZED VERSION
import os
import time
import logging
import threading
from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
import numpy as np

# Blueprint imports
from auth.routes import auth_bp

# Optional student/teacher blueprints
try:
    from student.registration import student_registration_bp
except ImportError:
    student_registration_bp = None

try:
    from student.updatedetails import student_update_bp
except ImportError:
    student_update_bp = None

try:
    from student.demo_session import demo_session_bp
except ImportError:
    demo_session_bp = None

try:
    from student.view_attendance import attendance_bp
except ImportError:
    attendance_bp = None

try:
    from teacher.attendance_records import attendance_session_bp
except ImportError:
    attendance_session_bp = None

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

# MongoDB setup
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DATABASE_NAME", "facerecognition")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "students")
THRESHOLD = float(os.getenv("THRESHOLD", "0.4"))  # Lowered from 0.6 to 0.4 for better accuracy

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
students_collection = db[COLLECTION_NAME]
attendance_collection = db["attendance_records"]

# OPTIMIZED MODEL MANAGER CLASS
class ModelManager:
    """
    Singleton class to manage face recognition models
    Ensures models are loaded only once and shared across all requests
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialize_models()
        return cls._instance

    def _initialize_models(self):
        """Initialize all face recognition models with proper error handling"""
        logger.info("🤖 Starting model initialization...")
        start_time = time.time()

        self.models_ready = False
        self.detector = None
        self.deepface_ready = False
        self.lock = threading.Lock()

        try:
            with self.lock:
                # 1. Initialize MTCNN detector
                from mtcnn import MTCNN
                logger.info("Loading MTCNN detector...")
                
                # Initialize with default parameters (MTCNN handles sensitivity internally)
                self.detector = MTCNN()
                logger.info("✅ MTCNN detector loaded successfully")

                # 2. Preload DeepFace ArcFace model
                from deepface import DeepFace
                logger.info("Warming up DeepFace ArcFace model...")

                # Force model download and initialization with dummy prediction
                dummy_img = np.zeros((112, 112, 3), dtype=np.uint8)

                # This forces the ArcFace model to be downloaded and cached
                _ = DeepFace.represent(
                    dummy_img, 
                    model_name='ArcFace', 
                    detector_backend='skip',
                    enforce_detection=False
                )

                # Additional warm-up with different image size
                dummy_img_2 = np.ones((224, 224, 3), dtype=np.uint8) * 128
                _ = DeepFace.represent(
                    dummy_img_2, 
                    model_name='ArcFace', 
                    detector_backend='skip',
                    enforce_detection=False
                )

                self.deepface_ready = True
                logger.info("✅ DeepFace ArcFace model warmed up successfully")

                self.models_ready = True

                initialization_time = time.time() - start_time
                logger.info(f"🎉 All models initialized successfully in {initialization_time:.2f} seconds")

        except Exception as e:
            logger.error(f"❌ Model initialization failed: {e}")
            self.models_ready = False
            raise e

    def get_detector(self):
        """Get the MTCNN detector instance"""
        if not self.models_ready:
            raise RuntimeError("Models not properly initialized")
        return self.detector

    def is_ready(self):
        """Check if all models are ready"""
        return self.models_ready and self.deepface_ready

    def health_check(self):
        """Perform model health check"""
        try:
            if not self.models_ready:
                return False

            # Test MTCNN
            test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
            _ = self.detector.detect_faces(test_img)

            # Test DeepFace ArcFace
            from deepface import DeepFace
            test_face = np.random.randint(0, 255, (112, 112, 3), dtype=np.uint8)
            _ = DeepFace.represent(
                test_face, 
                model_name='ArcFace',  # Changed from Facenet512
                detector_backend='skip',
                enforce_detection=False
            )

            return True

        except Exception as e:
            logger.error(f"Model health check failed: {e}")
            return False

# Initialize the model manager (singleton)
logger.info("Initializing Model Manager...")
model_manager = ModelManager()

# Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False,
     allow_headers=["Content-Type", "Authorization", "X-User-Email", "X-User-Type", "X-Student-Id", "X-Parent-Email"],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])

# Configure Flask app with database and model instances
app.config["DB"] = db
app.config["COLLECTION_NAME"] = COLLECTION_NAME
app.config["THRESHOLD"] = THRESHOLD
app.config["ATTENDANCE_COLLECTION"] = attendance_collection

# CRITICAL: Pass model manager to Flask config so blueprints can access it
app.config["MODEL_MANAGER"] = model_manager
app.config["MTCNN_DETECTOR"] = model_manager.get_detector()

bcrypt = Bcrypt(app)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify model status"""
    model_status = model_manager.is_ready()
    model_health = model_manager.health_check()

    return {
        "status": "healthy" if model_status and model_health else "unhealthy",
        "models_ready": model_status,
        "models_healthy": model_health,
        "timestamp": time.time()
    }

# Register blueprints
app.register_blueprint(auth_bp)

if student_registration_bp:
    app.register_blueprint(student_registration_bp)
    logger.info("✅ Student registration blueprint registered")

if student_update_bp:
    app.register_blueprint(student_update_bp)
    logger.info("✅ Student update blueprint registered")

if demo_session_bp:
    app.register_blueprint(demo_session_bp)
    logger.info("✅ Demo session blueprint registered")

if attendance_bp:
    app.register_blueprint(attendance_bp)
    logger.info("✅ Attendance blueprint registered")

if attendance_session_bp:
    app.register_blueprint(attendance_session_bp)
    logger.info("✅ Attendance session blueprint registered")

# Import and register timetable blueprint
try:
    from teacher.timetable import timetable_bp
    app.register_blueprint(timetable_bp)
    logger.info("✅ Timetable blueprint registered")
except ImportError as e:
    logger.warning(f"⚠️ Timetable blueprint not available: {e}")

# Import and register faces blueprint
try:
    from student.faces import faces_bp
    app.register_blueprint(faces_bp)
    logger.info("✅ Faces blueprint registered")
except ImportError as e:
    logger.warning(f"⚠️ Faces blueprint not available: {e}")

# Register attendance marking routes blueprint
try:
    from attendance.routes import attendance_marking_bp
    app.register_blueprint(attendance_marking_bp)
    logger.info("✅ Attendance marking routes blueprint registered")
except ImportError as e:
    logger.warning(f"⚠️ Attendance marking routes blueprint not available: {e}")

# Register CSV export blueprint
try:
    from student.csv_export import csv_export_bp
    app.register_blueprint(csv_export_bp)
    logger.info("✅ CSV export blueprint registered")
except ImportError as e:
    logger.warning(f"⚠️ CSV export blueprint not available: {e}")

# Register attendance stats blueprint
try:
    from attendance.stats import attendance_stats_bp
    app.register_blueprint(attendance_stats_bp)
    logger.info("✅ Attendance stats blueprint registered")
except ImportError as e:
    logger.warning(f"⚠️ Attendance stats blueprint not available: {e}")

# Register timetable lookup blueprint
try:
    from attendance.timetable_lookup import timetable_lookup_bp
    app.register_blueprint(timetable_lookup_bp)
    logger.info("✅ Timetable lookup blueprint registered")
except ImportError as e:
    logger.warning(f"⚠️ Timetable lookup blueprint not available: {e}")

# Register admin blueprint
try:
    from admin.routes import admin_bp
    app.register_blueprint(admin_bp)
    logger.info("✅ Admin blueprint registered")
except ImportError as e:
    logger.warning(f"⚠️ Admin blueprint not available: {e}")

# Register parent blueprint
try:
    from parent.routes import parent_bp
    app.register_blueprint(parent_bp)
    logger.info("✅ Parent blueprint registered")
except ImportError as e:
    logger.warning(f"⚠️ Parent blueprint not available: {e}")

# Register student portal blueprint
try:
    from student.portal import student_portal_bp
    app.register_blueprint(student_portal_bp)
    logger.info("✅ Student portal blueprint registered")
except ImportError as e:
    logger.warning(f"⚠️ Student portal blueprint not available: {e}")

# List all registered routes
logger.info("\nRegistered Flask Routes:")
for rule in app.url_map.iter_rules():
    logger.info(f"  {rule}")

if __name__ == "__main__":
    logger.info("🚀 Starting Flask server...")

    # Final model verification before starting
    if model_manager.is_ready():
        logger.info("🎯 All systems ready! Server starting on http://0.0.0.0:5000")
        app.run(host="0.0.0.0", port=5000, debug=True)  # Set debug=True for development reloads
    else:
        logger.error("❌ Cannot start server - models not ready")
        exit(1)