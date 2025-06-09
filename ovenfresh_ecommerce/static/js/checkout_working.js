let csrf_token = null
let check_user_loggedin_url = null
let check_pincode_url = null
let send_otp_url = null
let verify_otp_url = null
let place_order_url = null
let cart_list_url = null
let add_user_data_url = null
let add_address_url = null
let transfer_cart_url = null

// User data
let userData = null
let userAddresses = []
let isLoggedIn = false
let userDataAdded = false

// Delivery data
let pincodeTimeslots = []
let todayPincodeTimeslots = []
let selectedAddress = null
let selectedTimeslot = null

// OTP verification
let mobileVerified = false
let otpRequestId = null

let cartItems = [];

async function InitializeCheckout(
  csrfTokenParam,
  cartListUrlParam,
  transferCartUrlParam,
  checkUserLoggedinUrlParam,
  checkPincodeUrlParam,
  sendOtpUrlParam,
  verifyOtpUrlParam,
  placeOrderUrlParam,
  addUserUrlParam,
  addAddressUrlParam,
) {
  csrf_token = csrfTokenParam
  cart_list_url = cartListUrlParam
  check_user_loggedin_url = checkUserLoggedinUrlParam
  check_pincode_url = checkPincodeUrlParam
  send_otp_url = sendOtpUrlParam
  verify_otp_url = verifyOtpUrlParam
  place_order_url = placeOrderUrlParam
  add_user_data_url = addUserUrlParam
  add_address_url = addAddressUrlParam
  transfer_cart_url = transferCartUrlParam

  try {
    showLoading()

    // Check if user is logged in
    await checkUserLoggedIn()

    // Check URL parameters for pincode, delivery date, and timeslot
    checkUrlParameters()

    // Initialize event listeners
    initializeEventListeners()

    // Load cart summary
    await loadCartSummary()

    hideLoading()
  } catch (error) {
    console.error("Error initializing checkout:", error)
    showNotification("Error loading checkout data.", "error")
    hideLoading()
  }
}

async function checkUserLoggedIn() {
  try {
    const [success, result] = await callApi("GET", check_user_loggedin_url)

    if (success && result.success) {
      isLoggedIn = !result.user_not_logged_in

      if (isLoggedIn) {
        // User is logged in, populate form with user data
        userData = result.data.user || {}
        if (userData.first_name || userData.last_name || userData.email || userData.phone) {
          userDataAdded = true
        }

        userAddresses = result.data.addresses || []
        if (userAddresses.length == 0) [
          userDataAdded = false,
        ]

        populateUserData()
        renderAddresses()
      } else {
        // User is not logged in, show regular form
        showGuestCheckoutForm()
      }
    } else {
      throw new Error(result.error || "Failed to check login status")
    }
  } catch (error) {
    console.error("Error checking login status:", error)
    showGuestCheckoutForm()
  }
}

