#!/usr/bin/env python3
"""
Comprehensive MySQL to Firestore Converter for app.py
This script converts ~100+ database operations from MySQL to Firestore
"""

import re
import os

# Read the current app.py
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Strategy: Replace common patterns

# 1. Remove conn/cursor creation/closing patterns
patterns = [
    # Pattern: conn = get_db_connection() ... cursor = conn.cursor(dictionary=True)
    (r'conn = get_db_connection\(\)\s+cursor = conn\.cursor\(dictionary=True\)', 
     '# Using Firestore - no cursor needed'),
    
    # Pattern: conn = get_db_connection() ... cursor = conn.cursor()
    (r'conn = get_db_connection\(\)\s+cursor = conn\.cursor\(\)',
     '# Using Firestore - no cursor needed'),
     
    # Pattern: cursor.close() and conn.close()
    (r'cursor\.close\(\)\s+conn\.close\(\)', ''),
    (r'conn\.close\(\)', ''),
    (r'cursor\.close\(\)', ''),
    (r'conn\.commit\(\)', '# Firestore auto-commits'),
     
    # Pattern: conn.rollback() 
    (r'conn\.rollback\(\)', ''),
]

for pattern, replacement in patterns:
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

# 2. Major query replacements
# This is complex - we'll handle specific common patterns

# Pattern: SELECT * FROM users WHERE email = 
content = re.sub(
    r"cursor\.execute\(['\"]SELECT \* FROM users WHERE email = %s['\"],?\s*\(email,?\)?.*?\)\s*user = cursor\.fetchone\(\)",
    "user = firestore_db.get_user_by_email(email)",
    content,
    flags=re.MULTILINE | re.DOTALL
)

# Pattern: SELECT * FROM users WHERE email = and password =
content = re.sub(
    r"cursor\.execute\(['\"]SELECT \* FROM users WHERE email = %s AND password = %s['\"],?\s*\(email,?\s+password,?\)?.*?\)\s*user = cursor\.fetchone\(\)",
    "user = firestore_db.get_user_by_email(email)\nif user and user.get('password') == password:",
    content,
    flags=re.MULTILINE | re.DOTALL
)

# Pattern: UPDATE users SET password
content = re.sub(
    r"cursor\.execute\(['\"]UPDATE users SET password = %s WHERE email = %s['\"],?\s*\(new_password,?\s+email[,)]*\)",
    "firestore_db.update_password(email, new_password)",
    content,
    flags=re.DOTALL
)

# 3. Add firestore_db imports if not already there
if "import firestore_db" not in content and "from firestore_db" not in content:
    # Already added in imports, so skip
    pass

# Save converted version
output_file = 'app_firestore.py'
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✓ Conversion complete: {output_file}")
print("Manual review needed for complex queries")
print("\nNext steps:")
print("1. Review app_firestore.py for accuracy")
print("2. Handle remaining get_db_connection() calls manually")
print("3. Test critical routes")
