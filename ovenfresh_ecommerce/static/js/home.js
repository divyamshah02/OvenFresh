let csrf_token = null
let heroBannersUrl = null
let deliveryPolicyUrl = null
let categoriesUrl = null
let videosUrl = null
let featuresUrl = null
let aboutUrl = null
let productSectionsUrl = null
let clientLogosUrl = null
let footerUrl = null

// Data storage
const homepageData = {
  banners: [],
  deliveryPolicies: [],
  categories: [],
  videos: [],
  features: [],
  about: null,
  productSections: [],
  clientLogos: [],
  footerContent: [],
}

async function InitializeHomepage(
  csrfTokenParam,
  heroBannersUrlParam,
  deliveryPolicyUrlParam,
  categoriesUrlParam,
  videosUrlParam,
  featuresUrlParam,
  aboutUrlParam,
  productSectionsUrlParam,
  clientLogosUrlParam,
  footerUrlParam,
) {
  csrf_token = csrfTokenParam
  heroBannersUrl = heroBannersUrlParam
  deliveryPolicyUrl = deliveryPolicyUrlParam
  categoriesUrl = categoriesUrlParam
  videosUrl = videosUrlParam
  featuresUrl = featuresUrlParam
  aboutUrl = aboutUrlParam
  productSectionsUrl = productSectionsUrlParam
  clientLogosUrl = clientLogosUrlParam
  footerUrl = footerUrlParam

  try {
    showLoading()

    // Load all homepage content
    await Promise.all([
      loadHeroBanners(),
      loadDeliveryPolicy(),
      loadCategories(),
      loadVideos(),
      loadFeatures(),
      loadAboutSection(),
      loadProductSections(),
      loadClientLogos(),
      loadFooterContent(),
    ])

    // Render all sections
    renderHeroBanners()
    renderDeliveryPolicy()
    renderCategories()
    renderVideos()
    renderFeatures()
    renderAboutSection()
    renderProductSections()
    renderClientLogos()
    renderFooterContent()

    // Initialize interactive elements
    initializeCarousel()
    initializeCategoryScroll()
    initializeCountdowns()

    hideLoading()
  } catch (error) {
    console.error("Error initializing homepage:", error)
    hideLoading()
  }
}

async function loadHeroBanners() {
  try {
    const [success, result] = await callApi("GET", heroBannersUrl)
    if (success && result.success) {
      homepageData.banners = result.data
    }
  } catch (error) {
    console.error("Error loading hero banners:", error)
  }
}

async function loadDeliveryPolicy() {
  try {
    const [success, result] = await callApi("GET", deliveryPolicyUrl)
    if (success && result.success) {
      homepageData.deliveryPolicies = result.data
    }
  } catch (error) {
    console.error("Error loading delivery policy:", error)
  }
}

async function loadCategories() {
  try {
    const [success, result] = await callApi("GET", categoriesUrl)
    if (success && result.success) {
      homepageData.categories = result.data
    }
  } catch (error) {
    console.error("Error loading categories:", error)
  }
}

async function loadVideos() {
  try {
    const [success, result] = await callApi("GET", videosUrl)
    if (success && result.success) {
      homepageData.videos = result.data
    }
  } catch (error) {
    console.error("Error loading videos:", error)
  }
}

async function loadFeatures() {
  try {
    const [success, result] = await callApi("GET", featuresUrl)
    if (success && result.success) {
      homepageData.features = result.data
    }
  } catch (error) {
    console.error("Error loading features:", error)
  }
}

async function loadAboutSection() {
  try {
    const [success, result] = await callApi("GET", aboutUrl)
    if (success && result.success) {
      homepageData.about = result.data
    }
  } catch (error) {
    console.error("Error loading about section:", error)
  }
}

async function loadProductSections() {
  try {
    const [success, result] = await callApi("GET", productSectionsUrl)
    if (success && result.success) {
      homepageData.productSections = result.data
    }
  } catch (error) {
    console.error("Error loading product sections:", error)
  }
}

async function loadClientLogos() {
  try {
    const [success, result] = await callApi("GET", clientLogosUrl)
    if (success && result.success) {
      homepageData.clientLogos = result.data
    }
  } catch (error) {
    console.error("Error loading client logos:", error)
  }
}

async function loadFooterContent() {
  try {
    const [success, result] = await callApi("GET", footerUrl)
    if (success && result.success) {
      homepageData.footerContent = result.data
    }
  } catch (error) {
    console.error("Error loading footer content:", error)
  }
}

