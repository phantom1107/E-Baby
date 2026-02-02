// ============================================================
// ADMIN TAX REVENUE STATISTICS - REAL-TIME MONITORING
// ============================================================

let taxRevenueChart = null;
let currentTaxPeriod = "today";

/**
 * Initialize tax revenue statistics
 */
function initTaxStats() {
  updateTaxChart("today");
  updateTaxSummary();

  // Update every 30 seconds for real-time monitoring
  setInterval(() => {
    updateTaxChart(currentTaxPeriod);
    updateTaxSummary();
    updateTaxStats();
  }, 30000);
}

/**
 * Update tax chart based on period
 */
async function updateTaxChart(period) {
  currentTaxPeriod = period;

  try {
    const response = await fetch(`/api/admin_tax_stats?period=${period}`);
    const data = await response.json();

    // Update period buttons
    document.querySelectorAll(".period-btn[data-period]").forEach((btn) => {
      if (btn.getAttribute("onclick")?.includes(period)) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Prepare chart data
    const labels = data.daily_data.map((item) => {
      const date = new Date(item.tax_date);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });
    const taxData = data.daily_data.map((item) =>
      parseFloat(item.daily_tax || 0)
    );
    const ordersData = data.daily_data.map((item) =>
      parseInt(item.daily_orders || 0)
    );

    // Get or create chart canvas
    const canvas = document.getElementById("taxRevenueChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Destroy existing chart if it exists
    if (taxRevenueChart) {
      taxRevenueChart.destroy();
    }

    // Create new chart
    taxRevenueChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tax Revenue (₱)",
            data: taxData,
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: "y",
          },
          {
            label: "Orders Count",
            data: ordersData,
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
              text: "Tax Revenue (₱)",
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
              text: "Orders Count",
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
  } catch (error) {
    console.error("Error updating tax chart:", error);
  }
}

/**
 * Update tax summary cards
 */
async function updateTaxSummary() {
  try {
    // Fetch all periods
    const [todayData, weekData, monthData, allData] = await Promise.all([
      fetch("/api/admin_tax_stats?period=today").then((r) => r.json()),
      fetch("/api/admin_tax_stats?period=week").then((r) => r.json()),
      fetch("/api/admin_tax_stats?period=month").then((r) => r.json()),
      fetch("/api/admin_tax_stats?period=all").then((r) => r.json()),
    ]);

    // Update summary cards
    document.getElementById("tax-summary-today").textContent = `₱${parseFloat(
      todayData.total_tax || 0
    ).toFixed(2)}`;
    document.getElementById("tax-summary-week").textContent = `₱${parseFloat(
      weekData.total_tax || 0
    ).toFixed(2)}`;
    document.getElementById("tax-summary-month").textContent = `₱${parseFloat(
      monthData.total_tax || 0
    ).toFixed(2)}`;
    document.getElementById("tax-summary-total").textContent = `₱${parseFloat(
      allData.total_tax || 0
    ).toFixed(2)}`;
  } catch (error) {
    console.error("Error updating tax summary:", error);
  }
}

/**
 * Update tax stats in header cards
 */
async function updateTaxStats() {
  try {
    const [todayData, weekData] = await Promise.all([
      fetch("/api/admin_tax_stats?period=today").then((r) => r.json()),
      fetch("/api/admin_tax_stats?period=week").then((r) => r.json()),
    ]);

    // Update today's tax
    document.getElementById("admin-tax-today").textContent = `₱${parseFloat(
      todayData.total_tax || 0
    ).toFixed(2)}`;

    // Calculate change
    const todayTax = parseFloat(todayData.total_tax || 0);
    const weekTax = parseFloat(weekData.total_tax || 0);
    const avgDailyTax = weekTax / 7;
    const change =
      avgDailyTax > 0
        ? (((todayTax - avgDailyTax) / avgDailyTax) * 100).toFixed(1)
        : 0;
    const changeElement = document.getElementById("admin-tax-change");

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
    document.getElementById("admin-orders-today").textContent =
      todayData.total_orders || 0;
  } catch (error) {
    console.error("Error updating tax stats:", error);
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // Only initialize if we're on the dashboard section
  if (document.getElementById("taxRevenueChart")) {
    initTaxStats();
  }
});

// Make function globally available
window.updateTaxChart = updateTaxChart;
