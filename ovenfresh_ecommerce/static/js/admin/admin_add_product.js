let csrf_token = null
let category_url = null
let sub_category_url = null
let pincode_timeslots_url = null
let add_product_url = null
let add_product_variation_url = null
let availability_charges_url = null

let existingProductImages = []
let pincodeLogicEnabled = false

let pincodes = []
let timeslots = []
let product_id = null
let copiedAvailability = null
let categoryData = []
let selectedProductImages = []
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get("product_id")) {
  product_id = urlParams.get("product_id")
}

// Helper functions for quantity and UOM handling
function combineQuantityUOM(quantity, uom) {
  if (!quantity || !uom) return ""
  return `${quantity} ${uom}`
}

function splitWeightVariation(weightVariation) {
  if (!weightVariation) return { quantity: "", uom: "" }

  // Handle various formats: "500g", "500 g", "500gm", "500 gm", "1.5kg", "2 piece", etc.
  const match = weightVariation.trim().match(/^(\d+(?:\.\d+)?)\s*(.+)$/)

  if (match) {
    const quantity = match[1]
    let uom = match[2].toLowerCase().trim()

    // Normalize common variations
    const uomMap = {
      g: "gm",
      gram: "gm",
      grams: "gm",
      kilogram: "kg",
      kilograms: "kg",
      liter: "ltr",
      liters: "ltr",
      milliliter: "ml",
      milliliters: "ml",
      pieces: "piece",
      pcs: "piece",
      pc: "piece",
    }

    uom = uomMap[uom] || uom

    return { quantity, uom }
  }

  return { quantity: "", uom: "" }
}

function reloadWithParam(key, value) {
  const url = new URL(window.location.href)
  url.searchParams.set(key, value) // add or update param
  window.location.href = url.toString() // reload with updated URL
}

async function AdminAddProduct(
  csrf_token_param,
  category_url_param,
  sub_category_url_param,
  pincode_timeslots_url_param,
  add_product_url_param,
  add_product_variation_url_param,
  availability_charges_url_param,
) {
  csrf_token = csrf_token_param
  category_url = category_url_param
  sub_category_url = sub_category_url_param
  pincode_timeslots_url = pincode_timeslots_url_param
  add_product_url = add_product_url_param
  add_product_variation_url = add_product_variation_url_param
  availability_charges_url = availability_charges_url_param

  // Initialize photo upload functionality
  initializePhotoUpload()
  await loadCategoriesAndSubcategories()
  await loadPincodesAndTimeslots()

  if (product_id) {
    await loadProductData()
    document.getElementById("variationSection").style.display = ""
  }

  document.getElementById("submitProductBtn").addEventListener("click", async () => {
    showLoading("Creating product...")
    if (!product_id) {
      await createProductMeta() // creates product and sets product_id
      reloadWithParam("product_id", product_id)
    } else {
      await createProductMeta(true) // updates product
    }
    await loadProductData()
    document.getElementById("variationSection").style.display = ""
    await loadExistingVariations()
    hideLoading()
    showToast("success", "Success", "Product saved successfully")
  })

  document.getElementById("submitVariationBtn").addEventListener("click", async () => {
    if (!product_id) {
      showToast("error", "Error", "Please create a product first.")
      return
    }

    showLoading("Saving variation...")
    if (document.getElementById("productVariationId").value) {
      await updateVariationWithAvailability(document.getElementById("productVariationId").value)
    } else {
      await createVariationWithAvailability()
    }

    await loadExistingVariations()
    hideLoading()
  })

  await loadExistingVariations()

  // Initialize theme toggle functionality
  const themeToggle = document.getElementById("theme-toggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme)
  }

  // Initialize mobile sidebar toggle
  const mobileToggle = document.querySelector(".navbar-toggler")
  if (mobileToggle) {
    mobileToggle.addEventListener("click", toggleMobileSidebar)
  }

  // Load saved theme
  loadSavedTheme()
}

function initializePhotoUpload() {
  const photoInput = document.getElementById("productPhotoInput")
  photoInput.addEventListener("change", handlePhotoSelection)
}

