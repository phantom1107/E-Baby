"""Product review routes for E-Baby"""
from flask import Blueprint, request, jsonify, session
import firestore_db

reviews_bp = Blueprint('reviews', __name__, url_prefix='/api')

@reviews_bp.route('/product_review/submit', methods=['POST'])
def submit_product_review():
    """Submit a product review - requires verified purchase"""
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    try:
        data = request.json
        user_email = session['email']
        product_id = data.get('product_id')
        
        # Validate required fields
        required_fields = ['product_id', 'rating', 'review_text']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        # CRITICAL: Check if user has purchased this product (verified purchase required)
        verified_purchase = firestore_db.check_user_purchased_product(user_email, product_id)
        if not verified_purchase:
            return jsonify({
                'success': False, 
                'message': 'You can only review products you have purchased and received. Please complete your order first.'
            }), 403
        
        # Check if user already reviewed this product
        existing_review = firestore_db.get_user_review_for_product(user_email, product_id)
        if existing_review:
            return jsonify({'success': False, 'message': 'You have already reviewed this product'}), 400
        
        # Get user info
        user = firestore_db.get_user_by_email(user_email)
        buyer_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        
        # Get product info
        product = firestore_db.get_product_by_id(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        review_data = {
            'product_id': product_id,
            'product_name': product.get('name', ''),
            'buyer_email': user_email,
            'buyer_name': buyer_name,
            'seller_email': product.get('seller_email', ''),
            'order_id': data.get('order_id', ''),
            'rating': int(data['rating']),
            'title': data.get('title', ''),
            'review_text': data['review_text'],
            'images': data.get('images', []),
            'verified_purchase': True  # Always true since we verified above
        }
        
        review_id = firestore_db.create_product_review(review_data)
        
        # Update product rating
        firestore_db.update_product_rating(product_id)
        
        return jsonify({'success': True, 'review_id': review_id})
        
    except Exception as e:
        print(f"Error submitting review: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@reviews_bp.route('/product_review/<product_id>', methods=['GET'])
def get_product_reviews_api(product_id):
    """Get all reviews for a product"""
    try:
        reviews = firestore_db.get_product_reviews(product_id)
        
        # Get replies for each review
        for review in reviews:
            review['replies'] = firestore_db.get_review_replies(review['id'])
        
        return jsonify({'success': True, 'reviews': reviews})
        
    except Exception as e:
        print(f"Error getting reviews: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@reviews_bp.route('/product_review/<product_id>/can-review', methods=['GET'])
def can_user_review_product(product_id):
    """Check if current user can review a product (must have purchased it)"""
    if 'email' not in session:
        return jsonify({'can_review': False, 'reason': 'not_logged_in'})
    
    try:
        user_email = session['email']
        
        # Check if user purchased the product
        has_purchased = firestore_db.check_user_purchased_product(user_email, product_id)
        if not has_purchased:
            return jsonify({'can_review': False, 'reason': 'not_purchased'})
        
        # Check if user already reviewed this product
        existing_review = firestore_db.get_user_review_for_product(user_email, product_id)
        if existing_review:
            return jsonify({'can_review': False, 'reason': 'already_reviewed'})
        
        return jsonify({'can_review': True, 'reason': 'eligible'})
        
    except Exception as e:
        print(f"Error checking review eligibility: {e}")
        return jsonify({'can_review': False, 'reason': 'error'}), 500


@reviews_bp.route('/product_review/<review_id>/reply', methods=['POST'])
def reply_to_review(review_id):
    """Reply to a review (seller only)"""
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    try:
        data = request.json
        seller_email = session['email']
        
        # Verify seller owns the product
        review = firestore_db.get_review_by_id(review_id)
        if not review or review.get('seller_email') != seller_email:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        reply_data = {
            'review_id': review_id,
            'seller_email': seller_email,
            'reply_text': data.get('reply_text', ''),
            'is_seller': True
        }
        
        reply_id = firestore_db.create_review_reply(reply_data)
        
        return jsonify({'success': True, 'reply_id': reply_id})
        
    except Exception as e:
        print(f"Error replying to review: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@reviews_bp.route('/product_review/<review_id>/helpful', methods=['POST'])
def mark_review_helpful(review_id):
    """Mark a review as helpful"""
    try:
        user_email = session.get('email', 'guest')
        
        # Update helpful count
        helpful_count = firestore_db.mark_review_helpful(review_id, user_email)
        
        return jsonify({'success': True, 'helpful_count': helpful_count, 'message': 'Thank you for your feedback!'})
        
    except Exception as e:
        print(f"Error marking review helpful: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
