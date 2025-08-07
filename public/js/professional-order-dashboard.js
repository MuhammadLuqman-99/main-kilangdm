// Professional Order Dashboard JavaScript
// Clean, focused order analytics with real data integration

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initializing Professional Order Dashboard...');
    
    // Wait for Firebase
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkFirebase = setInterval(() => {
        attempts++;
        console.log(`Checking Firebase for orders... Attempt ${attempts}`);
        
        if (window.db) {
            console.log('Firebase ready, loading order data...');
            clearInterval(checkFirebase);
            initializeOrderDashboard();
        } else if (attempts >= maxAttempts) {
            console.error('Firebase initialization timeout');
            clearInterval(checkFirebase);
            showErrorState();
        }
    }, 100);
});

// ===================================================
// MAIN INITIALIZATION
// ===================================================

async function initializeOrderDashboard() {
    try {
        console.log('📊 Loading order dashboard...');
        
        // Show loading state
        showLoadingState();
        
        // Fetch order data from Firebase
        const orderData = await fetchOrderData();
        console.log('📦 Order data loaded:', orderData.length, 'orders');
        
        // Update dashboard with data
        updateOrderKPIs(orderData);
        updateOrderCharts(orderData);
        updateOrderTables(orderData);
        
        // Setup real-time updates
        setupRealTimeUpdates();
        
        console.log('✅ Order dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing order dashboard:', error);
        showErrorState();
    }
}

// ===================================================
// DATA FETCHING
// ===================================================

async function fetchOrderData() {
    try {
        const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        
        const ordersRef = collection(window.db, 'ecommerce');
        const q = query(ordersRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().date || doc.data().created_at)
            });
        });
        
        return orders;
        
    } catch (error) {
        console.error('Error fetching order data:', error);
        return [];
    }
}

// ===================================================
// KPI UPDATES
// ===================================================

function updateOrderKPIs(orders) {
    console.log('📈 Updating order KPIs...');
    
    const today = new Date();
    const todayString = today.toDateString();
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Today's data
    const todayOrders = orders.filter(order => 
        new Date(order.timestamp).toDateString() === todayString
    );
    
    // Last 30 days data
    const last30DaysOrders = orders.filter(order => 
        new Date(order.timestamp) >= last30Days
    );
    
    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => 
        sum + (parseFloat(order.amount) || 0), 0
    );
    
    const totalOrders = orders.length;
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const todayRevenue = todayOrders.reduce((sum, order) => 
        sum + (parseFloat(order.amount) || 0), 0
    );
    
    const todayOrderCount = todayOrders.length;
    const todayAOV = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0;
    
    // Update header stats
    updateElement('today-orders', todayOrderCount);
    updateElement('today-revenue', formatCurrency(todayRevenue));
    updateElement('today-aov', formatCurrency(todayAOV));
    
    // Update KPI cards
    updateElement('total-revenue', formatCurrency(totalRevenue));
    updateElement('total-orders', totalOrders);
    updateElement('avg-order-value', formatCurrency(avgOrderValue));
    
    // Calculate trends (compare with previous period)
    const previousPeriod = orders.filter(order => {
        const orderDate = new Date(order.timestamp);
        const previous30Days = new Date(last30Days.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= previous30Days && orderDate < last30Days;
    });
    
    const prevRevenue = previousPeriod.reduce((sum, order) => 
        sum + (parseFloat(order.amount) || 0), 0
    );
    
    const revenueGrowth = prevRevenue > 0 ? 
        ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;
    
    const ordersGrowth = previousPeriod.length > 0 ? 
        ((totalOrders - previousPeriod.length) / previousPeriod.length * 100).toFixed(1) : 0;
    
    // Update trends
    updateTrend('revenue-trend', revenueGrowth);
    updateTrend('orders-trend', ordersGrowth);
    
    // Update meta information
    updateElement('revenue-period', 'last 30 days');
    updateElement('revenue-orders', `${last30DaysOrders.length} orders`);
    updateElement('orders-period', 'processed');
    updateElement('orders-status', 'active');
    
    console.log('📊 KPIs updated:', {
        totalRevenue: formatCurrency(totalRevenue),
        totalOrders,
        avgOrderValue: formatCurrency(avgOrderValue),
        todayOrders: todayOrderCount
    });
}

