
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

    await loadCategoriesAndSubcategories();
    await loadPincodesAndTimeslots();

    document.getElementById("submitProductBtn").addEventListener("click", async () => {
        if (!product_id) {
            await createProductMeta();  // creates product and sets product_id
        }
        await createVariationWithAvailability();
        await loadExistingVariations();
    });

    await loadExistingVariations();
}

async function loadCategoriesAndSubcategories() {
    const [catSuccess, catRes] = await callApi("GET", category_url);
    const [subCatSuccess, subCatRes] = await callApi("GET", sub_category_url);

    if (catSuccess && catRes.success) {
        const catSelect = document.getElementById("categorySelect");
        catRes.data.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.category_id;
            option.text = cat.title;
            catSelect.appendChild(option);
        });
    }

    if (subCatSuccess && subCatRes.success) {
        const subCatSelect = document.getElementById("subCategorySelect");
        subCatRes.data.forEach(sub => {
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
                <h4>Charge Tools</h4>
                <input type="number" id="universalCharge" placeholder="Set All Charges">
                <button onclick="applyUniversalCharge()">Apply to All</button>

                <input type="number" id="baseCharge" placeholder="Base">
                <input type="number" id="stepCharge" placeholder="Step">
                <button onclick="applyStepCharges()">Step Up Charges</button>

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
            pincodeDiv.innerHTML = `<h5>${pincode.area_name} - ${pincode.pincode}</h5>`;
            timeslots.forEach(slot => {
                const slotRow = `
                    <div>
                        <label>${slot.time_slot_title}</label>
                        <input type="checkbox" id="pincode_${pincode.id}_slot_${slot.id}" />
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

async function createProductMeta() {
    const productData = {
        title: document.getElementById("productTitle").value,
        description: document.getElementById("productDesc").value,
        photos: [document.getElementById("productPhoto").value],
        category_id: document.getElementById("categorySelect").value,
        sub_category_id: document.getElementById("subCategorySelect").value
    };

    const [productSuccess, productRes] = await callApi("POST", add_product_url, productData, csrf_token);
    if (!productSuccess || !productRes.success) {
        alert("Failed to create product");
        return;
    }
    product_id = productRes.data.product_id;
}

async function old_createVariationWithAvailability() {
    if (!product_id) return;

    const variationData = {
        product_id,
        actual_price: document.getElementById("actualPrice").value,
        discounted_price: document.getElementById("discountedPrice").value,
        is_vartied: true,
        weight_variation: document.getElementById("weight").value
    };

    const availability_data = [];

    pincodes.forEach(pincode => {
        const timeslot_data = {};
        timeslots.forEach(slot => {
            const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slot.id}`);
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slot.id}`);
            if (checkbox && checkbox.checked) {
                timeslot_data[slot.id] = {
                    available: true,
                    charge: chargeInput.value || "50"
                };
            }
        });

        if (Object.keys(timeslot_data).length > 0) {
            availability_data.push({
                pincode_id: pincode.id,
                timeslot_data,
                delivery_charges: "50",
                is_available: true
            });
        }
    });

    const payload = {
        product_id,
        variation_data: variationData,
        availability_data
    };

    const [success, res] = await callApi("POST", availability_charges_url, payload, csrf_token);
    if (!success || !res.success) {
        alert("Failed to add variation or availability");
    } else {
        alert("Variation added successfully");
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
            if (checkbox && checkbox.checked) {
                timeslot_data[slot.id] = {
                    available: true,
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


async function loadExistingVariations() {
    if (!product_id) return;

    const [success, result] = await callApi("GET", `${add_product_variation_url}?product_id=${product_id}`);
    if (!success || !result.success || !Array.isArray(result.data)) return;

    const section = document.getElementById("variationList") || document.createElement("div");
    section.id = "variationList";
    section.innerHTML = "<h3>Existing Variations</h3>";

    result.data.forEach(variation => {
        const block = document.createElement("div");
        block.innerHTML = `
            <div>
                <b>${variation.weight_variation}</b> - ₹${variation.discounted_price} <button onclick='copyAvailability(${JSON.stringify(variation.availability_data)})'>Copy</button>
            </div>`;
        section.appendChild(block);
    });

    document.body.appendChild(section);
}

function copyAvailability(data) {
    copiedAvailability = data;
    pincodes.forEach(pincode => {
        const pinData = data.find(d => d.pincode_id === pincode.id);
        if (!pinData) return;
        Object.entries(pinData.timeslot_data).forEach(([slotId, value]) => {
            const checkbox = document.getElementById(`pincode_${pincode.id}_slot_${slotId}`);
            const chargeInput = document.getElementById(`charge_${pincode.id}_${slotId}`);
            if (checkbox) checkbox.checked = true;
            if (chargeInput) chargeInput.value = value.charge;
        });
    });
}
