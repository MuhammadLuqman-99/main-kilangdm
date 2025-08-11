// Marketing Cost vs Lead Timeline Chart
// Shows correlation between marketing cost and lead submissions over time

export function createMarketingTimelineChart(data = null) {
    console.log('📊 Creating Marketing Cost vs Lead Timeline Chart...');
    
    const ctx = document.getElementById('marketingTimelineChart');
    if (!ctx) {
        console.warn('⚠️ marketingTimelineChart canvas not found');
        return;
    }

    // Process real Firebase data only - NO MOCK DATA
    let processedData = {};
    
    if (data && (data.marketing || data.salesteam)) {
        console.log('📈 Processing ONLY real Firebase timeline data...');
        processedData = processTimelineData(data);
        
        if (!processedData.dates || processedData.dates.length === 0) {
            console.warn('⚠️ No timeline data found in Firebase. Chart will show "No Data" message.');
            showNoDataMessage(ctx, 'No Timeline Data Available', 'Please ensure marketing cost and lead data with dates exist in Firebase.');
            return null;
        }
    } else {
        console.warn('⚠️ No Firebase data provided for Timeline chart. Chart will show "No Data" message.');
        showNoDataMessage(ctx, 'No Firebase Data', 'Timeline chart requires Firebase data to display.');
        return null;
    }

    // Destroy existing chart
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    // Create dual-axis timeline chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: processedData.dates,
            datasets: [
                {
                    label: 'Marketing Cost (RM)',
                    data: processedData.marketingCosts,
                    borderColor: 'rgba(239, 68, 68, 1)', // red
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    yAxisID: 'y'
                },
                {
                    label: 'Leads Masuk',
                    data: processedData.leadCounts,
                    borderColor: 'rgba(16, 185, 129, 1)', // green
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    yAxisID: 'y1'
                },
                {
                    label: 'Cost per Lead (RM)',
                    data: processedData.costPerLead,
                    type: 'bar',
                    backgroundColor: 'rgba(59, 130, 246, 0.6)', // blue
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
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
                    text: 'Marketing Cost vs Lead Timeline Analysis',
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
                            
                            if (datasetLabel.includes('Leads')) {
                                return `${datasetLabel}: ${value} leads`;
                            } else {
                                return `${datasetLabel}: RM ${value.toFixed(2)}`;
                            }
                        },
                        afterBody: function(tooltipItems) {
                            const dataIndex = tooltipItems[0].dataIndex;
                            const date = processedData.dates[dataIndex];
                            const cost = processedData.marketingCosts[dataIndex];
                            const leads = processedData.leadCounts[dataIndex];
                            const efficiency = leads > 0 ? (cost / leads).toFixed(2) : 'N/A';
                            
                            return [
                                '',
                                `Date: ${date}`,
                                `Efficiency: RM ${efficiency} per lead`
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
                            size: 11
                        },
                        maxRotation: 45
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
                        color: '#ef4444',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return 'RM ' + value.toFixed(0);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Marketing Cost (RM)',
                        color: '#ef4444',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
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
                        color: '#10b981',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return Math.round(value) + ' leads';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Leads Count',
                        color: '#10b981',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeInOutQuart'
            }
        }
    });

    console.log('✅ Marketing Timeline chart created successfully');
    
    // Store for global access
    window.marketingTimelineChart = chart;
    
    return chart;
}

