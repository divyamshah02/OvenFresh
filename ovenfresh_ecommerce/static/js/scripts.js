/**
 * ShopAdmin Theme Library JavaScript
 * Handles all interactive functionality for the theme
 */

// ===== GLOBAL VARIABLES =====
let currentTheme = 'ovenfresh-theme';
let currentSection = 'dashboard';
let bootstrap; // Declare the bootstrap variable

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeNavigation();
    initializeInteractiveElements();
    initializeTooltips();
    loadSavedTheme();
});

// ===== THEME MANAGEMENT =====
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('#theme-toggle i');
    
    if (body.classList.contains('ovenfresh-theme')) {
        body.classList.remove('ovenfresh-theme');
        body.classList.add('dark-theme');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        currentTheme = 'dark-theme';
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('ovenfresh-theme');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        currentTheme = 'ovenfresh-theme';
    }
    
    saveTheme();
    showToast('success', 'Theme Changed', `Switched to ${currentTheme === 'dark-theme' ? 'dark' : 'light'} theme`);
}

function saveTheme() {
    localStorage.setItem('shopAdminTheme', currentTheme);
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('shopAdminTheme');
    if (savedTheme && savedTheme !== currentTheme) {
        toggleTheme();
    }
}

// ===== NAVIGATION MANAGEMENT =====
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const mobileToggle = document.querySelector('.navbar-toggler');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            setActiveNavItem(this);
            
            // Close mobile sidebar if open
            if (window.innerWidth < 768) {
                closeMobileSidebar();
            }
        });
    });
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileSidebar);
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        try {
            if (window.innerWidth < 768) {
                const sidebar = document.getElementById('sidebar');
                const toggle = document.querySelector('.navbar-toggler');
                
                if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                    closeMobileSidebar();
                }
            }
        } catch {
            
        }
    });
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('fade-in');
        currentSection = sectionId;
        
        // Update page title
        updatePageTitle(sectionId);
    }
}

function setActiveNavItem(activeLink) {
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to clicked link
    activeLink.classList.add('active');
}

function updatePageTitle(sectionId) {
    const titleMap = {
        'dashboard': 'Dashboard',
        'buttons': 'Buttons',
        'forms': 'Forms',
        'tables': 'Tables',
        'cards': 'Cards',
        'modals': 'Modals',
        'alerts': 'Alerts & Badges',
        'navigation': 'Navigation',
        'utilities': 'Utilities'
    };
    
    const pageTitle = document.querySelector('main h1');
    if (pageTitle && titleMap[sectionId]) {
        pageTitle.textContent = `ShopAdmin Theme Library - ${titleMap[sectionId]}`;
    }
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('show');
}

// ===== INTERACTIVE ELEMENTS =====
function initializeInteractiveElements() {
    initializeSelectAllCheckbox();
    initializeLoadingButton();
    initializeFormValidation();
    initializeTabSwitching();
}

function initializeSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
}

function initializeLoadingButton() {
    const loadingBtn = document.getElementById('loadingBtn');
    if (loadingBtn) {
        loadingBtn.addEventListener('click', function() {
            const spinner = this.querySelector('.spinner-border');
            const text = this.querySelector('.btn-text');
            
            if (spinner && text) {
                spinner.style.display = 'inline-block';
                text.textContent = 'Loading...';
                this.disabled = true;
                
                setTimeout(() => {
                    spinner.style.display = 'none';
                    text.textContent = 'Click to Load';
                    this.disabled = false;
                    showToast('success', 'Loaded!', 'Content loaded successfully');
                }, 2000);
            }
        });
    }
}

function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
                showToast('error', 'Validation Error', 'Please fill in all required fields');
            } else {
                e.preventDefault();
                showToast('success', 'Form Submitted', 'Form submitted successfully');
            }
            form.classList.add('was-validated');
        });
    });
}

function initializeTabSwitching() {
    const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs and content
            const tabContainer = this.closest('.nav-tabs').parentElement;
            const allTabs = tabContainer.querySelectorAll('.nav-link');
            const allContent = tabContainer.querySelectorAll('.tab-pane');
            
            allTabs.forEach(tab => tab.classList.remove('active'));
            allContent.forEach(content => {
                content.classList.remove('show', 'active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const targetId = this.getAttribute('data-bs-target');
            const targetContent = document.querySelector(targetId);
            if (targetContent) {
                targetContent.classList.add('show', 'active');
            }
        });
    });
}

// ===== TOOLTIP MANAGEMENT =====
function initializeTooltips() {
    // Initialize Bootstrap tooltips if available
    if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Tooltip) {
        bootstrap = window.bootstrap; // Assign the bootstrap variable
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(type, title, message) {
    const toastContainer = getOrCreateToastContainer();
    const toastId = `toast-${Date.now()}`;
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${getToastBgClass(type)} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <div class="d-flex align-items-center">
                    <i class="${getToastIcon(type)} me-2"></i>
                    <div>
                        <strong>${title}</strong>
                        <div class="small">${message}</div>
                    </div>
                </div>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="closeToast('${toastId}')" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
        closeToast(toastId);
    }, 5000);
}

function getOrCreateToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    return container;
}

function getToastBgClass(type) {
    const classMap = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'primary'
    };
    return classMap[type] || 'primary';
}

function getToastIcon(type) {
    const iconMap = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    return iconMap[type] || 'fas fa-info-circle';
}

function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
}

// ===== UTILITY FUNCTIONS =====
function showLoading(message = 'Loading...') {
    let loadingEl = document.getElementById('globalLoading');
    
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'globalLoading';
        loadingEl.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
        loadingEl.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loadingEl.style.zIndex = '9999';
        
        loadingEl.innerHTML = `
            <div class="card p-4 shadow">
                <div class="d-flex align-items-center">
                    <div class="spinner-border text-primary me-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div id="loadingMessage">${message}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(loadingEl);
    } else {
        document.getElementById('loadingMessage').textContent = message;
        loadingEl.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingEl = document.getElementById('globalLoading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('success', 'Copied!', 'Text copied to clipboard');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('success', 'Copied!', 'Text copied to clipboard');
    } catch (err) {
        showToast('error', 'Copy Failed', 'Failed to copy text to clipboard');
    }
    
    document.body.removeChild(textArea);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search (if implemented)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        showToast('info', 'Search', 'Search functionality would be implemented here');
    }
    
    // Ctrl/Cmd + T for theme toggle
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        toggleTheme();
    }
    
    // Escape to close modals or mobile sidebar
    if (e.key === 'Escape') {
        closeMobileSidebar();
        // Close any open modals
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }
});

// ===== PERFORMANCE MONITORING =====
function measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
}

// ===== ACCESSIBILITY HELPERS =====
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// ===== EXPORT FOR GLOBAL USE =====
window.ShopAdminTheme = {
    showToast,
    showLoading,
    hideLoading,
    toggleTheme,
    showSection,
    copyToClipboard,
    debounce,
    throttle,
    announceToScreenReader
};

// ===== CONSOLE WELCOME MESSAGE =====
// console.log(`
// 🎨 ShopAdmin Theme Library Loaded
// 📱 Current Theme: ${currentTheme}
// 🔧 Available Methods: ShopAdminTheme.*
// ⌨️  Keyboard Shortcuts:
//    • Ctrl/Cmd + T: Toggle Theme
//    • Ctrl/Cmd + K: Search (placeholder)
//    • Escape: Close modals/sidebar
// `);