// ===================================================
// CHART UPDATES
// ===================================================

function updateOrderCharts(orders) {
    console.log('📈 Updating order charts...');
    
    // Main trend chart
    updateOrderTrendChart(orders);
    
    // Order sources chart
    updateOrderSourcesChart(orders);
    
    // Top products chart
    updateTopProductsChart(orders);
}

function updateOrderTrendChart(orders) {
    const ctx = document.getElementById('orderTrendChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.orderTrendChartInstance) {
        window.orderTrendChartInstance.destroy();
        console.log('🗑️ Previous order trend chart destroyed');
    }
    
    // Get last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last30Days.push(date);
    }
    
    // Group orders by day
    const dailyOrders = last30Days.map(date => {
        const dayOrders = orders.filter(order => 
            new Date(order.timestamp).toDateString() === date.toDateString()
        );
        
        return {
            date: date,
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0)
        };
    });
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyOrders.map(day => day.date.toLocaleDateString('ms-MY', { 
                month: 'short', 
                day: 'numeric' 
            })),
            datasets: [{
                label: 'Orders',
                data: dailyOrders.map(day => day.orders),
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f620',
                fill: true,
                yAxisID: 'y'
            }, {
                label: 'Revenue',
                data: dailyOrders.map(day => day.revenue),
                borderColor: '#22c55e',
                backgroundColor: '#22c55e20',
                fill: true,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Orders: ${context.raw}`;
                            } else {
                                return `Revenue: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)'
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
                        color: 'rgba(59, 130, 246, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: '#22c55e',
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
    
    // Store chart instance globally for future destruction
    window.orderTrendChartInstance = chart;
    console.log('✅ Order trend chart created successfully');
}

function updateOrderSourcesChart(orders) {
    const ctx = document.getElementById('orderSourcesChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.orderSourcesChartInstance) {
        window.orderSourcesChartInstance.destroy();
        console.log('🗑️ Previous order sources chart destroyed');
    }
    
    // Group by platform/source
    const sources = {};
    orders.forEach(order => {
        const source = order.platform || order.channel || order.source || 'Direct';
        sources[source] = (sources[source] || 0) + 1;
    });
    
    const labels = Object.keys(sources);
    const data = Object.values(sources);
    
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', 
                    '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
                ].slice(0, labels.length),
                borderColor: '#0f172a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Store chart instance globally for future destruction
    window.orderSourcesChartInstance = chart;
    console.log('✅ Order sources chart created successfully');
}

