let csrf_token = null
let hero_banners_url = null
let delivery_policies_url = null
let homepage_categories_url = null
let videos_url = null
let features_url = null
let about_section_url = null
let product_sections_url = null
let client_logos_url = null

// Data storage
let heroBannersData = []
let deliveryPoliciesData = []
let homepageCategoriesData = []
let featuresData = []
let videosData = []
let aboutSectionData = null
let productSectionsData = []
let clientLogosData = []

function HomeDynamic(
  csrfTokenParam,
  heroBannersUrlParam,
  deliveryPoliciesUrlParam,
  homepageCategoriesUrlParam,
  videosUrlParam,
  featuresUrlParam,
  aboutSectionUrlParam,
  productSectionsUrlParam,
  clientLogosUrlParam,
) {
  csrf_token = csrfTokenParam
  hero_banners_url = heroBannersUrlParam
  delivery_policies_url = deliveryPoliciesUrlParam
  homepage_categories_url = homepageCategoriesUrlParam
  videos_url = videosUrlParam
  features_url = featuresUrlParam
  about_section_url = aboutSectionUrlParam
  product_sections_url = productSectionsUrlParam
  client_logos_url = clientLogosUrlParam

  // Initialize the page
  document.addEventListener("DOMContentLoaded", async () => {
    await loadAllSections()
    initializeCountdowns()
    hideLoader()
  })
}

async function loadAllSections() {
  try {
    await Promise.all([
      loadHeroBanners(),
      // loadDeliveryPolicies(),
      loadHomepageCategories(),
      loadVideos(),
      loadFeatures(),
      loadAboutSection(),
      loadProductSections(),
      loadClientLogos(),
    ])
  } catch (error) {
    console.error("Error loading sections:", error)
  }
}

async function loadHeroBanners() {
  try {
    const response = await fetch(hero_banners_url)
    const data = await response.json()

    if (data.success && data.data) {
      heroBannersData = data.data
      renderHeroBanners()
    }
  } catch (error) {
    console.error("Error loading hero banners:", error)
  }
}

function renderHeroBanners() {
  const indicatorsContainer = document.getElementById("hero-indicators")
  const carouselInner = document.getElementById("hero-carousel-inner")

  if (!heroBannersData.length) return

  // Clear existing content
  indicatorsContainer.innerHTML = ""
  carouselInner.innerHTML = ""

  heroBannersData.forEach((banner, index) => {
    // Create indicator
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

    // Create carousel item
    const carouselItem = document.createElement("div")
    carouselItem.className = `carousel-item${index === 0 ? " active" : ""}`

    carouselItem.innerHTML = `
      <div class="seasonal-slide">
        <img src="${banner.image}" alt="${banner.title}">
        <div class="carousel-caption text-start">
          <h3>${banner.title}</h3>
          ${banner.subtitle ? `<p>${banner.subtitle}</p>` : ""}
          ${
            banner.button_text && banner.button_link
              ? `<a href="${banner.button_link}" class="btn of-btn-primary rounded-pill">${banner.button_text}</a>`
              : ""
          }
        </div>
      </div>
    `;


    carouselInner.appendChild(carouselItem)
  })
}

async function loadDeliveryPolicies() {
  try {
    const response = await fetch(delivery_policies_url)
    const data = await response.json()

    if (data.success && data.data) {
      deliveryPoliciesData = data.data
      renderDeliveryPolicies()
    }
  } catch (error) {
    console.error("Error loading delivery policies:", error)
  }
}

