// ============================================================
// SELLER REAL-TIME STATISTICS - MONITORING
// ============================================================

let sellerSalesChart = null;
// This chart replaces the static salesChart from seller_dashboard.js
let currentSellerPeriod = "today";

/**
 * Initialize seller real-time statistics
 */
function initSellerStats() {
  // Attach event listeners to period buttons using data-period attribute
  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const period = this.getAttribute("data-period");
      console.log('Period button clicked:', period);
      if (period) {
        updateSellerChart(period);
      }
    });
  });

  // Initialize chart with today's data
  updateSellerChart("today");
  updateSellerSummary();

  // Update every 30 seconds for real-time monitoring
  setInterval(() => {
    updateSellerChart(currentSellerPeriod);
    updateSellerSummary();
    updateSellerStats();
  }, 30000);
}

/**
 * Update seller chart based on period
 */
async function updateSellerChart(period) {
  console.log('updateSellerChart called with period:', period);
  currentSellerPeriod = period;

  try {
    const response = await fetch(`/api/seller_stats?period=${period}`);
    if (!response.ok) {
      console.error('API response not ok:', response.status);
      return;
    }
    const data = await response.json();
    console.log('Received chart data:', data);

    // Update period buttons using data-period attribute
    document.querySelectorAll(".period-btn").forEach((btn) => {
      const btnPeriod = btn.getAttribute("data-period");
      if (btnPeriod === period) {
        btn.classList.add("active");
        console.log('Added active class to button with period:', btnPeriod);
      } else {
        btn.classList.remove("active");
      }
    });

    // Prepare chart data
    let labels = data.daily_data.map((item) => {
      // Check if it's hourly data (format: "14:00") or daily data (format: "2025-11-25")
      if (item.sale_date && item.sale_date.includes(':')) {
        // It's hourly data, use as-is
        return item.sale_date;
      } else {
        // It's daily data, parse the date
        const date = new Date(item.sale_date + 'T00:00:00');
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    });
    let revenueData = data.daily_data.map((item) =>
      parseFloat(item.daily_sales || 0)
    );
    let itemsData = data.daily_data.map((item) =>
      parseInt(item.daily_items || 0)
    );

    console.log('Chart labels:', labels);
    console.log('Revenue data:', revenueData);
    console.log('Items data:', itemsData);
    console.log('Daily data length:', data.daily_data.length);

    // If no data, create sample data to show chart is working
    if (labels.length === 0) {
      console.log('No data available for period, using sample data');
      labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
      revenueData = [0, 0, 0, 0, 0];
      itemsData = [0, 0, 0, 0, 0];
    }

    // Get or create chart canvas
    const canvas = document.getElementById("salesChart");
    if (!canvas) {
      console.error('salesChart canvas not found');
      return;
    }

    const ctx = canvas.getContext("2d");

    // Destroy existing chart if it exists
    if (sellerSalesChart) {
      sellerSalesChart.destroy();
      sellerSalesChart = null;
    }

    // Create new chart
    sellerSalesChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Revenue (₱)",
            data: revenueData,
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: "y",
          },
          {
            label: "Items Sold",
            data: itemsData,
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "rgba(255, 255, 255, 0.9)",
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "#10B981",
            borderWidth: 1,
          },
        },
        scales: {
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Revenue (₱)",
              color: "#10B981",
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              callback: function (value) {
                return "₱" + value.toFixed(2);
              },
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Items Sold",
              color: "#3B82F6",
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
            },
            grid: {
              drawOnChartArea: false,
            },
          },
          x: {
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
        },
      },
    });
    
    // Log successful chart creation
    console.log('Chart created successfully for period:', period);
  } catch (error) {
    console.error("Error updating seller chart:", error);
  }
}

/**
 * Update seller summary cards
 */
async function updateSellerSummary() {
  try {
    // Fetch all periods
    const [todayData, weekData, monthData, allData] = await Promise.all([
      fetch("/api/seller_stats?period=today").then((r) => r.json()),
      fetch("/api/seller_stats?period=week").then((r) => r.json()),
      fetch("/api/seller_stats?period=month").then((r) => r.json()),
      fetch("/api/seller_stats?period=all").then((r) => r.json()),
    ]);

    // Update summary cards
    document.getElementById(
      "seller-summary-today"
    ).textContent = `₱${parseFloat(todayData.total_sales || 0).toFixed(2)}`;
    document.getElementById("seller-summary-week").textContent = `₱${parseFloat(
      weekData.total_sales || 0
    ).toFixed(2)}`;
    document.getElementById(
      "seller-summary-month"
    ).textContent = `₱${parseFloat(monthData.total_sales || 0).toFixed(2)}`;
    document.getElementById(
      "seller-summary-total"
    ).textContent = `₱${parseFloat(allData.total_sales || 0).toFixed(2)}`;
  } catch (error) {
    console.error("Error updating seller summary:", error);
  }
}

/**
 * Update seller stats in header cards
 */
async function updateSellerStats() {
  try {
    const [todayData, weekData] = await Promise.all([
      fetch("/api/seller_stats?period=today").then((r) => r.json()),
      fetch("/api/seller_stats?period=week").then((r) => r.json()),
    ]);

    // Update today's revenue
    document.getElementById(
      "seller-revenue-today"
    ).textContent = `₱${parseFloat(todayData.total_sales || 0).toFixed(2)}`;

    // Calculate change
    const todayRevenue = parseFloat(todayData.total_sales || 0);
    const weekRevenue = parseFloat(weekData.total_sales || 0);
    const avgDailyRevenue = weekRevenue / 7;
    const change =
      avgDailyRevenue > 0
        ? (((todayRevenue - avgDailyRevenue) / avgDailyRevenue) * 100).toFixed(
            1
          )
        : 0;
    const changeElement = document.getElementById(
      "seller-revenue-today-change"
    );

    if (change > 0) {
      changeElement.textContent = `+${change}% vs avg`;
      changeElement.className = "stat-change positive";
    } else if (change < 0) {
      changeElement.textContent = `${change}% vs avg`;
      changeElement.className = "stat-change negative";
    } else {
      changeElement.textContent = "No change";
      changeElement.className = "stat-change neutral";
    }

    // Update today's orders
    document.getElementById("seller-orders-today").textContent =
      todayData.total_orders || 0;

    // Update total stats
    const allData = await fetch("/api/seller_stats?period=all").then((r) =>
      r.json()
    );
    document.getElementById(
      "seller-revenue-total"
    ).textContent = `₱${parseFloat(allData.total_sales || 0).toFixed(2)}`;
    document.getElementById("seller-items-total").textContent =
      allData.total_items || 0;
    document.getElementById("seller-pending-total").textContent =
      allData.pending_orders || 0;
  } catch (error) {
    console.error("Error updating seller stats:", error);
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // Only initialize if we're on the dashboard section
  if (document.getElementById("salesChart")) {
    initSellerStats();
  }
});

// Make function globally available
window.updateSellerChart = updateSellerChart;
