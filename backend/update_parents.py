from pymongo import MongoClient
import os
from flask_bcrypt import generate_password_hash
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/"))
db = client[os.getenv("DATABASE_NAME", "facerecognition")]

updates = [
    {
        "name_query": "Vinodha",
        "email": "vinodhaparent@gmail.com",
        "password": "vinodhaparent"
    },
    {
        "name_query": "Swetha",
        "email": "swethaparent@gmail.com",
        "password": "swethaparent"
    }
]

print("Starting parent credential updates...")

for u in updates:
    name_query = u['name_query']
    
    # 1. Find student
    student = db.students.find_one({"studentName": {"$regex": name_query, "$options": "i"}})
    
    if not student:
        print(f"❌ Student matching '{name_query}' not found.")
        continue
        
    # 2. Update credentials
    hashed_pw = generate_password_hash(u['password']).decode('utf-8')
    
    result = db.students.update_one(
        {'_id': student['_id']},
        {'$set': {
            'parent_email': u['email'],
            'parent_password': hashed_pw
        }}
    )
    
    if result.modified_count > 0:
        print(f"✅ Updated {student['studentName']} (ID: {student.get('studentId')})")
        print(f"   Parent Email: {u['email']}")
        print(f"   Parent Pass:  {u['password']}")
    else:
        # Check if already set
        if student.get('parent_email') == u['email']:
             print(f"ℹ️  {student['studentName']} already has this email set.")
        else:
             print(f"⚠️ Failed to update {student['studentName']}")

print("Done.")
