"""
This script helps convert the old app.py to use Firestore.
Run this to help with the conversion.
"""

import re

# Read original app.py
with open('app.py', 'r') as f:
    content = f.read()

# Replace get_db_connection definition
old_db_func = '''# MySQL connection settings
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",  
        user="root",  
        password="", 
        database="baby_db" 
    )

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    conn.close()
    return user
    
def update_password_in_db(email, new_password):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password = %s WHERE email = %s", (new_password, email))
    conn.commit()
    conn.close()'''

new_db_func = '''# Firestore connection is already initialized in firestore_db module
# These helper functions are now in firestore_db.py
# Use: firestore_db.get_user_by_email(email)
# Use: firestore_db.update_password(email, new_password)
'''

content = content.replace(old_db_func, new_db_func)

# Save converted version
with open('app_converted.py', 'w') as f:
    f.write(content)

print("Initial conversion done. Check app_converted.py")
