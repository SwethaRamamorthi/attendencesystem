from pymongo import MongoClient
import os
from dotenv import load_dotenv
from flask import Flask
from flask_bcrypt import Bcrypt
import time

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)
db = client["facerecognition"]
auth_teachers = db["auth_teachers"]

app = Flask(__name__)
bcrypt = Bcrypt(app)

teachers = [
    {"name": "Dr. Subathra M", "username": "subathra", "employeeId": "MCA001"},
    {"name": "Dr. Sankar A", "username": "sankar", "employeeId": "MCA002"},
    {"name": "Dr. Manavalan R", "username": "manavalan", "employeeId": "MCA003"},
    {"name": "Dr. Umarani V", "username": "umarani", "employeeId": "MCA004"},
    {"name": "Dr. Ilayaraja N", "username": "ilayaraja", "employeeId": "MCA005"},
    {"name": "Dr. Chitra A", "username": "chitra", "employeeId": "MCA006"},
    {"name": "Dr. Suresh Kumar K", "username": "suresh", "employeeId": "MCA007"},
    {"name": "Dr. Nanda Gopal L", "username": "nandagopal", "employeeId": "MCA008"},
    {"name": "Dr. Shankar R", "username": "shankar", "employeeId": "MCA009"},
    {"name": "Dr. Bhama S", "username": "bhama", "employeeId": "MCA010"},
    # NEW TEACHERS ADDED
    {"name": "Ms. Gayathri K", "username": "gayathri", "employeeId": "MCA011"},
    {"name": "Ms. Kalyani A", "username": "kalyani", "employeeId": "MCA012"},
    {"name": "Ms. Gowri Thangam J", "username": "gowri", "employeeId": "MCA013"},
    {"name": "Mr. Sundar C", "username": "sundar", "employeeId": "MCA014"},
]

def create_accounts():
    print("Creating teacher accounts...")
    
    # Default password
    password = "password123"
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    
    for t in teachers:
        # Check if exists
        exists = auth_teachers.find_one({"username": t["username"]})
        if exists:
            print(f"Skipping existing user: {t['username']}")
            continue
            
        user_doc = {
            "username": t["username"],
            "email": f"{t['username']}@college.edu",
            "password": hashed_pw,
            "userType": "teacher",
            "role": "teacher",
            "department": "MCA",
            "employeeId": t["employeeId"],
            "status": "active",
            "created_at": time.time(),
            "name": t["name"] 
        }
        
        auth_teachers.insert_one(user_doc)
        print(f"Created teacher account: {t['username']} (Pass: {password})")

    print("\nAccount creation complete!")
    print(f"Total teachers: {auth_teachers.count_documents({})}")

if __name__ == "__main__":
    create_accounts()
