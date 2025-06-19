let csrf_token = null
let all_products_url = null
let products_url = null
let categories_url = null
let variations_url = null

let category__id = null

let currentPage = 1
const itemsPerPage = 10
let totalItems = 0
let currentFilters = {
  search: "",
  category: "",
  sub_category: "",
  status: "",
  sortBy: "created_desc",
}

let allProducts = []
let allCategories = []
let selectedProducts = []
let productToDelete = null

async function AdminAllProducts(
  csrf_token_param,
  all_products_url_param,
  products_url_param,
  categories_url_param,
  variations_url_param,
) {
  csrf_token = csrf_token_param
  all_products_url = all_products_url_param
  products_url = products_url_param
  categories_url = categories_url_param
  variations_url = variations_url_param

  // Initialize theme
  initializeTheme()

  // Load initial data
  await loadCategories()
  await loadProducts()

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
  document.getElementById("categoryFilter").addEventListener("change", handleFilterChange)
  document.getElementById("subCategoryFilter").addEventListener("change", handleFilterChange)
  document.getElementById("statusFilter").addEventListener("change", handleFilterChange)
  document.getElementById("sortBy").addEventListener("change", handleFilterChange)

  // Clear filters
  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters)

  // Refresh button
  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadProducts()
    showToast("info", "Refreshed", "Products list has been refreshed")
  })

  // Select all checkbox
  document.getElementById("selectAll").addEventListener("change", handleSelectAll)

  // Bulk delete
  document.getElementById("bulkDeleteBtn").addEventListener("click", handleBulkDelete)

  // Export buttons
  document.getElementById("exportCsvBtn").addEventListener("click", () => exportData("csv"))
  document.getElementById("exportExcelBtn").addEventListener("click", () => exportData("excel"))

  // Delete confirmation
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete)
}

async function loadCategories() {
  try {
    const [success, result] = await callApi("GET", categories_url)
    if (success && result.success) {
      allCategories = result.data
      populateCategoryFilter()
      updateStats()
    }
  } catch (error) {
    console.error("Error loading categories:", error)
    showToast("error", "Error", "Failed to load categories")
  }
}

function populateCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter")
  categoryFilter.innerHTML = '<option value="">All Categories</option>'

  allCategories.forEach((category) => {
    const option = document.createElement("option")
    option.value = category.category_id
    option.textContent = category.title
    categoryFilter.appendChild(option)
  })
}

// Update the loadProducts function to use correct API parameters
async function loadProducts() {
  showLoading()

  try {
    // Build query parameters with correct field names
    const params = new URLSearchParams({
      page: currentPage,
      limit: itemsPerPage,
      search: currentFilters.search,
      category: currentFilters.category,
      sub_category: currentFilters.sub_category,
      status: currentFilters.status,
      sortBy: currentFilters.sortBy,
    })

    const [success, result] = await callApi("GET", `${all_products_url}?${params}`)

    if (success && result.success) {
      allProducts = result.data.products || result.data
      totalItems = result.data.total || allProducts.length

      renderProductsTable()
      renderPagination()
      updateStats()
      updateSelectedCount()
    } else {
      showToast("error", "Error", "Failed to load products")
      showEmptyState()
    }
  } catch (error) {
    console.error("Error loading products:", error)
    showToast("error", "Error", "Failed to load products")
    showEmptyState()
  } finally {
    hideLoading()
  }
}

function renderProductsTable() {
  const tableBody = document.getElementById("productsTableBody")
  const tableContainer = document.getElementById("productsTableContainer")
  const emptyState = document.getElementById("emptyState")

  if (!allProducts || allProducts.length === 0) {
    showEmptyState()
    return
  }

  tableContainer.style.display = "block"
  emptyState.style.display = "none"

  tableBody.innerHTML = ""

  allProducts.forEach((product) => {
    const row = createProductRow(product)
    tableBody.appendChild(row)
  })
}

