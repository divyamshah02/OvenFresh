let csrf_token = null
let orders_list_url = null
let order_detail_url = null
let bulk_update_url = null
let timeslots_url = null
let export_orders_url = null
let confirmed = null
// let flatpickr = null // Declare flatpickr
// let bootstrap = null // Declare bootstrap

// Data storage
let ordersData = []
let timeslotsData = []
const selectedOrders = new Set()
let currentPage = 1
let totalPages = 1
let perPage = 10
let totalOrders = 0

// Filter state
let filters = {
  search: "",
  dateRange: {
    start: null,
    end: null,
  },
  status: "",
  paymentStatus: "",
  paymentMethod: "",
  deliveryDate: null,
  timeslot: "",
  sortBy: "created_desc",
}

// Current order being viewed in quick view
let currentQuickViewOrderId = null

function AdminAllOrders(
  csrfTokenParam,
  ordersListUrlParam,
  orderDetailUrlParam,
  bulkUpdateUrlParam,
  timeslotsUrlParam,
  exportUrlParam,
  confirmedParam=null,
) {
  csrf_token = csrfTokenParam
  orders_list_url = ordersListUrlParam
  order_detail_url = orderDetailUrlParam
  bulk_update_url = bulkUpdateUrlParam
  timeslots_url = timeslotsUrlParam
  export_orders_url = exportUrlParam
  confirmed = confirmedParam

  // Initialize the page
  document.addEventListener("DOMContentLoaded", async () => {
    initializeDatePickers()
    initializeEventListeners()
    await loadTimeslots()
    await loadOrders()
    await applyFiltersFromQueryParams()
  })
}

function initializeDatePickers() {
  // Initialize date range picker
  flatpickr("#dateRangeFilter", {
    mode: "range",
    dateFormat: "Y-m-d",
    onChange: (selectedDates, dateStr) => {
      if (selectedDates.length === 2) {
        filters.dateRange.start = selectedDates[0].toISOString().split("T")[0]
        filters.dateRange.end = selectedDates[1].toISOString().split("T")[0]
      } else {
        filters.dateRange.start = null
        filters.dateRange.end = null
      }
    },
  })

  // Initialize delivery date picker
  flatpickr("#deliveryDateFilter", {
    dateFormat: "Y-m-d",
    onChange: (selectedDates, dateStr) => {
      filters.deliveryDate = dateStr || null
    },
  })
}

function initializeEventListeners() {
  // Search button click
  document.getElementById("searchBtn").addEventListener("click", () => {
    filters.search = document.getElementById("searchInput").value.trim()
    currentPage = 1
    loadOrders()
  })

  // Search input enter key
  document.getElementById("searchInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      filters.search = this.value.trim()
      currentPage = 1
      loadOrders()
    }
  })

  // Status filter change
  document.getElementById("statusFilter").addEventListener("change", function () {
    filters.status = this.value
    currentPage = 1
    loadOrders()
  })

  // Payment status filter change
  document.getElementById("paymentFilter").addEventListener("change", function () {
    filters.paymentStatus = this.value
    currentPage = 1
    loadOrders()
  })

  // Payment method filter change
  document.getElementById("paymentMethodFilter").addEventListener("change", function () {
    filters.paymentMethod = this.value
    currentPage = 1
    loadOrders()
  })

  // Timeslot filter change
  document.getElementById("timeslotFilter").addEventListener("change", function () {
    filters.timeslot = this.value
    currentPage = 1
    loadOrders()
  })

  // Sort by change
  document.getElementById("sortBy").addEventListener("change", function () {
    filters.sortBy = this.value
    currentPage = 1
    loadOrders()
  })

  // Per page change
  document.getElementById("perPage").addEventListener("change", function () {
    perPage = Number.parseInt(this.value)
    currentPage = 1
    loadOrders()
  })

  // Clear filters button
  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters)

  // Refresh button
  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadOrders()
  })

  // Select all checkbox
  document.getElementById("selectAll").addEventListener("change", function () {
    const checkboxes = document.querySelectorAll('#ordersTableBody input[type="checkbox"]')
    checkboxes.forEach((checkbox) => {
      checkbox.checked = this.checked
      const orderId = checkbox.getAttribute("data-order-id")
      if (this.checked) {
        selectedOrders.add(orderId)
      } else {
        selectedOrders.delete(orderId)
      }
    })
    updateBulkActionButtons()
  })

  // Export buttons
  document.getElementById("exportCsvBtn").addEventListener("click", () => {
    exportOrders("csv")
  })
  document.getElementById("exportExcelBtn").addEventListener("click", () => {
    exportOrders("excel")
  })
  document.getElementById("exportPdfBtn").addEventListener("click", () => {
    exportOrders("pdf")
  })

  // Bulk action buttons
  document.getElementById("bulkConfirmBtn").addEventListener("click", () => {
    showBulkActionModal("confirm", "Confirm Selected Orders", "Are you sure you want to confirm the selected orders?")
  })
  document.getElementById("bulkPrintKotBtn").addEventListener("click", () => {
    printBulkKOT()
  })
  document.getElementById("bulkCancelBtn").addEventListener("click", () => {
    showBulkActionModal(
      "cancel",
      "Cancel Selected Orders",
      "Are you sure you want to cancel the selected orders? This action cannot be undone.",
    )
  })

  // Confirm bulk action button
  document.getElementById("confirmBulkActionBtn").addEventListener("click", function () {
    const actionType = this.getAttribute("data-action-type")
    executeBulkAction(actionType)
  })

  // View full order button in quick view modal
  document.getElementById("viewFullOrderBtn").addEventListener("click", () => {
    if (currentQuickViewOrderId) {
      window.location.href = `/admin-order-detail/?order_id=${currentQuickViewOrderId}`
    }
  })
}

