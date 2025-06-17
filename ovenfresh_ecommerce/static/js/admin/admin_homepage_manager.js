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

async function InitializeHomepageManager(
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
    await loadAllSections()

    // Render all sections
    renderAllSections()

    hideLoading()
  } catch (error) {
    console.error("Error initializing homepage manager:", error)
    showNotification("Error loading homepage data.", "error")
    hideLoading()
  }
}

async function loadAllSections() {
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

function renderAllSections() {
  renderHeroBanners()
  renderDeliveryPolicy()
  renderCategories()
  renderVideos()
  renderFeatures()
  renderAboutSection()
  renderProductSections()
  renderClientLogos()
  updateCounts()
}

function renderHeroBanners() {
  const container = document.getElementById("hero-banners-list")

  if (!homepageData.banners.length) {
    container.innerHTML = '<p class="text-muted">No hero banners found. Click "Add Banner" to create one.</p>'
    return
  }

  container.innerHTML = homepageData.banners
    .map(
      (banner) => `
        <div class="content-item" data-id="${banner.id}">
            <div class="row align-items-center">
                <div class="col-md-2">
                    <img src="${banner.image}" alt="${banner.title}" class="preview-image">
                </div>
                <div class="col-md-6">
                    <h6 class="mb-1">${banner.title}</h6>
                    <p class="mb-1 text-muted small">${banner.description || "No description"}</p>
                    <span class="badge ${banner.is_active ? "bg-success" : "bg-secondary"} status-badge">
                        ${banner.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
                <div class="col-md-2 text-center">
                    <span class="badge bg-primary">Order: ${banner.order}</span>
                </div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editHeroBanner(${banner.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteHeroBanner(${banner.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderDeliveryPolicy() {
  const container = document.getElementById("delivery-policy-list")

  if (!homepageData.deliveryPolicies.length) {
    container.innerHTML = '<p class="text-muted">No delivery policies found. Click "Add Policy" to create one.</p>'
    return
  }

  container.innerHTML = homepageData.deliveryPolicies
    .map(
      (policy) => `
        <div class="content-item" data-id="${policy.id}">
            <div class="row align-items-center">
                <div class="col-md-1 text-center">
                    <i class="${policy.icon} fa-2x text-primary"></i>
                </div>
                <div class="col-md-6">
                    <h6 class="mb-1">${policy.title}</h6>
                    <p class="mb-1 text-muted small">${policy.get_policy_type_display || policy.policy_type}</p>
                    <span class="badge ${policy.is_active ? "bg-success" : "bg-secondary"} status-badge">
                        ${policy.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
                <div class="col-md-3">
                    ${
                      policy.countdown_hours !== null
                        ? `
                        <small class="text-muted">Countdown: ${policy.countdown_hours}:${policy.countdown_minutes}:${policy.countdown_seconds}</small>
                    `
                        : ""
                    }
                </div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editDeliveryPolicy(${policy.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDeliveryPolicy(${policy.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderCategories() {
  const container = document.getElementById("categories-list")

  if (!homepageData.categories.length) {
    container.innerHTML = '<p class="text-muted">No categories found. Click "Add Category" to create one.</p>'
    return
  }

  container.innerHTML = homepageData.categories
    .map(
      (category) => `
        <div class="content-item" data-id="${category.id}">
            <div class="row align-items-center">
                <div class="col-md-2">
                    <img src="${category.image}" alt="${category.title}" class="preview-image">
                </div>
                <div class="col-md-6">
                    <h6 class="mb-1">${category.title}</h6>
                    <p class="mb-1 text-muted small">${category.description || "No description"}</p>
                    <span class="badge ${category.is_active ? "bg-success" : "bg-secondary"} status-badge">
                        ${category.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
                <div class="col-md-2 text-center">
                    <span class="badge bg-primary">Order: ${category.order}</span>
                </div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editCategory(${category.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderVideos() {
  const container = document.getElementById("videos-list")

  if (!homepageData.videos.length) {
    container.innerHTML = '<p class="text-muted">No videos found. Click "Add Video" to create one.</p>'
    return
  }

  container.innerHTML = homepageData.videos
    .map(
      (video) => `
        <div class="content-item" data-id="${video.id}">
            <div class="row align-items-center">
                <div class="col-md-2">
                    <span class="badge bg-info">${video.get_position_display || video.position}</span>
                </div>
                <div class="col-md-6">
                    ${
                      video.video_url
                        ? `
                        <h6 class="mb-1">Video Content</h6>
                        <p class="mb-1 text-muted small">${video.video_url}</p>
                    `
                        : `
                        <h6 class="mb-1">Text Content</h6>
                        <p class="mb-1 text-muted small">${video.text_content}</p>
                    `
                    }
                    <span class="badge ${video.is_active ? "bg-success" : "bg-secondary"} status-badge">
                        ${video.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
                <div class="col-md-2"></div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editVideo(${video.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteVideo(${video.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderFeatures() {
  const container = document.getElementById("features-list")

  if (!homepageData.features.length) {
    container.innerHTML = '<p class="text-muted">No features found. Click "Add Feature" to create one.</p>'
    return
  }

  container.innerHTML = homepageData.features
    .map(
      (feature) => `
        <div class="content-item" data-id="${feature.id}">
            <div class="row align-items-center">
                <div class="col-md-1 text-center">
                    <i class="${feature.icon} fa-2x text-primary"></i>
                </div>
                <div class="col-md-7">
                    <h6 class="mb-1">${feature.title}</h6>
                    <p class="mb-1 text-muted small">${feature.description}</p>
                    <span class="badge ${feature.is_active ? "bg-success" : "bg-secondary"} status-badge">
                        ${feature.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
                <div class="col-md-2 text-center">
                    <span class="badge bg-primary">Order: ${feature.order}</span>
                </div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editFeature(${feature.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteFeature(${feature.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderAboutSection() {
  const container = document.getElementById("about-details")

  if (!homepageData.about) {
    container.innerHTML = '<p class="text-muted">No about section found. Click "Edit About" to create one.</p>'
    return
  }

  const about = homepageData.about
  container.innerHTML = `
        <div class="content-item">
            <div class="row">
                <div class="col-md-3">
                    <img src="${about.main_image}" alt="About Image" class="img-fluid rounded">
                </div>
                <div class="col-md-9">
                    <h5>${about.title}</h5>
                    <h6 class="text-muted">${about.subtitle}</h6>
                    <p class="mb-2">${about.description_1}</p>
                    <p class="mb-2">${about.description_2}</p>
                    <div class="d-flex align-items-center">
                        <span class="badge bg-info me-2">${about.years_experience}+ Years Experience</span>
                        <span class="badge ${about.is_active ? "bg-success" : "bg-secondary"}">
                            ${about.is_active ? "Active" : "Inactive"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `
}

function renderProductSections() {
  const container = document.getElementById("product-sections-list")

  if (!homepageData.productSections.length) {
    container.innerHTML = '<p class="text-muted">No product sections found. Click "Add Section" to create one.</p>'
    return
  }

  container.innerHTML = homepageData.productSections
    .map(
      (section) => `
        <div class="content-item" data-id="${section.id}">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <h6 class="mb-1">${section.title}</h6>
                    <p class="mb-1 text-muted small">${section.description || "No description"}</p>
                    <span class="badge bg-info me-1">${section.section_type}</span>
                    <span class="badge ${section.is_active ? "bg-success" : "bg-secondary"} status-badge">
                        ${section.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
                <div class="col-md-2 text-center">
                    <span class="badge bg-primary">Order: ${section.order}</span>
                </div>
                <div class="col-md-2 text-center">
                    <span class="badge bg-secondary">${section.items ? section.items.length : 0} Products</span>
                </div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editProductSection(${section.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProductSection(${section.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderClientLogos() {
  const container = document.getElementById("client-logos-list")

  if (!homepageData.clientLogos.length) {
    container.innerHTML = '<p class="text-muted">No client logos found. Click "Add Logo" to create one.</p>'
    return
  }

  container.innerHTML = homepageData.clientLogos
    .map(
      (logo) => `
        <div class="content-item" data-id="${logo.id}">
            <div class="row align-items-center">
                <div class="col-md-2">
                    <img src="${logo.logo_url}" alt="${logo.company_name}" class="preview-image">
                </div>
                <div class="col-md-6">
                    <h6 class="mb-1">${logo.company_name}</h6>
                    <p class="mb-1 text-muted small">${logo.website_url || "No website"}</p>
                    <span class="badge ${logo.is_active ? "bg-success" : "bg-secondary"} status-badge">
                        ${logo.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
                <div class="col-md-2 text-center">
                    <span class="badge bg-primary">Order: ${logo.order}</span>
                </div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editClientLogo(${logo.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteClientLogo(${logo.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function updateCounts() {
  document.getElementById("hero-banners-count").textContent = homepageData.banners.length
  document.getElementById("delivery-policy-count").textContent = homepageData.deliveryPolicies.length
  document.getElementById("categories-count").textContent = homepageData.categories.length
  document.getElementById("videos-count").textContent = homepageData.videos.length
  document.getElementById("features-count").textContent = homepageData.features.length
  document.getElementById("product-sections-count").textContent = homepageData.productSections.length
  document.getElementById("client-logos-count").textContent = homepageData.clientLogos.length
}

// Add functions
function addHeroBanner() {
  showHeroBannerModal()
}

function addDeliveryPolicy() {
  showDeliveryPolicyModal()
}

function addCategory() {
  showCategoryModal()
}

function addVideo() {
  showVideoModal()
}

function addFeature() {
  showFeatureModal()
}

function addProductSection() {
  showProductSectionModal()
}

function addClientLogo() {
  showClientLogoModal()
}

// Edit functions
function editHeroBanner(id) {
  const banner = homepageData.banners.find((b) => b.id === id)
  showHeroBannerModal(banner)
}

function editDeliveryPolicy(id) {
  const policy = homepageData.deliveryPolicies.find((p) => p.id === id)
  showDeliveryPolicyModal(policy)
}

function editCategory(id) {
  const category = homepageData.categories.find((c) => c.id === id)
  showCategoryModal(category)
}

function editVideo(id) {
  const video = homepageData.videos.find((v) => v.id === id)
  showVideoModal(video)
}

function editFeature(id) {
  const feature = homepageData.features.find((f) => f.id === id)
  showFeatureModal(feature)
}

function editAboutSection() {
  showAboutModal(homepageData.about)
}

function editProductSection(id) {
  const section = homepageData.productSections.find((s) => s.id === id)
  showProductSectionModal(section)
}

function editClientLogo(id) {
  const logo = homepageData.clientLogos.find((l) => l.id === id)
  showClientLogoModal(logo)
}

// Delete functions
async function deleteHeroBanner(id) {
  if (confirm("Are you sure you want to delete this banner?")) {
    try {
      const [success, result] = await callApi("DELETE", `${heroBannersUrl}${id}/`, null, csrf_token)
      if (success && result.success) {
        showNotification("Banner deleted successfully!", "success")
        await loadHeroBanners()
        renderHeroBanners()
        updateCounts()
      } else {
        showNotification("Error deleting banner.", "error")
      }
    } catch (error) {
      console.error("Error deleting banner:", error)
      showNotification("Error deleting banner.", "error")
    }
  }
}

// Modal functions (simplified - you would implement full modals)
function showHeroBannerModal(banner = null) {
  const modalHtml = `
        <div class="modal fade" id="heroBannerModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${banner ? "Edit" : "Add"} Hero Banner</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="heroBannerForm">
                            <div class="mb-3">
                                <label class="form-label">Title</label>
                                <input type="text" class="form-control" name="title" value="${banner ? banner.title : ""}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3">${banner ? banner.description || "" : ""}</textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Image URL</label>
                                <input type="url" class="form-control" name="image" value="${banner ? banner.image : ""}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Button Text</label>
                                <input type="text" class="form-control" name="button_text" value="${banner ? banner.button_text : "Shop Now"}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Button Link</label>
                                <input type="url" class="form-control" name="button_link" value="${banner ? banner.button_link || "" : ""}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Order</label>
                                <input type="number" class="form-control" name="order" value="${banner ? banner.order : 0}">
                            </div>
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" name="is_active" ${banner ? (banner.is_active ? "checked" : "") : "checked"}>
                                <label class="form-check-label">Active</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveHeroBanner(${banner ? banner.id : null})">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `

  document.getElementById("modal-container").innerHTML = modalHtml
  const modal = new bootstrap.Modal(document.getElementById("heroBannerModal"))
  modal.show()
}

async function saveHeroBanner(id = null) {
  const form = document.getElementById("heroBannerForm")
  const formData = new FormData(form)

  const data = {
    title: formData.get("title"),
    description: formData.get("description"),
    image: formData.get("image"),
    button_text: formData.get("button_text"),
    button_link: formData.get("button_link"),
    order: Number.parseInt(formData.get("order")),
    is_active: formData.get("is_active") === "on",
  }

  try {
    const url = id ? `${heroBannersUrl}${id}/` : heroBannersUrl
    const method = id ? "PUT" : "POST"

    const [success, result] = await callApi(method, url, data, csrf_token)

    if (success && result.success) {
      showNotification(`Banner ${id ? "updated" : "created"} successfully!`, "success")
      bootstrap.Modal.getInstance(document.getElementById("heroBannerModal")).hide()
      await loadHeroBanners()
      renderHeroBanners()
      updateCounts()
    } else {
      showNotification("Error saving banner.", "error")
    }
  } catch (error) {
    console.error("Error saving banner:", error)
    showNotification("Error saving banner.", "error")
  }
}

// Utility functions
async function refreshAllSections() {
  showLoading()
  await loadAllSections()
  renderAllSections()
  hideLoading()
  showNotification("All sections refreshed!", "success")
}

function previewHomepage() {
  window.open("/", "_blank")
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
  const toastContainer = document.getElementById("toastContainer")
  const toastId = "toast-" + Date.now()

  const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type === "error" ? "danger" : type === "success" ? "success" : "primary"} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `

  toastContainer.insertAdjacentHTML("beforeend", toastHtml)

  const toast = new bootstrap.Toast(document.getElementById(toastId))
  toast.show()

  // Remove toast element after it's hidden
  document.getElementById(toastId).addEventListener("hidden.bs.toast", function () {
    this.remove()
  })
}

// Initialize collapse icons
document.addEventListener("DOMContentLoaded", () => {
  const collapseElements = document.querySelectorAll('[data-bs-toggle="collapse"]')
  collapseElements.forEach((element) => {
    const target = document.querySelector(element.getAttribute("data-bs-target"))
    if (target) {
      target.addEventListener("show.bs.collapse", () => {
        element.classList.remove("collapsed")
      })
      target.addEventListener("hide.bs.collapse", () => {
        element.classList.add("collapsed")
      })
    }
  })
})

function showProductSectionModal() {}

function showClientLogoModal() {}

function showAboutModal() {}
