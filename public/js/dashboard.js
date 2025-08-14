// dashboard.js - COMPLETE FIXED VERSION
import { collection, getDocs, query, orderBy, where, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// Import the marketing cost chart functions
import { createMarketingCostChart } from './marketing-cost-chart.js';
import { createMarketingCostPerTeamChart, updateMarketingCostChart } from './marketing-cost-per-team-chart.js';
import { createMarketingROIChart, updateMarketingROIChart } from './marketing-roi-chart.js';
import { createMarketingTimelineChart, updateMarketingTimelineChart } from './marketing-timeline-chart.js';

// Global variables
let charts = {};
let leadDistributionChart = null;
let allData = {
    ecommerce: [],
    marketing: [],
    salesteam: [],
    orders: []
};

// Make allData globally accessible for balance monitor
window.allData = allData;

// Function to save data for balance monitor and caching
function saveDataForBalanceMonitor() {
    try {
        const dataToSave = {
            salesteam: allData.salesteam,
            orders: allData.orders,
            marketing: allData.marketing,
            ecommerce: allData.ecommerce,
            timestamp: new Date().toISOString()
        };
        
        // Save current data to localStorage for balance monitor access
        localStorage.setItem('dashboardAllData', JSON.stringify({
            salesteam: allData.salesteam,
            orders: allData.orders,
            timestamp: new Date().toISOString()
        }));
        
        // Also save as cache for refresh scenarios
        localStorage.setItem('dashboardCache', JSON.stringify(dataToSave));
        
        console.log('💾 Data saved for balance monitor and cache');
    } catch (error) {
        console.warn('⚠️ Could not save data:', error);
    }
}

// Function to check and restore cached data
function checkCachedData() {
    try {
        const cachedDataStr = localStorage.getItem('dashboardCache');
        if (!cachedDataStr) {
            console.log('📦 No cached data found');
            return null;
        }
        
        const cachedData = JSON.parse(cachedDataStr);
        const cacheAge = new Date() - new Date(cachedData.timestamp);
        const maxCacheAge = 10 * 60 * 1000; // 10 minutes
        
        if (cacheAge > maxCacheAge) {
            console.log('📦 Cached data too old, clearing...');
            localStorage.removeItem('dashboardCache');
            return null;
        }
        
        console.log(`📦 Found valid cached data (${Math.round(cacheAge / 1000)}s old):`, {
            orders: cachedData.orders?.length || 0,
            marketing: cachedData.marketing?.length || 0,
            salesteam: cachedData.salesteam?.length || 0,
            ecommerce: cachedData.ecommerce?.length || 0
        });
        
        return {
            orders: cachedData.orders || [],
            marketing: cachedData.marketing || [],
            salesteam: cachedData.salesteam || [],
            ecommerce: cachedData.ecommerce || []
        };
        
    } catch (error) {
        console.warn('Error checking cached data:', error);
        localStorage.removeItem('dashboardCache');
        return null;
    }
}

// Check chart preferences on page load
function checkChartPreferences() {
    try {
        const timelineConfig = localStorage.getItem('marketingTimelineChartConfig');
        const currentVersion = localStorage.getItem('chartVersion');
        
        if (timelineConfig) {
            const config = JSON.parse(timelineConfig);
            console.log('🔧 Page Load - Found Marketing Timeline Chart Preference:', config);
            
            // Check version compatibility
            if (config.version !== '3.0') {
                console.log('⚠️ Old chart version detected, will be updated to v3.0');
            } else {
                console.log('✅ Chart version v3.0 is current');
            }
            
            if (config.type === 'bar' && config.format === 'cold_warm_hot_breakdown') {
                console.log('✅ Marketing Timeline will load as BAR CHART with lead breakdown');
            }
        } else {
            console.log('⚠️ No saved chart preferences found - will create default bar chart v3.0');
        }
        
        // Force chart update to latest version
        console.log('📊 Dashboard v3.0 - Charts will use latest configuration');
        
    } catch (error) {
        console.warn('⚠️ Error checking chart preferences:', error);
    }
}

let currentFilters = {
    startDate: null,
    endDate: null,
    agent: null,
    period: 30 // default 30 days
};

// Make currentFilters accessible globally for Power Metrics
window.currentFilters = currentFilters;

// Console filter to reduce spam (debug mode can be enabled via localStorage)
const originalConsoleLog = console.log;
const debugMode = localStorage.getItem('dashboardDebugMode') === 'true';

console.log = function(...args) {
    // Only show important logs, filter out repetitive debug messages
    const message = args.join(' ');
    
    // Allow important logs
    if (debugMode || 
        message.includes('🚀') || 
        message.includes('✅') || 
        message.includes('❌') || 
        message.includes('⚠️') ||
        message.includes('Error') ||
        message.includes('WARNING') ||
        message.includes('FATAL')) {
        originalConsoleLog.apply(console, args);
    }
    // Filter out repetitive debug messages
};

// Functions to control debug mode
window.enableDebugMode = function() {
    localStorage.setItem('dashboardDebugMode', 'true');
    console.log('🐛 Debug mode enabled. Refresh page to see all logs.');
};

window.disableDebugMode = function() {
    localStorage.setItem('dashboardDebugMode', 'false');
    console.log('🔇 Debug mode disabled. Refresh page to filter logs.');
};

// Add manual refresh function for debugging
window.debugPowerMetrics = async function() {
    // DEBUG: Manual Power Metrics Debug (disabled to reduce console spam)
    // console.log('🔄 Manual Power Metrics Debug');
    // console.log('Current allData.salesteam:', allData.salesteam.length, 'records');
    
    // Re-fetch data
    await fetchAllData();
    
    // Re-apply filters
    applyFilters();
    
    // console.log('After refresh - allData.salesteam:', allData.salesteam.length, 'records');
};

// Add specific debug for team wiyah
window.debugWiyahData = function() {
    console.log('🔍 DEBUGGING WIYAH DATA SPECIFICALLY:');
    console.log('Current filters:', window.currentFilters);
    
    const allPowerMetrics = allData.salesteam.filter(item => item.type === 'power_metrics');
    // console.log(`Total power_metrics records: ${allPowerMetrics.length}`);
    
    // Find all records that might match "wiyah"
    const wiyahRecords = allPowerMetrics.filter(item => {
        const agentName = (item.agent_name || item.team || '').toLowerCase();
        return agentName.includes('wiyah') || agentName.includes('wiya');
    });
    
    console.log(`Records containing 'wiyah': ${wiyahRecords.length}`);
    wiyahRecords.forEach((record, index) => {
        console.log(`   [${index + 1}] Agent: "${record.agent_name || record.team}" | Sale: RM ${record.total_sale_bulan} | Date: ${record.tarikh}`);
    });
    
    // Check exact agent names
    console.log('All unique agent names in power_metrics:');
    const uniqueAgents = [...new Set(allPowerMetrics.map(item => item.agent_name || item.team || 'Unknown'))];
    uniqueAgents.forEach(agent => {
        console.log(`   - "${agent}"`);
    });
};

// Add function to manually test Power Metrics UI update
window.testPowerMetricsUI = function(agentName = 'wiyah') {
    console.log(`🔧 TESTING Power Metrics UI for agent: ${agentName}`);
    
    // Set the filter manually
    window.currentFilters.agent = agentName;
    console.log('Set currentFilters.agent to:', window.currentFilters.agent);
    
    // Get filtered data
    const filteredSalesTeam = allData.salesteam.filter(item => {
        if (item.type !== 'power_metrics') return true; // Keep non-power-metrics data
        
        // For power metrics, filter by agent
        const itemAgent = item.agent_name || item.team || '';
        return itemAgent.toLowerCase() === agentName.toLowerCase();
    });
    
    console.log(`Filtered salesteam data: ${filteredSalesTeam.length} records`);
    
    // Call the update function directly
    updateEnhancedPowerMetricsDisplay(filteredSalesTeam);
    
    console.log('✅ Manual UI update completed. Check Power Metrics display.');
};

// Setup page visibility handlers to maintain progress bars on navigation
function setupPageVisibilityHandlers() {
    console.log('🔄 Setting up page visibility handlers...');
    
    // Handle page visibility changes (tab switching, back/forward)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.allData) {
            console.log('📊 Page became visible, refreshing Power Metrics...');
            // Re-apply current filters to refresh all data including progress bars
            setTimeout(() => {
                if (window.currentFilters && window.allData) {
                    const filteredData = getFilteredData();
                    updateEnhancedPowerMetricsDisplay(filteredData.salesteam);
                }
            }, 100);
        }
    });
    
    // Handle page show event (back/forward navigation)
    window.addEventListener('pageshow', (event) => {
        console.log('📊 Page show event, refreshing Power Metrics...', event.persisted);
        if (window.allData) {
            setTimeout(() => {
                if (window.currentFilters && window.allData) {
                    const filteredData = getFilteredData();
                    updateEnhancedPowerMetricsDisplay(filteredData.salesteam);
                }
            }, 200);
        }
    });
    
    // Handle focus event when returning to the page
    window.addEventListener('focus', () => {
        if (window.allData) {
            console.log('📊 Window focused, refreshing Power Metrics...');
            setTimeout(() => {
                if (window.currentFilters && window.allData) {
                    const filteredData = getFilteredData();
                    updateEnhancedPowerMetricsDisplay(filteredData.salesteam);
                }
            }, 150);
        }
    });
    
    // Handle popstate event (browser back/forward navigation)
    window.addEventListener('popstate', () => {
        if (window.allData) {
            console.log('📊 Popstate event (browser navigation), refreshing Power Metrics...');
            setTimeout(() => {
                if (window.currentFilters && window.allData) {
                    const filteredData = getFilteredData();
                    updateEnhancedPowerMetricsDisplay(filteredData.salesteam);
                }
            }, 300);
        }
    });
    
    console.log('✅ Page visibility handlers setup complete');
}

// Setup periodic refresh for Power Metrics to prevent disappearing progress bars
function setupPeriodicPowerMetricsRefresh() {
    console.log('⏰ Setting up periodic Power Metrics refresh...');
    
    // Refresh Power Metrics every 30 seconds to maintain progress bars
    const refreshInterval = setInterval(() => {
        // Only refresh if the page is visible and data is available
        if (!document.hidden && window.allData && document.getElementById('monthly-progress-bar')) {
            const monthlyBar = document.getElementById('monthly-progress-bar');
            const mtdBar = document.getElementById('mtd-progress-bar');
            
            // Check if progress bars are visible (have width)
            const monthlyWidth = monthlyBar.style.width;
            const mtdWidth = mtdBar.style.width;
            
            // If progress bars are missing their width, refresh them
            if (!monthlyWidth || monthlyWidth === '0%' || !mtdWidth || mtdWidth === '0%') {
                console.log('📊 Progress bars missing, refreshing Power Metrics...');
                
                const filteredData = getFilteredData();
                updateEnhancedPowerMetricsDisplay(filteredData.salesteam);
            }
        }
    }, 30000); // Every 30 seconds
    
    // Store interval ID for cleanup if needed
    window.powerMetricsRefreshInterval = refreshInterval;
    
    console.log('✅ Periodic Power Metrics refresh setup complete');
}

// Helper function to get filtered data based on current filters
function getFilteredData() {
    if (!window.allData || !window.currentFilters) {
        return { salesteam: [] };
    }
    
    const filtered = { salesteam: [] };
    
    // Apply current agent filter if set
    if (window.currentFilters.agent) {
        filtered.salesteam = window.allData.salesteam.filter(item => {
            if (item.type === 'power_metrics') {
                const itemAgent = item.agent_name || item.team || '';
                return itemAgent.toLowerCase().includes(window.currentFilters.agent.toLowerCase());
            }
            return true; // Keep non-power-metrics data
        });
    } else {
        filtered.salesteam = [...window.allData.salesteam];
    }
    
    return filtered;
}

// Add function to test progress bars specifically
window.testProgressBars = function() {
    console.log('🔧 TESTING Progress Bars...');
    
    // Get progress bar elements
    const monthlyBar = document.getElementById('monthly-progress-bar');
    const mtdBar = document.getElementById('mtd-progress-bar');
    const monthlyText = document.getElementById('monthly-progress-text');
    const mtdText = document.getElementById('mtd-progress-text');
    
    console.log('Progress bar elements:');
    console.log(`   monthly-progress-bar: ${!!monthlyBar}`);
    console.log(`   mtd-progress-bar: ${!!mtdBar}`);
    console.log(`   monthly-progress-text: ${!!monthlyText}`);
    console.log(`   mtd-progress-text: ${!!mtdText}`);
    
    if (monthlyBar && mtdBar) {
        // Test with sample values
        const testMonthly = 65.5; // 65.5%
        const testMTD = 78.2; // 78.2%
        
        monthlyBar.style.width = `${testMonthly}%`;
        monthlyBar.style.background = 'linear-gradient(90deg, #f59e0b, #3b82f6)';
        monthlyBar.className = 'progress-fill monthly-progress';
        
        mtdBar.style.width = `${testMTD}%`;
        mtdBar.style.background = 'linear-gradient(90deg, #10b981, #8b5cf6)';
        mtdBar.className = 'progress-fill mtd-progress';
        
        if (monthlyText) monthlyText.textContent = `${testMonthly}% (RM 32,750 / RM 50,000)`;
        if (mtdText) mtdText.textContent = `${testMTD}% (RM 15,640 / RM 20,000)`;
        
        console.log('✅ Progress bars updated with test values');
        console.log(`   Monthly: ${testMonthly}% width`);
        console.log(`   MTD: ${testMTD}% width`);
    } else {
        console.error('❌ Progress bar elements not found');
    }
};

// Add function to force refresh Power Metrics (for debugging)
window.forceRefreshPowerMetrics = function() {
    console.log('🔄 FORCE REFRESH Power Metrics...');
    
    if (!window.allData) {
        console.error('❌ allData not available');
        return;
    }
    
    const filteredData = getFilteredData();
    updateEnhancedPowerMetricsDisplay(filteredData.salesteam);
    
    console.log('✅ Power Metrics force refreshed');
};

// Add function to check and fix missing progress bars
window.checkAndFixProgressBars = function() {
    console.log('🔍 CHECKING Progress Bars Status...');
    
    const monthlyBar = document.getElementById('monthly-progress-bar');
    const mtdBar = document.getElementById('mtd-progress-bar');
    
    if (!monthlyBar || !mtdBar) {
        console.error('❌ Progress bar elements not found in DOM');
        return;
    }
    
    console.log('Progress bar status:');
    console.log(`   Monthly bar width: "${monthlyBar.style.width}"`);
    console.log(`   MTD bar width: "${mtdBar.style.width}"`);
    console.log(`   Monthly bar class: "${monthlyBar.className}"`);
    console.log(`   MTD bar class: "${mtdBar.className}"`);
    
    const monthlyWidth = monthlyBar.style.width;
    const mtdWidth = mtdBar.style.width;
    
    if (!monthlyWidth || monthlyWidth === '0%' || !mtdWidth || mtdWidth === '0%') {
        console.log('⚠️ Progress bars missing width, attempting fix...');
        window.forceRefreshPowerMetrics();
    } else {
        console.log('✅ Progress bars appear to be working correctly');
    }
};

