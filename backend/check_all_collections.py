import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DATABASE_NAME", "facerecognition")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

print("\n=== Checking All Collections ===")
collections = db.list_collection_names()
print(f"Available collections: {collections}")

print("\n=== Checking students collection ===")
students_col = db.students
count = students_col.count_documents({})
print(f"Total documents in students collection: {count}")

if count > 0:
    print("\n=== Sample student records ===")
    for student in students_col.find().limit(10):
        print(f"- Name: {student.get('studentName')}, ID: {student.get('studentId')}, username: {student.get('username')}")
else:
    print("\n⚠️ Students collection is EMPTY")
    print("\nThe database cleanup deleted all students.")
    print("We have 2 options:")
    print("1. The students need to re-register their faces")
    print("2. Check if there's a backup or different collection")

# Check all collections for student data
print("\n=== Checking all collections for data ===")
for collection_name in collections:
    col = db[collection_name]
    doc_count = col.count_documents({})
    print(f"{collection_name}: {doc_count} documents")
    
    if doc_count > 0 and doc_count < 20:
        print(f"  Sample from {collection_name}:")
        for doc in col.find().limit(3):
            # Print first few fields
            fields = list(doc.keys())[:5]
            sample = {k: doc.get(k) for k in fields if k != '_id'}
            print(f"    {sample}")
