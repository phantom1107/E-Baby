"""
Test Firebase Connection
Run this to verify your Firebase credentials are working
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

def test_firebase_connection():
    """Test if Firebase credentials are valid"""
    
    print("=" * 60)
    print("FIREBASE CONNECTION TEST")
    print("=" * 60)
    
    # Check if firebase-config.json exists
    config_path = "firebase-config.json"
    if not os.path.exists(config_path):
        print("[X] ERROR: firebase-config.json not found!")
        print("\nPlease download a new service account key:")
        print("1. Go to https://console.firebase.google.com/")
        print("2. Select your project")
        print("3. Go to Project Settings -> Service Accounts")
        print("4. Click 'Generate New Private Key'")
        print("5. Save as 'firebase-config.json' in this directory")
        return False
    
    print(f"[OK] Found {config_path}")
    
    # Try to load and parse the config
    try:
        with open(config_path, 'r') as f:
            config_data = json.load(f)
        print("[OK] Config file is valid JSON")
        
        # Check required fields
        required_fields = ['type', 'project_id', 'private_key', 'client_email']
        for field in required_fields:
            if field not in config_data:
                print(f"[X] ERROR: Missing required field: {field}")
                return False
        print("[OK] All required fields present")
        
    except json.JSONDecodeError as e:
        print(f"[X] ERROR: Invalid JSON in config file: {e}")
        return False
    except Exception as e:
        print(f"[X] ERROR: Could not read config file: {e}")
        return False
    
    # Try to initialize Firebase
    try:
        # Clean up any existing app
        try:
            app = firebase_admin.get_app()
            firebase_admin.delete_app(app)
            print("[OK] Cleaned up existing Firebase app")
        except ValueError:
            pass
        
        # Initialize with credentials
        cred = credentials.Certificate(config_path)
        firebase_admin.initialize_app(cred)
        print("[OK] Firebase initialized successfully")
        
        # Try to get Firestore client
        db = firestore.client()
        print("[OK] Firestore client created")
        
        # Try a simple query
        print("\nTesting Firestore query...")
        collections = ['users', 'products']
        for collection_name in collections:
            try:
                # Just try to get the collection reference
                collection_ref = db.collection(collection_name)
                # Try to get first document (with timeout)
                docs = list(collection_ref.limit(1).stream(timeout=5.0))
                print(f"[OK] Collection '{collection_name}': {len(docs)} document(s) found")
            except Exception as e:
                print(f"[!] Collection '{collection_name}': {str(e)}")
        
        print("\n" + "=" * 60)
        print("[SUCCESS] FIREBASE CONNECTION SUCCESSFUL!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n[X] FIREBASE CONNECTION FAILED!")
        print(f"Error: {e}")
        print("\n" + "=" * 60)
        print("SOLUTION:")
        print("=" * 60)
        print("Your service account key is invalid or expired.")
        print("\nTo fix this:")
        print("1. Go to https://console.firebase.google.com/")
        print("2. Select project: e-baby-81746")
        print("3. Go to Project Settings (gear icon) -> Service Accounts")
        print("4. Click 'Generate New Private Key'")
        print("5. Replace firebase-config.json with the downloaded file")
        print("6. Run this test again")
        return False

if __name__ == "__main__":
    test_firebase_connection()
