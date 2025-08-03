// Import Firestore functions
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    where, 
    limit,
    Timestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables
let allOrderData = [];
let filteredOrderData = [];
let charts = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be initialized
    if (window.db) {
        initializeOrderAnalytics();
    } else {
        setTimeout(() => {
            if (window.db) {
                initializeOrderAnalytics();
            } else {
                console.error('Firebase not initialized after timeout');
            }
        }, 2000);
    }
});

async function initializeOrderAnalytics() {
    console.log('Initializing Order Analytics...');
    
    try {
        // Load order data
        await loadOrderData();
        
        // Initialize UI components
        initializeFilters();
        initializeCharts();
        
        // Initial render
        updateAnalytics();
        
        console.log('Order Analytics initialized successfully');
    } catch (error) {
        console.error('Error initializing Order Analytics:', error);
        showError('Gagal memuatkan data analytics. Sila refresh halaman.');
    }
}

async function loadOrderData() {
    try {
        console.log('Loading order data from Firestore...');
        
        const ordersCollection = collection(window.db, 'orderData');
        const q = query(ordersCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allOrderData = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Add document ID for reference
            data.id = doc.id;
            
            // Convert Firestore Timestamp to Date if needed
            if (data.createdAt && data.createdAt.seconds) {
                data.createdAt = new Date(data.createdAt.seconds * 1000);
            }
            
            // Ensure required fields have default values
            data.tarikh = data.tarikh || new Date().toISOString().split('T')[0];
            data.total_rm = parseFloat(data.total_rm) || 0;
            data.platform = data.platform || 'Unknown';
            data.team_sale = data.team_sale || 'Unknown';
            data.source = data.source || 'manual_form';
            
            allOrderData.push(data);
        });
        
        filteredOrderData = [...allOrderData];
        
        console.log(`Loaded ${allOrderData.length} orders`);
        
        // Log data sources for debugging
        const sourceCounts = allOrderData.reduce((acc, order) => {
            acc[order.source] = (acc[order.source] || 0) + 1;
            return acc;
        }, {});
        console.log('Orders by source:', sourceCounts);
        
    } catch (error) {
        console.error('Error loading order data:', error);
        throw error;
    }
}

function initializeFilters() {
    // Date filters
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
        // Set default date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        startDateInput.value = startDate.toISOString().split('T')[0];
        endDateInput.value = endDate.toISOString().split('T')[0];
    }
    
    // Populate agent filter
    populateAgentFilter();
    
    // Add event listeners
    const applyFilterBtn = document.getElementById('apply-filter');
    const clearFilterBtn = document.getElementById('clear-filter');
    
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyFilters);
    }
    
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', clearFilters);
    }
}

function populateAgentFilter() {
    const agentFilter = document.getElementById('agent-filter');
    if (!agentFilter) return;
    
    // Get unique team sales from data
    const teams = [...new Set(allOrderData.map(order => order.team_sale))].filter(Boolean);
    
    // Clear existing options (keep the first "Semua Agent" option)
    agentFilter.innerHTML = '<option value="">Semua Agent</option>';
    
    // Add team options
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        agentFilter.appendChild(option);
    });
}

function applyFilters() {
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;
    const selectedAgent = document.getElementById('agent-filter')?.value;
    
    filteredOrderData = allOrderData.filter(order => {
        let matches = true;
        
        // Date filter
        if (startDate || endDate) {
            const orderDate = new Date(order.tarikh);
            if (startDate && orderDate < new Date(startDate)) matches = false;
            if (endDate && orderDate > new Date(endDate)) matches = false;
        }
        
        // Agent filter
        if (selectedAgent && order.team_sale !== selectedAgent) {
            matches = false;
        }
        
        return matches;
    });
    
    // Update active filters display
    updateActiveFiltersDisplay();
    
    // Update analytics with filtered data
    updateAnalytics();
    
    console.log(`Applied filters: ${filteredOrderData.length} orders match criteria`);
}

function clearFilters() {
    // Reset date filters
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const agentFilter = document.getElementById('agent-filter');
    
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    if (agentFilter) agentFilter.value = '';
    
    // Reset filtered data
    filteredOrderData = [...allOrderData];
    
    // Hide active filters
    const activeFiltersDiv = document.getElementById('active-filters');
    if (activeFiltersDiv) {
        activeFiltersDiv.classList.add('hidden');
    }
    
    // Update analytics
    updateAnalytics();
}

