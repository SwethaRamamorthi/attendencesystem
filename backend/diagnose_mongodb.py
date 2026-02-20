import os
import socket
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

def diagnose():
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("DATABASE_NAME", "facerecognition")
    
    print(f"--- MongoDB Diagnostic Tool ---")
    print(f"Target URI: {uri[:20]}...{uri[-20:] if len(uri) > 40 else ''}")
    
    if not uri:
        print("ERROR: MONGODB_URI not found in .env file.")
        return

    # 1. DNS Check
    print("\n1. DNS Resolution Check:")
    try:
        host = uri.split('@')[1].split('/')[0].split('?')[0]
        print(f"Attempting to resolve host: {host}")
        ip = socket.gethostbyname(host)
        print(f"SUCCESS: Resolved to {ip}")
    except Exception as e:
        print(f"FAILURE: DNS resolution failed. Error: {e}")
        print("Note: This usually means you have no internet or the cluster name is wrong.")

    # 2. Port Check (27017)
    print("\n2. Port 27017 Connectivity Check:")
    # For SRV URIs, we can't easily check the port without knowing the shards,
    # but we can try a few common Atlas shard patterns if we parsed them from the error.
    # The error mentioned ac-kyavhsk-shard-00-01.5v9z6np.mongodb.net
    common_host = "ac-kyavhsk-shard-00-01.5v9z6np.mongodb.net"
    try:
        s = socket.create_connection((common_host, 27017), timeout=5)
        print(f"SUCCESS: Can reach {common_host}:27017")
        s.close()
    except Exception as e:
        print(f"FAILURE: Cannot reach {common_host}:27017. Error: {e}")
        print("This strongly suggests your network or firewall is blocking port 27017.")

    # 3. PyMongo Connection Test
    print("\n3. PyMongo Connection Test:")
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        # Attempt to get server info
        info = client.server_info()
        print("SUCCESS: Connected to MongoDB Atlas!")
        print(f"Server version: {info.get('version')}")
        
        db = client[db_name]
        print(f"Database '{db_name}' selected.")
        
        # Test collection access
        collections = db.list_collection_names()
        print(f"Available collections: {collections}")
        
    except ServerSelectionTimeoutError:
        print("FAILURE: Connection timed out.")
        print("Reason: Usually your IP address is NOT whitelisted in MongoDB Atlas.")
        print("Please log in to Atlas and add 'Allow Access from Anywhere' (0.0.0.0/0) or your current IP.")
    except Exception as e:
        print(f"FAILURE: An error occurred: {e}")

if __name__ == "__main__":
    diagnose()
