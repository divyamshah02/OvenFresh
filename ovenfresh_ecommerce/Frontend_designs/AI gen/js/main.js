// Import Swiper JS
import Swiper from "swiper"

// Import API functions (assuming this is a separate module)
import * as API from "./api" // Adjust path as needed

/**
 * OvenFresh Bakery - Main JavaScript
 * This file contains the main JavaScript functionality for the home page
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize hero slider
  const heroSwiper = new Swiper(".heroSwiper", {
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".heroSwiper .swiper-pagination",
      clickable: true,
    },
  })

  // Initialize seasonal products slider
  const seasonalSwiper = new Swiper(".seasonalSwiper", {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
      el: ".seasonalSwiper .swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      576: {
        slidesPerView: 2,
      },
      992: {
        slidesPerView: 3,
      },
      1200: {
        slidesPerView: 4,
      },
    },
  })

  // Initialize bestsellers slider
  const bestsellersSwiper = new Swiper(".bestsellersSwiper", {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
      el: ".bestsellersSwiper .swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      576: {
        slidesPerView: 2,
      },
      992: {
        slidesPerView: 3,
      },
      1200: {
        slidesPerView: 4,
      },
    },
  })

  // Initialize testimonials slider
  const testimonialsSwiper = new Swiper(".testimonialsSwiper", {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
      el: ".testimonialsSwiper .swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 2,
      },
      1200: {
        slidesPerView: 3,
      },
    },
  })

  // Load seasonal products
  loadSeasonalProducts()

  // Load hampers
  loadHampers()

  // Load bestsellers
  loadBestsellers()

  // Load testimonials
  loadTestimonials()

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

  // Newsletter form
  const newsletterForm = document.getElementById("newsletterForm")
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault()
      const email = this.querySelector('input[type="email"]').value
      const responseElement = document.getElementById("newsletterResponse")

      // Show loading state
      responseElement.textContent = "Subscribing..."
      responseElement.className = "form-text mt-2 text-muted"

      // Call API to subscribe
      API.subscribeNewsletter(email)
        .then((response) => {
          if (response.success) {
            responseElement.textContent = response.message
            responseElement.className = "form-text mt-2 text-success"
            newsletterForm.reset()
          } else {
            responseElement.textContent = response.message
            responseElement.className = "form-text mt-2 text-danger"
          }
        })
        .catch((error) => {
          responseElement.textContent = "An error occurred. Please try again."
          responseElement.className = "form-text mt-2 text-danger"
        })
    })
  }
})

/**
 * Load seasonal products
 */
function loadSeasonalProducts() {
  const container = document.getElementById("seasonalProductsContainer")
  if (!container) return

  API.getSeasonalProducts(8).then((products) => {
    let html = ""

    products.forEach((product) => {
      html += `
                <div class="swiper-slide">
                    <div class="card product-card h-100 border-0 shadow-sm">
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.name}" class="card-img-top">
                            <div class="product-badge">
                                <span class="badge bg-pink">Seasonal</span>
                            </div>
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
                            <h5 class="card-title text-chocolate">${product.name}</h5>
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

    container.innerHTML = html
  })
}

/**
 * Load hampers
 */
function loadHampers() {
  const container = document.getElementById("hampersContainer")
  if (!container) return

  API.getHampers(3).then((hampers) => {
    let html = ""

    hampers.forEach((hamper) => {
      html += `
                <div class="col-md-4">
                    <div class="hamper-card shadow-sm">
                        <div class="hamper-image">
                            <img src="${hamper.image}" alt="${hamper.name}" class="img-fluid">
                        </div>
                        <div class="card-body p-4 bg-gradient-to-b from-white to-cream-light">
                            <h4 class="text-chocolate mb-2">${hamper.name}</h4>
                            <p class="text-muted mb-3">${hamper.description}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <p class="fw-bold text-pink mb-0">$${hamper.price.toFixed(2)}</p>
                                <a href="products.html" class="btn btn-sm btn-outline-chocolate">View Details</a>
                            </div>
                        </div>
                    </div>
                </div>
            `
    })

    container.innerHTML = html
  })
}

/**
 * Load bestsellers
 */
function loadBestsellers() {
  const container = document.getElementById("bestsellersContainer")
  if (!container) return

  API.getBestsellers(8).then((products) => {
    let html = ""

    products.forEach((product) => {
      html += `
                <div class="swiper-slide">
                    <div class="card product-card h-100 border-0 shadow-sm">
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.name}" class="card-img-top">
                            <div class="product-badge">
                                <span class="badge bg-yellow text-chocolate">Bestseller</span>
                            </div>
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
                            <h5 class="card-title text-chocolate">${product.name}</h5>
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

    container.innerHTML = html
  })
}

/**
 * Load testimonials
 */
function loadTestimonials() {
  const container = document.getElementById("testimonialsContainer")
  if (!container) return

  API.getTestimonials(5).then((testimonials) => {
    let html = ""

    testimonials.forEach((testimonial) => {
      html += `
                <div class="swiper-slide">
                    <div class="testimonial-card text-center">
                        <div class="testimonial-avatar">
                            <img src="${testimonial.avatar}" alt="${testimonial.name}">
                        </div>
                        <div class="ratings mb-2">
                            ${getRatingStars(testimonial.rating)}
                        </div>
                        <div class="testimonial-quote mb-3">
                            <p class="mb-0">${testimonial.text}</p>
                        </div>
                        <h5 class="text-chocolate mb-1">${testimonial.name}</h5>
                        <p class="text-muted small mb-0">${testimonial.location}</p>
                    </div>
                </div>
            `
    })

    container.innerHTML = html
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
