/**
 * PROFESSIONAL FEATURES SHOWCASE
 * Demonstrate all new enterprise features to users
 */

class ProfessionalShowcase {
    constructor() {
        this.hasShownWelcome = localStorage.getItem('kilangdm-professional-welcomed') === 'true';
        this.setupShowcase();
    }

    setupShowcase() {
        // Show welcome tour for new visitors
        if (!this.hasShownWelcome) {
            setTimeout(() => {
                this.showWelcomeTour();
            }, 2000);
        }

        // Add feature discovery hints
        this.addFeatureHints();
        
        // Setup demo data if needed
        this.setupDemoMode();
    }

    showWelcomeTour() {
        const welcomeSteps = [
            {
                title: '🎉 Welcome to KilangDM Professional!',
                subtitle: 'Your dashboard has been upgraded with enterprise features',
                content: `
                    <div class="welcome-features">
                        <div class="feature-highlight">
                            <div class="feature-icon">🔍</div>
                            <div class="feature-text">
                                <strong>Advanced Search</strong>
                                <p>Press <kbd>Ctrl+K</kbd> to search anything instantly</p>
                            </div>
                        </div>
                        <div class="feature-highlight">
                            <div class="feature-icon">📤</div>
                            <div class="feature-text">
                                <strong>Professional Export</strong>
                                <p>Export data in multiple formats (CSV, Excel, PDF, JSON)</p>
                            </div>
                        </div>
                        <div class="feature-highlight">
                            <div class="feature-icon">🔔</div>
                            <div class="feature-text">
                                <strong>Smart Notifications</strong>
                                <p>Real-time alerts with advanced controls</p>
                            </div>
                        </div>
                        <div class="feature-highlight">
                            <div class="feature-icon">🎯</div>
                            <div class="feature-text">
                                <strong>Help Center</strong>
                                <p>Press <kbd>F1</kbd> for instant help and tutorials</p>
                            </div>
                        </div>
                    </div>
                `,
                action: 'Continue Tour'
            },
            {
                title: '🔍 Try the Global Search',
                subtitle: 'Search everything in your dashboard',
                content: `
                    <p>Press <kbd>Ctrl+K</kbd> or <kbd>Cmd+K</kbd> to open the search anytime.</p>
                    <p>You can search for:</p>
                    <ul>
                        <li>📊 <strong>Pages:</strong> "dashboard", "orders", "marketing"</li>
                        <li>📈 <strong>Data:</strong> "kpi", "sales", "ROAS"</li>
                        <li>⚡ <strong>Actions:</strong> "export", "refresh", "filter"</li>
                        <li>❓ <strong>Help:</strong> "shortcuts", "help"</li>
                    </ul>
                `,
                action: 'Try Search',
                demo: () => {
                    if (window.ProfessionalSearch) {
                        window.ProfessionalSearch.openSearch();
                    }
                }
            },
            {
                title: '📤 Professional Data Export',
                subtitle: 'Get your data in any format you need',
                content: `
                    <p>Export your dashboard data with enterprise-grade features:</p>
                    <ul>
                        <li>📊 <strong>CSV:</strong> Excel-compatible spreadsheets</li>
                        <li>📗 <strong>Excel:</strong> Native .xlsx workbooks</li>
                        <li>📄 <strong>PDF:</strong> Professional reports</li>
                        <li>📁 <strong>JSON:</strong> Developer-friendly format</li>
                        <li>🖼️ <strong>Images:</strong> High-res chart exports</li>
                    </ul>
                    <p>Use search → "export" or look for export buttons throughout the dashboard.</p>
                `,
                action: 'Try Export',
                demo: () => {
                    if (window.ProfessionalExport) {
                        window.ProfessionalExport.showExportModal();
                    }
                }
            },
            {
                title: '⌨️ Keyboard Shortcuts',
                subtitle: 'Work faster with power user shortcuts',
                content: `
                    <div class="shortcuts-showcase">
                        <div class="shortcut-row">
                            <kbd>Ctrl/Cmd + K</kbd>
                            <span>Open search</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Ctrl/Cmd + Shift + P</kbd>
                            <span>Command palette</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>F1</kbd>
                            <span>Help center</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Ctrl/Cmd + Shift + N</kbd>
                            <span>Dismiss all notifications</span>
                        </div>
                        <div class="shortcut-row">
                            <kbd>Esc</kbd>
                            <span>Close overlays</span>
                        </div>
                    </div>
                `,
                action: 'Got it!'
            }
        ];

        this.showProgressiveTour(welcomeSteps);
    }

