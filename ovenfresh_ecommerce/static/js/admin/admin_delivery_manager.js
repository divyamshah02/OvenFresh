let csrf_token = null
let delivery_partners_url = null

let deliveryPartners = []
let currentEditingId = null

async function AdminDeliveryManager(csrf_token_param, delivery_partners_url_param) {
  csrf_token = csrf_token_param
  delivery_partners_url = delivery_partners_url_param

  // Initialize theme
  initializeTheme()

  // Load initial data
  await loadDeliveryPartners()

  // Initialize event listeners
  initializeEventListeners()

  // Load saved theme
  loadSavedTheme()
}

function initializeTheme() {
  const themeToggle = document.getElementById("theme-toggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme)
  }

  const mobileToggle = document.querySelector(".navbar-toggler")
  if (mobileToggle) {
    mobileToggle.addEventListener("click", toggleMobileSidebar)
  }
}

function initializeEventListeners() {
  // Search functionality
  document.getElementById("searchInput").addEventListener("input", filterPartners)

  // Status filter
  document.getElementById("statusFilter").addEventListener("change", filterPartners)

  // Auto-refresh every 30 seconds
  setInterval(loadDeliveryPartners, 30000)
}

async function loadDeliveryPartners() {
  showLoading()

  try {
    const [success, result] = await callApi("GET", delivery_partners_url)

    if (success && result.success) {
      deliveryPartners = result.data.partners || []
      updateStats(result.data.stats || {})
      displayPartners(deliveryPartners)
    } else {
      showToast("error", "Error", "Failed to load delivery partners")
      showEmptyState()
    }
  } catch (error) {
    console.error("Error loading delivery partners:", error)
    showToast("error", "Error", "Failed to load delivery partners")
    showEmptyState()
  } finally {
    hideLoading()
  }
}

function updateStats(stats) {
  document.getElementById("totalPartnersCount").textContent = stats.total || 0
  document.getElementById("activePartnersCount").textContent = stats.active || 0
  document.getElementById("availablePartnersCount").textContent = stats.available || 0
  document.getElementById("busyPartnersCount").textContent = stats.busy || 0
}

function filterPartners() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()
  const statusFilter = document.getElementById("statusFilter").value

  const filteredPartners = deliveryPartners.filter((partner) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      partner.first_name.toLowerCase().includes(searchTerm) ||
      partner.last_name.toLowerCase().includes(searchTerm) ||
      partner.contact_number.includes(searchTerm) ||
      partner.user_id.toLowerCase().includes(searchTerm) ||
      partner.email.toLowerCase().includes(searchTerm)

    // Status filter
    let matchesStatus = true
    if (statusFilter) {
      switch (statusFilter) {
        case "active":
          matchesStatus = partner.is_active
          break
        case "inactive":
          matchesStatus = !partner.is_active
          break
        case "available":
          matchesStatus = partner.is_available && partner.is_active
          break
        case "unavailable":
          matchesStatus = !partner.is_available || !partner.is_active
          break
      }
    }

    return matchesSearch && matchesStatus
  })

  displayPartners(filteredPartners)
}

function displayPartners(partners) {
  const tableBody = document.getElementById("partnersTableBody")
  const tableContainer = document.getElementById("partnersTableContainer")
  const emptyState = document.getElementById("emptyState")

  if (!partners || partners.length === 0) {
    showEmptyState()
    return
  }

  tableContainer.style.display = "block"
  emptyState.style.display = "none"

  tableBody.innerHTML = partners
    .map(
      (partner) => `
        <tr>
            <td>${partner.user_id}</td>
            <td>${partner.first_name} ${partner.last_name}</td>
            <td>${partner.contact_number}</td>
            <td>${partner.email}</td>
            <td>
                ${
                  partner.vehicle_type
                    ? `${capitalizeFirst(partner.vehicle_type)} ${partner.vehicle_number || ""}`
                    : '<span class="text-muted">Not specified</span>'
                }
            </td>
            <td>
                <span class="badge ${partner.is_active ? "bg-success" : "bg-danger"}">
                    ${partner.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                ${
                  partner.is_active
                    ? `<span class="badge ${partner.is_available ? "bg-info" : "bg-warning"}">
                        ${partner.is_available ? "Available" : "Busy"}
                    </span>`
                    : '<span class="badge bg-secondary">N/A</span>'
                }
            </td>
            <td>${partner.total_deliveries || 0}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editPartner('${partner.user_id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-${partner.is_active ? "warning" : "success"}" 
                            onclick="togglePartnerStatus('${partner.user_id}', ${!partner.is_active})" 
                            title="${partner.is_active ? "Deactivate" : "Activate"}">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePartner('${partner.user_id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `,
    )
    .join("")
}