function handlePhotoSelection(event) {
  const files = event.target.files
  const allowedExtensions = ["jpg", "jpeg", "png", "webp"]
  const maxFileSize = 5 * 1024 * 1024 // 5MB
  const targetAspectRatio = 1 // 1:1 square ratio
  const tolerance = 0.1 // 10% tolerance

  for (const file of files) {
    const fileExtension = file.name.split(".").pop().toLowerCase()

    // Check file type
    if (!allowedExtensions.includes(fileExtension)) {
      showToast(
        "error",
        "Invalid File Type",
        `${file.name} is not a supported image format. Please use JPG, PNG, or WebP.`,
      )
      continue
    }

    // Check file size
    if (file.size > maxFileSize) {
      showToast("error", "File Too Large", `${file.name} is too large. Please use images under 5MB.`)
      continue
    }

    // Check aspect ratio
    validateImageAspectRatio(file, targetAspectRatio, tolerance)
  }
}

function validateImageAspectRatio(file, targetRatio, tolerance) {
  const img = new Image()
  const url = URL.createObjectURL(file)

  img.onload = function () {
    const aspectRatio = this.width / this.height
    const difference = Math.abs(aspectRatio - targetRatio)

    if (difference <= tolerance) {
      // Image passes validation
      addImageToSelection(file)
      showToast("success", "Image Added", `${file.name} has been added to the product images.`)
    } else {
      showToast(
        "warning",
        "Aspect Ratio Warning",
        `${file.name} has an aspect ratio of ${aspectRatio.toFixed(2)}:1. Recommended ratio is 1:1 (square). The image may appear distorted.`,
      )
      // Still add the image but with warning
      addImageToSelection(file)
    }

    URL.revokeObjectURL(url)
    updatePhotoUploadUI()
  }

  img.onerror = () => {
    showToast("error", "Invalid Image", `${file.name} is not a valid image file.`)
    URL.revokeObjectURL(url)
  }

  img.src = url
}

function addImageToSelection(file) {
  selectedProductImages.push(file)
}

function updatePhotoUploadUI() {
  const uploadText = document.getElementById("photoUploadText")
  const fileText = document.getElementById("photoUploadFileText")
  const uploadIcon = document.getElementById("photoUploadIcon")
  const previewContainer = document.getElementById("photoPreviewContainer")
  const previewGrid = document.getElementById("photoPreviewGrid")

  if (selectedProductImages.length > 0) {
    uploadText.style.display = "none"
    fileText.style.display = "block"
    fileText.textContent = `${selectedProductImages.length} image(s) selected`
    uploadIcon.className = "fas fa-check-circle fa-2x mb-2 text-success"

    // Show preview
    previewContainer.style.display = "block"
    previewGrid.innerHTML = ""

    selectedProductImages.forEach((file, index) => {
      const col = document.createElement("div")
      col.className = "col-md-3 mb-2"

      const card = document.createElement("div")
      card.className = "card"

      const img = document.createElement("img")
      img.src = URL.createObjectURL(file)
      img.className = "card-img-top"
      img.style.height = "100px"
      img.style.objectFit = "cover"

      const cardBody = document.createElement("div")
      cardBody.className = "card-body p-2"

      const fileName = document.createElement("small")
      fileName.className = "text-muted"
      fileName.textContent = file.name.length > 20 ? file.name.substring(0, 20) + "..." : file.name

      const removeBtn = document.createElement("button")
      removeBtn.className = "btn btn-sm btn-outline-danger mt-1"
      removeBtn.innerHTML = '<i class="fas fa-trash"></i>'
      removeBtn.onclick = () => removeImage(index)

      cardBody.appendChild(fileName)
      cardBody.appendChild(document.createElement("br"))
      cardBody.appendChild(removeBtn)

      card.appendChild(img)
      card.appendChild(cardBody)
      col.appendChild(card)
      previewGrid.appendChild(col)
    })
  } else {
    uploadText.style.display = "block"
    fileText.style.display = "none"
    uploadIcon.className = "fas fa-cloud-upload-alt fa-2x mb-2 text-muted"
    previewContainer.style.display = "none"
  }
}

function removeImage(index) {
  selectedProductImages.splice(index, 1)
  updatePhotoUploadUI()

  // Reset file input
  document.getElementById("productPhotoInput").value = ""
}

