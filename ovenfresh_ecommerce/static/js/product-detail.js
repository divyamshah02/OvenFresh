let product_detail_url = null;
let pincode_check_url = null;
let csrf_token = null;

// Current product data
let currentProduct = null;
let currentVariations = [];
let selectedVariation = null;
let availableTimeslots = [];
let pincodeTimeslots = [];
let todayPincodeTimeslots = [];


async function InitializeProductDetail(
    csrfTokenParam,
    productDetailUrlParam,
    pincodeCheckUrlParam
) {
    csrf_token = csrfTokenParam;
    product_detail_url = productDetailUrlParam;
    pincode_check_url = pincodeCheckUrlParam;

    // Get product ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_id') || urlParams.get('id');

    if (!productId) {
        showNotification("Product not found.", "error");
        return;
    }

    try {
        await loadProductData(productId);
        // await loadTimeslots();
        initializeEventListeners();
        updateCartCountFromAPI();
    } catch (error) {
        console.error("Error initializing product detail:", error);
        showNotification("Error loading product details.", "error");
    }
}

async function loadProductData(productId) {
    try {
        const [success, result] = await callApi("GET", `${product_detail_url}?product_id=${productId}`);
        if (success && result.success) {
            const data = result.data;
            
            // Set current product data
            currentProduct = {
                id: data.id,
                product_id: data.product_id,
                title: data.title,
                description: data.description,
                photos: data.photos || [],
                is_active: data.is_active,
                category_name: data.category_name,
                sub_category_name: data.sub_category_name
            };
            
            // Set variations
            currentVariations = data.product_variation || [];
            
            // Render all components
            renderProductDetails(currentProduct);
            renderVariationOptions(currentVariations);
            renderRelatedProducts(data.related_products || []);
            renderProductReviews(data.reviews || []);
            updateBreadcrumb(currentProduct);
            
            // Select first variation if available
            if (currentVariations.length > 0) {
                selectVariation(currentVariations[0]);
            }
        } else {
            throw new Error(result.error || "Failed to load product details");
        }
    } catch (error) {
        console.error("Error loading product data:", error);
        showNotification("Error loading product details.", "error");
    }
}

async function loadTimeslots() {
    try {
        const [success, result] = await callApi("GET", timeslots_url);
        if (success && result.success) {
            availableTimeslots = result.data.timeslots || result.data || [];
        } else {
            console.error("Failed to load timeslots:", result);
        }
    } catch (error) {
        console.error("Error loading timeslots:", error);
    }
}

function renderProductDetails(product) {
    // Update product images
    if (product.photos && product.photos.length > 0) {
        const mainImage = document.getElementById('main-product-image');
        const thumbnailContainer = document.querySelector('.thumbnail-images .row');
        
        if (mainImage) {
            mainImage.src = product.photos[0];
            mainImage.alt = product.title;
        }
        
        if (thumbnailContainer) {
            thumbnailContainer.innerHTML = product.photos.map((photo, index) => `
                <div class="col-3">
                    <img src="${photo}" 
                         alt="View ${index + 1}" 
                         class="img-fluid rounded thumbnail-img ${index === 0 ? 'active' : ''}" 
                         onclick="changeMainImage('${photo}')">
                </div>
            `).join('');
        }
    }

    // Update product info
    const productTitle = document.querySelector('.product-title');
    if (productTitle) productTitle.textContent = product.title;

    const productDescription = document.querySelector('.product-description p');
    if (productDescription) productDescription.textContent = product.description;

    // Update stock status
    const stockBadge = document.querySelector('.badge.bg-success');
    if (stockBadge) {
        stockBadge.textContent = product.is_active ? 'In Stock' : 'Out of Stock';
        stockBadge.className = `badge ${product.is_active ? 'bg-success' : 'bg-danger'}`;
    }

    // Update category in description tab
    const descriptionTab = document.getElementById('description');
    if (descriptionTab) {
        const categoryInfo = descriptionTab.querySelector('p');
        if (categoryInfo) {
            categoryInfo.innerHTML = `
                ${product.description}
                <br><br>
                <strong>Category:</strong> ${product.category_name} > ${product.sub_category_name}
            `;
        }
    }
}

