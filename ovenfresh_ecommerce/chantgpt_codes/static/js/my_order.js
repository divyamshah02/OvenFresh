async function LoadMyOrders(orderListUrl) {
    const [success, result] = await callApi("GET", orderListUrl);
    if (!success || !result.success) {
        alert("Failed to load your orders.");
        return;
    }

    const orders = result.data;
    const tbody = document.getElementById("ordersTableBody");
    tbody.innerHTML = "";

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">No orders found.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${order.order_id}</td>
            <td>${order.status}</td>
            <td>${order.delivery_date} (${order.delivery_slot})</td>
            <td>${order.payment_done ? "Paid" : "Unpaid"} (${order.payment_type})</td>
            <td>₹${order.total_amount}</td>
            <td>${order.created_at}</td>
            <td><a href="/order/detail/${order.order_id}/" class="btn btn-sm btn-primary">View</a></td>
        `;

        tbody.appendChild(row);
    });
}