async function loadTimeslots() {
  try {
    const [success, result] = await callApi("GET", timeslots_url)
    if (success && result.success) {
      timeslotsData = result.data || []
      populateTimeslotsDropdown()
    } else {
      console.error("Error loading timeslots:", result.error)
      showToast("Error loading timeslots", "error")
    }
  } catch (error) {
    console.error("Error loading timeslots:", error)
    showToast("Error loading timeslots", "error")
  }
}

function populateTimeslotsDropdown() {
  const timeslotSelect = document.getElementById("timeslotFilter")

  // Clear existing options except the first one
  while (timeslotSelect.options.length > 1) {
    timeslotSelect.remove(1)
  }

  // Add timeslots to dropdown
  timeslotsData.forEach((timeslot) => {
    const option = document.createElement("option")
    option.value = timeslot.id
    option.textContent = timeslot.time_slot_title
    timeslotSelect.appendChild(option)
  })
}

async function loadOrders() {
  showLoading()

  try {
    // Build query parameters
    const queryParams = new URLSearchParams()
    queryParams.append("page", currentPage)
    queryParams.append("per_page", perPage)

    if (filters.search) queryParams.append("search", filters.search)
    if (filters.status) queryParams.append("status", filters.status)
    if (filters.paymentStatus) queryParams.append("payment_status", filters.paymentStatus)
    if (filters.paymentMethod) queryParams.append("payment_method", filters.paymentMethod)
    if (filters.deliveryDate) queryParams.append("delivery_date", filters.deliveryDate)
    if (filters.timeslot) queryParams.append("timeslot_id", filters.timeslot)
    if (filters.sortBy) queryParams.append("sort_by", filters.sortBy)

    if (filters.dateRange.start && filters.dateRange.end) {
      queryParams.append("date_from", filters.dateRange.start)
      queryParams.append("date_to", filters.dateRange.end)
    }
    console.log("aeghbruogrbeaghuorabhoubohuaebhuogbhuo")
    console.log(confirmed)
    if (confirmed) queryParams.append("confirmed", true)

    const url = `${orders_list_url}?${queryParams.toString()}`
    const [success, result] = await callApi("GET", url)

    if (success && result.success) {
      console.log(result.data.orders)
      ordersData = result.data.orders || []
      totalOrders = result.data.total_count || 0
      totalPages = result.data.total_pages || 1

      // Update stats
      updateOrderStats(result.data.stats || {})

      // Render orders
      renderOrders()

      // Update pagination
      renderPagination()

      hideLoading()
    } else {
      throw new Error(result.error || "Failed to load orders")
    }
  } catch (error) {
    console.error("Error loading orders:", error)
    showToast("Error loading orders", "error")
    hideLoading()
    showEmptyState()
  }
}

