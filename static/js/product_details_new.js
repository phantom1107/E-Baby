/* ========================================
   PRODUCT DETAILS PAGE - FUNCTIONALITY
   ======================================== */

let currentProductData = {
  id: null,
  name: null,
  price: null,
  image: null,
  stock: null,
  sellerEmail: null,
  selectedColor: null,
  selectedSize: null,
  selectedQuantity: 1,
  variants: [],
  availableColors: [],
  availableSizes: []
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function () {
  updateCartCount();
  updateWishlistCount();
  setupDropdownClosers();
  
  // Store product info from data attributes if available
  const form = document.getElementById('addToCartForm');
  if (form) {
    currentProductData.id = form.querySelector('[name="product_id"]')?.value;
    currentProductData.name = form.querySelector('[name="product_name"]')?.value;
    currentProductData.price = parseFloat(form.querySelector('[name="product_price"]')?.value);
    currentProductData.image = form.querySelector('[name="product_image"]')?.value;
    currentProductData.sellerEmail = form.querySelector('[name="seller_email"]')?.value;
    
    // Load variants for this product
    if (currentProductData.id) {
      loadProductVariants(currentProductData.id);
    }
  }
});

// ========================================
// LOAD PRODUCT VARIANTS
// ========================================

function loadProductVariants(productId) {
  fetch(`/api/product_variants/${productId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.variants && data.variants.length > 0) {
        currentProductData.variants = data.variants;
        
        // Extract unique colors and sizes
        const colors = [...new Set(data.variants.map(v => v.color))];
        const sizes = [...new Set(data.variants.map(v => v.size))];
        
        currentProductData.availableColors = colors;
        currentProductData.availableSizes = sizes;
        
        // Populate UI
        renderColorOptions(colors);
        renderSizeOptions(sizes);
        
        // Ensure stock info shows the initial message
        const stockInfo = document.getElementById('stockInfo');
        if (stockInfo) {
          stockInfo.innerHTML = '<i class="fas fa-box"></i> Select color and size to see stock';
          stockInfo.style.color = '#666';
        }
        
        // Setup change listeners
        setupVariantListeners();
      } else {
        document.getElementById('colorOptions').innerHTML = '<p>No color options available</p>';
        document.getElementById('sizeOptions').innerHTML = '<p>No size options available</p>';
        const stockInfo = document.getElementById('stockInfo');
        if (stockInfo) {
          stockInfo.innerHTML = '<i class="fas fa-box"></i> No variants available';
          stockInfo.style.color = '#e74c3c';
        }
      }
    })
    .catch(error => {
      console.error('Error loading variants:', error);
      document.getElementById('colorOptions').innerHTML = '<p>Error loading options</p>';
      document.getElementById('sizeOptions').innerHTML = '<p>Error loading options</p>';
      const stockInfo = document.getElementById('stockInfo');
      if (stockInfo) {
        stockInfo.innerHTML = '<i class="fas fa-box"></i> Error loading stock info';
        stockInfo.style.color = '#e74c3c';
      }
    });
}

function renderColorOptions(colors) {
  const container = document.getElementById('colorOptions');
  if (!colors || colors.length === 0) {
    container.innerHTML = '<p>No color options available</p>';
    return;
  }
  
  let html = '';
  colors.forEach((color, index) => {
    const colorValue = color.toLowerCase().replace(/\s+/g, '');
    const colorMap = {
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#00AA00',
      'yellow': '#FFFF00',
      'black': '#000000',
      'white': '#FFFFFF',
      'pink': '#FFC0CB',
      'purple': '#800080',
      'orange': '#FFA500',
      'brown': '#8B4513',
      'gray': '#808080',
      'grey': '#808080'
    };
    
    const bgColor = colorMap[colorValue] || color;
    
    html += `
      <div class="color-option-wrapper">
        <input type="radio" name="color" id="color-${index}" value="${color}" onchange="onVariantChange()">
        <label for="color-${index}" class="color-label" title="${color}" style="background-color: ${bgColor};"></label>
        <span class="color-label-text">${color}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function renderSizeOptions(sizes) {
  const container = document.getElementById('sizeOptions');
  if (!sizes || sizes.length === 0) {
    container.innerHTML = '<p>No size options available</p>';
    return;
  }
  
  let html = '';
  sizes.forEach((size, index) => {
    html += `
      <div class="size-option-wrapper">
        <input type="radio" name="size" id="size-${index}" value="${size}" onchange="onVariantChange()">
        <label for="size-${index}">${size}</label>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function setupVariantListeners() {
  // Color and size changes are already handled via onVariantChange in the render functions
}

function onVariantChange() {
  const colorSelect = document.querySelector('input[name="color"]:checked');
  const sizeSelect = document.querySelector('input[name="size"]:checked');
  const stockInfo = document.getElementById('stockInfo');
  
  // If either is not selected, show selection prompt
  if (!colorSelect || !sizeSelect) {
    stockInfo.innerHTML = '<i class="fas fa-box"></i> Select color and size to see stock';
    stockInfo.style.color = '#666';
    document.getElementById('addCartBtn').disabled = true;
    document.getElementById('buyNowBtn').disabled = true;
    document.getElementById('quantity').max = 1;
    return;
  }
  
  currentProductData.selectedColor = colorSelect.value;
  currentProductData.selectedSize = sizeSelect.value;
  
  // Find the matching variant
  const variant = currentProductData.variants.find(v => 
    v.color === currentProductData.selectedColor && 
    v.size === currentProductData.selectedSize
  );
  
  if (variant) {
    if (variant.stock > 0) {
      const stockText = `<i class="fas fa-box"></i> ${variant.stock} in stock`;
      stockInfo.innerHTML = stockText;
      stockInfo.style.color = variant.stock <= 5 ? '#e74c3c' : '#27ae60';
      document.getElementById('quantity').max = Math.min(10, variant.stock);
      document.getElementById('quantity').value = 1;
      document.getElementById('addCartBtn').disabled = false;
      document.getElementById('buyNowBtn').disabled = false;
    } else {
      stockInfo.innerHTML = '<i class="fas fa-box"></i> Out of stock';
      stockInfo.style.color = '#e74c3c';
      document.getElementById('addCartBtn').disabled = true;
      document.getElementById('buyNowBtn').disabled = true;
      document.getElementById('quantity').max = 1;
    }
  } else {
    stockInfo.innerHTML = '<i class="fas fa-box"></i> Variant not found';
    stockInfo.style.color = '#e74c3c';
    document.getElementById('addCartBtn').disabled = true;
    document.getElementById('buyNowBtn').disabled = true;
    document.getElementById('quantity').max = 1;
  }
}

// ========================================
// DROPDOWN FUNCTIONS
// ========================================

function toggleCartDropdown(event) {
  if (event) event.preventDefault();
  const dropdown = document.getElementById('cartDropdown');
  const wishlistDropdown = document.getElementById('wishlistDropdown');
  
  wishlistDropdown.classList.remove('show');
  loadCartPreview();
  dropdown.classList.toggle('show');
}

function toggleWishlistDropdown(event) {
  if (event) event.preventDefault();
  const dropdown = document.getElementById('wishlistDropdown');
  const cartDropdown = document.getElementById('cartDropdown');
  
  cartDropdown.classList.remove('show');
  loadWishlistPreview();
  dropdown.classList.toggle('show');
}

function setupDropdownClosers() {
  document.addEventListener('click', function (event) {
    const cartDropdown = document.getElementById('cartDropdown');
    const wishlistDropdown = document.getElementById('wishlistDropdown');
    
    if (!event.target.closest('.cart-container')) {
      cartDropdown?.classList.remove('show');
    }
    if (!event.target.closest('.wishlist-container')) {
      wishlistDropdown?.classList.remove('show');
    }
  });
}

// ========================================
// CART FUNCTIONS
// ========================================

function updateCartCount() {
  fetch('/get_cart_count')
    .then((response) => response.json())
    .then((data) => {
      const badge = document.getElementById('cartCount');
      if (badge) {
        badge.textContent = data.count || '0';
      }
    })
    .catch((error) => console.error('Error fetching cart count:', error));
}

function loadCartPreview() {
  fetch('/get_cart_preview')
    .then((response) => response.json())
    .then((data) => {
      const cartItems = document.getElementById('cartItems');
      cartItems.innerHTML = '';
      let total = 0;

      if (data.items && data.items.length > 0) {
        data.items.forEach((item) => {
          total += parseFloat(item.price) * parseInt(item.quantity);
          
          // Build image URL - add /static/uploads/ prefix if it's just a filename
          let imageUrl = item.image;
          if (!item.image.startsWith('/')) {
            imageUrl = `/static/uploads/${item.image}`;
          }
          
          const itemElement = document.createElement('div');
          itemElement.className = 'cart-item';
          itemElement.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}" class="cart-item-image" onerror="this.src='/static/images/defaults/product-default.png'">
            <div class="cart-item-details">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-variant">
                ${item.color ? `<span class="variant">Color: ${item.color}</span>` : ''}
                ${item.size ? `<span class="variant">Size: ${item.size}</span>` : ''}
              </div>
              <div class="cart-item-price">₱${parseFloat(item.price).toFixed(2)}</div>
              <div class="quantity-controls">
                <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', '${item.color}', '${item.size}', -1)">−</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', '${item.color}', '${item.size}', 1)">+</button>
              </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart('${item.product_id}', '${item.color}', '${item.size}')">
              <i class="fas fa-trash"></i>
            </button>
          `;
          cartItems.appendChild(itemElement);
        });
      } else {
        cartItems.innerHTML = '<div class="empty-message">Your cart is empty</div>';
      }

      const cartFooter = document.querySelector('.dropdown-footer');
      if (cartFooter && data.items && data.items.length > 0) {
        cartFooter.innerHTML = `
          <div class="cart-total">Subtotal: ₱${total.toFixed(2)}</div>
          <a href="/cart" class="checkout-btn">View Cart</a>
        `;
      }
    })
    .catch((error) => console.error('Error loading cart preview:', error));
}

