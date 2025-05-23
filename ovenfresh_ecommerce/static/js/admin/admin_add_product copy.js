/**
 * Admin Product Adder
 * Enhanced version with improved UI and functionality
 */

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

// Check for product_id in URL
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("product_id")) {
    product_id = urlParams.get("product_id");
}

// Declare bootstrap object
const bootstrap = {
    Toast: function(toastElement, options) {
        this.toastElement = toastElement;
        this.options = options;
        this.show = function() {
            this.toastElement.classList.add('show');
        };
    }
};

/**
 * Initialize the Admin Product Adder
 */
async function AdminAddProduct(
    csrf_token_param,
    category_url_param,
    sub_category_url_param,
    pincode_timeslots_url_param,
    add_product_url_param,
    add_product_variation_url_param,
    availability_charges_url_param
) {
    // Set global variables
    csrf_token = csrf_token_param;
    category_url = category_url_param;
    sub_category_url = sub_category_url_param;
    pincode_timeslots_url = pincode_timeslots_url_param;
    add_product_url = add_product_url_param;
    add_product_variation_url = add_product_variation_url_param;
    availability_charges_url = availability_charges_url_param;

    try {
        // Initialize UI with loading indicators
        showLoading("Loading data...");

        // If editing an existing product
        if (product_id) {
            await loadProductData();
            document.getElementById("variationSection").style.display = "block";
            document.getElementById("existingVariationsContainer").style.display = "block";
            document.getElementById("submitProductBtn").innerHTML = '<i class="fas fa-save me-1"></i> Update Product';
        }

        // Load initial data
        await Promise.all([
            loadCategoriesAndSubcategories(),
            loadPincodesAndTimeslots()
        ]);

        // Set up event listeners
        setupEventListeners();

        // Load existing variations if product_id exists
        if (product_id) {
            await loadExistingVariations();
        }

        hideLoading();
    } catch (error) {
        console.error("Initialization error:", error);
        showToast("Error initializing page. Please try again.", "error");
        hideLoading();
    }
}

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
    // Product form submission
    document.getElementById("submitProductBtn").addEventListener("click", async () => {
        showLoading("Saving product...");
        try {
            if (!product_id) {
                await createProductMeta();  // creates product and sets product_id
            } else {
                await createProductMeta(true);  // updates product
            }
            
            await loadProductData();
            document.getElementById("variationSection").style.display = "block";
            document.getElementById("existingVariationsContainer").style.display = "block";
            
            await loadExistingVariations();
            hideLoading();
            showToast(product_id ? "Product updated successfully!" : "Product created successfully!", "success");
        } catch (error) {
            console.error("Error saving product:", error);
            showToast("Error saving product. Please try again.", "error");
            hideLoading();
        }
    });

    // Variation form submission
    document.getElementById("submitVariationBtn").addEventListener("click", async () => {
        if (!product_id) {
            showToast("Please create a product first.", "warning");
            return;
        }

        showLoading("Saving variation...");
        try {
            const variationId = document.getElementById("productVariationId").value;
            if (variationId) {
                await updateVariationWithAvailability(variationId);
            } else {
                await createVariationWithAvailability();
            }
            
            await loadExistingVariations();
            
            // Reset form after successful submission
            document.getElementById("weight").value = "";
            document.getElementById("actualPrice").value = "";
            document.getElementById("discountedPrice").value = "";
            document.getElementById("productVariationId").value = "";
            document.getElementById("product_variation_heading").innerText = "Add Product Variation";
            document.getElementById("submitVariationBtn").innerHTML = '<i class="fas fa-plus me-1"></i> Add Variation';
            
            hideLoading();
            showToast(variationId ? "Variation updated successfully!" : "Variation added successfully!", "success");
        } catch (error) {
            console.error("Error saving variation:", error);
            showToast("Error saving variation. Please try again.", "error");
            hideLoading();
        }
    });

    // Category change event
    document.getElementById("categorySelect").addEventListener("change", handleCategoryChange);
}

/**
 * Load product data for editing
 */
