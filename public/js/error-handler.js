// Global Error Handler for KilangDM Dashboard

var ErrorHandler = function() {
    this.setupGlobalHandlers();
    this.errors = [];
};

ErrorHandler.prototype.setupGlobalHandlers = function() {
    var self = this;
    
    // Handle JavaScript errors
    window.addEventListener('error', function(event) {
        self.handleError('JavaScript Error', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        self.handleError('Unhandled Promise Rejection', {
            reason: event.reason,
            promise: event.promise
        });
    });

    // Handle Firebase connection errors
    window.addEventListener('firebaseError', function(event) {
        self.handleFirebaseError(event.detail);
    });
};

ErrorHandler.prototype.handleError = function(type, errorInfo) {
    var error = {
        type: type,
        message: errorInfo.message,
        filename: errorInfo.filename,
        lineno: errorInfo.lineno,
        colno: errorInfo.colno,
        error: errorInfo.error,
        reason: errorInfo.reason,
        promise: errorInfo.promise,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
    };

    this.errors.push(error);
    
    // Log in development
    if (window.logger) {
        window.logger.error(type + ':', error);
    }

    // Show user-friendly error message
    this.showUserError(type);

    // In production, send to monitoring service
    // this.sendToMonitoring(error);
};

ErrorHandler.prototype.handleFirebaseError = function(error) {
    // Firebase errors only logged to console now, no user notifications
    if (error.code === 'permission-denied') {
        console.error('🔒 Firebase: Access denied');
    } else if (error.code === 'unavailable') {
        console.error('🔄 Firebase: Service temporarily unavailable');
    } else {
        console.error('🔥 Firebase: Connection issue');
    }
    // No user notification shown
};

ErrorHandler.prototype.showUserError = function(type) {
    // Error messages only logged to console now, no user notifications
    if (type === 'JavaScript Error') {
        console.error('❌ JavaScript Error detected');
    } else if (type === 'Unhandled Promise Rejection') {
        console.error('❌ Promise rejection detected'); 
    } else {
        console.error('❌ General error detected');
    }
    // No user notification shown
};

ErrorHandler.prototype.showNotification = function(message, type) {
    // Just log to console instead of showing UI notification
    type = type || 'error';
    const emoji = {
        error: '❌',
        warning: '⚠️', 
        info: 'ℹ️',
        success: '✅'
    };
    console.log(`${emoji[type]} ${type.toUpperCase()}: ${message}`);
};

// Utility method for handling async operations safely
ErrorHandler.prototype.safeAsync = function(asyncFunction, fallback) {
    fallback = fallback || null;
    var self = this;
    
    try {
        if (typeof asyncFunction === 'function') {
            return asyncFunction();
        }
        return fallback;
    } catch (error) {
        this.handleError('Async Operation Failed', error);
        return fallback;
    }
};

// Utility method for safe Firebase operations
ErrorHandler.prototype.safeFirebaseOperation = function(operation, errorMessage) {
    errorMessage = errorMessage || 'Database operation failed';
    var self = this;
    
    try {
        // Wait for Firebase to be ready
        if (!window.firebaseManager || !window.firebaseManager.isReady()) {
            return new Promise(function(resolve) {
                window.addEventListener('firebaseReady', resolve, { once: true });
            });
        }

        return operation();
    } catch (error) {
        window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
        throw error;
    }
};

ErrorHandler.prototype.getErrorHistory = function() {
    return this.errors;
};

ErrorHandler.prototype.clearErrors = function() {
    this.errors = [];
};

// Initialize global error handler
window.errorHandler = new ErrorHandler();

// Utility functions for common error handling patterns
window.safeAsync = function(fn, fallback) {
    return window.errorHandler.safeAsync(fn, fallback);
};
window.safeFirebaseOp = function(op, msg) {
    return window.errorHandler.safeFirebaseOperation(op, msg);
};