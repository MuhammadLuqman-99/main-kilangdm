/**
 * SAFE NOTIFICATIONS SYSTEM
 * Simple, reliable toast notifications
 */

safeInit('notifications', [], function() {
    
    class SafeNotifications {
        constructor() {
            this.container = null;
            this.notifications = new Map();
            this.nextId = 1;
            this.init();
        }

        init() {
            try {
                this.createContainer();
                this.injectStyles();
                console.log('✅ Safe Notifications initialized');
            } catch (error) {
                console.error('❌ Notifications init failed:', error);
            }
        }

        createContainer() {
            // Check if container already exists
            this.container = document.getElementById('safe-notifications');
            if (this.container) return;

            this.container = document.createElement('div');
            this.container.id = 'safe-notifications';
            this.container.className = 'safe-notifications-container';
            
            // Safe append
            if (document.body) {
                document.body.appendChild(this.container);
            } else {
                setTimeout(() => this.createContainer(), 100);
            }
        }

        injectStyles() {
            if (document.getElementById('safe-notifications-style')) return;

            const style = document.createElement('style');
            style.id = 'safe-notifications-style';
            style.textContent = `
                .safe-notifications-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    pointer-events: none;
                }
                
                .safe-notification {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    margin-bottom: 10px;
                    padding: 16px;
                    min-width: 300px;
                    max-width: 400px;
                    pointer-events: auto;
                    transform: translateX(400px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    border-left: 4px solid #3b82f6;
                }
                
                .safe-notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .safe-notification.success {
                    border-left-color: #10b981;
                }
                
                .safe-notification.error {
                    border-left-color: #ef4444;
                }
                
                .safe-notification.warning {
                    border-left-color: #f59e0b;
                }
                
                .notification-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .notification-title {
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #6b7280;
                    font-size: 18px;
                    line-height: 1;
                    padding: 0;
                }
                
                .notification-message {
                    color: #4b5563;
                    font-size: 14px;
                }
                
                @media (max-width: 640px) {
                    .safe-notifications-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                    }
                    
                    .safe-notification {
                        min-width: auto;
                        max-width: none;
                        transform: translateY(-100px);
                    }
                    
                    .safe-notification.show {
                        transform: translateY(0);
                    }
                }
            `;
            
            if (document.head) {
                document.head.appendChild(style);
            }
        }

        show(message, type = 'info', duration = 5000) {
            if (!this.container) {
                console.warn('Notifications container not ready');
                return null;
            }

            const id = this.nextId++;
            const notification = this.createNotification(id, message, type);
            
            this.container.appendChild(notification);
            this.notifications.set(id, notification);

            // Animate in
            setTimeout(() => notification.classList.add('show'), 10);

            // Auto remove
            if (duration > 0) {
                setTimeout(() => this.remove(id), duration);
            }

            return id;
        }

        createNotification(id, message, type) {
            const notification = document.createElement('div');
            notification.className = `safe-notification ${type}`;
            notification.dataset.id = id;

            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };

            const titles = {
                success: 'Success',
                error: 'Error',
                warning: 'Warning',
                info: 'Info'
            };

            notification.innerHTML = `
                <div class="notification-header">
                    <div class="notification-title">
                        ${icons[type] || icons.info} ${titles[type] || titles.info}
                    </div>
                    <button class="notification-close" onclick="SafeModule.get('notifications').remove(${id})">&times;</button>
                </div>
                <div class="notification-message">${message}</div>
            `;

            return notification;
        }

        remove(id) {
            const notification = this.notifications.get(id);
            if (!notification) return;

            notification.classList.remove('show');
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.parentElement.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 300);
        }

        // Convenience methods
        success(message, duration) {
            return this.show(message, 'success', duration);
        }

        error(message, duration) {
            return this.show(message, 'error', duration);
        }

        warning(message, duration) {
            return this.show(message, 'warning', duration);
        }

        info(message, duration) {
            return this.show(message, 'info', duration);
        }

        clear() {
            for (const id of this.notifications.keys()) {
                this.remove(id);
            }
        }
    }

    const notifications = new SafeNotifications();
    
    // Global access
    window.notify = {
        success: (msg, duration) => notifications.success(msg, duration),
        error: (msg, duration) => notifications.error(msg, duration),
        warning: (msg, duration) => notifications.warning(msg, duration),
        info: (msg, duration) => notifications.info(msg, duration),
        clear: () => notifications.clear()
    };

    return notifications;
});

console.log('🔔 Safe Notifications loaded');