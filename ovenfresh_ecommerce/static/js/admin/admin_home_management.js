let csrf_token = null
let hero_banners_url = null
let delivery_policies_url = null
let homepage_categories_url = null
let features_url = null
let about_section_url = null
let product_sections_url = null
let client_logos_url = null
let categories_url = null
let subcategories_url = null
let products_url = null

// Data storage
let heroBannersData = []
let deliveryPoliciesData = []
let homepageCategoriesData = []
let featuresData = []
let aboutSectionData = null
let productSectionsData = []
let clientLogosData = []
let categoriesData = []
let subcategoriesData = []
let productsData = []

// Current editing item
let currentEditingItem = null
let currentEditingType = null

// Declare bootstrap variable
// const bootstrap = window.bootstrap

function AdminHomeManagement(
  csrfTokenParam,
  heroBannersUrlParam,
  deliveryPoliciesUrlParam,
  homepageCategoriesUrlParam,
  featuresUrlParam,
  aboutSectionUrlParam,
  productSectionsUrlParam,
  clientLogosUrlParam,
  categoriesUrlParam,
  subcategoriesUrlParam,
  productsUrlParam,
) {
  csrf_token = csrfTokenParam
  hero_banners_url = heroBannersUrlParam
  delivery_policies_url = deliveryPoliciesUrlParam
  homepage_categories_url = homepageCategoriesUrlParam
  features_url = featuresUrlParam
  about_section_url = aboutSectionUrlParam
  product_sections_url = productSectionsUrlParam
  client_logos_url = clientLogosUrlParam
  categories_url = categoriesUrlParam
  subcategories_url = subcategoriesUrlParam
  products_url = productsUrlParam

  // Initialize the page
  document.addEventListener("DOMContentLoaded", async () => {
    initializeEventListeners()
    await loadAllData()
    renderAllSections()
  })
}

function initializeEventListeners() {
  // Refresh button
  document.getElementById("refreshBtn")?.addEventListener("click", async () => {
    await loadAllData()
    renderAllSections()
    showToast("Data refreshed successfully", "success")
  })

  // Save buttons for all modals
  document.getElementById("saveHeroBannerBtn")?.addEventListener("click", saveHeroBanner)
  document.getElementById("saveDeliveryPolicyBtn")?.addEventListener("click", saveDeliveryPolicy)
  document.getElementById("saveCategoryBtn")?.addEventListener("click", saveHomepageCategory)
  document.getElementById("saveFeatureBtn")?.addEventListener("click", saveFeature)
  document.getElementById("saveAboutSectionBtn")?.addEventListener("click", saveAboutSection)
  document.getElementById("saveProductSectionBtn")?.addEventListener("click", saveProductSection)
  document.getElementById("saveClientLogoBtn")?.addEventListener("click", saveClientLogo)

  // Edit about section button
  document.getElementById("editAboutBtn")?.addEventListener("click", editAboutSection)

  // Product section type change
  document.getElementById("productSectionType")?.addEventListener("change", handleProductSectionTypeChange)

  // Category change for subcategory loading
  document.getElementById("productSectionCategory")?.addEventListener("change", function () {
    const categoryId = this.value
    if (categoryId) {
      loadSubcategoriesForCategory(categoryId)
    }
  })

  // Tab change events
  document.querySelectorAll('#sectionTabs button[data-bs-toggle="tab"]').forEach((tab) => {
    tab.addEventListener("shown.bs.tab", (event) => {
      const targetSection = event.target.getAttribute("data-bs-target")
      handleTabChange(targetSection)
    })
  })
}

async function loadAllData() {
  showLoading(true)
  try {
    await Promise.all([
      loadHeroBanners(),
      loadDeliveryPolicies(),
      loadHomepageCategories(),
      loadFeatures(),
      loadAboutSection(),
      loadProductSections(),
      loadClientLogos(),
      loadCategories(),
      loadSubcategories(),
      loadProducts(),
    ])
  } catch (error) {
    console.error("Error loading data:", error)
    showToast("Error loading data", "error")
  } finally {
    showLoading(false)
  }
}

