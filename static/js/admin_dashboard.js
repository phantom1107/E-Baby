// Admin Dashboard JavaScript

// Global variables
let currentSection = "dashboard";
let userChart = null;
let distributionChart = null;

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeDashboard();
  initializeCharts();
  initializeEventListeners();

  // Add event listener for edit user form
  const editForm = document.getElementById("editUserForm");
  if (editForm) {
    editForm.addEventListener("submit", function (e) {
      e.preventDefault();
      submitEditUserForm();
    });
  }
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
  initializeUserChart();
  initializeDistributionChart();
  
  // Load real-time data
  loadUserGrowthData('week');
  loadUserDistributionData();
  
  // Refresh charts every 30 seconds
  setInterval(() => {
    const activePeriod = document.querySelector('.period-btn.active')?.getAttribute('data-period') || 'week';
    loadUserGrowthData(activePeriod);
    loadUserDistributionData();
  }, 30000);
}

// Initialize user growth chart
function initializeUserChart() {
  const ctx = document.getElementById("userChart");
  if (!ctx) return;

  userChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Buyers",
          data: [12, 19, 15, 25, 22, 30],
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
        {
          label: "Sellers",
          data: [5, 8, 12, 15, 18, 22],
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
        {
          label: "Riders",
          data: [2, 4, 6, 8, 10, 12],
          borderColor: "#F59E0B",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "rgba(255, 255, 255, 0.8)",
            padding: 20,
            usePointStyle: true,
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
}

// Initialize distribution chart
function initializeDistributionChart() {
  const ctx = document.getElementById("distributionChart");
  if (!ctx) return;

  distributionChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Buyers", "Sellers", "Riders"],
      datasets: [
        {
          data: [60, 25, 15],
          backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
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

// Initialize event listeners
function initializeEventListeners() {
  // Rejection reason radio buttons
  document
    .querySelectorAll('input[name="rejection_reason"]')
    .forEach((radio) => {
      radio.addEventListener("change", function () {
        const customReason = document.getElementById("customRejectionReason");
        if (customReason) {
          customReason.style.display =
            this.value === "custom" ? "block" : "none";
          if (this.value === "custom") {
            customReason.focus();
          }
        }
      });
    });

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
      const period = this.getAttribute("data-period");
      loadUserGrowthData(period);  // Load real-time data instead of static data
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

  // Settings checkboxes
  document
    .querySelectorAll('.setting-label input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        // Save setting to localStorage or send to server
        const settingName = this.closest(".setting-label").textContent.trim();
        console.log(`Setting "${settingName}" changed to:`, this.checked);
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
    dashboard: "Admin Dashboard",
    users: "User Management",
    requests: "Registration Requests",
    "seller-products": "Seller Products",
    reports: "Reports",
    "order-report": "Order Report",
    "seller-reports": "Seller Reports",
    activity: "Activity Log",
    settings: "System Settings",
  };

  titleElement.textContent = titles[section] || "Admin Dashboard";
}

// Load section-specific data
function loadSectionData(section) {
  switch (section) {
    case "users":
      // Refresh user data if needed
      break;
    case "requests":
      // Refresh registration requests if needed
      break;
    case "reports":
      // Load report statistics
      loadReportStats();
      break;
    case "order-report":
      // Initialize order report date fields
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      document.getElementById('adminReportEndDate').value = today.toISOString().split('T')[0];
      document.getElementById('adminReportStartDate').value = firstDay.toISOString().split('T')[0];
      break;
    case "seller-reports":
      // Load seller reports if function exists
      setTimeout(() => {
        if (typeof loadReports === "function") {
          loadReports("all");
        } else if (window.loadReports) {
          window.loadReports("all");
        }
      }, 100);
      break;
    case "activity":
      // Refresh activity log if needed
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

// Update user chart based on period
function updateUserChart(period) {
  if (!userChart) return;

  const data = {
    week: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      buyers: [2, 3, 1, 4, 2, 5, 3],
      sellers: [1, 1, 2, 1, 3, 2, 1],
      riders: [0, 1, 0, 1, 1, 2, 1],
    },
    month: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      buyers: [8, 12, 10, 15],
      sellers: [3, 5, 4, 7],
      riders: [2, 3, 2, 4],
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
      buyers: [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45],
      sellers: [5, 8, 12, 15, 18, 22, 20, 25, 23, 28, 26, 30],
      riders: [2, 4, 6, 8, 10, 12, 11, 14, 13, 16, 15, 18],
    },
  };

  const periodData = data[period] || data.month;

  userChart.data.labels = periodData.labels;
  userChart.data.datasets[0].data = periodData.buyers;
  userChart.data.datasets[1].data = periodData.sellers;
  userChart.data.datasets[2].data = periodData.riders;
  userChart.update("active");
}

// Load real-time user growth data
function loadUserGrowthData(period) {
  fetch(`/api/admin/user-growth/${period}`)
    .then(response => response.json())
    .then(data => {
      if (!userChart) return;
      
      userChart.data.labels = data.labels;
      userChart.data.datasets[0].data = data.buyers;
      userChart.data.datasets[1].data = data.sellers;
      userChart.data.datasets[2].data = data.riders;
      userChart.update('none');
      
      console.log(`User growth data loaded for ${period}:`, data);
    })
    .catch(error => {
      console.error('Error loading user growth data:', error);
    });
}

// Load real-time user distribution data
function loadUserDistributionData() {
  fetch('/api/admin/user-distribution')
    .then(response => response.json())
    .then(data => {
      if (!distributionChart) return;
      
      distributionChart.data.datasets[0].data = [data.buyers, data.sellers, data.riders];
      distributionChart.update('none');
      
      console.log('User distribution data loaded:', data);
    })
    .catch(error => {
      console.error('Error loading user distribution data:', error);
    });
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

// User management functions
function openEditModal(button) {
  try {
    const userDataJson = button.getAttribute('data-user');
    const user = JSON.parse(userDataJson);
    
    const modal = document.getElementById("editUserModal");
    if (!modal) {
      console.error("Modal not found");
      return;
    }

    // Populate user info
    document.getElementById("currentName").textContent = `${user.first_name} ${user.last_name}`;
    document.getElementById("currentEmail").textContent = user.email;
    document.getElementById("currentPhone").textContent = user.phone_number;
    document.getElementById("currentUserType").textContent = user.user_type;
    document.getElementById("currentUserId").textContent = user.id;
    document.getElementById("currentUserTypeTag").textContent = user.user_type;

    // Handle profile picture
    const profileImg = document.getElementById("currentProfilePicPreview");
    const profilePlaceholder = document.getElementById("profilePicPlaceholder");
    
    if (user.profile_pic && user.profile_pic !== "None" && user.profile_pic !== null && user.profile_pic !== "") {
      profileImg.style.opacity = "1";
      profileImg.style.display = "block";
      profileImg.src = user.profile_pic;
      profilePlaceholder.style.display = "none";
    } else {
      profileImg.style.opacity = "0";
      profileImg.style.display = "none";
      profileImg.src = "";
      profilePlaceholder.style.display = "flex";
    }

    // Handle banner
    const bannerImg = document.getElementById("currentBannerPreview");
    const bannerPlaceholder = document.getElementById("bannerPlaceholder");
    
    if (user.banner_image && user.banner_image !== "None" && user.banner_image !== null && user.banner_image !== "") {
      bannerImg.style.opacity = "1";
      bannerImg.style.display = "block";
      bannerImg.src = user.banner_image;
      bannerPlaceholder.style.display = "none";
    } else {
      bannerImg.style.opacity = "0";
      bannerImg.style.display = "none";
      bannerImg.src = "";
      bannerPlaceholder.style.display = "flex";
    }

    // Populate form fields
    document.getElementById("editFirstName").value = user.first_name || "";
    document.getElementById("editLastName").value = user.last_name || "";
    document.getElementById("editEmail").value = user.email || "";
    document.getElementById("editPhone").value = user.phone_number || "";
    document.getElementById("editAddress").value = user.address || "";
    document.getElementById("editUserType").value = user.user_type || "Buyer";

    // Set form action
    const form = document.getElementById("editUserForm");
    if (form) {
      form.action = `/edit_user/${user.id}`;
    }

    // Show modal
    modal.classList.add("show");
    modal.style.display = "flex";
    
  } catch (error) {
    console.error("Error opening edit modal:", error);
  }
}

function submitEditUserForm() {
  const form = document.getElementById("editUserForm");
  if (!form) return;

  const formData = new FormData(form);
  const userId = form.action.split("/").pop(); // Extract user ID from action URL

  const data = {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    phone_number: formData.get("phone_number"),
    address: formData.get("address"),
    user_type: formData.get("user_type"),
  };

  fetch(`/edit_user/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showSuccessMessage("User updated successfully");
        closeEditModal();
        // Reload users section without leaving page
        location.hash = "users";
        showSection("users");
        setTimeout(() => {
          location.reload();
        }, 1500);
      } else {
        showErrorMessage(data.message || "Failed to update user");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while updating the user");
    });
}

function closeEditModal() {
  const modal = document.getElementById("editUserModal");
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
  }
}

function confirmDeleteUser(userId) {
  if (
    confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    )
  ) {
    fetch(`/delete/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showSuccessMessage("User deleted successfully");
          // Reload users section without leaving page
          location.hash = "users";
          showSection("users");
          setTimeout(() => {
            location.reload();
          }, 1500);
        } else {
          showErrorMessage(data.message || "Failed to delete user");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showErrorMessage("An error occurred while deleting the user");
      });
  }
}

// Ban/Unban user functions
let banningUserId = null;

function openBanModal(userId) {
  banningUserId = userId;
  const modal = document.getElementById("banModal");
  const form = document.getElementById("banForm");

  if (modal) {
    document.getElementById("banReason").value = "";

    // Get user info from the table row if possible
    document.getElementById(
      "banUserInfo"
    ).textContent = `You are about to ban user ID: ${userId}. This user will receive a notification email.`;

    modal.classList.add("show");
    modal.style.display = "flex";
  }
}

function closeBanModal() {
  const modal = document.getElementById("banModal");
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
  }
  banningUserId = null;
}

function submitBanForm(event) {
  event.preventDefault();

  if (!banningUserId) {
    alert("User ID not set");
    return;
  }

  const banReason = document.getElementById("banReason").value.trim();

  // Use fetch instead of form submission
  fetch(`/ban_user/${banningUserId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ban_reason: banReason }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showSuccessMessage("User banned successfully");
        closeBanModal();
        // Reload users section without leaving page
        location.hash = "users";
        showSection("users");
        // Reload the page after a short delay to refresh data
        setTimeout(() => {
          location.reload();
        }, 1500);
      } else {
        showErrorMessage(data.message || "Failed to ban user");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while banning the user");
    });
}

function unbanUser(userId) {
  if (
    confirm(
      "Are you sure you want to unban this user? They will be able to login again."
    )
  ) {
    // Use fetch instead of form submission
    fetch(`/unban_user/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showSuccessMessage("User unbanned successfully");
          // Reload users section without leaving page
          location.hash = "users";
          showSection("users");
          // Reload the page after a short delay to refresh data
          setTimeout(() => {
            location.reload();
          }, 1500);
        } else {
          showErrorMessage(data.message || "Failed to unban user");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showErrorMessage("An error occurred while unbanning the user");
      });
  }
}

function viewDocument(documentId) {
  if (documentId && documentId !== "None") {
    window.open(`/view_document/${documentId}`, "_blank");
  } else {
    alert("No document available");
  }
}

function viewBIR(birId) {
  if (birId && birId !== "None") {
    window.open(`/view_bir/${birId}`, "_blank");
  } else {
    alert("No BIR document available");
  }
}

// Registration request functions
function approveRequest(requestId) {
  if (confirm("Are you sure you want to approve this registration request?")) {
    fetch(`/approve_request/${requestId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showSuccessMessage("Registration request approved successfully");
          // Switch to requests section and reload after a short delay
          location.hash = "requests";
          showSection("requests");
          setTimeout(() => {
            location.reload();
          }, 1500);
        } else {
          showErrorMessage(data.message || "Failed to approve request");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showErrorMessage("An error occurred while approving the request");
      });
  }
}

// Track current request being rejected
let currentRejectionId = null;

function rejectRequest(requestId) {
  currentRejectionId = requestId;
  const modal = document.getElementById("rejectModal");
  if (modal) {
    // Reset form
    document.querySelectorAll('[name="rejection_reason"]').forEach((radio) => {
      radio.checked = false;
    });
    const customReason = document.getElementById("customRejectionReason");
    customReason.value = "";
    customReason.style.display = "none";

    // Show modal
    modal.classList.add("show");
    modal.style.display = "flex";
  }
}

function closeRejectModal() {
  const modal = document.getElementById("rejectModal");
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
    currentRejectionId = null;
  }
}

function confirmReject() {
  if (!currentRejectionId) return;

  // Get selected reason
  const selectedRadio = document.querySelector(
    'input[name="rejection_reason"]:checked'
  );
  if (!selectedRadio) {
    showErrorMessage("Please select a reason for rejection");
    return;
  }

  let rejectionReason = selectedRadio.value;
  if (rejectionReason === "custom") {
    rejectionReason = document
      .getElementById("customRejectionReason")
      .value.trim();
    if (!rejectionReason) {
      showErrorMessage("Please enter a custom reason for rejection");
      return;
    }
  }

  // Send rejection request with reason
  fetch(`/reject_request/${currentRejectionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason: rejectionReason }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showSuccessMessage("Registration request rejected");
        closeRejectModal();
        // Switch to requests section and reload after a short delay
        location.hash = "requests";
        showSection("requests");
        setTimeout(() => {
          location.reload();
        }, 1500);
      } else {
        showErrorMessage(data.message || "Failed to reject request");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("An error occurred while rejecting the request");
    });
}

function viewRequestDocuments(requestId) {
  // Open a modal and load the documents endpoint into an iframe for inline viewing.
  const modal = document.getElementById("requestDocsModal");
  const body = document.getElementById("requestDocsBody");
  const loading = document.getElementById("requestDocsLoading");
  if (!modal || !body) {
    // Fallback to opening a new window if modal isn't present
    window.open(`/view_request_documents/${requestId}`, "_blank");
    return;
  }

  // Clear previous content
  body.querySelectorAll("iframe, .docs-content").forEach((n) => n.remove());
  loading.style.display = "flex";

  // Create iframe to sandbox the documents page
  const iframe = document.createElement("iframe");
  iframe.src = `/view_request_documents/${requestId}`;
  iframe.style.width = "100%";
  iframe.style.height = "520px";
  iframe.style.border = "0";
  iframe.className = "docs-content";

  // When iframe loads, hide loader
  iframe.onload = function () {
    loading.style.display = "none";
  };

  body.appendChild(iframe);

  // Show modal
  modal.classList.add("show");
  modal.style.display = "flex";
}

function closeRequestDocsModal() {
  const modal = document.getElementById("requestDocsModal");
  const body = document.getElementById("requestDocsBody");
  if (!modal || !body) return;

  // Remove iframe/content to stop any running load
  body.querySelectorAll("iframe, .docs-content").forEach((n) => n.remove());

  modal.classList.remove("show");
  modal.style.display = "none";
}

// Activity log functions
function toggleActivityFilters() {
  const filters = document.getElementById("activityFilters");
  if (filters) {
    filters.style.display = filters.style.display === "none" ? "block" : "none";
  }
}

// Close all modals
function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.classList.remove("show");
    modal.style.display = "none";
  });
}

