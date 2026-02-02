import mysql.connector
from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask import Flask, render_template, send_from_directory, jsonify
import os
from werkzeug.utils import secure_filename
from flask_mail import Mail, Message
from random import randint
from io import BytesIO
import base64
import json
from threading import Lock
from datetime import datetime
from flask import send_from_directory
import time

app = Flask(__name__)
app.secret_key = 'secret_key_for_flash_messages'

app.config["MAIL_SERVER"] = 'smtp.gmail.com'
app.config["MAIL_PORT"] = 465
app.config["MAIL_USERNAME"] = 'ebabyservices@gmail.com'  
app.config['MAIL_PASSWORD'] = 'ewsw htoi mogd xvgr'         
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True

app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['PROFILE_PICS_FOLDER'] = os.path.join(app.config['UPLOAD_FOLDER'], 'profile_pics')
app.config['BANNERS_FOLDER'] = os.path.join(app.config['UPLOAD_FOLDER'], 'banners')

# Create the directories if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['PROFILE_PICS_FOLDER'], exist_ok=True)
os.makedirs(app.config['BANNERS_FOLDER'], exist_ok=True)

mail = Mail(app)

# =============================
# Helper: Build HTML OTP email
# =============================
def build_otp_email_html(otp_code: int, first_name: str) -> str:
    return f"""
    <div style="background:#f6f7fb;padding:24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="background:#ffffff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,0.06);overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111;">
              <tr>
                <td style="padding:28px 28px 12px 28px;background:linear-gradient(135deg,#6B46C1,#8B5CF6);color:#fff;">
                  <h1 style="margin:0;font-size:22px;letter-spacing:0.3px;">E‑Baby Verification</h1>
                  <p style="margin:6px 0 0 0;font-size:13px;opacity:.9;">Secure one‑time code</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px 6px 28px;">
                  <p style="margin:0 0 10px 0;font-size:15px;">Hello {first_name or 'there'},</p>
                  <p style="margin:0 0 18px 0;font-size:15px;">Use the following code to complete your sign up. This code will expire shortly.</p>
                  <div style="text-align:center;margin:18px 0 10px 0;">
                    <div style="display:inline-block;padding:14px 22px;border-radius:12px;border:2px solid #6B46C1;background:#f7f4ff;font-weight:700;font-size:28px;letter-spacing:10px;color:#5b3ab4;">{otp_code}</div>
                  </div>
                  <p style="margin:18px 0 0 0;font-size:13px;color:#555;">If you didn’t request this, you can safely ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 28px 24px 28px;color:#777;font-size:12px;border-top:1px solid #f0eef8;">
                  <p style="margin:0;">© {datetime.now().year} E‑Baby • Please do not reply to this automated message.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    """

# =============================
# Helper: Build Approval email
# =============================
def build_approval_email_html(first_name: str, last_name: str, role: str) -> str:
    display_name = f"{first_name} {last_name}".strip()
    return f"""
    <div style=\"background:#f6f7fb;padding:24px 0;\">
      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">
        <tr>
          <td align=\"center\">
            <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"560\" style=\"background:#ffffff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,0.06);overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111;\">
              <tr>
                <td style=\"padding:28px;background:linear-gradient(135deg,#10B981,#34D399);color:#fff;\">
                  <h1 style=\"margin:0;font-size:22px;letter-spacing:.3px;\">E‑Baby Application Approved</h1>
                  <p style=\"margin:6px 0 0 0;font-size:13px;opacity:.95;\">Welcome aboard!</p>
                </td>
              </tr>
              <tr>
                <td style=\"padding:24px 28px 8px 28px;\">
                  <p style=\"margin:0 0 10px 0;font-size:15px;\">Hi {display_name or 'there'},</p>
                  <p style=\"margin:0 0 14px 0;font-size:15px;\">Great news! Your {role} account has been approved by our admin team.</p>
                  <div style=\"margin:18px 0;padding:14px;border-radius:12px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;\">
                    You can now sign in and start using your {role.lower()} tools on E‑Baby.
                  </div>
                  <p style=\"margin:0 0 0 0;font-size:13px;color:#555;\">If you didn’t request this account, please contact support immediately.</p>
                </td>
              </tr>
              <tr>
                <td style=\"padding:16px 28px 24px 28px;color:#777;font-size:12px;border-top:1px solid #EEF2FF;\">
                  <p style=\"margin:0;\">© {datetime.now().year} E‑Baby</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    """

# =============================
# Helper: Build Rejection email
# =============================
def build_rejection_email_html(first_name: str, last_name: str, role: str, reason: str) -> str:
    display_name = f"{first_name} {last_name}".strip()
    safe_reason = reason or 'No reason specified.'
    return f"""
    <div style=\"background:#f6f7fb;padding:24px 0;\">
      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">
        <tr>
          <td align=\"center\">
            <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"560\" style=\"background:#ffffff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,0.06);overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111;\">
              <tr>
                <td style=\"padding:28px;background:linear-gradient(135deg,#EF4444,#F87171);color:#fff;\">
                  <h1 style=\"margin:0;font-size:22px;letter-spacing:.3px;\">E‑Baby Application Update</h1>
                  <p style=\"margin:6px 0 0 0;font-size:13px;opacity:.95;\">{role} application not approved</p>
                </td>
              </tr>
              <tr>
                <td style=\"padding:24px 28px 8px 28px;\">
                  <p style=\"margin:0 0 10px 0;font-size:15px;\">Hi {display_name or 'there'},</p>
                  <p style=\"margin:0 0 14px 0;font-size:15px;\">Thank you for applying for a {role} account. After careful review, we’re unable to approve your application at this time.</p>
                  <div style=\"margin:18px 0;padding:14px;border-radius:12px;background:#fef2f2;border:1px solid #fecaca;color:#7f1d1d;\">
                    <strong>Reason from admin:</strong><br/>{safe_reason}
                  </div>
                  <p style=\"margin:0 0 0 0;font-size:13px;color:#555;\">You may reply to this email if you have questions or would like to re‑apply.</p>
                </td>
              </tr>
              <tr>
                <td style=\"padding:16px 28px 24px 28px;color:#777;font-size:12px;border-top:1px solid #FFE4E6;\">
                  <p style=\"margin:0;\">© {datetime.now().year} E‑Baby</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    """

# =============================
# Helper: Build Ban email
# =============================
def build_ban_email_html(first_name: str, last_name: str, reason: str) -> str:
    display_name = f"{first_name} {last_name}".strip()
    safe_reason = reason or 'No specific reason was provided.'
    return f"""
    <div style=\"background:#f6f7fb;padding:24px 0;\">
      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">
        <tr>
          <td align=\"center\">
            <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"560\" style=\"background:#ffffff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,0.06);overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111;\">
              <tr>
                <td style=\"padding:28px;background:linear-gradient(135deg,#DC2626,#EF4444);color:#fff;\">
                  <h1 style=\"margin:0;font-size:22px;letter-spacing:.3px;\">Account Suspended</h1>
                  <p style=\"margin:6px 0 0 0;font-size:13px;opacity:.95;\">Your E‑Baby account has been temporarily suspended</p>
                </td>
              </tr>
              <tr>
                <td style=\"padding:24px 28px 8px 28px;\">
                  <p style=\"margin:0 0 10px 0;font-size:15px;\">Hi {display_name or 'there'},</p>
                  <p style=\"margin:0 0 14px 0;font-size:15px;\">Your account has been suspended by our admin team due to a policy violation.</p>
                  <div style=\"margin:18px 0;padding:14px;border-radius:12px;background:#FEE2E2;border:1px solid #FCA5A5;color:#7F1D1D;\">
                    <strong>Reason:</strong> {safe_reason}
                  </div>
                  <p style=\"margin:14px 0 10px 0;font-size:15px;\">If you believe this is a mistake or would like to appeal, please contact our support team through the chat feature on the login page.</p>
                  <p style=\"margin:0;font-size:13px;color:#555;\">You can still chat with our admin team before logging in.</p>
                </td>
              </tr>
              <tr>
                <td style=\"padding:16px 28px 24px 28px;color:#777;font-size:12px;border-top:1px solid #FEE2E2;\">
                  <p style=\"margin:0;\">© {datetime.now().year} E‑Baby • Support: e-baby0@gmail.com</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    """

# =============================
# Helper: Build Report Notification email
# =============================
def build_report_notification_email_html(user_name: str, user_type: str, status: str, other_party: str, reason: str, admin_action: str, admin_notes: str) -> str:
    """Build HTML email for report notifications to reporter or seller"""
    safe_other_party = other_party or 'Unknown'
    safe_reason = reason or 'Not specified'
    safe_admin_action = admin_action or 'No specific action taken'
    safe_admin_notes = admin_notes or 'No additional notes'
    
    # Different colors based on status
    if status == 'Resolved':
        header_color = "linear-gradient(135deg,#10B981,#34D399)"
        bg_color = "#ecfdf5"
        border_color = "#a7f3d0"
        text_color = "#065f46"
    elif status == 'Reviewed':
        header_color = "linear-gradient(135deg,#3B82F6,#60A5FA)"
        bg_color = "#eff6ff"
        border_color = "#bfdbfe"
        text_color = "#1e40af"
    elif status == 'Dismissed':
        header_color = "linear-gradient(135deg,#6B7280,#9CA3AF)"
        bg_color = "#f3f4f6"
        border_color = "#d1d5db"
        text_color = "#374151"
    else:
        header_color = "linear-gradient(135deg,#F59E0B,#FBBF24)"
        bg_color = "#fffbeb"
        border_color = "#fde68a"
        text_color = "#92400e"
    
    if user_type == 'reporter':
        title = f"Your Report Has Been {status}"
        intro = f"Your report against {safe_other_party} has been {status.lower()} by our admin team."
    else:
        title = f"Report Against You: {status}"
        intro = f"A report has been filed against you by {safe_other_party} and has been {status.lower()} by our admin team."
    
    return f"""
    <div style="background:#f6f7fb;padding:24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="background:#ffffff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,0.06);overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111;">
              <tr>
                <td style="padding:28px;background:{header_color};color:#fff;">
                  <h1 style="margin:0;font-size:22px;letter-spacing:.3px;">E‑Baby Report Update</h1>
                  <p style="margin:6px 0 0 0;font-size:13px;opacity:.95;">{title}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px 8px 28px;">
                  <p style="margin:0 0 10px 0;font-size:15px;">Hello {user_name or 'there'},</p>
                  <p style="margin:0 0 14px 0;font-size:15px;">{intro}</p>
                  <div style="margin:18px 0;padding:14px;border-radius:12px;background:{bg_color};border:1px solid {border_color};color:{text_color};">
                    <p style="margin:0 0 8px 0;"><strong>Report Reason:</strong> {safe_reason}</p>
                    <p style="margin:8px 0 8px 0;"><strong>Admin Action:</strong> {safe_admin_action}</p>
                    <p style="margin:8px 0 0 0;"><strong>Admin Notes:</strong> {safe_admin_notes}</p>
                  </div>
                  <p style="margin:14px 0 0 0;font-size:13px;color:#555;">If you have any questions or concerns, please contact our support team.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 28px 24px 28px;color:#777;font-size:12px;border-top:1px solid #EEF2FF;">
                  <p style="margin:0;">© {datetime.now().year} E‑Baby • Support: e-baby0@gmail.com</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    """

# MySQL connection settings
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
    conn.close()

@app.route('/')
def home():
    # Redirect to homepage or render it directly with products
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch featured products (random 8-10 products for variety)
        cursor.execute('''
            SELECT p.*, u.first_name, u.last_name, u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_email = u.email
            ORDER BY RAND() LIMIT 10
        ''')
        featured_products = cursor.fetchall()
        
        # Convert price to float
        for product in featured_products:
            product['price'] = float(product['price'])
        
        # Fetch new arrivals (products from last 30 days)
        cursor.execute('''
            SELECT p.*, u.first_name, u.last_name, u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_email = u.email
            WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY p.created_at DESC
        ''')
        
        new_arrivals = cursor.fetchall()
        
        # Convert price to float
        for product in new_arrivals:
            product['price'] = float(product['price'])
        
        cursor.close()
        conn.close()
        
        return render_template('homepage.html', 
                             featured_products=featured_products if featured_products else [],
                             new_arrivals=new_arrivals if new_arrivals else [],
                             now=datetime.now())
                             
    except Exception as e:
        print("Error in home route:", str(e))
        import traceback
        traceback.print_exc()
        return render_template('homepage.html', 
                             featured_products=[],
                             new_arrivals=[],
                             now=datetime.now())

@app.route('/api/debug/products')
def debug_products():
    """Debug endpoint to check products in database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check total products
        cursor.execute('SELECT COUNT(*) as count FROM products')
        total = cursor.fetchone()['count']
        
        # Check products with seller info
        cursor.execute('''
            SELECT COUNT(*) as count FROM products p
            JOIN users u ON p.seller_email = u.email
        ''')
        with_seller = cursor.fetchone()['count']
        
        # Get a sample
        cursor.execute('''
            SELECT p.id, p.name, p.seller_email, u.first_name, u.last_name
            FROM products p
            LEFT JOIN users u ON p.seller_email = u.email
            LIMIT 5
        ''')
        samples = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'total_products': total,
            'products_with_seller': with_seller,
            'samples': samples
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/products')
def api_products():
    """API endpoint to get all products for search dropdown"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('''
            SELECT DISTINCT p.id, p.name, p.price, p.category, p.image, p.seller_email
            FROM products p
            INNER JOIN product_variants pv ON p.id = pv.product_id
            WHERE pv.stock > 0
            ORDER BY p.name ASC
            LIMIT 500
        ''')
        
        products = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')

@app.route('/auth')
def auth():
    return render_template('auth.html')

@app.route('/backtologin', methods=['GET', 'POST'])
def backtologin():
    return render_template('auth.html')

@app.route('/logout', methods=['POST'])
def logout():
    try:
        session.clear()  # Clear all session data
        return jsonify({'success': True, 'redirect': url_for('homepage')})
    except Exception as e:
        print("Logout error:", str(e))
        return jsonify({'success': False, 'message': str(e)})

#=====================================================================================================================
                                    #REGISTRATION HANDLER
#=====================================================================================================================

@app.route('/register', methods=['POST'])
def register():
    first_name = request.form['first_name']
    last_name = request.form['last_name']
    email = request.form['email']
    phone_number = request.form['phone_number']
    
    # Handle new address structure
    country = request.form.get('country', 'Philippines')
    region = request.form.get('region', '')
    province = request.form.get('province', '')
    city = request.form.get('city', '')
    street_address = request.form.get('street_address', '')
    
    # Build complete address from components
    address_parts = []
    if street_address:
        address_parts.append(street_address)
    if city:
        address_parts.append(city)
    if province:
        address_parts.append(province)
    if region:
        address_parts.append(region)
    if country:
        address_parts.append(country)
    
    address = ', '.join(address_parts) if address_parts else request.form.get('address', '')
    
    password = request.form['password']
    confirm_password = request.form['confirm_password']
    user_type = request.form['user_type']

    # Validate phone number: It must be 10 digits long
    if not phone_number.isdigit() or len(phone_number) != 10:
        return render_template('auth.html', error="Phone number must be exactly 10 digits.")

    # Check if the email already exists in the database
    try:
        db = get_db_connection()
        cursor = db.cursor()
        cursor.execute('''SELECT COUNT(*) FROM (
                            SELECT email FROM users 
                            UNION 
                            SELECT email FROM seller_requests
                            UNION
                            SELECT email FROM rider_requests
                            UNION
                            SELECT email FROM buyer_requests
                          ) AS combined_emails 
                          WHERE email = %s''', (email,))
        email_exists = cursor.fetchone()[0] > 0
        cursor.close()
        db.close()

        if email_exists:
            return render_template('auth.html', error="Email already registered! Please use another email.")

    except mysql.connector.Error as err:
        flash(f"Database error: {err}", 'error')

    # Check password confirmation
    if password != confirm_password:
        return render_template('auth.html', error="Passwords do not match!")

    # Handle documents for all user types (Buyer, Seller, Rider)
    document_filename = None
    bir_filename = None
    
    # ID document is now required for all user types
    document = request.files.get('document_id')
    
    if not document or document.filename == '':
        return render_template('auth.html', error="Please upload a valid ID document.")
    
    # Save the document
    document_filename = secure_filename(document.filename)
    requirements_folder = os.path.join(app.root_path, 'static', 'requirements')
    os.makedirs(requirements_folder, exist_ok=True)
    document.save(os.path.join(requirements_folder, document_filename))
    
    # Only require BIR document for sellers
    if user_type == 'Seller':
        bir = request.files.get('bir')
        if not bir or bir.filename == '':
            return render_template('auth.html', error="Please upload a BIR document.")
        
        bir_filename = secure_filename(bir.filename)
        bir.save(os.path.join(requirements_folder, bir_filename))

    # Store registration data in session
    session['registration_data'] = {
        'first_name': first_name,
        'last_name': last_name,
        'phone_number': phone_number,
        'address': address,
        'password': password,
        'user_type': user_type,
        'document_id': document_filename,
        'bir': bir_filename
    }

    # Generate and send OTP
    otp = randint(100000, 999999)
    session['otp'] = otp
    session['email'] = email

    try:
        msg = Message(subject='Your E‑Baby OTP Code', sender='e-baby0@gmail.com', recipients=[email])
        # Plain-text fallback
        msg.body = (
            f"Hello {first_name},\n\n"
            f"Your One‑Time Password (OTP) is: {otp}\n"
            "It will expire shortly. If you didn't request this, you can ignore this email."
        )
        # HTML version for rich email clients
        msg.html = build_otp_email_html(otp, first_name)
        mail.send(msg)
        flash('OTP sent! Please check your email for the verification code.', 'info')
        return redirect(url_for('otp_verification'))
    except Exception as e:
        print(f"Error sending email: {e}")  # For debugging
        return render_template('auth.html', error="Error sending OTP email. Please try again.")
    
@app.route('/register')
def register_page():
    return render_template('auth.html')

@app.route('/login')
def login_page():
    return render_template('auth.html')

#=====================================================================================================================
                                    #OTP VERIFICATION HANDLER
#=====================================================================================================================  
    
@app.route('/otp_verification', methods=['GET', 'POST'])
def otp_verification():
    if request.method == 'POST':
        user_otp = request.get_json().get('otp')

        if 'otp' in session and int(user_otp) == session['otp']:
            registration_data = session.get('registration_data')
            if registration_data:
                try:
                    db = get_db_connection()
                    cursor = db.cursor()
                    
                    if registration_data['user_type'] == 'Seller':
                        # Insert into seller_requests table
                        cursor.execute('''INSERT INTO seller_requests 
                            (first_name, last_name, email, phone_number, address, password, user_type, document_id, bir)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                            (registration_data['first_name'], registration_data['last_name'], 
                             session['email'], registration_data['phone_number'], 
                             registration_data['address'], registration_data['password'],
                             registration_data['user_type'], registration_data['document_id'], registration_data['bir']))
                        db.commit()
                        response_data = {'success': True, 'message': 'Your account is pending approval by the admin.'}
                    elif registration_data['user_type'] == 'Rider':
                        # Insert into rider_requests table
                        cursor.execute('''INSERT INTO rider_requests 
                            (first_name, last_name, email, phone_number, address, password, user_type, document_id)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
                            (registration_data['first_name'], registration_data['last_name'], 
                             session['email'], registration_data['phone_number'], 
                             registration_data['address'], registration_data['password'],
                             registration_data['user_type'], registration_data['document_id']))
                        db.commit()
                        response_data = {'success': True, 'message': 'Your account is pending approval by the admin.'}
                    else:
                        # Insert into buyer_requests table for buyers (now requires approval)
                        cursor.execute('''INSERT INTO buyer_requests 
                            (first_name, last_name, email, phone_number, address, password, user_type, document_id)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
                            (registration_data['first_name'], registration_data['last_name'], 
                             session['email'], registration_data['phone_number'], 
                             registration_data['address'], registration_data['password'],
                             registration_data['user_type'], registration_data['document_id']))
                        db.commit()
                        response_data = {'success': True, 'message': 'Your account is pending approval by the admin.'}
                    
                    cursor.close()
                    db.close()

                    # Clear the registration data from the session
                    session.pop('registration_data', None)

                except mysql.connector.Error as err:
                    response_data = {'success': False, 'error': f"Error: {err}"}
                    return jsonify(response_data)

            return jsonify(response_data)
        else:
            return jsonify(success=False, error="Invalid OTP")

    return render_template('otp_verification.html')

@app.route('/resend_otp', methods=['POST'])
def resend_otp():
    """Resend OTP code to the user's email"""
    # Check if email and registration data exist in session
    email = session.get('email')
    registration_data = session.get('registration_data')
    
    if not email:
        return jsonify({'success': False, 'error': 'No email found in session. Please register again.'})
    
    if not registration_data:
        return jsonify({'success': False, 'error': 'No registration data found. Please register again.'})
    
    try:
        # Generate new OTP
        new_otp = randint(100000, 999999)
        session['otp'] = new_otp
        
        # Get first name from registration data
        first_name = registration_data.get('first_name', 'User')
        
        # Send OTP email
        msg = Message(
            subject='Your E‑Baby OTP Code (Resent)',
            sender='e-baby0@gmail.com',
            recipients=[email]
        )
        # Plain-text fallback
        msg.body = (
            f"Hello {first_name},\n\n"
            f"Your One‑Time Password (OTP) is: {new_otp}\n"
            "It will expire shortly. If you didn't request this, you can ignore this email."
        )
        # HTML version for rich email clients
        msg.html = build_otp_email_html(new_otp, first_name)
        mail.send(msg)
        
        return jsonify({
            'success': True,
            'message': 'New OTP code has been sent to your email. Please check your inbox.'
        })
    except Exception as e:
        print(f"Error resending OTP email: {e}")
        return jsonify({
            'success': False,
            'error': 'Error sending OTP email. Please try again.'
        })

#=====================================================================================================================
                                            #LOGIN HANDLER
#=====================================================================================================================

@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']

    # Check for admin credentials
    if email == 'admin@gmail.com' and password == 'admin':
        session['user_id'] = 0
        session['user_type'] = 'Admin'
        session['email'] = email
        return redirect(url_for('admin_dashboard'))

    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        # First check if the email exists in seller_requests
        cursor.execute('SELECT * FROM seller_requests WHERE email = %s AND password = %s', (email, password))
        seller_request = cursor.fetchone()
        
        if seller_request:
            cursor.close()
            db.close()
            flash('Your account is pending approval. Please wait for admin approval before logging in.', 'error')
            return redirect(url_for('login_page'))
        
        # Check if the email exists in rider_requests
        cursor.execute('SELECT * FROM rider_requests WHERE email = %s AND password = %s', (email, password))
        rider_request = cursor.fetchone()
        
        if rider_request:
            cursor.close()
            db.close()
            flash('Your account is pending approval. Please wait for admin approval before logging in.', 'error')
            return redirect(url_for('login_page'))
        
        # Check if the email exists in buyer_requests
        cursor.execute('SELECT * FROM buyer_requests WHERE email = %s AND password = %s', (email, password))
        buyer_request = cursor.fetchone()
        
        if buyer_request:
            cursor.close()
            db.close()
            flash('Your account is pending approval. Please wait for admin approval before logging in.', 'error')
            return redirect(url_for('login_page'))

        # If not in seller_requests, check regular users table
        cursor.execute('SELECT * FROM users WHERE email = %s AND password = %s', (email, password))
        user = cursor.fetchone()
        
        cursor.close()
        db.close()

        if user:
            # Check if account is banned
            if user[11] == 'banned':  # status column index
                session['banned_email'] = email
                session['banned_reason'] = user[12]  # ban_reason column index
                return redirect(url_for('banned_account'))
            
            session['user_id'] = user[0]
            session['user_type'] = user[7]
            session['email'] = email
            session['address'] = user[6]
            session['profile_pic'] = user[10] if user[10] else None  # profile_pic column index

            if session['user_type'] == 'Buyer':
                return redirect(url_for('homepage'))
            elif session['user_type'] == 'Seller':
                return redirect(url_for('seller_dashboard'))
            elif session['user_type'] == 'Rider':
                return redirect(url_for('rider_dashboard'))
        else:
            flash('Email or Password is incorrect!', 'error')
            return render_template('auth.html', error='Email or Password is incorrect!')

    except mysql.connector.Error as err:
        flash(f"Error: {err}", 'error')
        return render_template('auth.html', error=f"Database error: {err}")

#=====================================================================================================================
                                    #FORGOT PASSWORD HANDLER
#=====================================================================================================================

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        if 'email' in request.form:
            email = request.form['email']
            user = get_user_by_email(email)

            if user:
                # Generate a password reset code
                reset_code = randint(100000, 999999)

                # Send the reset email
                msg = Message(
                    subject="Password Reset Request",
                    sender=app.config["MAIL_USERNAME"],
                    recipients=[email]
                )
                msg.body = f"Hello, {user['first_name']}!\n\nTo reset your password, please use the following code:\n\n{reset_code}\n\nIf you didn't request this, please ignore this email."
                mail.send(msg)

                # Store the reset code and email in the session
                session['reset_code'] = reset_code
                session['user_email'] = email

                flash("A password reset email has been sent to your email address.", "success")
                return render_template('forgot_password.html', email_sent=True)

            else:
                flash("Email not found. Please check and try again.", "error")
                return redirect(url_for('forgot_password'))
        
        elif 'reset_code' in request.form:
            entered_code = request.form['reset_code']
            new_password = request.form['new_password']
            confirm_password = request.form['confirm_password']

            # Verify the reset code
            if entered_code == str(session.get('reset_code')):
                if new_password == confirm_password:
                    # Update password in database
                    update_password_in_db(session['user_email'], new_password)

                    flash("Your password has been reset successfully!", "success")
                    return redirect(url_for('home'))
                else:
                    flash("Passwords do not match. Please try again.", "error")
                    return redirect(url_for('forgot_password'))
            else:
                flash("Invalid reset code. Please try again.", "error")
                return redirect(url_for('forgot_password'))

    return render_template('forgot_password.html')



#=====================================================================================================================
                                    #HOMEPAGE ROUTES
#=====================================================================================================================

@app.route('/homepage')
def homepage():
    print("Session data:", session)  # Debug print
    print("Profile pic path:", session.get('profile_pic'))  # Debug print
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch featured products (random 8-10 products for variety)
        cursor.execute('''
            SELECT p.*, u.first_name, u.last_name, u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_email = u.email
            ORDER BY RAND() LIMIT 10
        ''')
        featured_products = cursor.fetchall()
        print(f"Featured products count: {len(featured_products) if featured_products else 0}")
        
        # Convert price to float
        for product in featured_products:
            product['price'] = float(product['price'])
        
        # Fetch new arrivals (products from last 30 days)
        cursor.execute('''
            SELECT p.*, u.first_name, u.last_name, u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_email = u.email
            WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY p.created_at DESC
        ''')
        
        new_arrivals = cursor.fetchall()
        print(f"New arrivals count: {len(new_arrivals) if new_arrivals else 0}")
        
        # Convert price to float
        for product in new_arrivals:
            product['price'] = float(product['price'])
        
        cursor.close()
        conn.close()
        
        print(f"Rendering homepage with {len(featured_products or [])} featured and {len(new_arrivals or [])} new arrivals")
        
        return render_template('homepage.html', 
                             featured_products=featured_products if featured_products else [],
                             new_arrivals=new_arrivals if new_arrivals else [],
                             now=datetime.now())
                             
    except Exception as e:
        print("Error in homepage route:", str(e))
        import traceback
        traceback.print_exc()
        return render_template('homepage.html', 
                             featured_products=[],
                             new_arrivals=[],
                             now=datetime.now())


@app.route('/featured_product')
def featured_product():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch random products with seller info
        cursor.execute('''
            SELECT p.*, u.first_name, u.last_name, u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_email = u.email
            ORDER BY RAND() LIMIT 6
        ''')
        products = cursor.fetchall()
        
        # Convert price to float
        for product in products:
            product['price'] = float(product['price'])
        
        cursor.close()
        conn.close()
        
        return render_template('featured_products.html', products=products)
                             
    except Exception as e:
        print("Error in featured_product route:", str(e))
        return render_template('featured_products.html', products=[])
    
