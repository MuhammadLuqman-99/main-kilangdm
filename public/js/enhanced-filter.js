// Enhanced Date Filter Integration with Dashboard
class DashboardEnhancedFilter {
    constructor() {
        this.dropdown = document.getElementById('periodDropdown');
        this.menu = document.getElementById('dropdownMenu');
        this.selectedText = document.getElementById('selectedPeriodText');
        this.selectedDate = document.getElementById('selectedPeriodDate');
        this.periodTitle = document.getElementById('periodTitle');
        this.periodRange = document.getElementById('periodRange');
        this.applyBtn = document.getElementById('applyFilterEnhanced');
        this.resetBtn = document.getElementById('resetFilterEnhanced');
        this.agentSelect = document.getElementById('agent-filter-enhanced');
        this.activeFilters = document.getElementById('activeFiltersEnhanced');
        this.filterTags = document.getElementById('filterTagsEnhanced');
        
        this.currentSelection = 'past-30-days';
        this.currentAgent = '';
        this.dateRanges = {};
        
        this.init();
        this.updateDateLabels();
    }

    init() {
        // Toggle dropdown
        this.dropdown?.addEventListener('click', () => {
            this.toggleDropdown();
        });

        // Handle item selection
        this.menu?.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (item) {
                this.selectItem(item);
            }
        });

        // Apply filter
        this.applyBtn?.addEventListener('click', () => {
            this.applyFilter();
        });

        // Reset filter
        this.resetBtn?.addEventListener('click', () => {
            this.resetFilter();
        });

        // Agent selection
        this.agentSelect?.addEventListener('change', () => {
            this.currentAgent = this.agentSelect.value;
            this.updateActiveFilters();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.dropdown && this.menu && 
                !this.dropdown.contains(e.target) && 
                !this.menu.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Set default selection
        setTimeout(() => {
            const defaultItem = this.menu?.querySelector('[data-value="past-30-days"]');
            if (defaultItem) {
                this.selectItem(defaultItem);
            }
        }, 100);
    }

    updateDateLabels() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const formatDate = (date) => {
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '-');
        };

        const formatMonth = (date) => {
            return date.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
        };

        // Update date labels in dropdown
        const updates = {
            'yesterday-date': formatDate(yesterday),
            'today-date': formatDate(today),
            '2days-date': formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
            '3days-date': formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
            'thisweek-date': this.getWeekRange(today),
            'lastweek-date': this.getWeekRange(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
            'thismonth-date': formatMonth(today),
            'lastmonth-date': formatMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
            'thisyear-date': today.getFullYear().toString(),
            'lastyear-date': (today.getFullYear() - 1).toString()
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Store date ranges for later use
        this.dateRanges = {
            'real-time': { start: null, end: null, label: 'Live data updates' },
            'yesterday': { 
                start: formatDate(yesterday), 
                end: formatDate(yesterday), 
                label: `${formatDate(yesterday)} (GMT+08)` 
            },
            'today': { 
                start: formatDate(today), 
                end: formatDate(today), 
                label: `${formatDate(today)} (GMT+08)` 
            },
            'past-7-days': { 
                start: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)), 
                end: formatDate(today), 
                label: `${formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))} to ${formatDate(today)}` 
            },
            'past-30-days': { 
                start: formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)), 
                end: formatDate(today), 
                label: `${formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000))} to ${formatDate(today)}` 
            },
            'this-week': { 
                start: this.getWeekStart(today), 
                end: formatDate(today), 
                label: this.getWeekRange(today) 
            },
            'last-week': {
                start: this.getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
                end: this.getWeekEnd(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
                label: this.getWeekRange(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
            },
            'this-month': { 
                start: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), 
                end: formatDate(today), 
                label: formatMonth(today) 
            },
            'last-month': {
                start: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
                end: formatDate(new Date(today.getFullYear(), today.getMonth(), 0)),
                label: formatMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1))
            },
            'this-year': { 
                start: formatDate(new Date(today.getFullYear(), 0, 1)), 
                end: formatDate(today), 
                label: today.getFullYear().toString() 
            },
            'last-year': {
                start: formatDate(new Date(today.getFullYear() - 1, 0, 1)),
                end: formatDate(new Date(today.getFullYear() - 1, 11, 31)),
                label: (today.getFullYear() - 1).toString()
            }
        };
    }

    getWeekStart(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day;
        start.setDate(diff);
        return start.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');
    }

    getWeekEnd(date) {
        const end = new Date(date);
        const day = end.getDay();
        const diff = end.getDate() - day + 6;
        end.setDate(diff);
        return end.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');
    }

    getWeekRange(date) {
        const start = this.getWeekStart(date);
        const end = this.getWeekEnd(date);
        return `${start} to ${end}`;
    }

    toggleDropdown() {
        this.dropdown?.classList.toggle('active');
        this.menu?.classList.toggle('show');
    }

    closeDropdown() {
        this.dropdown?.classList.remove('active');
        this.menu?.classList.remove('show');
    }

    selectItem(item) {
        // Remove previous selection
        const previousSelected = this.menu?.querySelector('.dropdown-item.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // Add selection to new item
        item.classList.add('selected');
        
        // Get selection data
        const value = item.dataset.value;
        const text = item.querySelector('.item-main')?.textContent || '';
        
        // Update display
        this.updateDisplay(text, value);
        
        // Store current selection
        this.currentSelection = value;
        
        // Update active filters
        this.updateActiveFilters();
        
        // Close dropdown
        this.closeDropdown();
    }

    updateDisplay(text, value) {
        if (this.selectedText) {
            this.selectedText.textContent = text;
        }
        
        if (this.selectedDate && this.dateRanges[value]) {
            this.selectedDate.textContent = this.dateRanges[value].label.split(' ')[0] || '';
        }
        
        if (this.periodTitle) {
            this.periodTitle.textContent = text;
        }
        
        if (this.periodRange && this.dateRanges[value]) {
            this.periodRange.textContent = this.dateRanges[value].label;
        }
    }

    updateActiveFilters() {
        const tags = [];
        
        // Add period tag
        if (this.currentSelection && this.dateRanges[this.currentSelection]) {
            const periodText = this.menu?.querySelector(`[data-value="${this.currentSelection}"] .item-main`)?.textContent || this.currentSelection;
            tags.push({
                type: 'period',
                text: `Period: ${periodText}`,
                value: this.currentSelection
            });
        }
        
        // Add agent tag
        if (this.currentAgent) {
            tags.push({
                type: 'agent',
                text: `Agent: ${this.currentAgent}`,
                value: this.currentAgent
            });
        }
        
                        // Update display
        if (tags.length > 0) {
            this.activeFilters?.classList.remove('hidden');
            if (this.filterTags) {
                this.filterTags.innerHTML = tags.map(tag => 
                    `<span class="filter-tag">
                        ${tag.text}
                        <button class="remove-tag" data-type="${tag.type}" data-value="${tag.value}">×</button>
                    </span>`
                ).join('');
                
                // Add remove tag listeners
                this.filterTags.querySelectorAll('.remove-tag').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.removeFilter(btn.dataset.type, btn.dataset.value);
                    });
                });
            }
        } else {
            this.activeFilters?.classList.add('hidden');
        }
    }

    removeFilter(type, value) {
        if (type === 'period') {
            // Reset to default period
            const defaultItem = this.menu?.querySelector('[data-value="past-30-days"]');
            if (defaultItem) {
                this.selectItem(defaultItem);
            }
        } else if (type === 'agent') {
            this.currentAgent = '';
            if (this.agentSelect) {
                this.agentSelect.value = '';
            }
        }
        this.updateActiveFilters();
    }

    applyFilter() {
        // Show loading state
        const filterContainer = document.querySelector('.enhanced-date-filter');
        filterContainer?.classList.add('applying');
        
        this.applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
        this.applyBtn.disabled = true;
        
        // Get date range
        const dateRange = this.dateRanges[this.currentSelection];
        let startDate = '';
        let endDate = '';
        
        if (dateRange && dateRange.start && dateRange.end) {
            // Convert DD-MM-YYYY to YYYY-MM-DD for input fields
            startDate = this.convertDateFormat(dateRange.start);
            endDate = this.convertDateFormat(dateRange.end);
        }
        
        // Update hidden date inputs if they exist (for backward compatibility)
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const agentFilterOld = document.getElementById('agent-filter');
        
        if (startDateInput) startDateInput.value = startDate;
        if (endDateInput) endDateInput.value = endDate;
        if (agentFilterOld) agentFilterOld.value = this.currentAgent;
        
        // Apply filters using existing dashboard function
        setTimeout(() => {
            try {
                // Check if dashboard applyFilters function exists
                if (typeof window.applyFilters === 'function') {
                    // Update global filter state
                    if (window.currentFilters) {
                        window.currentFilters.startDate = startDate;
                        window.currentFilters.endDate = endDate;
                        window.currentFilters.agent = this.currentAgent;
                    }
                    
                    // Call existing apply filters function
                    window.applyFilters();
                } else {
                    console.warn('Dashboard applyFilters function not found');
                }
                
                // Success feedback
                this.applyBtn.innerHTML = '<i class="fas fa-check"></i> Applied!';
                filterContainer?.classList.remove('applying');
                
                setTimeout(() => {
                    this.applyBtn.innerHTML = '<i class="fas fa-filter"></i> Apply Filter';
                    this.applyBtn.disabled = false;
                }, 1000);
                
            } catch (error) {
                console.error('Error applying filters:', error);
                this.applyBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
                filterContainer?.classList.remove('applying');
                
                setTimeout(() => {
                    this.applyBtn.innerHTML = '<i class="fas fa-filter"></i> Apply Filter';
                    this.applyBtn.disabled = false;
                }, 2000);
            }
        }, 500);
    }

    resetFilter() {
        // Reset to default values
        this.currentAgent = '';
        if (this.agentSelect) {
            this.agentSelect.value = '';
        }
        
        // Reset to past 30 days
        const defaultItem = this.menu?.querySelector('[data-value="past-30-days"]');
        if (defaultItem) {
            this.selectItem(defaultItem);
        }
        
        // Clear old inputs
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const agentFilterOld = document.getElementById('agent-filter');
        
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
        if (agentFilterOld) agentFilterOld.value = '';
        
        // Apply reset
        if (typeof window.clearFilters === 'function') {
            window.clearFilters();
        }
        
        // Visual feedback
        this.resetBtn.innerHTML = '<i class="fas fa-check"></i> Reset!';
        setTimeout(() => {
            this.resetBtn.innerHTML = '<i class="fas fa-refresh"></i> Reset';
        }, 1000);
        
        this.updateActiveFilters();
    }

    convertDateFormat(dateStr) {
        // Convert DD-MM-YYYY to YYYY-MM-DD
        if (!dateStr || dateStr.includes('to') || dateStr.includes('Live')) return '';
        
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    }

    // Public methods for external integration
    setPeriod(value) {
        const item = this.menu?.querySelector(`[data-value="${value}"]`);
        if (item) {
            this.selectItem(item);
        }
    }

    setAgent(agent) {
        this.currentAgent = agent;
        if (this.agentSelect) {
            this.agentSelect.value = agent;
        }
        this.updateActiveFilters();
    }

    getSelection() {
        const dateRange = this.dateRanges[this.currentSelection];
        return {
            period: this.currentSelection,
            agent: this.currentAgent,
            startDate: dateRange ? this.convertDateFormat(dateRange.start) : '',
            endDate: dateRange ? this.convertDateFormat(dateRange.end) : '',
            dateRange: dateRange ? dateRange.label : '',
            periodText: this.selectedText?.textContent || ''
        };
    }

    // Method to populate agent options (call this after data is loaded)
    populateAgentOptions(agents) {
        if (!this.agentSelect) return;
        
        // Clear existing options except the first one
        this.agentSelect.innerHTML = '<option value="">Semua Agent</option>';
        
        // Add agent options
        agents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent;
            option.textContent = agent;
            this.agentSelect.appendChild(option);
        });
    }
}

