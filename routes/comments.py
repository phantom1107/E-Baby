"""Product comments/Q&A routes for E-Baby"""
from flask import Blueprint, request, jsonify, session
import firestore_db

comments_bp = Blueprint('comments', __name__, url_prefix='/api')

@comments_bp.route('/product_comment/submit', methods=['POST'])
def submit_product_comment():
    """Submit a product comment/question"""
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    try:
        data = request.json
        user_email = session['email']
        
        # Validate required fields
        required_fields = ['product_id', 'comment_text']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        # Get user info
        user = firestore_db.get_user_by_email(user_email)
        user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        
        # Get product info
        product = firestore_db.get_product_by_id(data['product_id'])
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        comment_data = {
            'product_id': data['product_id'],
            'product_name': product.get('name', ''),
            'user_email': user_email,
            'user_name': user_name,
            'user_type': user.get('user_type', 'buyer'),
            'comment_text': data['comment_text'],
            'is_question': data.get('is_question', True),  # Default to question
            'images': data.get('images', []),
            'status': 'active'
        }
        
        comment_id = firestore_db.create_product_comment(comment_data)
        
        return jsonify({'success': True, 'comment_id': comment_id})
        
    except Exception as e:
        print(f"Error submitting comment: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@comments_bp.route('/product_comment/<product_id>', methods=['GET'])
def get_product_comments_api(product_id):
    """Get all comments for a product"""
    try:
        is_question = request.args.get('is_question')
        if is_question is not None:
            is_question = is_question.lower() == 'true'
        
        comments = firestore_db.get_product_comments(product_id, is_question)
        
        # Get replies for each comment
        for comment in comments:
            comment['replies'] = firestore_db.get_comment_replies(comment['id'])
        
        return jsonify({'success': True, 'comments': comments})
        
    except Exception as e:
        print(f"Error getting comments: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@comments_bp.route('/product_comment/<comment_id>/reply', methods=['POST'])
def reply_to_comment(comment_id):
    """Reply to a comment"""
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    try:
        data = request.json
        user_email = session['email']
        
        # Get user info
        user = firestore_db.get_user_by_email(user_email)
        user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        
        # Get comment to check if user is seller
        comment_doc = firestore_db.db.collection('product_comments').document(comment_id).get()
        if not comment_doc.exists:
            return jsonify({'success': False, 'message': 'Comment not found'}), 404
        
        comment = comment_doc.to_dict()
        product = firestore_db.get_product_by_id(comment.get('product_id'))
        is_seller = product.get('seller_email') == user_email if product else False
        
        reply_data = {
            'comment_id': comment_id,
            'user_email': user_email,
            'user_name': user_name,
            'user_type': user.get('user_type', 'buyer'),
            'reply_text': data.get('reply_text', ''),
            'images': data.get('images', []),
            'is_seller_answer': is_seller
        }
        
        reply_id = firestore_db.create_comment_reply(reply_data)
        
        return jsonify({'success': True, 'reply_id': reply_id})
        
    except Exception as e:
        print(f"Error replying to comment: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