// Update createProductRow function to use correct field names
function createProductRow(product) {
  const row = document.createElement("tr")

  // Use correct field names from backend
  const categoryName = product.category_name || "Unknown"
  const variationsCount = product.variations_count || 0
  const priceRange = calculatePriceRange(product.variations || [])
  const status = getProductStatus(product)
  const createdDate = new Date(product.created_at || Date.now()).toLocaleDateString()

  row.innerHTML = `
        <td>
            <div class="form-check">
                <input class="form-check-input product-checkbox" type="checkbox" value="${product.product_id}" onchange="handleProductSelect(this)">
            </div>
        </td>
        <td>
            <div class="d-flex align-items-center">
                <img src="${product.photos && product.photos[0] ? product.photos[0] : "/placeholder.svg?height=40&width=40"}" 
                     alt="${product.title}" class="rounded me-3" style="width: 40px; height: 40px; object-fit: cover;">
                <div>
                    <h6 class="mb-0">${product.title}</h6>
                    <small class="text-muted">#${product.product_id}</small>
                </div>
            </div>
        </td>
        <td>
            <span class="badge bg-light text-dark">${categoryName}</span>
        </td>
        <td>
            <span class="badge bg-info text-light">${product.sub_category_name || "None"}</span>
        </td>
        <td>
            <span class="badge bg-info">${variationsCount} variations</span>
        </td>
        <td>${priceRange}</td>
        <td>${getStatusBadge(status)}</td>
        <td>${createdDate}</td>
        <td>
            <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="viewProduct(${product.product_id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="editProduct(${product.product_id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.product_id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `

  return row
}

// Update getProductStatus function to use correct field names
function getProductStatus(product) {
  if (!product.is_active) {
    return "inactive"
  }

  if (!product.variations || product.variations.length === 0) {
    return "inactive"
  }

  const hasActiveVariations = product.variations.some((v) => v.is_active !== false)
  return hasActiveVariations ? "active" : "inactive"
}

// Update calculatePriceRange function
function calculatePriceRange(variations) {
  if (!variations || variations.length === 0) {
    return '<span class="text-muted">No variations</span>'
  }

  const prices = variations.map((v) => Number.parseFloat(v.discounted_price || v.actual_price || 0))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  if (minPrice === maxPrice) {
    return `₹${minPrice}`
  }

  return `₹${minPrice} - ₹${maxPrice}`
}

function getStatusBadge(status) {
  const statusConfig = {
    active: { class: "bg-success", text: "Active" },
    inactive: { class: "bg-secondary", text: "Inactive" },
    out_of_stock: { class: "bg-warning text-dark", text: "Out of Stock" },
  }

  const config = statusConfig[status] || statusConfig["inactive"]
  return `<span class="badge ${config.class}">${config.text}</span>`
}

function showEmptyState() {
  document.getElementById("productsTableContainer").style.display = "none"
  document.getElementById("emptyState").style.display = "block"
  document.getElementById("paginationContainer").style.display = "none"
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
    // loadingEl.style.display = "none"
    loadingEl.remove()
  }
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
  loadProducts()
}

function handleSearch() {
  currentFilters.search = document.getElementById("searchInput").value.trim()
  currentPage = 1
  loadProducts()
}

function handleFilterChange() {
  const newCategory = document.getElementById("categoryFilter").value

  // If category changed, update subcategory options and reset subcategory filter
  if (newCategory !== currentFilters.category) {
    populateSubCategoryFilter(newCategory)
    document.getElementById("subCategoryFilter").value = ""    
  }

  currentFilters.category = newCategory
  currentFilters.sub_category = document.getElementById("subCategoryFilter").value
  currentFilters.status = document.getElementById("statusFilter").value
  currentFilters.sortBy = document.getElementById("sortBy").value
  currentPage = 1
  loadProducts()
}

function clearFilters() {
  document.getElementById("searchInput").value = ""
  document.getElementById("categoryFilter").value = ""
  document.getElementById("subCategoryFilter").value = ""
  document.getElementById("subCategoryFilter").disabled = true
  document.getElementById("statusFilter").value = ""
  document.getElementById("sortBy").value = "created_desc"

  currentFilters = {
    search: "",
    category: "",
    sub_category: "",
    status: "",
    sortBy: "created_desc",
  }

  currentPage = 1
  loadProducts()
  showToast("info", "Filters Cleared", "All filters have been reset")
}

function handleSelectAll() {
  const selectAll = document.getElementById("selectAll")
  const checkboxes = document.querySelectorAll(".product-checkbox")

  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAll.checked
  })

  updateSelectedProducts()
}

