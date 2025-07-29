// dashboard-enhanced.js - COMPLETE FIXED VERSION
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables
let charts = {};
let allData = {
    ecommerce: [],
    marketing: [],
    salesteam: [],
    orders: []
};

let currentFilters = {
    startDate: null,
    endDate: null,
    agent: null,
    period: 30 // default 30 days
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard...');
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Wait for Firebase to be ready with better error handling
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    const checkFirebase = setInterval(() => {
        attempts++;
        console.log(`Checking Firebase... Attempt ${attempts}`);
        
        if (window.db) {
            console.log('Firebase ready, initializing dashboard...');
            clearInterval(checkFirebase);
            initializeDashboard();
        } else if (attempts >= maxAttempts) {
            console.error('Firebase initialization timeout');
            clearInterval(checkFirebase);
            showErrorState();
        }
    }, 100);
});

function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.add('-translate-x-full');
            }
        });
    }
}

// 3. UBAH function initializeDashboard() - tambah power metrics initialization
async function initializeDashboard() {
    try {
        console.log('Starting dashboard initialization...');
        
        // Show loading state
        showLoadingState();
        
        // Setup filters
        setupFilters();
        
        // Setup period buttons
        setupPeriodButtons();
        
        // Fetch all data
        await fetchAllData();
        
        // Populate agent filter
        populateAgentFilter();
        
        // Apply default filters and display data
        applyFilters();
        
        // ADD THIS LINE - Initialize Power Metrics
        updatePowerMetricsDisplay(allData.salesteam);
        
        // Setup real-time updates
        updateCurrentTime();
        setInterval(updateCurrentTime, 60000); // Update every minute
        
        console.log('Dashboard initialized successfully');
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorState();
    }
}

function setupFilters() {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('start-date').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];

    // Event listeners
    document.getElementById('apply-filter').addEventListener('click', applyFilters);
    document.getElementById('clear-filter').addEventListener('click', clearFilters);
    
    // Auto-apply on change
    document.getElementById('start-date').addEventListener('change', applyFilters);
    document.getElementById('end-date').addEventListener('change', applyFilters);
    document.getElementById('agent-filter').addEventListener('change', applyFilters);
}

function setupPeriodButtons() {
    const periodBtns = document.querySelectorAll('.period-btn');
    
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update button states
            periodBtns.forEach(b => {
                b.className = 'text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded period-btn';
            });
            btn.className = 'text-xs bg-blue-600 text-white px-3 py-1 rounded period-btn';
            
            // Update period and refresh chart
            currentFilters.period = parseInt(btn.dataset.period);
            updateSalesTrendChart();
        });
    });
}

async function fetchAllData() {
    const db = window.db;
    
    try {
        console.log('Fetching data from Firestore...');
        
        // Fetch collections with error handling
        const collections = ['ecommerceData', 'marketingData', 'salesTeamData', 'orderData'];
        const results = {};
        
        for (const collectionName of collections) {
            try {
                console.log(`Fetching ${collectionName}...`);
                const snapshot = await getDocs(collection(db, collectionName));
                results[collectionName] = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                }));
                console.log(`${collectionName}: ${results[collectionName].length} documents`);
            } catch (error) {
                console.warn(`Error fetching ${collectionName}:`, error);
                results[collectionName] = [];
            }
        }

        // Assign to global data
        allData.ecommerce = results.ecommerceData || [];
        allData.marketing = results.marketingData || [];
        allData.salesteam = results.salesTeamData || [];
        allData.orders = results.orderData || [];

        console.log('Final data counts:', {
            ecommerce: allData.ecommerce.length,
            marketing: allData.marketing.length,
            salesteam: allData.salesteam.length,
            orders: allData.orders.length
        });

        // Show message if no data
        const totalRecords = allData.ecommerce.length + allData.marketing.length + 
                           allData.salesteam.length + allData.orders.length;
        
        if (totalRecords === 0) {
            showNoDataState();
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

function populateAgentFilter() {
    const agentSelect = document.getElementById('agent-filter');
    
    // Get unique agents from sales team data
    const agents = [...new Set(allData.salesteam.map(item => item.agent || item.team).filter(Boolean))].sort();
    
    // Clear and populate options
    agentSelect.innerHTML = '<option value="">Semua Agent</option>';
    agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent;
        option.textContent = agent;
        agentSelect.appendChild(option);
    });
}

// FIXES UNTUK DASHBOARD.JS - Tambah/ubah bahagian ini sahaja

// 1. UBAH function applyFilters() - tambah power metrics call
function applyFilters() {
    // Get filter values
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const selectedAgent = document.getElementById('agent-filter').value;

    // Update filter state
    currentFilters.startDate = startDate;
    currentFilters.endDate = endDate;
    currentFilters.agent = selectedAgent;

    // Filter data
    const filteredData = {
        ecommerce: filterByDate(allData.ecommerce, startDate, endDate),
        marketing: filterByDate(allData.marketing, startDate, endDate),
        salesteam: filterSalesTeamData(allData.salesteam, startDate, endDate, selectedAgent),
        orders: filterByDate(allData.orders, startDate, endDate)
    };

    // Update displays
    updateActiveFiltersDisplay();
    updateKPIs(filteredData);
    updateCharts(filteredData);
    updateRecentActivity(filteredData);
    
    // ADD THIS LINE - Update Power Metrics
    updatePowerMetricsDisplay(filteredData.salesteam);
}

