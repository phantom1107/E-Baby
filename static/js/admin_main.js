document.addEventListener("DOMContentLoaded", function () {
  const dashboardBtn = document.querySelector('button[onclick*="admin_main"]');
  const userBtn = document.querySelector(
    'button[onclick*="admin_user_management"]'
  );
  const sellerBtn = document.querySelector(
    'button[onclick*="seller_requests"]'
  );

  dashboardBtn.innerHTML = '<i class="fas fa-home"></i><span>Dashboard</span>';
  userBtn.innerHTML = '<i class="fas fa-users"></i><span>User Accounts</span>';
  sellerBtn.innerHTML =
    '<i class="fas fa-store"></i><span>Seller Requests</span>';

  // Initialize the dashboard immediately
  initDashboard();
});

async function fetchUserData() {
  try {
    const response = await fetch("/api/user_counts");
    const data = await response.json();

    // Update the counts in the UI
    const buyerCount =
      data.find((item) => item.user_type === "Buyer")?.count || 0;
    const sellerCount =
      data.find((item) => item.user_type === "Seller")?.count || 0;
    const riderCount =
      data.find((item) => item.user_type === "Rider")?.count || 0;

    document.getElementById("buyerCount").innerText = buyerCount;
    document.getElementById("sellerCount").innerText = sellerCount;
    document.getElementById("riderCount").innerText = riderCount;

    return data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return [];
  }
}

async function initDashboard() {
  const userData = await fetchUserData();
  renderChart(userData);
}

function renderChart(data) {
  const labels = data.map((item) => item.user_type);
  const counts = data.map((item) => item.count);

  const ctx = document.getElementById("userChart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: counts,
          backgroundColor: ["#3498DB", "#2C3E50", "#E74C3C"],
          borderColor: "#ffffff",
          borderWidth: 1,
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
            color: "#333333",
            font: {
              size: 14,
            },
          },
        },
        title: {
          display: true,
          text: "User Distribution",
          color: "#333333",
          font: {
            size: 18,
            weight: "bold",
          },
        },
      },
    },
  });
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const container = document.querySelector(".dashboard-container");
  sidebar.classList.toggle("collapsed");
  container.classList.toggle("expanded");
}

function showLogoutModal() {
  document.getElementById("logoutModal").style.display = "flex";
}

function closeLogoutModal() {
  document.getElementById("logoutModal").style.display = "none";
}

function confirmLogout() {
  // Use centralized logout function
  logout();
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("logoutModal");
  if (event.target == modal) {
    closeLogoutModal();
  }
};