// Utility functions
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(number) {
  return new Intl.NumberFormat("en-PH").format(number);
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
  if (userChart) userChart.resize();
  if (distributionChart) distributionChart.resize();
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

// Real-time notifications (WebSocket or polling)
function initializeNotifications() {
  // This would typically connect to a WebSocket or use polling
  // For now, we'll simulate with a simple interval
  setInterval(() => {
    // Check for new notifications
    // Update notification badge
    // Show toast notifications for important events
  }, 30000); // Check every 30 seconds
}

// Initialize notifications
initializeNotifications();

// ============================================================
// REPORT GENERATION FUNCTIONS
// ============================================================

/**
 * Load and update report statistics
 */
function loadReportStats() {
  // Load User Management stats
  fetch("/api/user_counts")
    .then((response) => response.json())
    .then((data) => {
      const total = data.reduce((sum, item) => sum + item.count, 0);
      document.getElementById(
        "userManagementStats"
      ).textContent = `Total Users: ${total}`;
    })
    .catch((error) => console.error("Error loading user stats:", error));

  // Load Registration Requests stats
  loadRegistrationRequestStats();

  // Load Seller Products stats
  loadSellerProductsStats();
}

/**
 * Load registration request statistics
 */
function loadRegistrationRequestStats() {
  // Fetch from server to get total pending requests
  fetch("/register_requests")
    .then((response) => response.text())
    .then((html) => {
      // Count request cards in the response
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const requestCount = doc.querySelectorAll(".request-card").length;
      document.getElementById(
        "registrationRequestStats"
      ).textContent = `Pending Requests: ${requestCount}`;
    })
    .catch((error) => {
      console.error("Error loading requests:", error);
      document.getElementById("registrationRequestStats").textContent =
        "Pending Requests: N/A";
    });
}

/**
 * Load seller products statistics
 */
function loadSellerProductsStats() {
  // Fetch from server to count total products
  fetch("/admin_sellers_products")
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Count product rows in seller product tables
      const productCount = doc.querySelectorAll(
        ".seller-card table tbody tr"
      ).length;

      if (productCount > 0) {
        document.getElementById(
          "sellerProductsStats"
        ).textContent = `Total Products: ${productCount}`;
      } else {
        // Fallback: try counting all table rows
        const allTableRows = doc.querySelectorAll("table tbody tr").length;
        document.getElementById(
          "sellerProductsStats"
        ).textContent = `Total Products: ${allTableRows}`;
      }
    })
    .catch((error) => {
      console.error("Error loading products:", error);
      document.getElementById("sellerProductsStats").textContent =
        "Total Products: N/A";
    });
}