    showProgressiveTour(steps) {
        let currentStep = 0;

        const showStep = () => {
            if (currentStep >= steps.length) {
                this.completeTour();
                return;
            }

            const step = steps[currentStep];
            
            const notification = window.notify?.action(
                `
                    <div class="tour-step">
                        <div class="tour-header">
                            <h3>${step.title}</h3>
                            <p>${step.subtitle}</p>
                        </div>
                        <div class="tour-content">
                            ${step.content}
                        </div>
                        <div class="tour-progress">
                            Step ${currentStep + 1} of ${steps.length}
                        </div>
                    </div>
                `,
                [
                    { 
                        id: 'skip', 
                        label: 'Skip Tour', 
                        callback: () => this.completeTour() 
                    },
                    { 
                        id: 'next', 
                        label: step.action, 
                        callback: () => {
                            if (step.demo) {
                                step.demo();
                                setTimeout(() => {
                                    currentStep++;
                                    showStep();
                                }, 1000);
                            } else {
                                currentStep++;
                                showStep();
                            }
                        }
                    }
                ],
                'info',
                { duration: 0 }
            );
        };

        showStep();
    }

    completeTour() {
        localStorage.setItem('kilangdm-professional-welcomed', 'true');
        
        window.notify?.achievement('🎉 Welcome tour completed! You\'re ready to use all professional features.', {
            duration: 5000
        });

        // Show quick reminder about help
        setTimeout(() => {
            window.notify?.info('💡 Remember: Press F1 anytime for help, Ctrl+K to search!', {
                duration: 4000
            });
        }, 2000);
    }

    addFeatureHints() {
        // Add hint tooltips to key elements
        setTimeout(() => {
            this.addSearchHint();
            this.addExportHints();
            this.addHelpHint();
        }, 5000);
    }

    addSearchHint() {
        // Add search hint if search input exists
        const searchInput = document.querySelector('#dashboard-search, .search-input');
        if (searchInput && !searchInput.dataset.hintAdded) {
            searchInput.dataset.hintAdded = 'true';
            
            // Show hint after first focus
            searchInput.addEventListener('focus', () => {
                if (!searchInput.dataset.hintShown) {
                    searchInput.dataset.hintShown = 'true';
                    window.notify?.info('💡 Try pressing Ctrl+K for our advanced global search!', {
                        duration: 3000
                    });
                }
            }, { once: true });
        }
    }

    addExportHints() {
        // Add hints to export buttons
        const exportButtons = document.querySelectorAll('[class*="export"], [data-action*="export"]');
        exportButtons.forEach(btn => {
            if (!btn.dataset.hintAdded) {
                btn.dataset.hintAdded = 'true';
                
                btn.addEventListener('click', () => {
                    if (!btn.dataset.hintShown) {
                        btn.dataset.hintShown = 'true';
                        setTimeout(() => {
                            window.notify?.info('✨ You can now export in multiple formats: CSV, Excel, PDF, JSON!', {
                                duration: 4000
                            });
                        }, 500);
                    }
                }, { once: true });
            }
        });
    }

    addHelpHint() {
        // Show help hint on first visit to help
        if (window.ProfessionalHelpCenter) {
            const originalShow = window.ProfessionalHelpCenter.showHelp;
            window.ProfessionalHelpCenter.showHelp = function() {
                originalShow.call(this);
                
                if (!localStorage.getItem('kilangdm-help-hint-shown')) {
                    localStorage.setItem('kilangdm-help-hint-shown', 'true');
                    setTimeout(() => {
                        window.notify?.info('🎯 Browse categories, search articles, or try quick actions!', {
                            duration: 4000
                        });
                    }, 1000);
                }
            };
        }
    }

    setupDemoMode() {
        // Add demo data showcases for empty dashboards
        if (window.location.search.includes('demo=true')) {
            this.enableDemoMode();
        }
    }

