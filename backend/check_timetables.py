from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DATABASE_NAME")]

print("Checking timetables...")
timetables = list(db.timetables.find({}))
print(f"Total timetables: {len(timetables)}")

for t in timetables:
    print(f"Timetable for {t.get('department')} {t.get('year')} {t.get('division')}")
    print(f"  Periods: {len(t.get('periods', []))}")
