// Global variables
let csrf_token = null
let all_products_url = null
let category_url = null
let cart_list_url = null
let products = []
let categories = []
let displayedProducts = 0
const productsPerPage = 8
let filteredProducts = []
let urlParams = {}
let currentSearchTerm = ""

// Initialize shop
async function Shop(csrf_token_param, all_products_url_param, category_url_param, cart_list_url_param) {
  csrf_token = csrf_token_param
  all_products_url = all_products_url_param
  category_url = category_url_param
  cart_list_url = cart_list_url_param

  // Get URL parameters
  urlParams = getUrlParameters()

  // Load categories first
  await loadCategoriesAndSubcategories()

  // Setup UI based on URL parameters
  setupUIBasedOnParams()

  // Load products with URL parameters
  await loadProductsFromAPI()

  // Update cart count
  updateCartCountFromAPI()
}

// Get URL parameters
function getUrlParameters() {
  const params = new URLSearchParams(window.location.search)
  return {
    category: params.get("category"),
    subcategory: params.get("sub-category") || params.get("subcategory"),
    search: params.get("search"),
  }
}

// Setup UI based on URL parameters
function setupUIBasedOnParams() {
  const categoryFilterContainer = document.getElementById("category-filter-container")
  const subcategoryFilterContainer = document.getElementById("subcategory-filter-container")
  const pageTitle = document.getElementById("page-title")
  const pageDescription = document.getElementById("page-description")
  const breadcrumbNav = document.getElementById("breadcrumb-nav")

  // Update page title and breadcrumb based on URL params
  if (urlParams.category && urlParams.subcategory) {
    // Both category and subcategory - hide both filters
    categoryFilterContainer.style.display = "none"
    subcategoryFilterContainer.style.display = "none"

    const categoryName = capitalizeFirst(urlParams.category)
    const subcategoryName = capitalizeFirst(urlParams.subcategory)
    pageTitle.textContent = subcategoryName
    pageDescription.textContent = `Explore our ${subcategoryName.toLowerCase()} collection`

    // Update breadcrumb
    breadcrumbNav.innerHTML = `
            <li class="breadcrumb-item"><a href="/">Home</a></li>
            <li class="breadcrumb-item"><a href="/shop/">Shop</a></li>
            <li class="breadcrumb-item"><a href="/shop/?category=${urlParams.category}">${categoryName}</a></li>
            <li class="breadcrumb-item active" aria-current="page">${subcategoryName}</li>
        `
  } else if (urlParams.category) {
    // Only category - hide category filter, show subcategory filter
    categoryFilterContainer.style.display = "none"
    subcategoryFilterContainer.style.display = "block"

    const categoryName = capitalizeFirst(urlParams.category)
    pageTitle.textContent = categoryName
    pageDescription.textContent = `Discover our ${categoryName.toLowerCase()} collection`

    // Update breadcrumb
    breadcrumbNav.innerHTML = `
            <li class="breadcrumb-item"><a href="/">Home</a></li>
            <li class="breadcrumb-item"><a href="/shop/">Shop</a></li>
            <li class="breadcrumb-item active" aria-current="page">${categoryName}</li>
        `

    // Load subcategories for this category
    loadSubcategoriesForCategory(urlParams.category)
  } else {
    // No URL params - show category filter, hide subcategory filter
    categoryFilterContainer.style.display = "block"
    subcategoryFilterContainer.style.display = "none"
  }

  // Set search input if search param exists
  if (urlParams.search) {
    document.getElementById("searchInput").value = urlParams.search
    currentSearchTerm = urlParams.search
  }
}

// Load categories and subcategories
async function loadCategoriesAndSubcategories() {
  try {
    const [success, result] = await callApi("GET", category_url)
    if (success && result.success) {
      categories = result.data
      populateCategoryFilter()
    } else {
      console.error("Failed to load categories:", result.message)
    }
  } catch (error) {
    console.error("Error loading categories:", error)
  }
}

// Populate category filter dropdown
function populateCategoryFilter() {
  const categorySelect = document.getElementById("categoryFilter")
  categorySelect.innerHTML = '<option value="">All Categories</option>'

  categories.forEach((category) => {
    const option = document.createElement("option")
    option.value = category.title || category.name
    option.textContent = category.title || category.name
    categorySelect.appendChild(option)
  })
}

// Load subcategories for a specific category
function loadSubcategoriesForCategory(categoryId) {
  const subcategorySelect = document.getElementById("subcategoryFilter")
  subcategorySelect.innerHTML = '<option value="">All Sub-categories</option>'

  const category = categories.find(
    (cat) =>
      (cat.category_id && cat.category_id.toString() === categoryId) ||
      (cat.id && cat.id.toString() === categoryId) ||
      (cat.title && cat.title.toLowerCase() === categoryId.toLowerCase()),
  )
  console.log()

  if (category && category.subcategories) {
    category.subcategories.forEach((subcategory) => {
      const option = document.createElement("option")
      option.value = subcategory.title || subcategory.name
      option.textContent = subcategory.title || subcategory.name
      subcategorySelect.appendChild(option)
    })
  }
}