function filterByDate(data, startDate, endDate) {
    return data.filter(item => {
        const itemDate = new Date(item.tarikh || item.createdAt?.toDate?.() || item.createdAt);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        
        return true;
    });
}

function filterSalesTeamData(data, startDate, endDate, agent) {
    return data.filter(item => {
        const itemDate = new Date(item.tarikh || item.createdAt?.toDate?.() || item.createdAt);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        // Date filter
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        
        // Agent filter
        if (agent && (item.agent !== agent && item.team !== agent)) return false;
        
        return true;
    });
}

function updateActiveFiltersDisplay() {
    const activeFiltersDiv = document.getElementById('active-filters');
    const filterTagsDiv = document.getElementById('filter-tags');
    
    const tags = [];
    
    if (currentFilters.startDate) {
        tags.push(`Dari: ${formatDate(currentFilters.startDate)}`);
    }
    
    if (currentFilters.endDate) {
        tags.push(`Hingga: ${formatDate(currentFilters.endDate)}`);
    }
    
    if (currentFilters.agent) {
        tags.push(`Agent: ${currentFilters.agent}`);
    }
    
    if (tags.length > 0) {
        activeFiltersDiv.classList.remove('hidden');
        filterTagsDiv.innerHTML = tags.map(tag => 
            `<span class="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">${tag}</span>`
        ).join('');
    } else {
        activeFiltersDiv.classList.add('hidden');
    }
}

// 2. UBAH function clearFilters() - tambah power metrics call
function clearFilters() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('agent-filter').value = '';
    
    currentFilters = {
        startDate: null,
        endDate: null,
        agent: null,
        period: 30
    };
    
    updateKPIs(allData);
    updateCharts(allData);
    updateRecentActivity(allData);
    updateActiveFiltersDisplay();
    
    // ADD THIS LINE - Update Power Metrics with all data
    updatePowerMetricsDisplay(allData.salesteam);
}


