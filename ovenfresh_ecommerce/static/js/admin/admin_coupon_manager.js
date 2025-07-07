let csrf_token = null
let currentCouponId = null
let allCoupons = []

function initializeCouponManager(csrfTokenParam) {
  csrf_token = csrfTokenParam
  loadCoupons()
}

async function loadCoupons() {
  try {
    showLoading()

    const [success, result] = await callApi("GET", "/product-api/coupons/")

    if (success && result.success) {
      allCoupons = result.data
      renderCouponsTable(allCoupons)
    } else {
      showNotification("Error loading coupons", "error")
    }
  } catch (error) {
    console.error("Error loading coupons:", error)
    showNotification("Error loading coupons", "error")
  } finally {
    hideLoading()
  }
}

function renderCouponsTable(coupons) {
  const tbody = document.getElementById("couponsTableBody")

  if (!coupons || coupons.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-tags fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No coupons found</p>
                </td>
            </tr>
        `
    return
  }

  tbody.innerHTML = coupons
    .map((coupon) => {
      const status = getCouponStatus(coupon)
      const statusBadge = getStatusBadge(status)

      return `
            <tr>
                <td>
                    <strong>${coupon.coupon_code}</strong>
                </td>
                <td>
                    <span class="badge ${coupon.discount_type === "percentage" ? "bg-info" : "bg-success"}">
                        ${coupon.discount_type === "percentage" ? "Percentage" : "Fixed Amount"}
                    </span>
                </td>
                <td>
                    <strong>
                        ${coupon.discount_type === "percentage" ? coupon.discount_value + "%" : "₹" + coupon.discount_value}
                    </strong>
                </td>
                <td>₹${coupon.minimum_order_amount}</td>
                <td>
                    ${coupon.usage_count}${coupon.usage_limit ? "/" + coupon.usage_limit : "/∞"}
                </td>
                <td>${formatDateTime(coupon.valid_until)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editCoupon(${coupon.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCoupon(${coupon.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
    })
    .join("")
}

function getCouponStatus(coupon) {
  const now = new Date()
  const validFrom = new Date(coupon.valid_from)
  const validUntil = new Date(coupon.valid_until)

  if (!coupon.is_active) return "inactive"
  if (now < validFrom) return "upcoming"
  if (now > validUntil) return "expired"
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return "exhausted"

  return "active"
}

function getStatusBadge(status) {
  const badges = {
    active: '<span class="badge bg-success">Active</span>',
    inactive: '<span class="badge bg-secondary">Inactive</span>',
    expired: '<span class="badge bg-danger">Expired</span>',
    upcoming: '<span class="badge bg-warning">Upcoming</span>',
    exhausted: '<span class="badge bg-dark">Exhausted</span>',
  }

  return badges[status] || '<span class="badge bg-secondary">Unknown</span>'
}

function filterCoupons() {
  const statusFilter = document.getElementById("statusFilter").value
  const typeFilter = document.getElementById("typeFilter").value
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()

  const filteredCoupons = allCoupons.filter((coupon) => {
    const matchesStatus = !statusFilter || getCouponStatus(coupon) === statusFilter
    const matchesType = !typeFilter || coupon.discount_type === typeFilter
    const matchesSearch = !searchTerm || coupon.coupon_code.toLowerCase().includes(searchTerm)

    return matchesStatus && matchesType && matchesSearch
  })

  renderCouponsTable(filteredCoupons)
}

function editCoupon(couponId) {
  const coupon = allCoupons.find((c) => c.id === couponId)
  if (!coupon) return

  currentCouponId = couponId

  // Populate form
  document.getElementById("couponCode").value = coupon.coupon_code
  document.getElementById("discountType").value = coupon.discount_type
  document.getElementById("discountValue").value = coupon.discount_value
  document.getElementById("minimumOrderAmount").value = coupon.minimum_order_amount
  document.getElementById("maximumDiscountAmount").value = coupon.maximum_discount_amount || ""
  document.getElementById("usageLimit").value = coupon.usage_limit || ""
  document.getElementById("validFrom").value = formatDateTimeForInput(coupon.valid_from)
  document.getElementById("validUntil").value = formatDateTimeForInput(coupon.valid_until)
  document.getElementById("isActive").checked = coupon.is_active

  // Update modal title
  document.getElementById("addCouponModalLabel").textContent = "Edit Coupon"

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("addCouponModal"))
  modal.show()
}

async function saveCoupon() {
  const formData = {
    coupon_code: document.getElementById("couponCode").value.trim(),
    discount_type: document.getElementById("discountType").value,
    discount_value: Number.parseFloat(document.getElementById("discountValue").value),
    minimum_order_amount: Number.parseFloat(document.getElementById("minimumOrderAmount").value) || 0,
    maximum_discount_amount: Number.parseFloat(document.getElementById("maximumDiscountAmount").value) || null,
    usage_limit: Number.parseInt(document.getElementById("usageLimit").value) || null,
    valid_from: document.getElementById("validFrom").value,
    valid_until: document.getElementById("validUntil").value,
    is_active: document.getElementById("isActive").checked,
  }

  // Validation
  if (
    !formData.coupon_code ||
    !formData.discount_type ||
    !formData.discount_value ||
    !formData.valid_from ||
    !formData.valid_until
  ) {
    showNotification("Please fill all required fields", "error")
    return
  }

  if (new Date(formData.valid_from) >= new Date(formData.valid_until)) {
    showNotification("Valid until date must be after valid from date", "error")
    return
  }

  try {
    showLoading()

    let url = "/product-api/coupons/"
    let method = "POST"

    if (currentCouponId) {
      url += `${currentCouponId}/`
      method = "PUT"
    }

    const [success, result] = await callApi(method, url, formData, csrf_token)

    if (success && result.success) {
      showNotification(currentCouponId ? "Coupon updated successfully" : "Coupon created successfully", "success")

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("addCouponModal"))
      modal.hide()

      // Reset form
      resetCouponForm()

      // Reload coupons
      await loadCoupons()
    } else {
      showNotification(result.error || "Error saving coupon", "error")
    }
  } catch (error) {
    console.error("Error saving coupon:", error)
    showNotification("Error saving coupon", "error")
  } finally {
    hideLoading()
  }
}

async function deleteCoupon(couponId) {
  if (!confirm("Are you sure you want to delete this coupon?")) return

  try {
    showLoading()

    const [success, result] = await callApi("DELETE", `/product-api/coupons/${couponId}/`, null, csrf_token)

    if (success && result.success) {
      showNotification("Coupon deleted successfully", "success")
      await loadCoupons()
    } else {
      showNotification(result.error || "Error deleting coupon", "error")
    }
  } catch (error) {
    console.error("Error deleting coupon:", error)
    showNotification("Error deleting coupon", "error")
  } finally {
    hideLoading()
  }
}

function resetCouponForm() {
  document.getElementById("couponForm").reset()
  document.getElementById("isActive").checked = true
  document.getElementById("addCouponModalLabel").textContent = "Add New Coupon"
  currentCouponId = null
}

// Event listeners
document.getElementById("addCouponModal").addEventListener("hidden.bs.modal", () => {
  resetCouponForm()
})

// Utility functions
function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateTimeForInput(dateString) {
  const date = new Date(dateString)
  return date.toISOString().slice(0, 16)
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
