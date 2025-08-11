// Marketing Cost per Sales Team Chart
// Replaces the main sales trend chart

export function createMarketingCostPerTeamChart(data = null) {
    console.log('📊 Creating Marketing Cost per Sales Team Chart...');
    
    const ctx = document.getElementById('marketingCostChart');
    if (!ctx) {
        console.warn('⚠️ marketingCostChart canvas not found');
        return;
    }

    // Process real Firebase data only - NO MOCK DATA
    let processedData = {};
    
    if (data && (data.marketing || data.salesteam)) {
        console.log('📈 Processing ONLY real Firebase marketing cost data...');
        processedData = processMarketingCostData(data);
        
        if (Object.keys(processedData).length === 0) {
            console.warn('⚠️ No marketing cost data found in Firebase. Chart will show "No Data" message.');
            showNoDataMessage(ctx, 'No Marketing Cost Data Available', 'Please ensure marketing spend data exists in Firebase.');
            return null;
        }
    } else {
        console.warn('⚠️ No Firebase data provided for Marketing Cost chart. Chart will show "No Data" message.');
        showNoDataMessage(ctx, 'No Firebase Data', 'Marketing Cost chart requires Firebase data to display.');
        return null;
    }

    // Destroy existing chart
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    // Prepare chart data
    const teams = Object.keys(processedData);
    const costs = Object.values(processedData);
    
    // Color scheme for teams
    const colors = [
        '#3b82f6', // blue
        '#10b981', // emerald
        '#f59e0b', // amber
        '#8b5cf6', // violet
        '#ef4444', // red
        '#06b6d4', // cyan
        '#84cc16', // lime
        '#f97316'  // orange
    ];

    // Create new chart
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: teams,
            datasets: [{
                label: 'Marketing Cost (RM)',
                data: costs,
                backgroundColor: teams.map((_, index) => colors[index % colors.length]),
                borderColor: teams.map((_, index) => colors[index % colors.length]),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Marketing Cost per Sales Team Member',
                    color: '#e2e8f0',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#475569',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Marketing Cost: RM ${context.parsed.y.toFixed(0)}`;
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
                            size: 12
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return 'RM ' + value.toFixed(0);
                        }
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            }
        }
    });

    console.log('✅ Marketing Cost per Team chart created successfully');
    
    // Store for global access
    window.marketingCostChart = chart;
    
    return chart;
}

function processMarketingCostData(data) {
    console.log('🔄 Processing ONLY real Firebase marketing cost data...');
    console.log('📊 Available data:', {
        marketing: data.marketing?.length || 0,
        salesteam: data.salesteam?.length || 0
    });
    
    const teamCosts = {};
    
    // 1. Process marketing spend data from all types - be more comprehensive
    if (data.marketing && data.marketing.length > 0) {
        console.log('📈 Processing marketing data...');
        
        data.marketing.forEach((item, index) => {
            const team = (item.team_sale || item.team || item.agent || '').trim();
            let spend = 0;
            
            // Try multiple spend fields
            if (item.spend) spend = parseFloat(item.spend);
            else if (item.budget) spend = parseFloat(item.budget);
            else if (item.cost) spend = parseFloat(item.cost);
            else if (item.amount) spend = parseFloat(item.amount);
            
            // Accept all types of marketing data, not just lead_semasa
            if (team && spend > 0) {
                if (!teamCosts[team]) {
                    teamCosts[team] = 0;
                }
                teamCosts[team] += spend;
                console.log(`💰 Marketing cost: ${team} = RM ${spend} (type: ${item.type || 'unknown'}, total: RM ${teamCosts[team]})`);
            }
        });
    }
    
    // 2. If NO marketing cost data found at all, return empty
    if (Object.keys(teamCosts).length === 0) {
        console.warn('⚠️ No marketing spend data found in Firebase!');
        console.log('📋 Sample marketing records:', data.marketing?.slice(0, 3));
        return {};
    }
    
    console.log('📊 Final processed team costs:', teamCosts);
    console.log(`✅ Successfully processed marketing costs for ${Object.keys(teamCosts).length} teams`);
    
    return teamCosts;
}

// Function to update chart with period filter
export function updateMarketingCostChart(period = 30) {
    console.log(`🔄 Updating marketing cost chart for ${period} days`);
    
    // Get filtered data by period if available
    let filteredData = null;
    
    if (window.allData) {
        // Filter data by period if we have date filtering logic
        filteredData = window.allData;
        
        // Apply date filtering if period is specified
        if (period && period < 90) {
            const currentDate = new Date();
            const periodStart = new Date();
            periodStart.setDate(currentDate.getDate() - period);
            
            // Filter marketing data by date
            if (filteredData.marketing) {
                filteredData = {
                    ...filteredData,
                    marketing: filteredData.marketing.filter(item => {
                        if (item.tarikh) {
                            const itemDate = new Date(item.tarikh);
                            return itemDate >= periodStart;
                        }
                        return true; // Include items without date
                    })
                };
            }
        }
        
        createMarketingCostPerTeamChart(filteredData);
    } else {
        console.warn('⚠️ window.allData not available for period filtering');
        createMarketingCostPerTeamChart(null);
    }
}

// Expose functions to global scope for non-module scripts
window.createMarketingCostPerTeamChart = createMarketingCostPerTeamChart;
window.updateMarketingCostChart = updateMarketingCostChart;

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

console.log('📋 Marketing Cost per Team Chart module loaded');