function updateActiveFiltersDisplay() {
    const activeFiltersDiv = document.getElementById('active-filters');
    const filterTagsDiv = document.getElementById('filter-tags');
    
    if (!activeFiltersDiv || !filterTagsDiv) return;
    
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;
    const selectedAgent = document.getElementById('agent-filter')?.value;
    
    let tags = [];
    
    if (startDate) tags.push(`From: ${startDate}`);
    if (endDate) tags.push(`To: ${endDate}`);
    if (selectedAgent) tags.push(`Team: ${selectedAgent}`);
    
    if (tags.length > 0) {
        filterTagsDiv.innerHTML = tags.map(tag => 
            `<span class="filter-tag">${tag}</span>`
        ).join('');
        activeFiltersDiv.classList.remove('hidden');
    } else {
        activeFiltersDiv.classList.add('hidden');
    }
}

function updateAnalytics() {
    updateStatistics();
    updateCharts();
    updateBreakdowns();
    updateRecentOrders();
}

function updateStatistics() {
    const data = filteredOrderData;
    
    // Calculate basic stats
    const totalRevenue = data.reduce((sum, order) => sum + (order.total_rm || 0), 0);
    const totalOrders = data.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const activePlatforms = new Set(data.map(order => order.platform)).size;
    
    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = data.filter(order => order.tarikh === today);
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total_rm || 0), 0);
    const todayAvg = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;
    
    // Update main statistics  
    updateElement('total-order-revenue', `RM ${totalRevenue.toLocaleString('ms-MY', {minimumFractionDigits: 2})}`);
    updateElement('total-order-count', totalOrders.toLocaleString());
    updateElement('avg-order-value', `RM ${avgOrderValue.toLocaleString('ms-MY', {minimumFractionDigits: 2})}`);
    updateElement('active-platforms', activePlatforms.toString());
    
    // Update today's stats
    updateElement('total-orders-today', todayOrders.length.toString());
    updateElement('total-revenue-today', `RM ${todayRevenue.toLocaleString('ms-MY', {minimumFractionDigits: 2})}`);
    updateElement('avg-order-today', `RM ${todayAvg.toLocaleString('ms-MY', {minimumFractionDigits: 2})}`);
    
    // Update period text
    updateElement('revenue-period', `dari ${totalOrders} order`);
    updateElement('volume-period', 'jumlah order');
    updateElement('avg-period', 'purata per order');
    updateElement('platform-period', 'platform aktif');
}

function initializeCharts() {
    // Initialize Order Trend Chart
    const trendCtx = document.getElementById('orderTrendChart');
    if (trendCtx) {
        charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Orders',
                    data: [],
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96, 165, 250, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Revenue (RM)',
                    data: [],
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e2e8f0' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: { color: '#94a3b8' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }
    
    // Initialize Timeline Chart
    const timelineCtx = document.getElementById('orderTimelineChart');
    if (timelineCtx) {
        charts.timeline = new Chart(timelineCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Orders',
                    data: [],
                    backgroundColor: 'rgba(96, 165, 250, 0.8)',
                    borderColor: '#60a5fa',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e2e8f0' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }
}

function updateCharts() {
    updateTrendChart();
    updateTimelineChart();
}

function updateTrendChart() {
    if (!charts.trend) return;
    
    const data = filteredOrderData;
    
    // Group data by date (last 30 days)
    const dateGroups = {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29); // 30 days total
    
    // Initialize all dates with 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateGroups[dateStr] = { count: 0, revenue: 0 };
    }
    
    // Populate with actual data
    data.forEach(order => {
        const date = order.tarikh;
        if (dateGroups[date]) {
            dateGroups[date].count++;
            dateGroups[date].revenue += order.total_rm || 0;
        }
    });
    
    const labels = Object.keys(dateGroups).sort().map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('ms-MY', { month: 'short', day: 'numeric' });
    });
    
    const orderData = Object.keys(dateGroups).sort().map(date => dateGroups[date].count);
    const revenueData = Object.keys(dateGroups).sort().map(date => dateGroups[date].revenue);
    
    charts.trend.data.labels = labels;
    charts.trend.data.datasets[0].data = orderData;
    charts.trend.data.datasets[1].data = revenueData;
    charts.trend.update();
}

