function performSearch() {
    const query = document.getElementById('search-input').value;
    if (query) {
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
    }
}

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

function loadWishlistPreview() {
    fetch('/get_wishlist_preview')
        .then(response => response.json())
        .then(data => {
            const wishlistItems = document.getElementById('wishlistItems');
            wishlistItems.innerHTML = '';

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
                            <div class="wishlist-item-price">₱${formatPrice(item.price)}</div>
                        </div>
                        <button onclick="removeFromWishlist('${item.product_id}')" class="remove-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            });
        });
}

function updateWishlistCount() {
    fetch('/get_wishlist_count')
        .then(response => response.json())
        .then(data => {
            document.getElementById('wishlistCount').textContent = data.count;
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

function loadCartPreview() {
    fetch('/get_cart_preview')
        .then(response => response.json())
        .then(data => {
            const cartItems = document.getElementById('cartItems');
            cartItems.innerHTML = '';
            let total = 0;

            data.items.forEach(item => {
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
                                <span>Color: ${item.color}</span>
                                <span>Size: ${item.size}</span>
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
                        <button onclick="removeFromCart('${item.product_id}', '${item.color}', '${item.size}')" class="remove-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            });

            document.getElementById('cartTotal').textContent = formatPrice(total);
        });
}

function updateCartQuantity(productId, change, color, size) {
    fetch('/update-cart-quantity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId,
            change: change,
            color: color,
            size: size
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadCartPreview();
            updateCartCount();
        } else if (data.stockLimit) {
            alert('Cannot add more items. Maximum stock limit reached!');
        } else {
            alert(data.message || 'Error updating quantity');
        }
    });
}

function removeFromCart(productId, color, size) {
    if (confirm('Remove this item from cart?')) {
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

function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

document.addEventListener('click', function(event) {
    const cartContainer = document.querySelector('.cart-container');
    const wishlistContainer = document.querySelector('.wishlist-container');
    const cartDropdown = document.getElementById('cartDropdown');
    const wishlistDropdown = document.getElementById('wishlistDropdown');
    
    if (!cartContainer.contains(event.target)) {
        cartDropdown.style.display = 'none';
    }
    if (!wishlistContainer.contains(event.target)) {
        wishlistDropdown.style.display = 'none';
    }
});

function updateCartCount() {
    fetch('/get_cart_count')
        .then(response => response.json())
        .then(data => {
            const cartCount = document.getElementById('cartCount');
            if (cartCount) {
                cartCount.textContent = data.count;
            }
        })
        .catch(error => {
            console.error('Error updating cart count:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    updateWishlistCount();
});

async function addToCart(productId, stock) {
    try {
        // Check current cart quantity
        const response = await fetch(`/check-cart-quantity/${productId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Check if adding would exceed stock
        if (data.cartQty >= stock) {
            // Show error message
            const errorMsg = document.querySelector('.add-cart-error');
            errorMsg.style.display = 'block';
            
            // Hide error message after 3 seconds
            setTimeout(() => {
                errorMsg.style.display = 'none';
            }, 3000);
            return;
        }
        
        // If stock is available, proceed with adding to cart
        const addResponse = await fetch('/add_to_cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        });

        if (!addResponse.ok) {
            throw new Error('Failed to add to cart');
        }

        // Update cart count or show success message
        const cartData = await addResponse.json();
        // Update your cart counter here if you have one
        
    } catch (error) {
        console.error('Error:', error);
        // Handle any errors here
    }
}

function addToCart(button, productId) {
    const productCard = button.closest('.product-card');
    const size = productCard.querySelector('.product-size').value;
    const color = productCard.querySelector('.product-color').value;
    
    if (!size) {
        alert('Please select a size');
        return;
    }
    if (!color) {
        alert('Please select a color');
        return;
    }

    const productData = {
        product_id: productId,
        name: productCard.querySelector('.product-name').textContent,
        price: productCard.querySelector('.product-price').textContent.replace('₱', ''),
        image: productCard.querySelector('.product-image').getAttribute('src').split('/').pop(),
        seller_email: productCard.getAttribute('data-seller-email'),
        size: size,
        color: color
    };

    fetch('/add-to-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Added to cart successfully!');
        } else if (data.cartFull) {
            alert('Cart is full! Maximum 20 items allowed.');
        } else {
            alert(data.message || 'Failed to add to cart. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to add to cart. Please try again.');
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

let currentProduct = null;

function openAddToCartModal(productId, name, price, image, colors, sizes) {
    currentProduct = {
        id: productId,
        name: name,
        price: price,
        image: image,
        hasSizes: false
    };

    let colorArray = [];
    let sizeArray = [];
    
    try {
        colorArray = JSON.parse(colors);
    } catch (e) {
        colorArray = colors.split(',').map(c => c.trim()).filter(c => c);
    }
    
    try {
        sizeArray = JSON.parse(sizes);
    } catch (e) {
        sizeArray = sizes.split(',').map(s => s.trim()).filter(s => s);
    }

    const colorSelect = document.getElementById('colorSelect');
    colorSelect.innerHTML = '';
    colorArray.forEach(color => {
        const option = document.createElement('option');
        option.value = color;
        option.textContent = color;
        colorSelect.appendChild(option);
    });

    const sizeSelect = document.getElementById('sizeSelect');
    const sizeGroup = sizeSelect ? sizeSelect.parentElement : null;
    sizeSelect.innerHTML = '';
    if (sizeArray.length > 0) {
        currentProduct.hasSizes = true;
        sizeArray.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            sizeSelect.appendChild(option);
        });
        if (sizeGroup) sizeGroup.style.display = '';
    } else {
        currentProduct.hasSizes = false;
        if (sizeGroup) sizeGroup.style.display = 'none';
    }

    const modal = document.getElementById('addToCartModal');
    modal.style.display = 'block';
}

function addToCart(productId, name, price, image, color, size, quantity) {
    if (!isLoggedIn) {
        window.location.href = '/login';
        return;
    }

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
            quantity: parseInt(quantity)
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
        quantity
    );
    document.getElementById('addToCartModal').style.display = 'none';
}

// Close modal when clicking the X or outside the modal
const modal = document.getElementById('addToCartModal');
const span = document.getElementsByClassName('close')[0];

span.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}