"""
student/portal.py — Student portal API routes.
Provides profile and attendance data strictly scoped to the logged-in student.
Does NOT touch face recognition, attendance marking, or any other logic.
"""
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import logging

student_portal_bp = Blueprint("student_portal", __name__)
logger = logging.getLogger(__name__)


def _get_student_from_headers():
    """Extract and validate student identity from request headers."""
    email = request.headers.get('X-User-Email', '').strip()
    user_type = request.headers.get('X-User-Type', '').strip()
    student_id = request.headers.get('X-Student-Id', '').strip()
    return email, user_type, student_id


# ─────────────────────────────────────────────
#  GET STUDENT PROFILE
# ─────────────────────────────────────────────
@student_portal_bp.route('/api/student/profile', methods=['GET'])
def student_get_profile():
    """Return the logged-in student's own profile. Strictly scoped by email."""
    email, user_type, student_id = _get_student_from_headers()

    if not email:
        return jsonify({"success": False, "error": "Authentication required"}), 401

    db = current_app.config.get("DB")

    try:
        student = db.students.find_one(
            {'email': email},
            {'face_embedding': 0, 'password': 0, 'parent_password': 0}  # exclude sensitive fields
        )

        if not student:
            return jsonify({"success": False, "error": "Student profile not found"}), 404

        student['_id'] = str(student['_id'])

        return jsonify({"success": True, "student": student})

    except Exception as e:
        logger.error(f"student_get_profile error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────
#  GET STUDENT ATTENDANCE (self only)
# ─────────────────────────────────────────────
@student_portal_bp.route('/api/student/attendance', methods=['GET'])
def student_get_attendance():
    """Return attendance records strictly for the logged-in student."""
    email, user_type, student_id = _get_student_from_headers()

    if not email:
        return jsonify({"success": False, "error": "Authentication required"}), 401

    db = current_app.config.get("DB")

    try:
        # Resolve studentId from the students collection using email
        student = db.students.find_one({'email': email}, {'studentId': 1})
        if not student:
            return jsonify({"success": False, "error": "Student not found"}), 404

        resolved_id = student.get('studentId', '')
        if not resolved_id:
            return jsonify({"success": True, "attendance": [], "total": 0})

        # Optional filters from query params
        subject = request.args.get('subject', '').strip()

        query = {'studentId': resolved_id}
        if subject:
            query['subject'] = subject

        records = list(
            db.attendance_records.find(query, {'_id': 0}).sort([("date", -1), ("time", -1)])
        )

        # Serialize datetime fields
        for r in records:
            for key in ('first_seen', 'last_seen'):
                if isinstance(r.get(key), datetime):
                    r[key] = r[key].strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({"success": True, "attendance": records, "total": len(records)})

    except Exception as e:
        logger.error(f"student_get_attendance error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
