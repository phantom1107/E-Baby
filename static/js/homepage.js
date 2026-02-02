/* ============================================================
   NEW HOMEPAGE - JAVASCRIPT FUNCTIONALITY
   ============================================================ */

// Check if user is logged in by checking for the email badge
let isLoggedIn = document.querySelector('.user-email span') && document.querySelector('.user-email span').textContent !== 'Guest';
let currentProduct = null;
let allFeaturedProducts = [];
let allNewArrivalsProducts = [];

// Update isLoggedIn after page is fully loaded
function checkIfLoggedIn() {
    const emailSpan = document.querySelector('.user-email span');
    return emailSpan && emailSpan.textContent !== 'Guest';
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    updateWishlistCount();
    loadAllProducts();
    loadFeaturedProducts();
    loadNewArrivalsProducts();
    initializeCarousel();
    setupDropdownClosers();
    
    // Show guest welcome modal if not logged in (check again on DOM ready)
    setTimeout(() => {
        isLoggedIn = checkIfLoggedIn();
        if (!isLoggedIn) {
            showGuestWelcomeModal();
        }
    }, 500);
    
    // Add to cart modal click outside handler
    const modal = document.getElementById('addToCartModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeAddToCartModal();
            }
        });
    }
    
    // Guest support modal click outside handler
    const guestModal = document.getElementById('guestSupportModal');
    if (guestModal) {
        guestModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    }

    // Guest welcome modal click outside handler
    const guestWelcomeModal = document.getElementById('guestWelcomeModal');
    if (guestWelcomeModal) {
        guestWelcomeModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeGuestWelcomeModal();
            }
        });
    }
    
    // Allow Enter key to open guest chat
    const guestNameInput = document.getElementById('guestName');
    if (guestNameInput) {
        guestNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                startGuestChat();
            }
        });
    }
    
    // Close search dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const searchContainer = document.querySelector('.search-container');
        const searchDropdown = document.getElementById('searchDropdown');
        if (searchContainer && !searchContainer.contains(event.target)) {
            searchDropdown.style.display = 'none';
        }
    });
});

// ============================================================
// SEARCH FUNCTIONALITY WITH DROPDOWN
// ============================================================

let allProducts = [];
let searchTimeout;

function loadAllProducts() {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            allProducts = data || [];
        })
        .catch(error => console.error('Error loading products:', error));
}

function handleSearchInput(event) {
    const query = event.target.value.trim();
    const dropdown = document.getElementById('searchDropdown');
    const dropdownContent = document.getElementById('dropdownContent');
    
    clearTimeout(searchTimeout);
    
    if (!query || query.length < 2) {
        dropdown.style.display = 'none';
        return;
    }
    
    searchTimeout = setTimeout(() => {
        performLiveSearch(query, dropdownContent, dropdown);
    }, 300);
}

function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

function performLiveSearch(query, dropdownContent, dropdown) {
    const lowerQuery = query.toLowerCase();
    const products = allProducts.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.category.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
    
    let html = '';
    
    if (products.length === 0) {
        html = '<div class="search-dropdown-empty"><i class="fas fa-search" style="font-size: 1.5rem; margin-bottom: 10px; display: block; color: #cbd5e1;"></i>No products found</div>';
    } else {
        html += '<div class="search-dropdown-category"><i class="fas fa-box"></i> Products</div>';
        products.forEach(product => {
            html += `
                <div class="search-dropdown-item product" onclick="goToProduct(${product.id})">
                    <div class="search-dropdown-item-icon">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="search-dropdown-item-content">
                        <div class="search-dropdown-item-title">${product.name}</div>
                        <div class="search-dropdown-item-subtitle">${product.category}</div>
                    </div>
                    <div class="search-dropdown-item-price">₱${product.price}</div>
                </div>
            `;
        });
    }
    
    html += `
        <div class="search-dropdown-view-all" onclick="performSearch()">
            <i class="fas fa-arrow-right"></i> View all results for "${query}"
        </div>
    `;
    
    dropdownContent.innerHTML = html;
    dropdown.style.display = 'block';
}