function renderDeliveryPolicies() {
  const container = document.getElementById("delivery-policies-container")
  if (!deliveryPoliciesData.length) return

  container.innerHTML = ""

  deliveryPoliciesData.forEach((policy) => {
    const policyElement = document.createElement("div")

    if (policy.policy_type === "same_day" || policy.policy_type === "midnight") {
      policyElement.className = "col-md-4"
      policyElement.innerHTML = `
                <div class="delivery-card">
                    <div class="honect-card-header text-center">
                        <i class="${policy.icon} me-2"></i> ${policy.title}
                    </div>
                    <div class="honect-card-body">
                        <div class="timer-container">
                            <div>
                                <div class="countdown" id="${policy.policy_type}-countdown">
                                    ${formatCountdown(policy.countdown_hours, policy.countdown_minutes, policy.countdown_seconds)}
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
            `
    } else if (policy.policy_type === "info") {
      policyElement.className = "col-md-4"
      policyElement.innerHTML = `
                <div class="row g-4">
                    <div class="col-12">
                        <div class="info-card">
                            <div class="info-header text-center">
                                <i class="${policy.icon} me-2"></i> ${policy.title}
                            </div>
                            <div class="info-body">
                                ${policy.description ? `<p class="mb-0">${policy.description}</p>` : ""}
                            </div>
                        </div>
                    </div>
                </div>
            `
    }

    container.appendChild(policyElement)
  })
}

function formatCountdown(hours, minutes, seconds) {
  const h = String(hours || 0).padStart(2, "0")
  const m = String(minutes || 0).padStart(2, "0")
  const s = String(seconds || 0).padStart(2, "0")
  return `${h}:${m}:${s}`
}

async function loadHomepageCategories() {
  try {
    const response = await fetch(homepage_categories_url)
    const data = await response.json()

    if (data.success && data.data) {
      homepageCategoriesData = data.data
      renderHomepageCategories()
    }
  } catch (error) {
    console.error("Error loading homepage categories:", error)
  }
}

function renderHomepageCategories() {
  const container = document.getElementById("scrollable")
  if (!homepageCategoriesData.length) return

  container.innerHTML = ""

  homepageCategoriesData.forEach((category) => {
    const categoryElement = document.createElement("div")
    categoryElement.className = "dashboard-main-card"

    categoryElement.innerHTML = `
            <div class="category-card">
                <div class="category-img">
                    <img src="${category.image}" alt="${category.title}" class="img-fluid">
                </div>
                <div class="category-body">
                    <h4 class="category-heading">${category.title}</h4>
                    ${category.description ? `<p>${category.description}</p>` : ""}
                </div>
            </div>
        `

    if (category.category_link) {
      categoryElement.addEventListener("click", () => {
        window.location.href = category.category_link
      })
      categoryElement.style.cursor = "pointer"
    }

    container.appendChild(categoryElement)

    
  })

  const scrollable = document.getElementById('scrollable');
  const dotsContainer = document.querySelector('.dashboard-dots-container');
  const cards = document.querySelectorAll('.dashboard-main-card');

  // Create dots based on the number of cards
  cards.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.classList.add('dashboard-dot');
      if (index === 0) dot.classList.add('active');
      dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll('.dashboard-dot');

  // Update dots on scroll
  scrollable.addEventListener('scroll', () => {
      const scrollLeft = scrollable.scrollLeft;
      const scrollWidth = scrollable.scrollWidth - scrollable.clientWidth;

      // Calculate the active dot
      const activeIndex = Math.round(
          (scrollLeft / scrollWidth) * (dots.length - 1)
      );

      dots.forEach((dot, index) => {
          if (index === activeIndex) {
              dot.classList.add('active');
          } else {
              dot.classList.remove('active');
          }
      });
  });

}

async function loadVideos() {
  try {
    const response = await fetch(videos_url)
    const data = await response.json()

    if (data.success && data.data) {
      videosData = data.data
      renderVideos()
    }
  } catch (error) {
    console.error("Error loading features:", error)
  }
}

function renderVideos() {
  videosData.forEach((video) => {
    if (video.position == "left") {
      document.getElementById("videoLeft").src = video.video_url
    }
    else if (video.position == "right") {
      document.getElementById("videoRight").src = video.video_url
    }
    else if (video.position == "center_text") {
      document.getElementById("videoTextCenter").innerText = video.text_content
    }
  })
}


async function loadFeatures() {
  try {
    const response = await fetch(features_url)
    const data = await response.json()

    if (data.success && data.data) {
      featuresData = data.data
      renderFeatures()
    }
  } catch (error) {
    console.error("Error loading features:", error)
  }
}

