from pymongo import MongoClient
import os
from bson.json_util import dumps

MONGODB_URI = "mongodb://localhost:27017/"
DB_NAME = "facerecognition"

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
students_col = db.students

student = students_col.find_one({"studentName": "Mohamed riyas"})
if student:
    print(dumps(student, indent=2))
else:
    print("Student not found")
