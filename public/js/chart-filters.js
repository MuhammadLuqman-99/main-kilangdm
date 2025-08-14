// Chart Filters Manager
// Handles team sales and date filters for all main charts

class ChartFiltersManager {
    constructor() {
        // Initialize with default dates
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
        
        this.filters = {
            cost: { team: '', dateFrom: thirtyDaysAgoStr, dateTo: today },
            roi: { team: '', dateFrom: thirtyDaysAgoStr, dateTo: today },
            timeline: { team: '', dateFrom: today, dateTo: today, timeSlot: '' } // Timeline uses today as start date
        };
        
        this.teamOptions = new Set();
        this.isInitialized = false;
        
    }

    init(allData) {
        if (!allData) {
            console.warn('⚠️ No data provided for chart filters');
            return;
        }

        // Extract all unique team names from data
        this.extractTeamOptions(allData);
        
        // Populate team dropdowns
        this.populateTeamFilters();
        
        // Set default date range (last 30 days)
        this.setDefaultDateRange();
        
        // Setup event listeners
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('✅ Chart filters initialized successfully');
    }

    extractTeamOptions(allData) {
        // Clear existing options first
        this.teamOptions.clear();
        
        // From marketing data
        if (allData.marketing && Array.isArray(allData.marketing)) {
            allData.marketing.forEach(item => {
                const team = item.team_sale || item.team || item.agent || item.sales_agent;
                if (team && typeof team === 'string' && team.trim() && team !== 'undefined' && team !== 'null') {
                    this.teamOptions.add(team.trim());
                }
            });
        }
        
        // From salesteam data
        if (allData.salesteam && Array.isArray(allData.salesteam)) {
            allData.salesteam.forEach(item => {
                const team = item.agent_name || item.team || item.agent || item.sales_agent;
                if (team && typeof team === 'string' && team.trim() && team !== 'undefined' && team !== 'null') {
                    this.teamOptions.add(team.trim());
                }
            });
        }
        
        // From orders data
        if (allData.orders && Array.isArray(allData.orders)) {
            allData.orders.forEach(item => {
                const team = item.sales_agent || item.agent || item.team || item.agent_name;
                if (team && typeof team === 'string' && team.trim() && team !== 'undefined' && team !== 'null') {
                    this.teamOptions.add(team.trim());
                }
            });
        }
        
        // From ecommerce data
        if (allData.ecommerce && Array.isArray(allData.ecommerce)) {
            allData.ecommerce.forEach(item => {
                const team = item.sales_agent || item.agent || item.team || item.agent_name;
                if (team && typeof team === 'string' && team.trim() && team !== 'undefined' && team !== 'null') {
                    this.teamOptions.add(team.trim());
                }
            });
        }
        
        // Log warning only if no teams found
        if (this.teamOptions.size === 0) {
            console.warn('⚠️ No team names found in data');
        }
    }

