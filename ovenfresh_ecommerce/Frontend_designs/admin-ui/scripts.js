document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme
  const savedTheme = localStorage.getItem("theme") || "ovenfresh"
  document.body.className = savedTheme + "-theme"
  updateThemeToggleIcon(savedTheme)

  // Theme toggle functionality
  const themeToggle = document.getElementById("theme-toggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.body.classList.contains("ovenfresh-theme") ? "ovenfresh" : "light"
      const newTheme = currentTheme === "ovenfresh" ? "light" : "ovenfresh"

      document.body.className = newTheme + "-theme"
      localStorage.setItem("theme", newTheme)

      updateThemeToggleIcon(newTheme)
    })
  }

  // Initialize charts if they exist on the page
  initCharts()

  // Toggle sidebar on mobile
  const sidebarToggle = document.querySelector(".navbar-toggler")
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      document.querySelector("#sidebar").classList.toggle("show")
    })
  }

  // Select all checkbox functionality for products
  const selectAllProducts = document.getElementById("selectAllProducts")
  if (selectAllProducts) {
    selectAllProducts.addEventListener("change", () => {
      const checkboxes = document.querySelectorAll("#products-section tbody .form-check-input")
      checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAllProducts.checked
      })
    })
  }

  // Select all checkbox functionality for customers
  const selectAllCustomers = document.getElementById("selectAllCustomers")
  if (selectAllCustomers) {
    selectAllCustomers.addEventListener("change", () => {
      const checkboxes = document.querySelectorAll("#customers-section tbody .form-check-input")
      checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAllCustomers.checked
      })
    })
  }

  // Add variation button
  const addVariationBtn = document.getElementById("addVariationBtn")
  if (addVariationBtn) {
    addVariationBtn.addEventListener("click", () => {
      const variationsContainer = document.getElementById("variationsContainer")
      const variationCount = variationsContainer.querySelectorAll(".variation-item").length + 1

      const newVariation = document.createElement("div")
      newVariation.className = "variation-item border rounded p-3 mb-3"
      newVariation.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">Variation #${variationCount}</h6>
          <button type="button" class="btn btn-sm btn-outline-danger remove-variation">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Attribute</label>
            <select class="form-select variation-attribute">
              <option value="color">Color</option>
              <option value="size">Size</option>
              <option value="material">Material</option>
              <option value="style">Style</option>
            </select>
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Value</label>
            <input type="text" class="form-control variation-value" placeholder="e.g. Red, XL, Cotton">
          </div>
        </div>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label">Price Adjustment</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control variation-price" step="0.01" value="0.00">
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">Stock</label>
            <input type="number" class="form-control variation-stock" value="0">
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">SKU</label>
            <input type="text" class="form-control variation-sku" placeholder="Variation SKU">
          </div>
        </div>
      `

      variationsContainer.appendChild(newVariation)

      // Add event listener to the new remove button
      newVariation.querySelector(".remove-variation").addEventListener("click", function () {
        this.closest(".variation-item").remove()
      })
    })
  }

  // Remove variation button event delegation
  const variationsContainer = document.getElementById("variationsContainer")
  if (variationsContainer) {
    variationsContainer.addEventListener("click", (e) => {
      if (e.target.closest(".remove-variation")) {
        e.target.closest(".variation-item").remove()
      }
    })
  }

  // Add time slot button
  const addTimeSlotBtn = document.getElementById("addTimeSlotBtn")
  if (addTimeSlotBtn) {
    addTimeSlotBtn.addEventListener("click", () => {
      const timeSlotContainer = document.querySelector(".time-slots-container")

      const newTimeSlot = document.createElement("div")
      newTimeSlot.className = "time-slot-item d-flex align-items-center mb-2"
      newTimeSlot.innerHTML = `
        <input type="text" class="form-control time-picker me-2" placeholder="Start Time">
        <span class="mx-2">to</span>
        <input type="text" class="form-control time-picker me-2" placeholder="End Time">
        <button type="button" class="btn btn-sm btn-outline-danger remove-time-slot">
          <i class="fas fa-times"></i>
        </button>
      `

      timeSlotContainer.appendChild(newTimeSlot)
    })
  }

  // Remove time slot button event delegation
  const timeSlotContainer = document.querySelector(".time-slots-container")
  if (timeSlotContainer) {
    timeSlotContainer.addEventListener("click", (e) => {
      if (e.target.closest(".remove-time-slot")) {
        e.target.closest(".time-slot-item").remove()
      }
    })
  }

  // Form validation example
  const forms = document.querySelectorAll(".needs-validation")
  if (forms.length > 0) {
    Array.from(forms).forEach((form) => {
      form.addEventListener(
        "submit",
        (event) => {
          if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
          }
          form.classList.add("was-validated")
        },
        false,
      )
    })
  }

  // Smooth scrolling for sidebar navigation
  const sidebarLinks = document.querySelectorAll("#sidebar .nav-link")
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 20,
          behavior: "smooth",
        })

        // Update active link
        sidebarLinks.forEach((link) => link.classList.remove("active"))
        this.classList.add("active")

        // Close sidebar on mobile
        if (window.innerWidth < 768) {
          document.querySelector("#sidebar").classList.remove("show")
        }
      }
    })
  })

  // Highlight active section on scroll
  window.addEventListener("scroll", () => {
    const sections = document.querySelectorAll("section")
    let currentSection = ""

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100
      const sectionHeight = section.offsetHeight
      if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
        currentSection = section.getAttribute("id")
      }
    })

    if (currentSection) {
      sidebarLinks.forEach((link) => {
        link.classList.remove("active")
        if (link.getAttribute("href") === "#" + currentSection) {
          link.classList.add("active")
        }
      })
    }
  })
})

// Update theme toggle icon based on current theme
function updateThemeToggleIcon(theme) {
  const themeToggle = document.getElementById("theme-toggle")
  if (themeToggle) {
    themeToggle.innerHTML = theme === "ovenfresh" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'
    themeToggle.setAttribute("title", theme === "ovenfresh" ? "Switch to Light Mode" : "Switch to Ovenfresh Mode")
  }
}

// Initialize charts
function initCharts() {
  // Sales Chart
  const salesChartCanvas = document.getElementById("salesChart")
  if (salesChartCanvas) {
    const isOvenfreshTheme = document.body.classList.contains("ovenfresh-theme")
    const gridColor = isOvenfreshTheme ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
    const textColor = isOvenfreshTheme ? "#aaaaaa" : "#6c757d"

    const salesChart = new Chart(salesChartCanvas, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
          {
            label: "Sales",
            data: [12500, 15000, 17500, 14000, 21000, 19500, 22500, 24000, 21500, 23000, 25500, 28000],
            borderColor: "#7e57c2",
            backgroundColor: "rgba(126, 87, 194, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              color: gridColor,
            },
            ticks: {
              color: textColor,
            },
          },
          y: {
            grid: {
              color: gridColor,
            },
            ticks: {
              color: textColor,
              callback: (value) => "$" + value.toLocaleString(),
            },
          },
        },
      },
    })
  }

  // Category Chart
  const categoryChartCanvas = document.getElementById("categoryChart")
  if (categoryChartCanvas) {
    const isOvenfreshTheme = document.body.classList.contains("ovenfresh-theme")
    const textColor = isOvenfreshTheme ? "#aaaaaa" : "#6c757d"

    const categoryChart = new Chart(categoryChartCanvas, {
      type: "doughnut",
      data: {
        labels: ["Electronics", "Clothing", "Home & Kitchen", "Beauty", "Sports"],
        datasets: [
          {
            data: [35, 25, 20, 10, 10],
            backgroundColor: ["#7e57c2", "#4caf50", "#ff9800", "#f44336", "#2196f3"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: textColor,
              padding: 10,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
        },
        cutout: "70%",
      },
    })
  }
}