function updateTopProductsChart(orders) {
    const ctx = document.getElementById('topProductsChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.topProductsChartInstance) {
        window.topProductsChartInstance.destroy();
        console.log('🗑️ Previous top products chart destroyed');
    }
    
    // Group by product
    const products = {};
    orders.forEach(order => {
        const product = order.product_name || order.product || 'Unknown Product';
        const amount = parseFloat(order.amount) || 0;
        products[product] = (products[product] || 0) + amount;
    });
    
    // Get top 5 products
    const sortedProducts = Object.entries(products)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const labels = sortedProducts.map(([name]) => name);
    const data = sortedProducts.map(([,value]) => value);
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: '#8b5cf6',
                borderColor: '#7c3aed',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
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
                            return `Revenue: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(59, 130, 246, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return formatCurrency(value);
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
            }
        }
    });
    
    // Store chart instance globally for future destruction
    window.topProductsChartInstance = chart;
    console.log('✅ Top products chart created successfully');
}

// ===================================================
// TABLE UPDATES
// ===================================================

function updateOrderTables(orders) {
    console.log('📋 Updating order tables...');
    
    // Recent orders
    updateRecentOrders(orders);
    
    // Top performers
    updateTopPerformers(orders);
}

function updateRecentOrders(orders) {
    const container = document.getElementById('recent-orders');
    if (!container) return;
    
    // Get last 10 orders
    const recentOrders = orders
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    
    if (recentOrders.length === 0) {
        container.innerHTML = '<div class="order-loading">No recent orders found</div>';
        return;
    }
    
    container.innerHTML = recentOrders.map(order => `
        <div class="order-data-item">
            <div class="order-data-item-info">
                <div class="order-data-item-name">${order.customer_name || 'Customer'}</div>
                <div class="order-data-item-meta">
                    ${order.product_name || 'Product'} • ${formatDateTime(order.timestamp)}
                </div>
            </div>
            <div class="order-data-item-value">
                ${formatCurrency(parseFloat(order.amount) || 0)}
                <div class="order-data-item-trend trend-positive">
                    ${order.platform || 'Direct'}
                </div>
            </div>
        </div>
    `).join('');
}

function updateTopPerformers(orders) {
    const container = document.getElementById('top-performers');
    if (!container) return;
    
    // Group by agent/salesperson
    const performers = {};
    orders.forEach(order => {
        const agent = order.agent_name || order.salesperson || 'Direct Sales';
        const amount = parseFloat(order.amount) || 0;
        
        if (!performers[agent]) {
            performers[agent] = { orders: 0, revenue: 0 };
        }
        
        performers[agent].orders += 1;
        performers[agent].revenue += amount;
    });
    
    // Sort by revenue and get top 10
    const topPerformers = Object.entries(performers)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .slice(0, 10);
    
    if (topPerformers.length === 0) {
        container.innerHTML = '<div class="order-loading">No performance data found</div>';
        return;
    }
    
    container.innerHTML = topPerformers.map(([name, data]) => `
        <div class="order-data-item">
            <div class="order-data-item-info">
                <div class="order-data-item-name">${name}</div>
                <div class="order-data-item-meta">
                    ${data.orders} orders • Avg: ${formatCurrency(data.revenue / data.orders)}
                </div>
            </div>
            <div class="order-data-item-value">
                ${formatCurrency(data.revenue)}
                <div class="order-data-item-trend trend-positive">
                    Top Performer
                </div>
            </div>
        </div>
    `).join('');
}

// ===================================================
// UTILITY FUNCTIONS
// ===================================================

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function updateTrend(id, value) {
    const element = document.getElementById(id);
    if (element) {
        const numValue = parseFloat(value);
        if (numValue > 0) {
            element.textContent = `+${value}%`;
            element.className = 'order-kpi-trend';
        } else if (numValue < 0) {
            element.textContent = `${value}%`;
            element.className = 'order-kpi-trend negative';
        } else {
            element.textContent = 'stable';
            element.className = 'order-kpi-trend';
        }
    }
}

function formatCurrency(amount) {
    return 'RM ' + parseFloat(amount).toLocaleString('ms-MY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleDateString('ms-MY', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoadingState() {
    // Add loading indicators to key elements
    const loadingElements = [
        'today-orders', 'today-revenue', 'today-aov',
        'total-revenue', 'total-orders', 'avg-order-value'
    ];
    
    loadingElements.forEach(id => {
        updateElement(id, '...');
    });
}

function showErrorState() {
    console.error('Failed to load order dashboard');
    
    const errorElements = [
        'today-orders', 'today-revenue', 'today-aov',
        'total-revenue', 'total-orders', 'avg-order-value'
    ];
    
    errorElements.forEach(id => {
        updateElement(id, 'Error');
    });
}

function setupRealTimeUpdates() {
    // Update every 5 minutes
    setInterval(async () => {
        console.log('🔄 Refreshing order data...');
        const orderData = await fetchOrderData();
        updateOrderKPIs(orderData);
    }, 5 * 60 * 1000);
}

console.log('📦 Professional Order Dashboard loaded!');