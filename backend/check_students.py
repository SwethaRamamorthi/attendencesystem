from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)
db = client['facerecognition']

print(f"Checking 'students' collection in 'facerecognition'...")
students = list(db.students.find({}, {'studentName': 1, 'face_registered': 1, 'email': 1}))
print(f"Total students: {len(students)}")

for s in students:
    print(f"- {s.get('studentName')} ({s.get('email')}) | face_registered: {s.get('face_registered')}")
