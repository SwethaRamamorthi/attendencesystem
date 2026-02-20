from flask import Blueprint, request, jsonify, current_app
from flask_bcrypt import Bcrypt
import time
import logging

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()
logger = logging.getLogger(__name__)

@auth_bp.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('userType', 'student')  # Default to student

    if not all([username, email, password]):
        return jsonify({"success": False, "error": "All fields required"}), 400

    db = current_app.config.get("DB")
    
    # Choose collection based on user type
    if user_type == 'teacher':
        auth_col = db.auth_teachers
        # Add additional teacher-specific fields
        employee_id = data.get('employeeId')
        department = data.get('department')
        
        if not employee_id:
            return jsonify({"success": False, "error": "Employee ID required for teachers"}), 400
    elif user_type == 'admin':
        auth_col = db.auth_admins
    else:
        auth_col = db.auth_users
    
    # Check if email already exists in the appropriate collection
    if auth_col.find_one({'email': email}):
        return jsonify({
            "success": False, 
            "error": f"Email already registered as {user_type}"
        }), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')

    # Prepare user document
    user_doc = {
        "username": username,
        "email": email,
        "password": hashed_pw,
        "userType": user_type,
        "status": "active",
        "created_at": time.time()
    }
    
    # Add type-specific fields
    if user_type == 'teacher':
        user_doc.update({
            "employeeId": employee_id,
            "department": department,
            "role": "teacher"
        })
    elif user_type == 'admin':
        user_doc.update({"role": "admin"})
    
    auth_col.insert_one(user_doc)

    return jsonify({
        "success": True, 
        "message": f"{user_type.capitalize()} registered successfully"
    })

@auth_bp.route('/api/signin', methods=['POST'])
def api_signin():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('userType', 'student')  # Default to student

    if not all([email, password]):
        return jsonify({"success": False, "error": "Email and password required"}), 400

    db = current_app.config.get("DB")

    # ── PARENT LOGIN ─────────────────────────────────────────
    if user_type == 'parent':
        try:
            logger.info(f"Parent login attempt for email: {email}")
            ward = db.students.find_one({'parent_email': email})
            if not ward:
                return jsonify({"success": False, "error": "No student linked to this parent email"}), 401

            parent_pw_hash = ward.get('parent_password')
            if not parent_pw_hash:
                return jsonify({"success": False, "error": "Parent account not set up. Contact administrator."}), 401

            if not bcrypt.check_password_hash(parent_pw_hash, password):
                return jsonify({"success": False, "error": "Invalid password"}), 401

            ward_student_id = ward.get('studentId') or ward.get('student_id')
            user_info = {
                "_id":          str(ward['_id']),
                "username":     f"Parent of {ward.get('studentName', 'Student')}",
                "email":        email,
                "userType":     'parent',
                "role":         'parent',
                "wardStudentId": ward_student_id,
                "wardName":     ward.get('studentName', ''),
                "department":   ward.get('department', ''),
                "year":         ward.get('year', ''),
                "division":     ward.get('division', ''),
            }
            return jsonify({
                "success": True,
                "message": "Signed in successfully as parent",
                "user": user_info,
                "userType": 'parent'
            })
        except Exception as e:
            logger.error(f"Parent login error: {str(e)}")
            return jsonify({"success": False, "error": f"Login failed: {str(e)}"}), 500

    # ── STUDENT LOGIN (from students collection) ─────────────
    if user_type == 'student':
        try:
            logger.info(f"Student login attempt for email: {email}")
            student = db.students.find_one({'email': email})

            if not student:
                return jsonify({"success": False, "error": "No student account found with this email"}), 401

            print("Student found:", student)
            login_pw_hash = student.get('password')
            if not login_pw_hash:
                return jsonify({"success": False, "error": "Student login not set up. Contact administrator."}), 401

            result = bcrypt.check_password_hash(login_pw_hash, password)
            print("Password match:", result)
            if not result:
                return jsonify({"success": False, "error": "Invalid password"}), 401

            if student.get('status') == 'inactive':
                return jsonify({"success": False, "error": "Account is deactivated. Contact administrator."}), 401

            user_info = {
                "user_id":     str(student['_id']),
                "_id":         str(student['_id']),
                "username":    student.get('studentName', email),
                "email":       email,
                "userType":    "student",
                "role":        "student",
                "studentId":   student.get('studentId', ''),
                "studentName": student.get('studentName', ''),
                "department":  student.get('department', ''),
                "year":        student.get('year', ''),
                "division":    student.get('division', ''),
                "semester":    student.get('semester', ''),
                "phoneNumber": student.get('phoneNumber', ''),
            }
            return jsonify({
                "success": True,
                "message": "Signed in successfully as student",
                "user": user_info,
                "userType": "student"
            })
        except Exception as e:
            logger.error(f"Student login error: {str(e)}")
            return jsonify({"success": False, "error": f"Login failed: {str(e)}"}), 500

    # ── TEACHER / ADMIN LOGIN ────────────────────────────────
    try:
        if user_type == 'teacher':
            auth_col = db.auth_teachers
            user_role = "teacher"
        elif user_type == 'admin':
            auth_col = db.auth_admins
            user_role = "admin"
        else:
            auth_col = db.auth_users
            user_role = "student"
        
        # Find user in appropriate collection
        logger.info(f"Attempting login for email: {email} as {user_type}")
        user = auth_col.find_one({'email': email})
        
        if not user:
            logger.warning(f"User not found: {email}")
            return jsonify({
                "success": False, 
                "error": f"No {user_type} account found with this email"
            }), 401
        
        # Check password
        if not bcrypt.check_password_hash(user['password'], password):
            logger.warning(f"Invalid password for user: {email}")
            return jsonify({
                "success": False, 
                "error": "Invalid password"
            }), 401
        
        # Check if account is active
        if user.get('status') == 'inactive':
            return jsonify({
                "success": False, 
                "error": "Account is deactivated. Contact administrator."
            }), 401
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Login failed: {str(e)}"}), 500

    # Prepare response based on user type
    user_info = {
        "_id": str(user['_id']),
        "username": user['username'],
        "email": user['email'],
        "userType": user_type,
        "role": user_role
    }
    
    # Add type-specific information
    if user_type == 'admin':
        user_info.update({"name": user['username']})
    elif user_type == 'teacher':
        user_info.update({
            "employeeId": user.get('employeeId'),
            "department": user.get('department'),
            "name": user['username']
        })
        
        # Check if teacher has student record too (optional)
        student_record = db.students.find_one({'email': email})
        if student_record:
            user_info['hasStudentRecord'] = True
            user_info['studentId'] = student_record.get('studentId')

    return jsonify({
        "success": True, 
        "message": f"Signed in successfully as {user_type}",
        "user": user_info,
        "userType": user_type
    })


