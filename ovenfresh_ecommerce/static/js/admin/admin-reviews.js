// Admin Reviews Management JavaScript
let csrf_token = null
let admin_reviews_url = null
let admin_reviews_stats_url = null

let currentPage = 1
const currentFilters = {
  status: "all",
  rating: "",
  search: "",
}
let selectedReviews = []
let currentReviewId = null


async function AdminReviews(
  csrf_token_param,
  admin_reviews_url_param,
  admin_reviews_stats_url_param,

) {
  csrf_token = csrf_token_param
  admin_reviews_url = admin_reviews_url_param
  admin_reviews_stats_url = admin_reviews_stats_url_param || admin_reviews_url_param

  // Initialize the admin reviews functionality
  initializeEventListeners()
  await loadReviews()
  await loadStats()
}

function initializeEventListeners() {
  // Search functionality
  document.getElementById("searchBtn").addEventListener("click", handleSearch)

  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  })

  // Filter functionality
  document.getElementById("statusFilter").addEventListener("change", (e) => {
    currentFilters.status = e.target.value
    currentPage = 1
    loadReviews()
  })

  document.getElementById("ratingFilter").addEventListener("change", (e) => {
    currentFilters.rating = e.target.value
    currentPage = 1
    loadReviews()
  })

  // Refresh button
  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadReviews()
    loadStats()
    showToast("success", "Refreshed", "Reviews list has been refreshed")
  })

  // Select all checkbox
  document.getElementById("selectAll").addEventListener("change", (e) => {
    handleSelectAll(e.target.checked)
  })

  // Bulk actions
  document.getElementById("bulkApprove").addEventListener("click", () => {
    handleBulkAction("approve")
  })

  document.getElementById("bulkReject").addEventListener("click", () => {
    handleBulkAction("reject")
  })

  // Modal actions
  document.getElementById("modalApproveBtn").addEventListener("click", () => {
    handleReviewAction(currentReviewId, "approve")
  })

  document.getElementById("modalRejectBtn").addEventListener("click", () => {
    handleReviewAction(currentReviewId, "reject")
  })

  document.getElementById("modalDeleteBtn").addEventListener("click", () => {
    handleReviewDelete(currentReviewId)
  })
}

async function loadReviews() {
  try {
    showLoading("Loading reviews...")

    const params = new URLSearchParams({
      page: currentPage,
      limit: 10,
      status: currentFilters.status,
      search: currentFilters.search,
    })

    if (currentFilters.rating) {
      params.append("rating", currentFilters.rating)
    }

    const [success, result] = await callApi("GET", `${admin_reviews_url}?${params}`)

    if (success && result.success) {
      renderReviews(result.data.reviews || result.data)
      renderPagination(result.data)
      updatePaginationInfo(result.data)
    } else {
      showToast("error", "Error", "Failed to load reviews: " + (result.error || "Unknown error"))
      showEmptyState()
    }
  } catch (error) {
    console.error("Error loading reviews:", error)
    showToast("error", "Error", "Error loading reviews: " + error.message)
    showEmptyState()
  } finally {
    hideLoading()
  }
}

async function loadStats() {
  try {
    const [success, result] = await callApi("GET", `${admin_reviews_stats_url}?status=all&limit=1000`)

    if (success && result.success) {
      const reviews = result.data.reviews || result.data
      const pending = reviews.filter((r) => !r.is_approved_admin && r.is_active).length
      const approved = reviews.filter((r) => r.is_approved_admin && r.is_active).length
      const total = reviews.length
      const avgRating =
        reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.ratings, 0) / reviews.length).toFixed(1) : "0.0"

      document.getElementById("pendingCount").textContent = pending
      document.getElementById("approvedCount").textContent = approved
      document.getElementById("totalCount").textContent = total
      document.getElementById("avgRating").textContent = avgRating
    }
  } catch (error) {
    console.error("Error loading stats:", error)
  }
}

