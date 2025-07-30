// dashboard.js - COMPLETE FIXED VERSION
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables
let charts = {};
let leadDistributionChart = null;
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
// EXACT CHANGES FOR dashboard.js
// Add these sections to your existing dashboard.js file

// ============================================================================
// 1. ADD THESE GLOBAL VARIABLES (after existing global variables)
// ============================================================================


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
        
        // Initialize Power Metrics
        updateEnhancedPowerMetricsDisplay(allData.salesteam);
        
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
        const collections = ['orderData', 'marketingData', 'salesTeamData'];
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

        // Assign to global data with correct mapping
        allData.orders = results.orderData || [];
        allData.marketing = results.marketingData || [];
        allData.salesteam = results.salesTeamData || [];
        allData.ecommerce = []; // Currently not using separate ecommerce collection

        console.log('Final data counts:', {
            orders: allData.orders.length,
            marketing: allData.marketing.length,
            salesteam: allData.salesteam.length
        });

        // Show message if no data
        const totalRecords = allData.orders.length + allData.marketing.length + allData.salesteam.length;
        
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
    const agents = [...new Set(allData.salesteam
        .map(item => item.agent || item.team)
        .filter(Boolean)
    )].sort();
    
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
        orders: filterByDate(allData.orders, startDate, endDate),
        marketing: filterByDate(allData.marketing, startDate, endDate),
        salesteam: filterSalesTeamData(allData.salesteam, startDate, endDate, selectedAgent)
    };

    // Update displays
    updateActiveFiltersDisplay();
    updateKPIs(filteredData);
    updateCharts(filteredData);
    updateRecentActivity(filteredData);
    updateEnhancedPowerMetricsDisplay(filteredData.salesteam)
    // ADD THESE TWO LINES:
    updateMarketingBudgetDisplay(filteredData.marketing);
    updateLeadEfficiencyDisplay(filteredData.salesteam);
}

function filterByDate(data, startDate, endDate) {
    return data.filter(item => {
        let itemDate;
        
        // Handle different date formats
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            // Handle Firestore timestamp
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            return true; // Include items without dates
        }
        
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        
        return true;
    });
}

