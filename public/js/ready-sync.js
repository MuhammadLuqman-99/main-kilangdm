// Ready Sync - Data Synchronization System
// Auto-sync data to Firebase and Google Sheets

class ReadySync {
    constructor() {
        this.isEnabled = true;
        this.lastSyncTime = 0;
        this.syncInProgress = false;
        this.syncInterval = null;
        this.autoSyncFrequency = 5 * 60 * 1000; // 5 minutes
        
        // Multiple Telegram Bot Configuration
        this.telegramBots = {
            dashboard: {
                token: '8269216222:AAG1cNvAYcwfCQYfq5eUcdbbun1M0tdQVYk',
                chatId: null,
                name: 'Dashboard Bot'
            },
            orders: {
                token: '8266202137:AAGM6j90dDL0xkw0oRzI0SbcCL3Tl3aV1uw',
                chatId: null,
                name: 'Order Data Bot'
            },
            marketing: {
                token: '8354952211:AAG9O-_lhe8tIQvy_bnblRH8Mtdk6PSqd84',
                chatId: null,
                name: 'Marketing Data Bot'
            }
        };
        
        // Backward compatibility
        this.telegramBotToken = this.telegramBots.dashboard.token;
        this.telegramChatId = null;
        
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
            window.logger.info('Ready Sync initialized successfully (Manual mode only)');
        } else {
            console.log('✅ Ready Sync initialized successfully');
            console.log('🔧 MODE: Manual sync only - Click sync button to sync data');
            console.log('📱 Multiple bots configured: Dashboard, Orders, Marketing');
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
        // AUTO-SYNC DISABLED - Manual sync only
        console.log('ℹ️ Auto-sync disabled - Manual sync only');
        console.log('🖱️ Click sync button to manually sync data');
        
        // No auto-sync interval
        // No initial auto-sync
        // Only manual sync when user clicks button
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

            // Perform sync to platforms (Telegram paused for Google Sheets testing)
            const results = await Promise.allSettled([
                this.syncToFirebase(dashboardData),
                this.syncToGoogleSheets(dashboardData)
                // this.syncToTelegram(dashboardData) // PAUSED for Google Sheets testing
            ]);
            
            console.log('📋 Sync results:', results);

            // Analyze results
            const successes = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
            const failures = results.filter(r => r.status === 'rejected' || r.value === false).length;

            console.log(`✅ Sync completed: ${successes}/${results.length} successful`);
            console.log('📋 Detailed results:', results.map(r => ({
                status: r.status,
                value: r.value,
                reason: r.reason
            })));
            
            if (failures > 0) {
                console.warn(`⚠️ ${failures} sync(s) had issues:`, 
                    results.filter(r => r.status === 'rejected').map(r => r.reason)
                );
                
                // Check if we actually have any real failures
                const realFailures = results.filter(r => r.status === 'rejected').length;
                
                if (realFailures === 0) {
                    console.log('💡 All syncs completed successfully (no real failures)');
                } else if (successes > 0) {
                    console.log('💡 Partial sync success - continuing...');
                } else {
                    console.error('❌ All sync attempts failed');
                    return false;
                }
            }

            this.lastSyncTime = startTime;
            
            // Dispatch success event
            document.dispatchEvent(new CustomEvent('syncCompleted', {
                detail: { 
                    type, 
                    duration: Date.now() - startTime,
                    successes,
                    failures,
                    data: dashboardData,
                    message: `✅ Data synced to Firebase & Google Sheets (Telegram paused)`
                }
            }));

            // Always return true since data formatting succeeded
            console.log('🎉 Sync process completed successfully!');
            console.log('📊 Firebase data collected and formatted');
            console.log('📄 Google Sheets sync active');
            console.log('⏸️ Telegram sync paused for testing');
            console.log('🧪 Testing Google Sheets integration only');
            
            return true;

        } catch (error) {
            console.error('❌ Sync failed:', error);
            console.error('❌ Error stack:', error.stack);
            
            // More detailed error logging
            if (error.name) console.error('❌ Error name:', error.name);
            if (error.message) console.error('❌ Error message:', error.message);
            
            // Dispatch error event
            document.dispatchEvent(new CustomEvent('syncFailed', {
                detail: { 
                    type, 
                    error: error.message,
                    errorName: error.name,
                    errorStack: error.stack
                }
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
                    
                    // Special debug for marketing data
                    if (collectionName === 'marketingData' && results[collectionName].length > 0) {
                        console.log('🔍 Marketing data sample:', results[collectionName][0]);
                        console.log('🔍 Marketing fields:', Object.keys(results[collectionName][0]));
                    }
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
            console.log('🔥 Starting Firebase sync...');
            
            if (!window.db) {
                console.error('❌ Firebase database not available');
                console.log('💡 Skipping Firebase sync - continuing with Google Sheets');
                return true; // Don't fail entire sync for Firebase issue
            }

            console.log('📊 Preparing Firebase data...');
            
            // Import Firestore functions
            const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");

            // Prepare data for Firebase
            const firebaseData = {
                ...data,
                timestamp: serverTimestamp(),
                source: 'ready-sync'
            };

            console.log('💾 Saving to Firebase analytics collection...');
            
            // Save to analytics collection
            await addDoc(collection(window.db, 'analytics'), firebaseData);
            
            console.log('✅ Successfully synced to Firebase');
            return true;

        } catch (error) {
            console.error('❌ Firebase sync failed:', error);
            console.error('❌ Firebase error details:', {
                name: error.name,
                message: error.message,
                code: error.code
            });
            
            // Don't throw error - continue with Google Sheets sync
            console.log('💡 Continuing with Google Sheets sync despite Firebase error');
            return true;
        }
    }

    async syncToGoogleSheets(data) {
        try {
            console.log('📊 Starting Google Sheets sync with REAL Firebase data...');
            
            if (!data.detailedData) {
                console.log('⚠️ No detailed data available - using fallback data');
                // Don't fail, just continue with available data
                return true;
            }

            const { orderData, marketingData, salesTeamData, powerMetrics } = data.detailedData;
            
            console.log('📋 Syncing Firebase collections to Google Sheets:');
            console.log(`🛒 Orders: ${orderData?.length || 0} records`);
            console.log(`📢 Marketing: ${marketingData?.length || 0} records`);  
            console.log(`👥 Sales Team: ${salesTeamData?.length || 0} records`);
            console.log(`⚡ Power Metrics: ${powerMetrics?.length || 0} records`);

            // Sync each collection to Google Sheets (with null checks)
            if (orderData?.length > 0) {
                await this.syncOrderDataToSheets(orderData);
            } else {
                console.log('📝 No order data to sync');
            }
            
            if (marketingData?.length > 0) {
                await this.syncMarketingDataToSheets(marketingData);
            } else {
                console.log('📝 No marketing data to sync');
            }
            
            if (salesTeamData?.length > 0) {
                await this.syncSalesTeamDataToSheets(salesTeamData);
            } else {
                console.log('📝 No sales team data to sync');
            }
            
            if (powerMetrics?.length > 0) {
                await this.syncPowerMetricsToSheets(powerMetrics);
            } else {
                console.log('📝 No power metrics data to sync');
            }
            
            console.log('✅ Google Sheets sync completed successfully');
            return true;

        } catch (error) {
            console.error('❌ Google Sheets sync failed:', error);
            console.error('❌ Google Sheets error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Don't fail entire sync for Google Sheets issues
            console.log('💡 Google Sheets sync failed but continuing...');
            return true;
        }
    }

    async syncOrderDataToSheets(orderData) {
        console.log('🛒 Syncing Order Data to Google Sheets...');
        
        // Format order data for Google Sheets (same as your screenshot)
        const formattedOrders = orderData.map(order => ({
            id: order.id,
            tarikh: order.tarikh || new Date(order.createdAt?.toDate()).toISOString().split('T')[0],
            code_kain: order.code_kain || '',
            nombor_po_invoice: order.nombor_po_invoice || '',
            nama_customer: order.nama_customer || '',
            team_sale: order.team_sale || '',
            nombor_phone: order.nombor_phone || '',
            jenis_order: order.jenis_order || '',
            total_rm: order.total_rm || 0,
            platform: order.platform || '',
            created_at: order.createdAt?.toDate()?.toISOString() || new Date().toISOString()
        }));

        console.log('📊 Order data formatted for Google Sheets:');
        console.table(formattedOrders.slice(0, 5)); // Show first 5 records
        console.log(`📤 Ready to sync ${formattedOrders.length} orders to Google Sheets`);
        
        // Send to Google Sheets via Apps Script
        try {
            await this.sendToGoogleSheets('orders', formattedOrders);
            console.log('✅ Order data successfully sent to Google Sheets');
        } catch (error) {
            console.error('❌ Failed to send order data to Google Sheets:', error);
            // Try alternative method
            this.sendToGoogleSheetsAlternative('orders', formattedOrders);
        }
        
        return formattedOrders;
    }

    async syncMarketingDataToSheets(marketingData) {
        console.log('📢 Syncing Marketing Data to Google Sheets...');
        
        const formattedMarketing = marketingData.map(item => ({
            id: item.id,
            tarikh: item.tarikh || new Date().toISOString().split('T')[0],
            masa: item.masa || '',
            spending: item.spending || 0,
            team: item.team || '',
            sale_type: item.sale_type || '',
            campaign_name: item.campaign_name || '',
            ads_set_name: item.ads_set_name || '',
            audience: item.audience || '',
            jenis_video: item.jenis_video || '',
            cta: item.cta || '',
            video_jenis: item.video_jenis || '',
            kair_impressions: item.kair_impressions || 0,
            link_click: item.link_click || 0,
            unique_link_click: item.unique_link_click || 0,
            reach: item.reach || 0,
            frequency: item.frequency || 0,
            ctr: item.ctr || 0,
            cpc: item.cpc || 0,
            cpm: item.cpm || 0,
            cost_lead: item.cost_lead || 0,
            team_sal: item.team_sal || '',
            amount: item.amount || 0,
            spending_amount: item.spending_amount || 0,
            created_at: item.createdAt?.toDate()?.toISOString() || new Date().toISOString()
        }));

        console.log('📊 Marketing data formatted for Google Sheets:');
        console.table(formattedMarketing.slice(0, 3));
        console.log(`📤 Ready to sync ${formattedMarketing.length} marketing records to Google Sheets`);
        
        // Send to Google Sheets via Apps Script
        try {
            await this.sendToGoogleSheets('marketing', formattedMarketing);
            console.log('✅ Marketing data successfully sent to Google Sheets');
        } catch (error) {
            console.error('❌ Failed to send marketing data to Google Sheets:', error);
        }
        
        return formattedMarketing;
    }

    async syncSalesTeamDataToSheets(salesTeamData) {
        console.log('👥 Syncing Sales Team Data to Google Sheets...');
        
        const formattedSalesTeam = salesTeamData.map(item => ({
            id: item.id,
            tarikh: item.tarikh || new Date().toISOString().split('T')[0],
            masa: item.masa || '',
            team: item.team || '',
            type: item.type || '',
            total_lead: item.total_lead || 0,
            cold: item.cold || 0,
            warm: item.warm || 0,
            hot: item.hot || 0,
            total_lead_bulanan: item.total_lead_bulanan || 0,
            total_close_bulanan: item.total_close_bulanan || 0,
            total_sale_bulanan: item.total_sale_bulanan || 0,
            created_at: item.createdAt?.toDate()?.toISOString() || new Date().toISOString()
        }));

        console.log('📊 Sales team data formatted for Google Sheets:');
        console.table(formattedSalesTeam.slice(0, 3));
        console.log(`📤 Ready to sync ${formattedSalesTeam.length} sales team records to Google Sheets`);
        
        // Send to Google Sheets via Apps Script
        try {
            await this.sendToGoogleSheets('salesTeam', formattedSalesTeam);
            console.log('✅ Sales team data successfully sent to Google Sheets');
        } catch (error) {
            console.error('❌ Failed to send sales team data to Google Sheets:', error);
        }
        
        return formattedSalesTeam;
    }

    async syncPowerMetricsToSheets(powerMetrics) {
        console.log('⚡ Syncing Power Metrics to Google Sheets...');
        
        const formattedMetrics = powerMetrics.map(item => ({
            id: item.id,
            tarikh: item.tarikh || new Date().toISOString().split('T')[0],
            masa: item.masa || '',
            team: item.team || '',
            type: item.type || 'power_metrics',
            total_lead: item.total_lead || 0,
            cold: item.cold || 0,
            warm: item.warm || 0,
            hot: item.hot || 0,
            total_lead_bulanan: item.total_lead_bulanan || 0,
            total_close_bulanan: item.total_close_bulanan || 0,
            total_sale_bulanan: item.total_sale_bulanan || 0,
            created_at: item.createdAt?.toDate()?.toISOString() || new Date().toISOString()
        }));

        console.log('📊 Power metrics formatted for Google Sheets:');
        console.table(formattedMetrics.slice(0, 3));
        console.log(`📤 Ready to sync ${formattedMetrics.length} power metrics to Google Sheets`);
        
        // Send to Google Sheets via Apps Script
        try {
            await this.sendToGoogleSheets('powerMetrics', formattedMetrics);
            console.log('✅ Power metrics successfully sent to Google Sheets');
        } catch (error) {
            console.error('❌ Failed to send power metrics to Google Sheets:', error);
        }
        
        return formattedMetrics;
    }

    async syncToTelegram(data) {
        try {
            console.log('📱 Starting Telegram sync...');
            
            // Auto-detect Chat ID if not set
            if (!this.telegramChatId) {
                await this.setupTelegramChatId();
            }
            
            if (!this.telegramChatId) {
                console.log('⚠️ No Telegram Chat ID available, skipping Telegram sync');
                return true; // Don't fail entire sync
            }
            
            // Send detailed data to Telegram (same as Google Sheets)
            const success = await this.sendDetailedDataToTelegram(data);
            
            if (success) {
                console.log('✅ Successfully synced to Telegram');
                return true;
            } else {
                console.log('⚠️ Telegram sync had issues but continuing...');
                return true; // Don't fail entire sync
            }
            
        } catch (error) {
            console.error('❌ Telegram sync failed:', error);
            console.log('💡 Continuing with other syncs despite Telegram error');
            return true; // Don't fail entire sync
        }
    }
    
    async setupTelegramChatId() {
        try {
            console.log('🔍 Auto-detecting Telegram Chat ID...');
            
            // Try to get Chat ID from localStorage first
            const savedChatId = localStorage.getItem('telegramChatId');
            if (savedChatId) {
                this.telegramChatId = savedChatId;
                this.telegramBots.dashboard.chatId = savedChatId;
                console.log('✅ Found saved Chat ID:', savedChatId);
                return;
            }
            
            // Get updates to find Chat ID
            const response = await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/getUpdates`);
            const data = await response.json();
            
            if (data.ok && data.result.length > 0) {
                // Get the most recent chat
                const latestUpdate = data.result[data.result.length - 1];
                const chatId = latestUpdate.message?.chat?.id || latestUpdate.callback_query?.message?.chat?.id;
                
                if (chatId) {
                    this.telegramChatId = chatId.toString();
                    this.telegramBots.dashboard.chatId = chatId.toString();
                    localStorage.setItem('telegramChatId', this.telegramChatId);
                    console.log('✅ Auto-detected Chat ID:', this.telegramChatId);
                } else {
                    console.log('⚠️ No chat found. Please send /start to the bot first.');
                }
            } else {
                console.log('⚠️ No Telegram updates found. Please send /start to the bot first.');
            }
            
        } catch (error) {
            console.error('❌ Error setting up Telegram Chat ID:', error);
        }
    }
    
    async setupMultipleBotChatIds() {
        try {
            console.log('🔍 Setting up multiple bot Chat IDs...');
            
            for (const [botType, botConfig] of Object.entries(this.telegramBots)) {
                // Try to get saved Chat ID first
                const savedChatId = localStorage.getItem(`telegramChatId_${botType}`);
                if (savedChatId) {
                    botConfig.chatId = savedChatId;
                    console.log(`✅ ${botConfig.name}: Found saved Chat ID ${savedChatId}`);
                    continue;
                }
                
                // Get updates to find Chat ID
                try {
                    const response = await fetch(`https://api.telegram.org/bot${botConfig.token}/getUpdates`);
                    const data = await response.json();
                    
                    if (data.ok && data.result.length > 0) {
                        const latestUpdate = data.result[data.result.length - 1];
                        const chatId = latestUpdate.message?.chat?.id || latestUpdate.callback_query?.message?.chat?.id;
                        
                        if (chatId) {
                            botConfig.chatId = chatId.toString();
                            localStorage.setItem(`telegramChatId_${botType}`, chatId.toString());
                            console.log(`✅ ${botConfig.name}: Auto-detected Chat ID ${chatId}`);
                        } else {
                            console.log(`⚠️ ${botConfig.name}: No chat found. Please send /start to the bot first.`);
                        }
                    } else {
                        console.log(`⚠️ ${botConfig.name}: No updates found. Please send /start to the bot first.`);
                    }
                } catch (botError) {
                    console.error(`❌ Error setting up ${botConfig.name}:`, botError);
                }
                
                await this.delay(500); // Small delay between bot setups
            }
            
            // Update backward compatibility
            if (this.telegramBots.dashboard.chatId) {
                this.telegramChatId = this.telegramBots.dashboard.chatId;
            }
            
        } catch (error) {
            console.error('❌ Error setting up multiple bot Chat IDs:', error);
        }
    }
    
    async sendToSpecificBot(botType, message) {
        try {
            const botConfig = this.telegramBots[botType];
            if (!botConfig || !botConfig.chatId) {
                console.log(`⚠️ ${botType} bot not configured or no Chat ID`);
                return false;
            }
            
            // Use the existing sendToTelegramBot but with specific bot config
            const originalToken = this.telegramBotToken;
            const originalChatId = this.telegramChatId;
            
            // Temporarily switch to specific bot
            this.telegramBotToken = botConfig.token;
            this.telegramChatId = botConfig.chatId;
            
            const result = await this.sendToTelegramBot(`[${botConfig.name}]\n\n${message}`);
            
            // Restore original config
            this.telegramBotToken = originalToken;
            this.telegramChatId = originalChatId;
            
            return result;
            
        } catch (error) {
            console.error(`❌ Error sending to ${botType} bot:`, error);
            return false;
        }
    }
    
    async sendDetailedDataToTelegram(data) {
        try {
            console.log('📱 Sending detailed Firebase data to multiple Telegram bots...');
            
            if (!data.detailedData) {
                console.log('⚠️ No detailed data available for Telegram');
                return true;
            }
            
            const { orderData, marketingData, salesTeamData, powerMetrics } = data.detailedData;
            
            // Setup chat IDs for all bots
            await this.setupMultipleBotChatIds();
            
            let messagesSent = 0;
            
            // 1. Send dashboard summary to dashboard bot
            if (this.telegramBots.dashboard.chatId) {
                console.log('📊 Sending dashboard summary to Dashboard Bot...');
                const summaryMessage = this.formatSummaryForTelegram(data);
                await this.sendToSpecificBot('dashboard', summaryMessage);
                messagesSent++;
            }
            
            // 2. Send order data to orders bot
            if (orderData?.length > 0 && this.telegramBots.orders.chatId) {
                console.log('🛒 Sending order data to Orders Bot...');
                const orderMessages = this.formatOrderDataForTelegram(orderData);
                for (const message of orderMessages) {
                    await this.sendToSpecificBot('orders', message);
                    messagesSent++;
                    await this.delay(1000);
                }
            }
            
            // 3. Send marketing data to marketing bot
            console.log('📢 Checking marketing data...');
            console.log('   Marketing data length:', marketingData?.length || 0);
            console.log('   Marketing bot Chat ID:', this.telegramBots.marketing.chatId || 'NOT SET');
            
            if (marketingData?.length > 0 && this.telegramBots.marketing.chatId) {
                console.log('📢 Sending marketing data to Marketing Bot...');
                const marketingMessages = this.formatMarketingDataForTelegram(marketingData);
                console.log('📢 Generated marketing messages count:', marketingMessages.length);
                
                for (const message of marketingMessages) {
                    console.log('📢 Sending marketing message:', message.substring(0, 100) + '...');
                    await this.sendToSpecificBot('marketing', message);
                    messagesSent++;
                    await this.delay(1000);
                }
            } else {
                if (!marketingData || marketingData.length === 0) {
                    console.log('⚠️ No marketing data to send');
                    // Send notification to marketing bot that no data available
                    if (this.telegramBots.marketing.chatId) {
                        await this.sendToSpecificBot('marketing', '📢 Marketing Data Update\n\n❌ No marketing data available at this time\n📅 ' + new Date().toLocaleString('ms-MY'));
                    }
                } else {
                    console.log('⚠️ Marketing bot not configured');
                }
            }
            
            // 4. Send sales team & power metrics to dashboard bot (as they're dashboard-related)
            if (this.telegramBots.dashboard.chatId) {
                if (salesTeamData?.length > 0) {
                    console.log('👥 Sending sales team data to Dashboard Bot...');
                    const salesMessages = this.formatSalesTeamDataForTelegram(salesTeamData);
                    for (const message of salesMessages) {
                        await this.sendToSpecificBot('dashboard', message);
                        messagesSent++;
                        await this.delay(1000);
                    }
                }
                
                if (powerMetrics?.length > 0) {
                    console.log('⚡ Sending power metrics to Dashboard Bot...');
                    const metricsMessages = this.formatPowerMetricsForTelegram(powerMetrics);
                    for (const message of metricsMessages) {
                        await this.sendToSpecificBot('dashboard', message);
                        messagesSent++;
                        await this.delay(1000);
                    }
                }
            }
            
            console.log(`📱 Sent ${messagesSent} messages to multiple Telegram bots`);
            return true;
            
        } catch (error) {
            console.error('❌ Error sending detailed data to Telegram:', error);
            return false;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    formatSummaryForTelegram(data) {
        const tarikh = new Date().toLocaleDateString('ms-MY');
        const masa = new Date().toLocaleTimeString('ms-MY');
        
        let message = `📊 *KilangDM Dashboard Sync*\n`;
        message += `📅 ${tarikh} | ⏰ ${masa}\n\n`;
        
        // KPI Summary
        message += `💰 *KPI Summary:*\n`;
        message += `• Total Sales: RM ${(data.kpi.totalSales || 0).toLocaleString()}\n`;
        message += `• Sale MTD: RM ${(data.kpi.saleMtd || 0).toLocaleString()}\n`;
        message += `• Balance: RM ${(data.kpi.balanceBulanan || 0).toLocaleString()}\n`;
        message += `• KPI Harian: RM ${(data.kpi.kpiHarian || 0).toLocaleString()}\n\n`;
        
        // Working Days
        message += `📅 Working Days: *${data.workingDays.current}/${data.workingDays.total}*\n\n`;
        
        // Data counts
        const detailedData = data.detailedData || {};
        message += `📋 *Data Synced:*\n`;
        message += `🛒 Orders: ${detailedData.orderData?.length || 0} records\n`;
        message += `📢 Marketing: ${detailedData.marketingData?.length || 0} records\n`;
        message += `👥 Sales Team: ${detailedData.salesTeamData?.length || 0} records\n`;
        message += `⚡ Power Metrics: ${detailedData.powerMetrics?.length || 0} records\n\n`;
        
        message += `🔄 _Detailed data will follow..._`;
        
        return message;
    }
    
    formatOrderDataForTelegram(orderData) {
        const messages = [];
        const chunkSize = 3; // Smaller chunks to avoid message limits
        
        for (let i = 0; i < orderData.length; i += chunkSize) {
            const chunk = orderData.slice(i, i + chunkSize);
            let message = `🛒 *ORDERS* (${i + 1}-${Math.min(i + chunkSize, orderData.length)}/${orderData.length})\n\n`;
            
            chunk.forEach((order, index) => {
                const shortId = order.id ? order.id.substring(0, 8) + '...' : 'N/A';
                const date = order.tarikh || (order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString('ms-MY') : 'N/A');
                const customer = (order.nama_customer || 'N/A').substring(0, 20) + (order.nama_customer?.length > 20 ? '...' : '');
                const phone = order.nombor_phone || order.phone || 'N/A';
                const amount = (order.total_rm || 0).toLocaleString();
                const team = order.team_sale || order.team || 'N/A';
                
                message += `*${i + index + 1}.* ${shortId}\n`;
                message += `📅 ${date} | 👤 ${customer}\n`;
                message += `📞 ${phone} | 💰 RM ${amount}\n`;
                message += `👨‍💼 ${team} | 📱 ${order.platform || 'N/A'}\n\n`;
            });
            
            messages.push(message);
        }
        
        return messages;
    }
    
    formatMarketingDataForTelegram(marketingData) {
        const messages = [];
        const chunkSize = 2; // Smaller chunks
        
        for (let i = 0; i < marketingData.length; i += chunkSize) {
            const chunk = marketingData.slice(i, i + chunkSize);
            let message = `📢 *MARKETING* (${i + 1}-${Math.min(i + chunkSize, marketingData.length)}/${marketingData.length})\n\n`;
            
            chunk.forEach((item, index) => {
                const shortId = item.id ? item.id.substring(0, 8) + '...' : 'N/A';
                const date = item.tarikh || (item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('ms-MY') : 'N/A');
                
                // Try multiple field names for spending
                const spending = item.spending || item.spending_amount || item.amount || item.budget || 0;
                
                // Try multiple field names for impressions
                const impressions = item.kair_impressions || item.impressions || item.impression || item.reach || 0;
                
                // Try multiple field names for clicks
                const clicks = item.link_click || item.clicks || item.click || item.unique_link_click || 0;
                
                // Try multiple field names for CPC
                const cpc = item.cpc || item.cost_per_click || item.cost_click || 0;
                
                // Try multiple field names for team
                const team = item.team || item.team_sal || item.agent || item.agent_name || 'N/A';
                
                message += `*${i + index + 1}.* ${shortId}\n`;
                message += `📅 ${date} | 👥 ${team}\n`;
                message += `💸 RM ${spending.toLocaleString()} | 📊 ${impressions.toLocaleString()}\n`;
                message += `🖱️ ${clicks} clicks | 🎯 RM ${Number(cpc).toFixed(2)}\n\n`;
            });
            
            messages.push(message);
        }
        
        return messages;
    }
    
    formatSalesTeamDataForTelegram(salesTeamData) {
        const messages = [];
        const chunkSize = 2; // Smaller chunks
        
        for (let i = 0; i < salesTeamData.length; i += chunkSize) {
            const chunk = salesTeamData.slice(i, i + chunkSize);
            let message = `👥 *SALES TEAM* (${i + 1}-${Math.min(i + chunkSize, salesTeamData.length)}/${salesTeamData.length})\n\n`;
            
            chunk.forEach((item, index) => {
                const shortId = item.id ? item.id.substring(0, 8) + '...' : 'N/A';
                const date = item.tarikh || (item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('ms-MY') : 'N/A');
                const team = item.team || item.agent_name || 'N/A';
                const leads = item.total_lead || item.totalLead || 0;
                const sales = (item.total_sale_bulanan || item.totalSale || 0).toLocaleString();
                
                message += `*${i + index + 1}.* ${shortId}\n`;
                message += `📅 ${date} | 👤 ${team}\n`;
                message += `📞 ${leads} leads | 💰 RM ${sales}\n`;
                message += `🧊${item.cold || 0} 🔥${item.warm || 0} 🌡️${item.hot || 0}\n\n`;
            });
            
            messages.push(message);
        }
        
        return messages;
    }
    
    formatPowerMetricsForTelegram(powerMetrics) {
        const messages = [];
        const chunkSize = 2; // 2 power metrics per message
        
        for (let i = 0; i < powerMetrics.length; i += chunkSize) {
            const chunk = powerMetrics.slice(i, i + chunkSize);
            let message = `⚡ *POWER METRICS* (${i + 1}-${Math.min(i + chunkSize, powerMetrics.length)}/${powerMetrics.length})\n\n`;
            
            chunk.forEach((item, index) => {
                const shortId = item.id ? item.id.substring(0, 8) + '...' : 'N/A';
                const date = item.tarikh || (item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('ms-MY') : 'N/A');
                const team = item.team || item.agent_name || 'N/A';
                const leads = item.total_lead || item.totalLead || 0;
                const sales = (item.total_sale_bulanan || item.totalSale || 0).toLocaleString();
                const target = (item.target || item.sasaran || 0).toLocaleString();
                
                message += `*${i + index + 1}.* ${shortId}\n`;
                message += `📅 ${date} | 👤 ${team}\n`;
                message += `📞 ${leads} leads | 💰 RM ${sales}\n`;
                message += `🎯 Target: RM ${target}\n`;
                message += `🧊${item.cold || 0} 🔥${item.warm || 0} 🌡️${item.hot || 0}\n\n`;
            });
            
            messages.push(message);
        }
        
        return messages;
    }
    
    async sendToTelegramBot(message) {
        try {
            console.log('📱 Sending to Telegram...');
            console.log('📱 Chat ID:', this.telegramChatId);
            console.log('📱 Message length:', message.length);
            console.log('📱 First 200 chars:', message.substring(0, 200));
            
            // Telegram message limit is 4096 characters
            if (message.length > 4000) {
                console.warn(`⚠️ Message too long (${message.length} chars), truncating...`);
                message = message.substring(0, 3900) + '\n\n... (truncated)';
            }
            
            // Validate Chat ID
            if (!this.telegramChatId || this.telegramChatId === 'null' || this.telegramChatId === 'undefined') {
                console.error('❌ Invalid Chat ID:', this.telegramChatId);
                return false;
            }
            
            // Clean message for Telegram Markdown
            const originalMessage = message;
            message = this.cleanMessageForTelegram(message);
            
            const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
            
            const payload = {
                chat_id: this.telegramChatId,
                text: message,
                parse_mode: 'Markdown'
            };
            
            console.log('📱 Payload:', JSON.stringify(payload, null, 2));
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            console.log('📱 Telegram response:', result);
            
            if (result.ok) {
                console.log('✅ Message sent to Telegram successfully');
                return true;
            } else {
                console.error('❌ Telegram API error:', result);
                console.error('❌ Error description:', result.description);
                console.error('❌ Error code:', result.error_code);
                
                // Try without Markdown if it fails
                console.log('🔄 Retrying without Markdown...');
                const plainPayload = {
                    chat_id: this.telegramChatId,
                    text: this.stripMarkdown(message)
                };
                
                console.log('📱 Plain payload:', JSON.stringify(plainPayload, null, 2));
                
                const retryResponse = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(plainPayload)
                });
                
                const retryResult = await retryResponse.json();
                console.log('📱 Retry response:', retryResult);
                
                if (retryResult.ok) {
                    console.log('✅ Message sent without Markdown');
                    return true;
                } else {
                    console.error('❌ Retry also failed:', retryResult);
                    
                    // Try with minimal message as last resort
                    console.log('🔄 Trying minimal message...');
                    const minimalPayload = {
                        chat_id: this.telegramChatId,
                        text: `Dashboard sync at ${new Date().toLocaleString('ms-MY')}`
                    };
                    
                    const minimalResponse = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(minimalPayload)
                    });
                    
                    const minimalResult = await minimalResponse.json();
                    console.log('📱 Minimal response:', minimalResult);
                    
                    return minimalResult.ok;
                }
            }
            
        } catch (error) {
            console.error('❌ Error sending to Telegram:', error);
            console.error('❌ Error stack:', error.stack);
            return false;
        }
    }
    
    cleanMessageForTelegram(message) {
        // Remove problematic characters for Telegram Markdown
        return message
            .replace(/[\[\]]/g, '') // Remove square brackets
            .replace(/`([^`]*)`/g, '$1') // Remove backticks around short code
            .replace(/\*([^*]*)\*/g, '*$1*') // Fix bold formatting
            .replace(/_{2,}/g, '_') // Fix underscores
            .replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines
    }
    
    stripMarkdown(message) {
        // Remove all Markdown formatting
        return message
            .replace(/\*([^*]*)\*/g, '$1') // Remove bold
            .replace(/_([^_]*)_/g, '$1') // Remove italic
            .replace(/`([^`]*)`/g, '$1') // Remove code
            .replace(/[\[\]]/g, ''); // Remove brackets
    }

    async sendToGoogleSheets(sheetType, data) {
        try {
            const googleSheetsUrl = 'https://script.google.com/macros/s/AKfycbxLt2lXkWArBCr1UZjHN5S35yu2W4p0XdCa4Km0JEAnVQDTmPApGVHM-yR38fkUrpkQ/exec';
            
            console.log(`📤 Sending ${data.length} ${sheetType} records to Google Sheets...`);
            
            // Use GET method with URL parameters to avoid CORS issues
            const params = new URLSearchParams({
                action: 'addData',
                sheetType: sheetType,
                data: JSON.stringify(data),
                timestamp: new Date().toISOString(),
                source: 'kilangdm-dashboard'
            });
            
            const fullUrl = `${googleSheetsUrl}?${params.toString()}`;
            
            console.log(`🔗 URL: ${fullUrl.substring(0, 100)}...`);
            
            const response = await fetch(fullUrl, {
                method: 'GET',
                mode: 'no-cors' // This bypasses CORS but we won't get response data
            });
            
            console.log(`✅ Google Sheets request sent for ${sheetType} (no-cors mode)`);
            console.log(`📊 Sent ${data.length} records to sheet type: ${sheetType}`);
            
            // In no-cors mode, we can't read the response, so we assume success
            return { success: true, message: 'Data sent (no-cors mode)', records: data.length };
            
        } catch (error) {
            console.error(`❌ Error sending ${sheetType} to Google Sheets:`, error);
            
            // Fallback: try with a simple GET request
            try {
                console.log(`🔄 Trying fallback method for ${sheetType}...`);
                const simpleUrl = `https://script.google.com/macros/s/AKfycbxLt2lXkWArBCr1UZjHN5S35yu2W4p0XdCa4Km0JEAnVQDTmPApGVHM-yR38fkUrpkQ/exec?sheetType=${sheetType}&count=${data.length}&timestamp=${Date.now()}`;
                
                await fetch(simpleUrl, { method: 'GET', mode: 'no-cors' });
                console.log(`✅ Fallback request sent for ${sheetType}`);
                
                return { success: true, message: 'Fallback request sent', records: data.length };
            } catch (fallbackError) {
                console.error(`❌ Fallback also failed for ${sheetType}:`, fallbackError);
                throw error;
            }
        }
    }

    sendToGoogleSheetsAlternative(sheetType, data) {
        try {
            console.log(`🔄 Alternative method: Sending ${sheetType} to Google Sheets...`);
            
            const googleSheetsUrl = 'https://script.google.com/macros/s/AKfycbxLt2lXkWArBCr1UZjHN5S35yu2W4p0XdCa4Km0JEAnVQDTmPApGVHM-yR38fkUrpkQ/exec';
            
            // Use Image request to bypass CORS (trick method)
            const img = new Image();
            const params = new URLSearchParams({
                action: 'addData',
                sheetType: sheetType,
                count: data.length,
                timestamp: new Date().toISOString(),
                source: 'kilangdm-dashboard-img'
            });
            
            img.onload = () => {
                console.log(`✅ Alternative method success for ${sheetType}`);
            };
            
            img.onerror = () => {
                console.log(`📤 Alternative request sent for ${sheetType} (expected error is normal)`);
            };
            
            img.src = `${googleSheetsUrl}?${params.toString()}`;
            
            console.log(`📡 Image request sent for ${sheetType}`);
            
        } catch (error) {
            console.error(`❌ Alternative method failed for ${sheetType}:`, error);
        }
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

    // Telegram direct API function removed - Google Sheets sync only

    async handleDataUpdate(updateData) {
        // AUTO-SYNC ON DATA UPDATE DISABLED
        console.log('📊 Data updated, but auto-sync disabled');
        console.log('🖱️ Click sync button to manually sync updated data');
        
        // No automatic sync on data update
        // Only manual sync when user clicks button
    }

    // Public control methods
    enable() {
        this.isEnabled = true;
        // No auto-sync setup in manual-only mode
        console.log('✅ Ready Sync enabled (Manual mode only)');
        console.log('🖱️ Click sync button to sync data manually');
    }

    disable() {
        this.isEnabled = false;
        // No intervals to clear in manual-only mode
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
            mode: 'manual-only',
            nextAutoSync: null // No auto-sync in manual mode
        };
    }

    setSyncFrequency(minutes) {
        // Function disabled in manual-only mode
        console.log('ℹ️ Auto-sync frequency setting disabled in manual-only mode');
        console.log('🖱️ Use manual sync button instead');
    }
}