async function loadProductData() {
  const [Success, Res] = await callApi("GET", `${add_product_url}?product_id=${product_id}`)

  if (Success && Res.success) {
    console.log(Res.data)

    document.getElementById("productTitle").value = Res.data.title
    document.getElementById("productDesc").value = Res.data.description

    // Fix: Use correct field names for category and subcategory selection
    const categorySelect = document.getElementById("categorySelect")
    const subCategorySelect = document.getElementById("subCategorySelect")

    // Set category value using category_id
    if (Res.data.category_id) {
      categorySelect.value = Res.data.category_id
      // Trigger change event to populate subcategories
      categorySelect.dispatchEvent(new Event("change"))

      // Set subcategory after a brief delay to ensure subcategories are loaded
      setTimeout(() => {
        if (Res.data.sub_category_id) {
          subCategorySelect.value = Res.data.sub_category_id
        }
      }, 100)
    }

    // Display existing images
    if (Res.data.photos && Res.data.photos.length > 0) {
      displayExistingImages(Res.data.photos)
    }

    // Handle existing photos - show them as uploaded
    if (Res.data.photos && Res.data.photos.length > 0) {
      const uploadText = document.getElementById("photoUploadText")
      const fileText = document.getElementById("photoUploadFileText")
      const uploadIcon = document.getElementById("photoUploadIcon")

      uploadText.style.display = "none"
      fileText.style.display = "block"
      fileText.textContent = `${Res.data.photos.length} existing image(s) + ${selectedProductImages.length} new image(s)`
      uploadIcon.className = "fas fa-check-circle fa-2x mb-2 text-success"
    }

    document.getElementById("submitProductBtn").innerHTML = '<i class="fas fa-save me-1"></i> Update Product'
  }
}

async function loadCategoriesAndSubcategories() {
  const [catSuccess, catRes] = await callApi("GET", category_url) // Must return subcategories too

  if (catSuccess && catRes.success) {
    categoryData = catRes.data

    const catSelect = document.getElementById("categorySelect")
    catSelect.innerHTML = `<option value="">Select Category</option>` // Clear before fill

    categoryData.forEach((cat) => {
      const option = document.createElement("option")
      option.value = cat.category_id
      option.text = cat.title
      catSelect.appendChild(option)
    })

    // Optional: attach event listener to category select
    catSelect.addEventListener("change", handleCategoryChange)
  }
}

function handleCategoryChange(event) {
  const selectedCatId = Number.parseInt(event.target.value)
  const subCatSelect = document.getElementById("subCategorySelect")
  subCatSelect.innerHTML = `<option value="">Select Sub-Category</option>` // Clear

  const selectedCategory = categoryData.find((cat) => cat.category_id == selectedCatId)

  if (selectedCategory && selectedCategory.subcategories) {
    selectedCategory.subcategories.forEach((sub) => {
      const option = document.createElement("option")
      option.value = sub.sub_category_id
      option.text = sub.title
      subCatSelect.appendChild(option)
    })
  }
}

