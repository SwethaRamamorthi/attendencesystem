from pymongo import MongoClient
import os

# Direct connection to avoid loading app/models
MONGODB_URI = "mongodb://localhost:27017/"
DB_NAME = "facerecognition"

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

with open("debug_timetable_output.txt", "w") as f:
    f.write("--- DEBUGGING TIMETABLE (SIMPLE) ---\n")

    # 1. Check Student Config
    f.write("\n--- Student Record (Email: rswetha2807@gmail.com) ---\n")
    student = db.students.find_one({"email": "rswetha2807@gmail.com"})
    if student:
        f.write(f"Found Student: Name={student.get('studentName')}, Dept={student.get('department')}, Year={student.get('year')}, Div={student.get('division')}, _id={student.get('_id')}\n")
    else:
        f.write("Student not found by email.\n")

    # 2. Check All Timetables
    f.write("\n--- All Timetables ---\n")
    timetables = list(db.timetables.find())
    f.write(f"Total Timetables: {len(timetables)}\n")
    for t in timetables:
        f.write(f"Timetable: Dept={t.get('department')} | Year={t.get('year')} | Div={t.get('division')} | ID={t.get('_id')}\n")
        f.write(f"  Periods Count: {len(t.get('periods', []))}\n")
        # Check first period details
        if t.get('periods'):
            first = t.get('periods')[0]
            f.write(f"  Sample Period: {first.get('subject')} on {first.get('days')}\n")

    # 3. Check Specific Timetable for query
    # Looking for a match for the student
    if student:
        dept = student.get('department')
        year = student.get('year')
        div = student.get('division')
        f.write(f"\n--- Searching for Timetable Match: Dept={dept}, Year={year}, Div={div} ---\n")
        
        # Exact match
        match = db.timetables.find_one({"department": dept, "year": year, "division": div})
        if match:
             f.write("MATCH FOUND!\n")
        else:
             f.write("NO EXACT MATCH FOUND.\n")
             # Try Partial match?
             partial = db.timetables.find_one({"department": dept, "year": year})
             if partial:
                 f.write(f"Partial match found (Dept+Year only): Div={partial.get('division')}\n")

    f.write("\n--- End Debug ---\n")
