import re

# Read the app.py file
with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

# Check for routes
routes_to_migrate = [
    "approve_rider",
    "reject_rider",
    "ban_user",
    "unban_user",
    "admin_user_management",
    "admin_dashboard",
]

print("Admin routes status:")
for route in routes_to_migrate:
    if f"def {route}" in content:
        # Check if it uses firestore_db
        start_idx = content.find(f"def {route}")
        if start_idx != -1:
            # Find next function
            next_func = content.find("\ndef ", start_idx + 1)
            if next_func == -1:
                next_func = len(content)
            func_content = content[start_idx:next_func]
            
            if "firestore_db" in func_content:
                print(f"  ✓ {route}: CONVERTED")
            elif "get_db_connection" in func_content:
                print(f"  ✗ {route}: STILL USES MySQL")
            else:
                print(f"  ? {route}: Unknown status")
    else:
        print(f"  - {route}: NOT FOUND")

print("\nLatest converted routes:")
if "firestore_db.register_requests" in content or ("firestore_db.get_all_pending_requests" in content and "def register_requests" in content):
    print("  ✓ /register_requests: CONVERTED")
if "firestore_db.get_request_by_id" in content and "def approve_seller" in content:
    print("  ✓ /approve_seller: CONVERTED")
