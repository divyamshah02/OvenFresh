let csrf_token = null;
let heroBannersUrl = null;
let deliveryPolicyUrl = null;
let categoriesUrl = null;
let videosUrl = null;
let featuresUrl = null;
let aboutUrl = null;
let productSectionsUrl = null;
let clientLogosUrl = null;
let footerUrl = null;

// Data storage
const homepageData = {
    banners: [],
    deliveryPolicies: [],
    categories: [],
    videos: [],
    features: [],
    about: null,
    productSections: [],
    clientLogos: [],
    footerContent: []
};

async function InitializeHomepage(
    csrfTokenParam,
    heroBannersUrlParam,
    deliveryPolicyUrlParam,
    categoriesUrlParam,
    videosUrlParam,
    featuresUrlParam,
    aboutUrlParam,
    productSectionsUrlParam,
    clientLogosUrlParam,
    footerUrlParam
) {
    csrf_token = csrfTokenParam;
    heroBannersUrl = heroBannersUrlParam;
    deliveryPolicyUrl = deliveryPolicyUrlParam;
    categoriesUrl = categoriesUrlParam;
    videosUrl = videosUrlParam;
    featuresUrl = featuresUrlParam;
    aboutUrl = aboutUrlParam;
    productSectionsUrl = productSectionsUrlParam;
    clientLogosUrl = clientLogosUrlParam;
    footerUrl = footerUrlParam;

    try {
        showLoading();

        // Load all homepage content
        await Promise.all([
            loadHeroBanners(),
            loadDeliveryPolicy(),
            loadCategories(),
            loadVideos(),
            loadFeatures(),
            loadAboutSection(),
            loadProductSections(),
            loadClientLogos(),
            loadFooterContent()
        ]);

        // Render all sections
        renderHeroBanners();
        renderDeliveryPolicy();
        renderCategories();
        renderVideos();
        renderFeatures();
        renderAboutSection();
        renderProductSections();
        renderClientLogos();
        renderFooterContent();

        // Initialize interactive elements
        initializeCarousel();
        initializeCategoryScroll();
        initializeCountdowns();

        hideLoading();
    } catch (error) {
        console.error("Error initializing homepage:", error);
        hideLoading();
    }
}

async function loadHeroBanners() {
    try {
        const [success, result] = await callApi("GET", heroBannersUrl);
        if (success && result.success) {
            homepageData.banners = result.data;
        }
    } catch (error) {
        console.error("Error loading hero banners:", error);
    }
}

async function loadDeliveryPolicy() {
    try {
        const [success, result] = await callApi("GET", deliveryPolicyUrl);
        if (success && result.success) {
            homepageData.deliveryPolicies = result.data;
        }
    } catch (error) {
        console.error("Error loading delivery policy:", error);
    }
}

