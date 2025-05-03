let csrf_token = null;
let cart_api_url = null;
let delivery_slots_api_url = null;
let delivery_pincode_api_url = null;
let place_order_api_url = null;

let cart_items_data = [];

async function GenerateCheckout(csrf_token_param, cart_api_url_param, delivery_slots_api_url_param, delivery_pincode_api_url_param, place_order_api_url_param) {
  csrf_token = csrf_token_param;
  cart_api_url = cart_api_url_param;
  delivery_slots_api_url = delivery_slots_api_url_param;
  delivery_pincode_api_url = delivery_pincode_api_url_param;
  place_order_api_url = place_order_api_url_param;

  await RenderCartItems();
  await LoadDeliverySlots();
  await LoadAvailablePincodes();

  // Auto-fill today's date
  const dateInput = document.getElementById("delivery-date");
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
}

async function RenderCartItems() {
  const [success, result] = await callApi("GET", cart_api_url);
  if (!success || !result.success) {
    alert("Failed to fetch cart items.");
    return;
  }

  cart_items_data = result.data.cart_items || [];

  const cartTableBody = document.getElementById("checkout-cart-body");
  const totalAmountElement = document.getElementById("checkout-total-amount");
  const totalItemsElement = document.getElementById("checkout-total-items");

  cartTableBody.innerHTML = "";
  let totalAmount = 0;

  cart_items_data.forEach(item => {
    const row = document.createElement("tr");
    row.id = `cart_item_${item.cart_item_id}`;

    row.innerHTML = `
      <td>${item.product_name}</td>
      <td>
        <input type="number" value="${item.qty}" id="cart_item_qty_${item.cart_item_id}" min="1" />
      </td>
      <td>₹${item.total_price}</td>
      <td>
        <button onclick="UpdateCartItem(${item.cart_item_id})">Update</button>
        <button onclick="DeleteCartItem(${item.cart_item_id})">Delete</button>
      </td>
    `;

    cartTableBody.appendChild(row);
    totalAmount += item.total_price;
  });

  totalAmountElement.innerText = `₹${totalAmount}`;
  totalItemsElement.innerText = cart_items_data.length;
}

async function DeleteCartItem(cart_item_id) {
  const url = `${cart_api_url}`;
  const body = { cart_item_id: cart_item_id };

  const [success, result] = await callApi("DELETE", url, body, csrf_token);
  if (success && result.success) {
    document.getElementById(`cart_item_${cart_item_id}`).remove();
    await RenderCartItems();
  } else {
    alert("Failed to delete cart item.");
  }
}

async function UpdateCartItem(cart_item_id) {
  const qtyElement = document.getElementById(`cart_item_qty_${cart_item_id}`);
  const newQty = parseInt(qtyElement.value);

  if (!newQty || newQty < 1) {
    alert("Quantity must be at least 1.");
    return;
  }

  const body = {
    cart_item_id: cart_item_id,
    qty: newQty,
  };

  const [success, result] = await callApi("PUT", cart_api_url, body, csrf_token);
  if (success && result.success) {
    await RenderCartItems();
  } else {
    alert("Failed to update cart item.");
  }
}

async function LoadDeliverySlots() {
  const [success, result] = await callApi("GET", delivery_slots_api_url);
  if (!success || !result.success) return;

  const slotSelect = document.getElementById("delivery-slot");
  result.data.time_slots.forEach(slot => {
    const option = document.createElement("option");
    option.value = slot.id;
    option.innerText = `${slot.start_time} - ${slot.end_time}`;
    slotSelect.appendChild(option);
  });
}

async function LoadAvailablePincodes() {
  const [success, result] = await callApi("GET", delivery_pincode_api_url);
  if (!success || !result.success) return;

  const pincodeSelect = document.getElementById("pincode-select");
  result.data.pincodes.forEach(pincode => {
    const option = document.createElement("option");
    option.value = pincode;
    option.innerText = pincode;
    pincodeSelect.appendChild(option);
  });
}

async function PlaceOrder() {
  const deliveryDate = document.getElementById("delivery-date").value;
  const deliverySlot = document.getElementById("delivery-slot").value;
  const pincode = document.getElementById("pincode-select").value;
  const address = document.getElementById("address-line").value;
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;

  if (!deliveryDate || !deliverySlot || !pincode || !address || !paymentMethod) {
    alert("Please fill all delivery details.");
    return;
  }

  const payload = {
    delivery_date: deliveryDate,
    time_slot_id: deliverySlot,
    delivery_pincode: pincode,
    address_line: address,
    payment_method: paymentMethod,
  };

  const [success, result] = await callApi("POST", place_order_api_url, payload, csrf_token);
  if (!success || !result.success) {
    alert("Something went wrong while placing the order.");
    return;
  }

  const orderData = result.data;

  if (paymentMethod === "COD") {
    window.location.href = `/order/${orderData.order_id}/detail/`;
  } else if (paymentMethod === "ONLINE") {
    OpenRazorpayModal(orderData);
  }
}

function OpenRazorpayModal(orderData) {
  const options = {
    key: orderData.razorpay_key,
    amount: orderData.razorpay_amount,
    currency: "INR",
    name: "Your Bakery Name",
    description: "Order Payment",
    order_id: orderData.razorpay_order_id,
    handler: function (response) {
      window.location.href = `/order/confirm/?order_id=${orderData.order_id}&payment_id=${response.razorpay_payment_id}`;
    },
    prefill: {
      name: orderData.customer_name,
      email: orderData.customer_email,
    },
    theme: {
      color: "#761fe3",
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}
