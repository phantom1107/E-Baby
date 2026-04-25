"""
One-time migration script:
- Upload existing local image files to Cloudinary
- Update Firestore documents with Cloudinary URLs

This covers:
- Users: profile_pic -> profile_pic_url, banner_image -> banner_image_url
- Products: image/images -> image_url/image_urls

Run from the E-Baby directory:
    cd E-Baby
    python migrate_images_to_cloudinary.py

Requires:
- firebase-config.json service account file in this directory
- Environment variables:
    CLOUDINARY_CLOUD_NAME
    CLOUDINARY_API_KEY
    CLOUDINARY_API_SECRET
"""

import os
from typing import List, Optional

import firebase_admin
from firebase_admin import credentials, firestore

import cloudinary
import cloudinary.uploader


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_ROOT = os.path.join(BASE_DIR, "static")

SERVICE_ACCOUNT_PATH = "firebase-config.json"


def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
    return firestore.client()


def init_cloudinary():
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not (cloud_name and api_key and api_secret):
        raise RuntimeError(
            "Cloudinary env vars not set. Please set "
            "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )


def is_url(value: Optional[str]) -> bool:
    return isinstance(value, str) and (
        value.startswith("http://") or value.startswith("https://")
    )


def upload_local_image(local_path: str, folder: str, public_id_prefix: str) -> Optional[str]:
    if not os.path.exists(local_path):
        print(f"[SKIP] File not found: {local_path}")
        return None

    public_id = f"{public_id_prefix}_{int(os.path.getmtime(local_path))}"

    print(f"[UPLOAD] {local_path} -> Cloudinary folder={folder}, public_id={public_id}")
    result = cloudinary.uploader.upload(
        local_path,
        folder=folder,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
    )
    return result.get("secure_url")


def migrate_user_images(db):
    users_ref = db.collection("users")
    users = list(users_ref.stream())
    print(f"Found {len(users)} users")

    for doc in users:
        data = doc.to_dict() or {}
        updates = {}

        profile_pic = data.get("profile_pic")
        if profile_pic and not is_url(profile_pic) and not is_url(data.get("profile_pic_url")):
            # profile_pic is usually 'uploads/profile_pics/filename.jpg' or just filename
            rel = profile_pic.replace("\\", "/")
            if rel.startswith("uploads/"):
                rel = rel[len("uploads/") :]
            local_path = os.path.join(STATIC_ROOT, rel.replace("/", os.sep))
            url = upload_local_image(local_path, "ebaby/profile_pics", f"profile_{doc.id}")
            if url:
                updates["profile_pic_url"] = url

        banner_image = data.get("banner_image")
        if banner_image and not is_url(banner_image) and not is_url(data.get("banner_image_url")):
            rel = banner_image.replace("\\", "/")
            if rel.startswith("uploads/"):
                rel = rel[len("uploads/") :]
            local_path = os.path.join(STATIC_ROOT, rel.replace("/", os.sep))
            url = upload_local_image(local_path, "ebaby/banners", f"banner_{doc.id}")
            if url:
                updates["banner_image_url"] = url

        if updates:
            print(f"[UPDATE] users/{doc.id} -> {list(updates.keys())}")
            users_ref.document(doc.id).update(updates)


def migrate_product_images(db):
    products_ref = db.collection("products")
    products = list(products_ref.stream())
    print(f"Found {len(products)} products")

    for doc in products:
        data = doc.to_dict() or {}
        updates = {}

        # Main image
        image = data.get("image")
        if image and not is_url(image) and not is_url(data.get("image_url")):
            filename = os.path.basename(str(image))
            local_path = os.path.join(STATIC_ROOT, "uploads", filename)
            url = upload_local_image(local_path, "ebaby/products", f"product_main_{doc.id}")
            if url:
                updates["image_url"] = url

        # Additional images (comma-separated filenames)
        image_urls: List[str] = []
        images_field = data.get("images")
        if isinstance(images_field, str) and images_field.strip():
            parts = [p.strip() for p in images_field.split(",") if p.strip()]
            for idx, part in enumerate(parts):
                if is_url(part):
                    image_urls.append(part)
                    continue
                filename = os.path.basename(part)
                local_path = os.path.join(STATIC_ROOT, "uploads", filename)
                url = upload_local_image(
                    local_path, "ebaby/products", f"product_extra_{doc.id}_{idx}"
                )
                if url:
                    image_urls.append(url)

        if image_urls:
            updates["image_urls"] = image_urls

        if updates:
            print(f"[UPDATE] products/{doc.id} -> {list(updates.keys())}")
            products_ref.document(doc.id).update(updates)


def main():
    print("Initializing Firebase...")
    db = init_firebase()
    print(f"Using Firestore project: {db.project}")

    print("Initializing Cloudinary...")
    init_cloudinary()

    print("\n=== Migrating user images ===")
    migrate_user_images(db)

    print("\n=== Migrating product images ===")
    migrate_product_images(db)

    print("\nDone. Check Firestore and Cloudinary to verify.")


if __name__ == "__main__":
    main()