function renderReviews(reviews) {
  const tbody = document.getElementById("reviewsTableBody")

  if (!reviews || reviews.length === 0) {
    showEmptyState()
    return
  }
  console.log("Rendering reviews:", reviews)
  tbody.innerHTML = reviews
    .map(
      (review) => `
        <tr>
            <td>
                <div class="form-check">
                    <input class="form-check-input review-checkbox" type="checkbox" 
                           value="${review.id}" onchange="handleCheckboxChange(this)">
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${
                      review.product_photos && review.product_photos.length > 0
                        ? review.product_photos[0]
                        : "/static/img/placeholder.png"
                    }" 
                         alt="Product" class="product-image-small me-2" 
                         style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                    <div>
                        <div class="fw-medium">${review.product_title || "Unknown Product"}</div>
                        <small class="text-muted">ID: ${review.product_id}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="rating-stars">
                    ${generateStars(review.ratings)}
                </div>
                <small class="text-muted">${review.ratings}/5</small>
            </td>
            <td>
                <div class="review-text" title="${review.review_text}" 
                     style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${review.review_text}
                </div>
            </td>
            <td>
                <div>${formatDate(review.created_at)}</div>
            </td>
            <td>
                ${getStatusBadge(review)}
            </td>
            <td>
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-outline-secondary" 
                            onclick="showReviewModal(${review.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${
                      !review.is_approved_admin && review.is_active
                        ? `
                        <button type="button" class="btn btn-sm btn-outline-success" 
                                onclick="handleReviewAction(${review.id}, 'approve')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                    `
                        : ""
                    }
                    ${
                      review.is_approved_admin || review.is_active
                        ? `
                        <button type="button" class="btn btn-sm btn-outline-danger" 
                                onclick="handleReviewAction(${review.id}, 'reject')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    `
                        : ""
                    }
                    <button type="button" class="btn btn-sm btn-outline-danger" 
                            onclick="handleReviewDelete(${review.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `,
    )
    .join("")
}

function generateStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  let stars = ""
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star text-warning"></i>'
  }
  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt text-warning"></i>'
  }
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star text-warning"></i>'
  }

  return stars
}

function getStatusBadge(review) {
  if (!review.is_active) {
    return '<span class="badge bg-danger">Rejected</span>'
  } else if (review.is_approved_admin) {
    return '<span class="badge bg-success">Approved</span>'
  } else {
    return '<span class="badge bg-warning">Pending</span>'
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  )
}

function renderPagination(data) {
  const pagination = document.getElementById("pagination")
  const { page, total_pages } = data

  if (!total_pages || total_pages <= 1) {
    pagination.innerHTML = ""
    return
  }

  let paginationHTML = ""

  // Previous button
  paginationHTML += `
        <li class="page-item ${page === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${page - 1})" tabindex="-1">Previous</a>
        </li>
    `

  // Page numbers
  for (let i = 1; i <= total_pages; i++) {
    if (i === page || i === 1 || i === total_pages || (i >= page - 1 && i <= page + 1)) {
      paginationHTML += `
                <li class="page-item ${i === page ? "active" : ""}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `
    } else if (i === page - 2 || i === page + 2) {
      paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>'
    }
  }

  // Next button
  paginationHTML += `
        <li class="page-item ${page === total_pages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${page + 1})">Next</a>
        </li>
    `

  pagination.innerHTML = paginationHTML
}

function updatePaginationInfo(data) {
  const { page, limit, total } = data
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  document.getElementById("paginationInfo").textContent = `Showing ${start} to ${end} of ${total} entries`
}

function changePage(page) {
  currentPage = page
  loadReviews()
}

function handleSearch() {
  currentFilters.search = document.getElementById("searchInput").value
  currentPage = 1
  loadReviews()
}

function handleSelectAll(checked) {
  const checkboxes = document.querySelectorAll(".review-checkbox")
  selectedReviews = []

  checkboxes.forEach((checkbox) => {
    checkbox.checked = checked
    if (checked) {
      selectedReviews.push(Number.parseInt(checkbox.value))
    }
  })

  updateBulkActionButtons()
}

