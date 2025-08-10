// Professional Order Dashboard JavaScript
// Clean, focused order analytics with real data integration

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initializing Professional Order Dashboard...');
    
    // Wait for Firebase with improved timeout and error handling
    let attempts = 0;
    const maxAttempts = 100; // Increased from 50 to 100
    
    const checkFirebase = setInterval(() => {
        attempts++;
        console.log(`🔄 Checking Firebase for orders... Attempt ${attempts}/${maxAttempts}`);
        
        if (window.db) {
            console.log('✅ Firebase ready, loading order data...');
            clearInterval(checkFirebase);
            initializeOrderDashboard();
        } else if (attempts >= maxAttempts) {
            console.error('❌ Firebase initialization timeout after', maxAttempts * 100 / 1000, 'seconds');
            clearInterval(checkFirebase);
            showErrorState();
            
            // Show user-friendly retry option
            setTimeout(() => {
                if (confirm('Connection timeout. Reload page to retry?')) {
                    window.location.reload();
                }
            }, 2000);
        }
    }, 200); // Increased interval from 100ms to 200ms for stability
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
        updateEnhancedOrderDetails(orderData);
        
        // Setup filter event listeners
        setupFilters(orderData);
        
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
        
        console.log('🔍 Fetching from orderData collection...');
        const ordersRef = collection(window.db, 'orderData');
        
        // Try without ordering first to see if there's any data
        let querySnapshot;
        try {
            const q = query(ordersRef, orderBy('createdAt', 'desc'));
            querySnapshot = await getDocs(q);
        } catch (orderError) {
            console.log('⚠️ Ordering by createdAt failed, trying timestamp...');
            try {
                const q = query(ordersRef, orderBy('timestamp', 'desc'));
                querySnapshot = await getDocs(q);
            } catch (timestampError) {
                console.log('⚠️ Ordering failed, fetching all documents...');
                querySnapshot = await getDocs(ordersRef);
            }
        }
        
        const orders = [];
        console.log(`📦 Found ${querySnapshot.size} documents in orderData collection`);
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('🔍 RAW Firebase document:', doc.id);
            console.log('🔍 RAW Firebase data:', JSON.stringify(data, null, 2));
            
            // Log full structure for first few documents
            if (orders.length < 3) {
                console.log('📄 Full Document Structure:', JSON.stringify(data, null, 2));
            }
            
            console.log('📄 Document summary:', {
                id: doc.id,
                keys: Object.keys(data),
                timestamp: data.timestamp,
                createdAt: data.createdAt,
                tarikh: data.tarikh,
                team_sale: data.team_sale,
                source: data.source,
                structuredProducts: data.structuredProducts ? `${data.structuredProducts.length} products` : 'none',
                products: data.products ? `${data.products.length} products` : 'none',
                platform: data.platform,
                nama_customer: data.nama_customer,
                nombor_po_invoice: data.nombor_po_invoice,
                uniqueSizes: data.uniqueSizes,
                totalQuantity: data.totalQuantity,
                productCount: data.productCount,
                sizeCount: data.sizeCount
            });
            
            orders.push({
                id: doc.id,
                ...data,
                // Handle different timestamp formats
                timestamp: data.timestamp?.toDate?.() || 
                          data.createdAt?.toDate?.() || 
                          new Date(data.tarikh || data.date || Date.now())
            });
        });
        
        console.log(`✅ Processed ${orders.length} orders for dashboard`);
        if (orders.length > 0) {
            console.log('📊 Sample order:', orders[0]);
        }
        
        return orders;
        
    } catch (error) {
        console.error('❌ Error fetching order data:', error);
        return [];
    }
}

// ===================================================
// KPI UPDATES
// ===================================================

function updateOrderKPIs(orders) {
    console.log('📈 Updating order KPIs with', orders.length, 'orders');
    
    const today = new Date();
    const todayString = today.toDateString();
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Today's data
    const todayOrders = orders.filter(order => 
        new Date(order.timestamp || order.createdAt || order.tarikh).toDateString() === todayString
    );
    
    // Last 30 days data
    const last30DaysOrders = orders.filter(order => 
        new Date(order.timestamp || order.createdAt || order.tarikh) >= last30Days
    );
    
    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => 
        sum + (parseFloat(order.total_rm || order.amount) || 0), 0
    );
    
    const totalOrders = orders.length;
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const todayRevenue = todayOrders.reduce((sum, order) => 
        sum + (parseFloat(order.total_rm || order.amount) || 0), 0
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
        const orderDate = new Date(order.timestamp || order.createdAt || order.tarikh);
        const previous30Days = new Date(last30Days.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= previous30Days && orderDate < last30Days;
    });
    
    const prevRevenue = previousPeriod.reduce((sum, order) => 
        sum + (parseFloat(order.total_rm || order.amount) || 0), 0
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
            new Date(order.timestamp || order.createdAt || order.tarikh).toDateString() === date.toDateString()
        );
        
        return {
            date: date,
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, order) => sum + (parseFloat(order.total_rm || order.amount) || 0), 0)
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
        const amount = parseFloat(order.total_rm || order.amount) || 0;
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
// FILTER FUNCTIONALITY
// ===================================================

