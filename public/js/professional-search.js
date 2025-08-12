/**
 * PROFESSIONAL SEARCH SYSTEM
 * Advanced search with fuzzy matching, filters, and shortcuts like Notion, Slack, VS Code
 */

class ProfessionalSearch {
    constructor() {
        this.searchData = new Map();
        this.searchHistory = JSON.parse(localStorage.getItem('kilangdm-search-history') || '[]');
        this.filters = new Map();
        this.setupGlobalSearch();
        this.setupKeyboardShortcuts();
        this.setupFuzzySearch();
    }

    setupGlobalSearch() {
        // Create search overlay
        const overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.id = 'global-search-overlay';
        overlay.style.display = 'none';
        
        overlay.innerHTML = `
            <div class="search-modal">
                <div class="search-header">
                    <div class="search-input-container">
                        <div class="search-icon">🔍</div>
                        <input type="text" id="global-search-input" 
                               placeholder="Search anything... (try: orders, kpi, team, data)"
                               autocomplete="off">
                        <div class="search-shortcuts">
                            <span class="shortcut">Ctrl+K</span>
                        </div>
                    </div>
                    <button class="search-close" id="search-close-btn">✕</button>
                </div>
                
                <div class="search-filters">
                    <button class="search-filter active" data-filter="all">All</button>
                    <button class="search-filter" data-filter="pages">Pages</button>
                    <button class="search-filter" data-filter="data">Data</button>
                    <button class="search-filter" data-filter="actions">Actions</button>
                    <button class="search-filter" data-filter="help">Help</button>
                </div>
                
                <div class="search-content">
                    <div class="search-results" id="search-results">
                        <div class="search-suggestions">
                            <div class="suggestions-section">
                                <div class="suggestions-title">Quick Actions</div>
                                <div class="suggestion-item" data-action="goto-dashboard">
                                    <div class="suggestion-icon">📊</div>
                                    <div class="suggestion-text">
                                        <div class="suggestion-title">Dashboard</div>
                                        <div class="suggestion-subtitle">View analytics dashboard</div>
                                    </div>
                                    <div class="suggestion-shortcut">Enter</div>
                                </div>
                                <div class="suggestion-item" data-action="create-order">
                                    <div class="suggestion-icon">🛒</div>
                                    <div class="suggestion-text">
                                        <div class="suggestion-title">New Order</div>
                                        <div class="suggestion-subtitle">Create new order</div>
                                    </div>
                                </div>
                                <div class="suggestion-item" data-action="export-data">
                                    <div class="suggestion-icon">📤</div>
                                    <div class="suggestion-text">
                                        <div class="suggestion-title">Export Data</div>
                                        <div class="suggestion-subtitle">Download reports</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="search-footer">
                    <div class="search-tips">
                        <span class="tip"><kbd>↑↓</kbd> Navigate</span>
                        <span class="tip"><kbd>Enter</kbd> Select</span>
                        <span class="tip"><kbd>Esc</kbd> Close</span>
                    </div>
                    <div class="search-stats" id="search-stats"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.searchInput = overlay.querySelector('#global-search-input');
        this.searchResults = overlay.querySelector('#search-results');
        
        this.setupSearchEvents();
    }

    setupSearchEvents() {
        // Input events
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleSearchNavigation(e);
        });
        
        // Filter events
        this.overlay.querySelectorAll('.search-filter').forEach(filter => {
            filter.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });
        
        // Close events
        this.overlay.querySelector('#search-close-btn').addEventListener('click', () => {
            this.closeSearch();
        });
        
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeSearch();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K - Open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
            
            // Ctrl/Cmd + Shift + P - Command palette
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.openCommandPalette();
            }
            
            // Escape - Close search
            if (e.key === 'Escape' && this.overlay.style.display !== 'none') {
                this.closeSearch();
            }
        });
    }

    setupFuzzySearch() {
        // Initialize search data
        this.indexSearchableContent();
        this.setupSearchableActions();
    }

    indexSearchableContent() {
        // Index pages and content
        const searchableItems = [
            // Pages
            { id: 'dashboard', title: 'Dashboard', subtitle: 'Analytics dashboard', type: 'page', icon: '📊', url: 'dashboard.html' },
            { id: 'orders', title: 'Orders', subtitle: 'Order management', type: 'page', icon: '📋', url: 'dashboardbo.html' },
            { id: 'ecommerce', title: 'New Order', subtitle: 'Create order', type: 'page', icon: '🛒', url: 'ecommerce.html' },
            { id: 'marketing', title: 'Marketing', subtitle: 'Marketing data', type: 'page', icon: '📈', url: 'marketing.html' },
            { id: 'sales', title: 'Sales Team', subtitle: 'Team performance', type: 'page', icon: '👥', url: 'salesteam.html' },
            { id: 'followup', title: 'Follow Up', subtitle: 'Customer follow up', type: 'page', icon: '📞', url: 'followup.html' },
            
            // Data/KPIs
            { id: 'kpi', title: 'KPI Dashboard', subtitle: 'Key performance indicators', type: 'data', icon: '📊' },
            { id: 'sales-data', title: 'Sales Data', subtitle: 'Revenue and sales metrics', type: 'data', icon: '💰' },
            { id: 'roas', title: 'ROAS', subtitle: 'Return on ad spend', type: 'data', icon: '📈' },
            { id: 'leads', title: 'Leads', subtitle: 'Lead generation data', type: 'data', icon: '🎯' },
            { id: 'team-performance', title: 'Team Performance', subtitle: 'Sales team metrics', type: 'data', icon: '🏆' },
            
            // Actions
            { id: 'export', title: 'Export Data', subtitle: 'Download reports', type: 'action', icon: '📤', action: 'export-data' },
            { id: 'refresh', title: 'Refresh Data', subtitle: 'Update dashboard', type: 'action', icon: '🔄', action: 'refresh-data' },
            { id: 'filter', title: 'Filter Data', subtitle: 'Apply filters', type: 'action', icon: '🔍', action: 'open-filter' },
            { id: 'settings', title: 'Settings', subtitle: 'Dashboard settings', type: 'action', icon: '⚙️', action: 'open-settings' },
            
            // Help
            { id: 'shortcuts', title: 'Keyboard Shortcuts', subtitle: 'View all shortcuts', type: 'help', icon: '⌨️', action: 'show-shortcuts' },
            { id: 'help', title: 'Help & Support', subtitle: 'Get help', type: 'help', icon: '❓', action: 'show-help' },
            { id: 'about', title: 'About KilangDM', subtitle: 'About this dashboard', type: 'help', icon: 'ℹ️', action: 'show-about' }
        ];
        
        searchableItems.forEach(item => {
            this.searchData.set(item.id, item);
        });
    }

    setupSearchableActions() {
        this.actions = {
            'goto-dashboard': () => window.location.href = 'dashboard.html',
            'create-order': () => window.location.href = 'ecommerce.html',
            'export-data': () => this.triggerExport(),
            'refresh-data': () => this.refreshDashboard(),
            'open-filter': () => this.openFilterPanel(),
            'open-settings': () => this.openSettingsPanel(),
            'show-shortcuts': () => this.showKeyboardShortcuts(),
            'show-help': () => this.showHelpDialog(),
            'show-about': () => this.showAboutDialog()
        };
    }

    openSearch() {
        this.overlay.style.display = 'flex';
        this.searchInput.focus();
        this.searchInput.select();
        
        // Show recent searches if no query
        if (!this.searchInput.value) {
            this.showDefaultSuggestions();
        }
        
        // Track analytics
        if (window.gtag) {
            gtag('event', 'search_open', { event_category: 'engagement' });
        }
    }

    closeSearch() {
        this.overlay.style.display = 'none';
        this.searchInput.value = '';
        this.selectedIndex = -1;
    }

    openCommandPalette() {
        this.openSearch();
        this.setActiveFilter('actions');
        this.searchInput.placeholder = 'Type a command...';
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.showDefaultSuggestions();
            return;
        }
        
        const results = this.performFuzzySearch(query);
        this.displaySearchResults(results, query);
        this.addToSearchHistory(query);
    }

    performFuzzySearch(query) {
        const activeFilter = this.overlay.querySelector('.search-filter.active').dataset.filter;
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        const results = [];
        
        for (const [id, item] of this.searchData.entries()) {
            // Filter by type
            if (activeFilter !== 'all' && item.type !== activeFilter && activeFilter !== 'pages') {
                continue;
            }
            
            const searchText = `${item.title} ${item.subtitle}`.toLowerCase();
            let score = 0;
            let matches = [];
            
            // Calculate fuzzy match score
            for (const term of searchTerms) {
                const titleMatch = this.fuzzyMatch(item.title.toLowerCase(), term);
                const subtitleMatch = this.fuzzyMatch(item.subtitle.toLowerCase(), term);
                
                if (titleMatch.score > 0) {
                    score += titleMatch.score * 2; // Title matches are more important
                    matches = matches.concat(titleMatch.matches);
                }
                
                if (subtitleMatch.score > 0) {
                    score += subtitleMatch.score;
                    matches = matches.concat(subtitleMatch.matches);
                }
                
                // Exact word match bonus
                if (searchText.includes(term)) {
                    score += 10;
                }
            }
            
            if (score > 0) {
                results.push({
                    ...item,
                    score,
                    matches,
                    highlightedTitle: this.highlightMatches(item.title, matches),
                    highlightedSubtitle: this.highlightMatches(item.subtitle, matches)
                });
            }
        }
        
        return results.sort((a, b) => b.score - a.score);
    }

    fuzzyMatch(text, pattern) {
        const matches = [];
        let score = 0;
        let patternIndex = 0;
        
        for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
            if (text[i] === pattern[patternIndex]) {
                matches.push(i);
                score += 1;
                patternIndex++;
            }
        }
        
        if (patternIndex === pattern.length) {
            // Bonus for consecutive matches
            for (let i = 1; i < matches.length; i++) {
                if (matches[i] === matches[i-1] + 1) {
                    score += 2;
                }
            }
            
            // Bonus for match at start
            if (matches[0] === 0) {
                score += 5;
            }
        }
        
        return { score: patternIndex === pattern.length ? score : 0, matches };
    }

    highlightMatches(text, matches) {
        if (!matches.length) return text;
        
        let highlighted = '';
        let lastIndex = 0;
        
        matches.forEach(match => {
            highlighted += text.substring(lastIndex, match);
            highlighted += `<mark>${text[match]}</mark>`;
            lastIndex = match + 1;
        });
        
        highlighted += text.substring(lastIndex);
        return highlighted;
    }

    displaySearchResults(results, query) {
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🤔</div>
                    <div class="no-results-title">No results found</div>
                    <div class="no-results-subtitle">Try a different search term</div>
                </div>
            `;
            return;
        }
        