@app.route('/new_arrivals')
def new_arrivals():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get products with seller information
        cursor.execute('''
            SELECT p.*, u.first_name, u.last_name, u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_email = u.email
            WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY u.first_name, u.last_name, p.created_at DESC
        ''')
        
        all_products = cursor.fetchall()
        
        # Group products by seller
        sellers_products = {}
        for product in all_products:
            seller_name = f"{product['first_name']} {product['last_name']}"
            if seller_name not in sellers_products:
                sellers_products[seller_name] = []
            sellers_products[seller_name].append(product)
        
        cursor.close()
        conn.close()
        
        return render_template('new_arrivals.html', 
                             sellers_products=sellers_products,
                             category_name="New Arrivals")
                             
    except Exception as e:
        print("Database Error:", str(e))
        return render_template('new_arrivals.html', 
                             sellers_products={},
                             category_name="New Arrivals")

def _render_category(category_db_value, category_display_name):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute('''
        SELECT 
            p.*,
            u.first_name as seller_first_name,
            u.last_name as seller_last_name
        FROM products p 
        JOIN users u ON p.seller_email = u.email 
        WHERE p.category = %s
    ''', (category_db_value,))
    products = cursor.fetchall()
    for product in products:
        product['price'] = float(product['price']) if product['price'] else 0.0
    sellers = {}
    for product in products:
        if product['seller_email'] not in sellers:
            sellers[product['seller_email']] = []
        sellers[product['seller_email']].append(product)
    cursor.close()
    connection.close()
    return render_template('category_template.html', 
                         category_name=category_display_name, 
                         products=products,
                         sellers=sellers)

@app.route('/baby')
def category_baby():
    return _render_category('Baby Clothes & Accessories', 'Baby Clothes & Accessories')

@app.route('/toys')
def category_toys():
    return _render_category('Toys & Games', 'Toys & Games')

@app.route('/educational')
def category_educational():
    return _render_category('Educational Materials', 'Educational Materials')

@app.route('/strollers')
def category_strollers():
    return _render_category('Strollers & Gear', 'Strollers & Gear')

@app.route('/nursery')
def category_nursery():
    return _render_category('Nursery Furniture', 'Nursery Furniture')

@app.route('/safety')
def category_safety():
    return _render_category('Safety and Health', 'Safety and Health')


@app.route('/get_featured_sellers')
def get_featured_sellers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT first_name, last_name, email, address, profile_pic, banner_image 
        FROM users 
        WHERE user_type = 'Seller'
        LIMIT 6
    """)
    sellers = cursor.fetchall()
    cursor.close()
    conn.close()

    # Process the image paths
    for seller in sellers:
        if seller['profile_pic']:
            seller['profile_pic'] = url_for('static', filename=seller['profile_pic'])
        else:
            seller['profile_pic'] = url_for('static', filename='images/default_profile.png')
            
        if seller['banner_image']:
            seller['banner_image'] = url_for('static', filename=seller['banner_image'])
        else:
            seller['banner_image'] = url_for('static', filename='images/default_banner.jpg')

    return jsonify(sellers)

#=====================================================================================================================
                                    #PROFILE MANAGEMENT
#=====================================================================================================================

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if 'email' not in session:
        return redirect(url_for('login'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'POST':
        # Handle profile update logic
        first_name = request.form['first_name']
        last_name = request.form['last_name']
        email = request.form['email']
        phone_number = request.form['phone_number']
        address = request.form['address']
        
        try:
            cursor.execute(
                """
                UPDATE users 
                SET first_name = %s, last_name = %s, email = %s, phone_number = %s, address = %s
                WHERE email = %s
                """,
                (first_name, last_name, email, phone_number, address, session['email'])
            )
            conn.commit()
            flash('Profile updated successfully!', 'success')
            
            if email != session['email']:
                session['email'] = email
                
        except mysql.connector.Error as err:
            flash(f"Error updating profile: {err}", 'error')
    
    # Fetch user data
    cursor.execute('SELECT * FROM users WHERE email = %s', (session['email'],))
    user_data = cursor.fetchone()
    
    if user_data:
        # Update image paths to use url_for with forward slashes
        if user_data['profile_pic']:
            user_data['profile_pic'] = url_for('static', filename=user_data['profile_pic'].replace('\\', '/'))
        if user_data['banner_image']:
            user_data['banner_image'] = url_for('static', filename=user_data['banner_image'].replace('\\', '/'))
    
    cursor.close()
    conn.close()
    
    return render_template('profile.html', user_data=user_data)

@app.route('/change-password', methods=['GET', 'POST'])
def change_password():
    # Check if user is logged in
    user_id = session.get('user_id')
    if user_id is None:
        flash('You need to log in to change your password.', 'error')
        return redirect(url_for('home'))  # Redirect to home if not logged in

    if request.method == 'POST':
        old_password = request.form['old_password']
        new_password = request.form['new_password']
        confirm_password = request.form['confirm_password']

        if new_password != confirm_password:
            flash('New password and confirm password do not match.', 'error')
            return redirect(url_for('change_password'))

        try:
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)

            # Verify old password
            cursor.execute("SELECT password FROM users WHERE id = %s", (user_id,))
            user_data = cursor.fetchone()

            if user_data is None or user_data['password'] != old_password:
                flash('Incorrect old password.', 'error')
                return redirect(url_for('change_password'))

            # Update the password
            cursor.execute(
                "UPDATE users SET password = %s WHERE id = %s",
                (new_password, user_id)
            )
            connection.commit()
            flash('Password updated successfully!', 'success')
            
            # Redirect to profile after successful password update
            return redirect(url_for('profile'))

        except mysql.connector.Error as err:
            flash(f"Error updating password: {err}", 'error')
        finally:
            cursor.close()
            connection.close()

    return render_template('change_password.html')

@app.route('/check-old-password', methods=['POST'])
def check_old_password():
    user_id = session.get('user_id')
    if user_id is None:
        return jsonify(valid=False), 401  # User not logged in

    data = request.get_json()
    old_password = data.get("old_password")

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Fetch the stored password for comparison
        cursor.execute("SELECT password FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()
        
        if user_data and user_data['password'] == old_password:
            return jsonify(valid=True)  # Password matches
        else:
            return jsonify(valid=False)  # Password does not match

    except mysql.connector.Error as err:
        print("Database error:", err)
        return jsonify(valid=False), 500

    finally:
        cursor.close()
        connection.close()

@app.route('/update_address', methods=['POST'])
def update_address():
    try:
        data = request.get_json()
        new_address = data.get('address')
        user_email = session.get('email')

        if not user_email:
            return jsonify({'success': False, 'error': 'Not logged in'}), 401

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "UPDATE users SET address = %s WHERE email = %s",
            (new_address, user_email)
        )
        
        connection.commit()
        session['address'] = new_address
        
        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

#=====================================================================================================================
                                    #SELLER DASHBOARD
#=====================================================================================================================  

# Removed old seller and rider page routes - now using unified dashboard

@app.route('/seller_maindash')
def seller_maindash_redirect():
    """Redirect old seller_maindash route to unified seller_dashboard"""
    return redirect(url_for('seller_dashboard'))

@app.route('/api/sales_data')
def get_sales_data():
    user_email = session.get('email')
    period = request.args.get('period', 'week')  # Default to week
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Adjust query based on period
    if period == 'week':
        date_filter = "AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    elif period == 'month':
        date_filter = "AND date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)"
    else:  # year
        date_filter = "AND date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)"
    
    query = f"""
        SELECT DATE(date) as date, SUM(total_price) as sales
        FROM orders
        WHERE seller_email = %s AND status = 'Received' {date_filter}
        GROUP BY DATE(date)
        ORDER BY date
    """
    
    cursor.execute(query, (user_email,))
    data = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify([{
        'date': item['date'].strftime('%b %d'),
        'sales': float(item['sales'])
    } for item in data])

@app.route('/api/product_performance')
def get_product_performance():
    user_email = session.get('email')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT p.name, SUM(o.quantity) as total_sold
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.seller_email = %s AND o.status = 'Received'
        GROUP BY p.name
        ORDER BY total_sold DESC
        LIMIT 5
    """
    
    cursor.execute(query, (user_email,))
    data = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'products': [item['name'] for item in data],
        'sales': [int(item['total_sold']) for item in data]
    })

@app.route('/api/seller_stats')
def get_seller_stats():
    user_email = session.get('email')
    period = request.args.get('period', 'all')  # today, week, month, all
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Build date filter based on period
    date_filter = ""
    if period == 'today':
        date_filter = "AND DATE(date) = CURDATE()"
    elif period == 'week':
        date_filter = "AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    elif period == 'month':
        date_filter = "AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
    
    # Get total sales and items (seller gets 95% after tax)
    # Use subtotal if available, otherwise calculate from total_price
    cursor.execute(f"""
        SELECT 
            COALESCE(SUM(COALESCE(subtotal, total_price * 0.95)), 0) * 0.95 as total_sales,
            COALESCE(SUM(CAST(quantity AS INT)), 0) as total_items,
            COALESCE(COUNT(*), 0) as total_orders
        FROM orders
        WHERE seller_email = %s AND status = 'Received' {date_filter}
    """, (user_email,))
    
    result = cursor.fetchone()
    
    # Get pending orders count
    cursor.execute(f"""
        SELECT COUNT(*) as pending_orders
        FROM orders
        WHERE seller_email = %s AND status != 'Received' {date_filter}
    """, (user_email,))
    
    pending = cursor.fetchone()
    
    # Get hourly/daily sales data for chart based on period
    if period == 'today':
        # For today, show hourly data
        cursor.execute(f"""
            SELECT 
                HOUR(date) as hour_num,
                CONCAT(LPAD(HOUR(date), 2, '0'), ':00') as sale_date,
                COALESCE(SUM(COALESCE(subtotal, total_price * 0.95)), 0) * 0.95 as daily_sales,
                COALESCE(SUM(CAST(quantity AS INT)), 0) as daily_items
            FROM orders
            WHERE seller_email = %s AND status = 'Received' AND DATE(date) = CURDATE()
            GROUP BY HOUR(date)
            ORDER BY hour_num ASC
        """, (user_email,))
    else:
        # For week/month, show daily data
        cursor.execute(f"""
            SELECT 
                DATE(date) as sale_date,
                COALESCE(SUM(COALESCE(subtotal, total_price * 0.95)), 0) * 0.95 as daily_sales,
                COALESCE(SUM(CAST(quantity AS INT)), 0) as daily_items
            FROM orders
            WHERE seller_email = %s AND status = 'Received' {date_filter}
            GROUP BY DATE(date)
            ORDER BY sale_date ASC
        """, (user_email,))
    
    daily_data = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'total_sales': format(float(result['total_sales'] or 0), '.2f'),
        'total_items': int(result['total_items'] or 0),
        'total_orders': int(result['total_orders'] or 0),
        'pending_orders': int(pending['pending_orders'] or 0),
        'daily_data': daily_data
    })

@app.route('/api/admin_tax_stats')
def get_admin_tax_stats():
    """Get admin tax revenue statistics"""
    if session.get('user_type') != 'Admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    period = request.args.get('period', 'all')  # today, week, month, all
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Build date filter based on period
    date_filter = ""
    if period == 'today':
        date_filter = "AND DATE(date) = CURDATE()"
    elif period == 'week':
        date_filter = "AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    elif period == 'month':
        date_filter = "AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
    
    # Get total tax revenue (admin's income)
    # Use tax column if available, otherwise calculate 2.5% of subtotal
    cursor.execute(f"""
        SELECT 
            COALESCE(SUM(COALESCE(tax, COALESCE(subtotal, total_price) * 0.025)), 0) as total_tax,
            COALESCE(COUNT(*), 0) as total_orders,
            COALESCE(SUM(COALESCE(subtotal, total_price)), 0) as total_subtotal,
            COALESCE(SUM(COALESCE(shipping_fee, 38.00)), 0) as total_shipping
        FROM orders
        WHERE status = 'Received' {date_filter}
    """)
    
    result = cursor.fetchone()
    
    # Get daily tax data for chart
    cursor.execute(f"""
        SELECT 
            DATE(date) as tax_date,
            COALESCE(SUM(COALESCE(tax, COALESCE(subtotal, total_price) * 0.025)), 0) as daily_tax,
            COALESCE(COUNT(*), 0) as daily_orders
        FROM orders
        WHERE status = 'Received' {date_filter}
        GROUP BY DATE(date)
        ORDER BY tax_date ASC
    """)
    
    daily_data = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'total_tax': format(float(result['total_tax'] or 0), '.2f'),
        'total_orders': int(result['total_orders'] or 0),
        'total_subtotal': format(float(result['total_subtotal'] or 0), '.2f'),
        'total_shipping': format(float(result['total_shipping'] or 0), '.2f'),
        'daily_data': daily_data
    })


#=====================================================================================================================
                                    #UNIFIED DASHBOARD ROUTES
#=====================================================================================================================

@app.route('/seller_dashboard')
def seller_dashboard():
    # Get the email of the logged-in seller
    user_email = session.get('email')
    
    # Get the date range from query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Connect to the database
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Base query for sales data
    query = """
        SELECT 
            DATE(date) AS sale_date,
            SUM(total_price) AS total_sales,
            SUM(CAST(quantity AS INT)) AS total_items_sold
        FROM orders
        WHERE seller_email = %s 
          AND status = 'Received'
    """
    params = [user_email]

    # Add date range filter if specified
    if start_date and end_date:
        query += " AND DATE(date) BETWEEN %s AND %s"
        params.extend([start_date, end_date])
    
    query += " GROUP BY sale_date ORDER BY sale_date"
    
    cursor.execute(query, tuple(params))
    sales_data = cursor.fetchall()

    # Query to get total sales and number of items sold
    query = """
        SELECT 
            SUM(total_price) AS total_sales,
            SUM(CAST(quantity AS INT)) AS total_items
        FROM orders
        WHERE seller_email = %s AND status = 'Received'
    """
    params = [user_email]
    if start_date and end_date:
        query += " AND DATE(date) BETWEEN %s AND %s"
        params.extend([start_date, end_date])
    
    cursor.execute(query, tuple(params))
    result = cursor.fetchone()

    # Calculate total sales after 5% fee and format to 2 decimal places
    total_sales_after_fee = format(float(result['total_sales']) * 0.95, ".2f") if result and result['total_sales'] else "0.00"
    total_items_sold = result['total_items'] if result and result['total_items'] else 0

    # Query to get the count of pending orders (excluding cancelled)
    cursor.execute("""
        SELECT COUNT(*) AS pending_orders
        FROM orders
        WHERE seller_email = %s AND status != 'Received' AND status != 'Cancelled'
    """, (user_email,))
    
    # Fetch the pending orders count
    pending_result = cursor.fetchone()
    pending_orders = pending_result['pending_orders'] if pending_result else 0

    # Get products for the seller with sales count from orders table and stock from variants
    cursor.execute("""
        SELECT p.*,
               COALESCE(SUM(o.quantity), 0) AS received_orders,
               (SELECT COALESCE(SUM(stock), 0) FROM product_variants WHERE product_id = p.id) AS total_stock
        FROM products p
        LEFT JOIN orders o ON p.id = o.product_id AND o.seller_email = %s AND o.status = 'Received'
        WHERE p.seller_email = %s
        GROUP BY p.id
        ORDER BY p.id DESC
    """, (user_email, user_email))
    products = cursor.fetchall()

    # Get orders for the seller (including cancelled orders so seller can see them)
    cursor.execute("""
        SELECT * FROM orders
        WHERE seller_email = %s
        ORDER BY date DESC
    """, (user_email,))
    orders = cursor.fetchall()

    # Get recent orders (last 5) - including cancelled orders
    cursor.execute("""
        SELECT id as order_id, name as product_name, email as customer_name, 
               total_price as amount, status, date, image, cancellation_reason
        FROM orders
        WHERE seller_email = %s
        ORDER BY date DESC
        LIMIT 5
    """, (user_email,))
    recent_orders = cursor.fetchall()

    # Get categories for filter
    cursor.execute("SELECT DISTINCT category FROM products WHERE seller_email = %s", (user_email,))
    categories = [row['category'] for row in cursor.fetchall()]

    # Close the database connection
    cursor.close()
    conn.close()

    # Pass the data to the template
    return render_template('seller_dashboard.html', 
                         total_sales=total_sales_after_fee, 
                         total_items=total_items_sold,
                         pending_orders=pending_orders,
                         products=products,
                         orders=orders,
                         recent_orders=recent_orders,
                         categories=categories,
                         sales_data=sales_data,
                         start_date=start_date,
                         end_date=end_date)

@app.route('/admin_dashboard')
def admin_dashboard():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    # Get user counts (excluding admin)
    cursor.execute("""
        SELECT user_type, COUNT(*) as count 
        FROM users 
        WHERE user_type != 'Admin' 
        GROUP BY user_type
    """)
    user_counts = cursor.fetchall()

    total_buyers = 0
    total_sellers = 0
    total_riders = 0

    for user_count in user_counts:
        if user_count['user_type'] == 'Buyer':
            total_buyers = user_count['count']
        elif user_count['user_type'] == 'Seller':
            total_sellers = user_count['count']
        elif user_count['user_type'] == 'Rider':
            total_riders = user_count['count']

    # Get all users for user management
    cursor.execute("""
        SELECT * FROM users 
        WHERE user_type != 'Admin' 
        ORDER BY id DESC
    """)
    users = cursor.fetchall()

    # Get pending registration requests
    cursor.execute("SELECT * FROM seller_requests WHERE status = 'Pending'")
    seller_requests = cursor.fetchall()
    
    cursor.execute("SELECT * FROM rider_requests WHERE status = 'Pending'")
    rider_requests = cursor.fetchall()
    
    cursor.execute("SELECT * FROM buyer_requests WHERE status = 'Pending'")
    buyer_requests = cursor.fetchall()
    
    pending_registrations = seller_requests + rider_requests + buyer_requests
    pending_requests = len(pending_registrations)

    # Get all sellers with their products
    cursor.execute("SELECT * FROM users WHERE user_type = 'Seller' ORDER BY id DESC")
    sellers = cursor.fetchall()
    for s in sellers:
        cursor.execute('SELECT * FROM products WHERE seller_email = %s ORDER BY id DESC', (s['email'],))
        s['products'] = cursor.fetchall()

    cursor.close()
    connection.close()

    return render_template('admin_dashboard.html', 
                         total_buyers=total_buyers, 
                         total_sellers=total_sellers,
                         total_riders=total_riders,
                         users=users,
                         pending_registrations=pending_registrations,
                         pending_requests=pending_requests,
                         sellers=sellers)

@app.route('/rider_dashboard')
def rider_dashboard():
    user_email = session.get('email')
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    # Get rider's total deliveries (completed orders assigned to them)
    cursor.execute("""
        SELECT COUNT(*) as total_deliveries
        FROM orders 
        WHERE rider_email = %s AND status = 'Received'
    """, (user_email,))
    total_deliveries = cursor.fetchone()['total_deliveries'] or 0
    
    # Get pending orders (all prepared orders available for pickup)
    cursor.execute("""
        SELECT COUNT(*) as pending_orders
        FROM orders 
        WHERE status = 'Prepared'
    """)
    pending_orders = cursor.fetchone()['pending_orders'] or 0
    
    # Get total earnings from rider_earnings table
    cursor.execute("""
        SELECT COALESCE(SUM(amount), 0) as total_earnings
        FROM rider_earnings
        WHERE rider_email = %s AND status = 'Completed'
    """, (user_email,))
    earnings_result = cursor.fetchone()
    total_earnings = float(earnings_result['total_earnings']) if earnings_result else 0
    
    # Customer rating (placeholder - could be added later)
    customer_rating = 5.0
    
    # Get available orders (orders that are 'Prepared' - ready for pickup)
    cursor.execute("""
        SELECT *, seller_email
        FROM orders
        WHERE status = 'Prepared'
        ORDER BY date ASC
    """)
    orders = cursor.fetchall()
    
    # Get rider's current deliveries (orders in 'Shipping' status)
    cursor.execute("""
        SELECT o.id as order_id, o.name as product_name, o.email as customer_name,
               'Store Location' as pickup_location, o.delivery_address,
               o.status, o.image, o.date,
               CASE 
                 WHEN o.total_price >= 1500 THEN 20
                 ELSE 10
               END as earnings
        FROM orders o
        WHERE o.rider_email = %s AND o.status = 'Shipping'
        ORDER BY o.date DESC
    """, (user_email,))
    my_deliveries = cursor.fetchall()
    
    # Get rider's recent completed deliveries (last 5)
    cursor.execute("""
        SELECT o.id as order_id, o.email as customer_name, 
               'Store Location' as pickup_location, o.delivery_address,
               o.status, re.amount as earnings, o.date
        FROM orders o
        LEFT JOIN rider_earnings re ON o.id = re.order_id
        WHERE o.rider_email = %s AND o.status = 'Received'
        ORDER BY o.date DESC
        LIMIT 5
    """, (user_email,))
    recent_deliveries = cursor.fetchall()
    
    # Calculate earnings breakdown by period
    cursor.execute("""
        SELECT DATE(re.date) as earn_date, SUM(re.amount) as daily_earnings
        FROM rider_earnings re
        WHERE re.rider_email = %s AND DATE(re.date) = CURDATE()
    """, (user_email,))
    today_result = cursor.fetchone()
    today_earnings = float(today_result['daily_earnings']) if today_result and today_result['daily_earnings'] else 0
    
    cursor.execute("""
        SELECT SUM(re.amount) as week_earnings
        FROM rider_earnings re
        WHERE re.rider_email = %s 
        AND re.date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    """, (user_email,))
    week_result = cursor.fetchone()
    week_earnings = float(week_result['week_earnings']) if week_result and week_result['week_earnings'] else 0
    
    cursor.execute("""
        SELECT SUM(re.amount) as month_earnings
        FROM rider_earnings re
        WHERE re.rider_email = %s 
        AND YEAR(re.date) = YEAR(NOW())
        AND MONTH(re.date) = MONTH(NOW())
    """, (user_email,))
    month_result = cursor.fetchone()
    month_earnings = float(month_result['month_earnings']) if month_result and month_result['month_earnings'] else 0
    
    # Earnings history (actual earnings from rider_earnings table)
    cursor.execute("""
        SELECT o.id as order_id, re.date, re.amount
        FROM rider_earnings re
        JOIN orders o ON o.id = re.order_id
        WHERE re.rider_email = %s
        ORDER BY re.date DESC
        LIMIT 10
    """, (user_email,))
    earnings_history = cursor.fetchall()
    
    cursor.close()
    connection.close()
    
    return render_template('rider_dashboard.html',
                         total_deliveries=total_deliveries,
                         pending_orders=pending_orders,
                         total_earnings=total_earnings,
                         customer_rating=customer_rating,
                         orders=orders,
                        prepared_orders=orders,
                         my_deliveries=my_deliveries,
                         recent_deliveries=recent_deliveries,
                         today_earnings=today_earnings,
                         week_earnings=week_earnings,
                         month_earnings=month_earnings,
                         earnings_history=earnings_history)

@app.route('/order_details')
def order_details():
    return render_template('order_details.html')

