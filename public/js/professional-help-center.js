/**
 * PROFESSIONAL HELP CENTER
 * Interactive help system like Intercom, Zendesk, Linear
 */

class ProfessionalHelpCenter {
    constructor() {
        this.helpData = this.setupHelpData();
        this.setupHelpWidget();
        this.setupKeyboardShortcuts();
        this.userProgress = this.loadUserProgress();
    }

    setupHelpData() {
        return {
            quickStart: {
                title: '🚀 Quick Start Guide',
                icon: '🚀',
                articles: [
                    {
                        id: 'dashboard-overview',
                        title: 'Dashboard Overview',
                        content: `
                            <h3>Welcome to KilangDM Dashboard! 👋</h3>
                            <p>Your analytics command center for business intelligence.</p>
                            
                            <h4>Key Features:</h4>
                            <ul>
                                <li><strong>📊 KPI Tracking:</strong> Monitor sales, ROAS, and team performance</li>
                                <li><strong>🛒 Order Management:</strong> Track orders and customer data</li>
                                <li><strong>📈 Marketing Analytics:</strong> Analyze campaign performance</li>
                                <li><strong>👥 Team Performance:</strong> Sales team metrics and leaderboards</li>
                            </ul>
                            
                            <div class="help-tip">
                                <strong>💡 Pro Tip:</strong> Use <kbd>Ctrl+K</kbd> to open the search anytime!
                            </div>
                        `
                    },
                    {
                        id: 'creating-orders',
                        title: 'Creating Your First Order',
                        content: `
                            <h3>Creating Orders 📝</h3>
                            <p>Learn how to input order data efficiently.</p>
                            
                            <h4>Step by step:</h4>
                            <ol>
                                <li>Navigate to <strong>Borang Order</strong> page</li>
                                <li>Fill in customer details (name, phone, etc.)</li>
                                <li>Select the sales team member</li>
                                <li>Add product information and total amount</li>
                                <li>Choose the platform (Website, Shopee, TikTok, etc.)</li>
                                <li>Click <strong>Hantar Order</strong> to save</li>
                            </ol>
                            
                            <div class="help-feature">
                                <h4>🤖 Auto-Fill Feature</h4>
                                <p>Upload PDF invoices or CSV files to automatically populate order forms!</p>
                            </div>
                        `
                    },
                    {
                        id: 'understanding-kpis',
                        title: 'Understanding Your KPIs',
                        content: `
                            <h3>Key Performance Indicators 📊</h3>
                            <p>Learn what each metric means for your business.</p>
                            
                            <h4>Core Metrics:</h4>
                            <div class="kpi-grid">
                                <div class="kpi-explanation">
                                    <strong>💰 Total Sales:</strong> Sum of all order values in the selected period
                                </div>
                                <div class="kpi-explanation">
                                    <strong>📈 Average ROAS:</strong> Return on Ad Spend - revenue generated per RM spent
                                </div>
                                <div class="kpi-explanation">
                                    <strong>👥 Leads per Agent:</strong> Average number of leads handled by each team member
                                </div>
                                <div class="kpi-explanation">
                                    <strong>🛒 Total Orders:</strong> Number of completed transactions
                                </div>
                            </div>
                            
                            <div class="help-warning">
                                <strong>⚠️ Note:</strong> KPIs update in real-time based on your filter selections.
                            </div>
                        `
                    }
                ]
            },
            features: {
                title: '✨ Features & Tools',
                icon: '✨',
                articles: [
                    {
                        id: 'advanced-search',
                        title: 'Advanced Search & Navigation',
                        content: `
                            <h3>🔍 Advanced Search</h3>
                            <p>Find anything in your dashboard instantly.</p>
                            
                            <h4>Search Features:</h4>
                            <ul>
                                <li><strong>Fuzzy Search:</strong> Find results even with typos</li>
                                <li><strong>Quick Actions:</strong> Jump to any page or function</li>
                                <li><strong>Data Search:</strong> Search through KPIs and metrics</li>
                                <li><strong>Smart Suggestions:</strong> Recent searches and popular actions</li>
                            </ul>
                            
                            <h4>Keyboard Shortcuts:</h4>
                            <div class="shortcuts-grid">
                                <div class="shortcut-item">
                                    <kbd>Ctrl/Cmd + K</kbd>
                                    <span>Open search</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Ctrl/Cmd + Shift + P</kbd>
                                    <span>Command palette</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Esc</kbd>
                                    <span>Close overlays</span>
                                </div>
                            </div>
                        `
                    },
                    {
                        id: 'data-export',
                        title: 'Exporting Your Data',
                        content: `
                            <h3>📤 Data Export</h3>
                            <p>Get your data in the format you need.</p>
                            
                            <h4>Supported Formats:</h4>
                            <ul>
                                <li><strong>📊 CSV:</strong> Excel-compatible spreadsheet format</li>
                                <li><strong>📗 Excel:</strong> Native Microsoft Excel workbook</li>
                                <li><strong>📄 PDF:</strong> Professional report documents</li>
                                <li><strong>📁 JSON:</strong> Developer-friendly data format</li>
                                <li><strong>🖼️ Images:</strong> High-resolution chart exports</li>
                            </ul>
                            
                            <h4>How to Export:</h4>
                            <ol>
                                <li>Use the search (<kbd>Ctrl+K</kbd>) and type "export"</li>
                                <li>Or click any Export button in the dashboard</li>
                                <li>Select your data types and date range</li>
                                <li>Choose format and download options</li>
                                <li>Click Export and wait for download</li>
                            </ol>
                        `
                    },
                    {
                        id: 'notifications',
                        title: 'Notification System',
                        content: `
                            <h3>🔔 Smart Notifications</h3>
                            <p>Stay informed with professional alerts.</p>
                            
                            <h4>Notification Types:</h4>
                            <ul>
                                <li><strong>✅ Success:</strong> Actions completed successfully</li>
                                <li><strong>❌ Error:</strong> Issues that need your attention</li>
                                <li><strong>⚠️ Warning:</strong> Important reminders</li>
                                <li><strong>ℹ️ Info:</strong> General information and tips</li>
                                <li><strong>🏆 Achievement:</strong> Milestones and goals reached</li>
                            </ul>
                            
                            <h4>Notification Controls:</h4>
                            <div class="shortcuts-grid">
                                <div class="shortcut-item">
                                    <kbd>Ctrl/Cmd + Shift + N</kbd>
                                    <span>Dismiss all notifications</span>
                                </div>
                                <div class="shortcut-item">
                                    <kbd>Esc</kbd>
                                    <span>Dismiss latest notification</span>
                                </div>
                            </div>
                        `
                    }
                ]
            },
            troubleshooting: {
                title: '🔧 Troubleshooting',
                icon: '🔧',
                articles: [
                    {
                        id: 'common-issues',
                        title: 'Common Issues & Solutions',
                        content: `
                            <h3>🔧 Common Issues</h3>
                            <p>Quick fixes for the most common problems.</p>
                            
                            <div class="issue-item">
                                <h4>🔄 Data not updating</h4>
                                <p><strong>Solution:</strong> Refresh the page or check your internet connection. Data syncs automatically from Firebase.</p>
                            </div>
                            
                            <div class="issue-item">
                                <h4>📱 Mobile display issues</h4>
                                <p><strong>Solution:</strong> Clear your browser cache and ensure you're using a modern browser (Chrome, Safari, Edge).</p>
                            </div>
                            
                            <div class="issue-item">
                                <h4>📊 Charts not loading</h4>
                                <p><strong>Solution:</strong> Check if you have an ad blocker enabled. Some ad blockers can interfere with chart libraries.</p>
                            </div>
                            
                            <div class="issue-item">
                                <h4>🔍 Search not working</h4>
                                <p><strong>Solution:</strong> Try using <kbd>Ctrl+K</kbd> to open search, or refresh the page if the feature seems stuck.</p>
                            </div>
                            
                            <div class="help-contact">
                                <h4>📞 Still need help?</h4>
                                <p>Contact support through the help widget or check our knowledge base.</p>
                            </div>
                        `
                    },
                    {
                        id: 'browser-compatibility',
                        title: 'Browser Compatibility',
                        content: `
                            <h3>🌐 Browser Support</h3>
                            <p>KilangDM works best on modern browsers.</p>
                            
                            <h4>✅ Fully Supported:</h4>
                            <ul>
                                <li><strong>Chrome:</strong> Version 90+ (Recommended)</li>
                                <li><strong>Safari:</strong> Version 14+</li>
                                <li><strong>Edge:</strong> Version 90+</li>
                                <li><strong>Firefox:</strong> Version 88+</li>
                            </ul>
                            
                            <h4>⚠️ Limited Support:</h4>
                            <ul>
                                <li>Internet Explorer (not recommended)</li>
                                <li>Very old browser versions</li>
                            </ul>
                            
                            <div class="help-tip">
                                <strong>💡 Tip:</strong> For the best experience, keep your browser updated to the latest version.
                            </div>
                        `
                    }
                ]
            },
            faq: {
                title: '❓ Frequently Asked Questions',
                icon: '❓',
                articles: [
                    {
                        id: 'general-faq',
                        title: 'General Questions',
                        content: `
                            <h3>❓ Frequently Asked Questions</h3>
                            
                            <div class="faq-item">
                                <h4>Q: How often does data sync?</h4>
                                <p><strong>A:</strong> Data syncs in real-time from Firebase. Changes appear instantly across all users.</p>
                            </div>
                            
                            <div class="faq-item">
                                <h4>Q: Can I access this on mobile?</h4>
                                <p><strong>A:</strong> Yes! The dashboard is fully responsive and works great on phones and tablets.</p>
                            </div>
                            
                            <div class="faq-item">
                                <h4>Q: How do I add new team members?</h4>
                                <p><strong>A:</strong> Team members are configured in the system settings. Contact your admin to add new users.</p>
                            </div>
                            
                            <div class="faq-item">
                                <h4>Q: Can I customize the dashboard?</h4>
                                <p><strong>A:</strong> The dashboard supports theme customization and filter preferences that are saved locally.</p>
                            </div>
                            
                            <div class="faq-item">
                                <h4>Q: Is my data secure?</h4>
                                <p><strong>A:</strong> Yes! We use Firebase's secure infrastructure with encryption and proper access controls.</p>
                            </div>
                        `
                    }
                ]
            }
        };
    }

