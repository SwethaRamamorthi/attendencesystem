from pymongo import MongoClient
import os
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)
db = client['facerecognition']

email = "24mx117@psgtech.ac.in"
# The user implied the password is "Keerthana" or similar based on context "Keerthana \n i registered it..."
# I will check if password exists, and if so, try to match it against "Keerthana" or "password" or empty string
# just to debug.

student = db.students.find_one({'email': email})

if not student:
    print(f"❌ Student not found: {email}")
else:
    print(f"✅ Student found: {student.get('studentName')}")
    password_hash = student.get('password')
    
    if not password_hash:
        print("❌ No password hash found in 'password' field.")
        # Check if old field exists
        if student.get('login_password'):
             print("⚠️ Found 'login_password' field though! Migration might be needed.")
    else:
        print("✅ Password hash found.")
        bcrypt = Bcrypt()
        # Test against likely passwords
        test_passwords = ["Keerthana", "keerthana", "password", "123456", "student"]
        matched = None
        for p in test_passwords:
            if bcrypt.check_password_hash(password_hash, p):
                matched = p
                break
        
        if matched:
            print(f"✅ Password matches: '{matched}'")
        else:
            print("❌ Password hash exists but did not match common guesses (Keerthana, password, etc)")
