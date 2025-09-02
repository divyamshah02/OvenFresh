let csrf_token = null
let products_url = null
let timeslots_url = null
let place_order_url = null
let apply_coupon_url = null

let allProducts = []
let selectedItems = []
let timeslotsData = []
let discountAmount = 0

async function AdminAddOrder(
  csrfTokenParam,
  productsUrlParam,
  timeslotsUrlParam,
  placeOrderUrlParam,
  couponUrlParam
) {
  csrf_token = csrfTokenParam
  products_url = productsUrlParam
  timeslots_url = timeslotsUrlParam
  place_order_url = placeOrderUrlParam
  apply_coupon_url = couponUrlParam
    console.log('jelololololo')
  
    flatpickr("#deliveryDate", { dateFormat: "Y-m-d" })
    flatpickr("#orderDate", { dateFormat: "Y-m-d" })
    await loadProducts()
    await loadTimeslots()
    initEventListeners()
  
}

async function loadProducts() {
    console.log('agbrhueaogbrehohabhur')
  const url = `${products_url}?format=json&page=1&limit=1600`
  const [success, result] = await callApi("GET", url)
  if (success && result.success) {
    allProducts = result.data.products || []
    console.log(result)
    populateCategorySelect()
  } else {
    showToast("error", "Error", "Error loading products")
  }
}

function populateCategorySelect() {
  const categories = [...new Set(allProducts.map(p => p.category_name))]
  const categorySelect = document.getElementById("categorySelect")
  categories.forEach(cat => {
    const opt = document.createElement("option")
    opt.value = cat
    opt.textContent = cat
    categorySelect.appendChild(opt)
  })
}

function filterSubcategories() {
  const cat = document.getElementById("categorySelect").value
  const subs = [...new Set(allProducts.filter(p => !cat || p.category_name === cat).map(p => p.sub_category_name))]
  const subSelect = document.getElementById("subcategorySelect")
  subSelect.innerHTML = "<option value=''>All Subcategories</option>"
  subs.forEach(sc => {
    const opt = document.createElement("option")
    opt.value = sc
    opt.textContent = sc
    subSelect.appendChild(opt)
  })
  filterProducts()
}

function filterProducts() {
  const cat = document.getElementById("categorySelect").value
  const sub = document.getElementById("subcategorySelect").value
  const productSelect = document.getElementById("productSelect")
  productSelect.innerHTML = "<option value=''>Select Product</option>"
  allProducts.filter(p => (!cat || p.category_name === cat) && (!sub || p.sub_category_name === sub))
    .forEach(p => {
      const opt = document.createElement("option")
      opt.value = p.product_id
      opt.textContent = p.title
      productSelect.appendChild(opt)
    })
}

function populateVariations() {
  const productId = document.getElementById("productSelect").value
  const variationSelect = document.getElementById("variationSelect")
  variationSelect.innerHTML = "<option value=''>Select Variation</option>"
  const product = allProducts.find(p => p.product_id === productId)
  if (product) {
    product.variations.forEach(v => {
      const opt = document.createElement("option")
      opt.value = v.product_variation_id
      opt.textContent = `${v.weight_variation} - ₹${v.discounted_price}`
      opt.dataset.price = v.discounted_price
      variationSelect.appendChild(opt)
    })
  }
}

function addProduct() {
  const productId = document.getElementById("productSelect").value
  const variationId = document.getElementById("variationSelect").value
  const qty = parseInt(document.getElementById("productQty").value || 1)
  if (!productId || !variationId || qty < 1) return showToast("warning", "Warning", "Select product, variation & qty")

  const product = allProducts.find(p => p.product_id === productId)
  const variation = product.variations.find(v => v.product_variation_id === variationId)
  const price = parseFloat(variation.discounted_price)

  selectedItems.push({
    product_id: productId,
    product_title: product.title,
    product_variation_id: variationId,
    variation_name: variation.weight_variation,
    quantity: qty,
    price: price
  })

  renderCart()
}

