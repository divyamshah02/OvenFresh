let admin_login_url = null
let admin_dashboard_url = null
let csrf_token = null

async function AdminLogin(csrfTokenParam, adminLoginUrlParam, adminDashboardUrlParam) {
  csrf_token = csrfTokenParam
  admin_login_url = adminLoginUrlParam
  admin_dashboard_url = adminDashboardUrlParam

  try {
    // Check if already logged in
    await checkExistingSession()

    initializeEventListeners()
    toggle_loader() // Ensure toggle_loader is declared
  } catch (error) {
    console.error("Error initializing admin login:", error)
    toggle_loader() // Ensure toggle_loader is declared
  }
}

async function checkExistingSession() {
  try {
    // Check if user is already logged in as admin
    const [success, result] = await callApi("GET", admin_login_url) // Ensure callApi is declared

    if (success && result.success && result.data.is_admin_logged_in) {
      // Redirect to dashboard if already logged in
      window.location.href = admin_dashboard_url
      return
    }
  } catch (error) {
    console.error("Error checking session:", error)
    // Continue with login form if session check fails
  }
}

function initializeEventListeners() {
  const loginForm = document.getElementById("adminLoginForm")
  const togglePassword = document.getElementById("togglePassword")
  const emailInput = document.getElementById("email")
  const passwordInput = document.getElementById("password")

  // Form submission
  loginForm.addEventListener("submit", handleLogin)

  // Password toggle
  togglePassword.addEventListener("click", function () {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
    passwordInput.setAttribute("type", type)

    const icon = this.querySelector("i")
    icon.classList.toggle("fa-eye")
    icon.classList.toggle("fa-eye-slash")
  })

  // Real-time validation
  emailInput.addEventListener("blur", validateEmail)
  passwordInput.addEventListener("blur", validatePassword)

  // Clear validation on input
  emailInput.addEventListener("input", () => clearFieldError("email"))
  passwordInput.addEventListener("input", () => clearFieldError("password"))

  // Handle forgot password
  document.getElementById("forgotPasswordLink").addEventListener("click", (e) => {
    e.preventDefault()
    handleForgotPassword()
  })

  // Handle Enter key
  document.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      loginForm.dispatchEvent(new Event("submit"))
    }
  })
}

async function handleLogin(event) {
  event.preventDefault()

  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value
  const rememberMe = document.getElementById("rememberMe").checked

  // Clear previous errors
  clearAllErrors()

  // Validate inputs
  if (!validateEmail() || !validatePassword()) {
    return
  }

  // Show loading state
  setLoadingState(true)

  try {
    const loginData = {
      email: email,
      password: password,
      remember_me: rememberMe,
    }

    const [success, result] = await callApi("POST", admin_login_url, loginData, csrf_token) // Ensure callApi is declared

    if (success && result.success) {
      showAlert("Login successful! Redirecting to dashboard...", "success")

      // Small delay for user feedback
      setTimeout(() => {
        window.location.href = admin_dashboard_url
      }, 1000)
    } else {
      handleLoginError(result)
    }
  } catch (error) {
    console.error("Login error:", error)
    showAlert("Network error. Please check your connection and try again.", "danger")
  } finally {
    setLoadingState(false)
  }
}

function handleLoginError(result) {
    console.log(result)
  if (result.user_does_not_exist) {
    setFieldError("email", "No admin account found with this email address.")
    showAlert("Invalid email address. Please check and try again.", "danger")
  } else if (result.wrong_password) {
    setFieldError("password", "Incorrect password. Please try again.")
    showAlert("Invalid password. Please check and try again.", "danger")
  } else if (result.account_inactive) {
    showAlert("Your admin account has been deactivated. Please contact support.", "warning")
  } else if (result.not_admin) {
    showAlert("Access denied. Admin privileges required.", "danger")
  } else {
    showAlert(result.error || "Login failed. Please try again.", "danger")
  }
}

function validateEmail() {
  const email = document.getElementById("email").value.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email) {
    setFieldError("email", "Email address is required.")
    return false
  }

  if (!emailRegex.test(email)) {
    setFieldError("email", "Please enter a valid email address.")
    return false
  }

  clearFieldError("email")
  return true
}

function validatePassword() {
  const password = document.getElementById("password").value

  if (!password) {
    setFieldError("password", "Password is required.")
    return false
  }

  if (password.length < 6) {
    setFieldError("password", "Password must be at least 6 characters long.")
    return false
  }

  clearFieldError("password")
  return true
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId)
  const errorElement = document.getElementById(fieldId + "-error")

  field.classList.add("is-invalid")
  if (errorElement) {
    errorElement.textContent = message
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId)
  const errorElement = document.getElementById(fieldId + "-error")

  field.classList.remove("is-invalid")
  if (errorElement) {
    errorElement.textContent = ""
  }
}

function clearAllErrors() {
  clearFieldError("email")
  clearFieldError("password")
  document.getElementById("alertContainer").innerHTML = ""
}

function setLoadingState(loading) {
  const loginBtn = document.getElementById("loginBtn")
  const btnText = loginBtn.querySelector(".btn-text")
  const btnLoading = loginBtn.querySelector(".btn-loading")

  if (loading) {
    loginBtn.disabled = true
    btnText.classList.add("d-none")
    btnLoading.classList.remove("d-none")
  } else {
    loginBtn.disabled = false
    btnText.classList.remove("d-none")
    btnLoading.classList.add("d-none")
  }
}

function showAlert(message, type) {
  const alertContainer = document.getElementById("alertContainer")
  const alertId = "alert-" + Date.now()

  const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `

  alertContainer.innerHTML = alertHtml

  // Auto-dismiss success alerts
  if (type === "success") {
    setTimeout(() => {
      const alert = document.getElementById(alertId)
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert) // Ensure bootstrap is declared
        bsAlert.close()
      }
    }, 3000)
  }
}

function getAlertIcon(type) {
  const icons = {
    success: "check-circle",
    danger: "exclamation-triangle",
    warning: "exclamation-circle",
    info: "info-circle",
  }
  return icons[type] || "info-circle"
}

function handleForgotPassword() {
  const email = document.getElementById("email").value.trim()

  if (!email) {
    showAlert("Please enter your email address first.", "warning")
    document.getElementById("email").focus()
    return
  }

  if (!validateEmail()) {
    return
  }

  // Show modal or redirect to forgot password page
  showAlert("Password reset functionality will be implemented soon. Please contact support for assistance.", "info")
}

// Utility function to get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]")
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
  const results = regex.exec(location.search)
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
}

// Handle redirect parameter
window.addEventListener("load", () => {
  const redirectUrl = getUrlParameter("redirect")
  if (redirectUrl) {
    admin_dashboard_url = decodeURIComponent(redirectUrl)
  }
})

// Handle browser back button
window.addEventListener("popstate", (event) => {
  // Prevent going back to login if already logged in
  checkExistingSession()
})
