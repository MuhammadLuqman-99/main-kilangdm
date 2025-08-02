// ============================================================================
// READY-TO-USE AUTO-SYNC CONFIGURATION
// Your URLs are already configured below!
// ============================================================================

// Extract IDs from your URLs
const SPREADSHEET_ID = '1oNmpTirhxi5K0mSqC-ynourLg7vTWrqIkPwTv-zcAFM';
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyqJEWrzOljzhd8aI0og7Ese6GVuMav3leHmpjrFt5otByOVybwFdlDYCpOxpgxosm-RQ/exec';

// Quick setup function - add this to your dashboard.js
function setupAutoSyncWithYourURLs() {
    console.log('🚀 Setting up auto-sync with your URLs...');
    
    // Initialize the sync system
    if (!window.autoSyncInstance) {
        window.autoSyncInstance = new FixedFirebaseSheetsSync();
    }
    
    // Configure with your URLs
    window.autoSyncInstance.quickSetup(WEBAPP_URL, SPREADSHEET_ID);
    
    // Auto-fill the UI inputs if they exist
    const spreadsheetInput = document.getElementById('auto-spreadsheet-id');
    const webappInput = document.getElementById('auto-webapp-url');
    
    if (spreadsheetInput) spreadsheetInput.value = SPREADSHEET_ID;
    if (webappInput) webappInput.value = WEBAPP_URL;
    
    console.log('✅ Auto-sync configured with your URLs!');
    console.log('📊 Spreadsheet:', SPREADSHEET_ID);
    console.log('🔗 Web App:', WEBAPP_URL.substring(0, 50) + '...');
    
    return window.autoSyncInstance;
}

// One-click sync function
async function syncNowWithYourSheets() {
    try {
        console.log('🔄 Starting sync to your Google Sheets...');
        
        // Setup if not already done
        const syncInstance = setupAutoSyncWithYourURLs();
        
        // Check if data is available
        if (!window.allData) {
            alert('⏳ Data masih loading. Sila tunggu sebentar dan cuba lagi.');
            return;
        }
        
        const data = {
            orders: window.allData.orders || [],
            marketing: window.allData.marketing || [],
            salesteam: window.allData.salesteam || []
        };
        
        const totalRecords = data.orders.length + data.marketing.length + data.salesteam.length;
        
        if (totalRecords === 0) {
            alert('⚠️ Tiada data untuk sync. Sila masukkan data melalui borang terlebih dahulu.');
            return;
        }
        
        console.log('📊 Data counts:', data);
        
        // Show confirmation
        const confirmMsg = `🚀 Ready to sync ${totalRecords} records to Google Sheets:\n\n• Orders: ${data.orders.length}\n• Marketing: ${data.marketing.length}\n• Sales Team: ${data.salesteam.length}\n\nProceed with sync?`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Perform sync
        const success = await syncInstance.syncAllDataToSheets();
        
        if (success) {
            // Open the Google Sheets to show results
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
            
            const openSheet = confirm('✅ Sync BERJAYA!\n\nData telah di-update ke Google Sheets.\n\nNak buka Google Sheets sekarang?');
            
            if (openSheet) {
                window.open(sheetUrl, '_blank');
            }
        }
        
    } catch (error) {
        console.error('❌ Sync error:', error);
        alert(`❌ Sync gagal!\n\nError: ${error.message}\n\nSila check console untuk details.`);
    }
}

// Test connection to your Google Apps Script
async function testYourConnection() {
    try {
        console.log('🧪 Testing connection to your Apps Script...');
        
        const response = await fetch(WEBAPP_URL, {
            method: 'GET',
            mode: 'cors'
        });
        
        const text = await response.text();
        console.log('📡 Response:', text);
        
        if (text.includes('working') || text.includes('success') || response.ok) {
            alert('✅ Connection test BERJAYA!\n\nApps Script boleh dicapai dan berfungsi.');
            return true;
        } else {
            alert(`⚠️ Connection test mendapat response, tapi format tidak dijangka:\n\n${text.substring(0, 200)}...`);
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

// Create quick sync button
function createQuickSyncButton() {
    // Remove existing button
    const existing = document.getElementById('quick-sync-btn');
    if (existing) existing.remove();
    
    const button = document.createElement('button');
    button.id = 'quick-sync-btn';
    button.className = 'fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105';
    
    button.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span class="font-semibold">SYNC TO SHEETS</span>
        </div>
    `;
    
    button.addEventListener('click', async () => {
        button.disabled = true;
        button.innerHTML = `
            <div class="flex items-center space-x-2">
                <div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span class="font-semibold">SYNCING...</span>
            </div>
        `;
        
        try {
            await syncNowWithYourSheets();
        } finally {
            button.disabled = false;
            button.innerHTML = `
                <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    <span class="font-semibold">SYNC TO SHEETS</span>
                </div>
            `;
        }
    });
    
    document.body.appendChild(button);
    console.log('✅ Quick sync button created (top-right corner)');
}

// Display current configuration
function showCurrentConfig() {
    const config = `
🔧 CURRENT CONFIGURATION:

📊 Google Sheets:
   ${SPREADSHEET_ID}
   
🔗 Apps Script:
   ${WEBAPP_URL}
   
📋 Data Available:
   • Orders: ${window.allData?.orders?.length || 0}
   • Marketing: ${window.allData?.marketing?.length || 0}
   • Sales Team: ${window.allData?.salesteam?.length || 0}
   
🚀 Ready to sync!
    `;
    
    console.log(config);
    alert(config.trim());
}

// Auto-setup when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.db) {
            console.log('🚀 Auto-configuring with your URLs...');
            
            // Setup auto-sync with your URLs
            setupAutoSyncWithYourURLs();
            
            // Create quick sync button
            createQuickSyncButton();
            
            // Show configuration
            console.log('✅ Ready! Your auto-sync is configured.');
            console.log('📊 Spreadsheet ID:', SPREADSHEET_ID);
            console.log('🔗 Web App URL:', WEBAPP_URL);
            console.log('💡 Use: syncNowWithYourSheets() or click the SYNC button');
        }
    }, 3000);
});

// Make functions available globally
window.syncNowWithYourSheets = syncNowWithYourSheets;
window.testYourConnection = testYourConnection;
window.showCurrentConfig = showCurrentConfig;
window.setupAutoSyncWithYourURLs = setupAutoSyncWithYourURLs;

console.log('🎯 Ready-to-use auto-sync loaded with your URLs!');
console.log('🚀 Try: syncNowWithYourSheets() or click the green SYNC button');

// Verify your Google Apps Script setup
function verifyAppsScriptSetup() {
    const instructions = `
📋 GOOGLE APPS SCRIPT VERIFICATION:

✅ Your Web App URL: ${WEBAPP_URL}

🔧 Please verify in Google Apps Script:

1. Open: script.google.com
2. Find your project with the above URL
3. Ensure this code is in your script:

function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    var data = JSON.parse(e.postData.contents);
    var result = handleRequest(data);
    return output.setContent(JSON.stringify(result));
  } catch (error) {
    return output.setContent(JSON.stringify({
      success: false, 
      error: error.toString()
    }));
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({message: "API is working!"}))
    .setMimeType(ContentService.MimeType.JSON);
}

4. Deploy settings:
   • Execute as: Me
   • Who has access: Anyone

5. Test connection: testYourConnection()
    `;
    
    console.log(instructions);
    return instructions;
}

window.verifyAppsScriptSetup = verifyAppsScriptSetup;

// Quick test function
async function quickTest() {
    console.log('🧪 Running quick test...');
    
    // Test connection
    const connectionOk = await testYourConnection();
    
    if (connectionOk) {
        console.log('✅ Connection test passed');
        
        // Show data counts
        if (window.allData) {
            showCurrentConfig();
        } else {
            console.log('⏳ Data not loaded yet, wait a moment...');
        }
    } else {
        console.log('❌ Connection test failed');
        console.log('📋 Run: verifyAppsScriptSetup() for setup instructions');
    }
}

window.quickTest = quickTest;

console.log('🎯 Run quickTest() to verify everything is working!');