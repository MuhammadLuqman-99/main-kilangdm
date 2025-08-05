import { collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ENHANCED VERSION: Marketing Cost Chart with Date Filtering
export async function createMarketingCostChart(filteredData = null) {
    console.log('🚀 Starting Marketing Cost Chart with Date Filtering...');
    
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
        // Show loading state
        showChartLoadingSafe(chartContainer);

        let marketingData = [];
        let salesData = [];

        // Use filtered data if provided, otherwise fetch fresh data
        if (filteredData && filteredData.marketing && filteredData.salesteam) {
            console.log('📊 Using filtered data from dashboard...');
            
            // Filter marketing data for lead_semasa type
            marketingData = filteredData.marketing
                .filter(item => item.type === 'lead_semasa')
                .map(item => ({
                    id: item.id || 'unknown',
                    date: item.tarikh,
                    team: item.team_sale || 'Unknown',
                    spend: parseFloat(item.spend) || 0,
                    time: item.masa,
                    createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt || Date.now()),
                    raw: item
                }));

            // Filter sales data for lead type  
            salesData = filteredData.salesteam
                .filter(item => item.type === 'lead')
                .map(item => ({
                    id: item.id || 'unknown',
                    date: item.tarikh,
                    team: item.team || item.agent || 'Unknown',
                    totalLead: parseInt(item.total_lead) || 0,
                    cold: parseInt(item.cold) || 0,
                    warm: parseInt(item.warm) || 0,
                    hot: parseInt(item.hot) || 0,
                    time: item.masa,
                    createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt || Date.now()),
                    raw: item
                }));

        } else {
            console.log('📊 Fetching fresh data from Firestore...');
            
            // Fetch fresh data if no filtered data provided
            const marketingQuery = query(
                collection(window.db, "marketingData"),
                where("type", "==", "lead_semasa"),
                limit(100)
            );
            
            const salesQuery = query(
                collection(window.db, "salesTeamData"),
                where("type", "==", "lead"),
                limit(100)
            );

            const [marketingSnapshot, salesSnapshot] = await Promise.all([
                getDocs(marketingQuery),
                getDocs(salesQuery)
            ]);

            // Process marketing data
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

            // Process sales data
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
        }

        console.log(`📈 Filtered marketing records: ${marketingData.length}`);
        console.log(`👥 Filtered sales records: ${salesData.length}`);

        // Sort data by date (newest first)
        marketingData.sort((a, b) => new Date(b.date) - new Date(a.date));
        salesData.sort((a, b) => new Date(b.date) - new Date(a.date));

        // ENHANCED DATA MATCHING BY DATE
        const combinedData = [];

        // Strategy 1: Exact date + team match
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
                    marketingTime: marketing.time,
                    salesTime: exactMatch.time,
                    createdAt: marketing.createdAt
                });
            }
        });

        // Strategy 2: Same date aggregation (for better visualization)
        console.log('📊 Processing date-based aggregation...');
        
        const marketingByDate = {};
        const salesByDate = {};

        // Group marketing data by date
        marketingData.forEach(item => {
            if (item.spend > 0) {
                if (!marketingByDate[item.date]) {
                    marketingByDate[item.date] = { 
                        totalSpend: 0, 
                        teams: [],
                        entries: [],
                        createdAt: item.createdAt 
                    };
                }
                marketingByDate[item.date].totalSpend += item.spend;
                marketingByDate[item.date].teams.push(item.team);
                marketingByDate[item.date].entries.push(item);
            }
        });

        // Group sales data by date
        salesData.forEach(item => {
            if (item.totalLead > 0) {
                if (!salesByDate[item.date]) {
                    salesByDate[item.date] = { 
                        totalLeads: 0, 
                        teams: [],
                        entries: [],
                        createdAt: item.createdAt
                    };
                }
                salesByDate[item.date].totalLeads += item.totalLead;
                salesByDate[item.date].teams.push(item.team);
                salesByDate[item.date].entries.push(item);
            }
        });

        // Match by date and create aggregated entries
        Object.keys(marketingByDate).forEach(date => {
            if (salesByDate[date]) {
                const marketing = marketingByDate[date];
                const sales = salesByDate[date];
                
                // Only add if not already covered by exact matches
                const existingMatch = combinedData.find(item => item.date === date && item.matchType === 'exact');
                if (!existingMatch && marketing.totalSpend > 0 && sales.totalLeads > 0) {
                    
                    const uniqueTeams = [...new Set([...marketing.teams, ...sales.teams])];
                    const teamDisplay = uniqueTeams.length === 1 ? uniqueTeams[0] : 
                                       uniqueTeams.length <= 3 ? uniqueTeams.join(', ') :
                                       `${uniqueTeams.slice(0, 2).join(', ')} +${uniqueTeams.length - 2}`;

                    combinedData.push({
                        date: date,
                        team: teamDisplay,
                        totalSpend: marketing.totalSpend,
                        totalLeads: sales.totalLeads,
                        costPerLead: marketing.totalSpend / sales.totalLeads,
                        matchType: 'aggregated',
                        marketingTeams: marketing.teams.length,
                        salesTeams: sales.teams.length,
                        marketingEntries: marketing.entries.length,
                        salesEntries: sales.entries.length,
                        createdAt: marketing.createdAt
                    });
                }
            }
        });

        console.log(`💡 Combined data entries: ${combinedData.length}`);

        // Handle empty data
        if (combinedData.length === 0) {
            console.warn('⚠️ No matching data found for the selected date range');
            renderEmptyChartWithDateInfo(chartContainer, filteredData);
            updateCostAnalysisSummarySafe([]);
            return;
        }

        // Sort and limit data for chart (show data chronologically)
        const chartData = combinedData
            .sort((a, b) => new Date(a.date) - new Date(b.date)) // Chronological order
            .slice(-20); // Show latest 20 entries

        // Prepare chart datasets
        const labels = chartData.map(item => {
            const date = new Date(item.date);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
            const teamLabel = item.team.length > 15 ? 
                item.team.substring(0, 12) + '...' : 
                item.team;
            
            return `${formattedDate}\n${teamLabel}`;
        });

        const costPerLeadData = chartData.map(item => parseFloat(item.costPerLead.toFixed(2)));
        const totalSpendData = chartData.map(item => item.totalSpend);
        const totalLeadsData = chartData.map(item => item.totalLeads);

        // Calculate efficiency colors for cost per lead
        const maxCost = Math.max(...costPerLeadData);
        const minCost = Math.min(...costPerLeadData);
        const costColors = costPerLeadData.map(cost => {
            const ratio = maxCost > minCost ? (cost - minCost) / (maxCost - minCost) : 0;
            if (ratio < 0.3) return '#22C55E'; // Green for low cost
            if (ratio < 0.7) return '#F59E0B'; // Yellow for medium cost
            return '#EF4444'; // Red for high cost
        });

        // Destroy existing chart
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        // Restore canvas
        restoreCanvasSafe(chartContainer);
        const newCtx = document.getElementById('costPerLeadChart');
        if (!newCtx) {
            console.error('❌ Failed to restore canvas element');
            return;
        }

        // Create enhanced chart with date filtering
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
                        pointRadius: 7,
                        pointHoverRadius: 10,
                        pointBackgroundColor: costColors,
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
                    },
                    {
                        label: 'Total Spend (RM)',
                        data: totalSpendData,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#EF4444',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 1,
                        yAxisID: 'y2',
                        hidden: true // Hidden by default
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
                        text: `Marketing Cost Analysis - ${chartData.length} entries ${getDateRangeText(chartData)}`,
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
                                        `🔗 Match Type: ${item.matchType}`,
                                        item.matchType === 'aggregated' ? 
                                            `📊 Teams: ${item.marketingTeams} marketing, ${item.salesTeams} sales` : 
                                            `⏰ Times: ${item.marketingTime || 'N/A'} | ${item.salesTime || 'N/A'}`
                                    ];
                                } else if (context.dataset.label === 'Total Leads') {
                                    return `👥 Total Leads: ${item.totalLeads}`;
                                } else {
                                    return `📈 Total Spend: RM ${item.totalSpend.toFixed(2)}`;
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
                    },
                    y2: {
                        type: 'linear',
                        display: false,
                        title: { 
                            display: false, 
                            text: 'Total Spend (RM)', 
                            color: '#EF4444'
                        }
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeInOutQuart'
                }
            }
        });

        // Update summary with filtered data context
        updateCostAnalysisSummarySafe(chartData, filteredData);
        updateCostPerLeadKPISafe(chartData);

        console.log('✅ Marketing Cost Chart with date filtering created successfully');
        console.log(`📊 Filtered Chart Summary:`, {
            entries: chartData.length,
            dateRange: `${chartData[0]?.date} to ${chartData[chartData.length - 1]?.date}`,
            avgCostPerLead: (chartData.reduce((sum, item) => sum + item.costPerLead, 0) / chartData.length).toFixed(2),
            totalSpend: chartData.reduce((sum, item) => sum + item.totalSpend, 0).toFixed(2),
            totalLeads: chartData.reduce((sum, item) => sum + item.totalLeads, 0)
        });

    } catch (error) {
        console.error('❌ Error creating marketing cost chart with filters:', error);
        renderErrorChartSafe(chartContainer, error.message);
    }
}