@app.route('/api/order/<int:order_id>')
def get_order_details(order_id):
    """API endpoint to fetch order details by order ID"""
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        # Fetch order details with product and seller information
        cursor.execute("""
            SELECT 
                o.id,
                o.name as product_name,
                o.quantity,
                o.total_price,
                o.email,
                o.delivery_address,
                o.payment_method,
                o.status,
                o.seller_email,
                o.image,
                p.category,
                p.description,
                u.first_name as seller_first_name,
                u.last_name as seller_last_name,
                u.phone_number as seller_phone
            FROM orders o
            LEFT JOIN products p ON o.product_id = p.id
            LEFT JOIN users u ON o.seller_email = u.email
            WHERE o.id = %s
        """, (order_id,))
        
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'success': False, 'error': 'Order not found'}), 404
        
        # Get seller name
        seller_name = "N/A"
        if order.get('seller_first_name') and order.get('seller_last_name'):
            seller_name = f"{order.get('seller_first_name')} {order.get('seller_last_name')}"
        
        return jsonify({
            'success': True,
            'data': {
                'id': order.get('id'),
                'product_name': order.get('product_name') if order.get('product_name') else 'Product',
                'category': order.get('category') if order.get('category') else 'General',
                'quantity': int(order.get('quantity', 1)) if order.get('quantity') else 1,
                'total_price': float(order.get('total_price', 0)) if order.get('total_price') else 0,
                'email': order.get('email') if order.get('email') else 'N/A',
                'delivery_address': order.get('delivery_address') if order.get('delivery_address') else 'N/A',
                'payment_method': order.get('payment_method') if order.get('payment_method') else 'N/A',
                'status': order.get('status') if order.get('status') else 'Pending',
                'description': order.get('description') if order.get('description') else 'N/A',
                'seller_email': order.get('seller_email') if order.get('seller_email') else 'N/A',
                'seller_name': seller_name,
                'seller_phone': order.get('seller_phone') if order.get('seller_phone') else 'N/A'
            }
        })
    except Exception as err:
        print(f"Error: {err}")
        return jsonify({'success': False, 'error': str(err)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/rider/earnings')
def get_rider_earnings():
    """API endpoint to fetch rider earnings data for charts"""
    if 'email' not in session or session.get('user_type') != 'Rider':
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    rider_email = session['email']
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        # Get last 7 days of earnings
        cursor.execute("""
            SELECT DATE(date) as date, SUM(amount) as daily_earnings
            FROM rider_earnings
            WHERE rider_email = %s AND date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(date)
            ORDER BY date ASC
        """, (rider_email,))
        
        daily_earnings = cursor.fetchall() or []
        # Convert date objects to strings
        daily_earnings = [{'date': str(item['date']), 'daily_earnings': float(item['daily_earnings']) if item['daily_earnings'] else 0} for item in daily_earnings]
        
        # Get weekly breakdown (last 4 weeks)
        cursor.execute("""
            SELECT WEEK(date) as week, SUM(amount) as weekly_earnings
            FROM rider_earnings
            WHERE rider_email = %s AND date >= DATE_SUB(NOW(), INTERVAL 28 DAY)
            GROUP BY WEEK(date)
            ORDER BY week ASC
        """, (rider_email,))
        
        weekly_earnings = cursor.fetchall() or []
        weekly_earnings = [{'week': item['week'], 'weekly_earnings': float(item['weekly_earnings']) if item['weekly_earnings'] else 0} for item in weekly_earnings]
        
        # Get monthly breakdown (last 12 months)
        cursor.execute("""
            SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as monthly_earnings
            FROM rider_earnings
            WHERE rider_email = %s AND date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(date, '%Y-%m')
            ORDER BY month ASC
        """, (rider_email,))
        
        monthly_earnings = cursor.fetchall() or []
        monthly_earnings = [{'month': item['month'], 'monthly_earnings': float(item['monthly_earnings']) if item['monthly_earnings'] else 0} for item in monthly_earnings]
        
        return jsonify({
            'success': True,
            'daily_earnings': daily_earnings,
            'weekly_earnings': weekly_earnings,
            'monthly_earnings': monthly_earnings
        })
    except Exception as err:
        print(f"Error fetching earnings: {err}")
        return jsonify({'success': False, 'error': str(err)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/seller_products', methods=['GET'])
def seller_products():
    user_email = session.get('email')
    search_query = request.args.get('search', '').strip()
    selected_category = request.args.get('category', '')

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Get unique categories
    cursor.execute("SELECT DISTINCT category FROM products")
    categories = [row['category'] for row in cursor.fetchall()]

    # Base query
    query = "SELECT * FROM products WHERE seller_email = %s"
    params = [user_email]

    # Add search filter if provided
    if search_query:
        query += " AND (name LIKE %s OR category LIKE %s)"
        params.extend([f"%{search_query}%", f"%{search_query}%"])

    # Add category filter if selected
    if selected_category:
        query += " AND category = %s"
        params.append(selected_category)

    # Execute query
    cursor.execute(query, tuple(params))
    products = cursor.fetchall()

    cursor.close()
    connection.close()

    return render_template('seller_products.html', 
                         products=products, 
                         categories=categories, 
                         selected_category=selected_category)

@app.route('/api/seller_products', methods=['GET'])
def api_seller_products():
    """API endpoint to get filtered seller products"""
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    user_email = session.get('email')
    search_query = request.args.get('search', '').strip()
    category = request.args.get('category', '')
    sales_sort = request.args.get('sales_sort', '')

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Base query with sales count from orders
    query = """
        SELECT p.*,
               COALESCE(SUM(o.quantity), 0) AS received_orders
        FROM products p
        LEFT JOIN orders o ON p.id = o.product_id AND o.seller_email = %s AND o.status = 'Received'
        WHERE p.seller_email = %s
    """
    params = [user_email, user_email]

    # Add search filter
    if search_query:
        query += " AND (p.name LIKE %s OR p.description LIKE %s)"
        params.extend([f"%{search_query}%", f"%{search_query}%"])

    # Add category filter
    if category:
        query += " AND p.category = %s"
        params.append(category)

    # Add GROUP BY before ORDER BY
    query += " GROUP BY p.id"

    # Add sorting
    if sales_sort == 'highest':
        query += " ORDER BY received_orders DESC"
    elif sales_sort == 'lowest':
        query += " ORDER BY received_orders ASC"

    cursor.execute(query, tuple(params))
    products = cursor.fetchall()
    cursor.close()
    connection.close()

    return jsonify({'success': True, 'products': products})

@app.route('/api/seller/products-performance', methods=['GET'])
def get_products_performance():
    """API endpoint to get product performance data for the dashboard"""
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    user_email = session.get('email')
    
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
            
        cursor = connection.cursor(dictionary=True)
        
        # Get top 6 products by sales for the seller
        # Using a simpler query approach for better compatibility
        query = """
            SELECT p.id, p.name, p.category, COALESCE(p.price, 0) as price,
                   COALESCE(SUM(o.quantity), 0) AS total_sold,
                   COALESCE(COUNT(o.id), 0) AS order_count
            FROM products p
            LEFT JOIN orders o ON (p.id = o.product_id AND o.seller_email = %s AND o.status = 'Received')
            WHERE p.seller_email = %s
            GROUP BY p.id, p.name, p.category, p.price
            ORDER BY total_sold DESC
            LIMIT 6
        """
        
        cursor.execute(query, (user_email, user_email))
        products = cursor.fetchall()
        cursor.close()
        connection.close()
        
        if not products:
            return jsonify({
                'success': True, 
                'data': {
                    'labels': [],
                    'data': [],
                    'colors': [],
                    'details': []
                },
                'message': 'No products found'
            })

        # Prepare data for chart
        labels = []
        data = []
        details = []
        
        # Define colors for the chart
        colors = [
            '#6B46C1',  # Purple
            '#10B981',  # Green
            '#F59E0B',  # Amber
            '#EF4444',  # Red
            '#3B82F6',  # Blue
            '#EC4899',  # Pink
        ]
        
        # Process each product
        for idx, p in enumerate(products):
            labels.append(p['name'])
            sold = int(p['total_sold']) if p['total_sold'] else 0
            data.append(sold)
            
            price = float(p['price']) if p['price'] else 0
            revenue = price * sold
            
            details.append({
                'name': p['name'],
                'category': p['category'],
                'sold': sold,
                'orders': int(p['order_count']) if p['order_count'] else 0,
                'price': price,
                'revenue': revenue
            })
        
        return jsonify({
            'success': True,
            'data': {
                'labels': labels,
                'data': data,
                'colors': colors[:len(labels)],
                'details': details
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Error in get_products_performance: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        try:
            cursor.close()
            connection.close()
        except:
            pass
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/product/<int:product_id>', methods=['GET'])
def api_get_product(product_id):
    """API endpoint to get single product details"""
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    user_email = session.get('email')
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT * FROM products WHERE id = %s AND seller_email = %s", (product_id, user_email))
    product = cursor.fetchone()
    cursor.close()
    connection.close()

    if not product:
        return jsonify({'success': False, 'error': 'Product not found'}), 404

    return jsonify({'success': True, 'data': product})

#=====================================================================================================================
                                    #PRODUCTS MANAGEMENT
#=====================================================================================================================

@app.route('/add_new_product', methods=['GET', 'POST'])
def add_new_product():
    if request.method == 'POST':
        try:
            product_name = request.form['product_name']
            description = request.form['description']
            category = request.form['category']
            regular_price = request.form['regular_price']
            seller_email = session.get('email')
            
            # Generate a unique product_id server-side
            product_id = f"P{int(time.time())}{randint(1000,9999)}"

            # Handle multiple image uploads
            if 'product_images' not in request.files:
                return jsonify({'success': False, 'error': 'No files uploaded'})

            files = request.files.getlist('product_images')
            if not files or files[0].filename == '':
                return jsonify({'success': False, 'error': 'No files selected'})

            # Process multiple images
            image_filenames = []
            for file in files:
                if file and allowed_file(file.filename):
                    # Create unique filename
                    timestamp = str(int(time.time()))
                    filename = f"{timestamp}_{secure_filename(file.filename)}"
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    image_filenames.append(filename)
            
            if not image_filenames:
                return jsonify({'success': False, 'error': 'No valid images uploaded. Only jpg, jpeg, and png allowed.'})
            
            # Use first image as main image, store all as comma-separated string
            main_image = image_filenames[0]
            all_images = ','.join(image_filenames)

            # Get variants from form
            variants_json = request.form.get('variants', '[]')
            try:
                variants = json.loads(variants_json)
            except json.JSONDecodeError:
                return jsonify({'success': False, 'error': 'Invalid variants data'})
            
            if not variants or len(variants) == 0:
                return jsonify({'success': False, 'error': 'Please add at least one product variant with stock'})

            # Check if product ID exists
            db = get_db_connection()
            cursor = db.cursor()
            cursor.execute('SELECT * FROM products WHERE product_id = %s', (product_id,))
            existing_product = cursor.fetchone()

            if existing_product:
                cursor.close()
                db.close()
                return jsonify({'success': False, 'error': "Product with this ID already exists."})

            try:
                # Insert product record
                cursor.execute('''INSERT INTO products 
                                (product_id, name, category, description, price, image, images, seller_email)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''', 
                                (product_id, product_name, category, description, regular_price, 
                                 main_image, all_images, seller_email))
                
                # Get the product ID (auto-increment)
                cursor.execute('SELECT id FROM products WHERE product_id = %s', (product_id,))
                product_record = cursor.fetchone()
                product_db_id = product_record[0] if product_record else None
                
                if not product_db_id:
                    db.rollback()
                    return jsonify({'success': False, 'error': 'Failed to retrieve product ID'})
                
                # Insert variants
                for variant in variants:
                    color = variant.get('color', '')
                    size = variant.get('size', '')
                    stock = int(variant.get('stock', 0))
                    
                    if stock <= 0:
                        continue  # Skip variants with no stock
                    
                    cursor.execute('''INSERT INTO product_variants 
                                    (product_id, color, size, stock)
                                    VALUES (%s, %s, %s, %s)''', 
                                    (product_db_id, color, size, stock))
                
                db.commit()
                return jsonify({'success': True, 'message': 'Product added successfully!', 'product_id': product_id})

            except mysql.connector.Error as err:
                db.rollback()
                return jsonify({'success': False, 'error': f"Database error: {err}"})
            finally:
                cursor.close()
                db.close()

        except KeyError as e:
            return jsonify({'success': False, 'error': f"Missing required field: {str(e)}"})

    return render_template('add_product.html')

@app.route('/update_products/<int:product_id>', methods=['GET', 'POST'])
def edit_product(product_id):
    user_email = session.get('email')  # Get logged-in user's email
    
    if not user_email:
        if request.method == 'POST':
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        return redirect(url_for('login'))
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Fetch the product by ID and seller_email
    cursor.execute("""
        SELECT * FROM products
        WHERE id = %s AND seller_email = %s
    """, (product_id, user_email))
    product = cursor.fetchone()

    if not product:
        if request.method == 'POST':
            return jsonify({'success': False, 'error': 'Product not found or you do not have permission to edit it'}), 404
        flash("Product not found or you don't have permission to edit it.", "error")
        cursor.close()
        connection.close()
        return redirect(url_for('seller_products'))

    if request.method == 'POST':
        # Collect updated form data
        name = request.form.get('name', '')
        category = request.form.get('category', '')
        description = request.form.get('description', '')
        price = request.form.get('price', '')
        quantity = request.form.get('quantity', '')
        
        # Handle multiple sizes and colors
        sizes = request.form.getlist('sizes[]')
        colors = request.form.getlist('colors[]')
        
        # Join into comma-separated strings
        size_str = ', '.join(sizes) if sizes else product.get('size', '')
        color_str = ', '.join(colors) if colors else product.get('color', '')
        
        # Handle image upload
        image = request.files.get('image')
        image_filename = product['image']  # Default to the current image filename

        if image and image.filename != '':
            if allowed_file(image.filename):
                image_filename = secure_filename(image.filename)
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                image.save(image_path)
            else:
                return jsonify({'success': False, 'error': 'Invalid image format. Allowed formats: png, jpg, jpeg, gif'}), 400
        
        try:
            # Update the product in the database
            cursor.execute("""
                UPDATE products
                SET name = %s, category = %s, description = %s, size = %s, color = %s, price = %s, quantity = %s, image = %s
                WHERE id = %s AND seller_email = %s
            """, (name, category, description, size_str, color_str, price, quantity, image_filename, product_id, user_email))
            connection.commit()
            
            cursor.close()
            connection.close()
            
            return jsonify({'success': True, 'message': 'Product updated successfully!'}), 200
        except Exception as e:
            connection.rollback()
            cursor.close()
            connection.close()
            return jsonify({'success': False, 'error': str(e)}), 500

    # GET request - return the product details (for GET requests if needed)
    cursor.close()
    connection.close()

    return render_template('update_products.html', product=product)

@app.route('/delete_product/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Delete the product only if it belongs to the logged-in seller
        cursor.execute("""
            DELETE FROM products 
            WHERE id = %s AND seller_email = %s
        """, (product_id, session['email']))
        
        connection.commit()
        
        if cursor.rowcount > 0:
            return jsonify({'success': True, 'message': 'Product deleted successfully'})
        else:
            return jsonify({'success': False, 'error': 'Product not found or unauthorized'}), 404
            
    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': str(err)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/product_details/<int:product_id>')
def product_details(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get product details without last_active
    cursor.execute("""
        SELECT p.*, u.first_name, u.last_name, u.profile_pic
        FROM products p
        JOIN users u ON p.seller_email = u.email
        WHERE p.id = %s
    """, (product_id,))
    
    product = cursor.fetchone()
    
    if not product:
        cursor.close()
        conn.close()
        return redirect(url_for('homepage'))

    # Create seller object without last_active
    seller = {
        'first_name': product['first_name'],
        'last_name': product['last_name'],
        'email': product['seller_email'],
        'profile_pic': product['profile_pic']
    }
    
    cursor.close()
    conn.close()
    
    return render_template('product_details.html', product=product, seller=seller)

@app.route('/api/product_variants/<int:product_id>')
def api_product_variants(product_id):
    """API endpoint to get all variants for a product"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('''
            SELECT id, color, size, stock
            FROM product_variants
            WHERE product_id = %s
            ORDER BY color, size ASC
        ''', (product_id,))
        
        variants = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'variants': variants})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/product_variants/<int:product_id>/update-stock', methods=['POST'])
def update_variant_stocks(product_id):
    """API endpoint to update variant stocks"""
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        updates = data.get('updates', [])
        
        if not updates:
            return jsonify({'success': False, 'error': 'No updates provided'})
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify the product belongs to this seller
        cursor.execute('''
            SELECT seller_email FROM products WHERE id = %s
        ''', (product_id,))
        product = cursor.fetchone()
        
        if not product or product[0] != session['email']:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Update each variant stock
        for update in updates:
            variant_id = update.get('variant_id')
            new_stock = update.get('stock', 0)
            
            cursor.execute('''
                UPDATE product_variants 
                SET stock = %s 
                WHERE id = %s AND product_id = %s
            ''', (new_stock, variant_id, product_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Stock updated successfully'})
    except Exception as e:
        print(f"Error updating stock: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/add_product_variant', methods=['POST'])
def add_product_variant():
    """API endpoint to add a new variant to a product"""
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        color = data.get('color')
        size = data.get('size')
        stock = int(data.get('stock', 0))
        
        if not all([product_id, color, size]):
            return jsonify({'success': False, 'error': 'Missing required fields'})
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify the product belongs to this seller
        cursor.execute('''
            SELECT seller_email FROM products WHERE id = %s
        ''', (product_id,))
        product = cursor.fetchone()
        
        if not product or product['seller_email'] != session['email']:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Check if variant already exists
        cursor.execute('''
            SELECT id FROM product_variants 
            WHERE product_id = %s AND color = %s AND size = %s
        ''', (product_id, color, size))
        
        existing = cursor.fetchone()
        if existing:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': f'Variant "{color} - {size}" already exists'})
        
        # Add new variant
        cursor.execute('''
            INSERT INTO product_variants (product_id, color, size, stock)
            VALUES (%s, %s, %s, %s)
        ''', (product_id, color, size, stock))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': f'Variant added successfully'})
    except Exception as e:
        print(f"Error adding variant: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/migrate_product_variants/<int:product_id>', methods=['POST'])
def migrate_product_variants(product_id):
    """Migrate legacy products to new variant system"""
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify ownership
        cursor.execute('SELECT id, seller_email FROM products WHERE id = %s', (product_id,))
        product = cursor.fetchone()
        
        if not product or product['seller_email'] != session['email']:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Check if already has variants
        cursor.execute('SELECT COUNT(*) as count FROM product_variants WHERE product_id = %s', (product_id,))
        has_variants = cursor.fetchone()['count'] > 0
        
        if has_variants:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'Product already has variants'})
        
        # Create a default variant from product quantity if it exists
        data = request.get_json()
        stock = int(data.get('stock', 0))
        
        # Add default variant (One Size, Mixed Color)
        cursor.execute('''
            INSERT INTO product_variants (product_id, color, size, stock)
            VALUES (%s, %s, %s, %s)
        ''', (product_id, 'Mixed', 'One Size', stock))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Product migrated to variant system'})
    except Exception as e:
        print(f"Error migrating product: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/search')
def search():
    """Search for products by name or category"""
    query = request.args.get('query', '').strip()
    
    if not query:
        flash('Please enter a search term', 'warning')
        return redirect(url_for('homepage'))
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Search for products by name or category
        search_query = f"%{query}%"
        cursor.execute("""
            SELECT p.*, u.first_name, u.last_name, u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_email = u.email
            WHERE p.name LIKE %s OR p.category LIKE %s
            ORDER BY p.name ASC
            LIMIT 100
        """, (search_query, search_query))
        
        products = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return render_template('search_results.html', query=query, products=products)
    
    except mysql.connector.Error as err:
        cursor.close()
        conn.close()
        flash(f'Database error: {err}', 'error')
        return redirect(url_for('homepage'))

@app.route('/get_product/<int:product_id>')
def get_product_api(product_id):
    """Public API endpoint to get product details for modal"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT id, name, price, image, seller_email
        FROM products
        WHERE id = %s
    """, (product_id,))
    
    product = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not product:
        return jsonify({'success': False, 'error': 'Product not found'}), 404
    
    return jsonify(product)

@app.route('/seller_order_list')
def seller_order_list():
    user_email = session.get('email')  # Get the email of the logged-in seller
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    # Query to get orders for the seller, INCLUDING cancelled orders
    cursor.execute("""
        SELECT * FROM orders
        WHERE seller_email = %s
        ORDER BY date DESC
    """, (user_email,))
    
    orders = cursor.fetchall()
    cursor.close()
    connection.close()
    
    return render_template('seller_order_list.html', orders=orders)

@app.route('/view_seller/<seller_email>')
def view_seller(seller_email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get seller information
    cursor.execute("""
        SELECT first_name, last_name, email, phone_number, address, profile_pic, banner_image 
        FROM users 
        WHERE email = %s AND user_type = 'Seller'
    """, (seller_email,))
    
    seller = cursor.fetchone()
    
    if not seller:
        return "Seller not found", 404
    
    # Get seller's products
    cursor.execute("""
        SELECT * FROM products 
        WHERE seller_email = %s
    """, (seller_email,))
    
    products = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    # Process the image paths
    if seller['profile_pic']:
        seller['profile_pic'] = url_for('static', filename=seller['profile_pic'])
    else:
        seller['profile_pic'] = url_for('static', filename='images/default_profile.png')
        
    if seller['banner_image']:
        seller['banner_image'] = url_for('static', filename=seller['banner_image'])
    else:
        seller['banner_image'] = url_for('static', filename='images/default_banner.jpg')
    
    return render_template('view_seller.html', seller=seller, products=products)

@app.route('/view_rider/<rider_email>')
def view_rider(rider_email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get rider information
    cursor.execute("""
        SELECT first_name, last_name, email, phone_number, address, profile_pic, banner_image 
        FROM users 
        WHERE email = %s AND user_type = 'Rider'
    """, (rider_email,))
    
    rider = cursor.fetchone()
    
    if not rider:
        return "Rider not found", 404
    
    # Get rider's delivery statistics
    cursor.execute("""
        SELECT 
            COUNT(*) as total_deliveries,
            SUM(CASE WHEN status = 'Received' THEN 1 ELSE 0 END) as completed_deliveries,
            SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as pending_receipt
        FROM orders 
        WHERE rider_email = %s
    """, (rider_email,))
    
    stats = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    # Process the image paths
    if rider['profile_pic']:
        rider['profile_pic'] = url_for('static', filename=rider['profile_pic'])
    else:
        rider['profile_pic'] = url_for('static', filename='images/default_profile.png')
        
    if rider['banner_image']:
        rider['banner_image'] = url_for('static', filename=rider['banner_image'])
    else:
        rider['banner_image'] = url_for('static', filename='images/default_banner.jpg')
    
    return render_template('view_rider.html', rider=rider, stats=stats)

@app.route('/get_products_by_category')
def get_products_by_category():
    category = request.args.get('category', '')
    
    if not category:
        return jsonify({'success': False, 'error': 'No category provided'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT p.*, u.first_name, u.last_name, u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_email = u.email
            WHERE p.category = %s
            ORDER BY u.first_name, u.last_name, p.id DESC
        """, (category,))
        
        products = cursor.fetchall()
        
        # Convert prices to float for JSON serialization
        for product in products:
            if product:
                product['price'] = float(product['price']) if product.get('price') else 0.0
                product['created_at'] = product['created_at'].isoformat() if product.get('created_at') else None
        
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'products': products if products else []})
    
    except Exception as e:
        print(f"Error fetching category products: {e}")
        return jsonify({'success': False, 'products': [], 'error': str(e)}), 200

@app.route('/api/category/<category>')
def api_get_category_products(category):
    """Simplified API endpoint for category products"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Simple query with proper error handling
        query = """
            SELECT p.*, u.first_name, u.last_name, u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_email = u.email
            WHERE p.category = %s
            ORDER BY u.first_name, u.last_name, p.created_at DESC
        """
        
        cursor.execute(query, (category,))
        products = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Convert datetime and numeric values for JSON
        for product in products:
            if product:
                product['price'] = float(product['price']) if product.get('price') else 0.0
                product['quantity'] = int(product['quantity']) if product.get('quantity') else 0
                if product.get('created_at'):
                    product['created_at'] = product['created_at'].isoformat()
        
        return jsonify({'products': products if products else []})
    
    except Exception as e:
        print(f"Error in api_get_category_products: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'products': [], 'error': str(e)}), 500

#=====================================================================================================================
                                    #ADMIN DASHBOARD
#=====================================================================================================================

@app.route('/admin_main')
def admin_main_redirect():
    """Redirect old admin_main route to unified admin_dashboard"""
    return redirect(url_for('admin_dashboard'))

#=====================================================================================================================
                                    #SELLER REPORTS
#=====================================================================================================================

@app.route('/submit_report', methods=['POST'])
def submit_report():
    """Handle seller report submission"""
    try:
        data = request.get_json()
        reporter_email = session.get('email')
        
        if not reporter_email:
            return jsonify({'success': False, 'message': 'Please login to submit a report'}), 401
        
        # Get reporter name
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT first_name, last_name FROM users WHERE email = %s", (reporter_email,))
        reporter = cursor.fetchone()
        reporter_name = f"{reporter['first_name']} {reporter['last_name']}" if reporter else None
        
        # Get reported seller name - validate email first
        reported_seller_email = data.get('reported_seller_email')
        
        # Validate that email is not a template string
        if not reported_seller_email or '{{' in str(reported_seller_email) or '{%' in str(reported_seller_email):
            return jsonify({'success': False, 'message': 'Invalid seller email. Please refresh the page and try again.'}), 400
        
        # Validate email format
        if '@' not in reported_seller_email:
            return jsonify({'success': False, 'message': 'Invalid seller email format.'}), 400
        
        cursor.execute("SELECT first_name, last_name FROM users WHERE email = %s", (reported_seller_email,))
        seller = cursor.fetchone()
        
        if not seller:
            return jsonify({'success': False, 'message': 'Seller not found.'}), 404
        
        seller_name = f"{seller['first_name']} {seller['last_name']}" if seller else None
        
        # Insert report
        cursor.execute("""
            INSERT INTO seller_reports 
            (reporter_email, reporter_name, reported_seller_email, reported_seller_name, 
             report_reason, report_description, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'Pending')
        """, (
            reporter_email,
            reporter_name,
            reported_seller_email,
            seller_name,
            data.get('report_reason'),
            data.get('report_description')
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Report submitted successfully'})
    except Exception as e:
        print(f"Error submitting report: {str(e)}")
        return jsonify({'success': False, 'message': 'Error submitting report'}), 500

@app.route('/submit_rider_report', methods=['POST'])
def submit_rider_report():
    """Handle rider report submission"""
    try:
        data = request.get_json()
        reporter_email = session.get('email')
        
        if not reporter_email:
            return jsonify({'success': False, 'message': 'Please login to submit a report'}), 401
        
        # Get reporter name
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT first_name, last_name FROM users WHERE email = %s", (reporter_email,))
        reporter = cursor.fetchone()
        reporter_name = f"{reporter['first_name']} {reporter['last_name']}" if reporter else None
        
        # Get reported rider email - validate email first
        reported_rider_email = data.get('reported_rider_email')
        
        # Validate that email is not a template string
        if not reported_rider_email or '{{' in str(reported_rider_email) or '{%' in str(reported_rider_email):
            return jsonify({'success': False, 'message': 'Invalid rider email. Please refresh the page and try again.'}), 400
        
        # Validate email format
        if '@' not in reported_rider_email:
            return jsonify({'success': False, 'message': 'Invalid rider email format.'}), 400
        
        cursor.execute("SELECT first_name, last_name FROM users WHERE email = %s AND user_type = 'Rider'", (reported_rider_email,))
        rider = cursor.fetchone()
        
        if not rider:
            return jsonify({'success': False, 'message': 'Rider not found.'}), 404
        
        rider_name = f"{rider['first_name']} {rider['last_name']}" if rider else None
        
        # Map rider-specific reasons to valid ENUM values
        report_reason = data.get('report_reason', '')
        # Map rider-specific reasons to existing ENUM values
        reason_mapping = {
            'Poor Service Quality': 'Poor Product Quality',  # Map to closest match
            'Late or Missing Delivery': 'Unprofessional Behavior',  # Map to closest match
        }
        if report_reason in reason_mapping:
            report_reason = reason_mapping[report_reason]
        
        # Validate report_reason is in the allowed ENUM values
        valid_reasons = ['Fraudulent Activity', 'Poor Product Quality', 'Unprofessional Behavior', 
                        'Spam or Scam', 'Inappropriate Content', 'Other']
        if report_reason not in valid_reasons:
            report_reason = 'Other'  # Default to 'Other' if invalid
        
        # Check if rider_reports table exists, if not use seller_reports with a type field
        # For now, we'll use seller_reports table but mark it as a rider report
        # We can extend seller_reports to handle both, or create a separate table
        # Using seller_reports for now with reported_seller_email field (can be rider too)
        cursor.execute("""
            INSERT INTO seller_reports 
            (reporter_email, reporter_name, reported_seller_email, reported_seller_name, 
             report_reason, report_description, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'Pending')
        """, (
            reporter_email,
            reporter_name,
            reported_rider_email,
            rider_name,
            report_reason,
            data.get('report_description')
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Report submitted successfully'})
    except Exception as e:
        print(f"Error submitting rider report: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Error submitting report'}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Get all seller reports for admin"""
    try:
        if session.get('user_type') != 'Admin':
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        status_filter = request.args.get('status', 'all')
        query = """
            SELECT r.*, 
                   u1.first_name as reporter_first_name, 
                   u1.last_name as reporter_last_name,
                   u2.first_name as seller_first_name,
                   u2.last_name as seller_last_name,
                   CONCAT(COALESCE(u1.first_name, ''), ' ', COALESCE(u1.last_name, '')) as reporter_full_name,
                   CONCAT(COALESCE(u2.first_name, ''), ' ', COALESCE(u2.last_name, '')) as seller_full_name
            FROM seller_reports r
            LEFT JOIN users u1 ON r.reporter_email = u1.email
            LEFT JOIN users u2 ON r.reported_seller_email = u2.email
        """
        
        if status_filter != 'all':
            query += " WHERE r.status = %s"
            cursor.execute(query, (status_filter,))
        else:
            cursor.execute(query)
        
        reports = cursor.fetchall()
        
        # Process reports to ensure names are properly set
        for report in reports:
            # Clean up any template strings that might have been stored
            reporter_name = str(report.get('reporter_name', '') or '').strip()
            if not reporter_name or '{{' in reporter_name or '{%' in reporter_name:
                # Use stored names if available, otherwise construct from joined data
                if report.get('reporter_full_name') and str(report.get('reporter_full_name', '')).strip():
                    reporter_name = str(report['reporter_full_name']).strip()
                elif report.get('reporter_first_name') or report.get('reporter_last_name'):
                    reporter_name = f"{report.get('reporter_first_name', '')} {report.get('reporter_last_name', '')}".strip()
                else:
                    reporter_name = report.get('reporter_email', 'Unknown')
            report['reporter_name'] = reporter_name
            
            # Clean up seller name - this is the critical fix
            seller_name = str(report.get('reported_seller_name', '') or '').strip()
            if not seller_name or '{{' in seller_name or '{%' in seller_name:
                if report.get('seller_full_name') and str(report.get('seller_full_name', '')).strip():
                    seller_name = str(report['seller_full_name']).strip()
                elif report.get('seller_first_name') or report.get('seller_last_name'):
                    seller_name = f"{report.get('seller_first_name', '')} {report.get('seller_last_name', '')}".strip()
                else:
                    seller_name = report.get('reported_seller_email', 'Unknown')
            report['reported_seller_name'] = seller_name
            
            # Also update the database if we found template strings (clean up bad data)
            if '{{' in str(report.get('reported_seller_name', '')) or '{%' in str(report.get('reported_seller_name', '')):
                try:
                    cursor.execute("""
                        UPDATE seller_reports 
                        SET reported_seller_name = %s 
                        WHERE id = %s
                    """, (seller_name, report['id']))
                    conn.commit()
                except Exception as e:
                    print(f"Error updating report {report['id']}: {str(e)}")
            
            # Ensure email fields are never None
            if not report.get('reporter_email'):
                report['reporter_email'] = 'N/A'
            if not report.get('reported_seller_email'):
                report['reported_seller_email'] = 'N/A'
        
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'reports': reports})
    except Exception as e:
        print(f"Error fetching reports: {str(e)}")
        return jsonify({'success': False, 'message': 'Error fetching reports'}), 500

@app.route('/api/reports/<int:report_id>/action', methods=['POST'])
def handle_report_action(report_id):
    """Handle admin actions on reports (review, resolve, dismiss)"""
    try:
        if session.get('user_type') != 'Admin':
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        action = data.get('action')  # 'review', 'resolve', 'dismiss'
        admin_notes = data.get('admin_notes', '')
        admin_action = data.get('admin_action', '')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        admin_id = session.get('user_id', 0)
        
        # First, get the report details before updating
        cursor.execute("""
            SELECT reporter_email, reporter_name, reported_seller_email, reported_seller_name,
                   report_reason, report_description
            FROM seller_reports 
            WHERE id = %s
        """, (report_id,))
        report_data = cursor.fetchone()
        
        if not report_data:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Report not found'}), 404
        
        status_map = {
            'review': 'Reviewed',
            'resolve': 'Resolved',
            'dismiss': 'Dismissed'
        }
        
        new_status = status_map.get(action, 'Reviewed')
        
        # Update the report
        cursor.execute("""
            UPDATE seller_reports 
            SET status = %s, 
                admin_action = %s,
                admin_notes = %s,
                reviewed_by = %s,
                reviewed_at = NOW()
            WHERE id = %s
        """, (new_status, admin_action, admin_notes, admin_id, report_id))
        
        conn.commit()
        
        # Send email notifications to both reporter and reported seller
        try:
            # Get user details for emails
            cursor.execute("SELECT first_name, last_name, email FROM users WHERE email = %s", (report_data['reporter_email'],))
            reporter_user = cursor.fetchone()
            
            cursor.execute("SELECT first_name, last_name, email FROM users WHERE email = %s", (report_data['reported_seller_email'],))
            seller_user = cursor.fetchone()
            
            # Send email to reporter
            if reporter_user:
                reporter_name = f"{reporter_user['first_name']} {reporter_user['last_name']}"
                reporter_email_html = build_report_notification_email_html(
                    reporter_name,
                    'reporter',
                    new_status,
                    report_data['reported_seller_name'] or report_data['reported_seller_email'],
                    report_data['report_reason'],
                    admin_action,
                    admin_notes
                )
                
                msg_reporter = Message(
                    subject=f'E-Baby - Report Update: {new_status}',
                    sender=app.config['MAIL_USERNAME'],
                    recipients=[reporter_user['email']]
                )
                msg_reporter.html = reporter_email_html
                msg_reporter.body = f"""
Hello {reporter_name},

Your report against {report_data['reported_seller_name'] or report_data['reported_seller_email']} has been {new_status.lower()}.

Reason: {report_data['report_reason']}
Admin Action: {admin_action or 'N/A'}
Admin Notes: {admin_notes or 'N/A'}

Thank you for helping us maintain a safe marketplace.

E-Baby Team
                """
                mail.send(msg_reporter)
            
            # Send email to reported seller
            if seller_user:
                seller_name = f"{seller_user['first_name']} {seller_user['last_name']}"
                seller_email_html = build_report_notification_email_html(
                    seller_name,
                    'seller',
                    new_status,
                    report_data['reporter_name'] or report_data['reporter_email'],
                    report_data['report_reason'],
                    admin_action,
                    admin_notes
                )
                
                msg_seller = Message(
                    subject=f'E-Baby - Report Against You: {new_status}',
                    sender=app.config['MAIL_USERNAME'],
                    recipients=[seller_user['email']]
                )
                msg_seller.html = seller_email_html
                msg_seller.body = f"""
Hello {seller_name},

A report has been filed against you and has been {new_status.lower()} by our admin team.

Reported by: {report_data['reporter_name'] or report_data['reporter_email']}
Reason: {report_data['report_reason']}
Admin Action: {admin_action or 'N/A'}
Admin Notes: {admin_notes or 'N/A'}

Please review this information and ensure compliance with our marketplace policies.

E-Baby Team
                """
                mail.send(msg_seller)
        except Exception as email_err:
            print(f"Error sending report notification emails: {email_err}")
            # Don't fail the request if email fails
        
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': f'Report {action}ed successfully'})
    except Exception as e:
        print(f"Error handling report action: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Error processing action'}), 500

@app.route('/api/user_type', methods=['GET'])
def get_user_type():
    """Get user type by email"""
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Email parameter required'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_type FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user:
            return jsonify({'user_type': user['user_type']})
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        print(f'[GET_USER_TYPE] ERROR: {str(e)}', flush=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/user_counts')
def user_counts():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT user_type, COUNT(*) as count 
        FROM users 
        WHERE user_type != 'Admin' 
        GROUP BY user_type
    """)
    data = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(data)


@app.route('/admin_user_management')
def admin_user_management():
    search_email = request.args.get('search_email')  # Get the search email or name from the query parameter
    sort_by = request.args.get('sort')  # Get the sort value (seller or buyer)
    format_type = request.args.get('format', 'html')  # Get format (html or json)
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Build the query based on whether a search or sort is provided
    if search_email:
        # Search by email, first name, or last name
        cursor.execute('SELECT * FROM users WHERE (email LIKE %s OR first_name LIKE %s OR last_name LIKE %s) AND user_type != "Admin"', ('%' + search_email + '%', '%' + search_email + '%', '%' + search_email + '%'))
    elif sort_by == 'seller':
        cursor.execute('SELECT * FROM users WHERE user_type = "Seller" AND user_type != "Admin"')
    elif sort_by == 'buyer':
        cursor.execute('SELECT * FROM users WHERE user_type = "Buyer" AND user_type != "Admin"')
    elif sort_by == 'rider':
        cursor.execute('SELECT * FROM users WHERE user_type = "Rider" AND user_type != "Admin"')
    else:
        cursor.execute('SELECT * FROM users WHERE user_type != "Admin"')  # If no search or sort, fetch all users except admin
    
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Return JSON if requested
    if format_type == 'json':
        return jsonify({'users': users})
    
    return render_template('admin_user_management.html', users=users)

@app.route('/view_sellers/<email>')
def view_sellers(email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Fetch products associated with the seller's email
    cursor.execute('SELECT name, category, price, image FROM products WHERE seller_email = %s', (email,))
    products = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('view_sellers.html', products=products, seller_email=email)

@app.route('/update/<int:user_id>', methods=['GET', 'POST'])
def update_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if request.method == 'POST':
        # Fetch the form data
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        phone_number = request.form.get('phone_number')
        address = request.form.get('address')
        user_type = request.form.get('user_type')

        # Ensure all required fields are provided
        if not all([first_name, last_name, email, phone_number, address, user_type]):
            flash('All fields are required!', 'error')
            return redirect(url_for('admin_user_management'))

        # Update the user in the database
        cursor.execute('''UPDATE users 
                          SET first_name=%s, last_name=%s, email=%s, phone_number=%s, address=%s, user_type=%s 
                          WHERE id=%s''', 
                       (first_name, last_name, email, phone_number, address, user_type, user_id))
        conn.commit()
        flash('User updated successfully!', 'success')
        cursor.close()
        conn.close()
        return redirect(url_for('admin_user_management'))

    # If GET request, fetch user information
    cursor.execute('SELECT * FROM users WHERE id=%s', (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    return render_template('update.html', user=user)
    

@app.route('/delete/<int:user_id>', methods=['POST'])
def delete_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM users WHERE id = %s', (user_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': 'User deleted successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error deleting user: {str(e)}'}), 500

@app.route('/view_document/<path:filename>')
def view_document(filename):
    try:
        # Specify the directory where requirements (documents) are stored
        requirements_folder = os.path.join(app.root_path, 'static', 'requirements')
        return send_from_directory(requirements_folder, filename)
    except Exception as e:
        flash(f"Error viewing document: {str(e)}", "error")
        return redirect(url_for('seller_requests_dashboard'))

@app.route('/view_bir/<path:filename>')
def view_bir(filename):
    try:
        # Specify the directory where requirements (BIR documents) are stored
        requirements_folder = os.path.join(app.root_path, 'static', 'requirements')
        return send_from_directory(requirements_folder, filename)
    except Exception as e:
        flash(f"Error viewing BIR document: {str(e)}", "error")
        return redirect(url_for('seller_requests_dashboard'))

@app.route('/view_rider_document/<path:filename>')
def view_rider_document(filename):
    try:
        # Specify the directory where requirements (rider documents) are stored
        requirements_folder = os.path.join(app.root_path, 'static', 'requirements')
        return send_from_directory(requirements_folder, filename)
    except Exception as e:
        flash(f"Error viewing rider document: {str(e)}", "error")
        return redirect(url_for('rider_requests_dashboard'))


@app.route('/view_request_documents/<int:request_id>')
def view_request_documents(request_id):
    """Render a small page showing the documents attached to a seller or rider request.

    This endpoint is opened by admin JS via window.open(). It looks up the request
    in seller_requests and rider_requests and shows links to the stored files.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute('SELECT * FROM seller_requests WHERE id = %s', (request_id,))
    seller = cursor.fetchone()

    cursor.execute('SELECT * FROM rider_requests WHERE id = %s', (request_id,))
    rider = cursor.fetchone()
    
    cursor.execute('SELECT * FROM buyer_requests WHERE id = %s', (request_id,))
    buyer = cursor.fetchone()

    cursor.close()
    conn.close()

    if seller:
        return render_template('view_request_documents.html', item=seller, source='seller')
    if rider:
        return render_template('view_request_documents.html', item=rider, source='rider')
    if buyer:
        return render_template('view_request_documents.html', item=buyer, source='buyer')

    flash('Request not found', 'error')
    return redirect(url_for('register_requests'))


@app.route('/approve_request/<int:request_id>', methods=['POST'])
def approve_request_api(request_id):
    """API endpoint compatible with admin JS: approve a seller or rider request and return JSON."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Try seller first
    cursor.execute('SELECT * FROM seller_requests WHERE id = %s', (request_id,))
    seller = cursor.fetchone()

    try:
        if seller:
            cursor.execute("""
                INSERT INTO users (first_name, last_name, email, phone_number, address, password, user_type, document_id, bir)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                seller['first_name'], seller['last_name'], seller['email'], seller['phone_number'],
                seller['address'], seller['password'], 'Seller', seller.get('document_id'), seller.get('bir')
            ))
            cursor.execute('DELETE FROM seller_requests WHERE id = %s', (request_id,))
            conn.commit()

            # Send approval email (best-effort)
            try:
                msg = Message('E‑Baby - Registration Approved', sender=app.config['MAIL_USERNAME'], recipients=[seller['email']])
                msg.body = f"Hello {seller['first_name']} {seller['last_name']},\n\nYour seller account has been approved.\n"
                msg.html = build_approval_email_html(seller['first_name'], seller['last_name'], 'Seller')
                mail.send(msg)
            except Exception as e:
                print(f"Error sending approval email: {e}")

            return jsonify({'success': True})

        # Try rider
        cursor.execute('SELECT * FROM rider_requests WHERE id = %s', (request_id,))
        rider = cursor.fetchone()
        if rider:
            cursor.execute("""
                INSERT INTO users (first_name, last_name, email, phone_number, address, password, user_type, document_id)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                rider['first_name'], rider['last_name'], rider['email'], rider['phone_number'],
                rider['address'], rider['password'], 'Rider', rider.get('document_id')
            ))
            cursor.execute('DELETE FROM rider_requests WHERE id = %s', (request_id,))
            conn.commit()

            try:
                msg = Message('E‑Baby - Registration Approved', sender=app.config['MAIL_USERNAME'], recipients=[rider['email']])
                msg.body = f"Hello {rider['first_name']} {rider['last_name']},\n\nYour rider account has been approved.\n"
                msg.html = build_approval_email_html(rider['first_name'], rider['last_name'], 'Rider')
                mail.send(msg)
            except Exception as e:
                print(f"Error sending approval email: {e}")

            return jsonify({'success': True})
        
        # Try buyer
        cursor.execute('SELECT * FROM buyer_requests WHERE id = %s', (request_id,))
        buyer = cursor.fetchone()
        if buyer:
            cursor.execute("""
                INSERT INTO users (first_name, last_name, email, phone_number, address, password, user_type, document_id)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                buyer['first_name'], buyer['last_name'], buyer['email'], buyer['phone_number'],
                buyer['address'], buyer['password'], 'Buyer', buyer.get('document_id')
            ))
            cursor.execute('DELETE FROM buyer_requests WHERE id = %s', (request_id,))
            conn.commit()

            try:
                msg = Message('E‑Baby - Registration Approved', sender=app.config['MAIL_USERNAME'], recipients=[buyer['email']])
                msg.body = f"Hello {buyer['first_name']} {buyer['last_name']},\n\nYour buyer account has been approved.\n"
                msg.html = build_approval_email_html(buyer['first_name'], buyer['last_name'], 'Buyer')
                mail.send(msg)
            except Exception as e:
                print(f"Error sending approval email: {e}")

            return jsonify({'success': True})

        return jsonify({'success': False, 'message': 'Request not found'})

    except Exception as e:
        conn.rollback()
        print(f"Error approving request (api): {e}")
        return jsonify({'success': False, 'message': str(e)})
    finally:
        cursor.close()
        conn.close()


@app.route('/reject_request/<int:request_id>', methods=['POST'])
def reject_request_api(request_id):
    """API endpoint compatible with admin JS: reject seller or rider request and return JSON."""
    payload = request.get_json(silent=True) or {}
    reason = payload.get('reason') or 'No reason provided by admin.'

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute('SELECT * FROM seller_requests WHERE id = %s', (request_id,))
        seller = cursor.fetchone()
        if seller:
            # send rejection email
            try:
                msg = Message('E‑Baby - Registration Rejected', sender=app.config['MAIL_USERNAME'], recipients=[seller['email']])
                msg.body = f"Hello {seller['first_name']},\n\nYour seller application was not approved.\nReason: {reason}\n"
                msg.html = build_rejection_email_html(seller['first_name'], seller['last_name'], 'Seller', reason)
                mail.send(msg)
            except Exception as e:
                print(f"Error sending rejection email: {e}")

            cursor.execute('DELETE FROM seller_requests WHERE id = %s', (request_id,))
            conn.commit()
            return jsonify({'success': True})

        cursor.execute('SELECT * FROM rider_requests WHERE id = %s', (request_id,))
        rider = cursor.fetchone()
        if rider:
            try:
                msg = Message('E‑Baby - Registration Rejected', sender=app.config['MAIL_USERNAME'], recipients=[rider['email']])
                msg.body = f"Hello {rider['first_name']},\n\nYour rider application was not approved.\nReason: {reason}\n"
                msg.html = build_rejection_email_html(rider['first_name'], rider['last_name'], 'Rider', reason)
                mail.send(msg)
            except Exception as e:
                print(f"Error sending rejection email: {e}")

            cursor.execute('DELETE FROM rider_requests WHERE id = %s', (request_id,))
            conn.commit()
            return jsonify({'success': True})
        
        # Check buyer_requests
        cursor.execute('SELECT * FROM buyer_requests WHERE id = %s', (request_id,))
        buyer = cursor.fetchone()
        if buyer:
            try:
                msg = Message('E‑Baby - Registration Rejected', sender=app.config['MAIL_USERNAME'], recipients=[buyer['email']])
                msg.body = f"Hello {buyer['first_name']},\n\nYour buyer application was not approved.\nReason: {reason}\n"
                msg.html = build_rejection_email_html(buyer['first_name'], buyer['last_name'], 'Buyer', reason)
                mail.send(msg)
            except Exception as e:
                print(f"Error sending rejection email: {e}")

            cursor.execute('DELETE FROM buyer_requests WHERE id = %s', (request_id,))
            conn.commit()
            return jsonify({'success': True})

        return jsonify({'success': False, 'message': 'Request not found'})

    except Exception as e:
        conn.rollback()
        print(f"Error rejecting request (api): {e}")
        return jsonify({'success': False, 'message': str(e)})
    finally:
        cursor.close()
        conn.close()


@app.route('/edit_user/<int:user_id>', methods=['POST'])
def edit_user(user_id):
    """Endpoint used by admin UI to update a user's credentials from the modal form."""
    try:
        data = request.get_json() if request.is_json else request.form
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        phone_number = data.get('phone_number')
        address = data.get('address')
        user_type = data.get('user_type')

        if not all([first_name, last_name, email, phone_number, address, user_type]):
            return jsonify({'success': False, 'message': 'All fields are required!'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('''UPDATE users SET first_name=%s, last_name=%s, email=%s, phone_number=%s, address=%s, user_type=%s WHERE id=%s''',
                           (first_name, last_name, email, phone_number, address, user_type, user_id))
            conn.commit()
            return jsonify({'success': True, 'message': 'User updated successfully!'})
        except Exception as e:
            conn.rollback()
            return jsonify({'success': False, 'message': f'Error updating user: {str(e)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {str(e)}'}), 500

#=====================================================================================================================
                                    #BAN/UNBAN ACCOUNT ROUTES
#=====================================================================================================================

@app.route('/ban_user/<int:user_id>', methods=['POST'])
def ban_user(user_id):
    """Ban a user account and send ban email notification."""
    try:
        data = request.get_json() if request.is_json else request.form
        ban_reason = data.get('ban_reason', '').strip() if data.get('ban_reason') else ''
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Fetch user details
            cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'success': False, 'message': 'User not found!'}), 404
            
            # Update user status to banned
            cursor.execute('UPDATE users SET status = %s, ban_reason = %s WHERE id = %s',
                           ('banned', ban_reason if ban_reason else None, user_id))
            conn.commit()
            
            # Send ban email notification
            try:
                msg = Message('E‑Baby - Account Suspended', sender=app.config['MAIL_USERNAME'], recipients=[user['email']])
                msg.html = build_ban_email_html(user['first_name'], user['last_name'], ban_reason)
                mail.send(msg)
            except Exception as e:
                print(f"Error sending ban email: {e}")
            
            return jsonify({'success': True, 'message': f'User {user["email"]} has been banned successfully!'})
        except Exception as e:
            conn.rollback()
            return jsonify({'success': False, 'message': f'Error banning user: {str(e)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {str(e)}'}), 500


@app.route('/unban_user/<int:user_id>', methods=['POST'])
def unban_user(user_id):
    """Unban a user account."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Fetch user details
            cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'success': False, 'message': 'User not found!'}), 404
            
            # Update user status to active
            cursor.execute('UPDATE users SET status = %s, ban_reason = %s WHERE id = %s',
                           ('active', None, user_id))
            conn.commit()
            
            return jsonify({'success': True, 'message': f'User {user["email"]} has been unbanned successfully!'})
        except Exception as e:
            conn.rollback()
            return jsonify({'success': False, 'message': f'Error unbanning user: {str(e)}'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {str(e)}'}), 500


@app.route('/banned_account')
def banned_account():
    """Display banned account page with chat support option."""
    banned_email = session.get('banned_email')
    banned_reason = session.get('banned_reason')
    
    if not banned_email:
        return redirect(url_for('home'))
    
    return render_template('banned_account.html', banned_email=banned_email, banned_reason=banned_reason)


@app.route('/chat_banned')
def chat_banned():
    """Chat interface for banned users to communicate with admin."""
    temp_username = request.args.get('username', 'Guest')
    banned_email = request.args.get('email') or session.get('banned_email', 'unknown')
    
    return render_template('chat_banned.html', temp_username=temp_username, banned_email=banned_email)


@app.route('/api/banned_chat/send', methods=['POST'])
def send_banned_chat_message():
    """API endpoint for banned users to send messages to admin."""
    data = request.get_json()
    temp_username = data.get('temp_username', 'Guest')
    banned_email = data.get('banned_email', 'unknown')
    message_text = data.get('message', '').strip()
    
    if not message_text:
        return jsonify({'success': False, 'error': 'Message cannot be empty'}), 400
    
    try:
        # Create a thread ID based on banned email for organization
        thread_id = f"banned_{banned_email}"
        thread_path = _thread_path(thread_id)
        
        # Read existing thread or create new one
        try:
            with open(thread_path, 'r', encoding='utf-8') as f:
                thread_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            thread_data = {
                'thread_id': thread_id,
                'email': banned_email,
                'temp_username': temp_username,
                'account_status': 'banned',
                'messages': []
            }
        
        # Add the new message
        message = {
            'sender': temp_username,
            'sender_email': banned_email,
            'text': message_text,
            'timestamp': datetime.now().isoformat(),
            'read': False
        }
        thread_data['messages'].append(message)
        
        # Save thread with lock
        with chat_lock:
            with open(thread_path, 'w', encoding='utf-8') as f:
                json.dump(thread_data, f, indent=2, ensure_ascii=False)
        
        return jsonify({'success': True, 'message_id': len(thread_data['messages'])})
    
    except Exception as e:
        print(f"Error saving banned chat message: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/banned_chat/messages', methods=['GET'])
def get_banned_chat_messages():
    """Get messages for banned user chat thread."""
    banned_email = request.args.get('email')
    
    if not banned_email:
        return jsonify({'success': False, 'error': 'Email not provided'}), 400
    
    try:
        thread_id = f"banned_{banned_email}"
        thread_path = _thread_path(thread_id)
        
        if os.path.exists(thread_path):
            with open(thread_path, 'r', encoding='utf-8') as f:
                thread_data = json.load(f)
                return jsonify({'success': True, 'messages': thread_data.get('messages', [])})
        else:
            return jsonify({'success': True, 'messages': []})
    
    except Exception as e:
        print(f"Error fetching banned chat messages: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/guest_support')
def guest_support():
    """Chat interface for guests to contact support before login."""
    guest_name = request.args.get('name', 'Guest')
    return render_template('guest_support_chat.html', guest_name=guest_name)


@app.route('/api/guest_chat/send', methods=['POST'])
def send_guest_chat_message():
    """API endpoint for guests to send messages to admin."""
    data = request.get_json()
    guest_name = data.get('guest_name', 'Guest')
    message_text = data.get('message', '').strip()
    
    if not message_text:
        return jsonify({'success': False, 'error': 'Message cannot be empty'}), 400
    
    try:
        # Create a thread ID based on guest name
        thread_id = f"guest_{guest_name}_{int(time.time())}"
        thread_path = _thread_path(thread_id)
        
        # Read existing thread or create new one
        try:
            with open(thread_path, 'r', encoding='utf-8') as f:
                thread_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            thread_data = {
                'thread_id': thread_id,
                'guest_name': guest_name,
                'account_status': 'guest',
                'messages': []
            }
        
        # Add the new message
        message = {
            'sender': guest_name,
            'text': message_text,
            'timestamp': datetime.now().isoformat(),
            'read': False
        }
        thread_data['messages'].append(message)
        
        # Save thread with lock
        with chat_lock:
            with open(thread_path, 'w', encoding='utf-8') as f:
                json.dump(thread_data, f, indent=2, ensure_ascii=False)
        
        return jsonify({'success': True, 'message_id': len(thread_data['messages'])})
    
    except Exception as e:
        print(f"Error saving guest chat message: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/guest_chat/messages', methods=['GET'])
def get_guest_chat_messages():
    """Get messages for guest chat thread."""
    guest_name = request.args.get('name')
    
    if not guest_name:
        return jsonify({'success': False, 'error': 'Guest name not provided'}), 400
    
    try:
        # Find the most recent thread for this guest
        chat_dir = os.path.join(app.root_path, 'data', 'chats')
        if not os.path.exists(chat_dir):
            return jsonify({'success': True, 'messages': []})
        
        # Find threads that match the guest name pattern
        latest_thread = None
        for filename in os.listdir(chat_dir):
            if filename.startswith(f"guest_{guest_name}_"):
                latest_thread = filename
        
        if latest_thread:
            thread_path = os.path.join(chat_dir, latest_thread)
            with open(thread_path, 'r', encoding='utf-8') as f:
                thread_data = json.load(f)
                return jsonify({'success': True, 'messages': thread_data.get('messages', [])})
        else:
            return jsonify({'success': True, 'messages': []})
    
    except Exception as e:
        print(f"Error fetching guest chat messages: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

#=====================================================================================================================
                                    #SELLER REQUESTS & APPROVAL
#=====================================================================================================================

@app.route('/seller_requests', methods=['GET'])
def seller_requests_dashboard():
    # Redirect legacy URL to unified page
    return redirect(url_for('register_requests'))

@app.route('/rider_requests', methods=['GET'])
def rider_requests_dashboard():
    # Redirect legacy URL to unified page
    return redirect(url_for('register_requests'))

#=====================================================================================================================
                                    #UNIFIED REGISTRATION REQUESTS
#=====================================================================================================================

@app.route('/register_requests', methods=['GET'])
def register_requests():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Sort order
    order = 'ASC' if request.args.get('order', 'desc').lower() == 'asc' else 'DESC'

    # Sellers pending approval
    cursor.execute(f"""
        SELECT id, first_name, last_name, email, phone_number, address, 'Seller' as user_type, document_id, bir
        FROM seller_requests
        ORDER BY id {order}
    """)
    sellers = cursor.fetchall()

    # Riders pending approval
    cursor.execute(f"""
        SELECT id, first_name, last_name, email, phone_number, address, 'Rider' as user_type, document_id, NULL as bir
        FROM rider_requests
        ORDER BY id {order}
    """)
    riders = cursor.fetchall()

    # Approved buyers (for reference)
    cursor.execute(f"""
        SELECT id, first_name, last_name, email, phone_number, address, 'Buyer' as user_type, NULL as document_id, NULL as bir
        FROM users
        WHERE user_type = 'Buyer'
        ORDER BY id {order}
    """)
    buyers = cursor.fetchall()

    # Combine into one list for a single table
    all_requests = []
    for s in sellers:
        s['source'] = 'seller'
        all_requests.append(s)
    for r in riders:
        r['source'] = 'rider'
        all_requests.append(r)
    for b in buyers:
        b['source'] = 'buyer'
        all_requests.append(b)

    cursor.close()
    conn.close()

    return render_template('register_request.html', items=all_requests)

@app.route('/approve/<int:request_id>', methods=['POST'])
def approve_seller(request_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # First, get all the seller request data including document_id and bir
        cursor.execute("SELECT * FROM seller_requests WHERE id = %s", (request_id,))
        seller_data = cursor.fetchone()

        if seller_data:
            # Insert into users table with all data including documents
            cursor.execute("""
                INSERT INTO users 
                (first_name, last_name, email, phone_number, address, password, user_type, document_id, bir)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                seller_data['first_name'],
                seller_data['last_name'],
                seller_data['email'],
                seller_data['phone_number'],
                seller_data['address'],
                seller_data['password'],
                'Seller',  # Explicitly set user_type
                seller_data['document_id'],  # Include document_id
                seller_data['bir']  # Include BIR
            ))

            # Delete from seller_requests after successful insertion
            cursor.execute("DELETE FROM seller_requests WHERE id = %s", (request_id,))
            conn.commit()
            flash('Seller approved successfully!', 'success')

            # Send approval email notification (text + HTML)
            try:
                msg = Message(
                    'E‑Baby - Registration Approved',
                    sender=app.config["MAIL_USERNAME"],
                    recipients=[seller_data['email']]
                )
                msg.body = (
                    f"Hello {seller_data['first_name']} {seller_data['last_name']},\n\n"
                    "Great news! Your seller account has been approved by our admin team.\n"
                    "You can now sign in and start listing your products.\n\n"
                    "If you didn’t request this account, please contact support immediately.\n"
                )
                msg.html = build_approval_email_html(seller_data['first_name'], seller_data['last_name'], 'Seller')
                mail.send(msg)
            except Exception as e:
                print(f"Error sending approval email: {e}")
        else:
            flash('Seller request not found!', 'error')

    except Exception as e:
        conn.rollback()
        print(f"Error in approve_seller: {e}")  # Debug print
        flash('Error approving seller!', 'error')
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('seller_requests_dashboard'))

