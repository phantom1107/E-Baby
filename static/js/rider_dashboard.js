// Rider Dashboard JavaScript

// Global variables
let currentSection = "dashboard";
let deliveryChart = null;
let earningsChart = null;
let monthlyEarningsChart = null;

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeDashboard();
  initializeCharts();
  initializeEventListeners();
});

// Initialize dashboard
function initializeDashboard() {
  // Set active navigation item based on hash or default to dashboard
  const hash = window.location.hash.substring(1) || "dashboard";
  showSection(hash);

  // Update page title
  updatePageTitle(hash);
}

// Initialize charts
function initializeCharts() {
  initializeDeliveryChart();
  initializeEarningsChart();
  initializeMonthlyEarningsChart();
}

// Initialize delivery performance chart
function initializeDeliveryChart() {
  const ctx = document.getElementById("deliveryChart");
  if (!ctx) return;

  // Fetch real earnings data for daily breakdown
  fetch('/api/rider/earnings')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.daily_earnings && data.daily_earnings.length > 0) {
        // Process daily earnings data
        const labels = data.daily_earnings.map(item => {
          // Parse YYYY-MM-DD format from backend
          try {
            const [year, month, day] = item.date.split('-');
            const date = new Date(year, parseInt(month) - 1, parseInt(day));
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } catch (e) {
            return item.date || 'Invalid';
          }
        });
        const values = data.daily_earnings.map(item => parseFloat(item.daily_earnings) || 0);
        
        deliveryChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Daily Earnings (₱)",
                data: values,
                borderColor: "#6B46C1",
                backgroundColor: "rgba(107, 70, 193, 0.1)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#6B46C1",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                labels: {
                  color: "rgba(255, 255, 255, 0.8)",
                },
              },
            },
            scales: {
              x: {
                grid: {
                  color: "rgba(255, 255, 255, 0.1)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
                ticks: {
                  color: "rgba(255, 255, 255, 0.7)",
                },
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: "rgba(255, 255, 255, 0.1)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
                ticks: {
                  color: "rgba(255, 255, 255, 0.7)",
                },
              },
            },
            interaction: {
              intersect: false,
              mode: "index",
            },
          },
        });
      } else {
        // Fallback if no data
        initializeDefaultDeliveryChart();
      }
    })
    .catch(error => {
      console.error('Error loading delivery data:', error);
      initializeDefaultDeliveryChart();
    });
}

function initializeDefaultDeliveryChart() {
  const ctx = document.getElementById("deliveryChart");
  if (!ctx) return;

  deliveryChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Daily Earnings (₱)",
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: "#6B46C1",
          backgroundColor: "rgba(107, 70, 193, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#6B46C1",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)",
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)",
          },
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
    },
  });
}

// Initialize earnings overview chart
function initializeEarningsChart() {
  const ctx = document.getElementById("earningsChart");
  if (!ctx) return;

  // Fetch real earnings data
  fetch('/api/rider/earnings')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.weekly_earnings && data.weekly_earnings.length > 0) {
        // Calculate week totals using the last entries from the returned array
        // (safer than attempting a local week-number calculation that may not match MySQL's WEEK())
        let thisWeek = 0, lastWeek = 0, previousWeeks = 0;
        const weeklies = data.weekly_earnings.slice().map(item => ({
          week: item.week,
          weekly_earnings: parseFloat(item.weekly_earnings) || 0
        }));

        // Ensure weeks are ordered by week value (ascending)
        weeklies.sort((a, b) => a.week - b.week);

        if (weeklies.length >= 1) {
          thisWeek = weeklies[weeklies.length - 1].weekly_earnings || 0;
        }
        if (weeklies.length >= 2) {
          lastWeek = weeklies[weeklies.length - 2].weekly_earnings || 0;
        }
        if (weeklies.length > 2) {
          previousWeeks = weeklies.slice(0, weeklies.length - 2).reduce((s, w) => s + (w.weekly_earnings || 0), 0);
        }

        earningsChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["This Week", "Last Week", "Previous Weeks"],
            datasets: [
              {
                data: [thisWeek, lastWeek, previousWeeks],
                backgroundColor: ["#10B981", "#F59E0B", "#6B46C1"],
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
                },
              },
            },
            cutout: "60%",
          },
        });
      } else {
        initializeDefaultEarningsChart();
      }
    })
    .catch(error => {
      console.error('Error loading earnings data:', error);
      initializeDefaultEarningsChart();
    });
}

