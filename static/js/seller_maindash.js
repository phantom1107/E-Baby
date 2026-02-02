// Initialize sales chart
async function initSalesChart() {
    const response = await fetch('/api/sales_data');
    const salesData = await response.json();

    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: salesData.map(item => item.date),
            datasets: [{
                label: 'Total Sales (₱)',
                data: salesData.map(item => item.sales),
                backgroundColor: '#B0878F',
                borderColor: '#B0878F',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Daily Sales'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Initialize product performance chart
async function initProductChart() {
    const response = await fetch('/api/product_performance');
    const data = await response.json();

    const ctx = document.getElementById('productChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.products,
            datasets: [{
                data: data.sales,
                backgroundColor: [
                    '#B0878F',
                    '#C4A5AA',
                    '#D8C3C6',
                    '#ECE1E2',
                    '#FFFFFF'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Update stats
function updateStats() {
    fetch('/api/seller_stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalRevenue').textContent = `₱${data.total_sales}`;
            document.getElementById('itemsSold').textContent = data.total_items;
            document.getElementById('pendingOrders').textContent = data.pending_orders;
        });
}

// Period buttons functionality
document.querySelectorAll('.period-btn').forEach(button => {
    button.addEventListener('click', async () => {
        const period = button.dataset.period;
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const response = await fetch(`/api/sales_data?period=${period}`);
        const salesData = await response.json();
        // Update chart with new data
        initSalesChart();
    });
});

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');
    sidebar.classList.toggle('collapsed');
    dashboardContainer.classList.toggle('expanded');
}

// User dropdown
function toggleDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Logout modal
function confirmLogout() {
    document.getElementById('logoutModal').style.display = 'flex';
}

function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('logoutModal');
    if (event.target == modal) {
        closeLogoutModal();
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    initSalesChart();
    initProductChart();
    updateStats();
    
    // Update stats every 30 seconds
    setInterval(updateStats, 30000);
});