        const groupedResults = this.groupResultsByType(results);
        let html = '';
        
        Object.entries(groupedResults).forEach(([type, items]) => {
            if (items.length === 0) return;
            
            const typeLabels = {
                page: 'Pages',
                data: 'Data & Metrics', 
                action: 'Actions',
                help: 'Help'
            };
            
            html += `
                <div class="results-section">
                    <div class="results-section-title">${typeLabels[type] || type}</div>
                    ${items.map((item, index) => `
                        <div class="result-item" data-id="${item.id}" data-index="${index}">
                            <div class="result-icon">${item.icon}</div>
                            <div class="result-content">
                                <div class="result-title">${item.highlightedTitle}</div>
                                <div class="result-subtitle">${item.highlightedSubtitle}</div>
                            </div>
                            <div class="result-action">
                                ${item.url ? '→' : item.action ? '⚡' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });
        
        this.searchResults.innerHTML = html;
        this.selectedIndex = -1;
        
        // Add click events
        this.searchResults.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', () => {
                this.executeResult(item.dataset.id);
            });
        });
        
        // Update stats
        document.getElementById('search-stats').textContent = 
            `${results.length} result${results.length !== 1 ? 's' : ''}`;
    }

    showDefaultSuggestions() {
        // Show recent searches and quick actions
        const recentSearches = this.searchHistory.slice(-5);
        
        let html = `
            <div class="search-suggestions">
                <div class="suggestions-section">
                    <div class="suggestions-title">Quick Actions</div>
                    <div class="suggestion-item" data-action="goto-dashboard">
                        <div class="suggestion-icon">📊</div>
                        <div class="suggestion-text">
                            <div class="suggestion-title">Dashboard</div>
                            <div class="suggestion-subtitle">View analytics dashboard</div>
                        </div>
                        <div class="suggestion-shortcut">Enter</div>
                    </div>
                    <div class="suggestion-item" data-action="create-order">
                        <div class="suggestion-icon">🛒</div>
                        <div class="suggestion-text">
                            <div class="suggestion-title">New Order</div>
                            <div class="suggestion-subtitle">Create new order</div>
                        </div>
                    </div>
                    <div class="suggestion-item" data-action="export-data">
                        <div class="suggestion-icon">📤</div>
                        <div class="suggestion-text">
                            <div class="suggestion-title">Export Data</div>
                            <div class="suggestion-subtitle">Download reports</div>
                        </div>
                    </div>
                </div>
                
                ${recentSearches.length > 0 ? `
                    <div class="suggestions-section">
                        <div class="suggestions-title">Recent Searches</div>
                        ${recentSearches.map(search => `
                            <div class="suggestion-item recent-search" data-search="${search}">
                                <div class="suggestion-icon">🕒</div>
                                <div class="suggestion-text">
                                    <div class="suggestion-title">${search}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        this.searchResults.innerHTML = html;
        
        // Add events for suggestions
        this.searchResults.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                if (item.dataset.action) {
                    this.executeAction(item.dataset.action);
                } else if (item.dataset.search) {
                    this.searchInput.value = item.dataset.search;
                    this.handleSearch(item.dataset.search);
                }
            });
        });
    }

    groupResultsByType(results) {
        return results.reduce((groups, result) => {
            const type = result.type;
            if (!groups[type]) groups[type] = [];
            groups[type].push(result);
            return groups;
        }, {});
    }

    handleSearchNavigation(e) {
        const items = this.searchResults.querySelectorAll('.result-item, .suggestion-item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(items);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    const item = items[this.selectedIndex];
                    if (item.dataset.id) {
                        this.executeResult(item.dataset.id);
                    } else if (item.dataset.action) {
                        this.executeAction(item.dataset.action);
                    } else if (item.dataset.search) {
                        this.searchInput.value = item.dataset.search;
                        this.handleSearch(item.dataset.search);
                    }
                }
                break;
                
            case 'Tab':
                if (items.length > 0) {
                    e.preventDefault();
                    this.selectedIndex = this.selectedIndex + 1 < items.length ? this.selectedIndex + 1 : 0;
                    this.updateSelection(items);
                }
                break;
        }
    }

    updateSelection(items) {
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
        
        // Scroll selected item into view
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
            items[this.selectedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }

    setActiveFilter(filter) {
        this.overlay.querySelectorAll('.search-filter').forEach(f => {
            f.classList.remove('active');
        });
        this.overlay.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        if (this.searchInput.value) {
            this.handleSearch(this.searchInput.value);
        }
    }

    executeResult(id) {
        const item = this.searchData.get(id);
        if (!item) return;
        
        if (item.url) {
            window.location.href = item.url;
        } else if (item.action) {
            this.executeAction(item.action);
        }
        
        this.closeSearch();
    }

    executeAction(actionId) {
        const action = this.actions[actionId];
        if (action) {
            action();
            this.closeSearch();
        }
    }

    addToSearchHistory(query) {
        if (query.length < 2) return;
        
        // Remove if already exists
        const index = this.searchHistory.indexOf(query);
        if (index > -1) {
            this.searchHistory.splice(index, 1);
        }
        
        // Add to beginning
        this.searchHistory.unshift(query);
        
        // Keep only last 20
        this.searchHistory = this.searchHistory.slice(0, 20);
        
        // Save to localStorage
        localStorage.setItem('kilangdm-search-history', JSON.stringify(this.searchHistory));
    }

    // Action implementations
    triggerExport() {
        if (window.notify) {
            window.notify.info('Export feature coming soon!');
        }
    }

    refreshDashboard() {
        window.location.reload();
    }

    openFilterPanel() {
        // Trigger filter panel if exists
        const filterBtn = document.querySelector('[data-action="apply-filter"], #applyFilterEnhanced');
        if (filterBtn) {
            filterBtn.click();
        } else {
            window.notify?.info('Navigate to dashboard to use filters');
        }
    }

    openSettingsPanel() {
        window.notify?.info('Settings panel coming soon!');
    }

    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl/Cmd + K', description: 'Open search' },
            { key: 'Ctrl/Cmd + Shift + P', description: 'Command palette' },
            { key: 'Ctrl/Cmd + Shift + N', description: 'Dismiss notifications' },
            { key: 'Escape', description: 'Close overlays' },
            { key: '↑/↓ Arrows', description: 'Navigate results' },
            { key: 'Enter', description: 'Select item' },
            { key: 'Tab', description: 'Next result' }
        ];
        
        const shortcutHTML = shortcuts.map(s => 
            `<div class="shortcut-item"><kbd>${s.key}</kbd><span>${s.description}</span></div>`
        ).join('');
        
        window.notify?.info(`
            <div class="shortcuts-help">
                <h4>Keyboard Shortcuts</h4>
                ${shortcutHTML}
            </div>
        `, { duration: 0 });
    }

    showHelpDialog() {
        window.notify?.info('Help documentation coming soon!');
    }

    showAboutDialog() {
        window.notify?.info('KilangDM Dashboard v3.0 - Professional Business Intelligence Platform');
    }
}

// CSS for search
const searchCSS = `
.search-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 10002;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
}

.search-modal {
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    width: 600px;
    max-width: 90vw;
    max-height: 80vh;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.search-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 16px;
}

.search-input-container {
    flex: 1;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px 16px;
    gap: 12px;
}

.search-icon {
    font-size: 18px;
    opacity: 0.7;
}

#global-search-input {
    flex: 1;
    background: none;
    border: none;
    color: #e2e8f0;
    font-size: 16px;
    outline: none;
}

#global-search-input::placeholder {
    color: #64748b;
}

