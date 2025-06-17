// import { Chart } from "@/components/ui/chart"
let csrf_token = null
let dashboard_stats_url = null
let dashboard_charts_url = null
let recent_orders_url = null
let top_products_url = null

// Chart instances
let salesChart = null
let orderStatusChart = null
let deliveryAreasChart = null

// Current date range
let currentDateRange = "today"

async function AdminDashboard(
  csrfTokenParam,
  dashboardStatsUrlParam,
  dashboardChartsUrlParam,
  recentOrdersUrlParam,
  topProductsUrlParam,
) {
  csrf_token = csrfTokenParam
  dashboard_stats_url = dashboardStatsUrlParam
  dashboard_charts_url = dashboardChartsUrlParam
  recent_orders_url = recentOrdersUrlParam
  top_products_url = topProductsUrlParam

  try {
    showLoading()
    await initializeDashboard()
    initializeEventListeners()
    hideLoading()
  } catch (error) {
    console.error("Error initializing dashboard:", error)
    showToast("Error loading dashboard data.", "error")
    hideLoading()
  }
}

async function initializeDashboard() {
  await Promise.all([loadDashboardStats(), loadDashboardCharts(), loadRecentOrders(), loadTopProducts()])
}

async function loadDashboardStats() {
  try {
    const [success, result] = await callApi("GET", `${dashboard_stats_url}?range=${currentDateRange}`)

    if (success && result.success) {
      populateDashboardStats(result.data)
    } else {
      throw new Error(result.error || "Failed to load dashboard stats")
    }
  } catch (error) {
    console.error("Error loading dashboard stats:", error)
    showToast("Error loading dashboard statistics.", "error")
  }
}

function populateDashboardStats(data) {
  // Main stats
  document.getElementById("totalOrders").textContent = formatNumber(data.total_orders)
  document.getElementById("totalRevenue").textContent = `₹${formatNumber(data.total_revenue)}`
  document.getElementById("activeCustomers").textContent = formatNumber(data.active_customers)
  document.getElementById("totalProducts").textContent = formatNumber(data.total_products)

  // Changes
  document.getElementById("ordersChange").textContent = `${data.orders_change >= 0 ? "+" : ""}${data.orders_change}%`
  document.getElementById("revenueChange").textContent = `${data.revenue_change >= 0 ? "+" : ""}${data.revenue_change}%`
  document.getElementById("customersChange").textContent =
    `${data.customers_change >= 0 ? "+" : ""}${data.customers_change}%`
  document.getElementById("productsChange").textContent = `+${data.active_products}`

  // Secondary stats
  document.getElementById("pendingOrders").textContent = formatNumber(data.pending_orders)
  document.getElementById("outForDelivery").textContent = formatNumber(data.out_for_delivery)
  document.getElementById("deliveredOrders").textContent = formatNumber(data.delivered_orders)
  document.getElementById("cancelledOrders").textContent = formatNumber(data.cancelled_orders)
  document.getElementById("codOrders").textContent = formatNumber(data.cod_orders)
  document.getElementById("onlineOrders").textContent = formatNumber(data.online_orders)

  // Performance metrics
  updateProgressCircle("deliverySuccessRate", data.delivery_success_rate)
  updateProgressCircle("customerSatisfaction", data.customer_satisfaction)
  document.getElementById("avgOrderValue").textContent = `₹${formatNumber(data.avg_order_value)}`
  document.getElementById("avgDeliveryTime").textContent = `${data.avg_delivery_time} min`

  // Update progress bars
  document.getElementById("avgOrderValueProgress").style.width = `${Math.min(data.avg_order_value / 50, 100)}%`
  document.getElementById("avgDeliveryTimeProgress").style.width = `${Math.min(data.avg_delivery_time / 60, 100)}%`
}

async function loadDashboardCharts() {
  try {
    const [success, result] = await callApi("GET", `${dashboard_charts_url}?range=${currentDateRange}`)

    if (success && result.success) {
      createSalesChart(result.data.sales_data)
      createOrderStatusChart(result.data.order_status_data)
      createDeliveryAreasChart(result.data.delivery_areas_data)
    } else {
      throw new Error(result.error || "Failed to load chart data")
    }
  } catch (error) {
    console.error("Error loading chart data:", error)
    showToast("Error loading charts.", "error")
  }
}

function createSalesChart(salesData) {
  const ctx = document.getElementById("salesChart").getContext("2d")

  if (salesChart) {
    salesChart.destroy()
  }

  salesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: salesData.labels,
      datasets: [
        {
          label: "Revenue (₹)",
          data: salesData.revenue,
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Orders",
          data: salesData.orders,
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: "linear",
          display: true,
          position: "left",
          title: {
            display: true,
            text: "Revenue (₹)",
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Orders",
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
    },
  })
}