function updateCartQuantity(productId, color, size, change) {
  fetch('/update-cart-quantity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      color: color,
      size: size,
      change: change
    })
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        loadCartPreview();
        updateCartCount();
      }
    })
    .catch((error) => console.error('Error updating quantity:', error));
}

function removeFromCart(productId, color, size) {
  fetch('/remove-from-cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      color: color,
      size: size
    })
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification('Removed from cart', 'success');
        loadCartPreview();
        updateCartCount();
      }
    })
    .catch((error) => console.error('Error removing from cart:', error));
}

// ========================================
// WISHLIST FUNCTIONS
// ========================================

function updateWishlistCount() {
  fetch('/get_wishlist_count')
    .then((response) => response.json())
    .then((data) => {
      const badge = document.getElementById('wishlistCount');
      if (badge) {
        badge.textContent = data.count || '0';
      }
    })
    .catch((error) => console.error('Error fetching wishlist count:', error));
}

function loadWishlistPreview() {
  fetch('/get_wishlist_preview')
    .then((response) => response.json())
    .then((data) => {
      const wishlistItems = document.getElementById('wishlistItems');
      wishlistItems.innerHTML = '';

      if (data.items && data.items.length > 0) {
        data.items.forEach((item) => {
          // Handle image URL properly
          let imagePath;
          if (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://') || item.image.startsWith('//'))) {
            imagePath = item.image;
          } else if (item.image && item.image.startsWith('/')) {
            imagePath = item.image;
          } else if (item.image) {
            imagePath = '/static/uploads/' + item.image;
          } else {
            imagePath = '/static/images/defaults/product-default.png';
          }
          
          const itemElement = document.createElement('div');
          itemElement.className = 'wishlist-item';
          itemElement.innerHTML = `
            <img src="${imagePath}" alt="${item.name}" class="wishlist-item-image" onerror="this.src='/static/images/defaults/product-default.png'">
            <div class="wishlist-item-details">
              <div class="wishlist-item-name">${item.name}</div>
              <div class="wishlist-item-price">₱${parseFloat(item.price).toFixed(2)}</div>
            </div>
            <button class="remove-btn" onclick="removeFromWishlist(${item.id})">
              <i class="fas fa-trash"></i>
            </button>
          `;
          wishlistItems.appendChild(itemElement);
        });
      } else {
        wishlistItems.innerHTML = '<div class="empty-message">Your wishlist is empty</div>';
      }
    })
    .catch((error) => console.error('Error loading wishlist preview:', error));
}