    populateTeamFilters() {
        const teamSelectors = [
            'cost-team-filter',
            'roi-team-filter', 
            'timeline-team-filter'
        ];

        teamSelectors.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (!select) {
                console.warn(`⚠️ Team filter ${selectorId} not found`);
                return;
            }

            // Store current selection
            const currentValue = select.value;

            // Clear existing options (except "Semua Team")
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            // Ensure we have team options
            if (this.teamOptions.size === 0) {
                console.warn(`⚠️ No team options available for ${selectorId}`);
                return;
            }

            // Add team options sorted alphabetically
            const sortedTeams = Array.from(this.teamOptions).sort();
            sortedTeams.forEach(team => {
                if (team && team.trim()) {
                    const option = document.createElement('option');
                    option.value = team;
                    option.textContent = team;
                    select.appendChild(option);
                }
            });

            // Restore selection if it still exists
            if (currentValue && sortedTeams.includes(currentValue)) {
                select.value = currentValue;
            }

            console.log(`✅ Populated ${selectorId} with ${this.teamOptions.size} teams`);
        });
    }

    setDefaultDateRange() {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];
        const todayDate = today.toISOString().split('T')[0];

        // Set default dates for cost and roi charts (30 days ago to today)
        const standardCharts = [
            { from: 'cost-date-from', to: 'cost-date-to' },
            { from: 'roi-date-from', to: 'roi-date-to' }
        ];

        standardCharts.forEach(({ from, to }) => {
            const fromInput = document.getElementById(from);
            const toInput = document.getElementById(to);
            
            if (fromInput) fromInput.value = fromDate;
            if (toInput) toInput.value = toDate;
        });

        // Special handling for timeline chart (Lead Performance by Sales Team)
        // Set "Dari" to today's date instead of 30 days ago
        const timelineFromInput = document.getElementById('timeline-date-from');
        const timelineToInput = document.getElementById('timeline-date-to');
        
        if (timelineFromInput) timelineFromInput.value = todayDate;
        if (timelineToInput) timelineToInput.value = toDate;

        console.log(`📅 Set default date range for standard charts: ${fromDate} to ${toDate}`);
        console.log(`📅 Set default date range for timeline chart: ${todayDate} to ${toDate}`);
    }

    setupEventListeners() {
        console.log('🔗 Setting up filter event listeners...');

        // Cost chart filters
        this.setupChartFilters('cost', 'createMarketingCostPerTeamChart');
        
        // ROI chart filters  
        this.setupChartFilters('roi', 'createMarketingROIChart');
        
        // Timeline chart filters (with time period buttons)
        this.setupChartFilters('timeline', 'createMarketingTimelineChart');
        this.setupTimelinePeriodButtons();
        
        console.log('✅ All filter event listeners set up');
    }

    setupChartFilters(chartType, updateFunction) {
        const teamSelect = document.getElementById(`${chartType}-team-filter`);
        const dateFromInput = document.getElementById(`${chartType}-date-from`);
        const dateToInput = document.getElementById(`${chartType}-date-to`);

        // Team filter change
        if (teamSelect) {
            teamSelect.addEventListener('change', (e) => {
                this.filters[chartType].team = e.target.value;
                console.log(`📊 ${chartType} team filter changed to: "${e.target.value}"`);
                this.applyFiltersToChart(chartType, updateFunction);
            });
        }

        // Date from filter change
        if (dateFromInput) {
            dateFromInput.addEventListener('change', (e) => {
                this.filters[chartType].dateFrom = e.target.value;
                console.log(`📅 ${chartType} date from changed to: ${e.target.value}`);
                this.applyFiltersToChart(chartType, updateFunction);
            });
        }

        // Date to filter change
        if (dateToInput) {
            dateToInput.addEventListener('change', (e) => {
                this.filters[chartType].dateTo = e.target.value;
                console.log(`📅 ${chartType} date to changed to: ${e.target.value}`);
                this.applyFiltersToChart(chartType, updateFunction);
            });
        }
    }

    applyFiltersToChart(chartType, updateFunction) {
        if (!window.allData) {
            console.warn('⚠️ No allData available for filtering');
            return;
        }

        console.log(`🔄 Applying filters to ${chartType} chart...`);
        
        const filters = this.filters[chartType];
        const filteredData = this.filterData(window.allData, filters);
        
        console.log(`📊 Filtered data for ${chartType}:`, {
            marketing: filteredData.marketing?.length || 0,
            salesteam: filteredData.salesteam?.length || 0,
            orders: filteredData.orders?.length || 0,
            ecommerce: filteredData.ecommerce?.length || 0
        });

        // Update the chart with filtered data
        if (window[updateFunction]) {
            try {
                window[updateFunction](filteredData);
                console.log(`✅ ${chartType} chart updated successfully`);
            } catch (error) {
                console.error(`❌ Error updating ${chartType} chart:`, error);
            }
        } else {
            console.warn(`⚠️ Update function ${updateFunction} not found`);
        }
    }

    filterData(allData, filters) {
        const filtered = {};

        // Filter marketing data
        if (allData.marketing) {
            filtered.marketing = allData.marketing.filter(item => {
                // Team filter
                if (filters.team) {
                    const itemTeam = item.team_sale || item.team || item.agent || '';
                    if (!itemTeam.toLowerCase().includes(filters.team.toLowerCase())) {
                        return false;
                    }
                }

                // Time slot filter (for timeline chart)
                if (filters.timeSlot) {
                    const itemTime = item.masa || item.time;
                    if (itemTime !== filters.timeSlot) {
                        return false;
                    }
                }

                // Date filter
                if (filters.dateFrom || filters.dateTo) {
                    const itemDate = this.parseItemDate(item.tarikh || item.date);
                    if (!itemDate) return true; // Keep items without dates
                    
                    if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) {
                        return false;
                    }
                    if (filters.dateTo && itemDate > new Date(filters.dateTo + 'T23:59:59')) {
                        return false;
                    }
                }

                return true;
            });
        }

        // Filter salesteam data
        if (allData.salesteam) {
            filtered.salesteam = allData.salesteam.filter(item => {
                // Team filter
                if (filters.team) {
                    const itemTeam = item.agent_name || item.team || item.agent || '';
                    if (!itemTeam.toLowerCase().includes(filters.team.toLowerCase())) {
                        return false;
                    }
                }

                // Time slot filter (for timeline chart)
                if (filters.timeSlot) {
                    const itemTime = item.masa || item.time;
                    if (itemTime !== filters.timeSlot) {
                        return false;
                    }
                }

                // Date filter
                if (filters.dateFrom || filters.dateTo) {
                    const itemDate = this.parseItemDate(item.tarikh || item.date);
                    if (!itemDate) return true; // Keep items without dates
                    
                    if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) {
                        return false;
                    }
                    if (filters.dateTo && itemDate > new Date(filters.dateTo + 'T23:59:59')) {
                        return false;
                    }
                }

                return true;
            });
        }

        // Filter orders data
        if (allData.orders) {
            filtered.orders = allData.orders.filter(item => {
                // Team filter
                if (filters.team) {
                    const itemTeam = item.sales_agent || item.agent || item.team || '';
                    if (!itemTeam.toLowerCase().includes(filters.team.toLowerCase())) {
                        return false;
                    }
                }

                // Date filter
                if (filters.dateFrom || filters.dateTo) {
                    const itemDate = this.parseItemDate(item.tarikh || item.date || item.created_at);
                    if (!itemDate) return true; // Keep items without dates
                    
                    if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) {
                        return false;
                    }
                    if (filters.dateTo && itemDate > new Date(filters.dateTo + 'T23:59:59')) {
                        return false;
                    }
                }

                return true;
            });
        }

        // Filter ecommerce data (similar to orders)
        if (allData.ecommerce) {
            filtered.ecommerce = allData.ecommerce.filter(item => {
                // Team filter
                if (filters.team) {
                    const itemTeam = item.sales_agent || item.agent || item.team || '';
                    if (!itemTeam.toLowerCase().includes(filters.team.toLowerCase())) {
                        return false;
                    }
                }

                // Date filter
                if (filters.dateFrom || filters.dateTo) {
                    const itemDate = this.parseItemDate(item.tarikh || item.date || item.created_at);
                    if (!itemDate) return true; // Keep items without dates
                    
                    if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) {
                        return false;
                    }
                    if (filters.dateTo && itemDate > new Date(filters.dateTo + 'T23:59:59')) {
                        return false;
                    }
                }

                return true;
            });
        }

        return filtered;
    }

    parseItemDate(dateInput) {
        if (!dateInput) return null;
        
        try {
            // Handle Firestore timestamp
            if (dateInput.toDate && typeof dateInput.toDate === 'function') {
                return dateInput.toDate();
            }
            
            // Handle different string formats
            let date;
            if (typeof dateInput === 'string') {
                // Handle formats like dd/mm/yyyy
                if (dateInput.includes('/')) {
                    const parts = dateInput.split('/');
                    if (parts.length === 3) {
                        // Assume dd/mm/yyyy format
                        date = new Date(parts[2], parts[1] - 1, parts[0]);
                    }
                } else {
                    // Handle ISO format or yyyy-mm-dd
                    date = new Date(dateInput);
                }
            } else {
                date = new Date(dateInput);
            }
            
            return isNaN(date.getTime()) ? null : date;
        } catch (error) {
            console.warn('⚠️ Error parsing date:', dateInput, error);
            return null;
        }
    }

    // Setup Timeline Period Buttons for time-based and period selection
    setupTimelinePeriodButtons() {
        console.log('⏰ Setting up timeline period buttons...');
        
        const periodButtons = document.querySelectorAll('.timeline-period-btn');
        
        periodButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all buttons
                periodButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                const timeSlot = button.dataset.time;
                const period = button.dataset.period;
                
                if (timeSlot) {
                    // Time-based filtering (9.00am, 2.30pm, 4.00pm, 8.30pm)
                    console.log(`⏰ Timeline time slot selected: ${timeSlot}`);
                    this.filterByTimeSlot(timeSlot);
                } else if (period) {
                    // Period-based filtering (today, etc.)
                    console.log(`📅 Timeline period selected: ${period}`);
                    this.filterByPeriod(period);
                }
            });
        });
        
        console.log('✅ Timeline period buttons configured');
    }
    
    // Filter data by specific time slots (9.00am, 2.30pm, 4.00pm, 8.30pm)
    filterByTimeSlot(timeSlot) {
        console.log(`🕐 Filtering timeline data by time slot: ${timeSlot}`);
        
        // Add time filter to timeline filters
        this.filters.timeline.timeSlot = timeSlot;
        
        // Set date range to today for time-based filtering
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const fromInput = document.getElementById('timeline-date-from');
        const toInput = document.getElementById('timeline-date-to');
        
        if (fromInput && toInput) {
            fromInput.value = todayStr;
            toInput.value = todayStr;
            
            this.filters.timeline.dateFrom = todayStr;
            this.filters.timeline.dateTo = todayStr;
        }
        
        // Apply filters to update chart
        this.applyFiltersToChart('timeline', 'createMarketingTimelineChart');
    }
    
    // Filter data by period (today, week, etc.)
    filterByPeriod(period) {
        console.log(`📅 Filtering timeline data by period: ${period}`);
        
        // Clear time slot filter
        this.filters.timeline.timeSlot = '';
        
        const today = new Date();
        let fromDate, toDate;
        
        switch(period) {
            case 'today':
                fromDate = toDate = today;
                break;
            default:
                fromDate = toDate = today;
        }
        
        const fromInput = document.getElementById('timeline-date-from');
        const toInput = document.getElementById('timeline-date-to');
        
        if (fromInput && toInput) {
            fromInput.value = fromDate.toISOString().split('T')[0];
            toInput.value = toDate.toISOString().split('T')[0];
            
            this.filters.timeline.dateFrom = fromInput.value;
            this.filters.timeline.dateTo = toInput.value;
        }
        
        // Apply filters to update chart
        this.applyFiltersToChart('timeline', 'createMarketingTimelineChart');
    }

    // Reset all filters
    resetFilters() {
        console.log('🔄 Resetting all chart filters...');
        
        // Reset filter values
        Object.keys(this.filters).forEach(chartType => {
            if (chartType === 'timeline') {
                this.filters[chartType] = { team: '', dateFrom: '', dateTo: '', timeSlot: '' };
            } else {
                this.filters[chartType] = { team: '', dateFrom: '', dateTo: '' };
            }
        });
        
        // Reset UI elements
        document.querySelectorAll('.chart-filter-select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        // Reset date ranges to default
        this.setDefaultDateRange();
        
        // Reset period buttons
        document.querySelectorAll('.timeline-period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        // Set default active button (2.30pm)
        const defaultButton = document.querySelector('.timeline-period-btn[data-time="2.30pm"]');
        if (defaultButton) {
            defaultButton.classList.add('active');
        }
        
        // Update all charts
        this.updateAllCharts();
        
        console.log('✅ All filters reset successfully');
    }

    updateAllCharts() {
        if (!window.allData) return;
        
        console.log('🔄 Updating all charts with current filters...');
        
        this.applyFiltersToChart('cost', 'createMarketingCostPerTeamChart');
        this.applyFiltersToChart('roi', 'createMarketingROIChart');
        this.applyFiltersToChart('timeline', 'createMarketingTimelineChart');
    }
}

// Create global instance
window.chartFiltersManager = new ChartFiltersManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Chart Filters DOM ready - waiting for data...');
});