async function loadPincodesAndTimeslots() {
  const [success, result] = await callApi("GET", pincode_timeslots_url)

  if (success && result.success) {
    // Check if pincode logic is enabled (you can get this from API response or set manually)
    const pincodeEnabled = result.data.pincode_logic_enabled !== false // Default to true if not specified
    updatePincodeStatusUI(pincodeEnabled)

    if (!pincodeEnabled) {
      showToast(
        "info",
        "Info",
        "Pincode-based availability is currently disabled. All products will be available everywhere.",
      )
      return
    }

    // Original pincode loading logic
    pincodes = result.data.pincodes
    timeslots = result.data.timeslots

    const container = document.getElementById("pincodeAvailability")
    container.innerHTML = ""

    // Populate timeslot dropdown in tools
    const disableTimeslotSelect = document.getElementById("disableTimeslot")
    if (disableTimeslotSelect) {
      disableTimeslotSelect.innerHTML = "<option disabled selected>Select Timeslot to Disable</option>"
      timeslots.forEach((ts) => {
        disableTimeslotSelect.innerHTML += `<option value="${ts.id}">${ts.time_slot_title}</option>`
      })
    }

    // Create accordion for pincodes
    const accordion = document.createElement("div")
    accordion.className = "accordion"
    accordion.id = "pincodeAccordion"

    pincodes.forEach((pincode, i) => {
      console.log(pincode)
      const accordionItem = document.createElement("div")
      accordionItem.className = "accordion-item"

      const headerId = `heading-${pincode.id}`
      const collapseId = `collapse-${pincode.id}`

      accordionItem.innerHTML = `
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button ${i > 0 ? "collapsed" : ""}" type="button" data-bs-toggle="collapse" 
                            data-bs-target="#${collapseId}" aria-expanded="${i === 0 ? "true" : "false"}" aria-controls="${collapseId}">
                        ${pincode.area_name} - ${pincode.pincode}
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse ${i === 0 ? "show" : ""}" 
                     aria-labelledby="${headerId}" data-bs-parent="#pincodeAccordion">
                    <div class="accordion-body">
                        <input type="hidden" id="availability_${pincode.id}" value="" />
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Time Slot</th>
                                        <th>Available</th>
                                        <th>Charge (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${timeslots
                                      .map(
                                        (slot) => `
                                        <tr>
                                            <td>${slot.time_slot_title}</td>
                                            <td>
                                                <div class="form-check form-switch">
                                                    <input class="form-check-input timeslot-checkbox" type="checkbox"
                                                    ${pincode.delivery_charge[`${slot.id}`]["available"] ? "checked" : ""}
                                                           id="pincode_${pincode.id}_slot_${slot.id}">
                                                </div>
                                            </td>
                                            <td>                                                
                                                <input type="number" class="form-control form-control-sm" 
                                                       id="charge_${pincode.id}_${slot.id}" value="${pincode.delivery_charge[`${slot.id}`]["charges"]}" style="width: 80px">
                                            </td>
                                        </tr>
                                    `,
                                      )
                                      .join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `

      accordion.appendChild(accordionItem)
    })

    container.appendChild(accordion)
  }
}

function applyUniversalCharge() {
  const charge = document.getElementById("universalCharge").value
  if (!charge) {
    showToast("warning", "Warning", "Please enter a charge value")
    return
  }

  pincodes.forEach((pincode) => {
    timeslots.forEach((slot) => {
      const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`)
      if (chargeInput) chargeInput.value = charge
    })
  })

  showToast("success", "Success", "Charges applied to all timeslots")
}

function selectAllTimeslots() {
  document.querySelectorAll(".timeslot-checkbox").forEach((checkbox) => {
    checkbox.checked = true
  })
  showToast("success", "Success", "All timeslots selected")
}

function applyStepCharges() {
  const base = Number.parseInt(document.getElementById("baseCharge").value)
  const step = Number.parseInt(document.getElementById("stepCharge").value)
  if (isNaN(base) || isNaN(step)) {
    showToast("warning", "Warning", "Please enter valid base and step values")
    return
  }

  pincodes.forEach((pincode, index) => {
    const stepValue = base + index * step
    timeslots.forEach((slot) => {
      const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`)
      if (chargeInput) chargeInput.value = stepValue
    })
  })

  showToast("success", "Success", "Step charges applied")
}

