// Global Error Handler for KilangDM Dashboard

class ErrorHandler {
    constructor() {
        this.setupGlobalHandlers();
        this.errors = [];
    }

    setupGlobalHandlers() {
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });

        // Handle Firebase connection errors
        window.addEventListener('firebaseError', (event) => {
            this.handleFirebaseError(event.detail);
        });
    }

    handleError(type, errorInfo) {
        const error = {
            type,
            ...errorInfo,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.errors.push(error);
        
        // Log in development
        if (window.logger) {
            window.logger.error(`${type}:`, error);
        }

        // Show user-friendly error message
        this.showUserError(type);

        // In production, send to monitoring service
        // this.sendToMonitoring(error);
    }

    handleFirebaseError(error) {
        let userMessage = 'Connection issue. Please refresh the page.';
        
        if (error.code === 'permission-denied') {
            userMessage = 'Access denied. Please contact support.';
        } else if (error.code === 'unavailable') {
            userMessage = 'Service temporarily unavailable. Please try again.';
        }

        this.showNotification(userMessage, 'error');
    }

    showUserError(type) {
        let message = 'Something went wrong. Please refresh the page.';
        
        if (type === 'JavaScript Error') {
            message = 'A technical issue occurred. Please refresh the page.';
        } else if (type === 'Unhandled Promise Rejection') {
            message = 'Failed to load data. Please refresh the page.';
        }

        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('error-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'error-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 8px;
                color: white;
                font-family: 'Inter', sans-serif;
                font-weight: 500;
                z-index: 10000;
                max-width: 400px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(notification);
        }

        // Set notification style based on type
        const colors = {
            error: '#ef4444',
            warning: '#f59e0b',
            success: '#22c55e',
            info: '#3b82f6'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.style.display='none'" 
                        style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: auto;">
                    &times;
                </button>
            </div>
        `;

        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
        }, 5000);
    }

    // Utility method for handling async operations safely
    async safeAsync(asyncFunction, fallback = null) {
        try {
            return await asyncFunction();
        } catch (error) {
            this.handleError('Async Operation Failed', error);
            return fallback;
        }
    }

    // Utility method for safe Firebase operations
    async safeFirebaseOperation(operation, errorMessage = 'Database operation failed') {
        try {
            // Wait for Firebase to be ready
            if (!window.firebaseManager?.isReady()) {
                await new Promise(resolve => {
                    window.addEventListener('firebaseReady', resolve, { once: true });
                });
            }

            return await operation();
        } catch (error) {
            window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
            throw error;
        }
    }

    getErrorHistory() {
        return this.errors;
    }

    clearErrors() {
        this.errors = [];
    }
}

// Initialize global error handler
window.errorHandler = new ErrorHandler();

// Utility functions for common error handling patterns
window.safeAsync = (fn, fallback) => window.errorHandler.safeAsync(fn, fallback);
window.safeFirebaseOp = (op, msg) => window.errorHandler.safeFirebaseOperation(op, msg);