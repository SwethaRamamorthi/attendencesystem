"""
setup_demo_accounts.py
Non-interactive script to set up demo Admin and Parent accounts.
"""

import os
import time
from pymongo import MongoClient
from flask_bcrypt import generate_password_hash
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME     = os.getenv("DATABASE_NAME", "facerecognition")

client = MongoClient(MONGODB_URI)
db     = client[DB_NAME]

print("=" * 60)
print("  SETTING UP DEMO ACCOUNTS")
print("=" * 60)

# 1. Setup Admin
admin_email = "admin@test.com"
admin_pass  = "admin123"

if db.auth_admins.find_one({'email': admin_email}):
    print(f"ℹ️  Admin '{admin_email}' already exists. Skipping.")
else:
    hashed_pw = generate_password_hash(admin_pass).decode('utf-8')
    db.auth_admins.insert_one({
        "username":   "Demo Admin",
        "email":      admin_email,
        "password":   hashed_pw,
        "userType":   "admin",
        "role":       "admin",
        "status":     "active",
        "created_at": time.time()
    })
    print(f"✅ Created Admin: {admin_email} / {admin_pass}")

# 2. Setup Parent
# Find a student to attach to
student = db.students.find_one()
if not student:
    print("❌ No students found in database. Cannot create parent account.")
    print("   Please register a student face first using the Teacher Dashboard.")
else:
    parent_email = "parent@test.com"
    parent_pass  = "parent123"
    
    # Check if this email is used by another student
    existing = db.students.find_one({'parent_email': parent_email})
    if existing and str(existing['_id']) != str(student['_id']):
        print(f"ℹ️  Parent email '{parent_email}' already linked to another student. Skipping.")
    else:
        hashed_pw = generate_password_hash(parent_pass).decode('utf-8')
        db.students.update_one(
            {'_id': student['_id']},
            {'$set': {
                'parent_email':    parent_email,
                'parent_password': hashed_pw,
            }}
        )
        print(f"✅ Created Parent: {parent_email} / {parent_pass}")
        print(f"   Linked to Student: {student.get('studentName', 'Unknown')} (ID: {student.get('studentId')})")

print("=" * 60)
