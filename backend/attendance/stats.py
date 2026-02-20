from flask import Blueprint, jsonify, current_app, request
from datetime import datetime, timedelta

attendance_stats_bp = Blueprint("attendance_stats", __name__)

@attendance_stats_bp.route('/api/attendance/stats/period-wise', methods=['GET'])
def get_period_wise_stats():
    """
    Get attendance statistics grouped by period/subject.
    Returns total students, present count, and percentage for each subject.
    """
    db = current_app.config.get("DB")
    attendance_col = db.attendance_records
    students_col = db.students
    timetable_col = db.timetables
    
    try:
        # Get query parameters
        department = request.args.get('department')
        year = request.args.get('year')
        division = request.args.get('division')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = {}
        if date_from and date_to:
            query['date'] = {'$gte': date_from, '$lte': date_to}
        elif not date_from and not date_to:
            # Default to last 30 days
            today = datetime.now()
            thirty_days_ago = (today - timedelta(days=30)).strftime('%Y-%m-%d')
            query['date'] = {'$gte': thirty_days_ago}
        
        # Get all attendance records
        attendance_records = list(attendance_col.find(query))
        
        # We need to know accurate totals for each session.
        # A session is defined by (date, sessionName, department, year, division)
        # However, attendance_records might not have dept/year/div. 
        # We'll need to fetch student details for each record to know their class.
        
        # Batch fetch students for the found records
        student_ids = list(set(r.get('studentId') for r in attendance_records if r.get('studentId')))
        student_details = {s['studentId']: s for s in students_col.find({'studentId': {'$in': student_ids}})}
        
        # Group records by subject
        # We'll also track unique sessions (date, department, year, division) per subject
        subject_stats = {}
        
        for record in attendance_records:
            subject = record.get('sessionName', 'Unknown')
            student_id = record.get('studentId')
            student = student_details.get(student_id, {})
            
            # Identify the class for this record
            dept = student.get('department', 'Unknown')
            year_val = student.get('year', 'Unknown')
            div = student.get('division', 'Unknown')
            date = record.get('date')
            
            # Filtering: If query params provided, skip records not matching
            if department and dept != department: continue
            if year and str(year_val) != str(year): continue
            if division and div != division: continue
            
            if subject not in subject_stats:
                subject_stats[subject] = {
                    'subject': subject,
                    'total_present': 0,
                    'unique_sessions': set(), # (date, dept, year, div)
                    'unique_students': set()
                }
            
            subject_stats[subject]['total_present'] += 1
            subject_stats[subject]['unique_students'].add(student_id)
            subject_stats[subject]['unique_sessions'].add((date, dept, year_val, div))

        # Get timetable for labels
        timetable_query = {}
        if department: timetable_query['department'] = department
        if year: timetable_query['year'] = year
        if division: timetable_query['division'] = division
        
        timetables = list(timetable_col.find(timetable_query))
        subj_to_teacher = {}
        subj_to_class_count = {}
        
        for tt in timetables:
            d, y, dv = tt.get('department'), tt.get('year'), tt.get('division')
            # Count students in this specific class
            count = students_col.count_documents({'department': d, 'year': y, 'division': dv})
            
            for p in tt.get('periods', []):
                s = p.get('subject')
                t = p.get('teacher', 'N/A')
                subj_to_teacher[s] = t
                # Build a map of how many students are expected for this subject in this class
                if s not in subj_to_class_count:
                    subj_to_class_count[s] = {}
                subj_to_class_count[s][(d, y, dv)] = count

        # Calculate percentages
        result = []
        for subject, stats in subject_stats.items():
            total_expected = 0
            for session in stats['unique_sessions']:
                # session is (date, dept, year, div)
                class_key = session[1:] # (dept, year, div)
                
                # Try to get count from our pre-calculated map
                count = subj_to_class_count.get(subject, {}).get(class_key)
                if count is None:
                    # Fallback counts if not in provided timetable filter
                    count = students_col.count_documents({
                        'department': class_key[0], 
                        'year': class_key[1], 
                        'division': class_key[2]
                    })
                total_expected += count
            
            attendance_percentage = (stats['total_present'] / total_expected * 100) if total_expected > 0 else 0
            
            result.append({
                'subject': subject,
                'teacher': subj_to_teacher.get(subject, 'N/A'),
                'total_present': stats['total_present'],
                'total_expected': total_expected,
                'unique_students': len(stats['unique_students']),
                'attendance_percentage': round(attendance_percentage, 1),
                'session_count': len(stats['unique_sessions'])
            })
        
        result.sort(key=lambda x: x['subject'])
        
        return jsonify({
            'success': True,
            'stats': result
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
