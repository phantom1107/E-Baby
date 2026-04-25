"""
Firestore Database Helper Module
Replaces MySQL operations with Firestore/Firebase equivalents
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from typing import Dict, List, Optional, Any
import os

print("\n" + "="*70)
print("[FIRESTORE_DB] Module loading...")
print("="*70)

# Initialize Firebase (only once)
try:
    print("[FIRESTORE_DB] Checking for existing Firebase app...")
    firebase_admin.get_app()
    print("[FIRESTORE_DB] ✓ Firebase app already initialized")
except ValueError:
    try:
        print("[FIRESTORE_DB] No existing app, initializing Firebase...")
        config_path = "firebase-config.json"
        print(f"[FIRESTORE_DB] Looking for config at: {os.path.abspath(config_path)}")
        
        if not os.path.exists(config_path):
            print(f"[FIRESTORE_DB] ERROR: {config_path} not found!")
            raise FileNotFoundError(f"Firebase config not found at {config_path}")
        
        print(f"[FIRESTORE_DB] Config file found, initializing...")
        cred = credentials.Certificate(config_path)
        firebase_admin.initialize_app(cred)
        print("[FIRESTORE_DB] ✓ Firebase initialized successfully")
    except Exception as init_error:
        print(f"[FIRESTORE_DB] CRITICAL ERROR during initialization: {init_error}")
        import traceback
        traceback.print_exc()
        print("[FIRESTORE_DB] FATAL: Cannot continue without Firebase")
        raise

try:
    print("[FIRESTORE_DB] Getting Firestore client...")
    db = firestore.client()
    print("[FIRESTORE_DB] ✓ Firestore client obtained")
except Exception as db_error:
    print(f"[FIRESTORE_DB] ERROR getting Firestore client: {db_error}")
    raise

print("[FIRESTORE_DB] Module initialization complete!")
print("="*70 + "\n")

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
    """Get products by category with seller info and total stock"""
    try:
        products = []
        product_ids = []
        query = db.collection(COLLECTIONS['products']).where("category", "==", category)
        
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            products.append(product_data)
            product_ids.append(doc.id)
        
        # BATCH fetch all variants at once (instead of one-by-one)
        if product_ids:
            variants_map = get_variants_for_multiple_products(product_ids)
            
            # Calculate stock from variants
            for product in products:
                product_id = product['id']
                variants = variants_map.get(product_id, [])
                if variants:
                    total_stock = sum(v.get('stock', 0) for v in variants)
                    product['quantity'] = total_stock
                    product['stock'] = total_stock
                else:
                    # Use product's own stock field
                    product['quantity'] = product.get('quantity', product.get('stock', 0))
                    product['stock'] = product['quantity']
        
        # Batch fetch seller info
        seller_emails = list(set([p.get('seller_email') for p in products if p.get('seller_email')]))
        sellers_map = {}
        
        if seller_emails:
            for i in range(0, len(seller_emails), 10):
                batch_emails = seller_emails[i:i+10]
                sellers_query = db.collection(COLLECTIONS['users']).where('email', 'in', batch_emails).stream()
                for seller_doc in sellers_query:
                    seller_data = seller_doc.to_dict()
                    sellers_map[seller_data['email']] = seller_data
        
        # Add seller info to products
        for product in products:
            if product.get('seller_email') and product['seller_email'] in sellers_map:
                seller = sellers_map[product['seller_email']]
                product['first_name'] = seller.get('first_name')
                product['last_name'] = seller.get('last_name')
        
        return products
    except Exception as e:
        print(f"Error fetching products by category: {e}")
        return []


def get_all_products() -> List[Dict]:
    """Get all products with seller info"""
    try:
        products = []
        query = db.collection(COLLECTIONS['products'])
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            products.append(product_data)
        
        # Batch fetch seller info
        seller_emails = list(set([p.get('seller_email') for p in products if p.get('seller_email')]))
        sellers_map = {}
        
        if seller_emails:
            for i in range(0, len(seller_emails), 10):
                batch_emails = seller_emails[i:i+10]
                sellers_query = db.collection(COLLECTIONS['users']).where('email', 'in', batch_emails).stream()
                for seller_doc in sellers_query:
                    seller_data = seller_doc.to_dict()
                    sellers_map[seller_data['email']] = seller_data
        
        # Add seller info to products
        for product in products:
            if product.get('seller_email') and product['seller_email'] in sellers_map:
                seller = sellers_map[product['seller_email']]
                product['first_name'] = seller.get('first_name')
                product['last_name'] = seller.get('last_name')
        
        return products
    except Exception as e:
        print(f"Error fetching all products: {e}")
        return []


def search_products(search_term: str) -> List[Dict]:
    """Search products by name (client-side filter) with seller info"""
    try:
        products = []
        for doc in db.collection(COLLECTIONS['products']).stream():
            product_data = doc.to_dict()
            if search_term.lower() in product_data.get('name', '').lower():
                product_data['id'] = doc.id
                products.append(product_data)
        
        # Batch fetch seller info
        seller_emails = list(set([p.get('seller_email') for p in products if p.get('seller_email')]))
        sellers_map = {}
        
        if seller_emails:
            for i in range(0, len(seller_emails), 10):
                batch_emails = seller_emails[i:i+10]
                sellers_query = db.collection(COLLECTIONS['users']).where('email', 'in', batch_emails).stream()
                for seller_doc in sellers_query:
                    seller_data = seller_doc.to_dict()
                    sellers_map[seller_data['email']] = seller_data
        
        # Add seller info to products
        for product in products:
            if product.get('seller_email') and product['seller_email'] in sellers_map:
                seller = sellers_map[product['seller_email']]
                product['first_name'] = seller.get('first_name')
                product['last_name'] = seller.get('last_name')
        
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
        # Fetch without ordering first (to avoid index requirement), then sort client-side
        query = db.collection(COLLECTIONS['orders']).where("email", "==", email)
        for doc in query.stream():
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            orders.append(order_data)
        
        # Sort by date client-side (descending - newest first)
        def get_order_date(order):
            date_val = order.get('date') or order.get('created_at')
            if date_val:
                return date_val
            return datetime.min
        
        orders.sort(key=get_order_date, reverse=True)
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
        # Fetch without ordering first (to avoid index requirement), then sort client-side
        query = db.collection(COLLECTIONS['orders']).where("seller_email", "==", seller_email)
        for doc in query.stream():
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            orders.append(order_data)
        
        print(f"[get_orders_by_seller] Found {len(orders)} orders for seller: {seller_email}")
        
        # Sort by date client-side (descending - newest first)
        # Handle both 'date' and 'created_at' fields
        def get_order_date(order):
            date_val = order.get('date') or order.get('created_at')
            if date_val:
                return date_val
            return datetime.min
        
        orders.sort(key=get_order_date, reverse=True)
        return orders
    except Exception as e:
        print(f"Error fetching seller orders: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_orders_by_rider(rider_email: str) -> List[Dict]:
    """Get all orders for a rider"""
    try:
        orders = []
        # Fetch without ordering first (to avoid index requirement), then sort client-side
        query = db.collection(COLLECTIONS['orders']).where("rider_email", "==", rider_email)
        for doc in query.stream():
            order_data = doc.to_dict()
            order_data['id'] = doc.id
            orders.append(order_data)
        
        # Sort by date client-side (descending - newest first)
        def get_order_date(order):
            date_val = order.get('date') or order.get('created_at')
            if date_val:
                return date_val
            return datetime.min
        
        orders.sort(key=get_order_date, reverse=True)
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


def get_variants_for_multiple_products(product_ids: List[str]) -> Dict[str, List[Dict]]:
    """Fetch variants for multiple products at once (batch operation, much faster)"""
    try:
        variants_map = {pid: [] for pid in product_ids}
        
        # Firestore 'in' operator allows up to 10 items, so batch them
        for i in range(0, len(product_ids), 10):
            batch_ids = product_ids[i:i+10]
            query = db.collection(COLLECTIONS['product_variants']).where("product_id", "in", batch_ids)
            for doc in query.stream():
                variant_data = doc.to_dict()
                variant_data['id'] = doc.id
                product_id = variant_data.get('product_id')
                if product_id in variants_map:
                    variants_map[product_id].append(variant_data)
        
        return variants_map
    except Exception as e:
        print(f"Error fetching variants for multiple products: {e}")
        return {pid: [] for pid in product_ids}


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
        query = db.collection(COLLECTIONS['rider_earnings']).where("rider_email", "==", rider_email)
        for doc in query.stream():
            earn_data = doc.to_dict()
            earn_data['id'] = doc.id
            earnings.append(earn_data)
        # Sort client-side instead of server-side to avoid index requirement
        earnings.sort(key=lambda x: x.get('date') or '', reverse=True)
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


def get_all_homepage_products(limit: int = 50) -> List[Dict]:
    """
    Fetch products with seller info - SIMPLIFIED AND FAST
    Uses minimal queries and timeout handling
    """
    try:
        print(f"[get_all_homepage_products] Starting with limit={limit}")
        products = []
        
        # STEP 1: Fetch only product data (NO variants, NO sellers first)
        print("[1] Fetching products...")
        query = db.collection(COLLECTIONS['products']).limit(limit)
        for doc in query.stream(timeout=10):  # 10 second timeout
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            # Set default values to avoid missing data
            product_data['quantity'] = product_data.get('quantity', 0)
            product_data['stock'] = product_data.get('stock', 0)
            product_data['first_name'] = 'Unknown'
            product_data['last_name'] = 'Seller'
            products.append(product_data)
        
        print(f"[2] Got {len(products)} products")
        
        if not products:
            print("[get_all_homepage_products] No products found")
            return []
        
        # STEP 2: Fetch ONLY seller info (SKIP variants for now - too slow)
        print("[3] Fetching seller info...")
        seller_emails = list(set([p.get('seller_email') for p in products if p.get('seller_email')]))
        print(f"[4] Found {len(seller_emails)} unique sellers")
        
        if seller_emails:
            try:
                # Fetch sellers in batches with timeout
                sellers_map = {}
                for i in range(0, len(seller_emails), 10):
                    batch_emails = seller_emails[i:i+10]
                    sellers_query = db.collection(COLLECTIONS['users']).where('email', 'in', batch_emails)
                    for seller_doc in sellers_query.stream(timeout=10):
                        seller_data = seller_doc.to_dict()
                        sellers_map[seller_data.get('email')] = seller_data
                
                print(f"[5] Fetched {len(sellers_map)} seller details")
                
                # Add seller info to products
                for product in products:
                    seller_email = product.get('seller_email')
                    if seller_email and seller_email in sellers_map:
                        seller = sellers_map[seller_email]
                        product['first_name'] = seller.get('first_name', 'Unknown')
                        product['last_name'] = seller.get('last_name', 'Seller')
            except Exception as seller_error:
                print(f"[WARNING] Error fetching sellers (continuing without): {seller_error}")
                # Continue anyway - products still display with default seller names
        
        print(f"[get_all_homepage_products] Returning {len(products)} products")
        return products
        
    except Exception as e:
        print(f"[get_all_homepage_products] CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_featured_products(limit: int = 10) -> List[Dict]:
    """Get featured products with seller info (or random products if no featured flag)"""
    try:
        print(f"[get_featured_products] Starting, limit={limit}")
        products = []
        
        # SIMPLIFIED: Just get any products directly (skip featured check to avoid hanging)
        print("[get_featured_products] Fetching products directly...")
        query = db.collection(COLLECTIONS['products']).limit(limit)
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            products.append(product_data)
        
        print(f"[get_featured_products] Found {len(products)} products")
        
        # If no products, return empty list immediately
        if len(products) == 0:
            print("[get_featured_products] No products in database, returning empty list")
            return []
        
        # Batch fetch seller info for all products at once
        print("[get_featured_products] Batch fetching seller info...")
        seller_emails = list(set([p.get('seller_email') for p in products if p.get('seller_email')]))
        sellers_map = {}
        
        if seller_emails:
            # Fetch all sellers in one query (Firestore allows 'in' with up to 10 values)
            for i in range(0, len(seller_emails), 10):
                batch_emails = seller_emails[i:i+10]
                sellers_query = db.collection(COLLECTIONS['users']).where('email', 'in', batch_emails).stream()
                for seller_doc in sellers_query:
                    seller_data = seller_doc.to_dict()
                    sellers_map[seller_data['email']] = seller_data
        
        # Add seller info to products
        for product in products:
            if product.get('seller_email') and product['seller_email'] in sellers_map:
                seller = sellers_map[product['seller_email']]
                product['first_name'] = seller.get('first_name')
                product['last_name'] = seller.get('last_name')
        
        print(f"[get_featured_products] Returning {len(products[:limit])} products")
        return products[:limit]
    except Exception as e:
        print(f"[get_featured_products] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_popular_products(limit: int = 12) -> List[Dict]:
    """Get popular products sorted by sales with seller info"""
    try:
        print(f"[get_popular_products] Starting to fetch products, limit={limit}")
        products = []
        
        # Get all products
        query = db.collection(COLLECTIONS['products'])
        product_ids = []
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            products.append(product_data)
            product_ids.append(doc.id)
        
        print(f"[get_popular_products] Total products found: {len(products)}")
        
        # BATCH fetch all variants at once (instead of one-by-one)
        if product_ids:
            variants_map = get_variants_for_multiple_products(product_ids)
            
            # Calculate stock from variants
            for product in products:
                product_id = product['id']
                variants = variants_map.get(product_id, [])
                if variants:
                    total_stock = sum(v.get('stock', 0) for v in variants)
                    product['quantity'] = total_stock
                    product['stock'] = total_stock
                else:
                    # Use product's own stock field
                    product['quantity'] = product.get('quantity', product.get('stock', 0))
                    product['stock'] = product['quantity']
        
        # Sort by sales (highest first), then by name
        products.sort(key=lambda x: (x.get('sales', 0), x.get('name', '')), reverse=True)
        
        # Take only the top products we need
        products = products[:limit]
        
        # Batch fetch seller info for all products at once
        seller_emails = list(set([p.get('seller_email') for p in products if p.get('seller_email')]))
        sellers_map = {}
        
        if seller_emails:
            # Fetch all sellers in one query (Firestore allows 'in' with up to 10 values)
            for i in range(0, len(seller_emails), 10):
                batch_emails = seller_emails[i:i+10]
                sellers_query = db.collection(COLLECTIONS['users']).where('email', 'in', batch_emails).stream()
                for seller_doc in sellers_query:
                    seller_data = seller_doc.to_dict()
                    sellers_map[seller_data['email']] = seller_data
        
        # Add seller info to products
        for product in products:
            if product.get('seller_email') and product['seller_email'] in sellers_map:
                seller = sellers_map[product['seller_email']]
                product['first_name'] = seller.get('first_name')
                product['last_name'] = seller.get('last_name')
        
        print(f"[get_popular_products] Returning {len(products)} products")
        return products
    except Exception as e:
        print(f"Error fetching popular products: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_all_products_with_seller(limit: int = 50) -> List[Dict]:
    """Get all products with seller info and total stock"""
    try:
        print(f"[get_all_products_with_seller] Starting to fetch products, limit={limit}")
        products = []
        product_ids = []
        
        # Get all products
        query = db.collection(COLLECTIONS['products']).limit(limit)
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            products.append(product_data)
            product_ids.append(doc.id)
        
        print(f"[get_all_products_with_seller] Total products found: {len(products)}")
        
        # BATCH fetch all variants at once (instead of one-by-one)
        if product_ids:
            variants_map = get_variants_for_multiple_products(product_ids)
            
            # Calculate stock from variants
            for product in products:
                product_id = product['id']
                variants = variants_map.get(product_id, [])
                if variants:
                    total_stock = sum(v.get('stock', 0) for v in variants)
                    product['quantity'] = total_stock
                    product['stock'] = total_stock
                else:
                    # Use product's own stock field
                    product['quantity'] = product.get('quantity', product.get('stock', 0))
                    product['stock'] = product['quantity']
        
        # Batch fetch seller info
        seller_emails = list(set([p.get('seller_email') for p in products if p.get('seller_email')]))
        sellers_map = {}
        
        if seller_emails:
            for i in range(0, len(seller_emails), 10):
                batch_emails = seller_emails[i:i+10]
                sellers_query = db.collection(COLLECTIONS['users']).where('email', 'in', batch_emails).stream()
                for seller_doc in sellers_query:
                    seller_data = seller_doc.to_dict()
                    sellers_map[seller_data['email']] = seller_data
        
        # Add seller info to products
        for product in products:
            if product.get('seller_email') and product['seller_email'] in sellers_map:
                seller = sellers_map[product['seller_email']]
                product['first_name'] = seller.get('first_name')
                product['last_name'] = seller.get('last_name')
        
        print(f"[get_all_products_with_seller] Returning {len(products)} products")
        return products
    except Exception as e:
        print(f"Error fetching all products with seller: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_new_arrivals(limit: int = 10, days: int = 30) -> List[Dict]:
    """Get recent products with seller info (or any products if no recent ones)"""
    try:
        print(f"[get_new_arrivals] Starting, limit={limit}")
        products = []
        
        # SIMPLIFIED: Just get any products directly (skip date filtering to avoid hanging)
        print("[get_new_arrivals] Fetching products directly...")
        query = db.collection(COLLECTIONS['products']).limit(limit)
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            products.append(product_data)
        
        print(f"[get_new_arrivals] Found {len(products)} products")
        
        # If no products, return empty list immediately
        if len(products) == 0:
            print("[get_new_arrivals] No products in database, returning empty list")
            return []
        
        # Batch fetch seller info for all products at once
        print("[get_new_arrivals] Batch fetching seller info...")
        seller_emails = list(set([p.get('seller_email') for p in products if p.get('seller_email')]))
        sellers_map = {}
        
        if seller_emails:
            # Fetch all sellers in one query (Firestore allows 'in' with up to 10 values)
            for i in range(0, len(seller_emails), 10):
                batch_emails = seller_emails[i:i+10]
                sellers_query = db.collection(COLLECTIONS['users']).where('email', 'in', batch_emails).stream()
                for seller_doc in sellers_query:
                    seller_data = seller_doc.to_dict()
                    sellers_map[seller_data['email']] = seller_data
        
        # Add seller info to products
        for product in products:
            if product.get('seller_email') and product['seller_email'] in sellers_map:
                seller = sellers_map[product['seller_email']]
                product['first_name'] = seller.get('first_name')
                product['last_name'] = seller.get('last_name')
        
        print(f"[get_new_arrivals] Returning {len(products[:limit])} products")
        return products[:limit]
    except Exception as e:
        print(f"[get_new_arrivals] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return []
        return products
    except Exception as e:
        print(f"Error fetching new arrivals: {e}")
        import traceback
        traceback.print_exc()
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


def check_pending_request_by_email(email: str) -> Optional[Dict]:
    """Check if email has a pending request in any collection (optimized for login)"""
    try:
        # Check seller requests
        seller_query = db.collection(COLLECTIONS['seller_requests']).where("email", "==", email).where("status", "==", "Pending").limit(1)
        for doc in seller_query.stream():
            req_data = doc.to_dict()
            req_data['id'] = doc.id
            req_data['request_type'] = 'seller'
            return req_data
        
        # Check rider requests
        rider_query = db.collection(COLLECTIONS['rider_requests']).where("email", "==", email).where("status", "==", "Pending").limit(1)
        for doc in rider_query.stream():
            req_data = doc.to_dict()
            req_data['id'] = doc.id
            req_data['request_type'] = 'rider'
            return req_data
        
        # Check buyer requests
        buyer_query = db.collection(COLLECTIONS['buyer_requests']).where("email", "==", email).where("status", "==", "Pending").limit(1)
        for doc in buyer_query.stream():
            req_data = doc.to_dict()
            req_data['id'] = doc.id
            req_data['request_type'] = 'buyer'
            return req_data
        
        return None
    except Exception as e:
        print(f"Error checking pending request: {e}")
        return None


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