function handleCheckboxChange(checkbox) {
  const reviewId = Number.parseInt(checkbox.value)

  if (checkbox.checked) {
    if (!selectedReviews.includes(reviewId)) {
      selectedReviews.push(reviewId)
    }
  } else {
    selectedReviews = selectedReviews.filter((id) => id !== reviewId)
  }

  updateBulkActionButtons()

  // Update select all checkbox
  const checkboxes = document.querySelectorAll(".review-checkbox")
  const checkedBoxes = document.querySelectorAll(".review-checkbox:checked")
  const selectAll = document.getElementById("selectAll")

  selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length
  selectAll.checked = checkedBoxes.length === checkboxes.length
}

function updateBulkActionButtons() {
  const bulkApprove = document.getElementById("bulkApprove")
  const bulkReject = document.getElementById("bulkReject")

  if (selectedReviews.length > 0) {
    bulkApprove.style.display = "inline-block"
    bulkReject.style.display = "inline-block"
    bulkApprove.innerHTML = `<i class="fas fa-check me-1"></i> Approve Selected (${selectedReviews.length})`
    bulkReject.innerHTML = `<i class="fas fa-times me-1"></i> Reject Selected (${selectedReviews.length})`
  } else {
    bulkApprove.style.display = "none"
    bulkReject.style.display = "none"
  }
}

async function handleBulkAction(action) {
  if (selectedReviews.length === 0) {
    showToast("warning", "No Selection", `Please select reviews to ${action}`)
    return
  }

  if (!confirm(`Are you sure you want to ${action} ${selectedReviews.length} selected reviews?`)) {
    return
  }

  try {
    showLoading(`${action}ing selected reviews...`)

    const promises = selectedReviews.map((reviewId) => performReviewAction(reviewId, action))
    const results = await Promise.all(promises)

    const successCount = results.filter(([success, result]) => success && result.success).length

    if (successCount === selectedReviews.length) {
      showToast("success", "Success", `Successfully ${action}d ${successCount} reviews`)
    } else {
      showToast("warning", "Partial Success", `${successCount} of ${selectedReviews.length} reviews ${action}d`)
    }

    selectedReviews = []
    document.getElementById("selectAll").checked = false
    updateBulkActionButtons()
    await loadReviews()
    await loadStats()
  } catch (error) {
    console.error(`Error performing bulk ${action}:`, error)
    showToast("error", "Error", `Error performing bulk ${action}: ${error.message}`)
  } finally {
    hideLoading()
  }
}

async function handleReviewAction(reviewId, action) {
  if (!confirm(`Are you sure you want to ${action} this review?`)) {
    return
  }

  try {
    showLoading(`${action}ing review...`)

    const [success, result] = await performReviewAction(reviewId, action)

    if (success && result.success) {
      showToast("success", "Success", `Review ${action}d successfully`)
      await loadReviews()
      await loadStats()

      // Close modal if open
      const modal = bootstrap.Modal.getInstance(document.getElementById("reviewModal"))
      if (modal) {
        modal.hide()
      }
    } else {
      showToast("error", "Error", `Error ${action}ing review: ${result.error || "Unknown error"}`)
    }
  } catch (error) {
    console.error(`Error ${action}ing review:`, error)
    showToast("error", "Error", `Error ${action}ing review: ${error.message}`)
  } finally {
    hideLoading()
  }
}

async function performReviewAction(reviewId, action) {
  return await callApi("PUT", `${admin_reviews_url}${reviewId}/`, { action }, csrf_token)
}

