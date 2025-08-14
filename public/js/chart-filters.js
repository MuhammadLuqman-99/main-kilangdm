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
        
        console.log('📊 Chart Filters Manager initialized with default dates');
        console.log(`   Standard charts: ${thirtyDaysAgoStr} to ${today}`);
        console.log(`   Timeline chart: ${today} to ${today}`);
    }

    init(allData) {
        if (!allData) {
            console.warn('⚠️ No data provided for chart filters');
            return;
        }

        console.log('🔄 Initializing chart filters with data...');
        
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
        console.log('🔍 Extracting team options from data...');
        
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
        
        console.log(`📊 Found ${this.teamOptions.size} unique teams:`, Array.from(this.teamOptions));
        
        // Log warning if no teams found
        if (this.teamOptions.size === 0) {
            console.warn('⚠️ No valid team names found in data. Data structure:', {
                marketing: allData.marketing?.length || 0,
                salesteam: allData.salesteam?.length || 0,
                orders: allData.orders?.length || 0,
                ecommerce: allData.ecommerce?.length || 0
            });
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

// Add visibility change listener to refresh filters when page becomes visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.allData && window.chartFiltersManager) {
        setTimeout(() => {
            console.log('👀 Page became visible, refreshing chart filters...');
            window.refreshChartFilters();
        }, 100);
    }
});

// Add page show listener to handle browser back/forward navigation
window.addEventListener('pageshow', function(event) {
    if (event.persisted && window.allData && window.chartFiltersManager) {
        setTimeout(() => {
            console.log('🔄 Page restored from cache, refreshing chart filters...');
            window.refreshChartFilters();
        }, 100);
    }
});

// Initialize when data is available
window.initChartFilters = function(allData) {
    if (window.chartFiltersManager) {
        // Store timestamp for cache validation
        lastDataTimestamp = Date.now();
        
        // Always re-initialize to ensure fresh data and options
        window.chartFiltersManager.isInitialized = false;
        window.chartFiltersManager.teamOptions.clear();
        window.chartFiltersManager.init(allData);
        console.log('✅ Chart filters re-initialized with fresh data');
        
        // Validate initialization after delay
        setTimeout(() => {
            validateInitialization();
        }, 2000);
    }
};

// Validation function to ensure proper initialization
function validateInitialization() {
    console.log('🔍 Validating filter initialization...');
    
    const teamSelectors = ['cost-team-filter', 'roi-team-filter', 'timeline-team-filter'];
    let emptyCount = 0;
    
    teamSelectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (select && select.children.length <= 1) {
            emptyCount++;
        }
    });
    
    if (emptyCount > 0 && window.allData) {
        const hasData = (window.allData.marketing?.length > 0) || 
                       (window.allData.salesteam?.length > 0) || 
                       (window.allData.orders?.length > 0) || 
                       (window.allData.ecommerce?.length > 0);
        
        if (hasData) {
            console.warn(`⚠️ Initialization validation failed: ${emptyCount} empty filters with available data`);
            
            // Try one more aggressive refresh
            window.chartFiltersManager.isInitialized = false;
            window.chartFiltersManager.teamOptions.clear();
            window.chartFiltersManager.extractTeamOptions(window.allData);
            window.chartFiltersManager.populateTeamFilters();
            
            console.log('🔄 Applied aggressive re-initialization');
        }
    } else {
        console.log('✅ Filter initialization validation passed');
    }
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

// Debug function to test timeline filter dates
window.debugTimelineFilters = function() {
    console.log('🔍 DEBUGGING TIMELINE FILTERS');
    
    const manager = window.chartFiltersManager;
    if (!manager) {
        console.log('❌ Chart filters manager not found');
        return;
    }
    
    console.log('Current filter values:');
    console.log('Timeline filters:', manager.filters.timeline);
    
    const fromInput = document.getElementById('timeline-date-from');
    const toInput = document.getElementById('timeline-date-to');
    
    console.log('Input field values:');
    console.log(`   From input: ${fromInput ? fromInput.value : 'Not found'}`);
    console.log(`   To input: ${toInput ? toInput.value : 'Not found'}`);
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`   Today: ${today}`);
    
    console.log('Expected: "Dari" should be today\'s date, "Hingga" should be today\'s date');
};