function renderVariationOptions(variations) {
    const weightSelect = document.getElementById('weight');
    if (weightSelect && variations.length > 0) {
        weightSelect.innerHTML = variations.map(variation => {
            const price = variation.discounted_price || variation.actual_price;
            return `
                <option value="${variation.product_variation_id}" 
                        data-actual-price="${variation.actual_price}"
                        data-discounted-price="${variation.discounted_price || ''}"
                        data-weight="${variation.weight_variation}">
                    ${variation.weight_variation} - ₹${price}
                </option>
            `;
        }).join('');
        
        // Add change event listener
        weightSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const variationId = selectedOption.value;
            const variation = variations.find(v => v.product_variation_id == variationId);
            if (variation) {
                selectVariation(variation);
            }
        });
    }
}

function selectVariation(variation) {
    selectedVariation = variation;
    updatePriceDisplay(variation);
}

function updatePriceDisplay(variation) {
    const currentPriceElement = document.querySelector('.current-price');
    const originalPriceElement = document.querySelector('.original-price');
    const discountBadge = document.querySelector('.discount-badge');

    const displayPrice = variation.discounted_price || variation.actual_price;
    
    if (currentPriceElement) {
        currentPriceElement.textContent = `₹${displayPrice}`;
    }

    // Show original price and discount if there's a discounted price
    if (originalPriceElement && variation.discounted_price && parseFloat(variation.actual_price) > parseFloat(variation.discounted_price)) {
        originalPriceElement.textContent = `₹${variation.actual_price}`;
        originalPriceElement.style.display = 'inline';
        
        if (discountBadge) {
            const discount = Math.round(((parseFloat(variation.actual_price) - parseFloat(variation.discounted_price)) / parseFloat(variation.actual_price)) * 100);
            discountBadge.textContent = `${discount}% OFF`;
            discountBadge.style.display = 'inline';
        }
    } else {
        if (originalPriceElement) originalPriceElement.style.display = 'none';
        if (discountBadge) discountBadge.style.display = 'none';
    }
}

