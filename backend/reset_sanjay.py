from pymongo import MongoClient
import os
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)
db = client['facerecognition']

email = "sanjaypanneerselvan@gmail.com"
new_password = "sanjay"

print(f"Resetting password for {email} to '{new_password}'...")

bcrypt = Bcrypt()
hashed = bcrypt.generate_password_hash(new_password).decode('utf-8')

# Update by email
result = db.students.update_one(
    {'email': email}, 
    {'$set': {'password': hashed, 'role': 'student'}}
)

if result.matched_count > 0:
    print(f"✅ Password successfully updated for {email}")
    if result.modified_count > 0:
        print("   (Document was modified)")
    else:
        print("   (Document matched but no changes needed - password might be same)")
else:
    print(f"❌ Student not found with email: {email}")
    # Try finding by name to see if email is missing/different
    student = db.students.find_one({'studentName': {'$regex': 'sanjay', '$options': 'i'}})
    if student:
        print(f"   ⚠️ Found student by name: {student.get('studentName')} (ID: {student.get('studentId')})")
        print(f"   Current email: {student.get('email')}")