@auth_bp.route('/api/logout', methods=['POST'])
def api_logout():
    # You can add logout logic here if needed (e.g., invalidate tokens)
    return jsonify({"success": True, "message": "Logged out successfully"})

# Additional route to check user type and permissions
@auth_bp.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """Get current user's profile information"""
    user_email = request.headers.get('X-User-Email')
    user_type = request.headers.get('X-User-Type', 'student')
    
    if not user_email:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    db = current_app.config.get("DB")
    
    # Get user from appropriate collection
    if user_type == 'teacher':
        auth_col = db.auth_teachers
    else:
        auth_col = db.auth_users
    
    user = auth_col.find_one({'email': user_email}, {'password': 0})  # Exclude password
    
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    
    user['_id'] = str(user['_id'])
    
    return jsonify({
        "success": True,
        "user": user
    })

# Route to switch user type (if user has both teacher and student accounts)
@auth_bp.route('/api/switch-role', methods=['POST'])
def switch_user_role():
    """Allow users to switch between teacher and student roles if they have both"""
    data = request.get_json()
    user_email = data.get('email')
    target_type = data.get('targetType')  # 'teacher' or 'student'
    
    if not all([user_email, target_type]):
        return jsonify({"success": False, "error": "Email and target type required"}), 400
    
    db = current_app.config.get("DB")
    
    # Check if user exists in target collection
    if target_type == 'teacher':
        target_col = db.auth_teachers
    else:
        target_col = db.auth_users
    
    target_user = target_col.find_one({'email': user_email})
    
    if not target_user:
        return jsonify({
            "success": False, 
            "error": f"No {target_type} account found for this email"
        }), 404
    
    # Return user info for the target role
    user_info = {
        "_id": str(target_user['_id']),
        "username": target_user['username'],
        "email": target_user['email'],
        "userType": target_type
    }
    
    if target_type == 'teacher':
        user_info.update({
            "employeeId": target_user.get('employeeId'),
            "department": target_user.get('department')
        })
    
    return jsonify({
        "success": True,
        "message": f"Switched to {target_type} role",
        "user": user_info,
        "userType": target_type
    })
