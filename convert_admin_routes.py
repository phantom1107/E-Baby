"""
Script to convert remaining admin routes from MySQL to Firestore
"""

import re

# Read the app.py file
with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

# ============ Replacements ============

# 1. Convert /approve_rider
old_approve_rider = r'''@app\.route\('/approve_rider/<int:request_id>', methods=\['POST'\]\)
def approve_rider\(request_id\):
    try:
        conn = get_db_connection\(\)
        cursor = conn\.cursor\(dictionary=True\)

        # First, get all the rider request data including document_id
        cursor\.execute\("SELECT \* FROM rider_requests WHERE id = %s", \(request_id,\)\)
        rider_data = cursor\.fetchone\(\)

        if rider_data:
            # Insert into users table with all data including document
            cursor\.execute\(\"""
                INSERT INTO users 
                \(first_name, last_name, email, phone_number, address, password, user_type, document_id\)
                VALUES \(%s, %s, %s, %s, %s, %s, %s, %s\)
            """, \(
                rider_data\['first_name'\],
                rider_data\['last_name'\],
                rider_data\['email'\],
                rider_data\['phone_number'\],
                rider_data\['address'\],
                rider_data\['password'\],
                'Rider',  # Explicitly set user_type
                rider_data\['document_id'\]  # Include document_id
            \)\)

            # Delete from rider_requests after successful insertion
            cursor\.execute\("DELETE FROM rider_requests WHERE id = %s", \(request_id,\)\)
            conn\.commit\(\)
            flash\('Rider approved successfully!', 'success'\)

            # Send approval email notification \(text \+ HTML\)
            try:
                msg = Message\(
                    'E[^\x00]*?\n                    sender=app\.config\["MAIL_USERNAME"\],
                    recipients=\[rider_data\['email'\]\]
                \)
                msg\.body = \(
                    f"Hello \{rider_data\['first_name'\]\} \{rider_data\['last_name'\]\},\\n\\n"
                    "Your rider account has been approved by our admin team\.\\n"
                    "You can now sign in and manage deliveries\.\\n\\n"
                    "If you didn't request this account, please contact support immediately\.\\n"
                \)
                msg\.html = build_approval_email_html\(rider_data\['first_name'\], rider_data\['last_name'\], 'Rider'\)
                mail\.send\(msg\)
            except Exception as e:
                print\(f"Error sending approval email: \{e\}"\)
        else:
            flash\('Rider request not found!', 'error'\)

    except Exception as e:
        conn\.rollback\(\)
        print\(f"Error in approve_rider: \{e\}"\)  # Debug print
        flash\('Error approving rider!', 'error'\)
    finally:
        cursor\.close\(\)
        conn\.close\(\)

    return redirect\(url_for\('rider_requests_dashboard'\)\)'''

new_approve_rider = '''@app.route('/approve_rider/<int:request_id>', methods=['POST'])
def approve_rider(request_id):
    try:
        # Get rider request from Firestore
        rider_data = firestore_db.get_request_by_id(str(request_id), 'rider')
        
        if not rider_data:
            flash('Rider request not found!', 'error')
            return redirect(url_for('register_requests'))
        
        # Approve the request and create user
        if firestore_db.approve_request(str(request_id), 'rider'):
            flash('Rider approved successfully!', 'success')
            
            # Send approval email notification
            try:
                msg = Message(
                    'E-Baby - Registration Approved',
                    sender=app.config["MAIL_USERNAME"],
                    recipients=[rider_data['email']]
                )
                msg.body = (
                    f"Hello {rider_data['first_name']} {rider_data['last_name']},\\n\\n"
                    "Your rider account has been approved by our admin team.\\n"
                    "You can now sign in and manage deliveries.\\n\\n"
                    "If you didn't request this account, please contact support immediately.\\n"
                )
                msg.html = build_approval_email_html(rider_data['first_name'], rider_data['last_name'], 'Rider')
                mail.send(msg)
            except Exception as e:
                print(f"Error sending approval email: {e}")
        else:
            flash('Error approving rider!', 'error')
    
    except Exception as e:
        print(f"Error in approve_rider: {e}")
        flash('Error approving rider!', 'error')
    
    return redirect(url_for('register_requests'))'''

print("Starting admin route conversions...")
print("This script is just a check - actual replacements will be done manually")
print("\nRoutes to migrate:")
print("  1. /approve_rider")
print("  2. /reject_rider") 
print("  3. /ban_user")
print("  4. /unban_user")
print("  5. /admin_user_management")
print("  6. /admin_dashboard")
print("\nNote: These will be converted step by step due to encoding complexities")
