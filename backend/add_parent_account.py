"""
add_parent_account.py
Run this script to add parent credentials to an existing student record.

Usage:
    python add_parent_account.py

You will be prompted for the student ID and parent credentials.
"""

import os
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
print("  Add Parent Account to Student")
print("=" * 50)

student_id   = input("Student ID (e.g. S001): ").strip()
parent_email = input("Parent email address:   ").strip()
password     = getpass.getpass("Parent password: ")
confirm      = getpass.getpass("Confirm password: ")

if password != confirm:
    print("❌ Passwords do not match. Aborting.")
    exit(1)

# Find the student
student = db.students.find_one({'studentId': student_id})
if not student:
    print(f"❌ No student found with ID '{student_id}'.")
    exit(1)

# Check if parent_email is already used by another student
existing = db.students.find_one({'parent_email': parent_email})
if existing and str(existing['_id']) != str(student['_id']):
    print(f"❌ Parent email '{parent_email}' is already linked to another student.")
    exit(1)

hashed_pw = generate_password_hash(password).decode('utf-8')

db.students.update_one(
    {'studentId': student_id},
    {'$set': {
        'parent_email':    parent_email,
        'parent_password': hashed_pw,
    }}
)

print(f"\n✅ Parent account linked successfully!")
print(f"   Student:      {student.get('studentName', student_id)}")
print(f"   Parent Email: {parent_email}")
print(f"\nThe parent can now log in using the Parent Login option.")
