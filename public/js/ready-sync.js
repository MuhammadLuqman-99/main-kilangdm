// ============================================================================
// READY-TO-USE AUTO-SYNC CONFIGURATION - FIXED VERSION
// Your URLs are already configured below!
// ============================================================================

// Extract IDs from your URLs
const SPREADSHEET_ID = '1oNmpTirhxi5K0mSqC-ynourLg7vTWrqIkPwTv-zcAFM';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyqJEWrzOljzhd8aI0og7Ese6GVuMav3leHmpjrFt5otByOVybwFdlDYCpOxpgxosm-RQ/exec';

// Firebase to Google Sheets Sync Class
class FirebaseToSheetsSync {
    constructor() {
        this.webAppUrl = WEBAPP_URL;
        this.spreadsheetId = SPREADSHEET_ID;
        console.log('🚀 Firebase to Sheets Sync initialized');
    }

    // Convert Firebase data to sheets format
    convertToSheetsFormat(data, type) {
        if (!data || data.length === 0) return [];

        let headers;
        let rows = [];

        switch (type) {
            case 'orders':
                headers = [
                    'ID', 'Tarikh', 'Nama Pelanggan', 'No Telefon', 'Alamat',
                    'Produk', 'Kuantiti', 'Harga', 'Total', 'Status',
                    'Agent', 'Channel', 'Catatan', 'Created At'
                ];
                
                rows = data.map(item => [
                    item.id || '',
                    item.date || '',
                    item.customerName || '',
                    item.phone || '',
                    item.address || '',
                    item.product || '',
                    item.quantity || 0,
                    item.price || 0,
                    item.total || 0,
                    item.status || '',
                    item.agent || '',
                    item.channel || '',
                    item.notes || '',
                    item.createdAt || ''
                ]);
                break;

            case 'marketing':
                headers = [
                    'ID', 'Tarikh', 'Channel', 'Budget', 'Leads Generated',
                    'Conversion Rate', 'ROAS', 'Agent', 'Campaign',
                    'Status', 'Catatan', 'Created At'
                ];
                
                rows = data.map(item => [
                    item.id || '',
                    item.date || '',
                    item.channel || '',
                    item.budget || 0,
                    item.leadsGenerated || 0,
                    item.conversionRate || 0,
                    item.roas || 0,
                    item.agent || '',
                    item.campaign || '',
                    item.status || '',
                    item.notes || '',
                    item.createdAt || ''
                ]);
                break;

            case 'salesteam':
                headers = [
                    'ID', 'Tarikh', 'Agent Name', 'Leads', 'Closes',
                    'Sales Amount', 'Commission', 'Target',
                    'Achievement %', 'Status', 'Catatan', 'Created At'
                ];
                
                rows = data.map(item => [
                    item.id || '',
                    item.date || '',
                    item.agentName || '',
                    item.leads || 0,
                    item.closes || 0,
                    item.salesAmount || 0,
                    item.commission || 0,
                    item.target || 0,
                    item.achievementRate || 0,
                    item.status || '',
                    item.notes || '',
                    item.createdAt || ''
                ]);
                break;

            default:
                return [];
        }

        return [headers, ...rows];
    }

