let csrf_token = null
let pincodes_url = null
let timeslots_url = null
let pincode_timeslots_url = null

let extra = null
let currentPage = 1
const itemsPerPage = 10
let totalItems = 0
let currentFilters = {
  search: "",
  status: "",
  state: "",
  sortBy: "created_desc",
}

let allPincodes = []
let allTimeslots = []
let selectedPincodes = []
let pincodeToDelete = null
let editingPincode = null

async function AdminPincodeManager(
  csrf_token_param,
  pincodes_url_param,
  timeslots_url_param,
  pincode_timeslots_url_param,
) {
  csrf_token = csrf_token_param
  pincodes_url = pincodes_url_param
  timeslots_url = timeslots_url_param
  pincode_timeslots_url = pincode_timeslots_url_param

  // Initialize theme
  initializeTheme()

  // Load initial data
  await loadTimeslots()
  await loadPincodes()

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
  document.getElementById("stateFilter").addEventListener("change", handleFilterChange)
  document.getElementById("sortBy").addEventListener("change", handleFilterChange)

  // Clear filters
  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters)

  // Refresh button
  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadPincodes()
    showToast("info", "Refreshed", "Pincodes list has been refreshed")
  })

  // Select all checkbox
  document.getElementById("selectAll").addEventListener("change", handleSelectAll)

  // Bulk delete
  document.getElementById("bulkDeleteBtn").addEventListener("click", handleBulkDelete)

  // Export/Import buttons
  document.getElementById("exportCsvBtn").addEventListener("click", () => exportData("csv"))
  document.getElementById("importCsvBtn").addEventListener("click", () => {
    const modal = new bootstrap.Modal(document.getElementById("importCsvModal"))
    modal.show()
  })

  // Save pincode
  document.getElementById("savePincodeBtn").addEventListener("click", savePincode)

  // Delete confirmation
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete)

  // Import CSV
  document.getElementById("importCsvConfirmBtn").addEventListener("click", importCsv)
  document.getElementById("downloadSampleBtn").addEventListener("click", downloadSampleCsv)

  // Add timeslot
  document.getElementById("addTimeslotBtn").addEventListener("click", addNewTimeslot)

  // Pincode validation
  document.getElementById("pincode").addEventListener("input", validatePincode)
}

async function loadTimeslots() {
  try {
    const [success, result] = await callApi("GET", timeslots_url)
    if (success && result.success) {
      allTimeslots = result.data
      populateTimeslotsInModal()
      updateStats()
    }
  } catch (error) {
    console.error("Error loading timeslots:", error)
    showToast("error", "Error", "Failed to load timeslots")
  }
}

