"""
Simple Flask API endpoint to send OTP emails
Run this with: python email_service.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for mobile app

# Email configuration - UPDATE THESE WITH YOUR GMAIL CREDENTIALS
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "your-email@gmail.com"  # Replace with your Gmail
SENDER_PASSWORD = "your-app-password"  # Replace with Gmail App Password

@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    """Send OTP email to user"""
    try:
        data = request.json
        recipient_email = data.get('email')
        otp_code = data.get('otp')
        
        if not recipient_email or not otp_code:
            return jsonify({'success': False, 'error': 'Missing email or OTP'}), 400
        
        # Create email message
        message = MIMEMultipart('alternative')
        message['Subject'] = 'Your E-Baby OTP Code'
        message['From'] = SENDER_EMAIL
        message['To'] = recipient_email
        
        # Email body
        text = f"""
        Hello,
        
        Your E-Baby verification code is: {otp_code}
        
        This code will expire shortly.
        
        If you did not request this code, please ignore this email.
        
        © 2025 E-baby
        """
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <!-- Purple Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%); padding: 30px 40px; text-align: left;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">E-Baby Verification</h1>
                                    <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Secure one-time code</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                                        Hello,
                                    </p>
                                    
                                    <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                                        Use the following code to complete your sign up. This code will expire shortly.
                                    </p>
                                    
                                    <!-- OTP Code Box -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding: 20px 0;">
                                                <div style="display: inline-block; border: 2px solid #7C3AED; border-radius: 8px; padding: 20px 40px; background-color: #ffffff;">
                                                    <span style="font-size: 32px; font-weight: bold; color: #7C3AED; letter-spacing: 8px; font-family: 'Courier New', monospace;">{otp_code}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                        If you didn't request this, you can safely ignore this email.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 20px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
                                    <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                        © 2025 E-baby • Please do not reply to this automated message.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        message.attach(part1)
        message.attach(part2)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(message)
        
        return jsonify({'success': True, 'message': 'OTP sent successfully'})
        
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("Email service starting on http://localhost:5001")
    print("Make sure to update SENDER_EMAIL and SENDER_PASSWORD in the code")
    app.run(host='0.0.0.0', port=5001, debug=True)
