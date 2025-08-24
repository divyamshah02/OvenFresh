// Global variables for tracking current editing state
let currentEditingItem = null
let currentEditingType = null

// API URLs (will be set by initialization)
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
let categoriesApiUrl = null
let subcategoriesApiUrl = null
let productsApiUrl = null

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
  allCategories: [],
  allSubcategories: [],
  allProducts: [],
}

async function uploadFileToS3(file, folder = "homepage_images") {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("folder", folder)

  try {
    const response = await fetch("/cms-api/upload-file/", {
      method: "POST",
      headers: {
        "X-CSRFToken": csrf_token,
      },
      body: formData,
    })

    const result = await response.json()
    if (result.success) {
      return result.file_url
    } else {
      throw new Error(result.error || "Upload failed")
    }
  } catch (error) {
    console.error("File upload error:", error)
    throw error
  }
}

function showDeliveryPolicyModal(policy = null) {
  currentEditingItem = policy
  currentEditingType = "delivery_policy"

  if (policy) {
    document.getElementById("deliveryPolicyTitle").value = policy.title
    document.getElementById("deliveryPolicyType").value = policy.policy_type
    document.getElementById("deliveryPolicyIcon").value = policy.icon || ""
    document.getElementById("deliveryPolicyDescription").value = policy.description || ""
    document.getElementById("deliveryPolicyCountdownHour").value = policy.countdown_hours || ""
    document.getElementById("deliveryPolicyCountdownMinute").value = policy.countdown_minutes || ""
    document.getElementById("deliveryPolicyOrder").value = policy.order
    document.getElementById("deliveryPolicyActive").checked = policy.is_active
  } else {
    document.getElementById("deliveryPolicyForm").reset()
    document.getElementById("deliveryPolicyActive").checked = true
  }

  const modal = new bootstrap.Modal(document.getElementById("deliveryPolicyModal"))
  modal.show()
}

function showHomepageCategoryModal(category = null) {
  currentEditingItem = category
  currentEditingType = "homepage_category"

  if (category) {
    document.getElementById("categoryTitle").value = category.title
    document.getElementById("categoryDescription").value = category.description || ""
    document.getElementById("categoryImage").value = category.image
    document.getElementById("categoryLink").value = category.category_link || ""
    document.getElementById("categoryOrder").value = category.order
    document.getElementById("categoryActive").checked = category.is_active
  } else {
    document.getElementById("categoryForm").reset()
    document.getElementById("categoryActive").checked = true
  }

  const modal = new bootstrap.Modal(document.getElementById("categoryModal"))
  modal.show()
}

function showVideoModal(video = null) {
  currentEditingItem = video
  currentEditingType = "video"

  if (video) {
    document.getElementById("videoTitle").value = video.title
    document.getElementById("videoDescription").value = video.description || ""
    document.getElementById("videoUrl").value = video.video_url
    document.getElementById("videoThumbnail").value = video.thumbnail_url || ""
    document.getElementById("videoOrder").value = video.order
    document.getElementById("videoActive").checked = video.is_active
  } else {
    document.getElementById("videoForm").reset()
    document.getElementById("videoActive").checked = true
  }

  const modal = new bootstrap.Modal(document.getElementById("videoModal"))
  modal.show()
}

function showFeatureModal(feature = null) {
  currentEditingItem = feature
  currentEditingType = "feature"

  if (feature) {
    document.getElementById("featureTitle").value = feature.title
    document.getElementById("featureIcon").value = feature.icon
    document.getElementById("featureDescription").value = feature.description
    document.getElementById("featureOrder").value = feature.order
    document.getElementById("featureActive").checked = feature.is_active
  } else {
    document.getElementById("featureForm").reset()
    document.getElementById("featureActive").checked = true
  }

  const modal = new bootstrap.Modal(document.getElementById("featureModal"))
  modal.show()
}

function showAboutModal(about = null) {
  currentEditingItem = about
  currentEditingType = "about_section"

  if (about) {
    document.getElementById("aboutTitle").value = about.title
    document.getElementById("aboutSubtitle").value = about.subtitle || ""
    document.getElementById("aboutDescription").value = about.description_1 || ""
    document.getElementById("aboutImage").value = about.main_image || ""
    document.getElementById("aboutButtonText").value = about.button_text || ""
    document.getElementById("aboutButtonLink").value = about.button_link || ""
    document.getElementById("aboutActive").checked = about.is_active
  } else {
    document.getElementById("aboutSectionForm").reset()
    document.getElementById("aboutActive").checked = true
  }

  const modal = new bootstrap.Modal(document.getElementById("aboutSectionModal"))
  modal.show()
}

function showClientLogoModal(logo = null) {
  currentEditingItem = logo
  currentEditingType = "client_logo"

  if (logo) {
    document.getElementById("clientLogoCompanyName").value = logo.company_name
    document.getElementById("clientLogoImage").value = logo.logo_url
    document.getElementById("clientLogoWebsite").value = logo.website_url || ""
    document.getElementById("clientLogoDescription").value = logo.description || ""
    document.getElementById("clientLogoOrder").value = logo.order
    document.getElementById("clientLogoActive").checked = logo.is_active
  } else {
    document.getElementById("clientLogoForm").reset()
    document.getElementById("clientLogoActive").checked = true
  }

  const modal = new bootstrap.Modal(document.getElementById("clientLogoModal"))
  modal.show()
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
  categoriesApiUrlParam,
  subcategoriesApiUrlParam,
  productsApiUrlParam,
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
  categoriesApiUrl = categoriesApiUrlParam
  subcategoriesApiUrl = subcategoriesApiUrlParam
  productsApiUrl = productsApiUrlParam

  try {
    showLoading()

    // Load all homepage content and product data
    await Promise.all([loadAllSections(), loadCategories(), loadSubcategories(), loadProducts()])

    // Render all sections
    renderAllSections()
    updateStats()

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
    loadHomepageCategories(),
    loadVideos(),
    loadFeatures(),
    loadAboutSection(),
    loadProductSections(),
    loadClientLogos(),
    loadFooterContent(),
  ])
}

