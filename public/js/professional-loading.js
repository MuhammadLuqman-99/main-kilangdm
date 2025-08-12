/**
 * PROFESSIONAL LOADING SYSTEM
 * Modern loading states and animations like top-tier SaaS platforms
 */

class ProfessionalLoading {
    constructor() {
        this.activeLoaders = new Map();
        this.setupGlobalLoader();
        this.setupSkeletonSystem();
    }

    setupGlobalLoader() {
        // Create premium loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'premium-loading-overlay';
        overlay.id = 'premium-loading-overlay';
        overlay.style.display = 'none';
        
        overlay.innerHTML = `
            <div class="premium-loading-content">
                <div class="premium-spinner"></div>
                <h3 id="loading-title">Loading...</h3>
                <p id="loading-subtitle">Please wait while we prepare your data</p>
                <div class="progress-bar-premium" id="loading-progress"></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    setupSkeletonSystem() {
        // Auto-detect and setup skeleton screens for common elements
        this.skeletonConfigs = {
            '.kpi-grid': this.generateKPISkeleton,
            '.charts-section': this.generateChartSkeleton,
            '.activity-feed': this.generateActivitySkeleton,
            'table': this.generateTableSkeleton
        };
    }

    // Show premium loading with custom messages
    showLoading(title = 'Loading...', subtitle = 'Please wait while we prepare your data') {
        const overlay = this.overlay;
        const titleEl = overlay.querySelector('#loading-title');
        const subtitleEl = overlay.querySelector('#loading-subtitle');
        
        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = subtitle;
        
        overlay.style.display = 'flex';
        
        // Add entrance animation
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        
        return overlay;
    }

    hideLoading() {
        const overlay = this.overlay;
        overlay.style.opacity = '0';
        
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }

    // Show skeleton for specific element
    showSkeleton(selector) {
        const element = document.querySelector(selector);
        if (!element) return;

        const config = this.skeletonConfigs[selector];
        if (config) {
            const skeleton = config.call(this, element);
            element.innerHTML = skeleton;
            element.classList.add('skeleton-container');
        }
    }

    // Hide skeleton and restore content
    hideSkeleton(selector, restoreContent = null) {
        const element = document.querySelector(selector);
        if (!element) return;

        element.classList.remove('skeleton-container');
        
        if (restoreContent) {
            // Add stagger animation to restored content
            element.innerHTML = restoreContent;
            element.classList.add('stagger-animation');
            
            setTimeout(() => {
                element.classList.remove('stagger-animation');
            }, 1000);
        }
    }

    // Generate KPI skeleton
    generateKPISkeleton(container) {
        const skeletonCards = Array.from({ length: 4 }, () => `
            <div class="kpi-skeleton-item skeleton">
                <div class="skeleton-text large" style="width: 60%; margin-bottom: 1rem;"></div>
                <div class="skeleton-text" style="width: 40%; margin-bottom: 0.5rem;"></div>
                <div class="skeleton-text small" style="width: 80%;"></div>
            </div>
        `).join('');

        return `<div class="kpi-skeleton">${skeletonCards}</div>`;
    }

    // Generate chart skeleton
    generateChartSkeleton(container) {
        return `
            <div class="skeleton-chart skeleton" style="margin-bottom: 2rem;"></div>
            <div class="skeleton-text" style="width: 30%; margin-bottom: 1rem;"></div>
            <div class="skeleton-text small" style="width: 60%;"></div>
        `;
    }

    // Generate activity skeleton
    generateActivitySkeleton(container) {
        const skeletonItems = Array.from({ length: 6 }, () => `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div class="skeleton-avatar skeleton"></div>
                <div style="flex: 1;">
                    <div class="skeleton-text" style="width: 70%; margin-bottom: 0.5rem;"></div>
                    <div class="skeleton-text small" style="width: 40%;"></div>
                </div>
            </div>
        `).join('');

        return skeletonItems;
    }

    // Generate table skeleton
    generateTableSkeleton(container) {
        const headers = Array.from({ length: 5 }, () => `
            <th><div class="skeleton-text small skeleton"></div></th>
        `).join('');

        const rows = Array.from({ length: 8 }, () => `
            <tr>
                ${Array.from({ length: 5 }, () => `
                    <td><div class="skeleton-text small skeleton"></div></td>
                `).join('')}
            </tr>
        `).join('');

        return `
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
        `;
    }

    // Progressive loading with steps
    showProgressiveLoading(steps) {
        this.showLoading();
        let currentStep = 0;
        const totalSteps = steps.length;

        const processStep = async () => {
            if (currentStep >= totalSteps) {
                this.hideLoading();
                return;
            }

            const step = steps[currentStep];
            const titleEl = this.overlay.querySelector('#loading-title');
            const subtitleEl = this.overlay.querySelector('#loading-subtitle');
            
            if (titleEl) titleEl.textContent = step.title;
            if (subtitleEl) subtitleEl.textContent = step.subtitle;

            try {
                await step.action();
                currentStep++;
                setTimeout(processStep, 500); // Smooth transition between steps
            } catch (error) {
                console.error('Progressive loading failed:', error);
                this.hideLoading();
            }
        };

        processStep();
    }

    // Smart loading detection
    setupSmartLoading() {
        // Auto-detect Firebase operations
        if (window.db) {
            const originalGet = window.db.collection;
            
            // Override Firestore operations to show loading
            // This is a simplified example - in real implementation you'd hook into promises
        }

        // Auto-detect fetch requests
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            const loaderId = Math.random().toString(36).substr(2, 9);
            this.activeLoaders.set(loaderId, true);
            
            // Show loading if this is the first request
            if (this.activeLoaders.size === 1) {
                this.showLoading('Fetching data...', 'Loading fresh information');
            }

            return originalFetch(...args)
                .finally(() => {
                    this.activeLoaders.delete(loaderId);
                    
                    // Hide loading if no more active requests
                    if (this.activeLoaders.size === 0) {
                        setTimeout(() => {
                            if (this.activeLoaders.size === 0) {
                                this.hideLoading();
                            }
                        }, 500);
                    }
                });
        };
    }

    // Page loading optimization
    optimizePageLoading() {
        // Show skeleton while page loads
        document.addEventListener('DOMContentLoaded', () => {
            // Show skeletons for main content areas
            this.showSkeleton('.kpi-grid');
            this.showSkeleton('.charts-section');
            
            // Hide skeletons when content is ready
            setTimeout(() => {
                this.hideSkeleton('.kpi-grid');
                this.hideSkeleton('.charts-section');
            }, 2000);
        });
    }

    // Utility: Create inline loader for buttons
    createButtonLoader(button, text = 'Loading...') {
        const originalText = button.textContent;
        const originalHTML = button.innerHTML;
        
        button.disabled = true;
        button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="pulse-loader">
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <span>${text}</span>
            </div>
        `;
        
        return {
            restore: () => {
                button.disabled = false;
                button.innerHTML = originalHTML;
            }
        };
    }