function updateOrderStats(stats) {
  document.getElementById("totalOrders").textContent = stats.total_orders || 0
  document.getElementById("todayOrders").textContent = stats.today_orders || 0
  document.getElementById("pendingDelivery").textContent = stats.pending_delivery || 0

  // Format total revenue with rupee symbol and commas
  const totalRevenue = stats.total_revenue || 0
  document.getElementById("totalRevenue").textContent = `₹${formatCurrency(totalRevenue)}`
}

function renderOrders() {
  const tableBody = document.getElementById("ordersTableBody")
  tableBody.innerHTML = ""

  if (ordersData.length === 0) {
    showEmptyState()
    return
  }

  hideEmptyState()
  showOrdersTable()

  ordersData.forEach((order) => {
    const row = document.createElement("tr")
    switch (order.status.toLowerCase()) {
      case "not_placed":
        row.classList.add("status-pending");
        break;
      case "placed":
        row.classList.add("status-placed");
        break;
      case "preparing":
        row.classList.add("status-preparing");
        break;
      case "ready":
        row.classList.add("status-ready");
        break;
      case "out_for_delivery":
        row.classList.add("status-out");
        break;
      case "delivered":
        row.classList.add("status-delivered");
        break;
    }

    // Check if this order is selected
    const isSelected = selectedOrders.has(order.order_id)

    row.innerHTML = `
            <td style="display: none !important;">
                <div class="form-check">
                    <input class="form-check-input order-checkbox" type="checkbox" 
                           data-order-id="${order.order_id}" ${isSelected ? "checked" : ""}>
                </div>
            </td>      
            <td><b>${order.order_number? `#${order.order_number}`: "Not placed"}</b>
            </td>      
            <td>${new Date(order.created_at).toLocaleString("en-IN", {year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"})}</td>
            <td>
                <div class="fw-medium">${order.first_name} - ${order.phone}</div>
                <div class="small">#${order.order_id}</div>
            </td>
            <td>
              ${order.items.map(
                item => `${item.product_title} (${item.weight_variation})`
              ).join("<br>")}
            </td>
            <td>
                <div>${formatDate(order.delivery_date)}</div>
                <div class="small">${order.timeslot_name_time || "No Timeslot"}</div>
            </td>
            <td>
                ${order.delivery_partner_name_number ?
                    `<div class="fw-medium">${order.delivery_partner_name_number}</div>` :
                    `<span class="badge bg-warning text-dark">Not Assigned</span>`
                }
            </td>
            <td>
                <div class="fw-bold">₹${formatCurrency(order.total_amount)}</div>
                <div class="small">${order.items.length} items</div>
            </td>
            <td>
                <span class="badge ${getPaymentStatusBadgeClass(order.payment_received, order.payment_method)}">
                    ${getPaymentStatusText(order.payment_received, order.payment_method)}
                </span>
            </td>
            <td>
                <span class="badge ${getOrderStatusBadgeClass(order.status)}">
                    ${getOrderStatusText(order.status)}
                </span>
            </td>
            <td>
                <a class="dropdown-item" href="/admin-order-detail/?order_id=${order.order_id}">
                    <i class="fas fa-eye me-2"></i>
                </a>
            </td>
        `;

      //   <div class="dropdown">
      //     <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
      //         Actions
      //     </button>
      //     <ul class="dropdown-menu dropdown-menu-end">
      //         <li><a class="dropdown-item" href="#" onclick="viewOrderQuick('${order.order_id}')">
      //             <i class="fas fa-eye me-2"></i>Quick View
      //         </a></li>
      //         <li><a class="dropdown-item" href="/admin-order-detail/?order_id=${order.order_id}">
      //             <i class="fas fa-edit me-2"></i>View Details
      //         </a></li>
      //         <li><hr class="dropdown-divider"></li>
      //         <li><a class="dropdown-item" href="#" onclick="printOrderKOT('${order.order_id}')">
      //             <i class="fas fa-print me-2"></i>Print KOT
      //         </a></li>
      //         ${
      //           order.status !== "delivered" && order.status !== "cancelled"
      //             ? `
      //         <li><a class="dropdown-item" href="#" onclick="updateOrderStatus('${order.order_id}', 'delivered')">
      //             <i class="fas fa-check-circle me-2"></i>Mark as Delivered
      //         </a></li>`
      //             : ""
      //         }
      //         ${
      //           order.status !== "cancelled"
      //             ? `
      //         <li><a class="dropdown-item text-danger" href="#" onclick="updateOrderStatus('${order.order_id}', 'cancelled')">
      //             <i class="fas fa-times-circle me-2"></i>Cancel Order
      //         </a></li>`
      //             : ""
      //         }
      //     </ul>
      // </div>
    tableBody.appendChild(row)
  })

  // Add event listeners to checkboxes
  document.querySelectorAll(".order-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const orderId = this.getAttribute("data-order-id")
      if (this.checked) {
        selectedOrders.add(orderId)
      } else {
        selectedOrders.delete(orderId)
      }
      updateBulkActionButtons()
    })
  })

  // Update pagination info
  const start = (currentPage - 1) * perPage + 1
  const end = Math.min(start + ordersData.length - 1, totalOrders)
  document.getElementById("paginationInfo").textContent = `Showing ${start} to ${end} of ${totalOrders} entries`
}

