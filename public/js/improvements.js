// ==========================================
// KILANGDM ENHANCED IMPROVEMENTS JAVASCRIPT
// File: improvements.js
// ==========================================

class KilangDMEnhancements {
    constructor() {
        this.notifications = [];
        this.tooltips = new Map();
        this.modals = new Map();
        this.searchDebounceTimer = null;
        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.initTooltips();
        this.initModals();
        this.initKeyboardShortcuts();
        this.initSearchEnhancements();
        this.initFormValidation();
        this.initLoadingStates();
        this.initRealTimeUpdates();
        console.log('🚀 KilangDM Enhanced Features Loaded!');
    }

    // ==========================================
    // 1. NOTIFICATION SYSTEM
    // ==========================================
    createNotificationContainer() {
        if (document.getElementById('notification-container')) return;
        
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    showNotification(message, type = 'info', duration = 5000) {
        const id = Date.now().toString();
        const notification = this.createNotificationElement(id, message, type);
        
        const container = document.getElementById('notification-container');
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.removeNotification(id), duration);
        }
        
        this.notifications.push({ id, element: notification });
        return id;
    }

    createNotificationElement(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.id = id;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon ${icons[type]}"></i>
                <span class="notification-text">${message}</span>
                <button class="notification-close" onclick="kilangDMEnhancements.removeNotification('${id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        return notification;
    }

    removeNotification(id) {
        const notification = document.querySelector(`[data-id="${id}"]`);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 400);
        }
    }

    // ==========================================
    // 2. ENHANCED TOOLTIPS
    // ==========================================
    initTooltips() {
        document.addEventListener('mouseenter', (e) => {
            if (e.target.hasAttribute('data-tooltip')) {
                this.showTooltip(e.target);
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target.hasAttribute('data-tooltip')) {
                this.hideTooltip(e.target);
            }
        }, true);
    }

    showTooltip(element) {
        const text = element.getAttribute('data-tooltip');
        const position = element.getAttribute('data-tooltip-position') || 'top';
        
        if (this.tooltips.has(element)) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip ${position}`;
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        this.tooltips.set(element, tooltip);
        
        // Position tooltip
        this.positionTooltip(element, tooltip, position);
        
        // Show with delay
        setTimeout(() => tooltip.classList.add('show'), 100);
    }

    hideTooltip(element) {
        const tooltip = this.tooltips.get(element);
        if (tooltip) {
            tooltip.classList.remove('show');
            setTimeout(() => {
                tooltip.remove();
                this.tooltips.delete(element);
            }, 200);
        }
    }

    positionTooltip(element, tooltip, position) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 10;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = rect.bottom + 10;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left - tooltipRect.width - 10;
                break;
            case 'right':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + 10;
                break;
        }
        
        // Keep tooltip within viewport
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }

    // ==========================================
    // 3. MODAL SYSTEM
    // ==========================================
    initModals() {
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-modal')) {
                e.preventDefault();
                this.openModal(e.target.getAttribute('data-modal'));
            }
            
            if (e.target.classList.contains('modal-backdrop') || 
                e.target.classList.contains('modal-close')) {
                this.closeModal(e.target.closest('.modal-backdrop'));
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.appendChild(modal.cloneNode(true));
        
        document.body.appendChild(backdrop);
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            backdrop.classList.add('show');
            backdrop.querySelector('.modal').classList.add('show');
        }, 50);
        
        this.modals.set(modalId, backdrop);
    }

    closeModal(backdrop) {
        if (!backdrop) return;
        
        backdrop.classList.remove('show');
        backdrop.querySelector('.modal').classList.remove('show');
        
        setTimeout(() => {
            backdrop.remove();
            document.body.style.overflow = '';
            
            // Remove from modals map
            for (let [id, modalBackdrop] of this.modals) {
                if (modalBackdrop === backdrop) {
                    this.modals.delete(id);
                    break;
                }
            }
        }, 300);
    }

    closeAllModals() {
        this.modals.forEach(backdrop => this.closeModal(backdrop));
    }

    // ==========================================
    // 4. KEYBOARD SHORTCUTS
    // ==========================================
    initKeyboardShortcuts() {
        this.shortcuts = {
            'ctrl+k': () => this.focusSearch(),
            'ctrl+/': () => this.toggleShortcutsHelper(),
            'ctrl+n': () => this.showNotification('Shortcut test!', 'info'),
            'escape': () => this.closeAllModals()
        };

        document.addEventListener('keydown', (e) => {
            const key = this.getKeyCombo(e);
            if (this.shortcuts[key]) {
                e.preventDefault();
                this.shortcuts[key]();
            }
        });

        this.createShortcutsHelper();
    }

    getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }

    createShortcutsHelper() {
        const helper = document.createElement('div');
        helper.id = 'keyboard-shortcuts';
        helper.className = 'keyboard-shortcuts';
        helper.innerHTML = `
            <div class="shortcuts-title">
                <i class="fas fa-keyboard"></i> Keyboard Shortcuts
            </div>
            <div class="shortcut-item">
                <span class="shortcut-desc">Search</span>
                <div class="shortcut-keys">
                    <span class="shortcut-key">Ctrl</span>
                    <span class="shortcut-key">K</span>
                </div>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-desc">Toggle this help</span>
                <div class="shortcut-keys">
                    <span class="shortcut-key">Ctrl</span>
                    <span class="shortcut-key">/</span>
                </div>
            </div>
            <div class="shortcut-item">
                <span class="shortcut-desc">Close modals</span>
                <div class="shortcut-keys">
                    <span class="shortcut-key">Esc</span>
                </div>
            </div>
        `;
        document.body.appendChild(helper);
    }

    toggleShortcutsHelper() {
        const helper = document.getElementById('keyboard-shortcuts');
        helper.classList.toggle('show');
    }

    focusSearch() {
        const searchInput = document.querySelector('.search-input, #search, [type="search"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    // ==========================================
    // 5. SEARCH ENHANCEMENTS
    // ==========================================
    initSearchEnhancements() {
        document.querySelectorAll('.search-container').forEach(container => {
            this.enhanceSearchContainer(container);
        });
    }

    enhanceSearchContainer(container) {
        const input = container.querySelector('.search-input');
        if (!input) return;

        // Add search icon if not exists
        if (!container.querySelector('.search-icon')) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-search search-icon';
            container.appendChild(icon);
        }

        // Add clear button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'search-clear';
        clearBtn.innerHTML = '<i class="fas fa-times"></i>';
        clearBtn.addEventListener('click', () => {
            input.value = '';
            input.focus();
            clearBtn.classList.remove('show');
            this.triggerSearchEvent(input, '');
        });
        container.appendChild(clearBtn);

        // Handle input events
        input.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            clearBtn.classList.toggle('show', value.length > 0);
            
            // Debounced search
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = setTimeout(() => {
                this.triggerSearchEvent(input, value);
            }, 300);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                input.blur();
                clearBtn.classList.remove('show');
            }
        });
    }

    triggerSearchEvent(input, value) {
        const event = new CustomEvent('search', {
            detail: { value, element: input }
        });
        input.dispatchEvent(event);
    }

    // ==========================================
    // 6. FORM VALIDATION
    // ==========================================
    initFormValidation() {
        document.addEventListener('submit', (e) => {
            if (e.target.hasAttribute('data-validate')) {
                e.preventDefault();
                this.validateForm(e.target);
            }
        });

        document.addEventListener('blur', (e) => {
            if (e.target.hasAttribute('data-validate-field')) {
                this.validateField(e.target);
            }
        }, true);
    }

    validateForm(form) {
        const fields = form.querySelectorAll('[data-validate-field]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (isValid) {
            this.showNotification('Form validation passed!', 'success');
            // Form submission logic here
        } else {
            this.showNotification('Please fix the errors before submitting', 'error');
        }

        return isValid;
    }

    validateField(field) {
        const rules = field.getAttribute('data-validate-field').split('|');
        const value = field.value.trim();
        
        // Remove existing validation messages
        this.removeFieldValidation(field);

        for (let rule of rules) {
            const [ruleName, ruleValue] = rule.split(':');
            
            if (!this.applyValidationRule(field, value, ruleName, ruleValue)) {
                field.classList.add('invalid');
                return false;
            }
        }

        field.classList.remove('invalid');
        field.classList.add('valid');
        return true;
    }

    applyValidationRule(field, value, ruleName, ruleValue) {
        switch (ruleName) {
            case 'required':
                if (!value) {
                    this.showFieldError(field, 'Field ini diperlukan');
                    return false;
                }
                break;
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value && !emailRegex.test(value)) {
                    this.showFieldError(field, 'Format email tidak sah');
                    return false;
                }
                break;
                
            case 'min':
                if (value.length < parseInt(ruleValue)) {
                    this.showFieldError(field, `Minimum ${ruleValue} aksara diperlukan`);
                    return false;
                }
                break;
                
            case 'max':
                if (value.length > parseInt(ruleValue)) {
                    this.showFieldError(field, `Maksimum ${ruleValue} aksara sahaja`);
                    return false;
                }
                break;
                
            case 'numeric':
                if (value && !/^\d+$/.test(value)) {
                    this.showFieldError(field, 'Hanya nombor sahaja dibenarkan');
                    return false;
                }
                break;
        }
        
        return true;
    }

    showFieldError(field, message) {
        const error = document.createElement('div');
        error.className = 'form-error';
        error.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        field.parentNode.appendChild(error);
    }

    removeFieldValidation(field) {
        const existingError = field.parentNode.querySelector('.form-error');
        const existingSuccess = field.parentNode.querySelector('.form-success');
        
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();
        
        field.classList.remove('valid', 'invalid');
    }

    // ==========================================
    // 7. LOADING STATES
    // ==========================================
    initLoadingStates() {
        this.createLoadingOverlay();
    }

    createLoadingOverlay() {
        if (document.getElementById('loading-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
        `;
        document.body.appendChild(overlay);
    }

    showLoading(message = '') {
        const overlay = document.getElementById('loading-overlay');
        if (message) {
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div style="color: var(--gray-300); margin-top: 1rem; font-size: 0.875rem;">${message}</div>
            `;
        }
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    // ==========================================
    // 8. REAL-TIME UPDATES
    // ==========================================
    initRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateTimestamps();
            this.updateStatusIndicators();
        }, 30000); // Update every 30 seconds
    }

    updateTimestamps() {
        document.querySelectorAll('[data-timestamp]').forEach(element => {
            const timestamp = parseInt(element.getAttribute('data-timestamp'));
            const timeAgo = this.getTimeAgo(timestamp);
            element.textContent = timeAgo;
        });
    }

    updateStatusIndicators() {
        document.querySelectorAll('.status-indicator').forEach(indicator => {
            // Update connection status, data freshness, etc.
            const now = Date.now();
            const lastUpdate = parseInt(indicator.getAttribute('data-last-update') || now);
            const timeDiff = now - lastUpdate;
            
            if (timeDiff > 300000) { // 5 minutes
                indicator.className = 'status-indicator status-offline';
                indicator.innerHTML = '<span class="status-dot"></span> Offline';
            } else if (timeDiff > 60000) { // 1 minute
                indicator.className = 'status-indicator status-updating';
                indicator.innerHTML = '<span class="status-dot"></span> Updating';
            } else {
                indicator.className = 'status-indicator status-live';
                indicator.innerHTML = '<span class="status-dot"></span> Live';
            }
        });
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} hari lalu`;
        if (hours > 0) return `${hours} jam lalu`;
        if (minutes > 0) return `${minutes} minit lalu`;
        return 'Baru sahaja';
    }

    // ==========================================
    // 9. DATA EXPORT FUNCTIONALITY
    // ==========================================
    initDataExport() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.export-option')) {
                const option = e.target.closest('.export-option');
                const format = option.getAttribute('data-format');
                const source = option.getAttribute('data-source');
                this.exportData(format, source);
            }
        });
    }

    exportData(format, source) {
        this.showLoading(`Mengeksport data dalam format ${format.toUpperCase()}...`);
        
        // Simulate export process
        setTimeout(() => {
            this.hideLoading();
            this.showNotification(`Data berjaya dieksport dalam format ${format.toUpperCase()}!`, 'success');
            
            // Actual export logic would go here
            this.downloadFile(`kilangdm-data.${format}`, this.generateExportData(format, source));
        }, 2000);
    }

    generateExportData(format, source) {
        // This would contain actual data export logic
        const data = {
            timestamp: new Date().toISOString(),
            source: source,
            format: format,
            data: "Sample exported data"
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.jsonToCsv([data]);
            case 'pdf':
                return 'PDF content would be generated here';
            default:
                return JSON.stringify(data);
        }
    }

    jsonToCsv(json) {
        const headers = Object.keys(json[0]);
        const csvContent = [
            headers.join(','),
            ...json.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        return csvContent;
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ==========================================
    // 10. SKELETON LOADING
    // ==========================================
    createSkeleton(container, type = 'card') {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        
        switch (type) {
            case 'card':
                skeleton.innerHTML = `
                    <div class="skeleton skeleton-text large"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text small"></div>
                `;
                break;
            case 'table':
                skeleton.innerHTML = `
                    <div class="skeleton skeleton-text large" style="margin-bottom: 1rem;"></div>
                    ${Array(5).fill('<div class="skeleton skeleton-text" style="margin-bottom: 0.5rem;"></div>').join('')}
                `;
                break;
            case 'chart':
                skeleton.innerHTML = `
                    <div class="skeleton skeleton-text large" style="margin-bottom: 1rem;"></div>
                    <div class="skeleton" style="height: 200px; border-radius: 8px;"></div>
                `;
                break;
        }
        
        container.appendChild(skeleton);
        return skeleton;
    }

    removeSkeleton(container) {
        const skeletons = container.querySelectorAll('.skeleton-card');
        skeletons.forEach(skeleton => skeleton.remove());
    }

    // ==========================================
    // 11. UTILITY METHODS
    // ==========================================
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    formatCurrency(amount, currency = 'RM') {
        return `${currency} ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`;
    }

    formatNumber(number) {
        return number.toLocaleString('ms-MY');
    }

    formatDate(date, format = 'short') {
        const options = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            long: { day: 'numeric', month: 'long', year: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' }
        };
        
        return new Intl.DateTimeFormat('ms-MY', options[format]).format(new Date(date));
    }

    // ==========================================
    // 12. CLEANUP
    // ==========================================
    destroy() {
        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Clear timeouts
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        // Remove event listeners
        this.tooltips.clear();
        this.modals.clear();
        this.notifications = [];
        
        console.log('🧹 KilangDM Enhancements cleaned up');
    }
}

// ==========================================
// INITIALIZE ENHANCEMENTS
// ==========================================
let kilangDMEnhancements;

document.addEventListener('DOMContentLoaded', () => {
    kilangDMEnhancements = new KilangDMEnhancements();
});

// Make it globally available
window.kilangDMEnhancements = kilangDMEnhancements;