function filterSalesTeamData(data, startDate, endDate, agent) {
    return data.filter(item => {
        let itemDate;
        
        // Handle different date formats
        if (item.tarikh) {
            itemDate = new Date(item.tarikh);
        } else if (item.createdAt) {
            itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        } else {
            return true;
        }
        
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

function clearFilters() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('agent-filter').value = '';

    // Reset team and time filters
    // ADD THESE LINES:
    const teamFilter = document.getElementById('lead-team-filter');
    const timeFilter = document.getElementById('lead-time-filter');
    
    if (teamFilter) teamFilter.value = '';
    if (timeFilter) timeFilter.value = '';
    
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
    updateEnhancedPowerMetricsDisplay(allData.salesteam);
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

function updateKPIs(data) {
    // Calculate Total Sales from orders
    const orderSales = data.orders.reduce((sum, item) => sum + (parseFloat(item.total_rm) || 0), 0);
    
    // Calculate sales from sales team power metrics
    const teamSales = data.salesteam
        .filter(item => item.type === 'power_metrics')
        .reduce((sum, item) => sum + (parseFloat(item.total_sale_bulan) || 0), 0);
    
    const totalSales = orderSales + teamSales;
    
    document.getElementById('total-sales').textContent = `RM ${totalSales.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('total-sales-count').textContent = `${data.orders.length + data.salesteam.filter(item => item.type === 'power_metrics').length} entri`;

    // Calculate Average ROAS from marketing data
    const marketingWithRoas = data.marketing.filter(item => item.type === 'detail_ads' && item.amount_spent > 0);
    if (marketingWithRoas.length > 0) {
        const avgRoas = marketingWithRoas.reduce((sum, item) => {
            const spend = parseFloat(item.amount_spent) || 0;
            const leadValue = parseFloat(item.lead_dari_team_sale) || 0;
            return sum + (spend > 0 ? leadValue / spend : 0);
        }, 0) / marketingWithRoas.length;
        
        document.getElementById('avg-roas').textContent = `${avgRoas.toFixed(2)}x`;
        document.getElementById('avg-roas-count').textContent = `${marketingWithRoas.length} entri`;
    } else {
        document.getElementById('avg-roas').textContent = 'N/A';
        document.getElementById('avg-roas-count').textContent = '0 entri';
    }

    // Calculate Leads per Agent
    const leadData = data.salesteam.filter(item => item.type === 'lead');
    if (leadData.length > 0) {
        const totalLeads = leadData.reduce((sum, item) => sum + (parseInt(item.total_lead) || 0), 0);
        const uniqueAgents = new Set(leadData.map(item => item.team).filter(Boolean)).size;
        const leadsPerAgent = uniqueAgents > 0 ? totalLeads / uniqueAgents : 0;
        
        document.getElementById('leads-per-agent').textContent = `${leadsPerAgent.toFixed(1)}`;
        document.getElementById('leads-per-agent-count').textContent = `${uniqueAgents} agent`;
    } else {
        document.getElementById('leads-per-agent').textContent = 'N/A';
        document.getElementById('leads-per-agent-count').textContent = '0 agent';
    }

    // Calculate Total Orders
    const totalOrders = data.orders.length;
    document.getElementById('total-orders').textContent = totalOrders.toString();
    document.getElementById('total-orders-count').textContent = `${totalOrders} orders`;

    // Update trend indicators (simplified random for demo)
    document.getElementById('sales-trend').textContent = totalSales > 0 ? '+' + (Math.random() * 20).toFixed(1) + '%' : '-';
    document.getElementById('roas-trend').textContent = marketingWithRoas.length > 0 ? '+' + (Math.random() * 10).toFixed(1) + '%' : '-';
    document.getElementById('leads-trend').textContent = leadData.length > 0 ? '+' + (Math.random() * 15).toFixed(1) + '%' : '-';
    document.getElementById('orders-trend').textContent = totalOrders > 0 ? '+' + (Math.random() * 12).toFixed(1) + '%' : '-';
}

function updateCharts(data) {
    // Initialize Chart.js defaults
    Chart.defaults.color = '#D1D5DB';
    Chart.defaults.borderColor = 'rgba(75, 85, 99, 0.3)';

    updateSalesTrendChart(data);
    updateChannelChart(data);
    updateEnhancedLeadsChart(data); // ← CHANGED FROM updateLeadsChart
    updateEnhancedLeadsChart(data); // ← Make sure this line exists
    updateTeamChart(data);
    updateSpendChart(data);
}

function updateSalesTrendChart(data = null) {
    const filteredData = data || {
        orders: filterByDate(allData.orders, currentFilters.startDate, currentFilters.endDate),
        salesteam: filterSalesTeamData(allData.salesteam, currentFilters.startDate, currentFilters.endDate, currentFilters.agent)
    };

    // Group sales by date
    const salesByDate = {};
    
    // Process orders data
    filteredData.orders.forEach(item => {
        let date;
        if (item.tarikh) {
            date = item.tarikh;
        } else if (item.createdAt) {
            date = (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)).toISOString().split('T')[0];
        } else {
            return;
        }
        
        if (!salesByDate[date]) salesByDate[date] = { direct: 0, team: 0 };
        salesByDate[date].direct += parseFloat(item.total_rm) || 0;
    });

    // Process sales team data
    filteredData.salesteam
        .filter(item => item.type === 'power_metrics')
        .forEach(item => {
            let date;
            if (item.tarikh) {
                date = item.tarikh;
            } else if (item.createdAt) {
                date = (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)).toISOString().split('T')[0];
            } else {
                return;
            }
            
            if (!salesByDate[date]) salesByDate[date] = { direct: 0, team: 0 };
            salesByDate[date].team += parseFloat(item.total_sale_bulan) || 0;
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
    // Group by platform
    const channelData = {};
    
    data.orders.forEach(item => {
        const platform = item.platform || 'Unknown';
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
    
    data.salesteam
        .filter(item => item.type === 'lead')
        .forEach(item => {
            const agent = item.team || 'Unknown';
            const leads = parseInt(item.total_lead) || 0;
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
    
    // Get leads data
    data.salesteam
        .filter(item => item.type === 'lead')
        .forEach(item => {
            const team = item.team || 'Unknown';
            if (!teamPerformance[team]) {
                teamPerformance[team] = { leads: 0, sales: 0, closes: 0 };
            }
            teamPerformance[team].leads += parseInt(item.total_lead) || 0;
        });

    // Get power metrics data
    data.salesteam
        .filter(item => item.type === 'power_metrics')
        .forEach(item => {
            const team = item.team || 'Unknown';
            if (!teamPerformance[team]) {
                teamPerformance[team] = { leads: 0, sales: 0, closes: 0 };
            }
            teamPerformance[team].sales += parseFloat(item.total_sale_bulan) || 0;
            teamPerformance[team].closes += parseInt(item.total_close_bulan) || 0;
        });

    // Convert to performance scores
    const teams = Object.keys(teamPerformance);
    const scores = teams.map(team => {
        const data = teamPerformance[team];
        const closeRate = data.leads > 0 ? (data.closes / data.leads) * 100 : 0;
        return Math.min(closeRate + (data.sales / 10000), 100);
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
    
    data.marketing
        .filter(item => item.type === 'detail_ads')
        .forEach(item => {
            let date;
            if (item.tarikh) {
                date = item.tarikh;
            } else if (item.createdAt) {
                date = (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)).toISOString().split('T')[0];
            } else {
                return;
            }
            
            const spend = parseFloat(item.amount_spent) || 0;
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

    // Get recent activities from orders
    const orderActivities = data.orders.map(item => ({
        type: 'order',
        message: `Order baharu - ${item.nama_customer} - RM ${parseFloat(item.total_rm || 0).toFixed(2)}`,
        time: item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)) : new Date(),
        platform: item.platform
    }));

    // Get recent activities from sales team
    const salesActivities = data.salesteam
        .filter(item => item.type === 'lead')
        .map(item => ({
            type: 'sales',
            message: `${item.team} - ${item.total_lead || 0} leads baharu`,
            time: item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)) : new Date(),
            agent: item.team
        }));

    const allActivities = [...orderActivities, ...salesActivities];

    // Sort by time and take latest 10
    const recentActivities = allActivities
        .sort((a, b) => b.time - a.time)
        .slice(0, 10);

    if (recentActivities.length === 0) {
        activityFeed.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>Tiada aktiviti terkini</p>
            </div>
        `;
        return;
    }

    activityFeed.innerHTML = recentActivities.map(activity => {
        const colorClass = activity.type === 'order' ? 'bg-green-400' : 'bg-purple-400';
        
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
    document.getElementById('total-sales').textContent = 'RM 0.00';
    document.getElementById('total-sales-count').textContent = '0 entri (Tiada data)';
    document.getElementById('avg-roas').textContent = 'N/A';
    document.getElementById('avg-roas-count').textContent = '0 entri (Tiada data)';
    document.getElementById('leads-per-agent').textContent = 'N/A';
    document.getElementById('leads-per-agent-count').textContent = '0 agent (Tiada data)';
    document.getElementById('total-orders').textContent = '0';
    document.getElementById('total-orders-count').textContent = '0 orders (Tiada data)';
    
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
    
    return date.toLocaleDateString('ms-MY');
}

function updateCurrentTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = now.toLocaleString('ms-MY');
    }
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

// Enhanced Power Metrics Calculator with Dynamic Working Days Detection
// This system automatically detects working days and adjusts KPI daily based on current sales

class EnhancedPowerMetricsCalculator {
    constructor(customWorkingDays = null) {
        this.monthlyKPI = 15000; // RM 15,000 monthly target
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth() + 1;
        this.currentYear = this.currentDate.getFullYear();
        this.currentDay = this.currentDate.getDate();
        
        // Custom working days configuration (if provided)
        this.customWorkingDays = customWorkingDays; // e.g., [1,2,3,4,6] for Mon-Thu,Sat
        
        console.log(`📅 Current Date: ${this.currentDate.toLocaleDateString('ms-MY')}`);
        console.log(`📊 Monthly KPI: RM ${this.monthlyKPI.toLocaleString()}`);
    }

    // Enhanced working days calculation with custom configuration
    getWorkingDaysInMonth() {
        const year = this.currentYear;
        const month = this.currentMonth;
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        let workingDays = 0;
        
        for (let day = new Date(firstDay); day <= lastDay; day.setDate(day.getDate() + 1)) {
            const dayOfWeek = day.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
            
            if (this.customWorkingDays) {
                // Use custom working days configuration
                if (this.customWorkingDays.includes(dayOfWeek)) {
                    workingDays++;
                }
            } else {
                // Default: Exclude Friday (5) and Saturday (6) - Malaysian working pattern
                if (dayOfWeek !== 5 && dayOfWeek !== 6) {
                    workingDays++;
                }
            }
        }
        
        console.log(`📈 Total Working Days in ${month}/${year}: ${workingDays} days`);
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
            
            if (this.customWorkingDays) {
                if (this.customWorkingDays.includes(dayOfWeek)) {
                    workingDays++;
                }
            } else {
                // Default: Exclude Friday and Saturday
                if (dayOfWeek !== 5 && dayOfWeek !== 6) {
                    workingDays++;
                }
            }
        }
        
        console.log(`📊 Working Days to Date: ${workingDays} days`);
        return workingDays;
    }

    // Calculate remaining working days in the month
    getRemainingWorkingDays() {
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const workingDaysToDate = this.getWorkingDaysToDate();
        const remaining = Math.max(0, totalWorkingDays - workingDaysToDate);
        
        console.log(`⏰ Remaining Working Days: ${remaining} days`);
        return remaining;
    }

    // STATIC KPI Harian (Original calculation for reference)
    calculateStaticKPIHarian() {
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const staticKPI = this.monthlyKPI / totalWorkingDays;
        
        console.log(`📋 Static KPI Harian: RM ${staticKPI.toFixed(2)}`);
        return staticKPI;
    }

    // DYNAMIC KPI Harian - Adjusts based on current sales and remaining days
    calculateDynamicKPIHarian(saleMTD) {
        const remainingWorkingDays = this.getRemainingWorkingDays();
        const remainingKPI = this.monthlyKPI - saleMTD;
        
        // If no working days remaining, return 0
        if (remainingWorkingDays <= 0) {
            console.log(`🏁 No working days remaining - Dynamic KPI: RM 0`);
            return 0;
        }
        
        // Dynamic KPI = Remaining KPI ÷ Remaining working days
        const dynamicKPI = remainingKPI / remainingWorkingDays;
        
        console.log(`🔄 Dynamic KPI Calculation:`);
        console.log(`   - Remaining KPI: RM ${remainingKPI.toLocaleString()}`);
        console.log(`   - Remaining Days: ${remainingWorkingDays}`);
        console.log(`   - Dynamic KPI Harian: RM ${dynamicKPI.toFixed(2)}`);
        
        return Math.max(0, dynamicKPI); // Ensure non-negative
    }

    // Calculate expected KPI MTD (Month-to-Date target)
    calculateKPIMTD() {
        const workingDaysToDate = this.getWorkingDaysToDate();
        const staticKpiHarian = this.calculateStaticKPIHarian();
        const kpiMTD = staticKpiHarian * workingDaysToDate;
        
        console.log(`📊 KPI MTD: RM ${kpiMTD.toFixed(2)} (${workingDaysToDate} days × RM ${staticKpiHarian.toFixed(2)})`);
        return kpiMTD;
    }

    // Extract Sale MTD from sales team data
    getSaleMTD(salesTeamData) {
        const currentMonth = this.currentMonth;
        const currentYear = this.currentYear;
        
        const saleMTD = salesTeamData
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

        console.log(`💰 Current Sale MTD: RM ${saleMTD.toLocaleString()}`);
        return saleMTD;
    }

    // Calculate Balance Bulanan (Remaining to reach monthly target)
    calculateBalanceBulanan(saleMTD) {
        const balance = this.monthlyKPI - saleMTD;
        console.log(`📊 Balance Bulanan: RM ${balance.toLocaleString()}`);
        return balance;
    }

    // Calculate Balance MTD (Gap between expected and actual sales)
    calculateBalanceMTD(saleMTD) {
        const kpiMTD = this.calculateKPIMTD();
        const balance = kpiMTD - saleMTD;
        console.log(`📈 Balance MTD: RM ${balance.toLocaleString()}`);
        return balance;
    }

    // Get total sales count (bilangan terjual)
    getTotalCloseCount(salesTeamData) {
        const currentMonth = this.currentMonth;
        const currentYear = this.currentYear;
        
        const totalClose = salesTeamData
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

        console.log(`🎯 Total Close Count: ${totalClose} units`);
        return totalClose;
    }

    // Get total lead count
    getTotalLeadCount(salesTeamData) {
        const currentMonth = this.currentMonth;
        const currentYear = this.currentYear;
        
        const totalLead = salesTeamData
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

        console.log(`📋 Total Lead Count: ${totalLead} leads`);
        return totalLead;
    }

    // Calculate close rate percentage
    calculateTotalCloseRate(salesTeamData) {
        const totalClose = this.getTotalCloseCount(salesTeamData);
        const totalLead = this.getTotalLeadCount(salesTeamData);
        
        if (totalLead === 0) return 0;
        
        const closeRate = (totalClose / totalLead) * 100;
        console.log(`📊 Close Rate: ${closeRate.toFixed(1)}% (${totalClose}/${totalLead})`);
        return closeRate;
    }

    // Enhanced performance analysis
    getPerformanceAnalysis(saleMTD) {
        const kpiMTD = this.calculateKPIMTD();
        const monthlyProgress = (saleMTD / this.monthlyKPI) * 100;
        const mtdProgress = kpiMTD > 0 ? (saleMTD / kpiMTD) * 100 : 0;
        
        const workingDaysToDate = this.getWorkingDaysToDate();
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const expectedProgress = (workingDaysToDate / totalWorkingDays) * 100;
        
        const staticKPI = this.calculateStaticKPIHarian();
        const dynamicKPI = this.calculateDynamicKPIHarian(saleMTD);
        const kpiAdjustment = dynamicKPI - staticKPI;
        const adjustmentPercentage = staticKPI > 0 ? (kpiAdjustment / staticKPI) * 100 : 0;
        
        const analysis = {
            monthlyProgress: monthlyProgress,
            mtdProgress: mtdProgress,
            expectedProgress: expectedProgress,
            performanceGap: monthlyProgress - expectedProgress,
            isAhead: monthlyProgress >= expectedProgress,
            isOnTrack: mtdProgress >= 90,
            kpiAdjustment: kpiAdjustment,
            adjustmentPercentage: adjustmentPercentage,
            urgencyLevel: this.getUrgencyLevel(saleMTD),
            recommendation: this.getRecommendation(saleMTD)
        };

        console.log(`📊 Performance Analysis:`, analysis);
        return analysis;
    }

    // Determine urgency level based on performance
    getUrgencyLevel(saleMTD) {
        const remainingDays = this.getRemainingWorkingDays();
        const balanceBulanan = this.calculateBalanceBulanan(saleMTD);
        const monthlyProgress = (saleMTD / this.monthlyKPI) * 100;
        
        if (monthlyProgress >= 100) return 'ACHIEVED';
        if (remainingDays <= 0) return 'CRITICAL';
        if (remainingDays <= 3) return 'URGENT';
        if (monthlyProgress < 50 && remainingDays <= 10) return 'HIGH';
        if (monthlyProgress >= 80) return 'LOW';
        return 'MODERATE';
    }

    // Get recommendation based on current performance
    getRecommendation(saleMTD) {
        const dynamicKPI = this.calculateDynamicKPIHarian(saleMTD);
        const staticKPI = this.calculateStaticKPIHarian();
        const remainingDays = this.getRemainingWorkingDays();
        const urgency = this.getUrgencyLevel(saleMTD);
        
        const recommendations = {
            'ACHIEVED': '🎉 Target achieved! Maintain momentum for next month.',
            'CRITICAL': '🚨 Month ended. Analyze performance for next month planning.',
            'URGENT': `⚡ Only ${remainingDays} days left! Need RM ${dynamicKPI.toFixed(0)}/day intensive push!`,
            'HIGH': `🔥 High pressure! Daily target increased to RM ${dynamicKPI.toFixed(0)}`,
            'MODERATE': `📈 Stay focused! Daily target: RM ${dynamicKPI.toFixed(0)}`,
            'LOW': `✅ Good progress! Maintain RM ${dynamicKPI.toFixed(0)}/day pace`
        };
        
        return recommendations[urgency] || 'Keep pushing towards your goal!';
    }

    // Master calculation method - returns all metrics
    calculateAllMetrics(salesTeamData) {
        console.log(`🔄 Calculating Power Metrics for ${this.currentDate.toLocaleDateString('ms-MY')}`);
        
        const saleMTD = this.getSaleMTD(salesTeamData);
        const staticKpiHarian = this.calculateStaticKPIHarian();
        const dynamicKpiHarian = this.calculateDynamicKPIHarian(saleMTD);
        const kpiMTD = this.calculateKPIMTD();
        const balanceBulanan = this.calculateBalanceBulanan(saleMTD);
        const balanceMTD = this.calculateBalanceMTD(saleMTD);
        const totalCloseRate = this.calculateTotalCloseRate(salesTeamData);
        const totalWorkingDays = this.getWorkingDaysInMonth();
        const workingDaysToDate = this.getWorkingDaysToDate();
        const remainingWorkingDays = this.getRemainingWorkingDays();
        const performanceAnalysis = this.getPerformanceAnalysis(saleMTD);

        const metrics = {
            // KPI Values
            staticKpiHarian: staticKpiHarian,
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
            
            // Performance Analysis
            ...performanceAnalysis,
            
            // Additional Info
            urgencyLevel: this.getUrgencyLevel(saleMTD),
            recommendation: this.getRecommendation(saleMTD),
            monthlyKPI: this.monthlyKPI
        };

        console.log(`✅ Power Metrics Calculation Complete`);
        console.table({
            'Monthly KPI': `RM ${metrics.monthlyKPI.toLocaleString()}`,
            'Static KPI/Day': `RM ${metrics.staticKpiHarian.toFixed(0)}`,
            'Dynamic KPI/Day': `RM ${metrics.dynamicKpiHarian.toFixed(0)}`,
            'Adjustment': `${metrics.adjustmentPercentage > 0 ? '+' : ''}${metrics.adjustmentPercentage.toFixed(1)}%`,
            'Sale MTD': `RM ${metrics.saleMTD.toLocaleString()}`,
            'Monthly Progress': `${metrics.monthlyProgress.toFixed(1)}%`,
            'Days Left': metrics.remainingWorkingDays,
            'Urgency': metrics.urgencyLevel
        });

        return metrics;
    }

    // Method to simulate different scenarios
    simulateScenario(currentSales, daysRemaining = null) {
        const remainingDays = daysRemaining || this.getRemainingWorkingDays();
        const requiredKPI = remainingDays > 0 ? (this.monthlyKPI - currentSales) / remainingDays : 0;
        
        console.log(`🎯 Simulation: If sales = RM ${currentSales.toLocaleString()}`);
        console.log(`   Required daily KPI: RM ${requiredKPI.toFixed(2)}`);
        console.log(`   Days remaining: ${remainingDays}`);
        
        return {
            currentSales: currentSales,
            remainingDays: remainingDays,
            requiredDailyKPI: requiredKPI,
            isAchievable: requiredKPI <= (this.calculateStaticKPIHarian() * 2) // 2x normal is still achievable
        };
    }
}

// Usage Examples and Test Functions
function demonstrateDynamicKPI() {
    console.log(`\n🚀 === DYNAMIC KPI DEMONSTRATION ===`);
    
    // Initialize calculator with custom working days (Monday to Thursday + Saturday)
    // [1,2,3,4,6] = Monday, Tuesday, Wednesday, Thursday, Saturday (Friday off)
    const calculator = new EnhancedPowerMetricsCalculator([1,2,3,4,6]);
    
    // Mock sales data for demonstration
    const mockSalesData = [
        {
            type: 'power_metrics',
            tarikh: '2025-07-01',
            total_sale_bulan: 1000,
            total_close_bulan: 2,
            total_lead_bulan: 10
        },
        {
            type: 'power_metrics',
            tarikh: '2025-07-03',
            total_sale_bulan: 2000,
            total_close_bulan: 3,
            total_lead_bulan: 15
        }
    ];

    // Calculate metrics
    const metrics = calculator.calculateAllMetrics(mockSalesData);
    
    console.log(`\n📊 === RESULTS SUMMARY ===`);
    console.log(`📅 Current Date: ${new Date().toLocaleDateString('ms-MY')}`);
    console.log(`💰 Monthly Target: RM ${metrics.monthlyKPI.toLocaleString()}`);
    console.log(`📈 Current Sales: RM ${metrics.saleMTD.toLocaleString()}`);
    console.log(`📋 Static KPI/Day: RM ${metrics.staticKpiHarian.toFixed(0)}`);
    console.log(`🔄 Dynamic KPI/Day: RM ${metrics.dynamicKpiHarian.toFixed(0)}`);
    console.log(`📊 Adjustment: ${metrics.adjustmentPercentage > 0 ? '+' : ''}${metrics.adjustmentPercentage.toFixed(1)}%`);
    console.log(`⏰ Days Remaining: ${metrics.remainingWorkingDays}`);
    console.log(`🎯 Urgency Level: ${metrics.urgencyLevel}`);
    console.log(`💡 Recommendation: ${metrics.recommendation}`);
    
    // Test different scenarios
    console.log(`\n🧪 === SCENARIO TESTING ===`);
    
    // Scenario 1: No sales yet
    console.log(`\n📈 Scenario 1: No sales yet`);
    calculator.simulateScenario(0);
    
    // Scenario 2: Good progress (RM 5000)
    console.log(`\n📈 Scenario 2: Good progress`);
    calculator.simulateScenario(5000);
    
    // Scenario 3: Behind target (RM 2000 with 5 days left)
    console.log(`\n📈 Scenario 3: Behind target`);
    calculator.simulateScenario(2000, 5);
    
    return metrics;
}

// Auto-detect working days for different regions/companies
function createCalculatorForRegion(region = 'malaysia_default') {
    const workingDayConfigs = {
        'malaysia_default': [0,1,2,3,4,6], // Sunday to Thursday + Saturday (Friday off)
        'malaysia_private': [1,2,3,4,5],   // Monday to Friday (weekends off)
        'brunei': [1,2,3,4,6],             // Monday to Thursday + Saturday (Friday off)
        'indonesia': [1,2,3,4,5],          // Monday to Friday
        'singapore': [1,2,3,4,5],          // Monday to Friday
        'custom_6_days': [1,2,3,4,5,6]     // Monday to Saturday
    };
    
    const workingDays = workingDayConfigs[region] || workingDayConfigs['malaysia_default'];
    console.log(`🌍 Creating calculator for region: ${region}`);
    console.log(`📅 Working days: ${workingDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`);
    
    return new EnhancedPowerMetricsCalculator(workingDays);
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        EnhancedPowerMetricsCalculator, 
        demonstrateDynamicKPI,
        createCalculatorForRegion 
    };
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.EnhancedPowerMetricsCalculator = EnhancedPowerMetricsCalculator;
    window.demonstrateDynamicKPI = demonstrateDynamicKPI;
    window.createCalculatorForRegion = createCalculatorForRegion;
}

// Enhanced update function for dashboard integration
function updateEnhancedPowerMetricsDisplay(salesTeamData) {
    // Create calculator with Malaysia working pattern (Friday off only)
    const calculator = new EnhancedPowerMetricsCalculator([0,1,2,3,4,6]); // Sun-Thu + Sat
    const metrics = calculator.calculateAllMetrics(salesTeamData);

    // Helper function to update elements safely
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Element with ID '${id}' not found`);
        }
    };

    // Update main KPI displays with DYNAMIC values
    updateElement('kpi-harian', `RM ${metrics.dynamicKpiHarian.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
    updateElement('kpi-mtd', `RM ${metrics.kpiMTD.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
    updateElement('sale-mtd', `RM ${metrics.saleMTD.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    updateElement('balance-bulanan', `RM ${metrics.balanceBulanan.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    updateElement('balance-mtd', `RM ${Math.abs(metrics.balanceMTD).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    updateElement('bilangan-terjual', metrics.bilanganTerjual.toString());
    updateElement('total-close-rate', `${metrics.totalCloseRate.toFixed(1)}%`);
    updateElement('working-days-info', `${metrics.workingDaysToDate} / ${metrics.totalWorkingDays}`);

    // Update descriptions with enhanced context
    updateElement('kpi-harian-desc', `${metrics.remainingWorkingDays} hari tinggal (${metrics.urgencyLevel.toLowerCase()})`);
    updateElement('kpi-mtd-desc', `sasaran ${metrics.workingDaysToDate} hari kerja`);
    updateElement('sale-mtd-desc', `${metrics.monthlyProgress.toFixed(1)}% dari target bulanan`);
    updateElement('balance-bulanan-desc', metrics.balanceBulanan <= 0 ? '🎯 Target tercapai!' : `perlu RM ${Math.ceil(metrics.dynamicKpiHarian)}/hari`);
    updateElement('balance-mtd-desc', metrics.balanceMTD > 0 ? 'ketinggalan MTD' : 'melebihi sasaran MTD');

    // Update progress bars with enhanced colors
    const monthlyProgressBar = document.getElementById('monthly-progress-bar');
    const mtdProgressBar = document.getElementById('mtd-progress-bar');
    
    if (monthlyProgressBar && mtdProgressBar) {
        // Monthly progress with performance-based colors
        const monthlyProgressPercent = Math.min(Math.max(metrics.monthlyProgress, 0), 100);
        monthlyProgressBar.style.width = `${monthlyProgressPercent}%`;
        
        // Color based on urgency level
        const colorClasses = {
            'ACHIEVED': 'bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300',
            'LOW': 'bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300',
            'MODERATE': 'bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300',
            'HIGH': 'bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300',
            'URGENT': 'bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300',
            'CRITICAL': 'bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-300'
        };
        
        monthlyProgressBar.className = colorClasses[metrics.urgencyLevel] || colorClasses['MODERATE'];
        updateElement('monthly-progress-text', `${monthlyProgressPercent.toFixed(1)}% (${metrics.urgencyLevel})`);

        // MTD progress
        const mtdProgressPercent = Math.min(Math.max(metrics.mtdProgress, 0), 100);
        mtdProgressBar.style.width = `${mtdProgressPercent}%`;
        
        if (metrics.isOnTrack) {
            mtdProgressBar.className = 'bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all duration-300';
        } else if (mtdProgressPercent >= 70) {
            mtdProgressBar.className = 'bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300';
        } else {
            mtdProgressBar.className = 'bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-300';
        }
        
        updateElement('mtd-progress-text', `${mtdProgressPercent.toFixed(1)}% (RM ${metrics.saleMTD.toLocaleString('ms-MY')} / RM ${metrics.kpiMTD.toLocaleString('ms-MY')})`);
    }

    // Update status indicators with enhanced logic
    updateEnhancedStatusIndicators(metrics);

    // Add notification/alert if critical
    if (metrics.urgencyLevel === 'URGENT' || metrics.urgencyLevel === 'CRITICAL') {
        showUrgencyAlert(metrics);
    }

    // Console log for monitoring
    console.log(`🔥 Enhanced Power Metrics Updated:`, {
        'Date': new Date().toLocaleDateString('ms-MY'),
        'Dynamic KPI/Day': `RM ${metrics.dynamicKpiHarian.toFixed(0)}`,
        'Static vs Dynamic': `${metrics.adjustmentPercentage > 0 ? '+' : ''}${metrics.adjustmentPercentage.toFixed(1)}%`,
        'Monthly Progress': `${metrics.monthlyProgress.toFixed(1)}%`,
        'Urgency': metrics.urgencyLevel,
        'Days Left': metrics.remainingWorkingDays,
        'Recommendation': metrics.recommendation
    });

    return metrics;
}

// Enhanced status indicators with dynamic logic
function updateEnhancedStatusIndicators(metrics) {
    const updateStatusElement = (id, text, className = null) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
            if (className) {
                element.className = className;
            }
        }
    };

    // KPI Harian Status with dynamic adjustment indicator
    const adjustmentPercent = metrics.adjustmentPercentage;
    let kpiHarianText, kpiHarianClass;
    
    if (adjustmentPercent > 20) {
        kpiHarianText = `↑ +${adjustmentPercent.toFixed(0)}%`;
        kpiHarianClass = 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full';
    } else if (adjustmentPercent > 0) {
        kpiHarianText = `↗ +${adjustmentPercent.toFixed(0)}%`;
        kpiHarianClass = 'text-xs text-orange-400 bg-orange-400/20 px-2 py-1 rounded-full';
    } else if (adjustmentPercent < -20) {
        kpiHarianText = `↓ ${adjustmentPercent.toFixed(0)}%`;
        kpiHarianClass = 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full';
    } else if (adjustmentPercent < 0) {
        kpiHarianText = `↘ ${adjustmentPercent.toFixed(0)}%`;
        kpiHarianClass = 'text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full';
    } else {
        kpiHarianText = 'Static';
        kpiHarianClass = 'text-xs text-gray-400 bg-gray-400/20 px-2 py-1 rounded-full';
    }
    
    updateStatusElement('kpi-harian-status', kpiHarianText, kpiHarianClass);

    // KPI MTD Status based on expected vs actual
    if (metrics.mtdProgress >= 100) {
        updateStatusElement('kpi-mtd-status', '🎯 Achieved', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.mtdProgress >= 90) {
        updateStatusElement('kpi-mtd-status', '✓ On Track', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.mtdProgress >= 70) {
        updateStatusElement('kpi-mtd-status', '△ Close', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('kpi-mtd-status', '⚠ Behind', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Sale MTD Trend with performance comparison
    if (metrics.isAhead) {
        updateStatusElement('sale-mtd-trend', '🚀 Ahead', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.performanceGap > -5) {
        updateStatusElement('sale-mtd-trend', '📈 Close', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('sale-mtd-trend', '📉 Behind', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Balance Bulanan Status with urgency
    if (metrics.balanceBulanan <= 0) {
        updateStatusElement('balance-bulanan-status', '🏆 Done', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else {
        const urgencyColors = {
            'CRITICAL': 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full',
            'URGENT': 'text-xs text-orange-400 bg-orange-400/20 px-2 py-1 rounded-full',
            'HIGH': 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full',
            'MODERATE': 'text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full',
            'LOW': 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full'
        };
        updateStatusElement('balance-bulanan-status', metrics.urgencyLevel, urgencyColors[metrics.urgencyLevel]);
    }

    // Balance MTD Status
    if (metrics.balanceMTD <= 0) {
        updateStatusElement('balance-mtd-status', '✅ Surplus', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.balanceMTD <= 1000) {
        updateStatusElement('balance-mtd-status', '📊 Gap Small', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('balance-mtd-status', '🎯 Need Push', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Close Rate Status
    if (metrics.totalCloseRate >= 25) {
        updateStatusElement('close-rate-status', '🌟 Excellent', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else if (metrics.totalCloseRate >= 15) {
        updateStatusElement('close-rate-status', '✓ Good', 'text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full');
    } else if (metrics.totalCloseRate >= 10) {
        updateStatusElement('close-rate-status', '△ Average', 'text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('close-rate-status', '📈 Improve', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    }

    // Working Days Status with time urgency
    if (metrics.remainingWorkingDays <= 0) {
        updateStatusElement('working-days-status', '🏁 Month End', 'text-xs text-purple-400 bg-purple-400/20 px-2 py-1 rounded-full');
    } else if (metrics.remainingWorkingDays <= 3) {
        updateStatusElement('working-days-status', '🔥 Final Push', 'text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded-full');
    } else if (metrics.remainingWorkingDays <= 7) {
        updateStatusElement('working-days-status', '⚡ Sprint', 'text-xs text-orange-400 bg-orange-400/20 px-2 py-1 rounded-full');
    } else if (metrics.isAhead) {
        updateStatusElement('working-days-status', '✨ Cruising', 'text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full');
    } else {
        updateStatusElement('working-days-status', '🎯 Focus', 'text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full');
    }
}

// Show urgency alert for critical situations
function showUrgencyAlert(metrics) {
    // Create or update alert banner
    let alertBanner = document.getElementById('urgency-alert');
    
    if (!alertBanner) {
        alertBanner = document.createElement('div');
        alertBanner.id = 'urgency-alert';
        alertBanner.className = 'fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg animate-pulse';
        document.body.appendChild(alertBanner);
    }

    const alertColors = {
        'URGENT': 'bg-orange-500 text-white',
        'CRITICAL': 'bg-red-500 text-white'
    };

    const alertIcons = {
        'URGENT': '⚡',
        'CRITICAL': '🚨'
    };

    alertBanner.className = `fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg animate-pulse ${alertColors[metrics.urgencyLevel]}`;
    alertBanner.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="text-2xl">${alertIcons[metrics.urgencyLevel]}</div>
            <div>
                <div class="font-bold text-sm">${metrics.urgencyLevel} - ${metrics.remainingWorkingDays} Days Left!</div>
                <div class="text-xs mt-1">Need RM ${metrics.dynamicKpiHarian.toFixed(0)}/day to reach target</div>
                <div class="text-xs mt-2 opacity-90">${metrics.recommendation}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">×</button>
        </div>
    `;

    // Auto remove after 10 seconds
    setTimeout(() => {
        if (alertBanner && alertBanner.parentElement) {
            alertBanner.remove();
        }
    }, 10000);
}

// Integration instructions for dashboard.js
function integrateToDashboard() {
    console.log(`
🔄 INTEGRATION STEPS FOR DASHBOARD.JS:

1. Replace the old updatePowerMetricsDisplay function call with:
   updateEnhancedPowerMetricsDisplay(filteredData.salesteam);

2. Update the function calls in dashboard.js:
   - In applyFilters(): updateEnhancedPowerMetricsDisplay(filteredData.salesteam);
   - In clearFilters(): updateEnhancedPowerMetricsDisplay(allData.salesteam);
   - In initializeDashboard(): updateEnhancedPowerMetricsDisplay(allData.salesteam);

3. Test scenarios:
   - Run demonstrateDynamicKPI() in console to see examples
   - Check different sales amounts to see KPI adjustments
   - Verify working days calculation for current month

📊 FEATURES:
✅ Auto-detects working days (Friday off by default)
✅ Dynamic KPI adjustment based on current sales
✅ Urgency levels (LOW, MODERATE, HIGH, URGENT, CRITICAL)
✅ Visual alerts for critical situations
✅ Enhanced status indicators
✅ Performance-based progress bar colors
✅ Detailed console logging for monitoring

🎯 WORKING DAYS CONFIGURATION:
- Current: Sunday-Thursday + Saturday (Friday off)
- To change: Pass different array to EnhancedPowerMetricsCalculator([1,2,3,4,5])
- [1,2,3,4,5] = Monday to Friday (weekends off)
- [0,1,2,3,4,6] = Sunday-Thursday + Saturday (Friday off) - Malaysian pattern

📈 DYNAMIC KPI EXAMPLE:
- Monthly Target: RM 15,000
- Days in Month: 27 working days
- Static KPI: RM 556/day
- If RM 2,000 sales on day 3: Dynamic KPI adjusts to RM 542/day for remaining 24 days
- If no sales yet: Dynamic KPI stays at RM 556/day
- If behind schedule: Dynamic KPI increases accordingly
    `);
}

console.log(`✅ Enhanced Dynamic Power Metrics Calculator loaded successfully!`);
console.log(`🚀 Try running: demonstrateDynamicKPI() to see it in action`);
console.log(`📋 Run: integrateToDashboard() for integration instructions`);

// Make functions available globally
if (typeof window !== 'undefined') {
    window.updateEnhancedPowerMetricsDisplay = updateEnhancedPowerMetricsDisplay;
    window.integrateToDashboard = integrateToDashboard;
}
// ============================================================================
// 3. ADD ALL THESE NEW FUNCTIONS (before the utility functions section)
// ============================================================================

// COMPLETE REPLACEMENT for the updateEnhancedLeadsChart function
// This goes in your dashboard.js file

// First, add this BEFORE the updateCharts function

// REPLACE the updateEnhancedLeadsChart function with this:
function updateEnhancedLeadsChart(data) {
    console.log('🔍 Enhanced Leads Chart - Processing data:', data);
    
    // Debug: Log the salesteam data structure
    console.log('Salesteam data sample:', data.salesteam.slice(0, 3));
    
    // Initialize dropdown if not exists (simplified version)
    initializeLeadDistributionDropdowns();
    
    // Get filters (with fallback if elements don't exist)
    const teamFilterEl = document.getElementById('lead-team-filter');
    const timeFilterEl = document.getElementById('lead-time-filter');
    
    const selectedTeam = teamFilterEl?.value || '';
    const selectedTime = timeFilterEl?.value || '';
    
    // Process leads data - TRY MULTIPLE APPROACHES
    const leadsByAgent = {};
    
    console.log('🔍 Checking different data sources...');
    
    // Method 1: From 'lead' type data
    const leadTypeData = data.salesteam.filter(item => item.type === 'lead');
    console.log('📊 Lead type data found:', leadTypeData.length, leadTypeData);
    
    leadTypeData.forEach(item => {
        const agent = item.team || item.agent || 'Unknown';
        const leads = parseInt(item.total_lead) || 0;
        
        // Apply team filter
        if (selectedTeam && agent !== selectedTeam) return;
        
        if (leads > 0) {
            leadsByAgent[agent] = (leadsByAgent[agent] || 0) + leads;
            console.log(`📈 Added ${leads} leads for ${agent}`);
        }
    });

    // Method 2: From 'power_metrics' type (total_lead_bulan field)
    const powerMetricsData = data.salesteam.filter(item => item.type === 'power_metrics');
    console.log('📊 Power metrics data found:', powerMetricsData.length, powerMetricsData);
    
    powerMetricsData.forEach(item => {
        const agent = item.team || item.agent || 'Unknown';
        const leads = parseInt(item.total_lead_bulan) || 0;
        
        // Apply team filter
        if (selectedTeam && agent !== selectedTeam) return;
        
        if (leads > 0) {
            leadsByAgent[agent] = (leadsByAgent[agent] || 0) + leads;
            console.log(`📈 Added ${leads} monthly leads for ${agent}`);
        }
    });

    // Method 3: If still no data, try other possible fields
    if (Object.keys(leadsByAgent).length === 0) {
        console.log('⚠️ No standard lead data found, trying alternative fields...');
        
        data.salesteam.forEach(item => {
            const agent = item.team || item.agent || item.name || 'Unknown';
            
            // Try multiple possible lead fields
            const leads = parseInt(item.leads) || 
                         parseInt(item.lead_count) || 
                         parseInt(item.total_leads) ||
                         parseInt(item.cold) + parseInt(item.warm) + parseInt(item.hot) || 
                         0;
            
            // Apply team filter
            if (selectedTeam && agent !== selectedTeam) return;
            
            if (leads > 0) {
                leadsByAgent[agent] = (leadsByAgent[agent] || 0) + leads;
                console.log(`📈 Added ${leads} leads (alternative) for ${agent}`);
            }
        });
    }

    console.log('📊 Final leads by agent:', leadsByAgent);

    // Render the chart
    renderLeadDistributionChart(leadsByAgent, selectedTeam, selectedTime);
    
    // Update info
    updateLeadDistributionInfo(leadsByAgent);
}

// SIMPLIFIED dropdown initialization
function initializeLeadDistributionDropdowns() {
    const chartContainer = document.querySelector('#leadsChart')?.parentElement;
    if (!chartContainer) {
        console.warn('Chart container not found');
        return;
    }
    
    // Check if dropdowns already exist
    if (chartContainer.querySelector('.lead-filters')) {
        return;
    }
    
    // Create simple filter container
    const filterContainer = document.createElement('div');
    filterContainer.className = 'lead-filters mb-3';
    filterContainer.innerHTML = `
        <div class="flex gap-2 text-xs">
            <select id="lead-team-filter" class="bg-gray-800 text-white rounded px-2 py-1 border border-gray-600">
                <option value="">Semua Team</option>
            </select>
            <select id="lead-time-filter" class="bg-gray-800 text-white rounded px-2 py-1 border border-gray-600">
                <option value="">Semua Masa</option>
                <option value="09:30">9:30 AM</option>
                <option value="14:00">2:00 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="20:30">8:30 PM</option>
            </select>
        </div>
    `;
    
    // Insert before chart
    chartContainer.insertBefore(filterContainer, chartContainer.firstChild);
    
    // Populate team dropdown
    populateTeamDropdown();
    
    // Add event listeners
    const teamFilter = document.getElementById('lead-team-filter');
    const timeFilter = document.getElementById('lead-time-filter');
    
    if (teamFilter) {
        teamFilter.addEventListener('change', () => {
            const filteredData = {
                salesteam: filterSalesTeamData(allData.salesteam, currentFilters.startDate, currentFilters.endDate, currentFilters.agent)
            };
            updateEnhancedLeadsChart(filteredData);
        });
    }
    
    if (timeFilter) {
        timeFilter.addEventListener('change', () => {
            const filteredData = {
                salesteam: filterSalesTeamData(allData.salesteam, currentFilters.startDate, currentFilters.endDate, currentFilters.agent)
            };
            updateEnhancedLeadsChart(filteredData);
        });
    }
}
// Render the lead distribution chart  

// Populate team dropdown
function populateTeamDropdown() {
    const teamSelect = document.getElementById('lead-team-filter');
    if (!teamSelect || !allData.salesteam) return;
    
    // Get unique teams
    const teams = [...new Set(allData.salesteam
        .map(item => item.team || item.agent)
        .filter(Boolean)
    )].sort();
    
    console.log('Available teams:', teams);
    
    // Clear and repopulate
    teamSelect.innerHTML = '<option value="">Semua Team</option>';
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    });
}

// Process lead distribution data with time-based filtering
function processLeadDistributionData(data, selectedTeam, selectedTime) {
    console.log('Processing lead distribution data...', { selectedTeam, selectedTime });
    
    // First populate team dropdown
    populateLeadTeamDropdown(data.salesteam);
    
    // Filter sales team data for leads only
    let leadData = data.salesteam.filter(item => item.type === 'lead');
    
    // Apply team filter
    if (selectedTeam) {
        leadData = leadData.filter(item => item.team === selectedTeam);
    }
    
    // Group by team and get latest entry for each time slot
    const teamTimeData = {};
    
    leadData.forEach(item => {
        const team = item.team || 'Unknown';
        const itemTime = item.masa; // e.g., "09:30", "14:00", etc.
        const itemDate = item.tarikh;
        
        // Create unique key for team-date-time combination
        const key = `${team}-${itemDate}`;
        
        if (!teamTimeData[key]) {
            teamTimeData[key] = {};
        }
        
        // Store the latest entry for each time slot
        if (!teamTimeData[key][itemTime] || 
            new Date(`${itemDate} ${itemTime}`) > new Date(`${teamTimeData[key][itemTime].tarikh} ${teamTimeData[key][itemTime].masa}`)) {
            teamTimeData[key][itemTime] = {
                ...item,
                team: team
            };
        }
    });
    
    // Now extract data based on selected time or all times
    const processedData = {};
    
    Object.values(teamTimeData).forEach(teamDateData => {
        Object.values(teamDateData).forEach(timeEntry => {
            const team = timeEntry.team;
            const time = timeEntry.masa;
            
            // Apply time filter if selected
            if (selectedTime && time !== selectedTime) {
                return;
            }
            
            if (!processedData[team]) {
                processedData[team] = {
                    totalLeads: 0,
                    cold: 0,
                    warm: 0,
                    hot: 0,
                    timeSlots: {}
                };
            }
            
            // Use latest data for each time slot (not sum)
            if (!processedData[team].timeSlots[time] || 
                new Date(`${timeEntry.tarikh} ${timeEntry.masa}`) > 
                new Date(`${processedData[team].timeSlots[time].tarikh} ${processedData[team].timeSlots[time].masa}`)) {
                
                processedData[team].timeSlots[time] = {
                    totalLeads: parseInt(timeEntry.total_lead) || 0,
                    cold: parseInt(timeEntry.cold) || 0,
                    warm: parseInt(timeEntry.warm) || 0,
                    hot: parseInt(timeEntry.hot) || 0,
                    tarikh: timeEntry.tarikh,
                    masa: timeEntry.masa
                };
            }
        });
    });
    
    // Calculate totals from latest time slot data
    Object.keys(processedData).forEach(team => {
        const timeSlots = processedData[team].timeSlots;
        
        if (selectedTime) {
            // Show only selected time data
            const timeData = timeSlots[selectedTime];
            if (timeData) {
                processedData[team].totalLeads = timeData.totalLeads;
                processedData[team].cold = timeData.cold;
                processedData[team].warm = timeData.warm;
                processedData[team].hot = timeData.hot;
            } else {
                // No data for selected time
                processedData[team].totalLeads = 0;
                processedData[team].cold = 0;
                processedData[team].warm = 0;
                processedData[team].hot = 0;
            }
        } else {
            // Show latest data from each time slot (not sum, but latest update)
            let latestEntry = null;
            let latestDateTime = null;
            
            Object.values(timeSlots).forEach(timeData => {
                const entryDateTime = new Date(`${timeData.tarikh} ${timeData.masa}`);
                if (!latestDateTime || entryDateTime > latestDateTime) {
                    latestDateTime = entryDateTime;
                    latestEntry = timeData;
                }
            });
            
            if (latestEntry) {
                processedData[team].totalLeads = latestEntry.totalLeads;
                processedData[team].cold = latestEntry.cold;
                processedData[team].warm = latestEntry.warm;
                processedData[team].hot = latestEntry.hot;
            }
        }
    });
    
    // Calculate marketing spend data
    const marketingSpendData = calculateMarketingSpendPerLead(data.marketing, processedData);
    
    console.log('Processed lead distribution data:', processedData);
    console.log('Marketing spend data:', marketingSpendData);
    
    return {
        leadData: processedData,
        spendData: marketingSpendData,
        selectedTeam,
        selectedTime
    };
}

// Calculate marketing spend per lead
function calculateMarketingSpendPerLead(marketingData, leadData) {
    // Get total spend from "lead_semasa" type in marketing data
    const totalSpend = marketingData
        .filter(item => item.type === 'lead_semasa')
        .reduce((sum, item) => sum + (parseFloat(item.spend) || 0), 0);
    
    // Get total leads
    const totalLeads = Object.values(leadData)
        .reduce((sum, teamData) => sum + teamData.totalLeads, 0);
    
    const spendPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
    
    return {
        totalSpend,
        totalLeads,
        spendPerLead
    };
}

// SIMPLIFIED chart rendering
function renderLeadDistributionChart(leadsByAgent, selectedTeam, selectedTime) {
    const ctx = document.getElementById('leadsChart')?.getContext('2d');
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }
    
    // Destroy existing chart
    if (leadDistributionChart) {
        leadDistributionChart.destroy();
        leadDistributionChart = null;
    }
    
    const teams = Object.keys(leadsByAgent);
    const leadCounts = Object.values(leadsByAgent);
    const totalLeads = leadCounts.reduce((sum, count) => sum + count, 0);
    
    console.log('📊 Chart data:', { teams, leadCounts, totalLeads });
    
    // Handle empty data
    if (teams.length === 0 || totalLeads === 0) {
        console.log('⚠️ No data for chart, showing empty state');
        
        leadDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Tiada Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#374151'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: false 
                    },
                    tooltip: {
                        callbacks: {
                            label: () => 'Tiada data lead tersedia'
                        }
                    }
                }
            }
        });
        return;
    }
    
    // Create chart with data
    const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EF4444', '#F97316'];
    
    leadDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: teams,
            datasets: [{
                data: leadCounts,
                backgroundColor: colors.slice(0, teams.length),
                borderColor: colors.slice(0, teams.length).map(color => color + '80'),
                borderWidth: 2,
                hoverOffset: 8
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
                        padding: 12,
                        usePointStyle: true,
                        font: { size: 10 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#F9FAFB',
                    bodyColor: '#F9FAFB',
                    borderColor: '#374151',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} leads (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                duration: 1000
            }
        }
    });
    
    console.log('✅ Chart rendered successfully');
}

// Update info display
function updateLeadDistributionInfo(leadsByAgent) {
    const totalLeads = Object.values(leadsByAgent).reduce((sum, count) => sum + count, 0);
    
    // Try to update any lead info displays
    const infoElements = [
        'total-leads-display',
        'lead-distribution-info',
        'leads-info'
    ];
    
    infoElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'total-leads-display') {
                element.textContent = totalLeads.toString();
            } else {
                element.textContent = `Total: ${totalLeads} leads`;
            }
        }
    });
    
    console.log('📊 Total leads displayed:', totalLeads);
}

// DEBUGGING FUNCTIONS - Add these to help diagnose
window.debugLeadsChart = function() {
    console.log('🔍 === DEBUGGING LEADS CHART ===');
    
    if (!allData || !allData.salesteam) {
        console.log('❌ No salesteam data available');
        return;
    }

    console.log('📊 Total salesteam records:', allData.salesteam.length);
    
    // Show sample data
    console.log('📋 Sample salesteam data:');
    allData.salesteam.slice(0, 5).forEach((item, index) => {
        console.log(`[${index}]`, {
            type: item.type,
            team: item.team || item.agent,
            total_lead: item.total_lead,
            total_lead_bulan: item.total_lead_bulan,
            leads: item.leads,
            cold: item.cold,
            warm: item.warm,
            hot: item.hot
        });
    });
    
    // Show all unique types
    const types = [...new Set(allData.salesteam.map(item => item.type))];
    console.log('📋 Available types:', types);
    
    // Count by type
    types.forEach(type => {
        const count = allData.salesteam.filter(item => item.type === type).length;
        console.log(`   - ${type}: ${count} records`);
    });
    
    console.log('🔍 === END DEBUG ===');
    
    // Force refresh chart
    const filteredData = {
        salesteam: filterSalesTeamData(allData.salesteam, currentFilters.startDate, currentFilters.endDate, currentFilters.agent)
    };
    updateEnhancedLeadsChart(filteredData);
};

// Test function
window.testLeadsChart = function() {
    console.log('🧪 Testing Leads Chart...');
    window.debugLeadsChart();
}

// Update marketing budget display
function updateMarketingBudgetDisplay(marketingData) {
    const totalSpend = marketingData
        .filter(item => item.type === 'lead_semasa')
        .reduce((sum, item) => sum + (parseFloat(item.spend) || 0), 0);
    
    const budgetDisplay = document.getElementById('marketing-budget-display');
    if (budgetDisplay) {
        budgetDisplay.textContent = `RM ${totalSpend.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    return totalSpend;
}

// Calculate and display lead efficiency
function updateLeadEfficiencyDisplay(salesTeamData) {
    // Calculate conversion rate from leads to sales
    const leadData = salesTeamData.filter(item => item.type === 'lead');
    const powerMetricsData = salesTeamData.filter(item => item.type === 'power_metrics');
    
    const totalLeads = leadData.reduce((sum, item) => sum + (parseInt(item.total_lead) || 0), 0);
    const totalCloses = powerMetricsData.reduce((sum, item) => sum + (parseInt(item.total_close_bulan) || 0), 0);
    
    const efficiency = totalLeads > 0 ? (totalCloses / totalLeads) * 100 : 0;
    
    const efficiencyDisplay = document.getElementById('lead-efficiency-display');
    if (efficiencyDisplay) {
        efficiencyDisplay.textContent = `${efficiency.toFixed(1)}%`;
    }
    
    return efficiency;
}

// Handle real-time lead updates
function handleRealTimeLeadUpdates(newLeadData) {
    console.log('📡 Processing real-time lead update:', newLeadData);
    
    // Add to global data
    allData.salesteam.push({
        ...newLeadData,
        createdAt: new Date(),
        type: 'lead'
    });
    
    // Refresh the lead distribution chart
    const filteredData = {
        marketing: filterByDate(allData.marketing, currentFilters.startDate, currentFilters.endDate),
        salesteam: filterSalesTeamData(allData.salesteam, currentFilters.startDate, currentFilters.endDate, currentFilters.agent)
    };
    
    updateEnhancedLeadsChart(filteredData);
    updateLeadEfficiencyDisplay(filteredData.salesteam);
    
    // Show notification
    showLeadUpdateNotification(newLeadData);
}

// Show lead update notifications
function showLeadUpdateNotification(leadData) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm animate-bounce';
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="text-xl">📊</div>
            <div>
                <div class="font-semibold text-sm">Lead Update</div>
                <div class="text-xs mt-1">${leadData.team} - ${leadData.total_lead} leads pada ${leadData.masa}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200 ml-2">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification && notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}