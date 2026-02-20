from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, time
import logging

logger = logging.getLogger(__name__)

timetable_lookup_bp = Blueprint('timetable_lookup', __name__)

def get_day_of_week():
    """Get current day of week as string"""
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return days[datetime.now().weekday()]

def get_period_from_time(current_time):
    """
    Calculate period number from current time.
    Returns period number (1-7) or None if outside class hours.
    
    Period Schedule:
    P1: 09:00 - 09:50
    P2: 10:00 - 10:50
    P3: 11:00 - 11:50
    P4: 12:00 - 12:50
    Lunch: 13:00 - 14:00
    P5: 14:00 - 14:50
    P6: 15:00 - 15:50
    P7: 16:00 - 16:50
    """
    hour = current_time.hour
    minute = current_time.minute
    total_minutes = hour * 60 + minute
    
    # Period time ranges (in minutes from midnight)
    period_map = {
        1: (540, 590),   # 9:00 - 9:50
        2: (600, 650),   # 10:00 - 10:50
        3: (660, 710),   # 11:00 - 11:50
        4: (720, 770),   # 12:00 - 12:50
        5: (840, 890),   # 14:00 - 14:50 (after lunch)
        6: (900, 950),   # 15:00 - 15:50
        7: (960, 1010),  # 16:00 - 16:50
    }
    
    for period_num, (start, end) in period_map.items():
        if start <= total_minutes < end:
            return str(period_num)
    
    return None

def get_current_subject_for_student(student_id, db):
    """
    Determine the current subject for a student based on their timetable.
    
    Args:
        student_id: Student ID
        db: MongoDB database instance
        
    Returns:
        dict with subject, teacher, period info or None if not in class
    """
    try:
        # Get student info to determine their class
        students_col = db.students
        student = students_col.find_one({'studentId': student_id})
        
        if not student:
            logger.warning(f"Student {student_id} not found in database")
            return None
        
        # Get class info (department, year, division)
        department = student.get('department', 'MCA')
        year = student.get('year', '3rd Year')
        division = student.get('division', 'G1')
        
        logger.info(f"Student {student_id} belongs to: {department} {year} {division}")
        
        # Get current day and period
        current_day = get_day_of_week()
        current_time = datetime.now()
        current_period = get_period_from_time(current_time)
        
        if not current_period:
            logger.info(f"Current time {current_time.strftime('%H:%M')} is not during any class period")
            return {
                'subject': 'After Hours',
                'teacher': None,
                'period': 'N/A',
                'status': 'outside_hours'
            }
        
        logger.info(f"Current: Day={current_day}, Period={current_period}")
        
        # Query timetable
        timetables_col = db.timetables
        timetable = timetables_col.find_one({
            'department': department,
            'year': year,
            'division': division
        })
        
        if not timetable:
            logger.warning(f"No timetable found for {department} {year} {division}")
            return {
                'subject': 'General Attendance',
                'teacher': None,
                'period': current_period,
                'status': 'no_timetable'
            }
        
        # Find matching period in timetable
        periods = timetable.get('periods', [])
        for period_obj in periods:
            period_num = str(period_obj.get('period_number', ''))
            days = period_obj.get('days', [])
            
            # Check if current day and period match
            if period_num == current_period and current_day in days:
                subject = period_obj.get('subject', 'Unknown Subject')
                teacher = period_obj.get('teacher', 'Unknown Teacher')
                
                logger.info(f"✅ Found match: Period {current_period} on {current_day} = {subject} ({teacher})")
                
                return {
                    'subject': subject,
                    'teacher': teacher,
                    'period': current_period,
                    'day': current_day,
                    'status': 'active_class'
                }
        
        # No match found - it's a free period
        logger.info(f"No class scheduled for Period {current_period} on {current_day}")
        return {
            'subject': 'Free Period',
            'teacher': None,
            'period': current_period,
            'day': current_day,
            'status': 'free_period'
        }
        
    except Exception as e:
        logger.error(f"Error in get_current_subject_for_student: {e}")
        return None

@timetable_lookup_bp.route('/api/attendance/current-subject', methods=['POST'])
def get_current_subject_api():
    """
    API endpoint to get the current subject for a student.
    
    Request body:
    {
        "studentId": "MCA001",
        "timestamp": 1234567890 (optional)
    }
    
    Response:
    {
        "success": true,
        "subject": "Cloud Computing",
        "teacher": "Dr. Sankar A",
        "period": "2",
        "day": "Monday",
        "status": "active_class"
    }
    """
    try:
        data = request.get_json()
        student_id = data.get('studentId')
        
        if not student_id:
            return jsonify({
                'success': False,
                'error': 'studentId is required'
            }), 400
        
        db = current_app.config.get('DB')
        if db is None:
            return jsonify({
                'success': False,
                'error': 'Database not configured'
            }), 500
        
        # Get current subject info
        subject_info = get_current_subject_for_student(student_id, db)
        
        if not subject_info:
            return jsonify({
                'success': False,
                'error': 'Unable to determine current subject'
            }), 404
        
        return jsonify({
            'success': True,
            **subject_info
        })
        
    except Exception as e:
        logger.error(f"Error in get_current_subject_api: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
