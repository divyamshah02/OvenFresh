let csrfToken = null;
let categoryUrl = null;
let subcategoryUrl = null;

async function AdminManageCategory(csrfToken_params, categoryUrl_params, subcategoryUrl_param) {
    csrfToken = csrfToken_params;
    categoryUrl = categoryUrl_params
    subcategoryUrl = subcategoryUrl_param

    await fetchAndRenderCategories();

}

async function fetchAndRenderCategories() {
    const [Success, Res] = await callApi("GET", categoryUrl);
    if (!Success || !Res.success) return alert("Failed to fetch categories.");

    const categoryListDiv = document.getElementById('categoryList');
    categoryListDiv.innerHTML = "";
    let catInd = 0;
    Res.data.forEach(category => {
        catInd++;
        const catDiv = document.createElement('div');
        catDiv.innerHTML = '';
        catDiv.innerHTML = `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading${catInd}">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                data-bs-target="#collapse${catInd}" aria-expanded="false" aria-controls="collapse${catInd}">
                                ${category.title}
                            </button>
                        </h2>
                        <div id="collapse${catInd}" class="accordion-collapse collapse" aria-labelledby="heading${catInd}"
                            data-bs-parent="#categoryList">
                            <div class="accordion-body">
                                <div class="mb-3">
                                    <div class="btn-group w-100">
                                        <button class="btn btn-sm btn-outline-primary p-2">
                                            <i class="fas fa-edit"></i> &nbsp; Edit
                                        </button>
                                        <button class="btn btn-sm btn-danger p-2">
                                            <i class="fas fa-trash"></i> &nbsp; Delete
                                        </button>
                                    </div>
                                    <div class="w-100 mt-2">
                                        <button class="btn btn-sm btn-primary p-2 w-100">
                                            <i class="fas fa-plus"></i> &nbsp; Add Subcategory
                                        </button>
                                    </div>
                                </div>

                                <div class="table-responsive">
                                    <table class="table table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>Sub-Category</th>                                                
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        ${category.subcategories.map(sub => `
                                            <tr>
                                                <td>                                                                                                    
                                                    <div>
                                                        <h6 class="mb-0">${sub.title}</h6>
                                                    </div>                                                    
                                                </td>
                                                <td>
                                                    <div class="btn-group">                                                    
                                                        <button type="button" class="btn btn-sm btn-outline-primary">
                                                            <i class="fas fa-edit"></i> &nbsp; Edit
                                                        </button>
                                                        <button type="button" class="btn btn-sm btn-outline-danger">
                                                            <i class="fas fa-trash"></i> &nbsp; Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>               
                                        `).join('')}                                                                                   
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
        `;
        // catDiv.innerHTML = `
        //         <h3>
        //             ${category.title}
        //             <button onclick="editCategory('${category.category_id}', '${category.title}')">Edit</button>
        //             <button onclick="deleteCategory('${category.category_id}')">Delete</button>
        //             <button onclick="openAddSubcategory('${category.category_id}')">Add Subcategory</button>
        //         </h3>
        //         <ul id="subcat-list-${category.category_id}">
        //             ${category.subcategories.map(sub => `
        //                 <li>
        //                     ${sub.title}
        //                     <button onclick="editSubcategory('${sub.sub_category_id}', '${sub.title}')">Edit</button>
        //                     <button onclick="deleteSubcategory('${sub.sub_category_id}')">Delete</button>
        //                 </li>
        //             `).join('')}
        //         </ul>
        //     `;
        categoryListDiv.appendChild(catDiv);
    });
}
