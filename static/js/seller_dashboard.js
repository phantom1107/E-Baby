// Seller Dashboard JavaScript

// ============================================================
// ORDER FILTERING
// ============================================================

/**
 * Filter orders by status
 */
function filterOrdersByStatus() {
  const filterSelect = document.getElementById('statusFilter');
  const selectedStatus = filterSelect.value;
  const rows = document.querySelectorAll('.order-row');
  const filterInfo = document.getElementById('filterInfo');
  let visibleCount = 0;

  rows.forEach(row => {
    const rowStatus = row.getAttribute('data-status');
    if (selectedStatus === '' || rowStatus === selectedStatus) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  // Update filter info
  if (selectedStatus === '') {
    filterInfo.textContent = '';
  } else {
    const statusLabel = filterSelect.options[filterSelect.selectedIndex].text;
    filterInfo.textContent = `Showing ${visibleCount} ${statusLabel.toLowerCase()} order(s)`;
  }
}

/**
 * Clear status filter
 */
function clearStatusFilter() {
  const filterSelect = document.getElementById('statusFilter');
  filterSelect.value = '';
  filterOrdersByStatus();
}

// ============================================================
// COLLAPSIBLE SECTIONS
// ============================================================

/**
 * Toggle collapsible section open/closed with animation
 */
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.classList.toggle('collapsed');
  
  // Save preference to localStorage
  const isCollapsed = section.classList.contains('collapsed');
  localStorage.setItem(`section-${sectionId}-collapsed`, isCollapsed);
  
  // Adjust modal height
  adjustModalHeight();
}

/**
 * Initialize collapsible sections with saved preferences
 */
function initializeCollapsibleSections() {
  const sections = ['section-basic', 'section-add-variant', 'section-variants', 'section-media'];
  
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    // Check if user previously collapsed this section
    const wasCollapsed = localStorage.getItem(`section-${sectionId}-collapsed`) === 'true';
    if (wasCollapsed) {
      section.classList.add('collapsed');
    }
  });
}

/**
 * Adjust modal height based on expanded/collapsed sections
 */
function adjustModalHeight() {
  const modal = document.querySelector('#editProductModal .modal-content');
  if (!modal) return;
  
  // Force reflow to calculate new height
  setTimeout(() => {
    const contentHeight = document.querySelector('.modal-body')?.scrollHeight || 'auto';
    if (modal.style.maxHeight) {
      modal.style.maxHeight = (contentHeight + 150) + 'px';
    }
  }, 50);
}

// ============================================================
// NOTIFICATION SYSTEM
// ============================================================
function showNotification(message, type = 'info') {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
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

  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Helper notification functions
function showSuccessMessage(message) {
  showNotification(message, 'success');
}

function showErrorMessage(message) {
  showNotification(message, 'error');
}

function showWarningMessage(message) {
  showNotification(message, 'warning');
}

// Global variables
let currentSection = "dashboard";
// salesChart is now managed by seller_realtime_stats.js
let productChart = null;

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeDashboard();
  initializeCharts();
  initializeEventListeners();
  initializeCollapsibleSections();
  initializeAddProductSections();
  // Initialize real-time stats and period buttons
  if (typeof initSellerStats === 'function') {
    initSellerStats();
  }
});

// Initialize dashboard
function initializeDashboard() {
  // Set active navigation item based on hash or default to dashboard
  const hash = window.location.hash.substring(1) || "dashboard";
  showSection(hash);

  // Update page title
  updatePageTitle(hash);
  
  // Initialize product count
  updateProductCount();
}

// Initialize charts
function initializeCharts() {
  // Sales chart is now handled by seller_realtime_stats.js
  // Only initialize product chart here
  initializeProductChart();
}

// Sales chart initialization removed - now handled by seller_realtime_stats.js
// The real-time chart uses updateSellerChart() from seller_realtime_stats.js

// Initialize product chart
function initializeProductChart() {
  const ctx = document.getElementById("productChart");
  if (!ctx) {
    console.warn('Product chart canvas not found');
    return;
  }

  // Fetch product performance data from server
  fetch('/api/seller/products-performance')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      console.log('Product performance data:', result);
      
      if (result.success && result.data && result.data.labels && result.data.labels.length > 0) {
        const chartData = result.data;
        
        // Destroy existing chart if it exists
        if (productChart) {
          productChart.destroy();
          productChart = null;
        }
        
        productChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: chartData.labels,
            datasets: [
              {
                data: chartData.data,
                backgroundColor: chartData.colors,
                borderColor: "#1a1a1a",
                borderWidth: 3,
                hoverBorderWidth: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: "rgba(255, 255, 255, 0.8)",
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: "circle",
                  font: {
                    size: 12,
                  },
                },
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: 'rgba(255, 255, 255, 1)',
                bodyColor: 'rgba(255, 255, 255, 0.9)',
                callbacks: {
                  label: function(context) {
                    return context.label + ': ' + context.parsed + ' units sold';
                  }
                }
              }
            },
            cutout: "60%",
          },
        });

        // Display performance list
        displayPerformanceList(chartData.details);
      } else {
        // Show empty state
        console.log('No sales data available');
        const footer = document.getElementById('productChartFooter');
        if (footer) {
          footer.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);"><i class="fas fa-inbox" style="font-size: 2em; margin-bottom: 10px;"></i><p>No product sales yet</p></div>';
        }
      }
    })
    .catch(error => {
      console.error('Error loading product performance:', error);
      const footer = document.getElementById('productChartFooter');
      if (footer) {
        footer.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;"><i class="fas fa-exclamation-circle" style="font-size: 2em; margin-bottom: 10px;"></i><p>Error: ' + error.message + '</p></div>';
      }
    });
}

function displayPerformanceList(details) {
  const listContainer = document.getElementById('performanceList');
  if (!listContainer || !details || details.length === 0) return;

  let html = '<div style="padding: 15px 0;">';
  
  details.forEach((product, index) => {
    const colors = ['#6B46C1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];
    const color = colors[index % colors.length];
    const percentage = Math.round((product.sold / Math.max(...details.map(d => d.sold))) * 100);
    
    html += `
      <div style="margin-bottom: 12px; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
            <div style="width: 12px; height: 12px; background: ${color}; border-radius: 50%;"></div>
            <div>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-weight: 500; font-size: 0.9em;">${product.name}</p>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.5); font-size: 0.8em;">${product.category}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-weight: 600;">${product.sold} units</p>
            <p style="margin: 0; color: #10b981; font-size: 0.8em;">₱${product.revenue.toFixed(2)}</p>
          </div>
        </div>
        <div style="background: rgba(255, 255, 255, 0.1); height: 4px; border-radius: 2px; overflow: hidden;">
          <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  listContainer.innerHTML = html;
}

// Initialize event listeners
function initializeEventListeners() {
  // Navigation items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const section = this.getAttribute("data-section");
      showSection(section);
    });
  });

  // File upload preview
  const imageInput = document.getElementById("product_images");
  if (imageInput) {
    imageInput.addEventListener("change", function (e) {
      previewMultipleImages(e.target);
    });
  }

  // Edit image input
  const editImageInput = document.getElementById("editImage");
  if (editImageInput) {
    editImageInput.addEventListener("change", function (e) {
      previewImage(e.target);
    });
  }

  // Form reset
  const resetBtn = document.querySelector(".reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      clearImagePreview();
      // Clear variants from localStorage
      localStorage.removeItem('productVariants');
      // Re-render empty variants table
      renderVariantsTable();
    });
  }

  // Modal close events
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      closeAllModals();
    }
  });

  // Escape key to close modals
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAllModals();
    }
  });

  // Order action buttons
  document.querySelectorAll(".prepare-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const orderId = this.getAttribute("data-order-id");
      const productName = this.getAttribute("data-product-name");
      confirmPrepareOrder(orderId, productName);
    });
  });

  document.querySelectorAll(".finish-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const orderId = this.getAttribute("data-order-id");
      const productName = this.getAttribute("data-product-name");
      confirmFinishOrder(orderId, productName);
    });
  });
}

// Show specific section
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show target section
  const targetSection = document.getElementById(sectionName + "-section");
  if (targetSection) {
    targetSection.classList.add("active");
    currentSection = sectionName;

    // Update navigation
    updateNavigation(sectionName);

    // Update URL hash
    window.location.hash = sectionName;

    // Update page title
    updatePageTitle(sectionName);

    // Load section-specific data if needed
    loadSectionData(sectionName);
  }
}

// Update navigation active state
function updateNavigation(activeSection) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
    if (item.getAttribute("data-section") === activeSection) {
      item.classList.add("active");
    }
  });
}

// Update page title based on section
function updatePageTitle(section) {
  const titleElement = document.getElementById("page-title");
  if (!titleElement) return;

  const titles = {
    dashboard: "Dashboard Overview",
    products: "My Products",
    "add-product": "Add New Product",
    orders: "Order Management",
    "sales-report": "Sales Report",
    profile: "Profile Settings",
  };

  titleElement.textContent = titles[section] || "Dashboard";
}

// Load section-specific data
function loadSectionData(section) {
  switch (section) {
    case "products":
      // Refresh products if needed
      break;
    case "orders":
      // Refresh orders if needed
      break;
    case "sales-report":
      // Initialize sales report section
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];
      document.getElementById('reportStartDate').value = firstDay.toISOString().split('T')[0];
      break;
    case "dashboard":
      // Refresh dashboard stats if needed
      refreshProductChart();
      break;
  }
}

function refreshProductChart() {
  // Destroy existing chart if it exists
  if (productChart) {
    productChart.destroy();
    productChart = null;
  }
  
  // Reinitialize the product chart
  setTimeout(() => {
    initializeProductChart();
  }, 100);
}

// Apply filters to products without leaving the page
function applyFilters() {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const salesSortFilter = document.getElementById("salesSortFilter");

  const searchValue = searchInput ? searchInput.value : "";
  const categoryValue = categoryFilter ? categoryFilter.value : "";
  const salesSortValue = salesSortFilter ? salesSortFilter.value : "";

  // Make API call to get filtered products
  const params = new URLSearchParams();
  if (searchValue) params.append("search", searchValue);
  if (categoryValue) params.append("category", categoryValue);
  if (salesSortValue) params.append("sales_sort", salesSortValue);

  fetch(`/api/seller_products?${params.toString()}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        updateProductsGrid(data.products);
      }
    })
    .catch((err) => console.error("Error fetching filtered products:", err));
}