async function loadProductData() {
    showLoading("Loading product data...");
    
    try {
        const [Success, Res] = await callApi("GET", `${add_product_url}?product_id=${product_id}`);

        if (Success && Res.success) {
            console.log("Product data loaded:", Res.data);
            
            document.getElementById('productTitle').value = Res.data.title;
            document.getElementById('productDesc').value = Res.data.description;
            document.getElementById('productPhoto').value = Res.data.photos;
            
            // Wait for categories to load before setting values
            if (categoryData.length === 0) {
                await loadCategoriesAndSubcategories();
            }
            
            document.getElementById('categorySelect').value = Res.data.category_id;
            
            // Trigger category change to load subcategories
            handleCategoryChange({ target: document.getElementById('categorySelect') });
            
            // Set subcategory after a small delay to ensure subcategories are loaded
            setTimeout(() => {
                document.getElementById('subCategorySelect').value = Res.data.sub_category_id;
            }, 300);

            document.getElementById('submitProductBtn').innerHTML = '<i class="fas fa-save me-1"></i> Update Product';
            
            hideLoading();
            return Res.data;
        } else {
            throw new Error("Failed to load product data");
        }
    } catch (error) {
        console.error("Error loading product data:", error);
        showToast("Error loading product data. Please try again.", "error");
        hideLoading();
        return null;
    }
}

/**
 * Load categories and subcategories
 */
async function loadCategoriesAndSubcategories() {
    try {
        const [catSuccess, catRes] = await callApi("GET", category_url);

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

            return categoryData;
        } else {
            throw new Error("Failed to load categories");
        }
    } catch (error) {
        console.error("Error loading categories:", error);
        showToast("Error loading categories. Please try again.", "error");
        return [];
    }
}

/**
 * Handle category change event
 */
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
        subCatSelect.disabled = false;
    } else {
        subCatSelect.disabled = true;
    }
}

/**
 * Load pincodes and timeslots
 */
async function loadPincodesAndTimeslots() {
    try {
        const [success, result] = await callApi("GET", pincode_timeslots_url);
        if (success && result.success) {
            pincodes = result.data.pincodes;
            timeslots = result.data.timeslots;

            // Populate timeslot dropdown in the tools section
            const timeslotSelect = document.getElementById("disableTimeslot");
            timeslotSelect.innerHTML = `<option value="">Select Timeslot to Disable</option>`;
            timeslots.forEach(ts => {
                const option = document.createElement("option");
                option.value = ts.id;
                option.text = ts.time_slot_title;
                timeslotSelect.appendChild(option);
            });

            // Create pincode availability UI
            renderPincodeAvailabilityUI();
            
            return { pincodes, timeslots };
        } else {
            throw new Error("Failed to load pincodes and timeslots");
        }
    } catch (error) {
        console.error("Error loading pincodes and timeslots:", error);
        showToast("Error loading delivery options. Please try again.", "error");
        return { pincodes: [], timeslots: [] };
    }
}

/**
 * Render pincode availability UI
 */
function renderPincodeAvailabilityUI() {
    const container = document.getElementById("pincodeAvailability");
    container.innerHTML = "";

    pincodes.forEach((pincode) => {
        const pincodeCard = document.createElement("div");
        pincodeCard.className = "card mb-3";
        pincodeCard.id = `pincode_${pincode.id}`;
        
        // Card header
        const cardHeader = document.createElement("div");
        cardHeader.className = "card-header";
        cardHeader.innerHTML = `<h5 class="mb-0">${pincode.area_name} - ${pincode.pincode}</h5>`;
        
        // Card body
        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        
        // Hidden input for availability ID
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.id = `availability_${pincode.id}`;
        hiddenInput.value = "";
        cardBody.appendChild(hiddenInput);
        
        // Create row for timeslots
        const row = document.createElement("div");
        row.className = "row";
        
        // Add timeslots
        timeslots.forEach(slot => {
            const col = document.createElement("div");
            col.className = "col-md-4 mb-3";
            
            // Checkbox for availability
            const checkboxDiv = document.createElement("div");
            checkboxDiv.className = "form-check";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input timeslot-checkbox";
            checkbox.id = `pincode_${pincode.id}_slot_${slot.id}`;
            
            const label = document.createElement("label");
            label.className = "form-check-label";
            label.htmlFor = checkbox.id;
            label.textContent = slot.time_slot_title;
            
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            col.appendChild(checkboxDiv);
            
            // Input for charge
            const inputGroup = document.createElement("div");
            inputGroup.className = "input-group mt-1";
            
            const inputGroupText = document.createElement("span");
            inputGroupText.className = "input-group-text";
            inputGroupText.textContent = "₹";
            
            const input = document.createElement("input");
            input.type = "number";
            input.className = "form-control";
            input.id = `charge_${pincode.id}_${slot.id}`;
            input.value = "50";
            
            inputGroup.appendChild(inputGroupText);
            inputGroup.appendChild(input);
            col.appendChild(inputGroup);
            
            row.appendChild(col);
        });
        
        cardBody.appendChild(row);
        pincodeCard.appendChild(cardHeader);
        pincodeCard.appendChild(cardBody);
        container.appendChild(pincodeCard);
    });
}

