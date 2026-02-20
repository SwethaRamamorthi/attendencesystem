from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)

dbs = client.list_database_names()
print(f"Total Databases: {len(dbs)}")

for db_name in dbs:
    if db_name in ['admin', 'config', 'local']: continue
    db = client[db_name]
    print(f"\n--- Database: {db_name} ---")
    for coll_name in db.list_collection_names():
        coll = db[coll_name]
        count = coll.count_documents({})
        if count == 0: continue
        print(f"  Collection: {coll_name} ({count} documents)")
        
        # Check if it has something like students
        if 'student' in coll_name.lower() or 'face' in coll_name.lower():
            for doc in coll.find({}, {'studentName': 1, 'studentId': 1, 'email': 1, 'face_registered': 1}):
                name = doc.get('studentName') or doc.get('name')
                sid = doc.get('studentId') or doc.get('id')
                email = doc.get('email')
                print(f"    - [{sid}] {name} ({email}) | face_reg: {doc.get('face_registered')}")
