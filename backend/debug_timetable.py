# Fix import to work when run from backend directory
try:
    from app import app
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from app import app

db = app.config['DB']

with open("debug_timetable_output.txt", "w") as f:
    f.write("--- DEBUGGING TIMETABLE ---\n")

    # 1. Check Student Config
    f.write("\n--- Student Record (Email: rswetha2807@gmail.com) ---\n")
    student = db.students.find_one({"email": "rswetha2807@gmail.com"})
    if student:
        f.write(f"Found Student: Name={student.get('studentName')}, Dept={student.get('department')}, Year={student.get('year')}, Div={student.get('division')}\n")
    else:
        f.write("Student not found by email.\n")

    # 2. Check All Timetables
    f.write("\n--- All Timetables ---\n")
    timetables = list(db.timetables.find())
    f.write(f"Total Timetables: {len(timetables)}\n")
    for t in timetables:
        f.write(f"Timetable: Dept={t.get('department')} | Year={t.get('year')} | Div={t.get('division')} | ID={t.get('_id')}\n")
        f.write(f"  Periods Count: {len(t.get('periods', []))}\n")

    f.write("\n--- End Debug ---\n")
