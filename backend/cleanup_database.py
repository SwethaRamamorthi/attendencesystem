import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DATABASE_NAME", "facerecognition")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
students_col = db.students

# Keep only these 4 students
valid_student_ids = ['2026MCA007', '2AMCA21', '2026MICA', '24AMCA1']
valid_student_names = ['Swetha Ramamoorthi', 'akshaya', 'Vinodha', 'sanjay']

print("\n=== Current Students in Database ===")
all_students = list(students_col.find({}, {'studentId': 1, 'studentName': 1, 'face_data': 1}))
for student in all_students:
    face_data_count = len(student.get('face_data', [])) if student.get('face_data') else 0
    print(f"- {student.get('studentName')} ({student.get('studentId')}): {face_data_count} face embeddings")

print(f"\nTotal students: {len(all_students)}")

print("\n=== Cleaning Database ===")
print(f"Keeping only these students: {valid_student_ids}")

# Delete all students NOT in the valid list
result = students_col.delete_many({
    'studentId': {'$nin': valid_student_ids}
})

print(f"Deleted {result.deleted_count} students")

print("\n=== Remaining Students ===")
remaining_students = list(students_col.find({}, {'studentId': 1, 'studentName': 1, 'face_data': 1}))
for student in remaining_students:
    face_data = student.get('face_data', [])
    
    # Check for corrupted data
    corrupted = False
    valid_embeddings = 0
    
    if face_data:
        for i, embedding in enumerate(face_data):
            if isinstance(embedding, str):
                print(f"  ⚠️ Corrupted embedding #{i+1} (is string)")
                corrupted = True
            elif isinstance(embedding, list) and len(embedding) > 0:
                valid_embeddings += 1
            else:
                print(f"  ⚠️ Invalid embedding #{i+1}")
                corrupted = True
    
    status = "✅ VALID" if valid_embeddings > 0 and not corrupted else "❌ CORRUPTED"
    print(f"{status} - {student.get('studentName')} ({student.get('studentId')}): {valid_embeddings} valid embeddings")

print("\n=== Cleaning Corrupted Face Data ===")
# Remove corrupted face data from remaining students
for student in remaining_students:
    face_data = student.get('face_data', [])
    if face_data:
        # Filter out corrupted embeddings (strings, empty, or invalid)
        clean_embeddings = []
        for embedding in face_data:
            if isinstance(embedding, list) and len(embedding) > 0:
                # Check if it's a valid numeric list
                try:
                    import numpy as np
                    arr = np.array(embedding, dtype=np.float32)
                    if arr.size > 0 and np.isfinite(arr).all():
                        clean_embeddings.append(embedding)
                except:
                    pass
        
        if len(clean_embeddings) != len(face_data):
            students_col.update_one(
                {'_id': student['_id']},
                {'$set': {'face_data': clean_embeddings}}
            )
            print(f"Cleaned {student.get('studentName')}: {len(face_data)} → {len(clean_embeddings)} embeddings")
        else:
            print(f"✅ {student.get('studentName')}: Already clean ({len(clean_embeddings)} embeddings)")

print("\n=== Final Database State ===")
final_students = list(students_col.find({}, {'studentId': 1, 'studentName': 1, 'face_data': 1}))
print(f"Total registered students: {len(final_students)}")
for student in final_students:
    face_count = len(student.get('face_data', []))
    print(f"✓ {student.get('studentName')} ({student.get('studentId')}): {face_count} valid embeddings")

print("\n✅ Database cleanup complete!")