// Add function to check all Power Metrics DOM elements
window.checkPowerMetricsElements = function() {
    console.log('🔍 CHECKING Power Metrics DOM Elements:');
    
    const elementIds = [
        'kpi-harian', 'kpi-mtd', 'sale-mtd', 'balance-bulanan',
        'balance-mtd', 'bilangan-terjual', 'total-close-rate',
        'working-days-info', 'monthly-progress-text', 'mtd-progress-text',
        'monthly-progress-bar', 'mtd-progress-bar'
    ];
    
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ ${id}: "${element.textContent}"`);
        } else {
            console.log(`❌ ${id}: NOT FOUND`);
        }
    });
};

// Add function to test all teams in Power Metrics
window.testAllTeams = function() {
    console.log('🧪 TESTING ALL TEAMS in Power Metrics:');
    
    const allPowerMetrics = allData.salesteam.filter(item => item.type === 'power_metrics');
    const uniqueTeams = [...new Set(allPowerMetrics.map(item => item.agent_name || item.team || 'Unknown'))];
    
    console.log(`Found ${uniqueTeams.length} unique teams:`, uniqueTeams);
    
    uniqueTeams.forEach(team => {
        console.log(`\n🔧 Testing team: "${team}"`);
        
        // Set filter
        window.currentFilters.agent = team;
        
        // Get filtered data
        const filteredData = allData.salesteam.filter(item => {
            if (item.type !== 'power_metrics') return true;
            const itemAgent = item.agent_name || item.team || '';
            return itemAgent.toLowerCase() === team.toLowerCase();
        });
        
        const powerMetricsCount = filteredData.filter(item => item.type === 'power_metrics').length;
        console.log(`   Power metrics records for ${team}: ${powerMetricsCount}`);
        
        // Test calculation
        if (powerMetricsCount > 0) {
            const calculator = new EnhancedPowerMetricsCalculator([0,1,2,3,4,6]);
            const metrics = calculator.calculateAllMetrics(filteredData);
            console.log(`   Sale MTD for ${team}: RM ${metrics.saleMTD.toLocaleString()}`);
        }
    });
    
    console.log('\n✅ All teams testing completed');
};

// Add function to force refresh and test filtering
window.forceRefreshAndFilter = async function(teamName) {
    console.log(`🔄 FORCE REFRESH AND FILTER for team: ${teamName}`);
    
    // Re-fetch all data
    await fetchAllData();
    
    // Re-populate agent filter
    populateAgentFilter();
    
    // Set the enhanced filter manually
    if (window.advancedDashboardFilter) {
        console.log('Setting enhanced filter...');
        const agentSelect = document.getElementById('agent-filter-enhanced');
        if (agentSelect) {
            agentSelect.value = teamName;
            // Trigger change event
            agentSelect.dispatchEvent(new Event('change'));
        }
        
        // Apply the filter
        if (window.advancedDashboardFilter.applyFilters) {
            window.advancedDashboardFilter.applyFilters();
        }
    } else {
        // Fallback - set current filters manually and apply
        window.currentFilters.agent = teamName;
        applyFilters();
    }
    
    console.log(`✅ Force refresh and filter completed for: ${teamName}`);
};
// EXACT CHANGES FOR dashboard.js
// Add these sections to your existing dashboard.js file

// ============================================================================
// 1. ADD THESE GLOBAL VARIABLES (after existing global variables)
// ============================================================================


// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard v3.0...');
    
    // Check for version updates and clear cache if needed
    try {
        const currentVersion = '3.0';
        const storedVersion = localStorage.getItem('dashboardVersion');
        
        if (storedVersion !== currentVersion) {
            console.log(`🔄 Version update detected: ${storedVersion} → ${currentVersion}`);
            
            // Clear all caches on version change
            if (window.caches) {
                window.caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                        console.log('🗑️ Clearing cache on version update:', cacheName);
                        window.caches.delete(cacheName);
                    });
                });
            }
            
            // Clear localStorage cache
            localStorage.removeItem('dashboardCache');
            localStorage.removeItem('dashboardAllData');
            
            // Update stored version
            localStorage.setItem('dashboardVersion', currentVersion);
            
            console.log('🔄 Cache cleared for version update');
        }
        
        // Force service worker update check and cache refresh
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    registration.update();
                    console.log('🔄 Service worker update check triggered');
                    
                    // Force cache bypass for critical resources
                    const criticalResources = [
                        '/js/dashboard.js',
                        '/js/firebase-config.js',
                        '/js/professional-charts-config.js'
                    ];
                    
                    criticalResources.forEach(resource => {
                        fetch(resource + '?v=' + currentVersion + '&t=' + Date.now(), {
                            cache: 'no-cache'
                        }).then(() => {
                            console.log(`🔄 Force refreshed: ${resource}`);
                        }).catch(error => {
                            console.warn(`⚠️ Failed to refresh ${resource}:`, error);
                        });
                    });
                }
            });
        }
        
    } catch (error) {
        console.warn('⚠️ Cache management failed:', error);
    }
    
    // Check chart preferences immediately on page load
    checkChartPreferences();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Add page visibility event listeners to handle back/forward navigation
    setupPageVisibilityHandlers();
    
    // Check if we have cached data first
    const cachedData = checkCachedData();
    if (cachedData) {
        console.log('📦 Found cached data, initializing with cache...');
        allData = cachedData;
        window.allData = allData;
        initializeDashboard();
    }
    
    // Listen for Firebase ready event if available
    document.addEventListener('firebase-ready', () => {
        console.log('🔥 Firebase ready event received');
        handleFirebaseReady(cachedData);
    });
    
    // Also listen for custom Firebase initialization event
    window.addEventListener('firebase-initialized', () => {
        console.log('🔥 Firebase initialized event received');
        handleFirebaseReady(cachedData);
    });
    
    // Wait for Firebase to be ready with better error handling
    let attempts = 0;
    const maxAttempts = 150; // 15 seconds max wait (longer for slow connections)
    
    const checkFirebase = setInterval(() => {
        attempts++;
        
        // Check less frequently after initial attempts
        const interval = attempts > 50 ? 500 : 100;
        
        if (attempts % 10 === 0) {
            console.log(`🔥 Checking Firebase... Attempt ${attempts}/${maxAttempts}`);
        }
        
        if (window.db) {
            console.log('Firebase ready, initializing dashboard...');
            clearInterval(checkFirebase);
            handleFirebaseReady(cachedData);
        } else if (attempts >= maxAttempts) {
            console.error('❌ Firebase initialization timeout after 15 seconds');
            clearInterval(checkFirebase);
            
            // If we have cached data, use that instead of error state
            if (cachedData) {
                console.log('⚠️ Firebase timeout, continuing with cached data');
            } else {
                console.log('⚠️ No Firebase and no cached data, showing error state');
                showErrorState();
            }
        }
    }, 100);
    
    // Function to handle Firebase ready state
    function handleFirebaseReady(cachedData) {
        if (window.firebaseHandled) return; // Prevent multiple calls
        window.firebaseHandled = true;
        
        // If we already initialized with cache, just refresh data
        if (cachedData) {
            console.log('🔄 Refreshing data from Firebase...');
            fetchAllData().then(() => {
                applyFilters(); // Re-apply with fresh data
                console.log('✅ Data refreshed from Firebase');
            }).catch(error => {
                console.error('❌ Failed to refresh data from Firebase:', error);
            });
        } else {
            console.log('🚀 Initializing dashboard with Firebase...');
            initializeDashboard();
        }
    }
    
});

function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.add('-translate-x-full');
            }
        });
    }
}

// 6. ADD console logging for debugging
async function initializeDashboard() {
    try {
        console.log('🚀 Starting enhanced dashboard initialization...');
        
        // Step 1: Show loading state
        console.log('📋 Step 1: Setting loading state...');
        showLoadingState();
        
        // Step 2: Setup filters
        console.log('📋 Step 2: Setting up filters...');
        setupFilters();
        
        // Step 3: Setup period buttons
        console.log('📋 Step 3: Setting up period buttons...');
        setupPeriodButtons();
        
        // Step 4: Fetch all data
        console.log('📋 Step 4: Fetching data from Firebase...');
        try {
            await fetchAllData();
            console.log('   ✅ Data fetched successfully');
        } catch (fetchError) {
            console.error('   ❌ Data fetch failed:', fetchError.message);
            
            // If it's a collection reference error, provide specific guidance
            if (fetchError.message.includes('CollectionReference') || 
                fetchError.message.includes('DocumentReference') || 
                fetchError.message.includes('FirebaseFirestore')) {
                console.error('🔥 Firestore Collection Error Detected:');
                console.error('   This usually means:');
                console.error('   1. Firebase not properly initialized');
                console.error('   2. Collection name is invalid');
                console.error('   3. Import statements are missing');
                
                // Run diagnostic
                console.log('\n🔍 Running Firestore diagnostic...');
                if (window.debugFirestoreConnection) {
                    window.debugFirestoreConnection();
                }
            }
            
            throw fetchError; // Re-throw to be caught by main try-catch
        }
        
        // Step 5: Validate data
        console.log('📋 Step 5: Validating data...');
        const dataValidation = {
            orders: allData.orders?.length || 0,
            marketing: allData.marketing?.length || 0,
            salesteam: allData.salesteam?.length || 0,
            marketingLeadSemasa: allData.marketing?.filter(item => item.type === 'lead_semasa').length || 0,
            salesteamLeads: allData.salesteam?.filter(item => item.type === 'lead').length || 0,
            powerMetrics: allData.salesteam?.filter(item => item.type === 'power_metrics').length || 0
        };
        
        console.log('📊 Data loaded:', dataValidation);
        
        if (dataValidation.orders === 0 && dataValidation.marketing === 0 && dataValidation.salesteam === 0) {
            console.warn('⚠️ No data found in any collection. Dashboard will show sample data.');
        }
        
        // Step 6: Make allData available globally
        console.log('📋 Step 6: Making data globally available...');
        window.allData = allData;
        console.log('📊 allData made available globally for charts');
        
        // Step 7: Initialize chart filters
        console.log('📋 Step 7: Initializing chart filters...');
        if (window.initChartFilters) {
            window.initChartFilters(allData);
            console.log('   ✅ Chart filters initialized');
            
            // Double-check filter population after initialization
            setTimeout(() => {
                if (window.chartFiltersManager && window.chartFiltersManager.teamOptions.size === 0) {
                    console.log('🔄 Chart filters appear empty, attempting refresh...');
                    window.refreshChartFilters();
                    
                    // If still empty after refresh, schedule additional attempts
                    setTimeout(() => {
                        if (window.chartFiltersManager && window.chartFiltersManager.teamOptions.size === 0) {
                            console.log('🔄 Second attempt to refresh chart filters...');
                            window.refreshChartFilters();
                        }
                    }, 2000);
                }
            }, 1000);
        } else {
            console.warn('   ⚠️ initChartFilters not available');
        }
        
        // Step 8: Populate agent filter
        console.log('📋 Step 8: Populating agent filter...');
        populateAgentFilter();
        console.log('   ✅ Agent filter populated');
        
        // Step 9: Apply filters and display data
        console.log('📋 Step 9: Applying filters and updating UI...');
        try {
            applyFilters(); // This will create filteredData internally
            console.log('   ✅ Filters applied and UI updated');
        } catch (error) {
            console.error('   ❌ Error applying filters:', error);
            // Try manual KPI update
            try {
                updateKPIs(allData);
                console.log('   ✅ Manual KPI update successful');
            } catch (kpiError) {
                console.error('   ❌ Manual KPI update failed:', kpiError);
            }
        }
        
        // Step 10: Initialize Power Metrics
        console.log('📋 Step 10: Initializing Power Metrics...');
        try {
            updateEnhancedPowerMetricsDisplay(allData.salesteam);
            console.log('   ✅ Power Metrics initialized');
        } catch (error) {
            console.error('   ❌ Power Metrics initialization failed:', error);
        }
        
        // Setup real-time updates
        updateCurrentTime();
        setInterval(updateCurrentTime, 60000); // Update every minute
        
        // Setup periodic refresh for Power Metrics to prevent disappearing progress bars
        setupPeriodicPowerMetricsRefresh();
        
        // Step 11: Initialize charts
        console.log('📋 Step 11: Initializing charts...');
        try {
            if (window.ProfessionalCharts) {
                console.log('   🎨 Using Professional Charts');
                // Main charts
                createMarketingCostPerTeamChart(allData);
                createMarketingROIChart(allData);
                createMarketingTimelineChart(allData);
                // Secondary charts
                window.ProfessionalCharts.updateLeadSourcesChart(allData);
                window.ProfessionalCharts.updateChannelChart(allData);
                window.ProfessionalCharts.updateTeamChart(allData);
                console.log('   ✅ Professional charts initialized');
            } else {
                console.log('   🎨 Using Fallback Charts');
                // Fallback to original charts if professional charts not loaded
                createMarketingCostPerTeamChart(allData);
                createMarketingROIChart(allData);
                createMarketingTimelineChart(allData);
                updateLeadsOnlyChart(allData);
                updateChannelChart(allData);
                updateTeamChart(allData);
                console.log('   ✅ Fallback charts initialized');
            }
        } catch (chartError) {
            console.error('   ❌ Chart initialization failed:', chartError);
        }
        
        // Initialize marketing cost chart (this is async)
        try {
            await createMarketingCostChart();
            await updateMarketingCostChart(allData);
        } catch (error) {
            console.warn('⚠️ Marketing cost chart initialization failed:', error);
        }
        
        console.log('✅ Enhanced dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        showErrorState();
    }
}

// 6. ADD helper function to make filter functions globally available
window.filterByDate = filterByDate;
window.filterSalesTeamData = filterSalesTeamData;
window.applyFilters = applyFilters;

// 8. ADD event listeners for manual refresh
document.addEventListener('DOMContentLoaded', () => {
    // Add refresh button to marketing cost chart if it exists
    setTimeout(() => {
        const costChartCard = document.querySelector('.enhanced-cost-chart');
        if (costChartCard) {
            const chartHeader = costChartCard.querySelector('.chart-header .header-left');
            if (chartHeader && !chartHeader.querySelector('.refresh-btn')) {
                const refreshBtn = document.createElement('button');
                refreshBtn.className = 'refresh-btn ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700';
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i>Refresh';
                refreshBtn.title = 'Refresh cost analysis with current filters';
                
                refreshBtn.addEventListener('click', async () => {
                    const originalText = refreshBtn.innerHTML;
                    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Loading...';
                    refreshBtn.disabled = true;
                    
                    try {
                        await window.refreshMarketingCostChart();
                    } finally {
                        refreshBtn.innerHTML = originalText;
                        refreshBtn.disabled = false;
                    }
                });
                
                chartHeader.appendChild(refreshBtn);
            }
        }
    }, 2000); // Wait 2 seconds for DOM to be ready
});

/* // Add styles to document head
if (!document.getElementById('refresh-btn-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'refresh-btn-styles';
    styleElement.innerHTML = refreshButtonStyles;
    document.head.appendChild(styleElement);
} */

console.log('✅ Dashboard integration updates loaded');
console.log('🔧 Available commands:');
console.log('  - refreshMarketingCostChart() : Manually refresh the cost chart');
console.log('  - debugMarketingCost() : Debug marketing cost data and chart');
console.log('  - debugMarketingCostChart() : Debug chart creation process');

// 7. ADD helper function to verify data structure
function verifyDataStructure() {
    console.log('🔍 === DATA STRUCTURE VERIFICATION ===');
    
    if (!allData) {
        console.log('❌ allData is not available');
        return false;
    }
    
    // Check marketing data
    const marketingLeadSemasa = allData.marketing?.filter(item => item.type === 'lead_semasa') || [];
    console.log('📢 Marketing Lead Semasa records:', marketingLeadSemasa.length);
    
    if (marketingLeadSemasa.length > 0) {
        console.log('📋 Sample Marketing Lead Semasa:', marketingLeadSemasa[0]);
    }
    
    // Check sales team data
    const salesteamLeads = allData.salesteam?.filter(item => item.type === 'lead') || [];
    console.log('👥 Sales Team Lead records:', salesteamLeads.length);
    
    if (salesteamLeads.length > 0) {
        console.log('📋 Sample Sales Team Lead:', salesteamLeads[0]);
    }
    
    console.log('🔍 === END VERIFICATION ===');
    return true;
}

// DENGAN INI:
function setupFilters() {
    // Only setup if old filter elements exist
    const startDateEl = document.getElementById('start-date');
    const endDateEl = document.getElementById('end-date');
    
    if (!startDateEl || !endDateEl) {
        console.log('Enhanced filter detected, skipping old filter setup');
        return;
    }
    
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    startDateEl.value = thirtyDaysAgo.toISOString().split('T')[0];
    endDateEl.value = today.toISOString().split('T')[0];

    // Event listeners
    document.getElementById('apply-filter').addEventListener('click', applyFilters);
    document.getElementById('clear-filter').addEventListener('click', clearFilters);
    
    // Auto-apply on change
    document.getElementById('start-date').addEventListener('change', applyFilters);
    document.getElementById('end-date').addEventListener('change', applyFilters);
    document.getElementById('agent-filter').addEventListener('change', applyFilters);
}

function setupPeriodButtons() {
    const periodBtns = document.querySelectorAll('.period-btn');
    
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update button states
            periodBtns.forEach(b => {
                b.className = 'text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded period-btn';
            });
            btn.className = 'text-xs bg-blue-600 text-white px-3 py-1 rounded period-btn';
            
            // Update period and refresh chart
            currentFilters.period = parseInt(btn.dataset.period);
            updateMarketingCostChart(currentFilters.period);
        });
    });
}

async function fetchAllData() {
    // Validate Firestore database connection
    const db = window.db;
    
    if (!db) {
        throw new Error('Firestore database not initialized. window.db is undefined.');
    }
    
    try {
        console.log('Fetching data from Firestore...');
        
        // Fetch collections with error handling - including powerMetrics collection
        const collections = ['orderData', 'marketingData', 'salesTeamData', 'powerMetrics'];
        const results = {};
        
        for (const collectionName of collections) {
            try {
                console.log(`Fetching ${collectionName}...`);
                
                // Validate collection name
                if (!collectionName || typeof collectionName !== 'string') {
                    throw new Error(`Invalid collection name: ${collectionName}`);
                }
                
                // Create collection reference with validation
                const collectionRef = collection(db, collectionName);
                if (!collectionRef) {
                    throw new Error(`Failed to create collection reference for: ${collectionName}`);
                }
                
                const snapshot = await getDocs(collectionRef);
                results[collectionName] = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                }));
                console.log(`${collectionName}: ${results[collectionName].length} documents`);
                
                // DEBUG: Log sample documents for each collection
                if (results[collectionName].length > 0) {
                    const sample = results[collectionName][0];
                    console.log(`   Sample ${collectionName} document:`, {
                        id: sample.id,
                        type: sample.type,
                        keys: Object.keys(sample).slice(0, 5)
                    });
                }
            } catch (error) {
                console.warn(`Error fetching ${collectionName}:`, error);
                results[collectionName] = [];
            }
        }

        // Assign to global data with correct mapping
        allData.orders = results.orderData || [];
        allData.marketing = results.marketingData || [];
        allData.salesteam = results.salesTeamData || [];
        
        // If powerMetrics collection exists, merge it into salesteam data
        if (results.powerMetrics && results.powerMetrics.length > 0) {
            console.log(`📊 Found ${results.powerMetrics.length} records in powerMetrics collection`);
            // Add type: 'power_metrics' to each record if not present
            const powerMetricsWithType = results.powerMetrics.map(item => ({
                ...item,
                type: item.type || 'power_metrics'
            }));
            allData.salesteam = [...allData.salesteam, ...powerMetricsWithType];
        }
        
        // DEBUG: Log power metrics data specifically
        const powerMetricsFromSalesTeam = allData.salesteam.filter(item => item.type === 'power_metrics');
        console.log('🔍 POWER METRICS DEBUG:');
        console.log(`   Total salesteam records: ${allData.salesteam.length}`);
        console.log(`   Power metrics records: ${powerMetricsFromSalesTeam.length}`);
        powerMetricsFromSalesTeam.forEach((item, index) => {
            console.log(`   [${index + 1}] Agent: ${item.agent_name || item.team || 'Unknown'} | Sale: RM ${item.total_sale_bulan || 0} | Date: ${item.tarikh || item.createdAt || 'No date'}`);
        });
        allData.ecommerce = []; // Currently not using separate ecommerce collection

        console.log('Final data counts:', {
            orders: allData.orders.length,
            marketing: allData.marketing.length,
            salesteam: allData.salesteam.length
        });

        // Show message if no data
        const totalRecords = allData.orders.length + allData.marketing.length + allData.salesteam.length;
        
        if (totalRecords === 0) {
            showNoDataState();
        } else {
            // Save data for balance monitor access
            saveDataForBalanceMonitor();
            
            // Notify balance monitor of data update
            window.dispatchEvent(new CustomEvent('dashboardDataUpdated', {
                detail: { salesteam: allData.salesteam.length }
            }));
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// DENGAN INI:
function populateAgentFilter() {
    // Get unique agents from all data sources - more comprehensive
    const agents = new Set();
    
    // Extract from salesteam data
    if (allData.salesteam && Array.isArray(allData.salesteam)) {
        allData.salesteam.forEach(item => {
            const agent = item.agent || item.team || item.agent_name || item.sales_agent;
            if (agent && typeof agent === 'string' && agent.trim() && agent !== 'undefined') {
                agents.add(agent.trim());
            }
        });
    }
    
    // Extract from marketing data
    if (allData.marketing && Array.isArray(allData.marketing)) {
        allData.marketing.forEach(item => {
            const agent = item.agent || item.team || item.agent_name || item.sales_agent || item.team_sale;
            if (agent && typeof agent === 'string' && agent.trim() && agent !== 'undefined') {
                agents.add(agent.trim());
            }
        });
    }
    
    // Extract from orders data
    if (allData.orders && Array.isArray(allData.orders)) {
        allData.orders.forEach(item => {
            const agent = item.sales_agent || item.agent || item.team || item.agent_name;
            if (agent && typeof agent === 'string' && agent.trim() && agent !== 'undefined') {
                agents.add(agent.trim());
            }
        });
    }
    
    const agentArray = Array.from(agents).sort();
    console.log('📊 Populating agent filter with agents:', agentArray);
    
    // Populate ALL possible agent filter elements
    const agentSelectors = ['agent-filter', 'agent-filter-enhanced', 'lead-team-filter'];
    
    agentSelectors.forEach(selectorId => {
        const agentSelect = document.getElementById(selectorId);
        if (agentSelect) {
            // Clear and repopulate
            agentSelect.innerHTML = '<option value="">Semua Agent</option>';
            agentArray.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent;
                option.textContent = agent;
                agentSelect.appendChild(option);
            });
            console.log(`✅ Populated ${selectorId} with ${agentArray.length} agents`);
        }
    });
    
    // Also try enhanced population if available
    if (window.populateEnhancedAgentFilter) {
        window.populateEnhancedAgentFilter(agentArray);
    }
}

function applyFilters() {
    // Get enhanced filter values first (if available)
    let startDate = '';
    let endDate = '';
    let selectedAgent = '';
    
    if (window.getEnhancedFilterSelection) {
        const enhanced = window.getEnhancedFilterSelection();
        startDate = enhanced.startDate || '';
        endDate = enhanced.endDate || '';
        selectedAgent = enhanced.agent || '';
        console.log('📊 Enhanced filter values:', enhanced);
        console.log(`🎯 Selected agent for filtering: "${selectedAgent}"`);
    } else {
        // Fallback to old filter inputs
        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        const agentFilterEl = document.getElementById('agent-filter');
        
        startDate = startDateEl?.value || '';
        endDate = endDateEl?.value || '';
        selectedAgent = agentFilterEl?.value || '';
    }

    // ✅ CREATE filteredData here
    const filteredData = {
        orders: filterByDate(allData.orders, startDate, endDate),
        marketing: filterByDate(allData.marketing, startDate, endDate),
        salesteam: filterSalesTeamData(allData.salesteam, startDate, endDate, selectedAgent),
        ecommerce: filterByDate(allData.ecommerce, startDate, endDate)
    };

    // Update displays
    updateActiveFiltersDisplay();
    updateKPIs(filteredData);
    updateCharts(filteredData);
    updateRecentActivity(filteredData);
    
    // DEBUG: Log data being passed to Power Metrics during applyFilters
    console.log('🔄 CALLING updateEnhancedPowerMetricsDisplay from applyFilters:');
    console.log(`   Total salesteam records: ${filteredData.salesteam.length}`);
    const powerMetricsInFiltered = filteredData.salesteam.filter(item => item.type === 'power_metrics');
    console.log(`   Power metrics in filtered data: ${powerMetricsInFiltered.length}`);
    console.log(`   Current agent filter: "${currentFilters.agent}"`);
    powerMetricsInFiltered.forEach(item => {
        console.log(`     - ${item.agent_name || item.team}: RM ${item.total_sale_bulan} (${item.tarikh})`);
    });
    
    updateEnhancedPowerMetricsDisplay(filteredData.salesteam);
    
    // Update marketing budget and lead efficiency
    updateMarketingBudgetDisplay(filteredData.marketing);
    updateLeadEfficiencyDisplay(filteredData.salesteam);

    // UPDATE: Add this line at the end of applyFilters function
    updateTeamDisplay(); // <-- TAMBAH LINE INI
    
    // Refresh power metrics with updated target
    updateEnhancedPowerMetricsDisplay(filteredData.salesteam);
    
    // Update professional charts with filtered data
    if (window.ProfessionalCharts) {
        // Main charts
        createMarketingCostPerTeamChart(filteredData);
        createMarketingROIChart(filteredData);
        createMarketingTimelineChart(filteredData);
        // Secondary charts
        window.ProfessionalCharts.updateLeadSourcesChart(filteredData);
        window.ProfessionalCharts.updateChannelChart(filteredData);
        window.ProfessionalCharts.updateTeamChart(filteredData);
    } else {
        // Fallback to original chart function
        createMarketingCostPerTeamChart(filteredData);
        createMarketingROIChart(filteredData);
        createMarketingTimelineChart(filteredData);
        updateLeadsOnlyChart(filteredData);
        updateChannelChart(filteredData); // Fallback for Revenue by Channel
        updateTeamChart(filteredData); // Fallback for Top Performers
    }
    
    if (window.getEnhancedFilterSelection) {
        const enhanced = window.getEnhancedFilterSelection();
        if (enhanced.startDate && enhanced.endDate) {
            currentFilters.startDate = enhanced.startDate;
            currentFilters.endDate = enhanced.endDate;
            currentFilters.agent = enhanced.agent;
        }
    }
}

function filterByDate(data, startDate, endDate) {
    return data.filter(item => {
        let itemDate;
        
        // Handle different date formats
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            // Handle Firestore timestamp
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            return true; // Include items without dates
        }
        
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        
        return true;
    });
}

function filterSalesTeamData(data, startDate, endDate, agent) {
    return data.filter(item => {
        let itemDate;
        
        // Handle different date formats
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            return true;
        }
        
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        // Date filter
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        
        // Agent filter - handle different field names for different data types
        if (agent) {
            // For Power Metrics (type: 'power_metrics'), check agent_name and team fields
            if (item.type === 'power_metrics') {
                const itemAgent = item.agent_name || item.team || '';
                const isMatch = itemAgent.toLowerCase() === agent.toLowerCase();
                
                if (!isMatch) {
                    console.log(`🔍 Filtering out Power Metrics: "${itemAgent}" !== "${agent}"`);
                    return false;
                }
                console.log(`✅ Including Power Metrics: "${itemAgent}" matches "${agent}"`);
            }
            // For other data types, check agent and team fields with case-insensitive matching
            else {
                const itemAgent = item.agent || item.team || '';
                const isMatch = itemAgent.toLowerCase() === agent.toLowerCase() || 
                               (item.agent && item.agent.toLowerCase() === agent.toLowerCase()) ||
                               (item.team && item.team.toLowerCase() === agent.toLowerCase());
                
                if (!isMatch) return false;
            }
        }
        
        return true;
    });
}

// UPDATE clearFilters function as well:
function clearFilters() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('agent-filter').value = '';

    // Reset enhanced lead filters if they exist
    const teamFilter = document.getElementById('lead-team-filter');
    const timeFilter = document.getElementById('lead-time-filter');
    const sourceFilter = document.getElementById('lead-source-filter');
    
    if (teamFilter) teamFilter.value = '';
    if (timeFilter) timeFilter.value = '';
    if (sourceFilter) sourceFilter.value = '';
    
    currentFilters = {
        startDate: null,
        endDate: null,
        agent: null,
        period: 30
    };
    
    // Update with allData
    updateKPIs(allData);
    updateCharts(allData);
    updateRecentActivity(allData);
    updateActiveFiltersDisplay();
    updateEnhancedPowerMetricsDisplay(allData.salesteam);
    
    // UPDATE: Add this line at the end of clearFilters function  
    updateTeamDisplay(); // <-- TAMBAH LINE INI
    
    // Use the NEW leads-only chart function
    updateLeadsOnlyChart(allData);
}

function updateActiveFiltersDisplay() {
    const activeFiltersDiv = document.getElementById('active-filters');
    const filterTagsDiv = document.getElementById('filter-tags');
    
    // Skip if elements don't exist (enhanced filter handles its own display)
    if (!activeFiltersDiv || !filterTagsDiv) {
        console.log('Old filter elements not found, enhanced filter active');
        return;
    }
    
    const tags = [];
    
    if (currentFilters.startDate) {
        tags.push(`Dari: ${formatDate(currentFilters.startDate)}`);
    }
    
    if (currentFilters.endDate) {
        tags.push(`Hingga: ${formatDate(currentFilters.endDate)}`);
    }
    
    if (currentFilters.agent) {
        tags.push(`Agent: ${currentFilters.agent}`);
    }
    
    if (tags.length > 0) {
        activeFiltersDiv.classList.remove('hidden');
        filterTagsDiv.innerHTML = tags.map(tag => 
            `<span class="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">${tag}</span>`
        ).join('');
    } else {
        activeFiltersDiv.classList.add('hidden');
    }
}

function updateKPIs(data) {
    // Calculate Total Sales from orders
    const orderSales = data.orders.reduce((sum, item) => sum + (parseFloat(item.total_rm) || 0), 0);
    
    // Calculate sales from sales team power metrics
    const teamSales = data.salesteam
        .filter(item => item.type === 'power_metrics')
        .reduce((sum, item) => sum + (parseFloat(item.total_sale_bulan) || 0), 0);
    
    const totalSales = orderSales + teamSales;
    
    document.getElementById('total-sales').textContent = `RM ${totalSales.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('total-sales-count').textContent = `${data.orders.length + data.salesteam.filter(item => item.type === 'power_metrics').length} entri`;

    // Calculate Total Lead using the same logic as EnhancedPowerMetricsCalculator
    let totalLeads = 0;
    let leadEntries = 0;
    
    // Check if there's an active agent/team filter
    const activeAgent = (window.currentFilters && window.currentFilters.agent) || '';
    
    // Get power metrics data for current month (same as power metrics calculator)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const powerMetricsData = data.salesteam.filter(item => {
        if (item.type !== 'power_metrics') return false;
        
        let itemDate;
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.created_at) {
            itemDate = item.created_at.toDate ? item.created_at.toDate() : new Date(item.created_at);
        } else {
            return false;
        }
        
        // Only include current month data
        return itemDate.getMonth() + 1 === currentMonth && 
               itemDate.getFullYear() === currentYear;
    });
    
    if (activeAgent) {
        // If filtered by team, show that team's lead count
        const teamPowerMetrics = powerMetricsData.filter(item => {
            const agentName = item.agent_name || item.team || '';
            return agentName.toLowerCase() === activeAgent.toLowerCase();
        });
        
        if (teamPowerMetrics.length > 0) {
            // Get the most recent power metrics entry for the team
            const latestEntry = teamPowerMetrics.sort((a, b) => {
                const dateA = new Date(a.tarikh || a.created_at);
                const dateB = new Date(b.tarikh || b.created_at);
                return dateB - dateA;
            })[0];
            
            totalLeads = parseInt(latestEntry.total_lead_bulan) || 0;
            leadEntries = 1;
            console.log(`🎯 Total Lead for ${activeAgent}: ${totalLeads} (latest entry: ${latestEntry.tarikh})`);
        }
    } else {
        // Show all teams' total leads - group by agent_name or team
        console.log(`📋 Calculating Total Lead for all teams (${powerMetricsData.length} power metrics records for ${currentMonth}/${currentYear})`);
        
        const teamGroups = {};
        
        powerMetricsData.forEach(item => {
            const teamName = item.agent_name || item.team || 'Unknown';
            let itemDate;
            
            if (item.tarikh) {
                itemDate = new Date(item.tarikh);
            } else if (item.created_at) {
                itemDate = item.created_at.toDate ? item.created_at.toDate() : new Date(item.created_at);
            } else {
                itemDate = new Date();
            }
            
            console.log(`   Processing: ${teamName} - ${itemDate.toLocaleDateString()} - ${item.total_lead_bulan || 0} leads`);
            
            // Keep only the latest entry for each team
            if (!teamGroups[teamName] || itemDate > teamGroups[teamName].date) {
                if (teamGroups[teamName]) {
                    console.log(`   → Replacing older entry for ${teamName} (${teamGroups[teamName].date.toLocaleDateString()} → ${itemDate.toLocaleDateString()})`);
                }
                teamGroups[teamName] = {
                    data: item,
                    date: itemDate
                };
            }
        });
        
        console.log(`📊 Final team groups for Total Lead calculation:`);
        
        // Sum up the latest total_lead_bulan from each team
        Object.entries(teamGroups).forEach(([teamName, teamData]) => {
            const leadCount = parseInt(teamData.data.total_lead_bulan) || 0;
            totalLeads += leadCount;
            leadEntries++;
            console.log(`   ✅ ${teamName}: ${leadCount} leads (latest: ${teamData.date.toLocaleDateString()})`);
        });
        
        console.log(`📋 Total Lead Count for all teams: ${totalLeads} leads from ${leadEntries} teams`);
        
        // Debug: Show which teams were included
        if (leadEntries === 0) {
            console.log(`⚠️ No power metrics data found for current month (${currentMonth}/${currentYear})`);
            console.log('Available power metrics data:');
            const allPowerMetrics = data.salesteam.filter(item => item.type === 'power_metrics');
            allPowerMetrics.forEach(item => {
                const date = item.tarikh || (item.created_at ? 'Has created_at' : 'No date');
                console.log(`   - ${item.agent_name || item.team}: ${date}`);
            });
        }
    }
    
    document.getElementById('total-leads-value').textContent = totalLeads.toString();
    document.getElementById('total-leads-count').textContent = `${leadEntries} ${activeAgent ? 'team' : 'teams'}`;
    
    // Update trend indicator
    document.getElementById('total-leads-trend').textContent = totalLeads > 0 ? '+' + (Math.random() * 15).toFixed(1) + '%' : '-';

    // Calculate Leads per Agent
    const leadData = data.salesteam.filter(item => item.type === 'lead');
    if (leadData.length > 0) {
        const totalLeads = leadData.reduce((sum, item) => sum + (parseInt(item.total_lead) || 0), 0);
        const uniqueAgents = new Set(leadData.map(item => item.team).filter(Boolean)).size;
        const leadsPerAgent = uniqueAgents > 0 ? totalLeads / uniqueAgents : 0;
        
        document.getElementById('leads-per-agent').textContent = `${leadsPerAgent.toFixed(1)}`;
        document.getElementById('leads-per-agent-count').textContent = `${uniqueAgents} agent`;
    } else {
        document.getElementById('leads-per-agent').textContent = 'N/A';
        document.getElementById('leads-per-agent-count').textContent = '0 agent';
    }

    // Calculate Total Orders
    const totalOrders = data.orders.length;
    document.getElementById('total-orders').textContent = totalOrders.toString();
    document.getElementById('total-orders-count').textContent = `${totalOrders} orders`;

    // Update trend indicators (simplified random for demo)
    document.getElementById('sales-trend').textContent = totalSales > 0 ? '+' + (Math.random() * 20).toFixed(1) + '%' : '-';
    document.getElementById('leads-trend').textContent = leadData.length > 0 ? '+' + (Math.random() * 15).toFixed(1) + '%' : '-';
    document.getElementById('orders-trend').textContent = totalOrders > 0 ? '+' + (Math.random() * 12).toFixed(1) + '%' : '-';
}

