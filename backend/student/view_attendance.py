from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import time

attendance_bp = Blueprint("attendance", __name__)

# ------------------------- GET ATTENDANCE -------------------------
# ------------------------- GET ATTENDANCE -------------------------
@attendance_bp.route('/api/attendance', methods=['GET'])
def get_attendance():
    db = current_app.config.get("DB")
    attendance_col = db.attendance_records
    students_col = db.students

    date = request.args.get('date')
    student_id = request.args.get('student_id')
    
    # Optional filters
    department = request.args.get('department')
    year = request.args.get('year')
    division = request.args.get('division')
    subject = request.args.get('subject')

    try:
        # 1. Build Query for Attendance Records
        # We are looking for individual records now
        query = {}
        if date: 
            query["date"] = date
        if student_id:
            query["studentId"] = student_id
        if subject:
            query["sessionName"] = subject  # Assuming sessionName maps to subject

        # Fetch actual attendance records
        # If student_id is provided, we get their records, otherwise everything
        attendance_records = list(attendance_col.find(query).sort([("date", -1), ("time", -1)]))
        
        # 2. Build Response List
        attendance_list = []
        
        # If we have specific records, map them
        for record in attendance_records:
            # If department/year/division filters exist, we might need to verify user matches
            # But typically if searching by student_id, that's enough.
            
            attendance_list.append({
                "studentId": record.get("studentId"),
                "studentName": record.get("studentName"),
                "date": record.get("date"),
                "subject": record.get("sessionName"),
                "status": "present", # If record exists, they are present
                "markedAt": record.get("time"),
                "period": record.get("period"),
                "duration_minutes": record.get("duration_minutes", 0),
                "first_seen": record.get("first_seen").strftime('%I:%M:%S %p') if isinstance(record.get("first_seen"), datetime) else record.get("first_seen"),
                "last_seen": record.get("last_seen").strftime('%I:%M:%S %p') if isinstance(record.get("last_seen"), datetime) else record.get("last_seen")
            })

        # 3. Handle "Absent" logic?
        # If the user wants to see "Absent" for days they didn't attend, 
        # we need a list of ALL expected days/classes. 
        # But 'view_attendance' usually just lists history.
        
        # If the frontend expects a list of *all* students with status (for a teacher view),
        # this logic was trying to do that (Roster vs Attendance).
        # But for "Student Login", they just want to see THEIR attendance.
        
        if student_id:
            # For a specific student, just return their records found.
            pass
        else:
            # If no student_id, maybe we need roster merging (for Teacher View?)
            # But the route name /api/attendance implies general fetch.
            # Let's keep it simple for now: valid records = present.
            pass

        # Calculate stats for the response
        total_classes = 0 # Difficult to know total without schedule
        present_count = len(attendance_list)
        
        return jsonify({
            "success": True,
            "attendance": attendance_list,
            "stats": {
                "presentToday": present_count,
                # "attendanceRate": ... 
            }
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ------------------------- EXPORT TO EXCEL -------------------------
@attendance_bp.route('/api/attendance/export', methods=['GET'])
def export_attendance():
    db = current_app.config.get("DB")
    attendance_col = db.attendance_records
    students_col = db.students

    date = request.args.get('date')
    department = request.args.get('department')
    year = request.args.get('year')
    division = request.args.get('division')
    subject = request.args.get('subject')

    try:
        # Get attendance doc
        query = {}
        if date: query["date"] = date
        if department: query["department"] = department
        if year: query["year"] = year
        if division: query["division"] = division
        if subject: query["subject"] = subject

        attendance_doc = attendance_col.find_one(query)
        present_students = set()

        if attendance_doc:
            for student in attendance_doc.get("students", []):
                present_students.add(student.get("student_id"))

        # Get all students in that class
        student_filter = {}
        if department: student_filter["department"] = department
        if year: student_filter["year"] = year
        if division: student_filter["division"] = division

        students = list(students_col.find(student_filter))
        export_data = []

        for student in students:
            sid = student.get("studentId") or student.get("student_id")
            name = student.get("studentName") or student.get("student_name")
            
            # Check if student was present and get their attendance record
            attendance_record = None
            if attendance_doc:
                for s in attendance_doc.get("students", []):
                    if s.get("student_id") == sid:
                        attendance_record = s
                        break
            
            # Also check attendance_records collection for duration data
            duration_record = None
            if sid:
                duration_record = attendance_col.find_one({
                    'studentId': sid,
                    'date': date,
                    'sessionName': subject  # Assuming subject is used as session name
                })
            
            status = "present" if sid in present_students else "absent"
            
            # Extract duration information
            duration_seconds = 0
            duration_minutes = 0
            first_seen = "N/A"
            last_seen = "N/A"
            
            if duration_record:
                duration_seconds = duration_record.get('duration_seconds', 0)
                duration_minutes = duration_record.get('duration_minutes', 0)
                
                # Format timestamps
                if 'first_seen' in duration_record:
                    fs = duration_record['first_seen']
                    first_seen = fs.strftime('%H:%M:%S') if isinstance(fs, datetime) else str(fs)
                
                if 'last_seen' in duration_record:
                    ls = duration_record['last_seen']
                    last_seen = ls.strftime('%H:%M:%S') if isinstance(ls, datetime) else str(ls)
            
            export_data.append({
                "studentId": str(sid) if sid is not None else "",
                "name": name,
                "subject": str(subject) if subject else "N/A",
                "date": str(date) if date else "N/A",
                "status": status,
                "first_seen": first_seen,
                "last_seen": last_seen,
                "duration_minutes": duration_minutes,
                "duration_seconds": duration_seconds
            })

        return jsonify({"success": True, "data": export_data})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500