/**
 * Generate User Management Report in PDF
 */
function generateUserManagementReport() {
  const btn = event.target.closest(".report-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

  fetch("/api/user_counts")
    .then((response) => response.json())
    .then((data) => {
      generatePDFReport("User Management Report", data, "user_management");
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
      showSuccessMessage("User Management Report downloaded successfully!");
    })
    .catch((error) => {
      console.error("Error generating report:", error);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
      showErrorMessage("Failed to generate report");
    });
}

/**
 * Generate Registration Request Report in PDF
 */
function generateRegistrationRequestReport() {
  const btn = event.target.closest(".report-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

  fetch("/register_requests")
    .then((response) => response.text())
    .then((html) => {
      const requests = parseRegistrationRequests(html);
      generatePDFReport(
        "Registration Requests Report",
        requests,
        "registration_requests"
      );
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
      showSuccessMessage(
        "Registration Requests Report downloaded successfully!"
      );
    })
    .catch((error) => {
      console.error("Error generating report:", error);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
      showErrorMessage("Failed to generate report");
    });
}

/**
 * Generate Seller Products Report in PDF
 */
function generateSellerProductsReport() {
  const btn = event.target.closest(".report-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

  fetch("/admin_sellers_products")
    .then((response) => response.text())
    .then((html) => {
      const products = parseSellerProducts(html);
      generatePDFReport("Seller Products Report", products, "seller_products");
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
      showSuccessMessage("Seller Products Report downloaded successfully!");
    })
    .catch((error) => {
      console.error("Error generating report:", error);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
      showErrorMessage("Failed to generate report");
    });
}

/**
 * Parse registration requests from HTML
 */
function parseRegistrationRequests(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const requests = [];

  doc.querySelectorAll(".request-card").forEach((card) => {
    const nameText = card.querySelector("h3")?.textContent || "N/A";
    const details = card.querySelectorAll("p");
    requests.push({
      name: nameText,
      type: details[0]?.textContent || "N/A",
      email: details[1]?.textContent || "N/A",
      status: "Pending",
    });
  });

  return requests;
}

/**
 * Parse seller products from HTML
 */
function parseSellerProducts(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const products = [];

  // Look for product rows in the sellers' product tables
  doc.querySelectorAll(".seller-card table tbody tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 5) {
      products.push({
        id: cells[0]?.textContent?.trim() || "N/A",
        name: cells[1]?.textContent?.trim() || "N/A",
        category: cells[2]?.textContent?.trim() || "N/A",
        price: cells[3]?.textContent?.trim() || "N/A",
        quantity: cells[4]?.textContent?.trim() || "N/A",
      });
    }
  });

  // If no products found in seller cards, try alternative selector
  if (products.length === 0) {
    doc.querySelectorAll("table tbody tr").forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 5) {
        const id = cells[0]?.textContent?.trim();
        const name = cells[1]?.textContent?.trim();

        // Skip header rows and empty rows
        if (id && name && id !== "ID" && name !== "Name") {
          products.push({
            id: id || "N/A",
            name: name || "N/A",
            category: cells[2]?.textContent?.trim() || "N/A",
            price: cells[3]?.textContent?.trim() || "N/A",
            quantity: cells[4]?.textContent?.trim() || "N/A",
          });
        }
      }
    });
  }

  return products;
}