function createOrderStatusChart(statusData) {
  const ctx = document.getElementById("orderStatusChart").getContext("2d")

  if (orderStatusChart) {
    orderStatusChart.destroy()
  }

  orderStatusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: statusData.labels,
      datasets: [
        {
          data: statusData.values,
          backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6c757d", "#17a2b8"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  })
}

function createDeliveryAreasChart(areasData) {
  const ctx = document.getElementById("deliveryAreasChart").getContext("2d")

  if (deliveryAreasChart) {
    deliveryAreasChart.destroy()
  }

  deliveryAreasChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: areasData.labels,
      datasets: [
        {
          label: "Orders",
          data: areasData.values,
          backgroundColor: "rgba(0, 123, 255, 0.8)",
          borderColor: "#007bff",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Orders",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })
}

async function loadRecentOrders() {
  try {
    const [success, result] = await callApi("GET", recent_orders_url)

    if (success && result.success) {
      populateRecentOrders(result.data.orders)
    } else {
      throw new Error(result.error || "Failed to load recent orders")
    }
  } catch (error) {
    console.error("Error loading recent orders:", error)
    showToast("Error loading recent orders.", "error")
  }
}

function populateRecentOrders(orders) {
  const tbody = document.getElementById("recentOrdersTable")

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No recent orders found</td></tr>'
    return
  }

  tbody.innerHTML = orders
    .map(
      (order) => `
        <tr>
            <td>
                <a href="/admin-order-detail/?order_id=${order.order_id}" class="text-decoration-none">
                    #${order.order_id}
                </a>
            </td>
            <td>
                <div>
                    <strong>${order.customer_name}</strong>
                    <br><small class="text-muted">${order.phone}</small>
                </div>
            </td>
            <td><strong>₹${formatNumber(order.total_amount)}</strong></td>
            <td>
                <span class="badge ${getStatusBadgeClass(order.status)}">
                    ${getStatusText(order.status)}
                </span>
            </td>
            <td>
                <small>${formatDate(order.created_at)}</small>
            </td>
            <td>
                <a href="/admin-order-detail/?order_id=${order.order_id}" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-eye"></i>
                </a>
            </td>
        </tr>
    `,
    )
    .join("")
}

async function loadTopProducts() {
  try {
    const [success, result] = await callApi("GET", `${top_products_url}?range=${currentDateRange}`)

    if (success && result.success) {
      populateTopProducts(result.data.products)
    } else {
      throw new Error(result.error || "Failed to load top products")
    }
  } catch (error) {
    console.error("Error loading top products:", error)
    showToast("Error loading top products.", "error")
  }
}

function populateTopProducts(products) {
  const container = document.getElementById("topProductsList")

  if (products.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">No product data available</p>'
    return
  }

  container.innerHTML = products
    .map(
      (product, index) => `
        <div class="d-flex align-items-center mb-3">
            <div class="me-3">
                <span class="badge bg-primary rounded-pill">${index + 1}</span>
            </div>
            <div class="flex-grow-1">
                <h6 class="mb-1">${product.name}</h6>
                <small class="text-muted">${product.orders_count} orders • ₹${formatNumber(product.revenue)}</small>
            </div>
            <div class="text-end">
                <div class="progress" style="width: 60px; height: 6px;">
                    <div class="progress-bar bg-success" style="width: ${product.percentage}%"></div>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

function initializeEventListeners() {
  // Date range selector
  document.querySelectorAll("[data-range]").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault()
      const range = e.target.dataset.range
      await changeDateRange(range)
    })
  })

  // Refresh button
  document.getElementById("refreshDashboard").addEventListener("click", async () => {
    showLoading()
    await initializeDashboard()
    hideLoading()
    showToast("Dashboard refreshed successfully!", "success")
  })

  // Chart type toggle
  document.querySelectorAll("[data-chart-type]").forEach((button) => {
    button.addEventListener("click", (e) => {
      document.querySelectorAll("[data-chart-type]").forEach((btn) => btn.classList.remove("active"))
      e.target.classList.add("active")
      // You can implement chart type switching here
    })
  })
}

async function changeDateRange(range) {
  currentDateRange = range

  // Update button text
  const rangeTexts = {
    today: "Today",
    yesterday: "Yesterday",
    "7days": "Last 7 Days",
    "30days": "Last 30 Days",
    "90days": "Last 90 Days",
  }

  document.getElementById("dateRangeText").textContent = rangeTexts[range]

  // Reload data
  showLoading()
  await Promise.all([loadDashboardStats(), loadDashboardCharts(), loadTopProducts()])
  hideLoading()

  showToast(`Dashboard updated for ${rangeTexts[range]}`, "success")
}

// Utility functions
function updateProgressCircle(elementId, percentage) {
  const element = document.getElementById(elementId)
  const span = element.querySelector("span")

  element.dataset.percentage = percentage
  span.textContent = `${percentage}%`

  // Add CSS animation for progress circle
  element.style.background = `conic-gradient(#007bff ${percentage * 3.6}deg, #e9ecef 0deg)`
}

function getStatusBadgeClass(status) {
  const statusClasses = {
    placed: "bg-info",
    confirmed: "bg-primary",
    preparing: "bg-warning",
    ready: "bg-info",
    out_for_delivery: "bg-primary",
    delivered: "bg-success",
    cancelled: "bg-danger",
  }
  return statusClasses[status] || "bg-secondary"
}

function getStatusText(status) {
  const statusTexts = {
    placed: "Placed",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  }
  return statusTexts[status] || status
}

function formatNumber(num) {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + "Cr"
  } else if (num >= 100000) {
    return (num / 100000).toFixed(1) + "L"
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function showLoading() {
  document.getElementById("loadingSpinner").style.display = "block"
  document.getElementById("mainStatsContainer").style.opacity = "0.5"
}

function hideLoading() {
  document.getElementById("loadingSpinner").style.display = "none"
  document.getElementById("mainStatsContainer").style.opacity = "1"
}

function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer")
  const toastId = "toast-" + Date.now()

  const toast = document.createElement("div")
  toast.id = toastId
  toast.className = `toast align-items-center text-white bg-${type === "error" ? "danger" : type} border-0`
  toast.setAttribute("role", "alert")
  toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `

  toastContainer.appendChild(toast)

  const bsToast = new bootstrap.Toast(toast)
  bsToast.show()

  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove()
  })
}
