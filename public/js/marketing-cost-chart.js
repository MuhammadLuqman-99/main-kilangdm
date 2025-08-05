import { collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ROBUST VERSION: Fixed Marketing Cost Chart with Better DOM Handling
export async function createMarketingCostChart() {
    console.log('🚀 Starting Marketing Cost Chart creation (Robust Version)...');
    
    // 1. ROBUST ELEMENT CHECKING
    const ctx = document.getElementById('costPerLeadChart');
    if (!ctx) {
        console.warn('⚠️ Chart canvas element "costPerLeadChart" not found - skipping chart creation');
        return;
    }

    const chartContainer = ctx.parentElement;
    if (!chartContainer) {
        console.warn('⚠️ Chart container not found - skipping chart creation');
        return;
    }

    try {
        // 2. SAFE LOADING STATE
        showChartLoadingSafe(chartContainer);

        // 3. FETCH DATA WITH SIMPLE QUERIES
        console.log('📊 Fetching marketing lead semasa data...');
        const marketingQuery = query(
            collection(window.db, "marketingData"),
            where("type", "==", "lead_semasa"),
            limit(100)
        );
        
        console.log('📊 Fetching sales team lead data...');
        const salesQuery = query(
            collection(window.db, "salesTeamData"),
            where("type", "==", "lead"),
            limit(100)
        );

        const [marketingSnapshot, salesSnapshot] = await Promise.all([
            getDocs(marketingQuery),
            getDocs(salesQuery)
        ]);

        console.log(`📈 Marketing records found: ${marketingSnapshot.size}`);
        console.log(`👥 Sales team records found: ${salesSnapshot.size}`);

        // 4. PROCESS DATA SAFELY
        const marketingData = [];
        const salesData = [];

        marketingSnapshot.forEach((doc) => {
            const data = doc.data();
            marketingData.push({
                id: doc.id,
                date: data.tarikh,
                team: data.team_sale || 'Unknown',
                spend: parseFloat(data.spend) || 0,
                time: data.masa,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
                raw: data
            });
        });

        salesSnapshot.forEach((doc) => {
            const data = doc.data();
            salesData.push({
                id: doc.id,
                date: data.tarikh,
                team: data.team || 'Unknown',
                totalLead: parseInt(data.total_lead) || 0,
                cold: parseInt(data.cold) || 0,
                warm: parseInt(data.warm) || 0,
                hot: parseInt(data.hot) || 0,
                time: data.masa,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
                raw: data
            });
        });

        // Sort manually
        marketingData.sort((a, b) => b.createdAt - a.createdAt);
        salesData.sort((a, b) => b.createdAt - a.createdAt);

        console.log('🔍 Processed marketing data:', marketingData.length);
        console.log('🔍 Processed sales data:', salesData.length);

        // 5. MATCH DATA INTELLIGENTLY
        const combinedData = [];

        // Strategy 1: Exact matches
        marketingData.forEach(marketing => {
            if (marketing.spend <= 0) return;
            
            const exactMatch = salesData.find(sales => 
                sales.date === marketing.date && 
                sales.totalLead > 0 &&
                (sales.team === marketing.team || 
                 sales.team?.toLowerCase() === marketing.team?.toLowerCase())
            );

            if (exactMatch) {
                combinedData.push({
                    date: marketing.date,
                    team: marketing.team,
                    totalSpend: marketing.spend,
                    totalLeads: exactMatch.totalLead,
                    costPerLead: marketing.spend / exactMatch.totalLead,
                    matchType: 'exact',
                    createdAt: marketing.createdAt
                });
            }
        });

        // Strategy 2: Date-based aggregation if needed
        if (combinedData.length < 3) {
            console.log('📊 Using date aggregation fallback...');
            
            const marketingByDate = {};
            const salesByDate = {};

            marketingData.forEach(item => {
                if (item.spend > 0) {
                    if (!marketingByDate[item.date]) {
                        marketingByDate[item.date] = { totalSpend: 0, createdAt: item.createdAt };
                    }
                    marketingByDate[item.date].totalSpend += item.spend;
                }
            });

            salesData.forEach(item => {
                if (item.totalLead > 0) {
                    if (!salesByDate[item.date]) {
                        salesByDate[item.date] = { totalLeads: 0, createdAt: item.createdAt };
                    }
                    salesByDate[item.date].totalLeads += item.totalLead;
                }
            });

            Object.keys(marketingByDate).forEach(date => {
                if (salesByDate[date] && !combinedData.find(item => item.date === date)) {
                    const marketing = marketingByDate[date];
                    const sales = salesByDate[date];
                    
                    combinedData.push({
                        date: date,
                        team: 'Combined Teams',
                        totalSpend: marketing.totalSpend,
                        totalLeads: sales.totalLeads,
                        costPerLead: marketing.totalSpend / sales.totalLeads,
                        matchType: 'aggregated',
                        createdAt: marketing.createdAt
                    });
                }
            });
        }

        console.log(`💡 Combined data entries: ${combinedData.length}`);

        // 6. HANDLE EMPTY DATA SAFELY
        if (combinedData.length === 0) {
            console.warn('⚠️ No matching data found for cost per lead analysis');
            renderEmptyChartSafe(chartContainer);
            updateCostAnalysisSummarySafe([]);
            return;
        }

        // 7. PREPARE CHART DATA
        const chartData = combinedData
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 15);

        const labels = chartData.map(item => {
            const date = new Date(item.date);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
            const teamLabel = item.team.length > 12 ? 
                item.team.substring(0, 9) + '...' : 
                item.team;
            return `${formattedDate} ${teamLabel}`;
        });

        const costPerLeadData = chartData.map(item => parseFloat(item.costPerLead.toFixed(2)));
        const totalLeadsData = chartData.map(item => item.totalLeads);

        // 8. DESTROY EXISTING CHART SAFELY
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        // 9. RESTORE CANVAS SAFELY
        restoreCanvasSafe(chartContainer);
        const newCtx = document.getElementById('costPerLeadChart');
        if (!newCtx) {
            console.error('❌ Failed to restore canvas element');
            return;
        }

        // 10. CREATE CHART
        const costChart = new Chart(newCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cost per Lead (RM)',
                        data: costPerLeadData,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#3B82F6',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Total Leads',
                        data: totalLeadsData,
                        type: 'bar',
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: '#22C55E',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Marketing Cost Analysis (${chartData.length} entries)`,
                        font: { size: 16, weight: '600' },
                        color: '#F9FAFB',
                        padding: { top: 10, bottom: 20 }
                    },
                    legend: {
                        labels: { 
                            color: '#D1D5DB',
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#F9FAFB',
                        bodyColor: '#D1D5DB',
                        borderColor: '#374151',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            title: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                const item = chartData[index];
                                return `📊 ${item.date} - ${item.team}`;
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const item = chartData[index];
                                
                                if (context.dataset.label === 'Cost per Lead (RM)') {
                                    const efficiency = item.costPerLead < 10 ? '🟢 Excellent' :
                                                     item.costPerLead < 20 ? '🟡 Good' :
                                                     item.costPerLead < 50 ? '🟠 Fair' : '🔴 Needs Improvement';
                                    
                                    return [
                                        `💰 Cost per Lead: RM ${item.costPerLead.toFixed(2)}`,
                                        `📈 Total Spend: RM ${item.totalSpend.toFixed(2)}`,
                                        `👥 Total Leads: ${item.totalLeads}`,
                                        `🎯 Efficiency: ${efficiency}`,
                                        `🔗 Match: ${item.matchType}`
                                    ];
                                } else {
                                    return `👥 Total Leads: ${item.totalLeads}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#9CA3AF', 
                            maxRotation: 45, 
                            minRotation: 15,
                            font: { size: 10 }
                        },
                        grid: { color: 'rgba(75, 85, 99, 0.3)' }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: { 
                            display: true, 
                            text: 'Cost per Lead (RM)', 
                            color: '#3B82F6',
                            font: { size: 12, weight: '600' }
                        },
                        ticks: { 
                            color: '#3B82F6', 
                            callback: value => 'RM ' + value.toFixed(0),
                            font: { size: 11 }
                        },
                        grid: { color: 'rgba(59, 130, 246, 0.2)' }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: { 
                            display: true, 
                            text: 'Number of Leads', 
                            color: '#22C55E',
                            font: { size: 12, weight: '600' }
                        },
                        ticks: { 
                            color: '#22C55E',
                            font: { size: 11 }
                        },
                        grid: { drawOnChartArea: false }
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeInOutQuart'
                }
            }
        });

        // 11. UPDATE SUMMARY
        updateCostAnalysisSummarySafe(chartData);
        updateCostPerLeadKPISafe(chartData);

        console.log('✅ Marketing Cost Chart created successfully');
        console.log(`📊 Chart Summary:`, {
            entries: chartData.length,
            avgCostPerLead: (chartData.reduce((sum, item) => sum + item.costPerLead, 0) / chartData.length).toFixed(2),
            totalSpend: chartData.reduce((sum, item) => sum + item.totalSpend, 0).toFixed(2),
            totalLeads: chartData.reduce((sum, item) => sum + item.totalLeads, 0)
        });

    } catch (error) {
        console.error('❌ Error creating marketing cost chart:', error);
        renderErrorChartSafe(chartContainer, error.message);
    }
}

