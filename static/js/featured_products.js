// Align interactions with category/homepage behavior

function performSearch() {
    const query = document.getElementById('search-input').value;
    if (query) {
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
    }
}

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
    event.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('active');
}

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
        profileDropdown.classList.remove('active');
    }
});

function loadWishlistPreview() {
    fetch('/get_wishlist_preview')
        .then(response => response.json())
        .then(data => {
            const container = document.querySelector('#wishlistDropdown .wishlist-items');
            if (!container) return;
            container.innerHTML = '';
            data.items.forEach(item => {
                // Build image URL - add /static/uploads/ prefix if it's just a filename
                let imageUrl = item.image;
                if (!item.image.startsWith('/')) {
                  imageUrl = `/static/uploads/${item.image}`;
                }
                container.innerHTML += `
                    <div class="wishlist-item">
                        <img src="${imageUrl}" alt="${item.name}" onerror="this.src='/static/images/defaults/product-default.png'">
                        <div class="item-details">
                            <h4>${item.name}</h4>
                            <p>₱${parseFloat(item.price).toLocaleString('en-PH', {minimumFractionDigits:2})}</p>
                        </div>
                        <button class="remove-btn" onclick="removeFromWishlist('${item.product_id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
        });
}

function loadCartPreview() {
    fetch('/get_cart_preview')
        .then(response => response.json())
        .then(data => {
            const container = document.querySelector('#cartDropdown .cart-items');
            if (!container) return;
            container.innerHTML = '';
            let total = 0;
            data.items.forEach(item => {
                total += parseFloat(item.price) * parseInt(item.quantity);
                // Build image URL - add /static/uploads/ prefix if it's just a filename
                let imageUrl = item.image;
                if (!item.image.startsWith('/')) {
                  imageUrl = `/static/uploads/${item.image}`;
                }
                container.innerHTML += `
                    <div class="cart-item">
                        <img src="${imageUrl}" alt="${item.name}" onerror="this.src='/static/images/defaults/product-default.png'">
                        <div class="item-details">
                            <h4>${item.name}</h4>
                            <p>₱${parseFloat(item.price).toLocaleString('en-PH', {minimumFractionDigits:2})}</p>
                            <div class="quantity-controls">
                                <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', 'decrease')">-</button>
                                <span class="quantity">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateCartQuantity('${item.product_id}', 'increase')">+</button>
                            </div>
                        </div>
                        <button class="remove-btn" onclick="removeFromCart('${item.product_id}', '${item.color}', '${item.size}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
            const totalEl = document.getElementById('cartTotal');
            if (totalEl) totalEl.textContent = total.toLocaleString('en-PH', {minimumFractionDigits:2});
        });
}

function updateCartCount() {
    fetch('/get_cart_count')
        .then(r => r.json())
        .then(data => {
            const el = document.getElementById('cartCount');
            if (el) el.textContent = data.count;
        });
}

function updateWishlistCount() {
    fetch('/get_wishlist_count')
        .then(r => r.json())
        .then(data => {
            const el = document.getElementById('wishlistCount');
            if (el) el.textContent = data.count;
        });
}

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    updateWishlistCount();
});

// Modal logic mirroring category template
let currentProduct = null;

function openAddToCartModal(productId, name, price, image, colors, sizes, sellerEmail) {
    currentProduct = { id: productId, name, price, image, sellerEmail, hasSizes: false };

    let colorArray = [];
    let sizeArray = [];
    try { colorArray = JSON.parse(colors); } catch (e) { colorArray = (colors || '').toString().split(',').map(c=>c.trim()).filter(Boolean); }
    try { sizeArray = JSON.parse(sizes); } catch (e) { sizeArray = (sizes || '').toString().split(',').map(s=>s.trim()).filter(Boolean); }

    const colorSelect = document.getElementById('colorSelect');
    const sizeSelect = document.getElementById('sizeSelect');
    const sizeGroup = sizeSelect ? sizeSelect.parentElement : null;
    colorSelect.innerHTML = '';
    sizeSelect.innerHTML = '';
    colorArray.forEach(c => { const o=document.createElement('option'); o.value=c; o.textContent=c; colorSelect.appendChild(o); });
    if (sizeArray.length > 0) {
        currentProduct.hasSizes = true;
        sizeArray.forEach(s => { const o=document.createElement('option'); o.value=s; o.textContent=s; sizeSelect.appendChild(o); });
        if (sizeGroup) sizeGroup.style.display = '';
    } else {
        currentProduct.hasSizes = false;
        if (sizeGroup) sizeGroup.style.display = 'none';
    }

    document.getElementById('addToCartModal').style.display = 'block';
}

function confirmAddToCart() {
    const color = document.getElementById('colorSelect').value;
    const sizeEl = document.getElementById('sizeSelect');
    const chosenSize = sizeEl ? sizeEl.value : '';
    const quantity = parseInt(document.getElementById('quantityInput').value || '1', 10);
    if (currentProduct.hasSizes && !chosenSize) {
        alert('Please select a size.');
        return;
    }
    addToCart(currentProduct.id, currentProduct.name, currentProduct.price, currentProduct.image, color, currentProduct.hasSizes ? chosenSize : '', quantity, currentProduct.sellerEmail);
    document.getElementById('addToCartModal').style.display = 'none';
}

function addToCart(productId, name, price, image, color, size, quantity, sellerEmail) {
    fetch('/add_to_cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            product_id: productId,
            name: name,
            price: price,
            image: image,
            color: color,
            size: size,
            quantity: quantity,
            seller_email: sellerEmail
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            updateCartCount();
            loadCartPreview();
        } else if (data.cartFull) {
            alert('Cart is full! Maximum 20 items allowed.');
        } else {
            alert(data.message || 'Error adding to cart');
        }
    })
    .catch(() => alert('Error adding to cart'));
}

// Close modal handlers
(function initModalHandlers(){
    const modal = document.getElementById('addToCartModal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
})();