async function loadCategories() {
    try {
        const [success, result] = await callApi("GET", categoriesUrl);
        if (success && result.success) {
            homepageData.categories = result.data;
        }
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

async function loadVideos() {
    try {
        const [success, result] = await callApi("GET", videosUrl);
        if (success && result.success) {
            homepageData.videos = result.data;
        }
    } catch (error) {
        console.error("Error loading videos:", error);
    }
}

async function loadFeatures() {
    try {
        const [success, result] = await callApi("GET", featuresUrl);
        if (success && result.success) {
            homepageData.features = result.data;
        }
    } catch (error) {
        console.error("Error loading features:", error);
    }
}

async function loadAboutSection() {
    try {
        const [success, result] = await callApi("GET", aboutUrl);
        if (success && result.success) {
            homepageData.about = result.data;
        }
    } catch (error) {
        console.error("Error loading about section:", error);
    }
}

async function loadProductSections() {
    try {
        const [success, result] = await callApi("GET", productSectionsUrl);
        if (success && result.success) {
            homepageData.productSections = result.data;
        }
    } catch (error) {
        console.error("Error loading product sections:", error);
    }
}

async function loadClientLogos() {
    try {
        const [success, result] = await callApi("GET", clientLogosUrl);
        if (success && result.success) {
            homepageData.clientLogos = result.data;
        }
    } catch (error) {
        console.error("Error loading client logos:", error);
    }
}

async function loadFooterContent() {
    try {
        const [success, result] = await callApi("GET", footerUrl);
        if (success && result.success) {
            homepageData.footerContent = result.data;
        }
    } catch (error) {
        console.error("Error loading footer content:", error);
    }
}

function renderHeroBanners() {
    const indicatorsContainer = document.getElementById("carousel-indicators");
    const innerContainer = document.getElementById("carousel-inner");

    if (!homepageData.banners.length) {
        // Default banners if no CMS data
        const defaultBanners = [
            {
                title: "Summer Berry Collection",
                description: "Fresh strawberries, blueberries, and raspberries on light cream cakes.",
                image: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1292&q=80",
                button_text: "Shop Now",
                button_link: "/shop/"
            },
            {
                title: "Chocolate Celebration Cakes",
                description: "Indulgent chocolate cakes perfect for any special occasion.",
                image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1089&q=80",
                button_text: "Shop Now",
                button_link: "/shop/"
            },
            {
                title: "Wedding Cake Collection",
                description: "Elegant multi-tier cakes for your special day.",
                image: "https://www.shutterstock.com/image-photo/beautiful-wedding-cake-champagne-glasses-260nw-2337005657.jpg",
                button_text: "Shop Now",
                button_link: "/shop/"
            }
        ];
        homepageData.banners = defaultBanners;
    }

    // Clear existing content
    indicatorsContainer.innerHTML = "";
    innerContainer.innerHTML = "";

    // Create indicators
    homepageData.banners.forEach((banner, index) => {
        const indicator = document.createElement("button");
        indicator.type = "button";
        indicator.setAttribute("data-bs-target", "#seasonalCarousel");
        indicator.setAttribute("data-bs-slide-to", index);
        indicator.setAttribute("aria-label", `Slide ${index + 1}`);
        if (index === 0) {
            indicator.classList.add("active");
            indicator.setAttribute("aria-current", "true");
        }
        indicatorsContainer.appendChild(indicator);
    });

    // Create carousel items
    homepageData.banners.forEach((banner, index) => {
        const carouselItem = document.createElement("div");
        carouselItem.className = `carousel-item${index === 0 ? " active" : ""}`;

        carouselItem.innerHTML = `
            <div class="seasonal-slide" style="background-image: url('${banner.image}')">
                <div class="carousel-caption text-start">
                    <h3>${banner.title}</h3>
                    ${banner.subtitle ? `<h5>${banner.subtitle}</h5>` : ""}
                    ${banner.description ? `<p>${banner.description}</p>` : ""}
                    ${banner.button_link ? `<a href="${banner.button_link}" class="btn of-btn-primary rounded-pill">${banner.button_text}</a>` : ""}
                </div>
            </div>
        `;

        innerContainer.appendChild(carouselItem);
    });
}

function renderDeliveryPolicy() {
    const container = document.getElementById("delivery-policy-container");
    
    if (!homepageData.deliveryPolicies.length) {
        // Default delivery policy
        container.innerHTML = `
            <!-- Same Day Delivery Card -->
            <div class="col-md-4">
                <div class="delivery-card">
                    <div class="honect-card-header text-center">
                        <i class="fas fa-truck-fast me-2"></i> Last Order For "Same Day Delivery"
                    </div>
                    <div class="honect-card-body">
                        <div class="timer-container">
                            <div>
                                <div class="countdown" id="same-day-countdown">05:04:54</div>
                                <div class="time-label">Time Remaining</div>
                            </div>
                            <div class="text-end">
                                <i class="far fa-clock clock-icon"></i>
                            </div>
                        </div>
                        <div class="delivery-time">
                            <i class="fas fa-calendar-day me-2"></i> Delivery Time: 10:00 am to 9:00 pm
                        </div>
                    </div>
                </div>
            </div>

            <!-- Midnight Delivery Card -->
            <div class="col-md-4">
                <div class="delivery-card">
                    <div class="honect-card-header text-center">
                        <i class="fas fa-moon me-2"></i> Last Order For "Midnight Delivery Tonight"
                    </div>
                    <div class="honect-card-body">
                        <div class="timer-container">
                            <div>
                                <div class="countdown" id="midnight-countdown">06:14:54</div>
                                <div class="time-label">Time Remaining</div>
                            </div>
                            <div class="text-end">
                                <i class="far fa-clock clock-icon"></i>
                            </div>
                        </div>
                        <div class="delivery-time">
                            <i class="fas fa-calendar-day me-2"></i> Delivery Time: 10:45 am to 11:59 pm
                        </div>
                    </div>
                </div>
            </div>

            <!-- Info Cards -->
            <div class="col-md-4">
                <div class="row g-4">
                    <!-- Delivery Areas -->
                    <div class="col-12">
                        <div class="info-card mb-4">
                            <div class="info-header text-center">
                                <i class="fas fa-map-marker-alt me-2"></i> Delivery Areas
                            </div>
                            <div class="info-body">
                                <p class="mb-2"><b>MUMBAI - NAVI MUMBAI - THANE</b></p>
                            </div>
                        </div>
                    </div>

                    <!-- Pricing Policy -->
                    <div class="col-12">
                        <div class="info-card">
                            <div class="info-header text-center">
                                <i class="fas fa-tag me-2"></i> Honest Pricing Policy
                            </div>
                            <div class="info-body">
                                <p class="mb-0">
                                    <i class="fas fa-check-circle policy-icon"></i>
                                    <b>No artificial price hikes only to offer discounts.</b>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = homepageData.deliveryPolicies.map((policy) => {
        if (policy.policy_type === "same_day" || policy.policy_type === "midnight") {
            return `
                <div class="col-md-4">
                    <div class="delivery-card">
                        <div class="honect-card-header text-center">
                            <i class="${policy.icon} me-2"></i> ${policy.title}
                        </div>
                        <div class="honect-card-body">
                            <div class="timer-container">
                                <div>
                                    <div class="countdown" id="${policy.policy_type}-countdown">
                                        ${String(policy.countdown_hours || 0).padStart(2, "0")}:${String(policy.countdown_minutes || 0).padStart(2, "0")}:${String(policy.countdown_seconds || 0).padStart(2, "0")}
                                    </div>
                                    <div class="time-label">Time Remaining</div>
                                </div>
                                <div class="text-end">
                                    <i class="far fa-clock clock-icon"></i>
                                </div>
                            </div>
                            ${policy.delivery_time ? `
                                <div class="delivery-time">
                                    <i class="fas fa-calendar-day me-2"></i> Delivery Time: ${policy.delivery_time}
                                </div>
                            ` : ""}
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="col-md-4">
                    <div class="info-card">
                        <div class="info-header text-center">
                            <i class="${policy.icon} me-2"></i> ${policy.title}
                        </div>
                        <div class="info-body">
                            <p class="mb-0">${policy.description}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join("");
}

function renderCategories() {
    const container = document.getElementById("scrollable");
    
    if (!homepageData.categories.length) {
        // Default categories
        const defaultCategories = [
            {
                title: "Birthday Cakes",
                description: "Make your celebration special",
                image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1089&q=80",
                category_link: "/shop/"
            },
            {
                title: "Chocolates",
                description: "Handcrafted premium chocolates",
                image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
                category_link: "/shop/"
            },
            {
                title: "Gift Hampers",
                description: "Perfect presents for loved ones",
                image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=765&q=80",
                category_link: "/shop/"
            },
            {
                title: "Pastries",
                description: "Delicate and delicious treats",
                image: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
                category_link: "/shop/"
            }
        ];
        homepageData.categories = defaultCategories;
    }

    container.innerHTML = homepageData.categories.map(category => `
        <div class="dashboard-main-card">
            <div class="category-card" onclick="window.location.href='${category.category_link || '/shop/'}'">
                <div class="category-img">
                    <img src="${category.image}" alt="${category.title}" class="img-fluid">
                </div>
                <div class="category-body">
                    <h4 class="category-heading">${category.title}</h4>
                    ${category.description ? `<p>${category.description}</p>` : ""}
                </div>
            </div>
        </div>
    `).join("");
}

function renderVideos() {
    const container = document.getElementById("videos-container");
    
    const leftVideo = homepageData.videos.find((v) => v.position === "left");
    const rightVideo = homepageData.videos.find((v) => v.position === "right");
    const centerText = homepageData.videos.find((v) => v.position === "center_text");

    container.innerHTML = `
        <!-- Left Video -->
        <div class="col-12 col-lg-4 d-flex justify-content-center align-items-center overflow-hidden p-0">
            <video src="${leftVideo?.video_url || '/static/img/left.mp4'}" class="video-portrait" autoplay muted loop playsinline></video>
        </div>

        <!-- Center Card -->
        <div class="col-12 col-lg-4 d-flex justify-content-center align-items-center p-4">
            <div class="card border-0 p-4 rounded-4 shadow-lg w-100 bg-light text-dark text-center">
                <h3 class="card-title" style="font-family: 'Dancing Script', cursive; font-size: 1.8rem;">
                    ${centerText?.text_content || '"Here is Every bite is a celebration,<br>Every petals whisper poetry"'}
                </h3>
            </div>
        </div>

        <!-- Right Video -->
        <div class="col-12 col-lg-4 d-flex justify-content-center align-items-center overflow-hidden p-0">
            <video src="${rightVideo?.video_url || '/static/img/right.mp4'}" class="video-portrait" autoplay muted loop playsinline></video>
        </div>
    `;
}

function renderFeatures() {
    const container = document.getElementById("features-container");
    
    if (!homepageData.features.length) {
        // Default features
        const defaultFeatures = [
            {
                title: "Free Shipping",
                description: "On Selected Time Slots",
                icon: "fas fa-truck"
            },
            {
                title: "Always Fresh",
                description: "Products Well Packaged",
                icon: "fas fa-box"
            },
            {
                title: "Superior Quality",
                description: "Unmatched Quality",
                icon: "fas fa-star"
            },
            {
                title: "Secure Checkout",
                description: "SSL Encrypted",
                icon: "fas fa-lock"
            }
        ];
        homepageData.features = defaultFeatures;
    }

    container.innerHTML = homepageData.features.map(feature => `
        <div class="col-md-3">
            <div class="d-flex align-items-center of-border-primary rounded-5 p-3"
                style="border: 2px solid; background-color: var(--of-primary-fully-faded-color);">
                <div class="icon-box me-3" style="background-color: white !important;">
                    <i class="${feature.icon}"></i>
                </div>
                <div>
                    <h5 class="mb-1">${feature.title}</h5>
                    <p class="mb-0" style="color: #6a0572 !important;">${feature.description}</p>
                </div>
            </div>
        </div>
    `).join("");
}

function renderAboutSection() {
    const container = document.getElementById("about-container");
    
    if (!homepageData.about) {
        // Default about section
        container.innerHTML = `
            <div class="row align-items-center">
                <div class="col-lg-6 mb-4 mb-lg-0">
                    <div class="about-img position-relative">
                        <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                            alt="About Oven Fresh" class="img-fluid rounded-4 shadow">
                        <div class="experience-badge">
                            <span class="years">30+</span>
                            <span class="text">Years of Experience</span>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="section-title">
                        <h6 class="of-text-primary text-uppercase">Our Story</h6>
                        <h2>Baking with Love Since 1993</h2>
                    </div>
                    <p>Oven Fresh began as a small family bakery with a passion for creating delicious treats that
                        bring joy to people's lives. Over the years, we've grown into a beloved local institution,
                        known for our commitment to quality and exceptional taste.</p>
                    <p>Our team of skilled bakers combines traditional techniques with innovative flavors to create
                        a wide range of products that cater to every taste and occasion. From birthday cakes to
                        wedding pastries, we put our heart into every creation.</p>
                    <div class="row g-4 mt-4">
                        <div class="col-sm-6">
                            <div class="d-flex align-items-center">
                                <div class="icon-box me-3">
                                    <i class="fas fa-medal"></i>
                                </div>
                                <div>
                                    <h5 class="mb-1">Quality Assurance</h5>
                                    <p class="mb-0">Premium ingredients only</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="d-flex align-items-center">
                                <div class="icon-box me-3">
                                    <i class="fas fa-heart"></i>
                                </div>
                                <div>
                                    <h5 class="mb-1">Made with Love</h5>
                                    <p class="mb-0">Passion in every bite</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="d-flex align-items-center">
                                <div class="icon-box me-3">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div>
                                    <h5 class="mb-1">Expert Bakers</h5>
                                    <p class="mb-0">Skilled artisan team</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="d-flex align-items-center">
                                <div class="icon-box me-3">
                                    <i class="fas fa-leaf"></i>
                                </div>
                                <div>
                                    <h5 class="mb-1">Eco-Friendly</h5>
                                    <p class="mb-0">Sustainable packaging</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <a href="/shop/" class="btn of-btn-primary rounded-pill mt-4">Explore Our Products</a>
                </div>
            </div>
        `;
        return;
    }

    const about = homepageData.about;
    container.innerHTML = `
        <div class="row align-items-center">
            <div class="col-lg-6 mb-4 mb-lg-0">
                <div class="about-img position-relative">
                    <img src="${about.main_image}" alt="About ${about.title}" class="img-fluid rounded-4 shadow">
                    <div class="experience-badge">
                        <span class="years">${about.years_experience}+</span>
                        <span class="text">Years of Experience</span>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="section-title">
                    <h6 class="of-text-primary text-uppercase">${about.subtitle}</h6>
                    <h2>${about.title}</h2>
                </div>
                <p>${about.description_1}</p>
                ${about.description_2 ? `<p>${about.description_2}</p>` : ""}
                
                ${about.features && about.features.length ? `
                    <div class="row g-4 mt-4">
                        ${about.features.map(feature => `
                            <div class="col-sm-6">
                                <div class="d-flex align-items-center">
                                    <div class="icon-box me-3">
                                        <i class="${feature.icon}"></i>
                                    </div>
                                    <div>
                                        <h5 class="mb-1">${feature.title}</h5>
                                        <p class="mb-0">${feature.description}</p>
                                    </div>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                ` : ""}
                
                <a href="${about.button_link}" class="btn of-btn-primary rounded-pill mt-4">${about.button_text}</a>
            </div>
        </div>
    `;
}

function renderProductSections() {
    const container = document.getElementById("product-sections-container");
    
    if (!homepageData.productSections.length) {
        // Default product sections with static data
        container.innerHTML = `
            <!-- Mothers Day Section -->
            <section id="bestsellers" class="py-5">
                <div class="container">
                    <div class="section-title text-center mb-5">
                        <h2>Mothers Day</h2>
                        <p class="text-muted">Customer favorites that keep them coming back</p>
                    </div>
                    <div class="row g-4">
                        <!-- Product 1 -->
                        <div class="col-md-6 col-lg-3">
                            <div class="product-card">
                                <div class="product-img">
                                    <span class="badge bg-danger position-absolute top-0 end-0 mt-2 me-2">Hot Selling</span>
                                    <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1089&q=80"
                                        alt="Chocolate Truffle Cake" class="img-fluid">
                                    <div class="product-actions">
                                        <a href="#" class="btn-product-action"><i class="fas fa-heart"></i></a>
                                        <a href="#" class="btn-product-action"><i class="fas fa-shopping-cart"></i></a>
                                        <a href="#" class="btn-product-action"><i class="fas fa-eye"></i></a>
                                    </div>
                                </div>
                                <div class="product-body">
                                    <h5>Chocolate Truffle Cake</h5>
                                    <div class="product-rating mb-2">
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star-half-alt"></i>
                                        <span class="ms-2">(42)</span>
                                    </div>
                                    <div class="product-price">
                                        <span class="price">₹35.99</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- More products... -->
                    </div>
                </div>
            </section>
        `;
        return;
    }

    container.innerHTML = homepageData.productSections.map(section => {
        const products = section.dynamic_products || [];
        
        return `
            <section class="py-5">
                <div class="container">
                    <div class="section-title text-center mb-5">
                        ${section.subtitle ? `<h6 class="text-primary text-uppercase">${section.subtitle}</h6>` : ""}
                        <h2>${section.title}</h2>
                        ${section.description ? `<p class="text-muted">${section.description}</p>` : ""}
                    </div>
                    <div class="row g-4">
                        ${products.slice(0, section.max_products).map(product => `
                            <div class="col-md-6 col-lg-3">
                                <div class="product-card" onclick="window.location.href='/product-detail/?id=${product.id}'">
                                    <div class="product-img">
                                        ${product.is_featured ? '<span class="badge bg-danger position-absolute top-0 end-0 mt-2 me-2">Featured</span>' : ''}
                                        <img src="${product.photos && product.photos.length ? product.photos[0] : (product.image || 'https://via.placeholder.com/300x300')}" alt="${product.name}" class="img-fluid">
                                        ${section.show_add_to_cart ? `
                                            <div class="product-actions">
                                                <a href="#" class="btn-product-action" onclick="event.stopPropagation(); addToWishlist('${product.id}')"><i class="fas fa-heart"></i></a>
                                                <a href="#" class="btn-product-action" onclick="event.stopPropagation(); addToCart('${product.id}')"><i class="fas fa-shopping-cart"></i></a>
                                                <a href="/product-detail/?id=${product.id}" class="btn-product-action"><i class="fas fa-eye"></i></a>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="product-body">
                                        <h5>${product.name}</h5>
                                        ${section.show_rating && product.rating ? `
                                            <div class="product-rating mb-2">
                                                ${generateStars(product.rating)}
                                                <span class="ms-2">(${product.reviews_count || 0})</span>
                                            </div>
                                        ` : ''}
                                        ${section.show_price ? `
                                            <div class="product-price">
                                                <span class="price">₹${product.actual_price || product.price}</span>
                                                ${product.discounted_price ? `<span class="old-price">₹${product.actual_price}</span>` : ''}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    }).join('');
}

function renderClientLogos() {
    const container = document.getElementById("client-logos-container");
    
    if (!homepageData.clientLogos.length) {
        // Default client logos
        const defaultLogos = [
            { logo_url: "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/MOTILAL-1.png?w=1200&ssl=1", company_name: "Motilal" },
            { logo_url: "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/kotak_mahindra_new.png.webp?w=1200&ssl=1", company_name: "Kotak Mahindra" },
            { logo_url: "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/Ajanta-Pharma-Limited-Logo-removebg-preview.png?w=1200&ssl=1", company_name: "Ajanta Pharma" },
            { logo_url: "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/icici-bank.png?w=1200&ssl=1", company_name: "ICICI Bank" },
            { logo_url: "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/motilal.png?w=1200&ssl=1", company_name: "Motilal Oswal" },
            { logo_url: "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/LODHA.png?w=1200&ssl=1", company_name: "Lodha" },
            { logo_url: "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/PIVOROOTS.jpg?w=1200&ssl=1", company_name: "Pivoroots" },
            { logo_url: "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/Rynox-Logo_2-removebg-preview.png?w=1200&ssl=1", company_name: "Rynox" }
        ];
        homepageData.clientLogos = defaultLogos;
    }

    // Duplicate logos for infinite scroll effect
    const duplicatedLogos = [...homepageData.clientLogos, ...homepageData.clientLogos];

    container.innerHTML = duplicatedLogos.map(logo => `
        <div class="client-logo">
            ${logo.website_url ? 
                `<a href="${logo.website_url}" target="_blank"><img src="${logo.logo_url}" alt="${logo.company_name}"></a>` :
                `<img src="${logo.logo_url}" alt="${logo.company_name}">`
            }
        </div>
    `).join("");
}

function renderFooterContent() {
    const container = document.getElementById("footer-container");
    
    if (!homepageData.footerContent.length) {
        // Default footer content
        container.innerHTML = `
            <div class="row g-4">
                <div class="col-lg-3">
                    <div class="footer-info">
                        <img src="/static/img/ovenfresh-logo-min.webp" alt="">
                        <p>For Cake shopping in Mumbai, Thane & Navi Mumbai, OvenFresh is the cake shop you can rely
                            on for a wonderful experience. Ovenfresh is a cakeshop that sells Eggless cakes online
                            with on time delivery.</p>
                        <div class="social-links mt-3">
                            <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a>
                            <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a>
                            <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
                            <a href="#" class="social-icon"><i class="fab fa-pinterest"></i></a>
                        </div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <div class="footer-links">
                        <h5 class="mb-4">Useful Links</h5>
                        <ul class="list-unstyled">
                            <li><a href="index.html">Contact Us</a></li>
                            <li><a href="#about">Register Complaint</a></li>
                            <li><a href="shop.html">Track your Order</a></li>
                            <li><a href="#contact">Refund and Cancellation Policy</a></li>
                            <li><a href="shop.html">About Us</a></li>
                            <li><a href="#contact">FAQ</a></li>
                        </ul>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <div class="footer-links">
                        <h5 class="mb-4">Quick Links</h5>
                        <ul class="list-unstyled">
                            <li><a href="#">Cakes</a></li>
                            <li><a href="#">Gifting</a></li>
                            <li><a href="#">Flowers</a></li>
                            <li><a href="#">Chocolates</a></li>
                            <li><a href="#">Cookies</a></li>
                            <li><a href="#">Blog</a></li>
                        </ul>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <div class="footer-contact">
                        <h5 class="mb-4">Contact Us</h5>
                        <p><i class="fas fa-map-marker-alt me-2"></i> Mumbai</p>
                        <p><i class="fas fa-phone-alt me-2"></i> +91 xxx xxx xxxx</p>
                        <p><i class="fas fa-envelope me-2"></i> info@ovenfresh.in</p>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="footer-contact">
                        <h5 class="mb-4">Newsletter</h5>
                        <p>Don't miss our future updates! Get Subscribed Today!</p>
                        <input type="text" class="form-control" name="" id="" placeholder="Email">
                        <button class="btn btn-dark w-100 of-bg-primary mt-3">Submit</button>
                    </div>
                </div>
            </div>
            <hr class="mt-4 mb-3">
            <div class="row">
                <div class="col-md-6">
                    <p class="mb-md-0">&copy; 2025 OvenFresh. All Rights Reserved.</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <p class="mb-0">
                        <a href="#" class="me-3">Privacy Policy</a>
                        <a href="#" class="me-3">Terms of Service</a>
                        <a href="#">FAQ</a>
                    </p>
                </div>
            </div>
            <hr class="mt-4 mb-3">
            <div class="container py-4 text-dark">
                <div class="location-links">
                    <h5 class="fw-bold">Send Cakes, Flowers, Chocolates, Hampers and Gift Combos to all over Western
                        Mumbai</h5>
                    <p>
                        <a href="#">Churchgate West</a> |
                        <a href="#">Churchgate East</a> |
                        <a href="#">Marine Lines West</a> |
                        <a href="#">Marine Lines East</a> |
                        <a href="#">Charni Road West</a> |
                        <a href="#">Charni Road East</a> |
                        <a href="#">Grant Road West</a> |
                        <a href="#">Grant Road East</a> |
                        <a href="#">Mumbai Central West</a> |
                        <a href="#">Mumbai Central East</a> |
                        <a href="#">Mahalaxmi West</a> |
                        <a href="#">Mahalaxmi East</a> |
                        <a href="#">Lower Parel West</a> |
                        <a href="#">Lower Parel East</a> |
                        <a href="#">Prabhadevi West</a> |
                        <a href="#">Prabhadevi East</a> |
                        <a href="#">Dadar East</a> |
                        <a href="#">Dadar West</a> |
                        <a href="#">Matunga</a> |
                        <a href="#">Matunga Road</a> |
                        <a href="#">Mahim West</a> |
                        <a href="#">Mahim East</a> |
                        <a href="#">Bandra West</a> |
                        <a href="#">Bandra East</a> |
                        <a href="#">Khar Road West</a> |
                        <a href="#">Khar Road East</a> |
                        <a href="#">Santacruz East</a> |
                        <a href="#">Santacruz West</a> |
                        <a href="#">Ville Parle West</a> |
                        <a href="#">Ville Parle East</a> |
                        <a href="#">Andheri West</a> |
                        <a href="#">Andheri East</a> |
                        <a href="#">Jogeshwari West</a> |
                        <a href="#">Jogeshwari East</a> |
                        <a href="#">Goregaon West</a> |
                        <a href="#">Goregaon East</a> |
                        <a href="#">Malad East</a> |
                        <a href="#">Malad West</a> |
                        <a href="#">Kandivali East</a> |
                        <a href="#">Kandivali West</a> |
                        <a href="#">Borivali East</a> |
                        <a href="#">Borivali West</a>
                    </p>

                    <h5 class="fw-bold mt-4">Send Cakes, Flowers, Chocolates, Hampers and Gift Combos to all over
                        Central Mumbai</h5>
                    <p>
                        <a href="#">CSMT</a> |
                        <a href="#">Masjid</a> |
                        <a href="#">Sandhurst Road</a> |
                        <a href="#">Byculla</a> |
                        <a href="#">Chinchpokli</a> |
                        <a href="#">Currey Road</a> |
                        <a href="#">Parel</a> |
                        <a href="#">Dadar</a> |
                        <a href="#">Matunga</a> |
                        <a href="#">Sion</a> |
                        <a href="#">Kurla</a> |
                        <a href="#">Vidhyavihar</a> |
                        <a href="#">Ghatkopar</a> |
                        <a href="#">Vikhroli</a> |
                        <a href="#">Kanjur Marg</a> |
                        <a href="#">Bhandup</a> |
                        <a href="#">Nahur</a> |
                        <a href="#">Mulund</a> |
                        <a href="#">Thane</a>
                    </p>

                    <h5 class="fw-bold mt-4">Send Cakes, Flowers, Chocolates, Hampers and Gift Combos to all over
                        Metro line</h5>
                    <p>
                        <a href="#">Versova</a> |
                        <a href="#">D N Nagar</a> |
                        <a href="#">Azad Nagar</a> |
                        <a href="#">J B Nagar</a> |
                        <a href="#">Chakala</a> |
                        <a href="#">Marol Naka</a> |
                        <a href="#">Saki Naka</a> |
                        <a href="#">Asalpha</a> |
                        <a href="#">Jagruti Nagar</a>
                    </p>

                    <h5 class="fw-bold mt-4">Send Gifts online with same day delivery and midnight delivery in
                        Mumbai</h5>
                    <p>
                        <a href="#">Churchgate</a> |
                        <a href="#">Marine Lines</a> |
                        <a href="#">Charni Road</a> |
                        <a href="#">Grant Road</a> |
                        <a href="#">Mumbai Central</a> |
                        <a href="#">Mahalaxmi</a> |
                        <a href="#">Lower Parel</a> |
                        <a href="#">Prabhadevi</a> |
                        <a href="#">Dadar</a> |
                        <a href="#">Matunga Road</a> |
                        <a href="#">Mahim</a> |
                        <a href="#">Bandra</a> |
                        <a href="#">Khar Road</a> |
                        <a href="#">Santacruz</a> |
                        <a href="#">Vile Parle</a> |
                        <a href="#">Andheri</a> |
                        <a href="#">Jogeshwari</a> |
                        <a href="#">Ram Mandir</a> |
                        <a href="#">Goregaon</a> |
                        <a href="#">Malad</a> |
                        <a href="#">Kandivali</a> |
                        <a href="#">Borivali</a>
                    </p>
                </div>
            </div>
        `;
        return;
    }

    // Group footer content by section type
    const groupedContent = homepageData.footerContent.reduce((acc, item) => {
        if (!acc[item.section_type]) {
            acc[item.section_type] = [];
        }
        acc[item.section_type].push(item);
        return acc;
    }, {});

    let footerHTML = '<div class="row g-4">';

    // Company info section
    if (groupedContent.company_info) {
        const companyInfo = groupedContent.company_info[0];
        footerHTML += `
            <div class="col-lg-3">
                <div class="footer-info">
                    <img src="/static/img/ovenfresh-logo-min.webp" alt="">
                    <h3 class="mb-4">${companyInfo.title}</h3>
                    <p>${companyInfo.content}</p>
                    <div class="social-links mt-3">
                        <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="social-icon"><i class="fab fa-pinterest"></i></a>
                    </div>
                </div>
            </div>
        `;
    }

    // Other sections
    ['useful_links', 'quick_links', 'contact', 'newsletter'].forEach(sectionType => {
        if (groupedContent[sectionType]) {
            const section = groupedContent[sectionType][0];
            footerHTML += `
                <div class="col-lg-2 col-md-6">
                    <div class="footer-links">
                        <h5 class="mb-4">${section.title}</h5>
                        ${sectionType === 'contact' ? 
                            `<div class="footer-contact">${section.content}</div>` :
                            sectionType === 'newsletter' ?
                            `<div class="footer-contact">
                                <p>${section.content}</p>
                                <input type="text" class="form-control" placeholder="Email">
                                <button class="btn btn-dark w-100 of-bg-primary mt-3">Submit</button>
                            </div>` :
                            `<div>${section.content}</div>`
                        }
                    </div>
                </div>
            `;
        }
    });

    footerHTML += '</div>';

    // Location links section
    if (groupedContent.location_links) {
        footerHTML += `
            <hr class="mt-4 mb-3">
            <div class="container py-4 text-dark">
                <div class="location-links">
                    ${groupedContent.location_links.map(section => `
                        <h5 class="fw-bold">${section.title}</h5>
                        <p>${section.content}</p>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Copyright
    footerHTML += `
        <hr class="mt-4 mb-3">
        <div class="row">
            <div class="col-md-6">
                <p class="mb-md-0">&copy; 2025 OvenFresh. All Rights Reserved.</p>
            </div>
            <div class="col-md-6 text-md-end">
                <p class="mb-0">
                    <a href="#" class="me-3">Privacy Policy</a>
                    <a href="#" class="me-3">Terms of Service</a>
                    <a href="#">FAQ</a>
                </p>
            </div>
        </div>
    `;

    container.innerHTML = footerHTML;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = "";

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    // Half star
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }

    return stars;
}

function initializeCarousel() {
    // Bootstrap carousel is automatically initialized
}

function initializeCategoryScroll() {
    const scrollable = document.getElementById("scrollable");
    const dotsContainer = document.querySelector(".dashboard-dots-container");

    if (!scrollable || !homepageData.categories.length) return;

    // Create dots
    dotsContainer.innerHTML = "";
    homepageData.categories.forEach((_, index) => {
        const dot = document.createElement("div");
        dot.classList.add("dashboard-dot");
        if (index === 0) dot.classList.add("active");
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll(".dashboard-dot");

    // Update dots on scroll
    scrollable.addEventListener("scroll", () => {
        const scrollLeft = scrollable.scrollLeft;
        const scrollWidth = scrollable.scrollWidth - scrollable.clientWidth;

        const activeIndex = Math.round((scrollLeft / scrollWidth) * (dots.length - 1));

        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === activeIndex);
        });
    });
}

function initializeCountdowns() {
    homepageData.deliveryPolicies.forEach((policy) => {
        if (policy.policy_type === "same_day" || policy.policy_type === "midnight") {
            updateCountdown(
                `${policy.policy_type}-countdown`,
                policy.countdown_hours || 5,
                policy.countdown_minutes || 4,
                policy.countdown_seconds || 54
            );
        }
    });
}

function updateCountdown(elementId, hours, minutes, seconds) {
    const countdownElement = document.getElementById(elementId);
    if (!countdownElement) return;

    const interval = setInterval(() => {
        if (seconds > 0) {
            seconds--;
        } else {
            if (minutes > 0) {
                minutes--;
                seconds = 59;
            } else {
                if (hours > 0) {
                    hours--;
                    minutes = 59;
                    seconds = 59;
                } else {
                    clearInterval(interval);
                    countdownElement.textContent = "00:00:00";
                    return;
                }
            }
        }

        const formattedHours = hours.toString().padStart(2, "0");
        const formattedMinutes = minutes.toString().padStart(2, "0");
        const formattedSeconds = seconds.toString().padStart(2, "0");

        countdownElement.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }, 1000);
}

function showLoading() {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "flex";
}

function hideLoading() {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
}

// Product interaction functions
function addToCart(productId) {
    // Implement add to cart functionality
    console.log('Adding product to cart:', productId);
    // You can integrate with your existing cart API here
}

function addToWishlist(productId) {
    // Implement add to wishlist functionality
    console.log('Adding product to wishlist:', productId);
    // You can integrate with your existing wishlist API here
}

// Initialize on page load
window.onload = () => {
    toggle_loader();

    // Scroll effect for menu
    window.addEventListener("scroll", () => {
        const menuBar = document.querySelector(".main-menu");
        const scrollTrigger = 95;

        if (window.scrollY >= scrollTrigger) {
            menuBar.classList.add("fixed-top");
        } else {
            menuBar.classList.remove("fixed-top");
        }
    });
};