function removeFromWishlist(wishlistId) {
  if (confirm('Remove from wishlist?')) {
    fetch('/wishlist/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: [wishlistId]
      })
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification('Removed from wishlist', 'success');
          loadWishlistPreview();
          updateWishlistCount();
        } else {
          showNotification(data.message || 'Error removing from wishlist', 'error');
        }
      })
      .catch((error) => {
        console.error('Error removing from wishlist:', error);
        showNotification('Error removing from wishlist', 'error');
      });
  }
}

// ========================================
// BUTTON HANDLERS
// ========================================

function handleAddToCart() {
  if (!currentProductData.id) {
    showNotification('Product data not loaded. Please refresh the page.', 'error');
    return;
  }

  const form = document.getElementById('addToCartForm');
  const colorInput = form.querySelector('input[name="color"]:checked');
  const sizeInput = form.querySelector('input[name="size"]:checked');
  const quantityInput = form.querySelector('input[name="quantity"]');

  // Validate color selection if colors exist
  if (form.querySelector('input[name="color"]') && !colorInput) {
    showNotification('Please select a color', 'warning');
    return;
  }

  // Validate size selection if sizes exist
  if (form.querySelector('input[name="size"]') && !sizeInput) {
    showNotification('Please select a size', 'warning');
    return;
  }

  const color = colorInput?.value || '';
  const size = sizeInput?.value || '';
  const quantity = parseInt(quantityInput.value) || 1;

  addToCart(currentProductData.id, currentProductData.name, currentProductData.price,
            currentProductData.image, color, size, quantity);
}