// FOOLPROOF FILTER SYSTEM - ALWAYS REFRESH
let refreshInterval;

function forceRefreshAllFilters() {
    if (window.allData) {
        console.log('🔄 Force refreshing ALL filters...');
        
        try {
            // Method 1: Try normal refresh
            if (window.chartFiltersManager) {
                window.chartFiltersManager.isInitialized = false;
                window.chartFiltersManager.teamOptions.clear();
                window.chartFiltersManager.init(window.allData);
            }
            
            // Method 2: Always run backup to ensure completion
            backupFilterPopulation();
            
            // Method 3: Also call populateAgentFilter
            if (window.populateAgentFilter) {
                window.populateAgentFilter();
            }
            
            console.log('✅ All filter refresh methods applied');
            
        } catch (error) {
            console.warn('Error during refresh, using backup only:', error);
            backupFilterPopulation();
        }
    }
}

// Multiple triggers to ensure filters ALWAYS work
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        setTimeout(forceRefreshAllFilters, 100);
    }
});

window.addEventListener('pageshow', function() {
    setTimeout(forceRefreshAllFilters, 200);
});

window.addEventListener('focus', function() {
    setTimeout(forceRefreshAllFilters, 100);
});

// Aggressive periodic refresh every 10 seconds
function startAggressiveMonitoring() {
    if (refreshInterval) clearInterval(refreshInterval);
    
    refreshInterval = setInterval(() => {
        // Check if any filter is empty
        const selectors = ['cost-team-filter', 'roi-team-filter', 'timeline-team-filter', 'agent-filter'];
        let needsRefresh = false;
        
        selectors.forEach(id => {
            const select = document.getElementById(id);
            if (select && select.children.length <= 1) {
                needsRefresh = true;
            }
        });
        
        if (needsRefresh && window.allData) {
            console.log('🔄 Auto-refresh triggered');
            forceRefreshAllFilters();
        }
    }, 10000); // Every 10 seconds
}

