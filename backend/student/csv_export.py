from flask import Blueprint, request, jsonify, current_app, send_file
from datetime import datetime
import csv
import os
import io

csv_export_bp = Blueprint("csv_export", __name__)

@csv_export_bp.route('/api/attendance/export/csv', methods=['GET'])
def export_attendance_csv():
    """
    Export attendance to CSV file with subject/teacher names from timetable.
    Saves locally and returns the file.
    """
    db = current_app.config.get("DB")
    attendance_col = db.attendance_records
    students_col = db.students
    timetable_col = db.timetables
    
    date = request.args.get('date')
    department = request.args.get('department')
    year = request.args.get('year')
    division = request.args.get('division')
    session_name = request.args.get('session', request.args.get('subject'))
    
    try:
        # Build query for attendance records
        query = {}
        if date:
            query['date'] = date
        if session_name:
            query['sessionName'] = session_name
        
        # Get attendance records
        attendance_records = list(attendance_col.find(query))
        
        # Get timetable to map subjects to teachers
        timetable_query = {}
        if department:
            timetable_query['department'] = department
        if year:
            timetable_query['year'] = year
        if division:
            timetable_query['division'] = division
        
        timetable = timetable_col.find_one(timetable_query)
        
        # Create subject -> teacher mapping
        subject_teacher_map = {}
        if timetable and 'periods' in timetable:
            for period in timetable['periods']:
                subject = period.get('subject', '')
                teacher = period.get('teacher', 'N/A')
                subject_teacher_map[subject] = teacher
        
        # Get all students for the class
        student_filter = {}
        if department:
            student_filter['department'] = department
        if year:
            student_filter['year'] = year
        if division:
            student_filter['division'] = division
        
        all_students = list(students_col.find(student_filter))
        
        # Build attendance map
        attendance_map = {}
        for record in attendance_records:
            sid = record.get('studentId')
            attendance_map[sid] = record
        
        # Prepare CSV data
        csv_data = []
        for student in all_students:
            sid = student.get('studentId') or student.get('student_id')
            name = student.get('studentName') or student.get('student_name')
            
            record = attendance_map.get(sid)
            
            if record:
                status = 'Present'
                first_seen = record.get('first_seen', 'N/A')
                last_seen = record.get('last_seen', 'N/A')
                duration_minutes = record.get('duration_minutes', 0)
                duration_seconds = record.get('duration_seconds', 0)
                session = record.get('sessionName', session_name or 'N/A')
                
                # Format timestamps
                if isinstance(first_seen, datetime):
                    first_seen = first_seen.strftime('%H:%M:%S')
                elif first_seen != 'N/A':
                    first_seen = str(first_seen)
                
                if isinstance(last_seen, datetime):
                    last_seen = last_seen.strftime('%H:%M:%S')
                elif last_seen != 'N/A':
                    last_seen = str(last_seen)
            else:
                status = 'Absent'
                first_seen = 'N/A'
                last_seen = 'N/A'
                duration_minutes = 0
                duration_seconds = 0
                session = session_name or 'N/A'
            
            # Get teacher name from timetable
            teacher = subject_teacher_map.get(session, 'N/A')
            
            csv_data.append({
                'Student ID': str(sid) if sid else '',
                'Student Name': name or '',
                'Department': department or '',
                'Year': year or '',
                'Division': division or '',
                'Subject': session,
                'Teacher': teacher,
                'Date': date or datetime.now().strftime('%Y-%m-%d'),
                'Status': status,
                'First Seen': first_seen,
                'Last Seen': last_seen,
                'Duration (minutes)': duration_minutes,
                'Duration (seconds)': duration_seconds
            })
        
        # Create CSV file
        if not os.path.exists('exports'):
            os.makedirs('exports')
        
        filename = f"attendance_{date or 'latest'}_{session_name or 'all'}.csv"
        filepath = os.path.join('exports', filename)
        
        # Write CSV
        if csv_data:
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['Student ID', 'Student Name', 'Department', 'Year', 'Division', 
                            'Subject', 'Teacher', 'Date', 'Status', 'First Seen', 'Last Seen',
                            'Duration (minutes)', 'Duration (seconds)']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(csv_data)
        
        # Return file
        return send_file(
            filepath,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
