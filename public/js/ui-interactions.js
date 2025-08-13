/**
 * KILANGDM UI INTERACTIONS
 * Enhanced UI/UX interactions for better user experience
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUIInteractions);
    } else {
        initializeUIInteractions();
    }

    function initializeUIInteractions() {
        console.log('🎯 Initializing UI Interactions...');
        
        // Initialize all interaction modules
        initializeMobileMenu();
        initializeFloatingHomeButton();
        initializeSmartScroll();
        initializeTouchOptimizations();
        initializeAccessibilityFeatures();
        initializePerformanceOptimizations();
        initializeSearchEnhancements();
        initializeFormEnhancements();
        
        console.log('✅ UI Interactions initialized successfully');
    }

    /**
     * Mobile Menu Interactions
     */
    function initializeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');
        
        if (!mobileMenuBtn || !navLinks) return;

        let isMenuOpen = false;

        // Toggle mobile menu
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            isMenuOpen = !isMenuOpen;
            
            if (isMenuOpen) {
                navLinks.classList.add('mobile-active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
                mobileMenuBtn.setAttribute('aria-expanded', 'true');
                mobileMenuBtn.setAttribute('aria-label', 'Tutup menu');
                
                // Add backdrop click listener
                setTimeout(() => {
                    document.addEventListener('click', closeMenuOnOutsideClick);
                }, 100);
            } else {
                closeMenu();
            }
        });

        // Close menu when clicking outside
        function closeMenuOnOutsideClick(e) {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                closeMenu();
            }
        }

        // Close menu function
        function closeMenu() {
            isMenuOpen = false;
            navLinks.classList.remove('mobile-active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.setAttribute('aria-label', 'Buka menu');
            document.removeEventListener('click', closeMenuOnOutsideClick);
        }

        // Close menu on window resize if in desktop mode
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && isMenuOpen) {
                closeMenu();
            }
        });

        // Close menu when nav link is clicked
        navLinks.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav-link')) {
                closeMenu();
            }
        });
    }

    /**
     * Floating Home Button
     */
    function initializeFloatingHomeButton() {
        const homeBtn = document.getElementById('homeBtn');
        
        if (!homeBtn) return;

        homeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add click animation
            homeBtn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                homeBtn.style.transform = '';
            }, 150);
            
            // Navigate to dashboard
            setTimeout(() => {
                if (window.location.pathname.includes('dashboard.html')) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 200);
        });

        // Hide/show on scroll for mobile
        if (window.innerWidth <= 768) {
            let lastScrollY = window.scrollY;
            let ticking = false;

            function updateFloatingButton() {
                const currentScrollY = window.scrollY;
                
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    // Scrolling down - hide button
                    homeBtn.style.transform = 'translateY(100px)';
                } else {
                    // Scrolling up - show button
                    homeBtn.style.transform = 'translateY(0)';
                }
                
                lastScrollY = currentScrollY;
                ticking = false;
            }

            window.addEventListener('scroll', function() {
                if (!ticking) {
                    requestAnimationFrame(updateFloatingButton);
                    ticking = true;
                }
            });
        }
    }

    /**
     * Smart Scroll Behaviors
     */
    function initializeSmartScroll() {
        let lastScrollY = window.scrollY;
        let ticking = false;

        function updateScrollBehaviors() {
            const currentScrollY = window.scrollY;
            const navbar = document.querySelector('.main-nav');
            
            if (navbar) {
                if (currentScrollY > 50) {
                    navbar.style.background = 'rgba(30, 41, 59, 0.95)';
                    navbar.style.backdropFilter = 'blur(20px)';
                    navbar.style.borderBottom = '2px solid rgba(59, 130, 246, 0.3)';
                } else {
                    navbar.style.background = 'rgba(30, 41, 59, 0.8)';
                    navbar.style.backdropFilter = 'blur(12px)';
                    navbar.style.borderBottom = '1px solid rgba(148, 163, 184, 0.2)';
                }
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateScrollBehaviors);
                ticking = true;
            }
        }, { passive: true });
    }

    /**
     * Touch Optimizations
     */
    function initializeTouchOptimizations() {
        // Add touch class to body on touch devices
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }

        // Improve touch feedback
        const touchElements = document.querySelectorAll('.nav-link, .btn, .kpi-card, .chart-card');
        
        touchElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            }, { passive: true });
            
            element.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.transform = '';
                }, 100);
            }, { passive: true });
        });

        // Prevent zoom on input focus (iOS)
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                if (window.innerWidth <= 768) {
                    document.querySelector('meta[name=viewport]').content = 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                }
            });
            
            input.addEventListener('blur', function() {
                if (window.innerWidth <= 768) {
                    document.querySelector('meta[name=viewport]').content = 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                }
            });
        });
    }

    /**
     * Accessibility Features
     */
    function initializeAccessibilityFeatures() {
        // Add ARIA labels where missing
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn && !mobileMenuBtn.getAttribute('aria-label')) {
            mobileMenuBtn.setAttribute('aria-label', 'Buka menu navigasi');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }

        // Add keyboard navigation
        document.addEventListener('keydown', function(e) {
            // ESC key closes mobile menu
            if (e.key === 'Escape') {
                const navLinks = document.getElementById('navLinks');
                if (navLinks && navLinks.classList.contains('mobile-active')) {
                    document.getElementById('mobileMenuBtn').click();
                }
            }
            
            // Enter/Space on buttons
            if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('btn')) {
                e.preventDefault();
                e.target.click();
            }
        });

        // Focus management
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', function() {
                this.style.outline = '2px solid #3b82f6';
                this.style.outlineOffset = '2px';
            });
            
            element.addEventListener('blur', function() {
                this.style.outline = '';
                this.style.outlineOffset = '';
            });
        });
    }

    /**
     * Performance Optimizations
     */
    function initializePerformanceOptimizations() {
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        if (images.length > 0 && 'IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }

        // Preload critical resources
        if (window.innerWidth > 768) {
            const criticalPages = ['dashboard.html', 'marketing.html', 'salesteam.html'];
            criticalPages.forEach(page => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = page;
                document.head.appendChild(link);
            });
        }

        // Memory cleanup on page unload
        window.addEventListener('beforeunload', function() {
            // Cancel any ongoing animations
            const animatedElements = document.querySelectorAll('[style*="transition"]');
            animatedElements.forEach(el => {
                el.style.transition = 'none';
            });
        });
    }

    /**
     * Search Enhancements
     */
    function initializeSearchEnhancements() {
        const searchInput = document.getElementById('dashboard-search');
        
        if (!searchInput) return;

        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(() => {
                const query = this.value.toLowerCase().trim();
                
                if (query.length > 0) {
                    highlightSearchResults(query);
                } else {
                    clearSearchHighlights();
                }
            }, 300);
        });

        // Clear search on escape
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                clearSearchHighlights();
            }
        });

        function highlightSearchResults(query) {
            const searchableElements = document.querySelectorAll(
                '.kpi-title, .section-title, .chart-title, .metric-title'
            );
            
            searchableElements.forEach(element => {
                const text = element.textContent.toLowerCase();
                const parentCard = element.closest('.kpi-card, .chart-card, .metric-card, .dashboard-section');
                
                if (text.includes(query)) {
                    parentCard?.classList.add('search-highlight');
                } else {
                    parentCard?.classList.remove('search-highlight');
                }
            });
        }

        function clearSearchHighlights() {
            const highlightedElements = document.querySelectorAll('.search-highlight');
            highlightedElements.forEach(element => {
                element.classList.remove('search-highlight');
            });
        }
    }

    /**
     * Form Enhancements
     */
    function initializeFormEnhancements() {
        // Auto-resize textareas
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
        });

        // Form validation feedback
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                const requiredFields = form.querySelectorAll('[data-validate-field="required"]');
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        field.style.borderColor = '#ef4444';
                        field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                        isValid = false;
                    } else {
                        field.style.borderColor = '';
                        field.style.boxShadow = '';
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                    // Focus first invalid field
                    const firstInvalid = form.querySelector('[style*="border-color: rgb(239, 68, 68)"]');
                    if (firstInvalid) {
                        firstInvalid.focus();
                        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            });
        });

        // Date input enhancements
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            // Set max date to today for most date inputs
            if (!input.hasAttribute('max')) {
                input.setAttribute('max', new Date().toISOString().split('T')[0]);
            }
        });
    }

    // Add search highlight styles
    const searchStyles = document.createElement('style');
    searchStyles.textContent = `
        .search-highlight {
            border: 2px solid #3b82f6 !important;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
            transform: scale(1.02) !important;
            z-index: 10 !important;
            position: relative !important;
        }
        
        .touch-device .nav-link:active,
        .touch-device .btn:active {
            background-color: rgba(59, 130, 246, 0.1) !important;
        }
    `;
    document.head.appendChild(searchStyles);

    // Export functions for external use
    window.KilangDMUI = {
        version: '1.0.0',
        initializeUIInteractions: initializeUIInteractions
    };

})();