function renderPagination() {
  const pagination = document.getElementById("pagination")
  pagination.innerHTML = ""

  // Previous button
  const prevLi = document.createElement("li")
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`
  prevLi.innerHTML = `<a class="page-link" href="#" ${currentPage !== 1 ? 'onclick="goToPage(' + (currentPage - 1) + '); return false;"' : ""}>Previous</a>`
  pagination.appendChild(prevLi)

  // Page numbers
  const maxPages = 5
  const startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
  const endPage = Math.min(totalPages, startPage + maxPages - 1)

  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement("li")
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`
    pageLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>`
    pagination.appendChild(pageLi)
  }

  // Next button
  const nextLi = document.createElement("li")
  nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`
  nextLi.innerHTML = `<a class="page-link" href="#" ${currentPage !== totalPages ? 'onclick="goToPage(' + (currentPage + 1) + '); return false;"' : ""}>Next</a>`
  pagination.appendChild(nextLi)

  // Show pagination container
  document.getElementById("paginationContainer").style.display = "flex"
}

function goToPage(page) {
  currentPage = page
  loadOrders()
}

function clearFilters() {
  // Reset all filters
  filters = {
    search: "",
    dateRange: {
      start: null,
      end: null,
    },
    status: "",
    paymentStatus: "",
    paymentMethod: "",
    deliveryDate: null,
    timeslot: "",
    sortBy: "created_desc",
  }

  // Reset form elements
  document.getElementById("searchInput").value = ""
  document.getElementById("dateRangeFilter").value = ""
  document.getElementById("statusFilter").value = ""
  document.getElementById("paymentFilter").value = ""
  document.getElementById("paymentMethodFilter").value = ""
  document.getElementById("deliveryDateFilter").value = ""
  document.getElementById("timeslotFilter").value = ""
  document.getElementById("sortBy").value = "created_desc"

  // Reset flatpickr instances
  const dateRangePicker = document.getElementById("dateRangeFilter")._flatpickr
  if (dateRangePicker) dateRangePicker.clear()

  const deliveryDatePicker = document.getElementById("deliveryDateFilter")._flatpickr
  if (deliveryDatePicker) deliveryDatePicker.clear()

  // Reload orders
  currentPage = 1
  loadOrders()
}

