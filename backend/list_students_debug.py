from pymongo import MongoClient
import os

MONGODB_URI = "mongodb://localhost:27017/"
DB_NAME = "facerecognition"

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
students_col = db.students

print("Listing all students:")
for student in students_col.find({}, {"studentName": 1, "studentId": 1, "face_registered": 1}):
    name = student.get("studentName", "N/A")
    sid = student.get("studentId", "N/A")
    fr = student.get("face_registered", "N/A")
    print(f"- {name} ({sid}) [face_registered: {fr}]")
