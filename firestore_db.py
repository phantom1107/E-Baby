"""
Firestore Database Helper Module
Replaces MySQL operations with Firestore/Firebase equivalents
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
import json
import warnings
import time

# Suppress the specific UserWarning about positional arguments in where()
warnings.filterwarnings('ignore', message='Detected filter using positional arguments.*')

# Initialize Firebase (only once)
try:
    firebase_admin.get_app()
    db = firestore.client()
except ValueError:
    # Try to load from firebase-config.json first (local development)
    config_path = "firebase-config.json"
    
    try:
        if os.path.exists(config_path):
            cred = credentials.Certificate(config_path)
        else:
            # Try to load from environment variable (production)
            config_json = os.getenv("FIREBASE_CONFIG_JSON")
            if config_json:
                config_dict = json.loads(config_json)
                cred = credentials.Certificate(config_dict)
            else:
                raise ValueError("Firebase config not found. Set FIREBASE_CONFIG_JSON environment variable.")
        
        firebase_admin.initialize_app(cred)
        db = firestore.client()
    except Exception as e:
        print(f"CRITICAL: Firebase initialization failed: {e}")
        print("Please regenerate your service account key from Firebase Console")
        raise

# =============================
# Collection Names (use these consistently)
# =============================
COLLECTIONS = {
    'users': 'users',
    'products': 'products',
    'cart': 'cart',
    'checkout': 'checkout',
    'orders': 'orders',
    'wishlist': 'wishlist',
    'chat_messages': 'chat_messages',
    'seller_requests': 'seller_requests',
    'rider_requests': 'rider_requests',
    'buyer_requests': 'buyer_requests',
    'product_variants': 'product_variants',
    'seller_reports': 'seller_reports',
    'admin_activity_logs': 'admin_activity_logs',
    'seller_commissions': 'seller_commissions',
    'rider_earnings': 'rider_earnings',
}

# =============================
# Users Collection Functions
# =============================

def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email"""
    try:
        docs = db.collection(COLLECTIONS['users']).where("email", "==", email).limit(1).stream()
        for doc in docs:
            user_data = doc.to_dict()
            user_data['id'] = doc.id  # Include document ID
            return user_data
        return None
    except Exception as e:
        print(f"Error fetching user: {e}")
        return None


def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Get user by document ID"""
    try:
        doc = db.collection(COLLECTIONS['users']).document(user_id).get()
        if doc.exists:
            user_data = doc.to_dict()
            user_data['id'] = doc.id
            return user_data
        return None
    except Exception as e:
        print(f"Error fetching user by ID: {e}")
        return None


def create_user(user_data: Dict) -> str:
    """Create new user, returns document ID"""
    try:
        # Ensure email is unique
        if user_data.get('email'):
            existing = get_user_by_email(user_data['email'])
            if existing:
                raise ValueError(f"User with email {user_data['email']} already exists")
        
        # Add timestamps
        user_data['created_at'] = datetime.now()
        
        doc_ref = db.collection(COLLECTIONS['users']).document()
        doc_ref.set(user_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error creating user: {e}")
        raise


def update_user(email: str, update_data: Dict) -> bool:
    """Update user by email"""
    try:
        user = get_user_by_email(email)
        if not user:
            return False
        
        db.collection(COLLECTIONS['users']).document(user['id']).update(update_data)
        return True
    except Exception as e:
        print(f"Error updating user: {e}")
        return False


def update_user_by_id(user_id: str, update_data: Dict) -> bool:
    """Update user by ID"""
    try:
        # First verify the document exists
        doc = db.collection(COLLECTIONS['users']).document(user_id).get()
        if not doc.exists:
            print(f"Error updating user: Document not found for ID {user_id}")
            return False
        
        # Now perform the update
        db.collection(COLLECTIONS['users']).document(user_id).update(update_data)
        print(f"Successfully updated user {user_id}: {update_data}")
        return True
    except Exception as e:
        print(f"Error updating user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return False


def update_password(email: str, new_password: str) -> bool:
    """Update user password"""
    return update_user(email, {'password': new_password})


# =============================
# Products Collection Functions
# =============================

def get_product_by_id(product_id: str) -> Optional[Dict]:
    """Get product by document ID"""
    try:
        doc = db.collection(COLLECTIONS['products']).document(product_id).get()
        if doc.exists:
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            return product_data
        return None
    except Exception as e:
        print(f"Error fetching product: {e}")
        return None


def create_product(product_data: Dict) -> str:
    """Create new product, returns document ID"""
    try:
        product_data['created_at'] = datetime.now()
        if 'sales' not in product_data:
            product_data['sales'] = 0
        
        doc_ref = db.collection(COLLECTIONS['products']).document()
        doc_ref.set(product_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error creating product: {e}")
        raise


def update_product(product_id: str, update_data: Dict) -> bool:
    """Update product"""
    try:
        db.collection(COLLECTIONS['products']).document(product_id).update(update_data)
        return True
    except Exception as e:
        print(f"Error updating product: {e}")
        return False


def get_products_by_seller(seller_email: str) -> List[Dict]:
    """Get all products for a seller"""
    try:
        products = []
        query = db.collection(COLLECTIONS['products']).where("seller_email", "==", seller_email)
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            products.append(product_data)
        return products
    except Exception as e:
        print(f"Error fetching seller products: {e}")
        return []


def get_products_by_category(category: str) -> List[Dict]:
    """Get products by category"""
    try:
        products = []
        query = db.collection(COLLECTIONS['products']).where("category", "==", category)
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            products.append(product_data)
        return products
    except Exception as e:
        print(f"Error fetching products by category: {e}")
        return []


def get_all_products() -> List[Dict]:
    """Get all products"""
    try:
        products = []
        query = db.collection(COLLECTIONS['products'])
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            products.append(product_data)
        return products
    except Exception as e:
        print(f"Error fetching all products: {e}")
        return []


def search_products(search_term: str) -> List[Dict]:
    """Search products by name (client-side filter)"""
    try:
        products = []
        for doc in db.collection(COLLECTIONS['products']).stream():
            product_data = doc.to_dict()
            if search_term.lower() in product_data.get('name', '').lower():
                product_data['id'] = doc.id
                products.append(product_data)
        return products
    except Exception as e:
        print(f"Error searching products: {e}")
        return []


# =============================
# Cart Functions
# =============================

def add_to_cart(email: str, cart_item: Dict) -> str:
    """Add item to cart, returns document ID"""
    try:
        cart_item['email'] = email
        cart_item['created_at'] = datetime.now()
        
        doc_ref = db.collection(COLLECTIONS['cart']).document()
        doc_ref.set(cart_item)
        return doc_ref.id
    except Exception as e:
        print(f"Error adding to cart: {e}")
        raise


def get_cart(email: str) -> List[Dict]:
    """Get all items in cart for user"""
    try:
        items = []
        query = db.collection(COLLECTIONS['cart']).where("email", "==", email)
        for doc in query.stream():
            item_data = doc.to_dict()
            item_data['id'] = doc.id
            items.append(item_data)
        return items
    except Exception as e:
        print(f"Error fetching cart: {e}")
        return []


def remove_from_cart(cart_item_id: str) -> bool:
    """Remove item from cart"""
    try:
        db.collection(COLLECTIONS['cart']).document(cart_item_id).delete()
        return True
    except Exception as e:
        print(f"Error removing from cart: {e}")
        return False


def clear_cart(email: str) -> bool:
    """Clear all items from user's cart"""
    try:
        items = get_cart(email)
        for item in items:
            db.collection(COLLECTIONS['cart']).document(item['id']).delete()
        return True
    except Exception as e:
        print(f"Error clearing cart: {e}")
        return False


