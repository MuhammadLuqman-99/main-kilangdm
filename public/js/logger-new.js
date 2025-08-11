/**
 * Enhanced Logger with Production Controls
 * Provides centralized logging with environment-based controls
 */

// Use IIFE to avoid polluting global scope
(function(global) {
    'use strict';

    // Simple polyfill for older browsers
    if (global.window && !global.Proxy) {
        global.Proxy = function(target) { return target; };
    }

    /**
     * Main Logger class
     */
    class Logger {
        constructor() {
            this.isDevelopment = this.detectEnvironment();
            this.isDebugMode = this.isDevelopment || 
                (global.window && (
                    global.window.location.search.includes('debug=true') ||
                    global.window.localStorage.getItem('kilangdm_debug') === 'true'
                ));
            
            this.initialize();
        }

        detectEnvironment() {
            if (!global.window) return false;
            const hostname = global.window.location.hostname;
            return hostname === 'localhost' || 
                   hostname === '127.0.0.1' ||
                   global.window.location.protocol === 'file:';
        }

        initialize() {
            // Override console methods in production to reduce noise
            if (!this.isDebugMode) {
                this.silenceConsole();
            }

            // Add global debug toggle if in browser
            if (global.window) {
                global.window.toggleDebug = () => this.toggleDebugMode();
            }

            // Show debug status
            if (this.isDebugMode) {
                this.info('🔧 Logger initialized in debug mode');
            }
        }

        toggleDebugMode() {
            this.isDebugMode = !this.isDebugMode;
            
            if (global.window) {
                try {
                    global.window.localStorage.setItem('kilangdm_debug', this.isDebugMode);
                } catch (e) {
                    // Ignore localStorage errors
                }
            }
            
            if (this.isDebugMode) {
                this.restoreConsole();
                this.info('🔧 Debug mode enabled');
            } else {
                this.silenceConsole();
                this.info('🔧 Debug mode disabled');
            }
        }

        silenceConsole() {
            if (!global.console) return;
            
            // Store original methods if not already stored
            if (!this.originalConsole) {
                this.originalConsole = {
                    log: global.console.log,
                    debug: global.console.debug,
                    info: global.console.info,
                    warn: global.console.warn,
                    error: global.console.error,
                    time: global.console.time,
                    timeEnd: global.console.timeEnd,
                    group: global.console.group,
                    groupEnd: global.console.groupEnd
                };
            }

            // Replace with no-op functions
            const noop = function() {};
            global.console.log = noop;
            global.console.debug = noop;
            global.console.info = noop;
            global.console.warn = noop;
            global.console.error = noop;
            global.console.time = noop;
            global.console.timeEnd = noop;
            global.console.group = noop;
            global.console.groupEnd = noop;
        }

        restoreConsole() {
            if (!this.originalConsole || !global.console) return;
            
            // Restore original methods
            Object.assign(global.console, this.originalConsole);
        }

        // Logging methods
        log(...args) {
            if (this.isDebugMode && global.console) {
                global.console.log('📝', ...args);
            }
        }

        debug(...args) {
            if (this.isDebugMode && global.console) {
                global.console.debug('🔍', ...args);
            }
        }

        info(...args) {
            if (this.isDebugMode && global.console) {
                global.console.info('ℹ️', ...args);
            }
        }

        warn(...args) {
            if (global.console) {
                global.console.warn('⚠️', ...args);
            }
        }

        error(...args) {
            if (global.console) {
                global.console.error('❌', ...args);
            }
        }

        // Performance logging
        time(label) {
            if (this.isDebugMode && global.console) {
                global.console.time('⏱️ ' + label);
            }
        }

        timeEnd(label) {
            if (this.isDebugMode && global.console) {
                global.console.timeEnd('⏱️ ' + label);
            }
        }

        // Group logging
        group(label) {
            if (this.isDebugMode && global.console) {
                global.console.group('📁 ' + label);
            }
        }

        groupEnd() {
            if (this.isDebugMode && global.console) {
                global.console.groupEnd();
            }
        }
    }

    // Initialize and expose the logger
    if (typeof global.window !== 'undefined') {
        // Browser environment
        global.window.Logger = Logger;
        global.window.logger = new Logger();
    } else if (typeof module !== 'undefined' && module.exports) {
        // Node.js/CommonJS
        module.exports = Logger;
    } else if (typeof exports !== 'undefined') {
        // ES modules
        exports.default = Logger;
    } else if (typeof global !== 'undefined') {
        // Global in non-browser
        global.Logger = Logger;
        global.logger = new Logger();
    }

})(typeof window !== 'undefined' ? window : global);