// Start aggressive monitoring
startAggressiveMonitoring();

// Initialize when data is available - SIMPLE & RELIABLE
window.initChartFilters = function(allData) {
    if (window.chartFiltersManager && allData) {
        // ALWAYS force fresh initialization
        window.chartFiltersManager.isInitialized = false;
        window.chartFiltersManager.teamOptions.clear();
        window.chartFiltersManager.init(allData);
        
        // Also immediately refresh agent filter
        if (window.populateAgentFilter) {
            setTimeout(() => {
                window.populateAgentFilter();
            }, 500);
        }
        
        console.log('✅ ALL filters initialized');
    }
};

// Simple backup filter population
function backupFilterPopulation() {
    if (!window.allData) return;
    
    // Backup for team filters
    const teams = new Set();
    
    // Extract teams from all data sources
    ['marketing', 'salesteam', 'orders', 'ecommerce'].forEach(source => {
        if (window.allData[source]) {
            window.allData[source].forEach(item => {
                const team = item.team_sale || item.team || item.agent || item.agent_name || item.sales_agent;
                if (team && typeof team === 'string' && team.trim()) {
                    teams.add(team.trim());
                }
            });
        }
    });
    
    // Populate team filters manually
    const teamSelectors = ['cost-team-filter', 'roi-team-filter', 'timeline-team-filter'];
    teamSelectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (select) {
            select.innerHTML = '<option value="">Semua Team</option>';
            Array.from(teams).sort().forEach(team => {
                const option = document.createElement('option');
                option.value = team;
                option.textContent = team;
                select.appendChild(option);
            });
        }
    });
    
    // Comprehensive backup for agent filters from ALL data sources
    const agents = new Set();
    
    // Extract from salesteam data
    if (window.allData.salesteam) {
        window.allData.salesteam.forEach(item => {
            const agent = item.agent || item.team || item.agent_name || item.sales_agent;
            if (agent && typeof agent === 'string' && agent.trim() && agent !== 'undefined') {
                agents.add(agent.trim());
            }
        });
    }
    
    // Extract from marketing data
    if (window.allData.marketing) {
        window.allData.marketing.forEach(item => {
            const agent = item.agent || item.team || item.agent_name || item.sales_agent || item.team_sale;
            if (agent && typeof agent === 'string' && agent.trim() && agent !== 'undefined') {
                agents.add(agent.trim());
            }
        });
    }
    
    // Extract from orders data
    if (window.allData.orders) {
        window.allData.orders.forEach(item => {
            const agent = item.sales_agent || item.agent || item.team || item.agent_name;
            if (agent && typeof agent === 'string' && agent.trim() && agent !== 'undefined') {
                agents.add(agent.trim());
            }
        });
    }
    
    // Populate ALL agent filter selectors
    const agentSelectors = ['agent-filter', 'agent-filter-enhanced', 'lead-team-filter'];
    const agentArray = Array.from(agents).sort();
    
    agentSelectors.forEach(selectorId => {
        const agentSelect = document.getElementById(selectorId);
        if (agentSelect) {
            agentSelect.innerHTML = '<option value="">Semua Agent</option>';
            agentArray.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent;
                option.textContent = agent;
                agentSelect.appendChild(option);
            });
        }
    });
}