function addToCart(productId, productName, productPrice, productImage, color, size, quantity) {
  if (!productId) {
    showNotification('Product information missing', 'error');
    return;
  }

  // Clean image path - remove /static/uploads/ if present, keep just the filename
  let cleanImage = productImage;
  if (productImage.includes('/static/uploads/')) {
    cleanImage = productImage.split('/static/uploads/')[1];
  } else if (productImage.includes('/uploads/')) {
    cleanImage = productImage.split('/uploads/')[1];
  }

  fetch('/add_to_cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      name: productName,
      price: productPrice,
      image: cleanImage,
      color: color,
      size: size,
      quantity: quantity,
      seller_email: currentProductData.sellerEmail,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification('Added to cart!', 'success');
        updateCartCount();
        loadCartPreview();
      } else {
        showNotification(data.message || 'Error adding to cart', 'error');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      showNotification('Error adding to cart', 'error');
    });
}

function handleBuyNow() {
  if (!currentProductData.id) {
    showNotification('Product data not loaded. Please refresh the page.', 'error');
    return;
  }

  const form = document.getElementById('addToCartForm');
  const colorInput = form.querySelector('input[name="color"]:checked');
  const sizeInput = form.querySelector('input[name="size"]:checked');
  const quantityInput = form.querySelector('input[name="quantity"]');

  if (form.querySelector('input[name="color"]') && !colorInput) {
    showNotification('Please select a color', 'warning');
    return;
  }

  if (form.querySelector('input[name="size"]') && !sizeInput) {
    showNotification('Please select a size', 'warning');
    return;
  }

  const color = colorInput?.value || '';
  const size = sizeInput?.value || '';
  const quantity = parseInt(quantityInput.value) || 1;

  buyNow(currentProductData.id, currentProductData.name, currentProductData.price,
         currentProductData.image, color, size, quantity);
}

