let csrf_token = null
let order_id = null
let order_detail_url = null
let delivery_persons_url = null
let update_order_status_url = null
let assign_delivery_person_url = null

// Data storage
let orderData = null
let deliveryPersons = []
let selectedDeliveryPerson = null

async function InitializeAdminOrderDetail(
  csrfTokenParam,
  orderIdParam,
  orderDetailUrlParam,
  deliveryPersonsUrlParam,
  updateOrderStatusUrlParam,
  assignDeliveryPersonUrlParam,
) {
  csrf_token = csrfTokenParam
  order_id = orderIdParam
  order_detail_url = orderDetailUrlParam
  delivery_persons_url = deliveryPersonsUrlParam
  update_order_status_url = updateOrderStatusUrlParam
  assign_delivery_person_url = assignDeliveryPersonUrlParam

  try {
    showLoading()

    // Load order details
    await loadOrderDetails()

    // Load delivery persons
    await loadDeliveryPersons()

    // Initialize event listeners
    initializeEventListeners()

    hideLoading()
  } catch (error) {
    console.error("Error initializing admin order detail:", error)
    showNotification("Error loading order details.", "error")
    hideLoading()
  }
}

async function loadOrderDetails() {
  try {
    console.log(`${order_detail_url}?order_id=${order_id}`)
    const [success, result] = await callApi("GET", `${order_detail_url}?order_id=${order_id}`)
    console.log("Order details loaded successfully:", result)
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

  // Update page title and breadcrumb
  document.getElementById("order-title").textContent = `Order #${orderData.order_id}`
  document.getElementById("breadcrumb-order-id").textContent = `Order #${orderData.order_id}`
  document.getElementById("order-date").textContent = `Placed on ${formatDate(orderData.created_at)}`

  // Update order status
  updateOrderStatusBadge(orderData.status)
  document.getElementById("status-select").value = orderData.status

  // Populate customer information
  populateCustomerInfo()

  // Populate payment information
  populatePaymentInfo()

  // Populate delivery information
  populateDeliveryInfo()

  // Populate order summary
  populateOrderSummary()

  // Populate order items
  populateOrderItems()

  // Populate order timeline
  populateOrderTimeline()

  // Populate special instructions
  populateSpecialInstructions()
}

function populateCustomerInfo() {
  const customerInfo = document.getElementById("customer-info")
  customerInfo.innerHTML = `
        <p class="mb-1"><strong>${orderData.first_name} ${orderData.last_name}</strong></p>
        <p class="mb-1"><i class="fas fa-envelope me-2"></i>${orderData.email}</p>
        <p class="mb-0"><i class="fas fa-phone me-2"></i>${orderData.phone}</p>
    `
}

function populatePaymentInfo() {
  const paymentInfo = document.getElementById("payment-info")
  const paymentStatus = orderData.payment_received ? "Paid" : "Pending"
  const paymentClass = orderData.payment_received ? "success" : "warning"

  paymentInfo.innerHTML = `
        <p class="mb-1"><strong>Method:</strong> ${orderData.payment_method.toUpperCase()}</p>
        <p class="mb-1"><strong>Status:</strong> <span class="badge bg-${paymentClass}">${paymentStatus}</span></p>
        <p class="mb-0"><strong>Amount:</strong> ₹${Number.parseFloat(orderData.total_amount).toFixed(2)}</p>
        ${orderData.payment_id ? `<p class="mb-0"><small>ID: ${orderData.payment_id}</small></p>` : ""}
    `
}

function populateDeliveryInfo() {
  const deliveryInfo = document.getElementById("delivery-info")
  deliveryInfo.innerHTML = `
        <p class="mb-1"><strong>Date:</strong> ${formatDate(orderData.delivery_date)}</p>
        <p class="mb-1"><strong>Time:</strong> ${orderData.timeslot_name || "Not specified"}</p>
        <p class="mb-0"><strong>Address:</strong></p>
        <small>${orderData.delivery_address}</small>
        ${
          orderData.assigned_delivery_partner_name
            ? `<p class="mt-2 mb-0"><strong>Assigned to:</strong> ${orderData.assigned_delivery_partner_name}</p>`
            : '<p class="mt-2 mb-0 text-warning"><strong>No delivery person assigned</strong></p>'
        }
    `
}

function populateOrderSummary() {
  const orderSummary = document.getElementById("order-summary")
  orderSummary.innerHTML = `
        <p class="mb-1"><strong>Subtotal:</strong> ₹${orderData.subtotal.toFixed(2)}</p>
        <p class="mb-1"><strong>Delivery:</strong> ₹${orderData.delivery_charge.toFixed(2)}</p>
        <p class="mb-1"><strong>Tax:</strong> ₹${orderData.tax_amount.toFixed(2)}</p>
        <hr class="my-2">
        <p class="mb-0"><strong>Total:</strong> ₹${Number.parseFloat(orderData.total_amount).toFixed(2)}</p>
    `
}

function populateOrderItems() {
  const tbody = document.getElementById("order-items-tbody")
  tbody.innerHTML = orderData.order_items
    .map(
      (item) => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.product_image}" alt="${item.product_name}" 
                         class="me-3" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                    <div>
                        <strong>${item.product_name}</strong>
                    </div>
                </div>
            </td>
            <td>${item.variation_name || "Standard"}</td>
            <td><span class="badge bg-primary">${item.quantity}</span></td>
            <td>₹${Number.parseFloat(item.amount).toFixed(2)}</td>
            <td>₹${Number.parseFloat(item.discount).toFixed(2)}</td>
            <td><strong>₹${Number.parseFloat(item.final_amount).toFixed(2)}</strong></td>
            <td>${item.item_note || "-"}</td>
        </tr>
    `,
    )
    .join("")
}

function populateOrderTimeline() {
  const timeline = document.getElementById("order-timeline")
  const statuses = [
    { key: "placed", label: "Order Placed", icon: "fas fa-shopping-cart" },
    { key: "confirmed", label: "Order Confirmed", icon: "fas fa-check-circle" },
    { key: "preparing", label: "Preparing", icon: "fas fa-utensils" },
    { key: "ready", label: "Ready for Delivery", icon: "fas fa-box" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: "fas fa-truck" },
    { key: "delivered", label: "Delivered", icon: "fas fa-home" },
  ]

  const currentStatusIndex = statuses.findIndex((s) => s.key === orderData.status)

  timeline.innerHTML = statuses
    .map((status, index) => {
      let itemClass = ""
      if (index < currentStatusIndex) itemClass = "active"
      else if (index === currentStatusIndex) itemClass = "current"

      return `
            <div class="timeline-item ${itemClass}">
                <div class="d-flex align-items-center">
                    <i class="${status.icon} me-2"></i>
                    <div>
                        <strong>${status.label}</strong>
                        ${index <= currentStatusIndex ? `<br><small class="text-muted">${formatDate(orderData.created_at)}</small>` : ""}
                    </div>
                </div>
            </div>
        `
    })
    .join("")
}

function populateSpecialInstructions() {
  const specialInstructions = document.getElementById("special-instructions")
  specialInstructions.innerHTML =
    orderData.special_instructions || '<p class="text-muted">No special instructions provided.</p>'
}

async function loadDeliveryPersons() {
  try {
    const [success, result] = await callApi("GET", delivery_persons_url)

    if (success && result.success) {
      deliveryPersons = result.data.delivery_persons || []
      renderDeliveryPersons()
    } else {
      throw new Error(result.error || "Failed to load delivery persons")
    }
  } catch (error) {
    console.error("Error loading delivery persons:", error)
    showNotification("Error loading delivery persons.", "error")
  }
}

function renderDeliveryPersons() {
  const container = document.getElementById("delivery-persons-container")

  if (deliveryPersons.length === 0) {
    container.innerHTML = '<p class="text-muted">No delivery persons available.</p>'
    return
  }

  container.innerHTML = deliveryPersons
    .map(
      (person) => `
        <div class="col-md-6 mb-3">
            <div class="delivery-person-card ${orderData.assigned_delivery_partner_id === person.user_id ? "selected" : ""}" 
                 data-person-id="${person.user_id}" onclick="selectDeliveryPerson('${person.user_id}')">
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <i class="fas fa-user-circle fa-2x text-primary"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${person.name}</h6>
                        <p class="mb-1 text-muted">${person.phone}</p>
                        <small class="badge ${person.is_available ? "bg-success" : "bg-warning"}">
                            ${person.is_available ? "Available" : "Busy"}
                        </small>
                    </div>
                    <div>
                        <i class="fas fa-motorcycle text-muted"></i>
                    </div>
                </div>
            </div>
        </div>
    `,
    )
    .join("")

  // Set initially selected delivery person
  if (orderData.assigned_delivery_partner_id) {
    selectedDeliveryPerson = orderData.assigned_delivery_partner_id
  }
}

function selectDeliveryPerson(personId) {
  // Remove previous selection
  document.querySelectorAll(".delivery-person-card").forEach((card) => {
    card.classList.remove("selected")
  })

  // Add selection to clicked card
  document.querySelector(`[data-person-id="${personId}"]`).classList.add("selected")
  selectedDeliveryPerson = personId
}

async function assignDeliveryPerson() {
  if (!selectedDeliveryPerson) {
    showNotification("Please select a delivery person.", "warning")
    return
  }

  try {
    showLoading()

    const [success, result] = await callApi(
      "POST",
      assign_delivery_person_url,
      {
        order_id: order_id,
        delivery_person_id: selectedDeliveryPerson,
      },
      csrf_token,
    )

    if (success && result.success) {
      showNotification("Delivery person assigned successfully!", "success")
      await loadOrderDetails() // Refresh order details
    } else {
      throw new Error(result.error || "Failed to assign delivery person")
    }
  } catch (error) {
    console.error("Error assigning delivery person:", error)
    showNotification("Error assigning delivery person.", "error")
  } finally {
    hideLoading()
  }
}

function updateOrderStatus() {
  const newStatus = document.getElementById("status-select").value
  document.getElementById("modal-status-select").value = newStatus

  const modal = new bootstrap.Modal(document.getElementById("updateStatusModal"))
  modal.show()
}

async function confirmStatusUpdate() {
  const newStatus = document.getElementById("modal-status-select").value
  const notes = document.getElementById("status-notes").value

  try {
    showLoading()

    const [success, result] = await callApi(
      "POST",
      update_order_status_url,
      {
        order_id: order_id,
        status: newStatus,
        notes: notes,
      },
      csrf_token,
    )

    if (success && result.success) {
      showNotification("Order status updated successfully!", "success")

      // Close modal
      bootstrap.Modal.getInstance(document.getElementById("updateStatusModal")).hide()

      // Refresh order details
      await loadOrderDetails()
    } else {
      throw new Error(result.error || "Failed to update order status")
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    showNotification("Error updating order status.", "error")
  } finally {
    hideLoading()
  }
}

function updateOrderStatusBadge(status) {
  const badge = document.getElementById("order-status-badge")
  const statusConfig = {
    placed: { class: "bg-info", text: "Placed" },
    confirmed: { class: "bg-primary", text: "Confirmed" },
    preparing: { class: "bg-warning", text: "Preparing" },
    ready: { class: "bg-info", text: "Ready" },
    out_for_delivery: { class: "bg-primary", text: "Out for Delivery" },
    delivered: { class: "bg-success", text: "Delivered" },
    cancelled: { class: "bg-danger", text: "Cancelled" },
  }

  const config = statusConfig[status] || { class: "bg-secondary", text: status }
  badge.className = `order-status-badge badge ${config.class}`
  badge.textContent = config.text
}

function downloadKOT() {
  // Populate KOT data
  populateKOTData()

  // Generate PDF
  generateKOTPDF()
}

function printKOT() {
  // Populate KOT data
  populateKOTData()

  // Print the KOT section
  window.print()
}

function populateKOTData() {
  // Populate KOT header
  document.getElementById("kot-order-id").textContent = orderData.order_id
  document.getElementById("kot-date").textContent = formatDate(orderData.created_at)

  // Populate customer details
  document.getElementById("kot-customer-details").innerHTML = `
        <p><strong>${orderData.first_name} ${orderData.last_name}</strong></p>
        <p>${orderData.phone}</p>
        <p>${orderData.email}</p>
    `

  // Populate delivery details
  document.getElementById("kot-delivery-details").innerHTML = `
        <p><strong>Date:</strong> ${formatDate(orderData.delivery_date)}</p>
        <p><strong>Time:</strong> ${orderData.timeslot_name || "Not specified"}</p>
        <p><strong>Address:</strong> ${orderData.delivery_address}</p>
    `

  // Populate KOT items
  const kotItemsTbody = document.getElementById("kot-items-tbody")
  kotItemsTbody.innerHTML = orderData.order_items
    .map(
      (item) => `
        <tr>
            <td><strong>${item.product_name}</strong></td>
            <td>${item.variation_name || "Standard"}</td>
            <td class="text-center"><strong>${item.quantity}</strong></td>
            <td>${item.item_note || "-"}</td>
        </tr>
    `,
    )
    .join("")

  // Populate special instructions
  document.getElementById("kot-special-instructions").innerHTML = orderData.special_instructions || "None"

  // Populate kitchen notes (admin notes)
  document.getElementById("kot-kitchen-notes").innerHTML = document.getElementById("admin-notes").value || "None"
}

function generateKOTPDF() {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  // Add content to PDF
  doc.setFontSize(20)
  doc.text("KITCHEN ORDER TICKET (KOT)", 20, 20)

  doc.setFontSize(14)
  doc.text("OvenFresh Bakery", 20, 35)

  doc.setFontSize(12)
  doc.text(`Order ID: ${orderData.order_id}`, 20, 50)
  doc.text(`Date: ${formatDate(orderData.created_at)}`, 120, 50)

  // Customer details
  doc.text("Customer Details:", 20, 70)
  doc.text(`Name: ${orderData.first_name} ${orderData.last_name}`, 20, 85)
  doc.text(`Phone: ${orderData.phone}`, 20, 95)

  // Delivery details
  doc.text("Delivery Details:", 120, 70)
  doc.text(`Date: ${formatDate(orderData.delivery_date)}`, 120, 85)
  doc.text(`Time: ${orderData.timeslot_name || "Not specified"}`, 120, 95)

  // Order items
  doc.text("Order Items:", 20, 115)
  let yPosition = 130

  orderData.order_items.forEach((item) => {
    doc.text(`${item.quantity}x ${item.product_name}`, 20, yPosition)
    if (item.variation_name && item.variation_name !== "Standard") {
      doc.text(`(${item.variation_name})`, 120, yPosition)
    }
    yPosition += 10
  })

  // Special instructions
  if (orderData.special_instructions) {
    yPosition += 10
    doc.text("Special Instructions:", 20, yPosition)
    yPosition += 10
    doc.text(orderData.special_instructions, 20, yPosition)
  }

  // Save the PDF
  doc.save(`KOT-${orderData.order_id}.pdf`)
}

function initializeEventListeners() {
  // Status select change
  document.getElementById("status-select").addEventListener("change", function () {
    updateOrderStatusBadge(this.value)
  })

  // Admin notes save button
  document.getElementById("saveNotesBtn").addEventListener("click", () => {
    // You can implement save functionality here
    showNotification("Notes saved successfully!", "success")
  })

  // Refresh delivery persons button
  document.getElementById("refreshDeliveryBtn").addEventListener("click", async () => {
    await loadDeliveryPersons()
    showNotification("Delivery persons list refreshed", "info")
  })
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toastContainer")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.id = "toastContainer"
    toastContainer.className = "position-fixed bottom-0 end-0 p-3"
    toastContainer.style.zIndex = "9999"
    document.body.appendChild(toastContainer)
  }

  // Create toast element
  const toastId = `toast-${Date.now()}`
  const toast = document.createElement("div")
  toast.className = `toast show border-0`
  toast.id = toastId

  // Set toast background color based on type
  const bgClass =
    type === "error" ? "bg-danger" : type === "success" ? "bg-success" : type === "warning" ? "bg-warning" : "bg-info"

  toast.classList.add(bgClass, "text-white")

  toast.innerHTML = `
    <div class="toast-header bg-transparent text-white border-0">
      <strong class="me-auto">
        <i class="fas ${
          type === "error"
            ? "fa-exclamation-circle"
            : type === "success"
              ? "fa-check-circle"
              : type === "warning"
                ? "fa-exclamation-triangle"
                : "fa-info-circle"
        } me-2"></i>
        Notification
      </strong>
      <small>Just now</small>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `

  // Add toast to container
  toastContainer.appendChild(toast)

  // Initialize Bootstrap toast
  const bsToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: 5000,
  })

  // Show toast
  bsToast.show()

  // Remove toast after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove()
  })
}