function goToProduct(productId) {
    window.location.href = `/product_details/${productId}`;
}

function performSearch() {
    const query = document.getElementById('search-input').value;
    if (query) {
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
    }
}

// ============================================================
// DROPDOWN TOGGLES
// ============================================================

function toggleWishlistDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('wishlistDropdown');
    const cartDropdown = document.getElementById('cartDropdown');
    
    cartDropdown.classList.remove('show');
    loadWishlistPreview();
    dropdown.classList.toggle('show');
}

function toggleCartDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('cartDropdown');
    const wishlistDropdown = document.getElementById('wishlistDropdown');
    
    wishlistDropdown.classList.remove('show');
    loadCartPreview();
    dropdown.classList.toggle('show');
}

function toggleProfileDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdowns when clicking outside
function setupDropdownClosers() {
    document.addEventListener('click', function(event) {
        const wishlistDropdown = document.getElementById('wishlistDropdown');
        const cartDropdown = document.getElementById('cartDropdown');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (!event.target.closest('.wishlist-container')) {
            wishlistDropdown.classList.remove('show');
        }
        if (!event.target.closest('.cart-container')) {
            cartDropdown.classList.remove('show');
        }
        if (!event.target.closest('.profile-dropdown-container')) {
            profileDropdown.classList.remove('show');
        }
    });
}

// ============================================================
// CART FUNCTIONS
// ============================================================

function updateCartCount() {
    fetch('/get_cart_count')
        .then(response => response.json())
        .then(data => {
            document.getElementById('cartCount').textContent = data.count;
        })
        .catch(error => console.error('Error:', error));
}

function loadCartPreview() {
    fetch('/get_cart_preview')
        .then(response => response.json())
        .then(data => {
            const cartItems = document.getElementById('cartItems');
            cartItems.innerHTML = '';
            let total = 0;

            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    total += parseFloat(item.price) * parseInt(item.quantity);
                    const variantId = generateVariantId(item.product_id, item.color, item.size);
                    
                    cartItems.innerHTML += `
                        <div class="cart-item">
                            <img src="${item.image && item.image.startsWith('/') ? item.image : '/static/uploads/' + (item.image || 'default.png')}" alt="${item.name}" onerror="this.src='/static/images/defaults/product-default.png'">
                            <div class="item-details">
                                <h4>${item.name}</h4>
                                <p>₱${formatPrice(item.price)}</p>
                                <small style="color: #666; font-size: 0.8rem;">
                                    Color: ${item.color}${item.size ? ` | Size: ${item.size}` : ''}
                                </small>
                                <div class="quantity-controls">
                                    <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', -1, '${item.color}', '${item.size}', '${variantId}')" ${item.quantity <= 1 ? 'disabled' : ''}>
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <span class="quantity">${item.quantity}</span>
                                    <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', 1, '${item.color}', '${item.size}', '${variantId}')">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <button onclick="removeFromCart('${item.product_id}', '${item.color}', '${item.size}', '${variantId}')" class="remove-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                });
            } else {
                cartItems.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Your cart is empty</div>';
            }

            document.getElementById('cartTotal').textContent = '₱' + formatPrice(total);
        })
        .catch(error => console.error('Error:', error));
}

function updateCartQuantity(productId, change, color, size, variantId) {
    fetch('/update-cart-quantity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId,
            color: color,
            size: size,
            variant_id: variantId,
            change: change
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadCartPreview();
            updateCartCount();
        } else {
            alert(data.message || 'Error updating quantity');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating quantity');
    });
}

function removeFromCart(productId, color, size, variantId) {
    if (confirm('Remove this item from cart?')) {
        fetch('/remove-from-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productId,
                color: color,
                size: size,
                variant_id: variantId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadCartPreview();
                updateCartCount();
            } else {
                alert(data.message || 'Error removing item');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error removing item');
        });
    }
}

function addToCart(productId, name, price, image, color, size, quantity, sellerEmail) {
    isLoggedIn = checkIfLoggedIn();
    if (!isLoggedIn) {
        showAuthPromptModal();
        return;
    }

    const variantId = generateVariantId(productId, color, size);
    
    fetch('/add_to_cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId,
            name: name,
            price: price,
            image: image,
            color: color,
            size: size,
            quantity: parseInt(quantity),
            variant_id: variantId,
            seller_email: sellerEmail
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.outOfStock) {
            alert('❌ This product is out of stock and cannot be added to your cart. Please choose another product.');
        } else if (data.insufficientStock) {
            alert(`❌ Not enough stock available.\n\nOnly ${data.available} item(s) available. Please reduce your quantity.`);
        } else if (data.success) {
            alert('✅ Product added to cart!');
            loadCartPreview();
            updateCartCount();
            closeAddToCartModal();
        } else {
            alert(data.message || 'Error adding to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error adding to cart');
    });
}

function generateVariantId(productId, color, size) {
    return `${productId}_${color}_${size || 'nosize'}`;
}

// ============================================================
// WISHLIST FUNCTIONS
// ============================================================

function updateWishlistCount() {
    fetch('/get_wishlist_count')
        .then(response => response.json())
        .then(data => {
            document.getElementById('wishlistCount').textContent = data.count;
        })
        .catch(error => console.error('Error:', error));
}

function loadWishlistPreview() {
    fetch('/get_wishlist_preview')
        .then(response => response.json())
        .then(data => {
            const wishlistItems = document.getElementById('wishlistItems');
            wishlistItems.innerHTML = '';

            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const imagePath = item.image && !item.image.startsWith('/') ? '/static/uploads/' + item.image : (item.image || '/static/images/defaults/product-default.png');
                    wishlistItems.innerHTML += `
                        <div class="wishlist-item">
                            <img src="${imagePath}" alt="${item.name}" onerror="this.src='/static/images/defaults/product-default.png'">
                            <div class="item-details">
                                <h4>${item.name}</h4>
                                <p>₱${formatPrice(item.price)}</p>
                            </div>
                            <button class="remove-btn" onclick="removeFromWishlist(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                });
            } else {
                wishlistItems.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Your wishlist is empty</div>';
            }
        })
        .catch(error => console.error('Error:', error));
}