def update_cart_item(cart_item_id: str, update_data: Dict) -> bool:
    """Update cart item"""
    try:
        db.collection(COLLECTIONS['cart']).document(cart_item_id).update(update_data)
        return True
    except Exception as e:
        print(f"Error updating cart item: {e}")
        return False


# =============================
# Orders Functions
# =============================

def create_order(order_data: Dict) -> str:
    """Create new order, returns document ID"""
    try:
        order_data['date'] = datetime.now()
        order_data['created_at'] = datetime.now()
        
        doc_ref = db.collection(COLLECTIONS['orders']).document()
        doc_ref.set(order_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error creating order: {e}")
        raise


def get_order_by_id(order_id: str) -> Optional[Dict]:
    """Get order by ID"""
    try:
        doc = db.collection(COLLECTIONS['orders']).document(order_id).get()
        if doc.exists:
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            return order_data
        return None
    except Exception as e:
        print(f"Error fetching order: {e}")
        return None


def get_orders_by_email(email: str) -> List[Dict]:
    """Get all orders for a user"""
    try:
        orders = []
        query = db.collection(COLLECTIONS['orders']).where("email", "==", email).order_by("date", direction=firestore.Query.DESCENDING)
        for doc in query.stream():
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            orders.append(order_data)
        return orders
    except Exception as e:
        print(f"Error fetching orders: {e}")
        return []


def update_order(order_id: str, update_data: Dict) -> bool:
    """Update order"""
    try:
        db.collection(COLLECTIONS['orders']).document(order_id).update(update_data)
        return True
    except Exception as e:
        print(f"Error updating order: {e}")
        return False


def get_orders_by_seller(seller_email: str) -> List[Dict]:
    """Get all orders for a seller"""
    try:
        orders = []
        query = db.collection(COLLECTIONS['orders']).where("seller_email", "==", seller_email).order_by("date", direction=firestore.Query.DESCENDING)
        for doc in query.stream():
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            orders.append(order_data)
        return orders
    except Exception as e:
        print(f"Error fetching seller orders: {e}")
        return []


def get_orders_by_rider(rider_email: str) -> List[Dict]:
    """Get all orders for a rider"""
    try:
        orders = []
        query = db.collection(COLLECTIONS['orders']).where("rider_email", "==", rider_email).order_by("date", direction=firestore.Query.DESCENDING)
        for doc in query.stream():
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            orders.append(order_data)
        return orders
    except Exception as e:
        print(f"Error fetching rider orders: {e}")
        return []


def get_orders_by_status(status: str) -> List[Dict]:
    """Get orders by status"""
    try:
        orders = []
        query = db.collection(COLLECTIONS['orders']).where("status", "==", status)
        for doc in query.stream():
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            orders.append(order_data)
        return orders
    except Exception as e:
        print(f"Error fetching orders by status: {e}")
        return []


def get_all_orders() -> List[Dict]:
    """Get all orders"""
    try:
        orders = []
        query = db.collection(COLLECTIONS['orders']).order_by("date", direction=firestore.Query.DESCENDING)
        for doc in query.stream():
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            orders.append(order_data)
        return orders
    except Exception as e:
        print(f"Error fetching all orders: {e}")
        return []


def get_orders_by_date_range(start_date: datetime, end_date: datetime) -> List[Dict]:
    """Get orders within a date range"""
    try:
        orders = []
        query = db.collection(COLLECTIONS['orders']).where("date", ">=", start_date).where("date", "<=", end_date)
        for doc in query.stream():
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            orders.append(order_data)
        return orders
    except Exception as e:
        print(f"Error fetching orders by date range: {e}")
        return []


# =============================
# Wishlist Functions
# =============================

def add_to_wishlist(email: str, wishlist_item: Dict) -> str:
    """Add item to wishlist, returns document ID"""
    try:
        wishlist_item['email'] = email
        wishlist_item['date_added'] = datetime.now()
        
        doc_ref = db.collection(COLLECTIONS['wishlist']).document()
        doc_ref.set(wishlist_item)
        return doc_ref.id
    except Exception as e:
        print(f"Error adding to wishlist: {e}")
        raise


def get_wishlist(email: str) -> List[Dict]:
    """Get wishlist for user"""
    try:
        items = []
        query = db.collection(COLLECTIONS['wishlist']).where("email", "==", email)
        for doc in query.stream():
            item_data = doc.to_dict()
            item_data['id'] = doc.id
            items.append(item_data)
        return items
    except Exception as e:
        print(f"Error fetching wishlist: {e}")
        return []


def remove_from_wishlist(wishlist_item_id: str) -> bool:
    """Remove item from wishlist"""
    try:
        db.collection(COLLECTIONS['wishlist']).document(wishlist_item_id).delete()
        return True
    except Exception as e:
        print(f"Error removing from wishlist: {e}")
        return False


# =============================
# Chat Functions
# =============================

def add_chat_message(thread_id: str, message_data: Dict) -> str:
    """Add chat message, returns document ID"""
    try:
        message_data['thread_id'] = thread_id
        message_data['timestamp'] = datetime.now()
        
        doc_ref = db.collection(COLLECTIONS['chat_messages']).document()
        doc_ref.set(message_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error adding chat message: {e}")
        raise


def get_chat_messages(thread_id: str) -> List[Dict]:
    """Get all messages in a chat thread"""
    try:
        messages = []
        query = db.collection(COLLECTIONS['chat_messages']).where("thread_id", "==", thread_id).order_by("timestamp")
        for doc in query.stream():
            msg_data = doc.to_dict()
            msg_data['id'] = doc.id
            messages.append(msg_data)
        return messages
    except Exception as e:
        print(f"Error fetching chat messages: {e}")
        return []


# =============================
# Seller Requests Functions
# =============================

def create_seller_request(request_data: Dict) -> str:
    """Create seller request, returns document ID"""
    try:
        request_data['created_at'] = datetime.now()
        if 'status' not in request_data:
            request_data['status'] = 'Pending'
        
        doc_ref = db.collection(COLLECTIONS['seller_requests']).document()
        doc_ref.set(request_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error creating seller request: {e}")
        raise


def get_seller_requests(status: Optional[str] = None) -> List[Dict]:
    """Get seller requests, optionally filtered by status"""
    try:
        requests = []
        if status:
            query = db.collection(COLLECTIONS['seller_requests']).where("status", "==", status)
        else:
            query = db.collection(COLLECTIONS['seller_requests'])
        
        for doc in query.stream():
            request_data = doc.to_dict()
            request_data['id'] = doc.id
            requests.append(request_data)
        return requests
    except Exception as e:
        print(f"Error fetching seller requests: {e}")
        return []


def update_seller_request(request_id: str, update_data: Dict) -> bool:
    """Update seller request"""
    try:
        db.collection(COLLECTIONS['seller_requests']).document(request_id).update(update_data)
        return True
    except Exception as e:
        print(f"Error updating seller request: {e}")
        return False


# =============================
# Rider Requests Functions
# =============================

def create_rider_request(request_data: Dict) -> str:
    """Create rider request, returns document ID"""
    try:
        request_data['created_at'] = datetime.now()
        if 'status' not in request_data:
            request_data['status'] = 'Pending'
        
        doc_ref = db.collection(COLLECTIONS['rider_requests']).document()
        doc_ref.set(request_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error creating rider request: {e}")
        raise


def get_rider_requests(status: Optional[str] = None) -> List[Dict]:
    """Get rider requests, optionally filtered by status"""
    try:
        requests = []
        if status:
            query = db.collection(COLLECTIONS['rider_requests']).where("status", "==", status)
        else:
            query = db.collection(COLLECTIONS['rider_requests'])
        
        for doc in query.stream():
            request_data = doc.to_dict()
            request_data['id'] = doc.id
            requests.append(request_data)
        return requests
    except Exception as e:
        print(f"Error fetching rider requests: {e}")
        return []


def update_rider_request(request_id: str, update_data: Dict) -> bool:
    """Update rider request"""
    try:
        db.collection(COLLECTIONS['rider_requests']).document(request_id).update(update_data)
        return True
    except Exception as e:
        print(f"Error updating rider request: {e}")
        return False


# =============================
# Buyer Requests Functions
# =============================

def create_buyer_request(request_data: Dict) -> str:
    """Create buyer request, returns document ID"""
    try:
        request_data['created_at'] = datetime.now()
        if 'status' not in request_data:
            request_data['status'] = 'Pending'
        
        doc_ref = db.collection(COLLECTIONS['buyer_requests']).document()
        doc_ref.set(request_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error creating buyer request: {e}")
        raise


def get_buyer_requests(status: Optional[str] = None) -> List[Dict]:
    """Get buyer requests, optionally filtered by status"""
    try:
        requests = []
        if status:
            query = db.collection(COLLECTIONS['buyer_requests']).where("status", "==", status)
        else:
            query = db.collection(COLLECTIONS['buyer_requests'])
        
        for doc in query.stream():
            request_data = doc.to_dict()
            request_data['id'] = doc.id
            requests.append(request_data)
        return requests
    except Exception as e:
        print(f"Error fetching buyer requests: {e}")
        return []


def update_buyer_request(request_id: str, update_data: Dict) -> bool:
    """Update buyer request"""
    try:
        db.collection(COLLECTIONS['buyer_requests']).document(request_id).update(update_data)
        return True
    except Exception as e:
        print(f"Error updating buyer request: {e}")
        return False


# =============================
# Product Variants Functions
# =============================

def add_product_variant(product_id: str, variant_data: Dict) -> str:
    """Add product variant (color/size combo), returns document ID"""
    try:
        variant_data['product_id'] = product_id
        variant_data['created_at'] = datetime.now()
        
        doc_ref = db.collection(COLLECTIONS['product_variants']).document()
        doc_ref.set(variant_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error adding product variant: {e}")
        raise


def get_product_variants(product_id: str) -> List[Dict]:
    """Get all variants for a product"""
    try:
        variants = []
        query = db.collection(COLLECTIONS['product_variants']).where("product_id", "==", product_id)
        for doc in query.stream():
            variant_data = doc.to_dict()
            variant_data['id'] = doc.id
            variants.append(variant_data)
        return variants
    except Exception as e:
        print(f"Error fetching product variants: {e}")
        return []


def update_variant_stock(variant_id: str, new_stock: int) -> bool:
    """Update stock for a variant"""
    try:
        db.collection(COLLECTIONS['product_variants']).document(variant_id).update({'stock': new_stock})
        return True
    except Exception as e:
        print(f"Error updating variant stock: {e}")
        return False


# =============================
# Admin Activity Logs Functions
# =============================

def log_admin_activity(activity_data: Dict) -> str:
    """Log admin activity, returns document ID"""
    try:
        activity_data['timestamp'] = datetime.now()
        
        doc_ref = db.collection(COLLECTIONS['admin_activity_logs']).document()
        doc_ref.set(activity_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error logging admin activity: {e}")
        raise


def get_admin_activity_logs(limit: int = 100) -> List[Dict]:
    """Get recent admin activity logs"""
    try:
        logs = []
        query = db.collection(COLLECTIONS['admin_activity_logs']).order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit)
        for doc in query.stream():
            log_data = doc.to_dict()
            log_data['id'] = doc.id
            logs.append(log_data)
        return logs
    except Exception as e:
        print(f"Error fetching admin logs: {e}")
        return []


# =============================
# Seller Reports Functions
# =============================

def create_seller_report(report_data: Dict) -> str:
    """Create seller report, returns document ID"""
    try:
        report_data['created_at'] = datetime.now()
        if 'status' not in report_data:
            report_data['status'] = 'Pending'
        
        doc_ref = db.collection(COLLECTIONS['seller_reports']).document()
        doc_ref.set(report_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error creating seller report: {e}")
        raise


def get_seller_reports(status: Optional[str] = None) -> List[Dict]:
    """Get seller reports, optionally filtered by status"""
    try:
        reports = []
        if status:
            query = db.collection(COLLECTIONS['seller_reports']).where("status", "==", status)
        else:
            query = db.collection(COLLECTIONS['seller_reports'])
        
        for doc in query.stream():
            report_data = doc.to_dict()
            report_data['id'] = doc.id
            reports.append(report_data)
        return reports
    except Exception as e:
        print(f"Error fetching seller reports: {e}")
        return []


def update_seller_report(report_id: str, update_data: Dict) -> bool:
    """Update seller report"""
    try:
        db.collection(COLLECTIONS['seller_reports']).document(report_id).update(update_data)
        return True
    except Exception as e:
        print(f"Error updating seller report: {e}")
        return False


# =============================
# Commissions & Earnings Functions
# =============================

def create_seller_commission(commission_data: Dict) -> str:
    """Create seller commission record, returns document ID"""
    try:
        commission_data['date'] = datetime.now()
        
        doc_ref = db.collection(COLLECTIONS['seller_commissions']).document()
        doc_ref.set(commission_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error creating seller commission: {e}")
        raise


def get_seller_commissions(seller_email: str) -> List[Dict]:
    """Get commissions for a seller"""
    try:
        commissions = []
        query = db.collection(COLLECTIONS['seller_commissions']).where("seller_email", "==", seller_email).order_by("date", direction=firestore.Query.DESCENDING)
        for doc in query.stream():
            comm_data = doc.to_dict()
            comm_data['id'] = doc.id
            commissions.append(comm_data)
        return commissions
    except Exception as e:
        print(f"Error fetching seller commissions: {e}")
        return []


def create_rider_earnings(earnings_data: Dict) -> str:
    """Create rider earnings record, returns document ID"""
    try:
        earnings_data['date'] = datetime.now()
        
        doc_ref = db.collection(COLLECTIONS['rider_earnings']).document()
        doc_ref.set(earnings_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error creating rider earnings: {e}")
        raise


def get_rider_earnings(rider_email: str) -> List[Dict]:
    """Get earnings for a rider"""
    try:
        earnings = []
        query = db.collection(COLLECTIONS['rider_earnings']).where("rider_email", "==", rider_email).order_by("date", direction=firestore.Query.DESCENDING)
        for doc in query.stream():
            earn_data = doc.to_dict()
            earn_data['id'] = doc.id
            earnings.append(earn_data)
        return earnings
    except Exception as e:
        print(f"Error fetching rider earnings: {e}")
        return []


# =============================
# Generic Functions
# =============================

def delete_document(collection: str, doc_id: str) -> bool:
    """Delete any document by collection and ID"""
    try:
        # First verify the document exists
        doc = db.collection(collection).document(doc_id).get()
        if not doc.exists:
            print(f"Error deleting document: Document not found in {collection} with ID {doc_id}")
            return False
        
        # Now perform the delete
        db.collection(collection).document(doc_id).delete()
        print(f"Successfully deleted document {doc_id} from {collection}")
        return True
    except Exception as e:
        print(f"Error deleting document from {collection}: {e}")
        import traceback
        traceback.print_exc()
        return False


def batch_write(operations: List[tuple]) -> bool:
    """
    Execute batch write operations
    operations: list of tuples (collection, doc_id, data, action)
    action can be 'set', 'update', or 'delete'
    """
    try:
        batch = db.batch()
        for collection, doc_id, data, action in operations:
            doc_ref = db.collection(collection).document(doc_id)
            if action == 'set':
                batch.set(doc_ref, data)
            elif action == 'update':
                batch.update(doc_ref, data)
            elif action == 'delete':
                batch.delete(doc_ref)
        batch.commit()
        return True
    except Exception as e:
        print(f"Error in batch write: {e}")
        return False


# =============================
# App-Specific Helper Functions (for easy migration from MySQL)
# =============================

def authenticate_user(email: str, password: str) -> Optional[Dict]:
    """Authenticate user by email and password"""
    try:
        user = get_user_by_email(email)
        if user and user.get('password') == password:
            return user
        return None
    except Exception as e:
        print(f"Error authenticating user: {e}")
        return None


def get_featured_products(limit: int = 10) -> List[Dict]:
    """Get random featured products with seller info"""
    max_retries = 3
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            products = []
            # Use stream with timeout to prevent hanging
            query = db.collection(COLLECTIONS['products']).limit(limit)
            
            for doc in query.stream(timeout=10.0):  # 10 second timeout
                product_data = doc.to_dict()
                product_data['id'] = doc.id
                
                # Calculate total stock from variants
                total_stock = 0
                if 'variants' in product_data and isinstance(product_data['variants'], list) and len(product_data['variants']) > 0:
                    # Sum up stock from all variants
                    for variant in product_data['variants']:
                        variant_stock = variant.get('stock', 0) or variant.get('quantity', 0)
                        try:
                            total_stock += int(variant_stock)
                        except (ValueError, TypeError):
                            pass
                else:
                    # No variants, use product-level stock
                    total_stock = product_data.get('stock', 0) or product_data.get('quantity', 0)
                    try:
                        total_stock = int(total_stock)
                    except (ValueError, TypeError):
                        total_stock = 0
                
                # Set the calculated total stock as 'quantity' for template compatibility
                product_data['quantity'] = total_stock
                
                # Add seller info
                if product_data.get('seller_email'):
                    try:
                        seller = get_user_by_email(product_data['seller_email'])
                        if seller:
                            product_data['first_name'] = seller.get('first_name')
                            product_data['last_name'] = seller.get('last_name')
                    except Exception as seller_err:
                        print(f"Error fetching seller info: {seller_err}")
                        # Continue without seller info
                
                products.append(product_data)
            return products[:limit]
            
        except Exception as e:
            print(f"Error fetching featured products (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                print("Max retries reached, returning empty list")
                return []
    
    return []


def get_new_arrivals(limit: int = 10, days: int = 30) -> List[Dict]:
    """Get recent products with seller info"""
    max_retries = 3
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            from datetime import timedelta
            
            cutoff_date = datetime.now() - timedelta(days=days)
            products = []
            
            query = db.collection(COLLECTIONS['products']).where("created_at", ">=", cutoff_date).order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
            
            for doc in query.stream(timeout=10.0):  # Add timeout
                product_data = doc.to_dict()
                product_data['id'] = doc.id
                
                # Calculate total stock from variants
                total_stock = 0
                if 'variants' in product_data and isinstance(product_data['variants'], list) and len(product_data['variants']) > 0:
                    # Sum up stock from all variants
                    for variant in product_data['variants']:
                        variant_stock = variant.get('stock', 0) or variant.get('quantity', 0)
                        try:
                            total_stock += int(variant_stock)
                        except (ValueError, TypeError):
                            pass
                else:
                    # No variants, use product-level stock
                    total_stock = product_data.get('stock', 0) or product_data.get('quantity', 0)
                    try:
                        total_stock = int(total_stock)
                    except (ValueError, TypeError):
                        total_stock = 0
                
                # Set the calculated total stock as 'quantity' for template compatibility
                product_data['quantity'] = total_stock
                
                # Add seller info
                if product_data.get('seller_email'):
                    try:
                        seller = get_user_by_email(product_data['seller_email'])
                        if seller:
                            product_data['first_name'] = seller.get('first_name')
                            product_data['last_name'] = seller.get('last_name')
                    except Exception as seller_err:
                        print(f"Error fetching seller info: {seller_err}")
                        # Continue without seller info
                
                products.append(product_data)
            return products
            
        except Exception as e:
            print(f"Error fetching new arrivals (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                print("Max retries reached, returning empty list")
                return []
    
    return []


def check_user_exists(email: str) -> bool:
    """Check if user email already exists"""
    user = get_user_by_email(email)
    return user is not None


def create_user_from_request(request_data: Dict) -> str:
    """Create user from request data"""
    try:
        user_data = {
            'first_name': request_data.get('first_name', ''),
            'last_name': request_data.get('last_name', ''),
            'email': request_data.get('email', ''),
            'password': request_data.get('password', ''),
            'phone_number': request_data.get('phone_number', ''),
            'address': request_data.get('address', ''),
            'user_type': request_data.get('user_type', 'Buyer'),
            'status': 'active',
            'created_at': datetime.now()
        }
        return create_user(user_data)
    except Exception as e:
        print(f"Error creating user from request: {e}")
        raise


def get_all_pending_requests(request_type: str = 'seller') -> List[Dict]:
    """Get all pending requests by type (seller, rider, buyer)"""
    try:
        collection_map = {
            'seller': COLLECTIONS['seller_requests'],
            'rider': COLLECTIONS['rider_requests'],
            'buyer': COLLECTIONS['buyer_requests']
        }
        
        requests = []
        query = db.collection(collection_map.get(request_type, COLLECTIONS['seller_requests'])).where("status", "==", "Pending")
        for doc in query.stream():
            req_data = doc.to_dict()
            req_data['id'] = doc.id
            requests.append(req_data)
        return requests
    except Exception as e:
        print(f"Error fetching pending requests: {e}")
        return []


def approve_request(request_id: str, request_type: str = 'seller') -> bool:
    """Approve a seller/rider/buyer request and create user account"""
    try:
        collection_map = {
            'seller': COLLECTIONS['seller_requests'],
            'rider': COLLECTIONS['rider_requests'],
            'buyer': COLLECTIONS['buyer_requests']
        }
        
        collection_name = collection_map.get(request_type, COLLECTIONS['seller_requests'])
        doc = db.collection(collection_name).document(request_id).get()
        
        if not doc.exists:
            return False
        
        request_data = doc.to_dict()
        
        # Create user from request
        user_data = {
            'first_name': request_data.get('first_name', ''),
            'last_name': request_data.get('last_name', ''),
            'email': request_data.get('email', ''),
            'phone_number': request_data.get('phone_number', ''),
            'address': request_data.get('address', ''),
            'password': request_data.get('password', ''),
            'user_type': request_type.capitalize(),
            'document_id': request_data.get('document_id'),
            'bir': request_data.get('bir') if request_type == 'seller' else None,
            'status': 'active',
            'created_at': datetime.now()
        }
        
        # Create the user
        create_user(user_data)
        
        # Delete the request
        db.collection(collection_name).document(request_id).delete()
        
        return True
    except Exception as e:
        print(f"Error approving request: {e}")
        return False


def reject_request(request_id: str, request_type: str = 'seller') -> bool:
    """Reject/delete a seller/rider/buyer request"""
    try:
        collection_map = {
            'seller': COLLECTIONS['seller_requests'],
            'rider': COLLECTIONS['rider_requests'],
            'buyer': COLLECTIONS['buyer_requests']
        }
        
        collection_name = collection_map.get(request_type, COLLECTIONS['seller_requests'])
        db.collection(collection_name).document(request_id).delete()
        return True
    except Exception as e:
        print(f"Error rejecting request: {e}")
        return False


def get_request_by_id(request_id: str, request_type: str = 'seller') -> Optional[Dict]:
    """Get a specific request by ID"""
    try:
        collection_map = {
            'seller': COLLECTIONS['seller_requests'],
            'rider': COLLECTIONS['rider_requests'],
            'buyer': COLLECTIONS['buyer_requests']
        }
        
        collection_name = collection_map.get(request_type, COLLECTIONS['seller_requests'])
        doc = db.collection(collection_name).document(request_id).get()
        
        if doc.exists:
            req_data = doc.to_dict()
            req_data['id'] = doc.id
            return req_data
        return None
    except Exception as e:
        print(f"Error fetching request: {e}")
        return None


def get_products_count() -> int:
    """Get total product count"""
    try:
        products = db.collection(COLLECTIONS['products']).stream()
        return len(list(products))
    except Exception as e:
        print(f"Error counting products: {e}")
        return 0


def delete_product(product_id: str) -> bool:
    """Delete product and its variants"""
    try:
        # Delete product
        db.collection(COLLECTIONS['products']).document(product_id).delete()
        
        # Delete product variants
        variants = get_product_variants(product_id)
        for variant in variants:
            db.collection(COLLECTIONS['product_variants']).document(variant['id']).delete()
        
        return True
    except Exception as e:
        print(f"Error deleting product: {e}")
        return False


def search_all_products(search_term: str = "", category: str = "", seller_email: str = "") -> List[Dict]:
    """Search products with filters"""
    try:
        products = []
        query = db.collection(COLLECTIONS['products'])
        
        if category:
            query = query.where("category", "==", category)
        
        if seller_email:
            query = query.where("seller_email", "==", seller_email)
        
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            
            # Apply search_term filter (case-insensitive)
            if search_term and search_term.lower() not in product_data.get('name', '').lower():
                continue
            
            products.append(product_data)
        
        return products
    except Exception as e:
        print(f"Error searching products: {e}")
        return []


def get_all_users(user_type: str = None, status: str = None) -> List[Dict]:
    """Get all users with optional filters"""
    try:
        users = []
        query = db.collection(COLLECTIONS['users'])
        
        if user_type:
            query = query.where("user_type", "==", user_type)
        
        if status:
            query = query.where("status", "==", status)
        
        for doc in query.stream():
            user_data = doc.to_dict()
            user_data['id'] = doc.id
            users.append(user_data)
        
        return users
    except Exception as e:
        print(f"Error fetching all users: {e}")
        return []


def ban_user(user_id: str, reason: str = "") -> bool:
    """Ban a user account"""
    try:
        # First verify the document exists
        doc = db.collection(COLLECTIONS['users']).document(user_id).get()
        if not doc.exists:
            print(f"Error banning user: Document not found for ID {user_id}")
            return False
        
        result = update_user_by_id(user_id, {
            'status': 'banned',
            'ban_reason': reason
        })
        if result:
            print(f"Successfully banned user {user_id} with reason: {reason}")
        return result
    except Exception as e:
        print(f"Error banning user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return False


def unban_user(user_id: str) -> bool:
    """Unban a user account"""
    try:
        # First verify the document exists
        doc = db.collection(COLLECTIONS['users']).document(user_id).get()
        if not doc.exists:
            print(f"Error unbanning user: Document not found for ID {user_id}")
            return False
        
        result = update_user_by_id(user_id, {
            'status': 'active',
            'ban_reason': None
        })
        if result:
            print(f"Successfully unbanned user {user_id}")
        return result
    except Exception as e:
        print(f"Error unbanning user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return False



# =============================
# Generic Helper Functions
# =============================

def add_document(collection_name: str, data: Dict) -> str:
    """Generic function to add document to any collection, returns document ID"""
    try:
        if 'created_at' not in data:
            data['created_at'] = datetime.now()
        
        doc_ref = db.collection(collection_name).document()
        doc_ref.set(data)
        return doc_ref.id
    except Exception as e:
        print(f"Error adding document to {collection_name}: {e}")
        raise


# =============================
# REVIEW & COMMENT SYSTEM FUNCTIONS
# =============================

def create_product_review(review_data: Dict) -> str:
    """Create a new product review"""
    review_data['created_at'] = firestore.SERVER_TIMESTAMP
    review_data['updated_at'] = firestore.SERVER_TIMESTAMP
    review_data['status'] = review_data.get('status', 'active')
    review_data['helpful_count'] = 0
    review_data['verified_purchase'] = review_data.get('verified_purchase', False)
    
    doc_ref = db.collection('product_reviews').document()
    doc_ref.set(review_data)
    return doc_ref.id

def get_product_reviews(product_id: str, status: str = 'active') -> List[Dict]:
    """Get all reviews for a product"""
    query = db.collection('product_reviews')\
        .where('product_id', '==', product_id)\
        .where('status', '==', status)\
        .order_by('created_at', direction=firestore.Query.DESCENDING)
    
    reviews = []
    for doc in query.stream():
        review = doc.to_dict()
        review['id'] = doc.id
        reviews.append(review)
    return reviews

def update_product_review(review_id: str, update_data: Dict) -> bool:
    """Update a product review"""
    try:
        update_data['updated_at'] = firestore.SERVER_TIMESTAMP
        db.collection('product_reviews').document(review_id).update(update_data)
        return True
    except Exception as e:
        print(f"Error updating review: {e}")
        return False

def delete_product_review(review_id: str) -> bool:
    """Delete a product review"""
    try:
        db.collection('product_reviews').document(review_id).delete()
        return True
    except Exception as e:
        print(f"Error deleting review: {e}")
        return False

def create_seller_review(review_data: Dict) -> str:
    """Create a new seller review"""
    review_data['created_at'] = firestore.SERVER_TIMESTAMP
    review_data['status'] = review_data.get('status', 'active')
    
    doc_ref = db.collection('seller_reviews').document()
    doc_ref.set(review_data)
    return doc_ref.id

def get_seller_reviews(seller_email: str, status: str = 'active') -> List[Dict]:
    """Get all reviews for a seller"""
    query = db.collection('seller_reviews')\
        .where('seller_email', '==', seller_email)\
        .where('status', '==', status)\
        .order_by('created_at', direction=firestore.Query.DESCENDING)
    
    reviews = []
    for doc in query.stream():
        review = doc.to_dict()
        review['id'] = doc.id
        reviews.append(review)
    return reviews

def create_review_reply(reply_data: Dict) -> str:
    """Create a reply to a review"""
    reply_data['created_at'] = firestore.SERVER_TIMESTAMP
    
    doc_ref = db.collection('review_replies').document()
    doc_ref.set(reply_data)
    return doc_ref.id

def get_review_replies(review_id: str) -> List[Dict]:
    """Get all replies for a review"""
    query = db.collection('review_replies')\
        .where('review_id', '==', review_id)\
        .order_by('created_at', direction=firestore.Query.ASCENDING)
    
    replies = []
    for doc in query.stream():
        reply = doc.to_dict()
        reply['id'] = doc.id
        replies.append(reply)
    return replies

def vote_review_helpful(review_id: str, voter_email: str, vote_type: str = 'helpful') -> bool:
    """Vote a review as helpful or not helpful"""
    try:
        # Check if user already voted
        existing_vote = db.collection('review_votes')\
            .where('review_id', '==', review_id)\
            .where('voter_email', '==', voter_email)\
            .limit(1).stream()
        
        existing_vote_doc = None
        for doc in existing_vote:
            existing_vote_doc = doc
            break
        
        if existing_vote_doc:
            # Update existing vote
            db.collection('review_votes').document(existing_vote_doc.id).update({
                'vote_type': vote_type,
                'created_at': firestore.SERVER_TIMESTAMP
            })
        else:
            # Create new vote
            vote_data = {
                'review_id': review_id,
                'voter_email': voter_email,
                'vote_type': vote_type,
                'created_at': firestore.SERVER_TIMESTAMP
            }
            db.collection('review_votes').document().set(vote_data)
        
        # Update helpful count on review
        helpful_count = db.collection('review_votes')\
            .where('review_id', '==', review_id)\
            .where('vote_type', '==', 'helpful')\
            .stream()
        
        count = sum(1 for _ in helpful_count)
        db.collection('product_reviews').document(review_id).update({'helpful_count': count})
        
        return True
    except Exception as e:
        print(f"Error voting review: {e}")
        return False

def create_product_comment(comment_data: Dict) -> str:
    """Create a new product comment/question"""
    comment_data['created_at'] = firestore.SERVER_TIMESTAMP
    comment_data['updated_at'] = firestore.SERVER_TIMESTAMP
    comment_data['status'] = comment_data.get('status', 'active')
    comment_data['helpful_count'] = 0
    comment_data['is_question'] = comment_data.get('is_question', False)
    comment_data['parent_comment_id'] = comment_data.get('parent_comment_id', None)
    
    doc_ref = db.collection('product_comments').document()
    doc_ref.set(comment_data)
    return doc_ref.id

def get_product_comments(product_id: str, is_question: Optional[bool] = None, status: str = 'active') -> List[Dict]:
    """Get all comments/questions for a product"""
    query = db.collection('product_comments')\
        .where('product_id', '==', product_id)\
        .where('status', '==', status)
    
    if is_question is not None:
        query = query.where('is_question', '==', is_question)
    
    query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
    
    comments = []
    for doc in query.stream():
        comment = doc.to_dict()
        comment['id'] = doc.id
        comments.append(comment)
    return comments

def create_comment_reply(reply_data: Dict) -> str:
    """Create a reply to a comment"""
    reply_data['created_at'] = firestore.SERVER_TIMESTAMP
    reply_data['status'] = reply_data.get('status', 'active')
    reply_data['is_seller_answer'] = reply_data.get('is_seller_answer', False)
    
    doc_ref = db.collection('comment_replies').document()
    doc_ref.set(reply_data)
    return doc_ref.id

def get_comment_replies(comment_id: str, status: str = 'active') -> List[Dict]:
    """Get all replies for a comment"""
    query = db.collection('comment_replies')\
        .where('comment_id', '==', comment_id)\
        .where('status', '==', status)\
        .order_by('created_at', direction=firestore.Query.ASCENDING)
    
    replies = []
    for doc in query.stream():
        reply = doc.to_dict()
        reply['id'] = doc.id
        replies.append(reply)
    return replies

def update_product_rating(product_id: str) -> bool:
    """Recalculate and update product average rating"""
    try:
        reviews = get_product_reviews(product_id)
        
        if not reviews:
            db.collection('products').document(product_id).update({
                'average_rating': 0.0,
                'total_reviews': 0,
                'rating_distribution': {'5': 0, '4': 0, '3': 0, '2': 0, '1': 0}
            })
            return True
        
        total_rating = sum(review.get('rating', 0) for review in reviews)
        average_rating = total_rating / len(reviews)
        
        # Calculate rating distribution
        distribution = {'5': 0, '4': 0, '3': 0, '2': 0, '1': 0}
        for review in reviews:
            rating = str(review.get('rating', 0))
            if rating in distribution:
                distribution[rating] += 1
        
        db.collection('products').document(product_id).update({
            'average_rating': round(average_rating, 1),
            'total_reviews': len(reviews),
            'rating_distribution': distribution
        })
        
        return True
    except Exception as e:
        print(f"Error updating product rating: {e}")
        return False

def update_seller_rating(seller_email: str) -> bool:
    """Recalculate and update seller average rating"""
    try:
        reviews = get_seller_reviews(seller_email)
        
        if not reviews:
            db.collection('users').document(seller_email).update({
                'seller_rating': 0.0,
                'total_seller_reviews': 0,
                'seller_rating_distribution': {'5': 0, '4': 0, '3': 0, '2': 0, '1': 0}
            })
            return True
        
        total_rating = sum(review.get('rating', 0) for review in reviews)
        average_rating = total_rating / len(reviews)
        
        # Calculate rating distribution
        distribution = {'5': 0, '4': 0, '3': 0, '2': 0, '1': 0}
        for review in reviews:
            rating = str(review.get('rating', 0))
            if rating in distribution:
                distribution[rating] += 1
        
        db.collection('users').document(seller_email).update({
            'seller_rating': round(average_rating, 1),
            'total_seller_reviews': len(reviews),
            'seller_rating_distribution': distribution
        })
        
        return True
    except Exception as e:
        print(f"Error updating seller rating: {e}")
        return False

def check_user_purchased_product(user_email: str, product_id: str) -> bool:
    """Check if user has purchased a product (for verified purchase badge)"""
    try:
        orders = db.collection('orders')\
            .where('email', '==', user_email)\
            .where('status', '==', 'Delivered')\
            .stream()
        
        for order in orders:
            order_data = order.to_dict()
            items = order_data.get('items', [])
            for item in items:
                if item.get('product_id') == product_id:
                    return True
        
        return False
    except Exception as e:
        print(f"Error checking purchase: {e}")
        return False

def get_user_review_for_product(user_email: str, product_id: str) -> Optional[Dict]:
    """Check if user already reviewed a product"""
    try:
        query = db.collection('product_reviews')\
            .where('buyer_email', '==', user_email)\
            .where('product_id', '==', product_id)\
            .limit(1).stream()
        
        for doc in query:
            review = doc.to_dict()
            review['id'] = doc.id
            return review
        
        return None
    except Exception as e:
        print(f"Error getting user review: {e}")
        return None
