// View Seller Page - Seller Reviews Functionality

const sellerEmail = window.location.pathname.split('/').pop();
let currentSellerRating = 0;
let currentCommunicationRating = 0;
let currentShippingRating = 0;
let currentQualityRating = 0;

// Load seller reviews and stats on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSellerReviews();
    loadSellerStats();
    checkSellerReviewEligibility();
    setupStarRatings();
    
    // Character counter
    const reviewText = document.getElementById('sellerReviewText');
    if (reviewText) {
        reviewText.addEventListener('input', function() {
            document.getElementById('sellerReviewCharCount').textContent = this.value.length;
        });
    }
});

// Setup star rating inputs
function setupStarRatings() {
    // Overall rating
    setupRatingInput('sellerStarRating', (rating) => {
        currentSellerRating = rating;
        // Auto-fill category ratings if not set
        if (currentCommunicationRating === 0) {
            setRatingInput('communicationRating', rating);
            currentCommunicationRating = rating;
        }
        if (currentShippingRating === 0) {
            setRatingInput('shippingRating', rating);
            currentShippingRating = rating;
        }
        if (currentQualityRating === 0) {
            setRatingInput('qualityRating', rating);
            currentQualityRating = rating;
        }
    });
    
    // Category ratings
    setupRatingInput('communicationRating', (rating) => {
        currentCommunicationRating = rating;
    });
    
    setupRatingInput('shippingRating', (rating) => {
        currentShippingRating = rating;
    });
    
    setupRatingInput('qualityRating', (rating) => {
        currentQualityRating = rating;
    });
}

// Setup individual rating input
function setupRatingInput(elementId, callback) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    const stars = container.querySelectorAll('.fa-star');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            setRatingInput(elementId, rating);
            callback(rating);
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(elementId, rating);
        });
    });
    
    container.addEventListener('mouseleave', function() {
        const currentRating = getCurrentRating(elementId);
        highlightStars(elementId, currentRating);
    });
}

// Set rating input value
function setRatingInput(elementId, rating) {
    highlightStars(elementId, rating);
}

// Highlight stars
function highlightStars(elementId, rating) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    const stars = container.querySelectorAll('.fa-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Get current rating for element
function getCurrentRating(elementId) {
    if (elementId === 'sellerStarRating') return currentSellerRating;
    if (elementId === 'communicationRating') return currentCommunicationRating;
    if (elementId === 'shippingRating') return currentShippingRating;
    if (elementId === 'qualityRating') return currentQualityRating;
    return 0;
}

// Load seller reviews
async function loadSellerReviews() {
    try {
        const response = await fetch(`/api/seller_review/${sellerEmail}`);
        const data = await response.json();
        
        if (data.success) {
            displaySellerReviews(data.reviews || []);
        }
    } catch (error) {
        console.error('Error loading seller reviews:', error);
    }
}

// Display seller reviews
function displaySellerReviews(reviews) {
    const reviewsList = document.getElementById('sellerReviewsList');
    const noReviews = document.getElementById('noSellerReviews');
    
    if (reviews.length === 0) {
        noReviews.style.display = 'block';
        return;
    }
    
    noReviews.style.display = 'none';
    reviewsList.innerHTML = '';
    
    reviews.forEach(review => {
        reviewsList.appendChild(createSellerReviewCard(review));
    });
}

// Create seller review card
function createSellerReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'seller-review-card';
    
    const buyerName = review.buyer_name || 'Anonymous';
    const buyerInitial = buyerName.charAt(0).toUpperCase();
    const reviewDate = review.created_at ? new Date(review.created_at.seconds * 1000).toLocaleDateString() : 'Recently';
    
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    card.innerHTML = `
        <div class="review-header">
            <div class="reviewer-info">
                <div class="reviewer-avatar">${buyerInitial}</div>
                <div class="reviewer-details">
                    <h4>${buyerName}</h4>
                    <span class="review-date">${reviewDate}</span>
                </div>
            </div>
            <div class="review-rating">
                <div class="stars">${stars}</div>
            </div>
        </div>
        <div class="review-categories">
            <div class="category-rating">
                <span class="category-label">Communication:</span>
                <span class="category-stars">${'★'.repeat(review.communication_rating || review.rating)}</span>
            </div>
            <div class="category-rating">
                <span class="category-label">Shipping:</span>
                <span class="category-stars">${'★'.repeat(review.shipping_rating || review.rating)}</span>
            </div>
            <div class="category-rating">
                <span class="category-label">Quality:</span>
                <span class="category-stars">${'★'.repeat(review.quality_rating || review.rating)}</span>
            </div>
        </div>
        <div class="review-text">${escapeHtml(review.review_text)}</div>
    `;
    
    return card;
}