/**
 * Create or update product metadata
 */
async function createProductMeta(is_update = false) {
    if (is_update && !product_id) return;

    // Validate form
    const title = document.getElementById("productTitle").value;
    const description = document.getElementById("productDesc").value;
    const photo = document.getElementById("productPhoto").value;
    const category_id = document.getElementById("categorySelect").value;
    const sub_category_id = document.getElementById("subCategorySelect").value;

    if (!title || !description || !category_id || !sub_category_id) {
        showToast("Please fill all required fields", "error");
        return;
    }

    const productData = {
        title,
        description,
        photos: [photo],
        category_id,
        sub_category_id,
    };

    if (is_update) {
        const [updateProductSuccess, updateProductRes] = await callApi("PUT", `${add_product_url}${product_id}/`, productData, csrf_token);
        if (!updateProductSuccess || !updateProductRes.success) {
            showToast("Failed to update product", "error");
            return;
        }
        showToast("Product updated successfully!", "success");
    } else {
        const [productSuccess, productRes] = await callApi("POST", add_product_url, productData, csrf_token);
        if (!productSuccess || !productRes.success) {
            showToast("Failed to create product", "error");
            return;
        }

        product_id = productRes.data.product_id;
        showToast("Product created successfully!", "success");
    }
}

/**
 * Create a new product variation with availability
 */
async function createVariationWithAvailability() {
    if (!product_id) {
        showToast("Please create a product first", "error");
        return;
    }

    // Validate form
    const weight = document.getElementById("weight").value;
    const actual_price = document.getElementById("actualPrice").value;
    const discounted_price = document.getElementById("discountedPrice").value;

    if (!weight || !actual_price || !discounted_price) {
        showToast("Please fill all required variation fields", "error");
        return;
    }

    // 1. Send variation data
    const variationData = {
        product_id,
        actual_price,
        discounted_price,
        is_vartied: true,
        weight_variation: weight
    };

    const [varSuccess, varRes] = await callApi("POST", add_product_variation_url, variationData, csrf_token);
    if (!varSuccess || !varRes.success) {
        showToast("Failed to add variation", "error");
        return;
    }

    const product_variation_id = varRes.data.product_variation_id;

    // 2. Prepare and send availability data
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
        showToast("Failed to set availability", "error");
        return;
    }

    showToast("Variation and availability added successfully!", "success");
}

/**
 * Update an existing product variation with availability
 */
async function updateVariationWithAvailability(product_variation_id) {
    if (!product_id) {
        showToast("Please create a product first", "error");
        return;
    }

    // Validate form
    const weight = document.getElementById("weight").value;
    const actual_price = document.getElementById("actualPrice").value;
    const discounted_price = document.getElementById("discountedPrice").value;

    if (!weight || !actual_price || !discounted_price) {
        showToast("Please fill all required variation fields", "error");
        return;
    }

    // 1. Send variation data
    const variationData = {
        product_id,
        actual_price,
        discounted_price,
        is_vartied: true,
        weight_variation: weight
    };

    const [varSuccess, varRes] = await callApi("PUT", `${add_product_variation_url}${product_variation_id}/`, variationData, csrf_token);
    if (!varSuccess || !varRes.success) {
        showToast("Failed to update variation", "error");
        return;
    }

    // 2. Prepare and send availability data
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
                product_variation_id,
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
        product_variation_id
    };

    const [availSuccess, availRes] = await callApi("PUT", `${availability_charges_url}${product_variation_id}/`, availabilityPayload, csrf_token);
    if (!availSuccess || !availRes.success) {
        showToast("Failed to update availability", "error");
        return;
    }

    showToast("Variation and availability updated successfully!", "success");
}

