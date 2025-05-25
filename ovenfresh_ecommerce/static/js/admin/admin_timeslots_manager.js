let csrf_token = null
let timeslots_url = null

let currentPage = 1
const itemsPerPage = 10
let totalItems = 0
let currentFilters = {
  search: "",
  status: "",
  type: "",
  sortBy: "start_time_asc",
}

let allTimeslots = []
let selectedTimeslots = []
let timeslotToDelete = null
let editingTimeslot = null

async function AdminTimeslotsManager(csrf_token_param, timeslots_url_param) {
  csrf_token = csrf_token_param
  timeslots_url = timeslots_url_param

  // Initialize theme
  initializeTheme()

  // Load initial data
  await loadTimeslots()

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
  const searchInput = document.getElementById("searchInput")
  const searchBtn = document.getElementById("searchBtn")

  searchBtn.addEventListener("click", handleSearch)
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  })

  // Filter changes
  document.getElementById("statusFilter").addEventListener("change", handleFilterChange)
  document.getElementById("typeFilter").addEventListener("change", handleFilterChange)
  document.getElementById("sortBy").addEventListener("change", handleFilterChange)

  // Clear filters
  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters)

  // Refresh button
  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadTimeslots()
    showToast("info", "Refreshed", "Timeslots list has been refreshed")
  })

  // Select all checkbox
  document.getElementById("selectAll").addEventListener("change", handleSelectAll)

  // Bulk operations
  document.getElementById("bulkDeleteBtn").addEventListener("click", handleBulkDelete)
  document.getElementById("bulkToggleBtn").addEventListener("click", handleBulkToggle)

  // Export buttons
  document.getElementById("exportCsvBtn").addEventListener("click", () => exportData("csv"))
  document.getElementById("exportScheduleBtn").addEventListener("click", () => exportSchedule())

  // Save timeslot
  document.getElementById("saveTimeslotBtn").addEventListener("click", saveTimeslot)

  // Delete confirmation
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete)

  // Quick action buttons
  document.getElementById("createMorningSlots").addEventListener("click", () => createQuickSlots("morning"))
  document.getElementById("createAfternoonSlots").addEventListener("click", () => createQuickSlots("afternoon"))
  document.getElementById("createEveningSlots").addEventListener("click", () => createQuickSlots("evening"))
  document.getElementById("create24HourSlots").addEventListener("click", () => createQuickSlots("24hour"))

  // Bulk create
  document.getElementById("createBulkTimeslotsBtn").addEventListener("click", createBulkTimeslots)

  // Timeline toggle
  document.getElementById("toggleTimelineBtn").addEventListener("click", toggleTimeline)

  // Time validation
  document.getElementById("startTime").addEventListener("change", validateTimeRange)
  document.getElementById("endTime").addEventListener("change", validateTimeRange)
}

async function loadTimeslots() {
  showLoading()

  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage,
      limit: itemsPerPage,
      ...currentFilters,
    })

    const [success, result] = await callApi("GET", `${timeslots_url}?${params}`)

    if (success && result.success) {
      allTimeslots = result.data.timeslots || result.data
      totalItems = result.data.total || allTimeslots.length

      renderTimeslotsTable()
      renderPagination()
      updateStats()
      updateSelectedCount()
      renderTimeline()
    } else {
      showToast("error", "Error", "Failed to load timeslots")
      showEmptyState()
    }
  } catch (error) {
    console.error("Error loading timeslots:", error)
    showToast("error", "Error", "Failed to load timeslots")
    showEmptyState()
  } finally {
    hideLoading()
  }
}

function renderTimeslotsTable() {
  const tableBody = document.getElementById("timeslotsTableBody")
  const tableContainer = document.getElementById("timeslotsTableContainer")
  const emptyState = document.getElementById("emptyState")

  if (!allTimeslots || allTimeslots.length === 0) {
    showEmptyState()
    return
  }

  tableContainer.style.display = "block"
  emptyState.style.display = "none"

  tableBody.innerHTML = ""

  allTimeslots.forEach((timeslot) => {
    const row = createTimeslotRow(timeslot)
    tableBody.appendChild(row)
  })
}

