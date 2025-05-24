
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
        if (!product_id) {
            await createProductMeta();  // creates product and sets product_id
        }
        else {
            await createProductMeta(true);  // updates product
        }
        await loadProductData();
        // await createVariationWithAvailability();
        document.getElementById("variationSection").style.display = "";

        await loadExistingVariations();
    });


    document.getElementById("submitVariationBtn").addEventListener("click", async () => {
        if (!product_id) {
            alert("Please create a product first.");
        }

        if (document.getElementById("productVariationId").value) {
            await updateVariationWithAvailability(document.getElementById("productVariationId").value);
        }
        else {
            await createVariationWithAvailability();
        }
        
        await loadExistingVariations();
    });

    await loadExistingVariations();
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

        document.getElementById('submitProductBtn').innerText = "Update Product";
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

        // Header options
        const tools = `
            <div>
                <h4>Tools</h4>
                <button onclick="selectAllTimeslots()">Available on all timeslots & pincodes</button>
                <br>

                <input type="number" id="universalCharge" placeholder="Set All Charges">
                <button onclick="applyUniversalCharge()">Apply to All</button>
                <br>

                <input type="number" id="baseCharge" placeholder="Base">
                <input type="number" id="stepCharge" placeholder="Step">
                <button onclick="applyStepCharges()">Step Up Charges</button>
                <br>

                <select id="disableTimeslot">
                    <option disabled selected>Select Timeslot to Disable</option>
                    ${timeslots.map(ts => `<option value="${ts.id}">${ts.time_slot_title}</option>`).join("")}
                </select>
                <button onclick="disableTimeslotForAll()">Disable Timeslot</button>
            </div>
            <hr>`;
        container.innerHTML += tools;

        pincodes.forEach((pincode, i) => {
            const pincodeDiv = document.createElement("div");
            pincodeDiv.innerHTML = `<h5>${pincode.area_name} - ${pincode.pincode}</h5> <input type="hidden" id="availability_${pincode.id}" value="" />`;
            timeslots.forEach(slot => {
                const slotRow = `
                    <div>
                        <label>${slot.time_slot_title}</label>
                        <input type="checkbox" id="pincode_${pincode.id}_slot_${slot.id}" class="timeslot-checkbox"/>
                        Charge: <input type="number" id="charge_${pincode.id}_${slot.id}" value="50" />                        
                    </div>`;
                pincodeDiv.innerHTML += slotRow;
            });
            container.appendChild(pincodeDiv);
        });
    }
}

function applyUniversalCharge() {
    const charge = document.getElementById("universalCharge").value;
    if (!charge) return;
    pincodes.forEach(pincode => {
        timeslots.forEach(slot => {
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`);
            if (chargeInput) chargeInput.value = charge;
        });
    });
}

function selectAllTimeslots() {
    document.querySelectorAll(".timeslot-checkbox").forEach(checkbox => {
        checkbox.checked = true;
    });
}

function applyStepCharges() {
    const base = parseInt(document.getElementById("baseCharge").value);
    const step = parseInt(document.getElementById("stepCharge").value);
    if (isNaN(base) || isNaN(step)) return;

    pincodes.forEach((pincode, index) => {
        const stepValue = base + index * step;
        timeslots.forEach(slot => {
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`);
            if (chargeInput) chargeInput.value = stepValue;
        });
    });
}

