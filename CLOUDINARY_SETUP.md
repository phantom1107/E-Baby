# Cloudinary Setup Guide for E-Baby Flask App

## Overview
Your Flask app already has Cloudinary integration code! You just need to add the environment variables to Railway.

## What You Need

From your Cloudinary Dashboard (https://cloudinary.com/console):
- **Cloud Name**: `dvjiadqok` (same as mobile app)
- **API Key**: Found in your dashboard
- **API Secret**: Found in your dashboard (click "eye" icon to reveal)

## Step 1: Add Environment Variables to Railway

1. Go to your Railway project dashboard
2. Click on your E-Baby service
3. Go to **Variables** tab
4. Click **+ New Variable** for each of these:

```
CLOUDINARY_CLOUD_NAME=dvjiadqok
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

5. Railway will automatically redeploy

## Step 2: Verify It's Working

After Railway redeploys, check the logs. You should see:
```
Cloudinary is ENABLED
```

If you see:
```
Cloudinary is NOT enabled (will use local storage)
```
Then the environment variables weren't set correctly.

## How It Works

### Profile Pictures & Banners
When users upload profile pics or banners:
1. **First choice**: Upload to Cloudinary (if env vars are set)
2. **Fallback**: Save locally to `static/uploads/` (if Cloudinary fails)

### Product Images
Same behavior - Cloudinary first, local fallback.

### Image URLs Stored in Firestore
The Cloudinary URLs are stored in Firestore as:
- `profile_pic_url` - User profile pictures
- `banner_image_url` - User banner images  
- `image_urls` - Product images (array)

## Current Status

✅ Cloudinary library installed (`cloudinary==1.34.0`)
✅ Upload functions already implemented in `app.py`
✅ Mobile app using same Cloudinary account
❌ Environment variables NOT set in Railway yet

## Testing Locally

To test Cloudinary locally before deploying:

1. Create a `.env` file in `E-Baby/` directory:
```bash
CLOUDINARY_CLOUD_NAME=dvjiadqok
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

2. Install python-dotenv:
```bash
pip install python-dotenv
```

3. Add to top of `app.py` (after imports):
```python
from dotenv import load_dotenv
load_env()
```

4. Run the app and test uploading images

## Migration Script

If you have existing images in Firestore that need to be migrated to Cloudinary, use:
```bash
python migrate_images_to_cloudinary.py
```

This will:
- Upload all local images to Cloudinary
- Update Firestore documents with new Cloudinary URLs

## Security Notes

- ✅ `.env` file is in `.gitignore` (won't be committed)
- ✅ Use Railway environment variables for production
- ✅ Never commit API secrets to GitHub
- ✅ Cloudinary URLs are public but secure (can't be modified without API secret)

## Folder Structure in Cloudinary

Your images will be organized as:
```
ebaby/
├── profile_pics/
│   └── profile_pic_user@email.com_timestamp
├── banners/
│   └── banner_user@email.com_timestamp
└── products/
    └── product_productId_timestamp
```

Same structure as your mobile app!
