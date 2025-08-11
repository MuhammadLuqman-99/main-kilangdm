// Firebase Configuration - Secure Implementation
// Now uses centralized configuration system

class FirebaseManager {
    constructor() {
        this.initialized = false;
        this.db = null;
        this.analytics = null;
        this.retryAttempts = 0;
        this.maxRetries = 3;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Wait for config to be available
            await this.waitForConfig();
            
            // Load Firebase modules dynamically
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
            const { getFirestore } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
            const { getAnalytics } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js");

            // Get config from centralized system
            const firebaseConfig = window.appConfigManager?.getFirebaseConfig() || this.getFallbackConfig();

            const app = initializeApp(firebaseConfig);
            this.analytics = getAnalytics(app);
            this.db = getFirestore(app);
            
            // Make available globally for compatibility
            window.db = this.db;
            
            this.initialized = true;
            
            if (window.logger) {
                window.logger.info('Firebase initialized successfully');
            } else {
                console.log('Firebase initialized successfully');
            }
            
            // Dispatch custom event for other scripts
            window.dispatchEvent(new CustomEvent('firebaseReady'));
            
        } catch (error) {
            this.handleInitializationError(error);
        }
    }

    async waitForConfig() {
        // Wait for config to be available
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        while (!window.appConfigManager && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (attempts >= maxAttempts) {
            throw new Error('Configuration not available after timeout');
        }
    }

    getFallbackConfig() {
        // Fallback config if centralized system fails
        return {
            apiKey: "AIzaSyANOj0x2Y2zpfaRR9tiLQxQ6BvFT1yGS04",
            authDomain: "kilangdm-v1.firebaseapp.com",
            projectId: "kilangdm-v1",
            storageBucket: "kilangdm-v1.firebasestorage.app",
            messagingSenderId: "264191193800",
            appId: "1:264191193800:web:0f3d9f25b9694c16bdabfd",
            measurementId: "G-C02S0CPE63"
        };
    }

    handleInitializationError(error) {
        this.retryAttempts++;
        
        if (window.logger) {
            window.logger.error('Firebase initialization failed:', error);
        } else {
            console.error('Firebase initialization failed:', error);
        }

        if (this.retryAttempts < this.maxRetries) {
            // Retry with exponential backoff
            const delay = Math.pow(2, this.retryAttempts) * 1000;
            
            if (window.logger) {
                window.logger.warn(`Retrying Firebase initialization in ${delay}ms (attempt ${this.retryAttempts}/${this.maxRetries})`);
            }
            
            setTimeout(() => this.initialize(), delay);
        } else {
            // Max retries reached
            if (window.logger) {
                window.logger.error('Firebase failed to initialize after maximum retries');
            }
            
            // Show user-friendly error
            this.showUserError();
        }
    }

    showUserError() {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'firebase-error-notification';
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 1rem;
                border-radius: 8px;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ">
                <h4 style="margin: 0 0 0.5rem 0;">⚠️ Connection Error</h4>
                <p style="margin: 0 0 1rem 0; font-size: 0.9rem;">
                    Unable to connect to database. Please refresh the page or try again later.
                </p>
                <button onclick="this.parentElement.remove()" style="
                    background: white;
                    color: #ef4444;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                ">Dismiss</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }

    getDatabase() {
        return this.db;
    }

    isReady() {
        return this.initialized;
    }

    // Health check method
    async healthCheck() {
        if (!this.db) return false;
        
        try {
            // Try to access a collection to verify connection
            const testQuery = await this.db.collection('_health_check').limit(1).get();
            return true;
        } catch (error) {
            if (window.logger) {
                window.logger.warn('Firebase health check failed:', error);
            }
            return false;
        }
    }
}

// Create global instance
window.firebaseManager = new FirebaseManager();

// Auto-initialize with error handling
window.firebaseManager.initialize().catch(error => {
    if (window.logger) {
        window.logger.error('Failed to initialize Firebase:', error);
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseManager;
}