// Update products grid with new products
function updateProductsGrid(products) {
  const container = document.querySelector(".products-grid");
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>No Products Found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
    return;
  }

  container.innerHTML = products
    .map(
      (product) => {
        // Handle image URL properly
        let imageSrc;
        if (product.image && (product.image.startsWith('http://') || product.image.startsWith('https://') || product.image.startsWith('//'))) {
          imageSrc = product.image;
        } else if (product.image && product.image.startsWith('/')) {
          imageSrc = product.image;
        } else if (product.image) {
          imageSrc = '/static/uploads/' + product.image;
        } else {
          imageSrc = '/static/images/defaults/product-default.png';
        }
        
        return `
        <div class="product-card">
            <div class="product-image">
                <img src="${imageSrc}" alt="${product.name}" onerror="this.src='/static/images/defaults/product-default.png'">
                <div class="product-actions">
                    <button class="action-btn view-btn" onclick="viewProduct('${product.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="openEditModal('${product.id}', '${product.name}', '${product.description}', '${product.price}', '${product.quantity}', '${product.category}', '${product.size}', '${product.color}', '${product.image}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="confirmDelete('${product.id}
                    }')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <div class="product-price">₱${parseFloat(product.price).toFixed(
                  2
                )}</div>
                <div class="product-stats">
                    <div class="stat">
                        <span class="stat-label">Sales:</span>
                        <span class="stat-value">${
                          product.received_orders || 0
                        }</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Stock:</span>
                        <span class="stat-value">${product.quantity}</span>
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Sidebar toggle functionality
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.querySelector(".sidebar-toggle i");

  sidebar.classList.toggle("collapsed");

  if (sidebar.classList.contains("collapsed")) {
    toggle.classList.remove("fa-chevron-left");
    toggle.classList.add("fa-chevron-right");
  } else {
    toggle.classList.remove("fa-chevron-right");
    toggle.classList.add("fa-chevron-left");
  }
}

// updateSalesChart function removed - now handled by seller_realtime_stats.js
// The real-time chart uses updateSellerChart() from seller_realtime_stats.js

// Image preview functionality
function previewImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();

    reader.onload = function (e) {
      let previewContainer;

      if (input.id === "product_images") {
        previewContainer = document.getElementById("imagePreview");
      } else if (input.id === "editImage") {
        previewContainer = document.getElementById("currentImage");
        if (previewContainer) {
          previewContainer.src = e.target.result;
          return;
        }
      }

      if (previewContainer) {
        previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1);">`;
      }
    };

    reader.readAsDataURL(input.files[0]);
  }
}

// Multiple image preview functionality
function previewMultipleImages(input) {
  const previewContainer = document.getElementById("imagePreview");
  if (!previewContainer) return;

  previewContainer.innerHTML = "";

  if (input.files) {
    Array.from(input.files).forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const imageItem = document.createElement("div");
        imageItem.className = "image-preview-item";
        imageItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="remove-image" onclick="removePreviewImage(this, ${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
        previewContainer.appendChild(imageItem);
      };

      reader.readAsDataURL(file);
    });
  }
}

// Remove preview image
function removePreviewImage(button, index) {
  const imageItem = button.parentElement;
  imageItem.remove();
}

// Clear image preview
function clearImagePreview() {
  const previewContainer = document.getElementById("imagePreview");
  if (previewContainer) {
    previewContainer.innerHTML = "";
  }
}

// Logout functionality
function showLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (modal) {
    modal.classList.add("show");
    modal.style.display = "flex";
  }
}

function closeLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
  }
}

function confirmLogout() {
  // Use centralized logout function
  logout();
}

// Product management functions
// Wrapper to read data attributes from button and call openEditModal
function openEditModalFromButton(button) {
  const id = button.dataset.productId;
  const name = button.dataset.productName;
  const description = button.dataset.productDescription;
  const price = button.dataset.productPrice;
  const category = button.dataset.productCategory;
  const image = button.dataset.productImage;
  
  openEditModal(id, name, description, price, category, image);
}

function openEditModal(
  id,
  name,
  description,
  price,
  category,
  image
) {
  console.log('openEditModal called with ID:', id);
  console.log('ID type:', typeof id);
  console.log('ID length:', id.length);
  console.log('ID bytes:', Array.from(id).map(c => c.charCodeAt(0)));
  
  const modal = document.getElementById("editProductModal");
  if (!modal) {
    console.error('Edit modal not found');
    return;
  }

  // Store product ID for later use
  window.currentEditProductId = id;

  // Populate form fields
  document.getElementById("editProductId").value = id;
  document.getElementById("editName").value = name;
  document.getElementById("editDescription").value = description;
  document.getElementById("editPrice").value = price;
  document.getElementById("editCategory").value = category;

  // Set current image - handle both Cloudinary URLs and local paths
  const currentImage = document.getElementById("currentImage");
  if (currentImage && image) {
    // Check if image is a full URL (Cloudinary) or a local path
    if (image.startsWith('http://') || image.startsWith('https://')) {
      currentImage.src = image;
    } else {
      currentImage.src = `/static/uploads/${image}`;
    }
  }

  // Load and display variant stocks
  loadVariantStocks(id);

  // Initialize collapsible sections
  initializeCollapsibleSections();

  // Show modal
  modal.classList.add("show");
  modal.style.display = "flex";
}

// Load variant stocks from API
function loadVariantStocks(productId) {
  console.log('Loading variants for product:', productId);
  fetch(`/api/product_variants/${productId}`)
    .then(response => {
      console.log('Variant response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('Variant data received:', data);
      if (data.success) {
        if (data.variants && data.variants.length > 0) {
          displayVariantStocks(data.variants);
          // Store variants for later use
          window.currentProductVariants = data.variants;
          // Update the pickers
          updateEditVariantPickers(data.variants);
          // Render the table
          renderEditVariantsTable(data.variants);
        } else {
          // No variants - show message
          console.log('No variants found for this product');
          window.currentProductVariants = [];
          showNoVariantsMessage();
        }
      } else {
        console.error('Failed to load variants:', data.error);
        showNoVariantsMessage();
      }
    })
    .catch(err => {
      console.error('Error loading variants:', err);
      showNoVariantsMessage();
    });
}

function showNoVariantsMessage() {
  const tableBody = document.getElementById("editVariantStockTable");
  const noMessage = document.getElementById("noEditVariantsMessage");
  
  if (tableBody) {
    tableBody.innerHTML = '';
  }
  
  if (noMessage) {
    noMessage.style.display = 'block';
    noMessage.innerHTML = '<i class="fas fa-inbox"></i> No variants found for this product.';
  }
}

/**
 * Show migration notice for legacy products
 */
function showMigrationNotice(productId) {
  const tableBody = document.getElementById("editVariantStockTable");
  const noMessage = document.getElementById("noEditVariantsMessage");
  
  if (tableBody) {
    tableBody.innerHTML = '';
  }
  
  if (noMessage) {
    noMessage.innerHTML = `
      <div style="padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin: 10px 0;">
        <strong>Legacy Product Detected</strong><br>
        This product was created before the variant system. Click the button below to migrate it to the new system.
        <br><br>
        <button onclick="migrateProductToVariants(${productId})" style="background: #ffc107; color: #000; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
          Migrate to Variant System
        </button>
      </div>
    `;
  }
}

/**
 * Migrate a legacy product to the new variant system
 */
function migrateProductToVariants(productId) {
  const quantity = document.getElementById('editQuantity')?.value || 0;
  
  fetch('/api/migrate_product_variants/' + productId, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stock: quantity })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showSuccessMessage('Product migrated successfully! You can now add variants.');
        // Reload the variants
        loadVariantStocks(productId);
      } else {
        showErrorMessage(data.error || 'Migration failed');
      }
    })
    .catch(err => {
      console.error('Error migrating product:', err);
      showErrorMessage('Failed to migrate product');
    });
}

