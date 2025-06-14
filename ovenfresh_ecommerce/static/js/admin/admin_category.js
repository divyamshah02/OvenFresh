let csrfToken = null;
let categoryUrl = null;
let subcategoryUrl = null;

function showToast(message, type = 'success') {
    const toastHTML = `
        <div class="toast align-items-center text-bg-${type} border-0 show" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>`;
    document.getElementById('toastContainer').innerHTML = toastHTML;
    setTimeout(() => {
        document.getElementById('toastContainer').innerHTML = "";
    }, 3000);
}

async function AdminManageCategory(csrfToken_params, categoryUrl_params, subcategoryUrl_param) {
    csrfToken = csrfToken_params;
    categoryUrl = categoryUrl_params;
    subcategoryUrl = subcategoryUrl_param;
    await fetchAndRenderCategories();
}

function openCategoryInput() {
    document.getElementById("newCategoryDiv").classList.remove("d-none");
    document.getElementById("newCategoryInput").value = "";
}

function cancelNewCategory() {
    document.getElementById("newCategoryDiv").classList.add("d-none");
}

async function saveNewCategory() {
    const title = document.getElementById("newCategoryInput").value.trim();
    if (!title) return showToast("Category title cannot be empty", "danger");

    const [Success, Res] = await callApi("POST", categoryUrl, { title }, csrfToken);
    if (Success && Res.success) {
        showToast("Category added successfully");
        cancelNewCategory();
        fetchAndRenderCategories();
    } else {
        showToast(Res?.error || "Failed to add category", "danger");
    }
}

async function saveNewSubCategory(catId, inputId) {
    const title = document.getElementById(inputId).value.trim();
    if (!title) return showToast("Subcategory title cannot be empty", "danger");

    const [Success, Res] = await callApi("POST", subcategoryUrl, { title, category_id: catId }, csrfToken);
    if (Success && Res.success) {
        showToast("Subcategory added");
        fetchAndRenderCategories();
    } else {
        showToast(Res?.error || "Failed to add subcategory", "danger");
    }
}

async function deleteItem(url, id, label) {
    const [Success, Res] = await callApi("DELETE", url, { id }, csrfToken);
    if (Success && Res.success) {
        showToast(`${label} deleted`);
        fetchAndRenderCategories();
    } else {
        showToast(Res?.error || `Failed to delete ${label}`, "danger");
    }
}

async function updateItem(url, id, newTitle, label) {
    const [Success, Res] = await callApi("PUT", `${url}${id}/`, { title: newTitle }, csrfToken);
    if (Success && Res.success) {
        showToast(`${label} updated`);
        fetchAndRenderCategories();
    } else {
        showToast(Res?.error || `Failed to update ${label}`, "danger");
    }
}

async function fetchAndRenderCategories() {
    const [Success, Res] = await callApi("GET", categoryUrl);
    if (!Success || !Res.success) return showToast("Failed to fetch categories", "danger");

    const categoryListDiv = document.getElementById("categoryList");
    categoryListDiv.innerHTML = "";

    Res.data.forEach((category, index) => {
        const catId = `cat-${index}`;
        let subHtml = category.subcategories.map(sub => `
            <tr>
                <td>
                    <input type="text" class="form-control form-control-sm" id="sub-edit-${sub.sub_category_id}" value="${sub.title}">
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="updateItem('${subcategoryUrl}', '${sub.sub_category_id}', document.getElementById('sub-edit-${sub.sub_category_id}').value, 'Subcategory')">
                            <i class="fas fa-check"></i> Save
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${subcategoryUrl}', '${sub.sub_category_id}', 'Subcategory')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");

        const subInputId = `sub-new-${category.category_id}`;
        categoryListDiv.innerHTML += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading${catId}">
                    <div class="d-flex align-items-center justify-content-between px-3 py-2 bg-light border rounded-top">
                        <input type="text" class="form-control form-control-sm me-2 w-50" id="cat-edit-${category.category_id}" value="${category.title}">
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm"
                                onclick="updateItem('${categoryUrl}', '${category.category_id}', document.getElementById('cat-edit-${category.category_id}').value, 'Category')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm"
                                onclick="deleteItem('${categoryUrl}', '${category.category_id}', 'Category')">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="accordion-button collapsed btn btn-sm ms-2"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapse${catId}"
                                aria-expanded="false"
                                aria-controls="collapse${catId}"
                                style="box-shadow: none; border: none;">
                                Sub Categories&nbsp;
                            </button>
                        </div>
                    </div>
                </h2>

                <div id="collapse${catId}" class="accordion-collapse collapse">
                    <div class="accordion-body">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Sub-Category</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subHtml}
                                    <tr>
                                        <td>
                                            <input type="text" class="form-control form-control-sm" id="${subInputId}" placeholder="New Subcategory Title">
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-success" onclick="saveNewSubCategory('${category.category_id}', '${subInputId}')">
                                                <i class="fas fa-plus"></i> Add
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}
