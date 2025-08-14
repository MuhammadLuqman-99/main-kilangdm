// Advanced Dashboard Filter Controller
class AdvancedDashboardFilter {
    constructor() {
        this.currentTab = 'quick';
        this.currentSelection = {
            type: 'quick',
            value: 'this-month',
            year: null,
            month: null,
            startDay: null,
            endDay: null,
            customStart: null,
            customEnd: null,
            agent: null
        };
        
        this.init();
        this.populateYearSelector();
        this.updateQuickLabels();
        this.setDefaultSelection();
    }

    init() {
        // Tab switching
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.type);
            });
        });

        // Quick select buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectQuickPeriod(btn.dataset.period);
            });
        });

        // Advanced selectors
        document.getElementById('year-selector')?.addEventListener('change', () => {
            this.onYearChange();
        });

        document.getElementById('month-selector')?.addEventListener('change', () => {
            this.onMonthChange();
        });

        // Day range inputs
        document.getElementById('start-day')?.addEventListener('change', () => {
            this.onDayRangeChange();
        });

        document.getElementById('end-day')?.addEventListener('change', () => {
            this.onDayRangeChange();
        });

        // Custom date inputs
        document.getElementById('custom-start-date')?.addEventListener('change', () => {
            this.onCustomDateChange();
        });

        document.getElementById('custom-end-date')?.addEventListener('change', () => {
            this.onCustomDateChange();
        });

        // Agent filter
        document.getElementById('agent-filter-enhanced')?.addEventListener('change', () => {
            this.onAgentChange();
        });

        // Action buttons
        document.getElementById('applyFilterEnhanced')?.addEventListener('click', () => {
            this.applyFilter();
        });

        document.getElementById('resetFilterEnhanced')?.addEventListener('click', () => {
            this.resetFilter();
        });

        document.getElementById('exportDataBtn')?.addEventListener('click', () => {
            this.exportData();
        });
    }

    switchTab(tabType) {
        // Update tab buttons
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-type="${tabType}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.filter-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabType}-tab`).classList.add('active');

        this.currentTab = tabType;
        this.currentSelection.type = tabType;
        this.updateDisplay();
    }

    populateYearSelector() {
        const yearSelector = document.getElementById('year-selector');
        if (!yearSelector) return;

        const currentYear = new Date().getFullYear();
        
        // Add years from 2020 to current year + 2
        for (let year = 2020; year <= currentYear + 2; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) {
                option.selected = true;
            }
            yearSelector.appendChild(option);
        }
    }

    updateQuickLabels() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Format functions
        const formatDate = (date) => date.toLocaleDateString('ms-MY', {
            day: '2-digit',
            month: '2-digit'
        });

        const formatMonth = (date) => date.toLocaleDateString('ms-MY', {
            month: 'long',
            year: 'numeric'
        });

        // Update labels
        const updates = {
            'today-label': formatDate(today),
            'yesterday-label': formatDate(yesterday),
            'thisweek-label': this.getWeekLabel(today),
            'lastweek-label': this.getWeekLabel(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
            'thismonth-label': formatMonth(today),
            'lastmonth-label': formatMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
            'thisyear-label': today.getFullYear().toString(),
            'lastyear-label': (today.getFullYear() - 1).toString()
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    getWeekLabel(date) {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        return `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`;
    }

    setDefaultSelection() {
        // Set default to current month
        this.selectQuickPeriod('this-month');
    }

    selectQuickPeriod(period) {
        // Update button states
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`)?.classList.add('active');

        this.currentSelection.type = 'quick';
        this.currentSelection.value = period;
        this.updateDisplay();
    }

    onYearChange() {
        const yearSelector = document.getElementById('year-selector');
        const monthSelector = document.getElementById('month-selector');
        
        if (yearSelector.value) {
            monthSelector.disabled = false;
            this.currentSelection.year = parseInt(yearSelector.value);
            this.generateMonthQuickButtons();
        } else {
            monthSelector.disabled = true;
            monthSelector.value = '';
            this.disableDayInputs();
        }
        
        this.currentSelection.type = 'advanced';
        this.updateDisplay();
    }

    onMonthChange() {
        const monthSelector = document.getElementById('month-selector');
        const startDayInput = document.getElementById('start-day');
        const endDayInput = document.getElementById('end-day');
        
        if (monthSelector.value) {
            startDayInput.disabled = false;
            endDayInput.disabled = false;
            this.currentSelection.month = parseInt(monthSelector.value);
            
            // Set max days based on month
            const maxDays = new Date(this.currentSelection.year, this.currentSelection.month, 0).getDate();
            startDayInput.max = maxDays;
            endDayInput.max = maxDays;
        } else {
            this.disableDayInputs();
            this.currentSelection.month = null;
        }
        
        this.updateDisplay();
    }

    onDayRangeChange() {
        const startDay = document.getElementById('start-day').value;
        const endDay = document.getElementById('end-day').value;
        
        this.currentSelection.startDay = startDay ? parseInt(startDay) : null;
        this.currentSelection.endDay = endDay ? parseInt(endDay) : null;
        
        this.updateDisplay();
    }

    onCustomDateChange() {
        const startDate = document.getElementById('custom-start-date').value;
        const endDate = document.getElementById('custom-end-date').value;
        
        this.currentSelection.customStart = startDate;
        this.currentSelection.customEnd = endDate;
        this.currentSelection.type = 'custom';
        
        this.updateDisplay();
    }

    onAgentChange() {
        const agentSelect = document.getElementById('agent-filter-enhanced');
        this.currentSelection.agent = agentSelect.value;
        this.updateActiveFilters();
    }

    disableDayInputs() {
        document.getElementById('start-day').disabled = true;
        document.getElementById('end-day').disabled = true;
        document.getElementById('start-day').value = '';
        document.getElementById('end-day').value = '';
        this.currentSelection.startDay = null;
        this.currentSelection.endDay = null;
    }

    generateMonthQuickButtons() {
        const container = document.getElementById('month-quick-grid');
        if (!container) return;

        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
        ];

        container.innerHTML = months.map((month, index) => 
            `<button class="month-quick-btn" data-month="${index + 1}">${month}</button>`
        ).join('');

        // Add event listeners
        container.querySelectorAll('.month-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('month-selector').value = btn.dataset.month;
                this.onMonthChange();
                
                // Update button states
                container.querySelectorAll('.month-quick-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    updateDisplay() {
        const { startDate, endDate, displayText, workingDays, totalDays } = this.getDateRange();
        
        // Update period display
        document.getElementById('periodTitle').textContent = displayText;
        document.getElementById('periodRange').textContent = `${startDate} to ${endDate}`;
        document.getElementById('period-days').textContent = `${totalDays} hari`;
        document.getElementById('period-working-days').textContent = `${workingDays} hari kerja`;
        
        this.updateActiveFilters();
    }

    getDateRange() {
        const today = new Date();
        let startDate, endDate, displayText;

        switch (this.currentSelection.type) {
            case 'quick':
                return this.getQuickDateRange(this.currentSelection.value);
                
            case 'advanced':
                return this.getAdvancedDateRange();
                
            case 'custom':
                return this.getCustomDateRange();
                
            default:
                return this.getQuickDateRange('this-month');
        }
    }

    getQuickDateRange(period) {
        const today = new Date();
        let startDate, endDate, displayText;

        switch (period) {
            case 'today':
                startDate = endDate = this.formatDate(today);
                displayText = 'Hari Ini';
                break;
                
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = endDate = this.formatDate(yesterday);
                displayText = 'Semalam';
                break;
                
            case 'this-week':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                startDate = this.formatDate(startOfWeek);
                endDate = this.formatDate(today);
                displayText = 'Minggu Ini';
                break;
                
            case 'last-week':
                const lastWeekEnd = new Date(today);
                lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
                const lastWeekStart = new Date(lastWeekEnd);
                lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
                startDate = this.formatDate(lastWeekStart);
                endDate = this.formatDate(lastWeekEnd);
                displayText = 'Minggu Lepas';
                break;
                
            case 'this-month':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate = this.formatDate(startOfMonth);
                endDate = this.formatDate(today);
                displayText = `${this.getMonthName(today.getMonth())} ${today.getFullYear()}`;
                break;
                
            case 'last-month':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                startDate = this.formatDate(lastMonth);
                endDate = this.formatDate(lastMonthEnd);
                displayText = `${this.getMonthName(lastMonth.getMonth())} ${lastMonth.getFullYear()}`;
                break;
                
            case 'this-year':
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                startDate = this.formatDate(startOfYear);
                endDate = this.formatDate(today);
                displayText = `Tahun ${today.getFullYear()}`;
                break;
                
            case 'last-year':
                const lastYear = today.getFullYear() - 1;
                const startOfLastYear = new Date(lastYear, 0, 1);
                const endOfLastYear = new Date(lastYear, 11, 31);
                startDate = this.formatDate(startOfLastYear);
                endDate = this.formatDate(endOfLastYear);
                displayText = `Tahun ${lastYear}`;
                break;
                
            default:
                startDate = endDate = this.formatDate(today);
                displayText = 'Hari Ini';
        }

        const totalDays = this.calculateDaysDifference(startDate, endDate) + 1;
        const workingDays = this.calculateWorkingDays(startDate, endDate);

        return { startDate, endDate, displayText, totalDays, workingDays };
    }

    getAdvancedDateRange() {
        const { year, month, startDay, endDay } = this.currentSelection;
        
        if (!year) {
            return this.getQuickDateRange('this-month');
        }

        let startDate, endDate, displayText;

        if (month) {
            const monthStart = new Date(year, month - 1, startDay || 1);
            const monthEnd = new Date(year, month - 1, endDay || new Date(year, month, 0).getDate());
            
            startDate = this.formatDate(monthStart);
            endDate = this.formatDate(monthEnd);
            
            if (startDay && endDay) {
                displayText = `${startDay}-${endDay} ${this.getMonthName(month - 1)} ${year}`;
            } else if (startDay) {
                displayText = `Dari ${startDay} ${this.getMonthName(month - 1)} ${year}`;
            } else if (endDay) {
                displayText = `Hingga ${endDay} ${this.getMonthName(month - 1)} ${year}`;
            } else {
                displayText = `${this.getMonthName(month - 1)} ${year}`;
            }
        } else {
            // Whole year
            startDate = this.formatDate(new Date(year, 0, 1));
            endDate = this.formatDate(new Date(year, 11, 31));
            displayText = `Tahun ${year}`;
        }

        const totalDays = this.calculateDaysDifference(startDate, endDate) + 1;
        const workingDays = this.calculateWorkingDays(startDate, endDate);

        return { startDate, endDate, displayText, totalDays, workingDays };
    }

    getCustomDateRange() {
        const { customStart, customEnd } = this.currentSelection;
        
        if (!customStart || !customEnd) {
            return this.getQuickDateRange('this-month');
        }

        const startDate = customStart;
        const endDate = customEnd;
        const displayText = `Custom Range`;

        const totalDays = this.calculateDaysDifference(startDate, endDate) + 1;
        const workingDays = this.calculateWorkingDays(startDate, endDate);

        return { startDate, endDate, displayText, totalDays, workingDays };
    }

    formatDate(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    getMonthName(monthIndex) {
        const months = [
            'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
            'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
        ];
        return months[monthIndex];
    }

    calculateDaysDifference(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    calculateWorkingDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let workingDays = 0;
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            // Exclude Friday (5) and Saturday (6) for Malaysian working pattern
            if (dayOfWeek !== 5 && dayOfWeek !== 6) {
                workingDays++;
            }
        }
        
        return workingDays;
    }

    updateActiveFilters() {
        const { displayText } = this.getDateRange();
        const tags = [];

        // Add period tag
        tags.push({
            type: 'period',
            text: `Tempoh: ${displayText}`,
            value: 'period'
        });

        // Add agent tag if selected
        if (this.currentSelection.agent) {
            tags.push({
                type: 'agent',
                text: `Agent: ${this.currentSelection.agent}`,
                value: this.currentSelection.agent
            });
        }

        // Update display
        const activeFilters = document.getElementById('activeFiltersEnhanced');
        const filterTags = document.getElementById('filterTagsEnhanced');

        if (tags.length > 0) {
            activeFilters?.classList.remove('hidden');
            if (filterTags) {
                filterTags.innerHTML = tags.map(tag => 
                    `<span class="filter-tag">
                        ${tag.text}
                        <button class="remove-tag" data-type="${tag.type}" data-value="${tag.value}">×</button>
                    </span>`
                ).join('');

                // Add remove tag listeners
                filterTags.querySelectorAll('.remove-tag').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.removeFilter(btn.dataset.type);
                    });
                });
            }
        } else {
            activeFilters?.classList.add('hidden');
        }
    }

    removeFilter(type) {
        if (type === 'period') {
            this.setDefaultSelection();
        } else if (type === 'agent') {
            this.currentSelection.agent = '';
            const agentSelect = document.getElementById('agent-filter-enhanced');
            if (agentSelect) agentSelect.value = '';
        }
        this.updateActiveFilters();
    }

    applyFilter() {
        const applyBtn = document.getElementById('applyFilterEnhanced');
        const originalText = applyBtn.innerHTML;
        
        // Show loading state
        applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        applyBtn.disabled = true;

        const { startDate, endDate } = this.getDateRange();

        // Update global filters for dashboard integration
        if (window.currentFilters) {
            window.currentFilters.startDate = startDate;
            window.currentFilters.endDate = endDate;
            window.currentFilters.agent = this.currentSelection.agent;
        }

        // Apply filters using existing dashboard function
        setTimeout(() => {
            try {
                if (typeof window.applyFilters === 'function') {
                    // Update old filter inputs for backward compatibility
                    const startDateInput = document.getElementById('start-date');
                    const endDateInput = document.getElementById('end-date');
                    const agentFilterOld = document.getElementById('agent-filter');
                    
                    if (startDateInput) startDateInput.value = startDate;
                    if (endDateInput) endDateInput.value = endDate;
                    if (agentFilterOld) agentFilterOld.value = this.currentSelection.agent || '';

                    window.applyFilters();
                    
                    // Success feedback
                    applyBtn.innerHTML = '<i class="fas fa-check"></i> Berjaya!';
                    setTimeout(() => {
                        applyBtn.innerHTML = originalText;
                        applyBtn.disabled = false;
                    }, 1500);
                } else {
                    throw new Error('Dashboard applyFilters function not found');
                }
            } catch (error) {
                console.error('Error applying filters:', error);
                applyBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Ralat!';
                setTimeout(() => {
                    applyBtn.innerHTML = originalText;
                    applyBtn.disabled = false;
                }, 2000);
            }
        }, 500);
    }

    resetFilter() {
        // Reset all selections
        this.currentSelection = {
            type: 'quick',
            value: 'this-month',
            year: null,
            month: null,
            startDay: null,
            endDay: null,
            customStart: null,
            customEnd: null,
            agent: null
        };

        // Reset UI elements
        document.getElementById('year-selector').value = '';
        document.getElementById('month-selector').value = '';
        document.getElementById('month-selector').disabled = true;
        this.disableDayInputs();
        document.getElementById('custom-start-date').value = '';
        document.getElementById('custom-end-date').value = '';
        document.getElementById('agent-filter-enhanced').value = '';

        // Switch back to quick tab and select default
        this.switchTab('quick');
        this.setDefaultSelection();

        // Reset global filters
        if (typeof window.clearFilters === 'function') {
            window.clearFilters();
        }

        // Visual feedback
        const resetBtn = document.getElementById('resetFilterEnhanced');
        const originalText = resetBtn.innerHTML;
        resetBtn.innerHTML = '<i class="fas fa-check"></i> Reset!';
        setTimeout(() => {
            resetBtn.innerHTML = originalText;
        }, 1000);
    }

    exportData() {
        const { startDate, endDate, displayText } = this.getDateRange();
        
        // This would integrate with your export functionality
        console.log('Exporting data for:', {
            period: displayText,
            startDate,
            endDate,
            agent: this.currentSelection.agent
        });
        
        // You can implement actual export logic here
        console.log(`📤 Export data untuk tempoh: ${displayText}\nDari: ${startDate}\nHingga: ${endDate}`);
    }

    // Public methods for external integration
    getSelection() {
        const { startDate, endDate, displayText } = this.getDateRange();
        return {
            startDate,
            endDate,
            agent: this.currentSelection.agent || '',
            displayText,
            type: this.currentSelection.type,
            details: this.currentSelection
        };
    }

    populateAgentOptions(agents) {
        const agentSelect = document.getElementById('agent-filter-enhanced');
        if (!agentSelect) return;

        // Clear existing options except the first one
        agentSelect.innerHTML = '<option value="">Semua Agent</option>';

        // Add agent options
        agents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent;
            option.textContent = agent;
            agentSelect.appendChild(option);
        });
    }
}

// Initialize when DOM is ready
let advancedDashboardFilter;

document.addEventListener('DOMContentLoaded', () => {
    advancedDashboardFilter = new AdvancedDashboardFilter();
    
    // Make globally available
    window.advancedDashboardFilter = advancedDashboardFilter;
    window.getEnhancedFilterSelection = () => advancedDashboardFilter.getSelection();
    window.populateEnhancedAgentFilter = (agents) => advancedDashboardFilter.populateAgentOptions(agents);
});

console.log('🎯 Advanced Dashboard Filter loaded!');
console.log('📊 Features: Year/Month/Day selection, Quick periods, Custom range, Agent filter');