let csrf_token = null;
let product_tax_rates_url = null;
let categories_url = null;
let subcategories_url = null;

let currentPage = 1;
const itemsPerPage = 1600;
let totalItems = 0;
let currentFilters = {
    search: "",
    category: "",
    sub_category: ""
};

let allProducts = [];
let allCategories = [];
let allSubCategories = [];
let taxRateChanges = {};

async function AdminProductTaxRates(
    csrf_token_param,
    product_tax_rates_url_param,
    categories_url_param,
    subcategories_url_param
) {
    csrf_token = csrf_token_param;
    product_tax_rates_url = product_tax_rates_url_param;
    categories_url = categories_url_param;
    subcategories_url = subcategories_url_param;

    // Load initial data
    await loadCategories();
    await loadProducts();

    // Initialize event listeners
    initializeEventListeners();
}

function initializeEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Filter changes
    document.getElementById('categoryFilter').addEventListener('change', handleCategoryChange);
    document.getElementById('applyFiltersBtn').addEventListener('click', handleFilterApply);

    // Save button
    document.getElementById('saveAllBtn').addEventListener('click', saveAllTaxRates);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadProducts();
        showToast('info', 'Refreshed', 'Product list has been refreshed');
    });
}

async function loadCategories() {
    try {
        const [success, result] = await callApi('GET', categories_url);
        if (success && result.success) {
            allCategories = result.data;
            populateCategoryFilter();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('error', 'Error', 'Failed to load categories');
    }
}

function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="">All Categories</option>';

    allCategories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category.category_id;
        option.textContent = category.title;
        categoryFilter.appendChild(option);
    });
}

async function handleCategoryChange() {
    const categoryId = document.getElementById('categoryFilter').value;
    const subCategoryFilter = document.getElementById('subCategoryFilter');
    
    if (!categoryId) {
        subCategoryFilter.innerHTML = '<option value="">All Sub Categories</option>';
        subCategoryFilter.disabled = true;
        return;
    }
    
    try {
        subCategoryFilter.disabled = true;
        subCategoryFilter.innerHTML = '<option value="">Loading subcategories...</option>';
        
        const [success, result] = await callApi('GET', `${subcategories_url}?category_id=${categoryId}`);
        
        if (success && result.success) {
            allSubCategories = result.data;
            subCategoryFilter.innerHTML = '<option value="">All Sub Categories</option>';
            
            allSubCategories.forEach((subCategory) => {
                const option = document.createElement('option');
                option.value = subCategory.sub_category_id;
                option.textContent = subCategory.title;
                subCategoryFilter.appendChild(option);
            });
            
            subCategoryFilter.disabled = false;
        } else {
            throw new Error(result.error || 'Failed to load subcategories');
        }
    } catch (error) {
        console.error('Error loading subcategories:', error);
        subCategoryFilter.innerHTML = '<option value="">Error loading subcategories</option>';
        showToast('error', 'Error', 'Failed to load subcategories');
    }
}

function handleSearch() {
    currentFilters.search = document.getElementById('searchInput').value.trim();
    currentPage = 1;
    loadProducts();
}

function handleFilterApply() {
    currentFilters.category = document.getElementById('categoryFilter').value;
    currentFilters.sub_category = document.getElementById('subCategoryFilter').value;
    currentPage = 1;
    loadProducts();
}

