let csrf_token = null
let pincode_orders_url = null
let pincodeData = []
let filteredData = []

// Initialize the admin pincode orders page
async function AdminPincodeOrders(csrfTokenParam, pincodeOrdersUrlParam) {
  csrf_token = csrfTokenParam
  pincode_orders_url = pincodeOrdersUrlParam

  try {
    showLoading()
    await loadPincodeOrders()
    initializeEventListeners()
    hideLoading()
  } catch (error) {
    console.error("Error initializing pincode orders:", error)
    showToast("Error loading pincode orders", "error")
    hideLoading()
  }
}

// Load pincode orders data
async function loadPincodeOrders() {
  try {
    const [success, result] = await callApi("GET", pincode_orders_url)

    if (success && result.success) {
      pincodeData = result.data
      filteredData = [...pincodeData]
      renderPincodeOrders()
      updateStats()
      populateFilterDropdowns()
    } else {
      throw new Error(result.error || "Failed to load pincode orders")
    }
  } catch (error) {
    console.error("Error loading pincode orders:", error)
    showToast("Error loading pincode orders", "error")
  }
}

// Render pincode orders
function renderPincodeOrders() {
  const container = document.getElementById("pincodeOrdersContainer")
  const emptyState = document.getElementById("emptyState")

  if (filteredData.length === 0) {
    container.innerHTML = ""
    emptyState.style.display = "block"
    return
  }

  emptyState.style.display = "none"

  container.innerHTML = filteredData
    .map((pincode) => {
      const ordersCount = pincode.orders.length
      const totalRevenue = pincode.orders.reduce((sum, order) => {
        return sum + order.order_items.reduce((itemSum, item) => itemSum + item.price, 0)
      }, 0)

      const freeSlots = Object.values(pincode.delivery_charge).filter(
        (slot) => slot.charges === 0 && slot.available,
      ).length
      const paidSlots = Object.values(pincode.delivery_charge).filter(
        (slot) => slot.charges > 0 && slot.available,
      ).length

      return `
            <div class="pincode-card">
                <div class="pincode-header" data-bs-toggle="collapse" data-bs-target="#pincode-${pincode.pincode}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-2">
                                <h4 class="mb-0 me-3">${pincode.pincode}</h4>
                                <span class="badge bg-light text-dark">${pincode.area_name}</span>
                                <i class="fas fa-chevron-down collapse-toggle ms-auto" style="transition: transform 0.3s ease;"></i>
                            </div>
                            <p class="mb-2">${pincode.city}, ${pincode.state}</p>
                            <div class="pincode-stats">
                                <div class="stat-item">
                                    <i class="fas fa-shopping-cart me-1"></i>
                                    ${ordersCount} Orders
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-rupee-sign me-1"></i>
                                    ₹${totalRevenue.toFixed(2)}
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-clock me-1"></i>
                                    ${freeSlots} Free, ${paidSlots} Paid Slots
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Delivery Charges Grid -->
                    <div class="delivery-charges-grid mt-3">
                        ${Object.entries(pincode.delivery_charge)
                          .map(
                            ([slot, info]) => `
                            <div class="charge-item ${info.charges === 0 ? "charge-free" : "charge-paid"}">
                                <div>Slot ${slot}</div>
                                <div>${info.charges === 0 ? "Free" : "₹" + info.charges}</div>
                                <div><small>${info.available ? "Available" : "Unavailable"}</small></div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
                
                <div class="collapse orders-container" id="pincode-${pincode.pincode}">
                    ${
                      pincode.orders.length === 0
                        ? `
                        <div class="empty-orders">
                            <i class="fas fa-inbox fa-2x mb-2"></i>
                            <p>No orders for this pincode</p>
                        </div>
                    `
                        : pincode.orders
                            .map(
                              (order) => `
                        <div class="order-row">
                            <div class="row align-items-center">
                                <div class="col-md-2">
                                    <strong>#${order.order_id}</strong>
                                    <br><small class="text-muted">${order.order_date}</small>
                                </div>
                                <div class="col-md-2">
                                    <strong>${order.first_name} ${order.last_name}</strong>
                                    <br><small class="text-muted">ID: ${order.user_id}</small>
                                </div>
                                <div class="col-md-2">
                                    <span class="timeslot-badge">${order.timeslot_time}</span>
                                    <br><small class="text-muted">Delivery: ${order.delivery_date}</small>
                                </div>
                                <div class="col-md-3">
                                    <div class="order-items-preview">
                                        ${
                                          order.order_items.length === 0
                                            ? '<span class="text-muted">No items</span>'
                                            : order.order_items
                                                .map(
                                                  (item) => `
                                                <span class="item-badge">
                                                    ${item.quantity}x ${item.title} (${item.weight_variation}) - ₹${item.price}
                                                </span>
                                            `,
                                                )
                                                .join("")
                                        }
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <strong>₹${order.order_items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</strong>
                                </div>
                                <div class="col-md-1">
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails('${order.order_id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="/admin-order-detail/?order_id=${order.order_id}">
                                                <i class="fas fa-external-link-alt me-2"></i>Full Details
                                            </a></li>
                                            <li><a class="dropdown-item" href="#" onclick="printOrder('${order.order_id}')">
                                                <i class="fas fa-print me-2"></i>Print KOT
                                            </a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                            )
                            .join("")
                    }
                </div>
            </div>
        `
    })
    .join("")

  // Add collapse event listeners
  document.querySelectorAll('[data-bs-toggle="collapse"]').forEach((element) => {
    element.addEventListener("click", function () {
      const icon = this.querySelector(".collapse-toggle")
      setTimeout(() => {
        const target = document.querySelector(this.getAttribute("data-bs-target"))
        if (target.classList.contains("show")) {
          icon.style.transform = "rotate(0deg)"
        } else {
          icon.style.transform = "rotate(-90deg)"
        }
      }, 10)
    })
  })
}

// Update statistics
function updateStats() {
  const totalPincodes = pincodeData.length
  const totalOrders = pincodeData.reduce((sum, pincode) => sum + pincode.orders.length, 0)
  const activeAreas = pincodeData.filter((pincode) => pincode.orders.length > 0).length

  // Calculate today's orders
  const today = new Date().toLocaleDateString("en-GB")
  const todayOrders = pincodeData.reduce((sum, pincode) => {
    return sum + pincode.orders.filter((order) => order.delivery_date === today).length
  }, 0)

  document.getElementById("totalPincodes").textContent = totalPincodes
  document.getElementById("totalOrders").textContent = totalOrders
  document.getElementById("activeAreas").textContent = activeAreas
  document.getElementById("todayOrders").textContent = todayOrders
}

// Populate filter dropdowns
function populateFilterDropdowns() {
  const cities = [...new Set(pincodeData.map((p) => p.city))]
  const areas = [...new Set(pincodeData.map((p) => p.area_name))]

  const cityFilter = document.getElementById("cityFilter")
  const areaFilter = document.getElementById("areaFilter")

  cityFilter.innerHTML =
    '<option value="">All Cities</option>' + cities.map((city) => `<option value="${city}">${city}</option>`).join("")

  areaFilter.innerHTML =
    '<option value="">All Areas</option>' + areas.map((area) => `<option value="${area}">${area}</option>`).join("")
}

// Apply filters
function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase()
  const city = document.getElementById("cityFilter").value
  const area = document.getElementById("areaFilter").value
  const date = document.getElementById("dateFilter").value
  const timeslot = document.getElementById("timeslotFilter").value
  const showEmpty = document.getElementById("showEmptyPincodes").checked

  filteredData = pincodeData.filter((pincode) => {
    // Search filter
    if (
      search &&
      !pincode.pincode.toString().includes(search) &&
      !pincode.area_name.toLowerCase().includes(search) &&
      !pincode.city.toLowerCase().includes(search)
    ) {
      return false
    }

    // City filter
    if (city && pincode.city !== city) {
      return false
    }

    // Area filter
    if (area && pincode.area_name !== area) {
      return false
    }

    // Show empty pincodes filter
    if (!showEmpty && pincode.orders.length === 0) {
      return false
    }

    // Filter orders within pincode
    if (date || timeslot) {
      pincode.orders = pincode.orders.filter((order) => {
        if (date) {
          const orderDate = order.delivery_date.split("-").reverse().join("-")
          if (orderDate !== date) return false
        }

        if (timeslot && !order.timeslot_time.toLowerCase().includes(timeslot.toLowerCase())) {
          return false
        }

        return true
      })
    }

    return true
  })

  renderPincodeOrders()
}

// Clear all filters
function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("cityFilter").value = ""
  document.getElementById("areaFilter").value = ""
  document.getElementById("dateFilter").value = ""
  document.getElementById("timeslotFilter").value = ""
  document.getElementById("showEmptyPincodes").checked = true

  filteredData = [...pincodeData]
  renderPincodeOrders()
}