/**
 * Load existing variations for a product
 */
async function loadExistingVariations() {
    if (!product_id) return;

    try {
        const [success, result] = await callApi("GET", `${add_product_variation_url}?product_id=${product_id}`);
        if (!success || !result.success || !Array.isArray(result.data)) {
            throw new Error("Failed to load variations");
        }

        const container = document.getElementById("existingVariationsContainer");
        container.style.display = "block";
        
        const variationList = document.getElementById("variationList");
        variationList.innerHTML = "";
        
        if (result.data.length === 0) {
            variationList.innerHTML = '<div class="alert alert-info">No variations found. Add your first variation below.</div>';
            return;
        }

        // Create a table for variations
        const table = document.createElement("table");
        table.className = "table table-hover align-middle";
        
        // Table header
        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
                <th>Weight</th>
                <th>Actual Price</th>
                <th>Discounted Price</th>
                <th>Actions</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Table body
        const tbody = document.createElement("tbody");
        
        result.data.forEach(variation => {
            const tr = document.createElement("tr");
            
            // Weight column
            const tdWeight = document.createElement("td");
            tdWeight.textContent = variation.weight_variation;
            tr.appendChild(tdWeight);
            
            // Actual price column
            const tdActual = document.createElement("td");
            tdActual.textContent = `₹${variation.actual_price}`;
            tr.appendChild(tdActual);
            
            // Discounted price column
            const tdDiscounted = document.createElement("td");
            tdDiscounted.textContent = `₹${variation.discounted_price}`;
            tr.appendChild(tdDiscounted);
            
            // Actions column
            const tdActions = document.createElement("td");
            tdActions.innerHTML = `
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick='copyAvailability(${JSON.stringify(variation)}, false)'>
                        <i class="fas fa-copy me-1"></i> Copy
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick='copyAvailability(${JSON.stringify(variation)}, true)'>
                        <i class="fas fa-edit me-1"></i> Edit
                    </button>
                </div>
            `;
            tr.appendChild(tdActions);
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        variationList.appendChild(table);
        
    } catch (error) {
        console.error("Error loading variations:", error);
        showToast("Error loading variations. Please try again.", "error");
    }
}

/**
 * Copy availability settings from one variation to another
 */
function copyAvailability(data, is_edit = false) {
    if (is_edit) {
        document.getElementById("actualPrice").value = data.actual_price;
        document.getElementById("discountedPrice").value = data.discounted_price;
        document.getElementById("weight").value = data.weight_variation;
        document.getElementById("submitVariationBtn").innerHTML = '<i class="fas fa-save me-1"></i> Update Variation';
        document.getElementById("productVariationId").value = data.product_variation_id;
        document.getElementById("product_variation_heading").innerText = `Update Variation - ${data.weight_variation}`;
    } else {
        document.getElementById("actualPrice").value = "";
        document.getElementById("discountedPrice").value = "";
        document.getElementById("weight").value = "";
        document.getElementById("submitVariationBtn").innerHTML = '<i class="fas fa-plus me-1"></i> Add Variation';
        document.getElementById("productVariationId").value = "";
        document.getElementById("product_variation_heading").innerText = `Add Product Variation`;
    }
    
    copiedAvailability = data.availability_data;
    
    // Reset all checkboxes and charges first
    pincodes.forEach(pincode => {
        timeslots.forEach(slot => {
            const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slot.id}`);
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`);
            if (checkbox) checkbox.checked = false;
            if (chargeInput) chargeInput.value = "50";
        });
    });
    
    // Apply copied availability data
    if (copiedAvailability && Array.isArray(copiedAvailability)) {
        pincodes.forEach(pincode => {
            const pinData = copiedAvailability.find(d => d.pincode_id === pincode.id);
            if (!pinData) return;
            
            // Set availability ID
            const availabilityInput = document.getElementById(`availability_${pincode.id}`);
            if (availabilityInput) availabilityInput.value = pinData.id || "";
            
            // Set timeslot data
            Object.entries(pinData.timeslot_data).forEach(([slotId, value]) => {
                const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slotId}`);
                const chargeInput = document.getElementById(`charge_${pincode.id}_slot_${slotId}`);
                
                if (checkbox) checkbox.checked = value.available;
                if (chargeInput) chargeInput.value = value.charge;
            });
        });
    }
    
    // Scroll to variation form
    document.getElementById("variationSection").scrollIntoView({ behavior: 'smooth' });
    
    showToast(is_edit ? "Variation loaded for editing" : "Availability settings copied", "info");
}

/**
 * Utility function: Select all timeslots for all pincodes
 */
function selectAllTimeslots() {
    document.querySelectorAll(".timeslot-checkbox").forEach(checkbox => {
        checkbox.checked = true;
    });
    showToast("All timeslots selected", "info");
}

/**
 * Utility function: Apply the same charge to all timeslots
 */
function applyUniversalCharge() {
    const charge = document.getElementById("universalCharge").value;
    if (!charge) {
        showToast("Please enter a charge amount", "warning");
        return;
    }
    
    pincodes.forEach(pincode => {
        timeslots.forEach(slot => {
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`);
            if (chargeInput) chargeInput.value = charge;
        });
    });
    
    showToast(`Charge of ₹${charge} applied to all timeslots`, "info");
}

