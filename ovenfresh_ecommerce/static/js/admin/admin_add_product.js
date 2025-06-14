let csrf_token = null;
let category_url = null;
let sub_category_url = null;
let pincode_timeslots_url = null;
let add_product_url = null;
let add_product_variation_url = null;
let availability_charges_url = null;

let pincodes = [];
let timeslots = [];
let product_id = null;
let copiedAvailability = null;
let categoryData = [];

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("product_id")) {
    product_id = urlParams.get("product_id");
}

async function AdminAddProduct(
    csrf_token_param,
    category_url_param,
    sub_category_url_param,
    pincode_timeslots_url_param,
    add_product_url_param,
    add_product_variation_url_param,
    availability_charges_url_param
) {
    csrf_token = csrf_token_param;
    category_url = category_url_param;
    sub_category_url = sub_category_url_param;
    pincode_timeslots_url = pincode_timeslots_url_param;
    add_product_url = add_product_url_param;
    add_product_variation_url = add_product_variation_url_param;
    availability_charges_url = availability_charges_url_param;

    if (product_id) {
        await loadProductData();
        document.getElementById("variationSection").style.display = "";
    }
    await loadCategoriesAndSubcategories();
    await loadPincodesAndTimeslots();

    document.getElementById("submitProductBtn").addEventListener("click", async () => {
        showLoading("Creating product...");
        if (!product_id) {
            await createProductMeta();  // creates product and sets product_id
        }
        else {
            await createProductMeta(true);  // updates product
        }
        await loadProductData();
        document.getElementById("variationSection").style.display = "";
        await loadExistingVariations();
        hideLoading();
        showToast('success', 'Success', 'Product saved successfully');
    });

    document.getElementById("submitVariationBtn").addEventListener("click", async () => {
        if (!product_id) {
            showToast('error', 'Error', 'Please create a product first.');
            return;
        }

        showLoading("Saving variation...");
        if (document.getElementById("productVariationId").value) {
            await updateVariationWithAvailability(document.getElementById("productVariationId").value);
        }
        else {
            await createVariationWithAvailability();
        }
        
        await loadExistingVariations();
        hideLoading();
    });

    await loadExistingVariations();

    // Initialize theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Initialize mobile sidebar toggle
    const mobileToggle = document.querySelector('.navbar-toggler');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileSidebar);
    }

    // Load saved theme
    loadSavedTheme();
}

async function loadProductData() {
    const [Success, Res] = await callApi("GET", `${add_product_url}?product_id=${product_id}`);

    if (Success && Res.success) {
        console.log(Res.data);
        
        document.getElementById('productTitle').value = Res.data.title;
        document.getElementById('productDesc').value = Res.data.description;
        document.getElementById('productPhoto').value = Res.data.photos;
        document.getElementById('categorySelect').value = Res.data.category_id;
        document.getElementById('subCategorySelect').value = Res.data.sub_category_id;

        document.getElementById('submitProductBtn').innerHTML = '<i class="fas fa-save me-1"></i> Update Product';
    }
}

async function loadCategoriesAndSubcategories() {
    const [catSuccess, catRes] = await callApi("GET", category_url); // Must return subcategories too

    if (catSuccess && catRes.success) {
        categoryData = catRes.data;

        const catSelect = document.getElementById("categorySelect");
        catSelect.innerHTML = `<option value="">Select Category</option>`; // Clear before fill

        categoryData.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.category_id;
            option.text = cat.title;
            catSelect.appendChild(option);
        });

        // Optional: attach event listener to category select
        catSelect.addEventListener("change", handleCategoryChange);
    }
}

function handleCategoryChange(event) {
    const selectedCatId = parseInt(event.target.value);
    const subCatSelect = document.getElementById("subCategorySelect");
    subCatSelect.innerHTML = `<option value="">Select Sub-Category</option>`; // Clear

    const selectedCategory = categoryData.find(cat => cat.category_id === selectedCatId);

    if (selectedCategory && selectedCategory.subcategories) {
        selectedCategory.subcategories.forEach(sub => {
            const option = document.createElement("option");
            option.value = sub.sub_category_id;
            option.text = sub.title;
            subCatSelect.appendChild(option);
        });
    }
}