// Function to force refresh chart filters with current data
window.refreshChartFilters = function() {
    if (window.allData && window.chartFiltersManager) {
        console.log('🔄 Force refreshing chart filters...');
        window.chartFiltersManager.isInitialized = false;
        window.chartFiltersManager.teamOptions.clear();
        window.chartFiltersManager.init(window.allData);
        console.log('✅ Chart filters force refreshed');
    } else {
        console.warn('⚠️ Cannot refresh chart filters - data or manager not available');
    }
};

// Function to refresh ALL filters (chart + agent) - RELIABLE VERSION
window.refreshAllFilters = function() {
    console.log('🔄 Refreshing all filters...');
    
    if (window.allData) {
        // Always use backup method for reliability
        backupFilterPopulation();
        
        // Also try normal methods as backup
        try {
            if (window.refreshChartFilters) {
                window.refreshChartFilters();
            }
            
            if (window.populateAgentFilter) {
                window.populateAgentFilter();
            }
        } catch (error) {
            console.warn('Normal refresh failed, backup already applied');
        }
    }
    
    console.log('✅ All filters refreshed with backup method');
};

// Simple debug function
window.debugTimelineFilters = function() {
    const manager = window.chartFiltersManager;
    if (manager) {
        console.log('Timeline filters:', manager.filters.timeline);
    }
};