/**
 * Utility function: Apply stepped charges based on pincode index
 */
function applyStepCharges() {
    const base = parseInt(document.getElementById("baseCharge").value);
    const step = parseInt(document.getElementById("stepCharge").value);
    
    if (isNaN(base) || isNaN(step)) {
        showToast("Please enter valid base and step values", "warning");
        return;
    }

    pincodes.forEach((pincode, index) => {
        const stepValue = base + index * step;
        timeslots.forEach(slot => {
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`);
            if (chargeInput) chargeInput.value = stepValue;
        });
    });
    
    showToast(`Step charges applied starting from ₹${base} with step ₹${step}`, "info");
}

/**
 * Utility function: Disable a specific timeslot for all pincodes
 */
function disableTimeslotForAll() {
    const tsId = document.getElementById("disableTimeslot").value;
    if (!tsId) {
        showToast("Please select a timeslot to disable", "warning");
        return;
    }
    
    pincodes.forEach(pincode => {
        const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${tsId}`);
        if (checkbox) checkbox.checked = false;
    });
    
    const timeslotName = timeslots.find(ts => ts.id.toString() === tsId)?.time_slot_title || "Selected timeslot";
    showToast(`${timeslotName} disabled for all pincodes`, "info");
}

/**
 * Show loading indicator
 */
function showLoading(message = "Loading...") {
    // Check if loading element already exists
    let loadingEl = document.getElementById("loadingIndicator");
    
    if (!loadingEl) {
        loadingEl = document.createElement("div");
        loadingEl.id = "loadingIndicator";
        loadingEl.className = "position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center";
        loadingEl.style.backgroundColor = "rgba(0,0,0,0.5)";
        loadingEl.style.zIndex = "9999";
        
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
        document.getElementById("loadingMessage").textContent = message;
        loadingEl.style.display = "flex";
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    const loadingEl = document.getElementById("loadingIndicator");
    if (loadingEl) {
        // loadingEl.style.display = "none";
        loadingEl.remove();
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = "info") {
    // Check if toast container exists
    let toastContainer = document.getElementById("toastContainer");
    
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toastContainer";
        toastContainer.className = "position-fixed bottom-0 end-0 p-3";
        toastContainer.style.zIndex = "9999";
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement("div");
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${getToastBgClass(type)} border-0`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="${getToastIcon(type)} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000
    });
    
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function () {
        toast.remove();
    });
}

/**
 * Get toast background class based on type
 */
function getToastBgClass(type) {
    switch (type) {
        case "success": return "success";
        case "error": return "danger";
        case "warning": return "warning";
        case "info": 
        default: return "primary";
    }
}

/**
 * Get toast icon based on type
 */
function getToastIcon(type) {
    switch (type) {
        case "success": return "fas fa-check-circle";
        case "error": return "fas fa-exclamation-circle";
        case "warning": return "fas fa-exclamation-triangle";
        case "info": 
        default: return "fas fa-info-circle";
    }
}