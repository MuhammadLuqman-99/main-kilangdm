/**
 * PROFESSIONAL DATA EXPORT SYSTEM
 * Advanced export capabilities like Airtable, Notion, Linear
 */

class ProfessionalExport {
    constructor() {
        this.exportFormats = this.setupExportFormats();
        this.exportQueue = [];
        this.isProcessing = false;
        this.setupExportModal();
    }

    setupExportFormats() {
        return {
            csv: {
                name: 'CSV',
                description: 'Comma-separated values (Excel compatible)',
                icon: '📊',
                mimeType: 'text/csv',
                extension: 'csv',
                supports: ['table', 'list', 'metrics']
            },
            xlsx: {
                name: 'Excel',
                description: 'Microsoft Excel workbook',
                icon: '📗',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                extension: 'xlsx',
                supports: ['table', 'list', 'metrics', 'charts']
            },
            pdf: {
                name: 'PDF',
                description: 'Professional report document',
                icon: '📄',
                mimeType: 'application/pdf',
                extension: 'pdf',
                supports: ['report', 'summary', 'charts']
            },
            json: {
                name: 'JSON',
                description: 'Developer-friendly data format',
                icon: '📁',
                mimeType: 'application/json',
                extension: 'json',
                supports: ['raw', 'api', 'backup']
            },
            png: {
                name: 'Image',
                description: 'High-resolution chart images',
                icon: '🖼️',
                mimeType: 'image/png',
                extension: 'png',
                supports: ['charts', 'dashboard']
            }
        };
    }

