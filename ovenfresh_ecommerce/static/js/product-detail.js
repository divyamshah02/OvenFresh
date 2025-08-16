let product_detail_url = null
let pincode_check_url = null
let cart_list_url = null
let checkout_url = null
let csrf_token = null
let reviews_api_url = "" // Add reviews API URL parameter
const timeslots_url = null // Declare timeslots_url variable

// Current product data
let currentProduct = null
let currentVariations = []
let selectedVariation = null
let availableTimeslots = []
let pincodeTimeslots = []
let todayPincodeTimeslots = []
let cartItems = []

async function InitializeProductDetail(
  csrfTokenParam,
  productDetailUrlParam,
  pincodeCheckUrlParam,
  cartListUrlParam,
  checkoutUrlParam,
  reviewsApiUrlParam, // Added reviews API URL parameter
) {
  csrf_token = csrfTokenParam
  product_detail_url = productDetailUrlParam
  pincode_check_url = pincodeCheckUrlParam
  cart_list_url = cartListUrlParam
  checkout_url = checkoutUrlParam
  reviews_api_url = reviewsApiUrlParam // Store reviews API URL

  // Get product ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const productId = urlParams.get("product_id") || urlParams.get("id")

  if (!productId) {
    showNotification("Product not found.", "error")
    return
  }

  try {
    await loadProductData(productId)
    initializeEventListeners()
    updateCartCountFromAPI()
    initializeDeliveryCountdown()
    initializeReviewForm() // Initialize review form functionality
  } catch (error) {
    console.error("Error initializing product detail:", error)
    showNotification("Error loading product details.", "error")
  }

  document.getElementById("toppers").addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    
    const selectedProductVariationId = selectedOption.value;
    const product_id = selectedOption.getAttribute("data-product_id");

    if (selectedProductVariationId) {
      ExtraAddToCart(product_id, selectedProductVariationId, 1)
    }
  })

  document.getElementById("greetind_cards").addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    
    const selectedProductVariationId = selectedOption.value;
    const product_id = selectedOption.getAttribute("data-product_id");

    if (selectedProductVariationId) {
      ExtraAddToCart(product_id, selectedProductVariationId, 1)
    }
  })
}

async function loadProductData(productId) {
  try {
    const [success, result] = await callApi("GET", `${product_detail_url}?product_id=${productId}`)
    if (success && result.success) {
      const data = result.data

      // Set current product data
      currentProduct = {
        id: data.id,
        product_id: data.product_id,
        title: data.title,
        description: data.description,
        photos: data.photos || [],
        is_active: data.is_active,
        is_veg: data.is_veg,
        features: data.features || "",
        special_note: data.special_note || "",
        ingredients: data.ingredients || "",
        allergen_information: data.allergen_information || "",
        storage_instructions: data.storage_instructions || "",
        category_name: data.category_name,
        sub_category_name: data.sub_category_name,
      }

      // Set variations
      currentVariations = data.product_variation || []

      // Render all components
      renderProductDetails(currentProduct)
      renderVariationOptions(currentVariations)
      renderRelatedProducts(data.related_products || [])
      renderProductReviews(data.reviews || [])
      updateBreadcrumb(currentProduct)

      // Select first variation if available
      if (currentVariations.length > 0) {
        selectVariation(currentVariations[0])
      }
    } else {
      throw new Error(result.error || "Failed to load product details")
    }
  } catch (error) {
    console.error("Error loading product data:", error)
    showNotification("Error loading product details.", "error")
  }
}

async function loadTimeslots() {
  try {
    const [success, result] = await callApi("GET", timeslots_url)
    if (success && result.success) {
      availableTimeslots = result.data.timeslots || result.data || []
    } else {
      console.error("Failed to load timeslots:", result)
    }
  } catch (error) {
    console.error("Error loading timeslots:", error)
  }
}

