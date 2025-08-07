// Advanced Search and Filtering System
// Provides intelligent search, filtering, and data discovery

class AdvancedSearch {
    constructor() {
        this.searchIndex = new Map();
        this.filters = new Map();
        this.searchHistory = [];
        this.suggestions = [];
        
        this.initializeSearch();
        console.log('🔍 Advanced Search initialized');
    }

    initializeSearch() {
        this.setupSearchInterface();
        this.buildSearchIndex();
        this.setupFilterToggles();
        this.setupKeyboardShortcuts();
        
        // Rebuild search index when data updates
        this.observeDataChanges();
    }

    setupSearchInterface() {
        const searchInput = document.getElementById('dashboard-search');
        if (!searchInput) return;

        // Enhanced search with suggestions
        searchInput.parentNode.style.position = 'relative';
        
        // Create suggestions dropdown
        const suggestionsDropdown = document.createElement('div');
        suggestionsDropdown.id = 'search-suggestions';
        suggestionsDropdown.className = 'search-suggestions hidden';
        suggestionsDropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 8px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
        `;
        
        searchInput.parentNode.appendChild(suggestionsDropdown);

        // Enhanced search input behavior
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300); // Debounce search
        });

        searchInput.addEventListener('focus', () => {
            this.showSearchSuggestions();
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => this.hideSearchSuggestions(), 200);
        });

        // Enhanced search input styling
        searchInput.style.cssText += `
            background: rgba(15, 23, 42, 0.8);
            border: 2px solid rgba(59, 130, 246, 0.3);
            color: #e2e8f0;
            padding: 12px 45px 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            transition: all 0.3s ease;
            width: 100%;
            max-width: 400px;
        `;

        // Add search icon
        const searchIcon = document.createElement('i');
        searchIcon.className = 'fas fa-search';
        searchIcon.style.cssText = `
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
            pointer-events: none;
        `;
        searchInput.parentNode.appendChild(searchIcon);
    }

    buildSearchIndex() {
        // Index all searchable content
        this.indexKPIData();
        this.indexMetricsData();
        this.indexOrderData();
        this.indexTeamData();
        
        console.log('📊 Search index built:', this.searchIndex.size, 'items');
    }

    indexKPIData() {
        const kpiItems = [
            { id: 'total-sales', label: 'Total Sales', category: 'KPI', keywords: ['sales', 'revenue', 'income', 'jualan'] },
            { id: 'avg-roas', label: 'Average ROAS', category: 'KPI', keywords: ['roas', 'return', 'advertising', 'roi'] },
            { id: 'leads-per-agent', label: 'Leads per Agent', category: 'KPI', keywords: ['leads', 'agent', 'team', 'performance'] },
            { id: 'total-orders', label: 'Total Orders', category: 'KPI', keywords: ['orders', 'purchase', 'transactions', 'pesanan'] }
        ];

        kpiItems.forEach(item => {
            this.searchIndex.set(item.id, {
                ...item,
                value: document.getElementById(item.id)?.textContent || '',
                searchable: [item.label, ...item.keywords].join(' ').toLowerCase()
            });
        });
    }

    indexMetricsData() {
        const powerMetrics = [
            { id: 'kpi-harian', label: 'KPI Harian', category: 'Power Metrics', keywords: ['daily', 'harian', 'target', 'sasaran'] },
            { id: 'kpi-mtd', label: 'KPI MTD', category: 'Power Metrics', keywords: ['mtd', 'month', 'bulanan', 'target'] },
            { id: 'sale-mtd', label: 'Sale MTD', category: 'Power Metrics', keywords: ['mtd', 'sales', 'actual', 'achievement'] },
            { id: 'balance-bulanan', label: 'Balance Bulanan', category: 'Power Metrics', keywords: ['balance', 'remaining', 'gap', 'shortfall'] }
        ];

        powerMetrics.forEach(item => {
            this.searchIndex.set(item.id, {
                ...item,
                value: document.getElementById(item.id)?.textContent || '',
                searchable: [item.label, ...item.keywords].join(' ').toLowerCase()
            });
        });
    }

    indexOrderData() {
        // Index order-related data
        const orderMetrics = [
            { id: 'today-orders', label: 'Today Orders', category: 'Orders', keywords: ['today', 'hari ini', 'daily', 'current'] },
            { id: 'today-revenue', label: 'Today Revenue', category: 'Orders', keywords: ['today', 'revenue', 'income', 'pendapatan'] },
            { id: 'today-aov', label: 'Average Order Value', category: 'Orders', keywords: ['aov', 'average', 'value', 'purata'] }
        ];

        orderMetrics.forEach(item => {
            this.searchIndex.set(item.id, {
                ...item,
                value: document.getElementById(item.id)?.textContent || '',
                searchable: [item.label, ...item.keywords].join(' ').toLowerCase()
            });
        });
    }

    indexTeamData() {
        // This would be populated with actual team data from Firebase
        const teamKeywords = ['team', 'agent', 'performance', 'sales', 'leads', 'conversion'];
        
        this.searchIndex.set('team-performance', {
            id: 'team-performance',
            label: 'Team Performance',
            category: 'Team',
            keywords: teamKeywords,
            searchable: teamKeywords.join(' ').toLowerCase()
        });
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.clearSearchResults();
            this.showSearchSuggestions();
            return;
        }

        const results = this.performSearch(query);
        this.displaySearchResults(results);
        this.addToSearchHistory(query);
    }

    performSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        const results = [];

        // Exact matches first
        for (const [id, item] of this.searchIndex) {
            if (item.searchable.includes(searchTerm)) {
                const relevance = this.calculateRelevance(searchTerm, item);
                results.push({ ...item, relevance });
            }
        }

        // Sort by relevance
        return results.sort((a, b) => b.relevance - a.relevance).slice(0, 8);
    }

    calculateRelevance(searchTerm, item) {
        let score = 0;
        
        // Exact label match gets highest score
        if (item.label.toLowerCase().includes(searchTerm)) {
            score += 100;
        }
        
        // Keywords match
        const keywordMatches = item.keywords.filter(keyword => 
            keyword.toLowerCase().includes(searchTerm)
        ).length;
        score += keywordMatches * 20;
        
        // Category bonus
        if (item.category.toLowerCase().includes(searchTerm)) {
            score += 10;
        }
        
        // Current value relevance (if showing data)
        if (item.value && item.value !== '0' && item.value !== 'RM 0') {
            score += 5;
        }
        
        return score;
    }

    displaySearchResults(results) {
        const dropdown = document.getElementById('search-suggestions');
        if (!dropdown) return;

        if (results.length === 0) {
            dropdown.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <span>No results found</span>
                </div>
            `;
        } else {
            dropdown.innerHTML = results.map(result => `
                <div class="search-result-item" data-target="${result.id}">
                    <div class="result-icon">
                        ${this.getCategoryIcon(result.category)}
                    </div>
                    <div class="result-content">
                        <div class="result-label">${result.label}</div>
                        <div class="result-meta">
                            <span class="result-category">${result.category}</span>
                            ${result.value ? `<span class="result-value">${result.value}</span>` : ''}
                        </div>
                    </div>
                    <div class="result-action">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            `).join('');
        }

        dropdown.classList.remove('hidden');
        this.setupResultClickHandlers();
    }

    showSearchSuggestions() {
        const dropdown = document.getElementById('search-suggestions');
        if (!dropdown) return;

        // Show recent searches and popular items
        const suggestions = this.generateSuggestions();
        
        dropdown.innerHTML = `
            <div class="search-section">
                <div class="search-section-title">Quick Access</div>
                ${suggestions.map(suggestion => `
                    <div class="search-suggestion-item" data-suggestion="${suggestion.query}">
                        <i class="fas ${suggestion.icon}"></i>
                        <span>${suggestion.label}</span>
                    </div>
                `).join('')}
            </div>
            ${this.searchHistory.length > 0 ? `
                <div class="search-section">
                    <div class="search-section-title">Recent Searches</div>
                    ${this.searchHistory.slice(-3).reverse().map(term => `
                        <div class="search-suggestion-item" data-suggestion="${term}">
                            <i class="fas fa-history"></i>
                            <span>${term}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;

        dropdown.classList.remove('hidden');
        this.setupSuggestionClickHandlers();
    }

    generateSuggestions() {
        return [
            { query: 'sales', label: 'Total Sales', icon: 'fa-dollar-sign' },
            { query: 'orders', label: 'Order Analytics', icon: 'fa-shopping-bag' },
            { query: 'team', label: 'Team Performance', icon: 'fa-users' },
            { query: 'target', label: 'Monthly Targets', icon: 'fa-bullseye' },
            { query: 'daily', label: 'Daily Metrics', icon: 'fa-calendar-day' },
            { query: 'revenue', label: 'Revenue Tracking', icon: 'fa-chart-line' }
        ];
    }

    hideSearchSuggestions() {
        const dropdown = document.getElementById('search-suggestions');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }

    clearSearchResults() {
        // Remove any search highlighting
        const highlighted = document.querySelectorAll('.search-highlight');
        highlighted.forEach(el => {
            el.classList.remove('search-highlight');
        });
    }

    setupResultClickHandlers() {
        const resultItems = document.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetId = item.dataset.target;
                this.navigateToResult(targetId);
            });
        });
    }

    setupSuggestionClickHandlers() {
        const suggestionItems = document.querySelectorAll('.search-suggestion-item');
        suggestionItems.forEach(item => {
            item.addEventListener('click', () => {
                const suggestion = item.dataset.suggestion;
                const searchInput = document.getElementById('dashboard-search');
                if (searchInput) {
                    searchInput.value = suggestion;
                    this.handleSearch(suggestion);
                }
            });
        });
    }

    navigateToResult(targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            // Smooth scroll to element
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Highlight element
            targetElement.classList.add('search-highlight');
            
            // Remove highlight after animation
            setTimeout(() => {
                targetElement.classList.remove('search-highlight');
            }, 2000);
        }
        
        this.hideSearchSuggestions();
        this.clearSearchInput();
    }

    clearSearchInput() {
        const searchInput = document.getElementById('dashboard-search');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    getCategoryIcon(category) {
        const icons = {
            'KPI': '<i class="fas fa-chart-bar"></i>',
            'Power Metrics': '<i class="fas fa-bolt"></i>',
            'Orders': '<i class="fas fa-shopping-bag"></i>',
            'Team': '<i class="fas fa-users"></i>',
            'Analytics': '<i class="fas fa-chart-line"></i>'
        };
        return icons[category] || '<i class="fas fa-info-circle"></i>';
    }

    addToSearchHistory(query) {
        const trimmedQuery = query.trim().toLowerCase();
        
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);
        
        // Add to beginning
        this.searchHistory.unshift(trimmedQuery);
        
        // Keep only last 10
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        // Save to localStorage
        try {
            localStorage.setItem('kilangdm-search-history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.log('Failed to save search history:', error);
        }
    }

    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('kilangdm-search-history');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.log('Failed to load search history:', error);
        }
    }

    setupFilterToggles() {
        // Add quick filter buttons
        const filterContainer = document.createElement('div');
        filterContainer.className = 'quick-filters';
        filterContainer.style.cssText = `
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        `;

        const filters = [
            { id: 'kpi', label: 'KPI', icon: 'fa-chart-bar' },
            { id: 'orders', label: 'Orders', icon: 'fa-shopping-bag' },
            { id: 'team', label: 'Team', icon: 'fa-users' },
            { id: 'targets', label: 'Targets', icon: 'fa-bullseye' }
        ];

        filters.forEach(filter => {
            const button = document.createElement('button');
            button.className = 'quick-filter-btn';
            button.dataset.filter = filter.id;
            button.innerHTML = `<i class="fas ${filter.icon}"></i> ${filter.label}`;
            button.style.cssText = `
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.3);
                color: #94a3b8;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;

            button.addEventListener('click', () => {
                this.applyQuickFilter(filter.id);
                this.toggleFilterActive(button);
            });

            filterContainer.appendChild(button);
        });

        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.appendChild(filterContainer);
        }
    }

    applyQuickFilter(filterId) {
        const searchInput = document.getElementById('dashboard-search');
        if (!searchInput) return;

        const filterQueries = {
            'kpi': 'sales roas leads orders',
            'orders': 'orders today revenue aov',
            'team': 'team agent performance',
            'targets': 'target kpi mtd balance'
        };

        const query = filterQueries[filterId] || filterId;
        searchInput.value = query;
        this.handleSearch(query);
    }

    toggleFilterActive(button) {
        // Remove active from others
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.style.background = 'rgba(59, 130, 246, 0.1)';
            btn.style.color = '#94a3b8';
        });

        // Activate clicked button
        button.style.background = 'rgba(59, 130, 246, 0.3)';
        button.style.color = '#60a5fa';
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('dashboard-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape to clear search
            if (e.key === 'Escape') {
                this.clearSearchInput();
                this.hideSearchSuggestions();
                this.clearSearchResults();
            }
        });
    }

    observeDataChanges() {
        // Observer for DOM changes to rebuild search index
        const observer = new MutationObserver((mutations) => {
            let shouldRebuild = false;
            
            mutations.forEach((mutation) => {
                if (mutation.target.matches('[id]') && 
                    this.searchIndex.has(mutation.target.id)) {
                    shouldRebuild = true;
                }
            });

            if (shouldRebuild) {
                setTimeout(() => this.buildSearchIndex(), 1000);
            }
        });

        // Observe KPI and metrics elements
        const elementsToObserve = [
            'total-sales', 'avg-roas', 'leads-per-agent', 'total-orders',
            'kpi-harian', 'kpi-mtd', 'sale-mtd', 'balance-bulanan',
            'today-orders', 'today-revenue', 'today-aov'
        ];

        elementsToObserve.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element, { 
                    childList: true, 
                    characterData: true, 
                    subtree: true 
                });
            }
        });
    }

    // Public methods
    search(query) {
        const searchInput = document.getElementById('dashboard-search');
        if (searchInput) {
            searchInput.value = query;
            this.handleSearch(query);
        }
    }

    getSearchHistory() {
        return [...this.searchHistory];
    }

    clearHistory() {
        this.searchHistory = [];
        localStorage.removeItem('kilangdm-search-history');
    }
}