    enableDemoMode() {
        console.log('🎭 Demo mode enabled - showing sample features');
        
        // Show demo notifications
        setTimeout(() => {
            window.notify?.success('Demo data loaded successfully!');
        }, 1000);

        setTimeout(() => {
            window.notify?.info('This is a demo notification. Try Ctrl+Shift+N to dismiss all.');
        }, 3000);

        setTimeout(() => {
            window.notify?.warning('Demo: Monthly target 80% achieved!');
        }, 5000);

        // Demo progress notification
        setTimeout(() => {
            const progress = window.notify?.progress('Demo: Loading analytics data', 0, 100);
            
            let current = 0;
            const interval = setInterval(() => {
                current += 20;
                window.notify?.progress('Demo: Loading analytics data', current, 100);
                
                if (current >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        if (progress) progress.dismiss();
                        window.notify?.achievement('🏆 Demo completed! All features showcased.');
                    }, 500);
                }
            }, 300);
        }, 7000);
    }

    // Utility method to show feature highlights
    showFeatureSpotlight(feature) {
        const spotlights = {
            search: {
                title: '🔍 Advanced Search',
                description: 'Press Ctrl+K to search everything in your dashboard instantly. Try searching for "orders", "kpi", or "export".',
                action: () => window.ProfessionalSearch?.openSearch()
            },
            export: {
                title: '📤 Professional Export',
                description: 'Export your data in multiple formats: CSV, Excel, PDF, JSON, and high-res images.',
                action: () => window.ProfessionalExport?.showExportModal()
            },
            help: {
                title: '🎯 Help Center',
                description: 'Press F1 or click the help button for tutorials, shortcuts, and support.',
                action: () => window.ProfessionalHelpCenter?.showHelp()
            },
            notifications: {
                title: '🔔 Smart Notifications',
                description: 'Advanced notification system with progress tracking, actions, and keyboard controls.',
                action: () => window.notify?.info('This is a sample notification! Use Ctrl+Shift+N to dismiss all.')
            }
        };

        const spotlight = spotlights[feature];
        if (spotlight) {
            window.notify?.action(
                `<strong>${spotlight.title}</strong><br>${spotlight.description}`,
                [
                    { id: 'try', label: 'Try It', callback: spotlight.action },
                    { id: 'dismiss', label: 'Maybe Later', callback: () => {} }
                ],
                'info',
                { duration: 0 }
            );
        }
    }
}

// CSS for tour and showcase
const showcaseCSS = `
.welcome-features {
    display: grid;
    gap: 16px;
    margin: 16px 0;
}

.feature-highlight {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    border-left: 3px solid #3b82f6;
}

.feature-icon {
    font-size: 20px;
    width: 32px;
    text-align: center;
}

.feature-text strong {
    display: block;
    color: #e2e8f0;
    margin-bottom: 4px;
}

.feature-text p {
    margin: 0;
    color: #94a3b8;
    font-size: 13px;
}

.shortcuts-showcase {
    display: grid;
    gap: 8px;
    margin: 16px 0;
}

.shortcut-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 6px;
}

.shortcut-row kbd {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 11px;
}

.shortcut-row span {
    color: #cbd5e1;
    font-size: 13px;
}

.tour-step {
    max-width: 400px;
}

.tour-header h3 {
    margin: 0 0 4px 0;
    color: #e2e8f0;
    font-size: 16px;
}

.tour-header p {
    margin: 0 0 12px 0;
    color: #94a3b8;
    font-size: 13px;
}

.tour-content {
    margin-bottom: 12px;
}

.tour-content ul {
    margin: 8px 0;
    padding-left: 16px;
}

.tour-content li {
    margin-bottom: 4px;
    color: #cbd5e1;
    font-size: 13px;
}

.tour-progress {
    text-align: center;
    color: #64748b;
    font-size: 11px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = showcaseCSS;
document.head.appendChild(styleSheet);

// Initialize showcase
const professionalShowcase = new ProfessionalShowcase();
window.ProfessionalShowcase = professionalShowcase;

// Expose feature spotlight method globally
window.showFeature = (feature) => {
    professionalShowcase.showFeatureSpotlight(feature);
};

console.log('✨ Professional Features Showcase initialized');
console.log('💡 Use showFeature("search"), showFeature("export"), etc. to highlight features');