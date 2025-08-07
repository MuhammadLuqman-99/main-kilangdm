// Professional Chart Configuration for KilangDM Dashboard
// Clean, readable, and contextually appropriate chart types

// ===================================================
// GLOBAL CHART DEFAULTS
// ===================================================

// Set professional defaults for all charts
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#cbd5e1'; // text-secondary
    Chart.defaults.backgroundColor = 'transparent';
    Chart.defaults.borderColor = 'rgba(59, 130, 246, 0.2)';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 20;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
    Chart.defaults.plugins.tooltip.titleColor = '#f8fafc';
    Chart.defaults.plugins.tooltip.bodyColor = '#cbd5e1';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(59, 130, 246, 0.3)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 12;
}

// ===================================================
// CHART COLOR SCHEMES
// ===================================================

const ChartColors = {
    primary: ['#3b82f6', '#1d4ed8', '#2563eb', '#1e40af'],
    success: ['#22c55e', '#16a34a', '#15803d', '#166534'],
    warning: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
    error: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
    purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
    gradient: {
        blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        green: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        orange: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    rainbow: [
        '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
    ]
};

// ===================================================
// PROFESSIONAL CHART CONFIGURATIONS
// ===================================================

const ProfessionalChartConfig = {
    
    // Sales Trend Chart - Line Chart with Area Fill
    salesTrend: {
        type: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 20,
                        color: '#cbd5e1'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': RM ' + 
                                   context.raw.toLocaleString('ms-MY');
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        maxTicksLimit: 7
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return 'RM ' + value.toLocaleString('ms-MY', {
                                notation: 'compact',
                                compactDisplay: 'short'
                            });
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 3,
                    tension: 0.4
                },
                point: {
                    radius: 5,
                    hoverRadius: 8,
                    borderWidth: 2
                }
            }
        }
    },

    // Lead Sources - Doughnut Chart
    leadSources: {
        type: 'doughnut',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return context.label + ': ' + context.raw + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            elements: {
                arc: {
                    borderWidth: 2,
                    borderColor: '#0f172a'
                }
            }
        }
    },

    // Revenue by Channel - Bar Chart
    revenueByChannel: {
        type: 'bar',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Revenue: RM ' + context.raw.toLocaleString('ms-MY');
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return 'RM ' + value.toLocaleString('ms-MY', {
                                notation: 'compact'
                            });
                        }
                    }
                }
            },
            elements: {
                bar: {
                    borderRadius: 8,
                    borderSkipped: false
                }
            }
        }
    },

    // Top Performers - Horizontal Bar Chart
    topPerformers: {
        type: 'bar',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Sales: RM ' + context.raw.toLocaleString('ms-MY');
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return 'RM ' + value.toLocaleString('ms-MY', {
                                notation: 'compact'
                            });
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            },
            elements: {
                bar: {
                    borderRadius: 6,
                    borderSkipped: false
                }
            }
        }
    },

    // Marketing ROI - Combined Chart
    marketingROI: {
        type: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return 'Spend: RM ' + context.raw.toLocaleString('ms-MY');
                            } else {
                                return 'ROAS: ' + context.raw.toFixed(2) + 'x';
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return 'RM ' + value.toLocaleString('ms-MY', {
                                notation: 'compact'
                            });
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(34, 197, 94, 0.1)'
                    },
                    ticks: {
                        color: '#22c55e',
                        callback: function(value) {
                            return value.toFixed(1) + 'x';
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 3,
                    tension: 0.4
                },
                point: {
                    radius: 4,
                    hoverRadius: 7
                }
            }
        }
    }
};

// ===================================================
// CHART UPDATE FUNCTIONS
// ===================================================

function updateSalesTrendChart(data) {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx || !data) return;

    const salesData = data.orders || [];
    const last30Days = getLast30Days();
    
    const dailySales = last30Days.map(date => {
        const dayData = salesData.filter(sale => {
            const saleDate = new Date(sale.date || sale.timestamp?.toDate?.() || sale.created_at);
            return saleDate.toDateString() === date.toDateString();
        });
        
        return dayData.reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0);
    });

    const chart = new Chart(ctx, {
        ...ProfessionalChartConfig.salesTrend,
        data: {
            labels: last30Days.map(date => date.toLocaleDateString('ms-MY', { 
                month: 'short', 
                day: 'numeric' 
            })),
            datasets: [{
                label: 'Daily Sales',
                data: dailySales,
                borderColor: ChartColors.primary[0],
                backgroundColor: ChartColors.primary[0] + '20',
                fill: true,
                pointBackgroundColor: ChartColors.primary[0],
                pointBorderColor: '#ffffff'
            }, {
                label: 'Target',
                data: new Array(30).fill(500), // Daily target of RM 500
                borderColor: ChartColors.success[0],
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                pointRadius: 0,
                pointHoverRadius: 0
            }]
        }
    });

    return chart;
}

