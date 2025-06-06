let cart_list_url = null;
let cart_delete_url = null;
let csrf_token = null;
let pincode_check_url = null;

let pincodeTimeslots = [];
let availableTimeslots = [];

// Promo codes configuration
const promoCodes = {
    'welcome10': { discount: 0.10, description: '10% off' },
    'save20': { discount: 0.20, description: '20% off' },
    'first15': { discount: 0.15, description: '15% off' },
    'newuser': { discount: 0.25, description: '25% off for new users' }
};

let appliedPromoCode = null;
let promoDiscount = 0;

async function GenerateCart(csrfTokenParam, cartListUrlParam, pincodeCheckUrlParam) {
    csrf_token = csrfTokenParam;
    cart_list_url = cartListUrlParam;
    cart_delete_url = cartListUrlParam;
    pincode_check_url = pincodeCheckUrlParam;

    try {
        const [success, result] = await callApi("GET", cart_list_url);
        if (success && result.success) {
            const cartItems = result.data.cart_items || [];
            renderCartItems(cartItems);
            updateCartCount(cartItems);
            calculateTotals(cartItems);
        } else {
            console.error("Failed to fetch cart items:", result);
            showEmptyCart();
        }
    } catch (error) {
        console.error("Error loading cart:", error);
        showEmptyCart();
    }
}

