export async function main(csrfToken, { categoryUrl, subcategoryUrl }) {
    const categoryListDiv = document.getElementById('categoryList');
    const categoryInput = document.getElementById('categoryNameInput');
    const addCategoryBtn = document.getElementById('addCategoryBtn');

    const editCategoryModal = document.getElementById('editCategoryModal');
    const editCategoryIdInput = document.getElementById('editCategoryId');
    const editCategoryInput = document.getElementById('editCategoryInput');
    const saveEditCategoryBtn = document.getElementById('saveEditCategoryBtn');

    const addSubcategoryModal = document.getElementById('addSubcategoryModal');
    const parentCategoryIdInput = document.getElementById('parentCategoryId');
    const addSubcategoryInput = document.getElementById('addSubcategoryInput');
    const saveAddSubcategoryBtn = document.getElementById('saveAddSubcategoryBtn');

    const editSubcategoryModal = document.getElementById('editSubcategoryModal');
    const editSubcategoryIdInput = document.getElementById('editSubcategoryId');
    const editSubcategoryInput = document.getElementById('editSubcategoryInput');
    const saveEditSubcategoryBtn = document.getElementById('saveEditSubcategoryBtn');

    async function fetchAndRenderCategories() {
        const [Success, Res] = await callApi("GET", categoryUrl);
        if (!Success || !Res.success) return alert("Failed to fetch categories.");

        categoryListDiv.innerHTML = "";
        Res.data.forEach(category => {
            const catDiv = document.createElement('div');
            catDiv.innerHTML = `
                <h3>
                    ${category.title}
                    <button onclick="editCategory('${category.category_id}', '${category.title}')">Edit</button>
                    <button onclick="deleteCategory('${category.category_id}')">Delete</button>
                    <button onclick="openAddSubcategory('${category.category_id}')">Add Subcategory</button>
                </h3>
                <ul id="subcat-list-${category.category_id}">
                    ${category.subcategories.map(sub => `
                        <li>
                            ${sub.title}
                            <button onclick="editSubcategory('${sub.sub_category_id}', '${sub.title}')">Edit</button>
                            <button onclick="deleteSubcategory('${sub.sub_category_id}')">Delete</button>
                        </li>
                    `).join('')}
                </ul>
            `;
            categoryListDiv.appendChild(catDiv);
        });
    }

    // Add new category
    addCategoryBtn.onclick = async () => {
        const title = categoryInput.value.trim();
        if (!title) return alert("Enter category name.");
        const [Success, Res] = await callApi("POST", categoryUrl, csrfToken, { title });
        if (Success && Res.success) {
            categoryInput.value = "";
            await fetchAndRenderCategories();
        } else {
            alert("Failed to add category.");
        }
    };

    // Open Edit Category
    window.editCategory = (id, title) => {
        editCategoryIdInput.value = id;
        editCategoryInput.value = title;
        editCategoryModal.style.display = "block";
    };

    saveEditCategoryBtn.onclick = async () => {
        const category_id = editCategoryIdInput.value;
        const title = editCategoryInput.value.trim();
        if (!title) return alert("Enter new category title.");
        const [Success, Res] = await callApi("PUT", categoryUrl, csrfToken, { category_id, title });
        if (Success && Res.success) {
            editCategoryModal.style.display = "none";
            await fetchAndRenderCategories();
        } else {
            alert("Failed to update category.");
        }
    };

    // Delete category
    window.deleteCategory = async (category_id) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        const [Success, Res] = await callApi("DELETE", categoryUrl, csrfToken, { category_id });
        if (Success && Res.success) {
            await fetchAndRenderCategories();
        } else {
            alert("Failed to delete category.");
        }
    };

    // Open Add Subcategory
    window.openAddSubcategory = (category_id) => {
        parentCategoryIdInput.value = category_id;
        addSubcategoryInput.value = "";
        addSubcategoryModal.style.display = "block";
    };

    saveAddSubcategoryBtn.onclick = async () => {
        const category_id = parentCategoryIdInput.value;
        const title = addSubcategoryInput.value.trim();
        if (!title) return alert("Enter subcategory name.");
        const [Success, Res] = await callApi("POST", subcategoryUrl, csrfToken, { category_id, title });
        if (Success && Res.success) {
            addSubcategoryModal.style.display = "none";
            await fetchAndRenderCategories();
        } else {
            alert("Failed to add subcategory.");
        }
    };

    // Open Edit Subcategory
    window.editSubcategory = (sub_category_id, title) => {
        editSubcategoryIdInput.value = sub_category_id;
        editSubcategoryInput.value = title;
        editSubcategoryModal.style.display = "block";
    };

    saveEditSubcategoryBtn.onclick = async () => {
        const sub_category_id = editSubcategoryIdInput.value;
        const title = editSubcategoryInput.value.trim();
        if (!title) return alert("Enter new subcategory title.");
        const [Success, Res] = await callApi("PUT", subcategoryUrl, csrfToken, { sub_category_id, title });
        if (Success && Res.success) {
            editSubcategoryModal.style.display = "none";
            await fetchAndRenderCategories();
        } else {
            alert("Failed to update subcategory.");
        }
    };

    // Delete subcategory
    window.deleteSubcategory = async (sub_category_id) => {
        if (!confirm("Are you sure you want to delete this subcategory?")) return;
        const [Success, Res] = await callApi("DELETE", subcategoryUrl, csrfToken, { sub_category_id });
        if (Success && Res.success) {
            await fetchAndRenderCategories();
        } else {
            alert("Failed to delete subcategory.");
        }
    };

    // Initial load
    fetchAndRenderCategories();
}