function renderFeatures() {
  const container = document.getElementById("features-container")
  if (!featuresData.length) return

  container.innerHTML = ""

  featuresData.forEach((feature) => {
    const featureElement = document.createElement("div")
    featureElement.className = "col-md-3"

    featureElement.innerHTML = `
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
        `

    container.appendChild(featureElement)
  })
}

async function loadAboutSection() {
  try {
    const response = await fetch(about_section_url)
    const data = await response.json()

    if (data.success && data.data) {
      aboutSectionData = data.data
      renderAboutSection()
    }
  } catch (error) {
    console.error("Error loading about section:", error)
  }
}

function renderAboutSection() {
  const container = document.getElementById("about-container")
  if (!aboutSectionData) return

  container.innerHTML = `
        <div class="row align-items-center">
            <div class="col-lg-6 mb-4 mb-lg-0">
                <div class="about-img position-relative">
                    <img src="${aboutSectionData.main_image}" alt="About Oven Fresh" class="img-fluid rounded-4 shadow">
                    <div class="experience-badge">
                        <span class="years">${aboutSectionData.years_experience}+</span>
                        <span class="text">Years of Experience</span>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="section-title">
                    <h6 class="of-text-primary text-uppercase">${aboutSectionData.subtitle}</h6>
                    <h2>${aboutSectionData.title}</h2>
                </div>
                <p>${aboutSectionData.description_1}</p>
                <p>${aboutSectionData.description_2}</p>
                <div class="row g-4 mt-4" id="about-features-container">
                    <!-- About features will be loaded here -->
                </div>
                <a href="${aboutSectionData.button_link}" class="btn of-btn-primary rounded-pill mt-4">${aboutSectionData.button_text}</a>
            </div>
        </div>
    `

  // Render about features
  if (aboutSectionData.features && aboutSectionData.features.length) {
    const featuresContainer = document.getElementById("about-features-container")
    aboutSectionData.features.forEach((feature) => {
      const featureElement = document.createElement("div")
      featureElement.className = "col-sm-6"

      featureElement.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="icon-box me-3">
                        <i class="${feature.icon}"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">${feature.title}</h5>
                        <p class="mb-0">${feature.description}</p>
                    </div>
                </div>
            `

      featuresContainer.appendChild(featureElement)
    })
  }
}

async function loadProductSections() {
  try {
    const response = await fetch(product_sections_url)
    const data = await response.json()

    if (data.success && data.data) {
      productSectionsData = data.data
      renderProductSections()
    }
  } catch (error) {
    console.error("Error loading product sections:", error)
  }
}

function renderProductSections() {
  const container = document.getElementById("product-sections-container")
  if (!productSectionsData.length) return

  container.innerHTML = ""

  productSectionsData.forEach((section) => {
    const sectionElement = document.createElement("section")
    sectionElement.id = `product-section-${section.id}`
    sectionElement.className = "py-5"

    // Get products based on section type
    let products = []
    // if (section.section_type === "custom" && section.items) {
    //   products = section.items.map((item) => item.product_details).filter((p) => p && p.is_active)
    // } else if (section.dynamic_products) {
    //   products = section.dynamic_products.filter((p) => p && p.is_active)
    // }
    products = section.dynamic_products.filter((p) => p && p.is_active)
    // Limit products to max_products
    products = products.slice(0, section.max_products)
    console.log(products)

    sectionElement.innerHTML = `
            <div class="container">
                <div class="section-title text-center mb-5">
                    ${section.subtitle ? `<h6 class="text-primary text-uppercase">${section.subtitle}</h6>` : ""}
                    <h2>${section.title}</h2>
                    ${section.description ? `<p class="text-muted">${section.description}</p>` : ""}
                </div>
                <div class="row g-4" id="products-container-${section.id}">
                    <!-- Products will be loaded here -->
                </div>
            </div>
        `

    container.appendChild(sectionElement)

    // Render products
    const productsContainer = document.getElementById(`products-container-${section.id}`)
    products.forEach((product) => {
      const productElement = document.createElement("div")
      productElement.className = "col-md-6 col-lg-3 d-flex"

      productElement.innerHTML = `
                <div class="product-card h-100" onclick="goToProductDetail(${product.product_id})">
                    <div class="product-img">
                        ${product.is_featured ? '<span class="badge bg-danger position-absolute top-0 end-0 mt-2 me-2">Hot Selling</span>' : ""}
                        <img src="${product.photos && product.photos.length ? product.photos[0] : "https://via.placeholder.com/300x300"}" 
                             alt="${product.title}" class="img-fluid">
                        ${
                          section.show_add_to_cart
                            ? `
                            <div class="product-actions">
                                <a href="/product-detail/?product_id=${product.product_id}" class="btn-product-action"><i class="fas fa-heart"></i></a>
                                <a href="/product-detail/?product_id=${product.product_id}" class="btn-product-action"><i class="fas fa-shopping-cart"></i></a>
                                <a href="/product-detail/?product_id=${product.product_id}" class="btn-product-action"><i class="fas fa-eye"></i></a>
                            </div>
                        `
                            : ""
                        }
                    </div>
                    <div class="product-body">
                        <h5>${product.title}</h5>
                        ${
                          section.show_price
                            ? `
                            <div class="product-price">
                                <span class="price">₹${product.product_variation[0].actual_price || "0.00"}</span>
                            </div>
                        `
                            : ""
                        }
                    </div>
                </div>
            `

            // ${
            //     section.show_rating
            //       ? `
            //       <div class="product-rating mb-2">
            //           <i class="fas fa-star"></i>
            //           <i class="fas fa-star"></i>
            //           <i class="fas fa-star"></i>
            //           <i class="fas fa-star"></i>
            //           <i class="fas fa-star-half-alt"></i>
            //           <span class="ms-2">(${Math.floor(Math.random() * 50) + 10})</span>
            //       </div>
            //   `
            //       : ""
            //   }

      productsContainer.appendChild(productElement)
    })
  })
}

