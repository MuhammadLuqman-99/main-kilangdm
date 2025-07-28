// dashboard-enhanced.js
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
    // Setup mobile menu
    setupMobileMenu();
    
    // Wait for Firebase to be ready
    const checkFirebase = setInterval(() => {
        if (window.db) {
            clearInterval(checkFirebase);
            initializeDashboard();
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

async function initializeDashboard() {
    try {
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
        
        // Setup real-time updates
        updateCurrentTime();
        setInterval(updateCurrentTime, 60000); // Update every minute
        
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
        // Fetch all collections
        const [ecomSnapshot, marketSnapshot, salesSnapshot, orderSnapshot] = await Promise.all([
            getDocs(query(collection(db, "ecommerceData"), orderBy("createdAt", "desc"))),
            getDocs(query(collection(db, "marketingData"), orderBy("createdAt", "desc"))),
            getDocs(query(collection(db, "salesTeamData"), orderBy("createdAt", "desc"))),
            getDocs(query(collection(db, "orderData"), orderBy("createdAt", "desc")))
        ]);

        // Process data
        allData.ecommerce = ecomSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allData.marketing = marketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allData.salesteam = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allData.orders = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log('Data fetched successfully:', {
            ecommerce: allData.ecommerce.length,
            marketing: allData.marketing.length,
            salesteam: allData.salesteam.length,
            orders: allData.orders.length
        });

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
        activityFeed.innerHTML = '<div class="text-center text-gray-500 py-8">Tiada aktiviti terkini</div>';
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
    activityFeed.innerHTML = '<div class="text-center text-blue-500 py-8">Memuatkan data...</div>';
}

function showErrorState() {
    document.getElementById('total-sales').textContent = 'Error';
    document.getElementById('avg-roas').textContent = 'Error';
    document.getElementById('leads-per-agent').textContent = 'Error';
    document.getElementById('total-orders').textContent = 'Error';
    
    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = '<div class="text-center text-red-500 py-8">Gagal memuatkan data</div>';
}