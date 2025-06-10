let csrf_token = null
let order_id = null
let order_detail_url = null
let cancel_order_url = null
let reorder_url = null

// Order data
let orderData = null

async function InitializeOrderDetail(
  csrfTokenParam,
  orderIdParam,
  orderDetailUrlParam,
  cancelOrderUrlParam,
  reorderUrlParam,
) {
  csrf_token = csrfTokenParam
  order_id = orderIdParam
  order_detail_url = orderDetailUrlParam
  cancel_order_url = cancelOrderUrlParam
  reorder_url = reorderUrlParam

  try {
    showLoading()

    // Load order details
    await loadOrderDetails()

    // Initialize event listeners
    initializeEventListeners()

    hideLoading()
  } catch (error) {
    console.error("Error initializing order detail:", error)
    showNotification("Error loading order details.", "error")
    hideLoading()
  }
}

async function loadOrderDetails() {
  try {
    const url = `${order_detail_url}?order_id=${order_id}`
    const [success, result] = await callApi("GET", url)

    if (success && result.success) {
      orderData = result.data
      populateOrderDetails()
    } else {
      throw new Error(result.error || "Failed to load order details")
    }
  } catch (error) {
    console.error("Error loading order details:", error)
    showNotification("Error loading order details.", "error")
  }
}

function populateOrderDetails() {
  if (!orderData) return

  // Update page title and header
  document.getElementById("order-number").textContent = orderData.order_id
  document.getElementById("order-id").textContent = orderData.order_id

  // Order basic information
  document.getElementById("order-date").textContent = formatDate(orderData.created_at)
  document.getElementById("delivery-date").textContent = formatDate(orderData.delivery_date)
  document.getElementById("delivery-time").textContent = orderData.timeslot_name || "Not specified"

  // Payment information
  document.getElementById("payment-method").textContent = getPaymentMethodText(orderData.payment_method)
  document.getElementById("payment-status").textContent = orderData.payment_received ? "Paid" : "Pending"
  document.getElementById("total-amount").textContent = `₹${Number.parseFloat(orderData.total_amount).toFixed(2)}`

  // Order status
  updateOrderStatus(orderData.status)
  updateOrderTimeline(orderData.status)

  // Show payment section if payment is pending
  if (!orderData.payment_received && orderData.payment_method === "razorpay") {
    document.getElementById("payment-section").style.display = "block"
    document.getElementById("pay-amount").textContent = Number.parseFloat(orderData.total_amount).toFixed(2)
  }

  // Populate order items
  populateOrderItems()

  // Populate addresses
  populateAddresses()

  // Populate order summary
  populateOrderSummary()

  // Show/hide action buttons based on order status
  updateActionButtons()
}

function updateOrderStatus(status) {
  const statusBadge = document.getElementById("order-status-badge")
  const statusConfig = getStatusConfig(status)

  statusBadge.textContent = statusConfig.text
  statusBadge.className = `badge fs-6 px-3 py-2 ${statusConfig.class}`
}

function getStatusConfig(status) {
  const configs = {
    placed: { text: "Order Placed", class: "bg-info" },
    confirmed: { text: "Confirmed", class: "bg-primary" },
    preparing: { text: "Preparing", class: "bg-warning" },
    ready: { text: "Ready for Delivery", class: "bg-success" },
    out_for_delivery: { text: "Out for Delivery", class: "bg-success" },
    delivered: { text: "Delivered", class: "bg-success" },
    cancelled: { text: "Cancelled", class: "bg-danger" },
    not_placed: { text: "Payment Pending", class: "bg-secondary" },
  }
  return configs[status] || { text: status, class: "bg-secondary" }
}

function updateOrderTimeline(status) {
  const timeline = document.getElementById("order-timeline")
  const steps = [
    { key: "placed", icon: "fas fa-check", label: "Order Placed" },
    { key: "confirmed", icon: "fas fa-clipboard-check", label: "Confirmed" },
    { key: "preparing", icon: "fas fa-utensils", label: "Preparing" },
    { key: "ready", icon: "fas fa-box", label: "Ready" },
    { key: "out_for_delivery", icon: "fas fa-truck", label: "Out for Delivery" },
    { key: "delivered", icon: "fas fa-home", label: "Delivered" },
  ]

  const statusOrder = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"]
  const currentIndex = statusOrder.indexOf(status)

  timeline.innerHTML = steps
    .map((step, index) => {
      let stepClass = ""
      if (index < currentIndex) {
        stepClass = "completed"
      } else if (index === currentIndex) {
        stepClass = "active"
      }

      return `
            <div class="timeline-step ${stepClass}">
                <div class="timeline-step-icon">
                    <i class="${step.icon}"></i>
                </div>
                <div class="timeline-step-label">${step.label}</div>
                <div class="timeline-line"></div>
            </div>
        `
    })
    .join("")
}

