import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DATABASE_NAME", "facerecognition")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
students_col = db.students

print("\n" + "="*60)
print("FINAL DATABASE STATE - REGISTERED STUDENTS")
print("="*60)

students = list(students_col.find({}, {'studentId': 1, 'studentName': 1, 'face_data': 1, 'email': 1}))

if not students:
    print("\n⚠️ WARNING: No students found in database!")
else:
    print(f"\nTotal Students: {len(students)}\n")
    
    for i, student in enumerate(students, 1):
        face_data = student.get('face_data', [])
        valid_count = 0
        
        # Count valid embeddings
        for embedding in face_data:
            if isinstance(embedding, list) and len(embedding) > 0:
                valid_count += 1
        
        print(f"{i}. {student.get('studentName', 'Unknown')}")
        print(f"   ID: {student.get('studentId', 'N/A')}")
        print(f"   Email: {student.get('email', 'N/A')}")
        print(f"   Face Embeddings: {valid_count} valid")
        
        if valid_count == 0:
            print(f"   ⚠️ WARNING: No valid face data! Student won't be recognized.")
        elif valid_count < 3:
            print(f"   ⚡ NOTICE: Low face data count. Consider re-registering.")
        else:
            print(f"   ✅ Ready for recognition")
        print()

print("="*60)
print("Database verification complete!")
print("="*60 + "\n")
