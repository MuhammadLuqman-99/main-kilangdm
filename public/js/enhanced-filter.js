// advanced-filter-integration.js
// Integration file untuk Advanced Dashboard Filter dengan existing dashboard

// Override enhanced-filter.js functions untuk compatibility
document.addEventListener('DOMContentLoaded', () => {
    // Wait for advanced filter to be ready
    setTimeout(() => {
        if (window.advancedDashboardFilter) {
            console.log('🎯 Advanced Filter Integration active');
            
            // Override existing filter functions
            setupAdvancedFilterIntegration();
        }
    }, 1000);
});

function setupAdvancedFilterIntegration() {
    // 1. OVERRIDE getEnhancedFilterSelection function
    window.getEnhancedFilterSelection = () => {
        if (window.advancedDashboardFilter) {
            const selection = window.advancedDashboardFilter.getSelection();
            console.log('📊 Advanced Filter Selection:', selection);
            return {
                startDate: selection.startDate,
                endDate: selection.endDate,
                agent: selection.agent,
                period: selection.type,
                dateRange: `${selection.startDate} to ${selection.endDate}`,
                periodText: selection.displayText
            };
        }
        return { startDate: '', endDate: '', agent: '' };
    };

    // 2. OVERRIDE populateEnhancedAgentFilter function
    window.populateEnhancedAgentFilter = (agents) => {
        if (window.advancedDashboardFilter) {
            window.advancedDashboardFilter.populateAgentOptions(agents);
            console.log('👥 Advanced Filter - Agents populated:', agents.length);
        }
    };

    // 3. ENHANCE existing dashboard functions
    enhanceDashboardFunctions();
    
    // 4. Add keyboard shortcuts
    setupKeyboardShortcuts();
    
    // 5. Add auto-refresh functionality
    setupAutoRefresh();
}

function enhanceDashboardFunctions() {
    // Enhance the populateAgentFilter function
    if (window.populateAgentFilter) {
        const originalPopulateAgentFilter = window.populateAgentFilter;
        window.populateAgentFilter = function(...args) {
            // Call original function
            const result = originalPopulateAgentFilter.apply(this, args);
            
            // Also populate advanced filter
            if (window.allData && window.allData.salesteam && window.advancedDashboardFilter) {
                const agents = [...new Set(window.allData.salesteam
                    .map(item => item.agent || item.team)
                    .filter(Boolean)
                )].sort();
                window.advancedDashboardFilter.populateAgentOptions(agents);
            }
            
            return result;
        };
    }

    // Enhance the fetchAllData function
    if (window.fetchAllData) {
        const originalFetchAllData = window.fetchAllData;
        window.fetchAllData = async function(...args) {
            const result = await originalFetchAllData.apply(this, args);
            
            // Auto-populate agents after data fetch
            setTimeout(() => {
                if (window.allData && window.allData.salesteam && window.advancedDashboardFilter) {
                    const agents = [...new Set(window.allData.salesteam
                        .map(item => item.agent || item.team)
                        .filter(Boolean)
                    )].sort();
                    window.advancedDashboardFilter.populateAgentOptions(agents);
                    console.log('🔄 Auto-populated agents in advanced filter');
                }
            }, 500);
            
            return result;
        };
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + F = Apply Filter
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const applyBtn = document.getElementById('applyFilterEnhanced');
            if (applyBtn) applyBtn.click();
        }

        // Ctrl/Cmd + R = Reset Filter
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            const resetBtn = document.getElementById('resetFilterEnhanced');
            if (resetBtn) resetBtn.click();
        }

        // Ctrl/Cmd + E = Export Data
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            const exportBtn = document.getElementById('exportDataBtn');
            if (exportBtn) exportBtn.click();
        }

        // Ctrl/Cmd + 1,2,3 = Switch tabs
        if ((e.ctrlKey || e.metaKey) && ['1', '2', '3'].includes(e.key)) {
            e.preventDefault();
            const tabTypes = ['quick', 'advanced', 'custom'];
            const tabIndex = parseInt(e.key) - 1;
            if (window.advancedDashboardFilter && tabTypes[tabIndex]) {
                window.advancedDashboardFilter.switchTab(tabTypes[tabIndex]);
            }
        }
    });

    // Show keyboard shortcuts help
    console.log('⌨️ Keyboard Shortcuts:');
    console.log('  Ctrl+F: Apply Filter');
    console.log('  Ctrl+R: Reset Filter');
    console.log('  Ctrl+E: Export Data');
    console.log('  Ctrl+1: Quick Select Tab');
    console.log('  Ctrl+2: Advanced Tab');
    console.log('  Ctrl+3: Custom Range Tab');
}