    setupHelpWidget() {
        // Create floating help button
        const helpButton = document.createElement('div');
        helpButton.className = 'help-widget-button';
        helpButton.innerHTML = `
            <div class="help-button-icon">❓</div>
            <div class="help-button-text">Help</div>
        `;
        
        // Create help modal
        const helpModal = document.createElement('div');
        helpModal.className = 'help-modal-overlay';
        helpModal.id = 'help-modal';
        helpModal.style.display = 'none';
        
        helpModal.innerHTML = this.createHelpModalHTML();
        
        document.body.appendChild(helpButton);
        document.body.appendChild(helpModal);
        
        this.helpButton = helpButton;
        this.helpModal = helpModal;
        
        this.setupHelpEvents();
    }

    createHelpModalHTML() {
        return `
            <div class="help-modal">
                <div class="help-modal-header">
                    <div class="help-modal-title">
                        <div class="help-title-icon">🎯</div>
                        <div>
                            <h3>KilangDM Help Center</h3>
                            <p>Get help, learn features, find answers</p>
                        </div>
                    </div>
                    <button class="help-modal-close" id="close-help-modal">✕</button>
                </div>
                
                <div class="help-modal-content">
                    <div class="help-sidebar">
                        <div class="help-search-container">
                            <input type="text" 
                                   id="help-search" 
                                   placeholder="Search help articles..." 
                                   class="help-search-input">
                            <div class="help-search-icon">🔍</div>
                        </div>
                        
                        <div class="help-categories">
                            ${Object.entries(this.helpData).map(([key, category]) => `
                                <div class="help-category ${key === 'quickStart' ? 'active' : ''}" 
                                     data-category="${key}">
                                    <div class="help-category-icon">${category.icon}</div>
                                    <span class="help-category-title">${category.title}</span>
                                    <div class="help-category-count">${category.articles.length}</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="help-quick-actions">
                            <div class="help-section-title">Quick Actions</div>
                            <button class="help-quick-action" data-action="shortcuts">
                                ⌨️ Keyboard Shortcuts
                            </button>
                            <button class="help-quick-action" data-action="tour">
                                🎯 Take a Tour
                            </button>
                            <button class="help-quick-action" data-action="feedback">
                                💬 Send Feedback
                            </button>
                        </div>
                    </div>
                    
                    <div class="help-content">
                        <div class="help-articles" id="help-articles">
                            ${this.renderCategoryArticles('quickStart')}
                        </div>
                    </div>
                </div>
                
                <div class="help-modal-footer">
                    <div class="help-footer-info">
                        <span>Need more help? Contact support</span>
                    </div>
                    <div class="help-footer-actions">
                        <button class="help-contact-btn">📧 Contact Support</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCategoryArticles(categoryKey) {
        const category = this.helpData[categoryKey];
        if (!category) return '';
        
        return `
            <div class="help-category-header">
                <h2>${category.title}</h2>
                <p>${category.articles.length} articles</p>
            </div>
            
            <div class="help-articles-grid">
                ${category.articles.map(article => `
                    <div class="help-article-card" data-article="${article.id}">
                        <div class="help-article-title">${article.title}</div>
                        <div class="help-article-excerpt">
                            Click to read the full guide...
                        </div>
                        <div class="help-article-meta">
                            <span class="help-article-time">📖 2 min read</span>
                            ${this.isArticleCompleted(article.id) ? 
                                '<span class="help-article-completed">✅ Completed</span>' : 
                                '<span class="help-article-new">✨ New</span>'
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupHelpEvents() {
        // Help button click
        this.helpButton.addEventListener('click', () => {
            this.showHelp();
        });
        
        // Close modal
        this.helpModal.querySelector('#close-help-modal').addEventListener('click', () => {
            this.hideHelp();
        });
        
        // Category selection
        this.helpModal.querySelectorAll('.help-category').forEach(category => {
            category.addEventListener('click', () => {
                this.showCategory(category.dataset.category);
            });
        });
        
        // Article selection
        this.helpModal.addEventListener('click', (e) => {
            const articleCard = e.target.closest('.help-article-card');
            if (articleCard) {
                this.showArticle(articleCard.dataset.article);
            }
        });
        
        // Quick actions
        this.helpModal.querySelectorAll('.help-quick-action').forEach(action => {
            action.addEventListener('click', () => {
                this.executeQuickAction(action.dataset.action);
            });
        });
        
        // Search
        this.helpModal.querySelector('#help-search').addEventListener('input', (e) => {
            this.searchHelp(e.target.value);
        });
        
        // Contact support
        this.helpModal.querySelector('.help-contact-btn').addEventListener('click', () => {
            this.contactSupport();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // F1 or Ctrl/Cmd + ? for help
            if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.key === '?')) {
                e.preventDefault();
                this.showHelp();
            }
        });
    }

    showHelp() {
        this.helpModal.style.display = 'flex';
        
        // Track analytics
        if (window.gtag) {
            gtag('event', 'help_center_open', { event_category: 'engagement' });
        }
        
        // Focus search input
        setTimeout(() => {
            const searchInput = this.helpModal.querySelector('#help-search');
            if (searchInput) searchInput.focus();
        }, 100);
    }

    hideHelp() {
        this.helpModal.style.display = 'none';
    }

    showCategory(categoryKey) {
        // Update active category
        this.helpModal.querySelectorAll('.help-category').forEach(cat => {
            cat.classList.toggle('active', cat.dataset.category === categoryKey);
        });
        
        // Update content
        const articlesContainer = this.helpModal.querySelector('#help-articles');
        articlesContainer.innerHTML = this.renderCategoryArticles(categoryKey);
        
        // Re-attach article click events
        articlesContainer.querySelectorAll('.help-article-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showArticle(card.dataset.article);
            });
        });
    }

    showArticle(articleId) {
        // Find article across all categories
        let article = null;
        let categoryKey = null;
        
        for (const [key, category] of Object.entries(this.helpData)) {
            article = category.articles.find(a => a.id === articleId);
            if (article) {
                categoryKey = key;
                break;
            }
        }
        
        if (!article) return;
        
        // Show article content
        const articlesContainer = this.helpModal.querySelector('#help-articles');
        articlesContainer.innerHTML = `
            <div class="help-article-view">
                <div class="help-article-header">
                    <button class="help-back-btn" onclick="window.ProfessionalHelpCenter.showCategory('${categoryKey}')">
                        ← Back to ${this.helpData[categoryKey].title}
                    </button>
                    <div class="help-article-actions">
                        <button class="help-action-btn" onclick="window.ProfessionalHelpCenter.markCompleted('${articleId}')">
                            ${this.isArticleCompleted(articleId) ? '✅ Completed' : '📖 Mark as Read'}
                        </button>
                    </div>
                </div>
                
                <div class="help-article-content">
                    <h1>${article.title}</h1>
                    ${article.content}
                </div>
                
                <div class="help-article-footer">
                    <div class="help-rating">
                        <span>Was this helpful?</span>
                        <button class="help-rating-btn" data-rating="yes">👍 Yes</button>
                        <button class="help-rating-btn" data-rating="no">👎 No</button>
                    </div>
                </div>
            </div>
        `;
        
        // Track article view
        if (window.gtag) {
            gtag('event', 'help_article_view', {
                event_category: 'engagement',
                article_id: articleId
            });
        }
        
        // Add rating listeners
        articlesContainer.querySelectorAll('.help-rating-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.rateArticle(articleId, btn.dataset.rating);
            });
        });
    }

    searchHelp(query) {
        if (!query.trim()) {
            this.showCategory('quickStart');
            return;
        }
        
        const results = this.performHelpSearch(query);
        this.displaySearchResults(results, query);
    }

    performHelpSearch(query) {
        const results = [];
        const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
        
        for (const [categoryKey, category] of Object.entries(this.helpData)) {
            for (const article of category.articles) {
                const searchText = `${article.title} ${article.content}`.toLowerCase();
                let score = 0;
                
                searchTerms.forEach(term => {
                    if (searchText.includes(term)) {
                        score += article.title.toLowerCase().includes(term) ? 3 : 1;
                    }
                });
                
                if (score > 0) {
                    results.push({
                        ...article,
                        category: category.title,
                        categoryKey,
                        score
                    });
                }
            }
        }
        
        return results.sort((a, b) => b.score - a.score);
    }

    displaySearchResults(results, query) {
        const articlesContainer = this.helpModal.querySelector('#help-articles');
        
        if (results.length === 0) {
            articlesContainer.innerHTML = `
                <div class="help-no-results">
                    <div class="help-no-results-icon">🤔</div>
                    <h3>No results found</h3>
                    <p>Try different keywords or browse categories</p>
                    <button class="btn btn-primary" onclick="window.ProfessionalHelpCenter.contactSupport()">
                        Contact Support
                    </button>
                </div>
            `;
            return;
        }
        
        articlesContainer.innerHTML = `
            <div class="help-search-results">
                <h2>Search Results for "${query}"</h2>
                <p>${results.length} article${results.length !== 1 ? 's' : ''} found</p>
                
                <div class="help-search-results-list">
                    ${results.map(result => `
                        <div class="help-search-result" data-article="${result.id}">
                            <div class="help-search-result-title">${result.title}</div>
                            <div class="help-search-result-category">${result.category}</div>
                            <div class="help-search-result-excerpt">
                                Click to read the full article...
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add click events to search results
        articlesContainer.querySelectorAll('.help-search-result').forEach(result => {
            result.addEventListener('click', () => {
                this.showArticle(result.dataset.article);
            });
        });
    }

    executeQuickAction(action) {
        switch (action) {
            case 'shortcuts':
                this.showKeyboardShortcuts();
                break;
            case 'tour':
                this.startGuidedTour();
                break;
            case 'feedback':
                this.showFeedbackForm();
                break;
        }
    }

    showKeyboardShortcuts() {
        if (window.ProfessionalSearch) {
            window.ProfessionalSearch.showKeyboardShortcuts();
            this.hideHelp();
        }
    }

    startGuidedTour() {
        this.hideHelp();
        window.notify?.info('🎯 Guided tour feature coming soon! For now, check out the Quick Start guide.', {
            duration: 5000
        });
    }

    showFeedbackForm() {
        window.notify?.action('💬 Send us your feedback!', [
            { id: 'email', label: '📧 Email Support', callback: () => this.contactSupport() },
            { id: 'feature', label: '✨ Request Feature', callback: () => this.requestFeature() }
        ], 'info');
    }

    contactSupport() {
        window.notify?.info('📧 Contact: support@kilangdm.com or use the chat widget for instant help!', {
            duration: 8000
        });
    }

    requestFeature() {
        window.notify?.info('✨ We\'d love to hear your ideas! Email us at features@kilangdm.com', {
            duration: 6000
        });
    }

    markCompleted(articleId) {
        if (!this.userProgress.completedArticles.includes(articleId)) {
            this.userProgress.completedArticles.push(articleId);
            this.saveUserProgress();
            
            window.notify?.success('Article marked as completed! 🎉');
        }
        
        // Refresh the current view
        const backBtn = this.helpModal.querySelector('.help-back-btn');
        if (backBtn) {
            backBtn.click();
        }
    }

    rateArticle(articleId, rating) {
        window.notify?.success(rating === 'yes' ? 'Thanks for the feedback! 👍' : 'Thanks! We\'ll improve this article. 👎');
        
        if (window.gtag) {
            gtag('event', 'help_article_rating', {
                event_category: 'engagement',
                article_id: articleId,
                rating: rating
            });
        }
    }

    isArticleCompleted(articleId) {
        return this.userProgress.completedArticles.includes(articleId);
    }

    loadUserProgress() {
        return JSON.parse(localStorage.getItem('kilangdm-help-progress') || '{"completedArticles": []}');
    }

    saveUserProgress() {
        localStorage.setItem('kilangdm-help-progress', JSON.stringify(this.userProgress));
    }
}