async function transferCart() {
  showLoading();
  try {
    const [success, result] = await callApi("POST", transfer_cart_url, {}, csrf_token);
    console.log(result);
    if (success && result.success) {
      return true;
      
    } else {
      throw new Error(result.error || "Failed to transfer cart")
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    showNotification("Error to transfer cart. Please try again.", "error")
  } finally {
    hideLoading()
  }

}

function populateUserData() {
  if (!userData) return

  // Populate user information fields
  if (userData.first_name) document.getElementById("firstName").value = userData.first_name
  if (userData.last_name) document.getElementById("lastName").value = userData.last_name
  if (userData.email) document.getElementById("email").value = userData.email
  if (userData.phone) {
    const phoneInput = document.getElementById("phone")
    phoneInput.value = userData.phone
    phoneInput.disabled = true // Lock phone field for logged in users
    mobileVerified = true // Phone is already verified for logged in users
  }
}

function renderAddresses() {
  if (!userAddresses || userAddresses.length === 0) return

  // Create address selection section
  const shippingSection = document.getElementById("shipping-section")
  const addressesContainer = document.createElement("div")
  addressesContainer.className = "mb-4"
  addressesContainer.innerHTML = `
        <h6 class="mb-3">Select a saved address or enter a new one</h6>
        <div class="row g-3" id="saved-addresses">
            ${userAddresses
              .map(
                (address, index) => `
                <div class="col-md-6">
                    <div class="card h-100 ${index === 0 ? "border-primary" : ""}" data-address-id="${address.id}">
                        <div class="card-body">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="savedAddress" 
                                       id="address${address.id}" value="${address.id}" ${index === 0 ? "checked" : ""}>
                                <label class="form-check-label" for="address${address.id}">
                                    <strong>${address.address_name || "Address " + (index + 1)}</strong>
                                </label>
                            </div>
                            <p class="mb-1 mt-2">${address.address_line}</p>
                            ${address.address_line2 ? `<p class="mb-1">${address.address_line2}</p>` : ""}
                            <p class="mb-1">${address.city}, ${address.pincode}</p>
                        </div>
                    </div>
                </div>
            `,
              )
              .join("")}
            <div class="col-md-6">
                <div class="card h-100 border-dashed" id="new-address-card">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="savedAddress" 
                                   id="newAddress" value="new">
                            <label class="form-check-label" for="newAddress">
                                <i class="fas fa-plus-circle me-2"></i>Add New Address
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `

  // Insert before the form fields
  const formFields = shippingSection.querySelector(".row.g-3")
  shippingSection.querySelector(".card-body").insertBefore(addressesContainer, formFields)

  // Add event listeners for address selection
  document.querySelectorAll('input[name="savedAddress"]').forEach((radio) => {
    radio.addEventListener("change", handleAddressSelection)
  })

  // Select first address by default
  if (userAddresses.length > 0) {
    selectedAddress = userAddresses[0]
    populateAddressFields(selectedAddress)
  }
}

function handleAddressSelection(event) {
  const addressId = event.target.value

  // Update card borders
  document.querySelectorAll("#saved-addresses .card").forEach((card) => {
    card.classList.remove("border-primary")
  })

  if (addressId === "new") {
    // Clear form fields for new address
    document.getElementById("new-address-card").classList.add("border-primary")
    clearAddressFields()
    enableAddressFields()
    selectedAddress = "new"
  } else {
    // Find the selected address and populate form
    event.target.closest(".card").classList.add("border-primary")
    const address = userAddresses.find((addr) => addr.id == addressId)
    if (address) {
      selectedAddress = address
      populateAddressFields(address)
      disableAddressFields()

      // Check pincode availability
      if (address.pincode) {
        document.getElementById("pincode").value = address.pincode
        checkPincode(address.pincode)
      }
    }
  }
}

function populateAddressFields(address) {
  if (!address) return

  document.getElementById("address").value = address.address_line || ""
  document.getElementById("addressName").value = address.address_name || ""
  document.getElementById("city").value = address.city || ""
  document.getElementById("pincode").value = address.pincode || ""
}

function clearAddressFields() {
  document.getElementById("address").value = ""
  document.getElementById("city").value = ""
  document.getElementById("pincode").value = ""
  selectedAddress = null
}

function disableAddressFields() {
  document.getElementById("address").disabled = true
  document.getElementById("city").disabled = true
  document.getElementById("pincode").disabled = true
}

function enableAddressFields() {
  document.getElementById("address").disabled = false
  document.getElementById("city").disabled = false
  document.getElementById("pincode").disabled = false
}

function showGuestCheckoutForm() {
  // Show regular checkout form for guest users
  const phoneInput = document.getElementById("phone")

  // Add verify button next to phone field
  const phoneParent = phoneInput.parentElement
  phoneParent.classList.add("position-relative")

  const verifyButton = document.createElement("button")
  verifyButton.type = "button"
  verifyButton.className = "btn btn-sm of-btn-outline-primary position-absolute end-0 top-0 mt-4 me-2"
  verifyButton.textContent = "Verify"
  verifyButton.onclick = showSendOtpModal
  phoneParent.appendChild(verifyButton)
}

function showSendOtpModal() {
  const phone = document.getElementById("phone").value.trim()

  if (!phone || !/^\d{10}$/.test(phone)) {
    showNotification("Please enter a valid 10-digit phone number.", "error")
    return
  }

  // Create modal for confirming OTP send
  const modalHtml = `
        <div class="modal fade" id="sendOtpModal" tabindex="-1" aria-labelledby="sendOtpModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="sendOtpModalLabel">Verify Phone Number</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>We will send a verification code to <strong>${phone}</strong>. Do you want to proceed?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn of-btn-outline-primary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn of-btn-primary" onclick="sendOtp()">Send OTP</button>
                    </div>
                </div>
            </div>
        </div>
    `

  // Append modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml)

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("sendOtpModal"))
  modal.show()

  // Remove modal from DOM when hidden
  document.getElementById("sendOtpModal").addEventListener("hidden.bs.modal", function () {
    this.remove()
  })
}

