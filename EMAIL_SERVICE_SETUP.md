# Email Service Setup for OTP

This guide explains how to set up the email service to send OTP codes to users during registration.

## Option 1: Using Local Flask Backend (Recommended for Development)

### Step 1: Install Python Dependencies

```bash
cd E-Baby
pip install -r email_requirements.txt
```

### Step 2: Configure Gmail App Password

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security → 2-Step Verification (enable if not already)
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### Step 3: Update Email Credentials

Edit `email_service.py` and update these lines:

```python
SENDER_EMAIL = "your-email@gmail.com"  # Your Gmail address
SENDER_PASSWORD = "your-app-password"  # The 16-char app password from step 2
```

### Step 4: Run the Email Service

```bash
python email_service.py
```

The service will start on `http://localhost:5001`

### Step 5: Test the Mobile App

Now when users register in the mobile app, OTP emails will be sent to their email address.

---

## Option 2: Using EmailJS (Free Cloud Service)

If you prefer not to run a local backend:

### Step 1: Create EmailJS Account

1. Go to https://www.emailjs.com/
2. Sign up for a free account
3. Add an email service (Gmail, Outlook, etc.)
4. Create an email template with these variables:
   - `{{to_email}}` - Recipient email
   - `{{otp_code}}` - The OTP code
   - `{{message}}` - Email message

### Step 2: Update AuthService

Edit `E-Baby-Mobile/lib/services/auth_service.dart` and update the `_sendOTPEmail` method to use EmailJS instead of localhost.

---

## Troubleshooting

### Email not sending?

1. Check if email_service.py is running
2. Verify Gmail credentials are correct
3. Make sure 2-Step Verification is enabled on Gmail
4. Check console logs for error messages

### "Connection refused" error?

- Make sure email_service.py is running on port 5001
- Check firewall settings

### Gmail blocking sign-in?

- Use App Password instead of regular password
- Enable "Less secure app access" (not recommended)
- Use EmailJS instead

---

## Production Deployment

For production, consider:

1. **Firebase Cloud Functions** - Serverless email sending
2. **SendGrid** - Professional email service with free tier
3. **AWS SES** - Amazon's email service
4. **Mailgun** - Email API service

Deploy the email service to a cloud platform and update the URL in `auth_service.dart`.