// CSS for help center
const helpCSS = `
.help-widget-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 12px 20px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
    font-size: 14px;
}

.help-widget-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
}

.help-button-icon {
    font-size: 16px;
}

.help-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 10004;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.help-modal {
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.help-modal-header {
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.help-modal-title {
    display: flex;
    align-items: center;
    gap: 16px;
}

.help-title-icon {
    font-size: 24px;
}

.help-modal-title h3 {
    margin: 0 0 4px 0;
    color: #e2e8f0;
    font-size: 20px;
    font-weight: 600;
}

.help-modal-title p {
    margin: 0;
    color: #94a3b8;
    font-size: 14px;
}

.help-modal-close {
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

.help-modal-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
}

.help-modal-content {
    flex: 1;
    display: grid;
    grid-template-columns: 280px 1fr;
    overflow: hidden;
}

.help-sidebar {
    background: rgba(15, 23, 42, 0.5);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    padding: 24px;
    overflow-y: auto;
}

.help-search-container {
    position: relative;
    margin-bottom: 24px;
}

.help-search-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    padding: 10px 40px 10px 12px;
    border-radius: 8px;
    font-size: 14px;
}

.help-search-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
}

.help-categories {
    margin-bottom: 24px;
}

.help-category {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 8px;
}

.help-category:hover {
    background: rgba(255, 255, 255, 0.05);
}

.help-category.active {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
}

.help-category-icon {
    font-size: 18px;
}

.help-category-title {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #e2e8f0;
}

.help-category-count {
    background: rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
}

.help-quick-actions {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 20px;
}

.help-section-title {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
}

.help-quick-action {
    display: block;
    width: 100%;
    background: none;
    border: none;
    color: #cbd5e1;
    text-align: left;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
    margin-bottom: 4px;
}

.help-quick-action:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
}

.help-content {
    padding: 24px;
    overflow-y: auto;
}

.help-category-header {
    margin-bottom: 24px;
}

.help-category-header h2 {
    color: #e2e8f0;
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 8px 0;
}

.help-category-header p {
    color: #94a3b8;
    margin: 0;
    font-size: 14px;
}

.help-articles-grid {
    display: grid;
    gap: 16px;
}

.help-article-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.help-article-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-1px);
}

.help-article-title {
    color: #e2e8f0;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
}

.help-article-excerpt {
    color: #94a3b8;
    font-size: 14px;
    margin-bottom: 12px;
}

.help-article-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
}

.help-article-time {
    color: #64748b;
}

.help-article-completed {
    color: #22c55e;
    font-weight: 500;
}

.help-article-new {
    color: #f59e0b;
    font-weight: 500;
}

.help-modal-footer {
    padding: 20px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.help-footer-info {
    color: #94a3b8;
    font-size: 14px;
}

.help-contact-btn {
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #60a5fa;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.help-contact-btn:hover {
    background: rgba(59, 130, 246, 0.3);
}

/* Article view styles */
.help-article-view {
    max-width: none;
}

.help-article-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.help-back-btn {
    background: none;
    border: none;
    color: #60a5fa;
    cursor: pointer;
    font-size: 14px;
    padding: 8px 0;
    transition: color 0.2s ease;
}

.help-back-btn:hover {
    color: #3b82f6;
}

.help-action-btn {
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.4);
    color: #22c55e;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.help-action-btn:hover {
    background: rgba(34, 197, 94, 0.3);
}

.help-article-content {
    line-height: 1.6;
}

.help-article-content h1 {
    color: #e2e8f0;
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 20px;
}

.help-article-content h3 {
    color: #e2e8f0;
    font-size: 20px;
    font-weight: 600;
    margin: 24px 0 12px 0;
}

.help-article-content h4 {
    color: #cbd5e1;
    font-size: 16px;
    font-weight: 600;
    margin: 20px 0 8px 0;
}

.help-article-content p {
    color: #94a3b8;
    margin-bottom: 16px;
}

.help-article-content ul, 
.help-article-content ol {
    color: #94a3b8;
    margin: 16px 0;
    padding-left: 20px;
}

.help-article-content li {
    margin-bottom: 8px;
}

.help-article-content strong {
    color: #e2e8f0;
}

.help-article-content kbd {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 12px;
}

.help-tip, .help-feature, .help-warning {
    padding: 16px;
    border-radius: 8px;
    margin: 20px 0;
}

.help-tip {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #93c5fd;
}

.help-feature {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #86efac;
}

.help-warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fbbf24;
}

.shortcuts-grid, .kpi-grid {
    display: grid;
    gap: 12px;
    margin: 16px 0;
}

.shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 6px;
}

.kpi-explanation {
    padding: 12px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 6px;
    border-left: 3px solid #3b82f6;
}

.issue-item {
    margin-bottom: 24px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
}

.faq-item {
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
}

.help-no-results {
    text-align: center;
    padding: 60px 20px;
}

.help-no-results-icon {
    font-size: 48px;
    margin-bottom: 20px;
}

.help-no-results h3 {
    color: #e2e8f0;
    margin-bottom: 8px;
}

.help-search-results-list {
    display: grid;
    gap: 12px;
}

.help-search-result {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.help-search-result:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(59, 130, 246, 0.3);
}

.help-search-result-title {
    color: #e2e8f0;
    font-weight: 600;
    margin-bottom: 4px;
}

.help-search-result-category {
    color: #60a5fa;
    font-size: 12px;
    margin-bottom: 8px;
}

.help-article-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.help-rating {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #94a3b8;
    font-size: 14px;
}

.help-rating-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
}

.help-rating-btn:hover {
    border-color: rgba(59, 130, 246, 0.3);
    color: #60a5fa;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .help-modal {
        width: 95vw;
        max-height: 95vh;
    }
    
    .help-modal-content {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
    }
    
    .help-sidebar {
        border-right: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 16px;
        max-height: 200px;
    }
    
    .help-widget-button {
        bottom: 16px;
        right: 16px;
        padding: 10px 16px;
    }
    
    .help-button-text {
        display: none;
    }
}
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = helpCSS;
document.head.appendChild(styleSheet);

// Initialize and expose globally
const professionalHelpCenter = new ProfessionalHelpCenter();
window.ProfessionalHelpCenter = professionalHelpCenter;

console.log('🎯 Professional Help Center initialized');
console.log('💡 Press F1 or Ctrl+? to open help anytime!');