function renderHeroBanners() {
  const indicatorsContainer = document.getElementById("carousel-indicators")
  const innerContainer = document.getElementById("carousel-inner")

  if (!homepageData.banners.length) return

  // Clear existing content
  indicatorsContainer.innerHTML = ""
  innerContainer.innerHTML = ""

  // Create indicators
  homepageData.banners.forEach((banner, index) => {
    const indicator = document.createElement("button")
    indicator.type = "button"
    indicator.setAttribute("data-bs-target", "#seasonalCarousel")
    indicator.setAttribute("data-bs-slide-to", index)
    indicator.setAttribute("aria-label", `Slide ${index + 1}`)
    if (index === 0) {
      indicator.classList.add("active")
      indicator.setAttribute("aria-current", "true")
    }
    indicatorsContainer.appendChild(indicator)
  })

  // Create carousel items
  homepageData.banners.forEach((banner, index) => {
    const carouselItem = document.createElement("div")
    carouselItem.className = `carousel-item${index === 0 ? " active" : ""}`

    carouselItem.innerHTML = `
            <div class="seasonal-slide" style="background-image: url('${banner.image}')">
                <div class="carousel-caption text-start">
                    <h3>${banner.title}</h3>
                    ${banner.description ? `<p>${banner.description}</p>` : ""}
                    ${banner.button_link ? `<a href="${banner.button_link}" class="btn of-btn-primary rounded-pill">${banner.button_text}</a>` : ""}
                </div>
            </div>
        `

    innerContainer.appendChild(carouselItem)
  })
}