function populateTimeslotsInModal() {
  const container = document.getElementById("timeslotsContainer")
  container.innerHTML = ""

  if (allTimeslots.length === 0) {
    container.innerHTML =
      '<p class="text-muted">No timeslots available. <a href="#" onclick="openTimeslotsManager()">Manage timeslots</a></p>'
    return
  }

  allTimeslots.forEach((timeslot) => {
    const timeslotDiv = document.createElement("div")
    timeslotDiv.className = "form-check mb-2"
    timeslotDiv.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${timeslot.id}" id="timeslot_${timeslot.id}">
            <label class="form-check-label" for="timeslot_${timeslot.id}">
                ${timeslot.time_slot_title} (${timeslot.start_time} - ${timeslot.end_time})
            </label>
            <input class="form-control" type="number" value="0" placeholder="Enter Delivery Charge" id="timeslot_delivery_charge_${timeslot.id}">

        `
    container.appendChild(timeslotDiv)
  })
}

async function loadPincodes() {
  showLoading()

  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage,
      limit: itemsPerPage,
      ...currentFilters,
    })

    const [success, result] = await callApi("GET", `${pincodes_url}?${params}`)

    if (success && result.success) {
      allPincodes = result.data.pincodes || result.data
      totalItems = result.data.total || allPincodes.length

      renderPincodesTable()
      renderPagination()
      updateStats()
      updateSelectedCount()
      populateStateFilter()
    } else {
      showToast("error", "Error", "Failed to load pincodes")
      showEmptyState()
    }
  } catch (error) {
    console.error("Error loading pincodes:", error)
    showToast("error", "Error", "Failed to load pincodes")
    showEmptyState()
  } finally {
    hideLoading()
  }
}

function populateStateFilter() {
  const stateFilter = document.getElementById("stateFilter")
  const currentValue = stateFilter.value

  // Get unique states
  const states = [...new Set(allPincodes.map((p) => p.state).filter(Boolean))].sort()

  stateFilter.innerHTML = '<option value="">All States</option>'
  states.forEach((state) => {
    const option = document.createElement("option")
    option.value = state
    option.textContent = state
    stateFilter.appendChild(option)
  })

  // Restore previous selection
  stateFilter.value = currentValue
}

function renderPincodesTable() {
  const tableBody = document.getElementById("pincodesTableBody")
  const tableContainer = document.getElementById("pincodesTableContainer")
  const emptyState = document.getElementById("emptyState")

  if (!allPincodes || allPincodes.length === 0) {
    showEmptyState()
    return
  }

  tableContainer.style.display = "block"
  emptyState.style.display = "none"

  tableBody.innerHTML = ""

  allPincodes.forEach((pincode) => {
    const row = createPincodeRow(pincode)
    tableBody.appendChild(row)
  })
}

function createPincodeRow(pincode) {
  const row = document.createElement("tr")

  row.innerHTML = `
        <td>
            <div class="form-check">
                <input class="form-check-input pincode-checkbox" type="checkbox" value="${pincode.id}" onchange="handlePincodeSelect(this)">
            </div>
        </td>
        <td>
            <span class="badge bg-primary">${pincode.pincode}</span>
        </td>
        <td>${pincode.area_name}</td>
        <td>${pincode.city}</td>
        <td>${pincode.state}</td>
        <td>${getStatusBadge(pincode.is_active)}</td>
        <td>
            <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="viewPincode(${pincode.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="editPincode(${pincode.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deletePincode(${pincode.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `

  return row
}

function getStatusBadge(status) {
  const statusConfig = {
    active: { class: "bg-success", text: "Active" },
    inactive: { class: "bg-secondary", text: "Inactive" },
  }
  
  let config = null
  
  if (status) {
    config = statusConfig["active"]
  }
  else {
    config = statusConfig["inactive"]
  }
  return `<span class="badge ${config.class}">${config.text}</span>`
}

function showEmptyState() {
  document.getElementById("pincodesTableContainer").style.display = "none"
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
  loadPincodes()
}

function handleSearch() {
  currentFilters.search = document.getElementById("searchInput").value.trim()
  currentPage = 1
  loadPincodes()
}

function handleFilterChange() {
  currentFilters.status = document.getElementById("statusFilter").value
  currentFilters.state = document.getElementById("stateFilter").value
  currentFilters.sortBy = document.getElementById("sortBy").value
  currentPage = 1
  loadPincodes()
}

function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("statusFilter").value = ""
  document.getElementById("stateFilter").value = ""
  document.getElementById("sortBy").value = "created_desc"

  currentFilters = {
    search: "",
    status: "",
    state: "",
    sortBy: "created_desc",
  }

  currentPage = 1
  loadPincodes()
  showToast("info", "Filters Cleared", "All filters have been reset")
}

function handleSelectAll() {
  const selectAll = document.getElementById("selectAll")
  const checkboxes = document.querySelectorAll(".pincode-checkbox")

  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAll.checked
  })

  updateSelectedPincodes()
}

function handlePincodeSelect(checkbox) {
  updateSelectedPincodes()

  // Update select all checkbox
  const checkboxes = document.querySelectorAll(".pincode-checkbox")
  const checkedBoxes = document.querySelectorAll(".pincode-checkbox:checked")
  const selectAll = document.getElementById("selectAll")

  selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length
  selectAll.checked = checkedBoxes.length === checkboxes.length
}

function updateSelectedPincodes() {
  const checkedBoxes = document.querySelectorAll(".pincode-checkbox:checked")
  selectedPincodes = Array.from(checkedBoxes).map((cb) => Number.parseInt(cb.value))
  updateSelectedCount()
}

function updateSelectedCount() {
  const bulkDeleteBtn = document.getElementById("bulkDeleteBtn")

  if (selectedPincodes.length > 0) {
    bulkDeleteBtn.style.display = "inline-block"
    bulkDeleteBtn.innerHTML = `<i class="fas fa-trash me-1"></i> Delete Selected (${selectedPincodes.length})`
  } else {
    bulkDeleteBtn.style.display = "none"
  }
}

function updateStats() {
  // Calculate stats
  const totalPincodes = allPincodes.length
  const activePincodes = allPincodes.filter((p) => (p.is_active) === true).length
  const inactivePincodes = allPincodes.filter((p) => (p.is_active) === false).length
  const totalTimeslots = allTimeslots.length

  // Update DOM
  document.getElementById("totalPincodes").textContent = totalPincodes
  document.getElementById("activePincodes").textContent = activePincodes
  document.getElementById("inactivePincodes").textContent = inactivePincodes
  document.getElementById("totalTimeslots").textContent = totalTimeslots
}

function viewPincode(pincodeId) {
  const pincode = allPincodes.find((p) => p.id === pincodeId)
  if (!pincode) return

  showToast("info", "Pincode Details", `${pincode.pincode} - ${pincode.area_name}, ${pincode.city}, ${pincode.state}`)
}

function editPincode(pincodeId) {
  const pincode = allPincodes.find((p) => p.id === pincodeId)
  if (!pincode) return

  editingPincode = pincode
  console.log(pincode);

  // Populate form
  document.getElementById("pincodeId").value = pincode.id
  document.getElementById("pincode").value = pincode.pincode
  document.getElementById("areaName").value = pincode.area_name
  document.getElementById("city").value = pincode.city
  document.getElementById("state").value = pincode.state
  document.getElementById("pincodeStatus").value = `${pincode.is_active ? "active" : "inactive"}`
  // Update modal title
  document.getElementById("pincodeModalTitle").textContent = "Edit Pincode"

  extra = pincode.delivery_charge;

  for (const i of Object.keys(extra)) {
      console.log(i);
      console.log(extra[i]);
      const checkbox = document.getElementById(`timeslot_${i}`)
      if (checkbox) {
        checkbox.checked = extra[i]['available'];
        document.getElementById(`timeslot_delivery_charge_${i}`).value = extra[i]['charges'];
      }

  }
  // Check associated timeslots
  // if (pincode.delivery_charge) {
  //   const timeslotIds = pincode.delivery_charge.map((t) => t.id)
  //   allTimeslots.forEach((timeslot) => {
  //     const checkbox = document.getElementById(`timeslot_${timeslot.id}`)
  //     if (checkbox) {
  //       checkbox.checked = timeslotIds.includes(timeslot.id)
  //     }
  //   })
  // }

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("addPincodeModal"))
  modal.show()
}

function deletePincode(pincodeId) {
  pincodeToDelete = pincodeId
  const modal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"))
  modal.show()
}

async function confirmDelete() {
  if (!pincodeToDelete) return

  try {
    const [success, result] = await callApi("DELETE", `${pincodes_url}${pincodeToDelete}/`, null, csrf_token)

    if (success && result.success) {
      showToast("success", "Success", "Pincode deleted successfully")
      loadPincodes()
    } else {
      showToast("error", "Error", "Failed to delete pincode")
    }
  } catch (error) {
    console.error("Error deleting pincode:", error)
    showToast("error", "Error", "Failed to delete pincode")
  } finally {
    pincodeToDelete = null
    bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal")).hide()
  }
}

function handleBulkDelete() {
  if (selectedPincodes.length === 0) return

  if (
    confirm(
      `Are you sure you want to delete ${selectedPincodes.length} selected pincodes? This action cannot be undone.`,
    )
  ) {
    bulkDeletePincodes()
  }
}

async function bulkDeletePincodes() {
  showLoading("Deleting pincodes...")

  try {
    const deletePromises = selectedPincodes.map((pincodeId) =>
      callApi("DELETE", `${pincodes_url}${pincodeId}/`, null, csrf_token),
    )

    const results = await Promise.all(deletePromises)
    const successCount = results.filter(([success]) => success).length

    if (successCount === selectedPincodes.length) {
      showToast("success", "Success", `${successCount} pincodes deleted successfully`)
    } else {
      showToast("warning", "Partial Success", `${successCount} of ${selectedPincodes.length} pincodes deleted`)
    }

    selectedPincodes = []
    loadPincodes()
  } catch (error) {
    console.error("Error in bulk delete:", error)
    showToast("error", "Error", "Failed to delete pincodes")
  } finally {
    hideLoading()
  }
}

async function savePincode() {
  const form = document.getElementById("pincodeForm")
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  const pincodeData = {
    pincode: document.getElementById("pincode").value,
    area: document.getElementById("areaName").value,
    city: document.getElementById("city").value,
    state: document.getElementById("state").value,
    is_active: document.getElementById("pincodeStatus").value,
  }

  // Get selected timeslots
  const selectedTimeslots = {}
  allTimeslots.forEach((timeslot) => {
    const checkbox = document.getElementById(`timeslot_${timeslot.id}`)
    let temp_dict = {}
    if (checkbox && checkbox.checked) {
      // selectedTimeslots.push(timeslot.id)
      temp_dict.charges = document.getElementById(`timeslot_delivery_charge_${timeslot.id}`).value;
      temp_dict.available = true;
    }
    else {
      temp_dict.charges = document.getElementById(`timeslot_delivery_charge_${timeslot.id}`).value;
      temp_dict.available = false;
    }
    selectedTimeslots[`${timeslot.id}`] = temp_dict;
  })

  pincodeData.delivery_charge = selectedTimeslots

  try {
    showLoading("Saving pincode...")

    const pincodeId = document.getElementById("pincodeId").value
    let success, result

    if (pincodeId) {
      // Update existing pincode
      ;[success, result] = await callApi("PUT", `${pincodes_url}${pincodeId}/`, pincodeData, csrf_token)
    } else {
      // Create new pincode
      ;[success, result] = await callApi("POST", pincodes_url, pincodeData, csrf_token)
    }

    if (success && result.success) {
      showToast("success", "Success", `Pincode ${pincodeId ? "updated" : "created"} successfully`)
      bootstrap.Modal.getInstance(document.getElementById("addPincodeModal")).hide()
      resetPincodeForm()
      loadPincodes()
    } else {
      showToast("error", "Error", result.message || `Failed to ${pincodeId ? "update" : "create"} pincode`)
    }
  } catch (error) {
    console.error("Error saving pincode:", error)
    showToast("error", "Error", "Failed to save pincode")
  } finally {
    hideLoading()
  }
}

function resetPincodeForm() {
  document.getElementById("pincodeForm").reset()
  document.getElementById("pincodeId").value = ""
  document.getElementById("pincodeModalTitle").textContent = "Add New Pincode"
  editingPincode = null

  // Uncheck all timeslots
  allTimeslots.forEach((timeslot) => {
    const checkbox = document.getElementById(`timeslot_${timeslot.id}`)
    if (checkbox) {
      checkbox.checked = false
    }
  })
}

function validatePincode() {
  const pincodeInput = document.getElementById("pincode")
  const value = pincodeInput.value

  // Remove non-numeric characters
  pincodeInput.value = value.replace(/\D/g, "")

  // Validate length
  if (pincodeInput.value.length !== 6 && pincodeInput.value.length > 0) {
    pincodeInput.setCustomValidity("Pincode must be exactly 6 digits")
  } else {
    pincodeInput.setCustomValidity("")
  }
}

function exportData(format) {
  if (allPincodes.length === 0) {
    showToast("warning", "No Data", "No pincodes to export")
    return
  }

  const data = allPincodes.map((pincode) => ({
    Pincode: pincode.pincode,
    "Area Name": pincode.area_name,
    City: pincode.city,
    State: pincode.state,
    "Delivery Charge": pincode.delivery_charge || "",
    Status: pincode.is_active,
    Timeslots: pincode.timeslots ? pincode.timeslots.length : 0,
  }))

  if (format === "csv") {
    downloadCSV(data, "pincodes.csv")
  }

  showToast("success", "Export Started", `Pincodes export as ${format.toUpperCase()} has started`)
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

function downloadSampleCsv() {
  const sampleData = [
    {
      pincode: "110001",
      area_name: "Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      delivery_charge: "50",
      status: "active",
    },
    {
      pincode: "400001",
      area_name: "Fort",
      city: "Mumbai",
      state: "Maharashtra",
      delivery_charge: "60",
      status: "active",
    },
  ]

  downloadCSV(sampleData, "sample_pincodes.csv")
  showToast("success", "Downloaded", "Sample CSV file downloaded")
}

async function importCsv() {
  const fileInput = document.getElementById("csvFile")
  const file = fileInput.files[0]

  if (!file) {
    showToast("warning", "No File", "Please select a CSV file")
    return
  }

  try {
    showLoading("Importing pincodes...")

    const text = await file.text()
    const lines = text.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    const pincodes = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      const pincode = {}

      headers.forEach((header, index) => {
        pincode[header.toLowerCase().replace(" ", "_")] = values[index] || ""
      })

      if (pincode.pincode) {
        pincodes.push(pincode)
      }
    }

    // Import pincodes
    let successCount = 0
    for (const pincodeData of pincodes) {
      try {
        const [success] = await callApi("POST", pincodes_url, pincodeData, csrf_token)
        if (success) successCount++
      } catch (error) {
        console.error("Error importing pincode:", error)
      }
    }

    showToast("success", "Import Complete", `${successCount} of ${pincodes.length} pincodes imported successfully`)
    bootstrap.Modal.getInstance(document.getElementById("importCsvModal")).hide()
    loadPincodes()
  } catch (error) {
    console.error("Error importing CSV:", error)
    showToast("error", "Import Failed", "Failed to import CSV file")
  } finally {
    hideLoading()
  }
}

function openTimeslotsManager() {
  const modal = new bootstrap.Modal(document.getElementById("timeslotsModal"))
  loadTimeslotsInModal()
  modal.show()
}

function loadTimeslotsInModal() {
  const container = document.getElementById("timeslotsList")
  container.innerHTML = ""

  if (allTimeslots.length === 0) {
    container.innerHTML = '<p class="text-muted">No timeslots available.</p>'
    return
  }

  allTimeslots.forEach((timeslot) => {
    const timeslotDiv = document.createElement("div")
    timeslotDiv.className = "card mb-2"
    timeslotDiv.innerHTML = `
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${timeslot.time_slot_title}</strong>
                        <small class="text-muted">(${timeslot.start_time} - ${timeslot.end_time})</small>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="editTimeslot(${timeslot.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteTimeslot(${timeslot.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `
    container.appendChild(timeslotDiv)
  })
}

function addNewTimeslot() {
  const title = prompt("Enter timeslot title:")
  const startTime = prompt("Enter start time (HH:MM):")
  const endTime = prompt("Enter end time (HH:MM):")

  if (title && startTime && endTime) {
    const timeslotData = {
      time_slot_title: title,
      start_time: startTime,
      end_time: endTime,
    }

    callApi("POST", timeslots_url, timeslotData, csrf_token).then(([success, result]) => {
      if (success && result.success) {
        showToast("success", "Success", "Timeslot added successfully")
        loadTimeslots()
        loadTimeslotsInModal()
      } else {
        showToast("error", "Error", "Failed to add timeslot")
      }
    })
  }
}

function editTimeslot(timeslotId) {
  const timeslot = allTimeslots.find((t) => t.id === timeslotId)
  if (!timeslot) return

  const title = prompt("Enter timeslot title:", timeslot.time_slot_title)
  const startTime = prompt("Enter start time (HH:MM):", timeslot.start_time)
  const endTime = prompt("Enter end time (HH:MM):", timeslot.end_time)

  if (title && startTime && endTime) {
    const timeslotData = {
      time_slot_title: title,
      start_time: startTime,
      end_time: endTime,
    }

    callApi("PUT", `${timeslots_url}${timeslotId}/`, timeslotData, csrf_token).then(([success, result]) => {
      if (success && result.success) {
        showToast("success", "Success", "Timeslot updated successfully")
        loadTimeslots()
        loadTimeslotsInModal()
      } else {
        showToast("error", "Error", "Failed to update timeslot")
      }
    })
  }
}

function deleteTimeslot(timeslotId) {
  if (confirm("Are you sure you want to delete this timeslot?")) {
    callApi("DELETE", `${timeslots_url}${timeslotId}/`, null, csrf_token).then(([success, result]) => {
      if (success && result.success) {
        showToast("success", "Success", "Timeslot deleted successfully")
        loadTimeslots()
        loadTimeslotsInModal()
      } else {
        showToast("error", "Error", "Failed to delete timeslot")
      }
    })
  }
}

// Reset form when modal is hidden
document.getElementById("addPincodeModal").addEventListener("hidden.bs.modal", resetPincodeForm)

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