function disableTimeslotForAll() {
  const tsId = document.getElementById("disableTimeslot").value
  if (!tsId) {
    showToast("warning", "Warning", "Please select a timeslot")
    return
  }

  pincodes.forEach((pincode) => {
    const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${tsId}`)
    if (checkbox) checkbox.checked = false
  })

  showToast("success", "Success", "Timeslot disabled for all pincodes")
}

async function createProductMeta(is_update = false) {
  if (is_update && !product_id) return

  // Validate required fields
  const title = document.getElementById("productTitle").value
  const categoryId = document.getElementById("categorySelect").value
  const subCategoryId = document.getElementById("subCategorySelect").value

  if (!title || !categoryId || !subCategoryId) {
    showToast("error", "Error", "Please fill all required fields")
    return
  }

  // For new products, require at least one image
  if (!is_update && selectedProductImages.length === 0) {
    showToast("error", "Error", "Please upload at least one product image")
    return
  }

  // Create FormData for file upload
  const formData = new FormData()
  formData.append("title", title)
  formData.append("description", document.getElementById("productDesc").value)
  formData.append("features", document.getElementById("productFeatures").value);
  formData.append("special_note", document.getElementById("productSpecialNote").value);
  formData.append("ingredients", document.getElementById("productIngredients").value);
  formData.append("allergen_information", document.getElementById("productAllergens").value);
  formData.append("storage_instructions", document.getElementById("productStorage").value);
  formData.append("is_veg", document.getElementById("productIsVeg").checked ? "true" : "false");

  formData.append("category_id", categoryId)
  formData.append("sub_category_id", subCategoryId)

  // Add images to FormData
  selectedProductImages.forEach((file, index) => {
    formData.append(`images[${index}]`, file)
  })

  let apiUrl = add_product_url
  let method = "POST"

  if (is_update) {
    apiUrl = `${add_product_url}${product_id}/`
    method = "PUT"
  }

  const [productSuccess, productRes] = await callApi(method, apiUrl, formData, csrf_token, true)

  if (!productSuccess || !productRes.success) {
    showToast("error", "Error", productRes.error || "Failed to save product")
    return
  }

  if (!is_update) {
    product_id = productRes.data.product_id
  }

  // Clear selected images after successful upload
  selectedProductImages = []
  updatePhotoUploadUI()
}

function setupStockModeToggle() {
    const toggleModeRadio = document.getElementById('toggleMode');
    const quantityModeRadio = document.getElementById('quantityMode');
    const toggleContainer = document.getElementById('toggleContainer');
    const quantityContainer = document.getElementById('quantityContainer');

    function updateStockModeDisplay() {
        if (toggleModeRadio.checked) {
            toggleContainer.style.display = 'block';
            quantityContainer.style.display = 'none';
        } else {
            toggleContainer.style.display = 'none';
            quantityContainer.style.display = 'flex';
        }
    }

    // Set initial display
    updateStockModeDisplay();

    // Add event listeners
    toggleModeRadio.addEventListener('change', updateStockModeDisplay);
    quantityModeRadio.addEventListener('change', updateStockModeDisplay);
}

document.addEventListener("DOMContentLoaded", function () {
    setupStockModeToggle();
});

async function createVariationWithAvailability() {
  if (!product_id) return

  const selectedStockMode = document.querySelector('input[name="stockMode"]:checked').value;
  
  // Prepare stock data based on user input
  const stockData = {};

  if (selectedStockMode === "quantity") {
    const stockQuantity = document.getElementById("stockQuantity").value;
    if (!stockQuantity) {
      showToast("error", "Error", "Please enter stock quantity.");
      return;
    }
    stockData.stock_quantity = stockQuantity;
    stockData.stock_toggle_mode = false;
  } else {
    const stockToggle = document.getElementById("stockToggle").checked;
    stockData.in_stock_bull = stockToggle;
    stockData.stock_toggle_mode = true;
  }

  // 1. Send variation data
  const variationData = {
    product_id,
    actual_price: document.getElementById("actualPrice").value,
    discounted_price: document.getElementById("discountedPrice").value,
    is_vartied: true,
    weight_variation: combineQuantityUOM(
      document.getElementById("quantity").value,
      document.getElementById("uom").value,
    ),
    ...stockData // Include stock data if provided
  }

  // Validate required fields
  const quantity = document.getElementById("quantity").value
  const uom = document.getElementById("uom").value

  if (!quantity || !uom || !variationData.actual_price || !variationData.discounted_price) {
    showToast("error", "Error", "Please fill all variation fields including quantity and unit")
    return
  }

  const [varSuccess, varRes] = await callApi("POST", add_product_variation_url, variationData, csrf_token)
  if (!varSuccess || !varRes.success) {
    showToast("error", "Error", "Failed to add variation")
    return
  }

  const product_variation_id = varRes.data.product_variation_id

  // 2. Only handle availability data if pincode logic is enabled
  if (pincodeLogicEnabled) {
    const availability_data = []

    pincodes.forEach((pincode) => {
      const timeslot_data = {}
      timeslots.forEach((slot) => {
        const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slot.id}`)
        const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`)

        if (checkbox) {
          timeslot_data[slot.id] = {
            available: checkbox.checked,
            charge: chargeInput.value || "50",
          }
        }
      })

      if (Object.keys(timeslot_data).length > 0) {
        availability_data.push({
          product_id,
          product_variation_id,
          pincode_id: pincode.id,
          timeslot_data,
          delivery_charges: "50",
          is_available: true,
        })
      }
    })

    const availabilityPayload = {
      availability_data,
      product_id,
      product_variation_id,
    }

    const [availSuccess, availRes] = await callApi("POST", availability_charges_url, availabilityPayload, csrf_token)
    if (!availSuccess || !availRes.success) {
      showToast("error", "Error", "Failed to set availability")
      return
    }
  } else {
    showToast("info", "Info", "Variation created without pincode restrictions - available everywhere!")
  }

  showToast("success", "Success", "Variation and availability added successfully!")

  // Reset form fields
  document.getElementById("quantity").value = ""
  document.getElementById("uom").value = ""
  document.getElementById("actualPrice").value = ""
  document.getElementById("discountedPrice").value = ""
  document.getElementById("stockQuantity").value = "";
  document.getElementById("stockToggle").checked = true;

  // Reset radio buttons to default
  document.getElementById("toggleMode").checked = true;
  document.getElementById("quantityContainer").style.display = "none";
  document.getElementById("toggleContainer").style.display = "block";
}

async function updateVariationWithAvailability(product_variation_id) {
  if (!product_id) return

  const selectedStockMode = document.querySelector('input[name="stockMode"]:checked').value;

  // 1. Send variation data
  const variationData = {
    product_id,
    actual_price: document.getElementById("actualPrice").value,
    discounted_price: document.getElementById("discountedPrice").value,
    is_vartied: true,
    weight_variation: combineQuantityUOM(
      document.getElementById("quantity").value,
      document.getElementById("uom").value,
    ),
  }

  if (selectedStockMode === "quantity") {
    const stockQuantity = document.getElementById("stockQuantity").value;
    if (!stockQuantity) {
      showToast("error", "Error", "Please enter stock quantity.");
      return;
    }
    variationData.stock_quantity = stockQuantity;
    variationData.stock_toggle_mode = false;
  } else {
    const stockToggle = document.getElementById("stockToggle").checked;
    variationData.in_stock_bull = stockToggle;
    variationData.stock_toggle_mode = true;
  }

  // Validate required fields
  const quantity = document.getElementById("quantity").value
  const uom = document.getElementById("uom").value

  if (!quantity || !uom || !variationData.actual_price || !variationData.discounted_price) {
    showToast("error", "Error", "Please fill all variation fields including quantity and unit")
    return
  }

  const [varSuccess, varRes] = await callApi(
    "PUT",
    `${add_product_variation_url}${product_variation_id}/`,
    variationData,
    csrf_token,
  )
  if (!varSuccess || !varRes.success) {
    showToast("error", "Error", "Failed to update variation")
    return
  }

  // 2. Prepare and send availability data separately
  const availability_data = []

  pincodes.forEach((pincode) => {
    const timeslot_data = {}
    const availabilityInput = document.getElementById(`availability_${pincode.id}`)
    timeslots.forEach((slot) => {
      const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slot.id}`)
      const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`)

      if (checkbox) {
        timeslot_data[slot.id] = {
          available: checkbox.checked,
          charge: chargeInput.value || "50",
        }
      }
    })

    if (Object.keys(timeslot_data).length > 0) {
      availability_data.push({
        product_id,
        product_variation_id: product_variation_id,
        pincode_id: pincode.id,
        timeslot_data,
        delivery_charges: "50",
        is_available: true,
        id: availabilityInput.value,
      })
    }
  })

  const availabilityPayload = {
    availability_data,
    product_id,
    product_variation_id: product_variation_id,
  }

  const [availSuccess, availRes] = await callApi(
    "PUT",
    `${availability_charges_url}${product_variation_id}/`,
    availabilityPayload,
    csrf_token,
  )
  if (!availSuccess || !availRes.success) {
    showToast("error", "Error", "Failed to update availability")
    return
  }

  showToast("success", "Success", "Variation and availability updated successfully!")

  // Reset form and button state
  document.getElementById("quantity").value = ""
  document.getElementById("uom").value = ""
  document.getElementById("actualPrice").value = ""
  document.getElementById("discountedPrice").value = ""
  document.getElementById("submitVariationBtn").innerHTML = '<i class="fas fa-plus-circle me-1"></i> Add Variation'
  document.getElementById("productVariationId").value = ""
  document.getElementById("product_variation_heading").innerText = "Add Product Variation"
  document.getElementById("stockQuantity").value = "";
  document.getElementById("stockToggle").checked = true;

  // Reset radio buttons to default
  document.getElementById("toggleMode").checked = true;
  document.getElementById("quantityContainer").style.display = "none";
  document.getElementById("toggleContainer").style.display = "block";
}

async function loadExistingVariations() {
  if (!product_id) return

  const [success, result] = await callApi("GET", `${add_product_variation_url}?product_id=${product_id}`)
  if (!success || !result.success || !Array.isArray(result.data)) return

  const container = document.getElementById("existingVariationsContainer")
  container.innerHTML = ""

  if (result.data.length === 0) return

  const card = document.createElement("div")
  card.className = "card mb-4"

  card.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">Existing Variations</h5>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Weight</th>
                            <th>Actual Price</th>
                            <th>Discounted Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="variationTableBody">
                    </tbody>
                </table>
            </div>
        </div>
    `

  container.appendChild(card)

  const tableBody = document.getElementById("variationTableBody")

  result.data.forEach((variation) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td><span class="badge bg-light text-dark">${variation.weight_variation}</span></td>
            <td>₹${variation.actual_price}</td>
            <td>₹${variation.discounted_price}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick='copyAvailability(${JSON.stringify(variation)})'>
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick='copyAvailability(${JSON.stringify(variation)}, true)'>
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </td>
        `
    tableBody.appendChild(row)
  })
}

function copyAvailability(data, is_edit = false) {
  if (is_edit) {
    document.getElementById("actualPrice").value = data.actual_price
    document.getElementById("discountedPrice").value = data.discounted_price

    // Split weight variation into quantity and UOM
    const { quantity, uom } = splitWeightVariation(data.weight_variation)
    document.getElementById("quantity").value = quantity
    document.getElementById("uom").value = uom

    document.getElementById("submitVariationBtn").innerHTML = '<i class="fas fa-save me-1"></i> Update Variation'
    document.getElementById("productVariationId").value = data.product_variation_id
    document.getElementById("product_variation_heading").innerText = `Update Variation - ${data.weight_variation}`
  } else {
    document.getElementById("actualPrice").value = ""
    document.getElementById("discountedPrice").value = ""

    document.getElementById("quantity").value = ""
    document.getElementById("uom").value = ""

    document.getElementById("submitVariationBtn").innerHTML = '<i class="fas fa-plus-circle me-1"></i> Add Variation'
    document.getElementById("productVariationId").value = ""
    document.getElementById("product_variation_heading").innerText = `Add Product Variation`
  }

  copiedAvailability = data.availability_data
  pincodes.forEach((pincode) => {
    const pinData = copiedAvailability.find((d) => d.pincode_id === pincode.id)
    if (!pinData) return
    Object.entries(pinData.timeslot_data).forEach(([slotId, value]) => {
      const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slotId}`)
      const chargeInput = document.getElementById(`charge_${pincode.id}_${slotId}`)
      const availabilityInput = document.getElementById(`availability_${pincode.id}`)
      if (checkbox) checkbox.checked = value.available
      if (chargeInput) chargeInput.value = value.charge
      if (availabilityInput) availabilityInput.value = pinData.id
    })
  })

  // Scroll to variation section
  document.getElementById("variationSection").scrollIntoView({ behavior: "smooth" })
  showToast("info", "Info", is_edit ? "Variation loaded for editing" : "Availability settings copied")
}