async function sendOtp() {
  const phone = document.getElementById("phone").value.trim()

  try {
    showLoading()

    const [success, result] = await callApi(
      "POST",
      send_otp_url,
      {
        mobile: phone,
      },
      csrf_token,
    )

    if (success && result.success) {
      otpRequestId = result.data.otp_id
      showNotification("OTP sent successfully!", "success")

      // Close send OTP modal
      bootstrap.Modal.getInstance(document.getElementById("sendOtpModal")).hide()

      // Show verify OTP modal
      showVerifyOtpModal(phone)
    } else {
      throw new Error(result.error || "Failed to send OTP")
    }
  } catch (error) {
    console.error("Error sending OTP:", error)
    showNotification("Error sending OTP. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

function showVerifyOtpModal(phone) {
  // Create modal for verifying OTP
  const modalHtml = `
        <div class="modal fade" id="verifyOtpModal" tabindex="-1" aria-labelledby="verifyOtpModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="verifyOtpModalLabel">Enter Verification Code</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Enter the verification code sent to <strong>${phone}</strong></p>
                        <div class="mb-3">
                            <label for="otpCode" class="form-label">OTP Code</label>
                            <input type="text" class="form-control" id="otpCode" placeholder="Enter 6-digit code">
                            <div id="otpError" class="text-danger mt-2" style="display: none;"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn of-btn-outline-primary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn of-btn-primary" onclick="verifyOtp()">Verify</button>
                    </div>
                </div>
            </div>
        </div>
    `

  // Append modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml)

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("verifyOtpModal"))
  modal.show()

  // Remove modal from DOM when hidden
  document.getElementById("verifyOtpModal").addEventListener("hidden.bs.modal", function () {
    this.remove()
  })
}

async function verifyOtp() {
  const otp = document.getElementById("otpCode").value.trim()
  const phone = document.getElementById("phone").value.trim()

  if (!otp || !/^\d{6}$/.test(otp)) {
    document.getElementById("otpError").textContent = "Please enter a valid 6-digit OTP code."
    document.getElementById("otpError").style.display = "block"
    return
  }

  try {
    showLoading()

    const [success, result] = await callApi(
      "PUT",
      `${verify_otp_url}${otpRequestId}/`,
      {
        phone: phone,
        otp: otp,
        otp_id: otpRequestId,
      },
      csrf_token,
    )
    console.log(result);
    if (success && result.success) {
      if (result.data.otp_verified) {
        mobileVerified = true
        showNotification("Phone number verified successfully!", "success")

        // Close verify OTP modal
        bootstrap.Modal.getInstance(document.getElementById("verifyOtpModal")).hide()

        // Update UI to show verified status
        updatePhoneVerifiedUI()

        userDataAdded =  result.data.user_details;
        csrf_token = getCSRFToken();
        await transferCart();

        window.location.reload();
        // await checkUserLoggedIn();
        // await loadCartSummary();
      } else {
        document.getElementById("otpError").textContent = result.data.message || "Invalid OTP. Please try again."
        document.getElementById("otpError").style.display = "block"
      }
    } else {
      throw new Error(result.error || "Failed to verify OTP")
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    document.getElementById("otpError").textContent = "Error verifying OTP. Please try again."
    document.getElementById("otpError").style.display = "block"
  } finally {
    hideLoading()
  }
}

function updatePhoneVerifiedUI() {
  const phoneInput = document.getElementById("phone")
  phoneInput.disabled = true // Lock phone field after verification

  // Remove verify button
  const verifyButton = phoneInput.parentElement.querySelector("button")
  if (verifyButton) verifyButton.remove()

  // Add verified badge
  const verifiedBadge = document.createElement("span")
  verifiedBadge.className = "badge bg-success position-absolute end-0 top-0 mt-4 me-2"
  verifiedBadge.innerHTML = '<i class="fas fa-check me-1"></i> Verified'
  phoneInput.parentElement.appendChild(verifiedBadge)
}

function checkUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search)
  const pincode = urlParams.get("pincode")
  const deliveryDate = urlParams.get("delivery_date")
  const timeslotId = urlParams.get("timeslot_id")

  // Set pincode and check availability
  if (pincode) {
    document.getElementById("pincode").value = pincode
    checkPincode(pincode)
  }

  // Set delivery date
  if (deliveryDate) {
    document.getElementById("deliveryDate").value = deliveryDate
  }

  // Store timeslot ID to select after loading timeslots
  if (timeslotId) {
    selectedTimeslot = timeslotId
  }
}

async function checkPincode(pincodeValue = null) {
  const pincode = pincodeValue || document.getElementById("pincode").value.trim()

  if (!pincode) {
    showNotification("Please enter a pincode.", "warning")
    return
  }

  if (!/^\d{6}$/.test(pincode)) {
    showNotification("Please enter a valid 6-digit pincode.", "error")
    return
  }

  try {
    showLoading()

    const pincode_params = {
      pincode: pincode,
    }
    const url = `${check_pincode_url}?` + toQueryString(pincode_params)
    const [success, result] = await callApi("GET", url)

    if (success && result.success) {
      if (result.data.is_deliverable) {
        showNotification("Delivery available in your area!", "success")
        pincodeTimeslots = result.data.availability_data || []
        todayPincodeTimeslots = result.data.today_availability_data || []
        updateTimeslots()
      } else {
        showNotification("Sorry, delivery not available in your area.", "error")
        clearTimeslots()
      }
    } else {
      throw new Error(result.error || "Error checking pincode.")
    }
  } catch (error) {
    console.error("Error checking pincode:", error)
    showNotification("Error checking pincode availability.", "error")
  } finally {
    hideLoading()
  }
}

function updateTimeslots() {
  const deliveryDateInput = document.getElementById("deliveryDate")
  const timeslotSelect = document.getElementById("deliveryTime")

  if (!timeslotSelect) return

  // Check if selected date is today
  const isToday = isSelectedDateToday()
  const timeslots = isToday ? todayPincodeTimeslots : pincodeTimeslots

  if (timeslots.length === 0) {
    timeslotSelect.innerHTML = '<option value="">No delivery slots available</option>'
    return
  }

  timeslotSelect.innerHTML =
    `<option value="">Select Time Slot</option>` +
    timeslots
      .map((slot) => {
        const title = `${slot.timeslot_name} (${slot.start_time} - ${slot.end_time})`
        const charge = Number.parseFloat(slot.delivery_charge || 0)

        return `
                <option value="${slot.timeslot_id}" data-charge="${charge}" ${selectedTimeslot == slot.timeslot_id ? "selected" : ""}>
                    ${title} ${charge > 0 ? `(₹${charge} delivery charge)` : "(Free delivery)"}
                </option>
            `
      })
      .join("")
}

function updateShippingCharge() {
    const selectElement = document.getElementById("deliveryTime");
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const charge = selectedOption.getAttribute("data-charge");
    return charge ? parseFloat(charge) : 0;
}

function clearTimeslots() {
  const timeslotSelect = document.getElementById("deliveryTime")
  if (timeslotSelect) {
    timeslotSelect.innerHTML = '<option value="">Select Time Slot</option>'
  }
}

function isSelectedDateToday() {
  const deliveryDateInput = document.getElementById("deliveryDate")
  if (!deliveryDateInput || !deliveryDateInput.value) return false

  const selectedDate = new Date(deliveryDateInput.value)
  const today = new Date()

  return selectedDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)
}