async function viewOrderQuick(orderId) {
  currentQuickViewOrderId = orderId

  // Show modal with loading state
  const modal = new bootstrap.Modal(document.getElementById("orderQuickViewModal"))
  modal.show()

  document.getElementById("quickViewBody").innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading order details...</p>
        </div>
    `

  try {
    const [success, result] = await callApi("GET", `${order_detail_url}?order_id=${orderId}`)

    if (success && result.success) {
      const order = result.data
      document.getElementById("quickViewTitle").textContent = `Order #${order.order_id}`

      // Populate quick view content
      document.getElementById("quickViewBody").innerHTML = `
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6 class="mb-2">Customer Information</h6>
                        <p class="mb-1"><strong>${order.first_name} ${order.last_name}</strong></p>
                        <p class="mb-1"><i class="fas fa-envelope me-2"></i>${order.email}</p>
                        <p class="mb-0"><i class="fas fa-phone me-2"></i>${order.phone}</p>
                    </div>
                    <div class="col-md-6">
                        <h6 class="mb-2">Order Information</h6>
                        <p class="mb-1"><strong>Date:</strong> ${new Date(order.created_at).toLocaleString("en-IN", {year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"})}</p>
                        <p class="mb-1"><strong>Status:</strong> <span class="badge ${getOrderStatusBadgeClass(order.status)}">${getOrderStatusText(order.status)}</span></p>
                        <p class="mb-0"><strong>Payment:</strong> <span class="badge ${getPaymentStatusBadgeClass(order.payment_received, order.payment_method)}">${getPaymentStatusText(order.payment_received, order.payment_method)}</span></p>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6 class="mb-2">Delivery Information</h6>
                        <p class="mb-1"><strong>Date:</strong> ${formatDate(order.delivery_date)}</p>
                        <p class="mb-1"><strong>Time:</strong> ${order.timeslot_name || "Not specified"}</p>
                        <p class="mb-0"><strong>Address:</strong> ${order.delivery_address}</p>
                    </div>
                    <div class="col-md-6">
                        <h6 class="mb-2">Order Summary</h6>
                        <p class="mb-1"><strong>Subtotal:</strong> ₹${formatCurrency(order.subtotal)}</p>
                        <p class="mb-1"><strong>Delivery:</strong> ₹${formatCurrency(order.delivery_charge)}</p>
                        <p class="mb-1"><strong>Tax:</strong> ₹${formatCurrency(order.tax_amount)}</p>
                        <p class="mb-0"><strong>Total:</strong> ₹${formatCurrency(order.total_amount)}</p>
                    </div>
                </div>
                
                <h6 class="mb-3">Order Items</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Variation</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.order_items
                              .map(
                                (item) => `
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <img src="${item.product_image}" alt="${item.product_name}" 
                                                class="me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                                            <div>${item.product_name}</div>
                                        </div>
                                    </td>
                                    <td>${item.variation_name || "Standard"}</td>
                                    <td>${item.quantity}</td>
                                    <td>₹${formatCurrency(item.amount)}</td>
                                    <td>₹${formatCurrency(item.final_amount)}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
                
                ${
                  order.special_instructions
                    ? `
                <div class="mt-3">
                    <h6 class="mb-2">Special Instructions</h6>
                    <p class="mb-0">${order.special_instructions}</p>
                </div>
                `
                    : ""
                }
            `
    } else {
      throw new Error(result.error || "Failed to load order details")
    }
  } catch (error) {
    console.error("Error loading order details:", error)
    document.getElementById("quickViewBody").innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error loading order details. Please try again.
            </div>
        `
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const confirmMessage =
      newStatus === "cancelled"
        ? "Are you sure you want to cancel this order? This action cannot be undone."
        : `Are you sure you want to mark this order as ${getOrderStatusText(newStatus)}?`

    if (!confirm(confirmMessage)) {
      return
    }

    const [success, result] = await callApi(
      "POST",
      `${order_detail_url}/update-status/`,
      {
        order_id: orderId,
        status: newStatus,
        notes: "",
      },
      csrf_token,
    )

    if (success && result.success) {
      showToast(`Order status updated to ${getOrderStatusText(newStatus)}`, "success")
      loadOrders() // Refresh the orders list
    } else {
      throw new Error(result.error || "Failed to update order status")
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    showToast("Error updating order status", "error")
  }
}

function printOrderKOT(orderId) {
  // In a real implementation, this would fetch the KOT data and print it
  // For now, we'll just show a message
  showToast("Printing KOT for order " + orderId, "info")

  // Redirect to the order detail page with a print parameter
  window.open(`/admin-order-detail/?order_id=${orderId}&print_kot=true`, "_blank")
}

function printBulkKOT() {
  if (selectedOrders.size === 0) {
    showToast("No orders selected", "warning")
    return
  }

  // In a real implementation, this would fetch all KOTs and print them
  showToast(`Printing KOT for ${selectedOrders.size} orders`, "info")

  // Open a new window with all selected order IDs
  const orderIds = Array.from(selectedOrders).join(",")
  window.open(`/admin/print-kot/?order_ids=${orderIds}`, "_blank")
}