// Production-ready filter monitoring system
let filterMonitorInterval = null;
let filterRetryCount = 0;
const MAX_RETRY_COUNT = 3;
let lastDataTimestamp = null;
let emergencyRefreshTriggered = false;

// Enhanced periodic check with retry mechanism
function startFilterMonitoring() {
    if (filterMonitorInterval) {
        clearInterval(filterMonitorInterval);
    }
    
    filterMonitorInterval = setInterval(() => {
        if (!window.allData || !window.chartFiltersManager) {
            return;
        }
        
        // Check if any filter dropdown is empty (except "Semua Team" option)
        const teamSelectors = ['cost-team-filter', 'roi-team-filter', 'timeline-team-filter'];
        let emptyFilters = [];
        
        teamSelectors.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (select && select.children.length <= 1) {
                emptyFilters.push(selectorId);
            }
        });
        
        // If filters are empty and we have data, attempt recovery
        if (emptyFilters.length > 0 && window.allData && filterRetryCount < MAX_RETRY_COUNT) {
            console.log(`🔄 Detected ${emptyFilters.length} empty filters, attempting recovery (attempt ${filterRetryCount + 1}/${MAX_RETRY_COUNT})...`);
            filterRetryCount++;
            
            try {
                window.refreshChartFilters();
                
                // Verify fix worked
                setTimeout(() => {
                    let stillEmpty = false;
                    teamSelectors.forEach(selectorId => {
                        const select = document.getElementById(selectorId);
                        if (select && select.children.length <= 1) {
                            stillEmpty = true;
                        }
                    });
                    
                    if (!stillEmpty) {
                        console.log('✅ Filter recovery successful');
                        filterRetryCount = 0; // Reset counter on success
                    }
                }, 1000);
                
            } catch (error) {
                console.error('❌ Filter recovery failed:', error);
            }
        }
        
        // If we've reached max retries, escalate to emergency measures
        if (filterRetryCount >= MAX_RETRY_COUNT && emptyFilters.length > 0) {
            console.warn('⚠️ Filter auto-recovery failed. Initiating emergency measures...');
            
            // Check if this is a persistent cache issue
            if (!emergencyRefreshTriggered && window.allData && 
                (window.allData.marketing?.length > 0 || window.allData.salesteam?.length > 0)) {
                
                console.log('🆘 Emergency: Data exists but filters empty. Triggering cache refresh...');
                emergencyRefreshTriggered = true;
                
                // Show emergency notification
                showFilterNotification('🆘 Mengesan masalah cache. Auto-refresh dalam 3 saat...', 'warning');
                
                // Trigger automatic hard refresh after delay
                setTimeout(() => {
                    console.log('🔄 Executing emergency cache refresh...');
                    location.reload(true); // Force reload with cache bypass
                }, 3000);
                
                return; // Don't show manual options yet
            }
            
            // Show manual recovery options
            const recoveryContainer = document.getElementById('filter-recovery-container');
            if (recoveryContainer) {
                recoveryContainer.style.display = 'flex';
            }
            
            // Show notification with hard refresh option
            showFilterNotification(`
                ⚠️ Filter team tidak tersedia. 
                <br><button onclick="location.reload(true)" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; margin-top: 8px; cursor: pointer;">
                    🔄 Hard Refresh
                </button>
            `, 'warning');
            
            filterRetryCount = 0; // Reset for next cycle
        }
    }, 3000); // Check every 3 seconds
}

// Start monitoring
startFilterMonitoring();