// Simple console logging instead of notifications
function logFilterAction(message, type = 'info') {
    const emoji = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    console.log(`${emoji[type] || 'ℹ️'} ${message}`);
}

// Simple recovery function without UI buttons
function enableQuickRecovery() {
    // Just enable keyboard shortcut - no UI buttons needed
    console.log('🔧 Quick recovery enabled via Ctrl+Shift+F');
}

// Simple manual refresh function
function manualRefreshFilters() {
    console.log('🔧 Manual refresh requested by user');
    
    if (window.allData) {
        // Use reliable backup method
        backupFilterPopulation();
        console.log('✅ Filters refreshed successfully');
    } else {
        console.log('⏳ Data not available yet');
    }
}

// Make function globally available
window.manualRefreshFilters = manualRefreshFilters;

// Enable recovery when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableQuickRecovery);
} else {
    enableQuickRecovery();
}

// Cache version management
const FILTER_CACHE_VERSION = '1.2.0';
const CACHE_KEY = 'chartFilters_v' + FILTER_CACHE_VERSION;

// Check for stale cache and clear if needed
function checkAndClearStaleCache() {
    try {
        const stored = localStorage.getItem('filterCacheVersion');
        if (stored !== FILTER_CACHE_VERSION) {
            console.log('🗑️ Clearing stale filter cache...');
            localStorage.removeItem('dashboardCache');
            localStorage.removeItem('dashboardAllData');
            localStorage.setItem('filterCacheVersion', FILTER_CACHE_VERSION);
        }
    } catch (error) {
        console.warn('Cache cleanup failed:', error);
    }
}