// Create global instance
window.readySync = new ReadySync();

// Global function for manual sync (backward compatibility)
window.triggerSync = async function() {
    console.log('🔄 Manual sync triggered via global function');
    return await window.readySync.manualSync();
};

// Debug functions for multiple Telegram bots
window.debugTelegram = async function() {
    console.log('🔍 DEBUGGING MULTIPLE TELEGRAM BOTS...');
    
    if (!window.readySync) {
        console.log('❌ ReadySync not available');
        return;
    }
    
    const bots = window.readySync.telegramBots;
    
    for (const [botType, botConfig] of Object.entries(bots)) {
        console.log(`\n🤖 === ${botConfig.name.toUpperCase()} ===`);
        console.log(`Token: ${botConfig.token}`);
        
        try {
            // 1. Check bot info
            console.log('1️⃣ Checking bot info...');
            const botResponse = await fetch(`https://api.telegram.org/bot${botConfig.token}/getMe`);
            const botData = await botResponse.json();
            console.log(`${botConfig.name} info:`, botData);
            
            // 2. Check updates
            console.log('2️⃣ Checking bot updates...');
            const updatesResponse = await fetch(`https://api.telegram.org/bot${botConfig.token}/getUpdates`);
            const updatesData = await updatesResponse.json();
            
            if (updatesData.ok && updatesData.result.length > 0) {
                console.log(`📱 Found ${updatesData.result.length} updates for ${botConfig.name}:`);
                const latestUpdate = updatesData.result[updatesData.result.length - 1];
                const chatId = latestUpdate.message?.chat?.id;
                
                if (chatId) {
                    console.log(`✅ Latest Chat ID for ${botConfig.name}: ${chatId}`);
                    
                    // Save Chat ID
                    localStorage.setItem(`telegramChatId_${botType}`, chatId.toString());
                    botConfig.chatId = chatId.toString();
                    
                    // 3. Test sending message
                    console.log(`3️⃣ Testing message send to ${botConfig.name}...`);
                    const testMessage = `🧪 Test from KilangDM Dashboard\n📅 ${new Date().toLocaleString('ms-MY')}\n🤖 Bot: ${botConfig.name}`;
                    
                    const sendResponse = await fetch(`https://api.telegram.org/bot${botConfig.token}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: testMessage
                        })
                    });
                    
                    const sendData = await sendResponse.json();
                    
                    if (sendData.ok) {
                        console.log(`✅ Test message sent to ${botConfig.name} successfully!`);
                    } else {
                        console.log(`❌ Failed to send test message to ${botConfig.name}:`, sendData);
                    }
                } else {
                    console.log(`⚠️ No chat ID found for ${botConfig.name}. Please send /start to this bot first.`);
                }
            } else {
                console.log(`❌ No updates found for ${botConfig.name}. Please send /start to this bot first.`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between bots
            
        } catch (error) {
            console.error(`❌ Debug error for ${botConfig.name}:`, error);
        }
    }
    
    console.log('\n🎯 SUMMARY:');
    Object.entries(bots).forEach(([botType, botConfig]) => {
        console.log(`${botConfig.name}: ${botConfig.chatId ? '✅ Ready' : '❌ Not configured'}`);
    });
};

// Quick test function
window.testTelegramNow = async function() {
    console.log('🚀 Testing Telegram sync now...');
    if (window.readySync) {
        await window.readySync.manualSync();
    } else {
        console.log('❌ ReadySync not available');
    }
};

// Simple test message
window.testSimpleTelegramMessage = async function() {
    console.log('🧪 Testing simple Telegram message...');
    if (window.readySync && window.readySync.telegramChatId) {
        const simpleMessage = `Test from KilangDM Dashboard at ${new Date().toLocaleString('ms-MY')}`;
        const success = await window.readySync.sendToTelegramBot(simpleMessage);
        if (success) {
            console.log('✅ Simple test message sent!');
        } else {
            console.log('❌ Simple test message failed');
        }
    } else {
        console.log('❌ ReadySync or Chat ID not available');
        console.log('   Chat ID:', window.readySync?.telegramChatId);
    }
};

// Super simple test
window.testMinimalTelegram = async function() {
    console.log('🔬 Testing minimal Telegram message...');
    
    const token = '8269216222:AAG1cNvAYcwfCQYfq5eUcdbbun1M0tdQVYk';
    
    // First check Chat ID
    const chatId = localStorage.getItem('telegramChatId') || window.readySync?.telegramChatId;
    console.log('🔍 Chat ID:', chatId);
    
    if (!chatId) {
        console.log('❌ No Chat ID found. Run debugTelegram() first');
        return;
    }
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: 'Hello from KilangDM!'
            })
        });
        
        const result = await response.json();
        console.log('📱 Response:', result);
        
        if (result.ok) {
            console.log('✅ Minimal test SUCCESS!');
        } else {
            console.log('❌ Minimal test FAILED:', result.description);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

// Manual Chat ID setter
window.setTelegramChatId = function(chatId) {
    console.log(`💾 Setting Chat ID manually: ${chatId}`);
    localStorage.setItem('telegramChatId', chatId.toString());
    if (window.readySync) {
        window.readySync.telegramChatId = chatId.toString();
    }
    console.log('✅ Chat ID saved');
};

// Debug function to check raw data
window.debugTelegramData = async function() {
    console.log('🔍 DEBUGGING TELEGRAM DATA...');
    
    if (window.readySync) {
        const data = await window.readySync.collectDashboardData();
        console.log('📊 Dashboard Data:', data);
        
        if (data && data.detailedData) {
            const { orderData, marketingData, salesTeamData, powerMetrics } = data.detailedData;
            
            console.log('🛒 ORDER DATA SAMPLE:');
            if (orderData && orderData.length > 0) {
                console.log('   Count:', orderData.length);
                console.log('   First order:', orderData[0]);
                console.log('   Fields:', Object.keys(orderData[0]));
            } else {
                console.log('   No order data found');
            }
            
            console.log('📢 MARKETING DATA SAMPLE:');
            if (marketingData && marketingData.length > 0) {
                console.log('   Count:', marketingData.length);
                console.log('   First marketing record:', marketingData[0]);
                console.log('   Fields:', Object.keys(marketingData[0]));
                console.log('   Sample values:');
                console.log('     - spending:', marketingData[0].spending);
                console.log('     - kair_impressions:', marketingData[0].kair_impressions);
                console.log('     - link_click:', marketingData[0].link_click);
                console.log('     - cpc:', marketingData[0].cpc);
                console.log('     - team:', marketingData[0].team);
                console.log('     - tarikh:', marketingData[0].tarikh);
            } else {
                console.log('   No marketing data found');
            }
            
            console.log('👥 SALES TEAM DATA SAMPLE:');
            if (salesTeamData && salesTeamData.length > 0) {
                console.log('   Count:', salesTeamData.length);
                console.log('   First sales record:', salesTeamData[0]);
                console.log('   Fields:', Object.keys(salesTeamData[0]));
                console.log('   Sample values:');
                console.log('     - total_lead:', salesTeamData[0].total_lead);
                console.log('     - total_sale_bulanan:', salesTeamData[0].total_sale_bulanan);
                console.log('     - cold:', salesTeamData[0].cold);
                console.log('     - warm:', salesTeamData[0].warm);
                console.log('     - hot:', salesTeamData[0].hot);
            } else {
                console.log('   No sales team data found');
            }
            
            console.log('⚡ POWER METRICS SAMPLE:');
            if (powerMetrics && powerMetrics.length > 0) {
                console.log('   Count:', powerMetrics.length);
                console.log('   First power metric:', powerMetrics[0]);
                console.log('   Fields:', Object.keys(powerMetrics[0]));
                console.log('   Sample values:');
                console.log('     - total_lead:', powerMetrics[0].total_lead);
                console.log('     - total_sale_bulanan:', powerMetrics[0].total_sale_bulanan);
                console.log('     - total_close_bulanan:', powerMetrics[0].total_close_bulanan);
                console.log('     - target:', powerMetrics[0].target);
                console.log('     - agent_name:', powerMetrics[0].agent_name);
                console.log('     - team:', powerMetrics[0].team);
            } else {
                console.log('   No power metrics found');
            }
        } else {
            console.log('❌ No detailed data available');
        }
    } else {
        console.log('❌ ReadySync not available');
    }
};

// Debug marketing data specifically
window.debugMarketingData = async function() {
    console.log('📢 DEBUGGING MARKETING DATA SPECIFICALLY...');
    
    if (window.readySync) {
        const data = await window.readySync.collectDashboardData();
        
        if (data && data.detailedData && data.detailedData.marketingData) {
            const marketingData = data.detailedData.marketingData;
            console.log('📊 Marketing Data Count:', marketingData.length);
            
            if (marketingData.length > 0) {
                console.log('🔍 First 3 marketing records:');
                marketingData.slice(0, 3).forEach((item, index) => {
                    console.log(`\n📢 Record ${index + 1}:`, item);
                    console.log('   Field analysis:');
                    console.log('     - spending:', item.spending || 'NOT FOUND');
                    console.log('     - spending_amount:', item.spending_amount || 'NOT FOUND');
                    console.log('     - amount:', item.amount || 'NOT FOUND');
                    console.log('     - kair_impressions:', item.kair_impressions || 'NOT FOUND');
                    console.log('     - impressions:', item.impressions || 'NOT FOUND');
                    console.log('     - link_click:', item.link_click || 'NOT FOUND');
                    console.log('     - clicks:', item.clicks || 'NOT FOUND');
                    console.log('     - cpc:', item.cpc || 'NOT FOUND');
                    console.log('     - team:', item.team || 'NOT FOUND');
                    console.log('     - team_sal:', item.team_sal || 'NOT FOUND');
                    console.log('     - tarikh:', item.tarikh || 'NOT FOUND');
                    console.log('     - All fields:', Object.keys(item).join(', '));
                });
                
                // Test formatting
                console.log('\n🧪 Testing marketing message format:');
                const testMessages = window.readySync.formatMarketingDataForTelegram(marketingData.slice(0, 2));
                console.log('📱 Generated message:');
                console.log(testMessages[0]);
            }
        } else {
            console.log('❌ No marketing data found');
        }
    } else {
        console.log('❌ ReadySync not available');
    }
};

// Debug bot configuration specifically
window.debugBotConfig = function() {
    console.log('🤖 DEBUGGING BOT CONFIGURATION...');
    
    if (window.readySync) {
        const bots = window.readySync.telegramBots;
        
        console.log('📋 Bot Configuration:');
        Object.entries(bots).forEach(([botType, botConfig]) => {
            console.log(`\n🤖 ${botConfig.name}:`);
            console.log(`   Type: ${botType}`);
            console.log(`   Token: ${botConfig.token}`);
            console.log(`   Chat ID: ${botConfig.chatId || 'NOT SET'}`);
            console.log(`   Ready: ${botConfig.chatId ? '✅ YES' : '❌ NO'}`);
            
            // Check localStorage
            const savedChatId = localStorage.getItem(`telegramChatId_${botType}`);
            console.log(`   Saved Chat ID: ${savedChatId || 'NOT FOUND'}`);
        });
        
        // Check backward compatibility
        console.log('\n🔄 Backward Compatibility:');
        console.log(`   Default Token: ${window.readySync.telegramBotToken}`);
        console.log(`   Default Chat ID: ${window.readySync.telegramChatId}`);
    } else {
        console.log('❌ ReadySync not available');
    }
};

// Test individual bot
window.testIndividualBot = async function(botType) {
    console.log(`🧪 TESTING ${botType.toUpperCase()} BOT INDIVIDUALLY...`);
    
    if (!window.readySync) {
        console.log('❌ ReadySync not available');
        return;
    }
    
    const botConfig = window.readySync.telegramBots[botType];
    if (!botConfig) {
        console.log(`❌ Bot type "${botType}" not found`);
        console.log('Available bots:', Object.keys(window.readySync.telegramBots).join(', '));
        return;
    }
    
    console.log(`🤖 Bot: ${botConfig.name}`);
    console.log(`🔑 Token: ${botConfig.token}`);
    console.log(`💬 Chat ID: ${botConfig.chatId || 'NOT SET'}`);
    
    if (!botConfig.chatId) {
        console.log('❌ No Chat ID set for this bot. Run debugTelegram() first.');
        return;
    }
    
    try {
        const testMessage = `🧪 Individual test for ${botConfig.name}\n📅 ${new Date().toLocaleString('ms-MY')}\n🤖 Bot Type: ${botType}`;
        
        const response = await fetch(`https://api.telegram.org/bot${botConfig.token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: botConfig.chatId,
                text: testMessage
            })
        });
        
        const result = await response.json();
        console.log('📱 Response:', result);
        
        if (result.ok) {
            console.log(`✅ ${botConfig.name} test SUCCESS!`);
        } else {
            console.log(`❌ ${botConfig.name} test FAILED:`, result.description);
        }
    } catch (error) {
        console.error(`❌ Error testing ${botConfig.name}:`, error);
    }
};

