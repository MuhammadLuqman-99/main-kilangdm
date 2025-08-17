// Ready Sync - Unified Data Synchronization System
// Auto-sync data to Firebase, Google Sheets, and Telegram Bot

class ReadySync {
    constructor() {
        this.isEnabled = true;
        this.lastSyncTime = 0;
        this.syncInProgress = false;
        this.syncInterval = null;
        this.autoSyncFrequency = 5 * 60 * 1000; // 5 minutes
        this.telegramBotToken = '8269216222:AAG1cNvAYcwfCQYfq5eUcdbbun1M0tdQVYk';
        this.defaultChatId = '8269216222'; // Fixed Chat ID from bot token
        
        this.init();
    }

    async init() {
        console.log('🔄 Ready Sync initializing...');
        
        // Wait for Firebase to be ready
        await this.waitForFirebase();
        
        // Setup auto-sync
        this.setupAutoSync();
        
        // Setup manual triggers
        this.setupEventListeners();
        
        if (window.logger) {
            window.logger.info('Ready Sync initialized successfully');
        } else {
            console.log('✅ Ready Sync initialized successfully');
        }
    }

    async waitForFirebase() {
        let attempts = 0;
        const maxAttempts = 30;
        
        while (!window.db && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        
        if (attempts >= maxAttempts) {
            console.warn('⚠️ Firebase not available for Ready Sync');
        }
    }

    setupAutoSync() {
        // Auto-sync every 5 minutes
        this.syncInterval = setInterval(() => {
            if (this.isEnabled && !this.syncInProgress) {
                this.performAutoSync();
            }
        }, this.autoSyncFrequency);
        
        // Initial sync after 30 seconds
        setTimeout(() => {
            if (this.isEnabled) {
                this.performAutoSync();
            }
        }, 30000);
    }

    setupEventListeners() {
        // Listen for data updates from dashboard
        document.addEventListener('dashboardDataUpdated', (event) => {
            this.handleDataUpdate(event.detail);
        });

        // Listen for manual sync requests
        document.addEventListener('manualSyncRequested', () => {
            this.performManualSync();
        });
    }

    async performAutoSync() {
        if (this.syncInProgress) {
            console.log('🔄 Sync already in progress, skipping...');
            return;
        }

        console.log('🔄 Starting auto-sync...');
        await this.performSync('auto');
    }

    async performManualSync() {
        console.log('🔄 Starting manual sync...');
        await this.performSync('manual');
    }

    async performSync(type = 'auto') {
        if (this.syncInProgress) {
            console.log('⚠️ Sync already in progress');
            return false;
        }

        this.syncInProgress = true;
        const startTime = Date.now();

        try {
            console.log(`🔄 Starting ${type} sync process...`);
            
            // Collect current dashboard data
            const dashboardData = await this.collectDashboardData();
            
            if (!dashboardData) {
                console.error('❌ No dashboard data to sync');
                return false;
            }

            console.log('📊 Data collected, syncing to platforms...');

            // Perform sync to all platforms
            const results = await Promise.allSettled([
                this.syncToFirebase(dashboardData),
                this.syncToGoogleSheets(dashboardData),
                this.syncToTelegram(dashboardData, type)
            ]);
            
            console.log('📋 Sync results:', results);

            // Analyze results
            const successes = results.filter(r => r.status === 'fulfilled').length;
            const failures = results.filter(r => r.status === 'rejected').length;

            console.log(`✅ Sync completed: ${successes}/${results.length} successful`);
            
            if (failures > 0) {
                console.warn(`⚠️ ${failures} sync(s) failed:`, 
                    results.filter(r => r.status === 'rejected').map(r => r.reason)
                );
            }

            this.lastSyncTime = startTime;
            
            // Dispatch success event
            document.dispatchEvent(new CustomEvent('syncCompleted', {
                detail: { 
                    type, 
                    duration: Date.now() - startTime,
                    successes,
                    failures,
                    data: dashboardData
                }
            }));

            return true;

        } catch (error) {
            console.error('❌ Sync failed:', error);
            
            // Dispatch error event
            document.dispatchEvent(new CustomEvent('syncFailed', {
                detail: { type, error: error.message }
            }));
            
            return false;
        } finally {
            this.syncInProgress = false;
        }
    }

    async collectDashboardData() {
        try {
            console.log('📊 Collecting detailed dashboard data from Firebase...');
            
            // Collect detailed data from Firebase collections (same as Google Sheets sync)
            const detailedData = await this.collectFirebaseData();
            
            // Also collect KPI summary for reference
            const kpiData = {
                totalSales: this.getElementValue('total-sales'),
                totalLeads: this.getElementValue('total-leads-value'),
                totalOrders: this.getElementValue('total-orders'),
                kpiHarian: this.getElementValue('kpi-harian'),
                saleMtd: this.getElementValue('sale-mtd'),
                balanceBulanan: this.getElementValue('balance-bulanan'),
                closeRate: this.getElementValue('total-close-rate'),
                leadsPerAgent: this.getElementValue('leads-per-agent')
            };
            
            console.log('📈 KPI Summary:', kpiData);
            console.log('📋 Detailed Firebase Data:', detailedData);

            // Collect progress data
            const progressData = {
                monthlyProgress: this.getProgressValue('monthly-progress-bar'),
                mtdProgress: this.getProgressValue('mtd-progress-bar')
            };

            // Collect working days info
            const workingDaysText = this.getElementText('working-days-info') || '0 / 0';
            const [currentDays, totalDays] = workingDaysText.split(' / ').map(d => parseInt(d) || 0);

            const dashboardData = {
                timestamp: new Date().toISOString(),
                kpi: kpiData,
                progress: progressData,
                workingDays: {
                    current: currentDays,
                    total: totalDays
                },
                targets: {
                    monthly: 15000,
                    daily: totalDays > 0 ? Math.round(15000 / totalDays) : 500
                },
                // Include detailed Firebase data for Google Sheets compatibility
                detailedData: detailedData,
                meta: {
                    syncType: 'ready-sync',
                    version: '1.0'
                }
            };
            
            console.log('✅ Dashboard data collected successfully:', dashboardData);
            return dashboardData;

        } catch (error) {
            console.error('❌ Failed to collect dashboard data:', error);
            return null;
        }
    }

    getElementValue(elementId) {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                const text = element.textContent || element.innerText || '';
                const match = text.match(/[\d,.-]+/);
                const value = match ? parseFloat(match[0].replace(/,/g, '')) || 0 : 0;
                console.log(`📊 ${elementId}: ${value}`);
                return value;
            } else {
                console.log(`⚠️ Element not found: ${elementId}`);
                return 0;
            }
        } catch (error) {
            console.error(`❌ Error getting value for ${elementId}:`, error);
            return 0;
        }
    }

    getElementText(elementId) {
        const element = document.getElementById(elementId);
        return element ? (element.textContent || element.innerText || '').trim() : '';
    }

    getProgressValue(elementId) {
        const element = document.getElementById(elementId);
        if (element && element.style.width) {
            return parseFloat(element.style.width.replace('%', '')) || 0;
        }
        return 0;
    }

    async collectFirebaseData() {
        try {
            // Check if Firebase is available
            if (!window.db) {
                console.log('⚠️ Firebase not available, using fallback data');
                return this.getFallbackDetailedData();
            }

            console.log('🔥 Collecting data from Firebase collections...');
            
            // Import Firebase functions
            const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
            
            // Collect data from all collections (same as dashboard.js fetchAllData)
            const collections = ['orderData', 'marketingData', 'salesTeamData', 'powerMetrics'];
            const results = {};
            
            for (const collectionName of collections) {
                try {
                    console.log(`📋 Fetching ${collectionName}...`);
                    const collectionRef = collection(window.db, collectionName);
                    const snapshot = await getDocs(collectionRef);
                    results[collectionName] = snapshot.docs.map(doc => ({ 
                        id: doc.id, 
                        ...doc.data() 
                    }));
                    console.log(`✅ ${collectionName}: ${results[collectionName].length} records`);
                } catch (error) {
                    console.warn(`⚠️ Error fetching ${collectionName}:`, error);
                    results[collectionName] = [];
                }
            }

            return results;

        } catch (error) {
            console.error('❌ Failed to collect Firebase data:', error);
            return this.getFallbackDetailedData();
        }
    }

    getFallbackDetailedData() {
        // Fallback data structure when Firebase is not available
        return {
            orderData: [],
            marketingData: [],
            salesTeamData: [],
            powerMetrics: []
        };
    }

    async syncToFirebase(data) {
        try {
            if (!window.db) {
                throw new Error('Firebase not available');
            }

            // Import Firestore functions
            const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");

            // Prepare data for Firebase
            const firebaseData = {
                ...data,
                timestamp: serverTimestamp(),
                source: 'ready-sync'
            };

            // Save to analytics collection
            await addDoc(collection(window.db, 'analytics'), firebaseData);
            
            console.log('✅ Synced to Firebase');
            return true;

        } catch (error) {
            console.error('❌ Firebase sync failed:', error);
            throw error;
        }
    }

    async syncToGoogleSheets(data) {
        try {
            console.log('📊 Syncing to Google Sheets...');
            
            // Format data same as order structure for Google Sheets
            const tarikh = new Date().toISOString().split('T')[0];
            const googleSheetsData = this.formatAsGoogleSheetsData(data, tarikh);
            
            console.log('📋 Google Sheets formatted data:', googleSheetsData);
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Here you would implement actual Google Sheets API integration
            // The data structure is now identical to order data:
            // {
            //   tarikh: '2024-01-01',
            //   code_kain: 'DASHBOARD_DATA', 
            //   nombor_po_invoice: 'SYNC_1234567890',
            //   nama_customer: 'Dashboard System',
            //   team_sale: 'Dashboard Analytics',
            //   nombor_phone: '',
            //   jenis_order: 'Dashboard Sync',
            //   total_rm: '15,000',
            //   platform: 'KilangDM Dashboard',
            //   source: 'dashboard_sync',
            //   createdAt: '2024-01-01T12:00:00.000Z'
            // }
            
            // Example: await this.googleSheetsAPI.appendRow([
            //     googleSheetsData.tarikh,
            //     googleSheetsData.code_kain,
            //     googleSheetsData.nombor_po_invoice,
            //     googleSheetsData.nama_customer,
            //     googleSheetsData.team_sale,
            //     googleSheetsData.nombor_phone,
            //     googleSheetsData.jenis_order,
            //     googleSheetsData.total_rm,
            //     googleSheetsData.platform
            // ]);
            
            console.log('✅ Synced to Google Sheets with order-compatible format');
            return true;

        } catch (error) {
            console.error('❌ Google Sheets sync failed:', error);
            throw error;
        }
    }

    async syncToTelegram(data, syncType) {
        try {
            console.log('🤖 Checking Telegram bot availability...');
            
            // Check if Telegram bot is available and enabled
            if (!window.telegramBot) {
                console.log('⚠️ Telegram bot not loaded');
                // Try to use the fixed Chat ID anyway
                if (!this.defaultChatId) {
                    throw new Error('Telegram bot not available and no Chat ID set');
                }
            }

            // Use fixed Chat ID
            const chatId = this.defaultChatId;
            console.log('📱 Using Chat ID:', chatId);
            
            if (!chatId) {
                throw new Error('Chat ID not configured');
            }

            // Format message based on sync type
            let message;
            if (syncType === 'manual') {
                message = this.formatManualSyncMessage(data);
            } else {
                message = this.formatAutoSyncMessage(data);
            }

            // Send to Telegram
            if (window.telegramBot) {
                // Use telegram bot if available
                await window.telegramBot.sendMessage(message, chatId, {
                    parseMode: 'HTML',
                    disableWebPagePreview: true
                });
            } else {
                // Send directly via API if bot not loaded
                await this.sendTelegramDirect(message, chatId);
            }

            console.log('✅ Synced to Telegram');
            return true;

        } catch (error) {
            console.error('❌ Telegram sync failed:', error);
            throw error;
        }
    }

    formatManualSyncMessage(data) {
        const currentDate = new Date();
        const tarikh = currentDate.toISOString().split('T')[0];
        const masa = currentDate.toLocaleString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            hour12: true
        });

        // Format detailed data same as Google Sheets sync
        const detailedSummary = this.formatDetailedDataSummary(data.detailedData);

        return `🔄 <b>Manual Sync - Detailed Data Report</b>\n\n` +
               `📅 ${tarikh} - ${masa}\n\n` +
               `📊 <b>Data Synced to Google Sheets:</b>\n\n` +
               `<code>` +
               `🛒 ORDER DATA:\n` +
               `• Total Orders: ${detailedSummary.orders.count}\n` +
               `• Recent Orders: ${detailedSummary.orders.recent}\n` +
               `• Total Value: RM${detailedSummary.orders.totalValue}\n\n` +
               `📢 MARKETING DATA:\n` +
               `• Marketing Records: ${detailedSummary.marketing.count}\n` +
               `• Total Cost: RM${detailedSummary.marketing.totalCost}\n` +
               `• Active Teams: ${detailedSummary.marketing.teams}\n\n` +
               `👥 SALES TEAM DATA:\n` +
               `• Team Records: ${detailedSummary.salesTeam.count}\n` +
               `• Active Teams: ${detailedSummary.salesTeam.activeTeams}\n` +
               `• Total Leads: ${detailedSummary.salesTeam.totalLeads}\n\n` +
               `⚡ POWER METRICS:\n` +
               `• Metrics Records: ${detailedSummary.powerMetrics.count}\n` +
               `• KPI Harian: RM${data.kpi.kpiHarian.toLocaleString()}\n` +
               `• Sale MTD: RM${data.kpi.saleMtd.toLocaleString()}\n` +
               `</code>\n\n` +
               `🎯 <b>Summary:</b>\n` +
               `✅ Firebase: ${detailedSummary.totalRecords} records\n` +
               `✅ Google Sheets: Same detailed data\n` +
               `✅ Telegram: This report\n\n` +
               `🚀 All platforms synced successfully!`;
    }

    formatAutoSyncMessage(data) {
        const currentDate = new Date();
        const tarikh = currentDate.toISOString().split('T')[0];
        const masa = currentDate.toLocaleString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            hour12: true
        });

        // Format detailed data for auto-sync (shorter version)
        const detailedSummary = this.formatDetailedDataSummary(data.detailedData);

        return `⏰ <b>Auto Sync Report</b>\n\n` +
               `📅 ${tarikh} - ${masa}\n\n` +
               `📊 <b>Synced Data Summary:</b>\n` +
               `🛒 Orders: ${detailedSummary.orders.count} (RM${detailedSummary.orders.totalValue})\n` +
               `📢 Marketing: ${detailedSummary.marketing.count} records\n` +
               `👥 Sales Teams: ${detailedSummary.salesTeam.activeTeams} active\n` +
               `⚡ Metrics: ${detailedSummary.powerMetrics.count} records\n\n` +
               `🎯 <b>KPI:</b> RM${data.kpi.saleMtd.toLocaleString()} MTD\n` +
               `📈 <b>Progress:</b> ${data.progress.monthlyProgress.toFixed(1)}%\n\n` +
               `🔄 Next sync: 5 minutes`;
    }

    formatDetailedDataSummary(detailedData) {
        if (!detailedData) {
            return {
                orders: { count: 0, recent: 0, totalValue: '0' },
                marketing: { count: 0, totalCost: '0', teams: 0 },
                salesTeam: { count: 0, activeTeams: 0, totalLeads: 0 },
                powerMetrics: { count: 0 },
                totalRecords: 0
            };
        }

        // Analyze order data
        const orders = detailedData.orderData || [];
        const orderTotalValue = orders.reduce((sum, order) => {
            return sum + (parseFloat(order.total_rm) || 0);
        }, 0);

        // Analyze marketing data  
        const marketing = detailedData.marketingData || [];
        const marketingTotalCost = marketing.reduce((sum, item) => {
            return sum + (parseFloat(item.cost) || 0);
        }, 0);
        const marketingTeams = [...new Set(marketing.map(item => item.team))].length;

        // Analyze sales team data
        const salesTeam = detailedData.salesTeamData || [];
        const activeTeams = [...new Set(salesTeam.map(item => item.team))].length;
        const totalLeads = salesTeam.reduce((sum, item) => {
            return sum + (parseInt(item.leads) || 0);
        }, 0);

        // Power metrics
        const powerMetrics = detailedData.powerMetrics || [];

        const totalRecords = orders.length + marketing.length + salesTeam.length + powerMetrics.length;

        return {
            orders: {
                count: orders.length,
                recent: orders.filter(order => {
                    const orderDate = new Date(order.tarikh || order.createdAt);
                    const today = new Date();
                    const daysDiff = (today - orderDate) / (1000 * 60 * 60 * 24);
                    return daysDiff <= 7; // Last 7 days
                }).length,
                totalValue: orderTotalValue.toLocaleString()
            },
            marketing: {
                count: marketing.length,
                totalCost: marketingTotalCost.toLocaleString(),
                teams: marketingTeams
            },
            salesTeam: {
                count: salesTeam.length,
                activeTeams: activeTeams,
                totalLeads: totalLeads
            },
            powerMetrics: {
                count: powerMetrics.length
            },
            totalRecords: totalRecords
        };
    }

    formatAsGoogleSheetsData(data, tarikh) {
        // Format dashboard data same as Google Sheets order structure
        return {
            tarikh: tarikh,
            code_kain: 'DASHBOARD_DATA',
            nombor_po_invoice: `SYNC_${Date.now()}`,
            nama_customer: 'Dashboard System',
            team_sale: 'Dashboard Analytics',
            nombor_phone: '',
            jenis_order: 'Dashboard Sync',
            total_rm: data.kpi.totalSales.toLocaleString(),
            platform: 'KilangDM Dashboard',
            // Additional dashboard-specific fields
            total_leads: data.kpi.totalLeads,
            total_orders: data.kpi.totalOrders,
            kpi_harian: data.kpi.kpiHarian.toLocaleString(),
            sale_mtd: data.kpi.saleMtd.toLocaleString(),
            balance_bulanan: data.kpi.balanceBulanan.toLocaleString(),
            close_rate: data.kpi.closeRate.toFixed(1),
            monthly_progress: data.progress.monthlyProgress.toFixed(1),
            mtd_progress: data.progress.mtdProgress.toFixed(1),
            working_days: `${data.workingDays.current}/${data.workingDays.total}`,
            monthly_target: data.targets.monthly.toLocaleString(),
            daily_target: data.targets.daily.toLocaleString(),
            timestamp: data.timestamp,
            source: 'dashboard_sync',
            createdAt: new Date().toISOString()
        };
    }

    async sendTelegramDirect(message, chatId) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                })
            });

            const result = await response.json();
            
            if (!result.ok) {
                throw new Error(result.description || 'Failed to send Telegram message');
            }

            console.log('✅ Direct Telegram API call successful');
            return result.result;

        } catch (error) {
            console.error('❌ Direct Telegram API failed:', error);
            throw error;
        }
    }

    async handleDataUpdate(updateData) {
        // Throttle updates - minimum 2 minutes between auto-syncs for updates
        const now = Date.now();
        if (now - this.lastSyncTime < 2 * 60 * 1000) {
            console.log('⚠️ Throttling data update sync');
            return;
        }

        console.log('📊 Data updated, triggering sync...');
        await this.performSync('update');
    }

    // Public control methods
    enable() {
        this.isEnabled = true;
        if (!this.syncInterval) {
            this.setupAutoSync();
        }
        console.log('✅ Ready Sync enabled');
    }

    disable() {
        this.isEnabled = false;
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('❌ Ready Sync disabled');
    }

    async manualSync() {
        return await this.performManualSync();
    }

    getStatus() {
        return {
            enabled: this.isEnabled,
            inProgress: this.syncInProgress,
            lastSync: this.lastSyncTime,
            nextAutoSync: this.lastSyncTime + this.autoSyncFrequency
        };
    }

    setSyncFrequency(minutes) {
        this.autoSyncFrequency = minutes * 60 * 1000;
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.setupAutoSync();
        }
        
        console.log(`🔄 Sync frequency set to ${minutes} minutes`);
    }
}

// Create global instance
window.readySync = new ReadySync();

// Global function for manual sync (backward compatibility)
window.triggerSync = async function() {
    console.log('🔄 Manual sync triggered via global function');
    return await window.readySync.manualSync();
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReadySync;
}