async function loadCategories() {
  try {
    const [success, result] = await callApi("GET", categoriesApiUrl)
    if (success && result.success) {
      homepageData.allCategories = result.data
    }
  } catch (error) {
    console.error("Error loading categories:", error)
  }
}

async function loadSubcategories() {
  try {
    const [success, result] = await callApi("GET", subcategoriesApiUrl)
    if (success && result.success) {
      homepageData.allSubcategories = result.data
    }
  } catch (error) {
    console.error("Error loading subcategories:", error)
  }
}

async function loadProducts() {
  try {
    const [success, result] = await callApi("GET", productsApiUrl)
    if (success && result.success) {
      homepageData.allProducts = result.data
    }
  } catch (error) {
    console.error("Error loading products:", error)
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

async function loadHomepageCategories() {
  try {
    const [success, result] = await callApi("GET", categoriesUrl)
    if (success && result.success) {
      homepageData.categories = result.data
    }
  } catch (error) {
    console.error("Error loading homepage categories:", error)
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
  renderHomepageCategories()
  renderVideos()
  renderFeatures()
  renderAboutSection()
  renderProductSections()
  renderClientLogos()
}

function renderHeroBanners() {
  const container = document.getElementById("hero-banners-list")

  if (!homepageData.banners.length) {
    container.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-4">No hero banners found. Click "Add Banner" to create one.</td></tr>'
    return
  }

  container.innerHTML = homepageData.banners
    .map(
      (banner) => `
        <tr>
            <td>
                <img src="${banner.image}" alt="${banner.title}" class="img-thumbnail" style="width: 80px; height: 50px; object-fit: cover;">
            </td>
            <td>
                <h6 class="mb-1">${banner.title}</h6>
                <small class="text-muted">${banner.subtitle || ""}</small>
            </td>
            <td>
                <small class="text-muted">${banner.description ? (banner.description.length > 50 ? banner.description.substring(0, 50) + "..." : banner.description) : "No description"}</small>
            </td>
            <td>
                <span class="badge bg-primary">${banner.order}</span>
            </td>
            <td>
                <span class="badge ${banner.is_active ? "bg-success" : "bg-secondary"}">
                    ${banner.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editHeroBanner(${banner.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteHeroBanner(${banner.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `,
    )
    .join("")
}

function renderDeliveryPolicy() {
  const container = document.getElementById("delivery-policy-list")

  if (!homepageData.deliveryPolicies.length) {
    container.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-4">No delivery policies found. Click "Add Policy" to create one.</td></tr>'
    return
  }

  container.innerHTML = homepageData.deliveryPolicies
    .map(
      (policy) => `
        <tr>
            <td class="text-center">
                <i class="${policy.icon} fa-2x text-primary"></i>
            </td>
            <td>
                <h6 class="mb-1">${policy.title}</h6>
            </td>
            <td>
                <span class="badge bg-info">${policy.policy_type_display || policy.policy_type}</span>
            </td>
            <td>
                ${
                  policy.countdown_hours !== null
                    ? `<small class="text-muted">${String(policy.countdown_hours).padStart(2, "0")}:${String(policy.countdown_minutes).padStart(2, "0")}:${String(policy.countdown_seconds || 0).padStart(2, "0")}</small>`
                    : '<small class="text-muted">No countdown</small>'
                }
            </td>
            <td>
                <span class="badge ${policy.is_active ? "bg-success" : "bg-secondary"}">
                    ${policy.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editDeliveryPolicy(${policy.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteDeliveryPolicy(${policy.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `,
    )
    .join("")
}

function renderHomepageCategories() {
  const container = document.getElementById("categories-list")

  if (!homepageData.categories.length) {
    container.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-4">No categories found. Click "Add Category" to create one.</td></tr>'
    return
  }

  container.innerHTML = homepageData.categories
    .map(
      (category) => `
        <tr>
            <td>
                <img src="${category.image}" alt="${category.title}" class="img-thumbnail" style="width: 80px; height: 50px; object-fit: cover;">
            </td>
            <td>
                <h6 class="mb-1">${category.title}</h6>
            </td>
            <td>
                <small class="text-muted">${category.description ? (category.description.length > 50 ? category.description.substring(0, 50) + "..." : category.description) : "No description"}</small>
            </td>
            <td>
                <span class="badge bg-primary">${category.order}</span>
            </td>
            <td>
                <span class="badge ${category.is_active ? "bg-success" : "bg-secondary"}">
                    ${category.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editHomepageCategory(${category.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteHomepageCategory(${category.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `,
    )
    .join("")
}

function renderProductSections() {
  const container = document.getElementById("product-sections-list")

  if (!homepageData.productSections.length) {
    container.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted py-4">No product sections found. Click "Add Section" to create one.</td></tr>'
    return
  }

  container.innerHTML = homepageData.productSections
    .map(
      (section) => `
        <tr>
            <td>
                <h6 class="mb-1">${section.title}</h6>
                <small class="text-muted">${section.subtitle || ""}</small>
            </td>
            <td>
                <span class="badge bg-info">${section.section_type_display || section.section_type}</span>
            </td>
            <td>
                ${
                  section.category_details
                    ? `<small class="text-success">${section.category_details.name}</small>` +
                      (
                        section.subcategory_details
                          ? `<br><small class="text-warning">${section.subcategory_details.name}</small>`
                          : ""
                      )
                    : '<small class="text-muted">No category</small>'
                }
            </td>
            <td>
                <span class="badge bg-secondary">${section.dynamic_products ? section.dynamic_products.length : section.items ? section.items.length : 0} products</span>
            </td>
            <td>
                <span class="badge bg-primary">${section.order}</span>
            </td>
            <td>
                <span class="badge ${section.is_active ? "bg-success" : "bg-secondary"}">
                    ${section.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info" onclick="viewProductSection(${section.id})" title="View Products">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-primary" onclick="editProductSection(${section.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteProductSection(${section.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `,
    )
    .join("")
}

function renderVideos() {
  const container = document.getElementById("videos-list")

  if (!homepageData.videos.length) {
    container.innerHTML = '<p class="text-muted">No videos found.</p>'
    return
  }

  container.innerHTML = homepageData.videos
    .map(
      (video) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
                <h6 class="mb-1">${video.position_display}</h6>
                <small class="text-muted">${video.description || ""}</small>
            </div>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="editVideo(${video.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="deleteVideo(${video.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

function renderFeatures() {
  const container = document.getElementById("features-list")

  if (!homepageData.features.length) {
    container.innerHTML = '<p class="text-muted">No features found.</p>'
    return
  }

  container.innerHTML = homepageData.features
    .map(
      (feature) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div class="d-flex align-items-center">
                <i class="${feature.icon} me-2 text-primary"></i>
                <div>
                    <h6 class="mb-0">${feature.title}</h6>
                    <small class="text-muted">${feature.description}</small>
                </div>
            </div>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="editFeature(${feature.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="deleteFeature(${feature.id})">
                    <i class="fas fa-trash"></i>
                </button>
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
        <div class="row">
            <div class="col-md-3">
                ${about.main_image ? `<img src="${about.main_image}" alt="About Image" class="img-fluid rounded">` : '<div class="bg-light p-3 rounded text-center text-muted">No Image</div>'}
            </div>
            <div class="col-md-9">
                <h5>${about.title}</h5>
                ${about.subtitle ? `<h6 class="text-muted">${about.subtitle}</h6>` : ""}
                <p class="mb-2">${about.description_1 ? about.description_1.substring(0, 100) + "..." : "No description"}</p>
                <div class="d-flex align-items-center">
                    ${about.years_experience ? `<span class="badge bg-info me-2">${about.years_experience}+ Years Experience</span>` : ""}
                    <span class="badge ${about.is_active ? "bg-success" : "bg-secondary"}">
                        ${about.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>
        </div>
    `
}

function renderClientLogos() {
  const container = document.getElementById("client-logos-list")

  if (!homepageData.clientLogos.length) {
    container.innerHTML = '<div class="col-12"><p class="text-muted text-center">No client logos found.</p></div>'
    return
  }

  container.innerHTML = homepageData.clientLogos
    .map(
      (logo) => `
        <div class="col-md-3 mb-3">
            <div class="card">
                <div class="card-body text-center">
                    <img src="${logo.logo_url}" alt="${logo.company_name}" class="img-fluid mb-2" style="max-height: 60px;">
                    <h6 class="card-title">${logo.company_name}</h6>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editClientLogo(${logo.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteClientLogo(${logo.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function updateStats() {
  document.getElementById("totalBanners").textContent = homepageData.banners.filter((b) => b.is_active).length
  document.getElementById("totalProductSections").textContent = homepageData.productSections.filter(
    (s) => s.is_active,
  ).length
  document.getElementById("totalCategories").textContent = homepageData.categories.filter((c) => c.is_active).length

  const totalContent =
    homepageData.banners.length +
    homepageData.productSections.length +
    homepageData.categories.length +
    homepageData.features.length +
    homepageData.videos.length +
    homepageData.clientLogos.length
  document.getElementById("totalContent").textContent = totalContent

  // Update section counts
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
  showHomepageCategoryModal()
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

function editHomepageCategory(id) {
  const category = homepageData.categories.find((c) => c.id === id)
  showHomepageCategoryModal(category)
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

function viewProductSection(id) {
  const section = homepageData.productSections.find((s) => s.id === id)
  showProductSectionViewModal(section)
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
        updateStats()
      } else {
        showNotification("Error deleting banner.", "error")
      }
    } catch (error) {
      console.error("Error deleting banner:", error)
      showNotification("Error deleting banner.", "error")
    }
  }
}

async function deleteDeliveryPolicy(id) {
  if (confirm("Are you sure you want to delete this policy?")) {
    try {
      const [success, result] = await callApi("DELETE", `${deliveryPolicyUrl}${id}/`, null, csrf_token)
      if (success && result.success) {
        showNotification("Policy deleted successfully!", "success")
        await loadDeliveryPolicy()
        renderDeliveryPolicy()
        updateStats()
      } else {
        showNotification("Error deleting policy.", "error")
      }
    } catch (error) {
      console.error("Error deleting policy:", error)
      showNotification("Error deleting policy.", "error")
    }
  }
}

async function deleteHomepageCategory(id) {
  if (confirm("Are you sure you want to delete this category?")) {
    try {
      const [success, result] = await callApi("DELETE", `${categoriesUrl}${id}/`, null, csrf_token)
      if (success && result.success) {
        showNotification("Category deleted successfully!", "success")
        await loadHomepageCategories()
        renderHomepageCategories()
        updateStats()
      } else {
        showNotification("Error deleting category.", "error")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      showNotification("Error deleting category.", "error")
    }
  }
}

async function deleteVideo(id) {
  if (confirm("Are you sure you want to delete this video?")) {
    try {
      const [success, result] = await callApi("DELETE", `${videosUrl}${id}/`, null, csrf_token)
      if (success && result.success) {
        showNotification("Video deleted successfully!", "success")
        await loadVideos()
        renderVideos()
        updateStats()
      } else {
        showNotification("Error deleting video.", "error")
      }
    } catch (error) {
      console.error("Error deleting video:", error)
      showNotification("Error deleting video.", "error")
    }
  }
}

async function deleteFeature(id) {
  if (confirm("Are you sure you want to delete this feature?")) {
    try {
      const [success, result] = await callApi("DELETE", `${featuresUrl}${id}/`, null, csrf_token)
      if (success && result.success) {
        showNotification("Feature deleted successfully!", "success")
        await loadFeatures()
        renderFeatures()
        updateStats()
      } else {
        showNotification("Error deleting feature.", "error")
      }
    } catch (error) {
      console.error("Error deleting feature:", error)
      showNotification("Error deleting feature.", "error")
    }
  }
}

async function deleteClientLogo(id) {
  if (confirm("Are you sure you want to delete this client logo?")) {
    try {
      const [success, result] = await callApi("DELETE", `${clientLogosUrl}${id}/`, null, csrf_token)
      if (success && result.success) {
        showNotification("Client logo deleted successfully!", "success")
        await loadClientLogos()
        renderClientLogos()
        updateStats()
      } else {
        showNotification("Error deleting client logo.", "error")
      }
    } catch (error) {
      console.error("Error deleting client logo:", error)
      showNotification("Error deleting client logo.", "error")
    }
  }
}

async function deleteProductSection(id) {
  if (confirm("Are you sure you want to delete this product section?")) {
    try {
      const [success, result] = await callApi("DELETE", `${productSectionsUrl}${id}/`, null, csrf_token)
      if (success && result.success) {
        showNotification("Product section deleted successfully!", "success")
        await loadProductSections()
        renderProductSections()
        updateStats()
      } else {
        showNotification("Error deleting product section.", "error")
      }
    } catch (error) {
      console.error("Error deleting product section:", error)
      showNotification("Error deleting product section.", "error")
    }
  }
}

// Modal functions
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
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Title</label>
                                        <input type="text" class="form-control" name="title" value="${banner ? banner.title : ""}">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Subtitle</label>
                                        <input type="text" class="form-control" name="subtitle" value="${banner ? banner.subtitle || "" : ""}">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3">${banner ? banner.description || "" : ""}</textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Image URL *</label>
                                <input type="url" class="form-control" name="image" value="${banner ? banner.image : ""}" required>
                                <label class="form-label">Or Upload Image</label>
                                <input type="file" class="form-control" name="image_file">
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Button Text</label>
                                        <input type="text" class="form-control" name="button_text" value="${banner ? banner.button_text : "Shop Now"}">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Button Link</label>
                                        <input type="url" class="form-control" name="button_link" value="${banner ? banner.button_link || "" : ""}">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Order</label>
                                        <input type="number" class="form-control" name="order" value="${banner ? banner.order : 0}" min="0">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3 form-check mt-4">
                                        <input type="checkbox" class="form-check-input" name="is_active" ${banner ? (banner.is_active ? "checked" : "") : "checked"}>
                                        <label class="form-check-label">Active</label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveHeroBanner(${banner ? banner.id : null})">
                            <i class="fas fa-save me-1"></i> Save Banner
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `

  document.getElementById("modal-container").innerHTML = modalHtml
  const modal = new bootstrap.Modal(document.getElementById("heroBannerModal"))
  modal.show()
}

function showProductSectionModal(section = null) {
  const modalHtml = `
        <div class="modal fade" id="productSectionModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${section ? "Edit" : "Add"} Product Section</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="productSectionForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Title *</label>
                                        <input type="text" class="form-control" name="title" value="${section ? section.title : ""}" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Subtitle</label>
                                        <input type="text" class="form-control" name="subtitle" value="${section ? section.subtitle || "" : ""}">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="2">${section ? section.description || "" : ""}</textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Section Type *</label>
                                        <select class="form-select" name="section_type" onchange="handleSectionTypeChange()" required>
                                            <option value="new_arrivals" ${section && section.section_type === "new_arrivals" ? "selected" : ""}>New Arrivals</option>
                                            <option value="category_based" ${section && section.section_type === "category_based" ? "selected" : ""}>Category Based</option>
                                            <option value="custom" ${section && section.section_type === "custom" ? "selected" : ""}>Custom Selection</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Max Products</label>
                                        <input type="number" class="form-control" name="max_products" value="${section ? section.max_products : 8}" min="1" max="20">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Order</label>
                                        <input type="number" class="form-control" name="order" value="${section ? section.order : 0}" min="0">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Category Selection (for category_based type) -->
                            <div id="categorySelection" style="display: ${section && (section.section_type === "category_based") ? "block" : "none"};">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Category</label>
                                            <select class="form-select" name="category_id" onchange="handleCategoryChange()">
                                                <option value="">Select Category</option>
                                                ${homepageData.allCategories
                                                  .map(
                                                    (cat) =>
                                                      `<option value="${cat.category_id}" ${section && section.category_id == cat.category_id ? "selected" : ""}>${cat.title}</option>`,
                                                  )
                                                  .join("")}
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Subcategory (Optional)</label>
                                            <select class="form-select" name="subcategory_id" id="subcategorySelect">
                                                <option value="">Select Subcategory</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Custom Product Selection -->
                            <div id="customProductSelection" style="display: ${section && section.section_type === "custom" ? "block" : "none"};">
                                <div class="mb-3">
                                    <label class="form-label">Select Products</label>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <label class="form-label small">Filter by Category</label>
                                            <select class="form-select form-select-sm" id="productCategoryFilter" onchange="filterProducts()">
                                                <option value="">All Categories</option>
                                                ${homepageData.allCategories
                                                  .map(
                                                    (cat) => `<option value="${cat.category_id}">${cat.title}</option>`,
                                                  )
                                                  .join("")}
                                            </select>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label small">Filter by Subcategory</label>
                                            <select class="form-select form-select-sm" id="productSubcategoryFilter" onchange="filterProducts()">
                                                <option value="">All Subcategories</option>
                                            </select>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label small">Search Products</label>
                                            <input type="text" class="form-control form-control-sm" id="productSearch" placeholder="Search products..." onkeyup="filterProducts()">
                                        </div>
                                    </div>
                                    <div class="mt-3" style="max-height: 300px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 0.375rem; padding: 1rem;">
                                        <div id="productsList">
                                            <!-- Products will be loaded here -->
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        <small class="text-muted">Selected: <span id="selectedProductsCount">0</span> products</small>
                                    </div>
                                </div>
                            </div>

                            <!-- Display Settings -->
                            <div class="row">
                                <div class="col-md-12">
                                    <label class="form-label">Display Settings</label>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input type="checkbox" class="form-check-input" name="show_price" ${section ? (section.show_price ? "checked" : "") : "checked"}>
                                                <label class="form-check-label">Show Price</label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input type="checkbox" class="form-check-input" name="show_rating" ${section ? (section.show_rating ? "checked" : "") : "checked"}>
                                                <label class="form-check-label">Show Rating</label>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="form-check">
                                                <input type="checkbox" class="form-check-input" name="show_add_to_cart" ${section ? (section.show_add_to_cart ? "checked" : "") : "checked"}>
                                                <label class="form-check-label">Show Add to Cart</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" name="is_active" ${section ? (section.is_active ? "checked" : "") : "checked"}>
                                    <label class="form-check-label">Active</label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveProductSection(${section ? section.id : null})">
                            <i class="fas fa-save me-1"></i> Save Section
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `

  document.getElementById("modal-container").innerHTML = modalHtml
  const modal = new bootstrap.Modal(document.getElementById("productSectionModal"))

  // Initialize the modal
  if (section && section.section_type === "category_based" && section.category_id) {
    setTimeout(() => {
      handleCategoryChange(section.category_id, section.subcategory_id)
    }, 100)
  }

  if (section && section.section_type === "custom") {
    setTimeout(() => {
      loadCustomProducts(section)
    }, 100)
  }

  modal.show()
}

function handleSectionTypeChange() {
  const sectionType = document.querySelector('select[name="section_type"]').value
  const categorySelection = document.getElementById("categorySelection")
  const customProductSelection = document.getElementById("customProductSelection")

  if (sectionType === "category_based") {
    categorySelection.style.display = "block"
    customProductSelection.style.display = "none"
  } else if (sectionType === "custom") {
    categorySelection.style.display = "none"
    customProductSelection.style.display = "block"
    loadCustomProducts()
  } else {
    categorySelection.style.display = "none"
    customProductSelection.style.display = "none"
  }
}

function handleCategoryChange(selectedCategoryId = null, selectedSubcategoryId = null) {
  const categoryId = selectedCategoryId || document.querySelector('select[name="category_id"]').value
  const subcategorySelect = document.getElementById("subcategorySelect")

  // Clear subcategories
  subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>'

  if (categoryId) {
    const subcategories = homepageData.allSubcategories.filter((sub) => sub.category_id == categoryId)
    subcategories.forEach((sub) => {
      const option = document.createElement("option")
      option.value = sub.sub_category_id
      option.textContent = sub.title
      if (selectedSubcategoryId && sub.sub_category_id == selectedSubcategoryId) {
        option.selected = true
      }
      subcategorySelect.appendChild(option)
    })
  }
}

function loadCustomProducts(section = null) {
  const container = document.getElementById("productsList")
  if (!container) return

  const selectedProducts = section && section.items ? section.items.map((item) => item.product_id) : []

  container.innerHTML = homepageData.allProducts
    .map(
      (product) => `
    <div class="form-check product-item" data-category="${product.category_id}" data-subcategory="${product.sub_category_id || ""}" data-name="${product.title}">
      <input class="form-check-input" type="checkbox" value="${product.product_id}" id="product_${product.product_id}" 
             ${selectedProducts.includes(product.product_id ? product.product_id.toString() : product.product_id.toString()) ? "checked" : ""} onchange="updateSelectedProductsCount()">
      <label class="form-check-label d-flex align-items-center" for="product_${product.product_id}">
        <img src="${product.photos && product.photos[0] ? product.photos[0] : "/placeholder.svg?height=40&width=40"}" alt="${product.title}" class="me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
        <div>
          <div class="fw-medium">${product.title}</div>
          <small class="text-muted">₹${product.actual_price} - ${product.category_name}</small>
        </div>
      </label>
    </div>
  `,
    )
    .join("")

  updateSelectedProductsCount()
}

function filterProducts() {
  const categoryFilter = document.getElementById("productCategoryFilter").value
  const subcategoryFilter = document.getElementById("productSubcategoryFilter").value
  const searchTerm = document.getElementById("productSearch").value.toLowerCase()

  // Update subcategory filter based on category
  if (categoryFilter) {
    if (!subcategoryFilter) {
      const subcategorySelect = document.getElementById("productSubcategoryFilter")
      const subcategories = homepageData.allSubcategories.filter((sub) => sub.category_id == categoryFilter)
      subcategorySelect.innerHTML =
        '<option value="">All Subcategories</option>' +
        subcategories.map((sub) => `<option value="${sub.sub_category_id}">${sub.title}</option>`).join("")
    }
  }

  // Filter products
  const productItems = document.querySelectorAll(".product-item")
  productItems.forEach((item) => {
    const matchesCategory = !categoryFilter || item.dataset.category == categoryFilter
    const matchesSubcategory = !subcategoryFilter || item.dataset.subcategory == subcategoryFilter
    const matchesSearch = !searchTerm || item.dataset.name.toLowerCase().includes(searchTerm)

    item.style.display = matchesCategory && matchesSubcategory && matchesSearch ? "block" : "none"
  })
}

function updateSelectedProductsCount() {
  const checkedBoxes = document.querySelectorAll('#productsList input[type="checkbox"]:checked')
  document.getElementById("selectedProductsCount").textContent = checkedBoxes.length
}

async function saveHeroBanner(id = null) {
  const form = document.getElementById("heroBannerForm")
  const formData = new FormData(form)

  const imageFile = form.querySelector('input[name="image_file"]').files[0]
  let imageUrl = formData.get("image")

  if (imageFile) {
    try {
      showNotification("Uploading image...", "info")
      imageUrl = await uploadFileToS3(imageFile, "hero_banners")
    } catch (error) {
      showNotification("Error uploading image: " + error.message, "error")
      return
    }
  }

  const data = {
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    image: imageUrl,
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
      updateStats()
    } else {
      showNotification("Error saving banner.", "error")
    }
  } catch (error) {
    console.error("Error saving banner:", error)
    showNotification("Error saving banner.", "error")
  }
}

async function saveProductSection(id = null) {
  const form = document.getElementById("productSectionForm")
  const formData = new FormData(form)

  const data = {
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    section_type: formData.get("section_type"),
    category_id: formData.get("category_id") || null,
    subcategory_id: formData.get("subcategory_id") || null,
    max_products: Number.parseInt(formData.get("max_products")),
    show_price: formData.get("show_price") === "on",
    show_rating: formData.get("show_rating") === "on",
    show_add_to_cart: formData.get("show_add_to_cart") === "on",
    order: Number.parseInt(formData.get("order")),
    is_active: formData.get("is_active") === "on",
  }

  // Add selected products for custom sections
  if (data.section_type === "custom") {
    const selectedProducts = Array.from(document.querySelectorAll('#productsList input[type="checkbox"]:checked')).map(
      (checkbox) => checkbox.value,
    )
    data.selected_products = selectedProducts
  }

  try {
    const url = id ? `${productSectionsUrl}${id}/` : productSectionsUrl
    const method = id ? "PUT" : "POST"

    const [success, result] = await callApi(method, url, data, csrf_token)

    if (success && result.success) {
      showNotification(`Product section ${id ? "updated" : "created"} successfully!`, "success")
      bootstrap.Modal.getInstance(document.getElementById("productSectionModal")).hide()
      await loadProductSections()
      renderProductSections()
      updateStats()
    } else {
      showNotification("Error saving product section.", "error")
    }
  } catch (error) {
    console.error("Error saving product section:", error)
    showNotification("Error saving product section.", "error")
  }
}

function showProductSectionViewModal(section) {
  const products = section.dynamic_products || []

  const modalHtml = `
        <div class="modal fade" id="productSectionViewModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Products in "${section.title}"</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <p><strong>Section Type:</strong> <span class="badge bg-info">${section.section_type_display}</span></p>
                                ${section.category_details ? `<p><strong>Category:</strong> ${section.category_details.name}</p>` : ""}
                                ${section.subcategory_details ? `<p><strong>Subcategory:</strong> ${section.subcategory_details.name}</p>` : ""}
                            </div>
                            <div class="col-md-6">
                                <p><strong>Max Products:</strong> ${section.max_products}</p>
                                <p><strong>Total Products:</strong> ${products.length}</p>
                            </div>
                        </div>
                        <div class="row">
                            ${products
                              .map(
                                (product) => `
                                <div class="col-md-3 mb-3">
                                    <div class="card">
                                        <img src="${product.photos[0]}" class="card-img-top" style="height: 200px; object-fit: cover;">
                                        <div class="card-body">
                                            <h6 class="card-title">${product.title}</h6>
                                            <p class="card-text">
                                                <small class="text-muted">${product.category_name}</small><br>
                                                <strong>₹${product.actual_price}</strong>
                                                ${product.rating > 0 ? `<br><small>⭐ ${product.rating} (${product.reviews_count})</small>` : ""}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                        ${products.length === 0 ? '<p class="text-center text-muted">No products found for this section.</p>' : ""}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="editProductSection(${section.id}); bootstrap.Modal.getInstance(document.getElementById('productSectionViewModal')).hide();">
                            <i class="fas fa-edit me-1"></i> Edit Section
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `

  document.getElementById("modal-container").innerHTML = modalHtml
  const modal = new bootstrap.Modal(document.getElementById("productSectionViewModal"))
  modal.show()
}

// Save functions for other modals
async function saveDeliveryPolicy() {
  const formData = {
    title: document.getElementById("deliveryPolicyTitle").value,
    policy_type: document.getElementById("deliveryPolicyType").value,
    icon: document.getElementById("deliveryPolicyIcon").value,
    description: document.getElementById("deliveryPolicyDescription").value,
    countdown_hours: Number.parseInt(document.getElementById("deliveryPolicyCountdownHour").value) || 0,
    countdown_minutes: Number.parseInt(document.getElementById("deliveryPolicyCountdownMinute").value) || 0,
    order: Number.parseInt(document.getElementById("deliveryPolicyOrder").value),
    is_active: document.getElementById("deliveryPolicyActive").checked,
  }

  try {
    let response
    if (currentEditingItem && currentEditingType === "delivery_policy") {
      response = await fetch(`${deliveryPolicyUrl}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(deliveryPolicyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    }

    const data = await response.json()
    if (data.success) {
      showNotification("Delivery policy saved successfully!", "success")
      bootstrap.Modal.getInstance(document.getElementById("deliveryPolicyModal")).hide()
      await loadDeliveryPolicy()
      renderDeliveryPolicy()
      updateStats()
    } else {
      showNotification("Error saving delivery policy.", "error")
    }
  } catch (error) {
    console.error("Error saving delivery policy:", error)
    showNotification("Error saving delivery policy.", "error")
  }
}

async function saveHomepageCategory() {
  const categoryImageFile = document.getElementById("categoryImageFile").files[0]
  let categoryImageUrl = document.getElementById("categoryImage").value

  if (categoryImageFile) {
    try {
      showNotification("Uploading image...", "info")
      categoryImageUrl = await uploadFileToS3(categoryImageFile, "homepage_categories")
    } catch (error) {
      showNotification("Error uploading image: " + error.message, "error")
      return
    }
  }

  const formData = {
    title: document.getElementById("categoryTitle").value,
    description: document.getElementById("categoryDescription").value,
    image: categoryImageUrl,
    category_link: document.getElementById("categoryLink").value,
    order: Number.parseInt(document.getElementById("categoryOrder").value),
    is_active: document.getElementById("categoryActive").checked,
  }

  try {
    let response
    if (currentEditingItem && currentEditingType === "homepage_category") {
      response = await fetch(`${categoriesUrl}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(categoriesUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    }

    const data = await response.json()
    if (data.success) {
      showNotification("Category saved successfully!", "success")
      bootstrap.Modal.getInstance(document.getElementById("categoryModal")).hide()
      await loadHomepageCategories()
      renderHomepageCategories()
      updateStats()
    } else {
      showNotification("Error saving category.", "error")
    }
  } catch (error) {
    console.error("Error saving category:", error)
    showNotification("Error saving category.", "error")
  }
}

async function saveVideo() {
  const thumbnailFile = document.getElementById("videoThumbnailFile").files[0]
  let thumbnailUrl = document.getElementById("videoThumbnail").value

  if (thumbnailFile) {
    try {
      showNotification("Uploading thumbnail...", "info")
      thumbnailUrl = await uploadFileToS3(thumbnailFile, "video_thumbnails")
    } catch (error) {
      showNotification("Error uploading thumbnail: " + error.message, "error")
      return
    }
  }

  const formData = {
    title: document.getElementById("videoTitle").value,
    description: document.getElementById("videoDescription").value,
    video_url: document.getElementById("videoUrl").value,
    thumbnail_url: thumbnailUrl,
    order: Number.parseInt(document.getElementById("videoOrder").value),
    is_active: document.getElementById("videoActive").checked,
  }

  try {
    let response
    if (currentEditingItem && currentEditingType === "video") {
      response = await fetch(`${videosUrl}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(videosUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    }

    const data = await response.json()
    if (data.success) {
      showNotification("Video saved successfully!", "success")
      bootstrap.Modal.getInstance(document.getElementById("videoModal")).hide()
      await loadVideos()
      renderVideos()
      updateStats()
    } else {
      showNotification("Error saving video.", "error")
    }
  } catch (error) {
    console.error("Error saving video:", error)
    showNotification("Error saving video.", "error")
  }
}

async function saveFeature() {
  const formData = {
    title: document.getElementById("featureTitle").value,
    icon: document.getElementById("featureIcon").value,
    description: document.getElementById("featureDescription").value,
    order: Number.parseInt(document.getElementById("featureOrder").value),
    is_active: document.getElementById("featureActive").checked,
  }

  try {
    let response
    if (currentEditingItem && currentEditingType === "feature") {
      response = await fetch(`${featuresUrl}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(featuresUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    }

    const data = await response.json()
    if (data.success) {
      showNotification("Feature saved successfully!", "success")
      bootstrap.Modal.getInstance(document.getElementById("featureModal")).hide()
      await loadFeatures()
      renderFeatures()
      updateStats()
    } else {
      showNotification("Error saving feature.", "error")
    }
  } catch (error) {
    console.error("Error saving feature:", error)
    showNotification("Error saving feature.", "error")
  }
}

async function saveAboutSection() {
  const aboutImageFile = document.getElementById("aboutImageFile").files[0]
  let aboutImageUrl = document.getElementById("aboutImage").value

  if (aboutImageFile) {
    try {
      showNotification("Uploading image...", "info")
      aboutImageUrl = await uploadFileToS3(aboutImageFile, "about_section")
    } catch (error) {
      showNotification("Error uploading image: " + error.message, "error")
      return
    }
  }

  const formData = {
    title: document.getElementById("aboutTitle").value,
    subtitle: document.getElementById("aboutSubtitle").value,
    description_1: document.getElementById("aboutDescription").value,
    description_2: document.getElementById("aboutDescription").value, // Using same for both
    main_image: aboutImageUrl,
    button_text: document.getElementById("aboutButtonText").value,
    button_link: document.getElementById("aboutButtonLink").value,
    is_active: document.getElementById("aboutActive").checked,
  }

  try {
    let response
    if (homepageData.about && homepageData.about.id) {
      response = await fetch(`${aboutUrl}${homepageData.about.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(aboutUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    }

    const data = await response.json()
    if (data.success) {
      showNotification("About section saved successfully!", "success")
      bootstrap.Modal.getInstance(document.getElementById("aboutSectionModal")).hide()
      await loadAboutSection()
      renderAboutSection()
    } else {
      showNotification("Error saving about section.", "error")
    }
  } catch (error) {
    console.error("Error saving about section:", error)
    showNotification("Error saving about section.", "error")
  }
}

async function saveClientLogo() {
  const logoFile = document.getElementById("clientLogoImageFile").files[0]
  let logoUrl = document.getElementById("clientLogoImage").value

  if (logoFile) {
    try {
      showNotification("Uploading logo...", "info")
      logoUrl = await uploadFileToS3(logoFile, "client_logos")
    } catch (error) {
      showNotification("Error uploading logo: " + error.message, "error")
      return
    }
  }

  const formData = {
    company_name: document.getElementById("clientLogoCompanyName").value,
    logo_url: logoUrl,
    website_url: document.getElementById("clientLogoWebsite").value,
    description: document.getElementById("clientLogoDescription").value,
    order: Number.parseInt(document.getElementById("clientLogoOrder").value),
    is_active: document.getElementById("clientLogoActive").checked,
  }

  try {
    let response
    if (currentEditingItem && currentEditingType === "client_logo") {
      response = await fetch(`${clientLogosUrl}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(clientLogosUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    }

    const data = await response.json()
    if (data.success) {
      showNotification("Client logo saved successfully!", "success")
      bootstrap.Modal.getInstance(document.getElementById("clientLogoModal")).hide()
      await loadClientLogos()
      renderClientLogos()
      updateStats()
    } else {
      showNotification("Error saving client logo.", "error")
    }
  } catch (error) {
    console.error("Error saving client logo:", error)
    showNotification("Error saving client logo.", "error")
  }
}

// Utility functions
async function refreshAllSections() {
  showLoading()
  await Promise.all([loadAllSections(), loadCategories(), loadSubcategories(), loadProducts()])
  renderAllSections()
  updateStats()
  hideLoading()
  showNotification("All sections refreshed!", "success")
}

function previewHomepage() {
  window.open("/", "_blank")
}

function showLoading() {
  document.getElementById("loadingSpinner").style.display = "block"
  document.getElementById("homepageSections").style.display = "none"
}

function hideLoading() {
  document.getElementById("loadingSpinner").style.display = "none"
  document.getElementById("homepageSections").style.display = "block"
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

// Event listeners for modal save buttons
document.addEventListener("DOMContentLoaded", () => {
  // Delivery Policy Modal
  const saveDeliveryPolicyBtn = document.getElementById("saveDeliveryPolicyBtn")
  if (saveDeliveryPolicyBtn) {
    saveDeliveryPolicyBtn.addEventListener("click", saveDeliveryPolicy)
  }

  // Category Modal
  const saveCategoryBtn = document.getElementById("saveCategoryBtn")
  if (saveCategoryBtn) {
    saveCategoryBtn.addEventListener("click", saveHomepageCategory)
  }

  // Video Modal
  const saveVideoBtn = document.getElementById("saveVideoBtn")
  if (saveVideoBtn) {
    saveVideoBtn.addEventListener("click", saveVideo)
  }

  // Feature Modal
  const saveFeatureBtn = document.getElementById("saveFeatureBtn")
  if (saveFeatureBtn) {
    saveFeatureBtn.addEventListener("click", saveFeature)
  }

  // About Section Modal
  const saveAboutSectionBtn = document.getElementById("saveAboutSectionBtn")
  if (saveAboutSectionBtn) {
    saveAboutSectionBtn.addEventListener("click", saveAboutSection)
  }

  // Client Logo Modal
  const saveClientLogoBtn = document.getElementById("saveClientLogoBtn")
  if (saveClientLogoBtn) {
    saveClientLogoBtn.addEventListener("click", saveClientLogo)
  }
})