// Display variant stocks in editable table (Legacy - kept for compatibility)
function displayVariantStocks(variants) {
  // Now handled by renderEditVariantsTable
}

/**
 * Update color and size pickers for edit modal based on current variants
 */
function updateEditVariantPickers(variants) {
  const colorPicker = document.getElementById("editVariantColorPicker");
  const sizePicker = document.getElementById("editVariantSizePicker");
  
  if (!colorPicker || !sizePicker) return;
  
  // Get unique colors and sizes from variants
  const colors = [...new Set(variants.map(v => v.color))];
  const sizes = [...new Set(variants.map(v => v.size))];
  
  // Update color picker
  colorPicker.innerHTML = '<option value="">-- Choose Color --</option>';
  colors.forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color;
    colorPicker.appendChild(option);
  });
  
  // Update size picker
  sizePicker.innerHTML = '<option value="">-- Choose Size --</option>';
  sizes.forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = size;
    sizePicker.appendChild(option);
  });
}

/**
 * Render variants table for edit modal
 */
function renderEditVariantsTable(variants) {
  const tableBody = document.getElementById("editVariantStockTable");
  const noMessage = document.getElementById("noEditVariantsMessage");
  
  if (!tableBody) return;
  
  if (variants.length === 0) {
    tableBody.innerHTML = '';
    if (noMessage) noMessage.style.display = 'block';
    return;
  }
  
  if (noMessage) noMessage.style.display = 'none';
  
  tableBody.innerHTML = variants.map(variant => `
    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.2s ease;" onmouseover="this.style.background='rgba(255, 255, 255, 0.03)'" onmouseout="this.style.background=''">
      <td style="padding: 1rem;">
        <span style="display: inline-block; background: rgba(236, 72, 153, 0.2); color: rgba(236, 72, 153, 1); padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 500;">${variant.color}</span>
      </td>
      <td style="padding: 1rem;">
        <span style="display: inline-block; background: rgba(99, 102, 241, 0.2); color: rgba(99, 102, 241, 1); padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 500;">${variant.size}</span>
      </td>
      <td style="padding: 1rem;">
        <span style="color: rgba(255, 255, 255, 0.8); font-weight: 600;">${variant.stock}</span>
      </td>
      <td style="padding: 1rem; text-align: center;">
        <button type="button" onclick="selectEditVariantFromTable('${variant.color}', '${variant.size}', ${variant.stock})" style="padding: 0.5rem 0.8rem; background: rgba(99, 102, 241, 0.2); color: rgba(99, 102, 241, 1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; margin-right: 0.5rem;" title="Edit stock">
          <i class="fas fa-edit"></i>
        </button>
        <button type="button" onclick="deleteVariant('${variant.id}', '${variant.color}', '${variant.size}')" style="padding: 0.5rem 0.8rem; background: rgba(239, 68, 68, 0.2); color: rgba(239, 68, 68, 1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; cursor: pointer; transition: all 0.2s ease;" title="Delete variant">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Select variant from table and load it into the editor
 */
function selectEditVariantFromTable(color, size, currentStock) {
  const colorPicker = document.getElementById("editVariantColorPicker");
  const sizePicker = document.getElementById("editVariantSizePicker");
  
  colorPicker.value = color;
  sizePicker.value = size;
  
  selectEditVariant();
}

/**
 * Delete a variant
 */
function deleteVariant(variantId, color, size) {
  if (!confirm(`Are you sure you want to delete variant "${color} - ${size}"?`)) {
    return;
  }
  
  console.log('Deleting variant:', variantId);
  
  fetch(`/api/delete_product_variant/${variantId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      console.log('Delete response:', data);
      if (data.success) {
        showSuccessMessage(`Variant "${color} - ${size}" deleted successfully`);
        // Reload variants
        const productId = window.currentEditProductId;
        if (productId) {
          loadVariantStocks(productId);
        }
      } else {
        alert(data.error || 'Failed to delete variant');
      }
    })
    .catch(error => {
      console.error('Error deleting variant:', error);
      alert('Error deleting variant: ' + error.message);
    });
}

/**
 * Select a variant combination and show its stock editor
 */
function selectEditVariant() {
  const colorPicker = document.getElementById("editVariantColorPicker");
  const sizePicker = document.getElementById("editVariantSizePicker");
  
  const color = colorPicker.value;
  const size = sizePicker.value;
  
  if (!color || !size) {
    alert("Please select both a color and size");
    return;
  }
  
  const variants = window.currentProductVariants || [];
  const variant = variants.find(v => v.color === color && v.size === size);
  
  if (!variant) {
    alert(`Variant "${color} - ${size}" not found!`);
    return;
  }
  
  // Show the editor
  const editor = document.getElementById("selectedVariantEditor");
  document.getElementById("selectedEditColor").textContent = color;
  document.getElementById("selectedEditSize").textContent = size;
  document.getElementById("editVariantStock").value = variant.stock;
  
  // Store current variant info for saving
  window.selectedEditVariant = {
    id: variant.id,
    color: color,
    size: size,
    originalStock: variant.stock
  };
  
  editor.style.display = "block";
}

/**
 * Update variant stock for the selected variant
 */
function updateEditVariantStock() {
  const newStock = parseInt(document.getElementById("editVariantStock").value);
  
  if (isNaN(newStock) || newStock < 0) {
    alert("Please enter a valid stock quantity");
    return;
  }
  
  const variantInfo = window.selectedEditVariant;
  if (!variantInfo) {
    alert("No variant selected");
    return;
  }
  
  // Update in current product variants
  const variants = window.currentProductVariants || [];
  const variant = variants.find(v => v.id === variantInfo.id);
  if (variant) {
    variant.stock = newStock;
  }
  
  // Re-render the table
  renderEditVariantsTable(variants);
  
  // Show feedback
  showSuccessMessage(`Stock updated to ${newStock} for ${variantInfo.color} - ${variantInfo.size}`);
}

/**
 * Add new variant to product
 */
function addNewProductVariant() {
  const productId = window.currentEditProductId;
  console.log('Adding variant for product:', productId);
  
  if (!productId) {
    alert("Product ID not found");
    return;
  }
  
  const size = document.getElementById("newVariantSize").value;
  const color = document.getElementById("newVariantColor").value;
  const stock = parseInt(document.getElementById("newVariantStock").value) || 0;
  
  console.log('Variant data:', { productId, size, color, stock });
  
  if (!size || !color) {
    alert("Please select both size and color");
    return;
  }
  
  // Check for duplicate
  const variants = window.currentProductVariants || [];
  if (variants.some(v => v.color === color && v.size === size)) {
    alert(`Variant "${color} - ${size}" already exists!`);
    return;
  }
  
  // Send to backend
  console.log('Sending request to /api/add_product_variant');
  fetch('/api/add_product_variant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: productId,
      color: color,
      size: size,
      stock: stock
    })
  })
    .then(response => {
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      return response.text().then(text => {
        console.log('Response text:', text);
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          throw new Error('Server returned invalid JSON: ' + text.substring(0, 100));
        }
      });
    })
    .then(data => {
      console.log('Parsed response data:', data);
      if (data.success) {
        // Clear inputs
        document.getElementById("newVariantSize").value = '';
        document.getElementById("newVariantColor").value = '';
        document.getElementById("newVariantStock").value = '0';
        
        // Reload variants
        loadVariantStocks(productId);
        
        // Show success
        showSuccessMessage(`New variant added: ${color} - ${size} with stock ${stock}`);
      } else {
        alert(data.error || 'Failed to add variant');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error adding variant: ' + error.message);
    });
}

function closeEditModal() {
  const modal = document.getElementById("editProductModal");
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
  }
}

