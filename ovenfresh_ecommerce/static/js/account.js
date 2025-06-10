let csrf_token = null
let profile_url = null
let update_profile_url = null
let change_password_url = null
let orders_url = null
let addresses_url = null
let add_address_url = null
let update_address_url = null
let delete_address_url = null
let logout_url = null

// User data
let userData = null
let userOrders = []
let userAddresses = []
let currentPage = 1
let totalPages = 1

async function InitializeAccount(
  csrfTokenParam,
  profileUrlParam,
  updateProfileUrlParam,
  changePasswordUrlParam,
  ordersUrlParam,
  addressesUrlParam,
  addAddressUrlParam,
  updateAddressUrlParam,
  deleteAddressUrlParam,
  logoutUrlParam,
) {
  csrf_token = csrfTokenParam
  profile_url = profileUrlParam
  update_profile_url = updateProfileUrlParam
  change_password_url = changePasswordUrlParam
  orders_url = ordersUrlParam
  addresses_url = addressesUrlParam
  add_address_url = addAddressUrlParam
  update_address_url = updateAddressUrlParam
  delete_address_url = deleteAddressUrlParam
  logout_url = logoutUrlParam

  try {
    showLoading()

    // Load user profile data
    await loadUserProfile()

    // Initialize event listeners
    initializeEventListeners()

    // Load initial section (profile)
    showSection("profile")

    hideLoading()
  } catch (error) {
    console.error("Error initializing account:", error)
    showNotification("Error loading account data.", "error")
    hideLoading()
  }
}

async function loadUserProfile() {
  try {
    const [success, result] = await callApi("GET", profile_url)

    if (success && result.success) {
      userData = result.data.user || {}
      populateProfileForm()
    } else {
      throw new Error(result.error || "Failed to load profile")
    }
  } catch (error) {
    console.error("Error loading profile:", error)
    showNotification("Error loading profile data.", "error")
  }
}

function populateProfileForm() {
  if (!userData) return

  // Populate profile form fields
  if (userData.first_name) document.getElementById("firstName").value = userData.first_name
  if (userData.last_name) document.getElementById("lastName").value = userData.last_name
  if (userData.email) document.getElementById("email").value = userData.email
  if (userData.phone) document.getElementById("phone").value = userData.phone
}

async function loadUserOrders(page = 1, status = "") {
  try {
    showLoading()

    const params = {
      page: page,
      limit: 10,
    }

    if (status) {
      params.status = status
    }

    const url = `${orders_url}?` + toQueryString(params)
    const [success, result] = await callApi("GET", url)

    if (success && result.success) {
      userOrders = result.data.orders || []
      currentPage = result.data.current_page || 1
      totalPages = result.data.total_pages || 1
      renderOrders()
      renderOrdersPagination()
    } else {
      throw new Error(result.error || "Failed to load orders")
    }
  } catch (error) {
    console.error("Error loading orders:", error)
    showNotification("Error loading orders.", "error")
  } finally {
    hideLoading()
  }
}

