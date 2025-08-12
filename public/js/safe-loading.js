/**
 * SAFE LOADING SYSTEM
 * Simple, reliable loading indicators
 */

safeInit('loading', [], function() {
    
    class SafeLoading {
        constructor() {
            this.overlay = null;
            this.activeLoaders = new Set();
            this.init();
        }

        init() {
            try {
                this.createOverlay();
                this.injectStyles();
                console.log('✅ Safe Loading initialized');
            } catch (error) {
                console.error('❌ Loading init failed:', error);
            }
        }

        createOverlay() {
            // Check if overlay already exists
            this.overlay = document.getElementById('safe-loading-overlay');
            if (this.overlay) return;

            this.overlay = document.createElement('div');
            this.overlay.id = 'safe-loading-overlay';
            this.overlay.className = 'safe-loading-overlay';
            this.overlay.style.display = 'none';
            
            this.overlay.innerHTML = `
                <div class="safe-loading-content">
                    <div class="safe-loading-spinner"></div>
                    <div class="safe-loading-text">Loading...</div>
                </div>
            `;
            
            // Safe append
            if (document.body) {
                document.body.appendChild(this.overlay);
            } else {
                setTimeout(() => this.createOverlay(), 100);
            }
        }

        injectStyles() {
            if (document.getElementById('safe-loading-style')) return;

            const style = document.createElement('style');
            style.id = 'safe-loading-style';
            style.textContent = `
                .safe-loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .safe-loading-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                .safe-loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top: 4px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                
                .safe-loading-text {
                    color: #374151;
                    font-weight: 500;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Button loading state */
                .btn-loading {
                    position: relative;
                    pointer-events: none;
                    opacity: 0.7;
                }
                
                .btn-loading::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 16px;
                    height: 16px;
                    margin: -8px 0 0 -8px;
                    border: 2px solid transparent;
                    border-top-color: currentColor;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                /* Skeleton loading */
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                }
                
                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `;
            
            if (document.head) {
                document.head.appendChild(style);
            }
        }

        show(text = 'Loading...') {
            if (!this.overlay) return;

            const textElement = this.overlay.querySelector('.safe-loading-text');
            if (textElement) {
                textElement.textContent = text;
            }

            this.overlay.style.display = 'flex';
        }

        hide() {
            if (!this.overlay) return;
            this.overlay.style.display = 'none';
        }

        // Button loading state
        setButtonLoading(button, loading = true) {
            if (!button) return;

            if (loading) {
                button.disabled = true;
                button.classList.add('btn-loading');
                button.dataset.originalText = button.textContent;
                button.textContent = 'Loading...';
            } else {
                button.disabled = false;
                button.classList.remove('btn-loading');
                if (button.dataset.originalText) {
                    button.textContent = button.dataset.originalText;
                }
            }
        }

        // Skeleton loading for elements
        setSkeleton(element, loading = true) {
            if (!element) return;

            if (loading) {
                element.classList.add('skeleton');
                element.dataset.originalContent = element.innerHTML;
                element.innerHTML = '&nbsp;';
            } else {
                element.classList.remove('skeleton');
                if (element.dataset.originalContent) {
                    element.innerHTML = element.dataset.originalContent;
                }
            }
        }

        // Auto loading for async operations
        async wrap(asyncFn, options = {}) {
            const { 
                text = 'Loading...', 
                button = null, 
                skeleton = null,
                showOverlay = false 
            } = options;

            try {
                // Start loading states
                if (showOverlay) this.show(text);
                if (button) this.setButtonLoading(button, true);
                if (skeleton) this.setSkeleton(skeleton, true);

                // Execute async operation
                const result = await asyncFn();
                return result;

            } catch (error) {
                console.error('Async operation failed:', error);
                throw error;
            } finally {
                // Stop loading states
                if (showOverlay) this.hide();
                if (button) this.setButtonLoading(button, false);
                if (skeleton) this.setSkeleton(skeleton, false);
            }
        }
    }

    const loading = new SafeLoading();
    
    // Global access
    window.loading = {
        show: (text) => loading.show(text),
        hide: () => loading.hide(),
        button: (btn, state) => loading.setButtonLoading(btn, state),
        skeleton: (el, state) => loading.setSkeleton(el, state),
        wrap: (fn, opts) => loading.wrap(fn, opts)
    };

    return loading;
});

console.log('⏳ Safe Loading loaded');