function createTimeslotRow(timeslot) {
  const row = document.createElement("tr")

  // Calculate duration
  const duration = calculateDuration(timeslot.start_time, timeslot.end_time)

  // Format time range
  const timeRange = `${formatTime(timeslot.start_time)} - ${formatTime(timeslot.end_time)}`

  // Get usage stats (mock data for now)
  const usage = timeslot.usage_count || Math.floor(Math.random() * 100)

  // Format created date
  const createdDate = new Date(timeslot.created_at || Date.now()).toLocaleDateString()

  row.innerHTML = `
        <td>
            <div class="form-check">
                <input class="form-check-input timeslot-checkbox" type="checkbox" value="${timeslot.id}" onchange="handleTimeslotSelect(this)">
            </div>
        </td>
        <td>
            <div class="d-flex align-items-center">
                <div class="me-3">
                    <i class="fas fa-clock text-primary"></i>
                </div>
                <div>
                    <h6 class="mb-0">${timeslot.time_slot_title}</h6>
                    ${timeslot.description ? `<small class="text-muted">${timeslot.description}</small>` : ""}
                </div>
            </div>
        </td>
        <td>
            <span class="badge bg-light text-dark">${timeRange}</span>
        </td>
        <td>${duration}</td>
        <td>${getTypeBadge(timeslot.type || getTimeType(timeslot.start_time))}</td>
        <td>${getStatusBadge(timeslot.status || "active")}</td>
        <td>
            <div class="d-flex align-items-center">
                <span class="badge bg-info me-2">${usage} orders</span>
                ${timeslot.is_peak_hour ? '<span class="badge bg-warning">Peak</span>' : ""}
            </div>
        </td>
        <td>${createdDate}</td>
        <td>
            <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="viewTimeslot(${timeslot.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="editTimeslot(${timeslot.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-sm ${(timeslot.status || "active") === "active" ? "btn-outline-warning" : "btn-outline-success"}" 
                        onclick="toggleTimeslotStatus(${timeslot.id})" title="${(timeslot.status || "active") === "active" ? "Deactivate" : "Activate"}">
                    <i class="fas fa-toggle-${(timeslot.status || "active") === "active" ? "on" : "off"}"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteTimeslot(${timeslot.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `

  return row
}

function calculateDuration(startTime, endTime) {
  const start = new Date(`2000-01-01 ${startTime}`)
  const end = new Date(`2000-01-01 ${endTime}`)

  // Handle overnight slots
  if (end < start) {
    end.setDate(end.getDate() + 1)
  }

  const diffMs = end - start
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 1) {
    const diffMinutes = diffMs / (1000 * 60)
    return `${Math.round(diffMinutes)} min`
  }

  return `${diffHours} hrs`
}

function formatTime(time) {
  const [hours, minutes] = time.split(":")
  const hour = Number.parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

function getTimeType(startTime) {
  const hour = Number.parseInt(startTime.split(":")[0])

  if (hour >= 6 && hour < 12) return "morning"
  if (hour >= 12 && hour < 18) return "afternoon"
  if (hour >= 18 && hour < 22) return "evening"
  return "night"
}

function getTypeBadge(type) {
  const typeConfig = {
    morning: { class: "bg-warning text-dark", text: "Morning", icon: "fa-sun" },
    afternoon: { class: "bg-info", text: "Afternoon", icon: "fa-sun" },
    evening: { class: "bg-primary", text: "Evening", icon: "fa-moon" },
    night: { class: "bg-dark", text: "Night", icon: "fa-moon" },
  }

  const config = typeConfig[type] || typeConfig["morning"]
  return `<span class="badge ${config.class}"><i class="fas ${config.icon} me-1"></i>${config.text}</span>`
}

function getStatusBadge(status) {
  const statusConfig = {
    active: { class: "bg-success", text: "Active" },
    inactive: { class: "bg-secondary", text: "Inactive" },
  }

  const config = statusConfig[status] || statusConfig["active"]
  return `<span class="badge ${config.class}">${config.text}</span>`
}

function showEmptyState() {
  document.getElementById("timeslotsTableContainer").style.display = "none"
  document.getElementById("emptyState").style.display = "block"
  document.getElementById("paginationContainer").style.display = "none"
}

function renderPagination() {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const pagination = document.getElementById("pagination")
  const paginationInfo = document.getElementById("paginationInfo")
  const paginationContainer = document.getElementById("paginationContainer")

  if (totalItems === 0) {
    paginationContainer.style.display = "none"
    return
  }

  paginationContainer.style.display = "flex"

  // Update info
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  paginationInfo.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} entries`

  // Generate pagination
  pagination.innerHTML = ""

  // Previous button
  const prevLi = document.createElement("li")
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`
  prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>`
  pagination.appendChild(prevLi)

  // Page numbers
  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPages, currentPage + 2)

  for (let i = startPage; i <= endPage; i++) {
    const li = document.createElement("li")
    li.className = `page-item ${i === currentPage ? "active" : ""}`
    li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`
    pagination.appendChild(li)
  }

  // Next button
  const nextLi = document.createElement("li")
  nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`
  nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>`
  pagination.appendChild(nextLi)
}

