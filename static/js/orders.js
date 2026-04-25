// ============================================================
// ORDERS PAGE - ENHANCED FUNCTIONS
// ============================================================

// Store all orders for filtering
let allOrders = [];

// ============================================================
// DATE AND STATUS FILTERING FUNCTIONS
// ============================================================

function getOrderDate(orderElement) {
    // Extract date from order element attributes or text
    const dateText = orderElement.getAttribute('data-order-date');
    if (dateText) {
        return new Date(dateText).toDateString();
    }
    return null;
}

function getOrderStatus(orderElement) {
    return orderElement.getAttribute('data-order-status');
}

function filterOrdersByDateAndStatus() {
    const dateInput = document.getElementById('dateFilter');
    const statusInput = document.getElementById('statusFilter');
    const selectedDate = dateInput.value;
    const selectedStatus = statusInput.value;
    
    let visibleCount = 0;
    
    document.querySelectorAll('.order-card').forEach(orderCard => {
        let shouldShow = true;
        
        // Check date filter
        if (selectedDate) {
            const selectedDateObj = new Date(selectedDate);
            const selectedDateStr = selectedDateObj.toDateString();
            const orderDateStr = orderCard.getAttribute('data-order-date');
            const orderDate = new Date(orderDateStr).toDateString();
            
            if (orderDate !== selectedDateStr) {
                shouldShow = false;
            }
        }
        
        // Check status filter
        if (selectedStatus && shouldShow) {
            const orderStatus = orderCard.getAttribute('data-order-status');
            if (orderStatus !== selectedStatus) {
                shouldShow = false;
            }
        }
        
        if (shouldShow) {
            orderCard.style.display = 'block';
            orderCard.style.animation = 'slideUp 0.3s ease-out';
            visibleCount++;
        } else {
            orderCard.style.display = 'none';
        }
    });
    
    updateFilteredCount(visibleCount);
    checkEmptyOrders();
}

function filterOrdersByDate() {
    // Legacy function - redirects to combined filter
    filterOrdersByDateAndStatus();
}

function clearAllFilters() {
    document.getElementById('dateFilter').value = '';
    document.getElementById('statusFilter').value = '';
    
    document.querySelectorAll('.order-card').forEach(orderCard => {
        orderCard.style.display = 'block';
        orderCard.style.animation = 'slideUp 0.3s ease-out';
    });
    
    const totalOrders = document.querySelectorAll('.order-card').length;
    updateFilteredCount(totalOrders);
}

function clearDateFilter() {
    // Legacy function - redirects to clear all
    clearAllFilters();
}

function updateFilteredCount(count) {
    const countElement = document.getElementById('filteredCount');
    if (countElement) {
        countElement.textContent = count;
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
// MODAL FUNCTIONS
// ============================================================

function viewOrderDetails(orderId) {
    const modal = document.getElementById(`orderDetailsModal${orderId}`);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Close modals when pressing Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAllModals();
    }
});

// ============================================================
// CANCEL ORDER FUNCTION
// ============================================================

function cancelOrder(orderId, orderName) {
    // Store the order ID for use in the confirmation function
    window.currentCancelOrderId = orderId;
    
    // Get order details from the DOM
    const orderCard = document.getElementById(`order-${orderId}`);
    const quantityText = orderCard.querySelector('.detail-group:nth-of-type(1) p') ? 
                         orderCard.querySelector('.detail-group:nth-of-type(1) p').textContent : 'N/A';
    const totalText = orderCard.querySelector('.order-total-banner .total-price') ? 
                      orderCard.querySelector('.order-total-banner .total-price').textContent : 'N/A';
    
    // Populate modal with order details
    document.getElementById('cancelOrderName').textContent = `Product: ${orderName}`;
    document.getElementById('cancelOrderQuantity').textContent = quantityText || 'N/A';
    document.getElementById('cancelOrderAmount').textContent = totalText || 'N/A';
    document.getElementById('cancellationReason').value = '';
    
    // Open the cancel modal
    openModal('cancelOrderModal');
}

function confirmCancelOrder() {
    const orderId = window.currentCancelOrderId;
    const reason = document.getElementById('cancellationReason').value.trim();
    
    if (!reason) {
        showNotification('Please provide a reason for cancellation', 'warning');
        return;
    }
    
    // Disable button to prevent double submission
    const confirmBtn = event.target;
    const originalText = confirmBtn.innerHTML;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    fetch(`/delete_order/${orderId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close the modal
            closeModal('cancelOrderModal');
            
            // Remove the order card with animation
            const orderCard = document.getElementById(`order-${orderId}`);
            if (orderCard) {
                orderCard.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    orderCard.remove();
                    // Check if there are any orders left
                    checkEmptyOrders();
                }, 300);
            }
            showNotification(data.message || 'Order cancelled successfully! Stock has been returned.', 'success');
        } else {
            showNotification(data.error || 'Failed to cancel order', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error cancelling order. Please try again.', 'error');
    })
    .finally(() => {
        // Re-enable button
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.querySelector('.modal-overlay').classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
    // Check if all modals are closed
    const activeModals = document.querySelectorAll('.modal.active');
    if (activeModals.length === 0) {
        document.querySelector('.modal-overlay').classList.remove('active');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.querySelector('.modal-overlay').classList.remove('active');
}

// ============================================================
// SEARCH FUNCTION
// ============================================================

function performSearch() {
    const searchQuery = document.querySelector('.search-input').value.trim();
    if (searchQuery) {
        window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
}

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
// EMPTY STATE CHECK
// ============================================================

function checkEmptyOrders() {
    const ordersGrid = document.querySelector('.orders-grid');
    const orderCards = ordersGrid.querySelectorAll('.order-card');
    
    if (orderCards.length === 0) {
        // Remove the grid and show empty state
        ordersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h2>No Orders Yet</h2>
                <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
                <a href="/" class="btn-primary">
                    <i class="fas fa-shopping-bag"></i> Start Shopping
                </a>
            </div>
        `;
    }
}

// ============================================================
// DOCUMENT READY
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default in the date input if needed
    // (user can still use it to filter)
    
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
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleProfileDropdown();
        });
    }

    // Add click handlers to view details buttons
    document.querySelectorAll('.btn-action[onclick^="viewOrderDetails"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });

    // Store all orders for reference
    allOrders = Array.from(document.querySelectorAll('.order-card'));
});

// ============================================================
// RECEIVE ORDER CONFIRMATION FUNCTIONS
// ============================================================

let pendingReceiveOrderId = null;

function openReceiveConfirmation(orderId, orderName) {
    pendingReceiveOrderId = orderId;
    document.getElementById('confirmOrderName').textContent = orderName;
    openModal('receiveConfirmationModal');
}

function confirmReceiveOrder() {
    if (!pendingReceiveOrderId) return;
    
    const orderId = pendingReceiveOrderId;
    closeModal('receiveConfirmationModal');
    
    // Show loading with browser alert
    const confirmBtn = event.target;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Submit the form via fetch
    fetch(`/mark_as_received/${orderId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Order marked as received! Sales count updated.');
            location.reload();
        } else {
            alert('Error: ' + (data.error || 'Failed to receive order'));
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Yes, Confirm Receipt';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error processing request: ' + error.message);
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Yes, Confirm Receipt';
    });
    
    pendingReceiveOrderId = null;
}

// ============================================================
// ANIMATIONS (injected CSS)
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

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