function renderRelatedProducts(products) {
    const relatedProductsContainer = document.querySelector('.row.g-4');
    if (relatedProductsContainer && products.length > 0) {
        relatedProductsContainer.innerHTML = products.slice(0, 4).map(product => {
            const price = product.actual_price || '0.00';
            return `
                <div class="col-md-6 col-lg-3">
                    <div class="product-card">
                        <div class="product-img">
                            <img src="${product.photos && product.photos[0] || '/placeholder.svg?height=200&width=200'}" 
                                 alt="${product.title}" class="img-fluid">
                            <div class="product-actions">
                                <a href="#" class="btn-product-action" onclick="addToWishlist(${product.product_id})">
                                    <i class="fas fa-heart"></i>
                                </a>
                                <a href="#" class="btn-product-action" onclick="quickAddToCart(${product.product_id}, ${product.product_variation_id || 'null'})">
                                    <i class="fas fa-shopping-cart"></i>
                                </a>
                                <a href="product-detail.html?product_id=${product.product_id}" class="btn-product-action">
                                    <i class="fas fa-eye"></i>
                                </a>
                            </div>
                        </div>
                        <div class="product-body">
                            <h5>${product.title}</h5>
                            <div class="product-rating mb-2">
                                ${generateStarRating(4)}
                                <span class="ms-2">(0)</span>
                            </div>
                            <div class="product-price">
                                <span class="price">₹${price}</span>
                                ${product.weight ? `<small class="text-muted d-block">${product.weight}</small>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function renderProductReviews(reviews) {
    const reviewsList = document.querySelector('.reviews-list');
    const reviewsTab = document.getElementById('reviews-tab');
    
    // Update reviews count in tab
    if (reviewsTab) {
        reviewsTab.textContent = `Reviews (${reviews.length})`;
    }
    
    if (reviewsList) {
        if (reviews.length > 0) {
            // Calculate average rating
            const avgRating = reviews.reduce((sum, review) => sum + parseFloat(review.ratings), 0) / reviews.length;
            updateProductRating(avgRating, reviews.length);
            
            // Update reviews summary
            const ratingAverage = document.querySelector('.rating-average .h2');
            if (ratingAverage) {
                ratingAverage.textContent = avgRating.toFixed(1);
            }
            
            const reviewsCount = document.querySelector('.rating-average p');
            if (reviewsCount) {
                reviewsCount.textContent = `Based on ${reviews.length} reviews`;
            }
            
            // Render individual reviews
            reviewsList.innerHTML = reviews.slice(0, 3).map(review => `
                <div class="review-item border-bottom pb-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1">Customer</h6>
                            <div class="stars small">
                                ${generateStarRating(parseFloat(review.ratings))}
                            </div>
                        </div>
                        <small class="text-muted">${formatDate(review.created_at)}</small>
                    </div>
                    <p class="mb-0">${review.review_text}</p>
                </div>
            `).join('');
        } else {
            reviewsList.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">No reviews yet. Be the first to review this product!</p>
                </div>
            `;
        }
    }
}

function initializeEventListeners() {
    // Quantity change buttons
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('change', function() {
            const value = parseInt(this.value);
            if (value < 1) this.value = 1;
            if (value > 10) this.value = 10;
        });
    }

    // Set minimum delivery date to tomorrow
    const deliveryDateInput = document.getElementById('delivery-date');
    if (deliveryDateInput) {
        const tomorrow = new Date();
        // tomorrow.setDate(tomorrow.getDate() + 1);
        deliveryDateInput.min = tomorrow.toISOString().split('T')[0];
        // deliveryDateInput.value = tomorrow.toISOString().split('T')[0];
    }
    deliveryDateInput.addEventListener('change', checkIfTodaySelected);

    // Update pincode check button text and function
    const pincodeCheckBtn = document.getElementById('check-pincode-btn');
    pincodeCheckBtn.setAttribute('onclick', 'checkPincode()');


    
}

function changeMainImage(src) {
    const mainImage = document.getElementById('main-product-image');
    if (mainImage) {
        mainImage.src = src;
    }
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail-img').forEach(img => {
        img.classList.remove('active');
    });
    event.target.classList.add('active');
}

function changeQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        let currentQuantity = parseInt(quantityInput.value);
        let newQuantity = currentQuantity + change;
        
        if (newQuantity >= 1 && newQuantity <= 10) {
            quantityInput.value = newQuantity;
        }
    }
}

// async function checkPincode() {
//     const pincodeInput = document.getElementById('pincode-check');
//     const pincode = pincodeInput.value.trim();
    
//     if (!pincode) {
//         showNotification("Please enter a pincode.", "warning");
//         return;
//     }

//     if (!/^\d{6}$/.test(pincode)) {
//         showNotification("Please enter a valid 6-digit pincode.", "error");
//         return;
//     }

//     try {
//         const pincode_params = { 
//             pincode: pincode,
//             product_id: currentProduct.product_id 
//         }
//         const url = `${pincode_check_url}?` + toQueryString(pincode_params);
//         const [success, result] = await callApi("GET", url);
        
//         if (success && result.success) {
//             if (result.data.is_deliverable) {
//                 showNotification("Delivery available in your area!", "success");
//                 pincodeTimeslots = result.data.availability_data || [];
//                 showDeliveryOptions();
//             } else {
//                 showNotification("Sorry, delivery not available in your area.", "error");
//                 hideDeliveryOptions();
//             }
//         } else {
//             showNotification(result.error || "Error checking pincode.", "error");
//         }
//     } catch (error) {
//         console.error("Error checking pincode:", error);
//         showNotification("Error checking pincode availability.", "error");
//     }
// }

// function showDeliveryOptions() {
//     const deliveryOptionsRow = document.querySelector('.row.m-0.p-0.g-3');
//     if (deliveryOptionsRow) {
//         deliveryOptionsRow.style.display = 'flex';
        
//         // Update timeslots with pricing from pincode check
//         const timeslotSelect = document.getElementById('timeslot');
//         if (timeslotSelect && pincodeTimeslots.length > 0) {
//             timeslotSelect.innerHTML = pincodeTimeslots.map(slot => {
//                 // Find matching timeslot from general timeslots to get title
//                 const timeslotInfo = availableTimeslots.find(ts => ts.id === slot.timeslot_id) || {};
//                 const title = timeslotInfo.time_slot_title || `${slot.start_time} - ${slot.end_time}`;
//                 const charge = parseFloat(slot.delivery_charge || 0);
                
//                 return `
//                     <option value="${slot.timeslot_id}" data-charge="${charge}">
//                         ${title} ${charge > 0 ? `(₹${charge} delivery charge)` : '(Free delivery)'}
//                     </option>
//                 `;
//             }).join('');
//         }
//     }
// }

// function hideDeliveryOptions() {
//     const deliveryOptionsRow = document.querySelector('.row.m-0.p-0.g-3');
//     if (deliveryOptionsRow) {
//         deliveryOptionsRow.style.display = 'none';
//     }
// }

async function checkPincode() {
    const pincodeInput = document.getElementById('pincode-check');
    const pincode = pincodeInput.value.trim();
    
    if (!pincode) {
        showNotification("Please enter a pincode.", "warning");
        return;
    }

    if (!/^\d{6}$/.test(pincode)) {
        showNotification("Please enter a valid 6-digit pincode.", "error");
        return;
    }

    try {
        const pincode_params = { 
            pincode: pincode
        }
        const url = `${pincode_check_url}?` + toQueryString(pincode_params);
        const [success, result] = await callApi("GET", url);
        
        if (success && result.success) {
            console.log(result.data);
            if (result.data.is_deliverable) {
                showNotification("Delivery available in your area!", "success");
                pincodeTimeslots = result.data.availability_data || [];
                todayPincodeTimeslots = result.data.today_availability_data || [];
                showDeliveryOptions();
            } else {
                showNotification("Sorry, delivery not available in your area.", "error");
                hideDeliveryOptions();
            }
        } else {
            showNotification(result.error || "Error checking pincode.", "error");
        }
    } catch (error) {
        console.error("Error checking pincode:", error);
        showNotification("Error checking pincode availability.", "error");
    }
}

function showDeliveryOptions() {
    const deliveryOptionsRow = document.getElementById('delivery_options');
    if (deliveryOptionsRow) {
        deliveryOptionsRow.style.display = 'flex';
        
        // Update timeslots with pricing from pincode check
        const timeslotSelect = document.getElementById('timeslot');
        if (timeslotSelect && pincodeTimeslots.length > 0) {
            timeslotSelect.innerHTML = pincodeTimeslots.map(slot => {
                // Find matching timeslot from general timeslots to get title
                // const timeslotInfo = availableTimeslots.find(ts => ts.id === slot.timeslot_id) || {};
                // const title = timeslotInfo.time_slot_title || `${slot.start_time} - ${slot.end_time}`;
                const title =  `${slot.timeslot_name} (${slot.start_time} - ${slot.end_time})`;
                const charge = parseFloat(slot.delivery_charge || 0);
                
                return `
                    <option value="${slot.timeslot_id}" data-charge="${charge}">
                        ${title} ${charge > 0 ? `(₹${charge} delivery charge)` : '(Free delivery)'}
                    </option>
                `;
            }).join('');
        }
    }
}

function showTodayDeliveryOptions() {
    const deliveryOptionsRow = document.getElementById('delivery_options');
    if (deliveryOptionsRow) {
        deliveryOptionsRow.style.display = 'flex';
        
        // Update timeslots with pricing from pincode check
        const timeslotSelect = document.getElementById('timeslot');
        if (timeslotSelect && todayPincodeTimeslots.length > 0) {
            timeslotSelect.innerHTML = todayPincodeTimeslots.map(slot => {
                // Find matching timeslot from general timeslots to get title
                
                const title =  `${slot.timeslot_name} (${slot.start_time} - ${slot.end_time})`;
                const charge = parseFloat(slot.delivery_charge || 0);
                
                return `
                    <option value="${slot.timeslot_id}" data-charge="${charge}">
                        ${title} ${charge > 0 ? `(₹${charge} delivery charge)` : '(Free delivery)'}
                    </option>
                `;
            }).join('');
        }
    }
}

function hideDeliveryOptions() {
    const deliveryOptionsRow = document.getElementById('delivery_options');
    if (deliveryOptionsRow) {
        deliveryOptionsRow.style.display = 'none';
    }
}

function checkIfTodaySelected() {
    const input = document.getElementById('delivery-date');
    const selectedDate = input.value; // in format "YYYY-MM-DD"

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (selectedDate === todayStr) {
        // If today's date is selected
        showTodayDeliveryOptions();
    } else {
        // If a different date is selected
        showDeliveryOptions();
    }
}

async function addToCart() {
    if (!selectedVariation) {
        showNotification("Please select a product variation.", "warning");
        return;
    }

    // Check if pincode is checked and delivery options are shown
    const deliveryOptionsRow = document.querySelector('.row.m-0.p-0.g-3');
    if (!deliveryOptionsRow || deliveryOptionsRow.style.display === 'none') {
        showNotification("Please check pincode availability first.", "warning");
        return;
    }

    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const message = document.getElementById('message').value.trim();
    const deliveryDate = document.getElementById('delivery-date').value;
    const timeslotSelect = document.getElementById('timeslot');
    const selectedTimeslot = timeslotSelect ? timeslotSelect.value : null;

    if (!selectedTimeslot) {
        showNotification("Please select a delivery timeslot.", "warning");
        return;
    }

    const additionalData = {};
    if (message) additionalData.message = message;
    if (deliveryDate) additionalData.delivery_date = deliveryDate;
    if (selectedTimeslot) additionalData.timeslot_id = selectedTimeslot;

    const success = await AddToCart(selectedVariation.product_variation_id, quantity, additionalData);
    if (success) {
        // Optionally redirect to cart or show success message
        // window.location.href = 'cart.html';
    }
}

async function buyNow() {
    const success = await addToCart();
    if (success) {
        window.location.href = 'cart.html';
    }
}

async function quickAddToCart(productId, variationId = null) {
    if (variationId) {
        await AddToCart(variationId, 1);
    } else {
        showNotification("Product variation not available.", "error");
    }
}

function addToWishlist(productId) {
    // Implement wishlist functionality
    showNotification("Added to wishlist!", "success");
}

// Utility functions
function updateProductRating(rating, reviewCount) {
    const ratingElements = document.querySelectorAll('.product-rating .stars');
    ratingElements.forEach(element => {
        element.innerHTML = generateStarRating(rating);
    });
    
    const ratingText = document.querySelector('.rating-text');
    if (ratingText) {
        ratingText.textContent = `(${rating.toFixed(1)} out of 5)`;
    }
    
    const reviewCountElements = document.querySelectorAll('.review-count');
    reviewCountElements.forEach(element => {
        element.textContent = `${reviewCount} reviews`;
    });
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}

function updateBreadcrumb(product) {
    const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
    if (breadcrumbItems.length >= 3) {
        // Update category breadcrumb
        breadcrumbItems[2].innerHTML = `<a href="#">${product.category_name}</a>`;
    }
    
    const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
    if (lastItem) {
        lastItem.textContent = product.title;
    }
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

async function updateCartCountFromAPI() {
    // This function should be implemented to update cart count
    // You can import this from cart.js or implement it here
    if (typeof cart_list_url !== 'undefined' && cart_list_url) {
        try {
            const [success, result] = await callApi("GET", cart_list_url);
            if (success && result.success) {
                const cartItems = result.data.cart_items || [];
                const cartCount = cartItems.reduce((total, item) => total + parseInt(item.qty), 0);
                const cartCountElement = document.getElementById('cart-count');
                if (cartCountElement) {
                    cartCountElement.textContent = cartCount;
                }
            }
        } catch (error) {
            console.error("Error updating cart count:", error);
        }
    }
}

// Make functions globally available
window.changeMainImage = changeMainImage;
window.changeQuantity = changeQuantity;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.checkPincode = checkPincode;
window.quickAddToCart = quickAddToCart;
window.addToWishlist = addToWishlist;