/**
 * Generate PDF Report using jsPDF
 */
function generatePDFReport(title, data, reportType) {
  // Create a new window/tab to print the report
  const printWindow = window.open("", "_blank");
  const doc = printWindow.document;

  // Create HTML content for the report
  let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background-color: #f5f5f5;
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #6B46C1;
                    padding-bottom: 15px;
                }
                .report-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                    margin: 0;
                }
                .report-date {
                    font-size: 12px;
                    color: #666;
                    margin-top: 5px;
                }
                .report-content {
                    background-color: white;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                th {
                    background-color: #6B46C1;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                }
                td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #ddd;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .summary {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: #f0f0f0;
                    border-left: 4px solid #6B46C1;
                    border-radius: 3px;
                }
                .summary h3 {
                    margin-top: 0;
                    color: #333;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 11px;
                    color: #999;
                    border-top: 1px solid #ddd;
                    padding-top: 15px;
                }
                @media print {
                    body {
                        background-color: white;
                        margin: 0;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1 class="report-title">E-Baby Portal</h1>
                <p class="report-title" style="font-size: 18px; margin-top: 10px;">${title}</p>
                <p class="report-date">Generated on: ${new Date().toLocaleString()}</p>
            </div>
            <div class="report-content">
    `;

  // Add content based on report type
  if (reportType === "user_management") {
    htmlContent += generateUserManagementHTML(data);
  } else if (reportType === "registration_requests") {
    htmlContent += generateRegistrationRequestsHTML(data);
  } else if (reportType === "seller_products") {
    htmlContent += generateSellerProductsHTML(data);
  }

  htmlContent += `
            </div>
            <div class="footer">
                <p>This is an official E-Baby system report. For security purposes, please store confidentially.</p>
            </div>
            <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background-color: #6B46C1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    Print & Download PDF
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background-color: #ddd; color: #333; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-left: 10px;">
                    Close
                </button>
            </div>
        </body>
        </html>
    `;

  doc.write(htmlContent);
  doc.close();
}

/**
 * Generate User Management Report HTML
 */
function generateUserManagementHTML(data) {
  let html = "<h2>User Statistics</h2>";
  html +=
    "<table><thead><tr><th>User Type</th><th>Count</th></tr></thead><tbody>";

  data.forEach((item) => {
    html += `<tr><td>${item.user_type}</td><td>${item.count}</td></tr>`;
  });

  const total = data.reduce((sum, item) => sum + item.count, 0);
  html += `</tbody></table>`;
  html += `<div class="summary"><h3>Summary</h3><p>Total Users: <strong>${total}</strong></p></div>`;

  return html;
}

/**
 * Generate Registration Requests Report HTML
 */
function generateRegistrationRequestsHTML(data) {
  let html = "<h2>Registration Requests</h2>";
  html +=
    "<table><thead><tr><th>Name</th><th>Type</th><th>Email</th><th>Status</th></tr></thead><tbody>";

  if (Array.isArray(data) && data.length > 0) {
    data.forEach((req) => {
      html += `<tr><td>${req.name}</td><td>${req.type}</td><td>${req.email}</td><td>${req.status}</td></tr>`;
    });
  } else {
    html += '<tr><td colspan="4">No pending requests</td></tr>';
  }

  html += `</tbody></table>`;
  html += `<div class="summary"><h3>Summary</h3><p>Total Pending Requests: <strong>${
    Array.isArray(data) ? data.length : 0
  }</strong></p></div>`;

  return html;
}

/**
 * Generate Seller Products Report HTML
 */
function generateSellerProductsHTML(data) {
  let html = "<h2>Seller Products Inventory</h2>";
  html +=
    "<table><thead><tr><th>Product ID</th><th>Product Name</th><th>Category</th><th>Price</th><th>Quantity</th></tr></thead><tbody>";

  if (Array.isArray(data) && data.length > 0) {
    data.forEach((product) => {
      html += `<tr><td>${product.id}</td><td>${product.name}</td><td>${product.category}</td><td>${product.price}</td><td>${product.quantity}</td></tr>`;
    });
  } else {
    html += '<tr><td colspan="5">No products found</td></tr>';
  }

  html += `</tbody></table>`;
  html += `<div class="summary"><h3>Summary</h3><p>Total Products: <strong>${
    Array.isArray(data) ? data.length : 0
  }</strong></p></div>`;

  return html;
}

// Load report stats when page loads
window.addEventListener("load", function () {
  if (document.getElementById("reports-section")) {
    loadReportStats();
  }
});

// ============================================================
// FILTER AND SEARCH FUNCTIONS FOR USERS TABLE
// ============================================================

function searchUsers() {
  const searchEmail = document.getElementById("searchEmailInput").value.trim();
  if (!searchEmail) {
    showErrorMessage("Please enter an email or name to search");
    return;
  }

  fetch(
    `/admin_user_management?search_email=${encodeURIComponent(
      searchEmail
    )}&format=json`
  )
    .then((response) => response.json())
    .then((data) => {
      try {
        if (!data.users || data.users.length === 0) {
          showErrorMessage("No users found");
          const tbody = document.querySelector("table.users-table tbody");
          if (tbody)
            tbody.innerHTML =
              '<tr><td colspan="6" style="text-align: center; padding: 20px;">No results found</td></tr>';
          return;
        }

        // Build table rows from JSON data with proper styling
        let html = "";
        data.users.forEach((user) => {
          const statusClass = user.status === "banned" ? "banned" : "active";
          const userTypeClass = user.user_type.toLowerCase();

          html += `
                    <tr>
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="user-info">
                                    <div class="user-name">${user.first_name} ${
            user.last_name
          }</div>
                                    <div class="user-id">#${user.id}</div>
                                </div>
                            </div>
                        </td>
                        <td>${user.email}</td>
                        <td>${user.phone_number || "-"}</td>
                        <td>
                            <span class="user-type-badge ${userTypeClass}">
                                ${user.user_type}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${statusClass}">
                                ${
                                  user.status
                                    ? user.status.charAt(0).toUpperCase() +
                                      user.status.slice(1)
                                    : "Active"
                                }
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn edit-btn" onclick='openEditModal(${JSON.stringify(
                                  user
                                ).replace(/'/g, "\\'")})' title="Edit User">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${
                                  user.user_type === "Seller"
                                    ? `
                                <button class="action-btn view-btn" onclick="viewDocument('${user.document_id}')" title="View ID">
                                    <i class="fas fa-id-card"></i>
                                </button>
                                <button class="action-btn view-btn" onclick="viewBIR('${user.bir}')" title="View BIR">
                                    <i class="fas fa-file-alt"></i>
                                </button>
                                `
                                    : ""
                                }
                                ${
                                  user.status === "banned"
                                    ? `
                                <button class="action-btn unban-btn" onclick="unbanUser('${user.id}')" title="Unban User">
                                    <i class="fas fa-lock-open"></i>
                                </button>
                                `
                                    : `
                                <button class="action-btn ban-btn" onclick="openBanModal('${user.id}')" title="Ban User">
                                    <i class="fas fa-ban"></i>
                                </button>
                                `
                                }
                                <button class="action-btn delete-btn" onclick="confirmDeleteUser('${
                                  user.id
                                }')" title="Delete User">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                    `;
        });

        const tbody = document.querySelector("table.users-table tbody");
        if (tbody) {
          tbody.innerHTML = html;
          showSuccessMessage("Search completed");
        }
      } catch (err) {
        console.error("Parse error:", err);
        showErrorMessage("Error processing search results");
      }
    })
    .catch((error) => {
      console.error("Search error:", error);
      showErrorMessage("Error searching users");
    });
}

