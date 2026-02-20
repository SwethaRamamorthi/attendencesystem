from flask import Blueprint, request, jsonify, current_app, send_file
from flask_bcrypt import Bcrypt
from datetime import datetime
from bson import ObjectId
import csv
import io
import time
import logging
import secrets
import string

admin_bp = Blueprint("admin", __name__)
bcrypt = Bcrypt()
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────
def _serialize(doc):
    """Convert MongoDB doc to JSON-safe dict."""
    doc['_id'] = str(doc['_id'])
    for k, v in doc.items():
        if isinstance(v, datetime):
            doc[k] = v.strftime('%Y-%m-%d %H:%M:%S')
    return doc


def _generate_password(length=12):
    chars = string.ascii_letters + string.digits + "!@#$"
    return ''.join(secrets.choice(chars) for _ in range(length))


# ═══════════════════════════════════════════════════════════
#  EXISTING ROUTES (untouched)
# ═══════════════════════════════════════════════════════════

@admin_bp.route('/api/admin/students', methods=['GET'])
def admin_get_students():
    """Return all registered students (admin only)."""
    db = current_app.config.get("DB")
    try:
        students = list(db.students.find({}, {'face_embedding': 0}))
        result = [_serialize(s) for s in students]
        return jsonify({"success": True, "students": result, "total": len(result)})
    except Exception as e:
        logger.error(f"admin_get_students error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route('/api/admin/attendance', methods=['GET'])
def admin_get_attendance():
    """Return all attendance records with optional filters."""
    db = current_app.config.get("DB")
    date       = request.args.get('date')
    student_id = request.args.get('student_id')
    subject    = request.args.get('subject')

    try:
        query = {}
        if date:       query['date']        = date
        if student_id: query['studentId']   = student_id
        if subject:    query['sessionName'] = subject

        records = list(db.attendance_records.find(query).sort([("date", -1), ("time", -1)]))
        result = []
        for r in records:
            r['_id'] = str(r['_id'])
            for key in ('first_seen', 'last_seen'):
                if isinstance(r.get(key), datetime):
                    r[key] = r[key].strftime('%Y-%m-%d %H:%M:%S')
            result.append(r)
        return jsonify({"success": True, "attendance": result, "total": len(result)})
    except Exception as e:
        logger.error(f"admin_get_attendance error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route('/api/admin/stats', methods=['GET'])
def admin_get_stats():
    """Aggregate statistics for admin dashboard."""
    db = current_app.config.get("DB")
    try:
        total_students  = db.students.count_documents({})
        total_sessions  = db.attendance_records.count_documents({})
        unique_dates    = len(db.attendance_records.distinct('date'))
        unique_subjects = db.attendance_records.distinct('sessionName')
        total_teachers  = db.auth_teachers.count_documents({})

        return jsonify({
            "success": True,
            "stats": {
                "totalStudents":  total_students,
                "totalTeachers":  total_teachers,
                "totalSessions":  total_sessions,
                "uniqueDates":    unique_dates,
                "uniqueSubjects": unique_subjects,
            }
        })
    except Exception as e:
        logger.error(f"admin_get_stats error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route('/api/admin/attendance/export/csv', methods=['GET'])
def admin_export_csv():
    """Download attendance as CSV."""
    db = current_app.config.get("DB")
    date       = request.args.get('date')
    student_id = request.args.get('student_id')
    subject    = request.args.get('subject')

    try:
        query = {}
        if date:       query['date']        = date
        if student_id: query['studentId']   = student_id
        if subject:    query['sessionName'] = subject

        records = list(db.attendance_records.find(query).sort([("date", -1)]))
        output = io.StringIO()
        fieldnames = ['Student ID', 'Student Name', 'Date', 'Subject',
                      'First Seen', 'Last Seen', 'Duration (min)', 'Period']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for r in records:
            first_seen = r.get('first_seen', 'N/A')
            last_seen  = r.get('last_seen',  'N/A')
            if isinstance(first_seen, datetime): first_seen = first_seen.strftime('%H:%M:%S')
            if isinstance(last_seen,  datetime): last_seen  = last_seen.strftime('%H:%M:%S')
            writer.writerow({
                'Student ID':     r.get('studentId', ''),
                'Student Name':   r.get('studentName', ''),
                'Date':           r.get('date', ''),
                'Subject':        r.get('sessionName', ''),
                'First Seen':     first_seen,
                'Last Seen':      last_seen,
                'Duration (min)': r.get('duration_minutes', 0),
                'Period':         r.get('period', ''),
            })

        output.seek(0)
        filename = f"admin_attendance_{date or 'all'}_{subject or 'all'}.csv"
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        logger.error(f"admin_export_csv error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ═══════════════════════════════════════════════════════════
#  NEW: USER MANAGEMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════

# ─────────────────────────────────────────────
#  CREATE STUDENT  (+ optional parent creds)
# ─────────────────────────────────────────────
@admin_bp.route('/api/admin/users/student', methods=['POST'])
def admin_create_student():
    """Admin creates a new student record, optionally with parent credentials."""
    db   = current_app.config.get("DB")
    data = request.get_json()

    student_name = data.get('studentName', '').strip()
    student_id   = data.get('studentId',   '').strip()
    department   = data.get('department',  '').strip()
    year         = data.get('year',        '').strip()
    division     = data.get('division',    '').strip()
    email        = data.get('email',       '').strip()
    parent_email = data.get('parentEmail', '').strip()
    parent_pass  = data.get('parentPassword', '').strip()

    if not student_name or not student_id or not email:
        return jsonify({"success": False, "error": "Student name, ID, and email are required"}), 400

    # Duplicate check
    if db.students.find_one({'studentId': student_id}):
        return jsonify({"success": False, "error": f"Student ID '{student_id}' already exists"}), 400
    
    if db.students.find_one({'email': email}):
        return jsonify({"success": False, "error": f"Email '{email}' is already registered"}), 400

    doc = {
        "studentId":   student_id,
        "studentName": student_name,
        "department":  department,
        "year":        year,
        "division":    division,
        "email":       email,
        "status":      "active",
        "face_registered": False,
        "created_by":  "admin",
        "created_at":  time.time(),
    }

    # Attach parent credentials if provided
    if parent_email:
        if db.students.find_one({'parent_email': parent_email}):
            return jsonify({"success": False, "error": f"Parent email '{parent_email}' already linked to another student"}), 400
        raw_pass = parent_pass or _generate_password()
        doc['parent_email']    = parent_email
        doc['parent_password'] = bcrypt.generate_password_hash(raw_pass).decode('utf-8')
        doc['_parent_pass_plain'] = raw_pass   # returned once, not stored permanently

    # Attach student login credentials if provided
    login_password = data.get('loginPassword', '').strip()
    if login_password:
        doc['password'] = bcrypt.generate_password_hash(login_password).decode('utf-8')
        doc['role'] = 'student'

    result = db.students.insert_one(doc)

    response = {
        "success": True,
        "message": f"Student '{student_name}' created successfully",
        "studentId": student_id,
    }
    if parent_email:
        response['parentEmail']    = parent_email
        response['parentPassword'] = doc.get('_parent_pass_plain', '')

    # Remove plain password from DB doc (it was only for response)
    db.students.update_one({'_id': result.inserted_id}, {'$unset': {'_parent_pass_plain': ''}})

    return jsonify(response), 201


# ─────────────────────────────────────────────
#  SET / RESET STUDENT LOGIN PASSWORD
# ─────────────────────────────────────────────
@admin_bp.route('/api/admin/student/set-password', methods=['POST'])
def admin_set_student_password():
    """Admin sets or resets a student's portal login password."""
    db   = current_app.config.get("DB")
    data = request.get_json()

    student_id = data.get('studentId', '').strip()
    new_password = data.get('password', '').strip()

    if not student_id or not new_password:
        return jsonify({"success": False, "error": "studentId and password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400

    student = db.students.find_one({'studentId': student_id})
    if not student:
        return jsonify({"success": False, "error": f"Student '{student_id}' not found"}), 404

    hashed = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.students.update_one(
        {'studentId': student_id},
        {'$set': {'password': hashed, 'role': 'student'}}
    )

    return jsonify({
        "success": True,
        "message": f"Login password set for student {student_id}"
    })


# ─────────────────────────────────────────────
#  CREATE TEACHER
# ─────────────────────────────────────────────
@admin_bp.route('/api/admin/users/teacher', methods=['POST'])
def admin_create_teacher():
    """Admin creates a new teacher account."""
    db   = current_app.config.get("DB")
    data = request.get_json()

    username    = data.get('username',   '').strip()
    email       = data.get('email',      '').strip()
    password    = data.get('password',   '').strip()
    employee_id = data.get('employeeId', '').strip()
    department  = data.get('department', '').strip()
    subjects    = data.get('subjects',   [])   # list of strings

    if not all([username, email, password]):
        return jsonify({"success": False, "error": "Name, email and password are required"}), 400

    if db.auth_teachers.find_one({'email': email}):
        return jsonify({"success": False, "error": f"Teacher email '{email}' already registered"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')

    doc = {
        "username":   username,
        "email":      email,
        "password":   hashed_pw,
        "employeeId": employee_id,
        "department": department,
        "subjects":   subjects if isinstance(subjects, list) else [s.strip() for s in subjects.split(',')],
        "userType":   "teacher",
        "role":       "teacher",
        "status":     "active",
        "created_by": "admin",
        "created_at": time.time(),
    }

    db.auth_teachers.insert_one(doc)
    return jsonify({"success": True, "message": f"Teacher '{username}' created successfully"}), 201


# ─────────────────────────────────────────────
#  CREATE / LINK PARENT
# ─────────────────────────────────────────────
@admin_bp.route('/api/admin/users/parent', methods=['POST'])
def admin_create_parent():
    """Admin links parent credentials to an existing student."""
    db   = current_app.config.get("DB")
    data = request.get_json()

    student_id   = data.get('studentId',   '').strip()
    parent_email = data.get('parentEmail', '').strip()
    parent_pass  = data.get('parentPassword', '').strip()

    if not student_id or not parent_email:
        return jsonify({"success": False, "error": "Student ID and parent email are required"}), 400

    student = db.students.find_one({'studentId': student_id})
    if not student:
        return jsonify({"success": False, "error": f"No student found with ID '{student_id}'"}), 404

    # Check uniqueness
    existing = db.students.find_one({'parent_email': parent_email})
    if existing and str(existing['_id']) != str(student['_id']):
        return jsonify({"success": False, "error": f"Parent email '{parent_email}' already linked to another student"}), 400

    raw_pass  = parent_pass or _generate_password()
    hashed_pw = bcrypt.generate_password_hash(raw_pass).decode('utf-8')

    db.students.update_one(
        {'_id': student['_id']},
        {'$set': {
            'parent_email':    parent_email,
            'parent_password': hashed_pw,
        }}
    )

    return jsonify({
        "success":        True,
        "message":        f"Parent linked to {student.get('studentName', student_id)}",
        "parentEmail":    parent_email,
        "parentPassword": raw_pass,
        "studentName":    student.get('studentName', ''),
    }), 201


# ─────────────────────────────────────────────
#  LIST TEACHERS
# ─────────────────────────────────────────────
@admin_bp.route('/api/admin/users/teachers', methods=['GET'])
def admin_get_teachers():
    """List all teacher accounts."""
    db = current_app.config.get("DB")
    try:
        teachers = list(db.auth_teachers.find({}, {'password': 0}))
        result = [_serialize(t) for t in teachers]
        return jsonify({"success": True, "teachers": result, "total": len(result)})
    except Exception as e:
        logger.error(f"admin_get_teachers error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────
#  LIST PARENTS
# ─────────────────────────────────────────────
@admin_bp.route('/api/admin/users/parents', methods=['GET'])
def admin_get_parents():
    """List all students that have parent credentials set."""
    db = current_app.config.get("DB")
    try:
        students_with_parents = list(db.students.find(
            {'parent_email': {'$exists': True, '$ne': ''}},
            {'face_embedding': 0, 'parent_password': 0}
        ))
        result = [_serialize(s) for s in students_with_parents]
        return jsonify({"success": True, "parents": result, "total": len(result)})
    except Exception as e:
        logger.error(f"admin_get_parents error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────
#  DISABLE STUDENT (soft delete)
# ─────────────────────────────────────────────
@admin_bp.route('/api/admin/users/student/<student_id>/disable', methods=['PATCH'])
def admin_disable_student(student_id):
    """Soft-disable a student account."""
    db = current_app.config.get("DB")
    data   = request.get_json() or {}
    action = data.get('action', 'disable')   # 'disable' or 'enable'
    status = 'inactive' if action == 'disable' else 'active'

    result = db.students.update_one(
        {'studentId': student_id},
        {'$set': {'status': status, 'updated_at': time.time()}}
    )
    if result.matched_count == 0:
        return jsonify({"success": False, "error": f"Student '{student_id}' not found"}), 404

    return jsonify({"success": True, "message": f"Student '{student_id}' set to {status}"})


# ─────────────────────────────────────────────
#  DISABLE TEACHER (soft delete)
# ─────────────────────────────────────────────
@admin_bp.route('/api/admin/users/teacher/<teacher_id>/disable', methods=['PATCH'])
def admin_disable_teacher(teacher_id):
    """Soft-disable a teacher account by ObjectId or email."""
    db = current_app.config.get("DB")
    data   = request.get_json() or {}
    action = data.get('action', 'disable')
    status = 'inactive' if action == 'disable' else 'active'

    # Try by ObjectId first, then by email
    query = {}
    try:
        query = {'_id': ObjectId(teacher_id)}
    except Exception:
        query = {'email': teacher_id}

    result = db.auth_teachers.update_one(
        query,
        {'$set': {'status': status, 'updated_at': time.time()}}
    )
    if result.matched_count == 0:
        return jsonify({"success": False, "error": f"Teacher '{teacher_id}' not found"}), 404

    return jsonify({"success": True, "message": f"Teacher set to {status}"})


# ─────────────────────────────────────────────
#  RESET PASSWORD
# ─────────────────────────────────────────────
@admin_bp.route('/api/admin/users/reset-password', methods=['PATCH'])
def admin_reset_password():
    """Reset password for any user type."""
    db   = current_app.config.get("DB")
    data = request.get_json()

    user_type    = data.get('userType', 'student')   # teacher | student | parent | admin
    identifier   = data.get('identifier', '').strip() # email or studentId
    new_password = data.get('newPassword', '').strip()

    if not identifier or not new_password:
        return jsonify({"success": False, "error": "Identifier and new password are required"}), 400

    hashed_pw = bcrypt.generate_password_hash(new_password).decode('utf-8')

    if user_type == 'teacher':
        result = db.auth_teachers.update_one({'email': identifier}, {'$set': {'password': hashed_pw}})
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "Teacher not found"}), 404

    elif user_type == 'admin':
        result = db.auth_admins.update_one({'email': identifier}, {'$set': {'password': hashed_pw}})
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "Admin not found"}), 404

    elif user_type == 'parent':
        # identifier = parent email stored in students collection
        result = db.students.update_one(
            {'parent_email': identifier},
            {'$set': {'parent_password': hashed_pw}}
        )
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "Parent email not found"}), 404

    else:
        # student – reset auth_users password
        result = db.auth_users.update_one({'email': identifier}, {'$set': {'password': hashed_pw}})
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "Student account not found"}), 404

    return jsonify({"success": True, "message": f"{user_type.capitalize()} password reset successfully"})
