"""
Database Migration Script: Rename 'embeddings'/'embedding' to 'face_data'

This script renames the embedding fields in the MongoDB students collection
to use the simpler 'face_data' terminology.

IMPORTANT: Backup your database before running this script!
"""

from pymongo import MongoClient
import sys

# MongoDB connection string
MONGODB_URI = "mongodb+srv://Kamlesh-21:Guru2004@attendencesystem.nlapsic.mongodb.net/Attendencesystem?retryWrites=true&w=majority&appName=Attendencesystem"

def migrate_database():
    """Migrate database fields from embedding/embeddings to face_data"""
    try:
        print("Connecting to MongoDB...")
        client = MongoClient(MONGODB_URI)
        db = client['facerecognition_db']
        students_col = db.students
        
        print(f"Connected to database: {db.name}")
        
        # Count documents with old field names
        old_embeddings_count = students_col.count_documents({"embeddings": {"$exists": True}})
        old_embedding_count = students_col.count_documents({"embedding": {"$exists": True}})
        
        print(f"\nFound {old_embeddings_count} documents with 'embeddings' field")
        print(f"Found {old_embedding_count} documents with 'embedding' field")
        
        if old_embeddings_count == 0 and old_embedding_count == 0:
            print("\nNo documents found with old field names. Migration may have already been completed.")
            return
        
        # Ask for confirmation
        response = input("\nDo you want to proceed with the migration? (yes/no): ")
        if response.lower() != 'yes':
            print("Migration cancelled.")
            return
        
        # Rename 'embeddings' to 'face_data'
        if old_embeddings_count > 0:
            print(f"\nRenaming 'embeddings' to 'face_data'...")
            result = students_col.update_many(
                {"embeddings": {"$exists": True}},
                {"$rename": {"embeddings": "face_data"}}
            )
            print(f"✓ Updated {result.modified_count} documents")
        
        # Rename 'embedding' to 'face_data' (singular form, if exists)
        if old_embedding_count > 0:
            print(f"\nRenaming 'embedding' to 'face_data'...")
            result = students_col.update_many(
                {"embedding": {"$exists": True}},
                {"$rename": {"embedding": "face_data"}}
            )
            print(f"✓ Updated {result.modified_count} documents")
        
        # Verify migration
        new_face_data_count = students_col.count_documents({"face_data": {"$exists": True}})
        print(f"\n✓ Migration completed successfully!")
        print(f"✓ Total documents with 'face_data' field: {new_face_data_count}")
        
        client.close()
        
    except Exception as e:
        print(f"\n✗ Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 60)
    print("Database Migration: embedding → face_data")
    print("=" * 60)
    print("\nWARNING: This will modify your database!")
    print("Make sure you have a backup before proceeding.\n")
    
    migrate_database()