function buyNow(productId, productName, productPrice, productImage, color, size, quantity) {
  if (!productId) {
    showNotification('Product information missing', 'error');
    return;
  }

  // Clean image path - remove /static/uploads/ if present, keep just the filename
  let cleanImage = productImage;
  if (productImage.includes('/static/uploads/')) {
    cleanImage = productImage.split('/static/uploads/')[1];
  } else if (productImage.includes('/uploads/')) {
    cleanImage = productImage.split('/uploads/')[1];
  }

  fetch('/add_to_cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      name: productName,
      price: productPrice,
      image: cleanImage,
      color: color,
      size: size,
      quantity: quantity,
      seller_email: currentProductData.sellerEmail,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = '/checkout';
      } else {
        showNotification(data.message || 'Error processing checkout', 'error');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      showNotification('Error processing checkout', 'error');
    });
}

function handleWishlistClick() {
  addToWishlist(currentProductData.id, currentProductData.name, currentProductData.price, currentProductData.image);
}

function addToWishlist(productId, productName, productPrice, productImage, sellerEmail) {
  if (!productId) {
    showNotification('Product information missing', 'error');
    return;
  }

  fetch('/add-to-wishlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      name: productName,
      price: productPrice,
      image: productImage,
      seller_email: sellerEmail,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification('Added to wishlist!', 'success');
        updateWishlistCount();
        loadWishlistPreview();
      } else {
        showNotification(data.message || 'Error adding to wishlist', 'error');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      showNotification('Error adding to wishlist', 'error');
    });
}

function shareProduct() {
  const productName = currentProductData.name;
  const shareUrl = window.location.href;

  if (navigator.share) {
    navigator.share({
      title: productName,
      url: shareUrl,
    }).catch((error) => {
      console.log('Error sharing:', error);
      copyShareLink();
    });
  } else {
    copyShareLink();
  }
}

function copyShareLink() {
  const shareUrl = window.location.href;
  navigator.clipboard.writeText(shareUrl).then(() => {
    showNotification('Link copied to clipboard!', 'success');
  }).catch(() => {
    showNotification('Failed to copy link', 'error');
  });
}

function visitSellerStore() {
  const sellerEmail = currentProductData.sellerEmail;
  
  if (sellerEmail && sellerEmail.trim()) {
    window.location.href = `/view_seller/${encodeURIComponent(sellerEmail)}`;
  } else {
    showNotification('Seller information not available', 'error');
  }
}

function changeImage(imagePath) {
  const mainImage = document.getElementById('mainProductImage');
  if (mainImage) {
    mainImage.src = imagePath;
  }
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  let icon = '';
  switch(type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i> ';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle"></i> ';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i> ';
      break;
    case 'info':
      icon = '<i class="fas fa-info-circle"></i> ';
      break;
  }
  
  notification.innerHTML = icon + message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}


/* ============================================================
   REVIEWS SYSTEM
   ============================================================ */

let currentRating = 0;
let allReviews = [];
let displayedReviews = 0;
const reviewsPerPage = 5;
const productId = window.location.pathname.split('/').pop();

// Initialize reviews on page load
document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
    
    // Character counter for review text
    const reviewText = document.getElementById('reviewText');
    if (reviewText) {
        reviewText.addEventListener('input', function() {
            document.getElementById('charCount').textContent = this.value.length;
        });
    }
});

