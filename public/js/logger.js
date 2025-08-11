// Production-safe logging utility
// Only logs in development mode

class Logger {
    constructor() {
        // Set to false in production
        this.isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' ||
                            window.location.search.includes('debug=true');
    }

    log(...args) {
        if (this.isDevelopment) {
            console.log(...args);
        }
    }

    error(...args) {
        if (this.isDevelopment) {
            console.error(...args);
        } else {
            // In production, you might want to send errors to a logging service
            // this.sendToLoggingService('error', args);
        }
    }

    warn(...args) {
        if (this.isDevelopment) {
            console.warn(...args);
        }
    }

    info(...args) {
        if (this.isDevelopment) {
            console.info(...args);
        }
    }

    debug(...args) {
        if (this.isDevelopment) {
            console.debug(...args);
        }
    }

    // Group logging for better organization
    group(label) {
        if (this.isDevelopment) {
            console.group(label);
        }
    }

    groupEnd() {
        if (this.isDevelopment) {
            console.groupEnd();
        }
    }

    // Performance timing
    time(label) {
        if (this.isDevelopment) {
            console.time(label);
        }
    }

    timeEnd(label) {
        if (this.isDevelopment) {
            console.timeEnd(label);
        }
    }

    // Send to logging service in production (placeholder)
    sendToLoggingService(level, args) {
        // Implement your logging service integration here
        // Example: send to Firebase Analytics, Sentry, etc.
    }
}

// Create global logger instance
window.logger = new Logger();

// Backward compatibility - replace console calls gradually
if (!window.logger.isDevelopment) {
    // Override console methods in production to prevent accidental logging
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    // Keep console.error and console.warn for critical issues
}