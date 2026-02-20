import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Use absolute path to ensure we load the same .env as the app
dotenv_path = os.path.join(os.getcwd(), '.env')
load_dotenv(dotenv_path)

db_name = os.getenv("DATABASE_NAME", "facerecognition")
print(f"Loaded .env from: {dotenv_path}")
print(f"DATABASE_NAME from .env: {db_name}")

client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/"))
db = client[db_name]

print(f"Checking collection 'students' in database '{db_name}'...")
students = list(db.students.find({}, {"studentName": 1, "studentId": 1}))
print(f"Found {len(students)} students:")
for s in students:
    print(f"  - [{s.get('studentId')}] {s.get('studentName')}")

# Also check facerecognition_db explicitly
print(f"\nChecking 'facerecognition_db' explicitly...")
db2 = client['facerecognition_db']
students2 = list(db2.students.find({}, {"studentName": 1, "studentId": 1}))
print(f"Found {len(students2)} students in facerecognition_db:")
for s in students2:
    print(f"  - [{s.get('studentId')}] {s.get('studentName')}")
