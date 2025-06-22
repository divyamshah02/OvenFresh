let csrf_token = null
let login_url = null

async function InitializeDeliveryLogin(csrfTokenParam, loginUrlParam) {
  csrf_token = csrfTokenParam
  login_url = loginUrlParam

  // Initialize event listeners
  initializeEventListeners()

  // Check if already logged in
  await checkLoginStatus()
}

function initializeEventListeners() {
  // Login form submission
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    await handleLogin()
  })

  // Enter key support
  document.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("loginForm").dispatchEvent(new Event("submit"))
    }
  })
}

async function checkLoginStatus() {
  try {
    const [success, result] = await callApi("GET", "/delivery-api/dashboard/")

    if (success && result.success) {
      // Already logged in, redirect to dashboard
      window.location.href = "/delivery/dashboard/"
    }
  } catch (error) {
    // Not logged in, stay on login page
    console.log("Not logged in")
  }
}

async function handleLogin() {
  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value.trim()

  // Validate inputs
  if (!email || !password) {
    showError("Please enter both email and password")
    return
  }

  // Show loading state
  setLoadingState(true)
  hideError()

  try {
    const [success, result] = await callApi(
      "POST",
      login_url,
      {
        email: email,
        password: password,
      },
      csrf_token,
    )

    if (success && result.success) {
      showSuccess("Login successful! Redirecting...")

      // Redirect to dashboard after short delay
      setTimeout(() => {
        window.location.href = "/delivery/dashboard/"
      }, 1000)
    } else {
      throw new Error(result.error || "Login failed")
    }
  } catch (error) {
    console.error("Login error:", error)
    showError(error.message || "Login failed. Please try again.")
  } finally {
    setLoadingState(false)
  }
}

function setLoadingState(loading) {
  const loginText = document.getElementById("loginText")
  const loginSpinner = document.getElementById("loginSpinner")
  const submitButton = document.querySelector('button[type="submit"]')

  if (loading) {
    loginText.textContent = "Logging in..."
    loginSpinner.classList.remove("d-none")
    submitButton.disabled = true
  } else {
    loginText.textContent = "Login"
    loginSpinner.classList.add("d-none")
    submitButton.disabled = false
  }
}

function showError(message) {
  const errorDiv = document.getElementById("errorMessage")
  const errorText = document.getElementById("errorText")

  errorText.textContent = message
  errorDiv.classList.remove("d-none")

  // Auto hide after 5 seconds
  setTimeout(() => {
    hideError()
  }, 5000)
}

function hideError() {
  const errorDiv = document.getElementById("errorMessage")
  errorDiv.classList.add("d-none")
}

function showSuccess(message) {
  // Create success alert
  const successDiv = document.createElement("div")
  successDiv.className = "alert alert-success"
  successDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${message}
    `

  // Insert before form
  const form = document.getElementById("loginForm")
  form.parentNode.insertBefore(successDiv, form)

  // Auto remove after 3 seconds
  setTimeout(() => {
    successDiv.remove()
  }, 3000)
}
