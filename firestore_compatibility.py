"""
Firestore Compatibility Layer for MySQL
Provides a MySQL-like interface that uses Firestore underneath
This allows app.py to work with minimal changes while we migrate
"""

import firestore_db
import re
from datetime import datetime
from typing import List, Dict, Any, Optional

class FakeFirestoreCursor:
    """Fake cursor that mimics MySQL cursor but uses Firestore"""
    
    def __init__(self):
        self.last_result = None
        self.last_insert_id = None
        self.rowcount = 0
    
    def execute(self, query: str, params: tuple = None):
        """Execute a query (parses SQL and routes to Firestore)"""
        query_lower = query.lower().strip()
        params = params or ()
        
        try:
            # SELECT queries
            if "select" in query_lower:
                self._execute_select(query_lower, query, params)
            # INSERT queries  
            elif "insert" in query_lower:
                self._execute_insert(query_lower, query, params)
            # UPDATE queries
            elif "update" in query_lower:
                self._execute_update(query_lower, query, params)
            # DELETE queries
            elif "delete" in query_lower:
                self._execute_delete(query_lower, query, params)
            else:
                print(f"⚠ Unknown query type: {query_lower[:50]}...")
                self.last_result = []
                
        except Exception as e:
            print(f"Error executing query: {e}")
            self.last_result = []
    
    def _execute_select(self, query_lower: str, query: str, params: tuple):
        """Handle SELECT queries"""
        
        # SELECT * FROM users WHERE email = ?
        if "from users where email" in query_lower:
            email = params[0] if params else None
            self.last_result = [firestore_db.get_user_by_email(email)] if email else []
        
        # SELECT * FROM users WHERE email = ? AND password = ?
        elif "from users where email" in query_lower and "password" in query_lower:
            email, password = params[0], params[1] if len(params) > 1 else None
            user = firestore_db.get_user_by_email(email)
            self.last_result = [user] if (user and user.get('password') == password) else []
        
        # Seller/Rider/Buyer requests
        elif "from seller_requests" in query_lower or "from rider_requests" in query_lower or "from buyer_requests" in query_lower:
            req_type = 'seller' if 'seller_requests' in query_lower else ('rider' if 'rider_requests' in query_lower else 'buyer')
            status = None
            if "status" in query_lower:
                status = params[0] if params else None
            self.last_result = firestore_db.get_all_pending_requests(req_type) if status == 'Pending' else []
        
        # SELECT COUNT(*) FROM products
        elif "count(*)" in query_lower and "products" in query_lower:
            self.last_result = [{'count': firestore_db.get_products_count()}]
        
        # SELECT * FROM products
        elif "from products" in query_lower and "where" not in query_lower:
            self.last_result = firestore_db.search_all_products()
        
        # SELECT * FROM products WHERE seller_email
        elif "from products where seller_email" in query_lower:
            seller_email = params[0] if params else None
            self.last_result = firestore_db.get_products_by_seller(seller_email) if seller_email else []
        
        # SELECT * FROM users
        elif "from users" in query_lower and "where" not in query_lower:
            self.last_result = firestore_db.get_all_users()
        
        # SELECT * FROM orders WHERE email
        elif "from orders where email" in query_lower:
            email = params[0] if params else None
            self.last_result = firestore_db.get_orders_by_email(email) if email else []
        
        # SELECT * FROM orders WHERE seller_email
        elif "from orders where seller_email" in query_lower:
            seller_email = params[0] if params else None
            self.last_result = firestore_db.get_orders_by_seller(seller_email) if seller_email else []
        
        # SELECT * FROM cart WHERE email
        elif "from cart where email" in query_lower:
            email = params[0] if params else None
            self.last_result = firestore_db.get_cart(email) if email else []
        
        # SELECT * FROM wishlist WHERE email
        elif "from wishlist where email" in query_lower:
            email = params[0] if params else None
            self.last_result = firestore_db.get_wishlist(email) if email else []
        
        # SELECT * FROM chat_messages WHERE thread_id
        elif "from chat_messages" in query_lower:
            thread_id = params[0] if params else None
            self.last_result = firestore_db.get_chat_messages(thread_id) if thread_id else []
        
        # Default: return empty
        else:
            print(f"⚠ Unhandled SELECT: {query_lower[:80]}...")
            self.last_result = []
        
        # Ensure result is always a list 
        if isinstance(self.last_result, dict):
            self.last_result = [self.last_result]
        elif not isinstance(self.last_result, list):
            self.last_result = []
    
    def _execute_insert(self, query_lower: str, query: str, params: tuple):
        """Handle INSERT queries"""
        print(f"⚠ INSERT operations need manual migration: {query_lower[:50]}...")
        self.last_result = None
    
    def _execute_update(self, query_lower: str, params: tuple):
        """Handle UPDATE queries"""
        
        # UPDATE users SET password = ? WHERE email = ?
        if "users" in query_lower and "password" in query_lower:
            password, email = params[0], params[1] if len(params) > 1 else None
            if email:
                firestore_db.update_password(email, password)
        else:
            print(f"⚠ UPDATE operations need manual migration")
        
        self.rowcount = 1
    
    def _execute_delete(self, query_lower: str, params: tuple):
        """Handle DELETE queries"""
        print(f"⚠ DELETE operations need manual migration: {query_lower[:50]}...")
        self.rowcount = 0
    
    def fetchone(self) -> Optional[Dict]:
        """Fetch one result"""
        if isinstance(self.last_result, list) and len(self.last_result) > 0:
            return self.last_result[0]
        return None
    
    def fetchall(self) -> List[Dict]:
        """Fetch all results"""
        if isinstance(self.last_result, list):
            return self.last_result
        return []
    
    def close(self):
        """Close cursor (no-op for Firestore)"""
        pass


class FakeFirestoreConnection:
    """Fake connection object that mimics MySQL connection"""
    
    def __init__(self):
        self.cursors = []
    
    def cursor(self, dictionary: bool = False):
        """Create a cursor"""
        cursor = FakeFirestoreCursor()
        self.cursors.append(cursor)
        return cursor
    
    def commit(self):
        """Commit (no-op for Firestore, which auto-commits)"""
        pass
    
    def rollback(self):
        """Rollback (no-op for Firestore)"""
        pass
    
    def close(self):
        """Close connection"""
        for cursor in self.cursors:
            cursor.close()


def get_db_connection() -> FakeFirestoreConnection:
    """
    Drop-in replacement for MySQL get_db_connection()
    Returns a fake connection that uses Firestore underneath
    Handles basic SELECT/UPDATE/INSERT/DELETE queries
    Complex queries may need manual refactoring
    """
    return FakeFirestoreConnection()

