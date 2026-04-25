// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================

function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    const bgColor = {
        'success': '#10B981',
        'error': '#EF4444',
        'warning': '#F97316',
        'info': '#3B82F6'
    }[type] || '#3B82F6';

    notification.style.cssText = `
        background-color: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        font-weight: 500;
        font-size: 0.95rem;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
        word-wrap: break-word;
    `;

    notification.textContent = message;
    container.appendChild(notification);

    // Auto-remove notification after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ============================================================
// STEP NAVIGATION
// ============================================================

function goToStep(stepNumber) {
    // Validate current step before moving
    if (currentStep === 1 && !validateStep1()) {
        return;
    }
    if (currentStep === 2 && !validateStep2()) {
        return;
    }

    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show target step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update progress bar
    updateProgressBar(stepNumber);
    
    // Update current step
    currentStep = stepNumber;

    // Update confirmation details on step 3
    if (stepNumber === 3) {
        updateConfirmationDetails();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep1() {
    const currentAddress = document.getElementById('current-address').textContent;
    if (!currentAddress || currentAddress === 'No address found.') {
        showNotification('Please set a delivery address', 'warning');
        return false;
    }
    return true;
}

function validateStep2() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    if (!paymentMethod) {
        showNotification('Please select a payment method', 'warning');
        return false;
    }
    return true;
}

function updateProgressBar(stepNumber) {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index + 1 <= stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function updateConfirmationDetails() {
    // Update address
    const address = document.getElementById('current-address').textContent;
    document.getElementById('confirm-address').textContent = address;

    // Update payment method
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    const paymentText = paymentMethod ? 
        (paymentMethod.value === 'cod' ? 'Cash on Delivery (COD)' : paymentMethod.value) : 
        'Not selected';
    document.getElementById('confirm-payment').textContent = paymentText;

    // Update items count - sum total quantities, not just count of products
    let totalQuantity = 0;
    document.querySelectorAll('.product-item').forEach(item => {
        const qtyMatch = item.querySelector('.product-qty').textContent.match(/\d+/);
        const quantity = qtyMatch ? parseInt(qtyMatch[0]) : 1;
        totalQuantity += quantity;
    });
    document.getElementById('confirm-items-count').textContent = `${totalQuantity} item(s)`;
}

let currentStep = 1;

/* ============================================================
// REMOVE PRODUCT ITEM
// ============================================================ */

function removeProductItem(itemId) {
    if (!confirm('Are you sure you want to remove this item?')) {
        return;
    }

    fetch('/remove_from_checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: [itemId] })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const item = document.getElementById(`item-${itemId}`);
            if (item) {
                item.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => item.remove(), 300);
            }
            showNotification('Item removed from checkout', 'success');
        } else {
            showNotification('Failed to remove item', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Failed to remove item', 'error');
    });
}





function confirmOrder() {
    // Final validation
    const currentAddress = document.getElementById('current-address').textContent;
    if (!currentAddress || currentAddress === 'No address found.') {
        showNotification('Please set a delivery address', 'warning');
        goToStep(1);
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    if (!paymentMethod) {
        showNotification('Please select a payment method', 'warning');
        goToStep(2);
        return;
    }

    const productItems = document.querySelectorAll('.product-item');
    if (productItems.length === 0) {
        showNotification('Your cart is empty', 'warning');
        return;
    }

    // Collect items data
    const items = [];
    productItems.forEach(item => {
        const itemId = item.id.replace('item-', '');
        const name = item.querySelector('.product-name').textContent;
        const priceText = item.querySelector('.product-price').textContent.replace('₱', '').trim();
        const price = parseFloat(priceText) || 0;
        const qtyMatch = item.querySelector('.product-qty').textContent.match(/\d+/);
        const quantity = qtyMatch ? parseInt(qtyMatch[0]) : 1;
        
        // Get product_id from data attribute
        const productId = item.dataset.productId || itemId;
        
        // Get color and size from data attributes (more reliable than parsing text)
        const color = item.dataset.color || '';
        const size = item.dataset.size || '';
        
        items.push({
            id: itemId,
            product_id: productId,  // Include product_id
            name: name,
            price: price,
            quantity: quantity,
            color: color,
            size: size
        });
    });

    // Disable button to prevent double submission
    const confirmBtn = event.target;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    fetch('/confirm_order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            items: items,
            payment_method: paymentMethod.value,
            address: currentAddress
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Order confirmed successfully!', 'success');
            setTimeout(() => {
                window.location.href = '/orders';
            }, 1500);
        } else {
            showNotification(data.error || 'Error processing order', 'error');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm & Place Order';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error processing order. Please try again.', 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm & Place Order';
    });
}

// ============================================================
// ADDRESS FUNCTIONS
// ============================================================

function showAddressEdit() {
    document.getElementById('address-edit-form').style.display = 'block';
    document.querySelector('.current-address-box').style.display = 'none';
}

function cancelAddressEdit() {
    document.getElementById('address-edit-form').style.display = 'none';
    document.querySelector('.current-address-box').style.display = 'flex';
}

function saveAddress() {
    const newAddress = document.getElementById('new-address').value.trim();
    
    if (!newAddress) {
        showNotification('Please enter a valid address', 'warning');
        return;
    }

    fetch('/update_address', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: newAddress })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('current-address').textContent = newAddress;
            cancelAddressEdit();
            showNotification('Address updated successfully', 'success');
        } else {
            showNotification('Failed to update address: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Failed to update address', 'error');
    });
}

// ============================================================
// CHECKBOX FUNCTIONS
// ============================================================

// (Removed - no longer needed for single item checkout)

// ============================================================
// NAVIGATION FUNCTIONS
// ============================================================

function backToCart() {
    if (confirm('Are you sure you want to go back to the cart? Your current checkout will reset.')) {
        window.location.href = '/cart';
    }
}

function performSearch() {
    const searchQuery = document.querySelector('.search-input').value.trim();
    if (searchQuery) {
        window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
}

// ============================================================
// PROFILE DROPDOWN
// ============================================================

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('profileDropdown');
    const profileBtn = document.querySelector('.profile-btn');
    
    if (dropdown && profileBtn && !profileBtn.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

// ============================================================
// DOCUMENT READY
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchBtn = document.querySelector('.search-button');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Profile dropdown
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', toggleProfileDropdown);
    }

    // Initialize step view
    updateProgressBar(1);
});

// ============================================================
// ANIMATIONS
// ============================================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(20px);
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
            transform: translateX(-20px);
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);