function updateTimelineChart() {
    if (!charts.timeline) return;
    
    const data = filteredOrderData;
    
    // Group by current view (daily for now)
    const hourGroups = {};
    
    // Initialize 24 hours
    for (let i = 0; i < 24; i++) {
        hourGroups[i] = 0;
    }
    
    // Group by hour of creation (using createdAt if available, otherwise use tarikh)
    data.forEach(order => {
        let hour;
        if (order.createdAt instanceof Date) {
            hour = order.createdAt.getHours();
        } else {
            // Fallback to midday if no time info
            hour = 12;
        }
        hourGroups[hour]++;
    });
    
    const labels = Object.keys(hourGroups).map(hour => `${hour}:00`);
    const orderData = Object.values(hourGroups);
    
    charts.timeline.data.labels = labels;
    charts.timeline.data.datasets[0].data = orderData;
    charts.timeline.update();
}

function updateBreakdowns() {
    updatePlatformBreakdown();
    updateTeamBreakdown();
}

function updatePlatformBreakdown() {
    const platformBreakdownDiv = document.getElementById('platform-breakdown');
    if (!platformBreakdownDiv) return;
    
    const data = filteredOrderData;
    
    // Group by platform
    const platformStats = {};
    data.forEach(order => {
        const platform = order.platform || 'Unknown';
        if (!platformStats[platform]) {
            platformStats[platform] = { count: 0, revenue: 0 };
        }
        platformStats[platform].count++;
        platformStats[platform].revenue += order.total_rm || 0;
    });
    
    // Sort by count descending
    const sortedPlatforms = Object.entries(platformStats)
        .sort((a, b) => b[1].count - a[1].count);
    
    const total = data.length;
    
    platformBreakdownDiv.innerHTML = sortedPlatforms.map(([platform, stats]) => {
        const percentage = total > 0 ? (stats.count / total * 100).toFixed(1) : 0;
        return `
            <div class="breakdown-item">
                <div class="breakdown-info">
                    <span class="breakdown-name">${platform}</span>
                    <span class="breakdown-value">${stats.count} orders</span>
                </div>
                <div class="breakdown-bar">
                    <div class="breakdown-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="breakdown-stats">
                    <span class="breakdown-percent">${percentage}%</span>
                    <span class="breakdown-revenue">RM ${stats.revenue.toLocaleString('ms-MY', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateTeamBreakdown() {
    const teamBreakdownDiv = document.getElementById('team-breakdown');
    if (!teamBreakdownDiv) return;
    
    const data = filteredOrderData;
    
    // Group by team
    const teamStats = {};
    data.forEach(order => {
        const team = order.team_sale || 'Unknown';
        if (!teamStats[team]) {
            teamStats[team] = { count: 0, revenue: 0 };
        }
        teamStats[team].count++;
        teamStats[team].revenue += order.total_rm || 0;
    });
    
    // Sort by revenue descending
    const sortedTeams = Object.entries(teamStats)
        .sort((a, b) => b[1].revenue - a[1].revenue);
    
    const totalRevenue = data.reduce((sum, order) => sum + (order.total_rm || 0), 0);
    
    teamBreakdownDiv.innerHTML = sortedTeams.map(([team, stats]) => {
        const percentage = totalRevenue > 0 ? (stats.revenue / totalRevenue * 100).toFixed(1) : 0;
        return `
            <div class="breakdown-item">
                <div class="breakdown-info">
                    <span class="breakdown-name">${team}</span>
                    <span class="breakdown-value">${stats.count} orders</span>
                </div>
                <div class="breakdown-bar">
                    <div class="breakdown-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="breakdown-stats">
                    <span class="breakdown-percent">${percentage}%</span>
                    <span class="breakdown-revenue">RM ${stats.revenue.toLocaleString('ms-MY', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateRecentOrders() {
    const tbody = document.getElementById('recent-orders-tbody');
    if (!tbody) return;
    
    // Get 10 most recent orders
    const recentOrders = [...filteredOrderData]
        .sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.tarikh);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.tarikh);
            return dateB - dateA;
        })
        .slice(0, 10);
    
    if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-placeholder">Tiada order dijumpai</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentOrders.map(order => {
        const displayDate = new Date(order.tarikh).toLocaleDateString('ms-MY');
        const customerName = truncateText(order.nama_customer || 'N/A', 20);
        const platform = order.platform || 'N/A';
        const team = order.team_sale || 'N/A';
        const codeKain = order.code_kain || 'N/A';
        const jenisOrder = truncateText(order.jenis_order || 'N/A', 15);
        const amount = `RM ${(order.total_rm || 0).toLocaleString('ms-MY', {minimumFractionDigits: 2})}`;
        const invoice = truncateText(order.nombor_po_invoice || 'N/A', 15);
        
        // Add source indicator
        const sourceIcon = getSourceIcon(order.source);
        
        return `
            <tr>
                <td>
                    <div class="order-code-cell">
                        ${codeKain}
                        <span class="source-indicator" title="Source: ${order.source}">${sourceIcon}</span>
                    </div>
                </td>
                <td>${displayDate}</td>
                <td>${customerName}</td>
                <td><span class="team-badge team-${team.toLowerCase()}">${team}</span></td>
                <td><span class="platform-badge platform-${platform.toLowerCase().replace(/\s+/g, '-')}">${platform}</span></td>
                <td>${jenisOrder}</td>
                <td class="amount-cell">${amount}</td>
                <td>${invoice}</td>
            </tr>
        `;
    }).join('');
}