// Theme functions from scripts.js
function toggleTheme() {
  const body = document.body
  const themeIcon = document.querySelector("#theme-toggle i")

  if (body.classList.contains("ovenfresh-theme")) {
    body.classList.remove("ovenfresh-theme")
    body.classList.add("dark-theme")
    themeIcon.classList.replace("fa-sun", "fa-moon")
    currentTheme = "dark-theme"
  } else {
    body.classList.remove("dark-theme")
    body.classList.add("ovenfresh-theme")
    themeIcon.classList.replace("fa-moon", "fa-sun")
    currentTheme = "ovenfresh-theme"
  }

  saveTheme()
  showToast("success", "Theme Changed", `Switched to ${currentTheme === "dark-theme" ? "dark" : "light"} theme`)
}

function saveTheme() {
  localStorage.setItem("shopAdminTheme", currentTheme)
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("shopAdminTheme")
  if (savedTheme && savedTheme !== "ovenfresh-theme") {
    toggleTheme()
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById("sidebar")
  sidebar.classList.toggle("show")
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("sidebar")
  sidebar.classList.remove("show")
}

// Toast notification function from scripts.js
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

  // Show toast with animation
  setTimeout(() => {
    toast.classList.add("show")
  }, 100)

  // Auto-hide toast after 5 seconds
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

// Loading functions from scripts.js
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

// Function to display existing images with delete buttons
function displayExistingImages(images) {
  existingProductImages = images || []

  const existingImagesContainer = document.getElementById("existingImagesContainer")
  const existingImagesGrid = document.getElementById("existingImagesGrid")

  if (existingProductImages.length === 0) {
    existingImagesContainer.style.display = "none"
    return
  }

  existingImagesGrid.innerHTML = ""

  existingProductImages.forEach((imageUrl, index) => {
    const col = document.createElement("div")
    col.className = "col-md-3 mb-3"

    const card = document.createElement("div")
    card.className = "card h-100"

    const img = document.createElement("img")
    img.src = imageUrl
    img.className = "card-img-top"
    img.style.height = "120px"
    img.style.objectFit = "cover"
    img.onerror = () => {
      img.src = "/placeholder.svg?height=120&width=120&text=Image+Not+Found"
    }

    const cardBody = document.createElement("div")
    cardBody.className = "card-body p-2 d-flex flex-column"

    const fileName = document.createElement("small")
    fileName.className = "text-muted mb-2 flex-grow-1"
    fileName.textContent = `Image ${index + 1}`

    const deleteBtn = document.createElement("button")
    deleteBtn.className = "btn btn-sm btn-danger"
    deleteBtn.innerHTML = '<i class="fas fa-trash me-1"></i> Delete'
    deleteBtn.onclick = () => deleteExistingImage(imageUrl, index)

    // Prevent deletion if it's the last image
    if (existingProductImages.length === 1) {
      deleteBtn.disabled = true
      deleteBtn.title = "Cannot delete the last image"
      deleteBtn.innerHTML = '<i class="fas fa-lock me-1"></i> Last Image'
    }

    cardBody.appendChild(fileName)
    cardBody.appendChild(deleteBtn)

    card.appendChild(img)
    card.appendChild(cardBody)
    col.appendChild(card)
    existingImagesGrid.appendChild(col)
  })

  existingImagesContainer.style.display = "block"
}

// Function to delete existing image
async function deleteExistingImage(imageUrl, index) {
  if (existingProductImages.length === 1) {
    showToast("warning", "Cannot Delete", "Products must have at least one image")
    return
  }

  if (!confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
    return
  }

  showLoading("Deleting image...")

  try {
    const [success, result] = await callApi(
      "DELETE",
      `${add_product_url}${product_id}/delete-image/`,
      { image_url: imageUrl },
      csrf_token,
    )

    if (success && result.success) {
      // Remove from local array
      existingProductImages.splice(index, 1)

      // Refresh display
      displayExistingImages(existingProductImages)

      showToast("success", "Success", "Image deleted successfully")
    } else {
      showToast("error", "Error", result.error || "Failed to delete image")
    }
  } catch (error) {
    console.error("Delete image error:", error)
    showToast("error", "Error", "Failed to delete image")
  } finally {
    hideLoading()
  }
}

// Function to update pincode status UI
function updatePincodeStatusUI(enabled) {
  pincodeLogicEnabled = enabled
  const statusBadge = document.getElementById("pincodeStatusBadge")
  const disabledMessage = document.getElementById("pincodeDisabledMessage")
  const availabilityTools = document.getElementById("availabilityTools")
  const pincodeAvailability = document.getElementById("pincodeAvailability")

  if (enabled) {
    statusBadge.textContent = "Pincode Logic: Enabled"
    statusBadge.className = "badge bg-success me-2"
    disabledMessage.style.display = "none"
    availabilityTools.style.display = "block"
    pincodeAvailability.style.display = "block"
  } else {
    statusBadge.textContent = "Pincode Logic: Disabled"
    statusBadge.className = "badge bg-warning me-2"
    disabledMessage.style.display = "block"
    availabilityTools.style.display = "none"
    pincodeAvailability.style.display = "none"
  }
}