// SAFE HELPER FUNCTIONS
function showChartLoadingSafe(container) {
    if (!container) return;
    
    try {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #9CA3AF;">
                <div style="text-align: center;">
                    <div style="margin-bottom: 10px;">
                        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #374151; border-top: 3px solid #3B82F6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    </div>
                    <div>Loading marketing cost analysis...</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.warn('⚠️ Failed to show loading state:', error);
    }
}

function renderEmptyChartSafe(container) {
    if (!container) return;
    
    try {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #9CA3AF; flex-direction: column;">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                    <div style="font-size: 18px; margin-bottom: 8px; font-weight: 600;">No Cost Data Available</div>
                    <div style="font-size: 14px; opacity: 0.7; margin-bottom: 16px;">Submit marketing spend and lead data for matching dates</div>
                    <div style="font-size: 12px; text-align: left; background: rgba(55, 65, 81, 0.5); padding: 12px; border-radius: 8px;">
                        <div style="margin-bottom: 4px;">📢 <strong>Marketing:</strong> Submit 'Lead Semasa' data</div>
                        <div style="margin-bottom: 4px;">👥 <strong>Sales Team:</strong> Submit 'Lead' data</div>
                        <div>📅 <strong>Important:</strong> Use same dates and team names</div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.warn('⚠️ Failed to render empty chart:', error);
    }
}

