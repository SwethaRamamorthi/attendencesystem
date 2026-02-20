from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)
db = client["facerecognition"]
timetables_collection = db["timetables"]

def check():
    print("Checking for junk data...")
    
    # Check for "Mathematical Foundation"
    junk = timetables_collection.find_one({"periods.subject": {"$regex": "Mathematical Foundation", "$options": "i"}})
    
    if junk:
        print("❌ WARNING: Found 'Mathematical Foundation' junk data!")
    else:
        print("✅ CLEAN: No 'Mathematical Foundation' found.")

    # Check for "COMPUTER SCIENCE" department (old data)
    old_dept = timetables_collection.find_one({"department": "COMPUTER SCIENCE"})
    if old_dept:
        print("❌ WARNING: Found 'COMPUTER SCIENCE' department junk data!")
    else:
        print("✅ CLEAN: No 'COMPUTER SCIENCE' department found.")

    count = timetables_collection.count_documents({})
    print(f"Total documents: {count} (Should be 12)")

if __name__ == "__main__":
    check()
