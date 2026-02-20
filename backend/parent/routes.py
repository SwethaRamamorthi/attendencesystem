from flask import Blueprint, request, jsonify, current_app, send_file
from flask_bcrypt import Bcrypt
from datetime import datetime
import csv
import io
import logging

parent_bp = Blueprint("parent", __name__)
bcrypt = Bcrypt()
logger = logging.getLogger(__name__)


def _get_ward(db, parent_email: str):
    """Return the student document whose parent_email matches, or None."""
    return db.students.find_one({'parent_email': parent_email})


# ─────────────────────────────────────────────
#  PARENT – WARD PROFILE
# ─────────────────────────────────────────────
@parent_bp.route('/api/parent/ward', methods=['GET'])
def parent_get_ward():
    """Return the ward's student profile for the authenticated parent."""
    parent_email = request.headers.get('X-Parent-Email')
    if not parent_email:
        return jsonify({"success": False, "error": "Authentication required"}), 401

    db = current_app.config.get("DB")
    try:
        ward = _get_ward(db, parent_email)
        if not ward:
            return jsonify({"success": False, "error": "No student linked to this parent email"}), 404

        ward['_id'] = str(ward['_id'])
        # Remove sensitive fields
        ward.pop('face_embedding', None)
        ward.pop('parent_password', None)

        return jsonify({"success": True, "ward": ward})
    except Exception as e:
        logger.error(f"parent_get_ward error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────
#  PARENT – WARD ATTENDANCE (read-only, restricted)
# ─────────────────────────────────────────────
@parent_bp.route('/api/parent/attendance', methods=['GET'])
def parent_get_attendance():
    """Return ONLY the ward's attendance records. Parents cannot query other students."""
    parent_email = request.headers.get('X-Parent-Email')
    if not parent_email:
        return jsonify({"success": False, "error": "Authentication required"}), 401

    db = current_app.config.get("DB")
    try:
        ward = _get_ward(db, parent_email)
        if not ward:
            return jsonify({"success": False, "error": "No student linked to this parent email"}), 404

        ward_student_id = ward.get('studentId') or ward.get('student_id')

        # Build query — student_id is ALWAYS forced to ward's ID (access control)
        query = {'studentId': ward_student_id}

        date    = request.args.get('date')
        subject = request.args.get('subject')
        if date:    query['date']        = date
        if subject: query['sessionName'] = subject

        attendance_col = current_app.config.get("ATTENDANCE_COLLECTION")
        if attendance_col is None:
            # Fallback if config is missing (though it shouldn't be)
            attendance_col = db.attendance_records

        records = list(attendance_col.find(query).sort([("date", -1)]))

        result = []
        for r in records:
            r['_id'] = str(r['_id'])
            for key in ('first_seen', 'last_seen'):
                if isinstance(r.get(key), datetime):
                    r[key] = r[key].strftime('%Y-%m-%d %H:%M:%S')
            result.append(r)

        # Subject-wise summary
        subject_summary = {}
        for r in result:
            subj = r.get('sessionName', 'Unknown')
            subject_summary[subj] = subject_summary.get(subj, 0) + 1

        return jsonify({
            "success": True,
            "attendance": result,
            "total": len(result),
            "subjectSummary": subject_summary,
            "wardName": ward.get('studentName', ''),
            "wardStudentId": ward_student_id,
        })
    except Exception as e:
        logger.error(f"parent_get_attendance error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────
#  PARENT – CSV EXPORT (ward only)
# ─────────────────────────────────────────────
@parent_bp.route('/api/parent/attendance/export/csv', methods=['GET'])
def parent_export_csv():
    """Download ward's attendance as CSV. Restricted to ward's data only."""
    parent_email = request.headers.get('X-Parent-Email')
    if not parent_email:
        return jsonify({"success": False, "error": "Authentication required"}), 401

    db = current_app.config.get("DB")
    try:
        ward = _get_ward(db, parent_email)
        if not ward:
            return jsonify({"success": False, "error": "No student linked to this parent email"}), 404

        ward_student_id = ward.get('studentId') or ward.get('student_id')

        query = {'studentId': ward_student_id}
        date    = request.args.get('date')
        subject = request.args.get('subject')
        if date:    query['date']        = date
        if subject: query['sessionName'] = subject

        attendance_col = current_app.config.get("ATTENDANCE_COLLECTION")
        if attendance_col is None:
            attendance_col = db.attendance_records

        records = list(attendance_col.find(query).sort([("date", -1)]))

        output = io.StringIO()
        fieldnames = [
            'Student ID', 'Student Name', 'Date', 'Subject',
            'First Seen', 'Last Seen', 'Duration (min)', 'Period'
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for r in records:
            first_seen = r.get('first_seen', 'N/A')
            last_seen  = r.get('last_seen',  'N/A')
            if isinstance(first_seen, datetime):
                first_seen = first_seen.strftime('%H:%M:%S')
            if isinstance(last_seen, datetime):
                last_seen = last_seen.strftime('%H:%M:%S')

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
        ward_name = (ward.get('studentName') or 'ward').replace(' ', '_')
        filename = f"attendance_{ward_name}_{date or 'all'}.csv"
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        logger.error(f"parent_export_csv error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