function renderProductDetails(product) {
  // Update product images
  if (product.photos && product.photos.length > 0) {
    const mainImage = document.getElementById("main-product-image")
    const thumbnailContainer = document.querySelector(".thumbnail-images .row")

    if (mainImage) {
      mainImage.src = product.photos[0]
      mainImage.alt = product.title
    }

    if (thumbnailContainer) {
      thumbnailContainer.innerHTML = product.photos
        .map(
          (photo, index) => `
                <div class="col-3">
                    <img src="${photo}" 
                         alt="View ${index + 1}" 
                         class="img-fluid rounded thumbnail-img ${index === 0 ? "active" : ""}" 
                         onclick="changeMainImage('${photo}')">
                </div>
            `,
        )
        .join("")
    }
  }

  // Update product info
  const productTitle = document.querySelector(".product-title")
  if (productTitle) productTitle.textContent = product.title

  const productDescription = document.querySelector(".product-description p")
  if (productDescription) productDescription.textContent = product.description

  // Update Veg/Non-Veg indicator
const vegIndicator = document.querySelector(".veg-indicator");
if (vegIndicator) {
  if (product.is_veg) {
    vegIndicator.className = "veg-indicator veg mb-2";
    vegIndicator.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="20" fill="white" stroke="green" stroke-width="2"/>
        <circle cx="10" cy="10" r="5" fill="green"/>
      </svg>
    `;
  } else {
    vegIndicator.className = "veg-indicator non-veg mb-2";
    vegIndicator.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="20" fill="white" stroke="brown" stroke-width="2"/>
        <circle cx="10" cy="10" r="5" fill="brown"/>
      </svg>
    `;
  }
}


  // Update stock status
  const stockBadge = document.querySelector(".badge.bg-success")
  if (stockBadge) {
    stockBadge.textContent = product.is_active ? "In Stock" : "Out of Stock"
    stockBadge.className = `badge ${product.is_active ? "bg-success" : "bg-danger"}`
  }

  // Update category in description tab
  const descriptionTab = document.getElementById("description")
  if (descriptionTab) {
    let featuresHtml = ""

    // Create features list if features exist
    if (product.features) {
      // Split features by newline and create list items
      const featuresList = product.features.split("\n").filter((f) => f.trim() !== "")

      if (featuresList.length > 0) {
        featuresHtml = `
          <p>This product features:</p>
          <ul>
            ${featuresList.map((feature) => `<li>${feature}</li>`).join("")}
          </ul>
        `
      }
    }

    descriptionTab.innerHTML = `
      <h5>Product Description</h5>
      <p>${product.description || ""}</p>
      <p>
        <br>
        <strong>Category:</strong> ${product.category_name} > ${product.sub_category_name}
      </p>
      ${featuresHtml}
      <p>${product.special_note || ""}</p>
    `
  }

  // Update ingredients tab
  const ingredientsTab = document.getElementById("ingredients")
  if (ingredientsTab) {
    let mainIngredientsHtml = "<li>No ingredients information available</li>"
    let allergenHtml = "<li>No allergen information available</li>"
    let storageHtml = "<li>No storage instructions available</li>"

    if (product.ingredients) {
      const ingredientsList = product.ingredients.split("\n").filter((i) => i.trim() !== "")
      if (ingredientsList.length > 0) {
        mainIngredientsHtml = ingredientsList.map((ingredient) => `<li>${ingredient}</li>`).join("")
      }
    }

    if (product.allergen_information) {
      const allergenList = product.allergen_information.split("\n").filter((a) => a.trim() !== "")
      if (allergenList.length > 0) {
        allergenHtml = allergenList.map((allergen) => `<li>${allergen}</li>`).join("")
      }
    }

    if (product.storage_instructions) {
      const storageList = product.storage_instructions.split("\n").filter((s) => s.trim() !== "")
      if (storageList.length > 0) {
        storageHtml = storageList.map((instruction) => `<li>${instruction}</li>`).join("")
      }
    }

    ingredientsTab.innerHTML = `
      <h5>Ingredients</h5>
      <div class="row">
        <div class="col-md-6">
          <h6>Main Ingredients:</h6>
          <ul>
            ${mainIngredientsHtml}
          </ul>
        </div>
        <div class="col-md-6">
          <h6>Allergen Information:</h6>
          <ul>
            ${allergenHtml}
          </ul>
          <h6>Storage:</h6>
          <ul>
            ${storageHtml}
          </ul>
        </div>
      </div>
    `
  }
}