function disableTimeslotForAll() {
    const tsId = document.getElementById("disableTimeslot").value;
    if (!tsId) return;
    pincodes.forEach(pincode => {
        const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${tsId}`);
        if (checkbox) checkbox.checked = false;
    });
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

    if (is_update) {
        const [updateProductSuccess, updateProductRes] = await callApi("PUT", `${add_product_url}${product_id}/`, productData, csrf_token);
        if (!updateProductSuccess || !updateProductRes.success) {
            alert("Failed to update product");
            return;
        }

        // product_id = updateProductRes.data.product_id;
    }
    else {
        const [productSuccess, productRes] = await callApi("POST", add_product_url, productData, csrf_token);
        if (!productSuccess || !productRes.success) {
            alert("Failed to create product");
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

    const [varSuccess, varRes] = await callApi("POST", add_product_variation_url, variationData, csrf_token);
    if (!varSuccess || !varRes.success) {
        alert("Failed to add variation");
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
            // if (checkbox && checkbox.checked) {
            //     timeslot_data[slot.id] = {
            //         available: true,
            //         charge: chargeInput.value || "50"
            //     };
            // }

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
        alert("Failed to set availability");
        return;
    }

    alert("Variation and availability added successfully!");
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

    const [varSuccess, varRes] = await callApi("PUT", `${add_product_variation_url}${product_variation_id}/`, variationData, csrf_token);
    if (!varSuccess || !varRes.success) {
        alert("Failed to update variation");
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
            // if (checkbox && checkbox.checked) {
            //     timeslot_data[slot.id] = {
            //         available: true,
            //         charge: chargeInput.value || "50"
            //     };
            // }

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

    console.log(product_variation_id);
    const availabilityPayload = {
        availability_data,
        product_id,
        product_variation_id: product_variation_id
    };

    const [availSuccess, availRes] = await callApi("PUT", `${availability_charges_url}${product_variation_id}/`, availabilityPayload, csrf_token);
    if (!availSuccess || !availRes.success) {
        alert("Failed to update availability");
        return;
    }

    alert("Variation and availability updated successfully!");
}

async function loadExistingVariations() {
    if (!product_id) return;

    const [success, result] = await callApi("GET", `${add_product_variation_url}?product_id=${product_id}`);
    if (!success || !result.success || !Array.isArray(result.data)) return;

    const section = document.getElementById("variationList") || document.createElement("div");
    
    const heading = document.createElement("h3");
    heading.innerText = "Existing Variations";
    section.appendChild(heading);

    // const section = document.getElementById("variationList");
    section.id = "variationList";
    // section.innerHTML = "<h3>Existing Variations</h3>";

    result.data.forEach(variation => {
        const block = document.createElement("div");
        block.innerHTML = `
            <div>
                <b>${variation.weight_variation}</b> - ₹${variation.discounted_price} <button onclick='copyAvailability(${JSON.stringify(variation)})'>Copy</button> <button onclick='copyAvailability(${JSON.stringify(variation)}, true)'>Edit</button>
            </div>`;
        section.appendChild(block);
    });

    const hr = document.createElement("hr");
    section.appendChild(hr);
    // document.body.appendChild(section);
    document.getElementById("existingVariationsContainer").appendChild(section);
}

function copyAvailability(data, is_edit = false) {
    if (is_edit) {
        document.getElementById("actualPrice").value = data.actual_price;
        document.getElementById("discountedPrice").value = data.discounted_price;
        document.getElementById("weight").value = data.weight_variation;
        document.getElementById("submitVariationBtn").innerText = "Update Variation";
        document.getElementById("productVariationId").value = data.product_variation_id;
        document.getElementById("product_variation_heading").innerText = `Update Variation - ${data.weight_variation}`;
    }
    else {
        document.getElementById("actualPrice").value = "";
        document.getElementById("discountedPrice").value = "";
        document.getElementById("weight").value = "";
        document.getElementById("submitVariationBtn").innerText = "Add Variation";
        document.getElementById("productVariationId").value = "";
        document.getElementById("product_variation_heading").innerText = `Add Product Variation`;
    }
    copiedAvailability = data.availability_data;
    pincodes.forEach(pincode => {
        const pinData = copiedAvailability.find(d => d.pincode_id === pincode.id);
        if (!pinData) return;
        Object.entries(pinData.timeslot_data).forEach(([slotId, value, id]) => {
            const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slotId}`);
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slotId}`);
            const availabilityInput = document.getElementById(`availability_${pincode.id}`);
            if (checkbox) checkbox.checked = value.available;
            if (chargeInput) chargeInput.value = value.charge;
            if (availabilityInput) availabilityInput.value = pinData.id;
        });
    });
}
