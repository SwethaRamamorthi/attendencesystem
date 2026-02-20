import requests
import json
from datetime import datetime

url = 'http://localhost:5000/api/attendance/current-subject'
student_id = '24AMCA1'  # Sanjay

print(f"Testing timetable lookup for student: {student_id}")
print(f"Current time: {datetime.now().strftime('%H:%M:%S')}")

try:
    response = requests.post(url, json={'studentId': student_id})
    
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
    
except Exception as e:
    print(f"Error: {e}")