    // Send data to Google Sheets
    async sendToSheets(sheetName, data) {
        try {
            console.log(`📊 Sending ${data.length} rows to sheet: ${sheetName}`);

            const payload = {
                action: 'writeData',
                spreadsheetId: this.spreadsheetId,
                sheetName: sheetName,
                data: data
            };

            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Success: ${result.message} (${result.rows} rows)`);
                return true;
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error(`❌ Error sending to ${sheetName}:`, error);
            throw error;
        }
    }

    // Sync all data to sheets
    async syncAllData() {
        try {
            console.log('🔄 Starting sync to Google Sheets...');

            if (!window.allData) {
                throw new Error('Data belum loaded. Sila tunggu sebentar.');
            }

            const { orders = [], marketing = [], salesteam = [] } = window.allData;
            const totalRecords = orders.length + marketing.length + salesteam.length;

            if (totalRecords === 0) {
                throw new Error('Tiada data untuk sync. Sila masukkan data terlebih dahulu.');
            }

            console.log(`📊 Syncing ${totalRecords} records...`);

            const syncPromises = [];

            // Sync Orders
            if (orders.length > 0) {
                const ordersData = this.convertToSheetsFormat(orders, 'orders');
                syncPromises.push(this.sendToSheets('Orders', ordersData));
            }

            // Sync Marketing
            if (marketing.length > 0) {
                const marketingData = this.convertToSheetsFormat(marketing, 'marketing');
                syncPromises.push(this.sendToSheets('Marketing', marketingData));
            }

            // Sync Sales Team
            if (salesteam.length > 0) {
                const salesteamData = this.convertToSheetsFormat(salesteam, 'salesteam');
                syncPromises.push(this.sendToSheets('SalesTeam', salesteamData));
            }

            // Wait for all syncs to complete
            await Promise.all(syncPromises);

            console.log('✅ All data synced successfully!');
            return true;

        } catch (error) {
            console.error('❌ Sync failed:', error);
            throw error;
        }
    }
}

// Initialize sync instance
let syncInstance = null;

// One-click sync function
async function syncNowWithYourSheets() {
    try {
        console.log('🔄 Starting sync to your Google Sheets...');
        
        // Initialize sync instance if needed
        if (!syncInstance) {
            syncInstance = new FirebaseToSheetsSync();
        }
        
        // Check if data is available
        if (!window.allData) {
            alert('⏳ Data masih loading. Sila tunggu sebentar dan cuba lagi.');
            return false;
        }
        
        const data = {
            orders: window.allData.orders || [],
            marketing: window.allData.marketing || [],
            salesteam: window.allData.salesteam || []
        };
        
        const totalRecords = data.orders.length + data.marketing.length + data.salesteam.length;
        
        if (totalRecords === 0) {
            alert('⚠️ Tiada data untuk sync. Sila masukkan data melalui borang terlebih dahulu.');
            return false;
        }
        
        console.log('📊 Data counts:', data);
        
        // Show confirmation
        const confirmMsg = `🚀 Ready to sync ${totalRecords} records to Google Sheets:\n\n• Orders: ${data.orders.length}\n• Marketing: ${data.marketing.length}\n• Sales Team: ${data.salesteam.length}\n\nProceed with sync?`;
        
        if (!confirm(confirmMsg)) {
            return false;
        }
        
        // Perform sync
        const success = await syncInstance.syncAllData();
        
        if (success) {
            // Open the Google Sheets to show results
            const sheetUrl = `https://docs.google.com/spreadsheets/d/1oNmpTirhxi5K0mSqC-ynourLg7vTWrqIkPwTv-zcAFM/edit?gid=627356785#gid=627356785`;
            
            const openSheet = confirm('✅ Sync BERJAYA!\n\nData telah di-update ke Google Sheets.\n\nNak buka Google Sheets sekarang?');
            
            if (openSheet) {
                window.open(sheetUrl, '_blank');
            }
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Sync error:', error);
        alert(`❌ Sync gagal!\n\nError: ${error.message}\n\nSila check console untuk details.`);
        return false;
    }
}

// Test connection to your Google Apps Script
async function testYourConnection() {
    try {
        console.log('🧪 Testing connection to your Apps Script...');
        
        // Test with a simple GET request first
        const response = await fetch(WEBAPP_URL, {
            method: 'GET',
            mode: 'cors'
        });
        
        const text = await response.text();
        console.log('📡 Response:', text);
        
        if (response.ok) {
            alert('✅ Connection test BERJAYA!\n\nApps Script boleh dicapai dan berfungsi.\n\nResponse: ' + text.substring(0, 100));
            return true;
        } else {
            alert(`⚠️ Connection mendapat response ${response.status}:\n\n${text.substring(0, 200)}...`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        
        if (error.message.includes('CORS')) {
            alert('❌ CORS Error detected!\n\nSila check Google Apps Script deployment settings:\n\n1. Execute as: Me\n2. Who has access: Anyone\n3. Redeploy if needed');
        } else {
            alert(`❌ Connection test gagal!\n\nError: ${error.message}\n\nSila check Apps Script URL dan deployment.`);
        }
        
        return false;
    }
}

// Create the sync button with better styling
function createSyncButton() {
    // Remove existing button
    const existingBtn = document.getElementById('sync-to-sheets-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // Create button element
    const button = document.createElement('button');
    button.id = 'sync-to-sheets-btn';
    button.className = 'sync-btn-fixed';
    
    // Add styles directly to button
    button.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 1000;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 160px;
        justify-content: center;
    `;
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
    });
    
    // Initial button content
    function setButtonContent(text, icon, loading = false) {
        button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                ${loading ? 
                    '<div style="width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>' : 
                    `<i class="fas fa-${icon}" style="font-size: 16px;"></i>`
                }
                <span>${text}</span>
            </div>
        `;
    }
    
    // Add spinning animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    setButtonContent('SYNC TO SHEETS', 'sync-alt');
    
    // Add click handler
    button.addEventListener('click', async () => {
        button.disabled = true;
        setButtonContent('SYNCING...', '', true);
        
        try {
            const success = await syncNowWithYourSheets();
            
            if (success) {
                setButtonContent('SYNC SUCCESS!', 'check');
                setTimeout(() => {
                    setButtonContent('SYNC TO SHEETS', 'sync-alt');
                }, 3000);
            } else {
                setButtonContent('SYNC FAILED', 'exclamation-triangle');
                setTimeout(() => {
                    setButtonContent('SYNC TO SHEETS', 'sync-alt');
                }, 3000);
            }
        } catch (error) {
            setButtonContent('SYNC ERROR', 'exclamation-triangle');
            setTimeout(() => {
                setButtonContent('SYNC TO SHEETS', 'sync-alt');
            }, 3000);
        } finally {
            button.disabled = false;
        }
    });
    
    // Add to page
    document.body.appendChild(button);
    console.log('✅ Sync button created (top-right corner)');
    
    return button;
}

// Display current configuration
function showCurrentConfig() {
    const config = `
🔧 CURRENT CONFIGURATION:

📊 Google Sheets ID:
   ${SPREADSHEET_ID}
   
🔗 Apps Script URL:
   ${WEBAPP_URL.substring(0, 60)}...
   
📋 Data Available:
   • Orders: ${window.allData?.orders?.length || 0}
   • Marketing: ${window.allData?.marketing?.length || 0}
   • Sales Team: ${window.allData?.salesteam?.length || 0}
   
🚀 Ready to sync!
    `;
    
    console.log(config);
    alert(config.trim());
}

// Create a test button too
function createTestButton() {
    const existingBtn = document.getElementById('test-connection-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const button = document.createElement('button');
    button.id = 'test-connection-btn';
    
    button.style.cssText = `
        position: fixed;
        top: 160px;
        right: 20px;
        z-index: 1000;
        background: linear-gradient(135deg, #2196F3, #1976D2);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 3px 10px rgba(33, 150, 243, 0.3);
        transition: all 0.3s ease;
    `;
    
    button.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
            <i class="fas fa-wifi" style="font-size: 12px;"></i>
            <span>TEST</span>
        </div>
    `;
    
    button.addEventListener('click', testYourConnection);
    
    document.body.appendChild(button);
    console.log('✅ Test button created');
}

// Auto-setup when page loads
function initializeSync() {
    console.log('🚀 Initializing Firebase to Sheets sync...');
    
    // Wait for DOM and Firebase to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSync);
        return;
    }
    
    // Create buttons
    setTimeout(() => {
        createSyncButton();
        createTestButton();
        
        console.log('✅ Sync system ready!');
        console.log('📊 Spreadsheet ID:', SPREADSHEET_ID);
        console.log('🔗 Web App URL configured');
        console.log('💡 Click the green SYNC button to sync data');
        
        // Show initial config
        if (window.allData) {
            console.log('📋 Data loaded:', {
                orders: window.allData.orders?.length || 0,
                marketing: window.allData.marketing?.length || 0,
                salesteam: window.allData.salesteam?.length || 0
            });
        } else {
            console.log('⏳ Waiting for data to load...');
        }
    }, 2000);
}

// Make functions available globally
window.syncNowWithYourSheets = syncNowWithYourSheets;
window.testYourConnection = testYourConnection;
window.showCurrentConfig = showCurrentConfig;

// Start initialization
initializeSync();

console.log('🎯 Firebase to Sheets Sync loaded!');
console.log('🚀 Try: syncNowWithYourSheets() or click the SYNC button');