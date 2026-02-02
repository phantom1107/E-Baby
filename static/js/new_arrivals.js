const isLoggedIn = "{{ session.get('email', '') }}" !== "";
        function performSearch() {
            const query = document.getElementById('search-input').value;
            if (query) {
                window.location.href = `/search?query=${encodeURIComponent(query)}`;
            }
        }

        function updateCartCount() {
            fetch('/get_cart_count')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('cartCount').textContent = data.count;
                });
        }

        function toggleCartDropdown(event) {
            event.preventDefault();
            const dropdown = document.getElementById('cartDropdown');
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            } else {
                loadCartPreview();
                dropdown.style.display = 'block';
            }
        }

        function formatPrice(price) {
            return parseFloat(price).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        function generateVariantId(productId, color, size) {
            return `${productId}_${color}_${size}`;
        }

        function updateCartQuantity(productId, change, color, size) {
            const variantId = generateVariantId(productId, color, size);
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

        function loadCartPreview() {
            fetch('/get_cart_preview')
                .then(response => response.json())
                .then(data => {
                    const cartItems = document.getElementById('cartItems');
                    cartItems.innerHTML = '';
                    let total = 0;

                    data.items.forEach(item => {
                        const variantId = generateVariantId(item.product_id, item.color, item.size);
                        total += parseFloat(item.price) * parseInt(item.quantity);
                        // Build image URL - add /static/uploads/ prefix if it's just a filename
                        let imageUrl = item.image;
                        if (!item.image.startsWith('/')) {
                          imageUrl = `/static/uploads/${item.image}`;
                        }
                        cartItems.innerHTML += `
                            <div class="cart-item">
                                <img src="${imageUrl}" alt="${item.name}" onerror="this.src='/static/images/defaults/product-default.png'">
                                <div class="cart-item-details">
                                    <div class="cart-item-name">${item.name}</div>
                                    <div class="cart-item-price">₱${formatPrice(item.price)}</div>
                                    <div class="item-variants">
                                        <span class="variant-info">Color: ${item.color}</span>
                                        <span class="variant-info">Size: ${item.size}</span>
                                    </div>
                                    <div class="quantity-controls">
                                        <button onclick="updateCartQuantity('${item.product_id}', -1, '${item.color}', '${item.size}')" 
                                                class="qty-btn" ${item.quantity <= 1 ? 'disabled' : ''}>
                                            <i class="fas fa-minus"></i>
                                        </button>
                                        <span class="quantity">${item.quantity}</span>
                                        <button onclick="updateCartQuantity('${item.product_id}', 1, '${item.color}', '${item.size}')" 
                                                class="qty-btn">
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

                    document.getElementById('cartTotal').textContent = formatPrice(total);
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
                        alert('Error removing item from cart');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error removing item from cart');
                });
            }
        }

        function addToCart(productId, name, price, image, color, size, quantity, sellerEmail) {
            if (!isLoggedIn) {
                window.location.href = '/login';
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
                if (data.success) {
                    alert('Product added to cart!');
                    updateCartCount();
                    loadCartPreview();
                } else if (data.cartFull) {
                    alert('Cart is full! Maximum 20 items allowed.');
                } else {
                    alert(data.message || 'Error adding to cart');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error adding to cart');
            });
        }

        document.addEventListener('DOMContentLoaded', function() {
            updateCartCount();
        });

        document.addEventListener('click', function(event) {
            const cartContainer = document.querySelector('.cart-container');
            const dropdown = document.getElementById('cartDropdown');
            if (!cartContainer.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });

        function addToWishlist(productId, name, price, image) {
            if (!isLoggedIn) {
                window.location.href = '/login';
                return;
            }

            fetch('/add_to_wishlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_id: productId,
                    name: name,
                    price: price,
                    image: image
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Product added to wishlist!');
                } else {
                    alert(data.message || 'Error adding to wishlist');
                }
            });
        }

        function toggleProfileDropdown(event) {
            event.stopPropagation();
            const dropdown = document.getElementById('profileDropdown');
            dropdown.classList.toggle('active');
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const dropdowns = document.querySelectorAll('.profile-menu');
            dropdowns.forEach(dropdown => {
                if (!event.target.closest('.profile-dropdown-container')) {
                    dropdown.classList.remove('active');
                }
            });
        });

        function toggleWishlistDropdown(event) {
            event.preventDefault();
            const dropdown = document.getElementById('wishlistDropdown');
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            } else {
                loadWishlistPreview();
                dropdown.style.display = 'block';
            }
        }

        function removeFromWishlist(productId) {
            if (confirm('Remove this item from wishlist?')) {
                fetch('/remove-from-wishlist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        product_id: productId
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        loadWishlistPreview();
                        updateWishlistCount();
                    }
                });
            }
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const wishlistDropdown = document.getElementById('wishlistDropdown');
            const wishlistContainer = document.querySelector('.wishlist-container');
            
            if (!wishlistContainer.contains(event.target)) {
                wishlistDropdown.style.display = 'none';
            }
        });

        function loadWishlistPreview() {
            fetch('/get_wishlist_preview')
                .then(response => response.json())
                .then(data => {
                    const wishlistItems = document.getElementById('wishlistItems');
                    wishlistItems.innerHTML = '';

                    if (data.items && data.items.length > 0) {
                        data.items.forEach(item => {
                            // Build image URL - add /static/uploads/ prefix if it's just a filename
                            let imageUrl = item.image;
                            if (!item.image.startsWith('/')) {
                              imageUrl = `/static/uploads/${item.image}`;
                            }
                            wishlistItems.innerHTML += `
                                <div class="wishlist-item">
                                    <img src="${imageUrl}" alt="${item.name}" onerror="this.src='/static/images/defaults/product-default.png'">
                                    <div class="wishlist-item-details">
                                        <div class="wishlist-item-name">${item.name}</div>
                                        <div class="wishlist-item-price">₱${item.price}</div>
                                    </div>
                                    <button onclick="removeFromWishlist('${item.id}')" class="remove-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `;
                        });
                    } else {
                        wishlistItems.innerHTML = '<div class="wishlist-empty"><p>Your wishlist is empty</p></div>';
                    }
                });
        }

        // Add this function to update the wishlist count
        function updateWishlistCount() {
            fetch('/get_wishlist_count')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('wishlistCount').textContent = data.count;
                });
        }

        // Call this when page loads
        document.addEventListener('DOMContentLoaded', function() {
            updateWishlistCount();
        });

        let currentProduct = null;

        function openAddToCartModal(productId, name, price, image, colors, sizes, sellerEmail) {
            currentProduct = {
                id: productId,
                name: name,
                price: price,
                image: image,
                seller_email: sellerEmail,
                hasSizes: false
            };

            // Parse the comma-separated strings into arrays
            const colorArray = colors.split(',');
            const sizeArray = sizes.split(',');

            // Populate color select
            const colorSelect = document.getElementById('colorSelect');
            colorSelect.innerHTML = '';
            colorArray.forEach(color => {
                const option = document.createElement('option');
                option.value = color.trim();
                option.textContent = color.trim();
                colorSelect.appendChild(option);
            });

            // Populate size select
            const sizeSelect = document.getElementById('sizeSelect');
            const sizeGroup = sizeSelect ? sizeSelect.parentElement : null;
            sizeSelect.innerHTML = '';
            if (sizeArray.filter(s=>s.trim()).length > 0) {
                currentProduct.hasSizes = true;
                sizeArray.forEach(size => {
                    const option = document.createElement('option');
                    option.value = size.trim();
                    option.textContent = size.trim();
                    sizeSelect.appendChild(option);
                });
                if (sizeGroup) sizeGroup.style.display = '';
            } else {
                currentProduct.hasSizes = false;
                if (sizeGroup) sizeGroup.style.display = 'none';
            }

            // Show the modal
            const modal = document.getElementById('addToCartModal');
            modal.style.display = 'block';
        }

        function confirmAddToCart() {
            const color = document.getElementById('colorSelect').value;
            const sizeEl = document.getElementById('sizeSelect');
            const size = sizeEl ? sizeEl.value : '';
            const quantity = document.getElementById('quantityInput').value;
            if (!color || !quantity) { alert('Please select required options'); return; }
            if (currentProduct.hasSizes && !size) { alert('Please select a size'); return; }

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
            document.getElementById('addToCartModal').style.display = 'none';
        }

        // Replace the existing modal close code with this:
        document.addEventListener('DOMContentLoaded', function() {
            const modal = document.getElementById('addToCartModal');
            const closeBtn = document.querySelector('.modal .close');
            
            // Close when clicking the X button
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
            
            // Close when clicking outside the modal
            window.addEventListener('click', function(event) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });