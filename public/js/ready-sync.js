// ============================================================================
// CORS-FIXED FIREBASE TO SHEETS SYNC 
// ============================================================================

// ⚠️ GANTIKAN URL INI DENGAN URL APPS SCRIPT YANG BARU
const SPREADSHEET_ID = '1to__XddJ8gzFcvrTqRXA7RWbgdNDWdrW8qu5tPCe_1M';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxE3oLrOMmNycrnUBYVIZMcu2ZvbVwctviWMhB0PJN2XqbZyZC5nRWfCX_xPSCLHJO8DQ/exec';

class FirebaseToSheetsSync {
    constructor() {
        this.webAppUrl = WEBAPP_URL;
        this.spreadsheetId = SPREADSHEET_ID;
        console.log('🚀 Firebase to Sheets Sync initialized');
        console.log('🔗 Apps Script URL:', this.webAppUrl);
    }

    // Test connection dengan cara yang betul untuk Google Apps Script
    async testConnection() {
        try {
            console.log('🧪 Testing connection to Apps Script...');
            console.log('📡 URL:', this.webAppUrl);
            
            // Google Apps Script hanya support request tanpa CORS headers
            // Jadi kita guna cara lain - POST request terus
            const testPayload = {
                action: 'test',
                timestamp: new Date().toISOString()
            };

            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                body: JSON.stringify(testPayload),
                // Jangan set headers content-type - biar GAS handle
            });
            
            console.log('📊 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseText = await response.text();
            console.log('📄 Raw response:', responseText);
            
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                // Jika bukan JSON, anggap sebagai HTML/text response
                if (responseText.includes('Google') || responseText.includes('login')) {
                    throw new Error('Apps Script belum di-deploy dengan betul. Response adalah login page.');
                }
                responseData = { message: responseText };
            }
            
            console.log('✅ Connection successful!');
            console.log('📄 Response data:', responseData);
            
            return { success: true, data: responseData };
            
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            
            let errorMessage = 'Unknown error';
            let solution = '';
            
            if (error.message.includes('login') || error.message.includes('Google')) {
                errorMessage = 'Apps Script deployment issue';
                solution = `
PENYELESAIAN:
1. Pergi ke Google Apps Script
2. Deploy dengan settings:
   - Execute as: Me 
   - Who has access: Anyone (PENTING!)
3. Pastikan dapat URL yang betul`;
            } else if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                errorMessage = 'Network/CORS Error';
                solution = 'Apps Script mungkin belum di-deploy dengan betul';
            } else {
                errorMessage = error.message;
                solution = 'Check Apps Script deployment dan URL';
            }
            
            return { 
                success: false, 
                error: errorMessage,
                solution: solution,
                fullError: error
            };
        }
    }

    // Convert Firebase data to sheets format
    convertToSheetsFormat(data, type) {
        if (!data || data.length === 0) return [];

        let headers;
        let rows = [];

        switch (type) {
            case 'orders':
                headers = [
                    'ID', 'Tarikh', 'Code Kain', 'No PO/Invoice', 'Nama Customer',
                    'Team Sale', 'No Phone', 'Jenis Order', 'Total RM', 'Platform', 'Created At'
                ];
                
                rows = data.map(item => [
                    item.id || '',
                    item.tarikh || '',
                    item.code_kain || '',
                    item.nombor_po_invoice || '',
                    item.nama_customer || '',
                    item.team_sale || '',
                    item.nombor_phone || '',
                    item.jenis_order || '',
                    item.total_rm || 0,
                    item.platform || '',
                    item.createdAt ? new Date(item.createdAt.seconds * 1000).toISOString() : ''
                ]);
                break;

            case 'marketing':
                headers = [
                    'ID', 'Tarikh', 'Masa', 'Spend', 'Team Sale', 'Type',
                    'Campaign Name', 'Ads Set Name', 'Audience', 'Jenis Video',
                    'CTA Video', 'Jenis Kain', 'Impressions', 'Link Click',
                    'Unique Link Click', 'Reach', 'Frequency', 'CTR', 'CPC',
                    'CPM', 'Cost', 'Lead dari Team Sale', 'Amount Spent', 'Created At'
                ];
                
                rows = data.map(item => [
                    item.id || '',
                    item.tarikh || '',
                    item.masa || '',
                    item.spend || 0,
                    item.team_sale || '',
                    item.type || '',
                    item.campaign_name || '',
                    item.ads_setname || '',
                    item.audience || '',
                    item.jenis_video || '',
                    item.cta_video || '',
                    item.jenis_kain || '',
                    item.impressions || 0,
                    item.link_click || 0,
                    item.unique_link_click || 0,
                    item.reach || 0,
                    item.frequency || 0,
                    item.ctr || 0,
                    item.cpc || 0,
                    item.cpm || 0,
                    item.cost || 0,
                    item.lead_dari_team_sale || 0,
                    item.amount_spent || 0,
                    item.createdAt ? new Date(item.createdAt.seconds * 1000).toISOString() : ''
                ]);
                break;

            case 'salesteam':
                headers = [
                    'ID', 'Tarikh', 'Masa', 'Team', 'Type', 'Total Lead',
                    'Cold', 'Warm', 'Hot', 'Total Lead Bulan',
                    'Total Close Bulan', 'Total Sale Bulan', 'Created At'
                ];
                
                rows = data.map(item => [
                    item.id || '',
                    item.tarikh || '',
                    item.masa || '',
                    item.team || '',
                    item.type || '',
                    item.total_lead || 0,
                    item.cold || 0,
                    item.warm || 0,
                    item.hot || 0,
                    item.total_lead_bulan || 0,
                    item.total_close_bulan || 0,
                    item.total_sale_bulan || 0,
                    item.createdAt ? new Date(item.createdAt.seconds * 1000).toISOString() : ''
                ]);
                break;

            default:
                return [];
        }

        return [headers, ...rows];
    }

    // Send data to Google Sheets dengan cara yang betul
    async sendToSheets(sheetName, data, retries = 2) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`📊 Sending ${data.length} rows to sheet: ${sheetName} (Attempt ${attempt})`);

                const payload = {
                    action: 'writeData',
                    spreadsheetId: this.spreadsheetId,
                    sheetName: sheetName,
                    data: data,
                    timestamp: new Date().toISOString()
                };

                console.log('📦 Payload sample:', {
                    action: payload.action,
                    sheetName: payload.sheetName,
                    dataRows: payload.data.length,
                    dataCols: payload.data[0]?.length || 0
                });

                const response = await fetch(this.webAppUrl, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                    // Jangan set Content-Type header - biar GAS handle
                });

                console.log(`📊 Response status for ${sheetName}:`, response.status);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const responseText = await response.text();
                console.log(`📄 Raw response for ${sheetName}:`, responseText);

                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (parseError) {
                    throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
                }

                if (result.success) {
                    console.log(`✅ Success: ${sheetName} - ${result.message || 'Data synced'}`);
                    return true;
                } else {
                    throw new Error(result.error || 'Unknown error from Apps Script');
                }

            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed for ${sheetName}:`, error);
                
                if (attempt === retries) {
                    throw new Error(`Failed after ${retries} attempts: ${error.message}`);
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }

    // Sync all data
    async syncAllData() {
        try {
            console.log('🔄 Starting sync to Google Sheets...');

            if (!window.allData) {
                throw new Error('❌ Data belum loaded dari Firebase. Sila tunggu sebentar.');
            }

            const { orders = [], marketing = [], salesteam = [] } = window.allData;
            const totalRecords = orders.length + marketing.length + salesteam.length;

            console.log('📊 Data counts:', {
                orders: orders.length,
                marketing: marketing.length,
                salesteam: salesteam.length,
                total: totalRecords
            });

            if (totalRecords === 0) {
                throw new Error('❌ Tiada data untuk sync. Masukkan data dulu.');
            }

            console.log(`📊 Ready to sync ${totalRecords} records...`);

            const results = [];

            // Sync Orders
            if (orders.length > 0) {
                try {
                    const ordersData = this.convertToSheetsFormat(orders, 'orders');
                    await this.sendToSheets('Orders', ordersData);
                    results.push(`✅ Orders: ${orders.length} records`);
                } catch (error) {
                    results.push(`❌ Orders failed: ${error.message}`);
                    throw error;
                }
            }

            // Sync Marketing
            if (marketing.length > 0) {
                try {
                    const marketingData = this.convertToSheetsFormat(marketing, 'marketing');
                    await this.sendToSheets('Marketing', marketingData);
                    results.push(`✅ Marketing: ${marketing.length} records`);
                } catch (error) {
                    results.push(`❌ Marketing failed: ${error.message}`);
                    throw error;
                }
            }

            // Sync Sales Team
            if (salesteam.length > 0) {
                try {
                    const salesteamData = this.convertToSheetsFormat(salesteam, 'salesteam');
                    await this.sendToSheets('SalesTeam', salesteamData);
                    results.push(`✅ SalesTeam: ${salesteam.length} records`);
                } catch (error) {
                    results.push(`❌ SalesTeam failed: ${error.message}`);
                    throw error;
                }
            }

            console.log('🎉 All data synced successfully!');
            console.log('📋 Results:', results);
            
            return { success: true, results: results };

        } catch (error) {
            console.error('💥 Sync failed:', error);
            throw error;
        }
    }
}

// Initialize
let syncInstance = null;

// Main sync function
async function syncNowWithYourSheets() {
    try {
        console.log('🚀 Starting sync...');
        
        if (!syncInstance) {
            syncInstance = new FirebaseToSheetsSync();
        }
        
        // Check data
        if (!window.allData) {
            alert('⏳ Data masih loading. Tunggu sebentar dan cuba lagi.');
            return false;
        }
        
        const data = {
            orders: window.allData.orders || [],
            marketing: window.allData.marketing || [],
            salesteam: window.allData.salesteam || []
        };
        
        const totalRecords = data.orders.length + data.marketing.length + data.salesteam.length;
        
        if (totalRecords === 0) {
            alert('⚠️ Tiada data untuk sync. Masukkan data dulu.');
            return false;
        }
        
        // Confirm sync
        const confirmMsg = `🚀 Ready to sync ${totalRecords} records:

• Orders: ${data.orders.length}
• Marketing: ${data.marketing.length}  
• Sales Team: ${data.salesteam.length}

Proceed?`;
        
        if (!confirm(confirmMsg)) {
            return false;
        }
        
        // Do sync
        const result = await syncInstance.syncAllData();
        
        if (result.success) {
            const successMsg = `🎉 SYNC BERJAYA!

${result.results.join('\n')}

Nak buka Google Sheets?`;
            
            const openSheet = confirm(successMsg);
            
            if (openSheet) {
                const sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0`;
                window.open(sheetUrl, '_blank');
            }
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('💥 Sync error:', error);
        alert(`❌ SYNC GAGAL!\n\nError: ${error.message}\n\nCheck console untuk details.`);
        return false;
    }
}

// Test connection function
async function testYourConnection() {
    try {
        console.log('🧪 Starting connection test...');
        
        if (!syncInstance) {
            syncInstance = new FirebaseToSheetsSync();
        }
        
        const result = await syncInstance.testConnection();
        
        if (result.success) {
            const successMsg = `✅ CONNECTION BERJAYA!

Apps Script response:
${JSON.stringify(result.data, null, 2)}

Ready untuk sync!`;
            
            alert(successMsg);
            return true;
            
        } else {
            const errorMsg = `❌ CONNECTION GAGAL!

Error: ${result.error}

Penyelesaian:
${result.solution}`;
            
            alert(errorMsg);
            return false;
        }
        
    } catch (error) {
        console.error('💥 Test error:', error);
        alert(`❌ TEST ERROR!\n\nError: ${error.message}`);
        return false;
    }
}

// Create buttons
function createSyncButton() {
    const existingBtn = document.getElementById('sync-to-sheets-btn');
    if (existingBtn) existingBtn.remove();
    
    const button = document.createElement('button');
    button.id = 'sync-to-sheets-btn';
    
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
        min-width: 180px;
    `;
    
    button.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
            <i class="fas fa-sync-alt" style="font-size: 16px;"></i>
            <span>SYNC TO SHEETS</span>
        </div>
    `;
    
    button.addEventListener('click', async () => {
        const originalContent = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                <div style="width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>SYNCING...</span>
            </div>
        `;
        
        try {
            const success = await syncNowWithYourSheets();
            button.innerHTML = success ? 
                '<div style="display: flex; align-items: center; gap: 8px; justify-content: center;"><i class="fas fa-check"></i><span>SUCCESS!</span></div>' :
                '<div style="display: flex; align-items: center; gap: 8px; justify-content: center;"><i class="fas fa-exclamation-triangle"></i><span>FAILED</span></div>';
        } catch (error) {
            button.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; justify-content: center;"><i class="fas fa-exclamation-triangle"></i><span>ERROR</span></div>';
        }
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
        }, 3000);
    });
    
    document.body.appendChild(button);
    console.log('✅ Sync button created');
}

function createTestButton() {
    const existingBtn = document.getElementById('test-connection-btn');
    if (existingBtn) existingBtn.remove();
    
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

// Add spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize
function initializeSync() {
    console.log('🚀 Initializing CORS-fixed sync...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSync);
        return;
    }
    
    setTimeout(() => {
        createSyncButton();
        createTestButton();
        
        console.log('✅ CORS-fixed sync ready!');
        console.log('📊 Spreadsheet ID:', SPREADSHEET_ID);
        console.log('🔗 Apps Script URL:', WEBAPP_URL);
        console.log('💡 1. Test connection first');
        console.log('💡 2. Then sync data');
        
    }, 1000);
}

// Make functions global
window.syncNowWithYourSheets = syncNowWithYourSheets;
window.testYourConnection = testYourConnection;

// Start
initializeSync();

console.log('🎯 CORS-Fixed Firebase to Sheets Sync loaded!');