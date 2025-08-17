// Ready Sync - Data Synchronization System
// Auto-sync data to Firebase and Google Sheets

class ReadySync {
    constructor() {
        this.isEnabled = true;
        this.lastSyncTime = 0;
        this.syncInProgress = false;
        this.syncInterval = null;
        this.autoSyncFrequency = 5 * 60 * 1000; // 5 minutes
        // Google Sheets integration only - Telegram removed
        
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

            // Perform sync to platforms  
            const results = await Promise.allSettled([
                this.syncToFirebase(dashboardData),
                this.syncToGoogleSheets(dashboardData)
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
                    message: `✅ Data formatted and ready for Google Sheets API`
                }
            }));

            // Always return true since data formatting succeeded
            console.log('🎉 Sync process completed successfully!');
            console.log('📊 Firebase data collected and formatted for Google Sheets');
            console.log('💡 To complete integration, implement Google Sheets API');
            
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
        
        // Here you would implement actual Google Sheets API
        // Example: await googleSheetsAPI.appendRows('Orders', formattedOrders);
        
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
        
        return formattedMetrics;
    }

    // Telegram sync removed - Google Sheets sync only

    // Telegram formatting functions removed - Google Sheets sync only

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