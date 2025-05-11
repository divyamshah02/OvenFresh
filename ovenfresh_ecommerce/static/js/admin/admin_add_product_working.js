let csrf_token = null;
let category_url = null;
let sub_category_url = null;
let pincode_timeslots_url = null;
let add_product_url = null;
let add_product_variation_url = null;
let availability_charges_url = null;

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

    document.getElementById("submitProductBtn").addEventListener("click", createProductWithVariation);
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

let pincodes = [];
let timeslots = [];

async function loadPincodesAndTimeslots() {
    const [success, result] = await callApi("GET", pincode_timeslots_url);
    if (success && result.success) {
        pincodes = result.data.pincodes;
        timeslots = result.data.timeslots;

        const pincodeContainer = document.getElementById("pincodeAvailability");

        pincodes.forEach(pincode => {
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
            pincodeContainer.appendChild(pincodeDiv);
        });
    }
}

async function createProductWithVariation() {
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

    const product_id = productRes.data.product_id;

    const variationData = {
        product_id: product_id,
        actual_price: document.getElementById("actualPrice").value,
        discounted_price: document.getElementById("discountedPrice").value,
        is_vartied: true,
        weight_variation: document.getElementById("weight").value
    };

    const [varSuccess, varRes] = await callApi("POST", add_product_variation_url, variationData, csrf_token);
    if (!varSuccess || !varRes.success) {
        alert("Failed to add product variation");
        return;
    }

    const product_variation_id = varRes.data.product_variation_id;

    // Step 3: Prepare Availability Data
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
    if (availSuccess && availRes.success) {
        alert("Product created successfully!");
    } else {
        alert("Failed to set availability");
    }
}