function changePage(page) {
  if (page < 1 || page > Math.ceil(totalItems / itemsPerPage)) return
  currentPage = page
  loadTimeslots()
}

function handleSearch() {
  currentFilters.search = document.getElementById("searchInput").value.trim()
  currentPage = 1
  loadTimeslots()
}

function handleFilterChange() {
  currentFilters.status = document.getElementById("statusFilter").value
  currentFilters.type = document.getElementById("typeFilter").value
  currentFilters.sortBy = document.getElementById("sortBy").value
  currentPage = 1
  loadTimeslots()
}

function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("statusFilter").value = ""
  document.getElementById("typeFilter").value = ""
  document.getElementById("sortBy").value = "start_time_asc"

  currentFilters = {
    search: "",
    status: "",
    type: "",
    sortBy: "start_time_asc",
  }

  currentPage = 1
  loadTimeslots()
  showToast("info", "Filters Cleared", "All filters have been reset")
}

function handleSelectAll() {
  const selectAll = document.getElementById("selectAll")
  const checkboxes = document.querySelectorAll(".timeslot-checkbox")

  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAll.checked
  })

  updateSelectedTimeslots()
}

function handleTimeslotSelect(checkbox) {
  updateSelectedTimeslots()

  // Update select all checkbox
  const checkboxes = document.querySelectorAll(".timeslot-checkbox")
  const checkedBoxes = document.querySelectorAll(".timeslot-checkbox:checked")
  const selectAll = document.getElementById("selectAll")

  selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length
  selectAll.checked = checkedBoxes.length === checkboxes.length
}

function updateSelectedTimeslots() {
  const checkedBoxes = document.querySelectorAll(".timeslot-checkbox:checked")
  selectedTimeslots = Array.from(checkedBoxes).map((cb) => Number.parseInt(cb.value))
  updateSelectedCount()
}

function updateSelectedCount() {
  const bulkDeleteBtn = document.getElementById("bulkDeleteBtn")
  const bulkToggleBtn = document.getElementById("bulkToggleBtn")

  if (selectedTimeslots.length > 0) {
    bulkDeleteBtn.style.display = "inline-block"
    bulkToggleBtn.style.display = "inline-block"
    bulkDeleteBtn.innerHTML = `<i class="fas fa-trash me-1"></i> Delete Selected (${selectedTimeslots.length})`
    bulkToggleBtn.innerHTML = `<i class="fas fa-toggle-on me-1"></i> Toggle Status (${selectedTimeslots.length})`
  } else {
    bulkDeleteBtn.style.display = "none"
    bulkToggleBtn.style.display = "none"
  }
}