// View order details in modal
async function viewOrderDetails(orderId) {
  try {
    // Find order in data
    let orderDetails = null
    for (const pincode of pincodeData) {
      const order = pincode.orders.find((o) => o.order_id === orderId)
      if (order) {
        orderDetails = { ...order, pincode: pincode.pincode, area: pincode.area_name }
        break
      }
    }

    if (!orderDetails) {
      showToast("Order not found", "error")
      return
    }

    const modalBody = document.getElementById("orderDetailsBody")
    modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Order Information</h6>
                    <p><strong>Order ID:</strong> ${orderDetails.order_id}</p>
                    <p><strong>Customer:</strong> ${orderDetails.first_name} ${orderDetails.last_name}</p>
                    <p><strong>User ID:</strong> ${orderDetails.user_id}</p>
                    <p><strong>Order Date:</strong> ${orderDetails.order_date}</p>
                </div>
                <div class="col-md-6">
                    <h6>Delivery Information</h6>
                    <p><strong>Pincode:</strong> ${orderDetails.pincode} (${orderDetails.area})</p>
                    <p><strong>Delivery Date:</strong> ${orderDetails.delivery_date}</p>
                    <p><strong>Timeslot:</strong> ${orderDetails.timeslot_time}</p>
                </div>
            </div>
            <hr>
            <h6>Order Items</h6>
            ${
              orderDetails.order_items.length === 0
                ? '<p class="text-muted">No items in this order</p>'
                : `<div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Variation</th>
                                <th>Quantity</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderDetails.order_items
                              .map(
                                (item) => `
                                <tr>
                                    <td>${item.title}</td>
                                    <td>${item.weight_variation}</td>
                                    <td>${item.quantity}</td>
                                    <td>₹${item.price.toFixed(2)}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>`
            }
            <div class="mt-3">
                <strong>Total: ₹${orderDetails.order_items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</strong>
            </div>
        `

    document.getElementById("viewFullOrderBtn").onclick = () => {
      window.open(`/admin-order-detail/?order_id=${orderId}`, "_blank")
    }

    const modal = new bootstrap.Modal(document.getElementById("orderDetailsModal"))
    modal.show()
  } catch (error) {
    console.error("Error viewing order details:", error)
    showToast("Error loading order details", "error")
  }
}

// Print order KOT
function printOrder(orderId) {
  // This would integrate with your existing KOT printing functionality
  showToast("KOT printing functionality to be implemented", "info")
}

// Export data
function exportData(format) {
  const exportData = filteredData.map((pincode) => ({
    pincode: pincode.pincode,
    area: pincode.area_name,
    city: pincode.city,
    state: pincode.state,
    orders_count: pincode.orders.length,
    total_revenue: pincode.orders.reduce(
      (sum, order) => sum + order.order_items.reduce((itemSum, item) => itemSum + item.price, 0),
      0,
    ),
  }))

  if (format === "csv") {
    downloadCSV(exportData, "pincode_orders.csv")
  } else if (format === "excel") {
    // Excel export would require additional library
    showToast("Excel export to be implemented", "info")
  }
}

// Download CSV
function downloadCSV(data, filename) {
  const headers = ["Pincode", "Area", "City", "State", "Orders Count", "Total Revenue"]
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      [row.pincode, row.area, row.city, row.state, row.orders_count, row.total_revenue.toFixed(2)].join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

// Initialize event listeners
function initializeEventListeners() {
  // Filter event listeners
  document.getElementById("searchInput").addEventListener("input", applyFilters)
  document.getElementById("cityFilter").addEventListener("change", applyFilters)
  document.getElementById("areaFilter").addEventListener("change", applyFilters)
  document.getElementById("dateFilter").addEventListener("change", applyFilters)
  document.getElementById("timeslotFilter").addEventListener("change", applyFilters)
  document.getElementById("showEmptyPincodes").addEventListener("change", applyFilters)

  // Button event listeners
  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters)
  document.getElementById("refreshBtn").addEventListener("click", loadPincodeOrders)
  document.getElementById("exportCsvBtn").addEventListener("click", () => exportData("csv"))
  document.getElementById("exportExcelBtn").addEventListener("click", () => exportData("excel"))
}

// Utility functions
function showLoading() {
  document.getElementById("loadingSpinner").style.display = "block"
}

function hideLoading() {
  document.getElementById("loadingSpinner").style.display = "none"
}

function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer")
  const toastId = "toast-" + Date.now()

  const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type === "error" ? "danger" : type === "success" ? "success" : "primary"} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `

  toastContainer.insertAdjacentHTML("beforeend", toastHtml)
  const toastElement = document.getElementById(toastId)
  const toast = new bootstrap.Toast(toastElement)
  toast.show()

  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove()
  })
}
