// Environment Configuration
// Centralized configuration for different environments

var AppConfig = function() {
    this.environment = this.detectEnvironment();
    this.config = this.getConfig();
    this.initializeConfig();
};

AppConfig.prototype.detectEnvironment = function() {
    var hostname = window.location.hostname;
    var protocol = window.location.protocol;
    
    if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    } else if (hostname.indexOf('firebaseapp.com') !== -1 || hostname.indexOf('web.app') !== -1) {
        return 'staging';
    } else {
        return 'production';
    }
};

AppConfig.prototype.getConfig = function() {
    var configs = {
        development: {
            debug: true,
            logging: 'verbose',
            firebase: {
                apiKey: "AIzaSyANOj0x2Y2zpfaRR9tiLQxQ6BvFT1yGS04",
                authDomain: "kilangdm-v1.firebaseapp.com",
                projectId: "kilangdm-v1",
                storageBucket: "kilangdm-v1.firebasestorage.app",
                messagingSenderId: "264191193800",
                appId: "1:264191193800:web:0f3d9f25b9694c16bdabfd",
                measurementId: "G-C02S0CPE63"
            },
            features: {
                autoRefresh: true,
                detailedLogging: true,
                performanceMonitoring: true
            }
        },
        staging: {
            debug: false,
            logging: 'warn',
            firebase: {
                apiKey: "AIzaSyANOj0x2Y2zpfaRR9tiLQxQ6BvFT1yGS04",
                authDomain: "kilangdm-v1.firebaseapp.com",
                projectId: "kilangdm-v1",
                storageBucket: "kilangdm-v1.firebasestorage.app",
                messagingSenderId: "264191193800",
                appId: "1:264191193800:web:0f3d9f25b9694c16bdabfd",
                measurementId: "G-C02S0CPE63"
            },
            features: {
                autoRefresh: true,
                detailedLogging: false,
                performanceMonitoring: true
            }
        },
        production: {
            debug: false,
            logging: 'error',
            firebase: {
                apiKey: "AIzaSyANOj0x2Y2zpfaRR9tiLQxQ6BvFT1yGS04",
                authDomain: "kilangdm-v1.firebaseapp.com",
                projectId: "kilangdm-v1",
                storageBucket: "kilangdm-v1.firebasestorage.app",
                messagingSenderId: "264191193800",
                appId: "1:264191193800:web:0f3d9f25b9694c16bdabfd",
                measurementId: "G-C02S0CPE63"
            },
            features: {
                autoRefresh: false,
                detailedLogging: false,
                performanceMonitoring: false
            }
        }
    };

    return configs[this.environment] || configs.development;
};

AppConfig.prototype.initializeConfig = function() {
    // Set global config
    window.appConfig = this.config;
    
    // Set environment-specific flags
    window.isDevelopment = this.environment === 'development';
    window.isProduction = this.environment === 'production';
    window.isStaging = this.environment === 'staging';

    // Configure logger based on environment
    if (window.logger) {
        if (this.config.logging === 'error') {
            window.logger.silenceConsole();
        } else if (this.config.logging === 'warn') {
            // Only allow warnings and errors
            console.log = function() {};
            console.debug = function() {};
            console.info = function() {};
        }
    }

    // Log configuration status
    if (window.logger) {
        window.logger.info('Configuration initialized for environment: ' + this.environment);
    }
};

AppConfig.prototype.get = function(key) {
    return this.config[key];
};

AppConfig.prototype.getFirebaseConfig = function() {
    return this.config.firebase;
};

AppConfig.prototype.getFeature = function(feature) {
    return this.config.features && this.config.features[feature];
};

AppConfig.prototype.updateConfig = function(newConfig) {
    // Deep merge configuration
    for (var key in newConfig) {
        if (newConfig.hasOwnProperty(key)) {
            if (typeof newConfig[key] === 'object' && newConfig[key] !== null) {
                this.config[key] = this.config[key] || {};
                for (var subKey in newConfig[key]) {
                    if (newConfig[key].hasOwnProperty(subKey)) {
                        this.config[key][subKey] = newConfig[key][subKey];
                    }
                }
            } else {
                this.config[key] = newConfig[key];
            }
        }
    }
    
    // Reinitialize if needed
    this.initializeConfig();
};

// Initialize global config manager
window.appConfigManager = new AppConfig();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
