from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

attendance_marking_bp = Blueprint('attendance_marking', __name__)
logger = logging.getLogger(__name__)

@attendance_marking_bp.route('/api/attendance/mark', methods=['POST'])
def mark_attendance():
    """
    Mark attendance for a detected student.
    Prevents duplicate entries for the same session.
    """
    try:
        data = request.get_json()
        student_id = data.get('studentId')
        student_name = data.get('studentName')
        session_name = data.get('sessionName', 'Live Detection')
        period = data.get('period', 'N/A')
        
        if not student_id:
            return jsonify({'success': False, 'error': 'Student ID required'}), 400
        
        # Get database from Flask config
        from flask import current_app
        db = current_app.config.get('DB')  # Use same DB as other modules
        attendance_col = db.attendance_records
        
        # Get today's date
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Check if attendance already marked today for this session
        existing = attendance_col.find_one({
            'studentId': student_id,
            'date': today,
            'sessionName': session_name
        })
        
        current_timestamp = datetime.now()
        current_time = current_timestamp.strftime('%H:%M:%S')
        
        if existing:
            # Update last_seen timestamp to track duration
            last_seen = current_timestamp
            first_seen = existing.get('first_seen', current_timestamp)
            
            # Calculate duration in seconds
            if isinstance(first_seen, datetime):
                duration_seconds = (last_seen - first_seen).total_seconds()
            else:
                # If first_seen is stored as timestamp (float), convert it
                try:
                    first_seen_dt = datetime.fromtimestamp(first_seen) if isinstance(first_seen, (int, float)) else first_seen
                    duration_seconds = (last_seen - first_seen_dt).total_seconds()
                except:
                    duration_seconds = 0
            
            # Update the record with last_seen and duration
            attendance_col.update_one(
                {'_id': existing['_id']},
                {
                    '$set': {
                        'last_seen': last_seen,
                        'duration_seconds': duration_seconds,
                        'duration_minutes': round(duration_seconds / 60, 2)
                    }
                }
            )
            
            logger.info(f"Updated duration for {student_name} ({student_id}): {duration_seconds}s")
            
            return jsonify({
                'success': True,
                'message': 'Attendance updated (duration tracked)',
                'duplicate': True,
                'record': {
                    'studentId': student_id,
                    'studentName': student_name,
                    'date': today,
                    'time': existing.get('time'),
                    'sessionName': session_name,
                    'duration_seconds': duration_seconds,
                    'duration_minutes': round(duration_seconds / 60, 2)
                }
            })
        
        # Create new attendance record with first_seen
        attendance_record = {
            'studentId': student_id,
            'studentName': student_name,
            'date': today,
            'time': current_time,
            'timestamp': current_timestamp.timestamp(),
            'first_seen': current_timestamp,
            'last_seen': current_timestamp,
            'duration_seconds': 0,
            'duration_minutes': 0,
            'sessionName': session_name,
            'period': period,
            'status': 'present',
            'method': 'face_recognition'
        }
        
        attendance_col.insert_one(attendance_record)
        
        logger.info(f"Attendance marked for {student_name} ({student_id}) at {current_time}")
        
        return jsonify({
            'success': True,
            'message': 'Attendance marked successfully',
            'duplicate': False,
            'record': {
                'studentId': student_id,
                'studentName': student_name,
                'date': today,
                'time': current_time,
                'sessionName': session_name,
                'duration_seconds': 0,
                'duration_minutes': 0
            }
        })
        
    except Exception as e:
        logger.error(f"Error marking attendance: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@attendance_marking_bp.route('/api/attendance/today', methods=['GET'])
def get_today_attendance():
    """Get all attendance records for today"""
    try:
        from flask import current_app
        db = current_app.config.get('DB')
        attendance_col = db.attendance_records
        
        today = datetime.now().strftime('%Y-%m-%d')
        
        records = list(attendance_col.find({'date': today}))
        
        # Convert ObjectId to string and format datetimes
        for record in records:
            record['_id'] = str(record['_id'])
            
            # Format first_seen and last_seen to local string to avoid double-timezone conversion in frontend
            if 'first_seen' in record and isinstance(record['first_seen'], datetime):
                record['first_seen'] = record['first_seen'].strftime('%I:%M:%S %p')
            elif 'first_seen' in record:
                record['first_seen'] = str(record['first_seen'])
                
            if 'last_seen' in record and isinstance(record['last_seen'], datetime):
                record['last_seen'] = record['last_seen'].strftime('%I:%M:%S %p')
            elif 'last_seen' in record:
                record['last_seen'] = str(record['last_seen'])
        
        return jsonify({
            'success': True,
            'count': len(records),
            'date': today,
            'records': records
        })
        
    except Exception as e:
        logger.error(f"Error fetching attendance: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