function handleProductSelect(checkbox) {
  updateSelectedProducts()

  // Update select all checkbox
  const checkboxes = document.querySelectorAll(".product-checkbox")
  const checkedBoxes = document.querySelectorAll(".product-checkbox:checked")
  const selectAll = document.getElementById("selectAll")

  selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length
  selectAll.checked = checkedBoxes.length === checkboxes.length
}

function updateSelectedProducts() {
  const checkedBoxes = document.querySelectorAll(".product-checkbox:checked")
  selectedProducts = Array.from(checkedBoxes).map((cb) => Number.parseInt(cb.value))
  updateSelectedCount()
}

function updateSelectedCount() {
  const bulkDeleteBtn = document.getElementById("bulkDeleteBtn")

  if (selectedProducts.length > 0) {
    bulkDeleteBtn.style.display = "inline-block"
    bulkDeleteBtn.innerHTML = `<i class="fas fa-trash me-1"></i> Delete Selected (${selectedProducts.length})`
  } else {
    bulkDeleteBtn.style.display = "none"
  }
}

// Update updateStats function to use correct field names
function updateStats() {
  const totalProducts = allProducts.length
  const activeProducts = allProducts.filter((p) => p.is_active === true).length
  const inactiveProducts = allProducts.filter((p) => p.is_active === false).length
  const totalCategories = allCategories.length

  // Update DOM
  document.getElementById("totalProducts").textContent = totalProducts
  document.getElementById("activeProducts").textContent = activeProducts
  document.getElementById("outOfStockProducts").textContent = inactiveProducts
  document.getElementById("totalCategories").textContent = totalCategories
}

async function viewProduct(productId) {
  try {
    const [success, result] = await callApi("GET", `${products_url}?product_id=${productId}`)

    if (success && result.success) {
      const product = result.data
      showProductDetails(product)
    } else {
      showToast("error", "Error", "Failed to load product details")
    }
  } catch (error) {
    console.error("Error loading product details:", error)
    showToast("error", "Error", "Failed to load product details")
  }
}