// 3. UPDATE the updateCharts function
function updateCharts(data) {
    // Initialize Chart.js defaults
    Chart.defaults.color = '#D1D5DB';
    Chart.defaults.borderColor = 'rgba(75, 85, 99, 0.3)';

    createMarketingCostPerTeamChart(data);
    updateChannelChart(data); // Enable fallback for Revenue by Channel
    
    // REPLACE this line:
    // updateEnhancedLeadsChart(data); // ← Remove this old call
    
    // The new enhanced chart is called from applyFilters() instead
    updateTeamChart(data); // Enable fallback for Top Performers
    updateSpendChart(data);
    
    // ADD new chart for lead quality trends
    updateLeadQualityChart(data);

     // Update main marketing charts with filtered data
    updateMarketingCostPerTeamDisplay(data);
    
    // Update Marketing ROI chart
    if (window.createMarketingROIChart) {
        window.createMarketingROIChart(data);
    }
    
    // Update Marketing Timeline chart
    if (window.createMarketingTimelineChart) {
        window.createMarketingTimelineChart(data);
    }
}

// Updated function to handle marketing cost per team chart updates
async function updateMarketingCostPerTeamDisplay(data) {
    try {
        // Use the new marketing cost per team chart function
        if (typeof createMarketingCostPerTeamChart === 'function') {
            console.log('🔄 Updating marketing cost per team chart with real Firebase data...');
            await createMarketingCostPerTeamChart(data);
        } else if (window.createMarketingCostPerTeamChart) {
            console.log('🔄 Updating marketing cost per team chart with real Firebase data (global)...');
            await window.createMarketingCostPerTeamChart(data);
        } else {
            console.warn('⚠️ createMarketingCostPerTeamChart function not found');
        }
    } catch (error) {
        console.error('❌ Error updating marketing cost per team chart:', error);
    }
}

function updateLeadQualityChart(data) {
    const ctx = document.getElementById('leadQualityChart');
    if (!ctx) {
        console.log('leadQualityChart element not found');
        return;
    }
    
    // Process lead quality data over time
    const qualityByDate = {};
    
    data.salesteam
        .filter(item => item.type === 'lead')
        .forEach(item => {
            const date = item.tarikh || new Date().toISOString().split('T')[0];
            if (!qualityByDate[date]) {
                qualityByDate[date] = { cold: 0, warm: 0, hot: 0 };
            }
            qualityByDate[date].cold += parseInt(item.cold) || 0;
            qualityByDate[date].warm += parseInt(item.warm) || 0;
            qualityByDate[date].hot += parseInt(item.hot) || 0;
        });
    
    const sortedDates = Object.keys(qualityByDate).sort().slice(-7); // Last 7 days
    
    // Enhanced chart destruction - handle both storage systems
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
        console.log('🗑️ Destroyed existing chart on leadQualityChart canvas');
    }
    
    if (charts.leadQuality) {
        charts.leadQuality.destroy();
        charts.leadQuality = null;
    }
    
    charts.leadQuality = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates.map(date => formatDate(date)),
            datasets: [
                {
                    label: 'Hot Leads',
                    data: sortedDates.map(date => qualityByDate[date]?.hot || 0),
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Warm Leads',
                    data: sortedDates.map(date => qualityByDate[date]?.warm || 0),
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Cold Leads',
                    data: sortedDates.map(date => qualityByDate[date]?.cold || 0),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    labels: { 
                        color: '#D1D5DB',
                        usePointStyle: true 
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { color: '#9CA3AF' },
                    grid: { color: 'rgba(75, 85, 99, 0.3)' }
                },
                x: { 
                    ticks: { color: '#9CA3AF' },
                    grid: { color: 'rgba(75, 85, 99, 0.3)' }
                }
            }
        }
    });
}


// REPLACED: updateSalesTrendChart is now replaced with Marketing Cost per Team Chart
// The main chart now shows marketing cost per sales team member instead of sales trend
function updateMarketingCostPerTeamChart(data = null) {
    console.log('📊 Updating Marketing Cost per Team Chart...');
    
    // Use the imported function from marketing-cost-per-team-chart.js
    if (window.createMarketingCostPerTeamChart) {
        return window.createMarketingCostPerTeamChart(data);
    } else {
        // Fallback if module not loaded
        return createMarketingCostPerTeamChart(data);
    }
}

function updateChannelChart(data) {
    const ctx = document.getElementById('channelChart');
    if (!ctx) {
        console.log('channelChart element not found');
        return;
    }

    console.log('📊 Updating Revenue by Channel chart (fallback)...');

    // Group by platform
    const channelData = {};
    
    // Process orders data
    (data.orders || []).forEach(item => {
        const platform = item.platform || item.channel || item.source || 'Direct';
        const amount = parseFloat(item.total_rm || item.amount || item.total || 0);
        if (amount > 0) {
            channelData[platform] = (channelData[platform] || 0) + amount;
        }
    });

    // Process ecommerce data
    (data.ecommerce || []).forEach(item => {
        const platform = item.platform || item.channel || item.source || 'E-commerce';
        const amount = parseFloat(item.total_rm || item.amount || item.total || 0);
        if (amount > 0) {
            channelData[platform] = (channelData[platform] || 0) + amount;
        }
    });

    // If no data, use sample data
    if (Object.keys(channelData).length === 0) {
        channelData['Website'] = 5000;
        channelData['WhatsApp'] = 3500;
        channelData['Facebook'] = 2800;
        channelData['Instagram'] = 1900;
        channelData['Direct'] = 1200;
        console.log('⚠️ No channel data found, using sample data');
    }

    console.log('Channel data:', channelData);

    // Enhanced chart destruction - handle both storage systems
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
        console.log('🗑️ Destroyed existing chart on channelChart canvas');
    }
    
    if (charts.channel) {
        charts.channel.destroy();
        charts.channel = null;
    }

    const colors = ['#FF6B35', '#F7931E', '#3B82F6', '#E1306C', '#1877F2', '#10B981'];
    
    charts.channel = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(channelData),
            datasets: [{
                data: Object.values(channelData),
                backgroundColor: colors.slice(0, Object.keys(channelData).length),
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { 
                        color: '#D1D5DB', 
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': RM ' + context.parsed.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function updateTeamChart(data) {
    const ctx = document.getElementById('teamChart');
    if (!ctx) {
        console.log('teamChart element not found');
        return;
    }

    console.log('🏆 Updating Top Performers chart (fallback)...');

    // Calculate performance metrics by team
    const teamPerformance = {};
    
    // Get leads data
    (data.salesteam || [])
        .filter(item => item.type === 'lead')
        .forEach(item => {
            const team = item.team || item.agent_name || 'Unknown';
            if (!teamPerformance[team]) {
                teamPerformance[team] = { leads: 0, sales: 0, closes: 0 };
            }
            teamPerformance[team].leads += parseInt(item.total_lead) || 0;
        });

    // Get power metrics data (more important for performance ranking)
    (data.salesteam || [])
        .filter(item => item.type === 'power_metrics')
        .forEach(item => {
            const team = item.agent_name || item.team || 'Unknown';
            if (!teamPerformance[team]) {
                teamPerformance[team] = { leads: 0, sales: 0, closes: 0 };
            }
            // Use latest data for each team
            teamPerformance[team].sales = parseFloat(item.total_sale_bulan) || 0;
            teamPerformance[team].closes = parseInt(item.total_close_bulan) || 0;
            teamPerformance[team].leads = parseInt(item.total_lead_bulan) || teamPerformance[team].leads;
        });

    // If no data, use sample data
    if (Object.keys(teamPerformance).length === 0) {
        teamPerformance['Agent A'] = { leads: 25, sales: 8500, closes: 15 };
        teamPerformance['Agent B'] = { leads: 22, sales: 7200, closes: 12 };
        teamPerformance['Agent C'] = { leads: 28, sales: 6800, closes: 14 };
        teamPerformance['Agent D'] = { leads: 20, sales: 5900, closes: 10 };
        teamPerformance['Agent E'] = { leads: 18, sales: 4100, closes: 8 };
        console.log('⚠️ No team performance data found, using sample data');
    }

    // Convert to performance scores (use sales as primary metric)
    const teams = Object.keys(teamPerformance);
    const scores = teams.map(team => {
        const data = teamPerformance[team];
        const closeRate = data.leads > 0 ? (data.closes / data.leads) * 100 : 0;
        // Use sales as primary metric, with close rate as bonus
        return data.sales + (closeRate * 50); // Weight close rate
    });

    console.log('Team performance:', teams.map((team, i) => `${team}: RM ${teamPerformance[team].sales} (score: ${scores[i]})`));

    // Enhanced chart destruction - handle both storage systems
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
        console.log('🗑️ Destroyed existing chart on teamChart canvas');
    }
    
    if (charts.team) {
        charts.team.destroy();
        charts.team = null;
    }

    charts.team = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: teams,
            datasets: [{
                label: 'Performance Score',
                data: scores,
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: '#22C55E',
                pointBackgroundColor: '#22C55E',
                pointBorderColor: '#22C55E',
                pointRadius: 6,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { 
                        color: '#9CA3AF',
                        stepSize: 20,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: { color: 'rgba(75, 85, 99, 0.3)' },
                    pointLabels: { color: '#D1D5DB', font: { size: 11 } }
                }
            }
        }
    });
}


function updateSpendChart(data) {
    const ctx = document.getElementById('spendChart');
    if (!ctx) {
        console.log('spendChart element not found');
        return;
    }

    // Group marketing spend by date
    const spendByDate = {};
    
    data.marketing
        .filter(item => item.type === 'detail_ads')
        .forEach(item => {
            let date;
            if (item.tarikh) {
                date = item.tarikh;
            } else if (item.createdAt) {
                date = (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)).toISOString().split('T')[0];
            } else {
                return;
            }
            
            const spend = parseFloat(item.amount_spent) || 0;
            spendByDate[date] = (spendByDate[date] || 0) + spend;
        });

    const sortedDates = Object.keys(spendByDate).sort().slice(-7); // Last 7 days

    // Enhanced chart destruction - handle both storage systems
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
        console.log('🗑️ Destroyed existing chart on spendChart canvas');
    }
    
    if (charts.spend) {
        charts.spend.destroy();
        charts.spend = null;
    }

    charts.spend = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedDates.map(date => formatDate(date)),
            datasets: [{
                label: 'Marketing Spend',
                data: sortedDates.map(date => spendByDate[date] || 0),
                backgroundColor: '#8B5CF6',
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Spend: RM ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { 
                        color: '#9CA3AF',
                        callback: function(value) {
                            return 'RM ' + value.toLocaleString();
                        }
                    },
                    grid: { color: 'rgba(75, 85, 99, 0.3)' }
                },
                x: { 
                    ticks: { color: '#9CA3AF' },
                    grid: { display: false }
                }
            }
        }
    });
}

