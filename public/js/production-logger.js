/**
 * PRODUCTION LOGGER
 * Replaces console.log with no-op functions for production build
 * Only shows errors and warnings for debugging critical issues
 */

// Override console.log for production (keep errors and warnings)
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Production mode - silence debug logs
    console.log = function() {};
    
    // Keep important logging
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = function(...args) {
        // Only show critical errors
        if (args[0] && (args[0].includes('Firebase') || args[0].includes('Error') || args[0].includes('Failed'))) {
            originalError.apply(console, args);
        }
    };
    
    console.warn = function(...args) {
        // Only show important warnings
        if (args[0] && (args[0].includes('deprecated') || args[0].includes('security'))) {
            originalWarn.apply(console, args);
        }
    };
}

// Production performance monitoring
if (typeof window.performance !== 'undefined') {
    window.addEventListener('load', function() {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        if (loadTime > 3000) {
            console.warn('⚠️ Page load time exceeded 3 seconds:', loadTime + 'ms');
        }
    });
}

// Production error tracking
window.addEventListener('error', function(e) {
    // Send to analytics or error tracking service
    if (window.gtag) {
        gtag('event', 'exception', {
            'description': e.error.message,
            'fatal': false
        });
    }
});