function renderDeliveryPolicy() {
  const container = document.getElementById("delivery-policy-container")
  if (!homepageData.deliveryPolicies.length) return

  container.innerHTML = homepageData.deliveryPolicies
    .map((policy) => {
      if (policy.policy_type === "same_day" || policy.policy_type === "midnight") {
        return `
                <div class="col-md-4">
                    <div class="delivery-card">
                        <div class="honect-card-header text-center">
                            <i class="${policy.icon} me-2"></i> ${policy.title}
                        </div>
                        <div class="honect-card-body">
                            <div class="timer-container">
                                <div>
                                    <div class="countdown" id="${policy.policy_type}-countdown">
                                        ${String(policy.countdown_hours).padStart(2, "0")}:${String(policy.countdown_minutes).padStart(2, "0")}:${String(policy.countdown_seconds).padStart(2, "0")}
                                    </div>
                                    <div class="time-label">Time Remaining</div>
                                </div>
                                <div class="text-end">
                                    <i class="far fa-clock clock-icon"></i>
                                </div>
                            </div>
                            ${
                              policy.delivery_time
                                ? `
                                <div class="delivery-time">
                                    <i class="fas fa-calendar-day me-2"></i> Delivery Time: ${policy.delivery_time}
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                </div>
            `
      } else {
        return `
                <div class="col-md-4">
                    <div class="info-card">
                        <div class="info-header text-center">
                            <i class="${policy.icon} me-2"></i> ${policy.title}
                        </div>
                        <div class="info-body">
                            <p class="mb-0">${policy.description}</p>
                        </div>
                    </div>
                </div>
            `
      }
    })
    .join("")
}

function renderCategories() {
  const container = document.getElementById("categories-container")
  if (!homepageData.categories.length) return

  container.innerHTML = homepageData.categories
    .map(
      (category) => `
        <div class="dashboard-main-card">
            <div class="category-card">
                <div class="category-img">
                    <img src="${category.image}" alt="${category.title}" class="img-fluid">
                </div>
                <div class="category-body">
                    <h4 class="category-heading">${category.title}</h4>
                    ${category.description ? `<p>${category.description}</p>` : ""}
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderVideos() {
  const container = document.getElementById("videos-container")
  if (!homepageData.videos.length) return

  const leftVideo = homepageData.videos.find((v) => v.position === "left")
  const rightVideo = homepageData.videos.find((v) => v.position === "right")
  const centerText = homepageData.videos.find((v) => v.position === "center_text")

  container.innerHTML = `
        <!-- Left Video -->
        <div class="col-12 col-lg-4 d-flex justify-content-center align-items-center overflow-hidden p-0">
            ${leftVideo ? `<video src="${leftVideo.video_url}" class="video-portrait" autoplay muted loop playsinline></video>` : ""}
        </div>

        <!-- Center Card -->
        <div class="col-12 col-lg-4 d-flex justify-content-center align-items-center p-4">
            <div class="card border-0 p-4 rounded-4 shadow-lg w-100 bg-light text-dark text-center">
                <h3 class="card-title" style="font-family: 'Dancing Script', cursive; font-size: 1.8rem;">
                    ${centerText ? centerText.text_content : '"Here is Every bite is a celebration,<br>Every petals whisper poetry"'}
                </h3>
            </div>
        </div>

        <!-- Right Video -->
        <div class="col-12 col-lg-4 d-flex justify-content-center align-items-center overflow-hidden p-0">
            ${rightVideo ? `<video src="${rightVideo.video_url}" class="video-portrait" autoplay muted loop playsinline></video>` : ""}
        </div>
    `
}

function renderFeatures() {
  const container = document.getElementById("features-container")
  if (!homepageData.features.length) return

  container.innerHTML = homepageData.features
    .map(
      (feature) => `
        <div class="col-md-3">
            <div class="d-flex align-items-center of-border-primary rounded-5 p-3"
                style="border: 2px solid; background-color: var(--of-primary-fully-faded-color);">
                <div class="icon-box me-3" style="background-color: white !important;">
                    <i class="${feature.icon}"></i>
                </div>
                <div>
                    <h5 class="mb-1">${feature.title}</h5>
                    <p class="mb-0" style="color: #6a0572 !important;">${feature.description}</p>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderAboutSection() {
  const container = document.getElementById("about-container")
  if (!homepageData.about) return

  const about = homepageData.about

  container.innerHTML = `
        <div class="row align-items-center">
            <div class="col-lg-6 mb-4 mb-lg-0">
                <div class="about-img position-relative">
                    <img src="${about.main_image}" alt="About Oven Fresh" class="img-fluid rounded-4 shadow">
                    <div class="experience-badge">
                        <span class="years">${about.years_experience}+</span>
                        <span class="text">Years of Experience</span>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="section-title">
                    <h6 class="of-text-primary text-uppercase">${about.subtitle}</h6>
                    <h2>${about.title}</h2>
                </div>
                <p>${about.description_1}</p>
                <p>${about.description_2}</p>
                <div class="row g-4 mt-4">
                    ${
                      about.features
                        ? about.features
                            .map(
                              (feature) => `
                        <div class="col-sm-6">
                            <div class="d-flex align-items-center">
                                <div class="icon-box me-3">
                                    <i class="${feature.icon}"></i>
                                </div>
                                <div>
                                    <h5 class="mb-1">${feature.title}</h5>
                                    <p class="mb-0">${feature.description}</p>
                                </div>
                            </div>
                        </div>
                    `,
                            )
                            .join("")
                        : ""
                    }
                </div>
                <a href="${about.button_link}" class="btn of-btn-primary rounded-pill mt-4">${about.button_text}</a>
            </div>
        </div>
    `
}

function renderProductSections() {
  const container = document.getElementById("product-sections-container")
  if (!homepageData.productSections.length) return

  container.innerHTML = homepageData.productSections
    .map(
      (section) => `
        <section id="bestsellers" class="py-5">
            <div class="container">
                <div class="section-title text-center mb-5">
                    <h2>${section.title}</h2>
                    ${section.description ? `<p class="text-muted">${section.description}</p>` : ""}
                </div>
                <div class="row g-4">
                    ${
                      section.items
                        ? section.items
                            .map(
                              (item) => `
                        <div class="col-md-6 col-lg-3">
                            <div class="product-card">
                                <div class="product-img">
                                    <img src="${item.product_details.image}" alt="${item.product_details.title}" class="img-fluid">
                                    <div class="product-actions">
                                        <a href="#" class="btn-product-action"><i class="fas fa-heart"></i></a>
                                        <a href="#" class="btn-product-action"><i class="fas fa-shopping-cart"></i></a>
                                        <a href="#" class="btn-product-action"><i class="fas fa-eye"></i></a>
                                    </div>
                                </div>
                                <div class="product-body">
                                    <h5>${item.product_details.title}</h5>
                                    <div class="product-rating mb-2">
                                        ${generateStars(item.product_details.rating)}
                                        <span class="ms-2">(${item.product_details.reviews})</span>
                                    </div>
                                    <div class="product-price">
                                        <span class="price">${item.product_details.price}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                            )
                            .join("")
                        : ""
                    }
                </div>
            </div>
        </section>
    `,
    )
    .join("")
}

function renderClientLogos() {
  const container = document.getElementById("client-logos-container")
  if (!homepageData.clientLogos.length) return

  // Duplicate logos for infinite scroll effect
  const duplicatedLogos = [...homepageData.clientLogos, ...homepageData.clientLogos]

  container.innerHTML = duplicatedLogos
    .map(
      (logo) => `
        <div class="client-logo">
            <img src="${logo.logo_url}" alt="${logo.company_name}">
        </div>
    `,
    )
    .join("")
}

function renderFooterContent() {
  const container = document.getElementById("footer-container")
  if (!homepageData.footerContent.length) return

  // Group footer content by section type
  const groupedContent = homepageData.footerContent.reduce((acc, item) => {
    if (!acc[item.section_type]) {
      acc[item.section_type] = []
    }
    acc[item.section_type].push(item)
    return acc
  }, {})

  container.innerHTML = `
        <div class="row g-4">
            ${Object.entries(groupedContent)
              .map(([sectionType, items]) => {
                const item = items[0] // Take first item for each section
                return `
                    <div class="col-lg-${sectionType === "company_info" ? "3" : "2"} ${sectionType === "newsletter" ? "col-lg-3" : ""}">
                        <div class="footer-${sectionType.replace("_", "-")}">
                            <h5 class="mb-4">${item.title}</h5>
                            ${item.content}
                        </div>
                    </div>
                `
              })
              .join("")}
        </div>
        <hr class="mt-4 mb-3">
        <div class="row">
            <div class="col-md-6">
                <p class="mb-md-0">&copy; 2025 OvenFresh. All Rights Reserved.</p>
            </div>
            <div class="col-md-6 text-md-end">
                <p class="mb-0">
                    <a href="#" class="me-3">Privacy Policy</a>
                    <a href="#" class="me-3">Terms of Service</a>
                    <a href="#">FAQ</a>
                </p>
            </div>
        </div>
    `
}

function generateStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  let stars = ""

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>'
  }

  // Half star
  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>'
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>'
  }

  return stars
}

function initializeCarousel() {
  // Bootstrap carousel is automatically initialized
}

function initializeCategoryScroll() {
  const scrollable = document.getElementById("categories-container")
  const dotsContainer = document.getElementById("categories-dots")

  if (!scrollable || !homepageData.categories.length) return

  // Create dots
  dotsContainer.innerHTML = ""
  homepageData.categories.forEach((_, index) => {
    const dot = document.createElement("div")
    dot.classList.add("dashboard-dot")
    if (index === 0) dot.classList.add("active")
    dotsContainer.appendChild(dot)
  })

  const dots = document.querySelectorAll(".dashboard-dot")

  // Update dots on scroll
  scrollable.addEventListener("scroll", () => {
    const scrollLeft = scrollable.scrollLeft
    const scrollWidth = scrollable.scrollWidth - scrollable.clientWidth

    const activeIndex = Math.round((scrollLeft / scrollWidth) * (dots.length - 1))

    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === activeIndex)
    })
  })
}