async function handleReviewDelete(reviewId) {
  if (!confirm("Are you sure you want to permanently delete this review? This action cannot be undone.")) {
    return
  }

  try {
    showLoading("Deleting review...")

    const [success, result] = await callApi("DELETE", `${admin_reviews_url}${reviewId}/`, null, csrf_token)

    if (success && result.success) {
      showToast("success", "Success", "Review deleted successfully")
      await loadReviews()
      await loadStats()

      // Close modal if open
      const modal = bootstrap.Modal.getInstance(document.getElementById("reviewModal"))
      if (modal) {
        modal.hide()
      }
    } else {
      showToast("error", "Error", "Error deleting review: " + (result.error || "Unknown error"))
    }
  } catch (error) {
    console.error("Error deleting review:", error)
    showToast("error", "Error", "Error deleting review: " + error.message)
  } finally {
    hideLoading()
  }
}

async function showReviewModal(reviewId) {
  try {
    showLoading("Loading review details...")

    // Get review details
    const [success, result] = await callApi("GET", `${admin_reviews_url}?limit=1000`)

    if (success && result.success) {
      const reviews = result.data.reviews || result.data
      const review = reviews.find((r) => r.id === reviewId)

      if (review) {
        currentReviewId = reviewId
        populateModal(review)

        const modal = new bootstrap.Modal(document.getElementById("reviewModal"))
        modal.show()
      } else {
        showToast("error", "Error", "Review not found")
      }
    } else {
      showToast("error", "Error", "Error loading review details: " + (result.error || "Unknown error"))
    }
  } catch (error) {
    console.error("Error loading review details:", error)
    showToast("error", "Error", "Error loading review details: " + error.message)
  } finally {
    hideLoading()
  }
}

function populateModal(review) {
  document.getElementById("modalProductImage").src =
    review.product_photos && review.product_photos.length > 0 ? review.product_photos[0] : "/static/img/placeholder.png"

  document.getElementById("modalProductTitle").textContent = review.product_title || "Unknown Product"

  document.getElementById("modalRating").innerHTML = generateStars(review.ratings) + ` (${review.ratings}/5)`

  document.getElementById("modalReviewText").textContent = review.review_text
  document.getElementById("modalDate").textContent = formatDate(review.created_at)
  document.getElementById("modalStatus").innerHTML = getStatusBadge(review)

  // Update button visibility
  const approveBtn = document.getElementById("modalApproveBtn")
  const rejectBtn = document.getElementById("modalRejectBtn")

  if (review.is_approved_admin) {
    approveBtn.style.display = "none"
    rejectBtn.textContent = "Reject"
    rejectBtn.innerHTML = '<i class="fas fa-times me-1"></i> Reject'
  } else if (!review.is_active) {
    approveBtn.innerHTML = '<i class="fas fa-check me-1"></i> Approve'
    rejectBtn.style.display = "none"
  } else {
    approveBtn.style.display = "inline-block"
    rejectBtn.style.display = "inline-block"
    approveBtn.innerHTML = '<i class="fas fa-check me-1"></i> Approve'
    rejectBtn.innerHTML = '<i class="fas fa-times me-1"></i> Reject'
  }
}

function showEmptyState() {
  const tbody = document.getElementById("reviewsTableBody")
  tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">No reviews found</p>
            </td>
        </tr>
    `

  document.getElementById("pagination").innerHTML = ""
  document.getElementById("paginationInfo").textContent = "Showing 0 to 0 of 0 entries"
}

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
  if (!toastContainer) {
    // Create toast container if it doesn't exist
    const container = document.createElement("div")
    container.id = "toastContainer"
    container.className = "position-fixed top-0 end-0 p-3"
    container.style.zIndex = "1055"
    document.body.appendChild(container)
  }

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
            <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                    data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `

  document.getElementById("toastContainer").appendChild(toast)

  const bsToast = new bootstrap.Toast(toast)
  bsToast.show()

  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove()
  })
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

// Global functions for onclick handlers
window.handleCheckboxChange = handleCheckboxChange
window.showReviewModal = showReviewModal
window.handleReviewAction = handleReviewAction
window.handleReviewDelete = handleReviewDelete
window.changePage = changePage