function initializeDefaultEarningsChart() {
  const ctx = document.getElementById("earningsChart");
  if (!ctx) return;

  earningsChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["This Week", "Last Week", "Previous Weeks"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: ["#10B981", "#F59E0B", "#6B46C1"],
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
          },
        },
      },
      cutout: "60%",
    },
  });
}

// Initialize monthly earnings chart (Weekly Breakdown)
function initializeMonthlyEarningsChart() {
  const ctx = document.getElementById("monthlyEarningsChart");
  if (!ctx) return;

  // Fetch real earnings data
  fetch('/api/rider/earnings')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.weekly_earnings && data.weekly_earnings.length > 0) {
        const weeklies = data.weekly_earnings;
        
        // Map week numbers to labels (Week 1, Week 2, etc.)
        const labels = weeklies.map((item, index) => `Week ${index + 1}`);
        const values = weeklies.map(item => parseFloat(item.weekly_earnings) || 0);

        monthlyEarningsChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Weekly Earnings (₱)",
                data: values,
                backgroundColor: "#10B981",
                borderColor: "#10B981",
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                labels: {
                  color: "rgba(255, 255, 255, 0.8)",
                },
              },
            },
            scales: {
              x: {
                grid: {
                  color: "rgba(255, 255, 255, 0.1)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
                ticks: {
                  color: "rgba(255, 255, 255, 0.7)",
                },
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: "rgba(255, 255, 255, 0.1)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
                ticks: {
                  color: "rgba(255, 255, 255, 0.7)",
                  callback: function (value) {
                    return "₱" + value;
                  },
                },
              },
            },
          },
        });
      } else {
        initializeDefaultMonthlyEarningsChart();
      }
    })
    .catch(error => {
      console.error('Error loading monthly earnings:', error);
      initializeDefaultMonthlyEarningsChart();
    });
}

function initializeDefaultMonthlyEarningsChart() {
  const ctx = document.getElementById("monthlyEarningsChart");
  if (!ctx) return;

  monthlyEarningsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          label: "Weekly Earnings (₱)",
          data: [0, 0, 0, 0],
          backgroundColor: "#10B981",
          borderColor: "#10B981",
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)",
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)",
            callback: function (value) {
              return "₱" + value;
            },
          },
        },
      },
    },
  });
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

  // Period buttons for charts
  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".period-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      updateDeliveryChart(this.getAttribute("data-period"));
    });
  });

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
    dashboard: "Rider Dashboard",
    orders: "Available Orders",
    deliveries: "My Deliveries",
    earnings: "Earnings Overview",
    profile: "Profile Settings",
  };

  titleElement.textContent = titles[section] || "Rider Dashboard";
}

// Load section-specific data
function loadSectionData(section) {
  switch (section) {
    case "orders":
      // Refresh available orders if needed
      break;
    case "deliveries":
      // Refresh delivery history if needed
      break;
    case "earnings":
      // Refresh earnings data if needed
      break;
    case "dashboard":
      // Refresh dashboard stats if needed
      break;
  }
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

// Update delivery chart based on period
function updateDeliveryChart(period) {
  if (!deliveryChart) return;

  const data = {
    week: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      data: [3, 5, 2, 8, 6, 4, 7],
    },
    month: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      data: [18, 22, 16, 25],
    },
    year: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      data: [45, 52, 38, 61, 55, 67, 72, 68, 59, 74, 69, 81],
    },
  };

  const periodData = data[period] || data.week;

  deliveryChart.data.labels = periodData.labels;
  deliveryChart.data.datasets[0].data = periodData.data;
  deliveryChart.update("active");
}

// Logout functionality
function showLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (modal) {
    modal.classList.add("show");
  }
}

function closeLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

function confirmLogout() {
  // Use centralized logout function
  logout();
}