function updateStats() {
  // Calculate stats
  const totalTimeslots = allTimeslots.length
  const activeTimeslots = allTimeslots.filter((t) => (t.status || "active") === "active").length
  const peakHours = allTimeslots.filter((t) => t.is_peak_hour).length

  // Calculate coverage hours
  let totalHours = 0
  allTimeslots.forEach((timeslot) => {
    const start = new Date(`2000-01-01 ${timeslot.start_time}`)
    const end = new Date(`2000-01-01 ${timeslot.end_time}`)
    if (end < start) end.setDate(end.getDate() + 1)
    totalHours += (end - start) / (1000 * 60 * 60)
  })

  // Update DOM
  document.getElementById("totalTimeslots").textContent = totalTimeslots
  document.getElementById("activeTimeslots").textContent = activeTimeslots
  document.getElementById("peakHours").textContent = peakHours
  document.getElementById("coverageHours").textContent = `${Math.round(totalHours)}h`
}

function viewTimeslot(timeslotId) {
  const timeslot = allTimeslots.find((t) => t.id === timeslotId)
  if (!timeslot) return

  const timeRange = `${formatTime(timeslot.start_time)} - ${formatTime(timeslot.end_time)}`
  const duration = calculateDuration(timeslot.start_time, timeslot.end_time)

  showToast("info", "Timeslot Details", `${timeslot.time_slot_title} (${timeRange}) - Duration: ${duration}`)
}

function editTimeslot(timeslotId) {
  const timeslot = allTimeslots.find((t) => t.id === timeslotId)
  if (!timeslot) return

  editingTimeslot = timeslot

  // Populate form
  document.getElementById("timeslotId").value = timeslot.id
  document.getElementById("timeslotTitle").value = timeslot.time_slot_title
  document.getElementById("startTime").value = timeslot.start_time
  document.getElementById("endTime").value = timeslot.end_time
  document.getElementById("timeslotType").value = timeslot.type || getTimeType(timeslot.start_time)
  document.getElementById("timeslotStatus").value = timeslot.status || "active"
  document.getElementById("maxOrders").value = timeslot.max_orders || ""
  document.getElementById("priority").value = timeslot.priority || 1
  document.getElementById("description").value = timeslot.description || ""
  document.getElementById("isPeakHour").checked = timeslot.is_peak_hour || false

  // Update modal title
  document.getElementById("timeslotModalTitle").textContent = "Edit Timeslot"

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("addTimeslotModal"))
  modal.show()
}

async function toggleTimeslotStatus(timeslotId) {
  const timeslot = allTimeslots.find((t) => t.id === timeslotId)
  if (!timeslot) return

  const newStatus = (timeslot.status || "active") === "active" ? "inactive" : "active"

  try {
    const [success, result] = await callApi(
      "PATCH",
      `${timeslots_url}${timeslotId}/`,
      { status: newStatus },
      csrf_token,
    )

    if (success && result.success) {
      showToast("success", "Success", `Timeslot ${newStatus === "active" ? "activated" : "deactivated"}`)
      loadTimeslots()
    } else {
      showToast("error", "Error", "Failed to update timeslot status")
    }
  } catch (error) {
    console.error("Error updating timeslot status:", error)
    showToast("error", "Error", "Failed to update timeslot status")
  }
}

function deleteTimeslot(timeslotId) {
  timeslotToDelete = timeslotId
  const modal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"))
  modal.show()
}

async function confirmDelete() {
  if (!timeslotToDelete) return

  try {
    const [success, result] = await callApi("DELETE", `${timeslots_url}${timeslotToDelete}/`, null, csrf_token)

    if (success && result.success) {
      showToast("success", "Success", "Timeslot deleted successfully")
      loadTimeslots()
    } else {
      showToast("error", "Error", "Failed to delete timeslot")
    }
  } catch (error) {
    console.error("Error deleting timeslot:", error)
    showToast("error", "Error", "Failed to delete timeslot")
  } finally {
    timeslotToDelete = null
    bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal")).hide()
  }
}

function handleBulkDelete() {
  if (selectedTimeslots.length === 0) return

  if (
    confirm(
      `Are you sure you want to delete ${selectedTimeslots.length} selected timeslots? This action cannot be undone.`,
    )
  ) {
    bulkDeleteTimeslots()
  }
}

