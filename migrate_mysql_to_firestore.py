"""
Migration Script: MySQL to Firestore
Exports all data from MySQL database and imports into Firestore
Run this ONCE to migrate your existing data
"""

import mysql.connector
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from decimal import Decimal
import json
from typing import List, Dict, Any

print("=" * 60)
print("MIGRATION: MySQL → Firestore")
print("=" * 60)

# =============================
# Firebase Init
# =============================
try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate("firebase-config.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# =============================
# MySQL Connection
# =============================
def get_mysql_connection():
    """Connect to MySQL database"""
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="baby_db"
    )

# =============================
# Collection Mappings
# =============================
COLLECTIONS = {
    'users': 'users',
    'products': 'products',
    'cart': 'cart',
    'checkout': 'checkout',
    'orders': 'orders',
    'wishlist': 'wishlist',
    'chat_messages': 'chat_messages',
    'seller_requests': 'seller_requests',
    'rider_requests': 'rider_requests',
    'buyer_requests': 'buyer_requests',
    'product_variants': 'product_variants',
    'seller_reports': 'seller_reports',
    'admin_activity_logs': 'admin_activity_logs',
    'seller_commissions': 'seller_commissions',
    'rider_earnings': 'rider_earnings',
}

# =============================
# Data Conversion Helpers
# =============================

def convert_datetime(value):
    """Convert MySQL datetime to Python datetime"""
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except:
            return datetime.now()
    return datetime.now()

def convert_enum(value):
    """ENUMs are already strings in MySQL"""
    return str(value) if value else None

def clean_record(record: Dict, collection_name: str) -> Dict:
    """Clean and convert MySQL record for Firestore"""
    cleaned = {}
    
    for key, value in record.items():
        if value is None:
            cleaned[key] = None
        elif isinstance(value, Decimal):
            # Convert Decimal to float for Firestore compatibility
            cleaned[key] = float(value)
        elif isinstance(value, bytes):
            cleaned[key] = value.decode('utf-8', errors='ignore')
        elif isinstance(value, datetime):
            cleaned[key] = value
        elif key.endswith('_at') or key in ['date', 'timestamp', 'reviewed_at']:
            # Convert datetime fields
            cleaned[key] = convert_datetime(value)
        else:
            cleaned[key] = value
    
    return cleaned

# =============================
# Export Functions
# =============================

def export_from_mysql(table_name: str) -> List[Dict]:
    """Export all records from a MySQL table"""
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"SELECT * FROM {table_name}")
        records = cursor.fetchall()
        cursor.close()
        conn.close()
        print(f"✓ Exported {len(records)} records from '{table_name}'")
        return records
    except Exception as e:
        print(f"✗ Error exporting '{table_name}': {e}")
        return []

# =============================
# Import Functions
# =============================

def import_to_firestore(collection: str, records: List[Dict]) -> int:
    """Import records into Firestore collection"""
    if not records:
        print(f"  (no records to import)")
        return 0
    
    try:
        imported_count = 0
        batch = db.batch()
        batch_size = 0
        
        for record in records:
            cleaned = clean_record(record, collection)
            
            # Use 'id' as document ID if it exists, otherwise auto-generate
            doc_id = None
            if 'id' in cleaned:
                doc_id = str(cleaned.pop('id'))
            
            if doc_id:
                doc_ref = db.collection(collection).document(doc_id)
            else:
                doc_ref = db.collection(collection).document()
            
            batch.set(doc_ref, cleaned)
            imported_count += 1
            batch_size += 1
            
            # Commit batch every 500 records
            if batch_size >= 500:
                batch.commit()
                print(f"  → Committed {batch_size} records (total: {imported_count})")
                batch = db.batch()
                batch_size = 0
        
        # Commit remaining records
        if batch_size > 0:
            batch.commit()
            print(f"  → Committed {batch_size} records (total: {imported_count})")
        
        print(f"✓ Imported {imported_count} records to '{collection}'")
        return imported_count
    except Exception as e:
        print(f"✗ Error importing to '{collection}': {e}")
        return 0

# =============================
# Migration Runner
# =============================

def migrate_collection(table_name: str, collection_name: str) -> int:
    """Migrate one collection from MySQL to Firestore"""
    print(f"\nMigrating: {table_name} → {collection_name}")
    
    records = export_from_mysql(table_name)
    count = import_to_firestore(collection_name, records)
    
    return count

def run_migration():
    """Run complete migration"""
    
    total_migrated = 0
    
    # Migration order (no foreign key dependencies issues):
    migrations = [
        ('users', COLLECTIONS['users']),
        ('products', COLLECTIONS['products']),
        ('product_variants', COLLECTIONS['product_variants']),
        ('cart', COLLECTIONS['cart']),
        ('checkout', COLLECTIONS['checkout']),
        ('orders', COLLECTIONS['orders']),
        ('wishlist', COLLECTIONS['wishlist']),
        ('chat_messages', COLLECTIONS['chat_messages']),
        ('seller_requests', COLLECTIONS['seller_requests']),
        ('rider_requests', COLLECTIONS['rider_requests']),
        ('buyer_requests', COLLECTIONS['buyer_requests']),
        ('seller_reports', COLLECTIONS['seller_reports']),
        ('admin_activity_logs', COLLECTIONS['admin_activity_logs']),
        ('seller_commissions', COLLECTIONS['seller_commissions']),
        ('rider_earnings', COLLECTIONS['rider_earnings']),
    ]
    
    for mysql_table, firestore_collection in migrations:
        try:
            count = migrate_collection(mysql_table, firestore_collection)
            total_migrated += count
        except Exception as e:
            print(f"✗ Failed to migrate {mysql_table}: {e}")
    
    print("\n" + "=" * 60)
    print(f"MIGRATION COMPLETE: {total_migrated} total records migrated")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_migration()
    except KeyboardInterrupt:
        print("\n⚠ Migration cancelled by user")
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