function renderVariationOptions(variations) {
  const weightSelect = document.getElementById("weight")
  if (weightSelect && variations.length > 0) {
    weightSelect.innerHTML = variations
      .map((variation) => {
        const price = variation.discounted_price || variation.actual_price
        const stockStatus = variation.in_stock_bull ? "In Stock" : "Out of Stock"
        const stockClass = variation.in_stock_bull ? "text-success" : "text-danger"
        return `
                <option 
                  value="${variation.product_variation_id}" 
                  data-actual-price="${variation.actual_price}"
                  data-discounted-price="${variation.discounted_price || ""}"
                  data-weight="${variation.weight_variation}"
                  data-stock="${variation.in_stock_bull}"
                  ${!variation.in_stock_bull ? "disabled" : ""}
                >
                  ${variation.weight_variation} - ₹${price}
                  <span class="${stockClass}">(${stockStatus})</span>
                </option>
            `
      })
      .join("")

    // Add change event listener
    weightSelect.addEventListener("change", function () {
      const selectedOption = this.options[this.selectedIndex]
      const variationId = selectedOption.value
      const variation = variations.find((v) => v.product_variation_id == variationId)
      if (variation) {
        selectVariation(variation)
      }
    })

    // Update stock badge in product header
    const firstInStock = variations.find((v) => v.in_stock_bull)
    const stockBadge = document.querySelector(".badge.bg-success")
    if (stockBadge) {
      if (firstInStock) {
        stockBadge.textContent = "In Stock"
        stockBadge.className = "badge bg-success"
      } else {
        stockBadge.textContent = "Out of Stock"
        stockBadge.className = "badge bg-danger"
      }
    }
  }
}

function selectVariation(variation) {
  const stockStatus = document.getElementById("variationStockStatus")
  if (stockStatus) {
    stockStatus.textContent = variation.in_stock_bull ? "In Stock" : "Out of Stock"
    stockStatus.className = variation.in_stock_bull ? "badge bg-success" : "badge bg-danger"
  }

  // Enable/Disable Add to Cart and Buy Now buttons
  const addToCartBtn = document.getElementById("addToCartBtn")
  const buyNowBtn = document.getElementById("buyNowBtn")

  if (addToCartBtn) addToCartBtn.disabled = !variation.in_stock_bull
  if (buyNowBtn) buyNowBtn.disabled = !variation.in_stock_bull

  selectedVariation = variation
  updatePriceDisplay(variation)
}

function updatePriceDisplay(variation) {
  const currentPriceElement = document.querySelector(".current-price")
  const originalPriceElement = document.querySelector(".original-price")
  const discountBadge = document.querySelector(".discount-badge")

  const displayPrice = variation.discounted_price || variation.actual_price

  if (currentPriceElement) {
    currentPriceElement.textContent = `₹${displayPrice}`
  }

  // Show original price and discount if there's a discounted price
  if (
    originalPriceElement &&
    variation.discounted_price &&
    Number.parseFloat(variation.actual_price) > Number.parseFloat(variation.discounted_price)
  ) {
    originalPriceElement.textContent = `₹${variation.actual_price}`
    originalPriceElement.style.display = "inline"

    if (discountBadge) {
      const discount = Math.round(
        ((Number.parseFloat(variation.actual_price) - Number.parseFloat(variation.discounted_price)) /
          Number.parseFloat(variation.actual_price)) *
          100,
      )
      discountBadge.textContent = `${discount}% OFF`
      discountBadge.style.display = "inline"
    }
  } else {
    if (originalPriceElement) originalPriceElement.style.display = "none"
    if (discountBadge) discountBadge.style.display = "none"
  }
}

