// Global variables
let itemCounter = 0;
let products = [];
let timeslots = [];
let pincodes = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    setupEventListeners();
    addOrderItem(); // Add first item by default
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('addOrderForm').addEventListener('submit', handleFormSubmit);
    
    // Delivery charge change
    document.getElementById('deliveryCharge').addEventListener('input', calculateTotals);
    
    // Final amount change
    document.getElementById('finalAmount').addEventListener('input', calculateDiscount);
    
    // Set minimum delivery date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('deliveryDate').setAttribute('min', today);
}

// Load initial data
async function loadInitialData() {
    try {
        await Promise.all([
            loadProducts(),
            loadTimeslots(),
            loadPincodes()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
        showAlert('Error loading page data. Please refresh the page.', 'error');
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await fetch('/product-api/all-products/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        if (data.success) {
            products = data.data;
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load timeslots
async function loadTimeslots() {
    try {
        const response = await fetch('/product-api/timeslot/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        if (data.success) {
            timeslots = data.data;
            populateTimeslots();
        }
    } catch (error) {
        console.error('Error loading timeslots:', error);
    }
}

// Load pincodes
async function loadPincodes() {
    try {
        const response = await fetch('/product-api/pincode/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        if (data.success) {
            pincodes = data.data;
            populatePincodes();
        }
    } catch (error) {
        console.error('Error loading pincodes:', error);
    }
}

// Populate timeslots dropdown
function populateTimeslots() {
    const timeslotSelect = document.getElementById('timeslot');
    timeslotSelect.innerHTML = '<option value="">Select Time Slot</option>';
    
    timeslots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.timeslot_id;
        option.textContent = `${slot.time_slot_title} (${slot.start_time} - ${slot.end_time})`;
        timeslotSelect.appendChild(option);
    });
}

// Populate pincodes dropdown
function populatePincodes() {
    const pincodeSelect = document.getElementById('pincode');
    pincodeSelect.innerHTML = '<option value="">Select Pincode</option>';
    
    pincodes.forEach(pincode => {
        const option = document.createElement('option');
        option.value = pincode.pincode_id;
        option.textContent = `${pincode.pincode} - ${pincode.area_name}`;
        pincodeSelect.appendChild(option);
    });
}

// Add order item
function addOrderItem() {
    itemCounter++;
    const itemsContainer = document.getElementById('orderItems');
    
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.id = `item-${itemCounter}`;
    
    itemRow.innerHTML = `
        <div class="form-group" style="flex: 2;">
            <label>Product</label>
            <select name="product_${itemCounter}" onchange="loadProductVariations(${itemCounter})" required>
                <option value="">Select Product</option>
                ${products.map(product => 
                    `<option value="${product.product_id}">${product.title}</option>`
                ).join('')}
            </select>
        </div>
        <div class="form-group" style="flex: 1.5;">
            <label>Variation</label>
            <select name="variation_${itemCounter}" onchange="updateItemPrice(${itemCounter})" required>
                <option value="">Select Variation</option>
            </select>
        </div>
        <div class="form-group" style="flex: 0.8;">
            <label>Quantity</label>
            <input type="number" name="quantity_${itemCounter}" min="1" value="1" onchange="calculateItemTotal(${itemCounter})" required>
        </div>
        <div class="form-group" style="flex: 1;">
            <label>Unit Price (₹)</label>
            <input type="number" name="unit_price_${itemCounter}" min="0" step="0.01" readonly>
        </div>
        <div class="form-group" style="flex: 1;">
            <label>Total (₹)</label>
            <input type="number" name="item_total_${itemCounter}" min="0" step="0.01" readonly>
        </div>
        <button type="button" class="btn-remove-item" onclick="removeOrderItem(${itemCounter})">Remove</button>
    `;
    
    itemsContainer.appendChild(itemRow);
}

// Remove order item
function removeOrderItem(itemId) {
    const itemRow = document.getElementById(`item-${itemId}`);
    if (itemRow) {
        itemRow.remove();
        calculateTotals();
    }
}

// Load product variations
async function loadProductVariations(itemId) {
    const productSelect = document.querySelector(`select[name="product_${itemId}"]`);
    const variationSelect = document.querySelector(`select[name="variation_${itemId}"]`);
    const productId = productSelect.value;
    
    // Clear variations
    variationSelect.innerHTML = '<option value="">Select Variation</option>';
    
    if (!productId) return;
    
    try {
        const response = await fetch(`/product-api/product-variations/?product_id=${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        if (data.success) {
            data.data.forEach(variation => {
                const option = document.createElement('option');
                option.value = variation.product_variation_id;
                option.textContent = `${variation.weight_variation} - ₹${variation.price}`;
                option.dataset.price = variation.price;
                variationSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading variations:', error);
    }
}

// Update item price when variation is selected
function updateItemPrice(itemId) {
    const variationSelect = document.querySelector(`select[name="variation_${itemId}"]`);
    const unitPriceInput = document.querySelector(`input[name="unit_price_${itemId}"]`);
    
    const selectedOption = variationSelect.options[variationSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.price) {
        unitPriceInput.value = selectedOption.dataset.price;
        calculateItemTotal(itemId);
    }
}

// Calculate item total
function calculateItemTotal(itemId) {
    const quantityInput = document.querySelector(`input[name="quantity_${itemId}"]`);
    const unitPriceInput = document.querySelector(`input[name="unit_price_${itemId}"]`);
    const itemTotalInput = document.querySelector(`input[name="item_total_${itemId}"]`);
    
    const quantity = parseFloat(quantityInput.value) || 0;
    const unitPrice = parseFloat(unitPriceInput.value) || 0;
    const total = quantity * unitPrice;
    
    itemTotalInput.value = total.toFixed(2);
    calculateTotals();
}

// Calculate totals
function calculateTotals() {
    let itemsSubtotal = 0;
    
    // Sum all item totals
    const itemTotalInputs = document.querySelectorAll('input[name^="item_total_"]');
    itemTotalInputs.forEach(input => {
        itemsSubtotal += parseFloat(input.value) || 0;
    });
    
    const deliveryCharge = parseFloat(document.getElementById('deliveryCharge').value) || 0;
    const calculatedTotal = itemsSubtotal + deliveryCharge;
    
    // Update display
    document.getElementById('itemsSubtotal').textContent = `₹${itemsSubtotal.toFixed(2)}`;
    document.getElementById('deliveryChargeDisplay').textContent = `₹${deliveryCharge.toFixed(2)}`;
    document.getElementById('calculatedTotal').textContent = `₹${calculatedTotal.toFixed(2)}`;
    
    calculateDiscount();
}

// Calculate discount
function calculateDiscount() {
    const calculatedTotal = parseFloat(document.getElementById('calculatedTotal').textContent.replace('₹', '')) || 0;
    const finalAmount = parseFloat(document.getElementById('finalAmount').value) || 0;
    const discount = calculatedTotal - finalAmount;
    
    document.getElementById('discountAmount').textContent = `₹${discount.toFixed(2)}`;
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    showLoading(true);
    
    try {
        const orderData = collectFormData();
        const response = await submitOrder(orderData);
        
        if (response.success) {
            showAlert(`Order created successfully! Order ID: ${response.data.order_id}`, 'success');
            document.getElementById('addOrderForm').reset();
            // Optionally redirect to order details
            setTimeout(() => {
                window.location.href = `/admin-order-detail/?order_id=${response.data.order_id}`;
            }, 2000);
        } else {
            showAlert(`Error creating order: ${response.error}`, 'error');
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        showAlert('Error creating order. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Validate form
function validateForm() {
    // Check if at least one item is added
    const itemRows = document.querySelectorAll('.item-row');
    if (itemRows.length === 0) {
        showAlert('Please add at least one item to the order.', 'error');
        return false;
    }
    
    // Check if all items have required fields
    for (let i = 0; i < itemRows.length; i++) {
        const row = itemRows[i];
        const productSelect = row.querySelector('select[name^="product_"]');
        const variationSelect = row.querySelector('select[name^="variation_"]');
        const quantityInput = row.querySelector('input[name^="quantity_"]');
        
        if (!productSelect.value || !variationSelect.value || !quantityInput.value) {
            showAlert('Please fill all required fields for all items.', 'error');
            return false;
        }
    }
    
    // Check final amount
    const finalAmount = parseFloat(document.getElementById('finalAmount').value);
    if (!finalAmount || finalAmount <= 0) {
        showAlert('Please enter a valid final amount.', 'error');
        return false;
    }
    
    return true;
}

// Collect form data
function collectFormData() {
    const formData = new FormData(document.getElementById('addOrderForm'));
    
    // Collect basic order info
    const orderData = {
        first_name: formData.get('firstName'),
        last_name: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        delivery_date: formData.get('deliveryDate'),
        timeslot_id: formData.get('timeslot'),
        pincode_id: formData.get('pincode'),
        delivery_address: formData.get('deliveryAddress'),
        delivery_charge: parseFloat(formData.get('deliveryCharge')) || 0,
        special_instructions: formData.get('specialInstructions') || '',
        order_note: formData.get('orderNote') || '',
        final_amount: parseFloat(formData.get('finalAmount')),
        discount_reason: formData.get('discountReason') || 'Admin Discount',
        payment_method: 'cod',
        is_cod: true,
        payment_received: true,
        status: 'placed',
        items: []
    };
    
    // Collect items
    const itemRows = document.querySelectorAll('.item-row');
    itemRows.forEach(row => {
        const productSelect = row.querySelector('select[name^="product_"]');
        const variationSelect = row.querySelector('select[name^="variation_"]');
        const quantityInput = row.querySelector('input[name^="quantity_"]');
        const unitPriceInput = row.querySelector('input[name^="unit_price_"]');
        const itemTotalInput = row.querySelector('input[name^="item_total_"]');
        
        if (productSelect.value && variationSelect.value) {
            orderData.items.push({
                product_id: productSelect.value,
                product_variation_id: variationSelect.value,
                quantity: parseInt(quantityInput.value),
                amount: parseFloat(unitPriceInput.value),
                final_amount: parseFloat(itemTotalInput.value)
            });
        }
    });
    
    return orderData;
}

// Submit order
async function submitOrder(orderData) {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    const response = await fetch('/order-api/admin-create-order/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(orderData)
    });
    
    return await response.json();
}

// Show loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const form = document.getElementById('addOrderForm');
    
    if (show) {
        spinner.style.display = 'block';
        form.style.display = 'none';
    } else {
        spinner.style.display = 'none';
        form.style.display = 'block';
    }
}

// Show alert message
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
    
    // Scroll to top to show alert
    window.scrollTo(0, 0);
}
