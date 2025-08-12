// Mobile-first responsive enhancements for KilangDM
document.addEventListener('DOMContentLoaded', function() {
    
    // ===================================================
    // MOBILE NAVIGATION HANDLER
    // ===================================================
    function setupMobileNavigation() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');
        
        // Create mobile menu button if it doesn't exist
        if (!mobileMenuBtn && navLinks) {
            const menuBtn = document.createElement('button');
            menuBtn.id = 'mobileMenuBtn';
            menuBtn.className = 'mobile-menu-btn';
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            
            // Insert after nav-brand
            const navBrand = document.querySelector('.nav-brand');
            if (navBrand && navBrand.parentNode) {
                navBrand.parentNode.insertBefore(menuBtn, navBrand.nextSibling);
            }
        }
        
        // Mobile menu toggle functionality
        const menuBtn = document.getElementById('mobileMenuBtn');
        if (menuBtn && navLinks) {
            menuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                navLinks.classList.toggle('mobile-active');
                
                // Update icon
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    if (navLinks.classList.contains('mobile-active')) {
                        icon.className = 'fas fa-times';
                    } else {
                        icon.className = 'fas fa-bars';
                    }
                }
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
                    navLinks.classList.remove('mobile-active');
                    const icon = menuBtn.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-bars';
                    }
                }
            });
            
            // Close menu when clicking nav link
            navLinks.addEventListener('click', function(e) {
                if (e.target.classList.contains('nav-link')) {
                    navLinks.classList.remove('mobile-active');
                    const icon = menuBtn.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-bars';
                    }
                }
            });
        }
    }
    
    // ===================================================
    // RESPONSIVE TABLES
    // ===================================================
    function makeTablesResponsive() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            if (!table.parentNode.classList.contains('table-container')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-container';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }
    
    // ===================================================
    // RESPONSIVE CHARTS
    // ===================================================
    function makeChartsResponsive() {
        // Wait for Chart.js to be available
        if (typeof Chart !== 'undefined') {
            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;
            
            // Update existing charts
            Object.values(Chart.instances || {}).forEach(chart => {
                chart.options.responsive = true;
                chart.options.maintainAspectRatio = false;
                chart.resize();
            });
        }
        
        // Make chart containers responsive
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            if (!container.style.position) {
                container.style.position = 'relative';
            }
            if (!container.style.height && window.innerWidth < 768) {
                container.style.height = '300px';
            }
        });
    }
    
    // ===================================================
    // RESPONSIVE FORMS
    // ===================================================
    function enhanceFormsForMobile() {
        // Add proper input types for mobile keyboards
        const inputs = document.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            const name = input.name || input.id || '';
            const placeholder = input.placeholder || '';
            
            // Email detection
            if (name.includes('email') || placeholder.toLowerCase().includes('email')) {
                input.type = 'email';
            }
            // Phone detection
            else if (name.includes('phone') || name.includes('tel') || placeholder.toLowerCase().includes('phone')) {
                input.type = 'tel';
            }
            // Number detection
            else if (name.includes('number') || name.includes('amount') || name.includes('price')) {
                input.type = 'number';
            }
        });
        
        // Prevent zoom on input focus for iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (parseFloat(getComputedStyle(input).fontSize) < 16) {
                    input.style.fontSize = '16px';
                }
            });
        }
    }
    
    // ===================================================
    // RESPONSIVE UPLOAD AREAS
    // ===================================================
    function enhanceUploadAreasForMobile() {
        const uploadAreas = document.querySelectorAll('.upload-area');
        uploadAreas.forEach(area => {
            // Add mobile-friendly text
            const text = area.querySelector('.upload-text');
            if (text && window.innerWidth < 768) {
                const mobileText = text.querySelector('.mobile-text');
                if (!mobileText) {
                    const mobile = document.createElement('div');
                    mobile.className = 'mobile-text';
                    mobile.innerHTML = '<small>Tap to select files</small>';
                    text.appendChild(mobile);
                }
            }
            
            // Improve touch targets
            if ('ontouchstart' in window) {
                area.style.minHeight = '120px';
            }
        });
    }
    
    // ===================================================
    // RESPONSIVE GRID ADJUSTMENTS
    // ===================================================
    function adjustGridsForViewport() {
        const viewportWidth = window.innerWidth;
        
        // Adjust KPI grids
        const kpiGrids = document.querySelectorAll('.kpi-grid');
        kpiGrids.forEach(grid => {
            if (viewportWidth < 480) {
                grid.style.gridTemplateColumns = '1fr';
            } else if (viewportWidth < 768) {
                grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else if (viewportWidth < 1024) {
                grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else if (viewportWidth < 1200) {
                grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            } else {
                grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
            }
        });
        
        // Adjust main container grids
        const mainContainers = document.querySelectorAll('.main-container.grid');
        mainContainers.forEach(container => {
            if (viewportWidth < 768) {
                container.style.gridTemplateColumns = '1fr';
            } else {
                container.style.gridTemplateColumns = '1fr 1fr';
            }
        });
    }
    
    // ===================================================
    // RESPONSIVE MODAL/POPUP HANDLING
    // ===================================================
    function enhanceModalsForMobile() {
        const modals = document.querySelectorAll('.modal, .popup, .dropdown');
        modals.forEach(modal => {
            if (window.innerWidth < 768) {
                modal.classList.add('mobile-modal');
                
                // Ensure modals don't exceed viewport
                modal.style.maxWidth = '90vw';
                modal.style.maxHeight = '90vh';
                modal.style.overflow = 'auto';
            }
        });
    }
    
    // ===================================================
    // TOUCH GESTURE ENHANCEMENTS
    // ===================================================
    function addTouchGestures() {
        // Add swipe to close for mobile nav
        const navLinks = document.getElementById('navLinks');
        if (navLinks && 'ontouchstart' in window) {
            let startX = 0;
            let startY = 0;
            
            navLinks.addEventListener('touchstart', function(e) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });
            
            navLinks.addEventListener('touchend', function(e) {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = startX - endX;
                const diffY = startY - endY;
                
                // Swipe left to close
                if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
                    navLinks.classList.remove('mobile-active');
                    const menuBtn = document.getElementById('mobileMenuBtn');
                    if (menuBtn) {
                        const icon = menuBtn.querySelector('i');
                        if (icon) icon.className = 'fas fa-bars';
                    }
                }
            }, { passive: true });
        }
    }
    
    // ===================================================
    // RESPONSIVE TEXT SCALING
    // ===================================================
    function adjustTextForViewport() {
        const viewportWidth = window.innerWidth;
        
        if (viewportWidth < 480) {
            document.documentElement.style.fontSize = '14px';
        } else if (viewportWidth < 768) {
            document.documentElement.style.fontSize = '15px';
        } else {
            document.documentElement.style.fontSize = '16px';
        }
    }
    
    // ===================================================
    // PERFORMANCE OPTIMIZATIONS
    // ===================================================
    function optimizeForMobile() {
        // Reduce animations on mobile
        if (window.innerWidth < 768) {
            const style = document.createElement('style');
            style.textContent = `
                * {
                    transition-duration: 0.1s !important;
                    animation-duration: 0.1s !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        }
    }
    
    // ===================================================
    // ORIENTATION CHANGE HANDLER
    // ===================================================
    function handleOrientationChange() {
        // Small delay to ensure viewport has updated
        setTimeout(() => {
            adjustGridsForViewport();
            makeChartsResponsive();
            adjustTextForViewport();
        }, 100);
    }
    
    // ===================================================
    // VIEWPORT RESIZE HANDLER
    // ===================================================
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                adjustGridsForViewport();
                makeChartsResponsive();
                adjustTextForViewport();
                enhanceModalsForMobile();
            });
        }, 100); // Reduced from 150ms to 100ms
    }
    
    // ===================================================
    // INITIALIZE ALL RESPONSIVE FEATURES
    // ===================================================
    function initializeResponsiveFeatures() {
        setupMobileNavigation();
        makeTablesResponsive();
        makeChartsResponsive();
        enhanceFormsForMobile();
        enhanceUploadAreasForMobile();
        adjustGridsForViewport();
        enhanceModalsForMobile();
        addTouchGestures();
        adjustTextForViewport();
        optimizeForMobile();
        
        console.log('📱 Responsive enhancements initialized');
    }
    
    // ===================================================
    // EVENT LISTENERS
    // ===================================================
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Initialize on DOM ready
    initializeResponsiveFeatures();
    
    // Re-initialize after dynamic content loads
    const observer = new MutationObserver((mutations) => {
        let shouldReinitialize = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldReinitialize = true;
            }
        });
        
        if (shouldReinitialize) {
            setTimeout(() => {
                makeTablesResponsive();
                enhanceFormsForMobile();
                adjustGridsForViewport();
            }, 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // ===================================================
    // GLOBAL RESPONSIVE UTILITIES
    // ===================================================
    window.KilangDMResponsive = {
        adjustGrids: adjustGridsForViewport,
        makeChartsResponsive: makeChartsResponsive,
        makeTablesResponsive: makeTablesResponsive,
        reinitialize: initializeResponsiveFeatures
    };
});

console.log('📱 KilangDM Responsive Enhancement System loaded!');