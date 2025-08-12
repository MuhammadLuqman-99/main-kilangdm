/**
 * PRODUCTION OPTIMIZATIONS
 * Critical optimizations for production deployment
 */

(function() {
    'use strict';

    // 1. CRITICAL LOADING OPTIMIZATION
    // Preload critical resources
    function preloadCriticalResources() {
        const criticalResources = [
            '/js/firebase-config.js',
            '/style/unified-theme.css',
            '/style/style.css'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = resource.endsWith('.js') ? 'script' : 'style';
            link.href = resource;
            document.head.appendChild(link);
        });
    }

    // 2. LAZY LOAD NON-CRITICAL SCRIPTS
    function lazyLoadScripts() {
        const nonCriticalScripts = [
            '/js/advanced-search.js',
            '/js/export-manager.js',
            '/js/notification-system.js'
        ];

        // Load after main content is ready
        window.addEventListener('load', function() {
            setTimeout(() => {
                nonCriticalScripts.forEach(script => {
                    const scriptEl = document.createElement('script');
                    scriptEl.src = script;
                    scriptEl.async = true;
                    document.body.appendChild(scriptEl);
                });
            }, 2000);
        });
    }

    // 3. MINIMIZE REPAINTS & REFLOWS
    function optimizeRendering() {
        // Batch DOM operations
        const batchedOperations = [];
        
        window.batchDOMUpdate = function(callback) {
            batchedOperations.push(callback);
            
            if (batchedOperations.length === 1) {
                requestAnimationFrame(() => {
                    const operations = batchedOperations.splice(0);
                    operations.forEach(op => op());
                });
            }
        };
    }

    // 4. MEMORY MANAGEMENT
    function setupMemoryManagement() {
        // Clear unused event listeners
        window.addEventListener('beforeunload', function() {
            // Clear all intervals/timeouts
            for (let i = 1; i < 10000; i++) {
                clearInterval(i);
                clearTimeout(i);
            }
        });

        // Monitor memory usage
        if (window.performance && window.performance.memory) {
            const checkMemory = () => {
                const memory = window.performance.memory;
                const memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
                
                if (memoryUsage > 0.9) {
                    console.warn('⚠️ High memory usage detected:', Math.round(memoryUsage * 100) + '%');
                    // Trigger garbage collection if available
                    if (window.gc) window.gc();
                }
            };
            
            setInterval(checkMemory, 30000); // Check every 30 seconds
        }
    }

    // 5. CACHE OPTIMIZATION
    function setupCacheOptimization() {
        // Service Worker registration
        if ('serviceWorker' in navigator && 'production' === 'production') {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered');
                    
                    // Update available
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Show update notification
                                if (window.kilangDMEnhancements) {
                                    window.kilangDMEnhancements.showNotification(
                                        'Update tersedia! Refresh untuk mendapatkan versi terbaru.', 
                                        'info', 
                                        0
                                    );
                                }
                            }
                        });
                    });
                })
                .catch(err => console.error('❌ Service Worker registration failed:', err));
        }
    }

    // 6. CRITICAL ERROR BOUNDARY
    function setupErrorBoundary() {
        window.addEventListener('unhandledrejection', function(event) {
            console.error('💥 Unhandled Promise Rejection:', event.reason);
            
            // Show user-friendly error
            if (window.kilangDMEnhancements) {
                window.kilangDMEnhancements.showNotification(
                    'Terjadi ralat teknikal. Sila refresh halaman.', 
                    'error', 
                    5000
                );
            }
            
            event.preventDefault();
        });

        window.addEventListener('error', function(event) {
            // Critical JavaScript errors
            if (event.filename && (event.filename.includes('firebase') || event.filename.includes('dashboard'))) {
                console.error('💥 Critical Script Error:', event.error);
                
                // Show fallback UI
                const fallbackMsg = document.createElement('div');
                fallbackMsg.style.cssText = `
                    position: fixed; top: 0; left: 0; right: 0; z-index: 10000;
                    background: #ef4444; color: white; padding: 16px; text-align: center;
                    font-family: Arial, sans-serif; font-size: 14px;
                `;
                fallbackMsg.innerHTML = '⚠️ Sistem mengalami masalah teknikal. Sila refresh halaman atau hubungi sokongan.';
                document.body.appendChild(fallbackMsg);
            }
        });
    }

    // 7. PERFORMANCE MONITORING
    function setupPerformanceMonitoring() {
        // Core Web Vitals
        function measureCoreWebVitals() {
            // Largest Contentful Paint (LCP)
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    const lcp = lastEntry.startTime;
                    
                    if (lcp > 2500) { // Poor LCP
                        console.warn('⚠️ Poor LCP detected:', lcp + 'ms');
                    }
                });
                
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            }
        }

        window.addEventListener('load', measureCoreWebVitals);
    }

    // Initialize all optimizations
    function initializeOptimizations() {
        preloadCriticalResources();
        lazyLoadScripts();
        optimizeRendering();
        setupMemoryManagement();
        setupCacheOptimization();
        setupErrorBoundary();
        setupPerformanceMonitoring();
        
        console.log('🚀 Production optimizations initialized');
    }

    // Run optimizations when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOptimizations);
    } else {
        initializeOptimizations();
    }

})();