function populateOrderItems() {
  const container = document.getElementById("order-items-container")

  if (!orderData.items || orderData.items.length === 0) {
    container.innerHTML = '<p class="text-muted">No items found.</p>'
    return
  }

  container.innerHTML = orderData.items
    .map(
      (item) => `
        <div class="order-item">
            <div class="row align-items-center">
                <div class="col-md-2">
                    <img src="${item.product_image || "/placeholder.svg?height=80&width=80"}" 
                         alt="${item.product_name}" class="product-image">
                </div>
                <div class="col-md-6">
                    <h6 class="mb-1">${item.product_name}</h6>
                    ${item.variation_name ? `<small class="text-muted">Variation: ${item.variation_name}</small><br>` : ""}
                    <small class="text-muted">Quantity: ${item.quantity}</small>
                    ${item.item_note ? `<br><small class="text-muted">Note: ${item.item_note}</small>` : ""}
                </div>
                <div class="col-md-2 text-center">
                    <span class="text-muted">₹${Number.parseFloat(item.amount).toFixed(2)}</span>
                    ${item.discount > 0 ? `<br><small class="text-success">-₹${Number.parseFloat(item.discount).toFixed(2)}</small>` : ""}
                </div>
                <div class="col-md-2 text-end">
                    <strong>₹${Number.parseFloat(item.final_amount).toFixed(2)}</strong>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function populateAddresses() {
  // Shipping address
  const shippingContainer = document.getElementById("shipping-address")
  shippingContainer.innerHTML = `
        <p class="mb-1"><strong>${orderData.first_name} ${orderData.last_name}</strong></p>
        <p class="mb-1">${orderData.delivery_address}</p>
        <p class="mb-1">Phone: ${orderData.phone}</p>
        <p class="mb-0">Email: ${orderData.email}</p>
    `

  // Billing address (if different)
  if (orderData.different_billing_address) {
    document.getElementById("billing-address-section").style.display = "block"
    const billingContainer = document.getElementById("billing-address")
    billingContainer.innerHTML = `
            <p class="mb-1"><strong>${orderData.billing_first_name} ${orderData.billing_last_name}</strong></p>
            <p class="mb-1">${orderData.billing_address}, ${orderData.billing_city}</p>
            <p class="mb-1">Pincode: ${orderData.billing_pincode}</p>
            ${orderData.billing_phone ? `<p class="mb-0">Phone: ${orderData.billing_phone}</p>` : ""}
        `
  }

  // Special instructions
  if (orderData.special_instructions) {
    document.getElementById("special-instructions-section").style.display = "block"
    document.getElementById("special-instructions").textContent = orderData.special_instructions
  }
}

function populateOrderSummary() {
  const subtotal = orderData.items.reduce((sum, item) => sum + Number.parseFloat(item.final_amount), 0)
  const deliveryCharges = Number.parseFloat(orderData.delivery_charges || 0)
  const tax = Number.parseFloat(orderData.tax_amount || 0)
  const discount = Number.parseFloat(orderData.discount_amount || 0)
  const total = Number.parseFloat(orderData.total_amount)

  document.getElementById("summary-subtotal").textContent = `₹${subtotal.toFixed(2)}`
  document.getElementById("summary-delivery").textContent =
    deliveryCharges === 0 ? "Free" : `₹${deliveryCharges.toFixed(2)}`
  document.getElementById("summary-tax").textContent = `₹${tax.toFixed(2)}`
  document.getElementById("summary-total").textContent = `₹${total.toFixed(2)}`

  if (discount > 0) {
    document.getElementById("discount-row").style.display = "flex"
    document.getElementById("summary-discount").textContent = `-₹${discount.toFixed(2)}`
  }
}

function updateActionButtons() {
  const cancelBtn = document.getElementById("cancel-order-btn")

  // Show cancel button only for certain statuses
  if (["placed", "confirmed"].includes(orderData.status)) {
    cancelBtn.style.display = "block"
  }
}

function initializeEventListeners() {
  // Pay now button
  document.getElementById("pay-now-btn").addEventListener("click", processPayment)

  // Track order button
  document.getElementById("track-order-btn").addEventListener("click", trackOrder)

  // Download invoice button
  document.getElementById("download-invoice-btn").addEventListener("click", downloadInvoice)

  // Cancel order button
  document.getElementById("cancel-order-btn").addEventListener("click", showCancelOrderModal)

  // Reorder button
  document.getElementById("reorder-btn").addEventListener("click", reorderItems)
}

async function processPayment() {
  try {
    showLoading()

    // Use the existing payment data from order
    if (orderData.payment_id && orderData.razorpay_key_id) {
      const options = {
        key: orderData.razorpay_key_id,
        amount: Number.parseFloat(orderData.total_amount) * 100, // Amount in paise
        currency: "INR",
        name: "OvenFresh",
        description: "Order Payment",
        order_id: orderData.payment_id,
        callback_url: `http://127.0.0.1:8000/order-success/?order_id=${orderData.order_id}`,
        notes: {
          order_receipt: orderData.order_id,
        },
        theme: {
          color: "#F37254",
        },
        handler: (response) => {
          // Payment successful
          showNotification("Payment completed successfully!", "success")
          // Reload order details to update payment status
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        },
        modal: {
          ondismiss: () => {
            showNotification("Payment cancelled", "warning")
          },
        },
      }

      const rzp = new Razorpay(options)
      rzp.open()
    } else {
      throw new Error("Payment information not available")
    }
  } catch (error) {
    console.error("Error processing payment:", error)
    showNotification("Error processing payment. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

function trackOrder() {
  // Implement order tracking functionality
  showNotification("Order tracking feature coming soon!", "info")
}

function downloadInvoice() {
  // Implement invoice download functionality
  showNotification("Invoice download feature coming soon!", "info")
}

function showCancelOrderModal() {
  const modalHtml = `
        <div class="modal fade" id="cancelOrderModal" tabindex="-1" aria-labelledby="cancelOrderModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="cancelOrderModalLabel">Cancel Order</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to cancel this order?</p>
                        <div class="mb-3">
                            <label for="cancelReason" class="form-label">Reason for cancellation (Optional)</label>
                            <textarea class="form-control" id="cancelReason" rows="3" placeholder="Please provide a reason..."></textarea>
                        </div>
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            This action cannot be undone. If payment was made, refund will be processed within 5-7 business days.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn of-btn-outline-secondary" data-bs-dismiss="modal">Keep Order</button>
                        <button type="button" class="btn of-btn-danger" onclick="cancelOrder()">Cancel Order</button>
                    </div>
                </div>
            </div>
        </div>
    `

  document.body.insertAdjacentHTML("beforeend", modalHtml)
  const modal = new bootstrap.Modal(document.getElementById("cancelOrderModal"))
  modal.show()

  document.getElementById("cancelOrderModal").addEventListener("hidden.bs.modal", function () {
    this.remove()
  })
}

async function cancelOrder() {
  const reason = document.getElementById("cancelReason").value.trim()

  try {
    showLoading()

    const [success, result] = await callApi(
      "POST",
      `${cancel_order_url}${order_id}/`,
      {
        reason: reason,
      },
      csrf_token,
    )

    if (success && result.success) {
      showNotification("Order cancelled successfully!", "success")
      bootstrap.Modal.getInstance(document.getElementById("cancelOrderModal")).hide()
      // Reload order details
      await loadOrderDetails()
    } else {
      throw new Error(result.error || "Failed to cancel order")
    }
  } catch (error) {
    console.error("Error cancelling order:", error)
    showNotification("Error cancelling order. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

async function reorderItems() {
  try {
    showLoading()

    const [success, result] = await callApi("POST", `${reorder_url}${order_id}/`, {}, csrf_token)

    if (success && result.success) {
      showNotification("Items added to cart successfully!", "success")
      // Redirect to cart page
      setTimeout(() => {
        window.location.href = "/cart/"
      }, 1500)
    } else {
      throw new Error(result.error || "Failed to reorder items")
    }
  } catch (error) {
    console.error("Error reordering items:", error)
    showNotification("Error adding items to cart. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString)
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  return date.toLocaleDateString("en-US", options)
}

function getPaymentMethodText(method) {
  const methods = {
    cod: "Cash on Delivery",
    razorpay: "Online Payment",
    credit: "Credit Card",
    debit: "Debit Card",
    upi: "UPI",
  }
  return methods[method] || method
}

function showLoading() {
  const loader = document.getElementById("loader")
  if (loader) loader.style.display = "flex"
}

function hideLoading() {
  const loader = document.getElementById("loader")
  if (loader) loader.style.display = "none"
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `alert alert-${type === "error" ? "danger" : type} alert-dismissible fade show position-fixed`
  notification.style.cssText = "top: 20px; right: 20px; z-index: 9999; min-width: 300px;"
  notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `

  document.body.appendChild(notification)

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, 5000)
}