// User notification system
function showFilterNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('filter-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'filter-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: none;
        `;
        document.body.appendChild(notification);
    }
    
    // Set style based on type
    const styles = {
        info: 'background: #3b82f6; color: white;',
        success: 'background: #10b981; color: white;',
        warning: 'background: #f59e0b; color: white;',
        error: 'background: #ef4444; color: white;'
    };
    
    notification.style.cssText += styles[type] || styles.info;
    notification.innerHTML = message;
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (notification) {
            notification.style.display = 'none';
        }
    }, 5000);
}

// Add recovery button to page
function addFilterRecoveryButton() {
    // Only add if button doesn't exist
    if (document.getElementById('filter-recovery-btn')) {
        return;
    }
    
    // Find a suitable location for the button
    const chartContainer = document.querySelector('.chart-container') || 
                          document.querySelector('.grid') || 
                          document.querySelector('main') || 
                          document.body;
    
    if (chartContainer) {
        // Create container for multiple buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'filter-recovery-container';
        buttonContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            display: none;
            flex-direction: column;
            gap: 8px;
        `;
        
        // Soft refresh button
        const recoveryBtn = document.createElement('button');
        recoveryBtn.id = 'filter-recovery-btn';
        recoveryBtn.innerHTML = '🔄 Refresh Filters';
        recoveryBtn.style.cssText = `
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        recoveryBtn.addEventListener('click', () => {
            manualRefreshFilters();
        });
        
        // Hard refresh button
        const hardRefreshBtn = document.createElement('button');
        hardRefreshBtn.innerHTML = '⚡ Hard Refresh';
        hardRefreshBtn.style.cssText = `
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        hardRefreshBtn.addEventListener('click', () => {
            location.reload(true);
        });
        
        buttonContainer.appendChild(recoveryBtn);
        buttonContainer.appendChild(hardRefreshBtn);
        document.body.appendChild(buttonContainer);
    }
}

// Enhanced manual refresh function
function manualRefreshFilters() {
    console.log('🔧 Manual refresh requested by user');
    
    showFilterNotification('Sedang me-refresh filters...', 'info');
    
    if (window.allData) {
        try {
            window.refreshChartFilters();
            
            // Verify success
            setTimeout(() => {
                const teamSelectors = ['cost-team-filter', 'roi-team-filter', 'timeline-team-filter'];
                let success = true;
                
                teamSelectors.forEach(selectorId => {
                    const select = document.getElementById(selectorId);
                    if (select && select.children.length <= 1) {
                        success = false;
                    }
                });
                
                if (success) {
                    showFilterNotification('✅ Filters berjaya di-refresh!', 'success');
                    // Hide recovery buttons
                    const recoveryContainer = document.getElementById('filter-recovery-container');
                    if (recoveryContainer) recoveryContainer.style.display = 'none';
                } else {
                    showFilterNotification('⚠️ Masih ada masalah. Cuba refresh halaman.', 'warning');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Manual refresh error:', error);
            showFilterNotification('❌ Refresh gagal. Cuba refresh halaman.', 'error');
        }
    } else {
        showFilterNotification('⏳ Data belum tersedia. Tunggu sebentar...', 'warning');
        
        // Try again after delay
        setTimeout(() => {
            if (window.allData) {
                manualRefreshFilters();
            }
        }, 3000);
    }
}

// Make function globally available
window.manualRefreshFilters = manualRefreshFilters;

// Add recovery button when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addFilterRecoveryButton);
} else {
    addFilterRecoveryButton();
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
    
    // Show emergency notification
    showFilterNotification(`
        🆘 Sistem emergency aktif. Halaman akan di-reload dalam 3 saat...
        <br><small>Jika masih bermasalah, hubungi admin</small>
    `, 'error');
    
    // Force hard refresh
    setTimeout(() => {
        window.location.href = window.location.href + '?t=' + Date.now();
    }, 3000);
}

// Make emergency function globally available
window.emergencyFilterFix = emergencyFallback;

// Add keyboard shortcut for quick filter refresh (Ctrl+Shift+F)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        console.log('🎹 Keyboard shortcut triggered: Ctrl+Shift+F');
        manualRefreshFilters();
    }
    
    // Emergency shortcut (Ctrl+Shift+Alt+F)
    if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'F') {
        e.preventDefault();
        console.log('🆘 Emergency shortcut triggered: Ctrl+Shift+Alt+F');
        emergencyFallback();
    }
});

// Add console helper for developers
window.fixFilters = function() {
    console.log('🛠️ Developer fix function called');
    return manualRefreshFilters();
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

console.log('📊 Chart Filters Manager loaded with enhanced refresh capabilities');
console.log('💡 User Tips:');
console.log('   - Press Ctrl+Shift+F to refresh filters');
console.log('   - Recovery buttons will appear if problems detected');
console.log('   - Hard refresh button available for persistent issues');
console.log('💡 Developer/Admin Tips:');
console.log('   - Press Ctrl+Shift+Alt+F for emergency reset');
console.log('   - Call window.fixFilters() in console');
console.log('   - Call window.validateFilterData() to check data');
console.log('   - Call window.emergencyFilterFix() for nuclear option');