function updateLeadSourcesChart(data) {
    const ctx = document.getElementById('leadsChart');
    if (!ctx || !data) return;

    const leadSources = {};
    
    // Combine marketing and sales team leads
    const allLeads = [
        ...(data.marketing || []),
        ...(data.salesteam || [])
    ];
    
    allLeads.forEach(item => {
        const source = item.source || item.channel || 'Other';
        leadSources[source] = (leadSources[source] || 0) + 1;
    });

    const labels = Object.keys(leadSources);
    const values = Object.values(leadSources);
    
    const chart = new Chart(ctx, {
        ...ProfessionalChartConfig.leadSources,
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ChartColors.rainbow.slice(0, labels.length),
                borderColor: '#0f172a',
                borderWidth: 2
            }]
        }
    });

    return chart;
}

function updateChannelChart(data) {
    const ctx = document.getElementById('channelChart');
    if (!ctx || !data) return;

    const channelRevenue = {};
    
    (data.orders || []).forEach(order => {
        const channel = order.channel || 'Direct';
        const amount = parseFloat(order.amount) || 0;
        channelRevenue[channel] = (channelRevenue[channel] || 0) + amount;
    });

    const labels = Object.keys(channelRevenue);
    const values = Object.values(channelRevenue);
    
    const chart = new Chart(ctx, {
        ...ProfessionalChartConfig.revenueByChannel,
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ChartColors.primary.slice(0, labels.length),
                borderColor: ChartColors.primary[0],
                borderWidth: 2
            }]
        }
    });

    return chart;
}

function updateTeamChart(data) {
    const ctx = document.getElementById('teamChart');
    if (!ctx || !data) return;

    const teamPerformance = {};
    
    (data.salesteam || []).forEach(entry => {
        const agent = entry.agent_name || 'Unknown';
        const amount = parseFloat(entry.amount) || 0;
        teamPerformance[agent] = (teamPerformance[agent] || 0) + amount;
    });

    // Sort by performance and take top 5
    const sorted = Object.entries(teamPerformance)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const labels = sorted.map(([name]) => name);
    const values = sorted.map(([, value]) => value);
    
    const chart = new Chart(ctx, {
        ...ProfessionalChartConfig.topPerformers,
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ChartColors.success.slice(0, labels.length),
                borderColor: ChartColors.success[0],
                borderWidth: 2
            }]
        }
    });

    return chart;
}

function updateMarketingROIChart(data) {
    const ctx = document.getElementById('costPerLeadChart');
    if (!ctx || !data) return;

    const last7Days = getLast7Days();
    const spendData = [];
    const roasData = [];
    
    last7Days.forEach(date => {
        const dayMarketing = (data.marketing || []).filter(item => {
            const itemDate = new Date(item.date || item.timestamp?.toDate?.());
            return itemDate.toDateString() === date.toDateString();
        });
        
        const dailySpend = dayMarketing.reduce((sum, item) => 
            sum + (parseFloat(item.spend) || 0), 0);
        const dailyRevenue = dayMarketing.reduce((sum, item) => 
            sum + (parseFloat(item.revenue) || 0), 0);
        const roas = dailySpend > 0 ? dailyRevenue / dailySpend : 0;
        
        spendData.push(dailySpend);
        roasData.push(roas);
    });
    
    const chart = new Chart(ctx, {
        ...ProfessionalChartConfig.marketingROI,
        data: {
            labels: last7Days.map(date => date.toLocaleDateString('ms-MY', { 
                month: 'short', 
                day: 'numeric' 
            })),
            datasets: [{
                label: 'Ad Spend',
                data: spendData,
                borderColor: ChartColors.error[0],
                backgroundColor: ChartColors.error[0] + '20',
                fill: true,
                yAxisID: 'y'
            }, {
                label: 'ROAS',
                data: roasData,
                borderColor: ChartColors.success[0],
                backgroundColor: ChartColors.success[0],
                type: 'line',
                fill: false,
                yAxisID: 'y1',
                pointRadius: 6
            }]
        }
    });

    return chart;
}

// ===================================================
// UTILITY FUNCTIONS
// ===================================================

function getLast30Days() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
    }
    return days;
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
    }
    return days;
}

// ===================================================
// EXPORT FOR GLOBAL USE
// ===================================================

window.ProfessionalCharts = {
    updateSalesTrendChart,
    updateLeadSourcesChart,
    updateChannelChart,
    updateTeamChart,
    updateMarketingROIChart,
    ChartColors,
    ProfessionalChartConfig
};

console.log('📊 Professional Chart Configuration loaded!');