function addToWishlist(productId, name, price, image, sellerEmail) {
    isLoggedIn = checkIfLoggedIn();
    if (!isLoggedIn) {
        showAuthPromptModal();
        return;
    }

    fetch('/add-to-wishlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            product_id: productId,
            name: name,
            price: price,
            image: image,
            seller_email: sellerEmail
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Added to wishlist!');
            updateWishlistCount();
            loadWishlistPreview();
        } else {
            alert(data.message || 'Error adding to wishlist');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error adding to wishlist');
    });
}

function removeFromWishlist(productId) {
    if (confirm('Remove from wishlist?')) {
        fetch('/wishlist/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ids: [productId]
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadWishlistPreview();
                updateWishlistCount();
            } else {
                alert(data.message || 'Error removing from wishlist');
            }
        });
    }
}

// ============================================================
// PRODUCTS LOADING
// ============================================================

function handleAddToCart(button) {
    console.log('handleAddToCart called', button);
    isLoggedIn = checkIfLoggedIn();
    console.log('isLoggedIn:', isLoggedIn);
    if (!isLoggedIn) {
        console.log('User is guest, showing auth modal');
        showAuthPromptModal();
        return;
    }
    
    const productId = button.dataset.productId;
    const productName = button.dataset.productName;
    const productPrice = parseFloat(button.dataset.productPrice);
    const productImage = button.dataset.productImage;
    const productColors = button.dataset.productColors;
    const productSizes = button.dataset.productSizes;
    let productStock = parseInt(button.dataset.productStock);
    
    // If stock is NaN or not defined, try to get it from the element or parent
    if (isNaN(productStock)) {
        const stockElement = button.closest('.product-card')?.querySelector('.product-stock');
        if (stockElement) {
            const stockMatch = stockElement.textContent.match(/Stock: (\d+)/);
            productStock = stockMatch ? parseInt(stockMatch[1]) : 0;
        } else {
            productStock = 0;
        }
    }
    
    const sellerEmail = button.dataset.sellerEmail;
    
    console.log('Product stock value:', productStock);
    openAddToCartModal(productId, productName, productPrice, productImage, productColors, productSizes, productStock, sellerEmail);
}