// Add search-specific CSS
const searchStyles = document.createElement('style');
searchStyles.textContent = `
    .search-suggestions {
        border-top: none;
        margin-top: 2px;
    }

    .search-suggestions.hidden {
        display: none;
    }

    .search-result-item, .search-suggestion-item {
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 1px solid rgba(59, 130, 246, 0.1);
    }

    .search-result-item:hover, .search-suggestion-item:hover {
        background: rgba(59, 130, 246, 0.1);
    }

    .result-icon, .search-suggestion-item i {
        color: #3b82f6;
        width: 20px;
        text-align: center;
    }

    .result-content {
        flex: 1;
    }

    .result-label {
        font-weight: 600;
        color: #e2e8f0;
        margin-bottom: 2px;
    }

    .result-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
    }

    .result-category {
        color: #94a3b8;
    }

    .result-value {
        color: #22c55e;
        font-weight: 600;
    }

    .result-action {
        color: #64748b;
    }

    .search-section-title {
        padding: 8px 16px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid rgba(59, 130, 246, 0.1);
    }

    .search-no-results {
        padding: 20px;
        text-align: center;
        color: #64748b;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .search-highlight {
        animation: searchHighlight 2s ease;
        border: 2px solid #3b82f6 !important;
        border-radius: 8px !important;
    }

    @keyframes searchHighlight {
        0% { 
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            border-color: #3b82f6;
        }
        50% { 
            box-shadow: 0 0 20px 10px rgba(59, 130, 246, 0.3);
            border-color: #60a5fa;
        }
        100% { 
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            border-color: #3b82f6;
        }
    }

    .quick-filters {
        animation: slideInUp 0.5s ease;
    }

    @keyframes slideInUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .search-suggestions::-webkit-scrollbar {
        width: 4px;
    }

    .search-suggestions::-webkit-scrollbar-track {
        background: rgba(59, 130, 246, 0.1);
        border-radius: 2px;
    }

    .search-suggestions::-webkit-scrollbar-thumb {
        background: #3b82f6;
        border-radius: 2px;
    }
`;

document.head.appendChild(searchStyles);

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.advancedSearch = new AdvancedSearch();
});

console.log('🔍 Advanced Search script loaded');