function renderErrorChartSafe(container, errorMessage) {
    if (!container) return;
    
    try {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #EF4444; flex-direction: column;">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <div style="font-size: 18px; margin-bottom: 8px; font-weight: 600;">Chart Error</div>
                    <div style="font-size: 14px; opacity: 0.7; max-width: 400px; margin-bottom: 16px;">${errorMessage}</div>
                    <button onclick="window.refreshCostAnalysis && window.refreshCostAnalysis()" style="padding: 8px 16px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.warn('⚠️ Failed to render error chart:', error);
    }
}

function restoreCanvasSafe(container) {
    if (!container) return;
    
    try {
        container.innerHTML = '<canvas id="costPerLeadChart" style="width: 100%; height: 300px;"></canvas>';
    } catch (error) {
        console.warn('⚠️ Failed to restore canvas:', error);
    }
}

function updateCostAnalysisSummarySafe(chartData) {
    try {
        let summaryContainer = document.getElementById('cost-analysis-summary');
        
        if (!summaryContainer) {
            const chartCard = document.querySelector('.enhanced-cost-chart');
            if (chartCard) {
                summaryContainer = document.createElement('div');
                summaryContainer.id = 'cost-analysis-summary';
                summaryContainer.className = 'mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700';
                chartCard.appendChild(summaryContainer);
            }
        }

        if (!summaryContainer) return;

        if (chartData.length === 0) {
            summaryContainer.innerHTML = `
                <div class="text-center text-gray-400">
                    <p class="text-sm">No cost analysis data available</p>
                    <div class="mt-2 text-xs space-y-1">
                        <p>💡 To see cost analysis:</p>
                        <p>1. Submit marketing 'Lead Semasa' data</p>
                        <p>2. Submit sales team 'Lead' data</p>
                        <p>3. Ensure same dates and team names</p>
                    </div>
                </div>
            `;
            return;
        }

        const totalSpend = chartData.reduce((sum, item) => sum + item.totalSpend, 0);
        const totalLeads = chartData.reduce((sum, item) => sum + item.totalLeads, 0);
        const avgCostPerLead = totalSpend / totalLeads;
        const lowestCost = Math.min(...chartData.map(item => item.costPerLead));
        const highestCost = Math.max(...chartData.map(item => item.costPerLead));
        
        const efficiency = avgCostPerLead < 10 ? '🟢 Excellent' :
                          avgCostPerLead < 20 ? '🟡 Good' :
                          avgCostPerLead < 50 ? '🟠 Fair' : '🔴 Needs Improvement';

        summaryContainer.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="text-center">
                    <div class="text-lg font-semibold text-blue-400">RM ${avgCostPerLead.toFixed(2)}</div>
                    <div class="text-xs text-gray-400">Avg Cost/Lead</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-semibold text-green-400">RM ${totalSpend.toFixed(0)}</div>
                    <div class="text-xs text-gray-400">Total Spend</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-semibold text-purple-400">${totalLeads}</div>
                    <div class="text-xs text-gray-400">Total Leads</div>
                </div>
                <div class="text-center">
                    <div class="text-sm font-semibold text-yellow-400">RM ${lowestCost.toFixed(2)} - ${highestCost.toFixed(2)}</div>
                    <div class="text-xs text-gray-400">Cost Range</div>
                </div>
                <div class="text-center">
                    <div class="text-sm font-semibold">${efficiency}</div>
                    <div class="text-xs text-gray-400">Efficiency</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.warn('⚠️ Failed to update cost analysis summary:', error);
    }
}