function renderRelatedProducts(products) {
  const relatedProductsContainer = document.querySelector(".row.g-4")
  if (relatedProductsContainer && products.length > 0) {
    relatedProductsContainer.innerHTML = products
      .slice(0, 4)
      .map((product) => {
        const price = product.actual_price || "0.00"
        return `
                <div class="col-md-6 col-lg-3">
                    <div class="product-card">
                        <div class="product-img">
                            <img src="${(product.photos && product.photos[0]) || "/placeholder.svg?height=200&width=200"}" 
                                 alt="${product.title}" class="img-fluid">
                            <div class="product-actions">
                                <a href="#" class="btn-product-action" onclick="addToWishlist(${product.product_id})">
                                    <i class="fas fa-heart"></i>
                                </a>
                                <a href="#" class="btn-product-action" onclick="quickAddToCart(${product.product_id}, ${product.product_variation_id || "null"})">
                                    <i class="fas fa-shopping-cart"></i>
                                </a>
                                <a href="/product-detail?product_id=${product.product_id}" class="btn-product-action">
                                    <i class="fas fa-eye"></i>
                                </a>
                            </div>
                        </div>
                        <div class="product-body">
                            <h5>${product.title}</h5>
                            <div class="product-rating mb-2">
                                ${generateStarRating(4)}
                                <span class="ms-2">(0)</span>
                            </div>
                            <div class="product-price">
                                <span class="price">₹${price}</span>
                                ${product.weight ? `<small class="text-muted d-block">${product.weight}</small>` : ""}
                            </div>
                        </div>
                    </div>
                </div>
            `
      })
      .join("")
  }
}

