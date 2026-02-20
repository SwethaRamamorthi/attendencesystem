from flask import Blueprint, request, jsonify, current_app
import logging
from bson.objectid import ObjectId

logger = logging.getLogger(__name__)

faces_bp = Blueprint("faces", __name__)

@faces_bp.route('/api/students/faces', methods=['GET'])
def get_all_registered_faces():
    """
    Retrieve all registered students with their basic information.
    Face data is excluded for security reasons.
    """
    try:
        db = current_app.config.get("DB")
        students_col = db.students
        
        # Query parameters for filtering
        department = request.args.get('department')
        year = request.args.get('year')
        division = request.args.get('division')
        search = request.args.get('search')
        # Build query - allow all students (even pending)
        query = {}
        
        if department:
            query["department"] = department
        if year:
            query["year"] = year
        if division:
            query["division"] = division
            
        if search:
            # Search by name or student ID
            query["$or"] = [
                {"studentName": {"$regex": search, "$options": "i"}},
                {"studentId": {"$regex": search, "$options": "i"}}
            ]
        
        # REMOVED strict face_registered=True check to allow admin-created students to appear
        # We will filter them in frontend or show them with a warning
        if "face_registered" in query:
            del query["face_registered"]
        
        # Fetch students, excluding face data
        students = list(students_col.find(
            query,
            {
                "face_data": 0  # Exclude face data for security
            }
        ))
        
        # Convert ObjectId to string
        for student in students:
            student['_id'] = str(student['_id'])
        
        logger.info(f"Retrieved {len(students)} registered faces")
        
        return jsonify({
            "success": True,
            "count": len(students),
            "students": students
        })
        
    except Exception as e:
        logger.error(f"Error fetching registered faces: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to retrieve registered faces"
        }), 500

@faces_bp.route('/api/students/faces/<student_id>', methods=['GET'])
def get_student_details(student_id):
    """
    Retrieve specific student details by student ID.
    """
    try:
        db = current_app.config.get("DB")
        students_col = db.students
        
        student = students_col.find_one(
            {"studentId": student_id},
            {"face_data": 0}  # Exclude face data
        )
        
        if not student:
            return jsonify({
                "success": False,
                "error": "Student not found"
            }), 404
        
        student['_id'] = str(student['_id'])
        
        return jsonify({
            "success": True,
            "student": student
        })
        
    except Exception as e:
        logger.error(f"Error fetching student details: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to retrieve student details"
        }), 500

@faces_bp.route('/api/students/faces/<student_id>', methods=['DELETE'])
def delete_registered_face(student_id):
    """
    Delete a registered student by student ID.
    This should be protected with authentication in production.
    """
    try:
        db = current_app.config.get("DB")
        students_col = db.students
        
        result = students_col.delete_one({"studentId": student_id})
        
        if result.deleted_count == 0:
            return jsonify({
                "success": False,
                "error": "Student not found"
            }), 404
        
        logger.info(f"Deleted student: {student_id}")
        
        return jsonify({
            "success": True,
            "message": "Student deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting student: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to delete student"
        }), 500

@faces_bp.route('/api/students/stats', methods=['GET'])
def get_student_stats():
    """
    Get statistics about registered students.
    """
    try:
        db = current_app.config.get("DB")
        students_col = db.students
        
        # Get total count
        total_count = students_col.count_documents({"face_registered": True})
        
        # Get counts by department
        departments = students_col.aggregate([
            {"$match": {"face_registered": True}},
            {"$group": {
                "_id": "$department",
                "count": {"$sum": 1}
            }}
        ])
        
        department_stats = {dept["_id"]: dept["count"] for dept in departments}
        
        # Get counts by year
        years = students_col.aggregate([
            {"$match": {"face_registered": True}},
            {"$group": {
                "_id": "$year",
                "count": {"$sum": 1}
            }}
        ])
        
        year_stats = {year["_id"]: year["count"] for year in years}
        
        return jsonify({
            "success": True,
            "stats": {
                "total": total_count,
                "by_department": department_stats,
                "by_year": year_stats
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching student stats: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to retrieve statistics"
        }), 500
