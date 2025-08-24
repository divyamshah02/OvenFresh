let csrf_token = null
let dashboard_url = null
let availability_url = null
let status_update_url = null
let confirm_cash_url = null
let my_orders_url = null

// Data storage
let dashboardData = null
let pastOrders = []
let currentCodOrder = null
let currentOnlineOrder = null

async function InitializeDeliveryDashboard(
  csrfTokenParam,
  dashboardUrlParam,
  availabilityUrlParam,
  statusUpdateUrlParam,
  confirmCashUrlParam,
  myOrdersUrlParam,
) {
  csrf_token = csrfTokenParam
  dashboard_url = dashboardUrlParam
  availability_url = availabilityUrlParam
  status_update_url = statusUpdateUrlParam
  confirm_cash_url = confirmCashUrlParam
  my_orders_url = myOrdersUrlParam

  try {
    showLoading()
    await loadDashboardData()
    initializeEventListeners()
    hideLoading()
  } catch (error) {
    console.error("Error initializing dashboard:", error)
    showToast("Error loading dashboard data.", "error")
    hideLoading()
  }
}

async function loadDashboardData() {
  try {
    const [success, result] = await callApi("GET", dashboard_url)
    if (success && result.success) {
      dashboardData = result.data
      populateDashboard()
    } else {
      if (result.user_not_logged_in) {
        window.location.href = "/delivery-login/"
        return
      }
      throw new Error(result.error || "Failed to load dashboard data")
    }
  } catch (error) {
    console.error("Error loading dashboard:", error)
    window.location.href = "/delivery-login/"
  }
}

async function loadPastOrders() {
  try {
    const [success, result] = await callApi("GET", `${my_orders_url}?date=completed`)
    if (success && result.success) {
      pastOrders = result.data || []
      populateOrders("pastOrders", pastOrders)
    } else {
      console.error("Error loading past orders:", result.error)
    }
  } catch (error) {
    console.error("Error loading past orders:", error)
  }
}

function populateDashboard() {
  if (!dashboardData) return
  document.getElementById("userName").textContent = dashboardData.user_info.name
  document.getElementById("availabilityToggle").checked = dashboardData.user_info.is_available
  document.getElementById("pendingCount").textContent = dashboardData.stats.pending_count
  document.getElementById("completedCount").textContent = dashboardData.stats.completed_today
  populateOrders("todayOrders", dashboardData.today_orders)
  populateOrders("pendingOrders", dashboardData.pending_orders)
}