async function loadProducts() {
    showLoading();
    
    try {
        // Build query parameters with format=json to indicate API request
        const params = new URLSearchParams({
            format: 'json',  // This tells the view to return JSON data
            page: currentPage,
            limit: itemsPerPage,
            search: currentFilters.search,
            category: currentFilters.category,
            sub_category: currentFilters.sub_category
        });
        
        const [success, result] = await callApi('GET', `${product_tax_rates_url}?${params}`);
        
        if (success && result.success) {
            allProducts = result.data.products;
            totalItems = result.data.total;
            
            renderProductsTable();
            renderPagination();
            updateProductCount();
        } else {
            throw new Error(result.error || 'Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('error', 'Error', 'Failed to load products');
        showEmptyState();
    } finally {
        hideLoading();
    }
}

async function saveAllTaxRates_old() {
    if (Object.keys(taxRateChanges).length === 0) {
        showToast('info', 'No Changes', 'No tax rate changes to save');
        return;
    }
    
    showLoading('Saving tax rates...');
    
    try {
        const savePromises = Object.entries(taxRateChanges).map(([productId, taxRate]) => 
            callApi('PUT', `${product_tax_rates_url}${productId}/`, { tax_rate: taxRate }, csrf_token)
        );
        
        const results = await Promise.all(savePromises);
        const successCount = results.filter(([success]) => success).length;
        
        if (successCount === Object.keys(taxRateChanges).length) {
            showToast('success', 'Success', `Tax rates for ${successCount} products saved successfully`);
            
            // Reset changes and remove highlight
            taxRateChanges = {};
            document.querySelectorAll('.table-warning').forEach(row => {
                row.classList.remove('table-warning');
            });
        } else {
            showToast('warning', 'Partial Success', 
                `Tax rates for ${successCount} of ${Object.keys(taxRateChanges).length} products saved`);
        }
    } catch (error) {
        console.error('Error saving tax rates:', error);
        showToast('error', 'Error', 'Failed to save tax rates');
    } finally {
        hideLoading();
    }
}

function calculateBasePrice(actualPrice, taxRate) {
    const price = parseFloat(actualPrice);
    taxRate = parseInt(taxRate);
    
    if (taxRate === 0) return price;
    if (taxRate === 5) return (price * 100) / 105;
    return (price * 100) / 118; // Default to 18%
}

function renderProductsTable() {
    const tableBody = document.getElementById('productsTableBody');
    const tableContainer = document.getElementById('productsTableContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (!allProducts || allProducts.length === 0) {
        showEmptyState();
        return;
    }
    
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';
    
    tableBody.innerHTML = '';
    
    allProducts.forEach((product) => {
        // Product row
        // taxRateChanges[product.product_id] = "18"
        const productRow = document.createElement('tr');
        productRow.className = 'product-row';
        productRow.innerHTML = `
            <td>
                <strong>${product.title}</strong>
                <br><small class="text-muted">ID: ${product.product_id}</small>
            </td>
            <td>${product.category_name || 'N/A'}</td>
            <td>${product.sub_category_name || 'N/A'}</td>
            <td>
                <select class="form-select form-select-sm tax-select" 
                        data-product-id="${product.product_id}"
                        onchange="handleTaxRateChange(this, '${product.product_id}')">
                    <option value="0" ${product.tax_rate === '0' ? 'selected' : ''}>0%</option>
                    <option value="5" ${product.tax_rate === '5' ? 'selected' : ''}>5%</option>
                    <option value="18" ${product.tax_rate === '18' || !product.tax_rate ? 'selected' : ''}>18%</option>
                </select>
            </td>
            <td>
                ${product.variations.length > 0 ? 
                    `₹${(+(calculateBasePrice(product.variations[0].actual_price, product.tax_rate).toFixed(2)) + 0.05).toFixed(2)}` : 
                    'N/A'}
            </td>
            <td>${new Date(product.created_at).toLocaleDateString()}</td>
        `;
        tableBody.appendChild(productRow);
        
        // Variations rows
        product.variations.forEach((variation, index) => {
            const basePrice = calculateBasePrice(variation.actual_price, product.tax_rate);
            const variationRow = document.createElement('tr');
            variationRow.className = 'variation-row';
            variationRow.innerHTML = `
                <td colspan="2">
                    ${variation.weight_variation}
                </td>
                <td>
                    ₹${variation.actual_price}
                </td>
                <td>
                    ₹${(+(basePrice.toFixed(2)) + 0.05).toFixed(2)}
                </td>
                <td>
                    <span class="badge ${variation.stock_status.includes('Out of Stock') ? 'bg-danger' : 'bg-success'}">
                        ${variation.stock_status}
                    </span>
                </td>
                <td></td>
            `;
            tableBody.appendChild(variationRow);
        });
    });
}

function handleTaxRateChange(selectElement, productId) {
    const newTaxRate = selectElement.value;
    taxRateChanges[productId] = newTaxRate;
    
    // Highlight the row to indicate unsaved changes
    const row = selectElement.closest('tr');
    row.classList.add('table-warning');

    updateVariationPrices(productId, newTaxRate);
}

function updateVariationPrices(productId, taxRate) {
    // Find the product row and all its variation rows
    const productRow = document.querySelector(`.tax-select[data-product-id="${productId}"]`).closest('tr');
    let nextRow = productRow.nextElementSibling;
    
    while (nextRow && nextRow.classList.contains('variation-row')) {
        // Get the actual price from the variation row
        const actualPriceCell = nextRow.querySelector('td:nth-child(2)');
        const actualPrice = parseFloat(actualPriceCell.textContent.replace('₹', ''));
        
        // Calculate and update the base price
        const basePrice = calculateBasePrice(actualPrice, taxRate);
        const basePriceCell = nextRow.querySelector('td:nth-child(3)');
        basePriceCell.textContent = `New Base price - ₹${(+(basePrice.toFixed(2)) + 0.05).toFixed(2)}`;
        
        // Move to the next row
        nextRow = nextRow.nextElementSibling;
    }

}

async function saveAllTaxRates_old() {
    if (Object.keys(taxRateChanges).length === 0) {
        showToast('info', 'No Changes', 'No tax rate changes to save');
        return;
    }
    
    showLoading('Saving tax rates...');
    
    try {
        const savePromises = Object.entries(taxRateChanges).map(([productId, taxRate]) => 
            callApi('PUT', `${product_tax_rates_url}${productId}/`, { tax_rate: taxRate }, csrf_token)
        );
        
        const results = await Promise.all(savePromises);
        const successCount = results.filter(([success]) => success).length;
        
        if (successCount === Object.keys(taxRateChanges).length) {
            showToast('success', 'Success', `Tax rates for ${successCount} products saved successfully`);
            
            // Reset changes and remove highlight
            taxRateChanges = {};
            document.querySelectorAll('.table-warning').forEach(row => {
                row.classList.remove('table-warning');
            });
        } else {
            showToast('warning', 'Partial Success', 
                `Tax rates for ${successCount} of ${Object.keys(taxRateChanges).length} products saved`);
        }
    } catch (error) {
        console.error('Error saving tax rates:', error);
        showToast('error', 'Error', 'Failed to save tax rates');
    } finally {
        hideLoading();
    }
}


async function saveAllTaxRates() {    
    if (Object.keys(taxRateChanges).length === 0) {
        showToast('info', 'No Changes', 'No tax rate changes to save');
        return;
    }
    
    showLoading('Saving tax rates...');
    
    try {
        const bodyData = {
            prod_data: taxRateChanges
        }
        const url = product_tax_rates_url;
        const [success, result] = await callApi("POST", url, bodyData, csrf_token);
        if (success) {
            showToast('success', 'Success', 
                `Tax rates for ${result.data.completed} of ${Object.keys(taxRateChanges).length} products saved`);
        } else {
            console.log('issue')
            alert(`${result.error}`)
        }
        
    } catch (error) {
        console.error('Error saving tax rates:', error);
        showToast('error', 'Error', 'Failed to save tax rates');
    } finally {
        hideLoading();
    }
}


function updateProductCount() {
    document.getElementById('totalProducts').textContent = `${totalItems} Products`;
}

function showEmptyState() {
    document.getElementById('productsTableContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('paginationContainer').style.display = 'none';
}

function showLoading(message = 'Loading...') {
    const loadingEl = document.getElementById('loadingSpinner');
    if (loadingEl) {
        loadingEl.style.display = 'block';
        loadingEl.querySelector('p').textContent = message;
    }
    
    document.getElementById('productsTableContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('paginationContainer').style.display = 'none';
}

function hideLoading() {
    const loadingEl = document.getElementById('loadingSpinner');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

function renderPagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (totalItems === 0) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Update info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    paginationInfo.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} entries`;
    
    // Generate pagination
    pagination.innerHTML = '';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>`;
    pagination.appendChild(prevLi);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>`;
    pagination.appendChild(nextLi);
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(totalItems / itemsPerPage)) return;
    currentPage = page;
    loadProducts();
}

function showToast(type, title, message) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${getToastBgClass(type)} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
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
    `;
    
    toastContainer.appendChild(toast);
    
    // Show the toast
    setTimeout(() => {
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }, 100);
    
    // Remove the toast after it hides
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function getToastBgClass(type) {
    const classMap = {
        success: 'success',
        error: 'danger',
        warning: 'warning',
        info: 'primary'
    };
    return classMap[type] || 'primary';
}

function getToastIcon(type) {
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    return iconMap[type] || 'fas fa-info-circle';
}