// Load reviews from API
async function loadReviews() {
    try {
        const response = await fetch(`/api/product_review/${productId}`);
        const data = await response.json();
        
        if (data.success) {
            allReviews = data.reviews || [];
            displayedReviews = 0;
            updateRatingSummary();
            displayReviews();
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Update rating summary
function updateRatingSummary() {
    if (allReviews.length === 0) {
        document.getElementById('averageRating').textContent = '0.0';
        document.getElementById('totalReviews').textContent = '0 reviews';
        return;
    }
    
    // Calculate average rating
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = (totalRating / allReviews.length).toFixed(1);
    
    // Update average rating display
    document.getElementById('averageRating').textContent = avgRating;
    document.getElementById('totalReviews').textContent = `${allReviews.length} review${allReviews.length !== 1 ? 's' : ''}`;
    
    // Update star display
    updateStarDisplay('averageStars', parseFloat(avgRating));
    
    // Calculate rating breakdown
    const ratingCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    allReviews.forEach(review => {
        ratingCounts[review.rating]++;
    });
    
    // Update rating bars
    for (let i = 1; i <= 5; i++) {
        const percentage = (ratingCounts[i] / allReviews.length * 100).toFixed(0);
        document.getElementById(`bar${i}`).style.width = `${percentage}%`;
        document.getElementById(`percent${i}`).textContent = `${percentage}%`;
    }
}

// Update star display
function updateStarDisplay(elementId, rating) {
    const container = document.getElementById(elementId);
    const stars = container.querySelectorAll('i');
    
    stars.forEach((star, index) => {
        if (index < Math.floor(rating)) {
            star.className = 'fas fa-star';
        } else if (index < rating) {
            star.className = 'fas fa-star-half-alt';
        } else {
            star.className = 'far fa-star';
        }
    });
}

// Display reviews
function displayReviews() {
    const reviewsList = document.getElementById('reviewsList');
    const noReviews = document.getElementById('noReviews');
    const loadMoreSection = document.getElementById('loadMoreSection');
    
    if (allReviews.length === 0) {
        noReviews.style.display = 'block';
        loadMoreSection.style.display = 'none';
        return;
    }
    
    noReviews.style.display = 'none';
    
    // Clear existing reviews
    reviewsList.innerHTML = '';
    
    // Display reviews up to current page
    const reviewsToShow = allReviews.slice(0, displayedReviews + reviewsPerPage);
    displayedReviews = reviewsToShow.length;
    
    reviewsToShow.forEach(review => {
        const reviewCard = createReviewCard(review);
        reviewsList.appendChild(reviewCard);
    });
    
    // Show/hide load more button
    if (displayedReviews < allReviews.length) {
        loadMoreSection.style.display = 'block';
    } else {
        loadMoreSection.style.display = 'none';
    }
}

// Create review card element
function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.setAttribute('data-review-id', review.id);
    
    // Get reviewer initials
    const initials = review.user_name ? review.user_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    
    // Format date
    const date = new Date(review.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create stars HTML
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<i class="${i <= review.rating ? 'fas' : 'far'} fa-star"></i>`;
    }
    
    // Verified badge
    const verifiedBadge = review.verified_purchase ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified Purchase</span>' : '';
    
    card.innerHTML = `
        <div class="review-header">
            <div class="reviewer-info">
                <div class="reviewer-avatar">${initials}</div>
                <div class="reviewer-details">
                    <div class="reviewer-name">${review.user_name || 'Anonymous'}${verifiedBadge}</div>
                    <div class="review-date">${date}</div>
                </div>
            </div>
            <div class="review-rating">
                ${starsHTML}
            </div>
        </div>
        <div class="review-content">
            ${review.title ? `<div class="review-title">${review.title}</div>` : ''}
            <div class="review-text">${review.review_text}</div>
        </div>
        <div class="review-actions">
            <button class="review-action-btn ${review.user_voted ? 'active' : ''}" onclick="voteHelpful('${review.id}', this)">
                <i class="fas fa-thumbs-up"></i>
                <span>Helpful</span>
                <span class="helpful-count">(${review.helpful_count || 0})</span>
            </button>
            <button class="review-action-btn" onclick="showReplyForm('${review.id}')">
                <i class="fas fa-reply"></i>
                <span>Reply</span>
            </button>
        </div>
        ${review.replies && review.replies.length > 0 ? createRepliesHTML(review.replies) : ''}
    `;
    
    return card;
}

// Create replies HTML
function createRepliesHTML(replies) {
    let html = '<div class="review-replies">';
    
    replies.forEach(reply => {
        const date = new Date(reply.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const sellerBadge = reply.is_seller ? '<span class="seller-badge">Seller</span>' : '';
        
        html += `
            <div class="review-reply">
                <div class="reply-header">
                    <span class="reply-author">${reply.user_name || 'Anonymous'}</span>
                    ${sellerBadge}
                    <span class="reply-date">${date}</span>
                </div>
                <div class="reply-text">${reply.reply_text}</div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Sort reviews
function sortReviews(sortBy) {
    switch(sortBy) {
        case 'recent':
            allReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'helpful':
            allReviews.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
            break;
        case 'highest':
            allReviews.sort((a, b) => b.rating - a.rating);
            break;
        case 'lowest':
            allReviews.sort((a, b) => a.rating - b.rating);
            break;
    }
    
    displayedReviews = 0;
    displayReviews();
}

// Load more reviews
function loadMoreReviews() {
    displayReviews();
}

// Open review modal
function openReviewModal() {
    // Check if user is logged in
    const userEmail = document.querySelector('.user-email span');
    if (!userEmail || userEmail.textContent === 'Guest') {
        Toast.warning('Please login to write a review');
        return;
    }
    
    document.getElementById('reviewModal').classList.add('show');
    resetReviewForm();
}

// Close review modal
function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('show');
    resetReviewForm();
}

// Reset review form
function resetReviewForm() {
    document.getElementById('reviewForm').reset();
    currentRating = 0;
    document.getElementById('ratingValue').value = '';
    document.getElementById('charCount').textContent = '0';
    
    // Reset stars
    const stars = document.querySelectorAll('#starRatingInput i');
    stars.forEach(star => {
        star.className = 'far fa-star';
    });
}

// Set rating
function setRating(rating) {
    currentRating = rating;
    document.getElementById('ratingValue').value = rating;
    
    // Update star display
    const stars = document.querySelectorAll('#starRatingInput i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star active';
        } else {
            star.className = 'far fa-star';
        }
    });
}

// Submit review
async function submitReview(event) {
    event.preventDefault();
    
    if (currentRating === 0) {
        Toast.warning('Please select a rating');
        return;
    }
    
    const formData = {
        product_id: productId,
        rating: currentRating,
        title: document.getElementById('reviewTitle').value,
        review_text: document.getElementById('reviewText').value
    };
    
    try {
        const response = await fetch('/api/product_review/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            Toast.success('Review submitted successfully!');
            closeReviewModal();
            loadReviews(); // Reload reviews
        } else {
            Toast.error(data.message || 'Failed to submit review');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        Toast.error('Error submitting review');
    }
}

// Vote helpful
async function voteHelpful(reviewId, button) {
    try {
        const response = await fetch(`/api/product_review/${reviewId}/helpful`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update button state
            button.classList.toggle('active');
            
            // Update count
            const countSpan = button.querySelector('.helpful-count');
            const currentCount = parseInt(countSpan.textContent.match(/\d+/)[0]);
            countSpan.textContent = `(${data.helpful_count || currentCount + 1})`;
            
            Toast.success(data.message || 'Thank you for your feedback!');
        } else {
            Toast.error(data.message || 'Failed to vote');
        }
    } catch (error) {
        console.error('Error voting:', error);
        Toast.error('Error submitting vote');
    }
}

// Show reply form (placeholder for Phase 6)
function showReplyForm(reviewId) {
    Toast.info('Reply functionality coming soon!');
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('reviewModal');
    if (event.target === modal) {
        closeReviewModal();
    }
});