// Order management functions
function refreshOrders() {
  // Show loading state
  const refreshBtn = document.querySelector(".refresh-btn");
  if (refreshBtn) {
    const originalText = refreshBtn.innerHTML;
    refreshBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    refreshBtn.disabled = true;

    // Simulate refresh (replace with actual API call)
    setTimeout(() => {
      refreshBtn.innerHTML = originalText;
      refreshBtn.disabled = false;
      showSuccessMessage("Orders refreshed successfully");
      // Reload the page or update the orders section
      location.reload();
    }, 2000);
  }
}

function viewOrderDetails(orderId) {
  const modal = document.getElementById("orderDetailsModal");
  const content = document.getElementById("orderDetailsContent");

  if (!modal || !content) return;

  // Show loading state
  content.innerHTML =
    '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading order details...</div>';

  // Show modal
  modal.classList.add("show");

  // Fetch real order details from API
  fetch(`/api/order/${orderId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const order = data.data;
        content.innerHTML = `
                    <div class="order-details-content">
                        <div class="detail-section">
                            <h3>Order Information</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Status:</span>
                                    <span class="detail-value status-badge status-${order.status.toLowerCase()}">${
          order.status
        }</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Customer Email:</span>
                                    <span class="detail-value">${
                                      order.email
                                    }</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Payment Method:</span>
                                    <span class="detail-value">${
                                      order.payment_method
                                    }</span>
                                </div>
                            </div>
                        </div>
                        <div class="detail-section">
                            <h3>Product Information</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Product Name:</span>
                                    <span class="detail-value">${
                                      order.product_name
                                    }</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Category:</span>
                                    <span class="detail-value">${
                                      order.category
                                    }</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Quantity:</span>
                                    <span class="detail-value">${
                                      order.quantity
                                    }</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Total Price:</span>
                                    <span class="detail-value">₱${parseFloat(
                                      order.total_price
                                    ).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="detail-section">
                            <h3>Delivery Information</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Delivery Address:</span>
                                    <span class="detail-value">${
                                      order.delivery_address
                                    }</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
      } else {
        content.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>${data.error || "Failed to load order details"}</p>
                    </div>
                `;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      content.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>An error occurred while loading order details</p>
                </div>
            `;
    });
}