// Run cache check on load
checkAndClearStaleCache();

// Emergency fallback system
function emergencyFallback() {
    console.log('🆘 Activating emergency fallback system...');
    
    // Clear all caches
    try {
        localStorage.clear();
        sessionStorage.clear();
    } catch (error) {
        console.warn('Cache clear failed:', error);
    }
    
    console.log('🔄 Force refreshing page...');
    
    // Force hard refresh immediately
    window.location.href = window.location.href + '?t=' + Date.now();
}

// Make emergency function globally available
window.emergencyFilterFix = emergencyFallback;

// Add keyboard shortcut for quick filter refresh (Ctrl+Shift+F)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        console.log('🎹 Keyboard shortcut triggered: Ctrl+Shift+F');
        window.refreshAllFilters();
    }
    
    // Emergency shortcut (Ctrl+Shift+Alt+F)
    if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'F') {
        e.preventDefault();
        console.log('🆘 Emergency shortcut triggered: Ctrl+Shift+Alt+F');
        emergencyFallback();
    }
});

// Simple fix function for everyone
window.fixFilters = function() {
    console.log('🛠️ Fix filters called');
    if (window.allData) {
        backupFilterPopulation();
        console.log('✅ Filters fixed using backup method');
    }
};

// Add data validation function
window.validateFilterData = function() {
    console.log('🔍 Validating filter data...');
    
    if (!window.allData) {
        console.log('❌ No allData found');
        return false;
    }
    
    console.log('📊 Data summary:', {
        marketing: window.allData.marketing?.length || 0,
        salesteam: window.allData.salesteam?.length || 0,
        orders: window.allData.orders?.length || 0,
        ecommerce: window.allData.ecommerce?.length || 0
    });
    
    if (window.chartFiltersManager) {
        console.log('🎯 Team options found:', window.chartFiltersManager.teamOptions.size);
        console.log('📝 Teams:', Array.from(window.chartFiltersManager.teamOptions));
    }
    
    return true;
};

console.log('📊 Chart Filters Manager loaded - FOOLPROOF VERSION');

// Simple system check
setTimeout(() => {
    if (window.allData) {
        // Immediately run backup population to ensure filters work
        backupFilterPopulation();
        console.log('✅ Filter system ready with backup population');
    }
}, 2000);

console.log('💡 Tips: Filters akan auto-refresh. Jika bermasalah tekan Ctrl+Shift+F');