@app.route('/reject_seller/<int:seller_id>', methods=['POST'])
def reject_seller(seller_id):
    reason = request.form['reason']  # Capture the rejection reason
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)  # Use dictionary cursor

    # Get seller email to send rejection reason
    cursor.execute("SELECT email FROM seller_requests WHERE id = %s", (seller_id,))
    seller = cursor.fetchone()  # This will now return a dictionary

    if seller:
        # Send the rejection reason via email
        msg = Message("E‑Baby - Registration Rejected",
                      sender=app.config["MAIL_USERNAME"],
                      recipients=[seller['email']])  # Access email as a dictionary key
        msg.body = (
            "Hello,\n\n"
            "Thank you for applying for a seller account at E‑Baby. Unfortunately, we cannot approve your application at this time.\n\n"
            f"Reason from admin: {reason}\n\n"
            "You may reply to this email if you have questions or would like to re‑apply.\n"
        )
        msg.html = build_rejection_email_html('', '', 'Seller', reason)
        mail.send(msg)

        # Optionally, remove or archive the seller from the seller_requests table
        cursor.execute("DELETE FROM seller_requests WHERE id = %s", (seller_id,))
        conn.commit()
    
    cursor.close()
    conn.close()
    return redirect(url_for('seller_requests_dashboard'))