function setupAutoRefresh() {
    let autoRefreshInterval;
    let isAutoRefreshEnabled = false;

    // Add auto-refresh toggle button
    const filterActions = document.querySelector('.filter-actions');
    if (filterActions) {
        const autoRefreshBtn = document.createElement('button');
        autoRefreshBtn.className = 'btn btn-outline';
        autoRefreshBtn.id = 'autoRefreshBtn';
        autoRefreshBtn.innerHTML = '<i class="fas fa-sync"></i> Auto Refresh: OFF';
        
        autoRefreshBtn.addEventListener('click', () => {
            toggleAutoRefresh();
        });
        
        filterActions.appendChild(autoRefreshBtn);
    }

    function toggleAutoRefresh() {
        const btn = document.getElementById('autoRefreshBtn');
        
        if (isAutoRefreshEnabled) {
            // Turn OFF auto-refresh
            clearInterval(autoRefreshInterval);
            isAutoRefreshEnabled = false;
            btn.innerHTML = '<i class="fas fa-sync"></i> Auto Refresh: OFF';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline');
            console.log('🔄 Auto-refresh disabled');
        } else {
            // Turn ON auto-refresh (every 5 minutes)
            autoRefreshInterval = setInterval(() => {
                console.log('🔄 Auto-refreshing data...');
                const applyBtn = document.getElementById('applyFilterEnhanced');
                if (applyBtn) {
                    applyBtn.click();
                }
            }, 5 * 60 * 1000); // 5 minutes

            isAutoRefreshEnabled = true;
            btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Auto Refresh: ON';
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-success');
            console.log('🔄 Auto-refresh enabled (5 minutes interval)');
        }
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
    });
}

// Advanced Filter Helper Functions
window.advancedFilterHelpers = {
    // Quick filter presets
    setFilterPreset: (preset) => {
        if (!window.advancedDashboardFilter) return;

        const presets = {
            'today': () => {
                window.advancedDashboardFilter.switchTab('quick');
                window.advancedDashboardFilter.selectQuickPeriod('today');
            },
            'this-week': () => {
                window.advancedDashboardFilter.switchTab('quick');
                window.advancedDashboardFilter.selectQuickPeriod('this-week');
            },
            'this-month': () => {
                window.advancedDashboardFilter.switchTab('quick');
                window.advancedDashboardFilter.selectQuickPeriod('this-month');
            },
            'this-year': () => {
                window.advancedDashboardFilter.switchTab('quick');
                window.advancedDashboardFilter.selectQuickPeriod('this-year');
            },
            'current-quarter': () => {
                const now = new Date();
                const quarter = Math.floor(now.getMonth() / 3);
                const startMonth = quarter * 3;
                
                window.advancedDashboardFilter.switchTab('advanced');
                document.getElementById('year-selector').value = now.getFullYear();
                window.advancedDashboardFilter.onYearChange();
                
                // Set start month of quarter
                setTimeout(() => {
                    document.getElementById('month-selector').value = startMonth + 1;
                    window.advancedDashboardFilter.onMonthChange();
                }, 100);
            }
        };

        if (presets[preset]) {
            presets[preset]();
            console.log(`🎯 Applied preset: ${preset}`);
        }
    },

    // Get filter statistics
    getFilterStats: () => {
        const selection = window.getEnhancedFilterSelection();
        const startDate = new Date(selection.startDate);
        const endDate = new Date(selection.endDate);
        
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        let workingDays = 0;
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Exclude Fri & Sat
                workingDays++;
            }
        }

        return {
            startDate: selection.startDate,
            endDate: selection.endDate,
            totalDays,
            workingDays,
            weekends: totalDays - workingDays,
            agent: selection.agent,
            displayText: selection.displayText
        };
    },

    // Export filter configuration
    exportFilterConfig: () => {
        const selection = window.getEnhancedFilterSelection();
        const config = {
            type: 'advanced_filter_config',
            version: '1.0',
            timestamp: new Date().toISOString(),
            filter: selection,
            stats: window.advancedFilterHelpers.getFilterStats()
        };

        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `filter-config-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        console.log('📁 Filter configuration exported');
    },

    // Get available date ranges based on data
    getAvailableDataRanges: () => {
        if (!window.allData) return null;

        const allDates = [];
        
        // Collect all dates from data
        ['orders', 'marketing', 'salesteam'].forEach(collection => {
            window.allData[collection].forEach(item => {
                if (item.tarikh) {
                    allDates.push(new Date(item.tarikh));
                } else if (item.createdAt) {
                    const date = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                    allDates.push(date);
                }
            });
        });

        if (allDates.length === 0) return null;

        allDates.sort((a, b) => a - b);

        return {
            earliest: allDates[0].toISOString().split('T')[0],
            latest: allDates[allDates.length - 1].toISOString().split('T')[0],
            totalRecords: allDates.length,
            uniqueDates: [...new Set(allDates.map(d => d.toISOString().split('T')[0]))].length
        };
    }
};

// Add CSS for auto-refresh button
const advancedFilterStyles = `
    .btn-success {
        background: #10B981 !important;
        color: #FFFFFF !important;
        border: 2px solid #059669 !important;
    }
    
    .btn-success:hover {
        background: #059669 !important;
        transform: translateY(-1px);
    }
    
    .auto-refresh-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10B981;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 1000;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
`;

// Add styles to document
if (!document.getElementById('advanced-filter-integration-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'advanced-filter-integration-styles';
    styleElement.textContent = advancedFilterStyles;
    document.head.appendChild(styleElement);
}

console.log('🎯 Advanced Filter Integration loaded!');
console.log('📊 Available helper functions:');
console.log('  - advancedFilterHelpers.setFilterPreset(preset)');
console.log('  - advancedFilterHelpers.getFilterStats()');
console.log('  - advancedFilterHelpers.exportFilterConfig()');
console.log('  - advancedFilterHelpers.getAvailableDataRanges()');

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupAdvancedFilterIntegration, advancedFilterHelpers };
}