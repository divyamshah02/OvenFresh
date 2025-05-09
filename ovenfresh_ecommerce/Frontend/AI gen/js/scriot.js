/**
 * Oven Fresh Bakery E-commerce Website
 * Custom JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Back to Top Button
    const backToTopButton = document.querySelector('.back-to-top');
    
    if (backToTopButton) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('active');
            } else {
                backToTopButton.classList.remove('active');
            }
        });
        
        backToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Product Image Zoom Effect
    const productImages = document.querySelectorAll('.product-thumb img');
    
    productImages.forEach(img => {
        img.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        img.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Add to Cart Functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn, .add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get product info
            let productCard = this.closest('.product-card');
            let productTitle = '';
            let productPrice = '';
            
            if (productCard) {
                productTitle = productCard.querySelector('.product-title').textContent;
                productPrice = productCard.querySelector('.product-price').textContent;
            } else {
                // For featured product
                productTitle = document.querySelector('.featured-cake-content h2').textContent;
                productPrice = document.querySelector('.featured-price-box .price').textContent;
            }
            
            // Show notification
            showNotification(`${productTitle} added to cart - ${productPrice}`);
            
            // Update cart count (this would be more sophisticated in a real app)
            updateCartCount();
        });
    });
    
    // Notification System
    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add styles
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'white';
        notification.style.color = 'var(--brown)';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.justifyContent = 'space-between';
        notification.style.minWidth = '300px';
        notification.style.zIndex = '9999';
        notification.style.transform = 'translateY(100px)';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease';
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Close button functionality
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', function() {
            hideNotification(notification);
        });
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideNotification(notification);
        }, 5000);
    }
    
    function hideNotification(notification) {
        notification.style.transform = 'translateY(100px)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
    
    // Update Cart Count
    function updateCartCount() {
        const cartCountElement = document.querySelector('.top-links a:last-child');
        if (cartCountElement) {
            // Extract current count
            const currentText = cartCountElement.textContent;
            const match = currentText.match(/$$(\d+)$$/);
            let count = 0;
            
            if (match) {
                count = parseInt(match[1]);
            }
            
            // Increment count
            count++;
            
            // Update text
            cartCountElement.innerHTML = `<i class="fas fa-shopping-bag me-1"></i> Cart (${count})`;
        }
    }
    
    // Add decorative elements
    addDecorativeElements();
    
    function addDecorativeElements() {
        // Add cake decorations
        const cakeDecorations = [
            { position: 'top-left', icon: '🍰' },
            { position: 'bottom-right', icon: '🧁' }
        ];
        
        cakeDecorations.forEach(decoration => {
            const element = document.createElement('div');
            element.className = `cake-decoration ${decoration.position}`;
            element.style.fontSize = '100px';
            element.textContent = decoration.icon;
            document.body.appendChild(element);
        });
        
        // Add sprinkles background to certain sections
        const sectionsWithBg = [
            document.querySelector('.seasonal-section'),
            document.querySelector('.hampers-section')
        ];
        
        sectionsWithBg.forEach(section => {
            if (section) {
                section.style.position = 'relative';
                const sprinklesBg = document.createElement('div');
                sprinklesBg.className = 'sprinkles-bg';
                section.appendChild(sprinklesBg);
            }
        });
    }
    
    // Initialize product quantity selector if on product page
    const quantitySelector = document.querySelector('.quantity-selector');
    if (quantitySelector) {
        const minusBtn = quantitySelector.querySelector('.quantity-minus');
        const plusBtn = quantitySelector.querySelector('.quantity-plus');
        const input = quantitySelector.querySelector('input');
        
        minusBtn.addEventListener('click', function() {
            let value = parseInt(input.value);
            if (value > 1) {
                input.value = value - 1;
            }
        });
        
        plusBtn.addEventListener('click', function() {
            let value = parseInt(input.value);
            input.value = value + 1;
        });
    }
    
    // Initialize pincode checker if on product page
    const pincodeForm = document.querySelector('.pincode-checker form');
    if (pincodeForm) {
        pincodeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = this.querySelector('input');
            const pincode = input.value.trim();
            
            if (pincode) {
                // This would be an API call in a real application
                // For demo, we'll just show a success message
                const resultElement = document.querySelector('.pincode-result');
                resultElement.textContent = 'Delivery available to this location! (2-3 business days)';
                resultElement.style.color = 'green';
                resultElement.style.display = 'block';
            }
        });
    }
});