@app.route('/approve_rider/<int:request_id>', methods=['POST'])
def approve_rider(request_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # First, get all the rider request data including document_id
        cursor.execute("SELECT * FROM rider_requests WHERE id = %s", (request_id,))
        rider_data = cursor.fetchone()

        if rider_data:
            # Insert into users table with all data including document
            cursor.execute("""
                INSERT INTO users 
                (first_name, last_name, email, phone_number, address, password, user_type, document_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                rider_data['first_name'],
                rider_data['last_name'],
                rider_data['email'],
                rider_data['phone_number'],
                rider_data['address'],
                rider_data['password'],
                'Rider',  # Explicitly set user_type
                rider_data['document_id']  # Include document_id
            ))

            # Delete from rider_requests after successful insertion
            cursor.execute("DELETE FROM rider_requests WHERE id = %s", (request_id,))
            conn.commit()
            flash('Rider approved successfully!', 'success')

            # Send approval email notification (text + HTML)
            try:
                msg = Message(
                    'E‑Baby - Registration Approved',
                    sender=app.config["MAIL_USERNAME"],
                    recipients=[rider_data['email']]
                )
                msg.body = (
                    f"Hello {rider_data['first_name']} {rider_data['last_name']},\n\n"
                    "Your rider account has been approved by our admin team.\n"
                    "You can now sign in and manage deliveries.\n\n"
                    "If you didn’t request this account, please contact support immediately.\n"
                )
                msg.html = build_approval_email_html(rider_data['first_name'], rider_data['last_name'], 'Rider')
                mail.send(msg)
            except Exception as e:
                print(f"Error sending approval email: {e}")
        else:
            flash('Rider request not found!', 'error')

    except Exception as e:
        conn.rollback()
        print(f"Error in approve_rider: {e}")  # Debug print
        flash('Error approving rider!', 'error')
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('rider_requests_dashboard'))

@app.route('/reject_rider/<int:rider_id>', methods=['POST'])
def reject_rider(rider_id):
    reason = request.form['reason']  # Capture the rejection reason
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)  # Use dictionary cursor

    # Get rider email to send rejection reason
    cursor.execute("SELECT email FROM rider_requests WHERE id = %s", (rider_id,))
    rider = cursor.fetchone()  # This will now return a dictionary

    if rider:
        # Send the rejection reason via email
        msg = Message("E‑Baby - Registration Rejected",
                      sender=app.config["MAIL_USERNAME"],
                      recipients=[rider['email']])  # Access email as a dictionary key
        msg.body = (
            "Hello,\n\n"
            "Thank you for applying for a rider account at E‑Baby. Unfortunately, we cannot approve your application at this time.\n\n"
            f"Reason from admin: {reason}\n\n"
            "You may reply to this email if you have questions or would like to re‑apply.\n"
        )
        msg.html = build_rejection_email_html('', '', 'Rider', reason)
        mail.send(msg)

        # Optionally, remove or archive the rider from the rider_requests table
        cursor.execute("DELETE FROM rider_requests WHERE id = %s", (rider_id,))
        conn.commit()
    
    cursor.close()
    conn.close()
    return redirect(url_for('rider_requests_dashboard'))

#=====================================================================================================================  
                                    #IMAGE UPLOADS HANDLER
#=====================================================================================================================

# Define where to save uploaded files
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload_image', methods=['POST'])
def upload_image():
    # Check if the POST request has the file part
    if 'product_image' not in request.files:
        flash('No file part', 'error')
        return redirect(request.url)

    file = request.files['product_image']

    # If user does not select a file, browser submits an empty file without a filename
    if file.filename == '':
        flash('No selected file', 'error')
        return redirect(request.url)

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return redirect(url_for('add_new_product'))

    flash('Invalid file format. Only jpg, jpeg, and png allowed.', 'error')
    return redirect(request.url)

@app.route('/upload_profile_pic', methods=['POST'])
def upload_profile_pic():
    if 'profile_pic' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'})
    
    file = request.files['profile_pic']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'})
    
    if file and allowed_file(file.filename):
        # Create unique filename using email and timestamp
        filename = f"profile_pic_{session['email']}_{int(time.time())}.{file.filename.rsplit('.', 1)[1].lower()}"
        filepath = os.path.join(app.config['PROFILE_PICS_FOLDER'], filename)
        file.save(filepath)
        
        # Use forward slashes for database path
        db_path = 'uploads/profile_pics/' + filename
        
        # Update database with new profile picture path
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET profile_pic = %s WHERE email = %s",
            (db_path, session['email'])
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'image_url': url_for('static', filename=db_path)
        })
    
    return jsonify({'success': False, 'error': 'Invalid file type'})

@app.route('/upload_banner', methods=['POST'])
def upload_banner():
    if 'banner' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'})
    
    file = request.files['banner']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'})
    
    if file and allowed_file(file.filename):
        # Create unique filename using email and timestamp
        filename = f"banner_{session['email']}_{int(time.time())}.{file.filename.rsplit('.', 1)[1].lower()}"
        filepath = os.path.join(app.config['BANNERS_FOLDER'], filename)
        file.save(filepath)
        
        # Use forward slashes for database path
        db_path = 'uploads/banners/' + filename
        
        # Update database with new banner path
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET banner_image = %s WHERE email = %s",
            (db_path, session['email'])
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'image_url': url_for('static', filename=db_path)
        })
    
    return jsonify({'success': False, 'error': 'Invalid file type'})

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

#=====================================================================================================================
                                        #CART MANAGEMENT
#=====================================================================================================================

@app.route('/cart')
def cart():
    user_email = session.get('email')
    
    if not user_email:
        return redirect(url_for('login'))
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Fetch items from `cart` for the current user and order by the most recent
    # Also get product details to ensure we have product_id (INT id from products table)
    cursor.execute('''
        SELECT c.id, c.product_id, c.name, c.price, c.quantity, c.color, c.image, c.size 
        FROM cart c
        WHERE c.email = %s 
        ORDER BY c.id DESC
    ''', (user_email,))
    cart_items = cursor.fetchall()

    # Calculate pricing breakdown
    subtotal = sum(float(item['price']) * int(item['quantity']) for item in cart_items)
    shipping_fee = 38.00  # Fixed shipping fee
    tax_rate = 0.025  # 2.5% tax
    tax = subtotal * tax_rate
    total = subtotal + shipping_fee + tax

    cursor.close()
    connection.close()

    # Pass the fetched data to the template with pricing breakdown
    return render_template('cart.html', cart_items=cart_items, subtotal=subtotal, shipping_fee=shipping_fee, tax=tax, total=total)

@app.route('/test_json')
def test_json():
    """Test endpoint to verify jsonify works"""
    print("Test endpoint called")
    result = {'success': True, 'message': 'test'}
    print(f"About to return: {result}")
    return jsonify(result)

@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    conn = None
    cursor = None
    
    try:
        data = request.json
        user_email = session['email']
        
        print(f"\n=== ADD_TO_CART START ===")
        print(f"User: {user_email}")
        print(f"Data: {data}")
        
        # Validate required fields
        required_fields = ['product_id', 'name', 'price', 'image', 'color', 'size', 'quantity']
        for field in required_fields:
            if field not in data:
                print(f"Missing required field: {field}")
                return jsonify({'success': False, 'message': f'Missing required field: {field}'})
        
        # Convert and validate data types
        try:
            product_id = int(data['product_id'])
            new_quantity = int(data['quantity'])
            price = float(data['price'])
            print(f"Validated data types: product_id={product_id}, qty={new_quantity}, price={price}")
        except (ValueError, TypeError) as e:
            print(f"Data type conversion error: {str(e)}")
            return jsonify({'success': False, 'message': f'Invalid data types: {str(e)}'})
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        print("Database connection established")
        
        # Ensure size is a string, not None
        size_value = data.get('size') or ''
        color_value = data.get('color') or ''
        print(f"Color: {color_value}, Size: {size_value}")
        
        # Check if product and variant exist and have stock
        cursor.execute('''
            SELECT pv.stock FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE p.id = %s AND pv.color = %s AND pv.size = %s
        ''', (product_id, color_value, size_value))
        
        variant_stock = cursor.fetchone()
        
        if not variant_stock:
            cursor.close()
            conn.close()
            print(f"Variant not found for product {product_id}, color={color_value}, size={size_value}")
            return jsonify({'success': False, 'message': 'This product variant is not available'})
        
        if variant_stock['stock'] <= 0:
            cursor.close()
            conn.close()
            print("Product variant out of stock")
            return jsonify({'success': False, 'outOfStock': True, 'message': 'This product variant is out of stock'})
        
        # Check if requested quantity is available
        if new_quantity > variant_stock['stock']:
            cursor.close()
            conn.close()
            print(f"Insufficient stock: requested {new_quantity}, available {variant_stock['stock']}")
            return jsonify({'success': False, 'insufficientStock': True, 'available': variant_stock['stock'], 'message': f'Only {variant_stock["stock"]} items available'})
        
        # Check if product already exists in cart
        cursor.execute('''
            SELECT * FROM cart 
            WHERE email = %s AND product_id = %s AND color = %s AND size = %s
        ''', (user_email, product_id, color_value, size_value))
        
        existing_item = cursor.fetchone()
        print(f"Existing item: {existing_item is not None}")
        
        if existing_item:
            # Update quantity if item exists
            new_qty = existing_item['quantity'] + new_quantity
            cursor.execute('''
                UPDATE cart 
                SET quantity = %s 
                WHERE email = %s AND product_id = %s AND color = %s AND size = %s
            ''', (new_qty, user_email, product_id, color_value, size_value))
            print(f"Updated existing item: qty={new_qty}")
        else:
            # Insert new item if it doesn't exist
            seller_email = data.get('seller_email') or ''
            print(f"Inserting new item. seller_email={seller_email}")
            
            cursor.execute('''
                INSERT INTO cart (email, product_id, name, price, image, color, size, quantity, seller_email)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                user_email,
                product_id,
                data['name'],
                price,
                data['image'],
                color_value,
                size_value,
                new_quantity,
                seller_email
            ))
            print("Inserted new cart item")
        
        conn.commit()
        print("Commit successful")
        cursor.close()
        conn.close()
        print("Connections closed")
        
        try:
            print("About to call jsonify")
            result = jsonify({'success': True})
            print(f"jsonify returned: {result}")
            print("About to return result")
            return result
        except Exception as jsonify_err:
            print(f"ERROR in jsonify: {str(jsonify_err)}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'message': f'Error in jsonify: {str(jsonify_err)}'})
        
    except Exception as e:
        print(f"\n=== ADD_TO_CART ERROR ===")
        print(f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=== END ERROR ===\n")
        
        # Close connections if they exist
        try:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
        except Exception as close_err:
            print(f"Error closing connections: {str(close_err)}")
        
        return jsonify({'success': False, 'message': str(e)})
    
@app.route('/get_cart_count')
def get_cart_count():
    user_email = session.get('email')
    if not user_email:
        return jsonify({'count': 0})
    
    connection = get_db_connection()
    cursor = connection.cursor()
    
    cursor.execute('SELECT SUM(quantity) FROM cart WHERE email = %s', (user_email,))
    count = cursor.fetchone()[0] or 0
    
    cursor.close()
    connection.close()
    
    return jsonify({'count': count})

@app.route('/get_wishlist_preview')
def get_wishlist_preview():
    user_email = session.get('email')
    if not user_email:
        return jsonify({'items': []})
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT id, product_id, name, price, image 
        FROM wishlist 
        WHERE email = %s 
        ORDER BY id DESC 
        LIMIT 3
    ''', (user_email,))
    items = cursor.fetchall()
    
    cursor.close()
    connection.close()
    
    return jsonify({'items': items})

@app.route('/cart/delete_selected', methods=['POST'])
def delete_selected_items():
    selected_ids = request.json.get('ids', [])
    user_email = session.get('email')  # Kunin ang email ng user mula sa session

    if not selected_ids:
        return jsonify({'success': False, 'error': 'No IDs provided for deletion'}), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    # Delete items from cart for the current user only
    format_strings = ','.join(['%s'] * len(selected_ids))
    cursor.execute(f'DELETE FROM cart WHERE id IN ({format_strings}) AND email = %s', tuple(selected_ids + [user_email]))
    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({'success': True})


@app.route('/update-cart-quantity', methods=['POST'])
def update_cart_quantity():
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    try:
        data = request.json
        user_email = session['email']
        product_id = int(data['product_id'])  # Convert to INT to match cart table
        change = int(data['change'])  # Ensure change is an integer
        
        print(f"Update cart quantity - User: {user_email}, Product ID: {product_id}, Change: {change}")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get current quantity
        cursor.execute('''
            SELECT id, quantity FROM cart 
            WHERE email = %s AND product_id = %s
        ''', (user_email, product_id))
        
        current_item = cursor.fetchone()
        if not current_item:
            print(f"Item not found - Email: {user_email}, Product ID: {product_id}")
            return jsonify({'success': False, 'message': 'Item not found'})
        
        print(f"Found item - Cart ID: {current_item['id']}, Current Qty: {current_item['quantity']}")
        
        new_quantity = int(current_item['quantity']) + change
        
        if new_quantity < 1:
            return jsonify({'success': False, 'message': 'Quantity cannot be less than 1'})
        
        # Update quantity
        cursor.execute('''
            UPDATE cart 
            SET quantity = %s 
            WHERE email = %s AND product_id = %s
        ''', (new_quantity, user_email, product_id))
        
        conn.commit()
        print(f"Updated quantity to: {new_quantity}")
        cursor.close()
        conn.close()
        
        return jsonify({'success': True})
        
    except Exception as e:
        print("Error updating cart:", str(e))
        return jsonify({'success': False, 'message': 'Error updating cart'})

@app.route('/remove-from-cart', methods=['POST'])
def remove_from_cart():
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        color = data.get('color')
        size = data.get('size')
        user_email = session.get('email')

        if not user_email:
            return jsonify({'success': False, 'error': 'Not logged in'}), 401

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute('''
            DELETE FROM cart 
            WHERE product_id = %s AND color = %s AND size = %s AND email = %s
        ''', (product_id, color, size, user_email))
        
        connection.commit()
        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()
    
@app.route('/get_cart_preview')
def get_cart_preview():
    if 'email' not in session:
        return jsonify({'items': []})
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('''
            SELECT * FROM cart 
            WHERE email = %s 
            ORDER BY id DESC
        ''', (session['email'],))
        
        items = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({'items': items})
        
    except Exception as e:
        print("Error getting cart preview:", str(e))  # For debugging
        return jsonify({'items': []})


#=====================================================================================================================
                                    #WISHLIST HANDLER
#=====================================================================================================================

@app.route('/view-wishlist')
def view_wishlist():
    if 'email' not in session:
        flash('Please login to view your wishlist', 'error')
        return redirect(url_for('login'))
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                w.id,
                w.product_id,
            SELECT 
                w.id,
                w.product_id,
                w.name,
                w.price,
                w.image,
                w.seller_email,
                w.date_added
            FROM wishlist w
            WHERE w.email = %s
            ORDER BY w.date_added DESC
        """, (session['email'],))
        
        wishlist_items = cursor.fetchall()
        
        # Ensure no extra columns exist - clean the data
        clean_items = []
        if wishlist_items:
            for item in wishlist_items:
                try:
                    clean_item = {
                        'id': item.get('id'),
                        'product_id': item.get('product_id'),
                        'name': item.get('name', ''),
                        'price': float(item.get('price', 0)),
                        'image': item.get('image') or '',  # Ensure image is never None
                        'seller_email': item.get('seller_email') or '',  # Include seller_email
                        'date_added': item.get('date_added')  # Keep as datetime for strftime
                    }
                    clean_items.append(clean_item)
                except Exception as item_err:
                    print(f"[ERROR /view-wishlist] Processing item: {str(item_err)}")
                    print(f"[ERROR /view-wishlist] Item data: {item}")
                    import traceback
                    traceback.print_exc()
                    continue
        
        cursor.close()
        conn.close()
        
        return render_template('wishlist.html', wishlist_items=clean_items)
    
    except Exception as e:
        print(f"[ERROR /view-wishlist] fetching wishlist: {e}")
        import traceback
        traceback.print_exc()
        flash('An error occurred while loading your wishlist', 'error')
        return redirect(url_for('homepage'))

@app.route('/add-to-wishlist', methods=['POST'])
def add_to_wishlist():
    """Add an item to the wishlist"""
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if item already exists in wishlist
        cursor.execute('''
            SELECT * FROM wishlist 
            WHERE email = %s AND product_id = %s
        ''', (session['email'], data['product_id']))
        
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Item already in wishlist'})
        
        # Add to wishlist
        cursor.execute('''
            INSERT INTO wishlist (email, product_id, name, price, image, seller_email)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (
            session['email'],
            data['product_id'],
            data['name'],
            data['price'],
            data['image'],
            data.get('seller_email')  # Get seller_email from the request
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Added to wishlist'})
        
    except Exception as e:
        print("Error:", str(e))
        return jsonify({'success': False, 'message': 'Error adding to wishlist'})

@app.route('/wishlist/remove', methods=['POST'])
def remove_from_wishlist():
    """Remove items from the wishlist"""
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    try:
        data = request.get_json()
        item_ids = data.get('ids', [])
        
        if not item_ids:
            return jsonify({'success': False, 'message': 'No items selected'})
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create placeholders for SQL query
        placeholders = ','.join(['%s'] * len(item_ids))
        
        # Delete selected items
        cursor.execute(f"""
            DELETE FROM wishlist 
            WHERE id IN ({placeholders}) AND email = %s
        """, item_ids + [session['email']])
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Items removed from wishlist'})
        
    except Exception as e:
        print(f"Error removing from wishlist: {e}")
        return jsonify({'success': False, 'message': 'An error occurred'})

@app.route('/get_wishlist_count')
def get_wishlist_count():
    user_email = session.get('email')
    if not user_email:
        return jsonify({'count': 0})
    
    connection = get_db_connection()
    cursor = connection.cursor()
    
    cursor.execute('SELECT COUNT(*) FROM wishlist WHERE email = %s', (user_email,))
    count = cursor.fetchone()[0]
    
    cursor.close()
    connection.close()
    
    return jsonify({'count': count})
    
#=====================================================================================================================
                                        #CHECKOUT PRODUCTS HANDLER
#=====================================================================================================================

@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    if 'email' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            selected_ids = data.get('ids', [])
            user_email = session['email']
            
            if not selected_ids:
                return jsonify({'success': False, 'error': 'No items selected for checkout'})
            
            # Store selected cart item IDs in session
            session['checkout_cart_ids'] = selected_ids
            session.modified = True
            
            return jsonify({'success': True})
            
        except Exception as e:
            print("Checkout Error:", str(e))
            return jsonify({'success': False, 'error': str(e)})
    
    # GET request - display checkout page
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    user_email = session['email']
    
    # Simply fetch the selected items from cart that were marked for checkout
    # If checkout_cart_ids is set, use those; otherwise use all cart items
    if 'checkout_cart_ids' in session and session['checkout_cart_ids']:
        selected_ids = session['checkout_cart_ids']
        format_strings = ','.join(['%s'] * len(selected_ids))
        cursor.execute(f"""
            SELECT id, product_id, name, price, quantity, color, image, size, email, seller_email
            FROM cart
            WHERE id IN ({format_strings}) AND email = %s
        """, tuple(selected_ids) + (user_email,))
    else:
        cursor.execute("""
            SELECT id, product_id, name, price, quantity, color, image, size, email, seller_email
            FROM cart
            WHERE email = %s
        """, (user_email,))
    
    checkout_items = cursor.fetchall()
    
    # Calculate pricing breakdown
    subtotal = sum(float(item['price']) * int(item['quantity']) for item in checkout_items)
    shipping_fee = 38.00
    tax_rate = 0.025
    tax = subtotal * tax_rate
    total_price = subtotal + shipping_fee + tax
    
    cursor.close()
    connection.close()
    
    return render_template('checkout.html', 
                         cart_items=checkout_items, 
                         subtotal=subtotal,
                         shipping_fee=shipping_fee,
                         tax=tax,
                         total_price=total_price)

@app.route('/remove_from_checkout', methods=['POST'])
def remove_from_checkout():
    try:
        data = request.get_json()
        item_ids = data.get('ids')
        user_email = session.get('email')

        if not user_email:
            return jsonify({'success': False, 'error': 'Not logged in'}), 401

        connection = get_db_connection()
        cursor = connection.cursor()

        # Remove from cart (since checkout reads from cart)
        format_strings = ','.join(['%s'] * len(item_ids))
        cursor.execute(
            f"DELETE FROM cart WHERE id IN ({format_strings}) AND email = %s",
            tuple(item_ids + [user_email])
        )
        
        # Also remove from checkout table if it exists
        cursor.execute(
            f"DELETE FROM checkout WHERE id IN ({format_strings}) AND email = %s",
            tuple(item_ids + [user_email])
        )
        
        # Update session stored IDs to remove the deleted ones
        if 'checkout_cart_ids' in session:
            session['checkout_cart_ids'] = [id for id in session['checkout_cart_ids'] if id not in item_ids]
        
        connection.commit()
        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/return_to_cart', methods=['POST'])
def return_to_cart():
    selected_ids = request.json.get('ids')
    user_email = session.get('email')  # Get the email from the session

    if not selected_ids:
        return jsonify(success=False, error="No items selected to return to the cart"), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Fetch items from the checkout table, including seller_email and prod_id
        format_strings = ', '.join(['%s'] * len(selected_ids))
        cursor.execute(
            f"SELECT id, name, price, quantity, color, image, size, seller_email, product_id FROM checkout WHERE id IN ({format_strings}) AND email = %s",
            tuple(selected_ids + [user_email])
        )
        checkout_items = cursor.fetchall()

        if not checkout_items:
            return jsonify(success=False, error="No items found to return to the cart"), 400

        # Insert each item back into the cart, including seller_email and prod_id
        for item in checkout_items:
            cursor.execute(
                """
                INSERT INTO cart (id, name, price, quantity, color, image, size, email, seller_email, product_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (item['id'], item['name'], item['price'], item['quantity'],
                 item['color'], item['image'], item['size'], user_email, item['seller_email'], item['product_id'])
            )

        # Optionally, remove items from the checkout table if necessary
        cursor.execute(
            f"DELETE FROM checkout WHERE id IN ({format_strings}) AND email = %s",
            tuple(selected_ids + [user_email])
        )

        connection.commit()

    except mysql.connector.Error as err:
        connection.rollback()
        return jsonify(success=False, error=f"Error occurred while returning items: {err}"), 500
    finally:
        cursor.close()
        connection.close()

    return jsonify(success=True)


@app.route('/checkout/delete/<int:item_id>', methods=['POST'])
def delete_checkout_item(item_id):
    user_email = session.get('email')  # Kunin ang email mula sa session
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # Delete item from the checkout table for the current user only
        cursor.execute("DELETE FROM checkout WHERE id = %s AND email = %s", (item_id, user_email))
        connection.commit()

        return jsonify({"success": True})
    except mysql.connector.Error as err:
        connection.rollback()
        return jsonify({"success": False, "error": str(err)})
    finally:
        cursor.close()
        connection.close()

@app.route('/confirm_order', methods=['POST'])
def confirm_order():
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Please login first'})
    
    try:
        data = request.get_json()
        items = data.get('items', [])
        payment_method = data.get('payment_method')
        delivery_address = data.get('address')
        user_email = session['email']

        if not items:
            return jsonify({'success': False, 'error': 'No items in order'})

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get current date/time
        order_date = datetime.now()
        
        # Calculate order totals (subtotal, shipping, tax, total)
        order_subtotal = sum(float(item['price']) * int(item['quantity']) for item in items)
        shipping_fee = 38.00  # Fixed shipping fee
        tax_rate = 0.025  # 2.5% tax
        order_tax = order_subtotal * tax_rate
        order_total = order_subtotal + shipping_fee + order_tax

        successful_orders = 0
        failed_items = []
        
        # Calculate rider commission based on total order amount: for every 2000, add 5 pesos
        # Formula: (total_price / 2000) * 5
        rider_commission_total = (order_total / 2000.0) * 5.0

        # Insert each item as a separate order
        for item in items:
            try:
                # Get seller email and other product details from products table
                cursor.execute("""
                    SELECT p.id, p.name, p.seller_email, p.image
                    FROM products p
                    WHERE p.name = %s
                    LIMIT 1
                """, (item['name'],))
                
                product_data = cursor.fetchone()
                if not product_data:
                    print(f"Product not found: {item['name']}")
                    failed_items.append(item['name'])
                    continue  # Skip if product not found
                    
                product_id = product_data['id']
                seller_email = product_data['seller_email']
                product_image = product_data['image']
                
                # Get the variant stock
                color_value = item.get('color', '').strip()
                size_value = item.get('size', '').strip()
                
                cursor.execute("""
                    SELECT stock FROM product_variants
                    WHERE product_id = %s AND color = %s AND size = %s
                """, (product_id, color_value, size_value))
                
                variant_data = cursor.fetchone()
                if not variant_data:
                    print(f"Variant not found for product_id={product_id}, color='{color_value}', size='{size_value}'")
                    failed_items.append(f"{item['name']} (Color: {color_value}, Size: {size_value})")
                    continue
                    
                current_stock = variant_data['stock']
                order_quantity = item.get('quantity', 1)
                
                # Check if stock is sufficient
                if current_stock < order_quantity:
                    print(f"Insufficient stock: product_id={product_id}, available={current_stock}, requested={order_quantity}")
                    failed_items.append(f"{item['name']} - Insufficient stock")
                    continue
                
                print(f"Processing order: product_id={product_id}, current_stock={current_stock}, order_quantity={order_quantity}")

                # Generate transaction ID
                transaction_id = f"TXN{order_date.strftime('%Y%m%d%H%M%S')}{item['id']}"
                
                # Calculate item subtotal
                item_subtotal = float(item['price']) * int(order_quantity)
                
                # Calculate proportional shipping and tax for this item
                # (proportional to item's share of total subtotal)
                # Note: shipping fee will be paid to rider, so not added to item_total for order record
                item_shipping = (item_subtotal / order_subtotal) * shipping_fee if order_subtotal > 0 else 0
                item_tax = (item_subtotal / order_subtotal) * order_tax if order_subtotal > 0 else 0
                item_total = item_subtotal + item_tax  # No shipping added here - goes to rider separately

                # Calculate proportional commission for this item
                item_commission = (item_subtotal / order_subtotal) * rider_commission_total if order_subtotal > 0 else 0
                
                # Insert into orders table with the correct seller_email
                # Store the total without shipping (shipping goes to rider)
                cursor.execute("""
                    INSERT INTO orders 
                    (email, name, total_price, subtotal, shipping_fee, tax, quantity, image, status, 
                    payment_method, date, delivery_address, seller_email, 
                    transaction_id, action_history, product_id, color, size, commission_amount, commission_rate)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_email,
                    item['name'],
                    item_total,  # Store total without shipping (shipping goes to rider)
                    item_subtotal,  # Store item subtotal
                    item_shipping,  # Store proportional shipping (reserved for rider)
                    item_tax,  # Store proportional tax (admin revenue)
                    order_quantity,
                    product_image,
                    'Pending',
                    payment_method,
                    order_date,
                    delivery_address,
                    seller_email,  # Use the seller_email from products table
                    transaction_id,
                    'Order placed',
                    product_id,
                    color_value,
                    size_value,
                    item_commission,  # Store calculated commission for rider
                    5.0  # Commission rate per 2000 pesos
                ))

                # Reduce stock from product_variants table
                new_stock = max(0, current_stock - order_quantity)
                print(f"Updating variant stock for product_id={product_id}, color='{color_value}', size='{size_value}': {current_stock} - {order_quantity} = {new_stock}")
                cursor.execute("""
                    UPDATE product_variants 
                    SET stock = %s 
                    WHERE product_id = %s AND color = %s AND size = %s
                """, (new_stock, product_id, color_value, size_value))
                
                # Verify the update
                cursor.execute("SELECT stock FROM product_variants WHERE product_id = %s AND color = %s AND size = %s", (product_id, color_value, size_value))
                updated = cursor.fetchone()
                print(f"Stock after update: {updated['stock'] if updated else 'Not found'}")
                
                successful_orders += 1
                
            except Exception as item_error:
                print(f"Error processing item {item['name']}: {str(item_error)}")
                failed_items.append(f"{item['name']} - {str(item_error)}")
                continue

        if successful_orders == 0:
            conn.rollback()
            error_msg = 'Unable to process any items. ' + ', '.join(failed_items) if failed_items else 'Unknown error'
            return jsonify({'success': False, 'error': error_msg})

        # Remove items from cart after order is confirmed
        if 'checkout_cart_ids' in session and session['checkout_cart_ids']:
            selected_ids = session['checkout_cart_ids']
            if selected_ids:
                format_strings = ','.join(['%s'] * len(selected_ids))
                cursor.execute(f"""
                    DELETE FROM cart 
                    WHERE id IN ({format_strings}) AND email = %s
                """, tuple(selected_ids) + (user_email,))
                # Clear the session stored IDs
                session.pop('checkout_cart_ids', None)
        
        # Clear the checkout table for this user (if it exists)
        cursor.execute("DELETE FROM checkout WHERE email = %s", (user_email,))
        
        conn.commit()
        
        if failed_items:
            print(f"Order partially completed. Failed items: {failed_items}")
        
        return jsonify({'success': True, 'message': f'{successful_orders} item(s) ordered successfully'})

    except Exception as e:
        print("Order Error:", str(e))
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

#=====================================================================================================================
                                        #ORDERS HANDLER
#=====================================================================================================================

@app.route('/orders')
def orders():
    user_email = session.get('email')
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Modified query to include all necessary fields including rider_email
    cursor.execute("""
        SELECT o.*, p.category, p.price, p.size, p.color
        FROM orders o
        LEFT JOIN products p ON o.name = p.name
        WHERE o.email = %s
    """, (user_email,))
    
    orders = cursor.fetchall()

    # Handle cases where product info might be missing and convert date string to datetime
    for order in orders:
        # Set default values if product info is missing
        if order.get('price') is None:
            order['price'] = order['total_price'] / order['quantity']
        if order.get('category') is None:
            order['category'] = 'N/A'
        if order.get('size') is None:
            order['size'] = 'N/A'
        if order.get('color') is None:
            order['color'] = 'N/A'
            
        # Convert date string to datetime object if it's a string
        if isinstance(order['date'], str):
            try:
                order['date'] = datetime.strptime(order['date'], '%Y-%m-%d %H:%M:%S')
            except ValueError:
                # If the date string is in a different format, use a default date
                order['date'] = datetime.now()

    cursor.close()
    connection.close()
    return render_template('orders.html', orders=orders)

@app.route('/mark_as_received/<int:order_id>', methods=['POST'])
def mark_as_received(order_id):
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Please login first'})
    
    user_email = session.get('email')
    connection = get_db_connection()

    try:
        cursor = connection.cursor(dictionary=True)
        
        # Step 1: Update the status to "Received" for the current user's order
        cursor.execute(
            "UPDATE orders SET status = 'Received' WHERE id = %s AND email = %s",
            (order_id, user_email)
        )
        
        # Step 2: Retrieve the order details (product_id and quantity)
        cursor.execute(
            "SELECT product_id, quantity FROM orders WHERE id = %s AND email = %s",
            (order_id, user_email)
        )
        order = cursor.fetchone()

        if order:
            product_id = order['product_id']
            quantity = int(order['quantity'])
            
            # Step 3: Increment the sales count for the product
            cursor.execute(
                "UPDATE products SET sales = COALESCE(sales, 0) + %s WHERE id = %s",
                (quantity, product_id)
            )
        
        connection.commit()
        return jsonify({'success': True, 'message': 'Order marked as received and sales updated'})
        
    except Exception as e:
        connection.rollback()
        print(f"Error marking order as received: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})
    finally:
        cursor.close()
        connection.close()

def send_cancellation_email(seller_email, order_name, reason, customer_email):
    msg = Message(
        'Order Cancellation Notification',
        sender='e-baby0@gmail.com',
        recipients=[seller_email]
    )
    msg.body = f"""
    The order '{order_name}' has been canceled.

    Cancellation Reason: {reason}

    Customer Email: {customer_email}
    """
    try:
        mail.send(msg)
    except Exception as e:
        print(f"Error sending email: {e}")


@app.route('/delete_order/<int:order_id>', methods=['POST'])
def delete_order(order_id):
    user_email = session.get('email')
    
    # Handle both JSON and form data
    if request.is_json:
        reason = request.json.get('reason', '').strip()
    else:
        reason = request.form.get('reason', '').strip()
    
    if not reason:
        return jsonify({'success': False, 'error': 'Cancellation reason is required'})
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Get order details, including the seller's email, customer email, product_id and quantity
        cursor.execute("SELECT seller_email, name, email, product_id, quantity, status FROM orders WHERE id = %s AND email = %s", (order_id, user_email))
        order = cursor.fetchone()

        if order:
            seller_email = order['seller_email']
            order_name = order['name']
            customer_email = order['email']
            product_id = order['product_id']
            order_quantity = order['quantity']
            order_status = order['status']
            
            # Only allow cancellation for orders that haven't been picked up yet
            # Status should be: Pending, Preparing, or Prepared (not Shipping or Delivered)
            cancellable_statuses = ['Pending', 'Preparing', 'Prepared']
            
            if order_status not in cancellable_statuses:
                return jsonify({'success': False, 'error': f'Cannot cancel order with status: {order_status}. Orders can only be cancelled before they are picked up by a rider.'})
            
            # Return the stock back to the product
            if product_id:
                cursor.execute("SELECT quantity FROM products WHERE id = %s", (product_id,))
                product = cursor.fetchone()
                
                if product:
                    current_stock = product['quantity']
                    new_stock = current_stock + order_quantity
                    
                    # Update product stock
                    cursor.execute("""
                        UPDATE products 
                        SET quantity = %s 
                        WHERE id = %s
                    """, (new_stock, product_id))
                    
                    print(f"Stock returned: product_id={product_id}, was {current_stock}, now {new_stock}")
            
            # Change order status to "Cancelled" instead of deleting, and store the reason
            cancellation_entry = f"[CANCELLED] {reason} (Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"
            cursor.execute("""
                UPDATE orders 
                SET status = %s, action_history = CONCAT(COALESCE(action_history, ''), '\n', %s), cancellation_reason = %s
                WHERE id = %s AND email = %s
            """, ('Cancelled', cancellation_entry, reason, order_id, user_email))
            
            connection.commit()

            # Send an email to the seller with the cancellation reason and customer email
            send_cancellation_email(seller_email, order_name, reason, customer_email)

            return jsonify({'success': True, 'message': 'Order cancelled successfully and stock has been returned to inventory'})
        else:
            return jsonify({'success': False, 'error': 'Order not found or you are not authorized to cancel this order.'})

    except mysql.connector.Error as err:
        connection.rollback()
        flash(f"Error cancelling order: {err}", 'error')
    finally:
        cursor.close()
        connection.close()

    return redirect(url_for('orders'))


@app.route('/update_order_status/<int:order_id>', methods=['POST'])
def update_order_status(order_id):
    status = request.form['stat']
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (status, order_id))
    connection.commit()
    cursor.close()
    connection.close()
    return redirect(url_for('seller_order_list'))


# New: Seller can mark order as Preparing, then Finished Preparing (Prepared)
@app.route('/seller/order/prepare/<int:order_id>', methods=['POST'])
def seller_mark_preparing(order_id):
    seller_email = session.get('email')
    if not seller_email:
        return jsonify({'success': False, 'error': 'Not authorized'}), 401

    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        # Ensure seller owns the order and get customer email
        cursor.execute("SELECT email FROM orders WHERE id = %s AND seller_email = %s", (order_id, seller_email))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'success': False, 'error': 'Order not found or unauthorized'}), 404
        
        customer_email = result[0]
        
        # Update status to Preparing
        cursor.execute("UPDATE orders SET status = %s WHERE id = %s AND seller_email = %s", ('Preparing', order_id, seller_email))
        connection.commit()
        
        # Send email notification to customer
        try:
            subject = f"Order #{order_id} is Being Prepared"
            msg = Message(
                subject=subject,
                recipients=[customer_email],
                html=f"""
                <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                    <div style="background-color: white; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #333;">Order Update</h2>
                        <p style="color: #666; font-size: 14px;">Your order #<strong>{order_id}</strong> is now being prepared by the seller.</p>
                        <p style="color: #666; font-size: 14px;">We'll notify you when your order is ready for pickup by our delivery team.</p>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px;">E-Baby Services</p>
                        </div>
                    </div>
                </div>
                """
            )
            mail.send(msg)
        except Exception as email_err:
            print(f"Error sending email: {email_err}")
        
        return jsonify({'success': True, 'message': 'Order marked as Preparing'})
    except Exception as err:
        connection.rollback()
        return jsonify({'success': False, 'error': str(err)}), 500
    finally:
        cursor.close()
        connection.close()


@app.route('/seller/order/finish_preparing/<int:order_id>', methods=['POST'])
def seller_finish_preparing(order_id):
    seller_email = session.get('email')
    if not seller_email:
        return jsonify({'success': False, 'error': 'Not authorized'}), 401

    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        # Ensure seller owns the order and get customer email
        cursor.execute("SELECT email FROM orders WHERE id = %s AND seller_email = %s", (order_id, seller_email))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'success': False, 'error': 'Order not found or unauthorized'}), 404
        
        customer_email = result[0]
        
        # Move to Prepared so riders can see it
        cursor.execute("UPDATE orders SET status = %s WHERE id = %s AND seller_email = %s", ('Prepared', order_id, seller_email))
        connection.commit()
        
        # Send email notification to customer
        try:
            subject = f"Order #{order_id} is Ready for Delivery"
            msg = Message(
                subject=subject,
                recipients=[customer_email],
                html=f"""
                <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                    <div style="background-color: white; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #333;">Order Update</h2>
                        <p style="color: #666; font-size: 14px;">Great news! Your order #<strong>{order_id}</strong> is now ready for delivery.</p>
                        <p style="color: #666; font-size: 14px;">Our delivery team will be picking up your order shortly. You'll receive a tracking update soon.</p>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px;">E-Baby Services</p>
                        </div>
                    </div>
                </div>
                """
            )
            mail.send(msg)
        except Exception as email_err:
            print(f"Error sending email: {email_err}")
        
        return jsonify({'success': True, 'message': 'Order marked as Prepared'})
    except Exception as err:
        connection.rollback()
        return jsonify({'success': False, 'error': str(err)}), 500
    finally:
        cursor.close()
        connection.close()


# New: Riders view all Prepared orders and can deliver
@app.route('/rider_prepared_orders')
def rider_prepared_orders():
    # Optional auth: show page to logged-in riders; allow viewing for now
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM orders
        WHERE status = 'Prepared'
        ORDER BY date DESC
    """)
    orders = cursor.fetchall()
    cursor.close()
    connection.close()
    return render_template('rider_prepared_orders.html', orders=orders)


@app.route('/rider/order/accept/<int:order_id>', methods=['POST'])
def rider_accept_order(order_id):
    """Accept an order for delivery - changes status to 'Shipping'"""
    if 'email' not in session or session.get('user_type') != 'Rider':
        return jsonify({'success': False, 'error': 'Only riders can accept orders'}), 401

    rider_email = session['email']
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        # Change status from 'Prepared' to 'Shipping' and assign rider
        cursor.execute(
            "UPDATE orders SET status = %s, rider_email = %s WHERE id = %s AND status = 'Prepared'",
            ('Shipping', rider_email, order_id)
        )
        connection.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Order not found or already claimed'}), 404
        
        return jsonify({'success': True, 'message': 'Order accepted and marked as Shipping'})
    except Exception as err:
        connection.rollback()
        return jsonify({'success': False, 'error': str(err)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/rider/order/complete/<int:order_id>', methods=['POST'])
def rider_complete_order(order_id):
    """Complete delivery - changes status to 'Received' and adds earnings (commission + shipping)"""
    if 'email' not in session or session.get('user_type') != 'Rider':
        return jsonify({'success': False, 'error': 'Only riders can complete deliveries'}), 401

    rider_email = session['email']
    data = request.get_json()
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        # Get the order details first
        cursor.execute(
            "SELECT * FROM orders WHERE id = %s AND rider_email = %s AND status = 'Shipping'",
            (order_id, rider_email)
        )
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'success': False, 'error': 'Order not found or not assigned to you'}), 404
        
        # Calculate total rider earnings: commission + shipping fee
        commission = float(order.get('commission_amount', 0))
        shipping_fee = float(order.get('shipping_fee', 38.00))
        total_earnings = commission + shipping_fee
        
        # Update order status to 'Delivered' (rider has delivered it, buyer marks as Received)
        cursor.execute(
            "UPDATE orders SET status = %s WHERE id = %s",
            ('Delivered', order_id)
        )
        
        # Create a delivery record with total earnings (commission + shipping) in rider_earnings table
        try:
            cursor.execute("""
                INSERT INTO rider_earnings (rider_email, order_id, amount, date)
                VALUES (%s, %s, %s, NOW())
            """, (rider_email, order_id, total_earnings))
            print(f"Rider earnings inserted: rider={rider_email}, order={order_id}, commission={commission}, shipping={shipping_fee}, total={total_earnings}")
        except Exception as earnings_err:
            # Log the error but return it
            print(f"Error inserting earnings: {earnings_err}")
            connection.rollback()
            return jsonify({'success': False, 'error': f'Failed to record earnings: {str(earnings_err)}'}), 500
        
        connection.commit()
        
        return jsonify({'success': True, 'message': f'Delivery completed! Earnings: ₱{commission:.2f} (commission) + ₱{shipping_fee:.2f} (shipping) = ₱{total_earnings:.2f}'})
    except Exception as err:
        connection.rollback()
        print(f"Error: {err}")
        return jsonify({'success': False, 'error': str(err)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/rider/order/cancel/<int:order_id>', methods=['POST'])
def rider_cancel_order(order_id):
    """Cancel a delivery - changes status from 'Shipping' back to 'Prepared'"""
    if 'email' not in session or session.get('user_type') != 'Rider':
        return jsonify({'success': False, 'error': 'Only riders can cancel deliveries'}), 401

    rider_email = session['email']
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        # Get the order to verify it belongs to the rider
        cursor.execute(
            "SELECT * FROM orders WHERE id = %s AND rider_email = %s AND status = 'Shipping'",
            (order_id, rider_email)
        )
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'success': False, 'error': 'Order not found or not in Shipping status'}), 404
        
        # Change status back to 'Prepared' and remove rider assignment
        cursor.execute(
            "UPDATE orders SET status = %s, rider_email = NULL WHERE id = %s",
            ('Prepared', order_id)
        )
        connection.commit()
        
        return jsonify({'success': True, 'message': 'Delivery cancelled and released back to available orders'})
    except Exception as err:
        connection.rollback()
        print(f"Error: {err}")
        return jsonify({'success': False, 'error': str(err)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/rider/order/deliver/<int:order_id>', methods=['POST'])
def rider_deliver_order(order_id):
    """Legacy endpoint - redirect to accept"""
    return rider_accept_order(order_id)


@app.route('/update_order_received_status', methods=['POST'])
def update_order_received_status():
    data = request.json
    order_id = data.get('order_id')  # Get the order ID
    status = data.get('status')  # Get the status (should be 'Received')
    product_id = data.get('product_id')  # Get the prod_id for reference
    quantity_received = data.get('quantity')  # Get the quantity of the received item
    user_email = session.get('email')  # Get the email from session (if needed)

    if status != 'Received':
        return jsonify({'success': False, 'error': 'Invalid status'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Step 1: Update the order status to 'Received'
        cursor.execute("""
            UPDATE orders
            SET status = %s
            WHERE id = %s AND email = %s
        """, (status, order_id, user_email))

        # Step 2: Get the current quantity of the product from the products table using prod_id
        cursor.execute("""
            SELECT quantity FROM products WHERE product_id = %s
        """, (product_id,))
        product = cursor.fetchone()

        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404

        current_quantity = int(product['quantity'])

        # Step 3: Subtract the received quantity from the product quantity
        new_quantity = current_quantity - int(quantity_received)

        # Step 4: Update the product's quantity in the products table
        cursor.execute("""
            UPDATE products
            SET quantity = %s
            WHERE product_id = %s
        """, (new_quantity, product_id))

        conn.commit()

        return jsonify({'success': True}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/rider_stats')
def get_rider_stats():
    if 'email' not in session or session.get('user_type') != 'Rider':
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_email = session.get('email')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get rider's delivery statistics (placeholder for now)
        stats = {
            'total_deliveries': 0,
            'pending_orders': 0,
            'total_earnings': 0.0,
            'rating': 5.0
        }
        
        cursor.close()
        conn.close()
        
        return jsonify(stats)
        
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/about')
def about():
    return render_template('about.html')

#=====================================================================================================================
                                    #LOCATION API ENDPOINTS
#=====================================================================================================================

@app.route('/api/philippines/regions')
def get_regions():
    """Get all Philippines regions"""
    try:
        # Try to load from JSON file first
        import json
        with open('static/data/philippines_locations.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            return jsonify(data['regions'])
    except FileNotFoundError:
        # Fallback to hardcoded data
        regions = [
            {"id": 1, "name": "National Capital Region (NCR)", "code": "NCR"},
            {"id": 2, "name": "Cordillera Administrative Region (CAR)", "code": "CAR"},
            {"id": 3, "name": "Region I (Ilocos Region)", "code": "01"},
            {"id": 4, "name": "Region II (Cagayan Valley)", "code": "02"},
            {"id": 5, "name": "Region III (Central Luzon)", "code": "03"},
            {"id": 6, "name": "Region IV-A (CALABARZON)", "code": "04A"},
            {"id": 7, "name": "Region IV-B (MIMAROPA)", "code": "04B"},
            {"id": 8, "name": "Region V (Bicol Region)", "code": "05"},
            {"id": 9, "name": "Region VI (Western Visayas)", "code": "06"},
            {"id": 10, "name": "Region VII (Central Visayas)", "code": "07"},
            {"id": 11, "name": "Region VIII (Eastern Visayas)", "code": "08"},
            {"id": 12, "name": "Region IX (Zamboanga Peninsula)", "code": "09"},
            {"id": 13, "name": "Region X (Northern Mindanao)", "code": "10"},
            {"id": 14, "name": "Region XI (Davao Region)", "code": "11"},
            {"id": 15, "name": "Region XII (SOCCSKSARGEN)", "code": "12"},
            {"id": 16, "name": "Region XIII (Caraga)", "code": "13"},
            {"id": 17, "name": "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)", "code": "14"}
        ]
        return jsonify(regions)

@app.route('/api/philippines/provinces')
def get_provinces():
    """Get provinces by region"""
    region_code = request.args.get('region')
    
    try:
        # Try to load from JSON file first
        import json
        with open('static/data/philippines_locations.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            provinces = data['provinces'].get(region_code, [])
            return jsonify(provinces)
    except FileNotFoundError:
        # Fallback to hardcoded data
        provinces_data = {
            'NCR': [{"id": 1, "name": "Metro Manila", "code": "MM"}],
            'CAR': [
                {"id": 1, "name": "Abra", "code": "ABR"},
                {"id": 2, "name": "Apayao", "code": "APA"},
                {"id": 3, "name": "Benguet", "code": "BEN"},
                {"id": 4, "name": "Ifugao", "code": "IFU"},
                {"id": 5, "name": "Kalinga", "code": "KAL"},
                {"id": 6, "name": "Mountain Province", "code": "MOU"}
            ],
            '03': [
                {"id": 1, "name": "Aurora", "code": "AUR"},
                {"id": 2, "name": "Bataan", "code": "BAN"},
                {"id": 3, "name": "Bulacan", "code": "BUL"},
                {"id": 4, "name": "Nueva Ecija", "code": "NUE"},
                {"id": 5, "name": "Pampanga", "code": "PAM"},
                {"id": 6, "name": "Tarlac", "code": "TAR"},
                {"id": 7, "name": "Zambales", "code": "ZAM"}
            ],
            '04A': [
                {"id": 1, "name": "Batangas", "code": "BAT"},
                {"id": 2, "name": "Cavite", "code": "CAV"},
                {"id": 3, "name": "Laguna", "code": "LAG"},
                {"id": 4, "name": "Quezon", "code": "QUE"},
                {"id": 5, "name": "Rizal", "code": "RIZ"}
            ],
            '07': [
                {"id": 1, "name": "Bohol", "code": "BOH"},
                {"id": 2, "name": "Cebu", "code": "CEB"},
                {"id": 3, "name": "Negros Oriental", "code": "NER"},
                {"id": 4, "name": "Siquijor", "code": "SIG"}
            ]
        }
        provinces = provinces_data.get(region_code, [])
        return jsonify(provinces)

@app.route('/api/philippines/cities')
def get_cities():
    """Get cities by province"""
    province_code = request.args.get('province')
    
    try:
        # Try to load from JSON file first
        import json
        with open('static/data/philippines_locations.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            cities = data['cities'].get(province_code, [])
            return jsonify(cities)
    except FileNotFoundError:
        # Fallback to hardcoded data
        cities_data = {
            'MM': [
                {"id": 1, "name": "Manila", "code": "MNL"},
                {"id": 2, "name": "Quezon City", "code": "QC"},
                {"id": 3, "name": "Makati", "code": "MKT"},
                {"id": 4, "name": "Taguig", "code": "TAG"},
                {"id": 5, "name": "Pasig", "code": "PSG"},
                {"id": 6, "name": "Mandaluyong", "code": "MND"},
                {"id": 7, "name": "San Juan", "code": "SJ"},
                {"id": 8, "name": "Marikina", "code": "MRK"},
                {"id": 9, "name": "Pasay", "code": "PSY"},
                {"id": 10, "name": "Parañaque", "code": "PRQ"},
                {"id": 11, "name": "Las Piñas", "code": "LP"},
                {"id": 12, "name": "Muntinlupa", "code": "MNT"},
                {"id": 13, "name": "Caloocan", "code": "CLK"},
                {"id": 14, "name": "Malabon", "code": "MLB"},
                {"id": 15, "name": "Navotas", "code": "NVT"},
                {"id": 16, "name": "Valenzuela", "code": "VLZ"}
            ],
            'BUL': [
                {"id": 1, "name": "Malolos", "code": "MAL"},
                {"id": 2, "name": "Meycauayan", "code": "MEY"},
                {"id": 3, "name": "San Jose del Monte", "code": "SJM"},
                {"id": 4, "name": "Santa Maria", "code": "STM"},
                {"id": 5, "name": "Baliuag", "code": "BAL"},
                {"id": 6, "name": "Marilao", "code": "MAR"},
                {"id": 7, "name": "Obando", "code": "OBA"},
                {"id": 8, "name": "Pandi", "code": "PAN"},
                {"id": 9, "name": "Plaridel", "code": "PLA"},
                {"id": 10, "name": "Pulilan", "code": "PUL"}
            ],
            'CAV': [
                {"id": 1, "name": "Cavite City", "code": "CVC"},
                {"id": 2, "name": "Dasmariñas", "code": "DAS"},
                {"id": 3, "name": "Imus", "code": "IMU"},
                {"id": 4, "name": "Tagaytay", "code": "TAG"},
                {"id": 5, "name": "Trece Martires", "code": "TRE"},
                {"id": 6, "name": "Bacoor", "code": "BAC"},
                {"id": 7, "name": "General Trias", "code": "GEN"},
                {"id": 8, "name": "Kawit", "code": "KAW"},
                {"id": 9, "name": "Noveleta", "code": "NOV"},
                {"id": 10, "name": "Rosario", "code": "ROS"}
            ],
            'LAG': [
                {"id": 1, "name": "Calamba", "code": "CAL"},
                {"id": 2, "name": "San Pablo", "code": "SPA"},
                {"id": 3, "name": "Santa Rosa", "code": "SRA"},
                {"id": 4, "name": "Biñan", "code": "BIN"},
                {"id": 5, "name": "Cabuyao", "code": "CAB"},
                {"id": 6, "name": "Los Baños", "code": "LOS"},
                {"id": 7, "name": "San Pedro", "code": "SPE"},
                {"id": 8, "name": "Liliw", "code": "LIL"},
                {"id": 9, "name": "Nagcarlan", "code": "NAG"},
                {"id": 10, "name": "Pagsanjan", "code": "PAG"}
            ],
            'CEB': [
                {"id": 1, "name": "Cebu City", "code": "CEB"},
                {"id": 2, "name": "Lapu-Lapu City", "code": "LAP"},
                {"id": 3, "name": "Mandaue", "code": "MAN"},
                {"id": 4, "name": "Talisay", "code": "TAL"},
                {"id": 5, "name": "Toledo", "code": "TOL"},
                {"id": 6, "name": "Danao", "code": "DAN"},
                {"id": 7, "name": "Bogo", "code": "BOG"},
                {"id": 8, "name": "Carcar", "code": "CAR"},
                {"id": 9, "name": "Naga", "code": "NAG"},
                {"id": 10, "name": "Consolacion", "code": "CON"}
            ]
        }
        cities = cities_data.get(province_code, [])
        return jsonify(cities)


# =============================
# DATABASE-BACKED CHAT SYSTEM
# =============================

@app.route('/chat/db/threads', methods=['GET'])
def chat_db_threads():
    """Return available chat threads from database. 
    For admin: list all unique threads. For users: return their thread.
    """
    user_email = session.get('email')
    user_role = session.get('user_type')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        threads = []
        
        if user_role == 'Admin':
            # Admin sees all threads - get unique thread_ids with latest message
            cursor.execute("""
                SELECT 
                    thread_id,
                    sender,
                    sender_email,
                    message,
                    timestamp
                FROM chat_messages
                WHERE (thread_id, timestamp) IN (
                    SELECT thread_id, MAX(timestamp)
                    FROM chat_messages
                    GROUP BY thread_id
                )
                ORDER BY timestamp DESC
            """)
            results = cursor.fetchall()
            for row in results:
                threads.append({
                    'thread_id': row['thread_id'],
                    'last': {
                        'sender': row['sender'],
                        'sender_email': row['sender_email'],
                        'message': row['message'],
                        'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None
                    }
                })
        else:
            # Regular user sees threads where they are a participant
            # Thread_id can be their email or a combined format (email1_email2)
            if user_email:
                cursor.execute("""
                    SELECT 
                        thread_id,
                        sender,
                        sender_email,
                        message,
                        timestamp
                    FROM chat_messages
                    WHERE (thread_id = %s OR thread_id LIKE %s OR thread_id LIKE %s)
                    AND (thread_id, timestamp) IN (
                        SELECT thread_id, MAX(timestamp)
                        FROM chat_messages
                        WHERE thread_id = %s OR thread_id LIKE %s OR thread_id LIKE %s
                        GROUP BY thread_id
                    )
                    ORDER BY timestamp DESC
                """, (
                    user_email,
                    f'{user_email}_%',
                    f'%_{user_email}',
                    user_email,
                    f'{user_email}_%',
                    f'%_{user_email}'
                ))
                results = cursor.fetchall()
                threads = []
                
                # Get all unique emails from threads to fetch user types in one query
                all_emails = set()
                for row in results:
                    thread_id = row['thread_id']
                    if '_' in thread_id:
                        emails = thread_id.split('_')
                        all_emails.update(emails)
                    else:
                        all_emails.add(thread_id)
                
                # Fetch user types for all emails at once
                user_type_map = {}
                if all_emails:
                    placeholders = ','.join(['%s'] * len(all_emails))
                    cursor.execute(f"""
                        SELECT email, user_type 
                        FROM users 
                        WHERE email IN ({placeholders})
                    """, list(all_emails))
                    for user_row in cursor.fetchall():
                        user_type_map[user_row['email']] = user_row['user_type']
                
                for row in results:
                    thread_id = row['thread_id']
                    # Determine other user's email and type
                    other_user_email = None
                    other_user_type = None
                    if '_' in thread_id:
                        emails = thread_id.split('_')
                        other_user_email = emails[0] if emails[1] == user_email else emails[1]
                    elif thread_id != user_email:
                        other_user_email = thread_id
                    
                    if other_user_email:
                        other_user_type = user_type_map.get(other_user_email)
                    
                    threads.append({
                        'thread_id': thread_id,
                        'other_user_email': other_user_email,
                        'other_user_type': other_user_type,
                        'last': {
                            'sender': row['sender'],
                            'sender_email': row['sender_email'],
                            'message': row['message'],
                            'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None
                        } if row['message'] else None
                    })
        
        cursor.close()
        conn.close()
        return jsonify(threads)
    except Exception as e:
        print(f'[CHAT_DB_THREADS] ERROR: {str(e)}', flush=True)
        return jsonify([])


@app.route('/chat/available-users/<user_type>', methods=['GET'])
def get_available_users_by_type(user_type):
    """
    Get all available users of a specific type that the current user can chat with.
    Excludes the current user and banned users.
    """
    current_user_email = session.get('email')
    current_user_role = session.get('user_type')
    
    if not current_user_email:
        return jsonify([])
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all users of the specified type, excluding current user and banned users
        cursor.execute("""
            SELECT email, first_name, last_name, user_type, status
            FROM users
            WHERE user_type = %s 
            AND email != %s
            AND status != 'banned'
            ORDER BY first_name, last_name
        """, (user_type, current_user_email))
        
        users = []
        for row in cursor.fetchall():
            users.append({
                'email': row['email'],
                'name': f"{row['first_name']} {row['last_name']}".strip() or row['email'],
                'user_type': row['user_type'],
                'status': row['status']
            })
        
        cursor.close()
        conn.close()
        return jsonify(users)
    except Exception as e:
        print(f'[GET_AVAILABLE_USERS] ERROR: {str(e)}', flush=True)
        return jsonify([])


@app.route('/chat/db/threads/<thread_id>/messages', methods=['GET', 'POST'])
def chat_db_thread_messages(thread_id):
    """GET returns messages for thread_id from database.
    POST adds a new message to the thread in database.
    """
    user_email = session.get('email')
    user_role = session.get('user_type')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        if request.method == 'GET':
            # Fetch all messages for this thread
            cursor.execute("""
                SELECT 
                    id, sender, sender_email, sender_role, message, timestamp
                FROM chat_messages
                WHERE thread_id = %s
                ORDER BY timestamp ASC
            """, (thread_id,))
            
            messages = []
            for row in cursor.fetchall():
                messages.append({
                    'id': row['id'],
                    'sender': row['sender'],
                    'sender_email': row['sender_email'],
                    'role': row['sender_role'],
                    'message': row['message'],
                    'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None
                })
            
            cursor.close()
            conn.close()
            return jsonify(messages)
        
        else:  # POST
            data = request.get_json() or {}
            sender = data.get('sender') or user_email or 'anonymous'
            sender_email = user_email
            sender_role = user_role
            message_text = data.get('message') or ''
            
            if not message_text.strip():
                cursor.close()
                conn.close()
                return jsonify({'success': False, 'error': 'Empty message'}), 400
            
            # Insert message into database
            cursor.execute("""
                INSERT INTO chat_messages 
                (thread_id, sender, sender_email, sender_role, message, timestamp)
                VALUES (%s, %s, %s, %s, %s, NOW())
            """, (thread_id, sender, sender_email, sender_role, message_text))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': {
                    'sender': sender,
                    'sender_email': sender_email,
                    'role': sender_role,
                    'message': message_text,
                    'timestamp': datetime.now().isoformat()
                }
            })
    
    except Exception as e:
        print(f'[CHAT_DB_MESSAGES] ERROR: {str(e)}', flush=True)
        if request.method == 'POST':
            return jsonify({'success': False, 'error': str(e)}), 500
        return jsonify([])


# =============================
# FILE-BACKED CHAT SYSTEM (Legacy - kept for backwards compatibility)
# =============================
CHAT_DIR = os.path.join(app.root_path, 'data', 'chats')
os.makedirs(CHAT_DIR, exist_ok=True)
chat_lock = Lock()


def _thread_path(thread_id: str) -> str:
    # sanitize thread_id for filename
    safe = thread_id.replace('/', '_').replace('\\', '_')
    return os.path.join(CHAT_DIR, f"{safe}.json")


@app.route('/chat/threads', methods=['GET'])
def chat_threads():
    """Return available threads. For admin: list all threads. For other users: return their thread only."""
    user = session.get('email')
    role = session.get('user_type')
    threads = []
    
    print(f'\n[CHAT_THREADS] REQUEST:', flush=True)
    print(f'[CHAT_THREADS]   user={repr(user)}', flush=True)
    print(f'[CHAT_THREADS]   role={repr(role)}', flush=True)
    print(f'[CHAT_THREADS]   is_admin={role == "Admin"}', flush=True)
    print(f'[CHAT_THREADS]   CHAT_DIR={CHAT_DIR}', flush=True)
    
    try:
        if role == 'Admin':
            print(f'[CHAT_THREADS] Admin branch - checking CHAT_DIR', flush=True)
            if os.path.exists(CHAT_DIR):
                files = os.listdir(CHAT_DIR)
                print(f'[CHAT_THREADS]   CHAT_DIR exists with {len(files)} files', flush=True)
                for fname in sorted(files):
                    print(f'[CHAT_THREADS]     checking file: {fname}', flush=True)
                    if fname.endswith('.json'):
                        thread_id = fname[:-5]
                        # Skip banned user threads (they go to /chat/appeals only)
                        if thread_id.startswith('banned_'):
                            print(f'[CHAT_THREADS]       SKIPPING banned user thread: {thread_id}', flush=True)
                            continue
                        # load last message for preview
                        path = os.path.join(CHAT_DIR, fname)
                        try:
                            with open(path, 'r', encoding='utf-8') as f:
                                msgs = json.load(f) or []
                            last = msgs[-1] if msgs else None
                            threads.append({'thread_id': thread_id, 'last': last})
                            print(f'[CHAT_THREADS]       loaded thread: {thread_id} with {len(msgs)} messages', flush=True)
                        except Exception as e:
                            print(f'[CHAT_THREADS]       ERROR loading {fname}: {e}', flush=True)
                print(f'[CHAT_THREADS]   Total threads for admin: {len(threads)}', flush=True)
            else:
                print(f'[CHAT_THREADS]   ERROR: CHAT_DIR does not exist: {CHAT_DIR}', flush=True)
        else:
            print(f'[CHAT_THREADS] Non-admin branch', flush=True)
            if not user:
                print(f'[CHAT_THREADS]   No user email, returning empty', flush=True)
                return jsonify([])
            path = _thread_path(user)
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    msgs = json.load(f) or []
                last = msgs[-1] if msgs else None
            else:
                last = None
            threads = [{'thread_id': user, 'last': last}]
            print(f'[CHAT_THREADS]   Non-admin user {user} returned 1 thread', flush=True)
    except Exception as e:
        print(f'[CHAT_THREADS] EXCEPTION: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()
        threads = []
    
    print(f'[CHAT_THREADS] RESPONSE: {len(threads)} threads\n', flush=True)
    return jsonify(threads)


@app.route('/chat/appeals', methods=['GET'])
def chat_appeals():
    """Return ban appeals - only for admin. Shows conversations with banned users."""
    user = session.get('email')
    role = session.get('user_type')
    appeals = []
    
    print(f'\n[CHAT_APPEALS] REQUEST:', flush=True)
    print(f'[CHAT_APPEALS]   user={repr(user)}', flush=True)
    print(f'[CHAT_APPEALS]   role={repr(role)}', flush=True)
    
    # Only admin can view appeals
    if role != 'Admin':
        print(f'[CHAT_APPEALS] Non-admin access denied', flush=True)
        return jsonify([])
    
    try:
        print(f'[CHAT_APPEALS] Admin access granted, querying banned users', flush=True)
        
        # Get list of banned users from database
        banned_users = []
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT email FROM users WHERE status = %s", ('banned',))
            results = cursor.fetchall()
            banned_users = [row['email'] for row in results]
            cursor.close()
            conn.close()
            print(f'[CHAT_APPEALS]   Found {len(banned_users)} banned users in database: {banned_users}', flush=True)
        except Exception as db_err:
            print(f'[CHAT_APPEALS]   Database error: {db_err}', flush=True)
        
        # Get chat files for banned users
        if os.path.exists(CHAT_DIR):
            files = os.listdir(CHAT_DIR)
            print(f'[CHAT_APPEALS]   Checking {len(files)} files in CHAT_DIR', flush=True)
            
            for fname in sorted(files):
                if fname.endswith('.json'):
                    thread_id = fname[:-5]
                    is_banned = False
                    
                    # Check if filename starts with 'banned_' prefix (e.g., banned_jeffperson.jp09@gmail.com)
                    if thread_id.startswith('banned_'):
                        is_banned = True
                        actual_email = thread_id[7:]  # Remove 'banned_' prefix
                        print(f'[CHAT_APPEALS]     Found banned prefix file: {thread_id} (email: {actual_email})', flush=True)
                    
                    # Also check if thread_id matches any banned user email from database
                    for banned_email in banned_users:
                        if thread_id.lower() == banned_email.lower() or thread_id == banned_email:
                            is_banned = True
                            print(f'[CHAT_APPEALS]     Found database-banned user: {thread_id}', flush=True)
                            break
                    
                    if is_banned:
                        path = os.path.join(CHAT_DIR, fname)
                        try:
                            with open(path, 'r', encoding='utf-8') as f:
                                msgs = json.load(f) or []
                            
                            if msgs:
                                last = msgs[-1] if msgs else None
                                appeals.append({
                                    'thread_id': thread_id,
                                    'last': last,
                                    'message_count': len(msgs),
                                    'is_banned': True
                                })
                                print(f'[CHAT_APPEALS]     added banned user thread: {thread_id}', flush=True)
                        except Exception as e:
                            print(f'[CHAT_APPEALS]     error loading {fname}: {e}', flush=True)
            
            print(f'[CHAT_APPEALS]   Total banned user threads: {len(appeals)}', flush=True)
        else:
            print(f'[CHAT_APPEALS]   CHAT_DIR does not exist', flush=True)
    except Exception as e:
        print(f'[CHAT_APPEALS] Exception: {str(e)}', flush=True)
        import traceback
        traceback.print_exc()
        appeals = []
    
    print(f'[CHAT_APPEALS] RESPONSE: {len(appeals)} appeals\n', flush=True)
    return jsonify(appeals)


@app.route('/chat/threads/<thread_id>/messages', methods=['GET', 'POST'])
def thread_messages(thread_id):
    """GET returns messages for thread_id. POST appends a message to the thread.

    Thread_id is expected to be the user's email (for user-admin thread).
    """
    path = _thread_path(thread_id)
    if request.method == 'GET':
        if not os.path.exists(path):
            return jsonify([])
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle two formats:
            # 1. Direct array: [{"sender": "...", "message": "...", ...}]
            # 2. Wrapped format: {"thread_id": "...", "messages": [...]}
            if isinstance(data, dict) and 'messages' in data:
                msgs = data.get('messages') or []
            elif isinstance(data, list):
                msgs = data
            else:
                msgs = []
            
            return jsonify(msgs)
        except Exception as e:
            print(f'[CHAT_MESSAGES] ERROR loading {path}: {e}', flush=True)
            return jsonify([])

    # POST
    data = request.get_json() or {}
    sender = data.get('sender') or session.get('email') or 'anonymous'
    role = data.get('role') or session.get('user_type') or 'User'
    text = data.get('message') or ''
    ts = datetime.utcnow().isoformat()
    msg = {'sender': sender, 'role': role, 'message': text, 'timestamp': ts}
    try:
        chat_lock.acquire()
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                file_data = json.load(f)
            
            # Handle two formats:
            # 1. Direct array format
            # 2. Wrapped format with 'messages' key
            if isinstance(file_data, dict) and 'messages' in file_data:
                # Wrapped format - append to messages array
                file_data['messages'].append(msg)
                msgs = file_data
            elif isinstance(file_data, list):
                # Direct array format - append to array
                file_data.append(msg)
                msgs = file_data
            else:
                # Unknown format, treat as direct array
                msgs = [msg]
        else:
            # New file - use direct array format
            msgs = [msg]
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(msgs, f, ensure_ascii=False, indent=2)
    finally:
        chat_lock.release()
    return jsonify({'success': True, 'message': msg})


@app.route('/admin_sellers_products')
def admin_sellers_products():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE user_type = 'Seller' ORDER BY id DESC")
    sellers = cursor.fetchall()
    for s in sellers:
        cursor.execute('SELECT * FROM products WHERE seller_email = %s ORDER BY id DESC', (s['email'],))
        s['products'] = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('admin_sellers_products.html', sellers=sellers)


#=====================================================================================================================
                                    #ADMIN REAL-TIME STATISTICS APIS
#=====================================================================================================================

@app.route('/api/admin/user-growth/<period>')
def get_user_growth(period):
    """Get user growth statistics for the specified period (week, month, year)"""
    if 'email' not in session or session.get('user_type') != 'Admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        if period == 'week':
            # Get last 7 days data
            cursor.execute("""
                SELECT 
                    DATE(created_at) as date,
                    DAYNAME(created_at) as day_name,
                    user_type,
                    COUNT(*) as count
                FROM users
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at), user_type
                ORDER BY DATE(created_at)
            """)
        elif period == 'month':
            # Get last 4 weeks data
            cursor.execute("""
                SELECT 
                    WEEK(created_at) as week_num,
                    CONCAT('Week ', WEEK(created_at)) as label,
                    user_type,
                    COUNT(*) as count
                FROM users
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY WEEK(created_at), user_type
                ORDER BY WEEK(created_at)
            """)
        elif period == 'year':
            # Get last 12 months data
            cursor.execute("""
                SELECT 
                    MONTH(created_at) as month_num,
                    MONTHNAME(created_at) as month_name,
                    user_type,
                    COUNT(*) as count
                FROM users
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
                GROUP BY MONTH(created_at), user_type
                ORDER BY MONTH(created_at)
            """)
        else:
            return jsonify({'error': 'Invalid period'}), 400
        
        results = cursor.fetchall()
        
        # Process results into the format needed for the chart
        data_dict = {}
        buyers = []
        sellers = []
        riders = []
        labels = []
        
        for row in results:
            # Get the appropriate label
            if period == 'week':
                label = row['day_name']
                date_key = row['date']
            elif period == 'month':
                label = row['label']
                date_key = row['week_num']
            else:  # year
                label = row['month_name']
                date_key = row['month_num']
            
            # Add label if not already there
            if date_key not in data_dict:
                data_dict[date_key] = {
                    'label': label,
                    'Buyer': 0,
                    'Seller': 0,
                    'Rider': 0
                }
                labels.append(label)
            
            # Count users by type
            user_type = row['user_type']
            data_dict[date_key][user_type] = row['count']
        
        # Build final arrays
        for key in sorted(data_dict.keys()):
            buyers.append(data_dict[key].get('Buyer', 0))
            sellers.append(data_dict[key].get('Seller', 0))
            riders.append(data_dict[key].get('Rider', 0))
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'labels': labels,
            'buyers': buyers,
            'sellers': sellers,
            'riders': riders
        })
        
    except Exception as e:
        print(f"Error in get_user_growth: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/api/admin/user-distribution')
def get_user_distribution():
    """Get current user distribution (count by user type)"""
    if 'email' not in session or session.get('user_type') != 'Admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                user_type,
                COUNT(*) as count
            FROM users
            WHERE status != 'banned'
            GROUP BY user_type
        """)
        
        results = cursor.fetchall()
        
        buyers = 0
        sellers = 0
        riders = 0
        
        for row in results:
            if row['user_type'] == 'Buyer':
                buyers = row['count']
            elif row['user_type'] == 'Seller':
                sellers = row['count']
            elif row['user_type'] == 'Rider':
                riders = row['count']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'buyers': buyers,
            'sellers': sellers,
            'riders': riders,
            'total': buyers + sellers + riders
        })
        
    except Exception as e:
        print(f"Error in get_user_distribution: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/wishlist')
def wishlist():
    """Display user's wishlist items"""
    if 'email' not in session:
        return redirect(url_for('auth'))
    
    user_email = session['email']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get all wishlist items for the user
        cursor.execute("""
            SELECT 
                w.id,
                w.product_id,
                w.name,
                w.price,
                w.image,
                w.date_added,
                w.seller_email
            FROM wishlist w
            WHERE w.email = %s
            ORDER BY w.date_added DESC
        """, (user_email,))
        
        wishlist_items = cursor.fetchall()
        
        # Ensure no extra columns exist - clean the data
        clean_items = []
        if wishlist_items:
            for item in wishlist_items:
                try:
                    clean_item = {
                        'id': item.get('id'),
                        'product_id': item.get('product_id'),
                        'name': item.get('name', ''),
                        'price': float(item.get('price', 0)),
                        'image': item.get('image') or '',  # Ensure image is never None
                        'date_added': item.get('date_added'),  # Keep as datetime for strftime
                        'seller_email': item.get('seller_email', '')  # Include seller_email
                    }
                    clean_items.append(clean_item)
                except Exception as item_err:
                    print(f"[ERROR] Processing wishlist item: {str(item_err)}")
                    print(f"[ERROR] Item data: {item}")
                    import traceback
                    traceback.print_exc()
                    continue
        
        total = sum(float(item['price']) for item in clean_items) if clean_items else 0
        
        cursor.close()
        conn.close()
        
        # DEBUG: Print what we're sending to the template
        print(f"[DEBUG] Sending {len(clean_items)} items to wishlist.html")
        if clean_items:
            print(f"[DEBUG] First item keys: {list(clean_items[0].keys())}")
            print(f"[DEBUG] First item: {clean_items[0]}")
        
        return render_template('wishlist.html', 
                             wishlist_items=clean_items, 
                             total=total)
    except Exception as e:
        print(f'[ERROR] loading wishlist: {str(e)}')
        import traceback
        traceback.print_exc()
        cursor.close()
        conn.close()
        flash('Error loading wishlist', 'error')
        return redirect(url_for('homepage'))


@app.route('/api/wishlist', methods=['GET', 'POST', 'DELETE'])
def api_wishlist():
    """API endpoint for managing wishlist items (add/remove)"""
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    
    user_email = session['email']
    
    if request.method == 'GET':
        # Get wishlist count
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT COUNT(*) as count FROM wishlist WHERE email = %s", (user_email,))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            return jsonify({'count': result['count']})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    elif request.method == 'POST':
        # Add item to wishlist
        data = request.get_json()
        product_id = data.get('product_id')
        
        if not product_id:
            return jsonify({'success': False, 'error': 'Product ID required'}), 400
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get product details
            # Get product with seller_email
            cursor.execute("""
                SELECT id, name, price, image, seller_email FROM products WHERE id = %s
            """, (product_id,))
            product = cursor.fetchone()
            
            if not product:
                cursor.close()
                conn.close()
                return jsonify({'success': False, 'error': 'Product not found'}), 404
            
            # Check if already in wishlist
            cursor.execute("""
                SELECT id FROM wishlist WHERE email = %s AND product_id = %s
            """, (user_email, product_id))
            
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({'success': False, 'error': 'Already in wishlist'}), 400
            
            # Add to wishlist with seller_email
            cursor.execute("""
                INSERT INTO wishlist (email, product_id, name, price, image, seller_email, date_added)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (user_email, product_id, product['name'], product['price'], product['image'], product['seller_email']))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Added to wishlist'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        # Remove item from wishlist
        data = request.get_json()
        wishlist_id = data.get('id')
        
        if not wishlist_id:
            return jsonify({'success': False, 'error': 'Wishlist item ID required'}), 400
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                DELETE FROM wishlist WHERE id = %s AND email = %s
            """, (wishlist_id, user_email))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Removed from wishlist'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


# =============================
# AI Customer Service Routes
# =============================

# Knowledge Base for AI Customer Service
CUSTOMER_SERVICE_KB = {
    "account": {
        "title": "Account & Registration",
        "icon": "fa-user",
        "questions": [
            {
                "q": "How do I create an E-Baby account?",
                "a": "To create an E-Baby account:\n1. Click 'Register' on the login page\n2. Fill in your personal information (first name, last name, email, phone)\n3. Select your user type (Buyer, Seller, or Rider)\n4. Choose your location on the address picker map\n5. Create a secure password (at least 8 characters)\n6. Accept the terms and conditions\n7. If registering as Seller/Rider: Upload required documents\n8. Verify your email with the OTP code we send you\n\nOnce email verified, your account is ready to browse and shop!"
            },
            {
                "q": "What user types are available?",
                "a": "E-Baby has four user types:\n\n• Buyer: Browse and purchase baby products from sellers\n• Seller: List and sell baby products (requires BIR Tax ID)\n• Rider: Deliver orders to customers (requires Valid Government ID)\n• Admin: Manage platform, users, and disputes\n\nBuyers can upgrade to Seller or Rider by applying in their profile settings. Each role requires document verification."
            },
            {
                "q": "Can I have multiple accounts?",
                "a": "No, we allow only one account per email address. Creating multiple accounts violates our terms of service and will result in account suspension and banning.\n\nIf you need to change your user type (Buyer → Seller, etc.), apply through your profile settings instead. We'll verify and update your account."
            },
            {
                "q": "How do I verify my email?",
                "a": "During registration, we send a One-Time Password (OTP) to your email. You'll be directed to the OTP verification page. To verify:\n1. Check your email (including spam/junk folder)\n2. Enter the 6-digit OTP code\n3. You have 10 minutes before it expires\n4. If it expires, click 'Resend OTP'\n5. Once verified, your account is fully activated\n\nUse a valid email for best delivery. Gmail accounts work best with our system."
            },
            {
                "q": "How do I change my password?",
                "a": "To change your password:\n1. Log into your E-Baby account\n2. Click your profile icon (top right)\n3. Go to 'Profile' → 'Change Password'\n4. Enter your current password\n5. Enter your new password (minimum 8 characters)\n6. Confirm the new password\n7. Click 'Update Password'\n\nFor security, use a strong password mixing uppercase, lowercase, numbers, and special characters. Change it regularly!"
            },
            {
                "q": "How do I reset my password?",
                "a": "If you forgot your password:\n1. On the login page, click 'Forgot Password?'\n2. Enter your registered email address\n3. We'll send a password reset link to your email\n4. Click the link and create a new password\n5. Log in with your new password\n\nThe reset link expires in 1 hour for security. If expired, request another one. Check your spam folder if you don't see the email."
            }
        ]
    },
    "security": {
        "title": "Security & Privacy",
        "icon": "fa-lock",
        "questions": [
            {
                "q": "Is my personal information secure on E-Baby?",
                "a": "Yes! E-Baby takes security very seriously:\n• All data encrypted with SSL/TLS protocols\n• Passwords hashed and never stored in plain text\n• Personal information never shared without your consent\n• Servers monitored and regularly updated\n• Compliance with data protection standards\n• OTP verification protects your account\n• Secure payment gateways\n\nAlways use a strong password and don't share it. Enable login notifications to monitor account activity."
            },
            {
                "q": "What should I do if my account is compromised?",
                "a": "If you suspect unauthorized access:\n1. Change your password immediately\n2. Review recent orders and activity\n3. Log out from all devices\n4. Check for unauthorized transactions\n5. Contact E-Baby support immediately\n6. Do NOT share your password\n\nOur team can investigate and help restore your account. Report suspicious activity quickly to minimize damage."
            },
            {
                "q": "How do I keep my E-Baby account safe?",
                "a": "Security Best Practices:\n• Use a strong, unique password (mix of letters, numbers, symbols)\n• Change password regularly (every 3 months)\n• Never share your password or OTP code\n• Don't use public WiFi for sensitive transactions\n• Log out after each session\n• Enable login notifications\n• Update your contact information\n• Review orders regularly\n• Monitor your email for E-Baby updates\n• Report suspicious activity immediately\n\nYour security is our priority!"
            },
            {
                "q": "What information does E-Baby collect?",
                "a": "E-Baby collects information to improve your experience:\n• Personal: Name, email, phone, address\n• Account: Login history, activity logs\n• Transactions: Orders, payments, deliveries\n• Preferences: Categories viewed, favorites, wishlist\n• Device: Browser type, IP address for security\n• Feedback: Ratings, reviews, support messages\n\nWe never sell your data. Your information is used to:\n• Verify your identity\n• Process orders and payments\n• Improve our service\n• Prevent fraud\n• Send important updates\n\nReview our privacy policy in Settings > Privacy & Terms."
            }
        ]
    },
    "banning": {
        "title": "Account Banning & Appeals",
        "icon": "fa-ban",
        "questions": [
            {
                "q": "Why would my E-Baby account be banned?",
                "a": "Accounts are banned for violating E-Baby Terms of Service:\n• Fraudulent activity or fake payments\n• Selling counterfeit or dangerous products\n• Harassment, threats, or abusive behavior\n• Providing false information or fake documents\n• Unauthorized access or hacking attempts\n• Money laundering or suspicious transactions\n• Scamming or deceiving other users\n• Repeated policy violations\n• Non-compliance after warnings\n\nYou'll receive an email explaining the specific reason for the ban. We take violations seriously to protect our community."
            },
            {
                "q": "How do I appeal an account ban?",
                "a": "To appeal your ban:\n1. Read the ban notification email carefully\n2. Click the 'Appeal' link in the email\n3. Submit a detailed appeal explaining:\n   - Why you believe the ban was unfair\n   - Any evidence supporting your case\n   - Steps taken to correct the issue\n4. Our review team examines your appeal\n5. Decision made within 5-7 business days\n6. You'll receive notification via email\n\nBe honest and thorough. Provide evidence to strengthen your case. Frivolous appeals will not be reconsidered."
            },
            {
                "q": "What's the ban appeal process?",
                "a": "E-Baby Appeal Process:\n\n1. Submission: Your appeal submitted with evidence\n2. Initial Check: Verify appeal is properly formatted\n3. Investigation: Review transaction history and activity\n4. Evidence Review: Examine photos, documents, chat logs\n5. Your Response: You may be asked follow-up questions\n6. Decision: Fair determination made by review team\n7. Notification: You're informed of outcome via email\n8. Action: Ban lifted or upheld accordingly\n\nTypical Timeline: 5-7 business days\nAppeal Window: Usually 30 days from ban date"
            },
            {
                "q": "Can I create a new account if I'm banned?",
                "a": "No! Creating a new account to bypass a ban is strictly prohibited:\n• It violates E-Baby Terms of Service\n• We track accounts through email and device information\n• Attempting this results in immediate permanent ban\n• Legal action may be taken\n• All related accounts will be closed\n\nThe proper response is to submit an appeal through official channels. If your ban was unjust, the appeal process will address it fairly."
            },
            {
                "q": "What's the difference between temporary and permanent bans?",
                "a": "Temporary Ban:\n• Duration: Usually 7-30 days (or 30-90 days)\n• Appealable: Yes, after ban period or immediately\n• Access: Full account suspension during period\n• After: You can reactivate upon lift\n• Reason: First offense or minor violations\n\nPermanent Ban:\n• Duration: Forever\n• Appealable: Only in exceptional circumstances\n• Access: Complete loss of account\n• Reason: Severe violations or repeated serious offenses\n• Recovery: Very rare, requires extraordinary circumstances\n\nAlways comply with our policies to avoid escalation."
            }
        ]
    },
    "orders": {
        "title": "Orders & Purchases",
        "icon": "fa-shopping-cart",
        "questions": [
            {
                "q": "How do I place an order on E-Baby?",
                "a": "To place an order:\n1. Browse products by category or search\n2. Click 'Add to Cart' on the product\n3. Review your cart items\n4. Click 'Proceed to Checkout'\n5. Confirm your delivery address\n6. Select payment method (card, e-wallet, COD, bank transfer)\n7. Complete payment\n8. Confirm order\n\nYou'll receive an order confirmation email immediately. Your order appears in your Orders section."
            },
            {
                "q": "What payment methods does E-Baby accept?",
                "a": "E-Baby accepts multiple payment options:\n• Credit/Debit Cards (Visa, Mastercard)\n• e-Wallets (GCash, PayMaya, etc.)\n• Online Banking (BDO, BPI, Metrobank, etc.)\n• Cash on Delivery (available in selected areas)\n• Bank Transfer\n• Other local payment methods\n\nAll payments are secure and encrypted. Choose the method most convenient for you. Cash on Delivery may incur additional fees."
            },
            {
                "q": "Can I modify or cancel my order?",
                "a": "Order modification depends on status:\n\n• Pending/Processing: Full modification or cancellation allowed\n• Confirmed by Seller: Contact seller for changes (may not be possible)\n• Picked Up by Rider: Cancellation not possible\n• Out for Delivery: Contact rider immediately\n• Delivered: No cancellation, but return/refund available\n\nTo modify:\n1. Go to Orders > Select Order\n2. Click 'Modify Order' or 'Request Change'\n3. Make necessary changes\n4. Confirm\n\nAct quickly - once seller confirms, changes may not be possible!"
            },
            {
                "q": "How long does E-Baby delivery take?",
                "a": "E-Baby Delivery Timeframes:\n• Metro Manila: 1-3 business days\n• Nearby Provinces (Cavite, Laguna, Rizal, Bulacan): 2-5 business days\n• Visayas (Cebu, Iloilo, Bacolod): 3-7 business days\n• Mindanao (Davao, CDO, General Santos): 3-7 business days\n• Other areas: 5-10 business days\n\nDelivery depends on:\n• Your location\n• Stock availability\n• Rider availability\n• Order volume\n\nYou'll see estimated delivery during checkout. Track your order for real-time updates."
            },
            {
                "q": "How do I track my order?",
                "a": "To track your E-Baby order:\n1. Log in to your account\n2. Click 'Orders' in main menu\n3. Select the order you want to track\n4. Click 'Track Shipment'\n5. See real-time location and estimated delivery\n\nEmail/SMS Updates:\n• Order Confirmed\n• Seller Processing\n• Ready for Pickup\n• Out for Delivery\n• Delivery Attempt\n• Delivered\n\nCheck your email and SMS for updates. Tracking usually becomes available 24 hours after order confirmation."
            },
            {
                "q": "What if my order doesn't arrive?",
                "a": "If your order doesn't arrive:\n1. Check tracking - it may still be in transit\n2. Wait until the estimated delivery date\n3. Check address is correct\n4. Contact the rider through the app\n5. If 24+ hours past delivery date with no update:\n   - Go to Orders > Report Issue\n   - Click 'Order Not Received'\n   - Provide photos/evidence\n   - Submit report\n\n6. Our team investigates immediately\n7. You receive refund or replacement\n\nDo NOT refuse delivery if it arrives - contact us instead with evidence."
            }
        ]
    },
    "returns": {
        "title": "Returns & Refunds",
        "icon": "fa-undo",
        "questions": [
            {
                "q": "What's the E-Baby return policy?",
                "a": "E-Baby Return Policy:\n• Time Window: 7 days from delivery\n• Condition: Must be unused, unopened, with original packaging\n• Categories: Most baby products are returnable\n• Non-returnable: Used items, opened packages, food/medicine\n\nTo initiate a return:\n1. Go to Orders > Select Order\n2. Click 'Request Return'\n3. Select reason for return\n4. Provide photos/evidence\n5. Get return shipping label\n6. Ship item back using the label\n7. Seller receives and inspects\n8. If approved: Refund issued within 5 days\n\nMake sure item is in original condition with all accessories."
            },
            {
                "q": "How long does a refund take?",
                "a": "E-Baby Refund Timeline:\n• Return request approved: Immediately\n• Item shipped back: 2-5 days in transit\n• Seller receives item: 1 day\n• Inspection completed: 1-2 days\n• Refund authorized: 1 day\n• Bank processing: 3-5 business days\n• Total: Usually 7-14 days\n\nRefunds go back to your original payment method. For card payments, check your bank statement. For e-wallets and online banking, funds appear in your account. Contact us if not received after 14 days."
            },
            {
                "q": "Can I return defective or damaged items?",
                "a": "Yes! For defective items:\n1. Do NOT use the item\n2. Take clear photos/videos showing the defect\n3. Go to Orders > Report Issue\n4. Select 'Item Defective' or 'Damaged'\n5. Upload evidence\n6. Submit claim within 3 days of delivery\n\nOur team reviews within 1 business day. Once approved:\n• Return shipping is FREE\n• Refund is accelerated (3-5 days)\n• Seller may offer replacement instead\n\nAlways document defects immediately with photos and videos!"
            },
            {
                "q": "What if the item arrives damaged?",
                "a": "For damage during shipping:\n1. If possible, REFUSE delivery and mark as damaged\n2. Take photos of the damage and packaging\n3. Contact the rider immediately through app\n4. Go to Orders > Report Issue\n5. Click 'Damaged During Delivery'\n6. Upload photos as proof\n\nIf already accepted:\n1. Report within 24 hours with clear photos\n2. We may arrange free replacement or refund\n3. Replacement prioritized and shipped free\n\nAlways take photos of damaged items immediately. This protects you in disputes."
            },
            {
                "q": "What's the difference between return and refund?",
                "a": "Return vs Refund:\n\nReturn:\n• You ship item back to seller/warehouse\n• Seller receives and inspects condition\n• If meets policy: Approval given\n• Takes 7-14 days total\n• Requires original packaging and accessories\n\nRefund:\n• Money returned to your payment method\n• Takes 3-5 business days from approval\n• Issued AFTER return is approved\n• Check your bank/wallet after processing\n\nProcess: Return item first → We approve → Refund is issued\nBoth work together to complete the return process."
            }
        ]
    },
    "sellers": {
        "title": "For Sellers",
        "icon": "fa-store",
        "questions": [
            {
                "q": "How do I register as a seller on E-Baby?",
                "a": "To become a seller:\n1. Create an account and select 'Seller' as user type\n2. Fill in your business information\n3. Upload required documents:\n   - Valid Government ID (clear photo)\n   - BIR Certificate (Tax ID)\n   - Business Registration (recommended)\n4. Submit application for verification\n5. Our team reviews (usually 2-3 business days)\n6. Approval email sent\n7. Access Seller Dashboard\n8. Start listing products!\n\nMake sure all documents are clear, current, and readable. Incomplete applications will be rejected."
            },
            {
                "q": "How do I list a product on E-Baby?",
                "a": "To list a product:\n1. Log in to Seller Dashboard\n2. Click 'Add New Product'\n3. Fill in product information:\n   - Product name (clear and descriptive)\n   - Category (Baby Clothes, Toys, Educational, Strollers, Nursery, Safety)\n   - Description (details about the product)\n   - Price in Pesos\n   - Stock quantity\n   - Sizes (if applicable)\n   - Colors (if applicable)\n4. Upload high-quality photos (minimum 3)\n5. Review and click 'Publish'\n6. Product goes live immediately!\n\nOptimize descriptions with keywords. Use clear photos from multiple angles for better sales."
            },
            {
                "q": "What fees does E-Baby charge sellers?",
                "a": "E-Baby Seller Fees:\n• Commission: 5-15% per sale (varies by category)\n• Payment Processing Fee: 2% of order value\n• Optional Advertising: Starting at ₱50/week for featured listings\n• No listing fees\n• No monthly subscription required\n\nFees are deducted from your earnings automatically. Higher sales volume can reduce commission rates. Check your Seller Dashboard > Sales Report for detailed breakdown of all fees and earnings."
            },
            {
                "q": "How do I manage my product inventory?",
                "a": "Inventory Management:\n1. Go to Seller Dashboard > Products\n2. View real-time stock levels for each item\n3. Edit stock quantities anytime\n4. Set low-stock alerts\n5. Set automatic reorder reminders\n6. View sales trends and top sellers\n7. Monitor product performance\n\nBest Practices:\n• Update stock immediately after sales\n• Mark items 'Out of Stock' when unavailable (keeps listing active)\n• Monitor slow-moving inventory\n• Restock popular items quickly\n• Remove or archive old listings"
            },
            {
                "q": "What are E-Baby product quality requirements?",
                "a": "Product Quality Standards:\n• All products must be NEW and authentic\n• No counterfeit items accepted\n• No expired or damaged items\n• Descriptions must be accurate\n• Photos must match actual product (not stock photos)\n• All items must be safe for babies\n• Age-appropriate for intended use\n• Original packaging required\n• All accessories must be included\n\nViolating these standards results in:\n• Product removal\n• Account warnings\n• Account suspension or termination\n\nQuality ensures customer satisfaction and protects your reputation!"
            },
            {
                "q": "How do I handle returns and customer orders?",
                "a": "As a seller:\n1. Customer submits return request\n2. You receive notification in dashboard\n3. Review return reason and photos\n4. Decide: Approve or Reject\n5. If approved: Email return shipping label to customer\n6. Customer ships item back\n7. You receive and inspect item\n8. Verify condition matches return policy\n9. Approve refund through dashboard\n10. E-Baby deducts refund from your earnings\n\nBe fair with returns - improves your ratings and encourages repeat customers. Unreasonable rejections harm your reputation and trigger complaints. Positive seller ratings lead to more sales!"
            }
        ]
    },
    "riders": {
        "title": "For Riders (Delivery Partners)",
        "icon": "fa-biking",
        "questions": [
            {
                "q": "How do I apply to become an E-Baby rider?",
                "a": "To become a delivery partner:\n1. Create account and select 'Rider' as user type\n2. Provide personal information\n3. Upload required documents:\n   - Valid Government ID (clear photo)\n   - Proof of address (utility bill, ID)\n   - Driver's License\n   - Motorcycle/Bike registration (if applicable)\n4. Submit application\n5. Background check (1-3 business days)\n6. Interview (virtual or in-person)\n7. Approval email sent\n8. Onboarding and training\n9. Start accepting deliveries!\n\nMust be at least 18 years old. Own transportation preferred but not always required."
            },
            {
                "q": "How much can I earn as an E-Baby rider?",
                "a": "E-Baby Rider Earnings:\n• Per delivery: ₱40-₱150 (depends on distance and area)\n• Zone bonuses: Extra ₱20-50 for high-demand areas\n• Surge pricing: Up to 2x during peak hours (rush times)\n• Weekly incentives: Hit targets for bonus payments\n• Performance bonuses: Maintain high customer ratings\n• Fuel allowance: ₱10-30 per delivery\n• Monthly potential: ₱15,000-₱50,000+ possible\n\nEarnings vary by location, demand, and season. Metro areas pay more than provincial areas. More deliveries = more earnings."
            },
            {
                "q": "What areas does E-Baby delivery cover?",
                "a": "E-Baby Current Delivery Coverage:\n• Metro Manila: All areas covered\n• Cavite: Most municipalities\n• Laguna: Most municipalities\n• Rizal: Most municipalities\n• Bulacan: Most municipalities\n• Visayas: Cebu, Iloilo, Bacolod, other major cities\n• Mindanao: Davao, Cagayan de Oro, General Santos, other cities\n• Other provinces: Expanding monthly\n\nWhen you accept an order, the app shows if it's in your serviceable area. You can set preferred zones and delivery radius."
            },
            {
                "q": "How do I track and complete deliveries on E-Baby?",
                "a": "E-Baby Delivery Process:\n1. Receive order notification in rider app\n2. Accept delivery and confirm arrival time\n3. Navigate to seller/warehouse for pickup\n4. Verify order items and condition\n5. Load items carefully and safely\n6. Use GPS guidance to navigate to customer\n7. Contact customer when arriving\n8. Take photo at delivery location\n9. Get customer confirmation/signature\n10. Mark as delivered in app\n11. Get paid automatically\n\nAlways verify order details before pickup. Take delivery photos for protection against disputes."
            },
            {
                "q": "What happens if I lose or damage an item?",
                "a": "Damage/Loss Protocol:\n1. Contact customer and order manager immediately\n2. Take photos/video of damage\n3. Submit incident report through app\n4. Insurance claim process initiated\n5. Investigation conducted\n6. Responsibility determined\n7. Compensation deducted from earnings (if at fault)\n\nTo prevent damage:\n• Handle items carefully and respectfully\n• Use protective packaging/bags\n• Drive safely and avoid rough roads\n• Take delivery photos as proof\n• Get customer signature/confirmation\n• Report issues immediately\n\nAccidents happen, but negligence results in warnings, fines, or suspension."
            },
            {
                "q": "How do I maintain a good rating as a rider?",
                "a": "Tips for High Ratings:\n• Be punctual - deliver on time or early\n• Be professional - courteous and respectful\n• Keep items safe - no damage during transit\n• Communicate - update customers on status\n• Drive safely - follow traffic rules\n• Appearance - maintain neat presentation\n• Handle feedback - respond to customer concerns\n• Complete accurately - mark orders correctly\n• Be reliable - accept and complete orders\n\nRating Benefits:\n• Higher pay rates\n• More order offers\n• Performance bonuses\n• Priority support\n• Career advancement\n\nLow ratings (below 4.0) may result in account restrictions or termination."
            }
        ]
    },
    "technical": {
        "title": "Technical & App Issues",
        "icon": "fa-cogs",
        "questions": [
            {
                "q": "The E-Baby app keeps crashing. What should I do?",
                "a": "If the E-Baby app crashes:\n\n1. Clear app cache:\n   - Go to Settings > Apps > E-Baby > Storage > Clear Cache\n   \n2. Force stop and restart:\n   - Go to Settings > Apps > E-Baby > Force Stop\n   - Wait 10 seconds\n   - Reopen the app\n   \n3. Check storage space:\n   - Ensure at least 500MB free storage\n   - Delete unused apps or files\n   \n4. Update the app:\n   - Go to Play Store/App Store\n   - Search E-Baby\n   - Check for updates and install\n   \n5. Restart your device:\n   - Power off completely\n   - Wait 10 seconds\n   - Power back on\n   \n6. Reinstall if still crashing:\n   - Uninstall E-Baby completely\n   - Restart device\n   - Reinstall fresh from store\n   \nIf still having issues, contact support with your device model and OS version."
            },
            {
                "q": "Payment is not going through on E-Baby. What can I do?",
                "a": "Payment Issues Troubleshooting:\n\n1. Check internet connection:\n   - Switch from WiFi to mobile data (or vice versa)\n   - Make sure signal is strong\n   \n2. Clear payment page cache:\n   - Close browser/app completely\n   - Clear cookies and cache\n   - Try again\n   \n3. Verify payment method:\n   - Check card expiration date\n   - Verify sufficient balance/funds\n   - Confirm card is not blocked by bank\n   \n4. Try different payment method:\n   - Use another card or e-wallet\n   - See if that works\n   \n5. Contact your bank:\n   - Your bank might be blocking E-Baby transactions\n   - Ask them to allow/whitelist E-Baby payments\n   \n6. Try on different device:\n   - Use computer/browser instead of mobile\n   - See if that works\n   \n7. Contact E-Baby support:\n   - Provide payment error message\n   - Share your order number\n   - We'll help investigate\n   \nDo NOT enter payment details multiple times - this can trigger blocks."
            },
            {
                "q": "I'm not receiving E-Baby notifications. How do I fix it?",
                "a": "To fix notification issues:\n\n1. Check in-app notification settings:\n   - Go to Settings > Notifications\n   - Ensure all toggles are ON\n   - Enable order updates, messages, promos\n   \n2. Enable system notifications:\n   - Go to Phone Settings > Apps > E-Baby > Notifications\n   - Enable 'Allow notifications'\n   - Enable 'Priority notifications'\n   - Enable 'Sound and vibration'\n   \n3. Check Do Not Disturb mode:\n   - Disable Do Not Disturb mode\n   - Or whitelist E-Baby in exceptions\n   \n4. Reinstall the app:\n   - Uninstall E-Baby\n   - Restart phone\n   - Reinstall from app store\n   \n5. Check email notifications:\n   - Check spam/junk folder for E-Baby emails\n   - Add e-baby emails to contacts\n   - Enable email notifications in settings\n   \n6. Grant permissions:\n   - Grant notification, location, contact permissions\n   - Go to Settings > Apps > E-Baby > Permissions"
            },
            {
                "q": "How do I report a bug or technical issue on E-Baby?",
                "a": "To report technical issues:\n\n1. Use in-app bug report:\n   - Go to Settings > Help & Support\n   - Click 'Report a Bug' or 'Report Issue'\n   - Describe the issue clearly\n   - Include screenshots or video\n   - Submit\n   \n2. Use this AI Customer Service:\n   - Describe the issue\n   - Get immediate troubleshooting help\n   - Escalate to human agent if needed\n   \n3. Email support:\n   - Send to ebabyservices@gmail.com\n   - Include:\n     - Detailed issue description\n     - Steps to reproduce the problem\n     - Device model and OS version\n     - Screenshots/video\n     - Your E-Baby user ID\n   \n4. Contact on social media:\n   - Message E-Baby on Facebook or Instagram\n   - We respond within 24 hours\n   \nProvide as much detail as possible for faster resolution!"
            },
            {
                "q": "Why is E-Baby loading slowly on my device?",
                "a": "Slow Loading Solutions:\n\n1. Check your internet speed:\n   - Test speed at speedtest.net\n   - Need minimum 2 Mbps for smooth browsing\n   \n2. Clear cache and cookies:\n   - Go to Settings > Clear Browsing Data (Chrome)\n   - Or Settings > Safari > Clear History (iPhone)\n   - Restart app/browser\n   \n3. Update the app/browser:\n   - Latest versions have performance improvements\n   - Check app store or browser settings\n   \n4. Close background apps:\n   - Too many apps drain bandwidth\n   - Close unused apps before using E-Baby\n   \n5. Restart your device:\n   - Power off and back on\n   - Clears temporary memory\n   \n6. Try WiFi vs mobile data:\n   - Switch between WiFi and mobile data\n   - Different networks have different speeds\n   \n7. Check storage space:\n   - Delete old files/photos\n   - Keep at least 1GB free storage\n   \n8. Reinstall the app:\n   - Uninstall and reinstall fresh\n   \nIf still slow after all steps, contact support with details."
            }
        ]
    },
    "disputes": {
        "title": "Disputes & Complaints",
        "icon": "fa-exclamation-triangle",
        "questions": [
            {
                "q": "How do I file a complaint against a seller?",
                "a": "To file a seller complaint:\n\n1. Go to Orders section\n2. Select the problematic order\n3. Click 'Report Issue' or 'File Complaint'\n4. Choose complaint type:\n   - Wrong item sent\n   - Item not as described\n   - Item damaged/defective\n   - Item never received\n   - Seller harassment\n   - Quality issues\n5. Provide detailed description of problem\n6. Upload supporting evidence:\n   - Photos of wrong/damaged item\n   - Screenshots of chat messages\n   - Receipt or proof of purchase\n7. Submit complaint\n\n8. Our team reviews within 24 hours\n9. We contact seller for response\n10. Fair decision based on evidence\n11. You're notified of resolution\n12. Refund or replacement issued if approved\n\nBe specific and provide clear evidence for faster resolution."
            },
            {
                "q": "How do I file a complaint against a rider?",
                "a": "To report a rider issue:\n\n1. Go to Orders section\n2. Find the delivery with the issue\n3. Click 'Report Delivery Issue'\n4. Select issue type:\n   - Late or no delivery\n   - Rude or unprofessional behavior\n   - Unsafe driving\n   - Item damaged during delivery\n   - Wrong delivery location\n   - Other issues\n5. Describe exactly what happened\n6. Provide evidence if available:\n   - Photos of damage\n   - Screenshots of chat\n   - Video of incident\n7. Submit report\n\n8. We investigate within 24 hours\n9. Rider given chance to respond\n10. Review all evidence fairly\n11. Take appropriate action\n12. You're notified of outcome\n\nSerious issues (safety, property damage) are prioritized. Document everything!"
            },
            {
                "q": "What happens after I file a complaint?",
                "a": "E-Baby Complaint Resolution Process:\n\n1. Submission: Your complaint recorded with timestamp\n2. Initial Review: Check if complaint is valid\n3. Evidence Collection: Gather all relevant data and messages\n4. Involved Party Contacted: Seller/Rider given chance to respond\n5. Investigation: Fair, unbiased review of both sides\n6. Decision: Determine fair resolution\n7. Action Taken:\n   - Refund issued\n   - Item replacement arranged\n   - Account warning given\n   - Service improved\n8. You're Notified: Via email with full details and reasoning\n9. Follow-up: We ensure resolution is satisfactory\n\nTypical Timeline: Resolved within 3-7 business days"
            },
            {
                "q": "Can I appeal a complaint decision?",
                "a": "Yes, you can appeal! \n\nTo appeal a complaint decision:\n\n1. You receive decision notification\n2. Click 'Appeal Decision' if available\n3. Provide new evidence or arguments\n4. Explain why you disagree with decision\n5. Be respectful and factual\n6. Submit appeal\n\n7. Fresh review team examines appeal\n8. New evidence reviewed carefully\n9. Decision can be upheld or overturned\n10. You receive final decision via email\n\nAppeal Details:\n• Appeal Window: 7 days from original decision\n• Required: New evidence or proof of error\n• Final Decision: Non-appealable after review\n\nAppeals must include substantial new information or procedural errors to be reconsidered. Frivolous appeals will be rejected."
            }
        ]
    },
    "company": {
        "title": "About E-Baby & Policies",
        "icon": "fa-info-circle",
        "questions": [
            {
                "q": "What is E-Baby?",
                "a": "E-Baby is a trusted online marketplace for baby products in the Philippines.\n\nOur Mission: Make quality baby products accessible, affordable, and convenient for all Filipino families.\n\nWhat We Offer:\n• Wide selection of baby products from verified sellers\n• Competitive prices and regular promotions\n• Fast, reliable delivery nationwide\n• Secure payment options (cards, e-wallets, COD, bank transfer)\n• Strong buyer, seller, and rider protections\n• 24/7 AI-powered customer support\n• Fair dispute resolution\n\nWho Uses E-Baby:\n• Buyers: Browse, purchase, and review baby products\n• Sellers: List and sell quality baby items\n• Riders: Deliver orders and earn income\n\nCategories:\n• Baby Clothes & Accessories\n• Toys & Games\n• Educational Materials\n• Strollers & Gear\n• Nursery Furniture\n• Safety and Health\n\nWe're committed to creating a safe, transparent, and honest marketplace."
            },
            {
                "q": "How do I contact E-Baby support?",
                "a": "Multiple ways to reach E-Baby support:\n\n1. AI Customer Service:\n   - Use this page for instant answers\n   - Get help with common questions\n   - Escalate to human agent if needed\n   - Available 24/7\n   \n2. Email:\n   - ebabyservices@gmail.com\n   - Response within 24 hours\n   - Include order number and details\n   \n3. In-App Help:\n   - Go to Settings > Help & Support\n   - Submit ticket or report issue\n   - Track support requests\n   \n4. Social Media:\n   - Facebook: E-Baby Philippines\n   - Instagram: @EBabyPH\n   - Message within 24 hours\n   \n5. For Urgent Issues:\n   - Use 'Report Issue' in Orders section\n   - Contact us immediately\n   - Provide detailed information\n\nWe're here to help! Choose the method most convenient for you."
            },
            {
                "q": "What are E-Baby's Terms of Service?",
                "a": "Key Points of E-Baby Terms of Service:\n\n1. Account Responsibility:\n   - You're responsible for account security\n   - Don't share your password\n   - Update information regularly\n   \n2. Prohibited Activities:\n   - Fraud, scams, or illegal activity\n   - Harassment or abusive behavior\n   - Unauthorized account access\n   - Manipulation of ratings/reviews\n   - Selling counterfeit items\n   - Hacking or unauthorized use\n   \n3. Content & Listings:\n   - Information must be accurate\n   - Photos must show actual products\n   - No false or misleading advertising\n   - Descriptions must match reality\n   \n4. Disputes:\n   - We mediate fairly and unbiasedly\n   - Decision based on evidence\n   - Appeal window available\n   - Both sides heard before decision\n   \n5. Buyer/Seller Protection:\n   - Buyer Protection Program active\n   - Seller Verification required\n   - Dispute Resolution available\n   - Money-back Guarantee\n   \n6. Changes:\n   - We may update terms anytime\n   - Continued use = acceptance of new terms\n   - Advance notice provided when possible\n   \nFull Terms available in Settings > Terms & Conditions."
            },
            {
                "q": "How does E-Baby protect all users?",
                "a": "E-Baby Protection Programs:\n\nFor Buyers:\n• Buyer Protection Guarantee: Refund if item doesn't arrive\n• Defect Guarantee: Refund for damaged/defective items\n• Secure Payment: Encrypted transactions\n• Seller Verification: All sellers reviewed\n• Dispute Resolution: Fair mediation\n• Money-back Guarantee coverage\n\nFor Sellers:\n• Seller Protection: Against false claims\n• Payment Security: Guaranteed payment\n• Account Protection: Against unauthorized access\n• Review Authenticity: Filter fake/spam reviews\n• Dispute Mediation: Fair review of complaints\n• Chargeback Insurance available\n\nFor Riders:\n• Income Guarantee: Fair minimum pay\n• Safety Insurance: Coverage during work\n• 24/7 Support: Help when needed\n• Fair Disputes: Impartial investigation\n• Accident Coverage available\n\nFor All Users:\n• Secure servers and encrypted data\n• Regular security updates\n• Privacy protection\n• Fair and transparent policies\n• Quick dispute resolution\n• Community guidelines enforcement\n\nWe're committed to protecting all users equally and fairly!"
            }
        ]
    }
}

@app.route('/customer_service')
def customer_service():
    """AI-powered customer service page"""
    return render_template('customer_service.html', kb=json.dumps(CUSTOMER_SERVICE_KB))

@app.route('/api/customer_service/categories')
def get_cs_categories():
    """Get all customer service categories"""
    categories = []
    for key, value in CUSTOMER_SERVICE_KB.items():
        categories.append({
            'id': key,
            'title': value['title'],
            'icon': value['icon'],
            'question_count': len(value['questions'])
        })
    return jsonify(categories)

@app.route('/api/customer_service/category/<category_id>')
def get_cs_category(category_id):
    """Get questions for a specific category"""
    if category_id not in CUSTOMER_SERVICE_KB:
        return jsonify({'error': 'Category not found'}), 404
    
    category = CUSTOMER_SERVICE_KB[category_id]
    return jsonify({
        'id': category_id,
        'title': category['title'],
        'icon': category['icon'],
        'questions': category['questions']
    })

@app.route('/api/customer_service/search', methods=['POST'])
def search_cs_articles():
    """Search customer service knowledge base"""
    data = request.get_json()
    query = data.get('query', '').lower().strip()
    
    if not query or len(query) < 2:
        return jsonify({'error': 'Query too short'}), 400
    
    results = []
    for category_id, category in CUSTOMER_SERVICE_KB.items():
        for question in category['questions']:
            q_text = question['q'].lower()
            a_text = question['a'].lower()
            
            # Simple matching - can be enhanced with fuzzy search
            if query in q_text or query in a_text:
                results.append({
                    'category': category['title'],
                    'category_id': category_id,
                    'question': question['q'],
                    'answer': question['a'],
                    'relevance': 'high' if query in q_text else 'medium'
                })
    
    # Sort by relevance
    results.sort(key=lambda x: (x['relevance'] != 'high', results.index(x)))
    
    return jsonify({
        'query': query,
        'results': results[:10],  # Return top 10 results
        'total': len(results)
    })

@app.route('/api/customer_service/feedback', methods=['POST'])
def submit_cs_feedback():
    """Submit feedback on CS article helpfulness"""
    data = request.get_json()
    category = data.get('category')
    question = data.get('question')
    helpful = data.get('helpful')  # True/False
    
    if not all([category, question, helpful is not None]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Log feedback for analysis
        feedback_log = {
            'timestamp': datetime.now().isoformat(),
            'category': category,
            'question': question,
            'helpful': helpful,
            'ip': request.remote_addr
        }
        
        # In production, save to database
        # For now, just acknowledge
        return jsonify({
            'success': True,
            'message': 'Thank you for your feedback!',
            'feedback': feedback_log
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================================================================================================
#                                    SALES REPORT API
# =====================================================================================================================

@app.route('/api/seller_sales_report', methods=['POST'])
def api_seller_sales_report():
    """API endpoint to get seller sales report with date filtering"""
    if 'email' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    seller_email = session.get('email')
    data = request.get_json()
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({'success': False, 'error': 'Missing date range'}), 400
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Query to get orders for the seller within the date range
        query = """
            SELECT 
                o.id as order_id,
                p.name as product_name,
                o.quantity,
                (o.quantity * p.price) as item_amount,
                o.total_price as subtotal,
                (o.total_price - COALESCE(o.commission_amount, 0)) as net_sales,
                o.date as order_date
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE o.seller_email = %s 
            AND DATE(o.date) >= %s 
            AND DATE(o.date) <= %s
            AND o.status NOT IN ('Cancelled')
            ORDER BY o.date DESC
        """
        
        cursor.execute(query, (seller_email, start_date, end_date))
        report_data = cursor.fetchall()
        
        # Calculate summary
        total_orders = len(report_data)
        total_sales = sum(float(item['subtotal']) for item in report_data) if report_data else 0
        total_net_sales = sum(float(item['net_sales']) for item in report_data) if report_data else 0
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'report': report_data,
            'summary': {
                'total_orders': total_orders,
                'total_sales': total_sales,
                'total_net_sales': total_net_sales
            }
        })
    
    except Exception as e:
        print(f"Error generating sales report: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin_order_report', methods=['POST'])
def api_admin_order_report():
    """API endpoint to get admin order report with date filtering"""
    if 'email' not in session or session.get('user_type') != 'Admin':
        return jsonify({'success': False, 'error': 'Not authorized'}), 403
    
    data = request.get_json()
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({'success': False, 'error': 'Missing date range'}), 400
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Query to get all orders within the date range with seller info
        query = """
            SELECT 
                o.id as order_id,
                p.seller_email,
                p.name as product_name,
                o.quantity,
                (o.quantity * p.price) as item_amount,
                o.total_price as subtotal,
                COALESCE(o.commission_amount, 0) as admin_commission,
                (o.total_price - COALESCE(o.commission_amount, 0)) as net_sales,
                o.order_date
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE DATE(o.order_date) >= %s 
            AND DATE(o.order_date) <= %s
            AND o.status NOT IN ('Cancelled', 'Failed')
            ORDER BY o.order_date DESC
        """
        
        cursor.execute(query, (start_date, end_date))
        report_data = cursor.fetchall()
        
        # Calculate summary
        total_orders = len(report_data)
        total_revenue = sum(float(item['subtotal']) for item in report_data) if report_data else 0
        total_admin_commission = sum(float(item['admin_commission']) for item in report_data) if report_data else 0
        total_seller_earnings = sum(float(item['net_sales']) for item in report_data) if report_data else 0
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'report': report_data,
            'summary': {
                'total_orders': total_orders,
                'total_revenue': total_revenue,
                'total_admin_commission': total_admin_commission,
                'total_seller_earnings': total_seller_earnings
            }
        })
    
    except Exception as e:
        print(f"Error generating admin order report: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
