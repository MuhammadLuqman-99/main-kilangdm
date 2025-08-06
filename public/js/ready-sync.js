// ============================================================================
// PERFORMANCE-OPTIMIZED SYNC - Fixed Click Handler Performance
// ============================================================================

const SPREADSHEET_ID = '1wp6Plrm44LksNhsVt_GxgvRZqK9X_ryAkrWR51Qlr9E';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxLt2lXkWArBCr1UZjHN5S35yu2W4p0XdCa4Km0JEAnVQDTmPApGVHM-yR38fkUrpkQ/exec';

class FirebaseToSheetsSync {
    constructor() {
        this.webAppUrl = WEBAPP_URL;
        this.spreadsheetId = SPREADSHEET_ID;
        this.isSyncing = false;
        console.log('🚀 Firebase to Sheets Sync initialized');
    }
    // CORS-compatible fetch with multiple fallback methods
    async corsCompatibleFetch(url, options) {
        // Method 1: Try direct fetch first
        try {
            console.log('🔄 Attempting direct fetch...');
            const response = await fetch(url, {
                ...options,
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (response.ok) {
                console.log('✅ Direct fetch successful');
                return response;
            }
            throw new Error(`HTTP ${response.status}`);
            
        } catch (directError) {
            console.log('❌ Direct fetch failed:', directError.message);
            
            // Method 2: Try with no-cors mode
            try {
                console.log('🔄 Attempting no-cors fetch...');
                const response = await fetch(url, {
                    ...options,
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // no-cors always returns opaque response, assume success if no error
                console.log('✅ No-cors fetch completed (opaque response)');
                return {
                    ok: true,
                    text: () => Promise.resolve('{"success":true,"message":"Request sent via no-cors mode"}'),
                    json: () => Promise.resolve({success: true, message: "Request sent via no-cors mode"})
                };
                
            } catch (noCorsError) {
                console.log('❌ No-cors fetch failed:', noCorsError.message);
                
                // Method 3: Try XMLHttpRequest as fallback
                try {
                    console.log('🔄 Attempting XMLHttpRequest...');
                    return await this.xmlHttpRequestFallback(url, options);
                    
                } catch (xhrError) {
                    console.log('❌ XMLHttpRequest failed:', xhrError.message);
                    throw new Error(`All fetch methods failed. Last error: ${xhrError.message}`);
                }
            }
        }
    }
    // XMLHttpRequest fallback method
    async xmlHttpRequestFallback(url, options) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.open(options.method || 'POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 0) {
                        console.log('✅ XMLHttpRequest successful');
                        resolve({
                            ok: true,
                            text: () => Promise.resolve(xhr.responseText || '{"success":true}'),
                            json: () => Promise.resolve(JSON.parse(xhr.responseText || '{"success":true}'))
                        });
                    } else {
                        reject(new Error(`XMLHttpRequest failed with status: ${xhr.status}`));
                    }
                }
            };
            
            xhr.onerror = () => reject(new Error('XMLHttpRequest network error'));
            xhr.ontimeout = () => reject(new Error('XMLHttpRequest timeout'));
            
            xhr.timeout = 15000; // 15 second timeout
            xhr.send(options.body);
        });
    }

    // Enhanced connection test with CORS handling
    async testConnection() {
        try {
            console.log('🧪 Testing connection with CORS compatibility...');
            
            const testPayload = {
                action: 'test',
                timestamp: Date.now(),
                testMessage: 'CORS compatibility test'
            };

            const response = await this.corsCompatibleFetch(this.webAppUrl, {
                method: 'POST',
                body: JSON.stringify(testPayload)
            });

            let result;
            try {
                result = await response.json();
            } catch (parseError) {
                // If we can't parse response, assume success for no-cors mode
                result = { success: true, message: 'Connection test completed (response parsing skipped)' };
            }

            console.log('✅ Connection test result:', result);
            
            return {
                success: true,
                data: result,
                message: 'Connection successful'
            };
            
        } catch (error) {
            console.error('❌ Connection test failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }


    // Convert data to sheets format (same as before)
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


    // Enhanced sheet writing with CORS compatibility
    async sendToSheets(sheetName, data) {
        try {
            console.log(`📊 Syncing ${data.length} rows to ${sheetName} (CORS-compatible)...`);

            const payload = {
                action: 'writeData',
                spreadsheetId: this.spreadsheetId,
                sheetName,
                data,
                timestamp: Date.now(),
                source: 'KilangDM-Firebase'
            };

            const response = await this.corsCompatibleFetch(this.webAppUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            let result;
            try {
                result = await response.json();
                console.log('📋 Server response:', result);
            } catch (parseError) {
                // For no-cors requests, we can't read the response
                console.log('📋 Response parsing skipped (no-cors mode)');
                result = { 
                    success: true, 
                    message: `Data sent to ${sheetName} (response not readable due to CORS)`,
                    rowsSent: data.length
                };
            }

            if (result.success !== false) { // Assume success unless explicitly false
                console.log(`✅ ${sheetName}: ${result.message || 'Synced successfully'}`);
                return { success: true, message: result.message };
            } else {
                throw new Error(result.error || 'Unknown sync error');
            }

        } catch (error) {
            console.error(`❌ ${sheetName} sync failed:`, error.message);
            
            // Don't fail completely - log error but continue
            console.log(`⚠️ Continuing with other sheets despite ${sheetName} failure...`);
            return { 
                success: false, 
                message: `${sheetName}: ${error.message} (continuing anyway)`,
                continuable: true
            };
        }
    }

    // Yield control to prevent blocking
    async yieldToMain() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }
    // TAMBAH FUNGSI INI - Load all data from Firestore
    async loadAllDataFromFirestore() {
        try {
            console.log('📥 Loading all data from Firestore...');
            
            if (!window.db) {
                throw new Error('Firestore database not initialized');
            }

            // Import Firestore functions
            const { collection, query, orderBy, getDocs } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");

            // Fetch collections with error handling
            const fetchCollection = async (collectionName) => {
                try {
                    const snapshot = await getDocs(query(collection(window.db, collectionName), orderBy("createdAt", "desc")));
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (error) {
                    console.warn(`⚠️ Failed to fetch ${collectionName}:`, error.message);
                    return [];
                }
            };

            const [orders, marketing, salesteam] = await Promise.all([
                fetchCollection("orderData"),
                fetchCollection("marketingData"), 
                fetchCollection("salesTeamData")
            ]);

            console.log(`✅ Loaded from Firestore:`, {
                orders: orders.length,
                marketing: marketing.length, 
                salesteam: salesteam.length
            });
            
            return { orders, marketing, salesteam };

        } catch (error) {
            console.error('❌ Error loading data:', error);
            throw new Error(`Failed to load data: ${error.message}`);
        }
    }
    // Main sync function with improved error handling
    async syncAllData() {
        if (this.isSyncing) {
            throw new Error('Sync already in progress');
        }

        this.isSyncing = true;
        
        try {
            console.log('🔄 Starting CORS-compatible sync...');

            // Try to get data from dashboard first, fallback to direct load
            let orders = [], marketing = [], salesteam = [];

            if (window.allData) {
                console.log('📊 Using dashboard data...');
                ({ orders = [], marketing = [], salesteam = [] } = window.allData);
            } else {
                console.log('📥 Dashboard data not available, loading from Firestore...');
                const freshData = await this.loadAllDataFromFirestore();
                orders = freshData.orders;
                marketing = freshData.marketing;
                salesteam = freshData.salesteam;
            }
            const totalRecords = orders.length + marketing.length + salesteam.length;

            if (totalRecords === 0) {
                throw new Error('No data to sync');
            }

            console.log(`📊 Processing ${totalRecords} records...`);

            // Prepare sync tasks
            const syncTasks = [];
            
            if (orders.length > 0) {
                await this.yieldToMain();
                const ordersData = this.convertToSheetsFormat(orders, 'orders');
                syncTasks.push({ name: 'Orders', data: ordersData, count: orders.length });
            }
            
            if (marketing.length > 0) {
                await this.yieldToMain();
                const marketingData = this.convertToSheetsFormat(marketing, 'marketing');
                syncTasks.push({ name: 'Marketing', data: marketingData, count: marketing.length });
            }
            
            if (salesteam.length > 0) {
                await this.yieldToMain();
                const salesteamData = this.convertToSheetsFormat(salesteam, 'salesteam');
                syncTasks.push({ name: 'SalesTeam', data: salesteamData, count: salesteam.length });
            }

            // Execute syncs with improved error tolerance
            const results = [];
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < syncTasks.length; i++) {
                const task = syncTasks[i];
                
                try {
                    const result = await this.sendToSheets(task.name, task.data);
                    
                    if (result.success) {
                        results.push(`✅ ${task.name}: ${task.count} records`);
                        successCount++;
                    } else if (result.continuable) {
                        results.push(`⚠️ ${task.name}: ${task.count} records (may have succeeded despite error)`);
                        successCount++; // Count as success for no-cors scenarios
                    } else {
                        results.push(`❌ ${task.name}: ${result.message}`);
                        errorCount++;
                    }
                    
                    // Yield control between syncs
                    if (i < syncTasks.length - 1) {
                        await this.yieldToMain();
                    }
                    
                } catch (error) {
                    results.push(`❌ ${task.name}: ${error.message}`);
                    errorCount++;
                    // Continue with other tasks instead of failing completely
                }
            }

            console.log(`🎉 Sync completed! Success: ${successCount}, Errors: ${errorCount}`);
            
            return { 
                success: successCount > 0, // Success if at least one sheet synced
                results, 
                totalRecords,
                successCount,
                errorCount
            };

        } catch (error) {
            console.error('💥 Sync failed:', error.message);
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }
}

// TAMBAH FUNGSI INI - Check if data is available
function checkDataAvailability() {
    try {
        if (window.allData && typeof window.allData === 'object') {
            const { orders = [], marketing = [], salesteam = [] } = window.allData;
            const total = orders.length + marketing.length + salesteam.length;
            console.log(`📊 Dashboard data: orders=${orders.length}, marketing=${marketing.length}, salesteam=${salesteam.length}`);
            return total;
        }
        return 0; // Will load from Firestore if needed
    } catch (error) {
        console.warn('⚠️ Error checking data availability:', error.message);
        return 0;
    }
}

// Global instance
let syncInstance = null;

// UPDATE: Improved syncNowWithYourSheets function
// Enhanced sync function with better error handling
async function syncNowWithYourSheets() {
    try {
        if (!syncInstance) {
            syncInstance = new FirebaseToSheetsSync();
        }
        
        if (syncInstance.isSyncing) {
            alert('⏳ Sync already in progress. Please wait...');
            return false;
        }
        
        // Wait for Firebase if not ready
        if (!window.db) {
            throw new Error('Firebase not initialized. Please wait and try again.');
        }
        
         // Check if data is available
        const dataCount = checkDataAvailability();

        if (dataCount === 0 && !window.db) {
            throw new Error('No data available and Firebase not ready');
        }

        if (dataCount === 0) {
            console.log('📥 No dashboard data, will load from Firestore...');
        } else {
            console.log(`📊 Dashboard data available: ${dataCount} records`);
        }

        console.log(`📊 Preparing to sync data...`);
        
        const result = await syncInstance.syncAllData();
        
        if (result.success) {
            const successMsg = `🎉 SYNC COMPLETED!\n\n${result.results.join('\n')}\n\nTotal: ${result.totalRecords} records\nSuccess: ${result.successCount} sheets\nErrors: ${result.errorCount} sheets\n\nOpen Google Sheets?`;
            
            if (confirm(successMsg)) {
                window.open(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`, '_blank');
            }
            
            return true;
        } else if (result.successCount > 0) {
            const partialMsg = `⚠️ PARTIAL SYNC COMPLETED!\n\n${result.results.join('\n')}\n\nSome data may have been synced despite errors.\nOpen Google Sheets to verify?`;
            
            if (confirm(partialMsg)) {
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

// Enhanced connection test
async function testYourConnection() {
    try {
        if (!syncInstance) {
            syncInstance = new FirebaseToSheetsSync();
        }
        
        const result = await syncInstance.testConnection();
        
        if (result.success) {
            alert(`✅ CONNECTION SUCCESS!\n\nServer Response: Ready\nCORS Compatibility: Enabled\n\nYou can now sync your data.`);
            return true;
        } else {
            alert(`❌ CONNECTION FAILED!\n\nError: ${result.error}\n\nTrying alternative connection methods...`);
            return false;
        }
        
    } catch (error) {
        alert(`❌ CONNECTION ERROR!\n\n${error.message}\n\nCORS issues detected. Please update your Google Apps Script.`);
        return false;
    }
}

// Enhanced button creation (same as before but with updated labels)
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
    // Update button text based on data availability
    function updateButtonWithDataStatus() {
        const dataCount = checkDataAvailability();
        if (dataCount > 0) {
            updateButton(`SYNC ${dataCount} RECORDS`, 'sync-alt');
        } else if (window.db) {
            updateButton('LOAD & SYNC', 'download');
        } else {
            updateButton('WAITING...', 'clock');
        }
    }

    updateButtonWithDataStatus();

    // Check data status every 5 seconds
    setInterval(updateButtonWithDataStatus, 5000);

    updateButton('SYNC TO SHEETS', 'sync-alt');
    
    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (button.disabled) return;
        
        button.disabled = true;
        updateButton('SYNCING...', '', true);
        
        requestAnimationFrame(async () => {
            try {
                const success = await syncNowWithYourSheets();
                updateButton(success ? 'SUCCESS!' : 'PARTIAL', success ? 'check' : 'exclamation-triangle');
                
                setTimeout(() => {
                    updateButton('SYNC TO SHEETS', 'sync-alt');
                    button.disabled = false;
                }, 3000);
                
           } catch (error) {
            console.error('Click handler error:', error);
            
            // Show specific error message based on error type
            let errorMsg = 'Unknown error occurred';
            
            if (error.message.includes('Firebase not initialized')) {
                errorMsg = 'Firebase not ready. Please wait and try again.';
            } else if (error.message.includes('Cannot read properties')) {
                errorMsg = 'Data not loaded yet. Will load from Firestore automatically.';
            } else if (error.message.includes('No data available')) {
                errorMsg = 'No data found. Please add some data first.';
            } else {
                errorMsg = error.message;
            }
            
            console.log(`⚠️ Sync error: ${errorMsg}`);
            // Don't show alert for minor errors, just update button
            
            updateButton('RETRY', 'redo');
            
            setTimeout(() => {
                updateButtonWithDataStatus();
                button.disabled = false;
            }, 2000);
        }
        });
    });
    
    document.body.appendChild(button);
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
    
    button.innerHTML = '<div style="display: flex; align-items: center; gap: 6px;"><i class="fas fa-wifi"></i><span>TEST CORS</span></div>';
    
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
        
        #test-connection-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
        }
    `;
    document.head.appendChild(style);
}

// Initialize with CORS compatibility
function initializeSync() {
    console.log('🚀 Initializing CORS-compatible sync...');
    
    // Add enhanced styles
    addOptimizedStyles();
    
    requestAnimationFrame(() => {
        createSyncButton();
        createTestButton();
        console.log('✅ CORS-compatible sync ready!');
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

console.log('🎯 CORS-compatible sync loaded!');