function submitEditProduct() {
  const productId = document.getElementById("editProductId").value;
  const form = document.getElementById("editProductForm");
  if (!form || !productId) return;

  const formData = new FormData(form);

  // Collect variant stock updates from current variants
  const variantUpdates = [];
  const currentVariants = window.currentProductVariants || [];
  currentVariants.forEach(variant => {
    variantUpdates.push({ 
      variant_id: variant.id, 
      stock: parseInt(variant.stock) || 0 
    });
  });

  // Show loading state
  const submitBtn = form.querySelector('.btn-primary');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  // First, update the product
  fetch(`/update_products/${productId}`, {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Then, update variant stocks if any
        if (variantUpdates.length > 0) {
          return updateVariantStocks(productId, variantUpdates);
        }
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to update product');
      }
    })
    .then((data) => {
      if (data.success) {
        closeEditModal();
        showSuccessMessage("Product and stock updated successfully!");
        // Reload the products section
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to save changes');
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage(error.message || "Error updating product");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    });
}

// Update variant stocks via API
function updateVariantStocks(productId, updates) {
  return fetch(`/api/product_variants/${productId}/update-stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ updates })
  })
    .then(response => response.json());
}

function updateProductCount() {
  const productCount = document.querySelectorAll('.product-card').length;
  const countElement = document.getElementById('total-products-count');
  if (countElement) {
    countElement.textContent = productCount;
  }
}

function confirmDelete(productId) {
  if (
    confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    )
  ) {
    fetch(`/delete_product/${productId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Remove the product card from the UI
          const productCard = document
            .querySelector(`[onclick*="confirmDelete('${productId}')"]`)
            .closest(".product-card");
          if (productCard) {
            productCard.remove();
            updateProductCount(); // Update the product count after deletion
          }
          alert("Product deleted successfully!");
        } else {
          alert("Error deleting product: " + (data.error || "Unknown error"));
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error deleting product. Please try again.");
      });
  }
}

// View product function
function viewProduct(productId) {
  console.log('viewProduct called with ID:', productId);
  
  // Fetch product details and show in modal
  fetch(`/api/product/${productId}`)
    .then((response) => response.json())
    .then((product) => {
      console.log('Product data received:', product);
      if (product.success) {
        const p = product.data;
        document.getElementById("detailName").textContent = p.name || "N/A";
        document.getElementById("detailCategory").textContent =
          p.category || "N/A";
        document.getElementById("detailPrice").textContent = `₱${parseFloat(
          p.price
        ).toFixed(2)}`;
        document.getElementById("detailSales").textContent =
          p.received_orders || 0;
        document.getElementById("detailDescription").textContent =
          p.description || "No description available";
        
        // Handle image URL - check if it's a full URL (Cloudinary) or local path
        const imageUrl = p.image_url || p.image || 'defaults/placeholder.png';
        const detailImage = document.getElementById("detailProductImage");
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          detailImage.src = imageUrl;
        } else {
          detailImage.src = `/static/uploads/${imageUrl}`;
        }

        // Store product ID for edit action
        document.getElementById("productDetailsModal").dataset.productId =
          productId;
        document.getElementById("productDetailsModal").dataset.productName =
          p.name;
        document.getElementById(
          "productDetailsModal"
        ).dataset.productDescription = p.description;
        document.getElementById("productDetailsModal").dataset.productPrice =
          p.price;
        document.getElementById("productDetailsModal").dataset.productCategory =
          p.category;
        document.getElementById("productDetailsModal").dataset.productImage =
          imageUrl;

        // Load and display variants
        loadSellerProductVariants(productId);

        // Show modal
        showProductDetailsModal();
      }
    })
    .catch((err) => console.error("Error fetching product:", err));
}

function loadSellerProductVariants(productId) {
  fetch(`/api/product_variants/${productId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.variants && data.variants.length > 0) {
        const variants = data.variants;
        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
        
        document.getElementById("detailQuantity").textContent = totalStock;
        
        // Display variants table
        let variantHTML = '<table style="width:100%; border-collapse: collapse;"><tr style="border-bottom: 1px solid rgba(255,255,255,0.2);"><th style="padding: 8px; text-align: left; color: rgba(255,255,255,0.8);">Color</th><th style="padding: 8px; text-align: left; color: rgba(255,255,255,0.8);">Size</th><th style="padding: 8px; text-align: left; color: rgba(255,255,255,0.8);">Stock</th></tr>';
        variants.forEach(v => {
          variantHTML += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.1);"><td style="padding: 8px;"><span style="background: rgba(236,72,153,0.2); padding: 0.3rem 0.6rem; border-radius: 4px;">${v.color}</span></td><td style="padding: 8px;"><span style="background: rgba(99,102,241,0.2); padding: 0.3rem 0.6rem; border-radius: 4px;">${v.size}</span></td><td style="padding: 8px; font-weight: 600;">${v.stock}</td></tr>`;
        });
        variantHTML += '</table>';
        
        document.getElementById("detailSize").innerHTML = variantHTML;
        document.getElementById("detailColor").style.display = 'none';
      } else {
        document.getElementById("detailQuantity").textContent = 0;
        document.getElementById("detailSize").textContent = "No variants available";
        document.getElementById("detailColor").style.display = 'none';
      }
    })
    .catch(err => {
      console.error("Error loading variants:", err);
      document.getElementById("detailSize").textContent = "Error loading variants";
      document.getElementById("detailColor").style.display = 'none';
    });
}

/**
 * Show product details modal
 */
function showProductDetailsModal() {
  const modal = document.getElementById("productDetailsModal");
  if (modal) {
    console.log('Showing product details modal');
    modal.classList.add("show");
    modal.style.display = "flex";
  } else {
    console.error('Product details modal not found');
  }
}

function closeProductDetailsModal() {
  document.getElementById("productDetailsModal").classList.remove("show");
  document.getElementById("productDetailsModal").style.display = "none";
}

function editProductFromDetails() {
  const modal = document.getElementById("productDetailsModal");
  const productId = modal.dataset.productId;
  const productName = modal.dataset.productName;
  const productDescription = modal.dataset.productDescription;
  const productPrice = modal.dataset.productPrice;
  const productCategory = modal.dataset.productCategory;
  const productImage = modal.dataset.productImage;

  closeProductDetailsModal();
  openEditModal(
    productId,
    productName,
    productDescription,
    productPrice,
    productCategory,
    productImage
  );
}

// Close all modals
function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.classList.remove("show");
    modal.style.display = "none";
  });
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Handle responsive sidebar for mobile
function handleMobileMenu() {
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.add("mobile");

    // Add mobile menu toggle
    if (!document.querySelector(".mobile-menu-toggle")) {
      const toggle = document.createElement("button");
      toggle.className = "mobile-menu-toggle";
      toggle.innerHTML = '<i class="fas fa-bars"></i>';
      toggle.onclick = () => sidebar.classList.toggle("show");

      const header = document.querySelector(".header");
      if (header) {
        header.insertBefore(toggle, header.firstChild);
      }
    }
  }
}

// Handle window resize
window.addEventListener("resize", function () {
  handleMobileMenu();

  // Resize charts
  // Sales chart resize now handled by seller_realtime_stats.js
  if (productChart) productChart.resize();
});

// Initialize mobile menu on load
handleMobileMenu();

// Handle form submissions with loading states
document.addEventListener("submit", function (e) {
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (submitBtn && !form.classList.contains("no-loading")) {
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    // Re-enable after 5 seconds as fallback
    setTimeout(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }, 5000);
  }
});

// Auto-save form data to localStorage (optional)
function autoSaveForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    input.addEventListener("input", function () {
      localStorage.setItem(`${formId}_${input.name}`, input.value);
    });

    // Restore saved value
    const savedValue = localStorage.getItem(`${formId}_${input.name}`);
    if (savedValue && input.type !== "file") {
      input.value = savedValue;
    }
  });
}

// Clear auto-saved form data
function clearAutoSavedData(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    localStorage.removeItem(`${formId}_${input.name}`);
  });
}

// Initialize auto-save for product forms
document.addEventListener("DOMContentLoaded", function () {
  autoSaveForm("productForm");
  autoSaveForm("editProductForm");
});