function showBulkActionModal(actionType, title, message) {
  if (selectedOrders.size === 0) {
    showToast("No orders selected", "warning")
    return
  }

  const modal = document.getElementById("bulkActionModal")
  const modalTitle = document.getElementById("bulkActionTitle")
  const modalMessage = document.getElementById("bulkActionMessage")
  const selectedOrdersCount = document.getElementById("selectedOrdersCount")
  const selectedOrdersList = document.getElementById("selectedOrdersList")
  const confirmButton = document.getElementById("confirmBulkActionBtn")

  modalTitle.textContent = title
  modalMessage.textContent = message
  selectedOrdersCount.textContent = selectedOrders.size

  // Set the action type on the confirm button
  confirmButton.setAttribute("data-action-type", actionType)

  // Style the confirm button based on action type
  if (actionType === "cancel") {
    confirmButton.className = "btn btn-danger"
    confirmButton.innerHTML = '<i class="fas fa-times me-1"></i> Cancel Orders'
  } else {
    confirmButton.className = "btn btn-primary"
    confirmButton.innerHTML = '<i class="fas fa-check me-1"></i> Confirm'
  }

  // Populate selected orders list
  selectedOrdersList.innerHTML = ""
  const selectedOrdersArray = Array.from(selectedOrders)

  // Only show up to 5 orders to avoid modal being too large
  const displayCount = Math.min(selectedOrdersArray.length, 5)

  for (let i = 0; i < displayCount; i++) {
    const orderId = selectedOrdersArray[i]
    const order = ordersData.find((o) => o.order_id === orderId)

    if (order) {
      const listItem = document.createElement("div")
      listItem.className = "mb-2 p-2 border rounded"
      listItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${order.order_id}</strong> - ${order.first_name} ${order.last_name}
                    </div>
                    <span class="badge ${getOrderStatusBadgeClass(order.status)}">
                        ${getOrderStatusText(order.status)}
                    </span>
                </div>
            `
      selectedOrdersList.appendChild(listItem)
    }
  }

  // If there are more orders than we're displaying, add a message
  if (selectedOrdersArray.length > displayCount) {
    const moreMessage = document.createElement("div")
    moreMessage.className = "text-center mt-2"
    moreMessage.textContent = `And ${selectedOrdersArray.length - displayCount} more orders...`
    selectedOrdersList.appendChild(moreMessage)
  }

  // Show the modal
  const bsModal = new bootstrap.Modal(modal)
  bsModal.show()
}

async function executeBulkAction(actionType) {
  if (selectedOrders.size === 0) {
    showToast("No orders selected", "warning")
    return
  }

  try {
    const orderIds = Array.from(selectedOrders)

    const [success, result] = await callApi(
      "POST",
      bulk_update_url,
      {
        order_ids: orderIds,
        action: actionType,
        notes: "",
      },
      csrf_token,
    )

    if (success && result.success) {
      // Close the modal
      bootstrap.Modal.getInstance(document.getElementById("bulkActionModal")).hide()

      // Show success message
      const actionText = actionType === "cancel" ? "cancelled" : "updated"
      showToast(`${selectedOrders.size} orders ${actionText} successfully`, "success")

      // Clear selected orders
      selectedOrders.clear()

      // Refresh the orders list
      loadOrders()
    } else {
      throw new Error(result.error || `Failed to ${actionType} orders`)
    }
  } catch (error) {
    console.error(`Error executing bulk action ${actionType}:`, error)
    showToast(`Error executing bulk action: ${error.message}`, "error")
  }
}

function exportOrders(format) {
  // Build export URL with current filters
  const queryParams = new URLSearchParams()

  if (filters.search) queryParams.append("search", filters.search)
  if (filters.status) queryParams.append("status", filters.status)
  if (filters.paymentStatus) queryParams.append("payment_status", filters.paymentStatus)
  if (filters.paymentMethod) queryParams.append("payment_method", filters.paymentMethod)
  if (filters.deliveryDate) queryParams.append("delivery_date", filters.deliveryDate)
  if (filters.timeslot) queryParams.append("timeslot_id", filters.timeslot)

  if (filters.dateRange.start && filters.dateRange.end) {
    queryParams.append("date_from", filters.dateRange.start)
    queryParams.append("date_to", filters.dateRange.end)
  }

  queryParams.append("format", format)
  queryParams.append("export", "true")

  // If there are selected orders, only export those
  if (selectedOrders.size > 0) {
    const orderIds = Array.from(selectedOrders).join(",")
    queryParams.append("order_ids", orderIds)
  }

  const exportUrl = `${export_orders_url}?${queryParams.toString()}`

  // Open in new tab/download
  window.open(exportUrl, "_blank")
}

function updateBulkActionButtons() {
  const hasSelectedOrders = selectedOrders.size > 0
  const bulkActionBtn = document.getElementById("bulkActionBtn")
  const bulkActionDropdownBtn = bulkActionBtn.nextElementSibling

  bulkActionBtn.disabled = !hasSelectedOrders
  bulkActionDropdownBtn.disabled = !hasSelectedOrders

  if (hasSelectedOrders) {
    bulkActionBtn.textContent = `${selectedOrders.size} Selected`
  } else {
    bulkActionBtn.innerHTML = '<i class="fas fa-tasks me-1"></i> Bulk Actions'
  }
}

// Helper functions
function formatDate(dateString, includeTime = false) {
  if (!dateString) return "N/A"

  const date = new Date(dateString)
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }

  if (includeTime) {
    options.hour = "2-digit"
    options.minute = "2-digit"
  }

  return date.toLocaleDateString("en-US", options)
}

function formatCurrency(amount) {
  if (!amount) return "0.00"

  // Convert to number if it's a string
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount

  // Format with commas and 2 decimal places
  return numAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getInitials(firstName, lastName) {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : ""
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : ""
  return `${firstInitial}${lastInitial}`
}

function getOrderStatusBadgeClass(status) {
  const statusClasses = {
    placed: "bg-info",
    confirmed: "bg-primary",
    preparing: "bg-warning",
    ready: "bg-info",
    out_for_delivery: "bg-primary",
    delivered: "bg-success",
    cancelled: "bg-danger",
  }

  return statusClasses[status] || "bg-secondary"
}

function getOrderStatusText(status) {
  const statusTexts = {
    placed: "Placed",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  }

  return statusTexts[status] || status
}

function getPaymentStatusBadgeClass(paymentReceived, paymentMethod) {
  if (paymentReceived) {
    return "bg-success"
  } else if (paymentMethod === "cod") {
    return "bg-warning"
  } else {
    return "bg-danger"
  }
}

function getPaymentStatusText(paymentReceived, paymentMethod) {
  if (paymentReceived) {
    return "Paid"
  } else if (paymentMethod === "cod") {
    return "COD"
  } else {
    return "Pending"
  }
}

function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer")

  const toast = document.createElement("div")
  toast.className = `toast align-items-center border-0 show`
  toast.setAttribute("role", "alert")
  toast.setAttribute("aria-live", "assertive")
  toast.setAttribute("aria-atomic", "true")

  // Set background color based on type
  const bgClass =
    type === "error" ? "bg-danger" : type === "success" ? "bg-success" : type === "warning" ? "bg-warning" : "bg-info"

  toast.classList.add(bgClass, "text-white")

  toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `

  toastContainer.appendChild(toast)

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => {
      toast.remove()
    }, 500)
  }, 5000)
}

