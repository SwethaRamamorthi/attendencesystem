import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)

print(f"Connecting to: {MONGODB_URI}")

dbs = client.list_database_names()
print(f"Databases found: {dbs}")

search_queries = [
    {'studentName': {'$regex': 'Keerthana', '$options': 'i'}},
    {'studentId': '24MX117'},
    {'email': '24mx117@psgtech.ac.in'}
]

for db_name in dbs:
    db = client[db_name]
    collections = db.list_collection_names()
    for coll_name in collections:
        coll = db[coll_name]
        for query in search_queries:
            student = coll.find_one(query)
            if student:
                print(f"\n[FOUND] DB: {db_name} | Collection: {coll_name}")
                print(f"Data: {student}")
                break