async function loadCartSummary() {
  try {

      const [success, result] = await callApi("GET", cart_list_url);
      if (success && result.success) {
          cartItems = result.data.cart_items || [];
          console.log("Cart items loaded:", cartItems);
          renderCheckoutItems();
          calculateTotals();
      } else {
          console.error("Failed to fetch cart items:", result);
          showEmptyCart();
      }

    // This would typically be an API call to get cart data
    // For now, we'll just populate with sample data
    // const cartItems = [
    //   { name: "Birthday Cake", price: 799, quantity: 1, image: "/static/img/products/cake1.jpg" },
    //   { name: "Chocolate Truffle", price: 599, quantity: 2, image: "/static/img/products/cake2.jpg" },
    // ]

  } catch (error) {
    console.error("Error loading cart summary:", error)
    showNotification("Error loading cart summary.", "error")
  }
}

function renderCheckoutItems() {
  const checkoutItemsContainer = document.getElementById("checkout-items")

  if (!checkoutItemsContainer || !cartItems || cartItems.length === 0) return

  checkoutItemsContainer.innerHTML = cartItems
    .map(
      (item) => `
        <div class="d-flex align-items-center mb-3">
            <img src="${item.product_image}" alt="${item.product_name}" class="img-fluid rounded me-3" style="width: 60px; height: 60px; object-fit: cover;">
            <div class="flex-grow-1">
                <h6 class="mb-1">${item.product_name}</h6>
                <small class="text-muted">Qty: ${item.quantity}</small>
            </div>
            <div class="text-end">
                <strong>₹${(item.price * item.quantity).toFixed(2)}</strong>
            </div>
        </div>
    `,
    )
    .join("")
}