function showLoading() {
  document.getElementById("loadingSpinner").style.display = "block"
  document.getElementById("ordersTableContainer").style.display = "none"
  document.getElementById("emptyState").style.display = "none"
}

function hideLoading() {
  document.getElementById("loadingSpinner").style.display = "none"
}

function showOrdersTable() {
  document.getElementById("ordersTableContainer").style.display = "block"
  document.getElementById("paginationContainer").style.display = "flex"
}

function showEmptyState() {
  document.getElementById("ordersTableContainer").style.display = "none"
  document.getElementById("paginationContainer").style.display = "none"
  document.getElementById("emptyState").style.display = "block"
}

function hideEmptyState() {
  document.getElementById("emptyState").style.display = "none"
}


async function applyFiltersFromQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);

    const filterMap = {
        'search': ['searchInput', 'search'],                      // [elementId, filters.key]
        'status': ['statusFilter', 'status'],
        'payment': ['paymentFilter', 'paymentStatus'],
        'payment_method': ['paymentMethodFilter', 'paymentMethod'],
        'delivery_date': ['deliveryDateFilter', 'deliveryDate'],
        'timeslot': ['timeslotFilter', 'timeslot'],
        'sort_by': ['sortBy', 'sortBy']
    };

    let filterApplied = false;

    for (const [paramKey, [elementId, filterKey]] of Object.entries(filterMap)) {
        if (urlParams.has(paramKey)) {
            const value = urlParams.get(paramKey);

            // Set element value
            const element = document.getElementById(elementId);
            if (element) {
                element.value = value;
            }

            // Set filter object value
            if (filters && typeof filters === 'object') {
                filters[filterKey] = value;
            }

            filterApplied = true;
        }
    }

    // Trigger the search button
    if (filterApplied) {
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
          await loadOrders()
            // searchBtn.click();
        }
    }
}