.search-shortcuts {
    display: flex;
    gap: 8px;
}

.shortcut {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: #94a3b8;
}

.search-close {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 20px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.search-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
}

.search-filters {
    padding: 12px 20px;
    display: flex;
    gap: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.search-filter {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
}

.search-filter:hover {
    border-color: rgba(59, 130, 246, 0.4);
    color: #60a5fa;
}

.search-filter.active {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
    color: #60a5fa;
}

.search-content {
    flex: 1;
    overflow-y: auto;
    max-height: 400px;
}

.search-results {
    padding: 12px 0;
}

.results-section {
    margin-bottom: 16px;
}

.results-section-title {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 20px;
    margin-bottom: 4px;
}

.result-item, .suggestion-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-left: 3px solid transparent;
}

.result-item:hover, .suggestion-item:hover,
.result-item.selected, .suggestion-item.selected {
    background: rgba(59, 130, 246, 0.1);
    border-left-color: #3b82f6;
}

.result-icon, .suggestion-icon {
    font-size: 18px;
    margin-right: 12px;
    width: 24px;
    text-align: center;
}

.result-content, .suggestion-text {
    flex: 1;
}

.result-title, .suggestion-title {
    color: #e2e8f0;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
}

.result-subtitle, .suggestion-subtitle {
    color: #94a3b8;
    font-size: 13px;
}

