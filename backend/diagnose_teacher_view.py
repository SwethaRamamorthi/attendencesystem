from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)
db = client["facerecognition"]
timetables_collection = db["timetables"]
users_collection = db["users"]

def check():
    print("--- auth_teachers ---")
    teachers = list(db.auth_teachers.find({}))
    for u in teachers:
        print(f"Username: '{u['username']}', Email: '{u['email']}', Role: '{u.get('role', 'N/A')}'")
        
    print("\n--- auth_users ---")
    users = list(db.auth_users.find({}))
    for u in users:
        print(f"Username: '{u['username']}', Email: '{u['email']}', Role: '{u.get('role', 'N/A')}'")

    print("\n--- Timetable Matches for 'gowri' ---")
    target_user = "gowri"
    
    all_timetables = list(timetables_collection.find({}))
    count = 0
    for timetable in all_timetables:
        periods = timetable.get("periods", [])
        for p in periods:
            teacher = p.get("teacher", "")
            if target_user.lower() in teacher.lower():
                print(f"MATCH: {teacher} | {p['subject']} | {timetable['department']} {timetable['year']} {timetable['division']}")
                count += 1
    
    print(f"\nTotal matches found for '{target_user}': {count}")

if __name__ == "__main__":
    check()
