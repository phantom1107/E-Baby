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
          const imagePath = item.image && !item.image.startsWith('/') ? '/static/uploads/' + item.image : (item.image || '/static/images/defaults/product-default.png');
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
