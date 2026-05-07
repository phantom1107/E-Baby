"""Seller review routes for E-Baby"""
from flask import Blueprint, request, jsonify, session
import firestore_db

seller_reviews_bp = Blueprint('seller_reviews', __name__, url_prefix='/api')

@seller_reviews_bp.route('/seller_review/submit', methods=['POST'])
def submit_seller_review():
    """Submit a seller review - requires completed order"""
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    try:
        data = request.json
        user_email = session['email']
        
        # Validate required fields
        required_fields = ['seller_email', 'rating', 'review_text']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        # Check if user has purchased from this seller
        has_purchased = firestore_db.check_user_purchased_from_seller(user_email, data['seller_email'])
        if not has_purchased:
            return jsonify({
                'success': False,
                'message': 'You can only review sellers you have purchased from'
            }), 403
        
        # Check if user already reviewed this seller
        existing_review = firestore_db.get_user_seller_review(user_email, data['seller_email'])
        if existing_review:
            return jsonify({'success': False, 'message': 'You have already reviewed this seller'}), 400
        
        # Get user info
        user = firestore_db.get_user_by_email(user_email)
        buyer_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        
        # Get seller info
        seller = firestore_db.get_user_by_email(data['seller_email'])
        if not seller:
            return jsonify({'success': False, 'message': 'Seller not found'}), 404
        
        seller_name = f"{seller.get('first_name', '')} {seller.get('last_name', '')}".strip()
        
        review_data = {
            'seller_email': data['seller_email'],
            'seller_name': seller_name,
            'buyer_email': user_email,
            'buyer_name': buyer_name,
            'order_id': data.get('order_id', ''),
            'rating': int(data['rating']),
            'review_text': data['review_text'],
            # Category ratings (optional)
            'communication_rating': int(data.get('communication_rating', data['rating'])),
            'shipping_rating': int(data.get('shipping_rating', data['rating'])),
            'quality_rating': int(data.get('quality_rating', data['rating'])),
            'status': 'active'
        }
        
        review_id = firestore_db.create_seller_review(review_data)
        
        # Update seller rating
        firestore_db.update_seller_rating(data['seller_email'])
        
        return jsonify({'success': True, 'review_id': review_id})
        
    except Exception as e:
        print(f"Error submitting seller review: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@seller_reviews_bp.route('/seller_review/<seller_email>', methods=['GET'])
def get_seller_reviews_api(seller_email):
    """Get all reviews for a seller"""
    try:
        reviews = firestore_db.get_seller_reviews(seller_email)
        return jsonify({'success': True, 'reviews': reviews})
        
    except Exception as e:
        print(f"Error getting seller reviews: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@seller_reviews_bp.route('/seller_review/<seller_email>/can-review', methods=['GET'])
def can_user_review_seller(seller_email):
    """Check if current user can review a seller"""
    if 'email' not in session:
        return jsonify({'can_review': False, 'reason': 'not_logged_in'})
    
    try:
        user_email = session['email']
        
        # Can't review yourself
        if user_email == seller_email:
            return jsonify({'can_review': False, 'reason': 'own_store'})
        
        # Check if user has purchased from seller
        has_purchased = firestore_db.check_user_purchased_from_seller(user_email, seller_email)
        if not has_purchased:
            return jsonify({'can_review': False, 'reason': 'not_purchased'})
        
        # Check if user already reviewed this seller
        existing_review = firestore_db.get_user_seller_review(user_email, seller_email)
        if existing_review:
            return jsonify({'can_review': False, 'reason': 'already_reviewed'})
        
        return jsonify({'can_review': True, 'reason': 'eligible'})
        
    except Exception as e:
        print(f"Error checking seller review eligibility: {e}")
        return jsonify({'can_review': False, 'reason': 'error'}), 500


@seller_reviews_bp.route('/seller_review/<seller_email>/stats', methods=['GET'])
def get_seller_review_stats(seller_email):
    """Get seller review statistics"""
    try:
        reviews = firestore_db.get_seller_reviews(seller_email)
        
        if not reviews:
            return jsonify({
                'success': True,
                'stats': {
                    'total_reviews': 0,
                    'average_rating': 0,
                    'communication_avg': 0,
                    'shipping_avg': 0,
                    'quality_avg': 0,
                    'rating_breakdown': {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
                }
            })
        
        total_reviews = len(reviews)
        total_rating = sum(r.get('rating', 0) for r in reviews)
        total_communication = sum(r.get('communication_rating', r.get('rating', 0)) for r in reviews)
        total_shipping = sum(r.get('shipping_rating', r.get('rating', 0)) for r in reviews)
        total_quality = sum(r.get('quality_rating', r.get('rating', 0)) for r in reviews)
        
        rating_breakdown = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        for review in reviews:
            rating = review.get('rating', 0)
            if rating in rating_breakdown:
                rating_breakdown[rating] += 1
        
        stats = {
            'total_reviews': total_reviews,
            'average_rating': round(total_rating / total_reviews, 1),
            'communication_avg': round(total_communication / total_reviews, 1),
            'shipping_avg': round(total_shipping / total_reviews, 1),
            'quality_avg': round(total_quality / total_reviews, 1),
            'rating_breakdown': rating_breakdown
        }
        
        return jsonify({'success': True, 'stats': stats})
        
    except Exception as e:
        print(f"Error getting seller stats: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