let allOrdersData = []; // Store all orders for filtering

function setupFilters(orders) {
    allOrdersData = orders; // Store reference to all data
    
    const platformFilter = document.getElementById('platform-filter');
    const teamFilter = document.getElementById('team-filter');
    const resetBtn = document.getElementById('reset-filters');
    
    if (platformFilter) {
        platformFilter.addEventListener('change', applyFilters);
    }
    
    if (teamFilter) {
        teamFilter.addEventListener('change', applyFilters);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

function applyFilters() {
    const platformFilter = document.getElementById('platform-filter');
    const teamFilter = document.getElementById('team-filter');
    
    const selectedPlatform = platformFilter?.value.toLowerCase() || '';
    const selectedTeam = teamFilter?.value.toLowerCase() || '';
    
    console.log('🔍 Applying filters:', { platform: selectedPlatform, team: selectedTeam });
    
    let filteredOrders = allOrdersData.filter(order => {
        // Platform filtering
        let platformMatch = true;
        if (selectedPlatform) {
            const orderPlatform = (order.platform || '').toLowerCase();
            const orderSource = (order.source || '').toLowerCase();
            
            if (selectedPlatform === 'tiktok') {
                platformMatch = orderPlatform.includes('tiktok') || orderPlatform.includes('tik tok');
            } else if (selectedPlatform === 'shopee') {
                platformMatch = orderPlatform.includes('shopee');
            } else if (selectedPlatform === 'dana') {
                platformMatch = orderPlatform.includes('dana');
            } else if (selectedPlatform === 'website') {
                platformMatch = orderPlatform.includes('website') || 
                              orderPlatform.includes('desa murni') || 
                              orderSource.includes('pdf');
            }
        }
        
        // Team filtering
        let teamMatch = true;
        if (selectedTeam) {
            const orderTeam = (order.team_sale || order.agent_name || '').toLowerCase();
            teamMatch = orderTeam.includes(selectedTeam);
        }
        
        return platformMatch && teamMatch;
    });
    
    console.log(`📊 Filtered ${filteredOrders.length} orders from ${allOrdersData.length} total`);
    
    // Update the enhanced order details with filtered data
    updateEnhancedOrderDetails(filteredOrders);
}

function resetFilters() {
    const platformFilter = document.getElementById('platform-filter');
    const teamFilter = document.getElementById('team-filter');
    
    if (platformFilter) platformFilter.value = '';
    if (teamFilter) teamFilter.value = '';
    
    // Show all orders
    updateEnhancedOrderDetails(allOrdersData);
    
    console.log('🔄 Filters reset, showing all orders');
}

function getAllProductsFromOrder(order) {
    console.log('🔍 Extracting products from order:', order.id || order.nombor_po_invoice || 'unknown');
    const products = [];
    
    // DEBUG: Log the entire order to understand structure
    console.log('🔍 Full order data:', JSON.stringify(order, null, 2));
    
    // Try structured products first (from PDF processing) - PRIORITY 1
    if (order.structuredProducts && Array.isArray(order.structuredProducts) && order.structuredProducts.length > 0) {
        console.log('✅ Found structuredProducts:', order.structuredProducts.length, 'items');
        order.structuredProducts.forEach((product, index) => {
            console.log(`📦 Structured Product ${index}:`, product);
            
            // Handle products with size breakdown
            if (product.products && Array.isArray(product.products)) {
                product.products.forEach(sizeVariant => {
                    products.push({
                        code: sizeVariant.sku || product.sku || sizeVariant.code_kain || product.code || 'Unknown',
                        name: product.name || sizeVariant.base_name || sizeVariant.product_name || 'Product',
                        quantity: parseInt(sizeVariant.quantity) || 0,
                        size: sizeVariant.size || '',
                        color: sizeVariant.color || product.color || '',
                        price: parseFloat(sizeVariant.price) || 0,
                        type: sizeVariant.type || 'Ready Stock'
                    });
                });
            } else {
                products.push({
                    code: product.code || product.sku || product.code_kain || product.productCode || 'Unknown',
                    name: product.name || product.description || product.product_name || 'Product',
                    quantity: parseInt(product.quantity) || parseInt(product.qty) || 1,
                    size: product.size || product.saiz || product.Size || '',
                    color: product.color || product.warna || product.Color || '',
                    price: parseFloat(product.price) || parseFloat(product.amount) || 0
                });
            }
        });
    }
    // Try enhanced products array directly - PRIORITY 2
    else if (order.products && Array.isArray(order.products) && order.products.length > 0) {
        console.log('✅ Found products array:', order.products.length, 'items');
        order.products.forEach((product, index) => {
            console.log(`📦 Enhanced Product ${index}:`, product);
            products.push({
                code: product.sku || product.code || product.code_kain || product.productCode || 'Unknown',
                name: product.base_name || product.product_name || product.name || 'Product',
                quantity: parseInt(product.quantity) || parseInt(product.qty) || 1,
                size: product.size || product.saiz || product.Size || '',
                color: product.color || product.warna || product.Color || '',
                price: parseFloat(product.price) || parseFloat(product.amount) || 0,
                type: product.type || 'Ready Stock'
            });
        });
    }
    // Check for individual size fields (common in PDF data) - PRIORITY 3
    else if (order.uniqueSizes && Array.isArray(order.uniqueSizes)) {
        console.log('✅ Found uniqueSizes data:', order.uniqueSizes);
        order.uniqueSizes.forEach(size => {
            products.push({
                code: order.code_kain || order.jenis_order || 'Product',
                name: order.jenis_order || order.product_name || 'Product',
                quantity: 1,
                size: size,
                color: '',
                price: parseFloat(order.total_rm || order.amount) || 0
            });
        });
    }
    // Fallback to single product - PRIORITY 4
    else {
        console.log('⚠️ Using fallback single product extraction');
        products.push({
            code: order.code_kain || order.jenis_order || 'Unknown',
            name: order.jenis_order || order.product_name || 'Product',
            quantity: parseInt(order.totalQuantity) || parseInt(order.quantity) || 1,
            size: order.size || order.saiz || '',
            color: order.color || order.warna || '',
            price: parseFloat(order.total_rm || order.amount) || 0
        });
    }
    
    console.log('✅ Final extracted products:', products.length, 'items');
    console.log('📋 Products detail:', products);
    
    // Additional debugging - check if we have size data
    const sizesFound = products.filter(p => p.size && p.size.trim() !== '').length;
    console.log('📏 Products with sizes:', sizesFound, '/', products.length);
    
    return products;
}

// ===================================================
// ENHANCED ORDER DETAILS TABLE
// ===================================================

function updateEnhancedOrderDetails(orders) {
    console.log('📋 Updating Enhanced Order Details with', orders.length, 'orders');
    
    const container = document.getElementById('enhanced-orders-container');
    if (!container) {
        console.error('❌ Enhanced orders container not found');
        return;
    }
    
    // Use ONLY real Firebase data - NO MOCK DATA
    if (orders.length === 0) {
        console.log('📋 No Firebase orders found');
        container.innerHTML = `
            <div class="enhanced-empty-state">
                <i class="fas fa-database" style="font-size: 3rem; color: #64748b; margin-bottom: 1rem;"></i>
                <h3 style="color: #e2e8f0; margin-bottom: 0.5rem;">Tiada Data Order</h3>
                <p style="color: #94a3b8; margin-bottom: 1rem;">Belum ada data order dalam Firebase</p>
                <button onclick="createRealOrderData()" style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-plus"></i> Tambah Sample Data
                </button>
            </div>
        `;
        return;
    } else {
        console.log('📊 Using REAL orders from Firebase:', orders.length, 'items');
    }
    
    // Sort orders by date (newest first)
    const sortedOrders = orders.sort((a, b) => 
        new Date(b.timestamp || b.createdAt || b.tarikh) - new Date(a.timestamp || a.createdAt || a.tarikh)
    );
    
    container.innerHTML = sortedOrders.map((order, index) => {
        const products = getAllProductsFromOrder(order);
        const totalQuantity = products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
        
        return `
            <div class="enhanced-order-row">
                <!-- Invoice/PO -->
                <div class="row-cell">
                    <a href="#" class="cell-primary">
                        ${order.nombor_po_invoice || order.invoice || `ORDER-${index + 1}`}
                    </a>
                </div>
                
                <!-- Tarikh -->
                <div class="row-cell">
                    <span class="cell-secondary">
                        ${formatDateForEnhanced(order.timestamp || order.createdAt || order.tarikh)}
                    </span>
                </div>
                
                <!-- Customer -->
                <div class="row-cell">
                    <span class="cell-secondary">
                        ${order.nama_customer || order.customer_name || 'Customer'}
                    </span>
                </div>
                
                <!-- Team -->
                <div class="row-cell">
                    <span class="team-badge">
                        ${order.team_sale || order.agent_name || 'Nisya'}
                    </span>
                </div>
                
                <!-- Platform -->
                <div class="row-cell">
                    ${generatePlatformBadge(order.source, order.platform)}
                </div>
                
                <!-- Detail Produk & Saiz -->
                <div class="row-cell">
                    ${generateEnhancedProductDetails(products)}
                </div>
                
                <!-- Total Qty -->
                <div class="row-cell total-qty">
                    <div class="qty-number">${totalQuantity}</div>
                </div>
                
                <!-- Amount -->
                <div class="row-cell amount-cell">
                    <div class="amount-value">
                        ${formatCurrency(parseFloat(order.total_rm || order.amount) || 0)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function generateProductDetailsHtml(products) {
    if (products.length === 0) {
        return '<span class="text-gray-400">Tiada data produk</span>';
    }
    
    // Show first 2 products only
    return products.slice(0, 2).map(product => {
        const sizeLabel = product.size ? 
            `<span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mr-1">${product.size}</span>` : '';
        
        const progressBar = generateQuantityProgressBar(product.quantity);
        
        return `
            <div class="mb-2 last:mb-0">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                    ${product.code} - ${product.name}
                </div>
                <div class="flex items-center mt-1">
                    ${sizeLabel}
                    ${progressBar}
                </div>
            </div>
        `;
    }).join('');
}

function generateFullProductDetailsHtml(products) {
    if (products.length === 0) {
        return '<p class="text-gray-500">Tiada data produk dijumpai</p>';
    }
    
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${products.map(product => `
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                    <div class="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                        📦 ${product.code}
                    </div>
                    <div class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        ${product.name}
                    </div>
                    <div class="flex items-center justify-between mb-2">
                        ${product.size ? 
                            `<span class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Size ${product.size}</span>` : 
                            '<span class="text-xs text-gray-400">No size</span>'
                        }
                        <span class="font-bold text-sm text-gray-900 dark:text-white">${product.quantity} pcs</span>
                    </div>
                    ${generateQuantityProgressBar(product.quantity, true)}
                    ${product.price > 0 ? `<div class="text-right mt-2 text-sm text-green-600 font-semibold">${formatCurrency(product.price)}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function generateQuantityProgressBar(quantity, showLabel = false) {
    const qty = parseInt(quantity) || 0;
    const maxQty = 100; // Assume max 100 for progress calculation
    const percentage = Math.min((qty / maxQty) * 100, 100);
    
    return `
        <div class="flex items-center ${showLabel ? 'w-full' : 'flex-1 ml-2'}">
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-green-500 h-2 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
            </div>
            ${showLabel ? `<span class="ml-2 text-xs text-gray-600 dark:text-gray-400">${qty}</span>` : ''}
        </div>
    `;
}

function getSourceIcon(source) {
    if (!source) return '<i class="fas fa-question-circle text-gray-400"></i>';
    
    if (source.includes('pdf') || source === 'pdf_desa_murni_enhanced') {
        return '<i class="fas fa-file-pdf text-red-500"></i>';
    } else if (source === 'manual_form') {
        return '<i class="fas fa-edit text-blue-500"></i>';
    } else if (source.includes('csv')) {
        return '<i class="fas fa-file-csv text-green-500"></i>';
    } else {
        return '<i class="fas fa-globe text-purple-500"></i>';
    }
}

function getSourceText(source) {
    if (!source) return 'Unknown';
    
    if (source.includes('pdf') || source === 'pdf_desa_murni_enhanced') {
        return 'PDF Upload';
    } else if (source === 'manual_form') {
        return 'Manual Form';
    } else if (source.includes('csv')) {
        return 'CSV Import';
    } else {
        return 'Website';
    }
}

function formatDateForTable(dateInput) {
    if (!dateInput) return 'N/A';
    
    const date = new Date(dateInput);
    return date.toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateForEnhanced(dateInput) {
    if (!dateInput) return 'N/A';
    
    const date = new Date(dateInput);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function generatePlatformBadge(source, platform) {
    const platformStr = (platform || '').toLowerCase();
    const sourceStr = (source || '').toLowerCase();
    
    // Check for specific platforms
    if (platformStr.includes('shopee')) {
        return '<span class="platform-badge shopee">Shopee</span>';
    } else if (platformStr.includes('tiktok') || platformStr.includes('tik tok')) {
        return '<span class="platform-badge tiktok">TikTok</span>';
    } else if (platformStr.includes('dana')) {
        return '<span class="platform-badge dana">Dana</span>';
    } else if (sourceStr.includes('pdf') || platformStr.includes('website') || platformStr.includes('desa murni')) {
        return '<span class="platform-badge">Website</span>';
    } else {
        return '<span class="platform-badge">Website</span>';
    }
}

function generateEnhancedProductDetails(products) {
    console.log('🎨 Generating enhanced product details for', products.length, 'products');
    console.log('🎨 Raw products data:', products);
    
    if (!products || products.length === 0) {
        return '<span class="product-meta">Tiada data produk</span>';
    }
    
    // Group products by name/code to show multiple product lines
    const productGroups = groupProductsByName(products);
    const totalProducts = Object.keys(productGroups).length;
    const allSizes = [...new Set(products.map(p => p.size).filter(s => s && s.trim() !== ''))];
    const totalSizes = allSizes.length;
    
    console.log('🔍 Product groups:', productGroups);
    console.log('📊 Stats: Products:', totalProducts, 'Sizes:', totalSizes);
    console.log('📏 Sizes found:', allSizes);
    
    const productLinesHtml = Object.entries(productGroups).map(([productName, productVariants]) => {
        const totalQty = productVariants.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
        const sizeBadgesHtml = generateSizeBadges(productVariants);
        const progressBarHtml = generateProductProgressBar(productVariants, totalQty);
        
        console.log(`🎨 Building line for "${productName}":`, {
            variants: productVariants.length,
            totalQty: totalQty,
            hasValidSizes: productVariants.some(p => p.size && p.size.trim() !== '')
        });
        
        return `
            <div class="product-line">
                <div class="product-name">${productName}</div>
                ${sizeBadgesHtml}
                ${progressBarHtml}
            </div>
        `;
    }).join('');
    
    const result = `
        <div class="product-details">
            <div class="product-header">
                <span class="product-count-badge">${totalProducts} produk</span>
                <span class="product-meta">${totalSizes} saiz berbeza</span>
            </div>
            ${productLinesHtml}
        </div>
    `;
    
    console.log('✅ Generated enhanced product details HTML');
    return result;
}

function groupProductsByName(products) {
    const groups = {};
    
    products.forEach(product => {
        // Use full product name with color as the key
        const productKey = product.name || 'Unknown Product';
        
        if (!groups[productKey]) {
            groups[productKey] = [];
        }
        groups[productKey].push(product);
    });
    
    return groups;
}

function generateSizeBadges(products) {
    console.log('🏷️ Generating size badges for products:', products);
    
    const sizeQuantities = {};
    
    // Extract size and quantity info
    products.forEach(product => {
        const size = (product.size || '').toString().trim();
        const qty = parseInt(product.quantity) || 0;
        
        if (size && size !== '' && size.toLowerCase() !== 'no size') {
            // Handle cases where size contains quantity info like "S: 3"
            const sizeMatch = size.match(/^([A-Za-z]+):?\s*(\d+)?/);
            if (sizeMatch) {
                const sizeCode = sizeMatch[1].toUpperCase();
                const extractedQty = parseInt(sizeMatch[2]) || qty || 1;
                sizeQuantities[sizeCode] = (sizeQuantities[sizeCode] || 0) + extractedQty;
            } else {
                // Regular size without embedded quantity
                sizeQuantities[size.toUpperCase()] = (sizeQuantities[size.toUpperCase()] || 0) + qty;
            }
        }
    });
    
    // Convert to array and sort by size order
    const sizes = Object.entries(sizeQuantities)
        .sort(([a], [b]) => getSizeOrder(a) - getSizeOrder(b));
    
    console.log('📊 Size quantities:', sizeQuantities);
    
    if (sizes.length === 0) {
        return '<div class="size-badges"><span class="size-badge s">One Size</span></div>';
    }
    
    return `
        <div class="size-badges">
            ${sizes.map(([size, qty]) => {
                const sizeClass = getSizeClass(size);
                return `<span class="size-badge ${sizeClass}" title="${qty} pieces">
                    ${size}: ${qty}
                </span>`;
            }).join('')}
        </div>
    `;
}

function generateProductProgressBar(products, totalQty = null) {
    const qty = totalQty || products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
    
    return `
        <div class="progress-bar-container">
            <div class="progress-bar">
                ${qty}
            </div>
        </div>
    `;
}

function getSizeClass(size) {
    const sizeStr = size.toLowerCase();
    if (sizeStr === 'xs' || sizeStr === 'extra-small') return 'xs';
    if (sizeStr === 's' || sizeStr === 'small') return 's';
    if (sizeStr === 'm' || sizeStr === 'medium') return 'm';
    if (sizeStr === 'l' || sizeStr === 'large') return 'l';
    if (sizeStr === 'xl' || sizeStr === 'x-large') return 'xl';
    if (sizeStr === 'xxl' || sizeStr === '2xl') return 'xxl';
    if (sizeStr === 'xxxl' || sizeStr === '3xl') return 'xxxl';
    if (sizeStr === 'xxxxl' || sizeStr === '4xl') return 'xxxxl';
    if (sizeStr === 'xxxxxl' || sizeStr === '5xl') return 'xxxxxl';
    
    // Handle numeric sizes
    const numSize = parseInt(sizeStr);
    if (!isNaN(numSize)) {
        if (numSize <= 2) return 's';
        if (numSize <= 5) return 'm';
        if (numSize <= 10) return 'l';
        if (numSize <= 15) return 'xl';
        return 'xxl';
    }
    
    return 's'; // default
}

function getSizeOrder(size) {
    const sizeMap = {
        'xs': 0, 'extra-small': 0,
        's': 1, 'small': 1,
        'm': 2, 'medium': 2,
        'l': 3, 'large': 3,
        'xl': 4, 'x-large': 4,
        'xxl': 5, '2xl': 5,
        'xxxl': 6, '3xl': 6,
        'xxxxl': 7, '4xl': 7,
        'xxxxxl': 8, '5xl': 8
    };
    
    const lowerSize = size.toLowerCase();
    if (sizeMap[lowerSize] !== undefined) {
        return sizeMap[lowerSize];
    }
    
    // Handle numeric sizes
    const numSize = parseInt(lowerSize);
    if (!isNaN(numSize)) {
        return numSize;
    }
    
    return 0; // Unknown size goes first
}

function toggleRowDetails(orderId) {
    const detailsRow = document.getElementById(`details-${orderId}`);
    if (detailsRow) {
        detailsRow.classList.toggle('hidden');
    }
}

// Make function globally accessible
window.toggleRowDetails = toggleRowDetails;

function generateSampleOrderData() {
    return [
        {
            id: 'sample-1',
            nombor_po_invoice: 'Inv-100403-210725',
            timestamp: new Date('2025-07-21'),
            tarikh: '21/7/2025',
            nama_customer: 'Azliza Awang Kechik',
            team_sale: 'Nisya',
            platform: 'Website',
            source: 'pdf_desa_murni_enhanced',
            total_rm: 11842,
            structuredProducts: [
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4',
                    size: 'S',
                    quantity: 3,
                    price: 150
                },
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4', 
                    size: 'M',
                    quantity: 13,
                    price: 150
                },
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4',
                    size: 'L', 
                    quantity: 19,
                    price: 150
                },
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4',
                    size: 'XL',
                    quantity: 17,
                    price: 150
                },
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)', 
                    code: 'KBD-LZ5-4',
                    size: '2XL',
                    quantity: 5,
                    price: 150
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: 'XS',
                    quantity: 2,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: 'S',
                    quantity: 2,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: 'M',
                    quantity: 16,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: 'L',
                    quantity: 14,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: 'XL',
                    quantity: 18,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4', 
                    size: '2XL',
                    quantity: 12,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: '3XL',
                    quantity: 4,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: '4XL',
                    quantity: 6,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: '5XL',
                    quantity: 1,
                    price: 180
                }
            ]
        },
        {
            id: 'sample-2',
            nombor_po_invoice: 'SPE-2025-001',
            timestamp: new Date('2025-08-01'),
            tarikh: '1/8/2025',
            nama_customer: 'Siti Aminah',
            team_sale: 'Qilah',
            platform: 'Shopee',
            source: 'manual_form',
            total_rm: 2640,
            structuredProducts: [
                {
                    name: 'Kemeja Batik DM - LZ6-1 (Blue)',
                    code: 'KBD-LZ6-1',
                    size: 'M',
                    quantity: 5,
                    price: 160
                },
                {
                    name: 'Kemeja Batik DM - LZ6-1 (Blue)',
                    code: 'KBD-LZ6-1',
                    size: 'L',
                    quantity: 8,
                    price: 160
                },
                {
                    name: 'Kemeja Batik DM - LZ6-1 (Blue)',
                    code: 'KBD-LZ6-1',
                    size: 'XL',
                    quantity: 12,
                    price: 160
                },
                {
                    name: 'Kemeja Batik DM - LZ6-1 (Blue)',
                    code: 'KBD-LZ6-1',
                    size: '2XL',
                    quantity: 5,
                    price: 160
                }
            ]
        },
        {
            id: 'sample-3',
            nombor_po_invoice: 'TT-2025-045',
            timestamp: new Date('2025-08-02'),
            tarikh: '2/8/2025',
            nama_customer: 'Ahmad Rahman',
            team_sale: 'Wiyah',
            platform: 'TikTok',
            source: 'manual_form',
            total_rm: 1584,
            structuredProducts: [
                {
                    name: 'Kurung Alana PZ7-2 (Green)',
                    code: 'KAP-PZ7-2',
                    size: 'S',
                    quantity: 3,
                    price: 170
                },
                {
                    name: 'Kurung Alana PZ7-2 (Green)',
                    code: 'KAP-PZ7-2',
                    size: 'M',
                    quantity: 6,
                    price: 170
                },
                {
                    name: 'Kurung Alana PZ7-2 (Green)',
                    code: 'KAP-PZ7-2',
                    size: 'L',
                    quantity: 4,
                    price: 170
                },
                {
                    name: 'Kurung Alana PZ7-2 (Green)',
                    code: 'KAP-PZ7-2',
                    size: 'XL',
                    quantity: 5,
                    price: 170
                }
            ]
        }
    ];
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
    console.log('🔄 updateRecentOrders called with:', orders.length, 'orders');
    
    const container = document.getElementById('recent-orders');
    if (!container) {
        console.error('❌ recent-orders container not found');
        return;
    }
    
    // Get last 10 orders
    const recentOrders = orders
        .sort((a, b) => new Date(b.timestamp || b.createdAt || b.tarikh) - new Date(a.timestamp || a.createdAt || a.tarikh))
        .slice(0, 10);
    
    console.log('📋 Recent orders to display:', recentOrders.length);
    if (recentOrders.length > 0) {
        console.log('📄 First order sample:', recentOrders[0]);
    }
    
    if (recentOrders.length === 0) {
        container.innerHTML = `
            <div class="order-loading">
                <p>❌ Tiada order dijumpai dalam orderData collection</p>
                <p>🔍 Debug: Buka Console (F12) untuk melihat log detail</p>
                <p>💡 Pastikan PDF sudah di-upload atau form manual sudah dihantar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentOrders.map((order, index) => {
        // Extract product info from structured data if available
        const productInfo = getOrderProductInfo(order);
        const teamInfo = getOrderTeamInfo(order);
        const sourceInfo = getOrderSourceInfo(order);
        const detailedProducts = getDetailedProductBreakdown(order);
        
        return `
            <div class="order-data-item" id="order-${index}">
                <div class="order-data-item-info">
                    <div class="order-data-item-header">
                        <div class="order-data-item-name">${order.nama_customer || order.customer_name || 'Customer'}</div>
                        ${detailedProducts.length > 0 ? `<button class="order-details-toggle" onclick="toggleOrderDetails(${index})">📦 ${detailedProducts.length} products</button>` : ''}
                    </div>
                    <div class="order-data-item-meta">
                        📋 ${order.nombor_po_invoice || order.invoice || 'N/A'} • ${formatDateTime(order.timestamp || order.createdAt || order.tarikh)}
                    </div>
                    ${teamInfo ? `<div class="order-data-item-team">👤 ${teamInfo}</div>` : ''}
                    ${productInfo ? `<div class="order-data-item-products">${productInfo}</div>` : ''}
                    
                    <!-- Detailed Product Breakdown (Initially Hidden) -->
                    <div class="order-product-details" id="details-${index}" style="display: none;">
                        <div class="product-breakdown-header">🛍️ Detail Produk:</div>
                        ${detailedProducts.map(product => `
                            <div class="product-item">
                                <div class="product-code">📦 ${product.code}</div>
                                <div class="product-details">
                                    <span class="product-name">${product.name}</span>
                                    <div class="product-specs">
                                        <span class="product-qty">Qty: ${product.quantity}</span>
                                        ${product.size ? `<span class="product-size">Size: ${product.size}</span>` : ''}
                                        ${product.color ? `<span class="product-color">Color: ${product.color}</span>` : ''}
                                        ${product.price ? `<span class="product-price">${formatCurrency(product.price)}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                        <div class="product-summary">
                            Total Items: ${detailedProducts.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)} pcs
                        </div>
                    </div>
                </div>
                <div class="order-data-item-value">
                    ${formatCurrency(parseFloat(order.total_rm || order.amount) || 0)}
                    <div class="order-data-item-trend trend-positive">
                        ${sourceInfo}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateTopPerformers(orders) {
    const container = document.getElementById('top-performers');
    if (!container) return;
    
    // Group by agent/salesperson
    const performers = {};
    orders.forEach(order => {
        const agent = order.team_sale || order.agent_name || order.salesperson || 'Direct Sales';
        const amount = parseFloat(order.total_rm || order.amount) || 0;
        const source = order.source || '';
        
        if (!performers[agent]) {
            performers[agent] = { orders: 0, revenue: 0, pdfUploads: 0, manualForms: 0, products: new Set() };
        }
        
        performers[agent].orders += 1;
        performers[agent].revenue += amount;
        
        // Track upload methods
        if (source === 'pdf_upload' || source === 'pdf_desa_murni_enhanced' || source.includes('pdf')) {
            performers[agent].pdfUploads += 1;
        } else if (source === 'manual_form') {
            performers[agent].manualForms += 1;
        }
        
        // Track product diversity
        if (order.structuredProducts && Array.isArray(order.structuredProducts)) {
            order.structuredProducts.forEach(p => {
                const productCode = p.sku || p.code_kain || p.productCode || '';
                if (productCode) performers[agent].products.add(productCode);
            });
        } else if (order.code_kain) {
            performers[agent].products.add(order.code_kain);
        }
    });
    
    // Sort by revenue and get top 10
    const topPerformers = Object.entries(performers)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .slice(0, 10);
    
    if (topPerformers.length === 0) {
        container.innerHTML = '<div class="order-loading">No performance data found</div>';
        return;
    }
    
    container.innerHTML = topPerformers.map(([name, data], index) => {
        const methodsText = [];
        if (data.pdfUploads > 0) methodsText.push(`📄 ${data.pdfUploads} PDF`);
        if (data.manualForms > 0) methodsText.push(`📝 ${data.manualForms} Form`);
        const methodsDisplay = methodsText.join(' • ') || 'Direct';
        
        const badge = index === 0 ? '🏆 Top Seller' : index === 1 ? '🥈 2nd Place' : index === 2 ? '🥉 3rd Place' : `#${index + 1}`;
        
        return `
            <div class="order-data-item">
                <div class="order-data-item-info">
                    <div class="order-data-item-name">${name}</div>
                    <div class="order-data-item-meta">
                        ${data.orders} orders • Avg: ${formatCurrency(data.revenue / data.orders)}
                    </div>
                    <div class="order-data-item-team">${methodsDisplay}</div>
                    ${data.products.size > 0 ? `<div class="order-data-item-products">📦 ${data.products.size} unique products</div>` : ''}
                </div>
                <div class="order-data-item-value">
                    ${formatCurrency(data.revenue)}
                    <div class="order-data-item-trend trend-positive">
                        ${badge}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===================================================
// ORDER DETAILS FUNCTIONS
// ===================================================

function toggleOrderDetails(index) {
    const detailsDiv = document.getElementById(`details-${index}`);
    const toggleBtn = document.querySelector(`#order-${index} .order-details-toggle`);
    
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        toggleBtn.textContent = toggleBtn.textContent.replace('📦', '🔽');
    } else {
        detailsDiv.style.display = 'none';
        toggleBtn.textContent = toggleBtn.textContent.replace('🔽', '📦');
    }
}

// Make function globally accessible
window.toggleOrderDetails = toggleOrderDetails;

function getDetailedProductBreakdown(order) {
    const products = [];
    
    console.log('🔍 Getting detailed product breakdown for:', order.id);
    
    // Check for structured products data (from PDF processing)
    if (order.structuredProducts && Array.isArray(order.structuredProducts)) {
        console.log('✅ Found structured products:', order.structuredProducts.length);
        
        order.structuredProducts.forEach((product, index) => {
            products.push({
                code: product.sku || product.code_kain || product.productCode || `ITEM-${index + 1}`,
                name: product.description || product.name || product.product_name || 'Product',
                quantity: product.quantity || product.qty || 1,
                size: product.size || product.saiz || '',
                color: product.color || product.warna || '',
                price: product.price || product.amount || 0,
                unit: product.unit || 'pcs'
            });
        });
    }
    // Check for enhanced products data
    else if (order.products && Array.isArray(order.products)) {
        console.log('✅ Found enhanced products:', order.products.length);
        
        order.products.forEach((product, index) => {
            products.push({
                code: product.sku || product.code_kain || product.productCode || `ITEM-${index + 1}`,
                name: product.description || product.name || product.product_name || 'Product',
                quantity: product.quantity || product.qty || 1,
                size: product.size || product.saiz || '',
                color: product.color || product.warna || '',
                price: product.price || product.amount || 0,
                unit: product.unit || 'pcs'
            });
        });
    }
    // Fallback to single product info
    else if (order.jenis_order || order.product_name || order.code_kain) {
        console.log('✅ Using single product fallback');
        
        products.push({
            code: order.code_kain || order.product_code || 'N/A',
            name: order.jenis_order || order.product_name || 'Product',
            quantity: order.totalQuantity || order.quantity || 1,
            size: order.size || order.saiz || '',
            color: order.color || order.warna || '',
            price: order.total_rm || order.amount || 0,
            unit: 'pcs'
        });
    }
    
    console.log('📦 Total products found:', products.length);
    return products;
}

// ===================================================
// ORDER INFO EXTRACTION HELPERS
// ===================================================

function getOrderProductInfo(order) {
    let productInfo = '';
    
    // Debug: Log the order structure
    console.log('🔍 Getting product info for order:', {
        id: order.id,
        structuredProducts: order.structuredProducts,
        jenis_order: order.jenis_order,
        product_name: order.product_name,
        code_kain: order.code_kain,
        totalQuantity: order.totalQuantity
    });
    
    // Check for structured products data
    if (order.structuredProducts && Array.isArray(order.structuredProducts) && order.structuredProducts.length > 0) {
        const products = order.structuredProducts.slice(0, 3); // Show max 3 products
        productInfo = products.map(p => {
            const qty = p.quantity || p.qty || 1;
            const code = p.sku || p.code_kain || p.productCode || '';
            const name = p.description || p.name || p.product_name || '';
            return `📦 ${qty}x ${code} ${name}`.trim();
        }).join(' • ');
        
        if (order.structuredProducts.length > 3) {
            productInfo += ` • +${order.structuredProducts.length - 3} lagi`;
        }
        console.log('✅ Using structured products:', productInfo);
    }
    // Fallback to single product info
    else if (order.jenis_order || order.product_name) {
        const qty = order.totalQuantity || order.quantity || 1;
        const code = order.code_kain || order.product_code || '';
        const name = order.jenis_order || order.product_name || '';
        productInfo = `📦 ${qty}x ${code} ${name}`.trim();
        console.log('✅ Using single product fallback:', productInfo);
    }
    else {
        console.log('⚠️ No product info found for order');
    }
    
    return productInfo;
}

function getOrderTeamInfo(order) {
    const teamName = order.team_sale || order.agent_name || order.salesperson || '';
    const uploadMethod = order.source || '';
    
    console.log('🔍 Getting team info:', { teamName, uploadMethod });
    
    if (teamName && (uploadMethod === 'pdf_upload' || uploadMethod === 'pdf_desa_murni_enhanced' || uploadMethod.includes('pdf'))) {
        return `${teamName} (PDF Upload)`;
    } else if (teamName) {
        return teamName;
    }
    return '';
}

function getOrderSourceInfo(order) {
    const source = order.source || '';
    const platform = order.platform || 'Direct';
    
    console.log('🔍 Getting source info:', { source, platform });
    
    if (source === 'pdf_upload' || source === 'pdf_desa_murni_enhanced' || source.includes('pdf')) {
        return '📄 PDF Upload';
    } else if (source === 'manual_form') {
        return '📝 Manual Form';
    } else if (source.includes('csv')) {
        return '📊 CSV Import';
    } else {
        return platform;
    }
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