// Load seller stats
async function loadSellerStats() {
    try {
        const response = await fetch(`/api/seller_review/${sellerEmail}/stats`);
        const data = await response.json();
        
        if (data.success) {
            displaySellerStats(data.stats);
        }
    } catch (error) {
        console.error('Error loading seller stats:', error);
    }
}

// Display seller stats
function displaySellerStats(stats) {
    document.getElementById('sellerRatingNumber').textContent = stats.average_rating.toFixed(1);
    document.getElementById('sellerRatingCount').textContent = `${stats.total_reviews} review${stats.total_reviews !== 1 ? 's' : ''}`;
    
    // Display stars
    const starsContainer = document.getElementById('sellerRatingStars');
    const fullStars = Math.floor(stats.average_rating);
    const hasHalfStar = stats.average_rating % 1 >= 0.5;
    
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    starsContainer.innerHTML = starsHTML;
    
    // Display category ratings
    const communicationPercent = (stats.communication_avg / 5) * 100;
    const shippingPercent = (stats.shipping_avg / 5) * 100;
    const qualityPercent = (stats.quality_avg / 5) * 100;
    
    document.getElementById('communicationBar').style.width = `${communicationPercent}%`;
    document.getElementById('communicationValue').textContent = stats.communication_avg.toFixed(1);
    
    document.getElementById('shippingBar').style.width = `${shippingPercent}%`;
    document.getElementById('shippingValue').textContent = stats.shipping_avg.toFixed(1);
    
    document.getElementById('qualityBar').style.width = `${qualityPercent}%`;
    document.getElementById('qualityValue').textContent = stats.quality_avg.toFixed(1);
}

// Check if user can review seller
async function checkSellerReviewEligibility() {
    try {
        const response = await fetch(`/api/seller_review/${sellerEmail}/can-review`);
        const data = await response.json();
        
        const writeBtn = document.getElementById('writeSellerReviewBtn');
        const notEligible = document.getElementById('sellerReviewNotEligible');
        const notEligibleText = document.getElementById('sellerReviewNotEligibleText');
        
        if (data.can_review) {
            writeBtn.style.display = 'inline-block';
            notEligible.style.display = 'none';
        } else {
            writeBtn.style.display = 'none';
            notEligible.style.display = 'block';
            
            switch(data.reason) {
                case 'not_logged_in':
                    notEligibleText.textContent = 'Please login to review this seller';
                    break;
                case 'own_store':
                    notEligibleText.textContent = 'You cannot review your own store';
                    break;
                case 'not_purchased':
                    notEligibleText.textContent = '⭐ You can only review sellers you have purchased from';
                    break;
                case 'already_reviewed':
                    notEligibleText.textContent = '✓ You have already reviewed this seller';
                    break;
                default:
                    notEligibleText.textContent = 'Unable to write review at this time';
            }
        }
    } catch (error) {
        console.error('Error checking review eligibility:', error);
    }
}

// Open seller review modal
function openSellerReviewModal() {
    document.getElementById('sellerReviewModal').classList.add('show');
    resetSellerReviewForm();
}

// Close seller review modal
function closeSellerReviewModal() {
    document.getElementById('sellerReviewModal').classList.remove('show');
}

// Reset seller review form
function resetSellerReviewForm() {
    document.getElementById('sellerReviewForm').reset();
    document.getElementById('sellerReviewCharCount').textContent = '0';
    currentSellerRating = 0;
    currentCommunicationRating = 0;
    currentShippingRating = 0;
    currentQualityRating = 0;
    
    // Reset all star ratings
    ['sellerStarRating', 'communicationRating', 'shippingRating', 'qualityRating'].forEach(id => {
        highlightStars(id, 0);
    });
}

