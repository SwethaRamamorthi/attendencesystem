from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)
db = client["facerecognition"]
timetables_collection = db["timetables"]

# MCA Semester 3 Timetable Data (Group I and Group II)
# Based on provided timetable with course codes and staff names

timetables_data = [
    {
        "department": "MCA",
        "year": "3rd Year",
        "division": "G1",
        "periods": [
            # MONDAY
            {"period_number": 1, "subject": "23MXAU – Software Testing", "teacher": "Dr. Sankar A", "start_time": "09:00", "end_time": "09:50", "days": ["Monday"]},
            {"period_number": 2, "subject": "23MXAH – Machine Learning", "teacher": "Ms. Umarani V", "start_time": "10:00", "end_time": "10:50", "days": ["Monday"]},
            {"period_number": 3, "subject": "23MX36 – Cloud Computing Lab", "teacher": "Dr. Subathra M", "start_time": "11:00", "end_time": "11:50", "days": ["Monday"]},
            {"period_number": 4, "subject": "23MX36 – Cloud Computing Lab", "teacher": "Ms. Kalyani A", "start_time": "12:00", "end_time": "12:50", "days": ["Monday"]},
            {"period_number": 5, "subject": "23MXAE – Computer Networks", "teacher": "Ms. Kalyani A", "start_time": "14:00", "end_time": "14:50", "days": ["Monday"]},
            {"period_number": 6, "subject": "23MXAO – Human Computer Interaction", "teacher": "Dr. Ilayaraja N", "start_time": "15:00", "end_time": "15:50", "days": ["Monday"]},
            {"period_number": 7, "subject": "23MXAQ – Social Networking & Web Mining", "teacher": "Ms. Gowri Thangam J", "start_time": "16:00", "end_time": "16:50", "days": ["Monday"]},
            
            # TUESDAY
            {"period_number": 1, "subject": "23MXAF – Data Mining & Analytics", "teacher": "Ms. Gayathri K", "start_time": "09:00", "end_time": "09:50", "days": ["Tuesday"]},
            {"period_number": 2, "subject": "23MXAT – DevOps", "teacher": "Dr. Manavalan R", "start_time": "10:00", "end_time": "10:50", "days": ["Tuesday"]},
            {"period_number": 3, "subject": "23MXAQ – Social Networking & Web Mining", "teacher": "Ms. Gowri Thangam J", "start_time": "11:00", "end_time": "11:50", "days": ["Tuesday"]},
            {"period_number": 4, "subject": "23MX31 – Cloud Computing", "teacher": "Dr. Subathra M", "start_time": "12:00", "end_time": "12:50", "days": ["Tuesday"]},
            {"period_number": 5, "subject": "23MXAO – Human Computer Interaction", "teacher": "Dr. Ilayaraja N", "start_time": "14:00", "end_time": "14:50", "days": ["Tuesday"]},
            {"period_number": 6, "subject": "23MXAE – Computer Networks", "teacher": "Ms. Kalyani A", "start_time": "15:00", "end_time": "15:50", "days": ["Tuesday"]},
            {"period_number": 7, "subject": "23MXM4 – Professional Ethics", "teacher": "Dr. Nanda Gopal L", "start_time": "16:00", "end_time": "16:50", "days": ["Tuesday"]},
            
            # WEDNESDAY
            {"period_number": 1, "subject": "23MXAT – DevOps", "teacher": "Dr. Manavalan R", "start_time": "09:00", "end_time": "09:50", "days": ["Wednesday"]},
            {"period_number": 2, "subject": "23MXAH – Machine Learning", "teacher": "Ms. Umarani V", "start_time": "10:00", "end_time": "10:50", "days": ["Wednesday"]},
            {"period_number": 3, "subject": "23MXCA – Entrepreneurship", "teacher": "Dr. Suresh Kumar K", "start_time": "11:00", "end_time": "11:50", "days": ["Wednesday"]},
            {"period_number": 4, "subject": "23MXAA – Design Patterns", "teacher": "Dr. Sankar A", "start_time": "12:00", "end_time": "12:50", "days": ["Wednesday"]},
            {"period_number": 5, "subject": "23MX31 – Cloud Computing", "teacher": "Dr. Subathra M", "start_time": "14:00", "end_time": "14:50", "days": ["Wednesday"]},
            {"period_number": 6, "subject": "23MX37 – Mini Project", "teacher": "Project Guide", "start_time": "15:00", "end_time": "15:50", "days": ["Wednesday"]},
            {"period_number": 7, "subject": "TWM – Tutor Ward Meeting", "teacher": "Dr. Ilayaraja N", "start_time": "16:00", "end_time": "16:50", "days": ["Wednesday"]},
            
            # THURSDAY
            {"period_number": 1, "subject": "23MXAE – Computer Networks", "teacher": "Ms. Kalyani A", "start_time": "09:00", "end_time": "09:50", "days": ["Thursday"]},
            {"period_number": 2, "subject": "23MXM4 – Professional Ethics", "teacher": "Dr. Nanda Gopal L", "start_time": "10:00", "end_time": "10:50", "days": ["Thursday"]},
            {"period_number": 3, "subject": "23MX37 – Mini Project", "teacher": "Project Guide", "start_time": "11:00", "end_time": "11:50", "days": ["Thursday"]},
            {"period_number": 4, "subject": "23MX37 – Mini Project", "teacher": "Project Guide", "start_time": "12:00", "end_time": "12:50", "days": ["Thursday"]},
            {"period_number": 5, "subject": "23MXAP – Compiler Design", "teacher": "Dr. Chitra A", "start_time": "14:00", "end_time": "14:50", "days": ["Thursday"]},
            {"period_number": 6, "subject": "23MXCA – Entrepreneurship", "teacher": "Dr. Suresh Kumar K", "start_time": "15:00", "end_time": "15:50", "days": ["Thursday"]},
            {"period_number": 7, "subject": "23MXCA – Entrepreneurship", "teacher": "Dr. Suresh Kumar K", "start_time": "16:00", "end_time": "16:50", "days": ["Thursday"]},
            
            # FRIDAY
            {"period_number": 1, "subject": "23MX31 – Cloud Computing", "teacher": "Dr. Subathra M", "start_time": "09:00", "end_time": "09:50", "days": ["Friday"]},
            {"period_number": 2, "subject": "23MXAQ – Social Networking & Web Mining", "teacher": "Ms. Gowri Thangam J", "start_time": "10:00", "end_time": "10:50", "days": ["Friday"]},
            {"period_number": 3, "subject": "23MXAT – DevOps", "teacher": "Dr. Manavalan R", "start_time": "11:00", "end_time": "11:50", "days": ["Friday"]},
            {"period_number": 4, "subject": "23MXAP – Compiler Design", "teacher": "Dr. Chitra A", "start_time": "12:00", "end_time": "12:50", "days": ["Friday"]},
            {"period_number": 5, "subject": "23MX36 – Cloud Computing Lab", "teacher": "Dr. Subathra M", "start_time": "14:00", "end_time": "14:50", "days": ["Friday"]},
            {"period_number": 6, "subject": "23MX36 – Cloud Computing Lab", "teacher": "Ms. Kalyani A", "start_time": "15:00", "end_time": "15:50", "days": ["Friday"]},
            {"period_number": 7, "subject": "LIB – Library", "teacher": "Library Staff", "start_time": "16:00", "end_time": "16:50", "days": ["Friday"]},
        ]
    },
    {
        "department": "MCA",
        "year": "3rd Year",
        "division": "G2",
        "periods": [
            # MONDAY
            {"period_number": 1, "subject": "23MXAU – Software Testing", "teacher": "Dr. Sankar A", "start_time": "09:00", "end_time": "09:50", "days": ["Monday"]},
            {"period_number": 2, "subject": "23MXAF – Data Mining & Analytics", "teacher": "Ms. Gayathri K", "start_time": "10:00", "end_time": "10:50", "days": ["Monday"]},
            {"period_number": 3, "subject": "23MX36 – Cloud Computing Lab", "teacher": "Dr. Bhama S", "start_time": "11:00", "end_time": "11:50", "days": ["Monday"]},
            {"period_number": 4, "subject": "23MX36 – Cloud Computing Lab", "teacher": "Mr. Sundar C", "start_time": "12:00", "end_time": "12:50", "days": ["Monday"]},
            {"period_number": 5, "subject": "23MXAE – Computer Networks", "teacher": "Ms. Kalyani A", "start_time": "14:00", "end_time": "14:50", "days": ["Monday"]},
            {"period_number": 6, "subject": "23MXAO – Human Computer Interaction", "teacher": "Dr. Ilayaraja N", "start_time": "15:00", "end_time": "15:50", "days": ["Monday"]},
            {"period_number": 7, "subject": "23MXAQ – Social Networking & Web Mining", "teacher": "Ms. Gowri Thangam J", "start_time": "16:00", "end_time": "16:50", "days": ["Monday"]},
            
            # TUESDAY
            {"period_number": 1, "subject": "23MXAF – Data Mining & Analytics", "teacher": "Ms. Gayathri K", "start_time": "09:00", "end_time": "09:50", "days": ["Tuesday"]},
            {"period_number": 2, "subject": "23MXAT – DevOps", "teacher": "Dr. Manavalan R", "start_time": "10:00", "end_time": "10:50", "days": ["Tuesday"]},
            {"period_number": 3, "subject": "23MXAQ – Social Networking & Web Mining", "teacher": "Ms. Gowri Thangam J", "start_time": "11:00", "end_time": "11:50", "days": ["Tuesday"]},
            {"period_number": 4, "subject": "23MX31 – Cloud Computing", "teacher": "Dr. Bhama S", "start_time": "12:00", "end_time": "12:50", "days": ["Tuesday"]},
            {"period_number": 5, "subject": "23MXAO – Human Computer Interaction", "teacher": "Dr. Ilayaraja N", "start_time": "14:00", "end_time": "14:50", "days": ["Tuesday"]},
            {"period_number": 6, "subject": "23MXAE – Computer Networks", "teacher": "Ms. Kalyani A", "start_time": "15:00", "end_time": "15:50", "days": ["Tuesday"]},
            {"period_number": 7, "subject": "23MXM4 – Professional Ethics", "teacher": "Dr. Shankar R", "start_time": "16:00", "end_time": "16:50", "days": ["Tuesday"]},
            
            # WEDNESDAY
            {"period_number": 1, "subject": "23MXAT – DevOps", "teacher": "Dr. Manavalan R", "start_time": "09:00", "end_time": "09:50", "days": ["Wednesday"]},
            {"period_number": 2, "subject": "23MXAF – Data Mining & Analytics", "teacher": "Ms. Gayathri K", "start_time": "10:00", "end_time": "10:50", "days": ["Wednesday"]},
            {"period_number": 3, "subject": "23MXCA – Entrepreneurship", "teacher": "Mr. Sundar C", "start_time": "11:00", "end_time": "11:50", "days": ["Wednesday"]},
            {"period_number": 4, "subject": "23MXAO – Human Computer Interaction", "teacher": "Dr. Ilayaraja N", "start_time": "12:00", "end_time": "12:50", "days": ["Wednesday"]},
            {"period_number": 5, "subject": "23MX31 – Cloud Computing", "teacher": "Dr. Bhama S", "start_time": "14:00", "end_time": "14:50", "days": ["Wednesday"]},
            {"period_number": 6, "subject": "23MX37 – Mini Project", "teacher": "Project Guide", "start_time": "15:00", "end_time": "15:50", "days": ["Wednesday"]},
            {"period_number": 7, "subject": "TWM – Tutor Ward Meeting", "teacher": "Ms. Umarani V", "start_time": "16:00", "end_time": "16:50", "days": ["Wednesday"]},
            
            # THURSDAY
            {"period_number": 1, "subject": "23MXAE – Computer Networks", "teacher": "Ms. Kalyani A", "start_time": "09:00", "end_time": "09:50", "days": ["Thursday"]},
            {"period_number": 2, "subject": "23MXM4 – Professional Ethics", "teacher": "Dr. Shankar R", "start_time": "10:00", "end_time": "10:50", "days": ["Thursday"]},
            {"period_number": 3, "subject": "23MX37 – Mini Project", "teacher": "Project Guide", "start_time": "11:00", "end_time": "11:50", "days": ["Thursday"]},
            {"period_number": 4, "subject": "23MX37 – Mini Project", "teacher": "Project Guide", "start_time": "12:00", "end_time": "12:50", "days": ["Thursday"]},
            {"period_number": 5, "subject": "23MXAU – Software Testing", "teacher": "Dr. Sankar A", "start_time": "14:00", "end_time": "14:50", "days": ["Thursday"]},
            {"period_number": 6, "subject": "23MXCA – Entrepreneurship", "teacher": "Mr. Sundar C", "start_time": "15:00", "end_time": "15:50", "days": ["Thursday"]},
            {"period_number": 7, "subject": "23MXCA – Entrepreneurship", "teacher": "Mr. Sundar C", "start_time": "16:00", "end_time": "16:50", "days": ["Thursday"]},
            
            # FRIDAY
            {"period_number": 1, "subject": "23MX31 – Cloud Computing", "teacher": "Dr. Bhama S", "start_time": "09:00", "end_time": "09:50", "days": ["Friday"]},
            {"period_number": 2, "subject": "23MXAQ – Social Networking & Web Mining", "teacher": "Ms. Gowri Thangam J", "start_time": "10:00", "end_time": "10:50", "days": ["Friday"]},
            {"period_number": 3, "subject": "23MXAT – DevOps", "teacher": "Dr. Manavalan R", "start_time": "11:00", "end_time": "11:50", "days": ["Friday"]},
            {"period_number": 4, "subject": "23MXAU – Software Testing", "teacher": "Dr. Sankar A", "start_time": "12:00", "end_time": "12:50", "days": ["Friday"]},
            {"period_number": 5, "subject": "23MX36 – Cloud Computing Lab", "teacher": "Dr. Bhama S", "start_time": "14:00", "end_time": "14:50", "days": ["Friday"]},
            {"period_number": 6, "subject": "23MX36 – Cloud Computing Lab", "teacher": "Mr. Sundar C", "start_time": "15:00", "end_time": "15:50", "days": ["Friday"]},
            {"period_number": 7, "subject": "LIB – Library", "teacher": "Library Staff", "start_time": "16:00", "end_time": "16:50", "days": ["Friday"]},
        ]
    }
]

