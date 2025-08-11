// Marketing ROI Performance Chart
// Large chart showing spend vs revenue for each sales team member

export function createMarketingROIChart(data = null) {
    console.log('📊 Creating Marketing ROI Performance Chart...');
    
    const ctx = document.getElementById('marketingROIChart');
    if (!ctx) {
        console.warn('⚠️ marketingROIChart canvas not found');
        return;
    }

    // Process real Firebase data only - NO MOCK DATA
    let processedData = {};
    
    if (data && (data.marketing || data.salesteam)) {
        console.log('📈 Processing real Firebase ROI data...');
        processedData = processROIData(data);
        
        if (Object.keys(processedData).length === 0) {
            console.warn('⚠️ No marketing ROI data found in Firebase. Chart will show "No Data" message.');
            showNoDataMessage(ctx, 'No Marketing ROI Data Available', 'Please ensure marketing spend and revenue data exists in Firebase.');
            return null;
        }
    } else {
        console.warn('⚠️ No Firebase data provided for Marketing ROI chart. Chart will show "No Data" message.');
        showNoDataMessage(ctx, 'No Firebase Data', 'Marketing ROI chart requires Firebase data to display.');
        return null;
    }

    // Destroy existing chart
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    // Prepare chart data
    const teams = Object.keys(processedData);
    const spendData = teams.map(team => processedData[team].spend);
    const revenueData = teams.map(team => processedData[team].revenue);
    const roiData = teams.map(team => processedData[team].roi);

    // Create dual-axis chart (bar + line)
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: teams,
            datasets: [
                {
                    label: 'Marketing Spend (RM)',
                    data: spendData,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)', // red
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'Revenue Generated (RM)',
                    data: revenueData,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)', // green
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'ROI (%)',
                    data: roiData,
                    type: 'line',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Marketing ROI: Spend vs Revenue Performance',
                    color: '#e2e8f0',
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e2e8f0',
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#475569',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            
                            if (datasetLabel.includes('ROI')) {
                                return `${datasetLabel}: ${value.toFixed(1)}%`;
                            } else {
                                return `${datasetLabel}: RM ${value.toLocaleString()}`;
                            }
                        },
                        afterBody: function(tooltipItems) {
                            const dataIndex = tooltipItems[0].dataIndex;
                            const team = teams[dataIndex];
                            const data = processedData[team];
                            
                            return [
                                '',
                                `ROI Ratio: ${data.roiRatio.toFixed(2)}x`,
                                `Profit: RM ${(data.revenue - data.spend).toLocaleString()}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return 'RM ' + value.toLocaleString();
                        }
                    },
                    title: {
                        display: true,
                        text: 'Amount (RM)',
                        color: '#94a3b8'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: '#3b82f6',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'ROI (%)',
                        color: '#3b82f6'
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });

    console.log('✅ Marketing ROI chart created successfully');
    
    // Store for global access
    window.marketingROIChart = chart;
    
    return chart;
}

function processROIData(data) {
    console.log('🔄 Processing ONLY real Firebase ROI data...');
    console.log('📊 Available data:', {
        marketing: data.marketing?.length || 0,
        salesteam: data.salesteam?.length || 0,
        orders: data.orders?.length || 0,
        ecommerce: data.ecommerce?.length || 0
    });
    
    const roiData = {};
    
    // 1. Get marketing spend by team from multiple sources
    const marketingSpend = {};
    
    if (data.marketing && data.marketing.length > 0) {
        console.log('📈 Processing marketing data...');
        
        data.marketing.forEach((item, index) => {
            // Check multiple spend fields and types
            const team = (item.team_sale || item.team || item.agent || '').trim();
            let spend = 0;
            
            // Try different spend fields
            if (item.spend) spend = parseFloat(item.spend);
            else if (item.budget) spend = parseFloat(item.budget);
            else if (item.cost) spend = parseFloat(item.cost);
            else if (item.amount) spend = parseFloat(item.amount);
            
            if (team && spend > 0) {
                if (!marketingSpend[team]) {
                    marketingSpend[team] = 0;
                }
                marketingSpend[team] += spend;
                console.log(`💰 Marketing spend: ${team} = RM ${spend} (total: RM ${marketingSpend[team]})`);
            }
        });
    }
    
    // 2. Get revenue by team from multiple sources
    const teamRevenue = {};
    
    // From salesteam data (power_metrics)
    if (data.salesteam && data.salesteam.length > 0) {
        console.log('📊 Processing salesteam data...');
        
        data.salesteam.forEach(item => {
            const team = (item.agent_name || item.team || item.agent || '').trim();
            let revenue = 0;
            
            // Try different revenue fields based on type
            if (item.type === 'power_metrics') {
                revenue = parseFloat(item.total_sale_bulan || item.total_sale || item.sale) || 0;
            } else if (item.type === 'lead' && item.conversion_value) {
                revenue = parseFloat(item.conversion_value) || 0;
            }
            
            if (team && revenue > 0) {
                if (!teamRevenue[team]) {
                    teamRevenue[team] = 0;
                }
                teamRevenue[team] += revenue;
                console.log(`💸 Sales revenue: ${team} = RM ${revenue} (total: RM ${teamRevenue[team]})`);
            }
        });
    }
    
    // From orders/ecommerce data
    const orderSources = [
        { data: data.orders || [], source: 'orders' },
        { data: data.ecommerce || [], source: 'ecommerce' }
    ];
    
    orderSources.forEach(({ data: orders, source }) => {
        if (orders.length > 0) {
            console.log(`📦 Processing ${source} data...`);
            
            orders.forEach(item => {
                const team = (item.sales_agent || item.agent || item.team || '').trim();
                const revenue = parseFloat(item.total_rm || item.amount || item.total || item.value) || 0;
                
                if (team && revenue > 0) {
                    if (!teamRevenue[team]) {
                        teamRevenue[team] = 0;
                    }
                    teamRevenue[team] += revenue;
                    console.log(`🛒 Order revenue: ${team} = RM ${revenue} (total: RM ${teamRevenue[team]})`);
                }
            });
        }
    });
    
    // 3. Calculate ROI for teams with both spend and revenue data
    console.log('🔍 Teams with marketing spend:', Object.keys(marketingSpend));
    console.log('🔍 Teams with revenue:', Object.keys(teamRevenue));
    
    // Only include teams that have BOTH marketing spend AND revenue
    const teamsWithBothData = Object.keys(marketingSpend).filter(team => 
        marketingSpend[team] > 0 && teamRevenue[team] > 0
    );
    
    console.log('✅ Teams with both spend and revenue:', teamsWithBothData);
    
    if (teamsWithBothData.length === 0) {
        console.warn('⚠️ No teams found with both marketing spend and revenue data!');
        console.log('📋 Available marketing spend teams:', Object.keys(marketingSpend));
        console.log('📋 Available revenue teams:', Object.keys(teamRevenue));
        return {};
    }
    
    teamsWithBothData.forEach(team => {
        const spend = marketingSpend[team];
        const revenue = teamRevenue[team];
        const roi = ((revenue - spend) / spend) * 100;
        const roiRatio = revenue / spend;
        const profit = revenue - spend;
        
        roiData[team] = {
            spend: Math.round(spend),
            revenue: Math.round(revenue),
            roi: Math.round(roi * 10) / 10, // Round to 1 decimal
            roiRatio: Math.round(roiRatio * 100) / 100, // Round to 2 decimals
            profit: Math.round(profit)
        };
        
        console.log(`🎯 ROI calculated for ${team}:`, {
            spend: `RM ${spend.toFixed(0)}`,
            revenue: `RM ${revenue.toFixed(0)}`,
            roi: `${roi.toFixed(1)}%`,
            ratio: `${roiRatio.toFixed(2)}x`,
            profit: `RM ${profit.toFixed(0)}`
        });
    });
    
    console.log('📊 Final ROI data:', roiData);
    console.log(`✅ Successfully processed ROI data for ${Object.keys(roiData).length} teams`);
    
    return roiData;
}

// REMOVED: getSampleROIData function - using only real Firebase data

// Function to update chart with period filter
export function updateMarketingROIChart(period = 30) {
    console.log(`🔄 Updating Marketing ROI chart for ${period} days`);
    
    // Get filtered data by period if available
    let filteredData = null;
    
    if (window.allData) {
        filteredData = window.allData;
        
        // Apply date filtering if period is specified
        if (period && period < 90) {
            const currentDate = new Date();
            const periodStart = new Date();
            periodStart.setDate(currentDate.getDate() - period);
            
            // Filter data by date
            filteredData = {
                marketing: window.allData.marketing?.filter(item => {
                    if (item.tarikh) {
                        const itemDate = new Date(item.tarikh);
                        return itemDate >= periodStart;
                    }
                    return true;
                }) || [],
                salesteam: window.allData.salesteam?.filter(item => {
                    if (item.tarikh) {
                        const itemDate = new Date(item.tarikh);
                        return itemDate >= periodStart;
                    }
                    return true;
                }) || [],
                orders: window.allData.orders || [],
                ecommerce: window.allData.ecommerce || []
            };
        }
        
        createMarketingROIChart(filteredData);
    } else {
        console.warn('⚠️ window.allData not available for period filtering');
        createMarketingROIChart(null);
    }
}

// Setup period button handlers
function setupROIPeriodButtons() {
    const roiPeriodBtns = document.querySelectorAll('.roi-period-btn');
    
    roiPeriodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update button states
            roiPeriodBtns.forEach(b => {
                b.classList.remove('active');
                b.className = 'text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded roi-period-btn';
            });
            btn.classList.add('active');
            btn.className = 'text-xs bg-blue-600 text-white px-3 py-1 rounded roi-period-btn active';
            
            // Update period and refresh chart
            const period = parseInt(btn.dataset.period);
            updateMarketingROIChart(period);
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupROIPeriodButtons();
});

// Expose functions to global scope for non-module scripts
window.createMarketingROIChart = createMarketingROIChart;
window.updateMarketingROIChart = updateMarketingROIChart;

// Helper function to show "No Data" message
function showNoDataMessage(ctx, title, message) {
    // Clear the canvas
    const chart = Chart.getChart(ctx);
    if (chart) {
        chart.destroy();
    }
    
    // Create a simple "No Data" chart
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['No Data'],
            datasets: [{
                data: [1],
                backgroundColor: ['rgba(100, 116, 139, 0.3)'],
                borderColor: ['rgba(100, 116, 139, 0.5)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: [title, message],
                    color: '#94a3b8',
                    font: {
                        size: 16,
                        weight: 'normal'
                    },
                    padding: {
                        top: 80,
                        bottom: 20
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
}

console.log('📋 Marketing ROI Performance Chart module loaded');