function processTimelineData(data) {
    console.log('🔄 Processing ONLY real Firebase timeline data...');
    console.log('📊 Available data:', {
        marketing: data.marketing?.length || 0,
        salesteam: data.salesteam?.length || 0
    });
    
    const timelineData = {};
    
    // 1. Process marketing cost data by date
    if (data.marketing && data.marketing.length > 0) {
        console.log('📈 Processing marketing cost by date...');
        
        data.marketing.forEach((item) => {
            const date = item.tarikh || item.date;
            const time = item.masa || item.time;
            
            if (!date) return; // Skip items without date
            
            // Parse date consistently
            const dateKey = formatDateKey(date);
            if (!dateKey) return;
            
            // Get spend amount
            let spend = 0;
            if (item.spend) spend = parseFloat(item.spend);
            else if (item.budget) spend = parseFloat(item.budget);
            else if (item.cost) spend = parseFloat(item.cost);
            else if (item.amount) spend = parseFloat(item.amount);
            
            if (spend > 0) {
                if (!timelineData[dateKey]) {
                    timelineData[dateKey] = {
                        date: dateKey,
                        marketingCost: 0,
                        leadCount: 0,
                        submissions: []
                    };
                }
                
                timelineData[dateKey].marketingCost += spend;
                timelineData[dateKey].submissions.push({
                    type: 'marketing',
                    amount: spend,
                    time: time,
                    team: item.team_sale || item.team || 'Unknown'
                });
                
                console.log(`💰 Marketing: ${dateKey} = RM ${spend} (total: RM ${timelineData[dateKey].marketingCost})`);
            }
        });
    }
    
    // 2. Process lead submissions by date from salesteam
    if (data.salesteam && data.salesteam.length > 0) {
        console.log('📊 Processing lead submissions by date...');
        
        data.salesteam
            .filter(item => item.type === 'lead' || item.type === 'lead_semasa')
            .forEach((item) => {
                const date = item.tarikh || item.date;
                const time = item.masa || item.time;
                
                if (!date) return; // Skip items without date
                
                // Parse date consistently  
                const dateKey = formatDateKey(date);
                if (!dateKey) return;
                
                // Count leads
                const leadCount = parseInt(item.total_lead) || 1; // Default to 1 lead if not specified
                
                if (!timelineData[dateKey]) {
                    timelineData[dateKey] = {
                        date: dateKey,
                        marketingCost: 0,
                        leadCount: 0,
                        submissions: []
                    };
                }
                
                timelineData[dateKey].leadCount += leadCount;
                timelineData[dateKey].submissions.push({
                    type: 'lead',
                    count: leadCount,
                    time: time,
                    team: item.team || item.agent || item.agent_name || 'Unknown'
                });
                
                console.log(`🎯 Leads: ${dateKey} = ${leadCount} leads (total: ${timelineData[dateKey].leadCount})`);
            });
    }
    
    // 3. Sort dates and prepare chart data
    const sortedDates = Object.keys(timelineData)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(-30); // Keep last 30 days
    
    console.log(`📅 Found timeline data for ${sortedDates.length} dates:`, sortedDates);
    
    if (sortedDates.length === 0) {
        console.warn('⚠️ No dates found in timeline data!');
        return { dates: [] };
    }
    
    const chartData = {
        dates: sortedDates.map(date => formatDisplayDate(date)),
        marketingCosts: sortedDates.map(date => timelineData[date]?.marketingCost || 0),
        leadCounts: sortedDates.map(date => timelineData[date]?.leadCount || 0),
        costPerLead: sortedDates.map(date => {
            const cost = timelineData[date]?.marketingCost || 0;
            const leads = timelineData[date]?.leadCount || 0;
            return leads > 0 ? cost / leads : 0;
        })
    };
    
    console.log('📊 Processed timeline data:', {
        dates: chartData.dates.length,
        totalCost: chartData.marketingCosts.reduce((a, b) => a + b, 0),
        totalLeads: chartData.leadCounts.reduce((a, b) => a + b, 0),
        avgCostPerLead: chartData.costPerLead.reduce((a, b) => a + b, 0) / chartData.costPerLead.filter(x => x > 0).length
    });
    
    return chartData;
}

function formatDateKey(dateInput) {
    if (!dateInput) return null;
    
    try {
        // Handle different date formats
        let date;
        
        if (typeof dateInput === 'string') {
            // Handle formats like "2024-01-15", "15/01/2024", "15-01-2024"
            if (dateInput.includes('/')) {
                const parts = dateInput.split('/');
                if (parts.length === 3) {
                    date = new Date(parts[2], parts[1] - 1, parts[0]); // dd/mm/yyyy
                }
            } else if (dateInput.includes('-')) {
                date = new Date(dateInput); // ISO format or yyyy-mm-dd
            } else {
                date = new Date(dateInput);
            }
        } else {
            date = new Date(dateInput);
        }
        
        if (isNaN(date.getTime())) return null;
        
        // Return YYYY-MM-DD format for consistency
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.warn('⚠️ Error parsing date:', dateInput, error);
        return null;
    }
}

function formatDisplayDate(dateKey) {
    try {
        const date = new Date(dateKey);
        return date.toLocaleDateString('ms-MY', { 
            day: 'numeric', 
            month: 'short',
            weekday: 'short'
        });
    } catch (error) {
        return dateKey;
    }
}

// Function to update chart with period filter
export function updateMarketingTimelineChart(period = 30) {
    console.log(`🔄 Updating Marketing Timeline chart for ${period} days`);
    
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
                }) || []
            };
        }
        
        createMarketingTimelineChart(filteredData);
    } else {
        console.warn('⚠️ window.allData not available for period filtering');
        createMarketingTimelineChart(null);
    }
}

// Setup period button handlers
function setupTimelinePeriodButtons() {
    const timelinePeriodBtns = document.querySelectorAll('.timeline-period-btn');
    
    timelinePeriodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update button states
            timelinePeriodBtns.forEach(b => {
                b.classList.remove('active');
                b.className = 'text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded timeline-period-btn';
            });
            btn.classList.add('active');
            btn.className = 'text-xs bg-blue-600 text-white px-3 py-1 rounded timeline-period-btn active';
            
            // Update period and refresh chart
            const period = parseInt(btn.dataset.period);
            updateMarketingTimelineChart(period);
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupTimelinePeriodButtons();
});

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

// Expose functions to global scope for non-module scripts
window.createMarketingTimelineChart = createMarketingTimelineChart;
window.updateMarketingTimelineChart = updateMarketingTimelineChart;

console.log('📋 Marketing Timeline Chart module loaded');