async function bulkDeleteTimeslots() {
  showLoading("Deleting timeslots...")

  try {
    const deletePromises = selectedTimeslots.map((timeslotId) =>
      callApi("DELETE", `${timeslots_url}${timeslotId}/`, null, csrf_token),
    )

    const results = await Promise.all(deletePromises)
    const successCount = results.filter(([success]) => success).length

    if (successCount === selectedTimeslots.length) {
      showToast("success", "Success", `${successCount} timeslots deleted successfully`)
    } else {
      showToast("warning", "Partial Success", `${successCount} of ${selectedTimeslots.length} timeslots deleted`)
    }

    selectedTimeslots = []
    loadTimeslots()
  } catch (error) {
    console.error("Error in bulk delete:", error)
    showToast("error", "Error", "Failed to delete timeslots")
  } finally {
    hideLoading()
  }
}

async function handleBulkToggle() {
  if (selectedTimeslots.length === 0) return

  showLoading("Updating timeslots...")

  try {
    const updatePromises = selectedTimeslots.map(async (timeslotId) => {
      const timeslot = allTimeslots.find((t) => t.id === timeslotId)
      const newStatus = (timeslot.status || "active") === "active" ? "inactive" : "active"
      return callApi("PATCH", `${timeslots_url}${timeslotId}/`, { status: newStatus }, csrf_token)
    })

    const results = await Promise.all(updatePromises)
    const successCount = results.filter(([success]) => success).length

    if (successCount === selectedTimeslots.length) {
      showToast("success", "Success", `${successCount} timeslots updated successfully`)
    } else {
      showToast("warning", "Partial Success", `${successCount} of ${selectedTimeslots.length} timeslots updated`)
    }

    selectedTimeslots = []
    loadTimeslots()
  } catch (error) {
    console.error("Error in bulk toggle:", error)
    showToast("error", "Error", "Failed to update timeslots")
  } finally {
    hideLoading()
  }
}

async function saveTimeslot() {
  const form = document.getElementById("timeslotForm")
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  const timeslotData = {
    time_slot_title: document.getElementById("timeslotTitle").value,
    start_time: document.getElementById("startTime").value,
    end_time: document.getElementById("endTime").value,
    type: document.getElementById("timeslotType").value,
    status: document.getElementById("timeslotStatus").value,
    max_orders: document.getElementById("maxOrders").value || null,
    priority: document.getElementById("priority").value || 1,
    description: document.getElementById("description").value || null,
    is_peak_hour: document.getElementById("isPeakHour").checked,
  }

  try {
    showLoading("Saving timeslot...")

    const timeslotId = document.getElementById("timeslotId").value
    let success, result

    if (timeslotId) {
      // Update existing timeslot
      ;[success, result] = await callApi("PUT", `${timeslots_url}${timeslotId}/`, timeslotData, csrf_token)
    } else {
      // Create new timeslot
      ;[success, result] = await callApi("POST", timeslots_url, timeslotData, csrf_token)
    }

    if (success && result.success) {
      showToast("success", "Success", `Timeslot ${timeslotId ? "updated" : "created"} successfully`)
      bootstrap.Modal.getInstance(document.getElementById("addTimeslotModal")).hide()
      resetTimeslotForm()
      loadTimeslots()
    } else {
      showToast("error", "Error", result.message || `Failed to ${timeslotId ? "update" : "create"} timeslot`)
    }
  } catch (error) {
    console.error("Error saving timeslot:", error)
    showToast("error", "Error", "Failed to save timeslot")
  } finally {
    hideLoading()
  }
}

function resetTimeslotForm() {
  document.getElementById("timeslotForm").reset()
  document.getElementById("timeslotId").value = ""
  document.getElementById("timeslotModalTitle").textContent = "Add New Timeslot"
  document.getElementById("priority").value = 1
  editingTimeslot = null
}

function validateTimeRange() {
  const startTime = document.getElementById("startTime").value
  const endTime = document.getElementById("endTime").value

  if (startTime && endTime) {
    const start = new Date(`2000-01-01 ${startTime}`)
    const end = new Date(`2000-01-01 ${endTime}`)

    if (start >= end) {
      document.getElementById("endTime").setCustomValidity("End time must be after start time")
    } else {
      document.getElementById("endTime").setCustomValidity("")
    }
  }
}

