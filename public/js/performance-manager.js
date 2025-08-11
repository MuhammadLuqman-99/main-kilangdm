// Performance Manager for KilangDM Dashboard
// Handles lazy loading, caching, and performance optimization

class PerformanceManager {
    constructor() {
        this.cache = new Map();
        this.performanceMetrics = {};
        this.lazyLoadQueue = [];
        this.isInitialized = false;
        
        this.initialize();
    }

    initialize() {
        if (this.isInitialized) return;
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
        
        // Initialize lazy loading
        this.setupLazyLoading();
        
        // Set up resource preloading
        this.setupResourcePreloading();
        
        this.isInitialized = true;
        
        if (window.logger) {
            window.logger.info('Performance Manager initialized');
        }
    }

    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            try {
                // Largest Contentful Paint (LCP)
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.performanceMetrics.lcp = lastEntry.startTime;
                    
                    if (window.logger) {
                        window.logger.info(`LCP: ${lastEntry.startTime}ms`);
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                // First Input Delay (FID)
                const fidObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        this.performanceMetrics.fid = entry.processingStart - entry.startTime;
                        
                        if (window.logger) {
                            window.logger.info(`FID: ${this.performanceMetrics.fid}ms`);
                        }
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });

                // Cumulative Layout Shift (CLS)
                const clsObserver = new PerformanceObserver((entryList) => {
                    let clsValue = 0;
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    this.performanceMetrics.cls = clsValue;
                    
                    if (window.logger) {
                        window.logger.info(`CLS: ${clsValue}`);
                    }
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (error) {
                if (window.logger) {
                    window.logger.warn('Performance monitoring setup failed:', error);
                }
            }
        }

        // Monitor resource loading
        this.monitorResourceLoading();
    }

    monitorResourceLoading() {
        const resources = performance.getEntriesByType('resource');
        let totalSize = 0;
        let slowResources = [];

        resources.forEach(resource => {
            totalSize += resource.transferSize || 0;
            
            if (resource.duration > 1000) { // Resources taking > 1 second
                slowResources.push({
                    name: resource.name,
                    duration: resource.duration,
                    size: resource.transferSize
                });
            }
        });

        this.performanceMetrics.totalResourceSize = totalSize;
        this.performanceMetrics.slowResources = slowResources;

        if (window.logger) {
            window.logger.info(`Total resources loaded: ${resources.length}, Size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
            if (slowResources.length > 0) {
                window.logger.warn(`${slowResources.length} slow resources detected`);
            }
        }
    }

    setupLazyLoading() {
        // Lazy load images
        this.setupImageLazyLoading();
        
        // Lazy load charts
        this.setupChartLazyLoading();
        
        // Lazy load non-critical CSS
        this.setupCSSLazyLoading();
    }

    setupImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    setupChartLazyLoading() {
        // Lazy load charts when they come into view
        if ('IntersectionObserver' in window) {
            const chartObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const chartContainer = entry.target;
                        this.loadChart(chartContainer);
                        observer.unobserve(chartContainer);
                    }
                });
            });

            document.querySelectorAll('.chart-container[data-lazy]').forEach(container => {
                chartObserver.observe(container);
            });
        }
    }

    setupCSSLazyLoading() {
        // Load non-critical CSS asynchronously
        const nonCriticalCSS = [
            'style/improvements.css',
            'style/dashboard-advanced-filter.css',
            'style/chart-filters.css'
        ];

        nonCriticalCSS.forEach(cssFile => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssFile;
            link.media = 'print';
            link.onload = () => {
                link.media = 'all';
            };
            document.head.appendChild(link);
        });
    }

    loadChart(container) {
        const chartType = container.dataset.chartType;
        const chartId = container.dataset.chartId;
        
        if (window.logger) {
            window.logger.info(`Lazy loading chart: ${chartType} (${chartId})`);
        }

        // Add to lazy load queue
        this.lazyLoadQueue.push({
            type: chartType,
            id: chartId,
            container: container,
            timestamp: Date.now()
        });

        // Process queue
        this.processLazyLoadQueue();
    }

    processLazyLoadQueue() {
        if (this.lazyLoadQueue.length === 0) return;

        const item = this.lazyLoadQueue.shift();
        
        // Simulate chart loading (replace with actual chart creation logic)
        setTimeout(() => {
            if (window.logger) {
                window.logger.info(`Chart loaded: ${item.type} (${item.id})`);
            }
            
            // Mark as loaded
            item.container.classList.add('chart-loaded');
            item.container.removeAttribute('data-lazy');
        }, 100);
    }

    setupResourcePreloading() {
        // Preload critical resources
        const criticalResources = [
            'js/dashboard.js',
            'js/firebase-config.js',
            'style/style.css'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.js') ? 'script' : 'style';
            document.head.appendChild(link);
        });
    }

    // Cache management
    setCache(key, value, ttl = 300000) { // 5 minutes default TTL
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    }

    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clearCache() {
        this.cache.clear();
        if (window.logger) {
            window.logger.info('Cache cleared');
        }
    }

    // Performance optimization methods
    optimizeImages() {
        // Convert images to WebP if supported
        if (this.supportsWebP()) {
            document.querySelectorAll('img[data-webp]').forEach(img => {
                img.src = img.dataset.webp;
            });
        }
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // Debounce function for performance
    debounce(func, wait) {
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

    // Throttle function for performance
    throttle(func, limit) {
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

    // Get performance report
    getPerformanceReport() {
        return {
            metrics: this.performanceMetrics,
            cacheSize: this.cache.size,
            lazyLoadQueueSize: this.lazyLoadQueue.length,
            timestamp: Date.now()
        };
    }

    // Optimize DOM operations
    batchDOMUpdates(updates) {
        // Use requestAnimationFrame for batched DOM updates
        requestAnimationFrame(() => {
            updates.forEach(update => {
                if (typeof update === 'function') {
                    update();
                }
            });
        });
    }
}

// Initialize performance manager
window.performanceManager = new PerformanceManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
}
