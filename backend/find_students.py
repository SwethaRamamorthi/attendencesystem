from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/"))
db = client[os.getenv("DATABASE_NAME", "facerecognition")]

names = ["vinodha", "swetha"]
found = []

print("Searching for students...")
for name in names:
    # Case-insensitive partial match
    student = db.students.find_one({"studentName": {"$regex": name, "$options": "i"}})
    if student:
        print(f"✅ Found: {student['studentName']} (ID: {student.get('studentId')})")
        found.append(student)
    else:
        print(f"❌ Not Found: {name}")