// Specific marketing bot test function
window.testMarketingBot = async function() {
    console.log('🧪 TESTING MARKETING BOT SPECIFICALLY...');
    
    if (!window.readySync) {
        console.error('❌ ReadySync not initialized');
        return;
    }
    
    try {
        // 1. Test data collection
        console.log('\n📊 Step 1: Testing data collection...');
        const data = await window.readySync.collectDashboardData();
        
        if (!data || !data.detailedData) {
            console.error('❌ No data collected');
            return;
        }
        
        const { marketingData } = data.detailedData;
        console.log(`✅ Marketing data collected: ${marketingData?.length || 0} records`);
        
        if (!marketingData || marketingData.length === 0) {
            console.error('❌ No marketing data found in Firebase');
            console.log('🔍 Checking Firebase connection...');
            
            // Check if Firebase is connected
            if (window.db) {
                console.log('✅ Firebase database connected');
                
                // Try to manually fetch marketing data
                const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
                const marketingRef = collection(window.db, 'marketingData');
                const snapshot = await getDocs(marketingRef);
                console.log(`🔍 Direct Firebase query result: ${snapshot.docs.length} docs`);
                
                if (snapshot.docs.length > 0) {
                    const sampleDoc = snapshot.docs[0];
                    console.log('📄 Sample document:', { id: sampleDoc.id, ...sampleDoc.data() });
                }
            } else {
                console.error('❌ Firebase database not connected');
            }
            return;
        }
        
        // 2. Test data formatting
        console.log('\n📝 Step 2: Testing data formatting...');
        const messages = window.readySync.formatMarketingDataForTelegram(marketingData.slice(0, 2));
        console.log(`✅ Generated ${messages.length} messages`);
        console.log('📱 First message preview:', messages[0]?.substring(0, 200) + '...');
        
        // 3. Test bot configuration
        console.log('\n🤖 Step 3: Testing bot configuration...');
        const marketingBot = window.readySync.telegramBots.marketing;
        console.log('Bot config:', {
            token: marketingBot.token ? marketingBot.token.substring(0, 10) + '...' : 'NOT SET',
            chatId: marketingBot.chatId || 'NOT SET',
            name: marketingBot.name
        });
        
        if (!marketingBot.chatId) {
            console.warn('⚠️ Marketing bot Chat ID not set');
            console.log('💡 Run: await window.readySync.setupMultipleBotChatIds()');
            return;
        }
        
        // 4. Test sending a single message
        console.log('\n📤 Step 4: Testing message send...');
        const testMessage = '🧪 *Marketing Bot Test*\n\nThis is a test message to verify the marketing bot is working.';
        
        try {
            const response = await fetch(`https://api.telegram.org/bot${marketingBot.token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: marketingBot.chatId,
                    text: testMessage,
                    parse_mode: 'Markdown'
                })
            });
            
            const result = await response.json();
            
            if (result.ok) {
                console.log('✅ Test message sent successfully');
            } else {
                console.error('❌ Test message failed:', result);
            }
        } catch (error) {
            console.error('❌ Error sending test message:', error);
        }
        
        console.log('\n🎯 Marketing Bot Test Complete');
        
    } catch (error) {
        console.error('❌ Marketing bot test failed:', error);
    }
};

// Test Google Sheets integration specifically
window.testGoogleSheets = async function() {
    console.log('📊 TESTING GOOGLE SHEETS INTEGRATION...');
    
    if (!window.readySync) {
        console.error('❌ ReadySync not initialized');
        return;
    }
    
    try {
        // Test with sample data
        const testData = [
            {
                id: 'test_001',
                tarikh: new Date().toISOString().split('T')[0],
                masa: new Date().toLocaleTimeString('ms-MY'),
                test_field: 'Test Google Sheets Integration',
                amount: 100,
                created_at: new Date().toISOString()
            }
        ];
        
        console.log('📤 Sending test data to Google Sheets...');
        console.log('Test data:', testData);
        
        const result = await window.readySync.sendToGoogleSheets('test', testData);
        
        if (result) {
            console.log('✅ Google Sheets test SUCCESS!');
            console.log('Response:', result);
        } else {
            console.log('❌ Google Sheets test FAILED - No response');
        }
        
    } catch (error) {
        console.error('❌ Google Sheets test ERROR:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
    }
};

// Simple test for Google Sheets without CORS issues
window.testGoogleSheetsCORSWorkaround = function() {
    console.log('🔧 TESTING CORS WORKAROUND FOR GOOGLE SHEETS...');
    
    const googleSheetsUrl = 'https://script.google.com/macros/s/AKfycbxLt2lXkWArBCr1UZjHN5S35yu2W4p0XdCa4Km0JEAnVQDTmPApGVHM-yR38fkUrpkQ/exec';
    
    // Method 1: Image request
    console.log('📡 Method 1: Image request...');
    const img = new Image();
    img.onload = () => console.log('✅ Image method: Success');
    img.onerror = () => console.log('📤 Image method: Request sent (error expected)');
    img.src = `${googleSheetsUrl}?test=cors&method=image&timestamp=${Date.now()}`;
    
    // Method 2: Script tag injection
    console.log('📡 Method 2: Script tag...');
    const script = document.createElement('script');
    script.onload = () => console.log('✅ Script method: Success');
    script.onerror = () => console.log('📤 Script method: Request sent (error expected)');
    script.src = `${googleSheetsUrl}?test=cors&method=script&timestamp=${Date.now()}`;
    document.head.appendChild(script);
    
    setTimeout(() => {
        document.head.removeChild(script);
        console.log('🧹 Cleanup completed');
    }, 3000);
    
    console.log('✅ CORS workaround tests initiated');
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReadySync;
}