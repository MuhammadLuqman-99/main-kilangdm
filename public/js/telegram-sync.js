// Telegram Sync Integration - Data Synchronization with Telegram Bot
class TelegramDataSync {
    constructor() {
        this.bot = null;
        this.syncInterval = null;
        this.syncFrequency = 5 * 60 * 1000; // 5 minutes
        this.lastSyncTime = 0;
        this.isAutoSyncEnabled = true;
        this.chatId = '8269216222'; // Fixed Chat ID
        
        this.init();
    }

    async init() {
        // Wait for Telegram bot to be ready
        this.waitForTelegramBot();
        
        // Set up sync intervals
        this.setupAutoSync();
        
        // Listen for manual data updates
        this.setupManualTriggers();
        
        if (window.logger) {
            window.logger.info('Telegram data sync initialized');
        }
    }

    waitForTelegramBot() {
        const checkBot = () => {
            if (window.telegramBot && window.telegramBot.isEnabledCheck()) {
                this.bot = window.telegramBot;
                this.chatId = this.bot.getChatId();
                
                if (window.logger) {
                    window.logger.info('Telegram bot connected for data sync');
                }
            } else {
                setTimeout(checkBot, 1000);
            }
        };
        
        checkBot();
    }

    setupAutoSync() {
        // Sync dashboard data every 5 minutes
        this.syncInterval = setInterval(() => {
            if (this.isAutoSyncEnabled && this.bot && this.chatId) {
                this.syncDashboardData();
            }
        }, this.syncFrequency);
        
        // Initial sync after 30 seconds
        setTimeout(() => {
            if (this.bot && this.chatId) {
                this.syncDashboardData();
            }
        }, 30000);
    }

    setupManualTriggers() {
        // Listen for Firebase data changes
        document.addEventListener('dataUpdated', (event) => {
            if (this.bot && this.chatId) {
                this.handleDataUpdate(event.detail);
            }
        });

        // Listen for sales updates
        document.addEventListener('salesUpdated', (event) => {
            if (this.bot && this.chatId) {
                this.handleSalesUpdate(event.detail);
            }
        });

        // Listen for marketing updates
        document.addEventListener('marketingUpdated', (event) => {
            if (this.bot && this.chatId) {
                this.handleMarketingUpdate(event.detail);
            }
        });
    }

    async syncDashboardData() {
        try {
            const dashboardData = await this.collectDashboardData();
            
            if (dashboardData) {
                await this.sendDashboardSummary(dashboardData);
                this.lastSyncTime = Date.now();
                
                if (window.logger) {
                    window.logger.info('Dashboard data synced to Telegram');
                }
            }
        } catch (error) {
            if (window.logger) {
                window.logger.error('Failed to sync dashboard data:', error);
            }
        }
    }

    async collectDashboardData() {
        try {
            const data = {
                timestamp: new Date().toISOString(),
                kpi: {
                    totalSales: this.getElementValue('total-sales'),
                    totalLeads: this.getElementValue('total-leads-value'),
                    totalOrders: this.getElementValue('total-orders'),
                    kpiHarian: this.getElementValue('kpi-harian'),
                    saleMtd: this.getElementValue('sale-mtd'),
                    balanceBulanan: this.getElementValue('balance-bulanan'),
                    closeRate: this.getElementValue('total-close-rate')
                },
                progress: {
                    monthlyProgress: this.getProgressValue('monthly-progress-bar'),
                    mtdProgress: this.getProgressValue('mtd-progress-bar')
                },
                targets: {
                    monthlyTarget: 15000,
                    dailyTarget: this.calculateDailyTarget()
                }
            };

            return data;
        } catch (error) {
            if (window.logger) {
                window.logger.error('Failed to collect dashboard data:', error);
            }
            return null;
        }
    }

