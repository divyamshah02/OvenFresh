function simulateApiDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function GenerateAdminDashboardMock() {
    await simulateApiDelay(500); // Simulate network delay

    // Fake data for the admin dashboard
    const mockData = {
        total_sales_amount: 154200.50,
        total_orders: 128,
        average_order_value: 1204.69,
        order_status_counts: {
            pending: 18,
            dispatched: 44,
            delivered: 66
        },
        recent_orders: [
            {
                order_id: "ORD123456",
                customer_name: "Priya Mehta",
                total_amount: 980.00,
                status: "delivered",
                created_at: "2025-04-29 12:30 PM"
            },
            {
                order_id: "ORD123457",
                customer_name: "Rahul Jain",
                total_amount: 1340.00,
                status: "dispatched",
                created_at: "2025-04-29 01:00 PM"
            },
            {
                order_id: "ORD123458",
                customer_name: "Ayesha Khan",
                total_amount: 620.00,
                status: "pending",
                created_at: "2025-04-29 02:15 PM"
            }
        ],
        date_range: "This Month"
    };

    // Populate the admin dashboard with mock data
    updateDashboardWithMockData(mockData);
}

function updateDashboardWithMockData(data) {
    // Populate sales statistics
    document.getElementById("total_sales_amount").innerText = "₹" + data.total_sales_amount.toFixed(2);
    document.getElementById("total_orders").innerText = data.total_orders;
    document.getElementById("average_order_value").innerText = "₹" + data.average_order_value.toFixed(2);

    // Populate order status counts
    document.getElementById("order_pending_count").innerText = data.order_status_counts.pending;
    document.getElementById("order_dispatched_count").innerText = data.order_status_counts.dispatched;
    document.getElementById("order_delivered_count").innerText = data.order_status_counts.delivered;

    // Populate date range selection (this is a mock, normally selected by user)
    document.getElementById("date_range").innerText = data.date_range;

    // Populate recent orders table
    const recentOrdersTable = document.getElementById("recent_orders_table_body");
    recentOrdersTable.innerHTML = "";

    data.recent_orders.forEach(order => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${order.order_id}</td>
            <td>${order.customer_name}</td>
            <td>₹${order.total_amount.toFixed(2)}</td>
            <td>${order.status}</td>
            <td>${order.created_at}</td>
        `;

        recentOrdersTable.appendChild(row);
    });
}

// Call the mock function on page load
window.onload = async function () {
    await GenerateAdminDashboardMock();
};