// Success message handling
function showSuccessMessage(message) {
  const toast = document.createElement("div");
  toast.className = "toast success";
  toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Error message handling
function showErrorMessage(message) {
  const toast = document.createElement("div");
  toast.className = "toast error";
  toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Export functions for global access
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.submitEditProduct = submitEditProduct;
window.confirmDelete = confirmDelete;
window.previewImage = previewImage;
window.previewMultipleImages = previewMultipleImages;
window.removePreviewImage = removePreviewImage;
window.viewProduct = viewProduct;
window.refreshProductChart = refreshProductChart;

// ============================================================
// Order Status Update Functions with Confirmation
// ============================================================

/**
 * Show confirmation dialog for marking order as Preparing
 */
function confirmPrepareOrder(orderId, productName) {
  if (!orderId) return;

  const confirmed = confirm(
    `Are you sure you want to mark "${productName}" as Being Prepared?\n\nThe customer will be notified about this status change.`
  );

  if (confirmed) {
    prepareOrder(orderId);
  }
}

/**
 * Show confirmation dialog for marking order as Finished/Prepared
 */
function confirmFinishOrder(orderId, productName) {
  if (!orderId) return;

  const confirmed = confirm(
    `Are you sure you want to mark "${productName}" as Ready for Delivery?\n\nThe customer will be notified that their order is ready for pickup.`
  );

  if (confirmed) {
    finishOrder(orderId);
  }
}

/**
 * Update order status to Preparing via AJAX
 */
function prepareOrder(orderId) {
  if (!orderId) return;

  // Find and disable the button
  const prepareBtn = document.querySelector(
    `.prepare-btn[data-order-id="${orderId}"]`
  );
  if (prepareBtn) {
    prepareBtn.disabled = true;
    prepareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
  }

  fetch(`/seller/order/prepare/${orderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Update the status badge in the table
        updateOrderStatusInUI(orderId, "Preparing");
        showSuccessMessage(
          "Order marked as Preparing. Customer has been notified!"
        );
      } else {
        showErrorMessage(data.error || "Failed to update order status");
        // Re-enable the button on error
        if (prepareBtn) {
          prepareBtn.disabled = false;
          prepareBtn.innerHTML = '<i class="fas fa-play"></i> Prepare';
        }
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while updating the order");
      // Re-enable the button on error
      if (prepareBtn) {
        prepareBtn.disabled = false;
        prepareBtn.innerHTML = '<i class="fas fa-play"></i> Prepare';
      }
    });
}

/**
 * Update order status to Prepared via AJAX
 */
function finishOrder(orderId) {
  if (!orderId) return;

  // Find and disable the button
  const finishBtn = document.querySelector(
    `.finish-btn[data-order-id="${orderId}"]`
  );
  if (finishBtn) {
    finishBtn.disabled = true;
    finishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
  }

  fetch(`/seller/order/finish_preparing/${orderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Update the status badge in the table
        updateOrderStatusInUI(orderId, "Prepared");
        showSuccessMessage(
          "Order marked as Ready for Delivery. Customer has been notified!"
        );
      } else {
        showErrorMessage(data.error || "Failed to update order status");
        // Re-enable the button on error
        if (finishBtn) {
          finishBtn.disabled = false;
          finishBtn.innerHTML = '<i class="fas fa-check"></i> Finish';
        }
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while updating the order");
      // Re-enable the button on error
      if (finishBtn) {
        finishBtn.disabled = false;
        finishBtn.innerHTML = '<i class="fas fa-check"></i> Finish';
      }
    });
}

/**
 * Update the order status in the UI without page reload
 */
function updateOrderStatusInUI(orderId, newStatus) {
  // Find the row with this order ID
  const rows = document.querySelectorAll(".orders-table tbody tr");

  rows.forEach((row) => {
    const orderIdCell = row.querySelector("td:first-child");
    if (orderIdCell && orderIdCell.textContent.includes(`#${orderId}`)) {
      // Find the status badge
      const statusBadge = row.querySelector(".status-badge");
      if (statusBadge) {
        // Remove old status class
        statusBadge.className = `status-badge status-${newStatus.toLowerCase()}`;
        statusBadge.textContent = newStatus;
      }

      // Update button states
      const prepareBtn = row.querySelector(".prepare-btn");
      const finishBtn = row.querySelector(".finish-btn");

      if (prepareBtn) {
        if (newStatus === "Pending") {
          prepareBtn.disabled = false;
          prepareBtn.innerHTML = '<i class="fas fa-play"></i> Prepare';
        } else {
          prepareBtn.disabled = true;
        }
      }

      if (finishBtn) {
        if (newStatus === "Preparing") {
          finishBtn.disabled = false;
          finishBtn.innerHTML = '<i class="fas fa-check"></i> Finish';
        } else {
          finishBtn.disabled = true;
        }
      }
    }
  });
}

// ============================================================
// ADD PRODUCT WITH CONFIRMATION
// ============================================================

/**
 * Handle add product form submission with confirmation
 */
/**
 * Toggle collapsible section for add product form
 */
function toggleAddProductSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.classList.toggle('collapsed');
  
  // Save preference to localStorage
  const isCollapsed = section.classList.contains('collapsed');
  localStorage.setItem(`addproduct-${sectionId}-collapsed`, isCollapsed);
}

/**
 * Initialize add product collapsible sections
 */
function initializeAddProductSections() {
  const sections = ['section-add-basic', 'section-add-variants', 'section-add-media'];
  
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    // Check if user previously collapsed this section
    const wasCollapsed = localStorage.getItem(`addproduct-${sectionId}-collapsed`) === 'true';
    if (wasCollapsed) {
      section.classList.add('collapsed');
    }
  });
  
  // Render any existing variants from localStorage
  renderAddProductVariantsTable();
}

/**
 * Add a new variant to add product form
 */
function addProductVariant() {
  const sizeSelect = document.getElementById("addVariantSize");
  const colorSelect = document.getElementById("addVariantColor");
  const stockInput = document.getElementById("addVariantStock");
  
  const size = sizeSelect.value;
  const color = colorSelect.value;
  const stock = parseInt(stockInput.value) || 0;
  
  if (!size || !color) {
    showErrorMessage("Please select both a size and color");
    return;
  }
  
  // Get existing variants from localStorage
  let variants = JSON.parse(localStorage.getItem('addProductVariants')) || [];
  
  // Check for duplicate
  if (variants.some(v => v.color === color && v.size === size)) {
    showErrorMessage(`Variant "${color} - ${size}" already exists!`);
    return;
  }
  
  // Add new variant
  variants.push({ color, size, stock });
  localStorage.setItem('addProductVariants', JSON.stringify(variants));
  
  // Reset inputs
  sizeSelect.value = '';
  colorSelect.value = '';
  stockInput.value = '0';
  
  // Re-render table
  renderAddProductVariantsTable();
  
  // Visual feedback
  showSuccessMessage(`Added variant: ${color} - ${size}`);
}

/**
 * Remove variant from add product form
 */
function removeAddProductVariant(color, size) {
  if (!confirm(`Remove variant "${color} - ${size}"?`)) {
    return;
  }
  
  let variants = JSON.parse(localStorage.getItem('addProductVariants')) || [];
  variants = variants.filter(v => !(v.color === color && v.size === size));
  localStorage.setItem('addProductVariants', JSON.stringify(variants));
  
  renderAddProductVariantsTable();
  showSuccessMessage(`Removed variant: ${color} - ${size}`);
}

/**
 * Update variant stock in add product form
 */
function updateAddProductVariantStock(color, size, stock) {
  let variants = JSON.parse(localStorage.getItem('addProductVariants')) || [];
  const variant = variants.find(v => v.color === color && v.size === size);
  if (variant) {
    variant.stock = parseInt(stock) || 0;
    localStorage.setItem('addProductVariants', JSON.stringify(variants));
  }
}

/**
 * Render variants table for add product form
 */