async function loadHeroBanners() {
  try {
    const response = await fetch(hero_banners_url)
    const data = await response.json()
    if (data.success) {
      heroBannersData = data.data || []
    }
  } catch (error) {
    console.error("Error loading hero banners:", error)
  }
}

async function loadDeliveryPolicies() {
  try {
    const response = await fetch(delivery_policies_url)
    const data = await response.json()
    if (data.success) {
      deliveryPoliciesData = data.data || []
    }
  } catch (error) {
    console.error("Error loading delivery policies:", error)
  }
}

async function loadHomepageCategories() {
  try {
    const response = await fetch(homepage_categories_url)
    const data = await response.json()
    if (data.success) {
      homepageCategoriesData = data.data || []
    }
  } catch (error) {
    console.error("Error loading homepage categories:", error)
  }
}

async function loadFeatures() {
  try {
    const response = await fetch(features_url)
    const data = await response.json()
    if (data.success) {
      featuresData = data.data || []
    }
  } catch (error) {
    console.error("Error loading features:", error)
  }
}

async function loadAboutSection() {
  try {
    const response = await fetch(about_section_url)
    const data = await response.json()
    if (data.success) {
      aboutSectionData = data.data
    }
  } catch (error) {
    console.error("Error loading about section:", error)
  }
}

async function loadProductSections() {
  try {
    const response = await fetch(product_sections_url)
    const data = await response.json()
    if (data.success) {
      productSectionsData = data.data || []
    }
  } catch (error) {
    console.error("Error loading product sections:", error)
  }
}

async function loadClientLogos() {
  try {
    const response = await fetch(client_logos_url)
    const data = await response.json()
    if (data.success) {
      clientLogosData = data.data || []
    }
  } catch (error) {
    console.error("Error loading client logos:", error)
  }
}

async function loadCategories() {
  try {
    const response = await fetch(categories_url)
    const data = await response.json()
    if (data.success) {
      categoriesData = data.data || []
    }
  } catch (error) {
    console.error("Error loading categories:", error)
  }
}

async function loadSubcategories() {
  try {
    const response = await fetch(subcategories_url)
    const data = await response.json()
    if (data.success) {
      subcategoriesData = data.data || []
    }
  } catch (error) {
    console.error("Error loading subcategories:", error)
  }
}

async function loadProducts() {
  try {
    const response = await fetch(products_url)
    const data = await response.json()
    if (data.success) {
      productsData = data.data || []
    }
  } catch (error) {
    console.error("Error loading products:", error)
  }
}

function renderAllSections() {
  renderHeroBanners()
  renderDeliveryPolicies()
  renderHomepageCategories()
  renderFeatures()
  renderAboutSection()
  renderProductSections()
  renderClientLogos()
}