function populateOrders(containerId, orders) {
  const container = document.getElementById(containerId)
  if (!orders || orders.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No orders found</h5>
                <p class="text-muted">You don't have any orders in this category.</p>
            </div>
        `
    return
  }
  container.innerHTML = orders.map((order) => createOrderCard(order)).join("")
}

function createOrderCard(order) {
  const statusClass = getStatusClass(order.status)
  const statusText = getStatusText(order.status)
  const paymentBadge = order.is_cod
    ? '<span class="badge bg-warning text-dark">COD</span>'
    : '<span class="badge bg-success">Online</span>'

  let actionButtons = ""
  if (order.status === "ready") {
    actionButtons = `
            <button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${order.order_id}', 'out_for_delivery')">
                <i class="fas fa-truck me-1"></i>Pick Up
            </button>
        `
  } else if (order.status === "out_for_delivery") {
    if (order.is_cod) {
      actionButtons = `
                <button class="btn btn-warning btn-sm" onclick="showCodModal('${order.order_id}', ${order.total_amount})">
                    <i class="fas fa-money-bill-wave me-1"></i>Collect Cash & Deliver
                </button>
            `
    } else {
      actionButtons = `
                <button class="btn btn-success btn-sm" onclick="showOnlineModal('${order.order_id}')">
                    <i class="fas fa-check me-1"></i>Mark Delivered
                </button>
            `
    }
  }

  return `
        <div class="card mb-3">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">Order #${order.order_id}</h6>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            ${formatDate(order.delivery_date)}
                        </small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${statusClass}">${statusText}</span>
                        <div class="mt-1">${paymentBadge}</div>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6><i class="fas fa-user me-2"></i>Customer Details</h6>
                        <p class="mb-1"><strong>${order.customer_name}</strong></p>
                        <p class="mb-2">
                            <i class="fas fa-phone me-1"></i>
                            <a href="tel:${order.customer_phone}" class="text-decoration-none">${order.customer_phone}</a>
                        </p>
                        <h6><i class="fas fa-map-marker-alt me-2"></i>Delivery Address <a href="https://www.google.com/maps/search/${order.delivery_address}" target="_blank">(Maps)</a></h6>
                        <p class="mb-2">${order.delivery_address}</p>
                        ${order.special_instructions ? `<h6><i class="fas fa-sticky-note me-2"></i>Special Instructions</h6><p class="mb-2 text-info">${order.special_instructions}</p>` : ""}
                    </div>
                    <div class="col-md-6">
                        <h6><i class="fas fa-shopping-bag me-2"></i>Order Items (${order.items_count})</h6>
                        <div class="mb-3">
                            ${order.items.map(item => `<span class="badge bg-light text-dark me-1 mb-1">${item.quantity}x ${item.weight_variation} - ${item.product_title || "Product"}</span>`).join("")}
                        </div>
                        <div class="mb-3">
                            <h6><i class="fas fa-rupee-sign me-2"></i>Total Amount</h6>
                            <h4 class="text-primary mb-0">₹${order.total_amount.toFixed(2)}</h4>
                        </div>
                        ${actionButtons ? `<div class="d-flex gap-2">${actionButtons}</div>` : ""}
                    </div>
                </div>
            </div>
        </div>
    `
}

function initializeEventListeners() {
  document.getElementById("availabilityToggle").addEventListener("change", async (e) => {
    await toggleAvailability(e.target.checked)
  })
  document.getElementById("history-tab").addEventListener("click", async () => {
    await loadPastOrders()
  })
  setInterval(async () => {
    await loadDashboardData()
  }, 30000)
}

async function toggleAvailability(isAvailable) {
  try {
    const [success, result] = await callApi(
      "POST",
      availability_url,
      { is_available: isAvailable },
      csrf_token,
    )
    if (success && result.success) {
      showToast(result.data.message, "success")
    } else {
      throw new Error(result.error || "Failed to update availability")
    }
  } catch (error) {
    console.error("Error updating availability:", error)
    showToast("Error updating availability.", "error")
    document.getElementById("availabilityToggle").checked = !isAvailable
  }
}

async function updateOrderStatus(orderId, newStatus) {
  if (!confirm(`Are you sure you want to mark this order as ${newStatus.replace("_", " ")}?`)) return
  try {
    showLoading()
    const [success, result] = await callApi("POST", status_update_url, { order_id: orderId, status: newStatus }, csrf_token)
    if (success && result.success) {
      showToast(result.data.message, "success")
      await loadDashboardData()
    } else {
      throw new Error(result.error || "Failed to update order status")
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    showToast("Error updating order status.", "error")
  } finally {
    hideLoading()
  }
}

function showCodModal(orderId, amount) {
  currentCodOrder = { orderId, amount }
  document.getElementById("codOrderId").textContent = orderId
  document.getElementById("codAmount").textContent = `₹${amount.toFixed(2)}`
  document.getElementById("collectedAmount").value = amount.toFixed(2)
  const modal = new bootstrap.Modal(document.getElementById("codModal"))
  modal.show()
}

async function confirmCashCollection() {
  if (!currentCodOrder) return
  const collectedAmount = Number.parseFloat(document.getElementById("collectedAmount").value)
  const extraCost = Number.parseFloat(document.getElementById("extraCost").value) || 0
  const transportMode = document.getElementById("transportMode").value || ""

  if (isNaN(collectedAmount) || collectedAmount <= 0) {
    showToast("Please enter a valid amount.", "error")
    return
  }

  try {
    showLoading()
    const [success, result] = await callApi("POST", confirm_cash_url, {
      order_id: currentCodOrder.orderId,
      collected_amount: collectedAmount,
      extra_cost: extraCost,
      transport_mode: transportMode
    }, csrf_token)

    if (success && result.success) {
      const formData = new FormData()
      formData.append("order_id", currentCodOrder.orderId)
      formData.append("status", "delivered")
      const photoInput = document.getElementById("deliveryPhotos")
      for (let i = 0; i < photoInput.files.length; i++) {
        formData.append("images", photoInput.files[i])
      }
      const [deliverySuccess, deliveryResult] = await callApiMultipart("POST", status_update_url, formData, csrf_token)
      if (deliverySuccess && deliveryResult.success) {
        showToast("Cash collected and order marked as delivered!", "success")
        bootstrap.Modal.getInstance(document.getElementById("codModal")).hide()
        await loadDashboardData()
      } else {
        showToast("Cash collected but failed to mark as delivered. Please try again.", "warning")
      }
    } else {
      throw new Error(result.error || "Failed to confirm cash collection")
    }
  } catch (error) {
    console.error("Error confirming cash collection:", error)
    showToast("Error confirming cash collection.", "error")
  } finally {
    hideLoading()
  }
}

function showOnlineModal(orderId) {
  currentOnlineOrder = { orderId }
  document.getElementById("onlineOrderId").textContent = orderId
  const modal = new bootstrap.Modal(document.getElementById("onlineModal"))
  modal.show()
}

async function confirmOnlineDelivery() {
  if (!currentOnlineOrder) return
  const extraCost = Number.parseFloat(document.getElementById("onlineExtraCost").value) || 0
  const transportMode = document.getElementById("onlineTransportMode").value || ""

  try {
    showLoading()
    const formData = new FormData()
    formData.append("order_id", currentOnlineOrder.orderId)
    formData.append("status", "delivered")
    formData.append("extra_cost", extraCost)
    formData.append("transport_mode", transportMode)

    const photoInput = document.getElementById("onlineDeliveryPhotos")
    for (let i = 0; i < photoInput.files.length; i++) {
      formData.append("images", photoInput.files[i])
    }

    const [success, result] = await callApiMultipart("POST", status_update_url, formData, csrf_token)
    if (success && result.success) {
      showToast("Online order marked as delivered!", "success")
      bootstrap.Modal.getInstance(document.getElementById("onlineModal")).hide()
      await loadDashboardData()
    } else {
      throw new Error(result.error || "Failed to complete delivery")
    }
  } catch (error) {
    console.error("Error completing online delivery:", error)
    showToast("Error completing delivery.", "error")
  } finally {
    hideLoading()
  }
}

async function callApiMultipart(method, url, formData, csrfToken) {
  try {
    const response = await fetch(url, { method, body: formData, headers: { "X-CSRFToken": csrfToken } })
    const result = await response.json()
    return [response.ok, result]
  } catch (error) {
    console.error("API call failed:", error)
    return [false, { success: false, error: "Network error" }]
  }
}

function viewHistory() { document.getElementById("history-tab").click() }
async function logout() {
  if (!confirm("Are you sure you want to logout?")) return
  try { await callApi("POST", "/user-api/logout-api/", {}, csrf_token) } catch {}
  window.location.href = "/delivery-login/"
}

function getStatusClass(status) {
  const statusClasses = { placed: "bg-info", preparing: "bg-warning text-dark", ready: "bg-primary", out_for_delivery: "bg-secondary", delivered: "bg-success" }
  return statusClasses[status] || "bg-info"
}
function getStatusText(status) {
  const statusTexts = { placed: "Order Placed", preparing: "Preparing", ready: "Ready for Pickup", out_for_delivery: "Out for Delivery", delivered: "Delivered" }
  return statusTexts[status] || status
}
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}
function showLoading() { const loader = document.getElementById("loader"); if (loader) loader.style.display = "flex" }
function hideLoading() { const loader = document.getElementById("loader"); if (loader) loader.style.display = "none" }
function showToast(message, type = "info") {
  let toastContainer = document.getElementById("toastContainer")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.id = "toastContainer"
    toastContainer.className = "position-fixed bottom-0 end-0 p-3"
    toastContainer.style.zIndex = "9999"
    document.body.appendChild(toastContainer)
  }
  const toastId = `toast-${Date.now()}`
  const toast = document.createElement("div")
  toast.className = `toast show border-0`
  toast.id = toastId
  const bgClass = type === "error" ? "bg-danger" : type === "success" ? "bg-success" : type === "warning" ? "bg-warning" : "bg-info"
  toast.classList.add(bgClass, "text-white")
  toast.innerHTML = `
        <div class="toast-header bg-transparent text-white border-0">
            <strong class="me-auto"><i class="fas ${type === "error" ? "fa-exclamation-circle" : type === "success" ? "fa-check-circle" : type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle"} me-2"></i>Notification</strong>
            <small>Just now</small>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">${message}</div>
    `
  toastContainer.appendChild(toast)
  const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 5000 })
  bsToast.show()
  toast.addEventListener("hidden.bs.toast", () => { toast.remove() })
}
