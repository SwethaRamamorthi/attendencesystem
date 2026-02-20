
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["attendance_db"]
bcrypt = Bcrypt()

email = "sanjaypanneerselvan@gmail.com"
password = "sanjay"
hashed = bcrypt.generate_password_hash(password).decode('utf-8')

student = db.students.find_one({"email": email})

if student:
    print(f"Updating existing student {email}...")
    db.students.update_one(
        {"email": email},
        {"$set": {"password": hashed, "role": "student"}}
    )
    print("Updated.")
else:
    print(f"Creating new student {email}...")
    # Basic student record
    new_student = {
        "studentId": "S-TEST-001",
        "studentName": "Sanjay Panneerselvan",
        "email": email,
        "department": "CSE",
        "year": "4",
        "division": "A",
        "password": hashed,
        "role": "student",
        "status": "active"
    }
    db.students.insert_one(new_student)
    print("Created.")