function renderCartItems(cartItems) {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartContainer = document.getElementById('empty-cart');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartItems || cartItems.length === 0) {
        showEmptyCart();
        return;
    }

    // Show cart items and hide empty state
    cartItemsContainer.style.display = 'block';
    emptyCartContainer.style.display = 'none';
    if (checkoutBtn) checkoutBtn.style.display = 'block';

    // Render cart items
    cartItemsContainer.innerHTML = cartItems.map(item => `
        <div class="border-bottom p-4" id="cart_item_${item.id}">
            <div class="row align-items-center">
                <div class="col-4 pb-3 col-md-2">
                    <img src="${item.product_image || '/placeholder.svg?height=80&width=80'}" 
                         alt="${item.product_name}" 
                         class="img-fluid rounded" 
                         style="max-height: 80px; object-fit: cover;">
                </div>
                <div class="col-8 pb-3 col-md-4">
                    <h6 class="mb-1">${item.product_name}</h6>
                    <p class="text-muted small mb-0">₹${parseFloat(item.price).toFixed(2)} each</p>
                    ${item.weight ? `<p class="text-muted small mb-0">Weight: ${item.weight}</p>` : ''}
                    ${item.message ? `<p class="text-muted small mb-0">Message: ${item.message}</p>` : ''}
                </div>
                <div class="col-4 col-md-3">
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-secondary" 
                                onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})"
                                ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="mx-3 fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary" 
                                onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="col-6 col-md-2">
                    <strong class="of-text-primary">₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</strong>
                </div>
                <div class="col-2 col-md-1">
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="removeCartItem(${item.id})"
                            title="Remove item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showEmptyCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartContainer = document.getElementById('empty-cart');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (cartItemsContainer) cartItemsContainer.style.display = 'none';
    if (emptyCartContainer) emptyCartContainer.style.display = 'block';
    if (checkoutBtn) checkoutBtn.style.display = 'none';

    // Reset totals
    updateOrderSummary(0, 0, 0, 0);
}

function updateCartCount(cartItems) {
    console.log(cartItems);
    const cartCount = cartItems.reduce((total, item) => total + parseInt(item.quantity), 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

function calculateTotals(cartItems) {
    const subtotal = cartItems.reduce((total, item) => total + (parseFloat(item.price) * parseInt(item.quantity)), 0);
    const shipping = subtotal >= 50 ? 0 : 5.99; // Free shipping over ₹50
    const tax = subtotal * 0.08; // 8% tax
    const discount = subtotal * promoDiscount;
    const total = subtotal + shipping + tax - discount;

    updateOrderSummary(subtotal, shipping, tax, total, discount);
}

function updateOrderSummary(subtotal, shipping, tax, total, discount = 0) {
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');

    if (subtotalElement) subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
    if (shippingElement) shippingElement.textContent = shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`;
    if (taxElement) taxElement.textContent = `₹${tax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `₹${total.toFixed(2)}`;

    // Show discount if applied
    let discountElement = document.getElementById('discount-row');
    if (discount > 0) {
        if (!discountElement) {
            discountElement = document.createElement('div');
            discountElement.id = 'discount-row';
            discountElement.className = 'd-flex justify-content-between mb-3 text-success';
            discountElement.innerHTML = `
                <span>Discount (${appliedPromoCode}):</span>
                <span id="discount">-₹${discount.toFixed(2)}</span>
            `;
            document.getElementById('tax').parentElement.insertAdjacentElement('afterend', discountElement);
        } else {
            discountElement.querySelector('#discount').textContent = `-₹${discount.toFixed(2)}`;
        }
    } else if (discountElement) {
        discountElement.remove();
    }
}

async function AddToCart(product_id, product_variation_id, qty=1) {
    if (!product_variation_id || qty < 1) {
        showNotification("Invalid product or quantity.", "error");
        return false;
    }

    try {
        const bodyData = {
            product_id: product_id,
            product_variation_id: product_variation_id,
            qty: qty
        };

        const [success, result] = await callApi("POST", cart_list_url, bodyData, csrf_token);
        if (success && result.success) {
            showNotification("Item added to cart!", "success");
            // Refresh cart if we're on cart page
            if (document.getElementById('cart-items')) {
                await GenerateCart(csrf_token, cart_list_url, pincode_check_url);
            } else {
                // Just update cart count if we're on other pages
                updateCartCountFromAPI();
            }
            return true;
        } else {
            showNotification(result.error || "Failed to add item to cart.", "error");
            console.error(result);
            return false;
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        showNotification("Error adding item to cart.", "error");
        return false;
    }
}

async function updateCartItemQuantity(cart_item_id, newQty) {
    if (newQty < 1) {
        removeCartItem(cart_item_id);
        return;
    }

    try {
        const bodyData = {
            cart_item_id: cart_item_id,
            quantity: newQty,
        };

        const [success, result] = await callApi("PUT", `${cart_list_url}${cart_item_id}/`, bodyData, csrf_token);
        if (success && result.success) {
            showNotification("Cart updated!", "success");
            await GenerateCart(csrf_token, cart_list_url, pincode_check_url);
        } else {
            showNotification("Failed to update item.", "error");
            console.error(result);
        }
    } catch (error) {
        console.error("Error updating cart item:", error);
        showNotification("Error updating cart item.", "error");
    }
}

async function removeCartItem(cart_item_id) {
    if (!confirm("Are you sure you want to remove this item from your cart?")) {
        return;
    }

    try {
        const bodyData = {
            cart_item_id: cart_item_id
        };

        const [success, result] = await callApi("DELETE", `${cart_delete_url}${cart_item_id}/`, bodyData, csrf_token);
        if (success && result.success) {
            showNotification("Item removed from cart!", "success");
            await GenerateCart(csrf_token, cart_list_url, pincode_check_url);
        } else {
            showNotification("Failed to remove item.", "error");
            console.error(result);
        }
    } catch (error) {
        console.error("Error removing cart item:", error);
        showNotification("Error removing cart item.", "error");
    }
}

async function updateCartCountFromAPI() {
    try {
        const [success, result] = await callApi("GET", cart_list_url);
        if (success && result.success) {
            const cartItems = result.data.cart_items || [];
            updateCartCount(cartItems);
        }
    } catch (error) {
        console.error("Error updating cart count:", error);
    }
}

function applyPromoCode() {
    const promoCodeInput = document.getElementById('promoCode');
    const promoCode = promoCodeInput.value.trim().toLowerCase();

    if (!promoCode) {
        showNotification("Please enter a promo code.", "warning");
        return;
    }

    if (promoCodes[promoCode]) {
        appliedPromoCode = promoCode.toUpperCase();
        promoDiscount = promoCodes[promoCode].discount;
        showNotification(`Promo code applied! ${promoCodes[promoCode].description}`, "success");
        
        // Recalculate totals
        const cartItems = getCurrentCartItems();
        calculateTotals(cartItems);
        
        // Disable the input and button
        promoCodeInput.disabled = true;
        document.querySelector('button[onclick="applyPromoCode()"]').disabled = true;
    } else {
        showNotification("Invalid promo code. Please try again.", "error");
    }
}

function getCurrentCartItems() {
    // Extract cart items from current DOM
    const cartItemElements = document.querySelectorAll('[id^="cart_item_"]');
    const cartItems = [];
    
    cartItemElements.forEach(element => {
        const priceText = element.querySelector('.of-text-primary').textContent;
        const price = parseFloat(priceText.replace('₹', '').replace(',', ''));
        const qtyText = element.querySelector('.fw-bold').textContent;
        const qty = parseInt(qtyText);
        const itemPrice = price / qty; // Calculate unit price
        
        cartItems.push({
            price: itemPrice,
            qty: qty
        });
    });
    
    return cartItems;
}

function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

async function checkPincode() {
    const pincodeInput = document.getElementById('pincode-check');
    const pincode = pincodeInput.value.trim();
    
    if (!pincode) {
        showNotification("Please enter a pincode.", "warning");
        return;
    }

    if (!/^\d{6}$/.test(pincode)) {
        showNotification("Please enter a valid 6-digit pincode.", "error");
        return;
    }

    try {
        const pincode_params = { 
            pincode: pincode
        }
        const url = `${pincode_check_url}?` + toQueryString(pincode_params);
        const [success, result] = await callApi("GET", url);
        
        if (success && result.success) {
            console.log(result.data);
            if (result.data.is_deliverable) {
                showNotification("Delivery available in your area!", "success");
                pincodeTimeslots = result.data.availability_data || [];
                showDeliveryOptions();
            } else {
                showNotification("Sorry, delivery not available in your area.", "error");
                hideDeliveryOptions();
            }
        } else {
            showNotification(result.error || "Error checking pincode.", "error");
        }
    } catch (error) {
        console.error("Error checking pincode:", error);
        showNotification("Error checking pincode availability.", "error");
    }
}

function showDeliveryOptions() {
    const deliveryOptionsRow = document.querySelector('.row.m-0.p-0.g-3');
    if (deliveryOptionsRow) {
        deliveryOptionsRow.style.display = 'flex';
        
        // Update timeslots with pricing from pincode check
        const timeslotSelect = document.getElementById('timeslot');
        if (timeslotSelect && pincodeTimeslots.length > 0) {
            timeslotSelect.innerHTML = pincodeTimeslots.map(slot => {
                // Find matching timeslot from general timeslots to get title
                const timeslotInfo = availableTimeslots.find(ts => ts.id === slot.timeslot_id) || {};
                const title = timeslotInfo.time_slot_title || `${slot.start_time} - ${slot.end_time}`;
                const charge = parseFloat(slot.delivery_charge || 0);
                
                return `
                    <option value="${slot.timeslot_id}" data-charge="${charge}">
                        ${title} ${charge > 0 ? `(₹${charge} delivery charge)` : '(Free delivery)'}
                    </option>
                `;
            }).join('');
        }
    }
}

function hideDeliveryOptions() {
    const deliveryOptionsRow = document.querySelector('.row.m-0.p-0.g-3');
    if (deliveryOptionsRow) {
        deliveryOptionsRow.style.display = 'none';
    }
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Update cart count on all pages
    if (typeof cart_list_url !== 'undefined' && cart_list_url) {
        updateCartCountFromAPI();
    }
});