function createQuickSlots(type) {
  const modal = new bootstrap.Modal(document.getElementById("bulkCreateModal"))

  // Set default values based on type
  const defaults = {
    morning: { start: "06:00", end: "12:00", duration: "2", prefix: "Morning Slot" },
    afternoon: { start: "12:00", end: "18:00", duration: "2", prefix: "Afternoon Slot" },
    evening: { start: "18:00", end: "22:00", duration: "2", prefix: "Evening Slot" },
    "24hour": { start: "00:00", end: "23:59", duration: "4", prefix: "24/7 Slot" },
  }

  const config = defaults[type]
  if (config) {
    document.getElementById("bulkStartTime").value = config.start
    document.getElementById("bulkEndTime").value = config.end
    document.getElementById("slotDuration").value = config.duration
    document.getElementById("bulkType").value = type === "24hour" ? "morning" : type
    document.getElementById("titlePrefix").value = config.prefix
    document.getElementById("bulkCreateTitle").textContent = `Create ${config.prefix}s`
  }

  modal.show()
}

async function createBulkTimeslots() {
  const form = document.getElementById("bulkCreateForm")
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  const startTime = document.getElementById("bulkStartTime").value
  const endTime = document.getElementById("bulkEndTime").value
  const duration = Number.parseInt(document.getElementById("slotDuration").value)
  const type = document.getElementById("bulkType").value
  const prefix = document.getElementById("titlePrefix").value

  try {
    showLoading("Creating timeslots...")

    const timeslots = generateTimeslots(startTime, endTime, duration, type, prefix)

    const createPromises = timeslots.map((timeslot) => callApi("POST", timeslots_url, timeslot, csrf_token))

    const results = await Promise.all(createPromises)
    const successCount = results.filter(([success]) => success).length

    if (successCount === timeslots.length) {
      showToast("success", "Success", `${successCount} timeslots created successfully`)
    } else {
      showToast("warning", "Partial Success", `${successCount} of ${timeslots.length} timeslots created`)
    }

    bootstrap.Modal.getInstance(document.getElementById("bulkCreateModal")).hide()
    loadTimeslots()
  } catch (error) {
    console.error("Error creating bulk timeslots:", error)
    showToast("error", "Error", "Failed to create timeslots")
  } finally {
    hideLoading()
  }
}

function generateTimeslots(startTime, endTime, duration, type, prefix) {
  const timeslots = []
  const start = new Date(`2000-01-01 ${startTime}`)
  const end = new Date(`2000-01-01 ${endTime}`)

  if (end <= start) {
    end.setDate(end.getDate() + 1)
  }

  let current = new Date(start)
  let slotNumber = 1

  while (current < end) {
    const slotEnd = new Date(current.getTime() + duration * 60 * 60 * 1000)

    if (slotEnd > end) break

    const startTimeStr = current.toTimeString().slice(0, 5)
    const endTimeStr = slotEnd.toTimeString().slice(0, 5)

    timeslots.push({
      time_slot_title: `${prefix} ${slotNumber}`,
      start_time: startTimeStr,
      end_time: endTimeStr,
      type: type,
      status: "active",
      priority: slotNumber,
    })

    current = new Date(slotEnd)
    slotNumber++
  }

  return timeslots
}

function toggleTimeline() {
  const container = document.getElementById("timelineContainer")
  const button = document.getElementById("toggleTimelineBtn")

  if (container.style.display === "none") {
    container.style.display = "block"
    button.innerHTML = '<i class="fas fa-eye-slash me-1"></i> Hide Timeline'
    renderTimeline()
  } else {
    container.style.display = "none"
    button.innerHTML = '<i class="fas fa-eye me-1"></i> Show Timeline'
  }
}