function filterUsers(userType) {
  let url = "/admin_user_management?format=json";
  if (userType !== "all") {
    url += `&sort=${userType}`;
  }

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      try {
        if (!data.users || data.users.length === 0) {
          showErrorMessage("No users found");
          const tbody = document.querySelector("table.users-table tbody");
          if (tbody)
            tbody.innerHTML =
              '<tr><td colspan="6" style="text-align: center; padding: 20px;">No users found</td></tr>';
          return;
        }

        // Build table rows from JSON data with proper styling
        let html = "";
        data.users.forEach((user) => {
          const statusClass = user.status === "banned" ? "banned" : "active";
          const userTypeClass = user.user_type.toLowerCase();

          html += `
                    <tr>
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="user-info">
                                    <div class="user-name">${user.first_name} ${
            user.last_name
          }</div>
                                    <div class="user-id">#${user.id}</div>
                                </div>
                            </div>
                        </td>
                        <td>${user.email}</td>
                        <td>${user.phone_number || "-"}</td>
                        <td>
                            <span class="user-type-badge ${userTypeClass}">
                                ${user.user_type}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${statusClass}">
                                ${
                                  user.status
                                    ? user.status.charAt(0).toUpperCase() +
                                      user.status.slice(1)
                                    : "Active"
                                }
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn edit-btn" onclick='openEditModal(${JSON.stringify(
                                  user
                                ).replace(/'/g, "\\'")})' title="Edit User">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${
                                  user.user_type === "Seller"
                                    ? `
                                <button class="action-btn view-btn" onclick="viewDocument('${user.document_id}')" title="View ID">
                                    <i class="fas fa-id-card"></i>
                                </button>
                                <button class="action-btn view-btn" onclick="viewBIR('${user.bir}')" title="View BIR">
                                    <i class="fas fa-file-alt"></i>
                                </button>
                                `
                                    : ""
                                }
                                ${
                                  user.status === "banned"
                                    ? `
                                <button class="action-btn unban-btn" onclick="unbanUser('${user.id}')" title="Unban User">
                                    <i class="fas fa-lock-open"></i>
                                </button>
                                `
                                    : `
                                <button class="action-btn ban-btn" onclick="openBanModal('${user.id}')" title="Ban User">
                                    <i class="fas fa-ban"></i>
                                </button>
                                `
                                }
                                <button class="action-btn delete-btn" onclick="confirmDeleteUser('${
                                  user.id
                                }')" title="Delete User">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                    `;
        });

        const tbody = document.querySelector("table.users-table tbody");
        if (tbody) {
          tbody.innerHTML = html;
          const typeNames = {
            seller: "Sellers",
            buyer: "Buyers",
            rider: "Riders",
            all: "All Users",
          };
          showSuccessMessage(`Filtered by ${typeNames[userType]}`);
        }
      } catch (err) {
        console.error("Parse error:", err);
        showErrorMessage("Error processing filter results");
      }
    })
    .catch((error) => {
      console.error("Filter error:", error);
      showErrorMessage("Error filtering users");
    });
}

