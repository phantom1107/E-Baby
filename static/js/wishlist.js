/* ============================================================
   WISHLIST - MODERN FUNCTIONALITY
   ============================================================ */

let currentWishlistProduct = null;
let selectedItemsQueue = [];
let currentQueueIndex = 0;

/**
 * Update wishlist total price
 */
function updateTotalPrice() {
  let totalPrice = 0;

  document.querySelectorAll(".item-card-modern").forEach((item) => {
    const price = parseFloat(
      item.querySelector(".item-price")?.textContent?.replace("₱", "") || 0
    );
    totalPrice += price;
  });

  // Update the totals in all elements
  const totalElements = document.querySelectorAll(
    ".total-amount, .total-price"
  );
  totalElements.forEach((el) => {
    el.textContent = `₱${totalPrice.toFixed(2)}`;
  });

  // Update item count
  const itemCountEl = document.getElementById("item-count");
  if (itemCountEl) {
    itemCountEl.textContent =
      document.querySelectorAll(".item-card-modern").length;
  }
}

/**
 * Update checkbox states and show/hide "Add Selected" button
 */
function updateCheckboxStates() {
  const allCheckboxes = document.querySelectorAll(".item-checkbox");
  const selectAllCheckbox = document.getElementById("select-all");
  const addSelectedBtn = document.getElementById("addSelectedBtn");
  
  const allChecked = Array.from(allCheckboxes).every((cb) => cb.checked);
  const anyChecked = Array.from(allCheckboxes).some((cb) => cb.checked);

  if (selectAllCheckbox) {
    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = anyChecked && !allChecked;
  }

  // Show/hide Add Selected button
  if (addSelectedBtn) {
    addSelectedBtn.style.display = anyChecked ? 'inline-block' : 'none';
  }
}

/**
 * Toggle select all checkboxes
 */
function toggleSelectAll() {
  const selectAllCheckbox = document.getElementById("select-all");
  const itemCheckboxes = document.querySelectorAll(".item-checkbox");

  itemCheckboxes.forEach((checkbox) => {
    checkbox.checked = selectAllCheckbox.checked;
  });
  
  updateCheckboxStates();
}

/**
 * Remove single item from wishlist
 */
function removeFromWishlist(itemId) {
  fetch("/wishlist/remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids: [itemId] }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const card = document.querySelector(`[data-item-id="${itemId}"]`);
        if (card) {
          card.style.animation = "fadeOut 0.3s ease forwards";
          setTimeout(() => {
            card.remove();
            updateTotalPrice();

            // Reload page if all items removed
            if (document.querySelectorAll(".item-card-modern").length === 0) {
              setTimeout(() => location.reload(), 500);
            }
          }, 300);
        }
        showNotification("Item removed from wishlist", "success");
      } else {
        showNotification(data.message || data.error || "Error removing item", "error");
      }
    })
    .catch((err) => {
      console.error("Error:", err);
      showNotification("Error removing item from wishlist", "error");
    });
}

/**
 * Handle add to cart button click - fetch product and show modal
 */
function handleAddToCart(button, productId, wishlistId) {
  // Get seller_email from button data attribute as fallback
  const sellerEmailFromButton = button.dataset.sellerEmail;
  console.log(`Adding product ${productId} with seller_email from button: ${sellerEmailFromButton}`);
  
  // Fetch product details first
  fetch(`/get_product/${productId}`)
    .then((res) => res.json())
    .then((product) => {
      if (product) {
        // Use seller_email from product, fallback to button data
        if (!product.seller_email && sellerEmailFromButton) {
          product.seller_email = sellerEmailFromButton;
        }
        showAddToCartModalForProduct(product, wishlistId, false);
      } else {
        showNotification("Product not found", "error");
      }
    })
    .catch((err) => {
      console.error("Error:", err);
      showNotification("Error loading product details", "error");
    });
}

/**
 * Show add to cart modal for a single product
 */