// Submit seller review
async function submitSellerReview(event) {
    event.preventDefault();
    
    if (currentSellerRating === 0) {
        showToast('Please select a rating', 'warning');
        return;
    }
    
    const reviewText = document.getElementById('sellerReviewText').value.trim();
    
    if (!reviewText) {
        showToast('Please write a review', 'warning');
        return;
    }
    
    const formData = {
        seller_email: sellerEmail,
        rating: currentSellerRating,
        communication_rating: currentCommunicationRating || currentSellerRating,
        shipping_rating: currentShippingRating || currentSellerRating,
        quality_rating: currentQualityRating || currentSellerRating,
        review_text: reviewText
    };
    
    try {
        const response = await fetch('/api/seller_review/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Review submitted successfully!', 'success');
            closeSellerReviewModal();
            loadSellerReviews();
            loadSellerStats();
            checkSellerReviewEligibility();
        } else {
            if (response.status === 403) {
                showToast('⭐ You can only review sellers you have purchased from', 'error');
            } else {
                showToast(data.message || 'Failed to submit review', 'error');
            }
        }
    } catch (error) {
        console.error('Error submitting seller review:', error);
        showToast('Error submitting review', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Use existing Toast if available, otherwise use alert
    if (typeof Toast !== 'undefined') {
        Toast[type](message);
    } else {
        alert(message);
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Modal styles
const style = document.createElement('style');
style.textContent = `
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        align-items: center;
        justify-content: center;
    }
    
    .modal.show {
        display: flex;
    }
    
    .modal-content {
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    }
    
    .modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
    }
    
    .modal-close:hover {
        color: #333;
    }
    
    .star-rating-input {
        display: flex;
        gap: 8px;
        font-size: 32px;
        color: #ddd;
        cursor: pointer;
    }
    
    .star-rating-input .fa-star {
        transition: color 0.2s;
    }
    
    .star-rating-input .fa-star:hover,
    .star-rating-input .fa-star.active {
        color: #ffc107;
    }
    
    .category-ratings {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
        margin: 20px 0;
    }
    
    .category-ratings .star-rating-input {
        font-size: 20px;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
    }
    
    .form-group textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
    }
    
    .form-group textarea:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    .char-counter {
        text-align: right;
        font-size: 12px;
        color: #999;
        margin-top: 5px;
    }
    
    .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 25px;
    }
    
    .form-actions button {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .btn-cancel {
        background: #ecf0f1;
        color: #7f8c8d;
    }
    
    .btn-cancel:hover {
        background: #bdc3c7;
    }
    
    .btn-submit {
        background: #3498db;
        color: white;
    }
    
    .btn-submit:hover {
        background: #2980b9;
    }
    
    .required {
        color: #e74c3c;
    }
`;
document.head.appendChild(style);


// ===================================
// PRODUCT ACTIONS - ADD TO CART & WISHLIST
// ===================================

let currentCartProduct = null;

// Handle Add to Cart - Open Modal
function handleAddToCart(button) {
    const productId = button.dataset.productId;
    const productName = button.dataset.productName;
    const productPrice = button.dataset.productPrice;
    const productImage = button.dataset.productImage;
    const sellerEmail = button.dataset.sellerEmail;
    
    // Check if user is logged in
    const userEmail = document.querySelector('.dropdown-content');
    if (!userEmail) {
        showToast('Please login to add items to cart', 'warning');
        window.location.href = '/auth?tab=login';
        return;
    }
    
    // Get stock from the product card
    const productCard = button.closest('.product-card');
    const stockElement = productCard.querySelector('.product-stock');
    let stock = 0;
    if (stockElement) {
        const stockMatch = stockElement.textContent.match(/Stock: (\d+)/);
        stock = stockMatch ? parseInt(stockMatch[1]) : 0;
    }
    
    openAddToCartModal(productId, productName, productPrice, productImage, sellerEmail, stock);
}

// Open Add to Cart Modal
function openAddToCartModal(productId, name, price, image, sellerEmail, stock) {
    currentCartProduct = {
        id: productId,
        name: name,
        price: price,
        image: image,
        seller_email: sellerEmail,
        stock: stock
    };
    
    // Set product info in modal
    document.getElementById('cartModalImage').src = image || '/static/images/defaults/product-default.png';
    document.getElementById('cartModalName').textContent = name;
    document.getElementById('cartModalPrice').textContent = '₱' + parseFloat(price).toFixed(2);
    
    // Set stock info
    const stockInfo = document.getElementById('stockInfo');
    if (stock === 0) {
        stockInfo.textContent = 'Out of Stock';
        stockInfo.style.color = '#e74c3c';
        document.querySelector('.btn-submit').disabled = true;
    } else if (stock <= 5) {
        stockInfo.textContent = `Only ${stock} left in stock`;
        stockInfo.style.color = '#e67e22';
        document.querySelector('.btn-submit').disabled = false;
    } else {
        stockInfo.textContent = `${stock} available`;
        stockInfo.style.color = '#27ae60';
        document.querySelector('.btn-submit').disabled = false;
    }
    
    // Reset quantity
    const quantityInput = document.getElementById('cartQuantity');
    quantityInput.value = 1;
    quantityInput.max = Math.min(stock, 999);
    
    // Show modal
    document.getElementById('addToCartModal').classList.add('show');
}

// Close Add to Cart Modal
function closeAddToCartModal() {
    document.getElementById('addToCartModal').classList.remove('show');
    currentCartProduct = null;
}

// Increase Quantity
function increaseQuantity() {
    const input = document.getElementById('cartQuantity');
    let currentValue = parseInt(input.value) || 1;
    const maxStock = parseInt(input.max) || 999;
    
    if (currentValue < maxStock) {
        input.value = currentValue + 1;
    } else {
        showToast(`Maximum ${maxStock} items available`, 'warning');
    }
}

// Decrease Quantity
function decreaseQuantity() {
    const input = document.getElementById('cartQuantity');
    let currentValue = parseInt(input.value) || 1;
    
    if (currentValue > 1) {
        input.value = currentValue - 1;
    }
}

// Confirm Add to Cart
function confirmAddToCart() {
    if (!currentCartProduct) {
        showToast('Product information missing', 'error');
        return;
    }
    
    const quantity = parseInt(document.getElementById('cartQuantity').value);
    
    if (!quantity || quantity < 1) {
        showToast('Please enter a valid quantity', 'warning');
        return;
    }
    
    if (quantity > currentCartProduct.stock) {
        showToast(`Only ${currentCartProduct.stock} items available`, 'warning');
        return;
    }
    
    // Add to cart via API
    fetch('/add_to_cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: currentCartProduct.id,
            name: currentCartProduct.name,
            price: currentCartProduct.price,
            image: currentCartProduct.image,
            color: 'Default',
            size: '',
            quantity: quantity,
            variant_id: `${currentCartProduct.id}_Default_nosize`,
            seller_email: currentCartProduct.seller_email
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.outOfStock) {
            showToast('This product is out of stock', 'error');
        } else if (data.insufficientStock) {
            showToast(`Only ${data.available} item(s) available`, 'warning');
        } else if (data.success) {
            showToast('Product added to cart!', 'success');
            closeAddToCartModal();
        } else {
            showToast(data.message || 'Error adding to cart', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error adding to cart', 'error');
    });
}

// Handle Add to Wishlist
function handleAddToWishlist(button) {
    const productId = button.dataset.productId;
    const productName = button.dataset.productName;
    const productPrice = button.dataset.productPrice;
    const productImage = button.dataset.productImage;
    const sellerEmail = button.dataset.sellerEmail;
    
    // Check if user is logged in
    const userEmail = document.querySelector('.dropdown-content');
    if (!userEmail) {
        showToast('Please login to add items to wishlist', 'warning');
        window.location.href = '/auth?tab=login';
        return;
    }
    
    // Add to wishlist via API
    fetch('/add-to-wishlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            product_id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            seller_email: sellerEmail
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Added to wishlist!', 'success');
        } else {
            showToast(data.message || 'Error adding to wishlist', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error adding to wishlist', 'error');
    });
}