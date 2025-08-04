// Marketing Cost Analysis Chart Implementation
// Add this to your dashboard.js file

import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    where,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Function to create Marketing Cost Analysis Chart
async function createMarketingCostChart() {
    const ctx = document.getElementById('costPerLeadChart');
    if (!ctx) return;

    try {
        // Get marketing spend data (lead_semasa from marketingData)
        const marketingQuery = query(
            collection(window.db, "marketingData"),
            where("type", "==", "lead_semasa"),
            orderBy("createdAt", "desc"),
            limit(30)
        );
        
        const marketingSnapshot = await getDocs(marketingQuery);
        const marketingData = [];
        
        marketingSnapshot.forEach((doc) => {
            const data = doc.data();
            marketingData.push({
                date: data.tarikh,
                team: data.team_sale,
                spend: data.spend || 0,
                timestamp: data.createdAt
            });
        });

        // Get sales team lead data
        const salesQuery = query(
            collection(window.db, "salesTeamData"),
            where("type", "==", "lead"),
            orderBy("createdAt", "desc"),
            limit(30)
        );
        
        const salesSnapshot = await getDocs(salesQuery);
        const salesData = [];
        
        salesSnapshot.forEach((doc) => {
            const data = doc.data();
            salesData.push({
                date: data.tarikh,
                team: data.team,
                total_lead: data.total_lead || 0,
                timestamp: data.createdAt
            });
        });

        // Combine and calculate cost per lead by date and team
        const costAnalysis = {};
        
        // Group marketing spend by date and team
        marketingData.forEach(item => {
            const key = `${item.date}_${item.team}`;
            if (!costAnalysis[key]) {
                costAnalysis[key] = {
                    date: item.date,
                    team: item.team,
                    totalSpend: 0,
                    totalLeads: 0,
                    costPerLead: 0
                };
            }
            costAnalysis[key].totalSpend += item.spend;
        });

        // Add lead data to the analysis
        salesData.forEach(item => {
            const key = `${item.date}_${item.team}`;
            if (costAnalysis[key]) {
                costAnalysis[key].totalLeads += item.total_lead;
                // Calculate cost per lead
                if (costAnalysis[key].totalLeads > 0) {
                    costAnalysis[key].costPerLead = costAnalysis[key].totalSpend / costAnalysis[key].totalLeads;
                }
            }
        });

        // Convert to array and sort by date
        const analysisArray = Object.values(costAnalysis)
            .filter(item => item.totalLeads > 0) // Only include items with leads
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-14); // Last 14 entries

        // Prepare chart data
        const labels = analysisArray.map(item => {
            const date = new Date(item.date);
            return `${date.getDate()}/${date.getMonth() + 1} - ${item.team}`;
        });
        
        const costPerLeadData = analysisArray.map(item => item.costPerLead.toFixed(2));
        const totalSpendData = analysisArray.map(item => item.totalSpend);
        const totalLeadsData = analysisArray.map(item => item.totalLeads);

        // Create the chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cost per Lead (RM)',
                        data: costPerLeadData,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Total Spend (RM)',
                        data: totalSpendData,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Total Leads',
                        data: totalLeadsData,
                        type: 'bar',
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: '#22C55E',
                        borderWidth: 1,
                        yAxisID: 'y2'
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
                        text: 'Cost per Lead Analysis - Marketing Spend vs Leads Generated',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#374151'
                    },
                    legend: {
                        display: true,
                        labels: {
                            usePointStyle: true,
                            color: '#6B7280'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#374151',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const datasetLabel = context.dataset.label;
                                const value = context.parsed.y;
                                
                                if (datasetLabel.includes('Cost per Lead')) {
                                    return `${datasetLabel}: RM ${parseFloat(value).toFixed(2)}`;
                                } else if (datasetLabel.includes('Total Spend')) {
                                    return `${datasetLabel}: RM ${parseFloat(value).toFixed(0)}`;
                                } else {
                                    return `${datasetLabel}: ${parseInt(value)} leads`;
                                }
                            },
                            afterBody: function(context) {
                                const index = context[0].dataIndex;
                                const item = analysisArray[index];
                                return [
                                    '',
                                    `Team: ${item.team}`,
                                    `Date: ${item.date}`,
                                    `Efficiency: ${item.costPerLead < 10 ? 'Excellent' : item.costPerLead < 20 ? 'Good' : 'Needs Improvement'}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date - Team',
                            color: '#6B7280'
                        },
                        ticks: {
                            color: '#6B7280',
                            maxRotation: 45
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Cost per Lead (RM)',
                            color: '#3B82F6'
                        },
                        ticks: {
                            color: '#3B82F6',
                            callback: function(value) {
                                return 'RM ' + parseFloat(value).toFixed(0);
                            }
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Total Spend (RM)',
                            color: '#EF4444'
                        },
                        ticks: {
                            color: '#EF4444',
                            callback: function(value) {
                                return 'RM ' + parseFloat(value).toFixed(0);
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    y2: {
                        type: 'linear',
                        display: false,
                        position: 'right',
                        min: 0,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // Update summary statistics
        updateCostAnalysisSummary(analysisArray);

    } catch (error) {
        console.error('Error creating marketing cost chart:', error);
        
        // Show error message in chart container
        const chartContainer = ctx.getContext('2d');
        chartContainer.fillStyle = '#6B7280';
        chartContainer.font = '14px Inter';
        chartContainer.textAlign = 'center';
        chartContainer.fillText(
            'Error loading cost analysis data', 
            ctx.width / 2, 
            ctx.height / 2
        );
    }
}

// Function to update cost analysis summary
function updateCostAnalysisSummary(analysisData) {
    if (analysisData.length === 0) return;

    const totalSpend = analysisData.reduce((sum, item) => sum + item.totalSpend, 0);
    const totalLeads = analysisData.reduce((sum, item) => sum + item.totalLeads, 0);
    const avgCostPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
    
    // Find the most efficient team (lowest cost per lead)
    const mostEfficient = analysisData.reduce((min, item) => 
        item.costPerLead < min.costPerLead ? item : min
    );

    // Update summary in the chart header or create summary cards
    const chartCard = document.querySelector('.enhanced-cost-chart');
    if (chartCard) {
        let summaryElement = chartCard.querySelector('.cost-summary');
        if (!summaryElement) {
            summaryElement = document.createElement('div');
            summaryElement.className = 'cost-summary mt-4 p-4 bg-gray-50 rounded-lg';
            chartCard.appendChild(summaryElement);
        }

        summaryElement.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">RM ${avgCostPerLead.toFixed(2)}</div>
                    <div class="text-gray-600">Avg Cost/Lead</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-red-600">RM ${totalSpend.toFixed(0)}</div>
                    <div class="text-gray-600">Total Spend</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">${totalLeads}</div>
                    <div class="text-gray-600">Total Leads</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600">${mostEfficient.team}</div>
                    <div class="text-gray-600">Most Efficient</div>
                    <div class="text-xs text-gray-500">RM ${mostEfficient.costPerLead.toFixed(2)}/lead</div>
                </div>
            </div>
        `;
    }
}

// Function to refresh cost analysis data
async function refreshCostAnalysis() {
    const chartElement = document.getElementById('costPerLeadChart');
    if (chartElement) {
        // Destroy existing chart if it exists
        const existingChart = Chart.getChart(chartElement);
        if (existingChart) {
            existingChart.destroy();
        }
        
        // Recreate the chart
        await createMarketingCostChart();
    }
}

// Export functions for use in dashboard.js
window.createMarketingCostChart = createMarketingCostChart;
window.refreshCostAnalysis = refreshCostAnalysis;

// Auto-refresh every 5 minutes
setInterval(refreshCostAnalysis, 5 * 60 * 1000);