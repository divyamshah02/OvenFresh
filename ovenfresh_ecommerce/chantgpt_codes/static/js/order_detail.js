async function GenerateOrderDetail(orderId, orderDetailUrl) {
    const fullUrl = `${orderDetailUrl}?order_id=${orderId}`;
    const [success, result] = await callApi("GET", fullUrl);
    if (!success || !result.success) {
        alert("Failed to fetch order details.");
        return;
    }

    const data = result.data;

    // Meta
    document.getElementById("orderMeta").innerHTML = `
        <strong>Order ID:</strong> ${data.order_id} <br>
        <strong>Status:</strong> ${data.status} <br>
        <strong>Payment:</strong> ₹${data.total_amount} via ${data.payment_type} (${data.payment_done ? 'Paid' : 'Unpaid'}) <br>
        <strong>Order Date:</strong> ${data.created_at}
    `;

    // Customer Info
    const customerInfo = `
        <li class="list-group-item"><strong>Name:</strong> ${data.customer_name}</li>
        <li class="list-group-item"><strong>Phone:</strong> ${data.customer_contact_number}</li>
        <li class="list-group-item"><strong>Address:</strong> ${data.address_text}</li>
        <li class="list-group-item"><strong>Pincode:</strong> ${data.pincode}</li>
        <li class="list-group-item"><strong>Delivery Slot:</strong> ${data.delivery_slot} (${data.delivery_date})</li>
    `;
    document.getElementById("customerInfo").innerHTML = customerInfo;

    // Products
    let productHtml = '';
    let totalAmount = 0;
    data.order_items.forEach(item => {
        const lineTotal = item.quantity * item.price;
        totalAmount += lineTotal;

        productHtml += `
            <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>₹${lineTotal}</td>
            </tr>
        `;
    });

    document.getElementById("productList").innerHTML = productHtml;
    document.getElementById("orderTotal").innerText = `₹${totalAmount}`;
}
