// Chart Filters Manager
// Handles team sales and date filters for all main charts

class ChartFiltersManager {
    constructor() {
        this.filters = {
            cost: { team: '', dateFrom: '', dateTo: '' },
            roi: { team: '', dateFrom: '', dateTo: '' },
            timeline: { team: '', dateFrom: '', dateTo: '', timeSlot: '' }
        };
        
        this.teamOptions = new Set();
        this.isInitialized = false;
        
        console.log('📊 Chart Filters Manager initialized');
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
        
        // From marketing data
        if (allData.marketing) {
            allData.marketing.forEach(item => {
                const team = item.team_sale || item.team || item.agent;
                if (team && team.trim()) {
                    this.teamOptions.add(team.trim());
                }
            });
        }
        
        // From salesteam data
        if (allData.salesteam) {
            allData.salesteam.forEach(item => {
                const team = item.agent_name || item.team || item.agent;
                if (team && team.trim()) {
                    this.teamOptions.add(team.trim());
                }
            });
        }
        
        // From orders data
        if (allData.orders) {
            allData.orders.forEach(item => {
                const team = item.sales_agent || item.agent || item.team;
                if (team && team.trim()) {
                    this.teamOptions.add(team.trim());
                }
            });
        }
        
        // From ecommerce data
        if (allData.ecommerce) {
            allData.ecommerce.forEach(item => {
                const team = item.sales_agent || item.agent || item.team;
                if (team && team.trim()) {
                    this.teamOptions.add(team.trim());
                }
            });
        }
        
        console.log(`📊 Found ${this.teamOptions.size} unique teams:`, Array.from(this.teamOptions));
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

            // Clear existing options (except "Semua Team")
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            // Add team options
            Array.from(this.teamOptions).sort().forEach(team => {
                const option = document.createElement('option');
                option.value = team;
                option.textContent = team;
                select.appendChild(option);
            });

            console.log(`✅ Populated ${selectorId} with ${this.teamOptions.size} teams`);
        });
    }

    setDefaultDateRange() {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];

        // Set default dates for all charts
        const dateInputs = [
            { from: 'cost-date-from', to: 'cost-date-to' },
            { from: 'roi-date-from', to: 'roi-date-to' },
            { from: 'timeline-date-from', to: 'timeline-date-to' }
        ];

        dateInputs.forEach(({ from, to }) => {
            const fromInput = document.getElementById(from);
            const toInput = document.getElementById(to);
            
            if (fromInput) fromInput.value = fromDate;
            if (toInput) toInput.value = toDate;
        });

        console.log(`📅 Set default date range: ${fromDate} to ${toDate}`);
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

// Initialize when data is available
window.initChartFilters = function(allData) {
    if (window.chartFiltersManager && !window.chartFiltersManager.isInitialized) {
        window.chartFiltersManager.init(allData);
    }
};

console.log('📊 Chart Filters Manager loaded');