function shortenText(text, maxLength = 20) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function goToProductDetail(productId) {
  window.location.href = `/product-detail/?product_id=${productId}`
}

async function loadClientLogos() {
  try {
    const response = await fetch(client_logos_url)
    const data = await response.json()

    if (data.success && data.data) {
      clientLogosData = data.data
      renderClientLogos()
    }
  } catch (error) {
    console.error("Error loading client logos:", error)
  }
}

function renderClientLogos() {
  const container = document.getElementById("client-logos-container")
  if (!clientLogosData.length) return

  container.innerHTML = ""

  // Duplicate logos for infinite scroll effect
  const duplicatedLogos = [...clientLogosData, ...clientLogosData]

  duplicatedLogos.forEach((logo) => {
    const logoElement = document.createElement("div")
    logoElement.className = "client-logo"

    if (logo.website_url) {
      logoElement.innerHTML = `
                <a href="${logo.website_url}" target="_blank" rel="noopener noreferrer">
                    <img src="${logo.logo_url}" alt="${logo.company_name}">
                </a>
            `
    } else {
      logoElement.innerHTML = `<img src="${logo.logo_url}" alt="${logo.company_name}">`
    }

    container.appendChild(logoElement)
  })
}

function initializeCountdowns() {
  // Initialize countdown timers for delivery policies
  deliveryPoliciesData.forEach((policy) => {
    if (policy.policy_type === "same_day" || policy.policy_type === "midnight") {
      const countdownElement = document.getElementById(`${policy.policy_type}-countdown`)
      if (countdownElement && policy.countdown_hours && policy.countdown_minutes && policy.countdown_seconds) {
        startCountdown(countdownElement, policy.countdown_hours, policy.countdown_minutes, policy.countdown_seconds)
      }
    }
  })
}

function startCountdown(element, hours, minutes, seconds) {
  let totalSeconds = hours * 3600 + minutes * 60 + seconds

  const timer = setInterval(() => {
    if (totalSeconds <= 0) {
      clearInterval(timer)
      element.textContent = "00:00:00"
      return
    }

    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    element.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    totalSeconds--
  }, 1000)
}

function hideLoader() {
  const loader = document.getElementById("loader")
  const mainContent = document.getElementById("main-content")

  if (loader) {
    loader.style.display = "none"
  }

  if (mainContent) {
    mainContent.classList.remove("blur")
  }
}