function renderTimeline() {
  const timelineView = document.getElementById("timelineView")
  if (!timelineView || timelineView.parentElement.style.display === "none") return

  timelineView.innerHTML = ""

  // Sort timeslots by start time
  const sortedTimeslots = [...allTimeslots].sort((a, b) => a.start_time.localeCompare(b.start_time))

  if (sortedTimeslots.length === 0) {
    timelineView.innerHTML = '<p class="text-muted">No timeslots to display</p>'
    return
  }

  // Create timeline
  const timelineContainer = document.createElement("div")
  timelineContainer.className = "timeline-container"
  timelineContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 400px;
        overflow-y: auto;
    `

  sortedTimeslots.forEach((timeslot) => {
    const timelineItem = document.createElement("div")
    timelineItem.className = "timeline-item d-flex align-items-center p-3 border rounded"
    timelineItem.style.cssText = `
            background: ${(timeslot.status || "active") === "active" ? "var(--surface-color)" : "var(--surface-color-2)"};
            border-color: ${timeslot.is_peak_hour ? "var(--warning-color)" : "var(--border-color)"} !important;
        `

    const timeRange = `${formatTime(timeslot.start_time)} - ${formatTime(timeslot.end_time)}`
    const duration = calculateDuration(timeslot.start_time, timeslot.end_time)

    timelineItem.innerHTML = `
            <div class="me-3">
                <i class="fas fa-clock text-primary"></i>
            </div>
            <div class="flex-grow-1">
                <h6 class="mb-1">${timeslot.time_slot_title}</h6>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-light text-dark">${timeRange}</span>
                    <span class="badge bg-secondary">${duration}</span>
                    ${getTypeBadge(timeslot.type || getTimeType(timeslot.start_time))}
                    ${(timeslot.status || "active") === "active" ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>'}
                    ${timeslot.is_peak_hour ? '<span class="badge bg-warning">Peak</span>' : ""}
                </div>
            </div>
            <div class="text-end">
                <small class="text-muted">${timeslot.usage_count || Math.floor(Math.random() * 100)} orders</small>
            </div>
        `

    timelineContainer.appendChild(timelineItem)
  })

  timelineView.appendChild(timelineContainer)
}

function exportData(format) {
  if (allTimeslots.length === 0) {
    showToast("warning", "No Data", "No timeslots to export")
    return
  }

  const data = allTimeslots.map((timeslot) => ({
    "Timeslot Title": timeslot.time_slot_title,
    "Start Time": timeslot.start_time,
    "End Time": timeslot.end_time,
    Duration: calculateDuration(timeslot.start_time, timeslot.end_time),
    Type: timeslot.type || getTimeType(timeslot.start_time),
    Status: timeslot.status || "active",
    "Max Orders": timeslot.max_orders || "Unlimited",
    Priority: timeslot.priority || 1,
    "Peak Hour": timeslot.is_peak_hour ? "Yes" : "No",
    Description: timeslot.description || "",
    Created: new Date(timeslot.created_at || Date.now()).toLocaleDateString(),
  }))

  if (format === "csv") {
    downloadCSV(data, "timeslots.csv")
  }

  showToast("success", "Export Started", `Timeslots export as ${format.toUpperCase()} has started`)
}

function exportSchedule() {
  if (allTimeslots.length === 0) {
    showToast("warning", "No Data", "No timeslots to export")
    return
  }

  // Sort timeslots by start time for schedule view
  const sortedTimeslots = [...allTimeslots].sort((a, b) => a.start_time.localeCompare(b.start_time))

  const scheduleData = sortedTimeslots.map((timeslot) => ({
    "Time Range": `${formatTime(timeslot.start_time)} - ${formatTime(timeslot.end_time)}`,
    "Timeslot Title": timeslot.time_slot_title,
    Duration: calculateDuration(timeslot.start_time, timeslot.end_time),
    Type: timeslot.type || getTimeType(timeslot.start_time),
    Status: timeslot.status || "active",
    "Peak Hour": timeslot.is_peak_hour ? "Yes" : "No",
    "Max Orders": timeslot.max_orders || "Unlimited",
  }))

  downloadCSV(scheduleData, "delivery_schedule.csv")
  showToast("success", "Schedule Exported", "Delivery schedule exported successfully")
}

function downloadCSV(data, filename) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) => headers.map((header) => `"${row[header]}"`).join(",")),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

// Reset form when modal is hidden
document.getElementById("addTimeslotModal").addEventListener("hidden.bs.modal", resetTimeslotForm)

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
    loadingEl.remove();
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