    setupExportModal() {
        const modal = document.createElement('div');
        modal.className = 'export-modal-overlay';
        modal.id = 'export-modal';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <div class="export-modal">
                <div class="export-modal-header">
                    <div class="export-modal-title">
                        <div class="export-icon">📤</div>
                        <div>
                            <h3>Export Data</h3>
                            <p>Choose format and customize your export</p>
                        </div>
                    </div>
                    <button class="export-modal-close" id="close-export-modal">✕</button>
                </div>
                
                <div class="export-modal-content">
                    <!-- Data Selection -->
                    <div class="export-section">
                        <div class="export-section-title">📊 Select Data</div>
                        <div class="export-data-options" id="export-data-options">
                            <label class="export-checkbox">
                                <input type="checkbox" value="kpi" checked>
                                <span class="export-option">
                                    <div class="export-option-icon">🎯</div>
                                    <div class="export-option-text">
                                        <div class="export-option-title">KPI Metrics</div>
                                        <div class="export-option-desc">Sales, ROAS, Leads data</div>
                                    </div>
                                </span>
                            </label>
                            <label class="export-checkbox">
                                <input type="checkbox" value="orders" checked>
                                <span class="export-option">
                                    <div class="export-option-icon">🛒</div>
                                    <div class="export-option-text">
                                        <div class="export-option-title">Orders</div>
                                        <div class="export-option-desc">Transaction details</div>
                                    </div>
                                </span>
                            </label>
                            <label class="export-checkbox">
                                <input type="checkbox" value="team" checked>
                                <span class="export-option">
                                    <div class="export-option-icon">👥</div>
                                    <div class="export-option-text">
                                        <div class="export-option-title">Team Performance</div>
                                        <div class="export-option-desc">Sales team metrics</div>
                                    </div>
                                </span>
                            </label>
                            <label class="export-checkbox">
                                <input type="checkbox" value="marketing">
                                <span class="export-option">
                                    <div class="export-option-icon">📈</div>
                                    <div class="export-option-text">
                                        <div class="export-option-title">Marketing Data</div>
                                        <div class="export-option-desc">Campaigns and spend</div>
                                    </div>
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Format Selection -->
                    <div class="export-section">
                        <div class="export-section-title">📋 Choose Format</div>
                        <div class="export-format-grid" id="export-formats">
                            ${Object.entries(this.exportFormats).map(([key, format]) => `
                                <div class="export-format-card" data-format="${key}">
                                    <div class="export-format-icon">${format.icon}</div>
                                    <div class="export-format-name">${format.name}</div>
                                    <div class="export-format-desc">${format.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Options -->
                    <div class="export-section">
                        <div class="export-section-title">⚙️ Options</div>
                        <div class="export-options-grid">
                            <div class="export-option-group">
                                <label class="export-label">Date Range</label>
                                <select id="export-date-range" class="export-select">
                                    <option value="current">Current Period</option>
                                    <option value="last7">Last 7 Days</option>
                                    <option value="last30">Last 30 Days</option>
                                    <option value="last90">Last 90 Days</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>
                            
                            <div class="export-option-group">
                                <label class="export-label">Include</label>
                                <div class="export-toggles">
                                    <label class="export-toggle">
                                        <input type="checkbox" id="include-charts" checked>
                                        <span>Charts & Graphs</span>
                                    </label>
                                    <label class="export-toggle">
                                        <input type="checkbox" id="include-summary" checked>
                                        <span>Summary Stats</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="export-custom-dates" id="export-custom-dates" style="display: none;">
                            <div class="export-date-inputs">
                                <div>
                                    <label>From</label>
                                    <input type="date" id="export-start-date" class="export-date-input">
                                </div>
                                <div>
                                    <label>To</label>
                                    <input type="date" id="export-end-date" class="export-date-input">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Preview -->
                    <div class="export-section">
                        <div class="export-section-title">👀 Preview</div>
                        <div class="export-preview" id="export-preview">
                            <div class="export-preview-item">
                                <span class="preview-label">File name:</span>
                                <span class="preview-value" id="preview-filename">kilangdm-export.csv</span>
                            </div>
                            <div class="export-preview-item">
                                <span class="preview-label">Estimated size:</span>
                                <span class="preview-value" id="preview-size">~50 KB</span>
                            </div>
                            <div class="export-preview-item">
                                <span class="preview-label">Records:</span>
                                <span class="preview-value" id="preview-records">~250 rows</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="export-modal-footer">
                    <button class="btn btn-secondary" id="cancel-export">Cancel</button>
                    <button class="btn btn-primary" id="start-export">
                        <span class="btn-text">Export Data</span>
                        <span class="btn-icon">📤</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
        this.setupModalEvents();
    }

    setupModalEvents() {
        // Close modal
        this.modal.querySelector('#close-export-modal').addEventListener('click', () => {
            this.hideExportModal();
        });
        
        this.modal.querySelector('#cancel-export').addEventListener('click', () => {
            this.hideExportModal();
        });
        
        // Format selection
        this.modal.querySelectorAll('.export-format-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectFormat(card.dataset.format);
            });
        });
        
        // Date range change
        this.modal.querySelector('#export-date-range').addEventListener('change', (e) => {
            this.handleDateRangeChange(e.target.value);
        });
        
        // Export button
        this.modal.querySelector('#start-export').addEventListener('click', () => {
            this.startExport();
        });
        
        // Data options change
        this.modal.querySelectorAll('#export-data-options input').forEach(input => {
            input.addEventListener('change', () => {
                this.updatePreview();
            });
        });
        
        // Options change
        this.modal.querySelectorAll('#include-charts, #include-summary').forEach(input => {
            input.addEventListener('change', () => {
                this.updatePreview();
            });
        });
    }

    showExportModal(defaultFormat = 'csv', preselectedData = []) {
        this.modal.style.display = 'flex';
        
        // Pre-select format
        this.selectFormat(defaultFormat);
        
        // Pre-select data types
        if (preselectedData.length > 0) {
            this.modal.querySelectorAll('#export-data-options input').forEach(input => {
                input.checked = preselectedData.includes(input.value);
            });
        }
        
        this.updatePreview();
        
        // Focus on first interactive element
        const firstInput = this.modal.querySelector('input, select, button');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    hideExportModal() {
        this.modal.style.display = 'none';
    }

    selectFormat(formatKey) {
        // Update UI
        this.modal.querySelectorAll('.export-format-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.format === formatKey);
        });
        
        this.selectedFormat = formatKey;
        this.updatePreview();
    }

    handleDateRangeChange(range) {
        const customDates = this.modal.querySelector('#export-custom-dates');
        customDates.style.display = range === 'custom' ? 'block' : 'none';
        
        // Set default dates for custom range
        if (range === 'custom') {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            
            this.modal.querySelector('#export-start-date').value = startDate.toISOString().split('T')[0];
            this.modal.querySelector('#export-end-date').value = endDate.toISOString().split('T')[0];
        }
        
        this.updatePreview();
    }

    updatePreview() {
        const selectedData = Array.from(this.modal.querySelectorAll('#export-data-options input:checked'))
            .map(input => input.value);
        const format = this.selectedFormat || 'csv';
        const dateRange = this.modal.querySelector('#export-date-range').value;
        
        // Update filename
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `kilangdm-${selectedData.join('-')}-${timestamp}.${this.exportFormats[format].extension}`;
        this.modal.querySelector('#preview-filename').textContent = filename;
        
        // Estimate size and records (mock calculation)
        const baseRecords = selectedData.length * 100;
        const multiplier = this.getDateRangeMultiplier(dateRange);
        const estimatedRecords = baseRecords * multiplier;
        const estimatedSize = this.estimateFileSize(estimatedRecords, format);
        
        this.modal.querySelector('#preview-records').textContent = `~${estimatedRecords.toLocaleString()} rows`;
        this.modal.querySelector('#preview-size').textContent = estimatedSize;
    }

    getDateRangeMultiplier(range) {
        const multipliers = {
            current: 1,
            last7: 0.25,
            last30: 1,
            last90: 3,
            custom: 1.5
        };
        return multipliers[range] || 1;
    }

    estimateFileSize(records, format) {
        const baseSizePerRecord = {
            csv: 50,
            xlsx: 80,
            pdf: 200,
            json: 120,
            png: 1000
        };
        
        const totalBytes = records * (baseSizePerRecord[format] || 50);
        
        if (totalBytes < 1024) return `${totalBytes} B`;
        if (totalBytes < 1024 * 1024) return `${Math.round(totalBytes / 1024)} KB`;
        return `${Math.round(totalBytes / (1024 * 1024))} MB`;
    }

    async startExport() {
        const exportConfig = this.gatherExportConfig();
        
        // Validate
        if (!exportConfig.dataTypes.length) {
            window.notify?.error('Please select at least one data type to export');
            return;
        }
        
        this.hideExportModal();
        
        // Show progress notification
        const progressNotification = window.notify?.progress(
            'Preparing your export', 0, 100, { persistent: true }
        );
        
        try {
            await this.performExport(exportConfig, progressNotification);
        } catch (error) {
            console.error('Export failed:', error);
            if (progressNotification) progressNotification.dismiss();
            window.notify?.error('Export failed. Please try again.');
        }
    }

    gatherExportConfig() {
        const selectedData = Array.from(this.modal.querySelectorAll('#export-data-options input:checked'))
            .map(input => input.value);
        
        const dateRange = this.modal.querySelector('#export-date-range').value;
        let dateFilter = { type: dateRange };
        
        if (dateRange === 'custom') {
            dateFilter.startDate = this.modal.querySelector('#export-start-date').value;
            dateFilter.endDate = this.modal.querySelector('#export-end-date').value;
        }
        
        return {
            dataTypes: selectedData,
            format: this.selectedFormat || 'csv',
            dateFilter,
            includeCharts: this.modal.querySelector('#include-charts').checked,
            includeSummary: this.modal.querySelector('#include-summary').checked
        };
    }

    async performExport(config, progressNotification) {
        // Step 1: Gather data
        if (progressNotification) {
            window.notify?.progress('Gathering data from database', 20, 100);
        }
        
        await this.delay(1000); // Simulate data gathering
        const data = await this.gatherExportData(config);
        
        // Step 2: Process data
        if (progressNotification) {
            window.notify?.progress('Processing and formatting data', 50, 100);
        }
        
        await this.delay(1500);
        const processedData = await this.processExportData(data, config);
        
        // Step 3: Generate file
        if (progressNotification) {
            window.notify?.progress('Generating export file', 80, 100);
        }
        
        await this.delay(1000);
        const file = await this.generateExportFile(processedData, config);
        
        // Step 4: Download
        if (progressNotification) {
            window.notify?.progress('Preparing download', 95, 100);
        }
        
        await this.delay(500);
        this.downloadFile(file);
        
        if (progressNotification) {
            progressNotification.dismiss();
        }
        
        window.notify?.success(`Export completed! Downloaded ${file.name}`, {
            duration: 5000
        });
        
        // Track analytics
        if (window.gtag) {
            gtag('event', 'export_complete', {
                event_category: 'engagement',
                export_format: config.format,
                data_types: config.dataTypes.join(',')
            });
        }
    }

    async gatherExportData(config) {
        // Mock data gathering - in real app, this would fetch from Firebase/API
        const mockData = {
            kpi: [
                { metric: 'Total Sales', value: 'RM 45,230', period: 'This Month' },
                { metric: 'Average ROAS', value: '3.2x', period: 'This Month' },
                { metric: 'Total Orders', value: '234', period: 'This Month' }
            ],
            orders: Array.from({ length: 50 }, (_, i) => ({
                id: `ORD-${1000 + i}`,
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                customer: `Customer ${i + 1}`,
                amount: Math.round(Math.random() * 1000 + 100),
                team: ['Qilah', 'Wiyah', 'Nisya'][Math.floor(Math.random() * 3)]
            })),
            team: [
                { name: 'Qilah', leads: 45, closed: 32, revenue: 15420 },
                { name: 'Wiyah', leads: 38, closed: 28, revenue: 12850 },
                { name: 'Nisya', leads: 41, closed: 30, revenue: 14200 }
            ],
            marketing: [
                { campaign: 'Facebook Ads', spend: 2500, clicks: 1250, conversions: 85 },
                { campaign: 'Google Ads', spend: 3200, clicks: 980, conversions: 72 },
                { campaign: 'TikTok Ads', spend: 1800, clicks: 1540, conversions: 94 }
            ]
        };
        
        // Filter by selected data types
        const filteredData = {};
        config.dataTypes.forEach(type => {
            if (mockData[type]) {
                filteredData[type] = mockData[type];
            }
        });
        
        return filteredData;
    }

    async processExportData(data, config) {
        // Apply date filtering, sorting, calculations etc.
        // This is where you'd implement actual data processing logic
        
        return {
            ...data,
            metadata: {
                exportDate: new Date().toISOString(),
                dateRange: config.dateFilter,
                format: config.format,
                totalRecords: Object.values(data).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 1), 0)
            }
        };
    }

    async generateExportFile(data, config) {
        const format = config.format;
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `kilangdm-export-${timestamp}.${this.exportFormats[format].extension}`;
        
        switch (format) {
            case 'csv':
                return this.generateCSV(data, filename);
            case 'xlsx':
                return this.generateExcel(data, filename);
            case 'pdf':
                return this.generatePDF(data, filename);
            case 'json':
                return this.generateJSON(data, filename);
            default:
                return this.generateCSV(data, filename);
        }
    }

    generateCSV(data, filename) {
        let csvContent = '';
        
        // Process each data type
        Object.entries(data).forEach(([type, records]) => {
            if (type === 'metadata') return;
            
            csvContent += `\n${type.toUpperCase()} DATA\n`;
            
            if (Array.isArray(records) && records.length > 0) {
                // Headers
                const headers = Object.keys(records[0]);
                csvContent += headers.join(',') + '\n';
                
                // Data rows
                records.forEach(record => {
                    const values = headers.map(header => {
                        const value = record[header];
                        // Escape commas and quotes
                        return typeof value === 'string' && value.includes(',') 
                            ? `"${value.replace(/"/g, '""')}"` 
                            : value;
                    });
                    csvContent += values.join(',') + '\n';
                });
            }
            csvContent += '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        return { name: filename, blob, size: blob.size };
    }

    generateJSON(data, filename) {
        const jsonData = {
            ...data,
            exportInfo: {
                version: '1.0',
                timestamp: new Date().toISOString(),
                source: 'KilangDM Dashboard'
            }
        };
        
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        return { name: filename, blob, size: blob.size };
    }

    generateExcel(data, filename) {
        // For a real implementation, you'd use a library like SheetJS
        // For now, just create a CSV and name it xlsx
        const csvFile = this.generateCSV(data, filename.replace('.xlsx', '.csv'));
        return { 
            name: filename, 
            blob: csvFile.blob, 
            size: csvFile.size,
            note: 'Excel format requires additional library - exported as CSV'
        };
    }

    generatePDF(data, filename) {
        // For a real implementation, you'd use jsPDF or similar
        // For now, create a text representation
        let textContent = 'KILANGDM DASHBOARD EXPORT REPORT\n';
        textContent += '=' .repeat(40) + '\n\n';
        textContent += `Generated: ${new Date().toLocaleString()}\n\n`;
        
        Object.entries(data).forEach(([type, records]) => {
            if (type === 'metadata') return;
            
            textContent += `${type.toUpperCase()} SUMMARY\n`;
            textContent += '-'.repeat(20) + '\n';
            
            if (Array.isArray(records)) {
                textContent += `Total Records: ${records.length}\n`;
                // Show first few records as sample
                records.slice(0, 5).forEach((record, index) => {
                    textContent += `${index + 1}. ${JSON.stringify(record)}\n`;
                });
                if (records.length > 5) {
                    textContent += `... and ${records.length - 5} more records\n`;
                }
            } else {
                textContent += `${JSON.stringify(records, null, 2)}\n`;
            }
            textContent += '\n';
        });
        
        const blob = new Blob([textContent], { type: 'text/plain' });
        return { 
            name: filename.replace('.pdf', '.txt'), 
            blob, 
            size: blob.size,
            note: 'PDF format requires additional library - exported as text'
        };
    }

    downloadFile(file) {
        const url = window.URL.createObjectURL(file.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        if (file.note) {
            window.notify?.info(file.note, { duration: 6000 });
        }
    }

    // Quick export methods
    quickExportCSV(dataType = 'all') {
        const preselected = dataType === 'all' ? ['kpi', 'orders', 'team'] : [dataType];
        this.showExportModal('csv', preselected);
    }

    quickExportJSON(dataType = 'all') {
        const preselected = dataType === 'all' ? ['kpi', 'orders', 'team'] : [dataType];
        this.showExportModal('json', preselected);
    }

    // Utility
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CSS for export modal
const exportCSS = `
.export-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 10003;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.export-modal {
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.export-modal-header {
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.export-modal-title {
    display: flex;
    align-items: center;
    gap: 16px;
}

.export-icon {
    font-size: 24px;
}

.export-modal-title h3 {
    margin: 0 0 4px 0;
    color: #e2e8f0;
    font-size: 20px;
    font-weight: 600;
}

.export-modal-title p {
    margin: 0;
    color: #94a3b8;
    font-size: 14px;
}

.export-modal-close {
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

.export-modal-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
}

.export-modal-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}

.export-section {
    margin-bottom: 32px;
}

.export-section-title {
    font-size: 16px;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.export-data-options {
    display: grid;
    gap: 12px;
}

.export-checkbox {
    display: flex;
    cursor: pointer;
}

.export-checkbox input {
    display: none;
}

.export-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.2s ease;
    width: 100%;
}

.export-checkbox:hover .export-option {
    border-color: rgba(59, 130, 246, 0.4);
}

.export-checkbox input:checked + .export-option {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.4);
}

.export-option-icon {
    font-size: 20px;
}

.export-option-text {
    flex: 1;
}

.export-option-title {
    font-weight: 500;
    color: #e2e8f0;
    margin-bottom: 2px;
}

.export-option-desc {
    font-size: 13px;
    color: #94a3b8;
}

.export-format-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
}

.export-format-card {
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.export-format-card:hover {
    border-color: rgba(59, 130, 246, 0.4);
    transform: translateY(-2px);
}

.export-format-card.selected {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.4);
}

.export-format-icon {
    font-size: 24px;
    margin-bottom: 8px;
}

.export-format-name {
    font-weight: 500;
    color: #e2e8f0;
    margin-bottom: 4px;
}

.export-format-desc {
    font-size: 12px;
    color: #94a3b8;
}

.export-options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.export-option-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.export-label {
    font-size: 14px;
    font-weight: 500;
    color: #cbd5e1;
}

.export-select, .export-date-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
}

.export-toggles {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.export-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #cbd5e1;
}

.export-toggle input {
    width: 16px;
    height: 16px;
}

.export-custom-dates {
    margin-top: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.export-date-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.export-preview {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 16px;
}

.export-preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.export-preview-item:last-child {
    border-bottom: none;
}

.preview-label {
    color: #94a3b8;
    font-size: 14px;
}

.preview-value {
    color: #e2e8f0;
    font-weight: 500;
    font-size: 14px;
}

.export-modal-footer {
    padding: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    font-size: 14px;
}

.btn-secondary {
    background: rgba(107, 114, 128, 0.8);
    color: white;
}

.btn-secondary:hover {
    background: rgba(107, 114, 128, 1);
}

.btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    color: white;
}

.btn-primary:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
    transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 640px) {
    .export-modal {
        margin: 10px;
        max-height: 95vh;
    }
    
    .export-format-grid {
        grid-template-columns: 1fr 1fr;
    }
    
    .export-options-grid {
        grid-template-columns: 1fr;
    }
    
    .export-date-inputs {
        grid-template-columns: 1fr;
    }
    
    .export-modal-footer {
        flex-direction: column;
    }
}
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = exportCSS;
document.head.appendChild(styleSheet);

// Initialize and expose globally
const professionalExport = new ProfessionalExport();
window.ProfessionalExport = professionalExport;

// Create global shortcuts
window.exportData = (format = 'csv', dataType = 'all') => {
    professionalExport.showExportModal(format, dataType === 'all' ? ['kpi', 'orders', 'team'] : [dataType]);
};

console.log('📤 Professional Export System initialized');
console.log('💡 Usage: exportData("csv"), exportData("json", "orders"), etc.');