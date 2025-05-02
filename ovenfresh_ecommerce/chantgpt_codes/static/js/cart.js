let cart_list_url = null;
let cart_update_url = null;
let cart_delete_url = null;
let csrf_token = null;

async function GenerateCart(csrfTokenParam, cartListUrlParam, cartUpdateUrlParam, cartDeleteUrlParam) {
    csrf_token = csrfTokenParam;
    cart_list_url = cartListUrlParam;
    cart_update_url = cartUpdateUrlParam;
    cart_delete_url = cartDeleteUrlParam;

    const [success, result] = await callApi("GET", cart_list_url);
    if (success && result.success) {
        const cartItems = result.data.cart_items;
        const cartTableBody = document.getElementById("cartTableBody");
        const totalItemsElement = document.getElementById("cartTotalItems");
        const totalAmountElement = document.getElementById("cartTotalAmount");

        cartTableBody.innerHTML = "";
        let totalAmount = 0;

        cartItems.forEach(item => {
            const row = document.createElement("tr");
            row.id = `cart_item_${item.cart_item_id}`;

            const itemTotal = item.qty * item.price;
            totalAmount += itemTotal;

            row.innerHTML = `
                <td>${item.product_name}</td>
                <td>
                    <input type="number" id="cart_item_qty_${item.cart_item_id}" value="${item.qty}" min="1"
                        onchange="showUpdateButton(${item.cart_item_id})" class="form-control" />
                </td>
                <td>₹${item.price}</td>
                <td>₹${itemTotal}</td>
                <td>
                    <button id="update_btn_${item.cart_item_id}" class="btn btn-sm btn-primary" style="display:none;" onclick="UpdateCartItem(${item.cart_item_id})">Update</button>
                    <button class="btn btn-sm btn-danger" onclick="DeleteCartItem(${item.cart_item_id})">Delete</button>
                </td>
            `;
            cartTableBody.appendChild(row);
        });

        totalItemsElement.innerText = cartItems.length;
        totalAmountElement.innerText = `₹${totalAmount.toFixed(2)}`;
    } else {
        console.error("Failed to fetch cart items:", result);
    }
}

async function AddToCart(product_variation_id, qty = 1) {
    if (!product_variation_id || qty < 1) {
        alert("Invalid product or quantity.");
        return;
    }

    const bodyData = {
        product_variation_id: product_variation_id,
        qty: qty
    };

    const [success, result] = await callApi("POST", cart_list_url, bodyData, csrf_token);
    if (success && result.success) {
        alert("Item added to cart!");
        await GenerateCart(csrf_token, cart_list_url, cart_update_url, cart_delete_url); // Optional refresh
    } else {
        alert(result.error || "Failed to add item to cart.");
        console.error(result);
    }
}

function showUpdateButton(cart_item_id) {
    const updateBtn = document.getElementById(`update_btn_${cart_item_id}`);
    if (updateBtn) {
        updateBtn.style.display = "inline-block";
    }
}

async function UpdateCartItem(cart_item_id) {
    const qtyInput = document.getElementById(`cart_item_qty_${cart_item_id}`);
    if (!qtyInput) return;

    const updatedQty = parseInt(qtyInput.value);
    if (isNaN(updatedQty) || updatedQty < 1) {
        alert("Invalid quantity");
        return;
    }

    const bodyData = {
        cart_item_id: cart_item_id,
        qty: updatedQty,
    };

    const [success, result] = await callApi("PUT", cart_update_url, bodyData, csrf_token);
    if (success && result.success) {
        alert("Cart item updated!");
        document.getElementById(`update_btn_${cart_item_id}`).style.display = "none";
        await GenerateCart(csrf_token, cart_list_url, cart_update_url, cart_delete_url); // refresh cart
    } else {
        alert("Failed to update item.");
        console.error(result);
    }
}

async function DeleteCartItem(cart_item_id) {
    const bodyData = {
        cart_item_id: cart_item_id
    };

    const [success, result] = await callApi("DELETE", cart_delete_url, bodyData, csrf_token);
    if (success && result.success) {
        document.getElementById(`cart_item_${cart_item_id}`).remove();
        alert("Cart item deleted!");
        await GenerateCart(csrf_token, cart_list_url, cart_update_url, cart_delete_url); // refresh cart
    } else {
        alert("Failed to delete item.");
        console.error(result);
    }
}


// ------------- HTML CODE -------------
// <table id="cartTable" class="table">
//   <thead>
//     <tr>
//       <th>Product</th>
//       <th>Qty</th>
//       <th>Price</th>
//       <th>Actions</th>
//     </tr>
//   </thead>
//   <tbody id="cartTableBody">
//     <!-- Rows inserted here by JavaScript -->
//   </tbody>
// </table>

// <div class="mt-3">
//     <h5>Total Unique Items: <span id="cartTotalItems">0</span></h5>
//     <h5>Total Amount: <span id="cartTotalAmount">₹0.00</span></h5>
// </div>

// <button onclick="AddToCart('VARIATION12345', 2)">Add to Cart</button>