function renderProductReviews(reviews) {
  const reviewsList = document.querySelector(".reviews-list")
  const reviewsTab = document.getElementById("reviews-tab")

  // Filter only approved reviews
  const approvedReviews = reviews.filter((review) => review.is_approved_admin)

  // Update reviews count in tab
  if (reviewsTab) {
    reviewsTab.textContent = `Reviews (${approvedReviews.length})`
  }

  if (reviewsList) {
    if (approvedReviews.length > 0) {
      // Calculate average rating from approved reviews
      const avgRating =
        approvedReviews.reduce((sum, review) => sum + Number.parseFloat(review.ratings), 0) / approvedReviews.length
      updateProductRating(avgRating, approvedReviews.length)

      // Update reviews summary
      const ratingAverage = document.querySelector(".rating-average .h2")
      if (ratingAverage) {
        ratingAverage.textContent = avgRating.toFixed(1)
      }

      const reviewsCount = document.querySelector(".rating-average p")
      if (reviewsCount) {
        reviewsCount.textContent = `Based on ${approvedReviews.length} reviews`
      }

      // Render individual approved reviews
      reviewsList.innerHTML = approvedReviews
        .slice(0, 5) // Show more reviews
        .map(
          (review) => `
                <div class="review-item border-bottom pb-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1">${review.reviewer_name || "Customer"}</h6>
                            <div class="stars small">
                                ${generateStarRating(Number.parseFloat(review.ratings))}
                            </div>
                        </div>
                        <small class="text-muted">${formatDate(review.created_at)}</small>
                    </div>
                    <p class="mb-0">${review.review_text}</p>
                </div>
            `,
        )
        .join("")
    } else {
      reviewsList.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">No reviews yet. Be the first to review this product!</p>
                </div>
            `
    }
  }
}

function initializeEventListeners() {
  // Quantity change buttons
  const quantityInput = document.getElementById("quantity")
  if (quantityInput) {
    quantityInput.addEventListener("change", function () {
      const value = Number.parseInt(this.value)
      if (value < 1) this.value = 1
      if (value > 10) this.value = 10
    })
  }

  // Set minimum delivery date to tomorrow
  const deliveryDateInput = document.getElementById("delivery-date")
  if (deliveryDateInput) {
    const tomorrow = new Date()
    // tomorrow.setDate(tomorrow.getDate() + 1);
    deliveryDateInput.min = tomorrow.toISOString().split("T")[0]
    // deliveryDateInput.value = tomorrow.toISOString().split('T')[0];
  }
  deliveryDateInput.addEventListener("change", checkIfTodaySelected)

  // Update pincode check button text and function
  const pincodeCheckBtn = document.getElementById("check-pincode-btn")
  pincodeCheckBtn.setAttribute("onclick", "checkPincode()")
}

function changeMainImage(src) {
  const mainImage = document.getElementById("main-product-image")
  if (mainImage) {
    mainImage.src = src
  }

  // Update active thumbnail
  document.querySelectorAll(".thumbnail-img").forEach((img) => {
    img.classList.remove("active")
  })
  event.target.classList.add("active")
}

function changeQuantity(change) {
  const quantityInput = document.getElementById("quantity")
  if (quantityInput) {
    const currentQuantity = Number.parseInt(quantityInput.value)
    const newQuantity = currentQuantity + change

    if (newQuantity >= 1 && newQuantity <= 10) {
      quantityInput.value = newQuantity
    }
  }
}

async function checkPincode() {
  const pincodeInput = document.getElementById("pincode-check")
  const pincode = pincodeInput.value.trim()

  if (!pincode) {
    showNotification("Please enter a pincode.", "warning")
    return
  }

  if (!/^\d{6}$/.test(pincode)) {
    showNotification("Please enter a valid 6-digit pincode.", "error")
    return
  }

  try {
    const pincode_params = {
      pincode: pincode,
    }
    const url = `${pincode_check_url}?` + toQueryString(pincode_params)
    const [success, result] = await callApi("GET", url)

    if (success && result.success) {
      console.log(result.data)
      if (result.data.is_deliverable) {
        showNotification("Delivery available in your area!", "success")
        pincodeTimeslots = result.data.availability_data || []
        todayPincodeTimeslots = result.data.today_availability_data || []
        showDeliveryOptions()
      } else {
        showNotification("Sorry, delivery not available in your area.", "error")
        hideDeliveryOptions()
      }
    } else {
      showNotification(result.error || "Error checking pincode.", "error")
    }
  } catch (error) {
    console.error("Error checking pincode:", error)
    showNotification("Error checking pincode availability.", "error")
  }
}

function showDeliveryOptions() {
  const deliveryOptionsRow = document.getElementById("delivery_options")
  if (deliveryOptionsRow) {
    deliveryOptionsRow.style.display = "flex"

    // Update timeslots with pricing from pincode check
    const timeslotSelect = document.getElementById("timeslot")
    if (timeslotSelect && pincodeTimeslots.length > 0) {
      timeslotSelect.innerHTML = pincodeTimeslots
        .map((slot) => {
          // Find matching timeslot from general timeslots to get title
          // const timeslotInfo = availableTimeslots.find(ts => ts.id === slot.timeslot_id) || {};
          // const title = timeslotInfo.time_slot_title || `${slot.start_time} - ${slot.end_time}`;
          const title = `${slot.timeslot_name} (${slot.start_time} - ${slot.end_time})`
          const charge = Number.parseFloat(slot.delivery_charge || 0)

          return `
                    <option value="${slot.timeslot_id}" data-charge="${charge}">
                        ${title} ${charge > 0 ? `(₹${charge} delivery charge)` : "(Free delivery)"}
                    </option>
                `
        })
        .join("")
    }
  }
}

function showTodayDeliveryOptions() {
  const deliveryOptionsRow = document.getElementById("delivery_options")
  if (deliveryOptionsRow) {
    deliveryOptionsRow.style.display = "flex"

    // Update timeslots with pricing from pincode check
    const timeslotSelect = document.getElementById("timeslot")
    if (timeslotSelect && todayPincodeTimeslots.length > 0) {
      timeslotSelect.innerHTML = todayPincodeTimeslots
        .map((slot) => {
          // Find matching timeslot from general timeslots to get title

          const title = `${slot.timeslot_name} (${slot.start_time} - ${slot.end_time})`
          const charge = Number.parseFloat(slot.delivery_charge || 0)

          return `
                    <option value="${slot.timeslot_id}" data-charge="${charge}">
                        ${title} ${charge > 0 ? `(₹${charge} delivery charge)` : "(Free delivery)"}
                    </option>
                `
        })
        .join("")
    }
  }
}

function hideDeliveryOptions() {
  const deliveryOptionsRow = document.getElementById("delivery_options")
  if (deliveryOptionsRow) {
    deliveryOptionsRow.style.display = "none"
  }
}

function checkIfTodaySelected() {
  const input = document.getElementById("delivery-date")
  const selectedDate = input.value // in format "YYYY-MM-DD"

  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, "0")
  const dd = String(today.getDate()).padStart(2, "0")
  const todayStr = `${yyyy}-${mm}-${dd}`

  if (selectedDate === todayStr) {
    // If today's date is selected
    showTodayDeliveryOptions()
  } else {
    // If a different date is selected
    showDeliveryOptions()
  }
}

async function addToCart_old() {
  if (!selectedVariation) {
    showNotification("Please select a product variation.", "warning")
    return
  }

  // Check if pincode is checked and delivery options are shown
  const deliveryOptionsRow = document.querySelector(".row.m-0.p-0.g-3")
  if (!deliveryOptionsRow || deliveryOptionsRow.style.display === "none") {
    showNotification("Please check pincode availability first.", "warning")
    return
  }

  const quantity = Number.parseInt(document.getElementById("quantity").value) || 1
  const message = document.getElementById("message").value.trim()
  const deliveryDate = document.getElementById("delivery-date").value
  const timeslotSelect = document.getElementById("timeslot")
  const selectedTimeslot = timeslotSelect ? timeslotSelect.value : null

  if (!selectedTimeslot) {
    showNotification("Please select a delivery timeslot.", "warning")
    return
  }

  const additionalData = {}
  if (message) additionalData.message = message
  if (deliveryDate) additionalData.delivery_date = deliveryDate
  if (selectedTimeslot) additionalData.timeslot_id = selectedTimeslot

  const success = await AddToCart(selectedVariation.product_variation_id, quantity, additionalData)
  if (success) {
    // Optionally redirect to cart or show success message
    // window.location.href = 'cart.html';
  }
}

async function AddToCart(variationId, quantity, additionalData) {
  const product_id = selectedVariation.product_id
  const product_variation_id = variationId || selectedVariation.product_variation_id
  const qty = quantity || Number.parseInt(document.getElementById("quantity").value) || 1

  if (!product_variation_id || qty < 1) {
    showNotification("Invalid product or quantity.", "error")
    return false
  }

  try {
    const bodyData = {
      product_id: product_id,
      product_variation_id: product_variation_id,
      qty: qty,
      ...additionalData,
    }

    const [success, result] = await callApi("POST", cart_list_url, bodyData, csrf_token)
    if (success && result.success) {
      showNotification("Item added to cart!", "success")
      // Refresh cart if we're on cart page
      if (document.getElementById("cart-items")) {
        await GenerateCart(csrf_token, cart_list_url, pincode_check_url)
      } else {
        // Just update cart count if we're on other pages
        updateCartCountFromAPI()
      }
      return true
    } else {
      showNotification(result.error || "Failed to add item to cart.", "error")
      console.error(result)
      return false
    }
  } catch (error) {
    console.error("Error adding to cart:", error)
    showNotification("Error adding item to cart.", "error")
    return false
  }
}

async function ExtraAddToCart(productId, variationId, quantity) {
  const product_id = productId
  const product_variation_id = variationId
  console.log(product_id)
  console.log(product_variation_id)
  const qty = quantity || Number.parseInt(document.getElementById("quantity").value) || 1

  if (!product_variation_id || qty < 1) {
    showNotification("Invalid product or quantity.", "error")
    return false
  }

  try {
    const bodyData = {
      product_id: product_id,
      product_variation_id: product_variation_id,
      qty: qty
    }

    const [success, result] = await callApi("POST", cart_list_url, bodyData, csrf_token)
    if (success && result.success) {
      showNotification("Item added to cart!", "success")
      // Refresh cart if we're on cart page
      if (document.getElementById("cart-items")) {
        await GenerateCart(csrf_token, cart_list_url, pincode_check_url)
      } else {
        // Just update cart count if we're on other pages
        updateCartCountFromAPI()
      }
      return true
    } else {
      showNotification(result.error || "Failed to add item to cart.", "error")
      console.error(result)
      return false
    }
  } catch (error) {
    console.error("Error adding to cart:", error)
    showNotification("Error adding item to cart.", "error")
    return false
  }
}

async function buyNow() {
  const deliveryDate = document.getElementById("delivery-date").value
  const deliveryTime = document.getElementById("timeslot").value
  const pincode = document.getElementById("pincode-check").value

  await AddToCart()

  // if (!deliveryDate) {
  //     showNotification("Please select a delivery date.", "warning");
  //     return;
  // }

  // if (!deliveryTime) {
  //     showNotification("Please select a delivery time slot.", "warning");
  //     return;
  // }

  // Prepare checkout data
  const checkoutData = {
    delivery_date: deliveryDate,
    delivery_time: deliveryTime,
    pincode: pincode,
  }

  const checkoutUrl = `${checkout_url}?` + toQueryString(checkoutData)

  window.location.href = checkoutUrl

  // const success = await addToCart()
  // if (success) {
  //     window.location.href = "cart.html"
  // }
}

async function quickAddToCart(productId, variationId = null) {
  if (variationId) {
    await AddToCart(variationId, 1)
  } else {
    showNotification("Product variation not available.", "error")
  }
}

function addToWishlist(productId) {
  // Implement wishlist functionality
  showNotification("Added to wishlist!", "success")
}

document.addEventListener('DOMContentLoaded', function() {
    // Get product ID from DOM (example using data attribute)
    const productContainer = document.querySelector('[data-product-id]');
    if (!productContainer) return;

    const productId = productContainer.dataset.productId;
    fetchRatingSummary(productId);
});

function fetchRatingSummary(productId) {
    fetch(`/product-api/reviews/?product_id=${productId}&summary=true`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateProductRating(
                    data.data.average_rating,
                    data.data.total_reviews
                );
            }
        })
        .catch(error => console.error('Error fetching ratings:', error));
}

// Utility functions
function updateProductRating(rating, reviewCount) {
  const ratingElements = document.querySelectorAll(".product-rating .stars")
  ratingElements.forEach((element) => {
    element.innerHTML = generateStarRating(rating)
  })

  const ratingText = document.querySelector(".rating-text")
  if (ratingText) {
    ratingText.textContent = `(${rating.toFixed(1)} out of 5)`
  }

  const reviewCountElements = document.querySelectorAll(".review-count")
  reviewCountElements.forEach((element) => {
    element.textContent = `${reviewCount} reviews`
  })
}

function generateStarRating(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  let starsHtml = ""

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>'
  }

  // Half star
  if (hasHalfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>'
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>'
  }

  return starsHtml
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return "1 day ago"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}

function updateBreadcrumb(product) {
  const breadcrumbItems = document.querySelectorAll(".breadcrumb-item")
  if (breadcrumbItems.length >= 3) {
    // Create dynamic link with category name or ID
    breadcrumbItems[2].innerHTML = `<a href="/shop/?category=${encodeURIComponent(product.category_name)}">${product.category_name}</a>`
  }

  const lastItem = breadcrumbItems[breadcrumbItems.length - 1]
  if (lastItem) {
    lastItem.textContent = product.title
  }
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `alert alert-${type === "error" ? "danger" : type} alert-dismissible fade show position-fixed`
  notification.style.cssText = "top: 20px; right: 20px; z-index: 9999; min-width: 300px;"
  notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `

  document.body.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, 5000)
}

async function updateCartCountFromAPI() {
  try {
    const [success, result] = await callApi("GET", cart_list_url)
    if (success && result.success) {
      cartItems = result.data.cart_items || []
      updateCartCount()
    }
  } catch (error) {
    console.error("Error updating cart count:", error)
  }
}

function updateCartCount() {
  console.log(cartItems)
  const cartCount = cartItems.reduce((total, item) => total + Number.parseInt(item.quantity), 0)
  const cartCountElement = document.getElementById("cart-count")
  if (cartCountElement) {
    cartCountElement.textContent = cartCount
  }
}

// Countdown Timer Functions
function updateCountdown(elementId, hours, minutes, seconds) {
  const countdownElement = document.getElementById(elementId)

  // Update the countdown every second
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
          countdownElement.parentElement.innerHTML = `
                        <span class="badge bg-danger text-white fs-6 px-3 py-2">
                            <i class="fas fa-exclamation-circle me-1"></i>
                            Delivery cutoff time passed
                        </span>
                    `
          return
        }
      }
    }

    // Format the time
    const formattedHours = hours.toString().padStart(2, "0")
    const formattedMinutes = minutes.toString().padStart(2, "0")
    const formattedSeconds = seconds.toString().padStart(2, "0")

    countdownElement.textContent = `${formattedHours}h :${formattedMinutes}m :${formattedSeconds}s`
  }, 1000)
}