// Helper function to get date range text
function getDateRangeText(chartData) {
    if (chartData.length === 0) return '';
    if (chartData.length === 1) return `(${chartData[0].date})`;
    
    const firstDate = chartData[0].date;
    const lastDate = chartData[chartData.length - 1].date;
    
    if (firstDate === lastDate) {
        return `(${firstDate})`;
    }
    
    return `(${firstDate} to ${lastDate})`;
}

// Enhanced empty chart with filter context
function renderEmptyChartWithDateInfo(container, filteredData) {
    if (!container) return;
    
    const hasFilters = filteredData && (
        document.getElementById('start-date')?.value ||
        document.getElementById('end-date')?.value ||
        document.getElementById('agent-filter')?.value
    );
    
    try {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #9CA3AF; flex-direction: column;">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                    <div style="font-size: 18px; margin-bottom: 8px; font-weight: 600;">
                        ${hasFilters ? 'No Cost Data in Selected Date Range' : 'No Cost Data Available'}
                    </div>
                    <div style="font-size: 14px; opacity: 0.7; margin-bottom: 16px;">
                        ${hasFilters ? 
                            'Try expanding the date range or check different teams' : 
                            'Submit marketing spend and lead data for matching dates'
                        }
                    </div>
                    <div style="font-size: 12px; text-align: left; background: rgba(55, 65, 81, 0.5); padding: 12px; border-radius: 8px; max-width: 400px;">
                        <div style="margin-bottom: 4px;">📢 <strong>Marketing:</strong> Submit 'Lead Semasa' data</div>
                        <div style="margin-bottom: 4px;">👥 <strong>Sales Team:</strong> Submit 'Lead' data</div>
                        <div style="margin-bottom: 4px;">📅 <strong>Important:</strong> Use same dates and team names</div>
                        ${hasFilters ? '<div style="color: #F59E0B;">🔍 <strong>Tip:</strong> Clear filters to see all data</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.warn('⚠️ Failed to render empty chart with date info:', error);
    }
}

// Enhanced summary with filter context
function updateCostAnalysisSummarySafe(chartData, filteredData = null) {
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
            const hasFilters = filteredData && (
                document.getElementById('start-date')?.value ||
                document.getElementById('end-date')?.value ||
                document.getElementById('agent-filter')?.value
            );
            
            summaryContainer.innerHTML = `
                <div class="text-center text-gray-400">
                    <p class="text-sm">${hasFilters ? 'No cost data in selected date range' : 'No cost analysis data available'}</p>
                    <div class="mt-2 text-xs space-y-1">
                        ${hasFilters ? 
                            '<p>🔍 Try expanding date range or clearing filters</p>' :
                            '<p>💡 To see cost analysis:</p><p>1. Submit marketing \'Lead Semasa\' data</p><p>2. Submit sales team \'Lead\' data</p><p>3. Ensure same dates and team names</p>'
                        }
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

        const dateRange = getDateRangeText(chartData);

        summaryContainer.innerHTML = `
            <div class="mb-3 text-center">
                <h5 class="text-sm font-semibold text-gray-300">Cost Analysis Summary ${dateRange}</h5>
            </div>
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

// Keep existing safe helper functions
function showChartLoadingSafe(container) {
    if (!container) return;
    
    try {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #9CA3AF;">
                <div style="text-align: center;">
                    <div style="margin-bottom: 10px;">
                        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #374151; border-top: 3px solid #3B82F6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    </div>
                    <div>Loading filtered cost analysis...</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.warn('⚠️ Failed to show loading state:', error);
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

// Export function for use in dashboard
async function refreshCostAnalysisSafe() {
    console.log('🔄 Refreshing marketing cost analysis with current filters...');
    try {
        // Get current filtered data from global variable if available
        if (window.allData && typeof applyFilters === 'function') {
            // Trigger filter refresh which will call the chart update
            applyFilters();
        } else {
            // Fallback to creating chart without filters
            await createMarketingCostChart();
        }
    } catch (error) {
        console.error('❌ Refresh failed:', error);
    }
}

// Enhanced debug function with filter support
async function debugMarketingCostChartSafe() {
    console.log('🔍 === MARKETING COST CHART DEBUG (WITH FILTERS) ===');
    
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
        console.log('Global data available:', !!window.allData);
        
        // Check current filters
        const startDate = document.getElementById('start-date')?.value;
        const endDate = document.getElementById('end-date')?.value;
        const agentFilter = document.getElementById('agent-filter')?.value;
        
        console.log('Current filters:', {
            startDate: startDate || 'None',
            endDate: endDate || 'None', 
            agent: agentFilter || 'None'
        });
        
        if (window.db && chartElement) {
            console.log('📊 Testing chart creation with current filters...');
            
            // Try to get filtered data if available
            if (window.allData) {
                console.log('Using global filtered data...');
                
                const filteredData = {
                    marketing: window.filterByDate ? 
                        window.filterByDate(window.allData.marketing, startDate, endDate) : 
                        window.allData.marketing,
                    salesteam: window.filterSalesTeamData ? 
                        window.filterSalesTeamData(window.allData.salesteam, startDate, endDate, agentFilter) :
                        window.allData.salesteam
                };
                
                await createMarketingCostChart(filteredData);
            } else {
                console.log('No global data, fetching fresh...');
                await createMarketingCostChart();
            }
        } else {
            console.log('❌ Missing dependencies for chart creation');
        }
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
    
    console.log('🔍 === END DEBUG ===');
}

// Export functions for external use
window.refreshCostAnalysis = refreshCostAnalysisSafe;
window.debugMarketingCostChart = debugMarketingCostChartSafe;