function showAddToCartModalForProduct(product, wishlistId, isQueued = false, queueIndex = 0, queueTotal = 0) {
  currentWishlistProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    seller_email: product.seller_email,
    wishlistId: wishlistId,
    stock: product.quantity || 999,
    hasSizes: false,
    isQueued: isQueued,
    queueIndex: queueIndex,
    queueTotal: queueTotal,
    variants: []
  };

  // Display product image in modal
  const imageElement = document.getElementById('modalProductImage');
  if (product.image && (product.image.startsWith('http://') || product.image.startsWith('https://') || product.image.startsWith('//'))) {
    // Cloudinary or external URL - use as-is
    imageElement.src = product.image;
  } else if (product.image && product.image.startsWith('/')) {
    // Already has leading slash - use as-is
    imageElement.src = product.image;
  } else if (product.image) {
    // Local file without leading slash - add prefix
    imageElement.src = '/static/uploads/' + product.image;
  } else {
    // No image - use default
    imageElement.src = '/static/images/defaults/product-default.png';
  }
  imageElement.onerror = function() {
    this.src = '/static/images/defaults/product-default.png';
  };
  
  // Display product info
  const modalProductInfo = document.getElementById('modalProductInfo');
  let queueText = '';
  if (isQueued) {
    queueText = `<div style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">Item ${queueIndex + 1} of ${queueTotal}</div>`;
  }
  
  modalProductInfo.innerHTML = `
    ${queueText}
    <h3>${product.name}</h3>
    <p style="font-size: 1.3rem; color: #7c3aed; font-weight: bold;">₱${parseFloat(product.price).toFixed(2)}</p>
  `;

  // Load variants from API
  fetch(`/api/product_variants/${product.id}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.variants && data.variants.length > 0) {
        currentWishlistProduct.variants = data.variants;
        
        // Extract unique colors and sizes
        const colorArray = [...new Set(data.variants.map(v => v.color))];
        const sizeArray = [...new Set(data.variants.map(v => v.size))];

        // Populate color select
        const colorSelect = document.getElementById('colorSelect');
        colorSelect.innerHTML = '<option value="">Select a color</option>';
        colorArray.forEach(color => {
          const option = document.createElement('option');
          option.value = color;
          option.textContent = color;
          colorSelect.appendChild(option);
        });

        // Populate size select
        const sizeSelect = document.getElementById('sizeSelect');
        const sizeGroup = document.getElementById('sizeGroupContainer');
        sizeSelect.innerHTML = '<option value="">Select a size</option>';

        if (sizeArray.length > 0) {
          currentWishlistProduct.hasSizes = true;
          sizeArray.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            sizeSelect.appendChild(option);
          });
          sizeGroup.style.display = 'block';
          
          // Setup change listeners
          colorSelect.addEventListener('change', updateWishlistStockFromVariant);
          sizeSelect.addEventListener('change', updateWishlistStockFromVariant);
        } else {
          currentWishlistProduct.hasSizes = false;
          sizeGroup.style.display = 'none';
          
          // Setup change listener for color only
          colorSelect.addEventListener('change', updateWishlistStockFromVariant);
        }

        // Reset quantity
        const quantityInput = document.getElementById('quantityInput');
        quantityInput.value = 1;
        quantityInput.max = 10;
        
        // Update stock warning
        const stockWarning = document.getElementById('stockWarning');
        stockWarning.textContent = `(Select variant to see stock)`;
        stockWarning.style.color = '#666';

        // Show modal
        const modal = document.getElementById('addToCartModal');
        modal.style.visibility = 'visible';
        modal.style.display = 'flex';
      } else {
        showNotification('No variants available for this product', 'error');
      }
    })
    .catch(error => {
      console.error('Error loading variants:', error);
      showNotification('Error loading product variants', 'error');
    });
}

function updateWishlistStockFromVariant() {
  if (!currentWishlistProduct) return;
  
  const color = document.getElementById('colorSelect').value;
  const sizeEl = document.getElementById('sizeSelect');
  const size = sizeEl ? sizeEl.value : '';
  
  if (!color) {
    document.getElementById('stockWarning').textContent = 'Select a color to see stock';
    return;
  }
  
  if (currentWishlistProduct.hasSizes && !size) {
    document.getElementById('stockWarning').textContent = 'Select a size to see stock';
    return;
  }
  
  // Find matching variant
  const variant = currentWishlistProduct.variants.find(v => 
    v.color === color && (v.size === size || !currentWishlistProduct.hasSizes)
  );
  
  if (variant) {
    const quantityInput = document.getElementById('quantityInput');
    quantityInput.max = Math.min(10, variant.stock);
    quantityInput.value = 1;
    
    const stockWarning = document.getElementById('stockWarning');
    stockWarning.textContent = `(Available: ${variant.stock})`;
    stockWarning.style.color = variant.stock <= 5 ? '#e74c3c' : '#666';
    
    currentWishlistProduct.stock = variant.stock;
  }
}

/**
 * Close add to cart modal
 */
function closeAddToCartModal() {
  const modal = document.getElementById('addToCartModal');
  modal.style.visibility = 'hidden';
  modal.style.display = 'none';
  currentWishlistProduct = null;
}

/**
 * Confirm add to cart from wishlist (single item or queued)
 */
function handleConfirmAddToCart() {
  if (!currentWishlistProduct) {
    showNotification("Product not found", "error");
    return;
  }

  const color = document.getElementById('colorSelect').value;
  const sizeEl = document.getElementById('sizeSelect');
  const size = sizeEl ? sizeEl.value : '';
  const quantity = parseInt(document.getElementById('quantityInput').value);

  // Validation
  if (!color) {
    showNotification('Please select a color', 'warning');
    return;
  }

  if (quantity > currentWishlistProduct.stock) {
    showNotification(`Only ${currentWishlistProduct.stock} items available in stock`, 'warning');
    document.getElementById('quantityInput').value = currentWishlistProduct.stock;
    return;
  }

  if (currentWishlistProduct.hasSizes && !size) {
    showNotification('Please select a size', 'warning');
    return;
  }

  // Add to cart
  const imageToSend = currentWishlistProduct.image.startsWith('/') 
    ? currentWishlistProduct.image.replace('/static/uploads/', '').replace('/static/', '')
    : currentWishlistProduct.image;

  const cartData = {
    product_id: currentWishlistProduct.id,
    name: currentWishlistProduct.name,
    price: currentWishlistProduct.price,
    image: imageToSend,
    color: color,
    size: size,
    quantity: quantity,
    seller_email: currentWishlistProduct.seller_email,
  };

  console.log('Sending to cart:', cartData);

  console.log('====== ADDING TO CART ======');
  console.log('Cart data:', cartData);

  fetch('/add_to_cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cartData),
  })
    .then((res) => {
      console.log('Got response, status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      return res.json();
    })
    .then((data) => {
      console.log('Response data:', data);
      console.log('currentWishlistProduct before check:', currentWishlistProduct);
      
      if (data.outOfStock) {
        showNotification('❌ This product is out of stock and cannot be added to your cart. Please choose another product.', 'error');
      } else if (data.insufficientStock) {
        showNotification(`❌ Not enough stock available.\n\nOnly ${data.available} item(s) available. Please reduce your quantity.`, 'warning');
      } else if (data.success) {
        // Save isQueued flag before closing modal (which nullifies currentWishlistProduct)
        const isQueued = currentWishlistProduct && currentWishlistProduct.isQueued;
        
        console.log('isQueued:', isQueued);
        console.log('currentQueueIndex:', currentQueueIndex);
        console.log('selectedItemsQueue.length:', selectedItemsQueue.length);
        
        closeAddToCartModal();
        showNotification('Item added to cart!', 'success');
        
        // If this is a queued item, show next one
        if (isQueued) {
          console.log('Processing next queued item');
          currentQueueIndex++;
          console.log('Incremented to:', currentQueueIndex);
          // Add delay to ensure modal closes before showing next one
          setTimeout(() => {
            console.log('Calling showNextItemModal with index:', currentQueueIndex);
            showNextItemModal();
          }, 800);
        } else {
          // Not queued - reload after showing success
          console.log('Reloading page in 1.5 seconds');
          setTimeout(() => {
            location.reload();
          }, 1500);
        }
      } else {
        console.error('Backend error:', data.message);
        showNotification(data.message || 'Error adding to cart', 'error');
      }
    })
    .catch((err) => {
      console.error('✗ Fetch error:', err);
      showNotification('Error adding to cart: ' + err.message, 'error');
    });
}

/**
 * Add selected items to cart with modals for each
 */
function addSelectedToCart() {
  const selectedItems = [];

  document.querySelectorAll(".item-card-modern").forEach((item) => {
    const checkbox = item.querySelector(".item-checkbox");
    if (checkbox && checkbox.checked) {
      selectedItems.push({
        productId: parseInt(item.getAttribute("data-product-id")),
        wishlistId: parseInt(item.getAttribute("data-item-id")),
      });
    }
  });

  if (selectedItems.length === 0) {
    showNotification("Please select items to add to cart", "warning");
    return;
  }

  // Queue all selected items and start the modal sequence
  selectedItemsQueue = selectedItems;
  currentQueueIndex = 0;
  showNextItemModal();
}

/**
 * Add all items to cart with modals for each
 */
function addAllToCartWithModals() {
  const items = document.querySelectorAll(".item-card-modern");
  if (items.length === 0) {
    showNotification("No items to add", "warning");
    return;
  }

  const allItems = [];

  items.forEach((card) => {
    allItems.push({
      productId: parseInt(card.getAttribute("data-product-id")),
      wishlistId: parseInt(card.getAttribute("data-item-id")),
    });
  });

  // Queue all items and start the modal sequence
  selectedItemsQueue = allItems;
  currentQueueIndex = 0;
  showNextItemModal();
}

/**
 * Show modal for the next item in the queue
 */
function showNextItemModal() {
  console.log('showNextItemModal called with currentQueueIndex:', currentQueueIndex);
  console.log('selectedItemsQueue.length:', selectedItemsQueue.length);
  
  if (currentQueueIndex >= selectedItemsQueue.length) {
    // All items processed
    console.log('All items processed!');
    showNotification(
      `Added ${selectedItemsQueue.length} item(s) to cart!`,
      "success"
    );
    selectedItemsQueue = [];
    currentQueueIndex = 0;
    setTimeout(() => {
      location.reload();
    }, 1500);
    return;
  }

  const item = selectedItemsQueue[currentQueueIndex];
  console.log('Processing item:', item);

  // Fetch full product details
  fetch(`/get_product/${item.productId}`)
    .then((res) => res.json())
    .then((product) => {
      console.log('Fetched product:', product);
      if (product) {
        console.log('Showing modal for queued product. Queue index:', currentQueueIndex, 'Total:', selectedItemsQueue.length);
        showAddToCartModalForProduct(product, item.wishlistId, true, currentQueueIndex, selectedItemsQueue.length);
      } else {
        showNotification("Product not found", "error");
        currentQueueIndex++;
        showNextItemModal();
      }
    })
    .catch((err) => {
      console.error("Error fetching product:", err);
      showNotification("Error loading product", "error");
      currentQueueIndex++;
      showNextItemModal();
    });
}

/**
 * Delete selected items from wishlist
 */
function deleteSelectedItems() {
  const selectedIds = [];

  document.querySelectorAll(".item-card-modern").forEach((item) => {
    const checkbox = item.querySelector(".item-checkbox");
    if (checkbox && checkbox.checked) {
      const itemId = item.getAttribute("data-item-id");
      if (itemId) {
        selectedIds.push(parseInt(itemId));
      }
    }
  });

  if (selectedIds.length === 0) {
    showNotification("Please select items to delete", "warning");
    return;
  }

  if (!confirm(`Delete ${selectedIds.length} item(s) from wishlist?`)) {
    return;
  }

  selectedIds.forEach((id) => removeFromWishlist(id));
}

/**
 * Search functionality
 */
function performSearch() {
  const query = document.getElementById("search-input")?.value;
  if (query && query.trim()) {
    window.location.href = `/search?query=${encodeURIComponent(query)}`;
  } else {
    showNotification("Please enter a search term", "warning");
  }
}

/**
 * Show notification toast
 */
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${
          type === "success"
            ? "#10B981"
            : type === "error"
            ? "#EF4444"
            : type === "warning"
            ? "#F59E0B"
            : "#3B82F6"
        };
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease forwards;
        font-weight: 600;
        max-width: 400px;
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// PROFILE DROPDOWN
// ============================================================

function toggleProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) {
    dropdown.classList.toggle("active");
  }
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("profileDropdown");
  const profileBtn = document.querySelector(".profile-btn");

  if (
    dropdown &&
    profileBtn &&
    !profileBtn.contains(event.target) &&
    !dropdown.contains(event.target)
  ) {
    dropdown.classList.remove("active");
  }
});

/**
 * Initialize event listeners
 */
document.addEventListener("DOMContentLoaded", function () {
  // Select all checkbox
  const selectAllCheckbox = document.getElementById("select-all");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", toggleSelectAll);
  }

  // Individual item checkboxes
  document.querySelectorAll(".item-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      updateCheckboxStates();
    });
  });

  // Search input (Enter key)
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch();
      }
    });
  }

  // Initialize total price
  updateTotalPrice();

  // Add animation styles
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(400px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(400px);
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-10px);
            }
        }
    `;
  document.head.appendChild(style);

  // Close modal when clicking outside
  const modal = document.getElementById('addToCartModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAddToCartModal();
      }
    });
  }

  // Initialize checkbox states
  updateCheckboxStates();
});
