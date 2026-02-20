from pymongo import MongoClient
import os
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)
db = client['facerecognition']

email = "24mx117@psgtech.ac.in"
new_password = "Keerthana"

print(f"Resetting password for {email} to '{new_password}'...")

bcrypt = Bcrypt()
hashed = bcrypt.generate_password_hash(new_password).decode('utf-8')

result = db.students.update_one(
    {'email': email}, 
    {'$set': {'password': hashed, 'role': 'student'}}
)

if result.matched_count > 0:
    print(f"✅ Password successfully updated for {email}")
else:
    print(f"❌ Student not found: {email}")
