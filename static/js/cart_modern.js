/* ============================================================
   SHOPPING CART - MODERN FUNCTIONALITY
   ============================================================ */

/**
 * Update the total price based on selected items and quantities
 */
function updateTotalPrice() {
    let totalPrice = 0;
    let itemCount = 0;
    
    document.querySelectorAll('.cart-item-card').forEach(item => {
        const checkbox = item.querySelector('.item-checkbox');
        
        if (checkbox && checkbox.checked) {
            const price = parseFloat(
                item.querySelector('.item-price')?.textContent?.replace('₱', '') || 0
            );
            const quantity = parseInt(item.querySelector('.qty-input')?.value || 1);
            const itemTotal = price * quantity;
            
            item.querySelector('.item-total').textContent = `₱${itemTotal.toFixed(2)}`;
            totalPrice += itemTotal;
            itemCount += quantity;
        }
    });
    
    // Update the totals in the header stats and summary
    const totalElements = document.querySelectorAll('.total-amount, .summary-total-value');
    totalElements.forEach(el => {
        el.textContent = `₱${totalPrice.toFixed(2)}`;
    });
    
    // Update item count
    const itemCountEl = document.getElementById('item-count');
    if (itemCountEl) {
        itemCountEl.textContent = itemCount;
    }
}

/**
 * Toggle select all checkboxes
 */
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('select-all');
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');
    
    itemCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    
    updateTotalPrice();
}

/**
 * Adjust item quantity
 */
function adjustQuantity(button, isIncrease) {
    const quantityInput = button.parentElement.querySelector('.qty-input');
    let quantity = parseInt(quantityInput.value) || 1;
    
    if (isIncrease) {
        quantity += 1;
    } else if (quantity > 1) {
        quantity -= 1;
    }
    
    quantityInput.value = quantity;
    updateTotalPrice();
}

/**
 * Delete selected items from cart
 */
function deleteSelectedItems() {
    const selectedIds = [];
    
    document.querySelectorAll('.cart-item-card').forEach(item => {
        const checkbox = item.querySelector('.item-checkbox');
        if (checkbox && checkbox.checked) {
            const itemId = item.getAttribute('data-item-id');
            if (itemId) {
                selectedIds.push(parseInt(itemId));
            }
        }
    });
    
    if (selectedIds.length === 0) {
        showNotification('Please select items to delete', 'warning');
        return;
    }
    
    // Confirm deletion
    if (!confirm(`Delete ${selectedIds.length} item(s) from cart?`)) {
        return;
    }
    
    fetch('/cart/delete_selected', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            selectedIds.forEach(id => {
                const itemElement = document.querySelector(`.cart-item-card[data-item-id="${id}"]`);
                if (itemElement) {
                    itemElement.style.animation = 'fadeOut 0.3s ease forwards';
                    setTimeout(() => itemElement.remove(), 300);
                }
            });
            
            updateTotalPrice();
            showNotification(`${selectedIds.length} item(s) deleted successfully`, 'success');
            
            // Check if cart is empty
            if (document.querySelectorAll('.cart-item-card').length === 0) {
                location.reload();
            }
        } else {
            showNotification(data.error || 'Failed to delete items', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error deleting items', 'error');
    });
}

/**
 * Process checkout
 */
function processCheckout() {
    const checkedBoxes = document.querySelectorAll('.cart-item-card .item-checkbox:checked');
    
    if (checkedBoxes.length === 0) {
        showNotification('Please select items to checkout', 'warning');
        return;
    }
    
    const selectedIds = Array.from(checkedBoxes).map(box => {
        const cartItem = box.closest('.cart-item-card');
        return parseInt(cartItem.getAttribute('data-item-id'));
    });
    
    fetch('/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/checkout';
        } else {
            showNotification(data.error || 'Error processing checkout', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error processing checkout', 'error');
    });
}

/**
 * Search functionality
 */
function performSearch() {
    const query = document.getElementById('search-input')?.value;
    if (query && query.trim()) {
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
    } else {
        showNotification('Please enter a search term', 'warning');
    }
}

/**
 * Toggle profile dropdown menu
 */
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

/**
 * Show notification/toast message
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
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
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Close dropdown when clicking outside
 */
function closeDropdownOnClickOutside(event) {
    const dropdown = document.getElementById('profileDropdown');
    const profileBtn = document.querySelector('.profile-btn');
    
    if (dropdown && !dropdown.contains(event.target) && !profileBtn.contains(event.target)) {
        dropdown.classList.remove('active');
    }
}

/**
 * Initialize event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
    // Quantity adjustment
    document.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', function() {
            const isIncrease = this.getAttribute('data-action') === 'increase';
            adjustQuantity(this, isIncrease);
        });
    });
    
    // Quantity input change
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', updateTotalPrice);
    });
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', toggleSelectAll);
    }
    
    // Individual item checkboxes
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateTotalPrice);
    });
    
    // Search input (Enter key)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Close dropdown on outside click
    document.addEventListener('click', closeDropdownOnClickOutside);
    
    // Initialize total price
    updateTotalPrice();
    
    // Add animation styles
    const style = document.createElement('style');
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
});