def populate():
    print("Populating MCA Semester 3 timetables for G1 and G2...")
    
    # MCA Sem 3 is typically 2nd Year, but data might say "3rd Year" or "2"
    target_years = ["3rd Year", "2nd Year", "2"]
    target_depts = ["MCA", "mca"]
    
    for dept_variant in target_depts:
        print(f"\nProcessing department variant: {dept_variant}")
        for year_variant in target_years:
            print(f"Processing year variant: {year_variant}")
            for data in timetables_data:
                # Create a copy and update year and department
                entry = data.copy()
                entry["year"] = year_variant
                entry["department"] = dept_variant
                
                # Check if exists
                exists = timetables_collection.find_one({
                    "department": entry["department"],
                    "year": entry["year"],
                    "division": entry["division"]
                })
                
                if exists:
                    print(f"Updating existing timetable for {entry['department']} {entry['year']} {entry['division']}")
                    timetables_collection.update_one(
                        {"_id": exists["_id"]},
                        {"$set": {"periods": entry["periods"]}}
                    )
                else:
                    print(f"Creating new timetable for {entry['department']} {entry['year']} {entry['division']}")
                    timetables_collection.insert_one(entry)
            
    print("\nPopulate complete!")
    print(f"Total timetables: {timetables_collection.count_documents({})}")

if __name__ == "__main__":
    populate()