    // Utility: Create section loader
    createSectionLoader(selector) {
        const element = document.querySelector(selector);
        if (!element) return;

        element.classList.add('data-loading');
        
        const loader = document.createElement('div');
        loader.className = 'loading-container';
        loader.innerHTML = `
            <div class="premium-spinner"></div>
            <p style="margin-top: 1rem; color: var(--text-secondary);">Loading content...</p>
        `;
        
        element.appendChild(loader);
        
        return {
            remove: () => {
                element.classList.remove('data-loading');
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }
        };
    }
}

// Initialize and expose globally
const professionalLoading = new ProfessionalLoading();
window.ProfessionalLoading = professionalLoading;

// Setup smart loading detection
professionalLoading.setupSmartLoading();
professionalLoading.optimizePageLoading();

// Integrate with existing kilangDMEnhancements
if (window.kilangDMEnhancements) {
    const originalShowLoading = window.kilangDMEnhancements.showLoading;
    const originalHideLoading = window.kilangDMEnhancements.hideLoading;
    
    window.kilangDMEnhancements.showLoading = function(message) {
        professionalLoading.showLoading('Processing...', message);
    };
    
    window.kilangDMEnhancements.hideLoading = function() {
        professionalLoading.hideLoading();
    };
}

console.log('🎨 Professional Loading System initialized');