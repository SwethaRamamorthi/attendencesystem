from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from bson.objectid import ObjectId
import logging

logger = logging.getLogger(__name__)

# Timetable Blueprint
timetable_bp = Blueprint(
    "timetable",
    __name__,
    url_prefix="/api/timetable"
)

# -------------------- CREATE TIMETABLE --------------------
@timetable_bp.route("/create", methods=["POST"])
def create_timetable():
    """Create a new timetable for a class. Each period can include: subject, teacher, start_time, end_time, days"""
    data = request.get_json()
    db = current_app.config.get("DB")
    timetable_col = db.timetables
    
    # Validate required fields
    required_fields = ["department", "year", "division", "periods"]
    for field in required_fields:
        if field not in data:
            return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
    
    # Check if timetable already exists for this class
    existing = timetable_col.find_one({
        "department": data["department"],
        "year": data["year"],
        "division": data["division"]
    })
    
    if existing:
        return jsonify({
            "success": False,
            "error": "Timetable already exists for this class. Use update endpoint instead."
        }), 409
    
    # Create timetable document
    timetable_doc = {
        "department": data["department"],
        "year": data["year"],
        "division": data["division"],
        "periods": data["periods"],  # Array of period objects
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    try:
        result = timetable_col.insert_one(timetable_doc)
        logger.info(f"Created timetable for {data['department']} {data['year']} {data['division']}")
        
        return jsonify({
            "success": True,
            "timetable_id": str(result.inserted_id),
            "message": "Timetable created successfully"
        })
    except Exception as e:
        logger.error(f"Error creating timetable: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------- GET TIMETABLE --------------------
@timetable_bp.route("/get", methods=["GET"])
def get_timetable():
    """Retrieve timetable by filters"""
    db = current_app.config.get("DB")
    timetable_col = db.timetables
    
    department = request.args.get("department")
    year = request.args.get("year")
    division = request.args.get("division")
    
    # Build query
    query = {}
    if department:
        query["department"] = department
    if year:
        query["year"] = year
    if division:
        query["division"] = division
    
    try:
        timetable = timetable_col.find_one(query)
        
        if not timetable:
            return jsonify({
                "success": False,
                "message": "No timetable found for the specified class"
            }), 404
        
        # Convert ObjectId to string for JSON serialization
        timetable["_id"] = str(timetable["_id"])
        
        # Convert datetime objects to ISO format strings
        if "created_at" in timetable:
            timetable["created_at"] = timetable["created_at"].isoformat()
        if "updated_at" in timetable:
            timetable["updated_at"] = timetable["updated_at"].isoformat()
        
        return jsonify({
            "success": True,
            "timetable": timetable
        })
    except Exception as e:
        logger.error(f"Error retrieving timetable: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------- UPDATE TIMETABLE --------------------
@timetable_bp.route("/update", methods=["PUT"])
def update_timetable():
    """Update existing timetable"""
    data = request.get_json()
    db = current_app.config.get("DB")
    timetable_col = db.timetables
    
    # Require either timetable_id or class identifiers
    timetable_id = data.get("timetable_id")
    department = data.get("department")
    year = data.get("year")
    division = data.get("division")
    
    if not timetable_id and not (department and year and division):
        return jsonify({
            "success": False,
            "error": "Either timetable_id or (department, year, division) must be provided"
        }), 400
    
    # Build query
    if timetable_id:
        query = {"_id": ObjectId(timetable_id)}
    else:
        query = {
            "department": department,
            "year": year,
            "division": division
        }
    
    # Build update document
    update_doc = {"$set": {"updated_at": datetime.now()}}
    
    if "periods" in data:
        update_doc["$set"]["periods"] = data["periods"]
    if "department" in data:
        update_doc["$set"]["department"] = data["department"]
    if "year" in data:
        update_doc["$set"]["year"] = data["year"]
    if "division" in data:
        update_doc["$set"]["division"] = data["division"]
    
    try:
        result = timetable_col.update_one(query, update_doc)
        
        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "error": "Timetable not found"
            }), 404
        
        logger.info(f"Updated timetable: {query}")
        
        return jsonify({
            "success": True,
            "message": "Timetable updated successfully",
            "modified_count": result.modified_count
        })
    except Exception as e:
        logger.error(f"Error updating timetable: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------- DELETE TIMETABLE --------------------
@timetable_bp.route("/delete", methods=["DELETE"])
def delete_timetable():
    """Delete a timetable"""
    data = request.get_json()
    db = current_app.config.get("DB")
    timetable_col = db.timetables
    
    timetable_id = data.get("timetable_id")
    department = data.get("department")
    year = data.get("year")
    division = data.get("division")
    
    if not timetable_id and not (department and year and division):
        return jsonify({
            "success": False,
            "error": "Either timetable_id or (department, year, division) must be provided"
        }), 400
    
    # Build query
    if timetable_id:
        query = {"_id": ObjectId(timetable_id)}
    else:
        query = {
            "department": department,
            "year": year,
            "division": division
        }
    
    try:
        result = timetable_col.delete_one(query)
        
        if result.deleted_count == 0:
            return jsonify({
                "success": False,
                "error": "Timetable not found"
            }), 404
        
        logger.info(f"Deleted timetable: {query}")
        
        return jsonify({
            "success": True,
            "message": "Timetable deleted successfully"
        })
    except Exception as e:
        logger.error(f"Error deleting timetable: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------- GET PERIODS FOR DAY --------------------
@timetable_bp.route("/periods", methods=["GET"])
def get_periods():
    """Get periods for a specific day and class"""
    db = current_app.config.get("DB")
    timetable_col = db.timetables
    
    department = request.args.get("department")
    year = request.args.get("year")
    division = request.args.get("division")
    day = request.args.get("day")  # Optional: Monday, Tuesday, etc.
    
    if not (department and year and division):
        return jsonify({
            "success": False,
            "error": "department, year, and division are required"
        }), 400
    
    try:
        timetable = timetable_col.find_one({
            "department": department,
            "year": year,
            "division": division
        })
        
        if not timetable:
            return jsonify({
                "success": False,
                "message": "No timetable found for the specified class"
            }), 404
        
        periods = timetable.get("periods", [])
        
        # Filter by day if specified
        if day:
            periods = [p for p in periods if day in p.get("days", [])]
        
        return jsonify({
            "success": True,
            "periods": periods,
            "department": department,
            "year": year,
            "division": division
        })
    except Exception as e:
        logger.error(f"Error retrieving periods: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------- GET ALL TIMETABLES --------------------
@timetable_bp.route("/list", methods=["GET"])
def list_timetables():
    """List all timetables with optional filtering"""
    db = current_app.config.get("DB")
    timetable_col = db.timetables
    
    department = request.args.get("department")
    year = request.args.get("year")
    
    query = {}
    if department:
        query["department"] = department
    if year:
        query["year"] = year
    
    try:
        timetables = list(timetable_col.find(query))
        
        # Convert ObjectId and datetime to strings
        for tt in timetables:
            tt["_id"] = str(tt["_id"])
            if "created_at" in tt:
                tt["created_at"] = tt["created_at"].isoformat()
            if "updated_at" in tt:
                tt["updated_at"] = tt["updated_at"].isoformat()
        
        return jsonify({
            "success": True,
            "timetables": timetables,
            "count": len(timetables)
        })
    except Exception as e:
        logger.error(f"Error listing timetables: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------- GET TEACHER SCHEDULE --------------------
@timetable_bp.route("/teacher", methods=["GET"])
def get_teacher_schedule():
    """Get all periods taught by a specific teacher across all classes"""
    db = current_app.config.get("DB")
    timetable_col = db.timetables
    
    teacher_name = request.args.get("teacher")
    
    if not teacher_name:
        return jsonify({
            "success": False,
            "error": "teacher parameter is required"
        }), 400
    
    try:
        # Find all timetables
        all_timetables = list(timetable_col.find({}))
        
        # Collect all periods taught by this teacher
        teacher_periods = []
        
        for timetable in all_timetables:
            department = timetable.get("department")
            year = timetable.get("year")
            division = timetable.get("division")
            periods = timetable.get("periods", [])
            
            # Filter periods where teacher name matches (case-insensitive partial match)
            for period in periods:
                period_teacher = period.get("teacher", "")
                # Check if teacher_name is in the period's teacher field (case-insensitive)
                if teacher_name.lower() in period_teacher.lower():
                    # Add class context to the period
                    teacher_periods.append({
                        "department": department,
                        "year": year,
                        "division": division,
                        "period_number": period.get("period_number"),
                        "subject": period.get("subject"),
                        "teacher": period.get("teacher"),
                        "start_time": period.get("start_time"),
                        "end_time": period.get("end_time"),
                        "days": period.get("days", [])
                    })
        
        # Sort by day and period
        days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        
        def sort_key(item):
            # Get the first day from the days array for sorting
            first_day = item["days"][0] if item["days"] else "Monday"
            day_index = days_order.index(first_day) if first_day in days_order else 999
            return (day_index, item["period_number"])
        
        teacher_periods.sort(key=sort_key)
        
        return jsonify({
            "success": True,
            "teacher": teacher_name,
            "periods": teacher_periods,
            "count": len(teacher_periods)
        })
    except Exception as e:
        logger.error(f"Error retrieving teacher schedule: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
