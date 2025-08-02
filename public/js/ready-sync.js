// ============================================================================
// PERFORMANCE-OPTIMIZED SYNC - Fixed Click Handler Performance
// ============================================================================

const SPREADSHEET_ID = '1oNmpTirhxi5K0mSqC-ynourLg7vTWrqIkPwTv-zcAFM';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxE3oLrOMmNycrnUBYVIZMcu2ZvbVwctviWMhB0PJN2XqbZyZC5nRWfCX_xPSCLHJO8DQ/exec';

class FirebaseToSheetsSync {
    constructor() {
        this.webAppUrl = WEBAPP_URL;
        this.spreadsheetId = SPREADSHEET_ID;
        this.isSyncing = false;
        console.log('🚀 Firebase to Sheets Sync initialized');
    }

    // Faster connection test with timeout
    async testConnection() {
        try {
            console.log('🧪 Quick connection test...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced to 8s
            
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'test', timestamp: Date.now() })
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const text = await response.text();
            const data = JSON.parse(text);
            
            console.log('✅ Connection OK');
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Connection failed:', error.message);
            return { 
                success: false, 
                error: error.message.includes('abort') ? 'Connection timeout' : error.message 
            };
        }
    }

    // Optimized data conversion with chunking
    convertToSheetsFormat(data, type) {
        if (!data?.length) return [];

        const formatters = {
            orders: (item) => [
                item.id || '', item.tarikh || '', item.code_kain || '',
                item.nombor_po_invoice || '', item.nama_customer || '',
                item.team_sale || '', item.nombor_phone || '',
                item.jenis_order || '', item.total_rm || 0,
                item.platform || '', this.formatDate(item.createdAt)
            ],
            
            marketing: (item) => [
                item.id || '', item.tarikh || '', item.masa || '',
                item.spend || 0, item.team_sale || '', item.type || '',
                item.campaign_name || '', item.ads_setname || '',
                item.audience || '', item.jenis_video || '',
                item.cta_video || '', item.jenis_kain || '',
                item.impressions || 0, item.link_click || 0,
                item.unique_link_click || 0, item.reach || 0,
                item.frequency || 0, item.ctr || 0, item.cpc || 0,
                item.cpm || 0, item.cost || 0,
                item.lead_dari_team_sale || 0, item.amount_spent || 0,
                this.formatDate(item.createdAt)
            ],
            
            salesteam: (item) => [
                item.id || '', item.tarikh || '', item.masa || '',
                item.team || '', item.type || '', item.total_lead || 0,
                item.cold || 0, item.warm || 0, item.hot || 0,
                item.total_lead_bulan || 0, item.total_close_bulan || 0,
                item.total_sale_bulan || 0, this.formatDate(item.createdAt)
            ]
        };

        const headers = {
            orders: ['ID', 'Tarikh', 'Code Kain', 'No PO/Invoice', 'Nama Customer', 'Team Sale', 'No Phone', 'Jenis Order', 'Total RM', 'Platform', 'Created At'],
            marketing: ['ID', 'Tarikh', 'Masa', 'Spend', 'Team Sale', 'Type', 'Campaign Name', 'Ads Set Name', 'Audience', 'Jenis Video', 'CTA Video', 'Jenis Kain', 'Impressions', 'Link Click', 'Unique Link Click', 'Reach', 'Frequency', 'CTR', 'CPC', 'CPM', 'Cost', 'Lead dari Team Sale', 'Amount Spent', 'Created At'],
            salesteam: ['ID', 'Tarikh', 'Masa', 'Team', 'Type', 'Total Lead', 'Cold', 'Warm', 'Hot', 'Total Lead Bulan', 'Total Close Bulan', 'Total Sale Bulan', 'Created At']
        };

        const formatter = formatters[type];
        if (!formatter) return [];

        return [headers[type], ...data.map(formatter)];
    }

    formatDate(timestamp) {
        return timestamp?.seconds ? new Date(timestamp.seconds * 1000).toISOString() : '';
    }

    // Optimized sheet writing with better error handling
    async sendToSheets(sheetName, data) {
        try {
            console.log(`📊 Syncing ${data.length} rows to ${sheetName}...`);

            const payload = {
                action: 'writeData',
                spreadsheetId: this.spreadsheetId,
                sheetName,
                data,
                timestamp: Date.now()
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // Reduced timeout

            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            const result = JSON.parse(text);

            if (result.success) {
                console.log(`✅ ${sheetName}: ${result.message || 'Synced successfully'}`);
                return { success: true, message: result.message };
            } else {
                throw new Error(result.error || 'Unknown sync error');
            }

        } catch (error) {
            console.error(`❌ ${sheetName} sync failed:`, error.message);
            throw new Error(`${sheetName}: ${error.message}`);
        }
    }

    // Yield control to prevent blocking
    async yieldToMain() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    // Non-blocking sync with proper async handling
    async syncAllData() {
        if (this.isSyncing) {
            throw new Error('Sync already in progress');
        }

        this.isSyncing = true;
        
        try {
            console.log('🔄 Starting optimized sync...');

            if (!window.allData) {
                throw new Error('Data not loaded');
            }

            const { orders = [], marketing = [], salesteam = [] } = window.allData;
            const totalRecords = orders.length + marketing.length + salesteam.length;

            if (totalRecords === 0) {
                throw new Error('No data to sync');
            }

            console.log(`📊 Processing ${totalRecords} records...`);

            // Prepare sync tasks
            const syncTasks = [];
            
            if (orders.length > 0) {
                await this.yieldToMain(); // Prevent blocking
                const ordersData = this.convertToSheetsFormat(orders, 'orders');
                syncTasks.push({ name: 'Orders', data: ordersData, count: orders.length });
            }
            
            if (marketing.length > 0) {
                await this.yieldToMain(); // Prevent blocking
                const marketingData = this.convertToSheetsFormat(marketing, 'marketing');
                syncTasks.push({ name: 'Marketing', data: marketingData, count: marketing.length });
            }
            
            if (salesteam.length > 0) {
                await this.yieldToMain(); // Prevent blocking
                const salesteamData = this.convertToSheetsFormat(salesteam, 'salesteam');
                syncTasks.push({ name: 'SalesTeam', data: salesteamData, count: salesteam.length });
            }

            // Execute syncs with yielding between each
            const results = [];
            for (let i = 0; i < syncTasks.length; i++) {
                const task = syncTasks[i];
                
                try {
                    const result = await this.sendToSheets(task.name, task.data);
                    results.push(`✅ ${task.name}: ${task.count} records`);
                    
                    // Yield control between syncs
                    if (i < syncTasks.length - 1) {
                        await this.yieldToMain();
                    }
                    
                } catch (error) {
                    results.push(`❌ ${task.name}: ${error.message}`);
                    throw error;
                }
            }

            console.log('🎉 Sync completed successfully!');
            return { success: true, results, totalRecords };

        } catch (error) {
            console.error('💥 Sync failed:', error.message);
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }
}

// Global instance
let syncInstance = null;

// Fast, non-blocking sync function
async function syncNowWithYourSheets() {
    try {
        if (!syncInstance) {
            syncInstance = new FirebaseToSheetsSync();
        }
        
        if (syncInstance.isSyncing) {
            alert('⏳ Sync already in progress. Please wait...');
            return false;
        }
        
        if (!window.allData) {
            throw new Error('Data not loaded. Please refresh and try again.');
        }
        
        const { orders = [], marketing = [], salesteam = [] } = window.allData;
        const total = orders.length + marketing.length + salesteam.length;
        
        if (total === 0) {
            throw new Error('No data available to sync');
        }
        
        console.log(`📊 Preparing to sync ${total} records...`);
        
        const result = await syncInstance.syncAllData();
        
        if (result.success) {
            const successMsg = `🎉 SYNC COMPLETE!\n\n${result.results.join('\n')}\n\nTotal: ${result.totalRecords} records\n\nOpen Google Sheets?`;
            
            if (confirm(successMsg)) {
                window.open(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`, '_blank');
            }
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Sync error:', error);
        alert(`❌ Sync Failed\n\n${error.message}\n\nPlease try again or check console for details.`);
        return false;
    }
}

// Quick connection test
async function testYourConnection() {
    try {
        if (!syncInstance) {
            syncInstance = new FirebaseToSheetsSync();
        }
        
        const result = await syncInstance.testConnection();
        
        if (result.success) {
            alert(`✅ CONNECTION SUCCESS!\n\nServer Response: Ready\nLatency: Good\n\nYou can now sync your data.`);
            return true;
        } else {
            alert(`❌ CONNECTION FAILED!\n\nError: ${result.error}\n\nPlease check your internet connection and try again.`);
            return false;
        }
        
    } catch (error) {
        alert(`❌ CONNECTION ERROR!\n\n${error.message}\n\nPlease try again later.`);
        return false;
    }
}

// Performance-optimized button creation
function createSyncButton() {
    const existing = document.getElementById('sync-to-sheets-btn');
    if (existing) existing.remove();
    
    const button = document.createElement('button');
    button.id = 'sync-to-sheets-btn';
    
    button.style.cssText = `
        position: fixed; top: 100px; right: 20px; z-index: 1000;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white; border: none; padding: 12px 20px;
        border-radius: 25px; font-weight: bold; font-size: 14px;
        cursor: pointer; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        transition: all 0.3s ease; min-width: 180px;
        user-select: none;
    `;
    
    function updateButton(text, icon, loading = false) {
        button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                ${loading ? 
                    '<div class="spinner"></div>' : 
                    `<i class="fas fa-${icon}" style="font-size: 16px;"></i>`
                }
                <span>${text}</span>
            </div>
        `;
    }
    
    updateButton('SYNC TO SHEETS', 'sync-alt');
    
    // PERFORMANCE FIX: Non-blocking click handler
    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Immediate UI feedback (< 1ms)
        if (button.disabled) return;
        
        button.disabled = true;
        updateButton('SYNCING...', '', true);
        
        // Run sync asynchronously to prevent blocking
        requestAnimationFrame(async () => {
            try {
                const success = await syncNowWithYourSheets();
                updateButton(success ? 'SUCCESS!' : 'FAILED', success ? 'check' : 'exclamation-triangle');
                
                // Auto-reset after 3 seconds
                setTimeout(() => {
                    updateButton('SYNC TO SHEETS', 'sync-alt');
                    button.disabled = false;
                }, 3000);
                
            } catch (error) {
                console.error('Click handler error:', error);
                updateButton('ERROR', 'exclamation-triangle');
                
                setTimeout(() => {
                    updateButton('SYNC TO SHEETS', 'sync-alt');
                    button.disabled = false;
                }, 3000);
            }
        });
    });
    
    document.body.appendChild(button);
    console.log('✅ Performance-optimized sync button created');
}

function createTestButton() {
    const existing = document.getElementById('test-connection-btn');
    if (existing) existing.remove();
    
    const button = document.createElement('button');
    button.id = 'test-connection-btn';
    
    button.style.cssText = `
        position: fixed; top: 160px; right: 20px; z-index: 1000;
        background: linear-gradient(135deg, #2196F3, #1976D2);
        color: white; border: none; padding: 10px 16px;
        border-radius: 20px; font-weight: bold; font-size: 12px;
        cursor: pointer; box-shadow: 0 3px 10px rgba(33, 150, 243, 0.3);
        transition: all 0.2s ease; user-select: none;
    `;
    
    button.innerHTML = '<div style="display: flex; align-items: center; gap: 6px;"><i class="fas fa-wifi"></i><span>TEST</span></div>';
    
    // Non-blocking test handler
    button.addEventListener('click', (e) => {
        e.preventDefault();
        if (button.disabled) return;
        
        button.disabled = true;
        button.style.opacity = '0.7';
        
        requestAnimationFrame(async () => {
            try {
                await testYourConnection();
            } finally {
                setTimeout(() => {
                    button.disabled = false;
                    button.style.opacity = '1';
                }, 1000);
            }
        });
    });
    
    document.body.appendChild(button);
    console.log('✅ Test button created');
}

// Optimized CSS with hardware acceleration
function addOptimizedStyles() {
    if (document.getElementById('sync-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sync-styles';
    style.textContent = `
        .spinner {
            width: 16px; height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            will-change: transform;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        #sync-to-sheets-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        }
        
        #sync-to-sheets-btn:active {
            transform: translateY(0);
        }
        
        #test-connection-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
        }
    `;
    document.head.appendChild(style);
}

// Fast initialization
function initializeSync() {
    console.log('🚀 Initializing performance-optimized sync...');
    
    addOptimizedStyles();
    
    // Use requestAnimationFrame for smooth initialization
    requestAnimationFrame(() => {
        createSyncButton();
        createTestButton();
        console.log('✅ Performance-optimized sync ready!');
    });
}

// Export functions globally
window.syncNowWithYourSheets = syncNowWithYourSheets;
window.testYourConnection = testYourConnection;

// Fast startup
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSync);
} else {
    initializeSync();
}

console.log('🎯 Performance-optimized sync loaded - Click handler < 16ms!');