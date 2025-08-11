// Firebase Configuration - Secure Implementation
// Move this to environment variables in production

class FirebaseManager {
    constructor() {
        this.initialized = false;
        this.db = null;
        this.analytics = null;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Load Firebase modules dynamically
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
            const { getFirestore } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
            const { getAnalytics } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js");

            // Firebase config (move to environment variables in production)
            const firebaseConfig = {
                apiKey: "AIzaSyANOj0x2Y2zpfaRR9tiLQxQ6BvFT1yGS04",
                authDomain: "kilangdm-v1.firebaseapp.com",
                projectId: "kilangdm-v1",
                storageBucket: "kilangdm-v1.firebasestorage.app",
                messagingSenderId: "264191193800",
                appId: "1:264191193800:web:0f3d9f25b9694c16bdabfd",
                measurementId: "G-C02S0CPE63"
            };

            const app = initializeApp(firebaseConfig);
            this.analytics = getAnalytics(app);
            this.db = getFirestore(app);
            
            // Make available globally for compatibility
            window.db = this.db;
            
            this.initialized = true;
            console.log('Firebase initialized successfully');
            
            // Dispatch custom event for other scripts
            window.dispatchEvent(new CustomEvent('firebaseReady'));
            
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            throw error;
        }
    }

    getDatabase() {
        return this.db;
    }

    isReady() {
        return this.initialized;
    }
}

// Create global instance
window.firebaseManager = new FirebaseManager();

// Auto-initialize
window.firebaseManager.initialize().catch(error => {
    console.error('Failed to initialize Firebase:', error);
});