function showProductDetails(product) {
  const modal = new bootstrap.Modal(document.getElementById("productDetailsModal"))
  const modalBody = document.getElementById("productDetailsBody")

  // Get category name
  const category = allCategories.find((cat) => cat.category_id === product.category_id)
  const categoryName = category ? category.title : "Unknown"

  modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <img src="${product.photos && product.photos[0] ? product.photos[0] : "/placeholder.svg?height=200&width=200"}" 
                     alt="${product.title}" class="img-fluid rounded">
            </div>
            <div class="col-md-8">
                <h5>${product.title}</h5>
                <p class="text-muted">${product.description || "No description available"}</p>
                
                <div class="row mb-3">
                    <div class="col-sm-6">
                        <strong>Product ID:</strong> #${product.product_id}
                    </div>
                    <div class="col-sm-6">
                        <strong>Category:</strong> ${categoryName}
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-sm-6">
                        <strong>Status:</strong> ${getStatusBadge(getProductStatus(product))}
                    </div>
                    <div class="col-sm-6">
                        <strong>Variations:</strong> ${(product.product_variation || []).length}
                    </div>
                </div>
                
                ${
                  product.product_variation && product.product_variation.length > 0
                    ? `
                    <h6>Variations:</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Weight</th>
                                    <th>Actual Price</th>
                                    <th>Discounted Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${product.product_variation
                                  .map(
                                    (variation) => `
                                    <tr>
                                        <td>${variation.weight_variation}</td>
                                        <td>₹${variation.actual_price}</td>
                                        <td>₹${variation.discounted_price}</td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                `
                    : '<p class="text-muted">No variations available</p>'
                }
            </div>
        </div>
    `

  // Set edit button action
  document.getElementById("editProductBtn").onclick = () => {
    modal.hide()
    editProduct(product.product_id)
  }

  modal.show()
}

function editProduct(productId) {
  window.location.href = `/admin-add-product/?product_id=${productId}`
}

function deleteProduct(productId) {
  productToDelete = productId
  const modal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"))
  modal.show()
}

// Update confirmDelete function to use correct API endpoint
async function confirmDelete() {
  if (!productToDelete) return

  try {
    const [success, result] = await callApi("DELETE", `${products_url}${productToDelete}/`, null, csrf_token)

    if (success && result.success) {
      showToast("success", "Success", "Product deleted successfully")
      loadProducts()
    } else {
      showToast("error", "Error", result.error || "Failed to delete product")
    }
  } catch (error) {
    console.error("Error deleting product:", error)
    showToast("error", "Error", "Failed to delete product")
  } finally {
    productToDelete = null
    bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal")).hide()
  }
}

function handleBulkDelete() {
  if (selectedProducts.length === 0) return

  if (
    confirm(
      `Are you sure you want to delete ${selectedProducts.length} selected products? This action cannot be undone.`,
    )
  ) {
    bulkDeleteProducts()
  }
}

// Update bulkDeleteProducts function
async function bulkDeleteProducts() {
  showLoading("Deleting products...")

  try {
    const deletePromises = selectedProducts.map((productId) =>
      callApi("DELETE", `${products_url}${productId}/`, null, csrf_token),
    )

    const results = await Promise.all(deletePromises)
    const successCount = results.filter(([success, result]) => success && result.success).length

    if (successCount === selectedProducts.length) {
      showToast("success", "Success", `${successCount} products deleted successfully`)
    } else {
      showToast("warning", "Partial Success", `${successCount} of ${selectedProducts.length} products deleted`)
    }

    selectedProducts = []
    loadProducts()
  } catch (error) {
    console.error("Error in bulk delete:", error)
    showToast("error", "Error", "Failed to delete products")
  } finally {
    hideLoading()
  }
}

function exportData(format) {
  if (allProducts.length === 0) {
    showToast("warning", "No Data", "No products to export")
    return
  }

  const data = allProducts.map((product) => {
    const category = allCategories.find((cat) => cat.category_id === product.category_id)
    return {
      "Product ID": product.product_id,
      Title: product.title,
      Description: product.description || "",
      Category: category ? category.title : "Unknown",
      Variations: (product.variations || []).length,
      Status: getProductStatus(product),
      Created: new Date(product.created_at || Date.now()).toLocaleDateString(),
    }
  })

  if (format === "csv") {
    downloadCSV(data, "products.csv")
  } else if (format === "excel") {
    // For Excel export, you would need a library like SheetJS
    showToast("info", "Feature Coming Soon", "Excel export will be available soon")
  }

  showToast("success", "Export Started", `Products export as ${format.toUpperCase()} has started`)
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

// Toast notification function
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

function populateSubCategoryFilter(categoryId) {
  const subCategoryFilter = document.getElementById("subCategoryFilter")
  subCategoryFilter.innerHTML = '<option value="">All Sub Categories</option>'
  categoryId = Number(categoryId)

  if (!categoryId) {
    subCategoryFilter.disabled = true
    return
  }

  const selectedCategory = allCategories.find((cat) => cat.category_id === categoryId)
  if (selectedCategory && selectedCategory.subcategories) {
    subCategoryFilter.disabled = false
    selectedCategory.subcategories.forEach((subCategory) => {
      const option = document.createElement("option")
      option.value = subCategory.sub_category_id
      option.textContent = subCategory.title
      subCategoryFilter.appendChild(option)
    })
  } else {
    subCategoryFilter.disabled = true
  }
}

// Global loading function - Removed duplicate definition
// function showLoading(message = 'Loading...') {
//     let loadingEl = document.getElementById('globalLoading');

//     if (!loadingEl) {
//         loadingEl = document.createElement('div');
//         loadingEl.id = 'globalLoading';
//         loadingEl.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
//         loadingEl.style.backgroundColor = 'rgba(0,0,0,0.5)';
//         loadingEl.style.zIndex = '9999';

//         loadingEl.innerHTML = `
//             <div class="card p-4 shadow">
//                 <div class="d-flex align-items-center">
//                     <div class="spinner-border text-primary me-3" role="status">
//                         <span class="visually-hidden">Loading...</span>
//                     </div>
//                     <div id="loadingMessage">${message}</div>
//                 </div>
//             </div>
//         `;

//         document.body.appendChild(loadingEl);
//     } else {
//         document.getElementById('loadingMessage').textContent = message;
//         loadingEl.style.display = 'flex';
//     }
// }

// function hideLoading() {
//     const loadingEl = document.getElementById('globalLoading');
//     if (loadingEl) {
//         loadingEl.style.display = 'none';
//     }
// }

// Declare callApi (assuming it's defined elsewhere and needs to be accessible here)
// For example, if it's in a separate module:
// import { callApi } from './api-module';
// Or, if it's a global function defined in another script:
/* global callApi */
/* global bootstrap */