function initializeDeliveryCountdown() {
  const now = new Date()
  const targetTime = new Date()

  // Set target time to 22:45 (10:45 PM) today
  targetTime.setHours(22, 45, 0, 0)

  // If current time is past 22:45, set target to 22:45 tomorrow
  if (now > targetTime) {
    targetTime.setDate(targetTime.getDate() + 1)
  }

  // Calculate time difference
  const timeDiff = targetTime - now

  if (timeDiff <= 0) {
    // Time has passed, show message
    document.getElementById("deliveryCountdown").innerHTML = `
            <i class="fas fa-exclamation-circle me-1"></i>
            Delivery cutoff time passed
        `
    document.getElementById("deliveryCountdown").className = "badge bg-danger text-danger fs-6 px-3 py-2"
    return
  }

  // Convert milliseconds to hours, minutes, seconds
  const hours = Math.floor(timeDiff / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

  // Start the countdown
  updateCountdown("deliveryCountdown", hours, minutes, seconds)
}

function initializeReviewForm() {
  const reviewForm = document.getElementById("reviewForm")
  if (reviewForm) {
    reviewForm.addEventListener("submit", handleReviewSubmission)
  }
}

async function handleReviewSubmission(event) {
  event.preventDefault()

  const form = event.target

  // Get form values
  const reviewerName = document.getElementById("reviewerName").value.trim()
  const reviewerEmail = document.getElementById("reviewerEmail").value.trim()
  const reviewText = document.getElementById("reviewText").value.trim()
  const rating = document.querySelector('input[name="rating"]:checked')?.value

  // Validation
  if (!reviewerName || !reviewerEmail || !reviewText || !rating) {
    showNotification("Please fill in all required fields.", "error")
    return
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(reviewerEmail)) {
    showNotification("Please enter a valid email address.", "error")
    return
  }

  // Get current product ID
  const urlParams = new URLSearchParams(window.location.search)
  const productId = urlParams.get("product_id") || urlParams.get("id")

  if (!productId) {
    showNotification("Product not found.", "error")
    return
  }

  try {
    // Prepare review data
    const reviewData = {
      product_id: productId,
      reviewer_name: reviewerName,
      reviewer_email: reviewerEmail,
      review_text: reviewText,
      ratings: Number.parseFloat(rating),
    }

    // Submit review
    const [success, result] = await callApi("POST", reviews_api_url, reviewData, csrf_token)

    if (success && result.success) {
      showNotification("Review submitted successfully! It will be published after admin approval.", "success")

      // Reset form
      form.reset()

      // Clear star rating
      const ratingInputs = document.querySelectorAll('input[name="rating"]')
      ratingInputs.forEach((input) => (input.checked = false))
    } else {
      throw new Error(result.error || "Failed to submit review")
    }
  } catch (error) {
    console.error("Error submitting review:", error)
    showNotification("Error submitting review. Please try again.", "error")
  }
}
