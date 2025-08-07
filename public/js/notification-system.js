// Advanced Notification System
// Monitors targets, alerts, and business metrics

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.targets = {
            monthlyTarget: 15000, // RM 15,000 default
            dailyTarget: 500,     // RM 500 default daily
            minOrderTarget: 5,    // Minimum 5 orders per day
            lowPerformanceThreshold: 0.7 // 70% of target
        };
        
        this.initializeSystem();
        console.log('🔔 Notification System initialized');
    }

    initializeSystem() {
        this.createNotificationContainer();
        this.startMonitoring();
        this.checkInitialMetrics();
        
        // Check every 5 minutes
        setInterval(() => {
            this.checkMetrics();
        }, 5 * 60 * 1000);

        // Check every hour for more comprehensive checks
        setInterval(() => {
            this.checkComprehensiveMetrics();
        }, 60 * 60 * 1000);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 350px;
            max-height: calc(100vh - 100px);
            overflow-y: auto;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(container);
    }

    startMonitoring() {
        // Monitor when data changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.matches('#total-sales, #sale-mtd, #total-orders, #kpi-harian')) {
                    this.scheduleMetricCheck();
                }
            });
        });

        // Observe KPI elements
        const kpiElements = [
            'total-sales', 'sale-mtd', 'total-orders', 'kpi-harian',
            'balance-bulanan', 'monthly-progress-text'
        ];

        kpiElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element, { 
                    childList: true, 
                    characterData: true, 
                    subtree: true 
                });
            }
        });
    }

    scheduleMetricCheck() {
        // Debounce multiple rapid changes
        clearTimeout(this.checkTimeout);
        this.checkTimeout = setTimeout(() => {
            this.checkMetrics();
        }, 2000);
    }

    checkInitialMetrics() {
        setTimeout(() => {
            this.checkMetrics();
            this.checkComprehensiveMetrics();
        }, 3000); // Wait for data to load
    }

    checkMetrics() {
        this.checkDailyPerformance();
        this.checkMonthlyProgress();
        this.checkOrderTargets();
        this.checkLowPerformance();
    }

    checkComprehensiveMetrics() {
        this.checkWeeklyTrends();
        this.checkTargetAchievement();
        this.sendMotivationalMessages();
    }

    checkDailyPerformance() {
        const todayRevenue = this.parseValue(document.getElementById('today-revenue')?.textContent);
        const todayOrders = this.parseValue(document.getElementById('today-orders')?.textContent);

        if (todayRevenue > this.targets.dailyTarget) {
            this.showNotification({
                type: 'success',
                title: '🎉 Daily Target Achieved!',
                message: `Today's revenue: ${this.formatCurrency(todayRevenue)} (Target: ${this.formatCurrency(this.targets.dailyTarget)})`,
                priority: 'high'
            });
        } else if (todayRevenue < this.targets.dailyTarget * 0.5 && this.isAfternoon()) {
            this.showNotification({
                type: 'warning',
                title: '⚠️ Daily Target Alert',
                message: `Current revenue: ${this.formatCurrency(todayRevenue)}. Need ${this.formatCurrency(this.targets.dailyTarget - todayRevenue)} more to hit target!`,
                priority: 'medium'
            });
        }

        if (todayOrders < this.targets.minOrderTarget && this.isEvening()) {
            this.showNotification({
                type: 'info',
                title: '📦 Order Target Alert',
                message: `Only ${todayOrders} orders today. Target: ${this.targets.minOrderTarget} orders`,
                priority: 'medium'
            });
        }
    }

    checkMonthlyProgress() {
        const monthlyProgressText = document.getElementById('monthly-progress-text')?.textContent || '';
        const progressMatch = monthlyProgressText.match(/(\d+(?:\.\d+)?)%/);
        
        if (progressMatch) {
            const progress = parseFloat(progressMatch[1]);
            
            if (progress >= 100) {
                this.showNotification({
                    type: 'celebration',
                    title: '🏆 Monthly Target ACHIEVED!',
                    message: `Congratulations! Monthly progress: ${progress}%`,
                    priority: 'high',
                    persistent: true
                });
            } else if (progress >= 90) {
                this.showNotification({
                    type: 'success',
                    title: '🎯 Almost There!',
                    message: `Monthly progress: ${progress}%. You're so close!`,
                    priority: 'high'
                });
            } else if (progress < 50 && this.isMonthHalfway()) {
                this.showNotification({
                    type: 'urgent',
                    title: '🚨 Monthly Target Alert',
                    message: `Progress: ${progress}%. Need to accelerate to meet monthly target!`,
                    priority: 'high'
                });
            }
        }
    }

    checkOrderTargets() {
        const totalOrders = this.parseValue(document.getElementById('total-orders')?.textContent);
        const todayOrders = this.parseValue(document.getElementById('today-orders')?.textContent);

        // Celebrate milestones
        if (totalOrders > 0 && totalOrders % 100 === 0) {
            this.showNotification({
                type: 'celebration',
                title: '🎊 Order Milestone!',
                message: `Achieved ${totalOrders} total orders! Great work!`,
                priority: 'high'
            });
        }

        if (todayOrders > 10) {
            this.showNotification({
                type: 'success',
                title: '📈 Great Day!',
                message: `${todayOrders} orders today! Team is performing excellently!`,
                priority: 'medium'
            });
        }
    }

    checkLowPerformance() {
        const saleMtd = this.parseValue(document.getElementById('sale-mtd')?.textContent);
        const kpiMtd = this.parseValue(document.getElementById('kpi-mtd')?.textContent);
        
        if (saleMtd > 0 && kpiMtd > 0 && saleMtd < kpiMtd * this.targets.lowPerformanceThreshold) {
            this.showNotification({
                type: 'warning',
                title: '📊 Performance Notice',
                message: `Current MTD sales below 70% of target. Consider reviewing strategy.`,
                priority: 'medium'
            });
        }
    }

    checkWeeklyTrends() {
        // This would need historical data - for now, basic check
        const totalSales = this.parseValue(document.getElementById('total-sales')?.textContent);
        
        if (totalSales > 50000) { // High performer
            this.showNotification({
                type: 'success',
                title: '🌟 High Performer!',
                message: `Outstanding sales performance: ${this.formatCurrency(totalSales)}`,
                priority: 'low'
            });
        }
    }

    checkTargetAchievement() {
        const balanceBulanan = this.parseValue(document.getElementById('balance-bulanan')?.textContent);
        
        if (balanceBulanan < 0) { // Exceeded target
            this.showNotification({
                type: 'celebration',
                title: '🎯 Target Exceeded!',
                message: `You've exceeded the monthly target by ${this.formatCurrency(Math.abs(balanceBulanan))}!`,
                priority: 'high'
            });
        }
    }

    sendMotivationalMessages() {
        const hour = new Date().getHours();
        const day = new Date().getDay();
        
        // Monday motivation
        if (day === 1 && hour === 9) {
            this.showNotification({
                type: 'motivation',
                title: '💪 Monday Motivation',
                message: `New week, new opportunities! Let's crush those targets!`,
                priority: 'low'
            });
        }
        
        // Friday wrap-up
        if (day === 5 && hour === 17) {
            this.showNotification({
                type: 'info',
                title: '🎉 Friday Wrap-up',
                message: `Great week team! Time to review performance and plan for next week.`,
                priority: 'low'
            });
        }
    }

    showNotification(options) {
        const {
            type = 'info',
            title = 'Notification',
            message = '',
            priority = 'medium',
            persistent = false,
            duration = null
        } = options;

        // Avoid duplicate notifications
        const isDuplicate = this.notifications.some(n => 
            n.title === title && n.message === message && 
            (Date.now() - n.timestamp) < 300000 // 5 minutes
        );

        if (isDuplicate) return;

        const notification = {
            id: Date.now() + Math.random(),
            type,
            title,
            message,
            priority,
            persistent,
            timestamp: Date.now()
        };

        this.notifications.push(notification);
        this.displayNotification(notification, duration);
    }

    displayNotification(notification, duration = null) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const element = document.createElement('div');
        element.className = `notification notification-${notification.type} priority-${notification.priority}`;
        element.style.cssText = `
            background: ${this.getNotificationColor(notification.type)};
            color: white;
            padding: 1rem;
            margin-bottom: 10px;
            border-radius: 12px;
            border-left: 4px solid ${this.getAccentColor(notification.type)};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            animation: slideInRight 0.4s ease;
            pointer-events: auto;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        element.innerHTML = `
            <div class="notification-header">
                <strong>${notification.title}</strong>
                <button class="notification-close" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: auto;
                ">&times;</button>
            </div>
            <div class="notification-body" style="
                margin-top: 0.5rem;
                font-size: 0.9rem;
                line-height: 1.4;
            ">
                ${notification.message}
            </div>
            <div class="notification-time" style="
                font-size: 0.7rem;
                opacity: 0.8;
                margin-top: 0.5rem;
            ">
                ${new Date(notification.timestamp).toLocaleTimeString('ms-MY')}
            </div>
        `;

        // Add hover effects
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'translateX(-5px)';
            element.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translateX(0)';
            element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });

        // Close button
        element.querySelector('.notification-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNotification(element, notification.id);
        });

        // Click to dismiss
        element.addEventListener('click', () => {
            this.removeNotification(element, notification.id);
        });

        container.appendChild(element);

        // Auto-remove based on priority and type
        if (!notification.persistent) {
            const autoRemoveTime = duration || this.getAutoRemoveTime(notification.priority);
            setTimeout(() => {
                this.removeNotification(element, notification.id);
            }, autoRemoveTime);
        }
    }

    removeNotification(element, id) {
        if (element && element.parentNode) {
            element.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }

        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #22c55e, #16a34a)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            info: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            urgent: 'linear-gradient(135deg, #dc2626, #991b1b)',
            celebration: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            motivation: 'linear-gradient(135deg, #06b6d4, #0891b2)'
        };
        return colors[type] || colors.info;
    }

    getAccentColor(type) {
        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            urgent: '#dc2626',
            celebration: '#a855f7',
            motivation: '#06b6d4'
        };
        return colors[type] || colors.info;
    }

    getAutoRemoveTime(priority) {
        const times = {
            high: 15000,   // 15 seconds
            medium: 10000, // 10 seconds
            low: 7000      // 7 seconds
        };
        return times[priority] || 10000;
    }

    parseValue(text) {
        if (!text) return 0;
        const cleanText = text.replace(/[RM,\s]/g, '');
        return parseFloat(cleanText) || 0;
    }

    formatCurrency(amount) {
        return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    isAfternoon() {
        return new Date().getHours() >= 14; // 2 PM
    }

    isEvening() {
        return new Date().getHours() >= 17; // 5 PM
    }

    isMonthHalfway() {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return now.getDate() >= daysInMonth / 2;
    }

    // Public methods for manual notifications
    success(title, message) {
        this.showNotification({ type: 'success', title, message, priority: 'high' });
    }

    warning(title, message) {
        this.showNotification({ type: 'warning', title, message, priority: 'medium' });
    }

    error(title, message) {
        this.showNotification({ type: 'error', title, message, priority: 'high' });
    }

    info(title, message) {
        this.showNotification({ type: 'info', title, message, priority: 'low' });
    }

    celebrate(title, message) {
        this.showNotification({ type: 'celebration', title, message, priority: 'high', persistent: true });
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.notificationSystem = new NotificationSystem();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .notification-container::-webkit-scrollbar {
        width: 4px;
    }

    .notification-container::-webkit-scrollbar-track {
        background: transparent;
    }

    .notification-container::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.3);
        border-radius: 2px;
    }
`;
document.head.appendChild(style);

console.log('🔔 Notification System script loaded');