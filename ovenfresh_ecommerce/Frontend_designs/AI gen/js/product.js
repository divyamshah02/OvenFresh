/**
 * OvenFresh Bakery - Products Page JavaScript
 * This file contains the JavaScript functionality for the products page
 */

// Declare API if it's not already available globally
if (typeof API === "undefined") {
    var API = {
      getProducts: () => {
        console.warn("API is not properly imported. Products will not load.")
        return new Promise((resolve) => {
          resolve({ products: [], pagination: { total: 0, totalPages: 0, currentPage: 1 } })
        })
      },
    }
  }
  
  // Declare noUiSlider if it's not already available globally
  if (typeof noUiSlider === "undefined") {
    var noUiSlider = {
      create: () => {
        console.warn("noUiSlider is not properly imported. Price range slider will not function.")
      },
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize price range slider
    const priceRangeSlider = document.getElementById("priceRange")
    if (priceRangeSlider) {
      noUiSlider.create(priceRangeSlider, {
        start: [0, 100],
        connect: true,
        range: {
          min: 0,
          max: 100,
        },
        format: {
          to: (value) => Math.round(value),
          from: (value) => Number(value),
        },
      })
  
      // Update price display
      const priceMin = document.getElementById("priceMin")
      const priceMax = document.getElementById("priceMax")
  
      priceRangeSlider.noUiSlider.on("update", (values, handle) => {
        if (handle === 0) {
          priceMin.textContent = "$" + values[0]
        } else {
          priceMax.textContent = "$" + values[1]
        }
      })
    }
  
    // Load products
    loadProducts()
  
    // Set current year in footer
    document.getElementById("currentYear").textContent = new Date().getFullYear()
  
    // Back to top button
    const backToTopButton = document.getElementById("backToTop")
    if (backToTopButton) {
      window.addEventListener("scroll", () => {
        if (window.pageYOffset > 300) {
          backToTopButton.classList.add("show")
        } else {
          backToTopButton.classList.remove("show")
        }
      })
  
      backToTopButton.addEventListener("click", (e) => {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: "smooth" })
      })
    }
  
    // Category filter
    const categoryLinks = document.querySelectorAll(".category-item")
    categoryLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault()
  
        // Remove active class from all links
        categoryLinks.forEach((l) => l.classList.remove("active"))
  
        // Add active class to clicked link
        this.classList.add("active")
  
        // Get category
        const category = this.dataset.category
  
        // Update filters and reload products
        currentFilters.category = category
        currentFilters.page = 1
        loadProducts()
      })
    })
  
    // Sort options
    const sortOptions = document.getElementById("sortOptions")
    if (sortOptions) {
      sortOptions.addEventListener("change", function () {
        currentFilters.sort = this.value
        loadProducts()
      })
    }
  
    // View options
    const gridView = document.getElementById("gridView")
    const listView = document.getElementById("listView")
    const productsContainer = document.getElementById("productsContainer")
  
    if (gridView && listView && productsContainer) {
      gridView.addEventListener("click", () => {
        gridView.classList.add("active")
        listView.classList.remove("active")
        productsContainer.classList.remove("list-view")
        localStorage.setItem("productView", "grid")
      })
  
      listView.addEventListener("click", () => {
        listView.classList.add("active")
        gridView.classList.remove("active")
        productsContainer.classList.add("list-view")
        localStorage.setItem("productView", "list")
      })
  
      // Load saved view preference
      const savedView = localStorage.getItem("productView")
      if (savedView === "list") {
        listView.click()
      }
    }
  
    // Apply filters button
    const applyFiltersBtn = document.getElementById("applyFilters")
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", () => {
        // Get price range
        const priceValues = priceRangeSlider.noUiSlider.get()
        currentFilters.minPrice = Number.parseInt(priceValues[0])
        currentFilters.maxPrice = Number.parseInt(priceValues[1])
  
        // Get dietary options
        const dietaryOptions = []
        document.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox) => {
          dietaryOptions.push(checkbox.value)
        })
        currentFilters.dietary = dietaryOptions
  
        // Get rating
        const selectedRating = document.querySelector('input[name="rating"]:checked')
        currentFilters.rating = selectedRating ? Number.parseInt(selectedRating.value) : 0
  
        // Reset to page 1
        currentFilters.page = 1
  
        // Load products
        loadProducts()
      })
    }
  })
  
  // Current filters
  const currentFilters = {
    category: "all",
    minPrice: 0,
    maxPrice: 100,
    dietary: [],
    rating: 0,
    sort: "featured",
    page: 1,
    limit: 8,
  }
  
  /**
   * Load products based on current filters
   */
  function loadProducts() {
    const container = document.getElementById("productsContainer")
    const productCount = document.getElementById("productCount")
    if (!container) return
  
    // Show loading state
    container.innerHTML = `
          <div class="col-12 text-center py-5">
              <div class="spinner-border text-pink" role="status">
                  <span class="visually-hidden">Loading...</span>
              </div>
          </div>
      `
  
    API.getProducts(currentFilters).then((response) => {
      const { products, pagination } = response
  
      // Update product count
      if (productCount) {
        productCount.textContent = pagination.total
      }
  
      // Generate products HTML
      let html = ""
  
      if (products.length === 0) {
        html = `
                  <div class="col-12 text-center py-5">
                      <p class="text-muted">No products found matching your criteria.</p>
                  </div>
              `
      } else {
        products.forEach((product) => {
          html += `
                      <div class="col-md-6 col-lg-4 col-xl-3">
                          <div class="card product-card h-100 border-0 shadow-sm">
                              <div class="product-image">
                                  <a href="product-detail.html?id=${product.id}">
                                      <img src="${product.image}" alt="${product.name}" class="card-img-top">
                                  </a>
                                  <div class="product-actions">
                                      <a href="#" class="action-btn mb-1" title="Quick View">
                                          <i class="fa-regular fa-eye"></i>
                                      </a>
                                      <a href="#" class="action-btn mb-1" title="Add to Wishlist">
                                          <i class="fa-regular fa-heart"></i>
                                      </a>
                                      <a href="#" class="action-btn" title="Compare">
                                          <i class="fa-solid fa-arrow-right-arrow-left"></i>
                                      </a>
                                  </div>
                              </div>
                              <div class="card-body bg-gradient-to-b from-white to-cream-light">
                                  <div class="d-flex align-items-center mb-1">
                                      <div class="ratings">
                                          ${getRatingStars(product.rating)}
                                      </div>
                                      <span class="ms-1 text-muted small">(${product.reviews})</span>
                                  </div>
                                  <h5 class="card-title text-chocolate">
                                      <a href="product-detail.html?id=${product.id}" class="text-decoration-none text-chocolate">${product.name}</a>
                                  </h5>
                                  <p class="card-text text-muted small mb-0">${product.description}</p>
                                  <div class="d-flex justify-content-between align-items-center mt-2">
                                      <p class="fw-bold text-pink mb-0">$${product.price.toFixed(2)}</p>
                                      <button class="btn btn-sm btn-yellow text-chocolate">
                                          <i class="fa-solid fa-cart-plus me-1"></i> Add
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  `
        })
      }
  
      container.innerHTML = html
  
      // Generate pagination
      generatePagination(pagination)
    })
  }
  
  /**
   * Generate pagination
   * @param {Object} pagination - Pagination data
   */
  function generatePagination(pagination) {
    const paginationElement = document.getElementById("pagination")
    if (!paginationElement) return
  
    const { totalPages, currentPage } = pagination
  
    let html = ""
  
    // Previous button
    html += `
          <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
              <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                  <span aria-hidden="true">&laquo;</span>
              </a>
          </li>
      `
  
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      html += `
              <li class="page-item ${i === currentPage ? "active" : ""}">
                  <a class="page-link" href="#" data-page="${i}">${i}</a>
              </li>
          `
    }
  
    // Next button
    html += `
          <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
              <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                  <span aria-hidden="true">&raquo;</span>
              </a>
          </li>
      `
  
    paginationElement.innerHTML = html
  
    // Add event listeners to pagination links
    const pageLinks = paginationElement.querySelectorAll(".page-link")
    pageLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault()
  
        const page = Number.parseInt(this.dataset.page)
        if (page < 1 || page > totalPages || page === currentPage) return
  
        currentFilters.page = page
        loadProducts()
  
        // Scroll to top of products
        const productsSection = document.querySelector(".products-section")
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: "smooth" })
        }
      })
    })
  }
  
  /**
   * Generate rating stars HTML
   * @param {number} rating - Product rating
   * @returns {string} - HTML for rating stars
   */
  function getRatingStars(rating) {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating - fullStars >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
  
    let starsHtml = ""
  
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fa-solid fa-star text-yellow"></i>'
    }
  
    if (hasHalfStar) {
      starsHtml += '<i class="fa-solid fa-star-half-stroke text-yellow"></i>'
    }
  
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="fa-regular fa-star text-yellow"></i>'
    }
  
    return starsHtml
  }
  