// PWA Manager - Handles Progressive Web App functionality
// Install prompts, offline handling, and app-like features

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isOnline = navigator.onLine;
        
        this.initializePWA();
        console.log('📱 PWA Manager initialized');
    }

    initializePWA() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOfflineHandler();
        this.setupAppUpdates();
        this.createInstallButton();
        this.handleAppInstalled();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateAvailable();
                        }
                    });
                });

            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        }
    }

    setupInstallPrompt() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('💾 Install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPromotion();
        });
    }

    setupOfflineHandler() {
        // Online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showOnlineStatus();
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineStatus();
        });
    }

    setupAppUpdates() {
        // Check for app updates periodically
        setInterval(() => {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
            }
        }, 30 * 60 * 1000); // Check every 30 minutes
    }

    createInstallButton() {
        // Create floating install button
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.className = 'pwa-install-btn hidden';
        installBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Install App</span>
        `;
        
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            border-radius: 25px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            cursor: pointer;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        `;

        installBtn.addEventListener('mouseenter', () => {
            installBtn.style.transform = 'translateY(-2px)';
            installBtn.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.5)';
        });

        installBtn.addEventListener('mouseleave', () => {
            installBtn.style.transform = 'translateY(0)';
            installBtn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
        });

        installBtn.addEventListener('click', () => {
            this.promptInstall();
        });

        document.body.appendChild(installBtn);
    }

    showInstallPromotion() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.classList.remove('hidden');
            installBtn.style.animation = 'slideInLeft 0.5s ease';
        }

        // Show install notification
        if (window.notificationSystem) {
            window.notificationSystem.showNotification({
                type: 'info',
                title: '📱 Install KilangDM App',
                message: 'Install dashboard sebagai app untuk experience yang lebih baik!',
                priority: 'low',
                persistent: true
            });
        }
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            this.showManualInstallInstructions();
            return;
        }

        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user's response
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
                this.hideInstallPromotion();
            } else {
                console.log('❌ User dismissed the install prompt');
            }
            
            // Clear the prompt
            this.deferredPrompt = null;
            
        } catch (error) {
            console.error('❌ Install prompt failed:', error);
        }
    }

    showManualInstallInstructions() {
        const instructions = this.getInstallInstructions();
        
        if (window.notificationSystem) {
            window.notificationSystem.showNotification({
                type: 'info',
                title: '📲 Manual Install Instructions',
                message: instructions,
                priority: 'medium',
                persistent: true
            });
        }
    }

    getInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        if (isIOS) {
            return 'Tap Share button (📤) in Safari, then "Add to Home Screen"';
        } else if (isAndroid) {
            return 'Tap menu (⋮) in Chrome, then "Add to Home screen"';
        } else {
            return 'Click menu (⋮) in your browser, then "Install KilangDM" or "Add to Home screen"';
        }
    }

    hideInstallPromotion() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.animation = 'slideOutLeft 0.5s ease';
            setTimeout(() => {
                installBtn.classList.add('hidden');
            }, 500);
        }
    }

    handleAppInstalled() {
        window.addEventListener('appinstalled', (evt) => {
            console.log('✅ PWA was installed');
            this.isInstalled = true;
            this.hideInstallPromotion();
            
            if (window.notificationSystem) {
                window.notificationSystem.success(
                    '🎉 App Installed!', 
                    'KilangDM Dashboard berjaya installed! Sekarang boleh access dari home screen.'
                );
            }
        });
    }

    showOnlineStatus() {
        // Remove offline indicator
        const offlineIndicator = document.getElementById('offline-indicator');
        if (offlineIndicator) {
            offlineIndicator.remove();
        }

        if (window.notificationSystem) {
            window.notificationSystem.success(
                '🌐 Back Online!', 
                'Connection restored. Data will sync automatically.'
            );
        }

        // Update status indicators
        this.updateConnectionStatus('online');
    }

    showOfflineStatus() {
        // Show offline indicator
        let offlineIndicator = document.getElementById('offline-indicator');
        
        if (!offlineIndicator) {
            offlineIndicator = document.createElement('div');
            offlineIndicator.id = 'offline-indicator';
            offlineIndicator.innerHTML = `
                <i class="fas fa-wifi-slash"></i>
                <span>Offline Mode</span>
            `;
            offlineIndicator.style.cssText = `
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: #f59e0b;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                z-index: 10001;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
            `;
            document.body.appendChild(offlineIndicator);
        }

        if (window.notificationSystem) {
            window.notificationSystem.warning(
                '📡 Offline Mode', 
                'No internet connection. Some features may be limited.'
            );
        }

        // Update status indicators
        this.updateConnectionStatus('offline');
    }

    updateConnectionStatus(status) {
        // Update all status indicators in the dashboard
        const statusElements = document.querySelectorAll('.connection-status');
        statusElements.forEach(element => {
            element.className = `connection-status ${status}`;
            element.textContent = status === 'online' ? 'Live' : 'Offline';
        });
    }

    async syncOfflineData() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                // Trigger background sync
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('background-sync-dashboard');
                console.log('🔄 Background sync registered');
                
            } catch (error) {
                console.log('❌ Background sync failed:', error);
            }
        }
    }

    showUpdateAvailable() {
        // Create update notification
        const updateNotification = document.createElement('div');
        updateNotification.className = 'update-notification';
        updateNotification.innerHTML = `
            <div class="update-content">
                <div class="update-text">
                    <strong>🆕 Update Available</strong>
                    <p>New version of dashboard available!</p>
                </div>
                <button class="update-btn" id="update-app-btn">
                    Update Now
                </button>
                <button class="update-dismiss" id="dismiss-update-btn">
                    ×
                </button>
            </div>
        `;

        updateNotification.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
            z-index: 10000;
            max-width: 300px;
            animation: slideInRight 0.5s ease;
        `;

        document.body.appendChild(updateNotification);

        // Handle update button
        document.getElementById('update-app-btn').addEventListener('click', () => {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            }
            window.location.reload();
        });

        // Handle dismiss button
        document.getElementById('dismiss-update-btn').addEventListener('click', () => {
            updateNotification.remove();
        });
    }

    // Public methods for external use
    async checkInstallability() {
        if (this.deferredPrompt) {
            return { canInstall: true, method: 'prompt' };
        }

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || this.isInstalled) {
            return { canInstall: false, reason: 'already_installed' };
        }

        return { canInstall: true, method: 'manual' };
    }

    getConnectionStatus() {
        return {
            isOnline: this.isOnline,
            isInstalled: this.isInstalled,
            supportsServiceWorker: 'serviceWorker' in navigator,
            supportsNotifications: 'Notification' in window
        };
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            console.log('🔔 Notification permission:', permission);
            return permission === 'granted';
        }
        return false;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutLeft {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-100%); opacity: 0; }
    }

    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    .pwa-install-btn.hidden {
        display: none !important;
    }

    .update-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .update-text p {
        margin: 0.25rem 0 0 0;
        font-size: 0.9rem;
        opacity: 0.9;
    }

    .update-btn {
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .update-btn:hover {
        background: rgba(255,255,255,0.3);
    }

    .update-dismiss {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0.7;
    }

    .update-dismiss:hover {
        opacity: 1;
    }

    .connection-status.online {
        color: #22c55e;
    }

    .connection-status.offline {
        color: #f59e0b;
    }
`;
document.head.appendChild(style);

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});

console.log('📱 PWA Manager script loaded');