function calculateTotals() {
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)  
  const tax = subtotal * 0.18 // 18% tax
  const shipping = updateShippingCharge() // Get shipping charge from selected timeslot
  const total = subtotal + shipping + tax

  updateOrderSummary(subtotal, shipping, tax, total);

}

function updateOrderSummary(subtotal, shipping=null, tax, total) {
  const subtotalElement = document.getElementById("checkout-subtotal")
  const shippingElement = document.getElementById("checkout-shipping")
  const taxElement = document.getElementById("checkout-tax")
  const totalElement = document.getElementById("checkout-total")

  if (subtotalElement) subtotalElement.textContent = `₹${subtotal.toFixed(2)}`
  // if (shippingElement) shippingElement.textContent = shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`
  if (shipping === null) {
    if (shippingElement) shippingElement.textContent = 'To be calculated after selecting delivery time slot';
  } else if (shipping === 0) {
    if (shippingElement) shippingElement.textContent = "Free";
  } else {
    if (shippingElement) shippingElement.textContent = `₹${shipping.toFixed(2)}`
  }

  if (taxElement) taxElement.textContent = `₹${tax.toFixed(2)}`
  if (totalElement) totalElement.textContent = `₹${total.toFixed(2)}`
}

function initializeEventListeners() {
  // Set minimum delivery date to today
  const deliveryDateInput = document.getElementById("deliveryDate")
  if (deliveryDateInput) {
    const today = new Date()
    deliveryDateInput.min = today.toISOString().split("T")[0]
    deliveryDateInput.value = today.toISOString().split("T")[0]

    // Add event listener for date change
    deliveryDateInput.addEventListener("change", () => {
      updateTimeslots()
    })
  }

  // Add event listener for pincode check
  const pincodeInput = document.getElementById("pincode")
  if (pincodeInput) {
    pincodeInput.addEventListener("blur", () => {
      checkPincode()
    })
  }

  // Add event listener for form submission
  const checkoutForm = document.getElementById("checkout-form")
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault()
      placeOrder()
    })
  }

  // Add event listeners for step navigation
  const nextButtons = document.querySelectorAll('button[onclick="nextStep()"]')
  nextButtons.forEach((button) => {
    button.onclick = nextStep
  })

  const prevButtons = document.querySelectorAll('button[onclick="prevStep()"]')
  prevButtons.forEach((button) => {
    button.onclick = prevStep
  })

  document.getElementById("deliveryTime").addEventListener("change", calculateTotals);
}

