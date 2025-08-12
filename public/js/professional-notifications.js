/**
 * PROFESSIONAL NOTIFICATION SYSTEM
 * Advanced toast notifications like Slack, Discord, GitHub
 */

class ProfessionalNotifications {
    constructor() {
        this.notifications = new Map();
        this.container = this.createContainer();
        this.setupNotificationTypes();
        this.setupKeyboardShortcuts();
        this.setupQueueSystem();
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'professional-notifications-container';
        container.id = 'professional-notifications';
        document.body.appendChild(container);
        return container;
    }

    setupNotificationTypes() {
        this.types = {
            success: {
                icon: '✅',
                color: '#22c55e',
                duration: 4000
            },
            error: {
                icon: '❌',
                color: '#ef4444',
                duration: 6000
            },
            warning: {
                icon: '⚠️',
                color: '#f59e0b',
                duration: 5000
            },
            info: {
                icon: 'ℹ️',
                color: '#3b82f6',
                duration: 4000
            },
            loading: {
                icon: '⏳',
                color: '#6b7280',
                duration: 0 // Persist until dismissed
            },
            achievement: {
                icon: '🏆',
                color: '#8b5cf6',
                duration: 6000
            },
            update: {
                icon: '🔄',
                color: '#06b6d4',
                duration: 5000
            }
        };
    }

    setupQueueSystem() {
        this.queue = [];
        this.maxVisible = 5;
        this.isProcessing = false;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + N to dismiss all notifications
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.dismissAll();
            }
            
            // Escape to dismiss latest notification
            if (e.key === 'Escape') {
                this.dismissLatest();
            }
        });
    }

    // Main notification function
    show(message, type = 'info', options = {}) {
        const id = this.generateId();
        const config = { ...this.types[type], ...options };
        
        const notification = this.createNotification(id, message, type, config);
        this.notifications.set(id, notification);
        
        this.addToQueue(notification);
        this.processQueue();
        
        return {
            id,
            dismiss: () => this.dismiss(id),
            update: (newMessage, newType) => this.update(id, newMessage, newType)
        };
    }

    // Specialized notification methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    loading(message, options = {}) {
        return this.show(message, 'loading', options);
    }

    achievement(message, options = {}) {
        return this.show(message, 'achievement', { 
            ...options, 
            sound: true,
            animate: 'bounce'
        });
    }

    // Progress notification
    showProgress(message, current, total, options = {}) {
        const percentage = Math.round((current / total) * 100);
        const progressMessage = `${message} (${current}/${total} - ${percentage}%)`;
        
        return this.show(progressMessage, 'loading', {
            ...options,
            progress: percentage,
            persistent: true
        });
    }

    // Action notification with buttons
    showAction(message, actions = [], type = 'info', options = {}) {
        const actionButtons = actions.map(action => `
            <button class="notification-action-btn" data-action="${action.id}">
                ${action.label}
            </button>
        `).join('');

        return this.show(message + `<div class="notification-actions">${actionButtons}</div>`, type, {
            ...options,
            actions: actions,
            duration: 0 // Keep until action is taken
        });
    }

    // Group related notifications
    showGroup(title, messages, type = 'info', options = {}) {
        const messageList = messages.map(msg => `<div class="notification-group-item">${msg}</div>`).join('');
        const groupContent = `
            <div class="notification-group">
                <div class="notification-group-title">${title}</div>
                <div class="notification-group-messages">${messageList}</div>
            </div>
        `;
        
        return this.show(groupContent, type, {
            ...options,
            isGroup: true
        });
    }

    createNotification(id, message, type, config) {
        const notification = document.createElement('div');
        notification.className = `professional-notification notification-${type}`;
        notification.setAttribute('data-id', id);
        
        // Add animation class
        if (config.animate) {
            notification.classList.add(`animate-${config.animate}`);
        }

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <div class="notification-icon">${config.icon}</div>
                    <div class="notification-message">${message}</div>
                    <button class="notification-close" data-dismiss="${id}">×</button>
                </div>
                ${config.progress !== undefined ? `
                    <div class="notification-progress">
                        <div class="notification-progress-bar" style="width: ${config.progress}%"></div>
                    </div>
                ` : ''}
            </div>
        `;

        // Add event listeners
        this.addEventListeners(notification, id, config);
        
        return notification;
    }

    addEventListeners(notification, id, config) {
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.dismiss(id));

        // Action buttons
        const actionBtns = notification.querySelectorAll('.notification-action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionId = e.target.dataset.action;
                const action = config.actions?.find(a => a.id === actionId);
                if (action?.callback) {
                    action.callback();
                }
                this.dismiss(id);
            });
        });

        // Auto-dismiss timer
        if (config.duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, config.duration);
        }

        // Sound effect
        if (config.sound) {
            this.playSound(config.soundType || 'default');
        }

        // Click to dismiss (except for action notifications)
        if (!config.actions) {
            notification.addEventListener('click', () => this.dismiss(id));
        }
    }

    addToQueue(notification) {
        this.queue.push(notification);
    }

    processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const visibleCount = this.container.children.length;
        
        while (this.queue.length > 0 && visibleCount < this.maxVisible) {
            const notification = this.queue.shift();
            this.container.appendChild(notification);
            
            // Trigger entrance animation
            requestAnimationFrame(() => {
                notification.classList.add('notification-enter');
            });
        }

        this.isProcessing = false;
    }

    dismiss(id) {
        const notification = this.container.querySelector(`[data-id="${id}"]`);
        if (!notification) return;

        notification.classList.add('notification-exit');
        
        setTimeout(() => {
            if (notification.parentNode) {
                this.container.removeChild(notification);
                this.notifications.delete(id);
                this.processQueue(); // Process any queued notifications
            }
        }, 300);
    }

    dismissAll() {
        const notifications = Array.from(this.container.children);
        notifications.forEach(notification => {
            const id = notification.getAttribute('data-id');
            this.dismiss(id);
        });
    }

    dismissLatest() {
        const notifications = Array.from(this.container.children);
        if (notifications.length > 0) {
            const latest = notifications[notifications.length - 1];
            const id = latest.getAttribute('data-id');
            this.dismiss(id);
        }
    }

    update(id, newMessage, newType) {
        const notification = this.container.querySelector(`[data-id="${id}"]`);
        if (!notification) return;

        const messageEl = notification.querySelector('.notification-message');
        const iconEl = notification.querySelector('.notification-icon');
        
        if (messageEl) messageEl.innerHTML = newMessage;
        if (newType && iconEl) {
            iconEl.textContent = this.types[newType].icon;
            notification.className = `professional-notification notification-${newType}`;
        }
    }

    // Utility methods
    generateId() {
        return 'notification-' + Math.random().toString(36).substr(2, 9);
    }

    playSound(type = 'default') {
        // Create audio context for notification sounds
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const audioContext = new (AudioContext || webkitAudioContext)();
            
            // Generate different tones for different notification types
            const frequencies = {
                default: 800,
                success: 600,
                error: 300,
                achievement: 1000
            };
            
            const freq = frequencies[type] || frequencies.default;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    }

    // Analytics and insights
    getStats() {
        return {
            totalShown: this.notifications.size,
            currentlyVisible: this.container.children.length,
            queued: this.queue.length
        };
    }

    // Theme-aware notifications
    setTheme(theme = 'dark') {
        this.container.setAttribute('data-theme', theme);
    }
}

// CSS for notifications (inject into head)
const notificationCSS = `
.professional-notifications-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10001;
    max-width: 400px;
    pointer-events: none;
}

