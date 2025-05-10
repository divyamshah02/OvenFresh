/**
 * OvenFresh Bakery - Mock API Service
 * This file simulates API calls to a backend service
 */

const API = {
    /**
     * Get all products with optional filtering
     * @param {Object} filters - Filter options
     * @param {string} filters.category - Product category
     * @param {number} filters.minPrice - Minimum price
     * @param {number} filters.maxPrice - Maximum price
     * @param {Array} filters.dietary - Dietary options
     * @param {number} filters.rating - Minimum rating
     * @param {string} filters.sort - Sort option
     * @param {number} filters.page - Page number
     * @param {number} filters.limit - Items per page
     * @returns {Promise} - Promise with products data
     */
    getProducts: (filters = {}) =>
      new Promise((resolve) => {
        // Simulate API delay
        setTimeout(() => {
          // All products data
          let products = [
            {
              id: "1",
              name: "Chocolate Cake",
              category: "Cakes",
              description: "Delicious chocolate cake with creamy frosting.",
              price: 25.99,
              reviews: 42,
              rating: 4.5,
              image: "img/chocolate_cake.jpg",
              dietary: ["nut-free"],
              featured: true,
              bestseller: true,
            },
            {
              id: "2",
              name: "Strawberry Tart",
              category: "Tarts",
              description: "Fresh strawberry tart with a flaky crust.",
              price: 19.99,
              reviews: 28,
              rating: 4.2,
              image: "img/strawberry_tart.jpg",
              dietary: ["nut-free"],
              featured: true,
              seasonal: true,
            },
            {
              id: "3",
              name: "Blueberry Muffin",
              category: "Muffins",
              description: "Classic blueberry muffin with a hint of lemon.",
              price: 3.99,
              reviews: 15,
              rating: 4.0,
              image: "img/blueberry_muffin.jpg",
              dietary: ["nut-free"],
              featured: false,
              bestseller: true,
            },
            {
              id: "4",
              name: "Croissant",
              category: "Pastries",
              description: "Buttery and flaky croissant.",
              price: 2.49,
              reviews: 35,
              rating: 4.7,
              image: "img/croissant.jpg",
              dietary: [],
              featured: false,
              bestseller: true,
            },
            {
              id: "5",
              name: "Lemon Cake",
              category: "Cakes",
              description: "Tangy lemon cake with a sweet glaze.",
              price: 27.99,
              reviews: 50,
              rating: 4.8,
              image: "img/lemon_cake.jpg",
              dietary: ["nut-free"],
              featured: true,
              seasonal: true,
            },
            {
              id: "6",
              name: "Apple Pie",
              category: "Pies",
              description: "Classic apple pie with a cinnamon spice.",
              price: 22.99,
              reviews: 40,
              rating: 4.6,
              image: "img/apple_pie.jpg",
              dietary: [],
              featured: true,
              bestseller: true,
            },
            {
              id: "7",
              name: "Chocolate Chip Cookie",
              category: "Cookies",
              description: "Classic chocolate chip cookie.",
              price: 1.99,
              reviews: 60,
              rating: 4.9,
              image: "img/chocolate_chip_cookie.jpg",
              dietary: [],
              featured: false,
              bestseller: true,
            },
            {
              id: "8",
              name: "Red Velvet Cake",
              category: "Cakes",
              description: "Rich red velvet cake with cream cheese frosting.",
              price: 30.99,
              reviews: 55,
              rating: 4.7,
              image: "img/red_velvet_cake.jpg",
              dietary: [],
              featured: true,
              seasonal: true,
            },
            {
              id: "9",
              name: "Cinnamon Roll",
              category: "Pastries",
              description: "Warm cinnamon roll with cream cheese icing.",
              price: 3.49,
              reviews: 38,
              rating: 4.5,
              image: "img/cinnamon_roll.jpg",
              dietary: [],
              featured: false,
              bestseller: true,
            },
            {
              id: "10",
              name: "Vanilla Cupcake",
              category: "Cupcakes",
              description: "Classic vanilla cupcake with buttercream frosting.",
              price: 2.99,
              reviews: 45,
              rating: 4.3,
              image: "img/vanilla_cupcake.jpg",
              dietary: ["nut-free"],
              featured: false,
              seasonal: true,
            },
            {
              id: "11",
              name: "Sourdough Bread",
              category: "Breads",
              description: "Artisan sourdough bread with a crispy crust.",
              price: 5.99,
              reviews: 30,
              rating: 4.6,
              image: "img/sourdough_bread.jpg",
              dietary: ["vegan"],
              featured: true,
              bestseller: false,
            },
            {
              id: "12",
              name: "Chocolate Eclair",
              category: "Pastries",
              description: "Chocolate eclair filled with vanilla custard.",
              price: 3.99,
              reviews: 25,
              rating: 4.4,
              image: "img/chocolate_eclair.jpg",
              dietary: [],
              featured: false,
              seasonal: true,
            },
            {
              id: "13",
              name: "Carrot Cake",
              category: "Cakes",
              description: "Moist carrot cake with cream cheese frosting.",
              price: 28.99,
              reviews: 48,
              rating: 4.7,
              image: "img/carrot_cake.jpg",
              dietary: [],
              featured: true,
              bestseller: false,
            },
            {
              id: "14",
              name: "Oatmeal Raisin Cookie",
              category: "Cookies",
              description: "Chewy oatmeal cookie with plump raisins.",
              price: 1.79,
              reviews: 22,
              rating: 4.1,
              image: "img/oatmeal_cookie.jpg",
              dietary: [],
              featured: false,
              bestseller: false,
            },
            {
              id: "15",
              name: "Blueberry Cheesecake",
              category: "Cakes",
              description: "Creamy cheesecake with blueberry topping.",
              price: 32.99,
              reviews: 65,
              rating: 4.9,
              image: "img/blueberry_cheesecake.jpg",
              dietary: [],
              featured: true,
              seasonal: true,
            },
            {
              id: "16",
              name: "Baguette",
              category: "Breads",
              description: "Traditional French baguette with a crispy crust.",
              price: 3.49,
              reviews: 33,
              rating: 4.5,
              image: "img/baguette.jpg",
              dietary: ["vegan"],
              featured: false,
              bestseller: true,
            },
          ]
  
          // Apply category filter
          if (filters.category && filters.category !== "all") {
            products = products.filter((product) => product.category.toLowerCase() === filters.category.toLowerCase())
          }
  
          // Apply price filter
          if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
            products = products.filter(
              (product) => product.price >= filters.minPrice && product.price <= filters.maxPrice,
            )
          }
  
          // Apply dietary filter
          if (filters.dietary && filters.dietary.length > 0) {
            products = products.filter((product) => filters.dietary.every((diet) => product.dietary.includes(diet)))
          }
  
          // Apply rating filter
          if (filters.rating && filters.rating > 0) {
            products = products.filter((product) => product.rating >= filters.rating)
          }
  
          // Apply sorting
          if (filters.sort) {
            switch (filters.sort) {
              case "price-low":
                products.sort((a, b) => a.price - b.price)
                break
              case "price-high":
                products.sort((a, b) => b.price - a.price)
                break
              case "name-asc":
                products.sort((a, b) => a.name.localeCompare(b.name))
                break
              case "name-desc":
                products.sort((a, b) => b.name.localeCompare(a.name))
                break
              case "rating":
                products.sort((a, b) => b.rating - a.rating)
                break
              default:
                // Featured sorting (default)
                products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
            }
          }
  
          // Calculate total count before pagination
          const totalCount = products.length
  
          // Apply pagination
          const page = filters.page || 1
          const limit = filters.limit || 8
          const startIndex = (page - 1) * limit
          const endIndex = page * limit
          const paginatedProducts = products.slice(startIndex, endIndex)
  
          // Calculate total pages
          const totalPages = Math.ceil(totalCount / limit)
  
          resolve({
            products: paginatedProducts,
            pagination: {
              total: totalCount,
              totalPages: totalPages,
              currentPage: page,
              limit: limit,
            },
          })
        }, 500)
      }),
  
    /**
     * Get a single product by ID
     * @param {string} productId - Product ID
     * @returns {Promise} - Promise with product data
     */
    getProduct: (productId) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const products = [
            {
              id: "1",
              name: "Chocolate Cake",
              category: "Cakes",
              description: "Delicious chocolate cake with creamy frosting.",
              price: 25.99,
              reviews: 42,
              rating: 4.5,
              images: ["img/chocolate_cake.jpg", "img/chocolate_cake_slice.jpg"],
              variations: [
                { id: "small", name: "Small", price: 25.99 },
                { id: "large", name: "Large", price: 49.99 },
              ],
              features: ["Rich chocolate flavor", "Creamy frosting", "Moist and delicious"],
            },
            {
              id: "2",
              name: "Strawberry Tart",
              category: "Tarts",
              description: "Fresh strawberry tart with a flaky crust.",
              price: 19.99,
              reviews: 28,
              rating: 4.2,
              images: ["img/strawberry_tart.jpg", "img/strawberry_tart_slice.jpg"],
              variations: [{ id: "regular", name: "Regular", price: 19.99 }],
              features: ["Fresh strawberries", "Flaky crust", "Light and refreshing"],
            },
            {
              id: "3",
              name: "Blueberry Muffin",
              category: "Muffins",
              description: "Classic blueberry muffin with a hint of lemon.",
              price: 3.99,
              reviews: 15,
              rating: 4.0,
              images: ["img/blueberry_muffin.jpg"],
              variations: [
                { id: "single", name: "Single", price: 3.99 },
                { id: "dozen", name: "Dozen", price: 39.99 },
              ],
              features: ["Bursting with blueberries", "Hint of lemon", "Perfect for breakfast"],
            },
            {
              id: "4",
              name: "Croissant",
              category: "Pastries",
              description: "Buttery and flaky croissant.",
              price: 2.49,
              reviews: 35,
              rating: 4.7,
              images: ["img/croissant.jpg"],
              variations: [
                { id: "plain", name: "Plain", price: 2.49 },
                { id: "chocolate", name: "Chocolate", price: 3.49 },
              ],
              features: ["Buttery and flaky", "Perfect with coffee", "Classic pastry"],
            },
            {
              id: "5",
              name: "Lemon Cake",
              category: "Cakes",
              description: "Tangy lemon cake with a sweet glaze.",
              price: 27.99,
              reviews: 50,
              rating: 4.8,
              images: ["img/lemon_cake.jpg"],
              variations: [
                { id: "small", name: "Small", price: 27.99 },
                { id: "large", name: "Large", price: 52.99 },
              ],
              features: ["Tangy lemon flavor", "Sweet glaze", "Moist and delicious"],
            },
            {
              id: "6",
              name: "Apple Pie",
              category: "Pies",
              description: "Classic apple pie with a cinnamon spice.",
              price: 22.99,
              reviews: 40,
              rating: 4.6,
              images: ["img/apple_pie.jpg"],
              variations: [
                { id: "whole", name: "Whole", price: 22.99 },
                { id: "slice", name: "Slice", price: 4.99 },
              ],
              features: ["Cinnamon spice", "Flaky crust", "Warm and comforting"],
            },
            {
              id: "7",
              name: "Chocolate Chip Cookie",
              category: "Cookies",
              description: "Classic chocolate chip cookie.",
              price: 1.99,
              reviews: 60,
              rating: 4.9,
              images: ["img/chocolate_chip_cookie.jpg"],
              variations: [
                { id: "single", name: "Single", price: 1.99 },
                { id: "dozen", name: "Dozen", price: 19.99 },
              ],
              features: ["Classic flavor", "Chewy texture", "Perfect snack"],
            },
            {
              id: "8",
              name: "Red Velvet Cake",
              category: "Cakes",
              description: "Rich red velvet cake with cream cheese frosting.",
              price: 30.99,
              reviews: 55,
              rating: 4.7,
              images: ["img/red_velvet_cake.jpg"],
              variations: [
                { id: "small", name: "Small", price: 30.99 },
                { id: "large", name: "Large", price: 59.99 },
              ],
              features: ["Cream cheese frosting", "Rich flavor", "Moist and delicious"],
            },
          ]
  
          const product = products.find((p) => p.id === productId)
          if (product) {
            resolve(product)
          } else {
            reject("Product not found")
          }
        }, 500)
      }),
  
    /**
     * Get related products
     * @param {string} productId - Current product ID
     * @param {number} limit - Number of related products to return
     * @returns {Promise} - Promise with related products data
     */
    getRelatedProducts: function (productId, limit = 4) {
      return new Promise((resolve) => {
        this.getProducts().then((response) => {
          let products = response.products
          // Filter out current product
          products = products.filter((product) => product.id !== productId)
          // Get random products
          const shuffled = products.sort(() => 0.5 - Math.random())
          const relatedProducts = shuffled.slice(0, limit)
          resolve(relatedProducts)
        })
      })
    },
  
    /**
     * Get seasonal products
     * @param {number} limit - Number of seasonal products to return
     * @returns {Promise} - Promise with seasonal products data
     */
    getSeasonalProducts: function (limit = 8) {
      return new Promise((resolve) => {
        this.getProducts().then((response) => {
          let products = response.products
          // Filter seasonal products
          products = products.filter((product) => product.seasonal)
          // Get limited number of products
          const seasonalProducts = products.slice(0, limit)
          resolve(seasonalProducts)
        })
      })
    },
  
    /**
     * Get bestseller products
     * @param {number} limit - Number of bestseller products to return
     * @returns {Promise} - Promise with bestseller products data
     */
    getBestsellers: function (limit = 8) {
      return new Promise((resolve) => {
        this.getProducts().then((response) => {
          let products = response.products
          // Filter bestseller products
          products = products.filter((product) => product.bestseller)
          // Get limited number of products
          const bestsellers = products.slice(0, limit)
          resolve(bestsellers)
        })
      })
    },
  
    /**
     * Get gift hampers
     * @param {number} limit - Number of hampers to return
     * @returns {Promise} - Promise with hampers data
     */
    getHampers: (limit = 3) =>
      new Promise((resolve) => {
        setTimeout(() => {
          const hampers = [
            {
              id: "h1",
              name: "Birthday Celebration",
              description: "Perfect for birthday celebrations with a variety of sweet treats.",
              price: 49.99,
              image: "img/birthday_hamper.jpg",
            },
            {
              id: "h2",
              name: "Afternoon Tea",
              description: "Enjoy a delightful afternoon tea with our selection of pastries and cakes.",
              price: 39.99,
              image: "img/tea_hamper.jpg",
            },
            {
              id: "h3",
              name: "Chocolate Lover's",
              description: "A dream come true for chocolate enthusiasts with our finest chocolate treats.",
              price: 44.99,
              image: "img/chocolate_hamper.jpg",
            },
          ]
  
          resolve(hampers.slice(0, limit))
        }, 500)
      }),
  
    /**
     * Get testimonials
     * @param {number} limit - Number of testimonials to return
     * @returns {Promise} - Promise with testimonials data
     */
    getTestimonials: (limit = 5) =>
      new Promise((resolve) => {
        setTimeout(() => {
          const testimonials = [
            {
              id: "t1",
              name: "Sarah Johnson",
              location: "New York",
              avatar: "img/avatar1.jpg",
              rating: 5,
              text: "The cakes from OvenFresh are absolutely amazing! I ordered a birthday cake for my daughter and it was not only beautiful but delicious too. Everyone at the party loved it!",
            },
            {
              id: "t2",
              name: "Michael Brown",
              location: "Chicago",
              avatar: "img/avatar2.jpg",
              rating: 4,
              text: "I've been buying bread from OvenFresh for months now and I can't go back to store-bought. The sourdough is exceptional and stays fresh for days. Highly recommend!",
            },
            {
              id: "t3",
              name: "Emily Wilson",
              location: "Los Angeles",
              avatar: "img/avatar3.jpg",
              rating: 5,
              text: "The gift hamper I ordered for my mom's birthday was perfect! Everything was beautifully packaged and the pastries were fresh and delicious. Will definitely order again!",
            },
            {
              id: "t4",
              name: "David Thompson",
              location: "Boston",
              avatar: "img/avatar4.jpg",
              rating: 5,
              text: "I've tried many bakeries in the city, but OvenFresh stands out for their quality and consistency. Their chocolate chip cookies are the best I've ever had!",
            },
            {
              id: "t5",
              name: "Jennifer Martinez",
              location: "Miami",
              avatar: "img/avatar5.jpg",
              rating: 4,
              text: "The cupcakes from OvenFresh were the highlight of our office party. Everyone was asking where they came from. The delivery was prompt and the packaging was excellent.",
            },
          ]
  
          resolve(testimonials.slice(0, limit))
        }, 500)
      }),
  
    /**
     * Check delivery availability
     * @param {string} pincode - Delivery pincode
     * @returns {Promise} - Promise with delivery availability data
     */
    checkDeliveryAvailability: (pincode) =>
      new Promise((resolve) => {
        setTimeout(() => {
          // Mock delivery check - pincodes starting with '12' are available
          const available = pincode.startsWith("12")
          resolve({
            available: available,
            message: available ? "Delivery available!" : "Delivery not available in this area.",
          })
        }, 500)
      }),
  
    /**
     * Subscribe to newsletter
     * @param {string} email - User email
     * @returns {Promise} - Promise with subscription result
     */
    subscribeNewsletter: (email) =>
      new Promise((resolve) => {
        setTimeout(() => {
          // Mock subscription - always successful
          resolve({
            success: true,
            message: "Thank you for subscribing to our newsletter!",
          })
        }, 500)
      }),
  }
  