async function loadPincodesAndTimeslots() {
    const [success, result] = await callApi("GET", pincode_timeslots_url);
    if (success && result.success) {
        pincodes = result.data.pincodes;
        timeslots = result.data.timeslots;

        const container = document.getElementById("pincodeAvailability");
        container.innerHTML = "";

        // Populate timeslot dropdown in tools
        const disableTimeslotSelect = document.getElementById("disableTimeslot");
        if (disableTimeslotSelect) {
            disableTimeslotSelect.innerHTML = '<option disabled selected>Select Timeslot to Disable</option>';
            timeslots.forEach(ts => {
                disableTimeslotSelect.innerHTML += `<option value="${ts.id}">${ts.time_slot_title}</option>`;
            });
        }

        // Create accordion for pincodes
        const accordion = document.createElement("div");
        accordion.className = "accordion";
        accordion.id = "pincodeAccordion";

        pincodes.forEach((pincode, i) => {
            console.log(pincode);
            const accordionItem = document.createElement("div");
            accordionItem.className = "accordion-item";
            
            const headerId = `heading-${pincode.id}`;
            const collapseId = `collapse-${pincode.id}`;
            
            accordionItem.innerHTML = `
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button ${i > 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" 
                            data-bs-target="#${collapseId}" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="${collapseId}">
                        ${pincode.area_name} - ${pincode.pincode}
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse ${i === 0 ? 'show' : ''}" 
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
                                    ${timeslots.map(slot => `
                                        <tr>
                                            <td>${slot.time_slot_title}</td>
                                            <td>
                                                <div class="form-check form-switch">
                                                    <input class="form-check-input timeslot-checkbox" type="checkbox"
                                                    ${pincode.delivery_charge[`${slot.id}`]['available'] ? "checked" : ""}
                                                           id="pincode_${pincode.id}_slot_${slot.id}">
                                                </div>
                                            </td>
                                            <td>                                                
                                                <input type="number" class="form-control form-control-sm" 
                                                       id="charge_${pincode.id}_${slot.id}" value="${pincode.delivery_charge[`${slot.id}`]['charges']}" style="width: 80px">
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            accordion.appendChild(accordionItem);
        });
        
        container.appendChild(accordion);
    }
}

function applyUniversalCharge() {
    const charge = document.getElementById("universalCharge").value;
    if (!charge) {
        showToast('warning', 'Warning', 'Please enter a charge value');
        return;
    }
    
    pincodes.forEach(pincode => {
        timeslots.forEach(slot => {
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`);
            if (chargeInput) chargeInput.value = charge;
        });
    });
    
    showToast('success', 'Success', 'Charges applied to all timeslots');
}

function selectAllTimeslots() {
    document.querySelectorAll(".timeslot-checkbox").forEach(checkbox => {
        checkbox.checked = true;
    });
    showToast('success', 'Success', 'All timeslots selected');
}

function applyStepCharges() {
    const base = parseInt(document.getElementById("baseCharge").value);
    const step = parseInt(document.getElementById("stepCharge").value);
    if (isNaN(base) || isNaN(step)) {
        showToast('warning', 'Warning', 'Please enter valid base and step values');
        return;
    }

    pincodes.forEach((pincode, index) => {
        const stepValue = base + index * step;
        timeslots.forEach(slot => {
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`);
            if (chargeInput) chargeInput.value = stepValue;
        });
    });
    
    showToast('success', 'Success', 'Step charges applied');
}