// Show product details using data attributes
function showProductDetails(button) {
  if (!button) {
    showErrorMessage("Invalid button reference");
    return;
  }

  try {
    // Get all data from button attributes
    const product = {
      id: button.getAttribute("data-product-id"),
      name: button.getAttribute("data-product-name") || "N/A",
      category: button.getAttribute("data-product-category") || "N/A",
      price: button.getAttribute("data-product-price") || "0",
      quantity: button.getAttribute("data-product-quantity") || "0",
      image: button.getAttribute("data-product-image") || "",
      variants: button.getAttribute("data-product-variants") || "[]",
      description:
        button.getAttribute("data-product-description") ||
        "No description available",
      created_at: button.getAttribute("data-product-created") || "",
    };

    // Parse variants
    let variants = [];
    try {
      variants = JSON.parse(product.variants);
    } catch (e) {
      console.error("Error parsing variants:", e);
      variants = [];
    }

    // Populate modal with product data
    document.getElementById("productDetailsName").textContent = product.name;
    document.getElementById("productDetailsCategory").textContent =
      product.category;
    document.getElementById("productDetailsPrice").textContent = `₱${parseFloat(
      product.price
    ).toFixed(2)}`;
    document.getElementById("productDetailsQuantity").textContent =
      product.quantity;
    document.getElementById("productDetailsProductId").textContent = product.id;
    
    // Display variants instead of single size/color
    if (variants && variants.length > 0) {
      const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
      const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
      
      document.getElementById("productDetailsSize").textContent = 
        sizes.length > 0 ? sizes.join(", ") : "N/A";
      document.getElementById("productDetailsColor").textContent = 
        colors.length > 0 ? colors.join(", ") : "N/A";
    } else {
      document.getElementById("productDetailsSize").textContent = "N/A";
      document.getElementById("productDetailsColor").textContent = "N/A";
    }
    
    document.getElementById("productDetailsDescription").textContent =
      product.description;

    // Format created date
    if (product.created_at) {
      try {
        const date = new Date(product.created_at);
        document.getElementById("productDetailsCreatedAt").textContent =
          date.toLocaleDateString();
      } catch (e) {
        document.getElementById("productDetailsCreatedAt").textContent =
          product.created_at;
      }
    } else {
      document.getElementById("productDetailsCreatedAt").textContent = "N/A";
    }

    // Set image
    const imageElement = document.getElementById("productDetailsImage");
    if (imageElement) {
      if (
        product.image &&
        product.image !== "None" &&
        product.image !== "" &&
        product.image !== "null"
      ) {
        console.log("Setting image to:", product.image);
        imageElement.src = product.image;
        imageElement.onerror = function() {
          this.src = '/static/images/defaults/product-default.png';
        };
        imageElement.style.background = "transparent";
        imageElement.style.display = "block";
        imageElement.onerror = function () {
          console.error("Image failed to load:", imageSrc);
          this.style.display = "none";
          imageElement.parentElement.innerHTML =
            '<div style="display: flex; align-items: center; justify-content: center; height: 300px;"><i class="fas fa-box" style="font-size: 60px; color: rgba(107, 70, 193, 0.5);"></i></div>';
        };
      } else {
        console.log("No image found. Product image value:", product.image);
        imageElement.src = "";
        imageElement.style.background = "rgba(107, 70, 193, 0.1)";
        imageElement.style.display = "none";
        if (imageElement.parentElement) {
          imageElement.parentElement.innerHTML =
            '<div style="display: flex; align-items: center; justify-content: center; height: 300px;"><i class="fas fa-box" style="font-size: 60px; color: rgba(107, 70, 193, 0.5);"></i></div>';
        }
      }
    }

    // Show modal
    const modal = document.getElementById("productDetailsModal");
    if (modal) {
      modal.classList.add("show");
      modal.style.display = "flex";
    }
  } catch (err) {
    console.error("Error opening product details:", err);
    showErrorMessage("Error loading product details");
  }
}