function updateRecentActivity(data) {
    const activityFeed = document.getElementById('activity-feed');
    if (!activityFeed) {
        console.log('activity-feed element not found');
        return;
    }
    
    const activities = [];

    // Get recent activities from orders
    const orderActivities = data.orders.map(item => ({
        type: 'order',
        message: `Order baharu - ${item.nama_customer} - RM ${parseFloat(item.total_rm || 0).toFixed(2)}`,
        time: item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)) : new Date(),
        platform: item.platform
    }));

    // Get recent activities from sales team
    const salesActivities = data.salesteam
        .filter(item => item.type === 'lead')
        .map(item => ({
            type: 'sales',
            message: `${item.team} - ${item.total_lead || 0} leads baharu`,
            time: item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)) : new Date(),
            agent: item.team
        }));

    const allActivities = [...orderActivities, ...salesActivities];

    // Sort by time and take latest 10
    const recentActivities = allActivities
        .sort((a, b) => b.time - a.time)
        .slice(0, 10);

    if (recentActivities.length === 0) {
        activityFeed.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>Tiada aktiviti terkini</p>
            </div>
        `;
        return;
    }

    activityFeed.innerHTML = recentActivities.map(activity => {
        const colorClass = activity.type === 'order' ? 'bg-green-400' : 'bg-purple-400';
        
        return `
            <div class="flex items-center space-x-4 p-3 bg-gray-800/50 rounded-lg">
                <div class="w-2 h-2 ${colorClass} rounded-full ${activity.type === 'order' ? 'animate-pulse' : ''}"></div>
                <div class="flex-1">
                    <p class="text-sm">${activity.message}</p>
                    <p class="text-xs text-gray-400">${formatRelativeTime(activity.time)}</p>
                </div>
            </div>
        `;
    }).join('');
}

function showNoDataState() {
    document.getElementById('total-sales').textContent = 'RM 0.00';
    document.getElementById('total-sales-count').textContent = '0 entri (Tiada data)';
    document.getElementById('total-leads-value').textContent = '0';
    document.getElementById('total-leads-count').textContent = '0 teams (Tiada data)';
    document.getElementById('leads-per-agent').textContent = 'N/A';
    document.getElementById('leads-per-agent-count').textContent = '0 agent (Tiada data)';
    document.getElementById('total-orders').textContent = '0';
    document.getElementById('total-orders-count').textContent = '0 orders (Tiada data)';
    
    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = `
        <div class="text-center text-yellow-500 py-8">
            <svg class="w-16 h-16 mx-auto mb-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="text-lg font-semibold mb-2">Tiada Data Tersedia</h3>
            <p class="text-gray-400">Sila submit data melalui borang yang tersedia untuk melihat analytics.</p>
            <div class="mt-4 space-x-2">
                <a href="ecommerce.html" class="text-blue-400 hover:text-blue-300">Borang Order</a> |
                <a href="marketing.html" class="text-blue-400 hover:text-blue-300">Marketing</a> |
                <a href="salesteam.html" class="text-blue-400 hover:text-blue-300">Sales Team</a>
            </div>
        </div>
    `;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY');
}

function formatRelativeTime(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru sahaja';
    if (diffInMinutes < 60) return `${diffInMinutes} minit yang lalu`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
    
    return date.toLocaleDateString('ms-MY');
}

function updateCurrentTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = now.toLocaleString('ms-MY');
    }
}

function showLoadingState() {
    document.getElementById('total-sales').textContent = 'Loading...';
    document.getElementById('total-leads-value').textContent = 'Loading...';
    document.getElementById('leads-per-agent').textContent = 'Loading...';
    document.getElementById('total-orders').textContent = 'Loading...';
    
    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = '<div class="text-center text-blue-500 py-8"><div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>Memuatkan data...</div>';
}

function showErrorState() {
    document.getElementById('total-sales').textContent = 'Error';
    document.getElementById('total-leads-value').textContent = 'Error';
    document.getElementById('leads-per-agent').textContent = 'Error';
    document.getElementById('total-orders').textContent = 'Error';
    
    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = `
        <div class="text-center text-red-500 py-8">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h3 class="text-lg font-semibold mb-2">Gagal Memuatkan Data</h3>
            <p class="text-gray-400">Sila refresh halaman atau check console untuk error details.</p>
        </div>
    `;
}

// Enhanced Power Metrics Calculator with Dynamic Working Days Detection
// This system automatically detects working days and adjusts KPI daily based on current sales

class EnhancedPowerMetricsCalculator {
    constructor(customWorkingDays = null) {
        this.monthlyKPI = this.getMonthlyTarget(); // Dynamic target based on team size
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth() + 1;
        this.currentYear = this.currentDate.getFullYear();
        this.currentDay = this.currentDate.getDate();
        
        // Custom working days configuration (if provided)
        this.customWorkingDays = customWorkingDays; // e.g., [1,2,3,4,6] for Mon-Thu,Sat
        
        console.log(`📅 Current Date: ${this.currentDate.toLocaleDateString('ms-MY')}`);
        console.log(`📊 Monthly KPI: RM ${this.monthlyKPI.toLocaleString()}`);
    }

    // Get monthly target based on selected team or total team size
    getMonthlyTarget() {
        const baseTargetPerPerson = 15000; // RM 15,000 per person
        
        // Check if specific team is selected
        let selectedTeam = '';
        
        // Check enhanced filter first
        if (window.getEnhancedFilterSelection) {
            const enhanced = window.getEnhancedFilterSelection();
            selectedTeam = enhanced.agent || '';
        } else {
            // Fallback to old filter
            const agentFilter = document.getElementById('agent-filter');
            selectedTeam = agentFilter?.value || '';
        }
        
        if (selectedTeam) {
            // Individual team member target
            return baseTargetPerPerson;
        } else {
            // Calculate total target for all team members
            return calculateTotalSalesTeamTarget();
        }
    }

    // Enhanced working days calculation with custom configuration
    getWorkingDaysInMonth() {
        const year = this.currentYear;
        const month = this.currentMonth;
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        let workingDays = 0;
        
        for (let day = new Date(firstDay); day <= lastDay; day.setDate(day.getDate() + 1)) {
            const dayOfWeek = day.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
            
            if (this.customWorkingDays) {
                // Use custom working days configuration
                if (this.customWorkingDays.includes(dayOfWeek)) {
                    workingDays++;
                }
            } else {
                // Default: Exclude Friday (5) and Saturday (6) - Malaysian working pattern
                if (dayOfWeek !== 5 && dayOfWeek !== 6) {
                    workingDays++;
                }
            }
        }
        
        console.log(`📈 Total Working Days in ${month}/${year}: ${workingDays} days`);
        return workingDays;
    }

    // Calculate working days from start of month to current date
    getWorkingDaysToDate() {
        const year = this.currentYear;
        const month = this.currentMonth;
        const firstDay = new Date(year, month - 1, 1);
        const currentDate = new Date(year, month - 1, this.currentDay);
        
        let workingDays = 0;
        
        for (let day = new Date(firstDay); day <= currentDate; day.setDate(day.getDate() + 1)) {
            const dayOfWeek = day.getDay();
            
            if (this.customWorkingDays) {
                if (this.customWorkingDays.includes(dayOfWeek)) {
                    workingDays++;
                }
            } else {
                // Default: Exclude Friday and Saturday
                if (dayOfWeek !== 5 && dayOfWeek !== 6) {
                    workingDays++;
                }
            }
        }
        
        console.log(`📊 Working Days to Date: ${workingDays} days`);
        return workingDays;
    }

    // Calculate remaining working days in the month
    getRemainingWorkingDays() {
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const workingDaysToDate = this.getWorkingDaysToDate();
        const remaining = Math.max(0, totalWorkingDays - workingDaysToDate);
        
        console.log(`⏰ Remaining Working Days: ${remaining} days`);
        return remaining;
    }

    // STATIC KPI Harian (Original calculation for reference)
    calculateStaticKPIHarian() {
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const staticKPI = this.monthlyKPI / totalWorkingDays;
        
        console.log(`📋 Static KPI Harian: RM ${staticKPI.toFixed(2)}`);
        return staticKPI;
    }

    // DYNAMIC KPI Harian - Adjusts based on current sales and remaining days
    calculateDynamicKPIHarian(saleMTD) {
        const remainingWorkingDays = this.getRemainingWorkingDays();
        const remainingKPI = this.monthlyKPI - saleMTD;
        
        // If no working days remaining, return 0
        if (remainingWorkingDays <= 0) {
            console.log(`🏁 No working days remaining - Dynamic KPI: RM 0`);
            return 0;
        }
        
        // Dynamic KPI = Remaining KPI ÷ Remaining working days
        const dynamicKPI = remainingKPI / remainingWorkingDays;
        
        console.log(`🔄 Dynamic KPI Calculation:`);
        console.log(`   - Remaining KPI: RM ${remainingKPI.toLocaleString()}`);
        console.log(`   - Remaining Days: ${remainingWorkingDays}`);
        console.log(`   - Dynamic KPI Harian: RM ${dynamicKPI.toFixed(2)}`);
        
        return Math.max(0, dynamicKPI); // Ensure non-negative
    }

    // Calculate expected KPI MTD (Month-to-Date target)
    calculateKPIMTD() {
        const workingDaysToDate = this.getWorkingDaysToDate();
        const staticKpiHarian = this.calculateStaticKPIHarian();
        const kpiMTD = staticKpiHarian * workingDaysToDate;
        
        console.log(`📊 KPI MTD: RM ${kpiMTD.toFixed(2)} (${workingDaysToDate} days × RM ${staticKpiHarian.toFixed(2)})`);
        return kpiMTD;
    }

    // REPLACE getSaleMTD method:
getSaleMTD(salesTeamData) {
    const currentMonth = this.currentMonth;
    const currentYear = this.currentYear;
    
    console.log(`🔍 Getting Sale MTD for ${currentMonth}/${currentYear}...`);
    
    // Check if there's an active agent filter
    const activeAgent = (window.currentFilters && window.currentFilters.agent) || '';
    if (activeAgent) {
        console.log(`🎯 Filtering for specific agent: ${activeAgent}`);
    }
    
    // DEBUG: Log all power_metrics before date filtering
    const allPowerMetrics = salesTeamData.filter(item => item.type === 'power_metrics');
    console.log(`📊 All Power Metrics before filtering (${allPowerMetrics.length} total):`);
    allPowerMetrics.forEach((item, index) => {
        console.log(`   [${index + 1}] Agent: "${item.agent_name || item.team || 'Unknown'}" | Sale: RM ${item.total_sale_bulan || 0} | Date: ${item.tarikh || item.createdAt || 'No date'}`);
    });
    
    // Filter power_metrics data for current month
    const currentMonthData = salesTeamData.filter(item => {
        if (item.type !== 'power_metrics') return false;
        
        let itemDate;
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            console.log(`⚠️ No date found for power_metrics item:`, item);
            return false;
        }
        
        const isCurrentMonth = itemDate.getMonth() + 1 === currentMonth && 
                              itemDate.getFullYear() === currentYear;
        
        if (!isCurrentMonth) {
            console.log(`📅 Excluding ${item.agent_name || item.team}: ${itemDate.toLocaleDateString()} (not ${currentMonth}/${currentYear})`);
        }
        
        return isCurrentMonth;
    });
    
    console.log(`📅 After date filtering: ${currentMonthData.length} records for ${currentMonth}/${currentYear}`);

    console.log(`📊 Found ${currentMonthData.length} power metrics entries for current month`);

    // Group by team and get latest entry for each team
    const teamLatestData = {};
    
    currentMonthData.forEach(item => {
        const team = item.agent_name || item.team || 'Unknown';
        let itemDate;
        
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            itemDate = new Date();
        }
        
        // If this is the first entry for the team, or if this entry is newer
        if (!teamLatestData[team] || itemDate > teamLatestData[team].date) {
            teamLatestData[team] = {
                data: item,
                date: itemDate
            };
        }
    });

    console.log(`👥 Found latest data for ${Object.keys(teamLatestData).length} teams:`, 
               Object.keys(teamLatestData));

    // If filtering by specific agent, only use that agent's latest data
    let teamsToSum = teamLatestData;
    if (activeAgent) {
        console.log(`🔍 Looking for agent: "${activeAgent}" in available teams:`, Object.keys(teamLatestData));
        
        // Debug: Check exact string matching
        Object.keys(teamLatestData).forEach(teamName => {
            const isExactMatch = teamName === activeAgent;
            const isLowerMatch = teamName.toLowerCase() === activeAgent.toLowerCase();
            const isIncludes = teamName.includes(activeAgent) || activeAgent.includes(teamName);
            console.log(`   Team "${teamName}": exact=${isExactMatch}, lower=${isLowerMatch}, includes=${isIncludes}`);
        });
        
        teamsToSum = {};
        
        // Try exact match first
        if (teamLatestData[activeAgent]) {
            teamsToSum[activeAgent] = teamLatestData[activeAgent];
            console.log(`🎯 Using filtered agent data (exact match): ${activeAgent}`);
        } else {
            // Try case-insensitive match
            const foundTeam = Object.keys(teamLatestData).find(team => 
                team.toLowerCase() === activeAgent.toLowerCase()
            );
            
            if (foundTeam) {
                teamsToSum[foundTeam] = teamLatestData[foundTeam];
                console.log(`🎯 Using filtered agent data (case-insensitive match): ${foundTeam}`);
            } else {
                console.log(`⚠️ No data found for agent: "${activeAgent}"`);
                console.log(`   Available agents: ${Object.keys(teamLatestData).join(', ')}`);
            }
        }
    }

    // Sum the LATEST total_sale_bulan from relevant teams
    const saleMTD = Object.values(teamsToSum).reduce((total, teamData) => {
        const saleAmount = parseFloat(teamData.data.total_sale_bulan) || 0;
        console.log(`   - ${teamData.data.agent_name || teamData.data.team || 'Unknown'}: RM ${saleAmount.toLocaleString()} (${teamData.date.toLocaleDateString()})`);
        return total + saleAmount;
    }, 0);

    const context = activeAgent ? `for ${activeAgent}` : 'for all teams';
    console.log(`💰 Total Sale MTD (Latest ${context}): RM ${saleMTD.toLocaleString()}`);
    return saleMTD;
}

    // Calculate Balance Bulanan (Remaining to reach monthly target)
    calculateBalanceBulanan(saleMTD) {
        const balance = this.monthlyKPI - saleMTD;
        console.log(`📊 Balance Bulanan: RM ${balance.toLocaleString()}`);
        return balance;
    }

    // Calculate Balance MTD (Gap between expected and actual sales)
    calculateBalanceMTD(saleMTD) {
        const kpiMTD = this.calculateKPIMTD();
        const balance = kpiMTD - saleMTD;
        console.log(`📈 Balance MTD: RM ${balance.toLocaleString()}`);
        return balance;
    }

    // REPLACE getTotalCloseCount method:
getTotalCloseCount(salesTeamData) {
    const currentMonth = this.currentMonth;
    const currentYear = this.currentYear;
    
    console.log(`🔍 Getting Total Close Count for ${currentMonth}/${currentYear}...`);
    
    // Check if there's an active agent filter
    const activeAgent = (window.currentFilters && window.currentFilters.agent) || '';
    if (activeAgent) {
        console.log(`🎯 Filtering close count for specific agent: ${activeAgent}`);
    }
    
    // Filter power_metrics data for current month
    const currentMonthData = salesTeamData.filter(item => {
        if (item.type !== 'power_metrics') return false;
        
        let itemDate;
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            return false;
        }
        
        return itemDate.getMonth() + 1 === currentMonth && 
               itemDate.getFullYear() === currentYear;
    });

    // Group by team and get latest entry for each team
    const teamLatestData = {};
    
    currentMonthData.forEach(item => {
        const team = item.agent_name || item.team || 'Unknown';
        let itemDate;
        
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            itemDate = new Date();
        }
        
        if (!teamLatestData[team] || itemDate > teamLatestData[team].date) {
            teamLatestData[team] = {
                data: item,
                date: itemDate
            };
        }
    });

    // If filtering by specific agent, only use that agent's latest data
    let teamsToSum = teamLatestData;
    if (activeAgent) {
        teamsToSum = {};
        if (teamLatestData[activeAgent]) {
            teamsToSum[activeAgent] = teamLatestData[activeAgent];
            console.log(`🎯 Using filtered agent close data: ${activeAgent}`);
        } else {
            console.log(`⚠️ No close data found for agent: ${activeAgent}`);
        }
    }

    // Sum the LATEST total_close_bulan from relevant teams
    const totalClose = Object.values(teamsToSum).reduce((total, teamData) => {
        const closeCount = parseInt(teamData.data.total_close_bulan) || 0;
        console.log(`   - ${teamData.data.agent_name || teamData.data.team || 'Unknown'}: ${closeCount} closes (${teamData.date.toLocaleDateString()})`);
        return total + closeCount;
    }, 0);

    const context = activeAgent ? `for ${activeAgent}` : 'for all teams';
    console.log(`🎯 Total Close Count (Latest ${context}): ${totalClose} units`);
    return totalClose;
}


    // REPLACE getTotalLeadCount method:
getTotalLeadCount(salesTeamData) {
    const currentMonth = this.currentMonth;
    const currentYear = this.currentYear;
    
    console.log(`🔍 Getting Total Lead Count for ${currentMonth}/${currentYear}...`);
    
    // Check if there's an active agent filter
    const activeAgent = (window.currentFilters && window.currentFilters.agent) || '';
    if (activeAgent) {
        console.log(`🎯 Filtering lead count for specific agent: ${activeAgent}`);
    }
    
    // Filter power_metrics data for current month
    const currentMonthData = salesTeamData.filter(item => {
        if (item.type !== 'power_metrics') return false;
        
        let itemDate;
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            return false;
        }
        
        return itemDate.getMonth() + 1 === currentMonth && 
               itemDate.getFullYear() === currentYear;
    });

    // Group by team and get latest entry for each team
    const teamLatestData = {};
    
    currentMonthData.forEach(item => {
        const team = item.agent_name || item.team || 'Unknown';
        let itemDate;
        
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            itemDate = new Date();
        }
        
        if (!teamLatestData[team] || itemDate > teamLatestData[team].date) {
            teamLatestData[team] = {
                data: item,
                date: itemDate
            };
        }
    });

    // If filtering by specific agent, only use that agent's latest data
    let teamsToSum = teamLatestData;
    if (activeAgent) {
        teamsToSum = {};
        if (teamLatestData[activeAgent]) {
            teamsToSum[activeAgent] = teamLatestData[activeAgent];
            console.log(`🎯 Using filtered agent lead data: ${activeAgent}`);
        } else {
            console.log(`⚠️ No lead data found for agent: ${activeAgent}`);
        }
    }

    // Sum the LATEST total_lead_bulan from relevant teams
    const totalLead = Object.values(teamsToSum).reduce((total, teamData) => {
        const leadCount = parseInt(teamData.data.total_lead_bulan) || 0;
        console.log(`   - ${teamData.data.agent_name || teamData.data.team || 'Unknown'}: ${leadCount} leads (${teamData.date.toLocaleDateString()})`);
        return total + leadCount;
    }, 0);

    const context = activeAgent ? `for ${activeAgent}` : 'for all teams';
    console.log(`📋 Total Lead Count (Latest ${context}): ${totalLead} leads`);
    return totalLead;
}

    // Calculate close rate percentage
    calculateTotalCloseRate(salesTeamData) {
        const totalClose = this.getTotalCloseCount(salesTeamData);
        const totalLead = this.getTotalLeadCount(salesTeamData);
        
        if (totalLead === 0) return 0;
        
        const closeRate = (totalClose / totalLead) * 100;
        console.log(`📊 Close Rate: ${closeRate.toFixed(1)}% (${totalClose}/${totalLead})`);
        return closeRate;
    }

    // Enhanced performance analysis
    getPerformanceAnalysis(saleMTD) {
        const kpiMTD = this.calculateKPIMTD();
        const monthlyProgress = (saleMTD / this.monthlyKPI) * 100;
        const mtdProgress = kpiMTD > 0 ? (saleMTD / kpiMTD) * 100 : 0;
        
        const workingDaysToDate = this.getWorkingDaysToDate();
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const expectedProgress = (workingDaysToDate / totalWorkingDays) * 100;
        
        const staticKPI = this.calculateStaticKPIHarian();
        const dynamicKPI = this.calculateDynamicKPIHarian(saleMTD);
        const kpiAdjustment = dynamicKPI - staticKPI;
        const adjustmentPercentage = staticKPI > 0 ? (kpiAdjustment / staticKPI) * 100 : 0;
        
        const analysis = {
            monthlyProgress: monthlyProgress,
            mtdProgress: mtdProgress,
            expectedProgress: expectedProgress,
            performanceGap: monthlyProgress - expectedProgress,
            isAhead: monthlyProgress >= expectedProgress,
            isOnTrack: mtdProgress >= 90,
            kpiAdjustment: kpiAdjustment,
            adjustmentPercentage: adjustmentPercentage,
            urgencyLevel: this.getUrgencyLevel(saleMTD),
            recommendation: this.getRecommendation(saleMTD)
        };

        console.log(`📊 Performance Analysis:`, analysis);
        return analysis;
    }

    // Determine urgency level based on performance
    getUrgencyLevel(saleMTD) {
        const remainingDays = this.getRemainingWorkingDays();
        const balanceBulanan = this.calculateBalanceBulanan(saleMTD);
        const monthlyProgress = (saleMTD / this.monthlyKPI) * 100;
        
        if (monthlyProgress >= 100) return 'ACHIEVED';
        if (remainingDays <= 0) return 'CRITICAL';
        if (remainingDays <= 3) return 'URGENT';
        if (monthlyProgress < 50 && remainingDays <= 10) return 'HIGH';
        if (monthlyProgress >= 80) return 'LOW';
        return 'MODERATE';
    }

    // Get recommendation based on current performance
    getRecommendation(saleMTD) {
        const dynamicKPI = this.calculateDynamicKPIHarian(saleMTD);
        const staticKPI = this.calculateStaticKPIHarian();
        const remainingDays = this.getRemainingWorkingDays();
        const urgency = this.getUrgencyLevel(saleMTD);
        
        const recommendations = {
            'ACHIEVED': '🎉 Target achieved! Maintain momentum for next month.',
            'CRITICAL': '🚨 Month ended. Analyze performance for next month planning.',
            'URGENT': `⚡ Only ${remainingDays} days left! Need RM ${dynamicKPI.toFixed(0)}/day intensive push!`,
            'HIGH': `🔥 High pressure! Daily target increased to RM ${dynamicKPI.toFixed(0)}`,
            'MODERATE': `📈 Stay focused! Daily target: RM ${dynamicKPI.toFixed(0)}`,
            'LOW': `✅ Good progress! Maintain RM ${dynamicKPI.toFixed(0)}/day pace`
        };
        
        return recommendations[urgency] || 'Keep pushing towards your goal!';
    }

    // Master calculation method - returns all metrics
    calculateAllMetrics(salesTeamData) {
        console.log(`🔄 Calculating Power Metrics for ${this.currentDate.toLocaleDateString('ms-MY')}`);
        
        const saleMTD = this.getSaleMTD(salesTeamData);
        const staticKpiHarian = this.calculateStaticKPIHarian();
        const dynamicKpiHarian = this.calculateDynamicKPIHarian(saleMTD);
        const kpiMTD = this.calculateKPIMTD();
        const balanceBulanan = this.calculateBalanceBulanan(saleMTD);
        const balanceMTD = this.calculateBalanceMTD(saleMTD);
        const totalCloseRate = this.calculateTotalCloseRate(salesTeamData);
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const workingDaysToDate = this.getWorkingDaysToDate();
        const remainingWorkingDays = this.getRemainingWorkingDays();
        const performanceAnalysis = this.getPerformanceAnalysis(saleMTD);

        const metrics = {
            // KPI Values
            staticKpiHarian: staticKpiHarian,
            dynamicKpiHarian: dynamicKpiHarian,
            kpiMTD: kpiMTD,
            saleMTD: saleMTD,
            balanceBulanan: balanceBulanan,
            balanceMTD: balanceMTD,
            
            // Performance Metrics
            bilanganTerjual: this.getTotalCloseCount(salesTeamData),
            totalCloseRate: totalCloseRate,
            
            // Day Calculations
            totalWorkingDays: totalWorkingDays,
            workingDaysToDate: workingDaysToDate,
            remainingWorkingDays: remainingWorkingDays,
            
            // Performance Analysis
            ...performanceAnalysis,
            
            // Additional Info
            urgencyLevel: this.getUrgencyLevel(saleMTD),
            recommendation: this.getRecommendation(saleMTD),
            monthlyKPI: this.monthlyKPI
        };

        console.log(`✅ Power Metrics Calculation Complete`);
        console.table({
            'Monthly KPI': `RM ${metrics.monthlyKPI.toLocaleString()}`,
            'Static KPI/Day': `RM ${metrics.staticKpiHarian.toFixed(0)}`,
            'Dynamic KPI/Day': `RM ${metrics.dynamicKpiHarian.toFixed(0)}`,
            'Adjustment': `${metrics.adjustmentPercentage > 0 ? '+' : ''}${metrics.adjustmentPercentage.toFixed(1)}%`,
            'Sale MTD': `RM ${metrics.saleMTD.toLocaleString()}`,
            'Monthly Progress': `${metrics.monthlyProgress.toFixed(1)}%`,
            'Days Left': metrics.remainingWorkingDays,
            'Urgency': metrics.urgencyLevel
        });

        return metrics;
    }

    // Method to simulate different scenarios
    simulateScenario(currentSales, daysRemaining = null) {
        const remainingDays = daysRemaining || this.getRemainingWorkingDays();
        const requiredKPI = remainingDays > 0 ? (this.monthlyKPI - currentSales) / remainingDays : 0;
        
        console.log(`🎯 Simulation: If sales = RM ${currentSales.toLocaleString()}`);
        console.log(`   Required daily KPI: RM ${requiredKPI.toFixed(2)}`);
        console.log(`   Days remaining: ${remainingDays}`);
        
        return {
            currentSales: currentSales,
            remainingDays: remainingDays,
            requiredDailyKPI: requiredKPI,
            isAchievable: requiredKPI <= (this.calculateStaticKPIHarian() * 2) // 2x normal is still achievable
        };
    }
    // ADD tambahan debugging method (optional):
debugDataProcessing(salesTeamData) {
    console.log(`\n🔍 === DEBUGGING POWER METRICS DATA PROCESSING ===`);
    
    const currentMonth = this.currentMonth;
    const currentYear = this.currentYear;
    
    // Show all power_metrics data for current month
    const currentMonthData = salesTeamData.filter(item => {
        if (item.type !== 'power_metrics') return false;
        
        let itemDate;
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            return false;
        }
        
        return itemDate.getMonth() + 1 === currentMonth && 
               itemDate.getFullYear() === currentYear;
    });

    console.log(`📊 All Power Metrics entries for ${currentMonth}/${currentYear}:`, currentMonthData.length);
    
    currentMonthData.forEach((item, index) => {
        const date = item.tarikh || (item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)).toISOString().split('T')[0] : 'Unknown');
        console.log(`[${index + 1}] Team: ${item.team}, Date: ${date}, Sale: RM ${item.total_sale_bulan || 0}, Close: ${item.total_close_bulan || 0}, Lead: ${item.total_lead_bulan || 0}`);
    });

    // Show which entries are selected as "latest" for each team
    const teamLatestData = {};
    
    currentMonthData.forEach(item => {
        const team = item.agent_name || item.team || 'Unknown';
        let itemDate;
        
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            itemDate = new Date();
        }
        
        if (!teamLatestData[team] || itemDate > teamLatestData[team].date) {
            teamLatestData[team] = {
                data: item,
                date: itemDate
            };
        }
    });

    console.log(`\n👥 Latest entry selected for each team:`);
    Object.entries(teamLatestData).forEach(([team, teamData]) => {
        console.log(`[${team}] Date: ${teamData.date.toLocaleDateString()}, Sale: RM ${teamData.data.total_sale_bulan || 0}, Close: ${teamData.data.total_close_bulan || 0}, Lead: ${teamData.data.total_lead_bulan || 0}`);
    });

    console.log(`\n🔍 === END DEBUGGING ===`);
    
    return teamLatestData;
}

}

// Usage Examples and Test Functions
function demonstrateDynamicKPI() {
    console.log(`\n🚀 === DYNAMIC KPI DEMONSTRATION ===`);
    
    // Initialize calculator with custom working days (Monday to Thursday + Saturday)
    // [1,2,3,4,6] = Monday, Tuesday, Wednesday, Thursday, Saturday (Friday off)
    const calculator = new EnhancedPowerMetricsCalculator([1,2,3,4,6]);
    
    // Mock sales data for demonstration
    const mockSalesData = [
        {
            type: 'power_metrics',
            tarikh: '2025-07-01',
            total_sale_bulan: 1000,
            total_close_bulan: 2,
            total_lead_bulan: 10
        },
        {
            type: 'power_metrics',
            tarikh: '2025-07-03',
            total_sale_bulan: 2000,
            total_close_bulan: 3,
            total_lead_bulan: 15
        }
    ];

    // Calculate metrics
    const metrics = calculator.calculateAllMetrics(mockSalesData);
    
    console.log(`\n📊 === RESULTS SUMMARY ===`);
    console.log(`📅 Current Date: ${new Date().toLocaleDateString('ms-MY')}`);
    console.log(`💰 Monthly Target: RM ${metrics.monthlyKPI.toLocaleString()}`);
    console.log(`📈 Current Sales: RM ${metrics.saleMTD.toLocaleString()}`);
    console.log(`📋 Static KPI/Day: RM ${metrics.staticKpiHarian.toFixed(0)}`);
    console.log(`🔄 Dynamic KPI/Day: RM ${metrics.dynamicKpiHarian.toFixed(0)}`);
    console.log(`📊 Adjustment: ${metrics.adjustmentPercentage > 0 ? '+' : ''}${metrics.adjustmentPercentage.toFixed(1)}%`);
    console.log(`⏰ Days Remaining: ${metrics.remainingWorkingDays}`);
    console.log(`🎯 Urgency Level: ${metrics.urgencyLevel}`);
    console.log(`💡 Recommendation: ${metrics.recommendation}`);
    
    // Test different scenarios
    console.log(`\n🧪 === SCENARIO TESTING ===`);
    
    // Scenario 1: No sales yet
    console.log(`\n📈 Scenario 1: No sales yet`);
    calculator.simulateScenario(0);
    
    // Scenario 2: Good progress (RM 5000)
    console.log(`\n📈 Scenario 2: Good progress`);
    calculator.simulateScenario(5000);
    
    // Scenario 3: Behind target (RM 2000 with 5 days left)
    console.log(`\n📈 Scenario 3: Behind target`);
    calculator.simulateScenario(2000, 5);
    
    return metrics;
}

// Auto-detect working days for different regions/companies
function createCalculatorForRegion(region = 'malaysia_default') {
    const workingDayConfigs = {
        'malaysia_default': [0,1,2,3,4,6], // Sunday to Thursday + Saturday (Friday off)
        'malaysia_private': [1,2,3,4,5],   // Monday to Friday (weekends off)
        'brunei': [1,2,3,4,6],             // Monday to Thursday + Saturday (Friday off)
        'indonesia': [1,2,3,4,5],          // Monday to Friday
        'singapore': [1,2,3,4,5],          // Monday to Friday
        'custom_6_days': [1,2,3,4,5,6]     // Monday to Saturday
    };
    
    const workingDays = workingDayConfigs[region] || workingDayConfigs['malaysia_default'];
    console.log(`🌍 Creating calculator for region: ${region}`);
    console.log(`📅 Working days: ${workingDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`);
    
    return new EnhancedPowerMetricsCalculator(workingDays);
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        EnhancedPowerMetricsCalculator, 
        demonstrateDynamicKPI,
        createCalculatorForRegion 
    };
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.EnhancedPowerMetricsCalculator = EnhancedPowerMetricsCalculator;
    window.demonstrateDynamicKPI = demonstrateDynamicKPI;
    window.createCalculatorForRegion = createCalculatorForRegion;
}

// Enhanced update function for dashboard integration
function updateEnhancedPowerMetricsDisplay(salesTeamData) {
    console.log(`🔄 updateEnhancedPowerMetricsDisplay called with ${salesTeamData?.length || 0} records`);
    
    // DEBUG: Log all salesTeamData types first
    if (salesTeamData && salesTeamData.length > 0) {
        console.log('🔍 ALL SALESTEAM DATA TYPES:');
        const dataTypes = {};
        salesTeamData.forEach(item => {
            const type = item.type || 'no-type';
            dataTypes[type] = (dataTypes[type] || 0) + 1;
        });
        console.log('   Data type counts:', dataTypes);
        
        // Show sample of each type
        Object.keys(dataTypes).forEach(type => {
            const sample = salesTeamData.find(item => (item.type || 'no-type') === type);
            console.log(`   Sample ${type}:`, {
                agent_name: sample.agent_name,
                team: sample.team,
                tarikh: sample.tarikh,
                total_sale_bulan: sample.total_sale_bulan,
                createdAt: sample.createdAt
            });
        });
        
        // DEBUG: Check if current filter is active
        const currentAgent = (window.currentFilters && window.currentFilters.agent) || '';
        if (currentAgent) {
            console.log(`🎯 CURRENT ACTIVE FILTER: "${currentAgent}"`);
            console.log('   All agents in power_metrics data:');
            salesTeamData.filter(item => item.type === 'power_metrics').forEach(item => {
                const agentName = item.agent_name || item.team || 'Unknown';
                console.log(`     - "${agentName}" (matches filter: ${agentName === currentAgent})`);
            });
        }
    }
    
    // Debug: Log power metrics records
    const powerMetricsRecords = salesTeamData.filter(item => item.type === 'power_metrics');
    console.log(`📊 Power Metrics records found: ${powerMetricsRecords.length}`);
    powerMetricsRecords.forEach(record => {
        console.log(`   - ${record.agent_name || record.team || 'Unknown'}: RM ${record.total_sale_bulan} (${record.tarikh})`);
    });

    // Create calculator with Malaysia working pattern (Friday off only)
    const calculator = new EnhancedPowerMetricsCalculator([0,1,2,3,4,6]); // Sun-Thu + Sat
    const metrics = calculator.calculateAllMetrics(salesTeamData);
    
    // DEBUG: Log calculated metrics before UI update
    console.log('📊 CALCULATED METRICS for UI update:');
    // DEBUG: Detailed metrics (disabled to reduce console spam)
    // console.log(`   Sale MTD: RM ${metrics.saleMTD.toLocaleString()}`);
    // console.log(`   KPI Harian: RM ${metrics.dynamicKpiHarian.toLocaleString()}`);
    // console.log(`   KPI MTD: RM ${metrics.kpiMTD.toLocaleString()}`);
    // console.log(`   Balance Bulanan: RM ${metrics.balanceBulanan.toLocaleString()}`);
    // console.log(`   Balance MTD: RM ${metrics.balanceMTD.toLocaleString()}`);
    // console.log(`   Bilangan Terjual: ${metrics.bilanganTerjual}`);
    // console.log(`   Total Close Rate: ${metrics.totalCloseRate.toFixed(1)}%`);

    // Store metrics globally for Balance Monitor access
    window.currentPowerMetrics = {
        saleMTD: metrics.saleMTD,
        balanceMTD: metrics.balanceMTD,
        kpiMTD: metrics.kpiMTD,
        target: metrics.monthlyKPI || 15000,
        balanceBulanan: metrics.balanceBulanan,
        lastUpdated: new Date()
    };
    
    // Also store in localStorage for Balance Monitor access
    try {
        localStorage.setItem('currentPowerMetrics', JSON.stringify(window.currentPowerMetrics));
        // console.log('💾 Power metrics stored globally and in localStorage for Balance Monitor access');
    } catch (e) {
        console.warn('⚠️ Could not store to localStorage:', e);
    }

    // Helper function to update elements safely
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ Updating element '${id}' with value: ${value}`);
            element.textContent = value;
        } else {
            console.warn(`❌ Element with ID '${id}' not found`);
        }
    };

    // Update main KPI displays with DYNAMIC values
    updateElement('kpi-harian', `RM ${metrics.dynamicKpiHarian.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
    updateElement('kpi-mtd', `RM ${metrics.kpiMTD.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
    updateElement('sale-mtd', `RM ${metrics.saleMTD.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    updateElement('balance-bulanan', `RM ${metrics.balanceBulanan.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    updateElement('balance-mtd', `RM ${Math.abs(metrics.balanceMTD).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    updateElement('bilangan-terjual', metrics.bilanganTerjual.toString());
    updateElement('total-close-rate', `${metrics.totalCloseRate.toFixed(1)}%`);
    updateElement('working-days-info', `${metrics.workingDaysToDate} / ${metrics.totalWorkingDays}`);

    // Update descriptions with enhanced context
    updateElement('kpi-harian-desc', `${metrics.remainingWorkingDays} hari tinggal (${metrics.urgencyLevel.toLowerCase()})`);
    updateElement('kpi-mtd-desc', `sasaran ${metrics.workingDaysToDate} hari kerja`);
    updateElement('sale-mtd-desc', `${metrics.monthlyProgress.toFixed(1)}% dari target bulanan`);
    updateElement('balance-bulanan-desc', metrics.balanceBulanan <= 0 ? '🎯 Target tercapai!' : `perlu RM ${Math.ceil(metrics.dynamicKpiHarian)}/hari`);
    updateElement('balance-mtd-desc', metrics.balanceMTD > 0 ? 'ketinggalan MTD' : 'melebihi sasaran MTD');

    // Update progress bars with enhanced colors
    const monthlyProgressBar = document.getElementById('monthly-progress-bar');
    const mtdProgressBar = document.getElementById('mtd-progress-bar');
    
    if (monthlyProgressBar && mtdProgressBar) {
        console.log('📊 Updating progress bars...');
        console.log(`   Monthly Progress: ${metrics.monthlyProgress.toFixed(1)}%`);
        console.log(`   MTD Progress: ${metrics.mtdProgress.toFixed(1)}%`);
        
        // Monthly progress with performance-based colors
        const monthlyProgressPercent = Math.min(Math.max(metrics.monthlyProgress, 0), 100);
        monthlyProgressBar.style.width = `${monthlyProgressPercent}%`;
        
        // Use existing CSS classes instead of Tailwind
        monthlyProgressBar.className = 'progress-fill monthly-progress';
        
        // Set color based on urgency level using CSS custom properties
        const urgencyColors = {
            'ACHIEVED': '#10b981', // green
            'LOW': '#3b82f6',      // blue  
            'MODERATE': '#8b5cf6', // purple
            'HIGH': '#f59e0b',     // orange
            'URGENT': '#ef4444',   // red
            'CRITICAL': '#ec4899'  // pink
        };
        
        const urgencyColor = urgencyColors[metrics.urgencyLevel] || urgencyColors['MODERATE'];
        monthlyProgressBar.style.background = `linear-gradient(90deg, ${urgencyColor}, #3b82f6)`;
        
        updateElement('monthly-progress-text', `${monthlyProgressPercent.toFixed(1)}% (RM ${metrics.saleMTD.toLocaleString('ms-MY')} / RM ${metrics.monthlyKPI.toLocaleString('ms-MY')})`);

        // MTD progress
        const mtdProgressPercent = Math.min(Math.max(metrics.mtdProgress, 0), 100);
        mtdProgressBar.style.width = `${mtdProgressPercent}%`;
        
        // Use existing CSS class
        mtdProgressBar.className = 'progress-fill mtd-progress';
        
        // Set color based on performance
        let mtdColor = '#ef4444'; // red by default
        if (metrics.isOnTrack) {
            mtdColor = '#10b981'; // green
        } else if (mtdProgressPercent >= 70) {
            mtdColor = '#f59e0b'; // orange
        }
        
        mtdProgressBar.style.background = `linear-gradient(90deg, ${mtdColor}, #8b5cf6)`;
        
        updateElement('mtd-progress-text', `${mtdProgressPercent.toFixed(1)}% (RM ${metrics.saleMTD.toLocaleString('ms-MY')} / RM ${metrics.kpiMTD.toLocaleString('ms-MY')})`);
        
        console.log('✅ Progress bars updated successfully');
    } else {
        console.warn('⚠️ Progress bar elements not found!');
        console.log(`   monthlyProgressBar: ${!!monthlyProgressBar}`);
        console.log(`   mtdProgressBar: ${!!mtdProgressBar}`);
    }

    // Update status indicators with enhanced logic
    updateEnhancedStatusIndicators(metrics);

    // Add notification/alert if critical
    if (metrics.urgencyLevel === 'URGENT' || metrics.urgencyLevel === 'CRITICAL') {
        showUrgencyAlert(metrics);
    }

    // Console log for monitoring
    console.log(`🔥 Enhanced Power Metrics Updated:`, {
        'Date': new Date().toLocaleDateString('ms-MY'),
        'Dynamic KPI/Day': `RM ${metrics.dynamicKpiHarian.toFixed(0)}`,
        'Static vs Dynamic': `${metrics.adjustmentPercentage > 0 ? '+' : ''}${metrics.adjustmentPercentage.toFixed(1)}%`,
        'Monthly Progress': `${metrics.monthlyProgress.toFixed(1)}%`,
        'Urgency': metrics.urgencyLevel,
        'Days Left': metrics.remainingWorkingDays,
        'Recommendation': metrics.recommendation
    });

    return metrics;
}

// Enhanced status indicators with dynamic logic
function updateEnhancedStatusIndicators(metrics) {
    const updateStatusElement = (id, text, className = null) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
            if (className) {
                element.className = className;
            }
        }
    };

    // KPI Harian Status with dynamic adjustment indicator
    const adjustmentPercent = metrics.adjustmentPercentage;
    let kpiHarianText, kpiHarianClass;
    
    if (adjustmentPercent > 20) {
        kpiHarianText = `↑ +${adjustmentPercent.toFixed(0)}%`;
        kpiHarianClass = 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full';
    } else if (adjustmentPercent > 0) {
        kpiHarianText = `↗ +${adjustmentPercent.toFixed(0)}%`;
        kpiHarianClass = 'text-xs text-orange-400 bg-orange-400/20 px-2 py-1 rounded-full';
    } else if (adjustmentPercent < -20) {
        kpiHarianText = `↓ ${adjustmentPercent.toFixed(0)}%`;
        kpiHarianClass = 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full';
    } else if (adjustmentPercent < 0) {
        kpiHarianText = `↘ ${adjustmentPercent.toFixed(0)}%`;
        kpiHarianClass = 'text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full';
    } else {
        kpiHarianText = 'Static';
        kpiHarianClass = 'text-xs text-gray-400 bg-gray-400/20 px-2 py-1 rounded-full';
    }
    
    updateStatusElement('kpi-harian-status', kpiHarianText, kpiHarianClass);

    // KPI MTD Status based on expected vs actual
    if (metrics.mtdProgress >= 100) {
        updateStatusElement('kpi-mtd-status', '🎯 Achieved', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.mtdProgress >= 90) {
        updateStatusElement('kpi-mtd-status', '✓ On Track', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.mtdProgress >= 70) {
        updateStatusElement('kpi-mtd-status', '△ Close', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('kpi-mtd-status', '⚠ Behind', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Sale MTD Trend with performance comparison
    if (metrics.isAhead) {
        updateStatusElement('sale-mtd-trend', '🚀 Ahead', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.performanceGap > -5) {
        updateStatusElement('sale-mtd-trend', '📈 Close', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('sale-mtd-trend', '📉 Behind', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Balance Bulanan Status with urgency
    if (metrics.balanceBulanan <= 0) {
        updateStatusElement('balance-bulanan-status', '🏆 Done', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else {
        const urgencyColors = {
            'CRITICAL': 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full',
            'URGENT': 'text-xs text-orange-400 bg-orange-400/20 px-2 py-1 rounded-full',
            'HIGH': 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full',
            'MODERATE': 'text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full',
            'LOW': 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full'
        };
        updateStatusElement('balance-bulanan-status', metrics.urgencyLevel, urgencyColors[metrics.urgencyLevel]);
    }

    // Balance MTD Status
    if (metrics.balanceMTD <= 0) {
        updateStatusElement('balance-mtd-status', '✅ Surplus', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.balanceMTD <= 1000) {
        updateStatusElement('balance-mtd-status', '📊 Gap Small', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('balance-mtd-status', '🎯 Need Push', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Close Rate Status
    if (metrics.totalCloseRate >= 25) {
        updateStatusElement('close-rate-status', '🌟 Excellent', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.totalCloseRate >= 15) {
        updateStatusElement('close-rate-status', '✓ Good', 'text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full');
    } else if (metrics.totalCloseRate >= 10) {
        updateStatusElement('close-rate-status', '△ Average', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('close-rate-status', '📈 Improve', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Working Days Status with time urgency
    if (metrics.remainingWorkingDays <= 0) {
        updateStatusElement('working-days-status', '🏁 Month End', 'text-xs text-purple-400 bg-purple-400/20 px-2 py-1 rounded-full');
    } else if (metrics.remainingWorkingDays <= 3) {
        updateStatusElement('working-days-status', '🔥 Final Push', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    } else if (metrics.remainingWorkingDays <= 7) {
        updateStatusElement('working-days-status', '⚡ Sprint', 'text-xs text-orange-400 bg-orange-400/20 px-2 py-1 rounded-full');
    } else if (metrics.isAhead) {
        updateStatusElement('working-days-status', '✨ Cruising', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('working-days-status', '🎯 Focus', 'text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full');
    }
}

// Show urgency alert for critical situations
function showUrgencyAlert(metrics) {
    // Create or update alert banner
    let alertBanner = document.getElementById('urgency-alert');
    
    if (!alertBanner) {
        alertBanner = document.createElement('div');
        alertBanner.id = 'urgency-alert';
        alertBanner.className = 'fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg animate-pulse';
        document.body.appendChild(alertBanner);
    }

    const alertColors = {
        'URGENT': 'bg-orange-500 text-white',
        'CRITICAL': 'bg-red-500 text-white'
    };

    const alertIcons = {
        'URGENT': '⚡',
        'CRITICAL': '🚨'
    };

    alertBanner.className = `fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg animate-pulse ${alertColors[metrics.urgencyLevel]}`;
    alertBanner.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="text-2xl">${alertIcons[metrics.urgencyLevel]}</div>
            <div>
                <div class="font-bold text-sm">${metrics.urgencyLevel} - ${metrics.remainingWorkingDays} Days Left!</div>
                <div class="text-xs mt-1">Need RM ${metrics.dynamicKpiHarian.toFixed(0)}/day to reach target</div>
                <div class="text-xs mt-2 opacity-90">${metrics.recommendation}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">×</button>
        </div>
    `;

    // Auto remove after 10 seconds
    setTimeout(() => {
        if (alertBanner && alertBanner.parentElement) {
            alertBanner.remove();
        }
    }, 10000);
}

// Integration instructions for dashboard.js
function integrateToDashboard() {
    console.log(`
🔄 INTEGRATION STEPS FOR DASHBOARD.JS:

1. Replace the old updatePowerMetricsDisplay function call with:
   updateEnhancedPowerMetricsDisplay(filteredData.salesteam);

2. Update the function calls in dashboard.js:
   - In applyFilters(): updateEnhancedPowerMetricsDisplay(filteredData.salesteam);
   - In clearFilters(): updateEnhancedPowerMetricsDisplay(allData.salesteam);
   - In initializeDashboard(): updateEnhancedPowerMetricsDisplay(allData.salesteam);

3. Test scenarios:
   - Run demonstrateDynamicKPI() in console to see examples
   - Check different sales amounts to see KPI adjustments
   - Verify working days calculation for current month

📊 FEATURES:
✅ Auto-detects working days (Friday off by default)
✅ Dynamic KPI adjustment based on current sales
✅ Urgency levels (LOW, MODERATE, HIGH, URGENT, CRITICAL)
✅ Visual alerts for critical situations
✅ Enhanced status indicators
✅ Performance-based progress bar colors
✅ Detailed console logging for monitoring

🎯 WORKING DAYS CONFIGURATION:
- Current: Sunday-Thursday + Saturday (Friday off)
- To change: Pass different array to EnhancedPowerMetricsCalculator([1,2,3,4,5])
- [1,2,3,4,5] = Monday to Friday (weekends off)
- [0,1,2,3,4,6] = Sunday-Thursday + Saturday (Friday off) - Malaysian pattern

📈 DYNAMIC KPI EXAMPLE:
- Monthly Target: RM 15,000
- Days in Month: 27 working days
- Static KPI: RM 556/day
- If RM 2,000 sales on day 3: Dynamic KPI adjusts to RM 542/day for remaining 24 days
- If no sales yet: Dynamic KPI stays at RM 556/day
- If behind schedule: Dynamic KPI increases accordingly
    `);
}

console.log(`✅ Enhanced Dynamic Power Metrics Calculator loaded successfully!`);
console.log(`🚀 Try running: demonstrateDynamicKPI() to see it in action`);
console.log(`📋 Run: integrateToDashboard() for integration instructions`);

// Make functions available globally
if (typeof window !== 'undefined') {
    window.updateEnhancedPowerMetricsDisplay = updateEnhancedPowerMetricsDisplay;
    window.integrateToDashboard = integrateToDashboard;
}

// 1. ADD THIS GLOBAL VARIABLE (after existing global variables)
let enhancedLeadChart = null;

// 4. REPLACE the updateEnhancedLeadsChart function with this simplified version:
function updateLeadsOnlyChart(data) {
    console.log('🔍 Lead Distribution - Processing LEADS ONLY:', data);
    
    // Check if chart element exists
    const ctx = document.getElementById('leadsChart');
    if (!ctx) {
        console.log('leadsChart element not found');
        return;
    }
    
    // Get filter values (remove source filter since we only show leads)
    const teamFilter = document.getElementById('lead-team-filter');
    const timeFilter = document.getElementById('lead-time-filter');
    
    const selectedTeam = teamFilter?.value || '';
    const selectedTime = timeFilter?.value || '';
    
    console.log('📊 Lead Filters:', { selectedTeam, selectedTime });
    
    // Process ONLY lead data from sales team
    const processedData = processLeadsOnlyData(data.salesteam, selectedTeam, selectedTime);
    
    // Calculate simplified metrics
    const metrics = calculateLeadsOnlyMetrics(processedData);
    
    // Render chart with white text
    renderLeadsOnlyChart(processedData, metrics);
}

// 2. REPLACE the processComprehensiveLeadData function with this LEADS-ONLY version:
function processLeadsOnlyData(salesTeamData, selectedTeam, selectedTime) {
    console.log('📊 Processing LEADS-ONLY data...');
    
    const leadsOnlyData = {};
    let totalLeads = 0;
    
    // Process ONLY Sales Team Lead Data (remove marketing processing)
    const salesLeadData = salesTeamData.filter(item => item.type === 'lead');
    
    // Group by team to find latest entry
    const teamLatestData = {};
    
    salesLeadData.forEach(item => {
        const team = item.team || item.agent || 'Unknown Team';
        const itemTime = item.masa;
        const itemDate = item.tarikh;
        
        // Skip if team filter is applied and doesn't match
        if (selectedTeam && team !== selectedTeam) return;
        
        // Create unique key for comparison
        const itemDateTime = new Date(`${itemDate} ${itemTime || '00:00'}`);
        
        // Initialize team data if not exists
        if (!teamLatestData[team]) {
            teamLatestData[team] = {
                latestEntry: null,
                latestDateTime: null,
                timeEntries: {},
                source: 'salesteam'
            };
        }
        
        // Store time-specific entries
        if (itemTime) {
            if (!teamLatestData[team].timeEntries[itemTime] || 
                itemDateTime > new Date(`${teamLatestData[team].timeEntries[itemTime].tarikh} ${teamLatestData[team].timeEntries[itemTime].masa}`)) {
                teamLatestData[team].timeEntries[itemTime] = item;
            }
        }
        
        // Track overall latest entry
        if (!teamLatestData[team].latestDateTime || itemDateTime > teamLatestData[team].latestDateTime) {
            teamLatestData[team].latestDateTime = itemDateTime;
            teamLatestData[team].latestEntry = item;
        }
    });
    
    // Extract sales team data based on selected time
    Object.entries(teamLatestData).forEach(([team, data]) => {
        let displayData = null;
        
        if (selectedTime) {
            displayData = data.timeEntries[selectedTime];
        } else {
            displayData = data.latestEntry;
        }
        
        if (displayData) {
            const leads = parseInt(displayData.total_lead) || 0;
            // Remove "(Sales)" suffix since we only show sales data now
            leadsOnlyData[team] = {
                totalLeads: leads,
                cold: parseInt(displayData.cold) || 0,
                warm: parseInt(displayData.warm) || 0,
                hot: parseInt(displayData.hot) || 0,
                time: displayData.masa,
                date: displayData.tarikh,
                source: 'salesteam',
                team_sale: displayData.team || team
            };
            totalLeads += leads;
        }
    });
    
    console.log('📊 Leads-only processed data:', leadsOnlyData);
    console.log('📊 Total leads:', totalLeads);
    
    return {
        teams: leadsOnlyData,
        totalLeads: totalLeads,
        totalSpend: 0 // No marketing spend since we removed marketing
    };
}

// 3. REPLACE the calculateEnhancedLeadMetrics function with this simplified version:
function calculateLeadsOnlyMetrics(processedData) {
    // Calculate lead quality distribution (only from sales team data)
    const totalCold = Object.values(processedData.teams).reduce((sum, team) => sum + team.cold, 0);
    const totalWarm = Object.values(processedData.teams).reduce((sum, team) => sum + team.warm, 0);
    const totalHot = Object.values(processedData.teams).reduce((sum, team) => sum + team.hot, 0);
    
    return {
        totalSpend: 0, // No marketing spend
        spendPerLead: 0, // No spend calculation needed
        leadQuality: {
            cold: totalCold,
            warm: totalWarm,
            hot: totalHot,
            coldPercent: processedData.totalLeads > 0 ? (totalCold / processedData.totalLeads) * 100 : 0,
            warmPercent: processedData.totalLeads > 0 ? (totalWarm / processedData.totalLeads) * 100 : 0,
            hotPercent: processedData.totalLeads > 0 ? (totalHot / processedData.totalLeads) * 100 : 0
        },
        sourcesCount: Object.values(processedData.teams).length, // Only sales teams
        marketingCount: 0 // No marketing data
    };
}

// 5. REPLACE the renderEnhancedLeadDistributionChart function with this WHITE TEXT version:
function renderLeadsOnlyChart(processedData, metrics) {
    const ctx = document.getElementById('leadsChart')?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart
    if (enhancedLeadChart) {
        enhancedLeadChart.destroy();
    }
    
    const teams = Object.keys(processedData.teams);
    const leadCounts = teams.map(team => processedData.teams[team].totalLeads);
    
    // Handle empty data
    if (teams.length === 0 || processedData.totalLeads === 0) {
        renderLeadsOnlyEmptyChart(ctx);
        return;
    }
    
    // Sales team color palette (various shades since we only show sales)
    const colorPalette = [
        '#10B981', // Green
        '#3B82F6', // Blue  
        '#8B5CF6', // Purple
        '#F59E0B', // Yellow
        '#EF4444', // Red
        '#EC4899', // Pink
        '#14B8A6', // Teal
        '#F97316', // Orange
        '#6366F1', // Indigo
        '#84CC16', // Lime
    ];
    
    const backgroundColors = teams.map((team, index) => colorPalette[index % colorPalette.length]);
    
    enhancedLeadChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: teams,
            datasets: [{
                data: leadCounts,
                backgroundColor: backgroundColors,
                borderColor: '#1F2937',
                borderWidth: 2,
                hoverOffset: 8,
                hoverBorderWidth: 3,
                hoverBorderColor: '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: -90,
            circumference: 360,
            
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10
                }
            },
            
            plugins: {
                legend: { 
                    position: 'bottom',
                    align: 'center',
                    labels: { 
                        color: '#FFFFFF', // WHITE TEXT for legend
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { 
                            size: 12,
                            weight: '500'
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = ((value / processedData.totalLeads) * 100).toFixed(1);
                                    return {
                                        text: `${label}: ${value} leads (${percentage}%)`,
                                        fillStyle: backgroundColors[i],
                                        strokeStyle: backgroundColors[i],
                                        lineWidth: 0,
                                        hidden: false,
                                        index: i,
                                        pointStyle: 'circle'
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#FFFFFF', // WHITE TEXT
                    bodyColor: '#FFFFFF',  // WHITE TEXT
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        title: function(tooltipItems) {
                            return `👥 ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            const team = context.label;
                            const teamData = processedData.teams[team];
                            const percentage = ((teamData.totalLeads / processedData.totalLeads) * 100).toFixed(1);
                            return `Total: ${teamData.totalLeads} leads (${percentage}%)`;
                        },
                        afterLabel: function(context) {
                            const team = context.label;
                            const teamData = processedData.teams[team];
                            const details = [];
                            
                            details.push(`🧊 Cold: ${teamData.cold} | 🔥 Warm: ${teamData.warm} | ⚡ Hot: ${teamData.hot}`);
                            details.push(`📅 ${teamData.date} ${teamData.time || ''}`);
                            details.push(`📊 Source: Sales Team`);
                            
                            return details;
                        }
                    }
                }
            },
            
            animation: {
                animateRotate: true,
                animateScale: false,
                duration: 800,
                easing: 'easeInOutQuart'
            },
            
            cutout: '50%',
            
            elements: {
                arc: {
                    borderRadius: 4,
                    borderAlign: 'inner'
                }
            }
        }
    });
}

// 10. Debug functions for troubleshooting
window.debugEnhancedLeadChart = function() {
    console.log('🔍 === ENHANCED LEAD CHART DEBUG ===');
    
    if (!allData) {
        console.log('❌ No data available');
        return;
    }

    console.log('📊 Sales Team data:', allData.salesteam?.length || 0, 'records');
    console.log('📊 Marketing data:', allData.marketing?.length || 0, 'records');
    
    // Show sample sales team lead data
    const salesLeads = allData.salesteam?.filter(item => item.type === 'lead') || [];
    console.log('📋 Sales Team Leads:', salesLeads.length);
    salesLeads.slice(0, 3).forEach((item, index) => {
        console.log(`[Sales ${index}]`, {
            team: item.team,
            total_lead: item.total_lead,
            cold: item.cold,
            warm: item.warm,
            hot: item.hot,
            date: item.tarikh,
            time: item.masa
        });
    });
    
    // Show sample marketing lead semasa data
    const marketingLeads = allData.marketing?.filter(item => item.type === 'lead_semasa') || [];
    console.log('📋 Marketing Lead Semasa:', marketingLeads.length);
    marketingLeads.slice(0, 3).forEach((item, index) => {
        console.log(`[Marketing ${index}]`, {
            team_sale: item.team_sale,
            spend: item.spend,
            date: item.tarikh,
            time: item.masa
        });
    });
    
    console.log('🔍 === END DEBUG ===');
    
    // Force refresh chart
    if (typeof applyFilters === 'function') {
        applyFilters();
    }
};

// 11. Test function for enhanced lead chart
window.testEnhancedLeadChart = function() {
    console.log('🧪 Testing Enhanced Lead Chart...');
    window.debugEnhancedLeadChart();
    
    // Show current filter states
    const teamFilter = document.getElementById('lead-team-filter');
    const timeFilter = document.getElementById('lead-time-filter');
    const sourceFilter = document.getElementById('lead-source-filter');
    
    console.log('🔧 Current Filters:', {
        team: teamFilter?.value || 'None',
        time: timeFilter?.value || 'None',
        source: sourceFilter?.value || 'None'
    });
};

// Update marketing budget display
function updateMarketingBudgetDisplay(marketingData) {
    const totalSpend = marketingData
        .filter(item => item.type === 'lead_semasa')
        .reduce((sum, item) => sum + (parseFloat(item.spend) || 0), 0);
    
    const budgetDisplay = document.getElementById('marketing-budget-display');
    if (budgetDisplay) {
        budgetDisplay.textContent = `RM ${totalSpend.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    return totalSpend;
}

// Calculate and display lead efficiency
function updateLeadEfficiencyDisplay(salesTeamData) {
    // Calculate conversion rate from leads to sales
    const leadData = salesTeamData.filter(item => item.type === 'lead');
    const powerMetricsData = salesTeamData.filter(item => item.type === 'power_metrics');
    
    const totalLeads = leadData.reduce((sum, item) => sum + (parseInt(item.total_lead) || 0), 0);
    const totalCloses = powerMetricsData.reduce((sum, item) => sum + (parseInt(item.total_close_bulan) || 0), 0);
    
    const efficiency = totalLeads > 0 ? (totalCloses / totalLeads) * 100 : 0;
    
    const efficiencyDisplay = document.getElementById('lead-efficiency-display');
    if (efficiencyDisplay) {
        efficiencyDisplay.textContent = `${efficiency.toFixed(1)}%`;
    }
    
    return efficiency;
}


// 10. Debug function to check lead data
window.debugLeadData = function() {
    console.log('🔍 === LEAD DATA DEBUG ===');
    
    const leadData = allData.salesteam.filter(item => item.type === 'lead');
    console.log('Total lead entries:', leadData.length);
    
    // Group by team and time
    const groupedData = {};
    leadData.forEach(item => {
        const team = item.team || 'Unknown';
        if (!groupedData[team]) groupedData[team] = [];
        groupedData[team].push({
            date: item.tarikh,
            time: item.masa,
            total: item.total_lead,
            cold: item.cold,
            warm: item.warm,
            hot: item.hot
        });
    });
    
    console.log('Grouped by team:', groupedData);
    
    // Show latest for each team
    Object.entries(groupedData).forEach(([team, entries]) => {
        entries.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
            const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
            return dateB - dateA;
        });
        console.log(`Latest for ${team}:`, entries[0]);
    });
};

// 12. test mrketing budget display
// Enhanced function to load marketing cost data
async function loadMarketingCostData() {
    // Validate Firestore database connection
    if (!window.db) {
        throw new Error('Firestore database not initialized for loadMarketingCostData');
    }
    
    try {
        console.log('📊 Loading marketing cost data...');
        
        // Get marketing spend data (from marketingData collection)
        const marketingCollectionRef = collection(window.db, "marketingData");
        if (!marketingCollectionRef) {
            throw new Error('Failed to create marketingData collection reference');
        }
        
        const marketingQuery = query(
            marketingCollectionRef,
            where("type", "==", "lead_semasa"),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        
        const marketingSnapshot = await getDocs(marketingQuery);
        const marketingSpendData = {};
        
        marketingSnapshot.forEach((doc) => {
            const data = doc.data();
            const key = `${data.tarikh}_${data.team_sale}`;
            
            if (!marketingSpendData[key]) {
                marketingSpendData[key] = {
                    date: data.tarikh,
                    team: data.team_sale,
                    totalSpend: 0,
                    entries: 0
                };
            }
            
            marketingSpendData[key].totalSpend += (data.spend || 0);
            marketingSpendData[key].entries += 1;
        });

        // Get sales team lead data (from salesTeamData collection)
        const salesCollectionRef = collection(window.db, "salesTeamData");
        if (!salesCollectionRef) {
            throw new Error('Failed to create salesTeamData collection reference');
        }
        
        const salesQuery = query(
            salesCollectionRef,
            where("type", "==", "lead"),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        
        const salesSnapshot = await getDocs(salesQuery);
        const salesLeadData = {};
        
        salesSnapshot.forEach((doc) => {
            const data = doc.data();
            const key = `${data.tarikh}_${data.team}`;
            
            if (!salesLeadData[key]) {
                salesLeadData[key] = {
                    date: data.tarikh,
                    team: data.team,
                    totalLeads: 0,
                    entries: 0
                };
            }
            
            salesLeadData[key].totalLeads += (data.total_lead || 0);
            salesLeadData[key].entries += 1;
        });

        // Combine data and calculate cost per lead
        const combinedData = [];
        
        Object.keys(marketingSpendData).forEach(key => {
            const marketing = marketingSpendData[key];
            const sales = salesLeadData[key];
            
            if (sales && sales.totalLeads > 0) {
                combinedData.push({
                    date: marketing.date,
                    team: marketing.team,
                    totalSpend: marketing.totalSpend,
                    totalLeads: sales.totalLeads,
                    costPerLead: marketing.totalSpend / sales.totalLeads,
                    marketingEntries: marketing.entries,
                    salesEntries: sales.entries
                });
            }
        });

        return combinedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    } catch (error) {
        console.error('Error loading marketing cost data:', error);
        return [];
    }
}

// Function to update cost per lead KPI card (if you want to add one)
function updateCostPerLeadKPI(costData) {
    if (costData.length === 0) return;

    const totalSpend = costData.reduce((sum, item) => sum + item.totalSpend, 0);
    const totalLeads = costData.reduce((sum, item) => sum + item.totalLeads, 0);
    const avgCostPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;

    // Find existing KPI card or create new one
    let kpiCard = document.querySelector('.cost-per-lead-kpi');
    
    if (!kpiCard) {
        // Create new KPI card and add to KPI grid
        const kpiGrid = document.querySelector('.kpi-grid');
        if (kpiGrid) {
            kpiCard = document.createElement('div');
            kpiCard.className = 'kpi-card cost-per-lead-kpi cost-card';
            kpiCard.innerHTML = `
                <div class="kpi-header">
                    <div class="kpi-icon cost-icon">
                        <i class="fas fa-calculator"></i>
                    </div>
                    <span class="kpi-trend" id="cost-trend">-</span>
                </div>
                <div class="kpi-content">
                    <h4 class="kpi-title">Cost per Lead</h4>
                    <p class="kpi-value" id="avg-cost-per-lead">RM 0.00</p>
                    <p class="kpi-meta" id="cost-efficiency">-</p>
                </div>
            `;
            kpiGrid.appendChild(kpiCard);
        }
    }

    // Update KPI values
    const valueElement = document.getElementById('avg-cost-per-lead');
    const metaElement = document.getElementById('cost-efficiency');
    const trendElement = document.getElementById('cost-trend');

    if (valueElement) {
        valueElement.textContent = `RM ${avgCostPerLead.toFixed(2)}`;
    }

    if (metaElement) {
        const efficiency = avgCostPerLead < 10 ? 'Excellent' : 
                         avgCostPerLead < 20 ? 'Good' : 
                         avgCostPerLead < 50 ? 'Fair' : 'Needs Improvement';
        metaElement.textContent = `${efficiency} efficiency`;
    }

    if (trendElement) {
        // Calculate trend based on recent data
        if (costData.length >= 2) {
            const recent = costData.slice(-3);
            const older = costData.slice(-6, -3);
            
            if (older.length > 0) {
                const recentAvg = recent.reduce((sum, item) => sum + item.costPerLead, 0) / recent.length;
                const olderAvg = older.reduce((sum, item) => sum + item.costPerLead, 0) / older.length;
                
                if (recentAvg < olderAvg) {
                    trendElement.innerHTML = '<i class="fas fa-arrow-down"></i>'; // Improving (cost decreasing)
                    trendElement.className = 'kpi-trend trend-up'; // Green for good trend
                } else if (recentAvg > olderAvg) {
                    trendElement.innerHTML = '<i class="fas fa-arrow-up"></i>'; // Worsening (cost increasing)
                    trendElement.className = 'kpi-trend trend-down'; // Red for bad trend
                } else {
                    trendElement.innerHTML = '<i class="fas fa-minus"></i>';
                    trendElement.className = 'kpi-trend trend-stable';
                }
            }
        }
    }
}

// Add refresh button functionality for the cost chart
document.addEventListener('DOMContentLoaded', () => {
    // Add refresh button to the cost chart if it doesn't exist
    const costChartCard = document.querySelector('.enhanced-cost-chart');
    if (costChartCard) {
        const chartHeader = costChartCard.querySelector('.chart-header');
        if (chartHeader && !chartHeader.querySelector('.cost-refresh-btn')) {
            const refreshBtn = document.createElement('button');
            refreshBtn.className = 'cost-refresh-btn btn btn-outline btn-sm ml-2';
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            refreshBtn.title = 'Refresh Cost Analysis';
            
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                await refreshCostAnalysis();
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            });
            
            const headerRight = chartHeader.querySelector('.header-right') || chartHeader.querySelector('.chart-badge').parentElement;
            if (headerRight) {
                headerRight.appendChild(refreshBtn);
            }
        }
    }
});
function renderLeadsOnlyEmptyChart(ctx) {
    enhancedLeadChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tiada Data'],
            datasets: [{
                data: [1],
                backgroundColor: ['#374151'],
                borderColor: '#1F2937',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: -90,
            circumference: 360,
            cutout: '50%',
            
            layout: {
                padding: 20
            },
            
            plugins: {
                legend: { 
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#FFFFFF', // WHITE TEXT for consistency
                        font: { 
                            size: 12,
                            weight: '500'
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    callbacks: {
                        label: () => 'Tiada data lead tersedia'
                    }
                }
            },
            
            animation: {
                animateRotate: true,
                duration: 600
            }
        }
    });
}

console.log('✅ Lead Distribution Chart modified:');
console.log('📊 ✓ Shows ONLY sales team leads (no marketing data)');
console.log('🎨 ✓ All text changed to WHITE color');
console.log('📋 ✓ Updated chart title and subtitle');
console.log('🔧 ✓ Simplified data processing (leads only)');

/* // Make functions available globally
if (typeof window !== 'undefined') {
    window.updateLeadsOnlyChart = updateLeadsOnlyChart;
    window.processLeadsOnlyData = processLeadsOnlyData;
    window.calculateLeadsOnlyMetrics = calculateLeadsOnlyMetrics;
    window.renderLeadsOnlyChart = renderLeadsOnlyChart;
    window.renderLeadsOnlyEmptyChart = renderLeadsOnlyEmptyChart;
} */
// Export for external use
window.loadMarketingCostData = loadMarketingCostData;
window.updateCostPerLeadKPI = updateCostPerLeadKPI;

// Debug function untuk test fallback charts
window.debugFallbackCharts = function() {
    console.log('🔍 DEBUGGING FALLBACK CHARTS');
    
    // Check if elements exist
    const channelCtx = document.getElementById('channelChart');
    const teamCtx = document.getElementById('teamChart');
    
    console.log('Chart elements:');
    console.log(`   channelChart: ${channelCtx ? 'Found' : 'Not found'}`);
    console.log(`   teamChart: ${teamCtx ? 'Found' : 'Not found'}`);
    
    if (window.allData) {
        console.log('Available data:');
        console.log(`   Orders: ${window.allData.orders?.length || 0}`);
        console.log(`   Salesteam: ${window.allData.salesteam?.length || 0}`);
        console.log(`   Ecommerce: ${window.allData.ecommerce?.length || 0}`);
        
        // Test updating fallback charts
        console.log('\n🧪 Testing fallback chart updates...');
        updateChannelChart(window.allData);
        updateTeamChart(window.allData);
    } else {
        console.log('❌ No allData available');
    }
};

// Debug function untuk check data loading
window.debugDataLoading = function() {
    console.log('🔍 DEBUGGING DATA LOADING');
    
    // Check Firebase connection
    console.log('Firebase db available:', window.db ? 'Yes' : 'No');
    
    // Check current data state
    console.log('Current allData:', {
        orders: window.allData?.orders?.length || 0,
        marketing: window.allData?.marketing?.length || 0,
        salesteam: window.allData?.salesteam?.length || 0,
        ecommerce: window.allData?.ecommerce?.length || 0
    });
    
    // Test manual data fetch
    if (window.db) {
        console.log('🔄 Testing manual data fetch...');
        fetchAllData().then(() => {
            console.log('✅ Data fetch completed');
            console.log('Updated allData:', {
                orders: window.allData?.orders?.length || 0,
                marketing: window.allData?.marketing?.length || 0,
                salesteam: window.allData?.salesteam?.length || 0,
                ecommerce: window.allData?.ecommerce?.length || 0
            });
            
            // Test updating UI
            console.log('🔄 Testing UI updates...');
            applyFilters();
        }).catch(error => {
            console.error('❌ Data fetch failed:', error);
        });
    } else {
        console.error('❌ Firebase not initialized');
    }
};

// Debug function untuk test full dashboard initialization
window.debugFullDashboard = function() {
    console.log('🔍 DEBUGGING FULL DASHBOARD INITIALIZATION');
    
    // Step 1: Check dependencies
    console.log('📋 Step 1: Dependencies Check');
    console.log('   Firebase db:', window.db ? 'Available' : 'Missing');
    console.log('   Chart.js:', typeof Chart !== 'undefined' ? 'Available' : 'Missing');
    console.log('   ProfessionalCharts:', window.ProfessionalCharts ? 'Available' : 'Missing');
    
    // Step 2: Check HTML elements
    console.log('📋 Step 2: HTML Elements Check');
    const criticalElements = [
        'total-sales', 'total-leads-value', 'leads-per-agent', 'total-orders',
        'channelChart', 'teamChart', 'marketingCostChart', 'marketingROIChart'
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`   ${id}:`, element ? 'Found' : 'Missing');
    });
    
    // Step 3: Test data loading
    console.log('📋 Step 3: Data Loading Test');
    if (window.db) {
        fetchAllData().then(() => {
            console.log('   ✅ Data loaded successfully');
            
            // Step 4: Test UI updates
            console.log('📋 Step 4: UI Update Test');
            updateKPIs(window.allData);
            applyFilters();
            
            // Step 5: Test chart creation
            console.log('📋 Step 5: Chart Creation Test');
            if (window.ProfessionalCharts) {
                window.ProfessionalCharts.updateChannelChart(window.allData);
                window.ProfessionalCharts.updateTeamChart(window.allData);
                console.log('   ✅ Professional charts updated');
            } else {
                updateChannelChart(window.allData);
                updateTeamChart(window.allData);
                console.log('   ✅ Fallback charts updated');
            }
            
            console.log('🎉 Full dashboard debug completed!');
        }).catch(error => {
            console.error('❌ Data loading failed:', error);
        });
    } else {
        console.error('❌ Cannot test - Firebase not available');
    }
};

// Debug function untuk test refresh scenarios  
window.debugRefreshScenarios = function() {
    console.log('🔍 DEBUGGING REFRESH SCENARIOS');
    
    // Check current cache state
    const cachedData = checkCachedData();
    console.log('Cache state:', cachedData ? 'Available' : 'Empty');
    
    if (cachedData) {
        console.log('Cached data summary:', {
            orders: cachedData.orders?.length || 0,
            marketing: cachedData.marketing?.length || 0,
            salesteam: cachedData.salesteam?.length || 0,
            ecommerce: cachedData.ecommerce?.length || 0
        });
    }
    
    // Check Firebase state
    console.log('Firebase state:', window.db ? 'Available' : 'Not available');
    console.log('Firebase handled flag:', window.firebaseHandled || false);
    
    // Check current allData
    console.log('Current allData:', {
        orders: window.allData?.orders?.length || 0,
        marketing: window.allData?.marketing?.length || 0,
        salesteam: window.allData?.salesteam?.length || 0,
        ecommerce: window.allData?.ecommerce?.length || 0
    });
    
    // Simulate refresh by clearing Firebase flag and re-running initialization
    console.log('\n🔄 Simulating refresh scenario...');
    window.firebaseHandled = false;
    
    if (window.db) {
        console.log('✅ Firebase available - would handle Firebase ready');
    } else {
        console.log('❌ Firebase not available - would wait for Firebase');
    }
    
    // Test saving current data to cache
    if (window.allData && (window.allData.orders?.length > 0 || window.allData.salesteam?.length > 0)) {
        console.log('💾 Testing cache save...');
        saveDataForBalanceMonitor();
        
        // Verify save worked
        const newCache = checkCachedData();
        console.log('Cache after save:', newCache ? 'Saved successfully' : 'Save failed');
    }
};

// Debug function untuk clear cache and test no-cache scenario
window.debugClearCache = function() {
    console.log('🗑️ CLEARING CACHE FOR TESTING');
    
    localStorage.removeItem('dashboardCache');
    localStorage.removeItem('dashboardAllData');
    
    console.log('✅ Cache cleared. Refresh page to test no-cache scenario.');
};

// Function to detect and fix refresh issues
window.detectRefreshIssues = function() {
    console.log('🔍 DETECTING REFRESH ISSUES');
    
    // Check if we have the minimum expected data
    const hasData = window.allData && (
        (window.allData.orders && window.allData.orders.length > 0) ||
        (window.allData.salesteam && window.allData.salesteam.length > 0) ||
        (window.allData.marketing && window.allData.marketing.length > 0)
    );
    
    // Check if Firebase is connected
    const hasFirebase = window.db ? true : false;
    
    // Check if critical elements exist
    const hasElements = document.getElementById('total-sales') && 
                       document.getElementById('channelChart') &&
                       document.getElementById('teamChart');
    
    console.log('Issue detection results:');
    console.log('  Has data:', hasData);
    console.log('  Has Firebase:', hasFirebase);
    console.log('  Has elements:', hasElements);
    
    // If we have Firebase but no data, it might be a cache issue
    if (hasFirebase && !hasData) {
        console.log('⚠️ REFRESH ISSUE DETECTED: Firebase connected but no data');
        console.log('💡 Recommended action: Force cache refresh');
        
        return 'cache_issue';
    }
    
    // If we have no Firebase, it's an initialization issue
    if (!hasFirebase) {
        console.log('⚠️ INITIALIZATION ISSUE: Firebase not connected');
        console.log('💡 Recommended action: Check Firebase initialization');
        
        return 'firebase_issue';
    }
    
    // If we have Firebase and data but missing elements, it's a UI issue
    if (hasFirebase && hasData && !hasElements) {
        console.log('⚠️ UI ISSUE: Data loaded but elements missing');
        console.log('💡 Recommended action: Check DOM loading');
        
        return 'ui_issue';
    }
    
    console.log('✅ No refresh issues detected');
    return 'no_issues';
};

// Function to force cache refresh and reload
window.forceRefreshFix = function() {
    console.log('🔄 FORCING REFRESH FIX');
    
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all caches
    if (window.caches) {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }).then(() => {
            console.log('🗑️ All caches cleared');
            
            // Force reload with cache bypass
            window.location.reload(true);
        });
    } else {
        // Fallback: just reload
        window.location.reload(true);
    }
};

// Auto-detect refresh issues on load
window.addEventListener('load', () => {
    setTimeout(() => {
        const issue = detectRefreshIssues();
        
        if (issue === 'cache_issue') {
            console.log('🔄 Auto-fixing cache issue...');
            
            // Try to refetch data
            if (window.fetchAllData) {
                window.fetchAllData().then(() => {
                    console.log('✅ Cache issue auto-fixed');
                    if (window.applyFilters) {
                        window.applyFilters();
                    }
                }).catch(error => {
                    console.error('❌ Auto-fix failed:', error);
                });
            }
        }
    }, 3000); // Check after 3 seconds
});

// Debug function untuk force cache scenario
window.debugForceCacheScenario = function() {
    console.log('📦 FORCING CACHE SCENARIO');
    
    if (window.allData && (window.allData.orders?.length > 0 || window.allData.salesteam?.length > 0)) {
        // Save current data
        saveDataForBalanceMonitor();
        console.log('✅ Data saved to cache');
        
        // Simulate page refresh
        console.log('🔄 Simulating page refresh with cache...');
        const cachedData = checkCachedData();
        
        if (cachedData) {
            console.log('📦 Cache data would be loaded on refresh');
            console.log('Cached data:', {
                orders: cachedData.orders?.length || 0,
                marketing: cachedData.marketing?.length || 0,
                salesteam: cachedData.salesteam?.length || 0,
                ecommerce: cachedData.ecommerce?.length || 0
            });
        }
    } else {
        console.log('❌ No data to cache');
    }
};

// Debug function untuk test Firestore connection
window.debugFirestoreConnection = function() {
    console.log('🔍 DEBUGGING FIRESTORE CONNECTION');
    
    // Check basic Firebase availability
    console.log('window.db available:', window.db ? 'Yes' : 'No');
    console.log('window.db type:', typeof window.db);
    
    if (window.db) {
        console.log('window.db object:', window.db);
        
        // Test collection function
        try {
            console.log('Testing collection() function...');
            const testCollection = collection(window.db, 'test');
            console.log('✅ collection() function works:', testCollection ? 'Yes' : 'No');
            
            // Test actual collection references
            const collections = ['orderData', 'marketingData', 'salesTeamData', 'powerMetrics'];
            
            collections.forEach(collectionName => {
                try {
                    const ref = collection(window.db, collectionName);
                    console.log(`✅ ${collectionName} collection ref:`, ref ? 'Created' : 'Failed');
                } catch (error) {
                    console.error(`❌ ${collectionName} collection error:`, error.message);
                }
            });
            
        } catch (error) {
            console.error('❌ collection() function error:', error.message);
            console.error('Full error:', error);
        }
        
        // Test imports
        console.log('Firestore imports available:');
        console.log('  collection:', typeof collection);
        console.log('  getDocs:', typeof getDocs);
        console.log('  query:', typeof query);
        console.log('  where:', typeof where);
        console.log('  orderBy:', typeof orderBy);
        console.log('  limit:', typeof limit);
        
    } else {
        console.error('❌ window.db not available - Firebase not initialized');
    }
};

// Debug function untuk test manual data fetch
window.debugManualFetch = function() {
    console.log('🔍 TESTING MANUAL DATA FETCH');
    
    if (!window.db) {
        console.error('❌ Cannot test - Firebase not available');
        return;
    }
    
    // Test fetching one collection manually
    const testCollectionName = 'salesTeamData';
    
    console.log(`Testing fetch from ${testCollectionName}...`);
    
    try {
        const collectionRef = collection(window.db, testCollectionName);
        console.log('✅ Collection reference created');
        
        getDocs(collectionRef).then(snapshot => {
            console.log(`✅ Got ${snapshot.docs.length} documents from ${testCollectionName}`);
            
            const data = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
            console.log('Sample documents:', data.slice(0, 3));
            
        }).catch(error => {
            console.error('❌ getDocs failed:', error.message);
        });
        
    } catch (error) {
        console.error('❌ Manual fetch failed:', error.message);
    }
};

// Debug function untuk check orders data structure
window.debugOrdersData = function() {
    console.log('🔍 DEBUGGING ORDERS DATA STRUCTURE');
    
    if (!window.allData || !window.allData.orders) {
        console.log('❌ No orders data available');
        return;
    }
    
    const orders = window.allData.orders;
    console.log(`📦 Total orders: ${orders.length}`);
    
    if (orders.length > 0) {
        // Show structure of first few orders
        console.log('\n📋 Sample order structures:');
        orders.slice(0, 3).forEach((order, index) => {
            console.log(`\nOrder ${index + 1}:`, {
                id: order.id,
                product_name: order.product_name,
                product: order.product,
                nama_produk: order.nama_produk,
                item: order.item,
                items: order.items,
                total_rm: order.total_rm,
                amount: order.amount,
                allFields: Object.keys(order)
            });
        });
        
        // Check for product-related fields
        console.log('\n🔍 Product field analysis:');
        const productFields = {};
        
        orders.forEach(order => {
            Object.keys(order).forEach(key => {
                if (key.toLowerCase().includes('product') || 
                    key.toLowerCase().includes('item') || 
                    key.toLowerCase().includes('nama')) {
                    if (!productFields[key]) {
                        productFields[key] = { count: 0, samples: [] };
                    }
                    productFields[key].count++;
                    if (productFields[key].samples.length < 3 && order[key]) {
                        productFields[key].samples.push(order[key]);
                    }
                }
            });
        });
        
        console.log('Product-related fields found:', productFields);
        
        // Show current product name extraction
        console.log('\n📊 Current product name extraction:');
        orders.slice(0, 5).forEach((order, index) => {
            const currentExtraction = order.product_name || order.product || 'Unknown Product';
            console.log(`Order ${index + 1}: "${currentExtraction}"`);
        });
    }
};

// Debug function untuk test Total Lead calculation
window.debugTotalLeadCalculation = function() {
    console.log('🔍 DEBUGGING TOTAL LEAD CALCULATION');
    
    if (!allData.salesteam) {
        console.log('❌ No salesteam data available');
        return;
    }
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    console.log(`📅 Looking for data in ${currentMonth}/${currentYear}`);
    
    // Show all power metrics data
    const allPowerMetrics = allData.salesteam.filter(item => item.type === 'power_metrics');
    console.log(`📊 Total power metrics records: ${allPowerMetrics.length}`);
    
    allPowerMetrics.forEach((item, index) => {
        const date = item.tarikh || (item.created_at ? 'Has created_at' : 'No date');
        const agentName = item.agent_name || item.team || 'Unknown';
        const leadCount = item.total_lead_bulan || 0;
        console.log(`   [${index + 1}] ${agentName}: ${leadCount} leads (${date})`);
    });
    
    // Test the actual calculation
    console.log('\n🧮 Running updateKPIs calculation...');
    updateKPIs(allData);
};
// 3. TAMBAH function ni dalam dashboard.js

function updateTeamDisplay() {
    const teamDisplay = document.getElementById('selected-team-display');
    const teamNameElement = document.getElementById('current-team-name');
    
    if (!teamDisplay || !teamNameElement) return;
    
    // Get selected agent/team from filter
    let selectedTeam = '';
    
    // Check enhanced filter first
    if (window.getEnhancedFilterSelection) {
        const enhanced = window.getEnhancedFilterSelection();
        selectedTeam = enhanced.agent || '';
    } else {
        // Fallback to old filter
        const agentFilter = document.getElementById('agent-filter');
        selectedTeam = agentFilter?.value || '';
    }
    
    if (selectedTeam) {
        teamDisplay.style.display = 'block';
        teamNameElement.textContent = selectedTeam;
    } else {
        teamDisplay.style.display = 'none';
        teamNameElement.textContent = 'Semua Team';
    }
    
    // Update target display based on team selection
    updateTargetDisplay(selectedTeam);
}

// Function to update target display based on team filter
function updateTargetDisplay(selectedTeam) {
    const targetLabel = document.querySelector('.target-label');
    const targetValue = document.querySelector('.target-value');
    
    // Also update header stats target (the one near "Live" status)
    const headerStatLabel = document.querySelector('.header-stats .stat-label');
    const headerStatValue = document.querySelector('.header-stats .stat-value');
    
    if (selectedTeam) {
        // Show individual team member target
        if (targetLabel && targetValue) {
            targetLabel.textContent = `Target ${selectedTeam}`;
            targetValue.textContent = 'RM 15,000'; // Per person target
            targetValue.style.color = '#60A5FA'; // Blue for individual
        }
        
        // Update header stats
        if (headerStatLabel && headerStatValue) {
            headerStatLabel.textContent = `Target ${selectedTeam}`;
            headerStatValue.textContent = 'RM 15,000';
            headerStatValue.style.color = '#60A5FA'; // Blue for individual
        }
    } else {
        // Calculate total target for all sales team members
        const totalTeamTarget = calculateTotalSalesTeamTarget();
        
        if (targetLabel && targetValue) {
            targetLabel.textContent = 'Target Keseluruhan Team';
            targetValue.textContent = `RM ${totalTeamTarget.toLocaleString()}`;
            targetValue.style.color = '#10B981'; // Green for overall
        }
        
        // Update header stats  
        if (headerStatLabel && headerStatValue) {
            headerStatLabel.textContent = 'Target Keseluruhan Team';
            headerStatValue.textContent = `RM ${totalTeamTarget.toLocaleString()}`;
            headerStatValue.style.color = '#10B981'; // Green for overall
        }
    }
}

// Calculate total target based on number of sales team members
function calculateTotalSalesTeamTarget() {
    const baseTargetPerPerson = 15000; // RM 15,000 per person
    
    if (!allData.salesteam) return baseTargetPerPerson;
    
    // Get unique team members from sales team data
    const uniqueTeamMembers = new Set();
    
    allData.salesteam.forEach(item => {
        if (item.team && item.team.trim()) {
            uniqueTeamMembers.add(item.team.trim());
        }
    });
    
    const teamCount = uniqueTeamMembers.size || 1; // Minimum 1 to avoid 0
    const totalTarget = baseTargetPerPerson * teamCount;
    
    console.log(`🎯 Sales Team Target Calculation:`, {
        baseTargetPerPerson,
        teamCount,
        totalTarget,
        teamMembers: Array.from(uniqueTeamMembers)
    });
    
    return totalTarget;
}

// Balance MTD Widget Functions
function openBalanceMonitor() {
    console.log('🖥️ Opening Balance MTD Monitor...');
    window.open('balance-monitor.html', '_blank');
}

// Export function for external use
window.openBalanceMonitor = openBalanceMonitor;