async function updateUserData() {
  showLoading()
  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "alternate_phone",
    "address",
    "addressName",
    "city",
    "pincode",
  ]

  let bodyData = {}
  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId)
    bodyData[fieldId] = field.value.trim()    
  })

  try {
    const [success, result] = await callApi("POST", add_user_data_url, bodyData, csrf_token);
    console.log(result);
    if (success && result.success) {
      showNotification("Update user data.")
    } else {
      throw new Error(result.error || "Failed to add data")
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    showNotification("Error updating user data. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

async function addNewAddress() {
  showLoading();

  const address = document.getElementById("address").value.trim()
  const city = document.getElementById("city").value.trim()
  const pincode = document.getElementById("pincode").value.trim()
  const addressName = document.getElementById("addressName").value.trim() || "New Address"

  const bodyData = {
    address: address,
    city: city,
    pincode: pincode,
    addressName: addressName,
  }

  try {
    const [success, result] = await callApi("POST", add_address_url, bodyData, csrf_token);
    console.log(result);
    if (success && result.success) {
      showNotification("Address Added.")
      userAddresses = result.data.addresses || userAddresses
      renderAddresses();
      
    } else {
      throw new Error(result.error || "Failed to add address")
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    showNotification("Error updating user data. Please try again.", "error")
  } finally {
    hideLoading()
  }

}

function getCSRFToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    return null;
}

let currentStep = 1

async function nextStep() {
  if (currentStep === 1) {
    // Validate shipping form
    if (!validateShippingForm()) {
      return
    }

    if (!userDataAdded){
      await updateUserData();
    }

    if (selectedAddress === "new") {
    await addNewAddress();
    }

    currentStep = 2
    showStep(2)
  } else if (currentStep === 2) {
    // Validate payment form
    if (!validatePaymentForm()) {
      return
    }

    currentStep = 3
    showStep(3)
    generateOrderReview()
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--
    showStep(currentStep)
  }
}

function showStep(step) {
  // Hide all sections
  document.getElementById("shipping-section").style.display = "none"
  document.getElementById("payment-section").style.display = "none"
  document.getElementById("review-section").style.display = "none"

  // Show current section
  if (step === 1) {
    document.getElementById("shipping-section").style.display = "block"
  } else if (step === 2) {
    document.getElementById("payment-section").style.display = "block"
  } else if (step === 3) {
    document.getElementById("review-section").style.display = "block"
  }

  // Update progress indicators
  document.querySelectorAll(".step").forEach((stepEl, index) => {
    if (index + 1 <= step) {
      stepEl.classList.add("active")
    } else {
      stepEl.classList.remove("active")
    }
  })
}

function validateShippingForm() {
  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "alternate_phone",
    "address",
    "addressName",
    "city",
    "pincode",
    "deliveryDate",
    "deliveryTime",
  ]

  let isValid = true

  // Check required fields
  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId)
    if (!field || !field.value.trim()) {
      field.classList.add("is-invalid")
      isValid = false
    } else {
      field.classList.remove("is-invalid")
    }
  })

  // Check if phone is verified for guest users
  if (!isLoggedIn && !mobileVerified) {
    document.getElementById("phone").classList.add("is-invalid")
    showNotification("Please verify your phone number.", "error")
    isValid = false
  }

  if (!isValid) {
    showNotification("Please fill in all required fields.", "error")
  }

  return isValid
}

function validatePaymentForm() {
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')

  if (!paymentMethod) {
    showNotification("Please select a payment method.", "error")
    return false
  }

  // For now, we'll just validate the payment method selection
  // In a real implementation, you would validate card details, UPI ID, etc.

  return true
}

function generateOrderReview() {
  const firstName = document.getElementById("firstName").value
  const lastName = document.getElementById("lastName").value
  const email = document.getElementById("email").value
  const phone = document.getElementById("phone").value
  const address = document.getElementById("address").value
  const city = document.getElementById("city").value
  const pincode = document.getElementById("pincode").value
  const deliveryDate = document.getElementById("deliveryDate").value
  const deliveryTime = document.getElementById("deliveryTime")
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value

  const timeSlotText = deliveryTime.options[deliveryTime.selectedIndex].text

  const reviewContent = `
        <div class="row g-4">
            <div class="col-md-6">
                <h6>Shipping Address</h6>
                <p class="mb-1">${firstName} ${lastName}</p>
                <p class="mb-1">${address}</p>
                <p class="mb-1">${city}, ${pincode}</p>
                <p class="mb-1">Phone: ${phone}</p>
                <p class="mb-0">Email: ${email}</p>
            </div>
            <div class="col-md-6">
                <h6>Delivery Details</h6>
                <p class="mb-1">Date: ${formatDate(deliveryDate)}</p>
                <p class="mb-1">Time: ${timeSlotText}</p>
                <p class="mb-0">Payment: ${getPaymentMethodText(paymentMethod)}</p>
            </div>
        </div>
    `

  document.getElementById("order-review-content").innerHTML = reviewContent
}

