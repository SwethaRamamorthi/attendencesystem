# Fix import to work when run from backend directory
try:
    from app import app
except ImportError:
    # Try alternate import if run from root (less likely to work with current structure)
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from app import app

db = app.config['DB']

with open("debug_output.txt", "w") as f:
    f.write("--- DEBUGGING DATABASE ---\n")

    # 1. Check Student Config
    f.write("\n--- Student Record (Email: rswetha2807@gmail.com) ---\n")
    student = db.students.find_one({"email": "rswetha2807@gmail.com"})
    if student:
        f.write(f"Found Student: Name={student.get('studentName')}, ID={student.get('studentId')}, _id={student.get('_id')}\n")
        target_student_id = student.get('studentId')
    else:
        f.write("Student not found by email.\n")
        # Try by name
        student = db.students.find_one({"studentName": "swetha"})
        if student:
            f.write(f"Found Student by Name 'swetha': ID={student.get('studentId')}, Email={student.get('email')}\n")
            target_student_id = student.get('studentId')
        else:
            f.write("Student not found by name 'swetha' either.\n")
            target_student_id = None

    # 2. Check Attendance Records
    f.write("\n--- All Attendance Records (Last 10) ---\n")
    records = list(db.attendance_records.find().sort("date", -1).limit(10))
    for r in records:
        f.write(f"Record: StudentID={r.get('studentId')}, Name={r.get('studentName')}, Date={r.get('date')}\n")

    # 3. Check Specific Attendance for Target ID
    if target_student_id:
        f.write(f"\n--- Attendance for Target ID: {target_student_id} ---\n")
        my_records = list(db.attendance_records.find({"studentId": target_student_id}))
        f.write(f"Count: {len(my_records)}\n")
        for r in my_records:
            f.write(f"  - {r.get('date')} | {r.get('sessionName')} | {r.get('time')}\n")
    else:
        f.write("\nSkipping specific target check as ID not found.\n")

    f.write("\n--- End Debug ---\n")
