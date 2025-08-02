// ============================================================================
// PERFORMANCE-OPTIMIZED SYNC - Reduce Click Handler Time
// ============================================================================

const SPREADSHEET_ID = '1oNmpTirhxi5K0mSqC-ynourLg7vTWrqIkPwTv-zcAFM';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxdSntyErC2cJq0NGqz07vdczlp77-F9FV12SbswBWJkjgwpdGJPys3zxKhSp8hYXHGMg/exec';

class FirebaseToSheetsSync {
    constructor() {
        this.webAppUrl = WEBAPP_URL;
        this.spreadsheetId = SPREADSHEET_ID;
        console.log('🚀 Firebase to Sheets Sync initialized');
    }

    // Faster connection test
    async testConnection() {
        try {
            console.log('🧪 Quick connection test...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
            
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                signal: controller.signal,
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
                error: error.message.includes('abort') ? 'Timeout' : error.message 
            };
        }
    }

    // Optimized data conversion
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

    // Faster sheet writing
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
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                signal: controller.signal,
                body: JSON.stringify(payload)
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const text = await response.text();
            const result = JSON.parse(text);

            if (result.success) {
                console.log(`✅ ${sheetName}: ${result.message || 'Synced'}`);
                return true;
            } else {
                throw new Error(result.error || 'Sync failed');
            }

        } catch (error) {
            console.error(`❌ ${sheetName} sync failed:`, error.message);
            throw error;
        }
    }

    // Optimized sync with parallel processing
    async syncAllData() {
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

            console.log(`📊 Syncing ${totalRecords} records...`);

            // Prepare all data first (fast operation)
            const syncTasks = [];
            
            if (orders.length > 0) {
                const ordersData = this.convertToSheetsFormat(orders, 'orders');
                syncTasks.push({ name: 'Orders', data: ordersData, count: orders.length });
            }
            
            if (marketing.length > 0) {
                const marketingData = this.convertToSheetsFormat(marketing, 'marketing');
                syncTasks.push({ name: 'Marketing', data: marketingData, count: marketing.length });
            }
            
            if (salesteam.length > 0) {
                const salesteamData = this.convertToSheetsFormat(salesteam, 'salesteam');
                syncTasks.push({ name: 'SalesTeam', data: salesteamData, count: salesteam.length });
            }

            // Execute syncs sequentially (Google Sheets limitation)
            const results = [];
            for (const task of syncTasks) {
                try {
                    await this.sendToSheets(task.name, task.data);
                    results.push(`✅ ${task.name}: ${task.count} records`);
                } catch (error) {
                    results.push(`❌ ${task.name}: Failed`);
                    throw error;
                }
            }

            console.log('🎉 Sync completed!');
            return { success: true, results };

        } catch (error) {
            console.error('💥 Sync failed:', error);
            throw error;
        }
    }
}

// Global instance
let syncInstance = null;

// Optimized sync function with async handling
async function syncNowWithYourSheets() {
    try {
        if (!syncInstance) {
            syncInstance = new FirebaseToSheetsSync();
        }
        
        if (!window.allData) {
            throw new Error('Data not loaded. Please wait...');
        }
        
        const { orders = [], marketing = [], salesteam = [] } = window.allData;
        const total = orders.length + marketing.length + salesteam.length;
        
        if (total === 0) {
            throw new Error('No data to sync');
        }
        
        console.log(`📊 Starting sync of ${total} records...`);
        
        // Show immediate feedback
        const confirmMsg = `Ready to sync ${total} records?\n\n• Orders: ${orders.length}\n• Marketing: ${marketing.length}\n• Sales Team: ${salesteam.length}`;
        
        if (!confirm(confirmMsg)) {
            return false;
        }
        
        const result = await syncInstance.syncAllData();
        
        if (result.success) {
            const successMsg = `🎉 SYNC SUCCESS!\n\n${result.results.join('\n')}\n\nOpen Google Sheets?`;
            
            if (confirm(successMsg)) {
                window.open(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`, '_blank');
            }
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Sync error:', error);
        alert(`❌ Sync failed: ${error.message}`);
        return false;
    }
}

// Quick test function
async function testYourConnection() {
    try {
        if (!syncInstance) {
            syncInstance = new FirebaseToSheetsSync();
        }
        
        const result = await syncInstance.testConnection();
        
        if (result.success) {
            alert(`✅ CONNECTION OK!\n\nResponse: ${JSON.stringify(result.data, null, 2)}`);
            return true;
        } else {
            alert(`❌ CONNECTION FAILED!\n\nError: ${result.error}`);
            return false;
        }
        
    } catch (error) {
        alert(`❌ TEST ERROR: ${error.message}`);
        return false;
    }
}

// Optimized button creation with async handling
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
    `;
    
    function updateButton(text, icon, loading = false) {
        button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                ${loading ? 
                    '<div style="width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>' : 
                    `<i class="fas fa-${icon}" style="font-size: 16px;"></i>`
                }
                <span>${text}</span>
            </div>
        `;
    }
    
    updateButton('SYNC TO SHEETS', 'sync-alt');
    
    // Async click handler to prevent blocking
    button.addEventListener('click', () => {
        // Immediately update UI (non-blocking)
        button.disabled = true;
        updateButton('SYNCING...', '', true);
        
        // Run sync asynchronously
        setTimeout(async () => {
            try {
                const success = await syncNowWithYourSheets();
                updateButton(success ? 'SUCCESS!' : 'FAILED', success ? 'check' : 'exclamation-triangle');
            } catch (error) {
                updateButton('ERROR', 'exclamation-triangle');
            }
            
            // Reset button after 3 seconds
            setTimeout(() => {
                updateButton('SYNC TO SHEETS', 'sync-alt');
                button.disabled = false;
            }, 3000);
        }, 100); // Small delay to ensure UI updates immediately
    });
    
    document.body.appendChild(button);
    console.log('✅ Optimized sync button created');
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
    `;
    
    button.innerHTML = '<div style="display: flex; align-items: center; gap: 6px;"><i class="fas fa-wifi"></i><span>TEST</span></div>';
    
    button.addEventListener('click', () => {
        setTimeout(testYourConnection, 50); // Non-blocking
    });
    
    document.body.appendChild(button);
    console.log('✅ Test button created');
}

// Add CSS animation
if (!document.getElementById('sync-animations')) {
    const style = document.createElement('style');
    style.id = 'sync-animations';
    style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
}

// Initialize
function initializeSync() {
    console.log('🚀 Initializing optimized sync...');
    
    setTimeout(() => {
        createSyncButton();
        createTestButton();
        console.log('✅ Optimized sync ready!');
    }, 500);
}

// Global functions
window.syncNowWithYourSheets = syncNowWithYourSheets;
window.testYourConnection = testYourConnection;

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSync);
} else {
    initializeSync();
}

console.log('🎯 Performance-optimized sync loaded!');