function closeOrderDetailsModal() {
  const modal = document.getElementById("orderDetailsModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

// Delivery management functions
function filterDeliveries(status) {
  const rows = document.querySelectorAll(".deliveries-table tbody tr");

  rows.forEach((row) => {
    if (status === "all") {
      row.style.display = "";
    } else {
      const statusBadge = row.querySelector(".status-badge");
      if (statusBadge) {
        const rowStatus = statusBadge.textContent
          .toLowerCase()
          .replace(/\s+/g, "-");
        row.style.display = rowStatus === status ? "" : "none";
      }
    }
  });
}

function completeDelivery(deliveryId) {
  // Fetch delivery details first to calculate commission
  fetch(`/api/order/${deliveryId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const orderData = data.data;
        const totalPrice = parseFloat(orderData.total_price) || 0;
        const shippingFee = parseFloat(orderData.shipping_fee) || 38.00;
        
        // Calculate commission: for every 2000 of order total, add 5 pesos
        // Formula: (total_price / 2000) * 5
        const commission = (totalPrice / 2000.0) * 5.0;
        const totalEarnings = commission + shippingFee;

        // Show custom modal instead of browser confirm
        showCompleteDeliveryModal(orderData, commission, shippingFee, totalEarnings, deliveryId);
      } else {
        showErrorMessage("Failed to load delivery details");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while loading delivery details");
    });
}

function showCompleteDeliveryModal(orderData, commission, shippingFee, totalEarnings, deliveryId) {
  // Remove existing modal if any
  const existingModal = document.getElementById('completeDeliveryModal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'completeDeliveryModal';
  modal.className = 'modal';
  
  const totalPrice = parseFloat(orderData.total_price) || 0;
  
  modal.innerHTML = `
    <div class="modal-content large">
      <div class="modal-header">
        <h2><i class="fas fa-check-circle"></i> Complete Delivery</h2>
        <button class="close-btn" onclick="closeCompleteDeliveryModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="delivery-complete-container">
          <!-- Order Summary Card -->
          <div class="complete-card order-card">
            <div class="card-icon">
              <i class="fas fa-box"></i>
            </div>
            <h3>Order Details</h3>
            <div class="card-content">
              <div class="info-row">
                <span class="label">Product:</span>
                <span class="value">${orderData.product_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Customer:</span>
                <span class="value">${orderData.email}</span>
              </div>
              <div class="info-row">
                <span class="label">Order Total:</span>
                <span class="value amount">₱${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Commission Card -->
          <div class="complete-card commission-card">
            <div class="card-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <h3>Your Earnings Breakdown</h3>
            <div class="card-content">
              <div class="commission-breakdown">
                <div class="earnings-row">
                  <span class="earnings-label">Commission (₱5 per ₱2,000):</span>
                  <span class="earnings-value">₱${commission.toFixed(2)}</span>
                </div>
                <div class="earnings-row">
                  <span class="earnings-label">Shipping Fee:</span>
                  <span class="earnings-value">₱${shippingFee.toFixed(2)}</span>
                </div>
                <div class="earnings-row total">
                  <span class="earnings-label"><strong>Total Earnings:</strong></span>
                  <span class="earnings-value total"><strong>₱${totalEarnings.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Confirmation Message -->
          <div class="complete-card confirmation-card">
            <div class="card-icon">
              <i class="fas fa-exclamation-circle"></i>
            </div>
            <h3>Confirm Action</h3>
            <div class="card-content">
              <p>By clicking "Complete Delivery", you confirm that you have successfully delivered this order to the customer.</p>
              <div class="terms-check">
                <input type="checkbox" id="confirmCheck" />
                <label for="confirmCheck">I have delivered the order and received payment confirmation</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button onclick="closeCompleteDeliveryModal()" class="btn-secondary">
          <i class="fas fa-times"></i> Cancel
        </button>
        <button onclick="confirmCompleteDelivery('${deliveryId}', ${totalEarnings})" class="btn-primary" id="completeConfirmBtn">
          <i class="fas fa-check"></i> Complete Delivery & Claim Earnings
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.classList.add('show');

  // Disable confirm button until checkbox is checked
  const confirmCheck = document.getElementById('confirmCheck');
  const confirmBtn = document.getElementById('completeConfirmBtn');
  
  confirmCheck.addEventListener('change', function() {
    confirmBtn.disabled = !this.checked;
  });
  confirmBtn.disabled = true;
}

function closeCompleteDeliveryModal() {
  const modal = document.getElementById('completeDeliveryModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

function confirmCompleteDelivery(deliveryId, totalEarnings) {
  // Call the completion endpoint
  // Backend will calculate commission from order data and add shipping fee
  fetch(`/rider/order/complete/${deliveryId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({})  // Backend handles all calculations
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        closeCompleteDeliveryModal();
        // Show the message from backend which includes breakdown
        showSuccessMessage(data.message || `Delivery completed! Total earnings: ₱${totalEarnings.toFixed(2)}`);
        // Update the status in the table or reload
        setTimeout(() => {
          location.reload();
        }, 1500);
      } else {
        showErrorMessage(data.error || "Failed to complete delivery");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while completing the delivery");
    });
}

function viewDeliveryDetails(deliveryId) {
  // Similar to viewOrderDetails but for completed deliveries
  viewOrderDetails(deliveryId);
}

/**
 * Cancel delivery - changes status back to 'Prepared'
 */
function cancelDelivery(deliveryId) {
  if (!deliveryId) return;

  const confirmed = confirm(
    `Are you sure you want to cancel this delivery?\n\n` +
    `Order #${deliveryId}\n\n` +
    `This will release the order back to available orders.`
  );

  if (!confirmed) return;

  // Disable button and show loading state
  const buttons = document.querySelectorAll(`[onclick="cancelDelivery('${deliveryId}')"]`);
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
  });

  fetch(`/rider/order/cancel/${deliveryId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showSuccessMessage('Delivery cancelled. Order released back to available.');
        // Remove the delivery from the table or reload
        setTimeout(() => {
          location.reload();
        }, 1500);
      } else {
        showErrorMessage(data.error || "Failed to cancel delivery");
        // Re-enable button
        buttons.forEach(btn => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-times"></i> Cancel';
        });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while cancelling the delivery");
      // Re-enable button
      buttons.forEach(btn => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-times"></i> Cancel';
      });
    });
}

// Availability management
function showAvailabilityModal() {
  const modal = document.getElementById("availabilityModal");
  if (modal) {
    modal.classList.add("show");
  }
}

function closeAvailabilityModal() {
  const modal = document.getElementById("availabilityModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

function saveAvailability() {
  const form = document.getElementById("availabilityForm");
  const formData = new FormData(form);

  const selectedDays = [];
  document
    .querySelectorAll('input[name="days"]:checked')
    .forEach((checkbox) => {
      selectedDays.push(checkbox.value);
    });

  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;

  const availabilityData = {
    days: selectedDays,
    start_time: startTime,
    end_time: endTime,
  };

  fetch("/update_availability", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(availabilityData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showSuccessMessage("Availability updated successfully");
        closeAvailabilityModal();
      } else {
        showErrorMessage(data.message || "Failed to update availability");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while updating availability");
    });
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
    hour: "2-digit",
    minute: "2-digit",
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
  if (deliveryChart) deliveryChart.resize();
  if (earningsChart) earningsChart.resize();
  if (monthlyEarningsChart) monthlyEarningsChart.resize();
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

// Real-time order updates (WebSocket or polling)
function initializeOrderUpdates() {
  // This would typically connect to a WebSocket or use polling
  // For now, we'll simulate with a simple interval
  setInterval(() => {
    // Check for new orders
    // Update notification badge
    // Show toast notifications for new orders
  }, 30000); // Check every 30 seconds
}

// Initialize order updates
initializeOrderUpdates();

// ============================================================
// ORDER ACCEPTANCE FUNCTIONS WITH CONFIRMATION
// ============================================================

/**
 * Show confirmation modal with order details before accepting delivery
 */
function confirmAcceptDelivery(button) {
  const orderId = button.getAttribute("data-order-id");
  const orderName = button.getAttribute("data-order-name");

  if (!orderId) return;

  // Fetch full order details
  fetch(`/api/order/${orderId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAcceptDeliveryModal(data.data, button);
      } else {
        showErrorMessage(data.error || "Failed to load order details");
      }
    })
    .catch(error => {
      console.error("Error:", error);
      showErrorMessage("Error loading order details");
    });
}

/**
 * Show modal with order details for confirmation
 */
function showAcceptDeliveryModal(orderData, button) {
  const modal = document.getElementById('acceptDeliveryModal');
  if (!modal) {
    createAcceptDeliveryModal();
  }

  // Calculate commission based on total price: for every 2000, add 5 pesos
  const totalPrice = parseFloat(orderData.total_price) || 0;
  const commission = (totalPrice / 2000.0) * 5.0;
  const shippingFee = parseFloat(orderData.shipping_fee) || 38.00;
  const totalEarnings = commission + shippingFee;

  // Populate modal content
  const modalContent = document.getElementById('acceptDeliveryContent') || document.querySelector('#acceptDeliveryModal .modal-body');
  
  if (modalContent) {
    modalContent.innerHTML = `
      <div class="order-confirmation-details">
        <div class="confirmation-section">
          <h3><i class="fas fa-box"></i> Order Information</h3>
          <div class="detail-row">
            <span class="detail-label">Product:</span>
            <span class="detail-value">${orderData.product_name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${orderData.category}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Quantity:</span>
            <span class="detail-value">${orderData.quantity}</span>
          </div>
        </div>

        <div class="confirmation-section">
          <h3><i class="fas fa-store"></i> Seller Information</h3>
          <div class="detail-row">
            <span class="detail-label">Seller Name:</span>
            <span class="detail-value">${orderData.seller_name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Seller Email:</span>
            <span class="detail-value">${orderData.seller_email}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${orderData.seller_phone}</span>
          </div>
        </div>

        <div class="confirmation-section">
          <h3><i class="fas fa-user"></i> Customer Information</h3>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${orderData.email}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Delivery Address:</span>
            <span class="detail-value">${orderData.delivery_address}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${orderData.payment_method}</span>
          </div>
        </div>

        <div class="confirmation-section">
          <h3><i class="fas fa-money-bill-wave"></i> Payment & Earnings</h3>
          <div class="detail-row">
            <span class="detail-label">Order Total:</span>
            <span class="detail-value amount">₱${parseFloat(orderData.total_price).toFixed(2)}</span>
          </div>
          <div class="detail-row commission-info">
            <span class="detail-label">Your Commission (₱5 per ₱2,000):</span>
            <span class="detail-value commission">₱${commission.toFixed(2)}</span>
          </div>
          <div class="detail-row commission-info">
            <span class="detail-label">Shipping Fee:</span>
            <span class="detail-value">₱${shippingFee.toFixed(2)}</span>
          </div>
          <div class="detail-row commission-info" style="border-top: 2px solid #d1d5db; padding-top: 10px; margin-top: 10px;">
            <span class="detail-label"><strong>Total Earnings:</strong></span>
            <span class="detail-value commission" style="font-size: 1.1em;"><strong>₱${totalEarnings.toFixed(2)}</strong></span>
          </div>
        </div>

        <div class="confirmation-warning">
          <i class="fas fa-exclamation-circle"></i>
          <p>By accepting this delivery, you agree to pick up from the seller and deliver this order to the customer's address.</p>
        </div>
      </div>
    `;
  }

  // Show modal
  const acceptModal = document.getElementById('acceptDeliveryModal');
  if (acceptModal) {
    acceptModal.classList.add('show');
    
    // Update confirm button with order ID
    const confirmBtn = document.getElementById('confirmAcceptBtn');
    if (confirmBtn) {
      confirmBtn.onclick = function() {
        acceptDelivery(button, orderData.id);
        acceptModal.classList.remove('show');
      };
    }
  }
}

/**
 * Create the accept delivery modal if it doesn't exist
 */
function createAcceptDeliveryModal() {
  if (document.getElementById('acceptDeliveryModal')) return;

  const modal = document.createElement('div');
  modal.id = 'acceptDeliveryModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content large">
      <div class="modal-header">
        <h2><i class="fas fa-truck"></i> Confirm Delivery Acceptance</h2>
        <button class="close-btn" onclick="closeAcceptDeliveryModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body" id="acceptDeliveryContent">
        <!-- Content populated by JavaScript -->
      </div>
      <div class="modal-actions">
        <button id="confirmAcceptBtn" class="btn-primary">
          <i class="fas fa-check"></i> Accept & Pick Up
        </button>
        <button onclick="closeAcceptDeliveryModal()" class="btn-secondary">
          <i class="fas fa-times"></i> Cancel
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

/**
 * Close accept delivery modal
 */
function closeAcceptDeliveryModal() {
  const modal = document.getElementById('acceptDeliveryModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

/**
 * Accept delivery via AJAX - Changes status to "Shipping" with location
 */
function acceptDelivery(button, orderId) {
  if (!button || !orderId) return;

  // Disable button and show loading state
  button.disabled = true;
  const originalHTML = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';

  // Get rider's current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const riderLat = position.coords.latitude;
        const riderLng = position.coords.longitude;
        
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accepting...';

        fetch(`/rider/order/accept/${orderId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rider_lat: riderLat,
            rider_lng: riderLng
          })
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              // Remove the order card from the UI
              const orderCard = button.closest(".order-card");
              if (orderCard) {
                orderCard.style.transition = "all 0.3s ease";
                orderCard.style.opacity = "0.5";
                orderCard.style.pointerEvents = "none";

                setTimeout(() => {
                  orderCard.remove();

                  // Check if there are any orders left
                  const container =
                    button.closest(".orders-grid") ||
                    button.closest(".prepared-orders-container");
                  if (container) {
                    const remainingCards = container.querySelectorAll(".order-card");
                    if (remainingCards.length === 0) {
                      // Show empty state or reload
                      location.reload();
                    }
                  }
                }, 300);
              }

              const distanceMsg = data.distance_km > 0 
                ? ` Distance: ${data.distance_km.toFixed(2)} km. Earnings: ₱${data.total_earnings.toFixed(2)}`
                : '';
              showSuccessMessage(
                `Order accepted!${distanceMsg} It will now appear in 'My Deliveries' as 'Shipping'.`
              );

              // Refresh orders list and switch to deliveries tab
              setTimeout(() => {
                refreshOrders();
                showSection('deliveries');
              }, 1000);
            } else {
              showErrorMessage(data.error || "Failed to accept delivery");
              // Re-enable button
              button.disabled = false;
              button.innerHTML = originalHTML;
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            showErrorMessage("An error occurred while accepting the delivery");
            // Re-enable button
            button.disabled = false;
            button.innerHTML = originalHTML;
          });
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Accept without location if permission denied
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accepting...';
        
        fetch(`/rider/order/accept/${orderId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              const orderCard = button.closest(".order-card");
              if (orderCard) {
                orderCard.style.transition = "all 0.3s ease";
                orderCard.style.opacity = "0.5";
                orderCard.style.pointerEvents = "none";
                setTimeout(() => {
                  orderCard.remove();
                  const container = button.closest(".orders-grid") || button.closest(".prepared-orders-container");
                  if (container && container.querySelectorAll(".order-card").length === 0) {
                    location.reload();
                  }
                }, 300);
              }
              showSuccessMessage("Order accepted! (Location unavailable)");
              setTimeout(() => {
                refreshOrders();
                showSection('deliveries');
              }, 1000);
            } else {
              showErrorMessage(data.error || "Failed to accept delivery");
              button.disabled = false;
              button.innerHTML = originalHTML;
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            showErrorMessage("An error occurred while accepting the delivery");
            button.disabled = false;
            button.innerHTML = originalHTML;
          });
      }
    );
  } else {
    // Browser doesn't support geolocation, accept without location
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accepting...';
    
    fetch(`/rider/order/accept/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const orderCard = button.closest(".order-card");
          if (orderCard) {
            orderCard.style.transition = "all 0.3s ease";
            orderCard.style.opacity = "0.5";
            orderCard.style.pointerEvents = "none";
            setTimeout(() => {
              orderCard.remove();
              const container = button.closest(".orders-grid") || button.closest(".prepared-orders-container");
              if (container && container.querySelectorAll(".order-card").length === 0) {
                location.reload();
              }
            }, 300);
          }
          showSuccessMessage("Order accepted! (Location unavailable)");
          setTimeout(() => {
            refreshOrders();
            showSection('deliveries');
          }, 1000);
        } else {
          showErrorMessage(data.error || "Failed to accept delivery");
          button.disabled = false;
          button.innerHTML = originalHTML;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showErrorMessage("An error occurred while accepting the delivery");
        button.disabled = false;
      button.innerHTML = originalHTML;
    });
}

// Export functions for global access
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;
window.refreshOrders = refreshOrders;
window.viewOrderDetails = viewOrderDetails;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.filterDeliveries = filterDeliveries;
window.completeDelivery = completeDelivery;
window.viewDeliveryDetails = viewDeliveryDetails;
window.showAvailabilityModal = showAvailabilityModal;
window.closeAvailabilityModal = closeAvailabilityModal;
window.saveAvailability = saveAvailability;
window.confirmAcceptDelivery = confirmAcceptDelivery;
window.acceptDelivery = acceptDelivery;
window.closeAcceptDeliveryModal = closeAcceptDeliveryModal;
window.completeDelivery = completeDelivery;
window.cancelDelivery = cancelDelivery;
window.viewDeliveryDetails = viewDeliveryDetails;

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
 * Start chat with specific user type (Buyer or Seller)
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
    if (userType === "Seller") {
      headerText.textContent = "Available Sellers";
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

// Make functions globally available
window.toggleChatDropdown = toggleChatDropdown;
window.startChatWithUserType = startChatWithUserType;
window.filterThreadsByUserType = filterThreadsByUserType;
window.loadAvailableUsers = loadAvailableUsers;
window.createThreadId = createThreadId;
window.filterThreadsByUserType = filterThreadsByUserType;