function getSourceIcon(source) {
    switch (source) {
        case 'csv_upload':
            return '<i class="fas fa-file-csv" style="color: #22c55e;"></i>';
        case 'auto_extracted':
            return '<i class="fas fa-robot" style="color: #60a5fa;"></i>';
        case 'manual_form':
            return '<i class="fas fa-edit" style="color: #f59e0b;"></i>';
        default:
            return '<i class="fas fa-question" style="color: #94a3b8;"></i>';
    }
}

function truncateText(text, maxLength) {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="error-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Add timeline button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Timeline buttons for trend chart
    const timelineButtons = document.querySelectorAll('.timeline-btn[data-period]');
    timelineButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            timelineButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update trend chart based on period
            const period = parseInt(this.dataset.period);
            updateTrendChartForPeriod(period);
        });
    });
    
    // Timeline view buttons
    const viewButtons = document.querySelectorAll('.timeline-btn[data-view]');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all view buttons
            viewButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update timeline chart based on view
            const view = this.dataset.view;
            updateTimelineChartForView(view);
        });
    });
});

function updateTrendChartForPeriod(days) {
    if (!charts.trend) return;
    
    const data = filteredOrderData;
    
    // Group data by date for specified period
    const dateGroups = {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    
    // Initialize all dates with 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateGroups[dateStr] = { count: 0, revenue: 0 };
    }
    
    // Populate with actual data
    data.forEach(order => {
        const date = order.tarikh;
        if (dateGroups[date]) {
            dateGroups[date].count++;
            dateGroups[date].revenue += order.total_rm || 0;
        }
    });
    
    const labels = Object.keys(dateGroups).sort().map(date => {
        const d = new Date(date);
        if (days <= 7) {
            return d.toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric' });
        } else {
            return d.toLocaleDateString('ms-MY', { month: 'short', day: 'numeric' });
        }
    });
    
    const orderData = Object.keys(dateGroups).sort().map(date => dateGroups[date].count);
    const revenueData = Object.keys(dateGroups).sort().map(date => dateGroups[date].revenue);
    
    charts.trend.data.labels = labels;
    charts.trend.data.datasets[0].data = orderData;
    charts.trend.data.datasets[1].data = revenueData;
    charts.trend.update();
}

function updateTimelineChartForView(view) {
    if (!charts.timeline) return;
    
    const data = filteredOrderData;
    let groups = {};
    let labels = [];
    
    if (view === 'daily') {
        // Group by hour
        for (let i = 0; i < 24; i++) {
            groups[i] = 0;
        }
        
        data.forEach(order => {
            let hour;
            if (order.createdAt instanceof Date) {
                hour = order.createdAt.getHours();
            } else {
                hour = 12; // Default to midday
            }
            groups[hour]++;
        });
        
        labels = Object.keys(groups).map(hour => `${hour}:00`);
        
    } else if (view === 'weekly') {
        // Group by day of week
        const dayNames = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
        
        for (let i = 0; i < 7; i++) {
            groups[i] = 0;
        }
        
        data.forEach(order => {
            const date = new Date(order.tarikh);
            const dayOfWeek = date.getDay();
            groups[dayOfWeek]++;
        });
        
        labels = dayNames;
        
    } else if (view === 'monthly') {
        // Group by day of month (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            groups[dateStr] = 0;
        }
        
        data.forEach(order => {
            const date = order.tarikh;
            if (groups.hasOwnProperty(date)) {
                groups[date]++;
            }
        });
        
        labels = Object.keys(groups).sort().map(date => {
            const d = new Date(date);
            return d.getDate().toString();
        });
    }
    
    const orderData = Object.values(groups);
    
    charts.timeline.data.labels = labels;
    charts.timeline.data.datasets[0].data = orderData;
    charts.timeline.update();
}

// Export functions for global access
window.loadOrderData = loadOrderData;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;