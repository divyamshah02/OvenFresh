let cart_list_url = null;
let cart_delete_url = null;
let csrf_token = null;
let pincode_check_url = null;
let checkout_url = null;

let pincodeTimeslots = [];
let todayPincodeTimeslots = [];
let availableTimeslots = [];
let todayAvailableTimeslots = [];
let cartItems = [];
let selectedTimeslot = null



// Promo codes configuration
const promoCodes = {
    'welcome10': { discount: 0.10, description: '10% off' },
    'save20': { discount: 0.20, description: '20% off' },
    'first15': { discount: 0.15, description: '15% off' },
    'newuser': { discount: 0.25, description: '25% off for new users' }
};

let appliedPromoCode = null;
let promoDiscount = 0;

async function GenerateCart(csrfTokenParam, cartListUrlParam, pincodeCheckUrlParam, checkoutUrlParam = null) {
    csrf_token = csrfTokenParam;
    cart_list_url = cartListUrlParam;
    cart_delete_url = cartListUrlParam;
    if (checkoutUrlParam) {
        checkout_url = checkoutUrlParam;        
    }
    pincode_check_url = pincodeCheckUrlParam;

    try {
        const [success, result] = await callApi("GET", cart_list_url);
        if (success && result.success) {
            cartItems = result.data.cart_items || [];
            renderCartItems();
            updateCartCount();
            calculateTotals();
        } else {
            console.error("Failed to fetch cart items:", result);
            showEmptyCart();
        }
    } catch (error) {
        console.error("Error loading cart:", error);
        showEmptyCart();
    }
}