function showEmptyState() {
  document.getElementById("partnersTableContainer").style.display = "none"
  document.getElementById("emptyState").style.display = "block"
}

function openAddModal() {
  currentEditingId = null
  document.getElementById("modalTitle").innerHTML = '<i class="fas fa-motorcycle me-2"></i>Add New Delivery Partner'
  document.getElementById("saveButtonText").textContent = "Save Partner"
  document.getElementById("partnerForm").reset()
  document.getElementById("isActive").checked = true
  document.getElementById("isAvailable").checked = true

  const modal = new bootstrap.Modal(document.getElementById("partnerModal"))
  modal.show()
}

function editPartner(userId) {
  const partner = deliveryPartners.find((p) => p.user_id === userId)
  if (!partner) return

  currentEditingId = userId
  document.getElementById("modalTitle").innerHTML = '<i class="fas fa-edit me-2"></i>Edit Delivery Partner'
  document.getElementById("saveButtonText").textContent = "Update Partner"

  // Fill form with partner data
  document.getElementById("partnerId").value = partner.user_id
  document.getElementById("firstName").value = partner.first_name || ""
  document.getElementById("lastName").value = partner.last_name || ""
  document.getElementById("email").value = partner.email || ""
  document.getElementById("contactNumber").value = partner.contact_number || ""
  document.getElementById("alternatePhone").value = partner.alternate_phone || ""
  document.getElementById("plainTextPassword").value = partner.plain_text_password || ""
  document.getElementById("vehicleType").value = partner.vehicle_type || ""
  document.getElementById("vehicleNumber").value = partner.vehicle_number || ""
  document.getElementById("address").value = partner.address || ""
  document.getElementById("isActive").checked = partner.is_active
  document.getElementById("isAvailable").checked = partner.is_available

  const modal = new bootstrap.Modal(document.getElementById("partnerModal"))
  modal.show()
}

async function savePartner() {
  const form = document.getElementById("partnerForm")

  // Validate required fields
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  const data = {
    first_name: document.getElementById("firstName").value,
    last_name: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    contact_number: document.getElementById("contactNumber").value,
    alternate_phone: document.getElementById("alternatePhone").value,
    plain_text_password: document.getElementById("plainTextPassword").value,
    vehicle_type: document.getElementById("vehicleType").value,
    vehicle_number: document.getElementById("vehicleNumber").value,
    address: document.getElementById("address").value,
    is_active: document.getElementById("isActive").checked,
    is_available: document.getElementById("isAvailable").checked,
  }

  try {
    showLoading("Saving partner...")

    let url, method
    if (currentEditingId) {
      url = `${delivery_partners_url}${currentEditingId}/`
      method = "PUT"
    } else {
      url = delivery_partners_url
      method = "POST"
    }

    const [success, result] = await callApi(method, url, data, csrf_token)

    if (success && result.success) {
      showToast(
        "success",
        "Success",
        currentEditingId ? "Partner updated successfully" : "Partner created successfully",
      )
      bootstrap.Modal.getInstance(document.getElementById("partnerModal")).hide()
      loadDeliveryPartners()
    } else {
      showToast("error", "Error", result.error || "Failed to save partner")
    }
  } catch (error) {
    console.error("Error saving partner:", error)
    showToast("error", "Error", "Failed to save partner")
  } finally {
    hideLoading()
  }
}

async function togglePartnerStatus(userId, newStatus) {
  try {
    showLoading("Updating status...")

    const url = `${delivery_partners_url}${userId}/toggle-status/`
    const [success, result] = await callApi("POST", url, { is_active: newStatus }, csrf_token)

    if (success && result.success) {
      showToast("success", "Success", `Partner ${newStatus ? "activated" : "deactivated"} successfully`)
      loadDeliveryPartners()
    } else {
      showToast("error", "Error", result.error || "Failed to update partner status")
    }
  } catch (error) {
    console.error("Error toggling partner status:", error)
    showToast("error", "Error", "Failed to update partner status")
  } finally {
    hideLoading()
  }
}