// Open product details modal (legacy)
function openProductDetailsModal(product) {
  if (!product || !product.id) {
    showErrorMessage("Invalid product data");
    return;
  }

  // Populate modal with product data
  document.getElementById("productDetailsName").textContent =
    product.name || "N/A";
  document.getElementById("productDetailsCategory").textContent =
    product.category || "N/A";
  document.getElementById("productDetailsPrice").textContent = `₱${parseFloat(
    product.price || 0
  ).toFixed(2)}`;
  document.getElementById("productDetailsQuantity").textContent =
    product.quantity || "0";
  document.getElementById("productDetailsProductId").textContent =
    product.product_id || product.id;
  document.getElementById("productDetailsSize").textContent =
    product.size || "N/A";
  document.getElementById("productDetailsColor").textContent =
    product.color || "N/A";
  document.getElementById("productDetailsDescription").textContent =
    product.description || "No description available";

  // Format created date
  if (product.created_at) {
    const date = new Date(product.created_at);
    document.getElementById("productDetailsCreatedAt").textContent =
      date.toLocaleDateString();
  } else {
    document.getElementById("productDetailsCreatedAt").textContent = "N/A";
  }

  // Set image
  const imageElement = document.getElementById("productDetailsImage");
  if (product.image && product.image !== "None" && product.image !== "null") {
    imageElement.src = product.image;
    imageElement.style.background = "transparent";
  } else {
    imageElement.src = "";
    imageElement.style.background = "rgba(107, 70, 193, 0.1)";
    imageElement.innerHTML =
      '<div style="display: flex; align-items: center; justify-content: center; height: 300px;"><i class="fas fa-box" style="font-size: 60px; color: rgba(107, 70, 193, 0.5);"></i></div>';
  }

  // Show modal
  const modal = document.getElementById("productDetailsModal");
  if (modal) {
    modal.classList.add("show");
    modal.style.display = "flex";
  }
}

// Close product details modal
function closeProductDetailsModal() {
  const modal = document.getElementById("productDetailsModal");
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
  }
}

// ============================================================
// ADMIN ORDER REPORT FUNCTIONS
// ============================================================

/**
 * Generate admin order report based on date range
 */