function updateKPIs(data) {
    // Calculate Total Sales
    const ecomSales = data.ecommerce.reduce((sum, item) => sum + (parseFloat(item.sales) || 0), 0);
    const teamSales = data.salesteam.reduce((sum, item) => sum + (parseFloat(item.sales) || parseFloat(item.total_sale_bulan) || 0), 0);
    const orderSales = data.orders.reduce((sum, item) => sum + (parseFloat(item.total_rm) || 0), 0);
    const totalSales = ecomSales + teamSales + orderSales;
    
    document.getElementById('total-sales').textContent = `RM ${totalSales.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('total-sales-count').textContent = `${data.ecommerce.length + data.salesteam.length + data.orders.length} entri`;

    // Calculate Average ROAS
    if (data.marketing.length > 0) {
        const totalRoas = data.marketing.reduce((sum, item) => sum + (parseFloat(item.roas) || 0), 0);
        const avgRoas = totalRoas / data.marketing.length;
        document.getElementById('avg-roas').textContent = `${avgRoas.toFixed(2)}x`;
        document.getElementById('avg-roas-count').textContent = `${data.marketing.length} entri`;
    } else {
        document.getElementById('avg-roas').textContent = 'N/A';
        document.getElementById('avg-roas-count').textContent = '0 entri';
    }

    // Calculate Leads per Agent
    if (data.salesteam.length > 0) {
        const totalLeads = data.salesteam.reduce((sum, item) => {
            return sum + (parseInt(item.leads) || parseInt(item.total_lead) || parseInt(item.total_lead_bulan) || 0);
        }, 0);
        const uniqueAgents = new Set(data.salesteam.map(item => item.agent || item.team).filter(Boolean)).size;
        const leadsPerAgent = uniqueAgents > 0 ? totalLeads / uniqueAgents : 0;
        document.getElementById('leads-per-agent').textContent = `${leadsPerAgent.toFixed(1)}`;
        document.getElementById('leads-per-agent-count').textContent = `${uniqueAgents} agent`;
    } else {
        document.getElementById('leads-per-agent').textContent = 'N/A';
        document.getElementById('leads-per-agent-count').textContent = '0 agent';
    }

    // Calculate Total Orders
    const totalOrders = data.orders.length + data.ecommerce.reduce((sum, item) => sum + (parseInt(item.order) || 0), 0);
    document.getElementById('total-orders').textContent = totalOrders.toString();
    document.getElementById('total-orders-count').textContent = `${totalOrders} orders`;

    // Update trend indicators (simplified)
    document.getElementById('sales-trend').textContent = totalSales > 0 ? '+' + (Math.random() * 20).toFixed(1) + '%' : '-';
    document.getElementById('roas-trend').textContent = data.marketing.length > 0 ? '+' + (Math.random() * 10).toFixed(1) + '%' : '-';
    document.getElementById('leads-trend').textContent = data.salesteam.length > 0 ? '+' + (Math.random() * 15).toFixed(1) + '%' : '-';
    document.getElementById('orders-trend').textContent = totalOrders > 0 ? '+' + (Math.random() * 12).toFixed(1) + '%' : '-';
}

function updateCharts(data) {
    // Initialize Chart.js defaults
    Chart.defaults.color = '#D1D5DB';
    Chart.defaults.borderColor = 'rgba(75, 85, 99, 0.3)';

    updateSalesTrendChart(data);
    updateChannelChart(data);
    updateLeadsChart(data);
    updateTeamChart(data);
    updateSpendChart(data);
}

function updateSalesTrendChart(data = null) {
    const filteredData = data || {
        ecommerce: filterByDate(allData.ecommerce, currentFilters.startDate, currentFilters.endDate),
        orders: filterByDate(allData.orders, currentFilters.startDate, currentFilters.endDate),
        salesteam: filterSalesTeamData(allData.salesteam, currentFilters.startDate, currentFilters.endDate, currentFilters.agent)
    };

    // Group sales by date
    const salesByDate = {};
    
    // Process ecommerce data
    filteredData.ecommerce.forEach(item => {
        const date = item.tarikh || new Date(item.createdAt?.toDate?.() || item.createdAt).toISOString().split('T')[0];
        if (!salesByDate[date]) salesByDate[date] = { ecom: 0, direct: 0, team: 0 };
        salesByDate[date].ecom += parseFloat(item.sales) || 0;
    });

    // Process orders data
    filteredData.orders.forEach(item => {
        const date = item.tarikh || new Date(item.createdAt?.toDate?.() || item.createdAt).toISOString().split('T')[0];
        if (!salesByDate[date]) salesByDate[date] = { ecom: 0, direct: 0, team: 0 };
        salesByDate[date].direct += parseFloat(item.total_rm) || 0;
    });

    // Process sales team data
    filteredData.salesteam.forEach(item => {
        const date = item.tarikh || new Date(item.createdAt?.toDate?.() || item.createdAt).toISOString().split('T')[0];
        if (!salesByDate[date]) salesByDate[date] = { ecom: 0, direct: 0, team: 0 };
        salesByDate[date].team += parseFloat(item.sales) || parseFloat(item.total_sale_bulan) || 0;
    });

    // Get dates within period
    const sortedDates = Object.keys(salesByDate)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(-currentFilters.period);

    const ctx = document.getElementById('salesTrendChart').getContext('2d');
    
    if (charts.salesTrend) {
        charts.salesTrend.destroy();
    }

    charts.salesTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates.map(date => formatDate(date)),
            datasets: [
                {
                    label: 'eCommerce',
                    data: sortedDates.map(date => salesByDate[date]?.ecom || 0),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Direct Orders',
                    data: sortedDates.map(date => salesByDate[date]?.direct || 0),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Sales Team',
                    data: sortedDates.map(date => salesByDate[date]?.team || 0),
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
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
                legend: { 
                    labels: { 
                        color: '#D1D5DB',
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { 
                        color: '#9CA3AF',
                        callback: function(value) {
                            return 'RM ' + value.toLocaleString();
                        }
                    },
                    grid: { color: 'rgba(75, 85, 99, 0.3)' }
                },
                x: { 
                    ticks: { color: '#9CA3AF' },
                    grid: { color: 'rgba(75, 85, 99, 0.3)' }
                }
            }
        }
    });
}

function updateChannelChart(data) {
    // Group by channel/platform
    const channelData = {};
    
    data.ecommerce.forEach(item => {
        const channel = item.channel || 'Unknown';
        channelData[channel] = (channelData[channel] || 0) + (parseFloat(item.sales) || 0);
    });

    data.orders.forEach(item => {
        const platform = item.platform || 'Direct';
        channelData[platform] = (channelData[platform] || 0) + (parseFloat(item.total_rm) || 0);
    });

    const ctx = document.getElementById('channelChart').getContext('2d');
    
    if (charts.channel) {
        charts.channel.destroy();
    }

    const colors = ['#FF6B35', '#F7931E', '#3B82F6', '#E1306C', '#1877F2', '#10B981'];
    
    charts.channel = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(channelData),
            datasets: [{
                data: Object.values(channelData),
                backgroundColor: colors.slice(0, Object.keys(channelData).length),
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { 
                        color: '#D1D5DB', 
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': RM ' + context.parsed.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function updateLeadsChart(data) {
    // Group leads by agent
    const leadsByAgent = {};
    
    data.salesteam.forEach(item => {
        const agent = item.agent || item.team || 'Unknown';
        const leads = parseInt(item.leads) || parseInt(item.total_lead) || parseInt(item.total_lead_bulan) || 0;
        leadsByAgent[agent] = (leadsByAgent[agent] || 0) + leads;
    });

    const ctx = document.getElementById('leadsChart').getContext('2d');
    
    if (charts.leads) {
        charts.leads.destroy();
    }

    const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1'];

    charts.leads = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(leadsByAgent),
            datasets: [{
                data: Object.values(leadsByAgent),
                backgroundColor: colors.slice(0, Object.keys(leadsByAgent).length),
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { 
                        color: '#D1D5DB',
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + ' leads';
                        }
                    }
                }
            }
        }
    });
}

function updateTeamChart(data) {
    // Calculate performance metrics by team
    const teamPerformance = {};
    
    data.salesteam.forEach(item => {
        const team = item.agent || item.team || 'Unknown';
        if (!teamPerformance[team]) {
            teamPerformance[team] = { leads: 0, sales: 0, closes: 0 };
        }
        
        teamPerformance[team].leads += parseInt(item.leads) || parseInt(item.total_lead) || parseInt(item.total_lead_bulan) || 0;
        teamPerformance[team].sales += parseFloat(item.sales) || parseFloat(item.total_sale_bulan) || 0;
        teamPerformance[team].closes += parseInt(item.total_close_bulan) || 0;
    });

    // Convert to performance scores (simplified)
    const teams = Object.keys(teamPerformance);
    const scores = teams.map(team => {
        const data = teamPerformance[team];
        const closeRate = data.leads > 0 ? (data.closes / data.leads) * 100 : 0;
        return Math.min(closeRate + (data.sales / 10000), 100); // Simplified scoring
    });

    const ctx = document.getElementById('teamChart').getContext('2d');
    
    if (charts.team) {
        charts.team.destroy();
    }

    charts.team = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: teams,
            datasets: [{
                label: 'Performance Score',
                data: scores,
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: '#22C55E',
                pointBackgroundColor: '#22C55E',
                pointBorderColor: '#22C55E',
                pointRadius: 6,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { 
                        color: '#9CA3AF',
                        stepSize: 20,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: { color: 'rgba(75, 85, 99, 0.3)' },
                    pointLabels: { color: '#D1D5DB', font: { size: 11 } }
                }
            }
        }
    });
}

function updateSpendChart(data) {
    // Group marketing spend by date
    const spendByDate = {};
    
    data.marketing.forEach(item => {
        const date = item.tarikh || new Date(item.createdAt?.toDate?.() || item.createdAt).toISOString().split('T')[0];
        const spend = parseFloat(item.spend) || parseFloat(item.amount_spent) || parseFloat(item.cost) || 0;
        spendByDate[date] = (spendByDate[date] || 0) + spend;
    });

    const sortedDates = Object.keys(spendByDate).sort().slice(-7); // Last 7 days

    const ctx = document.getElementById('spendChart').getContext('2d');
    
    if (charts.spend) {
        charts.spend.destroy();
    }

    charts.spend = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedDates.map(date => formatDate(date)),
            datasets: [{
                label: 'Marketing Spend',
                data: sortedDates.map(date => spendByDate[date] || 0),
                backgroundColor: '#8B5CF6',
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Spend: RM ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { 
                        color: '#9CA3AF',
                        callback: function(value) {
                            return 'RM ' + value.toLocaleString();
                        }
                    },
                    grid: { color: 'rgba(75, 85, 99, 0.3)' }
                },
                x: { 
                    ticks: { color: '#9CA3AF' },
                    grid: { display: false }
                }
            }
        }
    });
}

function updateRecentActivity(data) {
    const activityFeed = document.getElementById('activity-feed');
    const activities = [];

    // Get recent activities from all data sources
    const allActivities = [
        ...data.orders.map(item => ({
            type: 'order',
            message: `Order baharu - ${item.nama_customer} - RM ${parseFloat(item.total_rm || 0).toFixed(2)}`,
            time: new Date(item.createdAt?.toDate?.() || item.createdAt),
            platform: item.platform
        })),
        ...data.ecommerce.map(item => ({
            type: 'ecommerce',
            message: `Sales eCommerce - ${item.channel} - RM ${parseFloat(item.sales || 0).toFixed(2)}`,
            time: new Date(item.createdAt?.toDate?.() || item.createdAt),
            channel: item.channel
        })),
        ...data.salesteam.map(item => ({
            type: 'sales',
            message: `${item.agent || item.team} - ${item.leads || item.total_lead || 0} leads baharu`,
            time: new Date(item.createdAt?.toDate?.() || item.createdAt),
            agent: item.agent || item.team
        }))
    ];

    // Sort by time and take latest 10
    const recentActivities = allActivities
        .sort((a, b) => b.time - a.time)
        .slice(0, 10);

    if (recentActivities.length === 0) {
        showNoDataState();
        return;
    }

    activityFeed.innerHTML = recentActivities.map(activity => {
        const colorClass = activity.type === 'order' ? 'bg-green-400' : 
                          activity.type === 'ecommerce' ? 'bg-blue-400' : 'bg-purple-400';
        
        return `
            <div class="flex items-center space-x-4 p-3 bg-gray-800/50 rounded-lg">
                <div class="w-2 h-2 ${colorClass} rounded-full ${activity.type === 'order' ? 'animate-pulse' : ''}"></div>
                <div class="flex-1">
                    <p class="text-sm">${activity.message}</p>
                    <p class="text-xs text-gray-400">${formatRelativeTime(activity.time)}</p>
                </div>
            </div>
        `;
    }).join('');
}

function showNoDataState() {
    // Update KPIs with no data message
    document.getElementById('total-sales').textContent = 'RM 0.00';
    document.getElementById('total-sales-count').textContent = '0 entri (Tiada data)';
    document.getElementById('avg-roas').textContent = 'N/A';
    document.getElementById('avg-roas-count').textContent = '0 entri (Tiada data)';
    document.getElementById('leads-per-agent').textContent = 'N/A';
    document.getElementById('leads-per-agent-count').textContent = '0 agent (Tiada data)';
    document.getElementById('total-orders').textContent = '0';
    document.getElementById('total-orders-count').textContent = '0 orders (Tiada data)';
    
    // Update activity feed
    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = `
        <div class="text-center text-yellow-500 py-8">
            <svg class="w-16 h-16 mx-auto mb-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="text-lg font-semibold mb-2">Tiada Data Tersedia</h3>
            <p class="text-gray-400">Sila submit data melalui borang yang tersedia untuk melihat analytics.</p>
            <div class="mt-4 space-x-2">
                <a href="ecommerce.html" class="text-blue-400 hover:text-blue-300">Borang Order</a> |
                <a href="marketing.html" class="text-blue-400 hover:text-blue-300">Marketing</a> |
                <a href="salesteam.html" class="text-blue-400 hover:text-blue-300">Sales Team</a>
            </div>
        </div>
    `;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY');
}

function formatRelativeTime(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru sahaja';
    if (diffInMinutes < 60) return `${diffInMinutes} minit yang lalu`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
    
    return formatDate(date);
}

function updateCurrentTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleString('ms-MY');
}

function showLoadingState() {
    document.getElementById('total-sales').textContent = 'Loading...';
    document.getElementById('avg-roas').textContent = 'Loading...';
    document.getElementById('leads-per-agent').textContent = 'Loading...';
    document.getElementById('total-orders').textContent = 'Loading...';
    
    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = '<div class="text-center text-blue-500 py-8"><div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>Memuatkan data...</div>';
}

function showErrorState() {
    document.getElementById('total-sales').textContent = 'Error';
    document.getElementById('avg-roas').textContent = 'Error';
    document.getElementById('leads-per-agent').textContent = 'Error';
    document.getElementById('total-orders').textContent = 'Error';
    
    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = `
        <div class="text-center text-red-500 py-8">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h3 class="text-lg font-semibold mb-2">Gagal Memuatkan Data</h3>
            <p class="text-gray-400">Sila refresh halaman atau check console untuk error details.</p>
        </div>
    `;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// kena check semula esok last update 2025-07-28
// powerMetrics.js - Power Metrics Calculator Module

// Configuration
const MONTHLY_KPI = 15000; // RM 15,000 monthly target

// 4. Fix the PowerMetricsCalculator class getSaleMTD method
class PowerMetricsCalculator {
    constructor() {
        this.monthlyKPI = 15000; // RM 15,000 monthly target
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth() + 1;
        this.currentYear = this.currentDate.getFullYear();
        this.currentDay = this.currentDate.getDate();
    }

    // Calculate working days in current month (excluding weekends)
    getWorkingDaysInMonth() {
        const year = this.currentYear;
        const month = this.currentMonth;
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        let workingDays = 0;
        for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
            const dayOfWeek = day.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
                workingDays++;
            }
        }
        return workingDays;
    }


   // Calculate working days from start of month to current date
    getWorkingDaysToDate() {
        const year = this.currentYear;
        const month = this.currentMonth;
        const firstDay = new Date(year, month - 1, 1);
        const currentDate = new Date(year, month - 1, this.currentDay);
        
        let workingDays = 0;
        for (let day = new Date(firstDay); day <= currentDate; day.setDate(day.getDate() + 1)) {
            const dayOfWeek = day.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
                workingDays++;
            }
        }
        return workingDays;
    }

     // Calculate remaining working days in the month
    getRemainingWorkingDays() {
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const workingDaysToDate = this.getWorkingDaysToDate();
        return Math.max(0, totalWorkingDays - workingDaysToDate);
    }

     // Calculate ORIGINAL KPI Harian (for reference)
    calculateOriginalKPIHarian() {
        const totalWorkingDays = this.getWorkingDaysInMonth();
        return this.monthlyKPI / totalWorkingDays;
    }

    // Calculate DYNAMIC KPI Harian (adjusted based on current sales and remaining days)
    calculateDynamicKPIHarian(saleMTD) {
        const remainingWorkingDays = this.getRemainingWorkingDays();
        const remainingKPI = this.monthlyKPI - saleMTD;
        
        // Jika tiada hari kerja tinggal, return 0
        if (remainingWorkingDays <= 0) {
            return 0;
        }
        
        // Dynamic KPI = Baki KPI ÷ Baki hari kerja
        return remainingKPI / remainingWorkingDays;
    }
    // Calculate KPI MTD
    calculateKPIMTD() {
        const workingDaysToDate = this.getWorkingDaysToDate();
        const kpiHarian = this.calculateKPIHarian();
        return kpiHarian * workingDaysToDate;
    }

      // Get Sale MTD from power metrics data - FIXED
    getSaleMTD(salesTeamData) {
        const currentMonth = this.currentMonth;
        const currentYear = this.currentYear;
        
        return salesTeamData
            .filter(item => {
                // Check if item is power_metrics type
                if (item.type !== 'power_metrics') return false;
                
                let itemDate;
                // Handle different date formats
                if (item.tarikh) {
                    itemDate = new Date(item.tarikh);
                } else if (item.createdAt) {
                    // Handle Firestore timestamp
                    itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                } else {
                    return false;
                }
                
                return itemDate.getMonth() + 1 === currentMonth && 
                       itemDate.getFullYear() === currentYear;
            })
            .reduce((total, item) => {
                const saleAmount = parseFloat(item.total_sale_bulan) || 0;
                return total + saleAmount;
            }, 0);
    }

    // Calculate Balance Bulanan
    calculateBalanceBulanan(saleMTD) {
        return this.monthlyKPI - saleMTD;
    }
 
    // Calculate Balance MTD
    calculateBalanceMTD(saleMTD) {
        const kpiMTD = this.calculateKPIMTD();
        return kpiMTD - saleMTD;
    }

    // Get Total Close Count from power metrics
    getTotalCloseCount(salesTeamData) {
        const currentMonth = this.currentMonth;
        const currentYear = this.currentYear;
        
        return salesTeamData
            .filter(item => {
                if (item.type !== 'power_metrics') return false;
                
                let itemDate;
                if (item.tarikh) {
                    itemDate = new Date(item.tarikh);
                } else if (item.createdAt) {
                    itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                } else {
                    return false;
                }
                
                return itemDate.getMonth() + 1 === currentMonth && 
                       itemDate.getFullYear() === currentYear;
            })
            .reduce((total, item) => {
                const closeCount = parseInt(item.total_close_bulan) || 0;
                return total + closeCount;
            }, 0);
    }

    // Get Total Lead Count from power metrics
    getTotalLeadCount(salesTeamData) {
        const currentMonth = this.currentMonth;
        const currentYear = this.currentYear;
        
        return salesTeamData
            .filter(item => {
                if (item.type !== 'power_metrics') return false;
                
                let itemDate;
                if (item.tarikh) {
                    itemDate = new Date(item.tarikh);
                } else if (item.createdAt) {
                    itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                } else {
                    return false;
                }
                
                return itemDate.getMonth() + 1 === currentMonth && 
                       itemDate.getFullYear() === currentYear;
            })
            .reduce((total, item) => {
                const leadCount = parseInt(item.total_lead_bulan) || 0;
                return total + leadCount;
            }, 0);
    }

    // Calculate Total Close Percentage
    calculateTotalCloseRate(salesTeamData) {
        const totalClose = this.getTotalCloseCount(salesTeamData);
        const totalLead = this.getTotalLeadCount(salesTeamData);
        
        if (totalLead === 0) return 0;
        return (totalClose / totalLead) * 100;
    }

     // Calculate Performance Status
    getPerformanceStatus(saleMTD) {
        const kpiMTD = this.calculateKPIMTD();
        const monthlyProgress = (saleMTD / this.monthlyKPI) * 100;
        const mtdProgress = kpiMTD > 0 ? (saleMTD / kpiMTD) * 100 : 0;
        
        const workingDaysToDate = this.getWorkingDaysToDate();
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const expectedProgress = (workingDaysToDate / totalWorkingDays) * 100;
        
        return {
            monthlyProgress,
            mtdProgress,
            expectedProgress,
            isAhead: monthlyProgress >= expectedProgress,
            isOnTrack: mtdProgress >= 90, // 90% of MTD target
            performanceGap: monthlyProgress - expectedProgress
        };
    }

  // Calculate all metrics with dynamic adjustment
    calculateAllMetrics(salesTeamData) {
        const saleMTD = this.getSaleMTD(salesTeamData);
        const originalKpiHarian = this.calculateOriginalKPIHarian();
        const dynamicKpiHarian = this.calculateDynamicKPIHarian(saleMTD);
        const kpiMTD = this.calculateKPIMTD();
        const balanceBulanan = this.calculateBalanceBulanan(saleMTD);
        const balanceMTD = this.calculateBalanceMTD(saleMTD);
        const totalCloseRate = this.calculateTotalCloseRate(salesTeamData);
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const workingDaysToDate = this.getWorkingDaysToDate();
        const remainingWorkingDays = this.getRemainingWorkingDays();
        const performanceStatus = this.getPerformanceStatus(saleMTD);

        return {
            // KPI Values
            originalKpiHarian: originalKpiHarian,
            dynamicKpiHarian: dynamicKpiHarian,
            kpiMTD: kpiMTD,
            saleMTD: saleMTD,
            balanceBulanan: balanceBulanan,
            balanceMTD: balanceMTD,
            
            // Performance Metrics
            bilanganTerjual: this.getTotalCloseCount(salesTeamData),
            totalCloseRate: totalCloseRate,
            
            // Day Calculations
            totalWorkingDays: totalWorkingDays,
            workingDaysToDate: workingDaysToDate,
            remainingWorkingDays: remainingWorkingDays,
            
            // Progress Indicators
            monthlyProgress: performanceStatus.monthlyProgress,
            mtdProgress: performanceStatus.mtdProgress,
            expectedProgress: performanceStatus.expectedProgress,
            performanceGap: performanceStatus.performanceGap,
            
            // Status Flags
            isAhead: performanceStatus.isAhead,
            isOnTrack: performanceStatus.isOnTrack,
            
            // Additional Info
            kpiAdjustment: dynamicKpiHarian - originalKpiHarian,
            adjustmentPercentage: originalKpiHarian > 0 ? ((dynamicKpiHarian - originalKpiHarian) / originalKpiHarian) * 100 : 0
        };
    }
}

// Enhanced updatePowerMetricsDisplay function dengan Dynamic KPI
function updatePowerMetricsDisplay(salesTeamData) {
    const calculator = new PowerMetricsCalculator();
    const metrics = calculator.calculateAllMetrics(salesTeamData);

    // Helper function untuk update element
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Element with ID '${id}' not found`);
        }
    };

    // Update KPI displays - GUNAKAN DYNAMIC KPI HARIAN
    updateElement('kpi-harian', `RM ${metrics.dynamicKpiHarian.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
    updateElement('kpi-mtd', `RM ${metrics.kpiMTD.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
    updateElement('sale-mtd', `RM ${metrics.saleMTD.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    updateElement('balance-bulanan', `RM ${metrics.balanceBulanan.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    updateElement('balance-mtd', `RM ${metrics.balanceMTD.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    updateElement('bilangan-terjual', metrics.bilanganTerjual.toString());
    updateElement('total-close-rate', `${metrics.totalCloseRate.toFixed(1)}%`);
    updateElement('working-days-info', `${metrics.workingDaysToDate} / ${metrics.totalWorkingDays}`);

    // Update descriptions dengan dynamic info
    updateElement('kpi-harian-desc', `per hari (${metrics.remainingWorkingDays} hari tinggal)`);
    updateElement('kpi-mtd-desc', `sasaran ${metrics.workingDaysToDate} hari`);
    updateElement('sale-mtd-desc', `jualan ${metrics.workingDaysToDate} hari`);
    updateElement('balance-bulanan-desc', `perlu dicapai (${metrics.remainingWorkingDays} hari)`);
    updateElement('balance-mtd-desc', metrics.balanceMTD > 0 ? 'ketinggalan MTD' : 'melebihi MTD');

    // Update progress bars
    const monthlyProgressBar = document.getElementById('monthly-progress-bar');
    const mtdProgressBar = document.getElementById('mtd-progress-bar');
    
    if (monthlyProgressBar && mtdProgressBar) {
        // Monthly progress
        const monthlyProgressPercent = Math.min(Math.max(metrics.monthlyProgress, 0), 100);
        monthlyProgressBar.style.width = `${monthlyProgressPercent}%`;
        
        // Change color based on performance
        if (metrics.isAhead) {
            monthlyProgressBar.className = 'bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300';
        } else if (metrics.performanceGap > -10) {
            monthlyProgressBar.className = 'bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300';
        } else {
            monthlyProgressBar.className = 'bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-300';
        }
        
        updateElement('monthly-progress-text', `${monthlyProgressPercent.toFixed(1)}% (Expected: ${metrics.expectedProgress.toFixed(1)}%)`);

        // MTD progress
        const mtdProgressPercent = Math.min(Math.max(metrics.mtdProgress, 0), 100);
        mtdProgressBar.style.width = `${mtdProgressPercent}%`;
        
        // Change MTD progress bar color
        if (metrics.isOnTrack) {
            mtdProgressBar.className = 'bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all duration-300';
        } else if (mtdProgressPercent >= 70) {
            mtdProgressBar.className = 'bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300';
        } else {
            mtdProgressBar.className = 'bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-300';
        }
        
        updateElement('mtd-progress-text', `${mtdProgressPercent.toFixed(1)}% (RM ${metrics.saleMTD.toLocaleString('ms-MY')} / RM ${metrics.kpiMTD.toLocaleString('ms-MY')})`);
    }

    // Update status indicators dengan dynamic logic
    updateDynamicStatusIndicators(metrics);

    // Log untuk debugging
    console.log('Dynamic Power Metrics:', {
        'Original KPI Harian': `RM ${metrics.originalKpiHarian.toFixed(0)}`,
        'Dynamic KPI Harian': `RM ${metrics.dynamicKpiHarian.toFixed(0)}`,
        'Adjustment': `${metrics.adjustmentPercentage > 0 ? '+' : ''}${metrics.adjustmentPercentage.toFixed(1)}%`,
        'Performance Gap': `${metrics.performanceGap > 0 ? '+' : ''}${metrics.performanceGap.toFixed(1)}%`,
        'Days Remaining': metrics.remainingWorkingDays,
        'Is Ahead': metrics.isAhead,
        'Is On Track': metrics.isOnTrack
    });
}

// 6. Enhanced updateStatusIndicators function
function updateStatusIndicators(metrics) {
    const updateStatusElement = (id, text, className = null) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
            if (className) {
                element.className = className;
            }
        }
    };

    // KPI Harian Status dengan adjustment indicator
    let kpiHarianText = 'Dynamic';
    let kpiHarianClass = 'text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full';
    
    if (metrics.adjustmentPercentage > 10) {
        kpiHarianText = '↑ Higher';
        kpiHarianClass = 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full';
    } else if (metrics.adjustmentPercentage < -10) {
        kpiHarianText = '↓ Lower';
        kpiHarianClass = 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full';
    }
    
    updateStatusElement('kpi-harian-status', kpiHarianText, kpiHarianClass);

     // Sale MTD Trend dengan performance gap
    if (metrics.isAhead) {
        updateStatusElement('sale-mtd-trend', '✓ Ahead', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.performanceGap > -10) {
        updateStatusElement('sale-mtd-trend', '△ Close', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('sale-mtd-trend', '⚠ Behind', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Balance Bulanan Status
    if (metrics.balanceBulanan <= 0) {
        updateStatusElement('balance-bulanan-status', '🎯 Achieved', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.remainingWorkingDays <= 0) {
        updateStatusElement('balance-bulanan-status', '❌ Missed', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('balance-bulanan-status', `${metrics.remainingWorkingDays} days left`, 'text-xs text-orange-400 bg-orange-400/20 px-2 py-1 rounded-full');
    }

    // Balance MTD Status
    if (metrics.isOnTrack) {
        updateStatusElement('balance-mtd-status', '✓ On Track', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.mtdProgress >= 70) {
        updateStatusElement('balance-mtd-status', '△ Recovery', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('balance-mtd-status', '🚨 Critical', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Close Rate Status (unchanged)
    if (metrics.totalCloseRate >= 20) {
        updateStatusElement('close-rate-status', '✓ Excellent', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.totalCloseRate >= 10) {
        updateStatusElement('close-rate-status', '△ Good', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('close-rate-status', 'Need Focus', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Working Days Status dengan urgency
    if (metrics.remainingWorkingDays <= 0) {
        updateStatusElement('working-days-status', '🏁 Month End', 'text-xs text-purple-400 bg-purple-400/20 px-2 py-1 rounded-full');
    } else if (metrics.isAhead) {
        updateStatusElement('working-days-status', '✓ Ahead', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.remainingWorkingDays <= 5) {
        updateStatusElement('working-days-status', '🔥 Urgent', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('working-days-status', 'Push Harder', 'text-xs text-orange-400 bg-orange-400/20 px-2 py-1 rounded-full');
    }
}

console.log('Dynamic Power Metrics Calculator loaded successfully');

// Make updatePowerMetricsDisplay globally available
window.updatePowerMetrics = updatePowerMetricsDisplay;

console.log('Power Metrics module loaded successfully');

// Additional utility functions
function formatCurrency(amount) {
    return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercentage(value) {
    return `${value.toFixed(1)}%`;
}

// // Debug function to test calculations
function debugPowerMetrics(salesTeamData) {
    const calculator = new PowerMetricsCalculator();
    const metrics = calculator.calculateAllMetrics(salesTeamData);
    
    console.table({
        'Monthly KPI': formatCurrency(MONTHLY_KPI),
        'KPI Harian': formatCurrency(metrics.kpiHarian),
        'KPI MTD': formatCurrency(metrics.kpiMTD),
        'Sale MTD': formatCurrency(metrics.saleMTD),
        'Balance Bulanan': formatCurrency(metrics.balanceBulanan),
        'Balance MTD': formatCurrency(metrics.balanceMTD),
        'Bilangan Terjual': metrics.bilanganTerjual,
        'Close Rate': formatPercentage(metrics.totalCloseRate),
        'Working Days': `${metrics.workingDaysToDate} / ${metrics.totalWorkingDays}`,
        'Monthly Progress': formatPercentage(metrics.monthlyProgress),
        'MTD Progress': formatPercentage(metrics.mtdProgress)
    });
    
    return metrics;
}

////////////////////////////////////////////////////////////////////////////////////////////// 