.professional-notification {
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 100%;
    word-wrap: break-word;
}

.professional-notification.notification-enter {
    transform: translateX(0);
    opacity: 1;
}

.professional-notification.notification-exit {
    transform: translateX(100%) scale(0.9);
    opacity: 0;
}

.notification-content {
    color: #e2e8f0;
    font-size: 14px;
    line-height: 1.4;
}

.notification-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.notification-icon {
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 1px;
}

.notification-message {
    flex: 1;
    font-weight: 500;
}

.notification-close {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 18px;
    flex-shrink: 0;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.notification-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
}

.notification-progress {
    margin-top: 12px;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
}

.notification-progress-bar {
    height: 100%;
    background: #3b82f6;
    transition: width 0.3s ease;
}

.notification-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
}

.notification-action-btn {
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #60a5fa;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.notification-action-btn:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.6);
}

.notification-group-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: #f1f5f9;
}

.notification-group-messages {
    margin-left: 12px;
}

.notification-group-item {
    margin-bottom: 4px;
    color: #cbd5e1;
    font-size: 13px;
}

/* Type-specific styles */
.notification-success { border-left: 4px solid #22c55e; }
.notification-error { border-left: 4px solid #ef4444; }
.notification-warning { border-left: 4px solid #f59e0b; }
.notification-info { border-left: 4px solid #3b82f6; }
.notification-achievement { border-left: 4px solid #8b5cf6; }
.notification-loading { border-left: 4px solid #6b7280; }

/* Animations */
.animate-bounce {
    animation: notificationBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes notificationBounce {
    0% { transform: translateX(100%) scale(0.8); }
    50% { transform: translateX(-10px) scale(1.05); }
    100% { transform: translateX(0) scale(1); }
}

/* Mobile responsive */
@media (max-width: 480px) {
    .professional-notifications-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
    }
    
    .professional-notification {
        margin-bottom: 8px;
        padding: 12px;
    }
}
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationCSS;
document.head.appendChild(styleSheet);

// Initialize and expose globally
const professionalNotifications = new ProfessionalNotifications();
window.ProfessionalNotifications = professionalNotifications;

// Create global shortcuts
window.notify = professionalNotifications.show.bind(professionalNotifications);
window.notify.success = professionalNotifications.success.bind(professionalNotifications);
window.notify.error = professionalNotifications.error.bind(professionalNotifications);
window.notify.warning = professionalNotifications.warning.bind(professionalNotifications);
window.notify.info = professionalNotifications.info.bind(professionalNotifications);
window.notify.loading = professionalNotifications.loading.bind(professionalNotifications);
window.notify.achievement = professionalNotifications.achievement.bind(professionalNotifications);
window.notify.progress = professionalNotifications.showProgress.bind(professionalNotifications);
window.notify.action = professionalNotifications.showAction.bind(professionalNotifications);
window.notify.group = professionalNotifications.showGroup.bind(professionalNotifications);

console.log('🔔 Professional Notifications System initialized');
console.log('💡 Usage: notify.success("Your message"), notify.error("Error"), etc.');
console.log('⌨️  Shortcuts: Ctrl+Shift+N (dismiss all), Esc (dismiss latest)');