async function generateAdminOrderReport() {
  const startDate = document.getElementById('adminReportStartDate').value;
  const endDate = document.getElementById('adminReportEndDate').value;

  if (!startDate || !endDate) {
    alert('Please select both start and end dates');
    return;
  }

  if (startDate > endDate) {
    alert('Start date must be before end date');
    return;
  }

  try {
    const response = await fetch('/api/admin_order_report', {
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
      displayAdminOrderReport(data.report);
      updateAdminOrderReportSummary(data.summary);
    } else {
      alert('Error: ' + (data.error || 'Failed to generate report'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error generating report. Please try again.');
  }
}

/**
 * Display admin order report data in table
 */
function displayAdminOrderReport(reportData) {
  const tableBody = document.getElementById('adminOrderReportTableBody');
  
  if (!reportData || reportData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" style="padding: 2rem; text-align: center; color: rgba(255, 255, 255, 0.5);"><i class="fas fa-inbox"></i> No orders found for this date range.</td></tr>';
    return;
  }

  tableBody.innerHTML = reportData.map(item => `
    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
      <td style="padding: 1rem; color: rgba(255, 255, 255, 0.9);">#${item.order_id}</td>
      <td style="padding: 1rem; color: rgba(255, 255, 255, 0.9);">${item.seller_email}</td>
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
 * Update admin order report summary cards
 */
function updateAdminOrderReportSummary(summary) {
  document.getElementById('adminSummaryTotalOrders').textContent = summary.total_orders || 0;
  document.getElementById('adminSummaryTotalRevenue').textContent = '₱' + parseFloat(summary.total_revenue || 0).toFixed(2);
  document.getElementById('adminSummaryTotalCommission').textContent = '₱' + parseFloat(summary.total_admin_commission || 0).toFixed(2);
  document.getElementById('adminSummarySellerEarnings').textContent = '₱' + parseFloat(summary.total_seller_earnings || 0).toFixed(2);
}

/**
 * Reset admin order report filter
 */
function resetAdminOrderReportFilter() {
  document.getElementById('adminReportStartDate').value = '';
  document.getElementById('adminReportEndDate').value = '';
  document.getElementById('adminOrderReportTableBody').innerHTML = '<tr><td colspan="8" style="padding: 2rem; text-align: center; color: rgba(255, 255, 255, 0.5);"><i class="fas fa-inbox"></i> No data. Select a date range and click Filter.</td></tr>';
  
  document.getElementById('adminSummaryTotalOrders').textContent = '0';
  document.getElementById('adminSummaryTotalRevenue').textContent = '₱0.00';
  document.getElementById('adminSummaryTotalCommission').textContent = '₱0.00';
  document.getElementById('adminSummarySellerEarnings').textContent = '₱0.00';
}

/**
 * Print admin order report
 */
function printAdminOrderReport() {
  const startDate = document.getElementById('adminReportStartDate').value;
  const endDate = document.getElementById('adminReportEndDate').value;

  if (!startDate || !endDate) {
    alert('Please generate a report first');
    return;
  }

  const printWindow = window.open('', '', 'height=600,width=1000');
  
  const tableHTML = document.getElementById('adminOrderReportTable').outerHTML;
  const summaryHTML = `
    <div style="margin-bottom: 2rem;">
      <h2>Order Report Summary</h2>
      <p><strong>Date Range:</strong> ${startDate} to ${endDate}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
        <tr>
          <td style="padding: 1rem; border: 1px solid #ddd;"><strong>Total Orders:</strong></td>
          <td style="padding: 1rem; border: 1px solid #ddd;">${document.getElementById('adminSummaryTotalOrders').textContent}</td>
        </tr>
        <tr>
          <td style="padding: 1rem; border: 1px solid #ddd;"><strong>Total Revenue:</strong></td>
          <td style="padding: 1rem; border: 1px solid #ddd;">${document.getElementById('adminSummaryTotalRevenue').textContent}</td>
        </tr>
        <tr>
          <td style="padding: 1rem; border: 1px solid #ddd;"><strong>Admin Commission:</strong></td>
          <td style="padding: 1rem; border: 1px solid #ddd;">${document.getElementById('adminSummaryTotalCommission').textContent}</td>
        </tr>
        <tr>
          <td style="padding: 1rem; border: 1px solid #ddd;"><strong>Seller Earnings:</strong></td>
          <td style="padding: 1rem; border: 1px solid #ddd;"><strong>${document.getElementById('adminSummarySellerEarnings').textContent}</strong></td>
        </tr>
      </table>
    </div>
  `;

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>E-Baby Order Report</title>
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
      <h1>E-Baby Order Report</h1>
      ${summaryHTML}
      ${tableHTML}
      <div style="margin-top: 2rem; font-size: 12px; color: #666;">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>This is an automated report from E-Baby admin dashboard.</p>
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
 * Export admin order report to CSV
 */
function exportAdminOrderReportToCSV() {
  const startDate = document.getElementById('adminReportStartDate').value;
  const endDate = document.getElementById('adminReportEndDate').value;

  if (!startDate || !endDate) {
    alert('Please generate a report first');
    return;
  }

  const tableBody = document.getElementById('adminOrderReportTableBody');
  const rows = tableBody.querySelectorAll('tr');

  if (rows.length === 1 && rows[0].querySelector('td[colspan]')) {
    alert('No data to export');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'E-Baby Order Report\n';
  csvContent += `Date Range: ${startDate} to ${endDate}\n`;
  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Summary
  csvContent += 'SUMMARY\n';
  csvContent += `Total Orders,${document.getElementById('adminSummaryTotalOrders').textContent}\n`;
  csvContent += `Total Revenue,${document.getElementById('adminSummaryTotalRevenue').textContent}\n`;
  csvContent += `Admin Commission,${document.getElementById('adminSummaryTotalCommission').textContent}\n`;
  csvContent += `Seller Earnings,${document.getElementById('adminSummarySellerEarnings').textContent}\n\n`;

  // Table Header
  csvContent += 'Order ID,Seller,Product Name,Quantity,Item Amount,Subtotal,Admin Commission,Seller Net Sales\n';

  // Table Body
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length === 8) {
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
  link.setAttribute('download', `E-Baby_Order_Report_${startDate}_${endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export functions for global access
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;
window.openEditModal = openEditModal;
window.submitEditUserForm = submitEditUserForm;
window.closeEditModal = closeEditModal;
window.confirmDeleteUser = confirmDeleteUser;
window.openBanModal = openBanModal;
window.closeBanModal = closeBanModal;
window.submitBanForm = submitBanForm;
window.unbanUser = unbanUser;
window.viewDocument = viewDocument;
window.viewBIR = viewBIR;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.viewRequestDocuments = viewRequestDocuments;
window.toggleActivityFilters = toggleActivityFilters;
window.generateUserManagementReport = generateUserManagementReport;
window.generateRegistrationRequestReport = generateRegistrationRequestReport;
window.generateSellerProductsReport = generateSellerProductsReport;
window.generateAdminOrderReport = generateAdminOrderReport;
window.resetAdminOrderReportFilter = resetAdminOrderReportFilter;
window.printAdminOrderReport = printAdminOrderReport;
window.exportAdminOrderReportToCSV = exportAdminOrderReportToCSV;
window.loadReportStats = loadReportStats;
window.searchUsers = searchUsers;
window.filterUsers = filterUsers;
window.viewProductDetails = viewProductDetails;
window.showProductDetails = showProductDetails;
window.openProductDetailsModal = openProductDetailsModal;
window.closeProductDetailsModal = closeProductDetailsModal;
