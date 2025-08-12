/**
 * SAFE MODULE SYSTEM
 * Prevents conflicts and ensures safe loading
 */

(function(global) {
    'use strict';

    // Module registry
    const modules = new Map();
    const loadedModules = new Set();
    const pendingModules = new Set();

    class SafeModuleSystem {
        constructor() {
            this.isReady = false;
            this.errorHandler = null;
            this.init();
        }

        init() {
            // Wait for DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.onReady());
            } else {
                this.onReady();
            }
        }

        onReady() {
            this.isReady = true;
            this.loadPendingModules();
        }

        // Safe module registration
        register(name, dependencies, factory) {
            if (typeof dependencies === 'function') {
                factory = dependencies;
                dependencies = [];
            }

            const module = {
                name,
                dependencies: dependencies || [],
                factory,
                instance: null,
                loaded: false,
                error: null
            };

            modules.set(name, module);

            if (this.isReady) {
                this.loadModule(name);
            } else {
                pendingModules.add(name);
            }
        }

        // Load module with dependency checking
        loadModule(name) {
            const module = modules.get(name);
            if (!module || module.loaded) return;

            try {
                // Check dependencies
                for (const dep of module.dependencies) {
                    if (!this.isModuleLoaded(dep)) {
                        console.warn(`Module ${name} waiting for dependency: ${dep}`);
                        return;
                    }
                }

                // Safe execution
                module.instance = module.factory();
                module.loaded = true;
                loadedModules.add(name);

                console.log(`✅ Module ${name} loaded successfully`);

                // Try to load dependent modules
                this.loadDependentModules(name);

            } catch (error) {
                module.error = error;
                this.handleError(`Failed to load module ${name}`, error);
            }
        }

        loadPendingModules() {
            for (const name of pendingModules) {
                this.loadModule(name);
            }
            pendingModules.clear();
        }

        loadDependentModules(loadedModuleName) {
            for (const [name, module] of modules) {
                if (!module.loaded && module.dependencies.includes(loadedModuleName)) {
                    this.loadModule(name);
                }
            }
        }

        isModuleLoaded(name) {
            return loadedModules.has(name) || (global[name] !== undefined);
        }

        get(name) {
            const module = modules.get(name);
            return module ? module.instance : null;
        }

        setErrorHandler(handler) {
            this.errorHandler = handler;
        }

        handleError(message, error) {
            console.error(`❌ ${message}:`, error);
            if (this.errorHandler) {
                this.errorHandler(message, error);
            }
        }

        // Get status
        getStatus() {
            return {
                total: modules.size,
                loaded: loadedModules.size,
                pending: Array.from(modules.keys()).filter(name => !loadedModules.has(name)),
                errors: Array.from(modules.values()).filter(m => m.error).map(m => ({ name: m.name, error: m.error }))
            };
        }
    }

    // Initialize system
    const moduleSystem = new SafeModuleSystem();

    // Global API
    global.SafeModule = {
        register: (name, deps, factory) => moduleSystem.register(name, deps, factory),
        get: (name) => moduleSystem.get(name),
        isLoaded: (name) => moduleSystem.isModuleLoaded(name),
        status: () => moduleSystem.getStatus(),
        onError: (handler) => moduleSystem.setErrorHandler(handler)
    };

    // Helper for safe initialization
    global.safeInit = function(name, dependencies, factory) {
        if (typeof dependencies === 'function') {
            factory = dependencies;
            dependencies = [];
        }
        
        SafeModule.register(name, dependencies, factory);
    };

})(window);

console.log('🛡️ Safe Module System loaded');