// Load products from API with URL parameters
async function loadProductsFromAPI() {
  try {
    // Build API URL with parameters
    let apiUrl = all_products_url
    const params = new URLSearchParams()

    if (urlParams.category) {
      params.append("category", urlParams.category)
    }

    if (urlParams.subcategory) {
      params.append("sub_category", urlParams.subcategory)
    }

    if (urlParams.search) {
      params.append("search", urlParams.search)
    }

    if (params.toString()) {
      apiUrl += "?" + params.toString()
    }

    const [success, result] = await callApi("GET", apiUrl)
    if (success && result.success) {
      products = result.data
      filteredProducts = [...products]
      displayedProducts = 0
      loadProducts()
      updateProductsCount()
    } else {
      console.error("Failed to load products:", result.message)
      showNoProducts()
    }
  } catch (error) {
    console.error("Error loading products:", error)
    showNoProducts()
  }
}

// Add to cart function
async function AddToCart(product_id, product_variation_id, qty = 1) {
  if (!product_variation_id || qty < 1) {
    showNotification("Invalid product or quantity.", "error")
    return false
  }

  try {
    const bodyData = {
      product_id: product_id,
      product_variation_id: product_variation_id,
      qty: qty,
    }

    const [success, result] = await callApi("POST", cart_list_url, bodyData, csrf_token)
    if (success && result.success) {
      showNotification("Item added to cart!", "success")
      updateCartCountFromAPI()
      return true
    } else {
      showNotification(result.error || "Failed to add item to cart.", "error")
      return false
    }
  } catch (error) {
    console.error("Error adding to cart:", error)
    showNotification("Error adding item to cart.", "error")
    return false
  }
}

// Update cart count from API
async function updateCartCountFromAPI() {
  try {
    const [success, result] = await callApi("GET", cart_list_url)
    if (success && result.success) {
      const cartItems = result.data.cart_items || []
      updateCartCount(cartItems)
    }
  } catch (error) {
    console.error("Error updating cart count:", error)
  }
}

// Update cart count display
function updateCartCount(cartItems) {
  const cartCount = cartItems.reduce((total, item) => total + Number.parseInt(item.quantity), 0)
  const cartCountElement = document.getElementById("cart-count")
  if (cartCountElement) {
    cartCountElement.textContent = cartCount
  }
}

// Create product card with clickable functionality
function createProductCard(product) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(product.rating || 0)) {
      return '<i class="fas fa-star"></i>'
    } else if (i < (product.rating || 0)) {
      return '<i class="fas fa-star-half-alt"></i>'
    } else {
      return '<i class="far fa-star"></i>'
    }
  }).join("")

  const badge = product.badge
    ? `<span class="badge ${product.badgeClass} position-absolute top-0 end-0 mt-2 me-2">${product.badge}</span>`
    : ""

  const productImage = product.photos && product.photos.length > 0 ? product.photos[0] : "/static/img/placeholder.jpg"
  const productPrice = product.actual_price || product.price || 0
  const productWeight = product.weight || ""
  const productReviews = product.reviews || 0

  return `
        <div class="col-md-6 col-lg-3">
            <div class="product-card" onclick="goToProductDetail('${product.slug}')">
                <div class="product-img">
                    ${badge}
                    <img src="${productImage}" alt="${product.title}" class="img-fluid">
                    <div class="product-actions">
                        <a href="#" class="btn-product-action" onclick="event.stopPropagation(); toggleWishlist(${product.product_id})"><i class="fas fa-heart"></i></a>
                        <a href="#" class="btn-product-action" onclick="event.stopPropagation(); AddToCart(${product.product_id}, ${product.product_variation_id})"><i class="fas fa-shopping-cart"></i></a>
                        <a href="/product/${product.slug}" class="btn-product-action" onclick="event.stopPropagation()"><i class="fas fa-eye"></i></a>
                    </div>
                </div>
                <div class="product-body">
                    <h5>${product.title}</h5>
                    <div class="product-rating mb-2">
                        ${stars}
                        <span class="ms-2">(${productReviews})</span>
                    </div>
                    <div class="product-price">
                        <span class="price">₹${productPrice}${productWeight ? " - " + productWeight : ""}</span>
                    </div>
                </div>
            </div>
        </div>
    `
}

// Navigate to product detail page
function goToProductDetail(productSlug) {
  window.location.href = `/product/${productSlug}`
}

// Toggle wishlist (placeholder function)
function toggleWishlist(productId) {
  // Implement wishlist functionality here
  showNotification("Wishlist functionality coming soon!", "info")
}

