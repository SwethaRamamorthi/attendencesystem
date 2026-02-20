"""
create_admin.py
Run this script ONCE to create the first admin account in MongoDB.

Usage:
    python create_admin.py

You will be prompted for admin credentials.
"""

import os
import time
import getpass
from pymongo import MongoClient
from flask_bcrypt import generate_password_hash
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME     = os.getenv("DATABASE_NAME", "facerecognition")

client = MongoClient(MONGODB_URI)
db     = client[DB_NAME]

print("=" * 50)
print("  Admin Account Setup")
print("=" * 50)

username = input("Admin username: ").strip()
email    = input("Admin email:    ").strip()
password = getpass.getpass("Admin password: ")
confirm  = getpass.getpass("Confirm password: ")

if password != confirm:
    print("❌ Passwords do not match. Aborting.")
    exit(1)

if db.auth_admins.find_one({'email': email}):
    print(f"❌ An admin with email '{email}' already exists.")
    exit(1)

hashed_pw = generate_password_hash(password).decode('utf-8')

db.auth_admins.insert_one({
    "username":   username,
    "email":      email,
    "password":   hashed_pw,
    "userType":   "admin",
    "role":       "admin",
    "status":     "active",
    "created_at": time.time()
})

print(f"\n✅ Admin account created successfully!")
print(f"   Username: {username}")
print(f"   Email:    {email}")
print(f"   Role:     admin")
print("\nYou can now log in at the Admin login page.")