    getElementValue(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const text = element.textContent || element.innerText || '';
            // Extract numeric value
            const match = text.match(/[\d,.-]+/);
            return match ? parseFloat(match[0].replace(',', '')) || 0 : 0;
        }
        return 0;
    }

    getProgressValue(elementId) {
        const element = document.getElementById(elementId);
        if (element && element.style.width) {
            return parseFloat(element.style.width.replace('%', '')) || 0;
        }
        return 0;
    }

    calculateDailyTarget() {
        const workingDays = this.getWorkingDaysInMonth();
        return workingDays > 0 ? Math.round(15000 / workingDays) : 0;
    }

    getWorkingDaysInMonth() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let workingDays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            // Count Monday to Friday as working days
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                workingDays++;
            }
        }
        
        return workingDays;
    }

    async sendDashboardSummary(data) {
        const message = this.formatDashboardSummary(data);
        
        await this.bot.sendMessage(message, this.chatId, {
            parseMode: 'HTML',
            disableWebPagePreview: true
        });
    }

    formatDashboardSummary(data) {
        const time = new Date().toLocaleString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            hour12: true,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `📊 <b>Dashboard Summary</b>\n\n` +
               `📅 Masa: ${time}\n\n` +
               `💰 <b>Sales Performance:</b>\n` +
               `• Total Sales: RM${data.kpi.totalSales.toLocaleString()}\n` +
               `• Sale MTD: RM${data.kpi.saleMtd.toLocaleString()}\n` +
               `• KPI Harian: RM${data.kpi.kpiHarian.toLocaleString()}\n` +
               `• Balance Bulanan: RM${data.kpi.balanceBulanan.toLocaleString()}\n\n` +
               `📈 <b>Progress:</b>\n` +
               `• Monthly Progress: ${data.progress.monthlyProgress.toFixed(1)}%\n` +
               `• MTD Progress: ${data.progress.mtdProgress.toFixed(1)}%\n\n` +
               `👥 <b>Leads & Orders:</b>\n` +
               `• Total Leads: ${data.kpi.totalLeads}\n` +
               `• Total Orders: ${data.kpi.totalOrders}\n` +
               `• Close Rate: ${data.kpi.closeRate}%\n\n` +
               `🎯 <b>Targets:</b>\n` +
               `• Monthly Target: RM${data.targets.monthlyTarget.toLocaleString()}\n` +
               `• Daily Target: RM${data.targets.dailyTarget.toLocaleString()}\n\n` +
               `🔄 Auto-sync active`;
    }

    async handleDataUpdate(data) {
        if (!this.shouldSendUpdate('dataUpdate')) return;

        const message = `📊 <b>Data Update</b>\n\n` +
                       `📅 Masa: ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour12: true })}\n` +
                       `📝 Type: ${data.type || 'General'}\n` +
                       `📊 Data: ${JSON.stringify(data.values || {}, null, 2)}`;

        await this.bot.sendMessage(message, this.chatId);
    }

    async handleSalesUpdate(data) {
        if (!this.shouldSendUpdate('salesUpdate')) return;

        await this.bot.sendDashboardNotification({
            type: 'new_order',
            payload: {
                orderId: data.orderId || 'N/A',
                amount: data.amount || 0,
                customer: data.customer || 'N/A',
                product: data.product || 'N/A',
                agent: data.agent || 'N/A'
            },
            timestamp: new Date()
        }, this.chatId);
    }

    async handleMarketingUpdate(data) {
        if (!this.shouldSendUpdate('marketingUpdate')) return;

        await this.bot.sendDashboardNotification({
            type: 'marketing_update',
            payload: {
                campaign: data.campaign || 'N/A',
                cost: data.cost || 0,
                roi: data.roi || 0,
                leads: data.leads || 0
            },
            timestamp: new Date()
        }, this.chatId);
    }

    shouldSendUpdate(type) {
        const now = Date.now();
        const lastUpdateKey = `lastUpdate_${type}`;
        const lastUpdate = this[lastUpdateKey] || 0;
        
        // Throttle updates - minimum 30 seconds between same type updates
        if (now - lastUpdate < 30000) {
            return false;
        }
        
        this[lastUpdateKey] = now;
        return true;
    }

    // Public methods for manual control
    async sendManualUpdate() {
        if (this.bot && this.chatId) {
            await this.syncDashboardData();
            return true;
        }
        return false;
    }

    setChatId(chatId) {
        this.chatId = chatId;
        if (this.bot) {
            this.bot.setChatId(chatId);
        }
        localStorage.setItem('telegram_sync_chat_id', chatId);
    }

    setAutoSync(enabled) {
        this.isAutoSyncEnabled = enabled;
        localStorage.setItem('telegram_auto_sync', enabled.toString());
        
        if (!enabled && this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        } else if (enabled && !this.syncInterval) {
            this.setupAutoSync();
        }
    }

    setSyncFrequency(minutes) {
        this.syncFrequency = minutes * 60 * 1000;
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.setupAutoSync();
        }
    }

    // Send daily summary
    async sendDailySummary() {
        if (!this.bot || !this.chatId) return;

        const data = await this.collectDashboardData();
        if (data) {
            const message = this.formatDailySummary(data);
            await this.bot.sendMessage(message, this.chatId, {
                parseMode: 'HTML'
            });
        }
    }

    formatDailySummary(data) {
        const today = new Date().toLocaleDateString('en-MY');
        
        return `🌅 <b>Daily Summary - ${today}</b>\n\n` +
               `💰 Total Sales Hari Ini: RM${data.kpi.totalSales.toLocaleString()}\n` +
               `📊 Progress Bulanan: ${data.progress.monthlyProgress.toFixed(1)}%\n` +
               `🎯 Target Harian: RM${data.targets.dailyTarget.toLocaleString()}\n` +
               `👥 Leads Hari Ini: ${data.kpi.totalLeads}\n` +
               `🛒 Orders Hari Ini: ${data.kpi.totalOrders}\n` +
               `📈 Close Rate: ${data.kpi.closeRate}%\n\n` +
               `Selamat malam! 🌙`;
    }

    // Cleanup
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Remove event listeners
        document.removeEventListener('dataUpdated', this.handleDataUpdate);
        document.removeEventListener('salesUpdated', this.handleSalesUpdate);
        document.removeEventListener('marketingUpdated', this.handleMarketingUpdate);
    }
}

// Create global instance
window.telegramDataSync = new TelegramDataSync();

// Schedule daily summary at 8:30 PM
function scheduleDailySummary() {
    const now = new Date();
    const target = new Date();
    target.setHours(20, 30, 0, 0); // 8:30 PM
    
    // If it's already past 8:30 PM today, schedule for tomorrow
    if (now > target) {
        target.setDate(target.getDate() + 1);
    }
    
    const timeUntilTarget = target.getTime() - now.getTime();
    
    setTimeout(() => {
        if (window.telegramDataSync) {
            window.telegramDataSync.sendDailySummary();
        }
        
        // Schedule next day
        setInterval(() => {
            if (window.telegramDataSync) {
                window.telegramDataSync.sendDailySummary();
            }
        }, 24 * 60 * 60 * 1000); // 24 hours
        
    }, timeUntilTarget);
}

// Initialize daily summary scheduler
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(scheduleDailySummary, 5000); // Start after 5 seconds
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramDataSync;
}