// Load and display products
function loadProducts() {
  const grid = document.getElementById("products-grid")
  const productsToShow = filteredProducts.slice(0, displayedProducts + productsPerPage)

  if (productsToShow.length === 0) {
    showNoProducts()
    return
  }

  grid.innerHTML = productsToShow.map((product) => createProductCard(product)).join("")
  displayedProducts = productsToShow.length

  // Show/hide load more button
  const loadMoreContainer = document.getElementById("load-more-container")
  if (displayedProducts >= filteredProducts.length) {
    loadMoreContainer.style.display = "none"
  } else {
    loadMoreContainer.style.display = "block"
  }

  // Hide no products message
  document.getElementById("no-products").style.display = "none"
}

// Show no products message
function showNoProducts() {
  document.getElementById("products-grid").innerHTML = ""
  document.getElementById("no-products").style.display = "block"
  document.getElementById("load-more-container").style.display = "none"
  updateProductsCount()
}

// Update products count display
function updateProductsCount() {
  const countElement = document.getElementById("products-count")
  const totalProducts = filteredProducts.length
  const displayedCount = Math.min(displayedProducts, totalProducts)

  if (totalProducts === 0) {
    countElement.textContent = "No products found"
  } else {
    countElement.textContent = `Showing ${displayedCount} of ${totalProducts} products`
  }
}

// Filter products
function filterProducts() {
  const category = document.getElementById("categoryFilter").value
  const subcategory = document.getElementById("subcategoryFilter").value
  const sortBy = document.getElementById("sortBy").value

  // Start with all products
  filteredProducts = [...products]

  // Apply category filter (only if not filtered by URL)
  if (category && !urlParams.category) {
    filteredProducts = filteredProducts.filter((p) => p.category_id === category || p.category_name === category)
  }

  // Apply subcategory filter
  if (subcategory) {
    filteredProducts = filteredProducts.filter(
      (p) => p.subcategory_id === subcategory || p.sub_category_name === subcategory,
    )
  }

  // Apply search filter
  if (currentSearchTerm) {
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(currentSearchTerm.toLowerCase())),
    )
  }

  // Sort products
  sortProducts(sortBy)

  displayedProducts = 0
  loadProducts()
  updateProductsCount()
}

// Sort products
function sortProducts(sortBy) {
  switch (sortBy) {
    case "price-low":
      filteredProducts.sort((a, b) => (a.actual_price || a.price || 0) - (b.actual_price || b.price || 0))
      break
    case "price-high":
      filteredProducts.sort((a, b) => (b.actual_price || b.price || 0) - (a.actual_price || a.price || 0))
      break
    case "name":
      filteredProducts.sort((a, b) => a.title.localeCompare(b.title))
      break
    default:
      // Keep original order for featured
      break
  }
}

// Search products
function searchProducts() {
  const searchTerm = document.getElementById("searchInput").value.trim()
  currentSearchTerm = searchTerm
  filterProducts()

  // Update URL with search parameter
  if (searchTerm) {
    updateUrlParameter("search", searchTerm)
  } else {
    removeUrlParameter("search")
  }
}

// Handle search on Enter key press
function handleSearchKeyPress(event) {
  if (event.key === "Enter") {
    searchProducts()
  }
}

// Clear all filters
function clearAllFilters() {
  // Clear search
  document.getElementById("searchInput").value = ""
  currentSearchTerm = ""

  // Clear filters
  document.getElementById("categoryFilter").value = ""
  document.getElementById("subcategoryFilter").value = ""
  document.getElementById("sortBy").value = "featured"

  // Remove URL parameters and reload
  window.location.href = "/shop/"
}

// Update URL parameter
function updateUrlParameter(key, value) {
  const url = new URL(window.location)
  url.searchParams.set(key, value)
  window.history.replaceState({}, "", url)
}

// Remove URL parameter
function removeUrlParameter(key) {
  const url = new URL(window.location)
  url.searchParams.delete(key)
  window.history.replaceState({}, "", url)
}

// Utility function to capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Show notification
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

// Mock callApi and toggle_loader for demonstration purposes
// async function callApi(method, url, body = null, csrf_token = null) {
//   // Simulate API call
//   return [true, { success: true, data: [], message: "API call successful" }]
// }

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Category filter change
  const categoryFilter = document.getElementById("categoryFilter")
  if (categoryFilter) {
    categoryFilter.addEventListener("change", filterProducts)
  }

  // Subcategory filter change
  const subcategoryFilter = document.getElementById("subcategoryFilter")
  if (subcategoryFilter) {
    subcategoryFilter.addEventListener("change", filterProducts)
  }

  // Sort change
  const sortBy = document.getElementById("sortBy")
  if (sortBy) {
    sortBy.addEventListener("change", filterProducts)
  }

  // Load more button
  const loadMoreBtn = document.getElementById("load-more")
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", loadProducts)
  }
})

// Window load event
window.onload = () => {
  toggle_loader()
}

// Scroll event for sticky menu
window.addEventListener("scroll", () => {
  const menuBar = document.querySelector(".main-menu")
  const scrollTrigger = 95

  if (menuBar) {
    if (window.scrollY >= scrollTrigger) {
      menuBar.classList.add("fixed-top")
    } else {
      menuBar.classList.remove("fixed-top")
    }
  }
})