// Initialize Enhanced Filter when DOM is ready
let dashboardEnhancedFilter;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize enhanced filter
    dashboardEnhancedFilter = new DashboardEnhancedFilter();
    
    // Make available globally
    window.dashboardEnhancedFilter = dashboardEnhancedFilter;
    
    // Integration functions for backward compatibility
    window.getEnhancedFilterSelection = () => dashboardEnhancedFilter.getSelection();
    window.setEnhancedFilterPeriod = (value) => dashboardEnhancedFilter.setPeriod(value);
    window.setEnhancedFilterAgent = (agent) => dashboardEnhancedFilter.setAgent(agent);
    window.populateEnhancedAgentFilter = (agents) => dashboardEnhancedFilter.populateAgentOptions(agents);
});

// Integration with existing dashboard functions
// Override or extend existing functions if needed
if (typeof window.populateAgentFilter === 'function') {
    const originalPopulateAgentFilter = window.populateAgentFilter;
    window.populateAgentFilter = function(...args) {
        // Call original function
        originalPopulateAgentFilter.apply(this, args);
        
        // Also populate enhanced filter if available
        if (dashboardEnhancedFilter && window.allData && window.allData.salesteam) {
            const agents = [...new Set(window.allData.salesteam
                .map(item => item.agent || item.team)
                .filter(Boolean)
            )].sort();
            dashboardEnhancedFilter.populateAgentOptions(agents);
        }
    };
}

// Auto-populate agents when data is loaded
if (typeof window.fetchAllData === 'function') {
    const originalFetchAllData = window.fetchAllData;
    window.fetchAllData = async function(...args) {
        const result = await originalFetchAllData.apply(this, args);
        
        // Populate enhanced filter agents
        setTimeout(() => {
            if (dashboardEnhancedFilter && window.allData && window.allData.salesteam) {
                const agents = [...new Set(window.allData.salesteam
                    .map(item => item.agent || item.team)
                    .filter(Boolean)
                )].sort();
                dashboardEnhancedFilter.populateAgentOptions(agents);
            }
        }, 1000);
        
        return result;
    };
}