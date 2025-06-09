// Sample products data
const default_products = [
    {
        id: 1,
        name: "Chocolate Truffle Cake",
        price: 35.99,
        category: "cakes",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1089&q=80",
        badge: "Hot Selling",
        badgeClass: "bg-danger",
        rating: 4.5,
        reviews: 42
    },
    {
        id: 2,
        name: "Luxury Chocolate Box",
        price: 29.99,
        category: "chocolates",
        image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
        rating: 5,
        reviews: 56
    },
    {
        id: 3,
        name: "Red Velvet Cake",
        price: 32.99,
        category: "cakes",
        image: "https://loveandcheesecake.com/cdn/shop/files/RedVelvetCheesecakecopy.jpg",
        badge: "New",
        badgeClass: "bg-success",
        rating: 4,
        reviews: 38
    },
    {
        id: 4,
        name: "Deluxe Gift Hamper",
        price: 79.99,
        category: "gifts",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=765&q=80",
        rating: 4.5,
        reviews: 27
    },
    {
        id: 5,
        name: "Fresh Fruit Pastries",
        price: 18.99,
        category: "pastries",
        image: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
        rating: 4.2,
        reviews: 23
    },
    {
        id: 6,
        name: "Birthday Special Cake",
        price: 45.99,
        category: "cakes",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1089&q=80",
        badge: "Popular",
        badgeClass: "bg-warning",
        rating: 4.8,
        reviews: 65
    },
    {
        id: 7,
        name: "Artisan Chocolate Collection",
        price: 55.99,
        category: "chocolates",
        image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
        rating: 4.7,
        reviews: 34
    },
    {
        id: 8,
        name: "Wedding Cake Special",
        price: 120.99,
        category: "cakes",
        image: "https://www.shutterstock.com/image-photo/beautiful-wedding-cake-champagne-glasses-260nw-2337005657.jpg",
        badge: "Premium",
        badgeClass: "bg-primary",
        rating: 4.9,
        reviews: 18
    }
];

let csrf_token = null;
let all_products_url = null;
let category_url = null;
let cart_list_url = null;
// let products = [...default_products]; // Initialize with default products
let products = []; // Initialize with default products

let displayedProducts = 0;
const productsPerPage = 8;
let filteredProducts = [];


async function Shop(csrf_token_param, all_products_url_param, category_url_param, cart_list_url_param) {
    csrf_token = csrf_token_param;
    all_products_url = all_products_url_param;
    category_url = category_url_param;
    cart_list_url = cart_list_url_param;

    const [success, res] = await callApi("GET", all_products_url);
    if (success && res.success) {
        products = res.data;
        filteredProducts = [...products];

        console.log("Products loaded successfully:", products);
        loadProducts();
    } else {
        console.error("Failed to load products:", res.message);
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


// function addToCart(productId) {
//     const product = products.find(p => p.id === productId);
//     const existingItem = cart.find(item => item.id === productId);

//     if (existingItem) {
//         existingItem.quantity += 1;
//     } else {
//         cart.push({
//             id: product.id,
//             name: product.name,
//             price: product.price,
//             image: product.image,
//             quantity: 1
//         });
//     }

//     localStorage.setItem('cart', JSON.stringify(cart));
//     updateCartCount();

//     // Show success message
//     alert('Product added to cart!');
// }


async function AddToCart(product_id, product_variation_id, qty=1) {
    if (!product_variation_id || qty < 1) {
        showNotification("Invalid product or quantity.", "error");
        return false;
    }

    try {
        const bodyData = {
            product_id: product_id,
            product_variation_id: product_variation_id,
            qty: qty
        };

        const [success, result] = await callApi("POST", cart_list_url, bodyData, csrf_token);
        if (success && result.success) {
            showNotification("Item added to cart!", "success");
            // Refresh cart if we're on cart page
            if (document.getElementById('cart-items')) {
                // await GenerateCart(csrf_token, cart_list_url, pincode_check_url);
            } else {
                // Just update cart count if we're on other pages
                updateCartCountFromAPI();
            }
            return true;
        } else {
            showNotification(result.error || "Failed to add item to cart.", "error");
            console.error(result);
            return false;
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        showNotification("Error adding item to cart.", "error");
        return false;
    }
}

async function updateCartCountFromAPI() {
    try {
        const [success, result] = await callApi("GET", cart_list_url);
        if (success && result.success) {
            const cartItems = result.data.cart_items || [];
            updateCartCount(cartItems);
        }
    } catch (error) {
        console.error("Error updating cart count:", error);
    }
}

function updateCartCount(cartItems) {
    console.log(cartItems);
    const cartCount = cartItems.reduce((total, item) => total + parseInt(item.quantity), 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

function createProductCard(product) {
    const stars = Array.from({ length: 5 }, (_, i) => {
        if (i < Math.floor(product.rating)) {
            return '<i class="fas fa-star"></i>';
        } else if (i < product.rating) {
            return '<i class="fas fa-star-half-alt"></i>';
        } else {
            return '<i class="far fa-star"></i>';
        }
    }).join('');

    const badge = product.badge ?
        `<span class="badge ${product.badgeClass} position-absolute top-0 end-0 mt-2 me-2">${product.badge}</span>` : '';

    return `
                <div class="col-md-6 col-lg-3">
                    <div class="product-card">
                        <div class="product-img">
                            ${badge}
                            <img src="${product.photos[0]}" alt="${product.title}" class="img-fluid">
                            <div class="product-actions">
                                <a href="#" class="btn-product-action"><i class="fas fa-heart"></i></a>
                                <a href="#" class="btn-product-action" onclick="AddToCart(${product.product_id}, ${product.product_variation_id})"><i class="fas fa-shopping-cart"></i></a>
                                <a href="/product-detail/?product_id=${product.product_id}" class="btn-product-action"><i class="fas fa-eye"></i></a>
                            </div>
                        </div>
                        <div class="product-body">
                            <h5>${product.title}</h5>
                            <div class="product-rating mb-2">
                                ${stars}
                                <span class="ms-2">(${product.reviews})</span>
                            </div>
                            <div class="product-price">
                                <span class="price">₹ ${product.actual_price} - ${product.weight}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
}

function loadProducts() {
    const grid = document.getElementById('products-grid');
    const productsToShow = filteredProducts.slice(0, displayedProducts + productsPerPage);

    grid.innerHTML = productsToShow.map(product => createProductCard(product)).join('');
    displayedProducts = productsToShow.length;

    // Hide load more button if all products are displayed
    const loadMoreBtn = document.getElementById('load-more');
    if (displayedProducts >= filteredProducts.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = '';
    }
}

function filterProducts() {
    const category = document.getElementById('categoryFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    // Filter by category
    filteredProducts = category ? products.filter(p => p.category_name === category) : [...products];

    // Sort products
    switch (sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            // Keep original order for featured
            break;
    }

    displayedProducts = 0;
    loadProducts();
}

function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Event listeners
document.getElementById('categoryFilter').addEventListener('change', filterProducts);
document.getElementById('sortBy').addEventListener('change', filterProducts);
document.getElementById('load-more').addEventListener('click', loadProducts);

window.onload = function () {
    toggle_loader();
    updateCartCountFromAPI();
    loadProducts();
};

window.addEventListener('scroll', function () {
    const menuBar = document.querySelector('.main-menu');
    const scrollTrigger = 95;

    if (window.scrollY >= scrollTrigger) {
        menuBar.classList.add('fixed-top');
    } else {
        menuBar.classList.remove('fixed-top');
    }
});