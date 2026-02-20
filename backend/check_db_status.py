import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DATABASE_NAME", "facerecognition")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
students_col = db.students

# Write to file
with open('database_status.txt', 'w') as f:
    f.write("\n" + "="*60 + "\n")
    f.write("FINAL DATABASE STATE - REGISTERED STUDENTS\n")
    f.write("="*60 + "\n")
    
    students = list(students_col.find({}, {'studentId': 1, 'studentName': 1, 'face_data': 1, 'email': 1}))
    
    if not students:
        f.write("\nWARNING: No students found in database!\n")
    else:
        f.write(f"\nTotal Students: {len(students)}\n\n")
        
        for i, student in enumerate(students, 1):
            face_data = student.get('face_data', [])
            valid_count = 0
            
            for embedding in face_data:
                if isinstance(embedding, list) and len(embedding) > 0:
                    valid_count += 1
            
            f.write(f"{i}. {student.get('studentName', 'Unknown')}\n")
            f.write(f"   ID: {student.get('studentId', 'N/A')}\n")
            f.write(f"   Email: {student.get('email', 'N/A')}\n")
            f.write(f"   Face Embeddings: {valid_count} valid\n")
            
            if valid_count == 0:
                f.write(f"   WARNING: No valid face data!\n")
            elif valid_count < 3:
                f.write(f"   NOTICE: Low face data count\n")
            else:
                f.write(f"   Status: Ready for recognition\n")
            f.write("\n")
    
    f.write("="*60 + "\n")

print("Database status written to database_status.txt")