function renderCartItems() {
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

function updateCartCount() {
    console.log(cartItems);
    const cartCount = cartItems.reduce((total, item) => total + parseInt(item.quantity), 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
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
            cartItems = result.data.cart_items || [];
            updateCartCount();
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
        calculateTotals();
        
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



async function checkPincode(pincodeValue = null) {
  const pincode = pincodeValue || document.getElementById("pincode-check").value.trim()

  if (!pincode) {
    showNotification("Please enter a pincode.", "warning")
    return
  }

  if (!/^\d{6}$/.test(pincode)) {
    showNotification("Please enter a valid 6-digit pincode.", "error")
    return
  }

  try {
    // showLoading()

    const pincode_params = {
      pincode: pincode,
    }
    const url = `${pincode_check_url}?` + toQueryString(pincode_params)
    const [success, result] = await callApi("GET", url)

    if (success && result.success) {
      if (result.data.is_deliverable) {
        showNotification("Delivery available in your area!", "success")
        pincodeTimeslots = result.data.availability_data || []
        todayPincodeTimeslots = result.data.today_availability_data || []
        updateTimeslots()
      } else {
        showNotification("Sorry, delivery not available in your area.", "error")
        clearTimeslots()
      }
    } else {
      throw new Error(result.error || "Error checking pincode.")
    }
  } catch (error) {
    console.error("Error checking pincode:", error)
    showNotification("Error checking pincode availability.", "error")
  } finally {
    // hideLoading()
  }
}

function updateTimeslots() {
    const deliveryOptionsRow = document.getElementById('delivery_options');
    if (deliveryOptionsRow) {
        deliveryOptionsRow.style.display = 'flex';}
  const deliveryDateInput = document.getElementById("deliveryDate")
  const timeslotSelect = document.getElementById("deliveryTime")

  if (!timeslotSelect) return

  // Check if selected date is today
  const isToday = isSelectedDateToday()
  const timeslots = isToday ? todayPincodeTimeslots : pincodeTimeslots

  if (timeslots.length === 0) {
    timeslotSelect.innerHTML = '<option value="">No delivery slots available</option>'
    return
  }

  timeslotSelect.innerHTML =
    `<option value="">Select Time Slot</option>` +
    timeslots
      .map((slot) => {
        const title = `${slot.timeslot_name} (${slot.start_time} - ${slot.end_time})`
        const charge = Number.parseFloat(slot.delivery_charge || 0)

        return `
                <option value="${slot.timeslot_id}" data-charge="${charge}" ${selectedTimeslot == slot.timeslot_id ? "selected" : ""}>
                    ${title} ${charge > 0 ? `(₹${charge} delivery charge)` : "(Free delivery)"}
                </option>
            `
      })
      .join("")
}

function updateShippingCharge() {
  const selectElement = document.getElementById("deliveryTime")
  const selectedOption = selectElement.options[selectElement.selectedIndex]
  const charge = selectedOption.getAttribute("data-charge")
  return charge ? Number.parseFloat(charge) : 0
}

function clearTimeslots() {
  const timeslotSelect = document.getElementById("deliveryTime")
  if (timeslotSelect) {
    timeslotSelect.innerHTML = '<option value="">Select Time Slot</option>'
  }
}

function isSelectedDateToday() {
  const deliveryDateInput = document.getElementById("deliveryDate")
  if (!deliveryDateInput || !deliveryDateInput.value) return false

  const selectedDate = new Date(deliveryDateInput.value)
  const today = new Date()

  return selectedDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)
}

function calculateTotals() {
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const tax = subtotal * 0.18 // 18% tax
  const shipping = updateShippingCharge() // Get shipping charge from selected timeslot
//   const total = subtotal + shipping + tax
  const discount = subtotal * promoDiscount;
  if (discount > 0) {
    document.getElementById("discount-row").style.display = "";
    document.getElementById("discount").textContent = `- ₹${discount.toFixed(2)} (${appliedPromoCode})`;
  }
  const total = subtotal + shipping + tax - discount;

  updateOrderSummary(subtotal, shipping, tax, total)
}

function updateOrderSummary(subtotal, shipping = null, tax, total) {
  const subtotalElement = document.getElementById("subtotal")
  const shippingElement = document.getElementById("shipping")
  const taxElement = document.getElementById("tax")
  const totalElement = document.getElementById("total")

  if (subtotalElement) subtotalElement.textContent = `₹${subtotal.toFixed(2)}`

  if (shipping === null) {
    if (shippingElement) shippingElement.textContent = "To be calculated after selecting delivery time slot"
  } else if (shipping === 0) {
    if (shippingElement) shippingElement.textContent = "Free"
  } else {
    if (shippingElement) shippingElement.textContent = `₹${shipping.toFixed(2)}`
  }

  if (taxElement) taxElement.textContent = `₹${tax.toFixed(2)}`
  if (totalElement) totalElement.textContent = `₹${total.toFixed(2)}`
}

function proceedToCheckout() {
    const deliveryDate = document.getElementById("deliveryDate").value;
    const deliveryTime = document.getElementById("deliveryTime").value;
    const pincode = document.getElementById("pincode-check").value;

    // if (!deliveryDate) {
    //     showNotification("Please select a delivery date.", "warning");
    //     return;
    // }

    // if (!deliveryTime) {
    //     showNotification("Please select a delivery time slot.", "warning");
    //     return;
    // }

    // Prepare checkout data
    const checkoutData = {
        delivery_date: deliveryDate,
        delivery_time: deliveryTime,
        pincode: pincode,
    };

    const checkoutUrl = `${checkout_url}?` + toQueryString(checkoutData);

    window.location.href = checkoutUrl;
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Update cart count on all pages
    
    updateCartCountFromAPI();
    
    const deliveryDateInput = document.getElementById("deliveryDate")
    if (deliveryDateInput) {
        const today = new Date()
        deliveryDateInput.min = today.toISOString().split("T")[0]
        deliveryDateInput.value = today.toISOString().split("T")[0]

        // Add event listener for date change
        deliveryDateInput.addEventListener("change", () => {
        updateTimeslots()
        })
    }

    // Add event listener for pincode check
    const pincodeInput = document.getElementById("pincode-check")
    if (pincodeInput) {
        pincodeInput.addEventListener("blur", () => {
        checkPincode()
        })
    }
    
    // Add event listener for delivery time change
    document.getElementById("deliveryTime").addEventListener("change", calculateTotals)
});