.result-action, .suggestion-shortcut {
    color: #64748b;
    font-size: 12px;
    font-weight: 500;
}

.no-results {
    text-align: center;
    padding: 40px 20px;
    color: #64748b;
}

.no-results-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.no-results-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #94a3b8;
}

.search-footer {
    padding: 12px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.search-tips {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #64748b;
}

.search-tips kbd {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 10px;
}

.search-stats {
    font-size: 12px;
    color: #64748b;
}

mark {
    background: rgba(59, 130, 246, 0.3);
    color: #60a5fa;
    padding: 0;
}

/* Suggestions specific styles */
.search-suggestions {
    padding: 8px 0;
}

.suggestions-section {
    margin-bottom: 20px;
}

.suggestions-title {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 20px;
    margin-bottom: 4px;
}

/* Responsive */
@media (max-width: 640px) {
    .search-modal {
        width: 95vw;
        margin: 20px auto;
    }
    
    .search-tips {
        display: none;
    }
}
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = searchCSS;
document.head.appendChild(styleSheet);

// Initialize
const professionalSearch = new ProfessionalSearch();
window.ProfessionalSearch = professionalSearch;

console.log('🔍 Professional Search System initialized');
console.log('⌨️  Shortcuts: Ctrl+K (search), Ctrl+Shift+P (commands)');