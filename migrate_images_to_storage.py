import os
from typing import Optional, List

import firebase_admin
from firebase_admin import credentials, firestore, storage


# Path to your Firebase service account JSON (already used elsewhere in the project)
SERVICE_ACCOUNT_PATH = "firebase-config.json"

# IMPORTANT: Set this to your Firebase Storage bucket name.
# It is usually "<project-id>.appspot.com".
# For your project it is likely "e-baby-81746.appspot.com" – update if needed.
FIREBASE_STORAGE_BUCKET = "e-baby-81746.appspot.com"

# Local paths (relative to this file) where files are currently stored
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_ROOT = os.path.join(BASE_DIR, "static")

# These prefixes match how paths are stored in Firestore / old DB
PROFILE_PIC_PREFIX = "uploads/profile_pics/"
BANNER_PREFIX = "uploads/banners/"
PRODUCT_UPLOADS_DIR = "uploads"  # product images are in static/uploads/<filename>


def init_firebase():
    """Initialize Firebase app, Firestore client, and Storage bucket."""
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(
            cred,
            {"storageBucket": FIREBASE_STORAGE_BUCKET},
        )

    db = firestore.client()
    bucket = storage.bucket()
    return db, bucket


def guess_content_type(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if ext == ".png":
        return "image/png"
    if ext == ".gif":
        return "image/gif"
    return "application/octet-stream"


def upload_file_to_storage(
    bucket, local_path: str, dest_path: str
) -> Optional[str]:
    """
    Upload a single file to Firebase Storage.

    Returns the public URL, or None if the file does not exist.
    """
    if not os.path.exists(local_path):
        print(f"[SKIP] Local file not found: {local_path}")
        return None

    blob = bucket.blob(dest_path)

    print(f"[UPLOAD] {local_path} -> gs://{bucket.name}/{dest_path}")
    blob.upload_from_filename(local_path, content_type=guess_content_type(local_path))

    # Make file publicly readable (optional, but usually what you want for images)
    blob.make_public()
    return blob.public_url


def is_already_url(value: Optional[str]) -> bool:
    if not isinstance(value, str):
        return False
    return value.startswith("http://") or value.startswith("https://") or value.startswith(
        "gs://"
    )


def migrate_user_images(db, bucket):
    """
    Migrate user profile pictures and banners.

    - Assumes Firestore 'users' collection.
    - Existing fields:
        profile_pic: 'uploads/profile_pics/<filename>'
        banner_image: 'uploads/banners/<filename>'
    - Writes new fields:
        profile_pic_url, banner_image_url
      (so existing paths remain untouched until you switch your app to use the *_url fields)
    """
    users_ref = db.collection("users")
    users = list(users_ref.stream())
    print(f"Found {len(users)} users.")

    for doc in users:
        data = doc.to_dict() or {}
        updates = {}

        profile_pic = data.get("profile_pic")
        if profile_pic and not is_already_url(profile_pic):
            # Stored as 'uploads/profile_pics/<filename>'
            local_path = os.path.join(
                STATIC_ROOT, profile_pic.replace("/", os.sep)
            )
            dest_path = profile_pic  # keep same relative path in bucket
            url = upload_file_to_storage(bucket, local_path, dest_path)
            if url:
                updates["profile_pic_url"] = url

        banner_image = data.get("banner_image")
        if banner_image and not is_already_url(banner_image):
            # Stored as 'uploads/banners/<filename>'
            local_path = os.path.join(
                STATIC_ROOT, banner_image.replace("/", os.sep)
            )
            dest_path = banner_image
            url = upload_file_to_storage(bucket, local_path, dest_path)
            if url:
                updates["banner_image_url"] = url

        if updates:
            print(f"[UPDATE] users/{doc.id} -> {list(updates.keys())}")
            users_ref.document(doc.id).update(updates)


def migrate_product_images(db, bucket):
    """
    Migrate product images.

    - Assumes Firestore 'products' collection.
    - Existing fields:
        image: main image filename, e.g. '12345_main.jpg'
        images: comma-separated filenames, e.g. 'img1.jpg,img2.jpg'
    - Writes new fields:
        image_url: URL for main image
        image_urls: list of URLs for all images
    """
    products_ref = db.collection("products")
    products = list(products_ref.stream())
    print(f"Found {len(products)} products.")

    for doc in products:
        data = doc.to_dict() or {}
        updates: dict = {}

        # Main image
        image_name = data.get("image")
        if image_name and not is_already_url(image_name):
            # Files are stored at static/uploads/<filename>
            local_path = os.path.join(
                STATIC_ROOT, PRODUCT_UPLOADS_DIR, image_name
            )
            dest_path = f"uploads/products/{image_name}"
            url = upload_file_to_storage(bucket, local_path, dest_path)
            if url:
                updates["image_url"] = url

        # All images (comma-separated string of filenames)
        images_field = data.get("images")
        all_urls: List[str] = []
        if isinstance(images_field, str) and images_field.strip():
            filenames = [
                part.strip()
                for part in images_field.split(",")
                if part.strip()
            ]
            for filename in filenames:
                if is_already_url(filename):
                    all_urls.append(filename)
                    continue

                local_path = os.path.join(
                    STATIC_ROOT, PRODUCT_UPLOADS_DIR, filename
                )
                dest_path = f"uploads/products/{filename}"
                url = upload_file_to_storage(bucket, local_path, dest_path)
                if url:
                    all_urls.append(url)

        if all_urls:
            updates["image_urls"] = all_urls

        if updates:
            print(f"[UPDATE] products/{doc.id} -> {list(updates.keys())}")
            products_ref.document(doc.id).update(updates)


def main():
    print("Initializing Firebase...")
    db, bucket = init_firebase()
    print(f"Using Firestore project: {db.project}")
    print(f"Using Storage bucket: {bucket.name}")

    print("\n=== Migrating user images ===")
    migrate_user_images(db, bucket)

    print("\n=== Migrating product images ===")
    migrate_product_images(db, bucket)

    print("\nDone. Review your Firestore documents and app code to start using the new *_url fields.")


if __name__ == "__main__":
    main()

