// Marketing Cost vs Lead Timeline Chart
// Shows correlation between marketing cost and lead submissions over time

export function createMarketingTimelineChart(data = null) {
    console.log('📊 Creating Marketing Cost vs Lead Timeline Chart (Bar Chart with Lead Breakdown)...');
    
    // Check localStorage for saved chart preference (ensure consistency after refresh)
    let savedChartConfig = null;
    try {
        const savedConfig = localStorage.getItem('marketingTimelineChartConfig');
        if (savedConfig) {
            savedChartConfig = JSON.parse(savedConfig);
            console.log('💾 Found saved chart preference:', savedChartConfig);
        }
    } catch (error) {
        console.warn('⚠️ Could not read saved chart preference:', error);
    }
    
    const ctx = document.getElementById('marketingTimelineChart');
    if (!ctx) {
        console.warn('⚠️ marketingTimelineChart canvas not found');
        return;
    }

    // Save/update chart type preference to localStorage (ensure bar chart persists on refresh)
    try {
        const chartConfig = {
            type: 'bar',
            format: 'cold_warm_hot_breakdown',
            version: '3.0',
            timestamp: Date.now(),
            persistent: true,
            datasets: ['Cold Leads', 'Warm Leads', 'Hot Leads']
        };
        
        localStorage.setItem('marketingTimelineChartType', 'bar');
        localStorage.setItem('marketingTimelineChartConfig', JSON.stringify(chartConfig));
        localStorage.setItem('chartVersion', '3.0');
        console.log('💾 Saved bar chart preference v3.0 to localStorage:', chartConfig);
    } catch (error) {
        console.warn('⚠️ Could not save chart preference:', error);
    }

    // Process real Firebase data only - NO MOCK DATA
    let processedData = {};
    
    if (data && (data.marketing || data.salesteam)) {
        console.log('📈 Processing ONLY real Firebase timeline data...');
        processedData = processTimelineData(data);
        
        if (!processedData.teams || processedData.teams.length === 0) {
            console.warn('⚠️ No team lead data found in Firebase. Chart will show "No Data" message.');
            showNoDataMessage(ctx, 'No Team Lead Data Available', 'Please ensure sales team lead data (cold/warm/hot) exists in Firebase.');
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

    // Create simple bar chart with lead type breakdown
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: processedData.teams,
            datasets: [
                {
                    label: 'Cold Leads',
                    data: processedData.coldLeads,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: 'Warm Leads',
                    data: processedData.warmLeads,
                    backgroundColor: 'rgba(251, 191, 36, 0.8)', // yellow/orange
                    borderColor: 'rgba(251, 191, 36, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: 'Hot Leads',
                    data: processedData.hotLeads,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)', // red
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                    borderRadius: 6
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
                    text: 'Lead Performance by Sales Team (Cold/Warm/Hot) - Bar Chart',
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
                        title: function(tooltipItems) {
                            const teamIndex = tooltipItems[0].dataIndex;
                            const team = processedData.teams[teamIndex];
                            return `👤 Team: ${team}`;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            
                            return `${datasetLabel}: ${value} leads`;
                        },
                        afterBody: function(tooltipItems) {
                            const teamIndex = tooltipItems[0].dataIndex;
                            const cold = processedData.coldLeads[teamIndex] || 0;
                            const warm = processedData.warmLeads[teamIndex] || 0;
                            const hot = processedData.hotLeads[teamIndex] || 0;
                            const totalLeads = cold + warm + hot;
                            
                            return [
                                '',
                                `📊 Total Leads: ${totalLeads}`,
                                `❄️ Cold: ${cold} leads (${totalLeads > 0 ? ((cold / totalLeads) * 100).toFixed(1) : 0}%)`,
                                `🔥 Hot Rate: ${totalLeads > 0 ? ((hot / totalLeads) * 100).toFixed(1) : 0}%`,
                                `📈 Conversion: Cold → Warm → Hot`
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
                        maxRotation: 0
                    },
                    title: {
                        display: true,
                        text: 'Sales Team',
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
                            return Math.round(value) + ' leads';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Number of Leads',
                        color: '#94a3b8',
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

    console.log('✅ Marketing Timeline chart created successfully as BAR CHART');
    console.log('📊 Chart Configuration:', {
        type: 'bar',
        datasets: chart.data.datasets.length,
        datasetTypes: chart.data.datasets.map(d => d.label),
        teams: processedData.teams.length,
        persistent: true
    });
    
    // Store for global access
    window.marketingTimelineChart = chart;
    
    return chart;
}

function processTimelineData(data) {
    console.log('🔄 Processing real Firebase data for team lead breakdown...');
    console.log('📊 Available data:', {
        marketing: data.marketing?.length || 0,
        salesteam: data.salesteam?.length || 0
    });
    
    const teamData = {};
    
    // 1. Process salesteam lead data with cold/warm/hot breakdown
    if (data.salesteam && data.salesteam.length > 0) {
        console.log('📊 Processing lead data by team...');
        
        data.salesteam
            .filter(item => item.type === 'lead' || item.type === 'lead_semasa')
            .forEach((item) => {
                const team = item.team || item.agent || item.agent_name || 'Unknown Team';
                
                if (!teamData[team]) {
                    teamData[team] = {
                        coldLeads: 0,
                        warmLeads: 0,
                        hotLeads: 0,
                        marketingCost: 0,
                        entries: 0
                    };
                }
                
                // Get lead counts
                const coldCount = parseInt(item.cold) || 0;
                const warmCount = parseInt(item.warm) || 0;
                const hotCount = parseInt(item.hot) || 0;
                
                teamData[team].coldLeads += coldCount;
                teamData[team].warmLeads += warmCount;
                teamData[team].hotLeads += hotCount;
                teamData[team].entries++;
                
                console.log(`👤 ${team}: Cold=${coldCount}, Warm=${warmCount}, Hot=${hotCount}`);
            });
    }
    
    // 2. Process marketing cost data by team
    if (data.marketing && data.marketing.length > 0) {
        console.log('💰 Processing marketing cost by team...');
        
        data.marketing
            .filter(item => item.type === 'lead_semasa' || item.spend > 0)
            .forEach((item) => {
                const team = item.team_sale || item.team || 'Unknown Team';
                
                // Get spend amount
                let spend = 0;
                if (item.spend) spend = parseFloat(item.spend);
                else if (item.budget) spend = parseFloat(item.budget);
                else if (item.cost) spend = parseFloat(item.cost);
                else if (item.amount) spend = parseFloat(item.amount);
                
                if (spend > 0) {
                    if (!teamData[team]) {
                        teamData[team] = {
                            coldLeads: 0,
                            warmLeads: 0,
                            hotLeads: 0,
                            marketingCost: 0,
                            entries: 0
                        };
                    }
                    
                    teamData[team].marketingCost += spend;
                    console.log(`💰 ${team}: Cost += RM ${spend} (total: RM ${teamData[team].marketingCost})`);
                }
            });
    }
    
    // 3. Prepare chart data arrays
    const teams = Object.keys(teamData);
    console.log(`👥 Found ${teams.length} teams:`, teams);
    
    if (teams.length === 0) {
        console.warn('⚠️ No team data found!');
        return { teams: [] };
    }
    
    const chartData = {
        teams: teams,
        coldLeads: teams.map(team => teamData[team].coldLeads),
        warmLeads: teams.map(team => teamData[team].warmLeads),
        hotLeads: teams.map(team => teamData[team].hotLeads),
        teamCosts: teams.map(team => teamData[team].marketingCost)
    };
    
    console.log('📊 Processed team lead breakdown:', {
        teams: chartData.teams.length,
        totalCold: chartData.coldLeads.reduce((a, b) => a + b, 0),
        totalWarm: chartData.warmLeads.reduce((a, b) => a + b, 0),
        totalHot: chartData.hotLeads.reduce((a, b) => a + b, 0),
        totalCost: chartData.teamCosts.reduce((a, b) => a + b, 0)
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