function renderOrders() {
  const ordersContainer = document.getElementById("orders-list")

  if (!userOrders || userOrders.length === 0) {
    ordersContainer.innerHTML = `
      <div class="text-center py-5">
        <i class="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
        <h5>No orders found</h5>
        <p class="text-muted">You haven't placed any orders yet.</p>
        <a href="{% url 'shop-list' %}" class="btn of-btn-primary">Start Shopping</a>
      </div>
    `
    return
  }

  ordersContainer.innerHTML = userOrders
    .map(
      (order) => `
    <div class="card order-card mb-3">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-3">
            <h6 class="mb-1">Order #${order.order_id}</h6>
            <small class="text-muted">${formatDate(order.created_at)}</small>
          </div>
          <div class="col-md-2">
            <span class="badge status-badge ${getStatusBadgeClass(order.status)}">${getStatusText(order.status)}</span>
          </div>
          <div class="col-md-2">
            <strong>₹${Number.parseFloat(order.total_amount).toFixed(2)}</strong>
          </div>
          <div class="col-md-2">
            <small class="text-muted">${order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}</small>
          </div>
          <div class="col-md-3 text-end">
            <a href="/order-detail/?order_id=${order.order_id}" class="btn of-btn-outline-primary btn-sm">
              <i class="fas fa-eye me-1"></i>View Details
            </a>
            ${
              order.status === "placed" || order.status === "confirmed"
                ? `
              <button class="btn btn-outline-danger btn-sm ms-2" onclick="cancelOrder('${order.order_id}')">
                <i class="fas fa-times me-1"></i>Cancel
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

function renderOrdersPagination() {
  const paginationContainer = document.getElementById("orders-pagination")

  if (totalPages <= 1) {
    paginationContainer.innerHTML = ""
    return
  }

  let paginationHtml = '<nav><ul class="pagination">'

  // Previous button
  if (currentPage > 1) {
    paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="loadUserOrders(${currentPage - 1}, document.getElementById('orderFilter').value)">Previous</a></li>`
  }

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      paginationHtml += `<li class="page-item active"><span class="page-link">${i}</span></li>`
    } else {
      paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="loadUserOrders(${i}, document.getElementById('orderFilter').value)">${i}</a></li>`
    }
  }

  // Next button
  if (currentPage < totalPages) {
    paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="loadUserOrders(${currentPage + 1}, document.getElementById('orderFilter').value)">Next</a></li>`
  }

  paginationHtml += "</ul></nav>"
  paginationContainer.innerHTML = paginationHtml
}

async function loadUserAddresses() {
  try {
    showLoading()

    const [success, result] = await callApi("GET", addresses_url)

    if (success && result.success) {
      userAddresses = result.data.addresses || []
      renderAddresses()
    } else {
      throw new Error(result.error || "Failed to load addresses")
    }
  } catch (error) {
    console.error("Error loading addresses:", error)
    showNotification("Error loading addresses.", "error")
  } finally {
    hideLoading()
  }
}

function renderAddresses() {
  const addressesContainer = document.getElementById("addresses-list")

  if (!userAddresses || userAddresses.length === 0) {
    addressesContainer.innerHTML = `
      <div class="col-12">
        <div class="text-center py-5">
          <i class="fas fa-map-marker-alt fa-3x text-muted mb-3"></i>
          <h5>No addresses found</h5>
          <p class="text-muted">Add your first delivery address.</p>
          <button class="btn of-btn-primary" onclick="showAddAddressModal()">Add Address</button>
        </div>
      </div>
    `
    return
  }

  addressesContainer.innerHTML = userAddresses
    .map(
      (address) => `
    <div class="col-md-6">
      <div class="card address-card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0">${address.address_name || "Address"}</h6>
            ${address.is_default ? '<span class="badge bg-success">Default</span>' : ""}
          </div>
          <p class="mb-2">${address.address_line}</p>
          <p class="mb-2">${address.city}, ${address.pincode}</p>
          <div class="d-flex gap-2">
            <button class="btn of-btn-outline-primary btn-sm" onclick="editAddress(${address.id})">
              <i class="fas fa-edit me-1"></i>Edit
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteAddress(${address.id})">
              <i class="fas fa-trash me-1"></i>Delete
            </button>
            ${
              !address.is_default
                ? `
              <button class="btn btn-outline-success btn-sm" onclick="setDefaultAddress(${address.id})">
                <i class="fas fa-star me-1"></i>Set Default
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

function initializeEventListeners() {
  // Sidebar navigation
  document.querySelectorAll("[data-section]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const section = e.target.getAttribute("data-section")
      showSection(section)
    })
  })

  // Profile form submission
  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    await updateProfile()
  })

  // Password form submission
  document.getElementById("password-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    await changePassword()
  })

  // Order filter change
  document.getElementById("orderFilter").addEventListener("change", (e) => {
    loadUserOrders(1, e.target.value)
  })

  // Address form submission
  document.getElementById("address-form").addEventListener("submit", (e) => {
    e.preventDefault()
    saveAddress()
  })
}

function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".account-section").forEach((section) => {
    section.style.display = "none"
  })

  // Remove active class from all sidebar links
  document.querySelectorAll("[data-section]").forEach((link) => {
    link.classList.remove("active")
  })

  // Show selected section
  document.getElementById(`${sectionName}-section`).style.display = "block"

  // Add active class to selected sidebar link
  document.querySelector(`[data-section="${sectionName}"]`).classList.add("active")

  // Load section-specific data
  switch (sectionName) {
    case "orders":
      loadUserOrders()
      break
    case "addresses":
      loadUserAddresses()
      break
  }
}

async function updateProfile() {
  try {
    showLoading()

    const profileData = {
      first_name: document.getElementById("firstName").value,
      last_name: document.getElementById("lastName").value,
      email: document.getElementById("email").value,
    }

    const [success, result] = await callApi("PUT", `${update_profile_url}${document.getElementById("firstName").value}/`, profileData, csrf_token)

    if (success && result.success) {
      showNotification("Profile updated successfully!", "success")
      userData = { ...userData, ...profileData }
    } else {
      throw new Error(result.error || "Failed to update profile")
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    showNotification("Error updating profile. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

async function changePassword() {
  const currentPassword = document.getElementById("currentPassword").value
  const newPassword = document.getElementById("newPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value

  // Validate passwords
  if (newPassword !== confirmPassword) {
    showNotification("New passwords do not match.", "error")
    return
  }

  if (newPassword.length < 8) {
    showNotification("Password must be at least 8 characters long.", "error")
    return
  }

  try {
    showLoading()

    const passwordData = {
      current_password: currentPassword,
      new_password: newPassword,
    }

    const [success, result] = await callApi("PUT", change_password_url, passwordData, csrf_token)

    if (success && result.success) {
      showNotification("Password changed successfully!", "success")
      document.getElementById("password-form").reset()
    } else {
      throw new Error(result.error || "Failed to change password")
    }
  } catch (error) {
    console.error("Error changing password:", error)
    showNotification("Error changing password. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

function showAddAddressModal() {
  // Clear form
  document.getElementById("address-form").reset()
  document.getElementById("addressId").value = ""
  document.getElementById("addAddressModalLabel").textContent = "Add New Address"

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("addAddressModal"))
  modal.show()
}

function editAddress(addressId) {
  const address = userAddresses.find((addr) => addr.id === addressId)
  if (!address) return

  // Populate form with address data
  document.getElementById("addressId").value = address.id
  document.getElementById("addressName").value = address.address_name || ""
  document.getElementById("addressLine").value = address.address_line || ""
  document.getElementById("addressCity").value = address.city || ""
  document.getElementById("addressPincode").value = address.pincode || ""
  document.getElementById("isDefaultAddress").checked = address.is_default || false

  document.getElementById("addAddressModalLabel").textContent = "Edit Address"

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("addAddressModal"))
  modal.show()
}

async function saveAddress() {
  try {
    showLoading()

    const addressData = {
      address_name: document.getElementById("addressName").value,
      address_line: document.getElementById("addressLine").value,
      city: document.getElementById("addressCity").value,
      pincode: document.getElementById("addressPincode").value,
      is_default: document.getElementById("isDefaultAddress").checked,
    }

    const addressId = document.getElementById("addressId").value
    const isEdit = addressId !== ""

    const url = isEdit ? `${update_address_url}${addressId}/` : add_address_url
    const method = isEdit ? "PUT" : "POST"

    const [success, result] = await callApi(method, url, addressData, csrf_token)

    if (success && result.success) {
      showNotification(`Address ${isEdit ? "updated" : "added"} successfully!`, "success")

      // Close modal
      bootstrap.Modal.getInstance(document.getElementById("addAddressModal")).hide()

      // Reload addresses
      await loadUserAddresses()
    } else {
      throw new Error(result.error || `Failed to ${isEdit ? "update" : "add"} address`)
    }
  } catch (error) {
    console.error("Error saving address:", error)
    showNotification("Error saving address. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

async function deleteAddress(addressId) {
  if (!confirm("Are you sure you want to delete this address?")) {
    return
  }

  try {
    showLoading()

    const [success, result] = await callApi("DELETE", `${delete_address_url}${addressId}/`, {}, csrf_token)

    if (success && result.success) {
      showNotification("Address deleted successfully!", "success")
      await loadUserAddresses()
    } else {
      throw new Error(result.error || "Failed to delete address")
    }
  } catch (error) {
    console.error("Error deleting address:", error)
    showNotification("Error deleting address. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

async function setDefaultAddress(addressId) {
  try {
    showLoading()

    const [success, result] = await callApi(
      "PUT",
      `${update_address_url}${addressId}/`,
      { is_default: true },
      csrf_token,
    )

    if (success && result.success) {
      showNotification("Default address updated successfully!", "success")
      await loadUserAddresses()
    } else {
      throw new Error(result.error || "Failed to set default address")
    }
  } catch (error) {
    console.error("Error setting default address:", error)
    showNotification("Error setting default address. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

async function cancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) {
    return
  }

  try {
    showLoading()

    const [success, result] = await callApi(
      "POST",
      `/order-api/cancel-order/${orderId}/`,
      { reason: "Customer requested cancellation" },
      csrf_token,
    )

    if (success && result.success) {
      showNotification("Order cancelled successfully!", "success")
      await loadUserOrders(currentPage, document.getElementById("orderFilter").value)
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

async function updateNotificationPreferences() {
  try {
    showLoading()

    const preferences = {
      email_notifications: document.getElementById("emailNotifications").checked,
      sms_notifications: document.getElementById("smsNotifications").checked,
      promotional_emails: document.getElementById("promotionalEmails").checked,
    }

    const [success, result] = await callApi("PUT", update_profile_url, preferences, csrf_token)

    if (success && result.success) {
      showNotification("Notification preferences updated successfully!", "success")
    } else {
      throw new Error(result.error || "Failed to update preferences")
    }
  } catch (error) {
    console.error("Error updating preferences:", error)
    showNotification("Error updating preferences. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

async function logout() {
  if (!confirm("Are you sure you want to logout?")) {
    return
  }

  try {
    showLoading()

    const [success, result] = await callApi("POST", logout_url, {}, csrf_token)

    if (success && result.success) {
      showNotification("Logged out successfully!", "success")
      setTimeout(() => {
        window.location.href = "/"
      }, 1000)
    } else {
      throw new Error(result.error || "Failed to logout")
    }
  } catch (error) {
    console.error("Error logging out:", error)
    showNotification("Error logging out. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

// Utility functions
function getStatusBadgeClass(status) {
  const statusClasses = {
    placed: "bg-primary",
    confirmed: "bg-info",
    preparing: "bg-warning",
    out_for_delivery: "bg-secondary",
    delivered: "bg-success",
    cancelled: "bg-danger",
  }
  return statusClasses[status] || "bg-secondary"
}

function getStatusText(status) {
  const statusTexts = {
    placed: "Placed",
    confirmed: "Confirmed",
    preparing: "Preparing",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  }
  return statusTexts[status] || status
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  return date.toLocaleDateString("en-US", options)
}

function toQueryString(params) {
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&")
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
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `alert alert-${type === "error" ? "danger" : type} alert-dismissible fade show position-fixed`
  notification.style.cssText = "top: 20px; right: 20px; z-index: 9999; min-width: 300px;"
  notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `

  document.body.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, 5000)
}
