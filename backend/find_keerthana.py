from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)

dbs = client.list_database_names()
q = {"studentName": {"$regex": "Keerthana", "$options": "i"}}

print(f"Scanning {len(dbs)} databases...")

found = False
for db_name in dbs:
    if db_name in ["admin", "config", "local"]:
        continue
    db = client[db_name]
    for coll_name in db.list_collection_names():
        try:
            doc = db[coll_name].find_one(q)
            if doc:
                print(f"✅ FOUND: DB='{db_name}' | Collection='{coll_name}'")
                print(f"   Name: {doc.get('studentName')}")
                print(f"   ID:   {doc.get('studentId')}")
                print(f"   Email: {doc.get('email')}")
                found = True
        except:
            pass

if not found:
    print("❌ Student 'Keerthana' not found in any database/collection.")