function renderHeroBanners() {
  const tbody = document.getElementById("heroBannersTableBody")
  if (!tbody) return

  tbody.innerHTML = ""

  heroBannersData.forEach((banner) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${banner.order}</td>
            <td>
                <img src="${banner.image}" alt="${banner.title}" 
                     style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">
            </td>
            <td>${banner.title}</td>
            <td>${banner.subtitle || "-"}</td>
            <td>${banner.button_text || "-"}</td>
            <td>
                <span class="badge ${banner.is_active ? "bg-success" : "bg-secondary"}">
                    ${banner.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editHeroBanner(${banner.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteHeroBanner(${banner.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `
    tbody.appendChild(row)
  })
}

function renderDeliveryPolicies() {
  const tbody = document.getElementById("deliveryPoliciesTableBody")
  if (!tbody) return

  tbody.innerHTML = ""

  deliveryPoliciesData.forEach((policy) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${policy.order}</td>
            <td>
                <span class="badge bg-info">${policy.policy_type_display}</span>
            </td>
            <td>${policy.title}</td>
            <td><i class="${policy.icon}"></i> ${policy.icon}</td>
            <td>
                ${policy.countdown_hours || 0}h ${policy.countdown_minutes || 0}m ${policy.countdown_seconds || 0}s
            </td>
            <td>
                <span class="badge ${policy.is_active ? "bg-success" : "bg-secondary"}">
                    ${policy.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editDeliveryPolicy(${policy.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteDeliveryPolicy(${policy.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `
    tbody.appendChild(row)
  })
}

function renderHomepageCategories() {
  const tbody = document.getElementById("categoriesTableBody")
  if (!tbody) return

  tbody.innerHTML = ""

  homepageCategoriesData.forEach((category) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${category.order}</td>
            <td>
                <img src="${category.image}" alt="${category.title}" 
                     style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">
            </td>
            <td>${category.title}</td>
            <td>${category.description || "-"}</td>
            <td>${category.category_link ? `<a href="${category.category_link}" target="_blank">View</a>` : "-"}</td>
            <td>
                <span class="badge ${category.is_active ? "bg-success" : "bg-secondary"}">
                    ${category.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editHomepageCategory(${category.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteHomepageCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `
    tbody.appendChild(row)
  })
}

function renderFeatures() {
  const tbody = document.getElementById("featuresTableBody")
  if (!tbody) return

  tbody.innerHTML = ""

  featuresData.forEach((feature) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${feature.order}</td>
            <td><i class="${feature.icon}"></i> ${feature.icon}</td>
            <td>${feature.title}</td>
            <td>${feature.description}</td>
            <td>
                <span class="badge ${feature.is_active ? "bg-success" : "bg-secondary"}">
                    ${feature.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editFeature(${feature.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteFeature(${feature.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `
    tbody.appendChild(row)
  })
}

function renderAboutSection() {
  const container = document.getElementById("aboutSectionPreview")
  if (!container) return

  if (!aboutSectionData) {
    container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                No about section configured. Click "Edit About Section" to create one.
            </div>
        `
    return
  }

  container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <img src="${aboutSectionData.main_image}" alt="About Image" class="img-fluid rounded">
                    </div>
                    <div class="col-md-8">
                        <h6 class="text-primary">${aboutSectionData.subtitle}</h6>
                        <h4>${aboutSectionData.title}</h4>
                        <p>${aboutSectionData.description_1}</p>
                        <p>${aboutSectionData.description_2}</p>
                        <div class="d-flex align-items-center">
                            <span class="badge bg-primary me-2">${aboutSectionData.years_experience}+ Years</span>
                            <a href="${aboutSectionData.button_link}" class="btn btn-sm btn-outline-primary">
                                ${aboutSectionData.button_text}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

function renderProductSections() {
  const tbody = document.getElementById("productSectionsTableBody")
  if (!tbody) return

  tbody.innerHTML = ""

  productSectionsData.forEach((section) => {
    const row = document.createElement("tr")

    let categoryInfo = "-"
    if (section.category_details) {
      categoryInfo = section.category_details.title
      if (section.subcategory_details) {
        categoryInfo += ` > ${section.subcategory_details.title}`
      }
    }

    row.innerHTML = `
            <td>${section.order}</td>
            <td>${section.title}</td>
            <td>
                <span class="badge bg-info">${section.section_type_display}</span>
            </td>
            <td>${categoryInfo}</td>
            <td>${section.max_products}</td>
            <td>
                <span class="badge ${section.is_active ? "bg-success" : "bg-secondary"}">
                    ${section.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editProductSection(${section.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteProductSection(${section.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `
    tbody.appendChild(row)
  })
}

function renderClientLogos() {
  const tbody = document.getElementById("clientLogosTableBody")
  if (!tbody) return

  tbody.innerHTML = ""

  clientLogosData.forEach((logo) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${logo.order}</td>
            <td>
                <img src="${logo.logo_url}" alt="${logo.company_name}" 
                     style="width: 60px; height: 40px; object-fit: contain; border-radius: 4px;">
            </td>
            <td>${logo.company_name}</td>
            <td>${logo.website_url ? `<a href="${logo.website_url}" target="_blank">Visit</a>` : "-"}</td>
            <td>
                <span class="badge ${logo.is_active ? "bg-success" : "bg-secondary"}">
                    ${logo.is_active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editClientLogo(${logo.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteClientLogo(${logo.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Hero Banner Functions
function editHeroBanner(id) {
  const banner = heroBannersData.find((b) => b.id === id)
  if (!banner) return

  currentEditingItem = banner
  currentEditingType = "hero_banner"

  // Populate form
  document.getElementById("heroBannerTitle").value = banner.title
  document.getElementById("heroBannerSubtitle").value = banner.subtitle || ""
  document.getElementById("heroBannerDescription").value = banner.description || ""
  document.getElementById("heroBannerImage").value = banner.image
  document.getElementById("heroBannerButtonText").value = banner.button_text || ""
  document.getElementById("heroBannerButtonLink").value = banner.button_link || ""
  document.getElementById("heroBannerOrder").value = banner.order
  document.getElementById("heroBannerActive").checked = banner.is_active

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("heroBannerModal"))
  modal.show()
}

async function saveHeroBanner() {
  const formData = {
    title: document.getElementById("heroBannerTitle").value,
    subtitle: document.getElementById("heroBannerSubtitle").value,
    description: document.getElementById("heroBannerDescription").value,
    image: document.getElementById("heroBannerImage").value,
    button_text: document.getElementById("heroBannerButtonText").value,
    button_link: document.getElementById("heroBannerButtonLink").value,
    order: Number.parseInt(document.getElementById("heroBannerOrder").value),
    is_active: document.getElementById("heroBannerActive").checked,
  }

  try {
    let response
    if (currentEditingItem && currentEditingType === "hero_banner") {
      // Update existing
      response = await fetch(`${hero_banners_url}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      // Create new
      response = await fetch(hero_banners_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    }

    const data = await response.json()
    console.log("Save Hero Banner Response:", data)
    if (data.success) {
      showToast("Hero banner saved successfully", "success")
      await loadHeroBanners()
      renderHeroBanners()

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("heroBannerModal"))
      modal.hide()

      // Reset form
      document.getElementById("heroBannerForm").reset()
      currentEditingItem = null
      currentEditingType = null
    } else {
      showToast("Error saving hero banner: " + JSON.stringify(data.error), "error")
    }
  } catch (error) {
    console.error("Error saving hero banner:", error)
    showToast("Error saving hero banner", "error")
  }
}

async function deleteHeroBanner(id) {
  if (!confirm("Are you sure you want to delete this hero banner?")) return

  try {
    const response = await fetch(`${hero_banners_url}${id}/`, {
      method: "DELETE",
      headers: {
        "X-CSRFToken": csrf_token,
      },
    })

    const data = await response.json()
    if (data.success) {
      showToast("Hero banner deleted successfully", "success")
      await loadHeroBanners()
      renderHeroBanners()
    } else {
      showToast("Error deleting hero banner", "error")
    }
  } catch (error) {
    console.error("Error deleting hero banner:", error)
    showToast("Error deleting hero banner", "error")
  }
}

// Delivery Policy Functions
function editDeliveryPolicy(id) {
  const policy = deliveryPoliciesData.find((p) => p.id === id)
  if (!policy) return

  currentEditingItem = policy
  currentEditingType = "delivery_policy"

  // Populate form
  document.getElementById("deliveryPolicyTitle").value = policy.title
  document.getElementById("deliveryPolicyType").value = policy.policy_type
  document.getElementById("deliveryPolicyIcon").value = policy.icon || ""
  document.getElementById("deliveryPolicyDescription").value = policy.description || ""
  document.getElementById("deliveryPolicyCountdownHour").value = policy.countdown_hours || ""
  document.getElementById("deliveryPolicyCountdownMinute").value = policy.countdown_minutes || ""
  document.getElementById("deliveryPolicyOrder").value = policy.order
  document.getElementById("deliveryPolicyActive").checked = policy.is_active

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("deliveryPolicyModal"))
  modal.show()
}

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
      response = await fetch(`${delivery_policies_url}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(delivery_policies_url, {
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
      showToast("Delivery policy saved successfully", "success")
      await loadDeliveryPolicies()
      renderDeliveryPolicies()

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("deliveryPolicyModal"))
      modal.hide()

      // Reset form
      document.getElementById("deliveryPolicyForm").reset()
      currentEditingItem = null
      currentEditingType = null
    } else {
      showToast("Error saving delivery policy: " + JSON.stringify(data.error), "error")
    }
  } catch (error) {
    console.error("Error saving delivery policy:", error)
    showToast("Error saving delivery policy", "error")
  }
}

async function deleteDeliveryPolicy(id) {
  if (!confirm("Are you sure you want to delete this delivery policy?")) return

  try {
    const response = await fetch(`${delivery_policies_url}${id}/`, {
      method: "DELETE",
      headers: {
        "X-CSRFToken": csrf_token,
      },
    })

    const data = await response.json()
    if (data.success) {
      showToast("Delivery policy deleted successfully", "success")
      await loadDeliveryPolicies()
      renderDeliveryPolicies()
    } else {
      showToast("Error deleting delivery policy", "error")
    }
  } catch (error) {
    console.error("Error deleting delivery policy:", error)
    showToast("Error deleting delivery policy", "error")
  }
}

// Homepage Category Functions
function editHomepageCategory(id) {
  const category = homepageCategoriesData.find((c) => c.id === id)
  if (!category) return

  currentEditingItem = category
  currentEditingType = "homepage_category"

  document.getElementById("categoryTitle").value = category.title
  document.getElementById("categoryDescription").value = category.description || ""
  document.getElementById("categoryImage").value = category.image
  document.getElementById("categoryLink").value = category.category_link || ""
  document.getElementById("categoryOrder").value = category.order
  document.getElementById("categoryActive").checked = category.is_active

  const modal = new bootstrap.Modal(document.getElementById("categoryModal"))
  modal.show()
}

async function saveHomepageCategory() {
  const formData = {
    title: document.getElementById("categoryTitle").value,
    description: document.getElementById("categoryDescription").value,
    image: document.getElementById("categoryImage").value,
    category_link: document.getElementById("categoryLink").value,
    order: Number.parseInt(document.getElementById("categoryOrder").value),
    is_active: document.getElementById("categoryActive").checked,
  }

  try {
    let response
    if (currentEditingItem && currentEditingType === "homepage_category") {
      response = await fetch(`${homepage_categories_url}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(homepage_categories_url, {
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
      showToast("Category saved successfully", "success")
      await loadHomepageCategories()
      renderHomepageCategories()

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("categoryModal"))
      modal.hide()

      // Reset form
      document.getElementById("categoryForm").reset()
      currentEditingItem = null
      currentEditingType = null
    } else {
      showToast("Error saving category: " + JSON.stringify(data.error), "error")
    }
  } catch (error) {
    console.error("Error saving category:", error)
    showToast("Error saving category", "error")
  }
}

async function deleteHomepageCategory(id) {
  if (!confirm("Are you sure you want to delete this category?")) return

  try {
    const response = await fetch(`${homepage_categories_url}${id}/`, {
      method: "DELETE",
      headers: {
        "X-CSRFToken": csrf_token,
      },
    })

    const data = await response.json()
    if (data.success) {
      showToast("Category deleted successfully", "success")
      await loadHomepageCategories()
      renderHomepageCategories()
    } else {
      showToast("Error deleting category", "error")
    }
  } catch (error) {
    console.error("Error deleting category:", error)
    showToast("Error deleting category", "error")
  }
}

// Feature Functions
function editFeature(id) {
  const feature = featuresData.find((f) => f.id === id)
  if (!feature) return

  currentEditingItem = feature
  currentEditingType = "feature"

  document.getElementById("featureTitle").value = feature.title
  document.getElementById("featureIcon").value = feature.icon
  document.getElementById("featureDescription").value = feature.description
  document.getElementById("featureOrder").value = feature.order
  document.getElementById("featureActive").checked = feature.is_active

  const modal = new bootstrap.Modal(document.getElementById("featureModal"))
  modal.show()
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
      response = await fetch(`${features_url}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(features_url, {
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
      showToast("Feature saved successfully", "success")
      await loadFeatures()
      renderFeatures()

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("featureModal"))
      modal.hide()

      // Reset form
      document.getElementById("featureForm").reset()
      currentEditingItem = null
      currentEditingType = null
    } else {
      showToast("Error saving feature: " + JSON.stringify(data.error), "error")
    }
  } catch (error) {
    console.error("Error saving feature:", error)
    showToast("Error saving feature", "error")
  }
}

async function deleteFeature(id) {
  if (!confirm("Are you sure you want to delete this feature?")) return

  try {
    const response = await fetch(`${features_url}${id}/`, {
      method: "DELETE",
      headers: {
        "X-CSRFToken": csrf_token,
      },
    })

    const data = await response.json()
    if (data.success) {
      showToast("Feature deleted successfully", "success")
      await loadFeatures()
      renderFeatures()
    } else {
      showToast("Error deleting feature", "error")
    }
  } catch (error) {
    console.error("Error deleting feature:", error)
    showToast("Error deleting feature", "error")
  }
}

// About Section Functions
function editAboutSection() {
  currentEditingItem = aboutSectionData
  currentEditingType = "about_section"

  if (aboutSectionData) {
    document.getElementById("aboutTitle").value = aboutSectionData.title
    document.getElementById("aboutSubtitle").value = aboutSectionData.subtitle || ""
    document.getElementById("aboutDescription").value = aboutSectionData.description_1 || ""
    document.getElementById("aboutImage").value = aboutSectionData.main_image || ""
    document.getElementById("aboutButtonText").value = aboutSectionData.button_text || ""
    document.getElementById("aboutButtonLink").value = aboutSectionData.button_link || ""
    document.getElementById("aboutActive").checked = aboutSectionData.is_active
  }

  const modal = new bootstrap.Modal(document.getElementById("aboutSectionModal"))
  modal.show()
}

async function saveAboutSection() {
  const formData = {
    title: document.getElementById("aboutTitle").value,
    subtitle: document.getElementById("aboutSubtitle").value,
    description_1: document.getElementById("aboutDescription").value,
    description_2: document.getElementById("aboutDescription").value, // Using same for both
    main_image: document.getElementById("aboutImage").value,
    button_text: document.getElementById("aboutButtonText").value,
    button_link: document.getElementById("aboutButtonLink").value,
    is_active: document.getElementById("aboutActive").checked,
  }

  try {
    let response
    if (aboutSectionData && aboutSectionData.id) {
      response = await fetch(`${about_section_url}${aboutSectionData.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(about_section_url, {
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
      showToast("About section saved successfully", "success")
      await loadAboutSection()
      renderAboutSection()

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("aboutSectionModal"))
      modal.hide()

      // Reset form
      document.getElementById("aboutSectionForm").reset()
      currentEditingItem = null
      currentEditingType = null
    } else {
      showToast("Error saving about section: " + JSON.stringify(data.error), "error")
    }
  } catch (error) {
    console.error("Error saving about section:", error)
    showToast("Error saving about section", "error")
  }
}

// Product Section Functions
function editProductSection(id) {
  const section = productSectionsData.find((s) => s.id === id)
  if (!section) return

  currentEditingItem = section
  currentEditingType = "product_section"

  document.getElementById("productSectionTitle").value = section.title
  document.getElementById("productSectionType").value = section.section_type
  document.getElementById("productSectionMaxProducts").value = section.max_products
  document.getElementById("productSectionDescription").value = section.description || ""
  document.getElementById("productSectionOrder").value = section.order
  document.getElementById("productSectionActive").checked = section.is_active

  // Handle category/subcategory selection
  handleProductSectionTypeChange()

  if (section.category_id) {
    document.getElementById("productSectionCategory").value = section.category_id
    if (section.subcategory_id) {
      loadSubcategoriesForCategory(section.category_id).then(() => {
        document.getElementById("productSectionSubcategory").value = section.subcategory_id
      })
    }
  }

  const modal = new bootstrap.Modal(document.getElementById("productSectionModal"))
  modal.show()
}

async function saveProductSection() {
  const formData = {
    title: document.getElementById("productSectionTitle").value,
    section_type: document.getElementById("productSectionType").value,
    max_products: Number.parseInt(document.getElementById("productSectionMaxProducts").value),
    description: document.getElementById("productSectionDescription").value,
    order: Number.parseInt(document.getElementById("productSectionOrder").value),
    is_active: document.getElementById("productSectionActive").checked,
  }

  // Add category/subcategory if applicable
  const sectionType = document.getElementById("productSectionType").value
  if (sectionType === "category" || sectionType === "category_based") {
    formData.section_type = "category_based"
    formData.category_id = document.getElementById("productSectionCategory").value
  }
  if (sectionType === "subcategory") {
    formData.section_type = "category_based"
    formData.category_id = document.getElementById("productSectionCategory").value
    formData.subcategory_id = document.getElementById("productSectionSubcategory").value
  }

  try {
    let response
    if (currentEditingItem && currentEditingType === "product_section") {
      response = await fetch(`${product_sections_url}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(product_sections_url, {
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
      showToast("Product section saved successfully", "success")
      await loadProductSections()
      renderProductSections()

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("productSectionModal"))
      modal.hide()

      // Reset form
      document.getElementById("productSectionForm").reset()
      currentEditingItem = null
      currentEditingType = null
    } else {
      showToast("Error saving product section: " + JSON.stringify(data.error), "error")
    }
  } catch (error) {
    console.error("Error saving product section:", error)
    showToast("Error saving product section", "error")
  }
}

async function deleteProductSection(id) {
  if (!confirm("Are you sure you want to delete this product section?")) return

  try {
    const response = await fetch(`${product_sections_url}${id}/`, {
      method: "DELETE",
      headers: {
        "X-CSRFToken": csrf_token,
      },
    })

    const data = await response.json()
    if (data.success) {
      showToast("Product section deleted successfully", "success")
      await loadProductSections()
      renderProductSections()
    } else {
      showToast("Error deleting product section", "error")
    }
  } catch (error) {
    console.error("Error deleting product section:", error)
    showToast("Error deleting product section", "error")
  }
}

// Client Logo Functions
function editClientLogo(id) {
  const logo = clientLogosData.find((l) => l.id === id)
  if (!logo) return

  currentEditingItem = logo
  currentEditingType = "client_logo"

  document.getElementById("clientLogoCompanyName").value = logo.company_name
  document.getElementById("clientLogoImage").value = logo.logo_url
  document.getElementById("clientLogoWebsite").value = logo.website_url || ""
  document.getElementById("clientLogoDescription").value = logo.description || ""
  document.getElementById("clientLogoOrder").value = logo.order
  document.getElementById("clientLogoActive").checked = logo.is_active

  const modal = new bootstrap.Modal(document.getElementById("clientLogoModal"))
  modal.show()
}

async function saveClientLogo() {
  const formData = {
    company_name: document.getElementById("clientLogoCompanyName").value,
    logo_url: document.getElementById("clientLogoImage").value,
    website_url: document.getElementById("clientLogoWebsite").value,
    description: document.getElementById("clientLogoDescription").value,
    order: Number.parseInt(document.getElementById("clientLogoOrder").value),
    is_active: document.getElementById("clientLogoActive").checked,
  }

  try {
    let response
    if (currentEditingItem && currentEditingType === "client_logo") {
      response = await fetch(`${client_logos_url}${currentEditingItem.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf_token,
        },
        body: JSON.stringify(formData),
      })
    } else {
      response = await fetch(client_logos_url, {
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
      showToast("Client logo saved successfully", "success")
      await loadClientLogos()
      renderClientLogos()

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("clientLogoModal"))
      modal.hide()

      // Reset form
      document.getElementById("clientLogoForm").reset()
      currentEditingItem = null
      currentEditingType = null
    } else {
      showToast("Error saving client logo: " + JSON.stringify(data.error), "error")
    }
  } catch (error) {
    console.error("Error saving client logo:", error)
    showToast("Error saving client logo", "error")
  }
}

async function deleteClientLogo(id) {
  if (!confirm("Are you sure you want to delete this client logo?")) return

  try {
    const response = await fetch(`${client_logos_url}${id}/`, {
      method: "DELETE",
      headers: {
        "X-CSRFToken": csrf_token,
      },
    })

    const data = await response.json()
    if (data.success) {
      showToast("Client logo deleted successfully", "success")
      await loadClientLogos()
      renderClientLogos()
    } else {
      showToast("Error deleting client logo", "error")
    }
  } catch (error) {
    console.error("Error deleting client logo:", error)
    showToast("Error deleting client logo", "error")
  }
}

// Product Section Type Change Handler and Category/Subcategory Loading
function handleProductSectionTypeChange() {
  const sectionType = document.getElementById("productSectionType").value
  const categoryDiv = document.getElementById("categorySelectDiv")
  const subcategoryDiv = document.getElementById("subcategorySelectDiv")

  // Hide both by default
  categoryDiv.style.display = "none"
  subcategoryDiv.style.display = "none"

  if (sectionType === "category" || sectionType === "category_based") {
    categoryDiv.style.display = "block"
    loadCategoriesDropdown()
  } else if (sectionType === "subcategory") {
    categoryDiv.style.display = "block"
    subcategoryDiv.style.display = "block"
    loadCategoriesDropdown()
  }
}

function loadCategoriesDropdown() {
  const categorySelect = document.getElementById("productSectionCategory")
  categorySelect.innerHTML = '<option value="">Select Category</option>'

  categoriesData.forEach((category) => {
    const option = document.createElement("option")
    option.value = category.category_id
    option.textContent = category.name || category.title
    categorySelect.appendChild(option)
  })
}

async function loadSubcategoriesForCategory(categoryId) {
  const subcategorySelect = document.getElementById("productSectionSubcategory")
  subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>'

  const filteredSubcategories = subcategoriesData.filter((sub) => sub.category_id == categoryId)
  filteredSubcategories.forEach((subcategory) => {
    const option = document.createElement("option")
    option.value = subcategory.subcategory_id
    option.textContent = subcategory.name || subcategory.title
    subcategorySelect.appendChild(option)
  })
}

// Utility Functions
function handleTabChange(targetSection) {
  // Handle any specific logic when tabs change
  console.log("Tab changed to:", targetSection)
}

function showLoading(show) {
  const spinner = document.getElementById("loadingSpinner")
  if (spinner) {
    spinner.style.display = show ? "block" : "none"
  }
}

function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer")
  if (!toastContainer) return

  const toastId = "toast-" + Date.now()
  const bgClass = type === "success" ? "bg-success" : type === "error" ? "bg-danger" : "bg-info"

  const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `

  toastContainer.insertAdjacentHTML("beforeend", toastHTML)

  const toastElement = document.getElementById(toastId)
  const toast = new bootstrap.Toast(toastElement, { delay: 5000 })
  toast.show()

  // Remove toast element after it's hidden
  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove()
  })
}