async function placeOrder() {
  if (!document.getElementById("termsAccept").checked) {
    showNotification("Please accept the terms and conditions.", "error")
    return
  }

  try {
    showLoading()

    // Gather order data
    const orderData = {
      first_name: document.getElementById("firstName").value,
      last_name: document.getElementById("lastName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      city: document.getElementById("city").value,
      pincode: document.getElementById("pincode").value,
      delivery_date: document.getElementById("deliveryDate").value,
      timeslot_id: document.getElementById("deliveryTime").value,
      payment_method: document.querySelector('input[name="paymentMethod"]:checked').value,
      special_instructions: document.getElementById("specialInstructions").value,
    }

    const [success, result] = await callApi("POST", place_order_url, orderData, csrf_token)

    if (success && result.success) {
      // If Razorpay payment link is returned
      if (result.data.razorpay_link) {
        // Open Razorpay payment
        openRazorpayPayment(result.data.razorpay_link)
      } else {
        // For COD or other payment methods
        showOrderConfirmation(result.data.order_id)
      }
    } else {
      throw new Error(result.error || "Failed to place order")
    }
  } catch (error) {
    console.error("Error placing order:", error)
    showNotification("Error placing order. Please try again.", "error")
  } finally {
    hideLoading()
  }
}

function openRazorpayPayment(razorpayLink) {
  // In a real implementation, you would initialize Razorpay here
  // For now, we'll just redirect to the payment link
  window.location.href = razorpayLink
}

function showOrderConfirmation(orderId) {
  // Show order confirmation message
  const confirmationHtml = `
        <div class="text-center py-5">
            <i class="fas fa-check-circle fa-4x of-text-primary mb-4"></i>
            <h2>Order Placed Successfully!</h2>
            <p class="lead">Your order #${orderId} has been placed successfully.</p>
            <p>You will receive a confirmation email shortly.</p>
            <div class="mt-4">
                <a href="index.html" class="btn of-btn-outline-primary me-2">Continue Shopping</a>
                <a href="orders.html" class="btn of-btn-primary">View Orders</a>
            </div>
        </div>
    `

  // Replace form with confirmation
  const checkoutForm = document.getElementById("checkout-form")
  checkoutForm.innerHTML = confirmationHtml

  // Hide order summary
  const orderSummary = document.querySelector(".col-lg-4")
  if (orderSummary) orderSummary.style.display = "none"
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString)
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return date.toLocaleDateString("en-US", options)
}

function getPaymentMethodText(value) {
  const methods = {
    credit: "Credit Card",
    debit: "Debit Card",
    upi: "UPI",
    cod: "Cash on Delivery",
  }
  return methods[value] || value
}

function toQueryString(params) {
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&")
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


// Mock callApi function (replace with your actual API call logic)
// async function callApi(method, url, data = null, csrf_token = null) {
//   // Simulate API call delay
//   await new Promise((resolve) => setTimeout(resolve, 500))

//   // Simulate success or failure based on URL or data
//   const success = true
//   let result = {}
//     console.log(url);
//   if (url.includes("check_user_loggedin")) {
//     result = {
//       success: true,
//       user_not_logged_in: false,
//       data: {
//         user: {
//           first_name: "John",
//           last_name: "Doe",
//           email: "john.doe@example.com",
//           phone: "1234567890",
//         },
//         addresses: [
//           {
//             id: 1,
//             address_type: "Home",
//             address_line1: "123 Main St",
//             address_line2: "Apt 4B",
//             city: "Mumbai",
//             pincode: "400015",
//           },
//         ],
//       },
//     }
//   } else if (url.includes("check_pincode")) {
//     if (data && data.pincode === "123456") {
//       result = {
//         success: true,
//         data: {
//           is_deliverable: true,
//           availability_data: [
//             {
//               timeslot_id: 1,
//               timeslot_name: "Morning",
//               start_time: "9:00 AM",
//               end_time: "12:00 PM",
//               delivery_charge: 0,
//             },
//             {
//               timeslot_id: 2,
//               timeslot_name: "Afternoon",
//               start_time: "1:00 PM",
//               end_time: "4:00 PM",
//               delivery_charge: 50,
//             },
//           ],
//           today_availability_data: [
//             {
//               timeslot_id: 3,
//               timeslot_name: "Evening",
//               start_time: "6:00 PM",
//               end_time: "9:00 PM",
//               delivery_charge: 0,
//             },
//           ],
//         },
//       }
//     } else {
//       result = {
//         success: true,
//         data: {
//           is_deliverable: false,
//         },
//       }
//     }
//   } else if (url.includes("send_otp")) {
//     result = {
//       success: true,
//       data: {
//         request_id: "12345",
//       },
//     }
//   } else if (url.includes("verify_otp")) {
//     result = {
//       success: true,
//       data: {
//         otp_verified: true,
//       },
//     }
//   } else if (url.includes("place_order")) {
//     result = {
//       success: true,
//       data: {
//         order_id: "ORDER123",
//       },
//     }
//   } else {
//     result = {
//       success: false,
//       error: "Mock API Error",
//     }
//   }

//   return [success, result]
// }
