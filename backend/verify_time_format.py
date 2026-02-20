import requests
import json
from datetime import datetime

# 1. Mark Attendance
url_mark = 'http://localhost:5000/api/attendance/mark'
student_id = "TEST_STUDENT_TIME"
data = {
    'studentId': student_id,
    'studentName': 'Test Student Time',
    'sessionName': 'Time Test',
    'period': 'P1'
}

print(f"Marking attendance at: {datetime.now().strftime('%H:%M:%S')}")
try:
    resp = requests.post(url_mark, json=data)
    print(f"Mark Response: {resp.status_code}")
    if resp.status_code == 200:
        print(json.dumps(resp.json(), indent=2))
except Exception as e:
    print(f"Error marking: {e}")

# 2. Get Today's Attendance
url_today = 'http://localhost:5000/api/attendance/today'
print("\nFetching Today's Attendance...")
try:
    resp = requests.get(url_today)
    if resp.status_code == 200:
        records = resp.json().get('records', [])
        # Find our record
        for r in records:
            if r.get('studentId') == student_id:
                print("\nFound Record:")
                print(f"First Seen: {r.get('first_seen')}")
                print(f"Last Seen: {r.get('last_seen')}")
                
                # Verify format
                fs = r.get('first_seen')
                if "PM" in fs or "AM" in fs:
                    print("✅ Format looks correct (AM/PM)")
                else:
                    print("❌ Format looks wrong (ISO/GMT?)")
                    
except Exception as e:
    print(f"Error fetching: {e}")

# Cleanup
from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()
client = MongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME")]
db.attendance_records.delete_many({'studentId': student_id})
print("\nCleaned up test record.")