function renderAddProductVariantsTable() {
  const variants = JSON.parse(localStorage.getItem('addProductVariants')) || [];
  const tableBody = document.getElementById("addProductVariantTable");
  const noMessage = document.getElementById("noAddVariantsMessage");
  
  if (variants.length === 0) {
    tableBody.innerHTML = '';
    noMessage.style.display = 'block';
    return;
  }
  
  noMessage.style.display = 'none';
  tableBody.innerHTML = variants.map(variant => `
    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.2s ease;" onmouseover="this.style.background='rgba(255, 255, 255, 0.03)'" onmouseout="this.style.background=''">
      <td style="padding: 1rem;">
        <span style="display: inline-block; background: rgba(236, 72, 153, 0.2); color: rgba(236, 72, 153, 1); padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 500;">${variant.color}</span>
      </td>
      <td style="padding: 1rem;">
        <span style="display: inline-block; background: rgba(99, 102, 241, 0.2); color: rgba(99, 102, 241, 1); padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 500;">${variant.size}</span>
      </td>
      <td style="padding: 1rem;">
        <input 
          type="number" 
          min="0"
          value="${variant.stock}"
          onchange="updateAddProductVariantStock('${variant.color}', '${variant.size}', this.value);"
          style="width: 120px; padding: 0.6rem; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.9); border-radius: 6px;"
        />
      </td>
      <td style="padding: 1rem; text-align: center;">
        <button type="button" onclick="removeAddProductVariant('${variant.color}', '${variant.size}')" style="padding: 0.5rem 0.8rem; background: rgba(239, 68, 68, 0.2); color: rgba(239, 68, 68, 1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; cursor: pointer; transition: all 0.2s ease;" title="Remove variant">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Get variants from localStorage for form submission
 */
function getAddProductVariants() {
  return JSON.parse(localStorage.getItem('addProductVariants')) || [];
}

/**
 * Reset add product form and clear variants
 */
function resetAddProductForm() {
  document.getElementById("addProductForm").reset();
  localStorage.removeItem('addProductVariants');
  renderAddProductVariantsTable();
  showSuccessMessage("Form cleared and variants reset");
}

function handleAddProduct(event) {
  event.preventDefault();

  // Get form data
  const form = document.getElementById("addProductForm");
  const productName = document.getElementById("product_name").value;
  const category = document.getElementById("category").value;
  const price = parseFloat(document.getElementById("regular_price").value);
  const description = document.getElementById("description").value;

  // Get variants with stock from table
  const variants = getAddProductVariants();
  
  if (variants.length === 0) {
    showErrorMessage("Please add at least one variant with stock quantity.");
    return;
  }

  const imageCount = document.getElementById("product_images").files.length;

  // Show confirmation modal
  showProductConfirmation({
    name: productName,
    category: category,
    price: price,
    description: description,
    variants: variants,
    imageCount: imageCount,
    form: form,
  });
}

/**
 * Generate variant table from selected colors and sizes
 * (Legacy - now replaced by dynamic variant management)
 */
function generateVariantTable() {
  // This function is now replaced by the new variant selector system
  // The add product form now uses single color/size pickers
}

// Handle variant selection changes with badges (Legacy - kept for compatibility)
function handleVariantSelectionChange() {
  // Legacy function - no longer used with new variant system
}

/**
 * Show product confirmation modal with details
 */
function showProductConfirmation(productData) {
  const modal = document.getElementById("addProductConfirmModal");
  const content = document.getElementById("productConfirmContent");

  // Store product data for later submission
  window.pendingProductData = productData;

  content.innerHTML = `
        <div class="product-confirmation-content">
            <div class="confirm-section">
                <h3>Product Information</h3>
                <div class="confirm-grid">
                    <div class="confirm-item">
                        <span class="confirm-label">Product Name:</span>
                        <span class="confirm-value">${productData.name}</span>
                    </div>
                    <div class="confirm-item">
                        <span class="confirm-label">Category:</span>
                        <span class="confirm-value">${productData.category}</span>
                    </div>
                    <div class="confirm-item">
                        <span class="confirm-label">Price:</span>
                        <span class="confirm-value">₱${productData.price.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="confirm-section">
                <h3>Inventory by Variant</h3>
                <div style="overflow-x: auto; max-height: 300px; overflow-y: auto; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: rgba(255, 255, 255, 0.05); position: sticky; top: 0;">
                            <tr>
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">Color</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">Size</th>
                                <th style="padding: 10px; text-align: center; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productData.variants.map(v => `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                      <span style="display: inline-block; background: rgba(236, 72, 153, 0.2); color: rgba(236, 72, 153, 1); padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 500;">${v.color}</span>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                                      <span style="display: inline-block; background: rgba(99, 102, 241, 0.2); color: rgba(99, 102, 241, 1); padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 500;">${v.size}</span>
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); text-align: center;"><strong>${v.stock}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p style="margin-top: 10px; color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
                    <strong>Total Stock:</strong> ${productData.variants.reduce((sum, v) => sum + v.stock, 0)} units across all variants
                </p>
            </div>
            
            <div class="confirm-section">
                <h3>Description</h3>
                <p class="confirm-description">${productData.description}</p>
            </div>
            
            <div class="confirm-section">
                <h3>Images</h3>
                <p class="confirm-info"><i class="fas fa-image"></i> ${productData.imageCount} image(s) will be uploaded</p>
            </div>
        </div>
    `;

  modal.classList.add("show");
  modal.style.display = "flex";
}

/**
 * Submit product after confirmation
 */
function submitAddProduct() {
  if (!window.pendingProductData) return;

  const form = window.pendingProductData.form;
  const submitBtn = form.querySelector(".submit-btn");

  // Close modal
  closeProductConfirmModal();

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Adding Product...';

  // Submit form via AJAX
  const formData = new FormData(form);
  
  // Add variants data to form
  if (window.pendingProductData.variants) {
    formData.append('variants', JSON.stringify(window.pendingProductData.variants));
  } else {
    showErrorMessage("No variants found");
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
    return;
  }

  console.log('Submitting product with variants:', window.pendingProductData.variants);

  fetch("/add_new_product", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      console.log('Response status:', response.status);
      return response.json();
    })
    .then((data) => {
      console.log('Response data:', data);
      if (data.success) {
        showSuccessMessage("Product added successfully!");
        
        // Clear localStorage variants
        localStorage.removeItem('addProductVariants');

        // Reset form
        form.reset();
        document.getElementById("imagePreview").innerHTML = "";

        // Refresh products list
        setTimeout(() => {
          showSection("products");
          location.reload();
        }, 1500);
      } else {
        showErrorMessage(data.error || "Failed to add product");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while adding the product: " + error.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
    });
}

/**
 * Close product confirmation modal
 */
function closeProductConfirmModal() {
  const modal = document.getElementById("addProductConfirmModal");
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
  }
}

// Store current chat filter
window.chatUserTypeFilter = null;

/**
 * Toggle chat dropdown menu
 */
function toggleChatDropdown(event) {
  if (event) {
    event.stopPropagation();
  }
  const dropdown = document.getElementById("chatDropdownMenu");
  const chatBtn = document.getElementById("openChatBtn");

  if (dropdown && chatBtn) {
    const isVisible = dropdown.style.display === "block";
    dropdown.style.display = isVisible ? "none" : "block";

    // Close dropdown when clicking outside
    if (!isVisible) {
      setTimeout(() => {
        const closeDropdownHandler = function (e) {
          if (
            !dropdown.contains(e.target) &&
            !chatBtn.contains(e.target) &&
            e.target !== chatBtn
          ) {
            dropdown.style.display = "none";
            document.removeEventListener("click", closeDropdownHandler);
          }
        };
        document.addEventListener("click", closeDropdownHandler);
      }, 0);
    }
  }
}

/**
 * Start chat with specific user type (Buyer or Rider)
 */
async function startChatWithUserType(userType) {
  console.log("Starting chat with user type:", userType);

  // Close dropdown
  const dropdown = document.getElementById("chatDropdownMenu");
  if (dropdown) {
    dropdown.style.display = "none";
  }

  // Store the filter
  window.chatUserTypeFilter = userType;

  // Update header based on user type
  updateChatHeader(userType);

  // Use showChatPanel from chat.js if available, otherwise manually open
  if (typeof window.showChatPanel === "function") {
    window.showChatPanel();
  } else {
    // Fallback: manually open chat panel
    const chatPanel = document.getElementById("chatPanel");
    if (chatPanel) {
      chatPanel.classList.remove("hidden");
      chatPanel.style.display = "flex";
      chatPanel.setAttribute("aria-hidden", "false");
    }
  }

  // Wait for chat.js to be ready and load threads + available users
  const loadAndFilter = async () => {
    // Wait a bit for chat panel to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Load available users of this type
    await loadAvailableUsers(userType);

    // Try to use loadThreads from chat.js
    if (typeof loadThreads === "function") {
      await loadThreads();
      // Wait for threads to render, then filter
      setTimeout(() => {
        if (typeof filterThreadsByUserType === "function") {
          filterThreadsByUserType(userType);
        }
      }, 500);
    } else {
      // Wait for chat.js to load
      let attempts = 0;
      const maxAttempts = 10;
      const checkLoadThreads = setInterval(() => {
        attempts++;
        if (typeof loadThreads === "function") {
          clearInterval(checkLoadThreads);
          loadThreads().then(() => {
            setTimeout(() => {
              if (typeof filterThreadsByUserType === "function") {
                filterThreadsByUserType(userType);
              }
            }, 500);
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(checkLoadThreads);
          console.error("loadThreads function not found after waiting");
        }
      }, 200);
    }
  };

  loadAndFilter();
}

/**
 * Load available users of a specific type and add them to the thread list
 */
async function loadAvailableUsers(userType) {
  try {
    const response = await fetch(`/chat/available-users/${userType}`);
    if (!response.ok) {
      console.error("Failed to fetch available users:", response.status);
      return;
    }

    const availableUsers = await response.json();
    console.log(
      `Found ${availableUsers.length} available ${userType} users:`,
      availableUsers
    );

    // Store available users for later use
    window.availableUsers = window.availableUsers || {};
    window.availableUsers[userType] = availableUsers;

    // Get existing thread emails to avoid duplicates
    const existingThreads = window.currentThreadsData || [];
    const existingEmails = new Set();
    existingThreads.forEach((thread) => {
      if (thread.other_user_email) {
        existingEmails.add(thread.other_user_email.toLowerCase());
      }
    });

    // Add available users that don't have existing conversations
    const threadsListEl = document.getElementById("threadsList");
    if (threadsListEl && availableUsers.length > 0) {
      const newUsers = availableUsers.filter(
        (user) => !existingEmails.has(user.email.toLowerCase())
      );

      if (newUsers.length > 0) {
        // Create thread items for new users
        // Determine what to display based on toggle state
        const displayAsName = window.showThreadNames !== false; // Default to showing names for new users
        const newThreadsHTML = newUsers
          .map((user) => {
            const threadId = createThreadId(user.email);
            const displayText =
              displayAsName && user.name ? user.name : user.email;
            return `<div class="thread-item available-user" data-id="${encodeURIComponent(
              threadId
            )}" data-other-email="${user.email}" data-other-type="${
              user.user_type
            }" data-is-new="true" data-user-name="${user.name || ""}">
            <div class="thread-name">${escapeHtml(displayText)}</div>
            <div class="thread-preview" style="color: #999; font-style: italic;">Click to start conversation</div>
          </div>`;
          })
          .join("");

        // Append to existing threads (they will be filtered later)
        const currentHTML = threadsListEl.innerHTML;
        if (currentHTML && !currentHTML.includes("available-user")) {
          threadsListEl.innerHTML = currentHTML + newThreadsHTML;
        } else if (!currentHTML || currentHTML === "Loading...") {
          threadsListEl.innerHTML = newThreadsHTML;
        }

        // Click handlers will be handled by event delegation in chat.js
        // No need to attach individual handlers here
      }
    }
  } catch (e) {
    console.error("Error loading available users:", e);
  }
}

/**
 * Create a thread ID from an email address
 */
function createThreadId(otherEmail) {
  const currentUser = document
    .querySelector('meta[name="user-email"]')
    ?.getAttribute("content");
  if (!currentUser) return otherEmail;

  // Create thread_id by combining emails in sorted order
  const emails = [currentUser, otherEmail].sort();
  return emails.join("_");
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(s) {
  if (!s) return "";
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

/**
 * Update chat header based on user type filter
 */
function updateChatHeader(userType) {
  const headerText = document.getElementById("threadsHeaderText");
  const toggleBtn = document.getElementById("toggleDisplayBtn");

  if (headerText) {
    if (userType === "Rider") {
      headerText.textContent = "Available Riders";
      if (toggleBtn) {
        toggleBtn.style.display = "flex";
        toggleBtn.innerHTML = '<i class="fas fa-user"></i>';
        toggleBtn.title = "Show Email Addresses";
      }
    } else if (userType === "Buyer") {
      headerText.textContent = "Available Buyers";
      if (toggleBtn) {
        toggleBtn.style.display = "flex";
        toggleBtn.innerHTML = '<i class="fas fa-user"></i>';
        toggleBtn.title = "Show Email Addresses";
      }
    } else {
      headerText.textContent = "Conversations";
      if (toggleBtn) toggleBtn.style.display = "none";
    }
  }

  // Initialize display mode to show names by default when filtering
  if (userType === "Rider" || userType === "Buyer" || userType === "Seller") {
    window.showThreadNames = true; // Default to showing names
  }
}

/**
 * Toggle between showing email and name in thread list
 */
function toggleThreadDisplay() {
  // Toggle the display mode
  window.showThreadNames = !window.showThreadNames;

  // Update all thread items
  const threadItems = document.querySelectorAll(".thread-item");
  threadItems.forEach((item) => {
    const threadNameEl = item.querySelector(".thread-name");
    if (threadNameEl) {
      const otherEmail = item.getAttribute("data-other-email");
      const userName = item.getAttribute("data-user-name");
      const threadId = decodeURIComponent(item.getAttribute("data-id"));

      // Get name from available users or use email
      let displayName = otherEmail || threadId;
      if (window.showThreadNames) {
        // First check data attribute
        if (userName) {
          displayName = userName;
        } else if (window.availableUsers) {
          // Find the user in available users
          for (const userType in window.availableUsers) {
            const user = window.availableUsers[userType].find(
              (u) => u.email === otherEmail
            );
            if (user && user.name) {
              displayName = user.name;
              break;
            }
          }
        }
      }

      threadNameEl.textContent = displayName;
    }
  });

  // Update button title and icon
  const toggleBtn = document.getElementById("toggleDisplayBtn");
  if (toggleBtn) {
    toggleBtn.title = window.showThreadNames
      ? "Show Email Addresses"
      : "Show Names";
    toggleBtn.innerHTML = window.showThreadNames
      ? '<i class="fas fa-envelope"></i>'
      : '<i class="fas fa-user"></i>';
  }
}

// Make functions globally available
window.updateChatHeader = updateChatHeader;
window.toggleThreadDisplay = toggleThreadDisplay;

/**
 * Filter threads by user type
 */
async function filterThreadsByUserType(userType) {
  console.log("Filtering threads by user type:", userType);
  const threadsListEl = document.getElementById("threadsList");
  if (!threadsListEl) {
    console.log("Threads list element not found");
    return;
  }

  // Get all thread items
  const threadItems = threadsListEl.querySelectorAll(".thread-item");
  console.log("Found thread items:", threadItems.length);

  if (threadItems.length === 0) {
    // Wait a bit for threads to load
    setTimeout(() => filterThreadsByUserType(userType), 500);
    return;
  }

  // Get threads data from window if available, or fetch from API
  let threadsData = window.currentThreadsData || [];
  if (threadsData.length === 0) {
    try {
      const response = await fetch("/chat/db/threads");
      if (response.ok) {
        threadsData = await response.json();
        window.currentThreadsData = threadsData;
      }
    } catch (e) {
      console.error("Error fetching threads:", e);
    }
  }

  // Create maps for filtering - group by other_user_email to show unique conversations
  const threadTypeMap = {};
  const threadEmailMap = {};
  const emailToThreadMap = {}; // Map email to thread_id for finding the right thread

  threadsData.forEach((thread) => {
    threadTypeMap[thread.thread_id] = thread.other_user_type;
    threadEmailMap[thread.thread_id] = thread.other_user_email;
    if (thread.other_user_email) {
      // If multiple threads with same email, keep the most recent
      if (
        !emailToThreadMap[thread.other_user_email] ||
        (thread.last?.timestamp &&
          emailToThreadMap[thread.other_user_email] &&
          threadsData.find(
            (t) => t.thread_id === emailToThreadMap[thread.other_user_email]
          )?.last?.timestamp < thread.last?.timestamp)
      ) {
        emailToThreadMap[thread.other_user_email] = thread.thread_id;
      }
    }
  });

  // Group visible threads by email to ensure we show unique conversations
  const visibleEmails = new Set();
  let visibleCount = 0;

  for (const item of threadItems) {
    const threadId = decodeURIComponent(item.getAttribute("data-id"));
    const otherUserType =
      item.getAttribute("data-other-type") || threadTypeMap[threadId];
    const otherUserEmail =
      item.getAttribute("data-other-email") || threadEmailMap[threadId];
    const isNewUser = item.getAttribute("data-is-new") === "true";

    // Show/hide based on filter - must match the selected user type exactly
    let shouldShow = false;
    if (userType && userType !== "All") {
      if (otherUserType === userType) {
        shouldShow = true;
      }
    } else {
      // No filter or "All" - show all
      shouldShow = true;
    }

    // If we should show this thread, check if we've already shown a thread with this email
    if (shouldShow && otherUserEmail) {
      // Check if we already have a visible thread with this email
      const preferredThreadId = emailToThreadMap[otherUserEmail];
      if (preferredThreadId && preferredThreadId !== threadId && !isNewUser) {
        // There's a preferred thread for this email, hide this one (unless it's a new available user)
        item.style.display = "none";
      } else if (visibleEmails.has(otherUserEmail) && !isNewUser) {
        // We've already shown a thread with this email, hide this duplicate (unless it's a new available user)
        item.style.display = "none";
      } else {
        // Show this thread and mark the email as seen
        item.style.display = "";
        visibleEmails.add(otherUserEmail);
        visibleCount++;
      }
    } else if (shouldShow) {
      // No email info, show it anyway
      item.style.display = "";
      visibleCount++;
    } else {
      item.style.display = "none";
    }
  }

  console.log(
    `Filtered threads: ${visibleCount} visible out of ${threadItems.length}`
  );

  // Show message if no threads match
  if (visibleCount === 0 && threadItems.length > 0) {
    const noThreadsMsg = threadsListEl.querySelector(".no-threads-filtered");
    if (!noThreadsMsg) {
      const msg = document.createElement("div");
      msg.className = "no-threads-filtered";
      msg.style.padding = "20px";
      msg.style.textAlign = "center";
      msg.style.color = "#999";
      msg.textContent = `No ${userType} conversations found`;
      threadsListEl.appendChild(msg);
    }
    // Clear selected thread if no matches
    if (typeof window.selectThread === "function") {
      window.selectedThread = null;
      const chatWithEl = document.getElementById("chatWith");
      if (chatWithEl) chatWithEl.textContent = "Select a conversation";
      const messagesEl = document.getElementById("chatMessages");
      if (messagesEl)
        messagesEl.innerHTML =
          '<div class="no-chat">No conversations available</div>';
    }
  } else {
    const noThreadsMsg = threadsListEl.querySelector(".no-threads-filtered");
    if (noThreadsMsg) {
      noThreadsMsg.remove();
    }

    // Click handlers are handled by event delegation in chat.js
    // No need to re-attach here

    // Auto-select first visible thread if none is selected or current selection is hidden
    if (visibleCount > 0) {
      const currentSelected = threadsListEl.querySelector(
        ".thread-item.active"
      );
      const isCurrentSelectedVisible =
        currentSelected && currentSelected.style.display !== "none";

      if (!isCurrentSelectedVisible) {
        const firstVisible = Array.from(threadItems).find(
          (item) => item.style.display !== "none"
        );
        if (firstVisible && typeof window.selectThread === "function") {
          const threadId = decodeURIComponent(
            firstVisible.getAttribute("data-id")
          );
          window.selectThread(threadId);
        }
      }
    }
  }
}

// ============================================================
// SALES REPORT FUNCTIONS
// ============================================================

/**
 * Generate sales report based on date range
 */
async function generateSalesReport() {
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;

  if (!startDate || !endDate) {
    alert('Please select both start and end dates');
    return;
  }

  if (startDate > endDate) {
    alert('Start date must be before end date');
    return;
  }

  try {
    const response = await fetch('/api/seller_sales_report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate
      })
    });

    const data = await response.json();

    if (data.success) {
      displaySalesReport(data.report);
      updateSalesReportSummary(data.summary);
    } else {
      alert('Error: ' + (data.error || 'Failed to generate report'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error generating report. Please try again.');
  }
}

/**
 * Display sales report data in table
 */
function displaySalesReport(reportData) {
  const tableBody = document.getElementById('salesReportTableBody');
  
  if (!reportData || reportData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" style="padding: 2rem; text-align: center; color: rgba(255, 255, 255, 0.5);"><i class="fas fa-inbox"></i> No orders found for this date range.</td></tr>';
    return;
  }

  tableBody.innerHTML = reportData.map(item => `
    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
      <td style="padding: 1rem; color: rgba(255, 255, 255, 0.9);">#${item.order_id}</td>
      <td style="padding: 1rem; color: rgba(255, 255, 255, 0.9);">${item.product_name}</td>
      <td style="padding: 1rem; text-align: center; color: rgba(255, 255, 255, 0.9);">${item.quantity}</td>
      <td style="padding: 1rem; text-align: right; color: rgba(255, 255, 255, 0.9);">₱${parseFloat(item.item_amount).toFixed(2)}</td>
      <td style="padding: 1rem; text-align: right; color: rgba(255, 255, 255, 0.9);">₱${parseFloat(item.subtotal).toFixed(2)}</td>
      <td style="padding: 1rem; text-align: right; color: #ff6b6b;">₱${parseFloat(item.admin_commission).toFixed(2)}</td>
      <td style="padding: 1rem; text-align: right; color: #51cf66; font-weight: 600;">₱${parseFloat(item.net_sales).toFixed(2)}</td>
    </tr>
  `).join('');
}

/**
 * Update summary cards
 */
function updateSalesReportSummary(summary) {
  document.getElementById('summaryTotalOrders').textContent = summary.total_orders || 0;
  document.getElementById('summaryTotalSales').textContent = '₱' + parseFloat(summary.total_sales || 0).toFixed(2);
  document.getElementById('summaryAdminCommission').textContent = '₱' + parseFloat(summary.total_admin_commission || 0).toFixed(2);
  document.getElementById('summaryNetSales').textContent = '₱' + parseFloat(summary.total_net_sales || 0).toFixed(2);
}

/**
 * Reset sales report filter
 */
function resetSalesReportFilter() {
  document.getElementById('reportStartDate').value = '';
  document.getElementById('reportEndDate').value = '';
  document.getElementById('salesReportTableBody').innerHTML = '<tr><td colspan="7" style="padding: 2rem; text-align: center; color: rgba(255, 255, 255, 0.5);"><i class="fas fa-inbox"></i> No data. Select a date range and click Filter.</td></tr>';
  
  document.getElementById('summaryTotalOrders').textContent = '0';
  document.getElementById('summaryTotalSales').textContent = '₱0.00';
  document.getElementById('summaryAdminCommission').textContent = '₱0.00';
  document.getElementById('summaryNetSales').textContent = '₱0.00';
}

/**
 * Print sales report
 */
function printSalesReport() {
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;

  if (!startDate || !endDate) {
    alert('Please generate a report first');
    return;
  }

  const printWindow = window.open('', '', 'height=600,width=800');
  
  const tableHTML = document.getElementById('salesReportTable').outerHTML;
  const summaryHTML = `
    <div style="margin-bottom: 2rem;">
      <h2>Sales Report Summary</h2>
      <p><strong>Date Range:</strong> ${startDate} to ${endDate}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
        <tr>
          <td style="padding: 1rem; border: 1px solid #ddd;"><strong>Total Orders:</strong></td>
          <td style="padding: 1rem; border: 1px solid #ddd;">${document.getElementById('summaryTotalOrders').textContent}</td>
        </tr>
        <tr>
          <td style="padding: 1rem; border: 1px solid #ddd;"><strong>Total Sales:</strong></td>
          <td style="padding: 1rem; border: 1px solid #ddd;">${document.getElementById('summaryTotalSales').textContent}</td>
        </tr>
        <tr>
          <td style="padding: 1rem; border: 1px solid #ddd;"><strong>Admin Commission:</strong></td>
          <td style="padding: 1rem; border: 1px solid #ddd;">${document.getElementById('summaryAdminCommission').textContent}</td>
        </tr>
        <tr>
          <td style="padding: 1rem; border: 1px solid #ddd;"><strong>Net Sales (Your Earnings):</strong></td>
          <td style="padding: 1rem; border: 1px solid #ddd;"><strong>${document.getElementById('summaryNetSales').textContent}</strong></td>
        </tr>
      </table>
    </div>
  `;

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>E-Baby Sales Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 2rem; }
        h1 { text-align: center; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { border: 1px solid #ddd; padding: 0.8rem; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #fafafa; }
        .summary { margin-bottom: 2rem; }
        @media print {
          body { margin: 1rem; }
        }
      </style>
    </head>
    <body>
      <h1>E-Baby Sales Report</h1>
      ${summaryHTML}
      ${tableHTML}
      <div style="margin-top: 2rem; font-size: 12px; color: #666;">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>This is an automated report from E-Baby seller dashboard.</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Export sales report to CSV
 */
function exportSalesReportToCSV() {
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;

  if (!startDate || !endDate) {
    alert('Please generate a report first');
    return;
  }

  const tableBody = document.getElementById('salesReportTableBody');
  const rows = tableBody.querySelectorAll('tr');

  if (rows.length === 1 && rows[0].querySelector('td[colspan]')) {
    alert('No data to export');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'E-Baby Sales Report\n';
  csvContent += `Date Range: ${startDate} to ${endDate}\n`;
  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Summary
  csvContent += 'SUMMARY\n';
  csvContent += `Total Orders,${document.getElementById('summaryTotalOrders').textContent}\n`;
  csvContent += `Total Sales,${document.getElementById('summaryTotalSales').textContent}\n`;
  csvContent += `Admin Commission,${document.getElementById('summaryAdminCommission').textContent}\n`;
  csvContent += `Net Sales,${document.getElementById('summaryNetSales').textContent}\n\n`;

  // Table Header
  csvContent += 'Order ID,Product Name,Quantity,Item Amount,Subtotal,Admin Commission,Net Sales\n';

  // Table Body
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length === 7) {
      const rowData = Array.from(cells).map(cell => {
        let text = cell.textContent.trim();
        // Remove currency symbols for cleaner CSV
        text = text.replace('₱', '').replace('#', '');
        // Quote fields that contain commas
        if (text.includes(',')) {
          text = `"${text}"`;
        }
        return text;
      });
      csvContent += rowData.join(',') + '\n';
    }
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `E-Baby_Sales_Report_${startDate}_${endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Make functions globally available
window.toggleChatDropdown = toggleChatDropdown;
window.startChatWithUserType = startChatWithUserType;
window.filterThreadsByUserType = filterThreadsByUserType;
window.loadAvailableUsers = loadAvailableUsers;
window.createThreadId = createThreadId;
window.filterThreadsByUserType = filterThreadsByUserType;
