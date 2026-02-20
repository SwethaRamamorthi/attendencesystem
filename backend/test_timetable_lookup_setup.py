import requests
import json
from datetime import datetime
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME")]

# 1. Setup Test Student
print("Setting up test student...")
student_id = "TEST_STUDENT"
student_data = {
    "studentId": student_id,
    "studentName": "Test Student",
    "department": "mca",  # Matches timetable
    "year": "2",          # Matches timetable
    "division": "G1",     # Matches timetable
    "face_data": []
}

db.students.replace_one({"studentId": student_id}, student_data, upsert=True)
print(f"Inserted test student: {student_id}")

# 2. Test Lookup
url = 'http://localhost:5000/api/attendance/current-subject'
print(f"\nTesting lookup for: {student_id}")
print(f"Current Time: {datetime.now().strftime('%H:%M:%S')}")

try:
    response = requests.post(url, json={'studentId': student_id})
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")

# 3. Cleanup
print("\nCleaning up...")
db.students.delete_one({"studentId": student_id})
print("Test student removed.")