function renderCart() {
  const tbody = document.getElementById("orderItemsTableBody")
  tbody.innerHTML = ""
  let subtotal = 0

  selectedItems.forEach((item, idx) => {
    const row = document.createElement("tr")
    const total = item.price * item.quantity
    subtotal += total
    row.innerHTML = `
      <td>${item.product_title}</td>
      <td>${item.variation_name}</td>
      <td>${item.quantity}</td>
      <td>₹${item.price}</td>
      <td>₹${total}</td>
      <td><button class="btn btn-sm btn-danger" onclick="removeItem(${idx})"><i class="fas fa-trash"></i></button></td>
    `
    tbody.appendChild(row)
  })

  const tax = (subtotal - discountAmount) * 0.18
  const deliveryCharge = calculateDeliveryCharge()
  const grandTotal = subtotal + tax + deliveryCharge - discountAmount

  document.getElementById("subtotal").textContent = subtotal.toFixed(2)
  document.getElementById("taxAmount").textContent = tax.toFixed(2)
  document.getElementById("deliveryCharge").textContent = deliveryCharge.toFixed(2)
  document.getElementById("discountAmount").textContent = discountAmount.toFixed(2)
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2)
}

function removeItem(idx) {
  selectedItems.splice(idx, 1)
  renderCart()
}

async function loadTimeslots() {
  const [success, result] = await callApi("GET", timeslots_url)
  if (success && result.success) {
    timeslotsData = result.data || []
    const tsSelect = document.getElementById("timeslotSelect")
    timeslotsData.forEach(ts => {
      const opt = document.createElement("option")
      opt.value = ts.id
      opt.textContent = ts.time_slot_title
      tsSelect.appendChild(opt)
    })
  }
}

function calculateDeliveryCharge() {
  // simple placeholder – can extend using timeslot/pincode
  return 0
}

async function applyCoupon() {
  const code = document.getElementById("couponCode").value.trim()
  if (!code) return
  const [success, result] = await callApi("POST", apply_coupon_url, { coupon_code: code }, csrf_token)
  if (success && result.success) {
    discountAmount = result.data.discount || 0
    renderCart()
    showToast("success", "Success", "Coupon applied!")
  } else {
    showToast("error", "Error", result.error || "Invalid coupon")
  }
}

async function submitOrder(e) {
  e.preventDefault()
  if (selectedItems.length === 0) return showToast("warning", "Warning", "Add at least 1 product")

  const payload = {
    first_name: document.getElementById("firstName").value,
    last_name: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,
    city: document.getElementById("city").value,
    pincode: document.getElementById("pincode").value,
    delivery_date: document.getElementById("deliveryDate").value,
    order_date: document.getElementById("orderDate").value,
    timeslot_id: document.getElementById("timeslotSelect").value,
    payment_method: document.querySelector("input[name='paymentMethod']:checked").value,
    coupon_code: document.getElementById("couponCode").value || null,
    items: selectedItems
  }

  const [success, result] = await callApi("POST", place_order_url, payload, csrf_token)
  if (success && result.success) {
    showToast("success", "Success", "Order placed successfully")
    // window.location.href = `/admin-order-detail/?order_id=${result.data.order_id}`

    window.open(`/admin-order-detail/?order_id=${result.data.order_id}`, "_blank");

    // Reset the form
    document.getElementById("adminAddOrderForm").reset();

    // Also clear cart items table if you built one dynamically
    // document.querySelector("#order-items-table tbody").innerHTML = "";
    document.getElementById("orderItemsTableBody").innerHTML = ""

    // Reset totals (optional)
    document.getElementById("subtotal").textContent = "0";
    document.getElementById("taxAmount").textContent = "0";
    document.getElementById("deliveryCharge").textContent = "0";
    document.getElementById("discountAmount").textContent = "0";
    document.getElementById("grandTotal").textContent = "0";
  } else {
    showToast("error", "Error", result.error || "Error placing order")
  }
}

function initEventListeners() {
  document.getElementById("categorySelect").addEventListener("change", filterSubcategories)
  document.getElementById("subcategorySelect").addEventListener("change", filterProducts)
  document.getElementById("productSelect").addEventListener("change", populateVariations)
  document.getElementById("addProductBtn").addEventListener("click", addProduct)
  document.getElementById("applyCouponBtn").addEventListener("click", applyCoupon)
  document.getElementById("adminAddOrderForm").addEventListener("submit", submitOrder)
}
