// Advanced Export Manager
// Provides CSV, Excel, and PDF export functionality

class ExportManager {
    constructor() {
        this.initializeExportButtons();
        console.log('📁 Export Manager initialized');
    }

    initializeExportButtons() {
        // Listen for export button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.export-option') || e.target.closest('.export-option')) {
                const button = e.target.closest('.export-option');
                const format = button.dataset.format;
                const source = button.dataset.source;
                this.handleExport(format, source);
            }
        });
    }

    async handleExport(format, source) {
        console.log(`📤 Exporting ${source} as ${format}`);
        
        try {
            let data;
            let filename;
            
            switch(source) {
                case 'kpi':
                    data = await this.getKPIData();
                    filename = `KPI_Report_${this.getDateString()}`;
                    break;
                case 'analytics':
                    data = await this.getAnalyticsData();
                    filename = `Analytics_${this.getDateString()}`;
                    break;
                case 'orders':
                    data = await this.getOrdersData();
                    filename = `Orders_${this.getDateString()}`;
                    break;
                case 'report':
                    data = await this.getFullReportData();
                    filename = `Full_Report_${this.getDateString()}`;
                    break;
                default:
                    data = await this.getCurrentViewData();
                    filename = `Dashboard_Export_${this.getDateString()}`;
            }

            switch(format) {
                case 'csv':
                    this.exportAsCSV(data, filename);
                    break;
                case 'excel':
                    this.exportAsExcel(data, filename);
                    break;
                case 'json':
                    this.exportAsJSON(data, filename);
                    break;
                case 'pdf':
                    await this.exportAsPDF(data, filename);
                    break;
                default:
                    this.exportAsCSV(data, filename);
            }

            this.showExportSuccess(format, filename);
            
        } catch (error) {
            console.error('Export error:', error);
            this.showExportError(error.message);
        }
    }

    async getKPIData() {
        const data = [
            {
                metric: 'Total Sales',
                value: document.getElementById('total-sales')?.textContent || 'RM 0',
                trend: document.getElementById('sales-trend')?.textContent || '-',
                period: 'Current Period'
            },
            {
                metric: 'Average ROAS',
                value: document.getElementById('avg-roas')?.textContent || '0x',
                trend: document.getElementById('roas-trend')?.textContent || '-',
                period: 'Current Period'
            },
            {
                metric: 'Leads per Agent',
                value: document.getElementById('leads-per-agent')?.textContent || '0',
                trend: document.getElementById('leads-trend')?.textContent || '-',
                period: 'Current Period'
            },
            {
                metric: 'Total Orders',
                value: document.getElementById('total-orders')?.textContent || '0',
                trend: document.getElementById('orders-trend')?.textContent || '-',
                period: 'Current Period'
            }
        ];
        
        return data;
    }

    async getAnalyticsData() {
        // Get current filter settings
        const periodTitle = document.getElementById('periodTitle')?.textContent || 'Unknown Period';
        
        return {
            exportType: 'Analytics Data',
            period: periodTitle,
            exportedAt: new Date().toISOString(),
            kpis: await this.getKPIData(),
            powerMetrics: this.getPowerMetricsData(),
            filters: this.getCurrentFilters()
        };
    }

    async getOrdersData() {
        // This would integrate with your Firebase data
        return {
            exportType: 'Orders Data',
            exportedAt: new Date().toISOString(),
            period: document.getElementById('periodTitle')?.textContent || 'All Time',
            totalRevenue: document.getElementById('total-revenue')?.textContent || 'RM 0',
            totalOrders: document.getElementById('total-orders')?.textContent || '0',
            avgOrderValue: document.getElementById('avg-order-value')?.textContent || 'RM 0'
        };
    }

    async getFullReportData() {
        return {
            reportType: 'Complete Dashboard Report',
            generatedAt: new Date().toISOString(),
            period: document.getElementById('periodTitle')?.textContent || 'Current Period',
            kpis: await this.getKPIData(),
            powerMetrics: this.getPowerMetricsData(),
            summary: {
                totalSales: document.getElementById('total-sales')?.textContent || 'RM 0',
                totalOrders: document.getElementById('total-orders')?.textContent || '0',
                avgRoas: document.getElementById('avg-roas')?.textContent || '0x',
                leadsPerAgent: document.getElementById('leads-per-agent')?.textContent || '0'
            }
        };
    }

    getPowerMetricsData() {
        return {
            kpiHarian: document.getElementById('kpi-harian')?.textContent || 'RM 0',
            kpiMtd: document.getElementById('kpi-mtd')?.textContent || 'RM 0',
            saleMtd: document.getElementById('sale-mtd')?.textContent || 'RM 0',
            balanceBulanan: document.getElementById('balance-bulanan')?.textContent || 'RM 0',
            workingDays: document.getElementById('working-days-info')?.textContent || '0 / 0'
        };
    }

    getCurrentFilters() {
        return {
            period: document.getElementById('periodTitle')?.textContent || 'Current Period',
            agent: document.getElementById('agent-filter-enhanced')?.value || 'All Agents',
            appliedAt: new Date().toISOString()
        };
    }

    async getCurrentViewData() {
        return await this.getAnalyticsData();
    }

    exportAsCSV(data, filename) {
        let csvContent = '';
        
        if (Array.isArray(data)) {
            // Handle array data (like KPI data)
            const headers = Object.keys(data[0]);
            csvContent = headers.join(',') + '\n';
            
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes
                    return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
                        ? `"${value.replace(/"/g, '""')}"` 
                        : value;
                });
                csvContent += values.join(',') + '\n';
            });
        } else {
            // Handle object data
            csvContent = 'Property,Value\n';
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'object' && value !== null) {
                    csvContent += `${key},"${JSON.stringify(value)}"\n`;
                } else {
                    csvContent += `${key},${value}\n`;
                }
            }
        }

        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }

    exportAsJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }

    exportAsExcel(data, filename) {
        // For simplicity, we'll export as CSV with .xlsx extension
        // In a real implementation, you'd use a library like SheetJS
        this.exportAsCSV(data, filename);
        console.log('💡 Note: Excel export implemented as CSV. For true Excel format, consider adding SheetJS library.');
    }

    async exportAsPDF(data, filename) {
        // Simple PDF generation using browser's print functionality
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${filename}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .metadata { color: #666; font-size: 12px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>KilangDM Dashboard Report</h1>
                <div class="metadata">
                    Generated: ${new Date().toLocaleString('ms-MY')}<br>
                    Period: ${document.getElementById('periodTitle')?.textContent || 'Current Period'}
                </div>
                ${this.formatDataForPDF(data)}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    formatDataForPDF(data) {
        if (Array.isArray(data)) {
            const headers = Object.keys(data[0]);
            let html = '<table><thead><tr>';
            headers.forEach(header => {
                html += `<th>${header}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            data.forEach(row => {
                html += '<tr>';
                headers.forEach(header => {
                    html += `<td>${row[header]}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            return html;
        } else {
            let html = '<table><thead><tr><th>Property</th><th>Value</th></tr></thead><tbody>';
            for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'object' && value !== null) {
                    if (Array.isArray(value)) {
                        html += `<tr><td>${key}</td><td>${JSON.stringify(value)}</td></tr>`;
                    } else {
                        html += `<tr><td colspan="2"><strong>${key}</strong></td></tr>`;
                        for (const [subKey, subValue] of Object.entries(value)) {
                            html += `<tr><td>&nbsp;&nbsp;${subKey}</td><td>${subValue}</td></tr>`;
                        }
                    }
                } else {
                    html += `<tr><td>${key}</td><td>${value}</td></tr>`;
                }
            }
            html += '</tbody></table>';
            return html;
        }
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    showExportSuccess(format, filename) {
        const message = `✅ Successfully exported as ${format.toUpperCase()}!`;
        this.showNotification(message, 'success');
    }

    showExportError(message) {
        const errorMsg = `❌ Export failed: ${message}`;
        this.showNotification(errorMsg, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `export-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        });
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.exportManager = new ExportManager();
});

console.log('📁 Export Manager script loaded');