function handleAddToWishlist(button) {
    console.log('handleAddToWishlist called', button);
    isLoggedIn = checkIfLoggedIn();
    console.log('isLoggedIn:', isLoggedIn);
    if (!isLoggedIn) {
        console.log('User is guest, showing auth modal');
        showAuthPromptModal();
        return;
    }
    
    const productId = button.dataset.productId;
    const productName = button.dataset.productName;
    const productPrice = parseFloat(button.dataset.productPrice);
    const productImage = button.dataset.productImage;
    const sellerEmail = button.dataset.sellerEmail;
    
    addToWishlist(productId, productName, productPrice, productImage, sellerEmail);
}

function loadFeaturedProducts() {
    // Featured products are already rendered by the backend in the template
}

function loadNewArrivalsProducts() {
    // New arrivals products are already rendered by the backend in the template
}

function renderProductsByCategory(container, type) {
    // This is handled by the backend template
}

// ============================================================
// MODAL FUNCTIONS
// ============================================================

function openAddToCartModal(productId, name, price, image, colors, sizes, stock, sellerEmail) {
    currentProduct = {
        id: productId,
        name: name,
        price: price,
        image: image,
        seller_email: sellerEmail,
        stock: stock,
        hasSizes: false,
        variants: []
    };

    // Display product image in modal with proper path handling
    const imageElement = document.getElementById('modalProductImage');
    if (image && !image.startsWith('/')) {
        imageElement.src = '/static/uploads/' + image;
    } else {
        imageElement.src = image || '/static/images/defaults/product-default.png';
    }
    imageElement.onerror = function() {
        this.src = '/static/images/defaults/product-default.png';
    };
    
    // Display product info in modal
    const modalProductInfo = document.getElementById('modalProductInfo');
    modalProductInfo.innerHTML = `
        <h3>${name}</h3>
        <p style="font-size: 1.3rem; color: var(--primary-color); font-weight: bold;">₱${formatPrice(price)}</p>
    `;

    // Load variants from API
    fetch(`/api/product_variants/${productId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.variants && data.variants.length > 0) {
                currentProduct.variants = data.variants;
                
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
                    currentProduct.hasSizes = true;
                    sizeArray.forEach(size => {
                        const option = document.createElement('option');
                        option.value = size;
                        option.textContent = size;
                        sizeSelect.appendChild(option);
                    });
                    sizeGroup.style.display = 'block';
                } else {
                    currentProduct.hasSizes = false;
                    sizeGroup.style.display = 'none';
                }
                
                // Reset quantity
                const quantityInput = document.getElementById('quantityInput');
                quantityInput.value = 1;
                quantityInput.max = 10; // Will be updated based on variant selection
                
                // Setup change listener for variant selection
                colorSelect.addEventListener('change', updateStockFromVariant);
                sizeSelect.addEventListener('change', updateStockFromVariant);
                
                // Show modal
                document.getElementById('addToCartModal').classList.add('show');
            } else {
                alert('No variants available for this product');
            }
        })
        .catch(error => {
            console.error('Error loading variants:', error);
            alert('Error loading product variants');
        });
}

function updateStockFromVariant() {
    const color = document.getElementById('colorSelect').value;
    const sizeEl = document.getElementById('sizeSelect');
    const size = sizeEl ? sizeEl.value : '';
    
    if (!color) {
        document.getElementById('stockWarning').textContent = 'Select a color to see stock';
        return;
    }
    
    if (currentProduct.hasSizes && !size) {
        document.getElementById('stockWarning').textContent = 'Select a size to see stock';
        return;
    }
    
    // Find matching variant
    const variant = currentProduct.variants.find(v => 
        v.color === color && (v.size === size || !currentProduct.hasSizes)
    );
    
    if (variant) {
        const quantityInput = document.getElementById('quantityInput');
        quantityInput.max = Math.min(10, variant.stock);
        quantityInput.value = 1;
        
        const stockWarning = document.getElementById('stockWarning');
        stockWarning.textContent = `(Available: ${variant.stock})`;
        stockWarning.style.color = variant.stock <= 5 ? '#e74c3c' : '#666';
        
        currentProduct.stock = variant.stock;
    }
}

function closeAddToCartModal() {
    document.getElementById('addToCartModal').classList.remove('show');
}

function confirmAddToCart() {
    const color = document.getElementById('colorSelect').value;
    const sizeEl = document.getElementById('sizeSelect');
    const size = sizeEl ? sizeEl.value : '';
    const quantity = parseInt(document.getElementById('quantityInput').value);

    if (!color || !quantity) {
        alert('Please select a color and quantity');
        return;
    }

    if (quantity > currentProduct.stock) {
        alert(`Only ${currentProduct.stock} items available in stock`);
        document.getElementById('quantityInput').value = currentProduct.stock;
        return;
    }

    if (currentProduct.hasSizes && !size) {
        alert('Please select a size');
        return;
    }

    addToCart(
        currentProduct.id,
        currentProduct.name,
        currentProduct.price,
        currentProduct.image,
        color,
        size,
        quantity,
        currentProduct.seller_email
    );
    
    closeAddToCartModal();
}

// ============================================================
// CAROUSEL FUNCTIONS
// ============================================================

let currentSlide = 0;
let totalSlides = 1;

function initializeCarousel() {
    const track = document.getElementById('carouselTrack');
    if (track) {
        totalSlides = track.children.length;
        updateCarouselDots();
    }
}

function prevSlide() {
    currentSlide = currentSlide > 0 ? currentSlide - 1 : totalSlides - 1;
    updateCarousel();
}

function nextSlide() {
    currentSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0;
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    if (track) {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    updateCarouselDots();
}

function updateCarouselDots() {
    const dotsContainer = document.getElementById('carouselDots');
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = `dot ${i === currentSlide ? 'active' : ''}`;
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
    }
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

// Auto-rotate carousel every 5 seconds
setInterval(() => {
    nextSlide();
}, 5000);

// ============================================================
// CATEGORY FILTERING
// ============================================================

function filterByCategory(category) {
    const section = document.getElementById('categoryProductsSection');
    const container = document.getElementById('categoryProductsContainer');
    const categoryTitle = document.getElementById('categoryTitle');
    
    categoryTitle.textContent = category + ' - Products';
    section.style.display = 'block';
    
    // Scroll to the filtered section
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Show loading state
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #7C3AED;"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>';
    
    // Load products for this category using new simplified API
    fetch(`/api/category/${encodeURIComponent(category)}`)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Category response:', data);
            
            if (!data.products || data.products.length === 0) {
                container.innerHTML = `
                    <div class="no-products">
                        <i class="fas fa-inbox"></i>
                        <h3>No Products Found</h3>
                        <p>No products available in this category</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '';
            
            if (data.products && data.products.length > 0) {
                // Group by seller
                const sellerGroups = {};
                data.products.forEach(product => {
                    const sellerName = `${product.first_name} ${product.last_name}`;
                    if (!sellerGroups[sellerName]) {
                        sellerGroups[sellerName] = [];
                    }
                    sellerGroups[sellerName].push(product);
                });

                // Render by seller
                let sellerIndex = 0;
                Object.entries(sellerGroups).forEach(([sellerName, products]) => {
                    const gridId = `grid-seller-${sellerIndex}`;
                    const sellerSection = document.createElement('div');
                    sellerSection.className = 'seller-group';
                    sellerSection.innerHTML = `
                        <div class="seller-header">
                            <h3>${sellerName}</h3>
                            <a href="/view_seller?email=${encodeURIComponent(products[0].seller_email)}" class="store-btn">
                                <i class="fas fa-store"></i> Visit Store
                            </a>
                        </div>
                        <div class="products-grid" id="${gridId}"></div>
                    `;
                    container.appendChild(sellerSection);

                    const grid = document.getElementById(gridId);
                    products.forEach(product => {
                        const imagePath = product.image && !product.image.startsWith('/') ? '/static/uploads/' + product.image : (product.image || '/static/images/defaults/product-default.png');
                        const stock = product.quantity || 999;
                        
                        const productHTML = `
                            <div class="product-card">
                                <div class="product-image">
                                    <img src="${imagePath}" alt="${product.name}" onerror="this.src='/static/images/defaults/product-default.png'">
                                    <div class="product-actions">
                                        <button type="button" class="action-btn add-to-cart" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}" data-product-image="${imagePath}" data-product-colors="${product.color || ''}" data-product-sizes="${product.size || ''}" data-product-stock="${stock}" data-seller-email="${product.seller_email}" onclick="handleAddToCart(this)">
                                            <i class="fas fa-shopping-cart"></i> Add to Cart
                                        </button>
                                        <button type="button" class="action-btn wishlist" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}" data-product-image="${imagePath}" onclick="handleAddToWishlist(this)">
                                            <i class="fas fa-heart"></i> Wishlist
                                        </button>
                                        <button type="button" class="action-btn view-details" onclick="viewProductDetails(${product.id})">
                                            <i class="fas fa-eye"></i> View Details
                                        </button>
                                    </div>
                                </div>
                                <div class="product-info">
                                    <h4 class="product-name">${product.name}</h4>
                                    <p class="product-price">₱${formatPrice(product.price)}</p>
                                    <p class="product-stock"><i class="fas fa-box"></i> Stock: ${stock}</p>
                                </div>
                            </div>
                        `;
                        
                        grid.innerHTML += productHTML;
                    });
                    
                    sellerIndex++;
                });
            } else {
                container.innerHTML = `
                    <div class="no-products">
                        <i class="fas fa-inbox"></i>
                        <h3>No Products Found</h3>
                        <p>No products available in this category</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error in filterByCategory:', error);
            console.error('Error details:', error.message);
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;"><i class="fas fa-exclamation-triangle"></i><br>Error loading products. Please try again.</div>';
        });
}

function closeCategoryFilter() {
    document.getElementById('categoryProductsSection').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function isProductNew(createdAt) {
    // Check if product was created in the last 1-2 days
    if (!createdAt) return false;
    
    const productDate = new Date(createdAt);
    const currentDate = new Date();
    const daysDifference = (currentDate - productDate) / (1000 * 60 * 60 * 24);
    
    return daysDifference <= 2;
}

// ============================================================
// GUEST SUPPORT FUNCTIONS
// ============================================================

function openGuestSupportModal() {
    document.getElementById('guestSupportModal').classList.add('show');
    document.getElementById('guestName').focus();
}

function closeGuestSupportModal() {
    document.getElementById('guestSupportModal').classList.remove('show');
}

function startGuestChat() {
    const guestName = document.getElementById('guestName').value.trim();
    
    if (!guestName) {
        alert('Please enter your name');
        return;
    }

    // Open a new window with guest chat
    window.open(`/guest_support?name=${encodeURIComponent(guestName)}`, 'support', 'width=800,height=600');
    closeGuestSupportModal();
}

// ============================================================
// AUTH MODAL FUNCTIONS
// ============================================================

function showAuthPromptModal() {
    const modal = document.getElementById('authPromptModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function closeAuthPromptModal() {
    const modal = document.getElementById('authPromptModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// ============================================================
// PRODUCT DETAILS FUNCTIONS
// ============================================================

function viewProductDetails(productId) {
    isLoggedIn = checkIfLoggedIn();
    if (!isLoggedIn) {
        showAuthPromptModal();
        return;
    }
    window.location.href = `/product_details/${productId}`;
}

// ============================================================
// GUEST WELCOME MODAL FUNCTIONS
// ============================================================

function showGuestWelcomeModal() {
    const modal = document.getElementById('guestWelcomeModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function closeGuestWelcomeModal() {
    const modal = document.getElementById('guestWelcomeModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}