function disableTimeslotForAll() {
    const tsId = document.getElementById("disableTimeslot").value;
    if (!tsId) {
        showToast('warning', 'Warning', 'Please select a timeslot');
        return;
    }
    
    pincodes.forEach(pincode => {
        const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${tsId}`);
        if (checkbox) checkbox.checked = false;
    });
    
    showToast('success', 'Success', 'Timeslot disabled for all pincodes');
}

async function createProductMeta(is_update = false) {
    if (is_update && !product_id) return;

    const productData = {
        title: document.getElementById("productTitle").value,
        description: document.getElementById("productDesc").value,
        photos: [document.getElementById("productPhoto").value],
        category_id: document.getElementById("categorySelect").value,
        sub_category_id: document.getElementById("subCategorySelect").value,
    };

    // Validate required fields
    if (!productData.title || !productData.category_id || !productData.sub_category_id) {
        showToast('error', 'Error', 'Please fill all required fields');
        return;
    }

    if (is_update) {
        const [updateProductSuccess, updateProductRes] = await callApi("PUT", `${add_product_url}${product_id}/`, productData, csrf_token);
        if (!updateProductSuccess || !updateProductRes.success) {
            showToast('error', 'Error', 'Failed to update product');
            return;
        }
    }
    else {
        const [productSuccess, productRes] = await callApi("POST", add_product_url, productData, csrf_token);
        if (!productSuccess || !productRes.success) {
            showToast('error', 'Error', 'Failed to create product');
            return;
        }

        product_id = productRes.data.product_id;
    }
}

async function createVariationWithAvailability() {
    if (!product_id) return;

    // 1. Send variation data
    const variationData = {
        product_id,
        actual_price: document.getElementById("actualPrice").value,
        discounted_price: document.getElementById("discountedPrice").value,
        is_vartied: true,
        weight_variation: document.getElementById("weight").value
    };

    // Validate required fields
    if (!variationData.weight_variation || !variationData.actual_price || !variationData.discounted_price) {
        showToast('error', 'Error', 'Please fill all variation fields');
        return;
    }

    const [varSuccess, varRes] = await callApi("POST", add_product_variation_url, variationData, csrf_token);
    if (!varSuccess || !varRes.success) {
        showToast('error', 'Error', 'Failed to add variation');
        return;
    }

    const product_variation_id = varRes.data.product_variation_id;

    // 2. Prepare and send availability data separately
    const availability_data = [];

    pincodes.forEach(pincode => {
        const timeslot_data = {};
        timeslots.forEach(slot => {
            const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slot.id}`);
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`);

            if (checkbox) {
                timeslot_data[slot.id] = {
                    available: checkbox.checked,
                    charge: chargeInput.value || "50"
                };
            }
        });

        if (Object.keys(timeslot_data).length > 0) {
            availability_data.push({
                product_id,
                product_variation_id,
                pincode_id: pincode.id,
                timeslot_data,
                delivery_charges: "50",
                is_available: true
            });
        }
    });

    const availabilityPayload = {
        availability_data,
        product_id,
        product_variation_id
    };

    const [availSuccess, availRes] = await callApi("POST", availability_charges_url, availabilityPayload, csrf_token);
    if (!availSuccess || !availRes.success) {
        showToast('error', 'Error', 'Failed to set availability');
        return;
    }

    showToast('success', 'Success', 'Variation and availability added successfully!');
    
    // Reset form fields
    document.getElementById("weight").value = "";
    document.getElementById("actualPrice").value = "";
    document.getElementById("discountedPrice").value = "";
}

async function updateVariationWithAvailability(product_variation_id) {
    if (!product_id) return;

    // 1. Send variation data
    const variationData = {
        product_id,
        actual_price: document.getElementById("actualPrice").value,
        discounted_price: document.getElementById("discountedPrice").value,
        is_vartied: true,
        weight_variation: document.getElementById("weight").value
    };

    // Validate required fields
    if (!variationData.weight_variation || !variationData.actual_price || !variationData.discounted_price) {
        showToast('error', 'Error', 'Please fill all variation fields');
        return;
    }

    const [varSuccess, varRes] = await callApi("PUT", `${add_product_variation_url}${product_variation_id}/`, variationData, csrf_token);
    if (!varSuccess || !varRes.success) {
        showToast('error', 'Error', 'Failed to update variation');
        return;
    }

    // 2. Prepare and send availability data separately
    const availability_data = [];

    pincodes.forEach(pincode => {
        const timeslot_data = {};
        const availabilityInput = document.getElementById(`availability_${pincode.id}`);
        timeslots.forEach(slot => {
            const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slot.id}`);
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`);

            if (checkbox) {
                timeslot_data[slot.id] = {
                    available: checkbox.checked,
                    charge: chargeInput.value || "50"
                };
            }
        });

        if (Object.keys(timeslot_data).length > 0) {
            availability_data.push({
                product_id,
                product_variation_id: product_variation_id,
                pincode_id: pincode.id,
                timeslot_data,
                delivery_charges: "50",
                is_available: true,
                id: availabilityInput.value
            });
        }
    });

    const availabilityPayload = {
        availability_data,
        product_id,
        product_variation_id: product_variation_id
    };

    const [availSuccess, availRes] = await callApi("PUT", `${availability_charges_url}${product_variation_id}/`, availabilityPayload, csrf_token);
    if (!availSuccess || !availRes.success) {
        showToast('error', 'Error', 'Failed to update availability');
        return;
    }

    showToast('success', 'Success', 'Variation and availability updated successfully!');
    
    // Reset form and button state
    document.getElementById("weight").value = "";
    document.getElementById("actualPrice").value = "";
    document.getElementById("discountedPrice").value = "";
    document.getElementById("submitVariationBtn").innerHTML = '<i class="fas fa-plus-circle me-1"></i> Add Variation';
    document.getElementById("productVariationId").value = "";
    document.getElementById("product_variation_heading").innerText = 'Add Product Variation';
}

async function loadExistingVariations() {
    if (!product_id) return;

    const [success, result] = await callApi("GET", `${add_product_variation_url}?product_id=${product_id}`);
    if (!success || !result.success || !Array.isArray(result.data)) return;

    const container = document.getElementById("existingVariationsContainer");
    container.innerHTML = "";
    
    if (result.data.length === 0) return;
    
    const card = document.createElement("div");
    card.className = "card mb-4";
    
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
    `;
    
    container.appendChild(card);
    
    const tableBody = document.getElementById("variationTableBody");
    
    result.data.forEach(variation => {
        const row = document.createElement("tr");
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
        `;
        tableBody.appendChild(row);
    });
}

function copyAvailability(data, is_edit = false) {
    if (is_edit) {
        document.getElementById("actualPrice").value = data.actual_price;
        document.getElementById("discountedPrice").value = data.discounted_price;
        document.getElementById("weight").value = data.weight_variation;
        document.getElementById("submitVariationBtn").innerHTML = '<i class="fas fa-save me-1"></i> Update Variation';
        document.getElementById("productVariationId").value = data.product_variation_id;
        document.getElementById("product_variation_heading").innerText = `Update Variation - ${data.weight_variation}`;
    }
    else {
        document.getElementById("actualPrice").value = "";
        document.getElementById("discountedPrice").value = "";
        document.getElementById("weight").value = "";
        document.getElementById("submitVariationBtn").innerHTML = '<i class="fas fa-plus-circle me-1"></i> Add Variation';
        document.getElementById("productVariationId").value = "";
        document.getElementById("product_variation_heading").innerText = `Add Product Variation`;
    }
    
    copiedAvailability = data.availability_data;
    pincodes.forEach(pincode => {
        const pinData = copiedAvailability.find(d => d.pincode_id === pincode.id);
        if (!pinData) return;
        Object.entries(pinData.timeslot_data).forEach(([slotId, value]) => {
            const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slotId}`);
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slotId}`);
            const availabilityInput = document.getElementById(`availability_${pincode.id}`);
            if (checkbox) checkbox.checked = value.available;
            if (chargeInput) chargeInput.value = value.charge;
            if (availabilityInput) availabilityInput.value = pinData.id;
        });
    });
    
    // Scroll to variation section
    document.getElementById("variationSection").scrollIntoView({ behavior: 'smooth' });
    showToast('info', 'Info', is_edit ? 'Variation loaded for editing' : 'Availability settings copied');
}

// Theme functions from scripts.js
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('#theme-toggle i');
    
    if (body.classList.contains('ovenfresh-theme')) {
        body.classList.remove('ovenfresh-theme');
        body.classList.add('dark-theme');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        currentTheme = 'dark-theme';
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('ovenfresh-theme');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        currentTheme = 'ovenfresh-theme';
    }
    
    saveTheme();
    showToast('success', 'Theme Changed', `Switched to ${currentTheme === 'dark-theme' ? 'dark' : 'light'} theme`);
}

function saveTheme() {
    localStorage.setItem('shopAdminTheme', currentTheme);
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('shopAdminTheme');
    if (savedTheme && savedTheme !== 'ovenfresh-theme') {
        toggleTheme();
    }
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('show');
}

// Toast notification function from scripts.js
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
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
        if (toast.classList.contains('show')) {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }, 5000);
}

function getToastBgClass(type) {
    const classMap = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'primary'
    };
    return classMap[type] || 'primary';
}

function getToastIcon(type) {
    const iconMap = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    return iconMap[type] || 'fas fa-info-circle';
}

// Loading functions from scripts.js
function showLoading(message = 'Loading...') {
    let loadingEl = document.getElementById('globalLoading');
    
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'globalLoading';
        loadingEl.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
        loadingEl.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loadingEl.style.zIndex = '9999';
        
        loadingEl.innerHTML = `
            <div class="card p-4 shadow">
                <div class="d-flex align-items-center">
                    <div class="spinner-border text-primary me-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div id="loadingMessage">${message}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(loadingEl);
    } else {
        document.getElementById('loadingMessage').textContent = message;
        loadingEl.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingEl = document.getElementById('globalLoading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}