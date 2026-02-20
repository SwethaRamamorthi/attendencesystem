from pymongo import MongoClient

MONGODB_URI = "mongodb://localhost:27017/"
DB_NAME = "facerecognition"

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
students_col = db.students

result = students_col.update_one(
    {"studentName": "Mohamed riyas"},
    {"$set": {"face_registered": True}}
)

if result.modified_count > 0:
    print("Successfully updated Mohamed riyas status.")
else:
    print("No changes made or student not found.")