function deletePartner(userId) {
  currentEditingId = userId
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"))
  modal.show()
}

async function confirmDelete() {
  if (!currentEditingId) return

  try {
    showLoading("Deleting partner...")

    const url = `${delivery_partners_url}${currentEditingId}/`
    const [success, result] = await callApi("DELETE", url, null, csrf_token)

    if (success && result.success) {
      showToast("success", "Success", "Partner deleted successfully")
      bootstrap.Modal.getInstance(document.getElementById("deleteModal")).hide()
      loadDeliveryPartners()
    } else {
      showToast("error", "Error", result.error || "Failed to delete partner")
    }
  } catch (error) {
    console.error("Error deleting partner:", error)
    showToast("error", "Error", "Failed to delete partner")
  } finally {
    hideLoading()
  }
}

// Utility functions
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Theme functions
function toggleTheme() {
  const body = document.body
  const themeIcon = document.querySelector("#theme-toggle i")

  if (body.classList.contains("ovenfresh-theme")) {
    body.classList.remove("ovenfresh-theme")
    body.classList.add("dark-theme")
    themeIcon.classList.replace("fa-sun", "fa-moon")
    localStorage.setItem("shopAdminTheme", "dark-theme")
  } else {
    body.classList.remove("dark-theme")
    body.classList.add("ovenfresh-theme")
    themeIcon.classList.replace("fa-moon", "fa-sun")
    localStorage.setItem("shopAdminTheme", "ovenfresh-theme")
  }

  showToast("success", "Theme Changed", "Theme has been updated")
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("shopAdminTheme")
  if (savedTheme === "dark-theme") {
    toggleTheme()
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById("sidebar")
  sidebar.classList.toggle("show")
}

// Loading and toast functions
function showLoading(message = "Loading...") {
  let loadingEl = document.getElementById("globalLoading")

  if (!loadingEl) {
    loadingEl = document.createElement("div")
    loadingEl.id = "globalLoading"
    loadingEl.className = "position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
    loadingEl.style.backgroundColor = "rgba(0,0,0,0.5)"
    loadingEl.style.zIndex = "9999"

    loadingEl.innerHTML = `
            <div class="card p-4 shadow">
                <div class="d-flex align-items-center">
                    <div class="spinner-border text-primary me-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div id="loadingMessage">${message}</div>
                </div>
            </div>
        `

    document.body.appendChild(loadingEl)
  } else {
    document.getElementById("loadingMessage").textContent = message
    loadingEl.style.display = "flex"
  }
}

function hideLoading() {
  const loadingEl = document.getElementById("globalLoading")
  if (loadingEl) {
    loadingEl.remove()
  }
}

function showToast(type, title, message) {
  const toastContainer = document.getElementById("toastContainer")
  if (!toastContainer) return

  const toastId = `toast-${Date.now()}`

  const toast = document.createElement("div")
  toast.id = toastId
  toast.className = `toast align-items-center text-white bg-${getToastBgClass(type)} border-0`
  toast.setAttribute("role", "alert")
  toast.setAttribute("aria-live", "assertive")
  toast.setAttribute("aria-atomic", "true")

  toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <div class="d-flex align-items-center">
                    <i class="${getToastIcon(type)} me-2"></i>
                    <div>
                        <strong>${title}</strong>
                        <div class="small">${message}</div>
                    </div>
                </div>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `

  toastContainer.appendChild(toast)

  setTimeout(() => {
    toast.classList.add("show")
  }, 100)

  setTimeout(() => {
    if (toast.classList.contains("show")) {
      toast.classList.remove("show")
      setTimeout(() => {
        toast.remove()
      }, 300)
    }
  }, 5000)
}

function getToastBgClass(type) {
  const classMap = {
    success: "success",
    error: "danger",
    warning: "warning",
    info: "primary",
  }
  return classMap[type] || "primary"
}

function getToastIcon(type) {
  const iconMap = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  }
  return iconMap[type] || "fas fa-info-circle"
}
