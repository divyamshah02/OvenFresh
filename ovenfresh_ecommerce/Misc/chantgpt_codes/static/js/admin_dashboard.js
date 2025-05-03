let analytics_dashboard_url = null;
let current_dashboard_range = "monthly";

async function GenerateAdminDashboard(api_url, default_range = "monthly") {
    analytics_dashboard_url = api_url;
    current_dashboard_range = default_range;

    await fetchDashboardData();
}

function handleDateRangeChange() {
    const selectedRange = document.getElementById("dashboard_range").value;

    const startDiv = document.getElementById("custom_date_start_div");
    const endDiv = document.getElementById("custom_date_end_div");
    const applyDiv = document.getElementById("apply_custom_range_div");

    if (selectedRange === "custom") {
        startDiv.classList.remove("d-none");
        endDiv.classList.remove("d-none");
        applyDiv.classList.remove("d-none");
    } else {
        startDiv.classList.add("d-none");
        endDiv.classList.add("d-none");
        applyDiv.classList.add("d-none");
        current_dashboard_range = selectedRange;
        fetchDashboardData();
    }
}

async function fetchDashboardData() {
    let params = {
        range: current_dashboard_range,
    };

    if (current_dashboard_range === "custom") {
        const startDate = document.getElementById("start_date").value;
        const endDate = document.getElementById("end_date").value;

        if (!startDate || !endDate) {
            alert("Please select both start and end dates.");
            return;
        }

        params.start_date = startDate;
        params.end_date = endDate;
    }

    const url = analytics_dashboard_url + "?" + toQueryString(params);
    const [success, result] = await callApi("GET", url);

    if (success && result.success) {
        const data = result.data;

        // Update Sales Statistics
        document.getElementById("total_sales_amount").innerText = "₹" + data.total_sales_amount.toFixed(2);
        document.getElementById("total_orders").innerText = data.total_orders;
        document.getElementById("average_order_value").innerText = "₹" + data.average_order_value.toFixed(2);

        // Update Order Status Counts
        document.getElementById("order_pending_count").innerText = data.order_status_counts.pending || 0;
        document.getElementById("order_dispatched_count").innerText = data.order_status_counts.dispatched || 0;
        document.getElementById("order_delivered_count").innerText = data.order_status_counts.delivered || 0;

        // Update Recent Orders Table
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

    } else {
        alert("Failed to load dashboard data.");
    }
}
