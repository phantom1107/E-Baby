/* ============================================================
   SHOPPING CART - MODERN FUNCTIONALITY
   ============================================================ */

/**
 * Update the total price based on all items and quantities
 */
function updateTotalPrice() {
  let subtotal = 0;
  let itemCount = 0;
  const SHIPPING_FEE = 38.0;
  const TAX_RATE = 0.025; // 2.5%

  document.querySelectorAll(".item-card-modern").forEach((item) => {
    const price = parseFloat(
      item
        .querySelector(".item-price")
        ?.textContent?.replace("₱", "")
        .replace(",", "") || 0
    );
    const quantityDisplay = item.querySelector(".qty-display");
    const quantity = parseInt(quantityDisplay?.textContent || 1);
    const itemTotal = price * quantity;

    // Update item subtotal
    const subtotalElement = item.querySelector(".item-total");
    if (subtotalElement) {
      subtotalElement.textContent = `₱${itemTotal.toFixed(2)}`;
    }

    // Add to subtotal
    subtotal += itemTotal;
    itemCount += quantity;
  });

  // Calculate tax (2.5% of subtotal)
  const tax = subtotal * TAX_RATE;

  // Calculate total (subtotal + shipping + tax)
  const total = subtotal + SHIPPING_FEE + tax;

  // Update subtotal in summary
  const subtotalDisplay = document.querySelector(".subtotal-display");
  if (subtotalDisplay) {
    subtotalDisplay.textContent = `₱${subtotal.toFixed(2)}`;
  }

  // Update shipping in summary
  const shippingDisplay = document.querySelector(".shipping-display");
  if (shippingDisplay) {
    shippingDisplay.textContent = `₱${SHIPPING_FEE.toFixed(2)}`;
  }

  // Update tax in summary
  const taxDisplay = document.querySelector(".tax-display");
  if (taxDisplay) {
    taxDisplay.textContent = `₱${tax.toFixed(2)}`;
  }

  // Update total display (in header stats and summary)
  const totalElements = document.querySelectorAll(
    ".total-amount, .total-price"
  );
  totalElements.forEach((el) => {
    el.textContent = `₱${total.toFixed(2)}`;
  });

  // Update item count
  const itemCountEl = document.getElementById("item-count");
  if (itemCountEl) {
    itemCountEl.textContent = itemCount;
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
}

/**
 * Adjust item quantity
 */
function adjustQuantity(button, isIncrease) {
  const itemCard = button.closest(".item-card-modern");
  const quantityDisplay = itemCard.querySelector(".qty-display");
  const productId = itemCard.getAttribute("data-product-id");
  const color = itemCard.getAttribute("data-color") || '';
  const size = itemCard.getAttribute("data-size") || '';
  let quantity = parseInt(quantityDisplay.textContent) || 1;

  if (isIncrease) {
    quantity += 1;
  } else if (quantity > 1) {
    quantity -= 1;
  }

  // Update quantity in DOM
  quantityDisplay.textContent = quantity;
  
  // Send update to backend
  fetch("/update-cart-quantity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      color: color,
      size: size,
      change: isIncrease ? 1 : -1
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.stockLimit) {
        Toast.warning(`Only ${data.available} items available in stock`);
        // Revert the change
        quantityDisplay.textContent = isIncrease ? quantity - 1 : quantity + 1;
      } else if (!data.success) {
        Toast.error(data.message || "Failed to update quantity");
        // Revert the change
        quantityDisplay.textContent = isIncrease ? quantity - 1 : quantity + 1;
      }
      updateTotalPrice();
    })
    .catch((error) => {
      console.error("Error:", error);
      Toast.error("Error updating quantity");
      // Revert the change
      quantityDisplay.textContent = isIncrease ? quantity - 1 : quantity + 1;
      updateTotalPrice();
    });
}

/**
 * Delete selected items from cart
 */
function deleteSelectedItems() {
  const selectedIds = [];

  document.querySelectorAll(".item-card-modern").forEach((item) => {
    const checkbox = item.querySelector(".item-checkbox");
    if (checkbox && checkbox.checked) {
      const itemId = item.getAttribute("data-item-id");
      if (itemId) {
        selectedIds.push(itemId);
      }
    }
  });

  if (selectedIds.length === 0) {
    showNotification("Please select items to delete", "warning");
    return;
  }

  // Confirm deletion
  if (!confirm(`Delete ${selectedIds.length} item(s) from cart?`)) {
    return;
  }

  fetch("/cart/delete_selected", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids: selectedIds }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        selectedIds.forEach((id) => {
          const itemElement = document.querySelector(
            `.item-card-modern[data-item-id="${String(id)}"]`
          );
          if (itemElement) {
            itemElement.style.animation = "fadeOut 0.3s ease forwards";
            setTimeout(() => itemElement.remove(), 300);
          }
        });

        updateTotalPrice();
        showNotification(
          `${selectedIds.length} item(s) deleted successfully`,
          "success"
        );

        // Check if cart is empty
        if (document.querySelectorAll(".item-card-modern").length === 0) {
          setTimeout(() => location.reload(), 1000);
        }
      } else {
        showNotification(data.error || "Failed to delete items", "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotification("Error deleting items", "error");
    });
}

/**
 * Process checkout
 */
function processCheckout() {
  const checkedBoxes = document.querySelectorAll(
    ".item-card-modern .item-checkbox:checked"
  );

  if (checkedBoxes.length === 0) {
    showNotification("Please select items to checkout", "warning");
    return;
  }

  const selectedIds = Array.from(checkedBoxes).map((box) => {
    const cartItem = box.closest(".item-card-modern");
    return cartItem.getAttribute("data-item-id");
  });

  console.log("Sending to checkout - Selected IDs:", selectedIds);

  fetch("/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids: selectedIds }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = "/checkout";
      } else {
        showNotification(data.error || "Error processing checkout", "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotification("Error processing checkout", "error");
    });
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
 * Toggle profile dropdown menu
 */
function toggleProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) {
    dropdown.classList.toggle("active");
  }
}

/**
 * Show notification/toast message
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

/**
 * Close dropdown when clicking outside
 */
function closeDropdownOnClickOutside(event) {
  const dropdown = document.getElementById("profileDropdown");
  const profileBtn = document.querySelector(".profile-btn");

  if (
    dropdown &&
    !dropdown.contains(event.target) &&
    !profileBtn.contains(event.target)
  ) {
    dropdown.classList.remove("active");
  }
}

/**
 * Initialize event listeners
 */
document.addEventListener("DOMContentLoaded", function () {
  // Quantity adjustment buttons
  document.querySelectorAll(".qty-control").forEach((button) => {
    button.addEventListener("click", function () {
      const isIncrease = this.getAttribute("data-action") === "increase";
      adjustQuantity(this, isIncrease);
    });
  });

  // Select all checkbox
  const selectAllCheckbox = document.getElementById("select-all");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", toggleSelectAll);
  }

  // Individual item checkboxes
  document.querySelectorAll(".item-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      // Update select-all checkbox state based on individual checkboxes
      const allCheckboxes = document.querySelectorAll(".item-checkbox");
      const allChecked = Array.from(allCheckboxes).every((cb) => cb.checked);
      const anyChecked = Array.from(allCheckboxes).some((cb) => cb.checked);

      if (selectAllCheckbox) {
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = anyChecked && !allChecked;
      }
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

  // Close dropdown on outside click
  document.addEventListener("click", closeDropdownOnClickOutside);

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
});