function initializeCountdowns() {
  homepageData.deliveryPolicies.forEach((policy) => {
    if (policy.policy_type === "same_day" || policy.policy_type === "midnight") {
      updateCountdown(
        `${policy.policy_type}-countdown`,
        policy.countdown_hours,
        policy.countdown_minutes,
        policy.countdown_seconds,
      )
    }
  })
}

function updateCountdown(elementId, hours, minutes, seconds) {
  const countdownElement = document.getElementById(elementId)
  if (!countdownElement) return

  const interval = setInterval(() => {
    if (seconds > 0) {
      seconds--
    } else {
      if (minutes > 0) {
        minutes--
        seconds = 59
      } else {
        if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        } else {
          clearInterval(interval)
          countdownElement.textContent = "00:00:00"
          return
        }
      }
    }

    const formattedHours = hours.toString().padStart(2, "0")
    const formattedMinutes = minutes.toString().padStart(2, "0")
    const formattedSeconds = seconds.toString().padStart(2, "0")

    countdownElement.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
  }, 1000)
}

function showLoading() {
  const loader = document.getElementById("loader")
  if (loader) loader.style.display = "flex"
}

function hideLoading() {
  const loader = document.getElementById("loader")
  if (loader) loader.style.display = "none"
}

// Initialize on page load
window.onload = () => {
  toggle_loader()

  // Scroll effect for menu
  window.addEventListener("scroll", () => {
    const menuBar = document.querySelector(".main-menu")
    const scrollTrigger = 95

    if (window.scrollY >= scrollTrigger) {
      menuBar.classList.add("fixed-top")
    } else {
      menuBar.classList.remove("fixed-top")
    }
  })
}

// // Mock functions to resolve errors
// async function callApi(method, url) {
//   // Replace this with your actual API call logic
//   console.log(`Mock API call: ${method} ${url}`)
//   return [true, { success: true, data: [] }] // Example response
// }

// function toggle_loader() {
//   // Replace this with your actual loader toggle logic
//   console.log("Mock toggle_loader function")
// }