function updateCostPerLeadKPISafe(chartData) {
    try {
        if (chartData.length === 0) return;

        const totalSpend = chartData.reduce((sum, item) => sum + item.totalSpend, 0);
        const totalLeads = chartData.reduce((sum, item) => sum + item.totalLeads, 0);
        const avgCostPerLead = totalSpend / totalLeads;

        const costKpiCard = document.querySelector('.cost-per-lead-kpi .kpi-value');
        if (costKpiCard) {
            costKpiCard.textContent = `RM ${avgCostPerLead.toFixed(2)}`;
        }

        const costMetaCard = document.querySelector('.cost-per-lead-kpi .kpi-meta');
        if (costMetaCard) {
            const efficiency = avgCostPerLead < 10 ? 'Excellent' : 
                             avgCostPerLead < 20 ? 'Good' : 
                             avgCostPerLead < 50 ? 'Fair' : 'Needs Improvement';
            costMetaCard.textContent = `${efficiency} (${chartData.length} entries)`;
        }
    } catch (error) {
        console.warn('⚠️ Failed to update cost per lead KPI:', error);
    }
}

// SAFE DEBUG FUNCTION
async function debugMarketingCostChartSafe() {
    console.log('🔍 === MARKETING COST CHART DEBUG (SAFE) ===');
    
    try {
        const chartElement = document.getElementById('costPerLeadChart');
        console.log('Chart element found:', !!chartElement);
        
        if (chartElement) {
            console.log('Chart element details:', {
                tagName: chartElement.tagName,
                parentElement: !!chartElement.parentElement,
                parentClass: chartElement.parentElement?.className || 'no parent'
            });
        }
        
        console.log('Database available:', !!window.db);
        
        if (window.db && chartElement) {
            console.log('📊 Attempting to create chart...');
            await createMarketingCostChart();
        } else {
            console.log('❌ Missing dependencies for chart creation');
        }
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
    
    console.log('🔍 === END DEBUG ===');
}

// SAFE REFRESH FUNCTION
async function refreshCostAnalysisSafe() {
    console.log('🔄 Refreshing marketing cost analysis (safe)...');
    try {
        await createMarketingCostChart();
    } catch (error) {
        console.error('❌ Refresh failed:', error);
    }
}

// Export functions for external use
window.refreshCostAnalysis = refreshCostAnalysisSafe;
window.debugMarketingCostChart = debugMarketingCostChartSafe;