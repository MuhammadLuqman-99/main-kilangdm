// Error Boundary System for KilangDM Dashboard
// Provides graceful error handling and recovery mechanisms

class ErrorBoundary {
    constructor() {
        this.errors = [];
        this.maxErrors = 10;
        this.recoveryAttempts = new Map();
        this.maxRecoveryAttempts = 3;
        this.isEnabled = true;
        
        this.initialize();
    }

    initialize() {
        if (!this.isEnabled) return;
        
        // Set up global error handlers
        this.setupGlobalErrorHandling();
        
        // Set up unhandled promise rejection handling
        this.setupPromiseRejectionHandling();
        
        // Set up resource error handling
        this.setupResourceErrorHandling();
        
        // Set up console error interception
        this.setupConsoleErrorInterception();
        
        if (window.logger) {
            window.logger.info('Error Boundary system initialized');
        }
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError(event.error || event.message, {
                type: 'runtime',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now()
            });
        });
    }

    setupPromiseRejectionHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'promise',
                stack: event.reason?.stack,
                timestamp: Date.now()
            });
        });
    }

    setupResourceErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError(`Resource failed to load: ${event.target.src || event.target.href}`, {
                    type: 'resource',
                    element: event.target.tagName,
                    src: event.target.src || event.target.href,
                    timestamp: Date.now()
                });
            }
        }, true);
    }

    setupConsoleErrorInterception() {
        const originalConsoleError = console.error;
        console.error = (...args) => {
            // Log to our error boundary
            this.handleError(args.join(' '), {
                type: 'console',
                timestamp: Date.now()
            });
            
            // Call original console.error
            originalConsoleError.apply(console, args);
        };
    }

    handleError(error, context = {}) {
        const errorInfo = {
            message: typeof error === 'string' ? error : error.message || 'Unknown error',
            stack: error.stack,
            context,
            id: this.generateErrorId(),
            timestamp: Date.now()
        };

        // Add to errors array
        this.errors.push(errorInfo);
        
        // Keep only the latest errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Log error
        if (window.logger) {
            window.logger.error('Error caught by boundary:', errorInfo);
        }

        // Attempt recovery
        this.attemptRecovery(errorInfo);

        // Show user notification if critical
        if (this.isCriticalError(errorInfo)) {
            this.showUserNotification(errorInfo);
        }

        // Send to monitoring service (if configured)
        this.sendToMonitoringService(errorInfo);
    }

    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    isCriticalError(errorInfo) {
        const criticalPatterns = [
            /firebase/i,
            /database/i,
            /authentication/i,
            /network/i,
            /fetch/i
        ];

        return criticalPatterns.some(pattern => 
            pattern.test(errorInfo.message) || 
            pattern.test(errorInfo.context.type)
        );
    }

    attemptRecovery(errorInfo) {
        const errorKey = `${errorInfo.context.type}_${errorInfo.message}`;
        const attempts = this.recoveryAttempts.get(errorKey) || 0;

        if (attempts < this.maxRecoveryAttempts) {
            this.recoveryAttempts.set(errorKey, attempts + 1);
            
            setTimeout(() => {
                this.executeRecoveryStrategy(errorInfo);
            }, Math.pow(2, attempts) * 1000); // Exponential backoff
        }
    }

    executeRecoveryStrategy(errorInfo) {
        switch (errorInfo.context.type) {
            case 'firebase':
                this.recoverFirebaseConnection();
                break;
            case 'resource':
                this.recoverResourceLoading(errorInfo);
                break;
            case 'chart':
                this.recoverChartRendering(errorInfo);
                break;
            default:
                this.recoverGenericError(errorInfo);
        }
    }

    recoverFirebaseConnection() {
        if (window.firebaseManager && !window.firebaseManager.isReady()) {
            if (window.logger) {
                window.logger.info('Attempting Firebase connection recovery...');
            }
            
            window.firebaseManager.initialize().catch(error => {
                if (window.logger) {
                    window.logger.warn('Firebase recovery failed:', error);
                }
            });
        }
    }

    recoverResourceLoading(errorInfo) {
        const src = errorInfo.context.src;
        if (src) {
            // Retry loading the resource
            const element = document.querySelector(`[src="${src}"], [href="${src}"]`);
            if (element) {
                if (window.logger) {
                    window.logger.info(`Retrying resource load: ${src}`);
                }
                
                // Force reload
                element.src = src + '?retry=' + Date.now();
            }
        }
    }

    recoverChartRendering(errorInfo) {
        // Find chart containers and attempt to re-render
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            if (container.dataset.chartType) {
                this.retryChartRendering(container);
            }
        });
    }

    retryChartRendering(container) {
        const chartType = container.dataset.chartType;
        const chartId = container.dataset.chartId;
        
        if (window.logger) {
            window.logger.info(`Retrying chart rendering: ${chartType} (${chartId})`);
        }

        // Clear container and retry
        container.innerHTML = '';
        container.classList.remove('chart-error');
        
        // Dispatch custom event for chart recreation
        window.dispatchEvent(new CustomEvent('retryChart', {
            detail: { type: chartType, id: chartId, container }
        }));
    }

    recoverGenericError(errorInfo) {
        // Generic recovery: refresh the page if too many errors
        if (this.errors.length > this.maxErrors * 0.8) {
            if (window.logger) {
                window.logger.warn('Too many errors, suggesting page refresh');
            }
            
            this.showRefreshSuggestion();
        }
    }

    showUserNotification(errorInfo) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="error-content">
                <div class="error-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>System Error</span>
                    <button class="error-close" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="error-message">
                    ${this.getUserFriendlyMessage(errorInfo)}
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary btn-sm" onclick="window.errorBoundary.retryOperation('${errorInfo.id}')">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="window.errorBoundary.showErrorDetails('${errorInfo.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    getUserFriendlyMessage(errorInfo) {
        const messages = {
            firebase: 'Database connection issue. Retrying automatically...',
            resource: 'Some resources failed to load. Click retry to reload.',
            chart: 'Chart rendering failed. Attempting to recover...',
            network: 'Network connection issue. Please check your internet connection.',
            default: 'An unexpected error occurred. The system is attempting to recover.'
        };

        return messages[errorInfo.context.type] || messages.default;
    }

    showRefreshSuggestion() {
        const suggestion = document.createElement('div');
        suggestion.className = 'refresh-suggestion';
        suggestion.innerHTML = `
            <div class="suggestion-content">
                <i class="fas fa-info-circle"></i>
                <span>Multiple errors detected. Consider refreshing the page for better performance.</span>
                <button class="btn btn-primary btn-sm" onclick="window.location.reload()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        `;

        suggestion.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        document.body.appendChild(suggestion);

        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (suggestion.parentElement) {
                suggestion.remove();
            }
        }, 15000);
    }

    retryOperation(errorId) {
        const error = this.errors.find(e => e.id === errorId);
        if (error) {
            if (window.logger) {
                window.logger.info(`Retrying operation for error: ${errorId}`);
            }
            
            // Execute recovery strategy
            this.executeRecoveryStrategy(error);
        }
    }

    showErrorDetails(errorId) {
        const error = this.errors.find(e => e.id === errorId);
        if (error) {
            const details = `
Error Details:
- Message: ${error.message}
- Type: ${error.context.type}
- Time: ${new Date(error.timestamp).toLocaleString()}
- Stack: ${error.stack || 'Not available'}
            `;
            
            if (window.logger) {
                window.logger.info('Error details:', details);
            }
            
            // Show in console or create detailed modal
            console.group('Error Details');
            console.log(details);
            console.groupEnd();
        }
    }

    sendToMonitoringService(errorInfo) {
        // Placeholder for sending errors to monitoring service
        // Implement with your preferred service (Sentry, LogRocket, etc.)
        if (window.appConfig?.getFeature('errorMonitoring')) {
            // Example implementation
            try {
                // Send to monitoring service
                console.log('Sending error to monitoring service:', errorInfo);
            } catch (monitoringError) {
                if (window.logger) {
                    window.logger.warn('Failed to send error to monitoring service:', monitoringError);
                }
            }
        }
    }

    // Public methods
    getErrors() {
        return [...this.errors];
    }

    clearErrors() {
        this.errors = [];
        this.recoveryAttempts.clear();
        
        if (window.logger) {
            window.logger.info('Error history cleared');
        }
    }

    disable() {
        this.isEnabled = false;
        if (window.logger) {
            window.logger.info('Error Boundary disabled');
        }
    }

    enable() {
        this.isEnabled = true;
        this.initialize();
        if (window.logger) {
            window.logger.info('Error Boundary enabled');
        }
    }

    getErrorStats() {
        const stats = {
            totalErrors: this.errors.length,
            errorsByType: {},
            recentErrors: this.errors.slice(-5),
            recoveryAttempts: this.recoveryAttempts.size
        };

        this.errors.forEach(error => {
            const type = error.context.type || 'unknown';
            stats.errorsByType[type] = (stats.errorsByType[type] || 0) + 1;
        });

        return stats;
    }
}

// Initialize error boundary
window.errorBoundary = new ErrorBoundary();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorBoundary;
}
