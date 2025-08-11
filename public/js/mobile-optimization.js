// Mobile Performance Optimization - Disable excessive notifications and auto-detection
console.log('📱 Mobile Optimization Script loading...');

// Detect if we're on mobile
const isMobile = () => {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Mobile-specific optimizations
if (isMobile()) {
    console.log('📱 Mobile detected - Applying optimizations...');
    
    // 1. DISABLE EXCESSIVE NOTIFICATIONS
    // Override notification systems to be less aggressive
    let notificationCount = 0;
    const maxNotificationsPerMinute = 3;
    let notificationTimer = Date.now();
    
    // Intercept and rate-limit notifications
    const originalConsoleLog = console.log;
    console.log = function(...args) {
        // Reduce console spam on mobile
        if (args.some(arg => typeof arg === 'string' && (
            arg.includes('🔔') || 
            arg.includes('notification') || 
            arg.includes('Waiting for') ||
            arg.includes('Attempt')
        ))) {
            // Skip these verbose logs on mobile
            return;
        }
        originalConsoleLog.apply(console, args);
    };
    
    // Rate limit notifications
    const rateLimitNotifications = (originalFunction) => {
        return function(...args) {
            const now = Date.now();
            
            // Reset counter every minute
            if (now - notificationTimer > 60000) {
                notificationCount = 0;
                notificationTimer = now;
            }
            
            if (notificationCount >= maxNotificationsPerMinute) {
                console.log('📱 Notification rate limited for mobile performance');
                return;
            }
            
            notificationCount++;
            return originalFunction.apply(this, args);
        };
    };
    
    // 2. REDUCE INTERVALS AND TIMEOUTS
    // Override setInterval to use longer intervals on mobile
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback, delay, ...args) {
        // Increase minimum delay for mobile performance
        if (delay < 5000) { // Less than 5 seconds
            delay = Math.max(delay * 3, 5000); // Triple the delay, minimum 5 seconds
        }
        return originalSetInterval(callback, delay, ...args);
    };
    
    // 3. DISABLE AUTO-DETECTION FEATURES
    document.addEventListener('DOMContentLoaded', function() {
        // Disable notification system if exists
        if (window.NotificationSystem) {
            console.log('📱 Disabling NotificationSystem for mobile');
            window.NotificationSystem.prototype.checkMetrics = function() {
                // No-op on mobile
                console.log('📱 Metrics check skipped on mobile');
            };
            
            window.NotificationSystem.prototype.checkComprehensiveMetrics = function() {
                // No-op on mobile
                console.log('📱 Comprehensive metrics check skipped on mobile');
            };
        }
        
        // Disable improvements notifications
        if (window.kilangDMEnhancements) {
            const originalShowNotification = window.kilangDMEnhancements.showNotification;
            window.kilangDMEnhancements.showNotification = rateLimitNotifications(originalShowNotification);
        }
        
        // Disable automatic status checking
        const autoCheckers = document.querySelectorAll('[data-auto-check], [data-auto-update]');
        autoCheckers.forEach(element => {
            element.removeAttribute('data-auto-check');
            element.removeAttribute('data-auto-update');
            console.log('📱 Disabled auto-checker on element:', element);
        });
        
        // Clear excessive intervals
        setTimeout(() => {
            // Get all intervals and clear rapid ones
            const intervalIds = [];
            const originalSetInterval2 = window.setInterval;
            
            // Find and clear problematic intervals
            for (let i = 1; i < 10000; i++) {
                try {
                    clearInterval(i);
                } catch (e) {
                    // Ignore errors
                }
            }
            
            console.log('📱 Cleared potential problematic intervals');
        }, 2000);
        
        // 4. OPTIMIZE CHART UPDATES
        if (window.Chart && window.Chart.instances) {
            Object.values(window.Chart.instances).forEach(chart => {
                // Disable animations on mobile
                chart.options.animation = false;
                chart.options.hover = { animationDuration: 0 };
                chart.options.responsiveAnimationDuration = 0;
            });
            console.log('📱 Optimized charts for mobile');
        }
        
        // 5. THROTTLE MUTATION OBSERVER ACTIVITY (instead of disabling)
        const observers = [];
        const originalObserve = MutationObserver.prototype.observe;
        MutationObserver.prototype.observe = function(target, options) {
            // On mobile, add throttling instead of disabling options
            if (options) {
                // Create a copy of options to avoid modifying the original
                const mobileOptions = { ...options };
                
                // For mobile, reduce subtree observation sensitivity but keep functionality
                if (mobileOptions.subtree && mobileOptions.childList) {
                    // Keep both but add throttling via reduced target scope
                    if (target === document.body || target === document.documentElement) {
                        // For document-wide observers, reduce scope to direct children only
                        mobileOptions.subtree = false;
                        console.log('📱 Reduced MutationObserver scope for mobile performance');
                    }
                }
                
                return originalObserve.call(this, target, mobileOptions);
            }
            
            // Fallback: if no options provided, set minimal valid options
            return originalObserve.call(this, target, { childList: true });
        };
        
        // 6. DISABLE REAL-TIME UPDATES
        if (window.kilangDMEnhancements) {
            if (window.kilangDMEnhancements.updateInterval) {
                clearInterval(window.kilangDMEnhancements.updateInterval);
                console.log('📱 Disabled real-time updates for mobile');
            }
        }
        
        // 7. DEBOUNCE DOM OPERATIONS TO PREVENT FORCED REFLOW
        const debouncedOperations = new Map();
        
        // Override getBoundingClientRect with debouncing
        const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = function() {
            const element = this;
            const key = 'getBoundingClientRect_' + (element.id || element.className || 'anonymous');
            
            if (debouncedOperations.has(key)) {
                return debouncedOperations.get(key);
            }
            
            const result = originalGetBoundingClientRect.call(this);
            
            // Cache result for 100ms to prevent repeated reflows
            debouncedOperations.set(key, result);
            setTimeout(() => {
                debouncedOperations.delete(key);
            }, 100);
            
            return result;
        };
        
        console.log('📱 Added DOM operation debouncing for mobile');
        
        // Clean up debounced operations periodically to prevent memory leaks
        setInterval(() => {
            if (debouncedOperations.size > 50) {
                debouncedOperations.clear();
                console.log('📱 Cleared debounced operations cache');
            }
        }, 30000); // Every 30 seconds
        
        // 8. CREATE MOBILE-FRIENDLY NOTIFICATION SYSTEM
        window.mobileNotificationSystem = {
            lastNotification: 0,
            minDelay: 3000, // 3 seconds minimum between notifications
            
            show: function(message, type = 'info') {
                const now = Date.now();
                if (now - this.lastNotification < this.minDelay) {
                    return; // Skip if too soon
                }
                
                this.lastNotification = now;
                
                // Create simple, non-intrusive notification
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: ${type === 'error' ? '#ef4444' : '#3b82f6'};
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 9999;
                    font-size: 14px;
                    max-width: 90vw;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                notification.textContent = message;
                
                document.body.appendChild(notification);
                
                // Auto remove after 3 seconds
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 3000);
            }
        };
        
        console.log('📱 Mobile optimization complete');
        
        // Show optimization notification
        setTimeout(() => {
            window.mobileNotificationSystem.show('📱 Mobile optimized for better performance');
        }, 1000);
        
    });
    
    // 8. DISABLE HOVER EFFECTS ON MOBILE (CSS)
    const mobileCSS = document.createElement('style');
    mobileCSS.textContent = `
        @media (max-width: 768px) {
            * {
                -webkit-tap-highlight-color: rgba(0,0,0,0.1) !important;
            }
            
            *:hover {
                transform: none !important;
                box-shadow: none !important;
            }
            
            .notification {
                animation-duration: 0.2s !important;
            }
            
            /* Hide excessive notifications */
            .notification-container .notification:nth-child(n+3) {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(mobileCSS);
    
} else {
    console.log('💻 Desktop detected - No mobile optimizations needed');
}

console.log('📱 Mobile Optimization Script loaded');