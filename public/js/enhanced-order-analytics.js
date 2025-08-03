// Import Firestore functions
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    where, 
    getDocs,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Order Analytics Class
class OrderAnalytics {
    constructor() {
        this.db = window.db;
        this.orderTrendChart = null;
        this.orderTimelineChart = null;
        this.orders = [];
        this.platformColors = {
            'Shopee': '#ff5e4d',
            'Lazada': '#ff9900', 
            'Website': '#3b82f6',
            'WhatsApp': '#25d366',
            'Facebook': '#1877f2',
            'Instagram': '#e1306c'
        };
        this.teamColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Order Analytics...');
            this.setupEventListeners();
            await this.loadOrderData();
            this.initCharts();
            console.log('Order Analytics initialized successfully');
        } catch (error) {
            console.error('Error initializing Order Analytics:', error);
            this.showErrorState();
        }
    }

    setupEventListeners() {
        // Chart control buttons
        document.querySelectorAll('.timeline-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                const view = e.target.dataset.view;
                
                // Update active state
                e.target.parentElement.querySelectorAll('.timeline-btn').forEach(b => 
                    b.classList.remove('active'));
                e.target.classList.add('active');

                if (period) {
                    this.updateOrderTrendChart(period);
                }
                if (view) {
                    this.updateTimelineChart(view);
                }
            });
        });
        // **TAMBAH KOD INI** di penghujung fungsi setupEventListeners
        document.querySelectorAll('.tab-link').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Urus state 'active' untuk butang tab
                document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Urus state 'active' untuk kandungan tab
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
            });
        });

        // View all button
        const viewAllBtn = document.querySelector('.view-all-btn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                // Navigate to orders page or show modal
                window.location.href = 'ecommerce.html';
            });
        }
    }

    async loadOrderData() {
        try {
            console.log('Loading order data from Firebase...');
            
            if (!this.db) {
                throw new Error('Firestore database not initialized');
            }

            // Show loading state
            this.showLoadingState();

            // Query all orders from orderData collection
            const ordersQuery = query(
                collection(this.db, "orderData"),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(ordersQuery);
            this.orders = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                this.orders.push({
                    id: doc.id,
                    ...data,
                    // Convert Firestore timestamp to Date
                    createdAt: data.createdAt?.toDate() || new Date(data.tarikh),
                    tarikh: data.tarikh || '',
                    code_kain: data.code_kain || '',
                    nama_customer: data.nama_customer || '',
                    team_sale: data.team_sale || '',
                    platform: data.platform || '',
                    jenis_order: data.jenis_order || '',
                    total_rm: parseFloat(data.total_rm) || 0,
                    nombor_po_invoice: data.nombor_po_invoice || ''
                });
            });

            console.log(`Loaded ${this.orders.length} orders from Firebase`);
            
            // Update all analytics
            this.updateStatistics();
            this.updateBreakdowns();
            this.updateRecentOrders();
            this.updateTrendCalculations();

        } catch (error) {
            console.error('Error loading order data:', error);
            this.showErrorState();
        }
    }

    showLoadingState() {
        // Show loading in breakdowns
        const platformContainer = document.getElementById('platform-breakdown');
        if (platformContainer) {
            platformContainer.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>
                    Loading platform data...
                </div>
            `;
        }

        const teamContainer = document.getElementById('team-breakdown');
        if (teamContainer) {
            teamContainer.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>
                    Loading team data...
                </div>
            `;
        }

        // Show loading in recent orders
        const tbody = document.getElementById('recent-orders-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-placeholder">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>
                        Loading recent orders...
                    </td>
                </tr>
            `;
        }
    }

    updateStatistics() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Today's orders
        const todayOrders = this.orders.filter(order => 
            order.tarikh === todayStr || 
            (order.createdAt && order.createdAt.toDateString() === today.toDateString())
        );
        
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total_rm, 0);
        const todayAvg = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

        // Total statistics
        const totalRevenue = this.orders.reduce((sum, order) => sum + order.total_rm, 0);
        const totalOrders = this.orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const activePlatforms = [...new Set(this.orders.map(order => order.platform))].length;

        // Update summary stats
        document.getElementById('total-orders-today').textContent = todayOrders.length;
        document.getElementById('total-revenue-today').textContent = `RM ${todayRevenue.toLocaleString()}`;
        document.getElementById('avg-order-today').textContent = `RM ${todayAvg.toFixed(2)}`;

        // Update main stats
        document.getElementById('total-order-revenue').textContent = `RM ${totalRevenue.toLocaleString()}.00`;
        document.getElementById('total-order-count').textContent = totalOrders.toLocaleString();
        document.getElementById('avg-order-value').textContent = `RM ${avgOrderValue.toFixed(2)}`;
        document.getElementById('active-platforms').textContent = activePlatforms;

        // Update meta information
        document.getElementById('revenue-period').textContent = `daripada ${totalOrders} order`;
        document.getElementById('volume-period').textContent = `jumlah order`;
        document.getElementById('avg-period').textContent = `purata per order`;
        document.getElementById('platform-period').textContent = `platform aktif`;
    }

    updateTrendCalculations() {
        // Calculate trends (compare with previous period)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

        const currentPeriodOrders = this.orders.filter(order => 
            order.createdAt >= thirtyDaysAgo
        );
        const previousPeriodOrders = this.orders.filter(order => 
            order.createdAt >= sixtyDaysAgo && order.createdAt < thirtyDaysAgo
        );

        const currentRevenue = currentPeriodOrders.reduce((sum, order) => sum + order.total_rm, 0);
        const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.total_rm, 0);

        const revenueTrend = previousRevenue > 0 ? 
            ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0;

        const volumeTrend = previousPeriodOrders.length > 0 ? 
            ((currentPeriodOrders.length - previousPeriodOrders.length) / previousPeriodOrders.length * 100).toFixed(1) : 0;

        // Update trend indicators
        this.updateTrendIndicator('revenue-trend', revenueTrend);
        this.updateTrendIndicator('volume-trend', volumeTrend);
        
        const platformTrend = [...new Set(currentPeriodOrders.map(o => o.platform))].length - 
                            [...new Set(previousPeriodOrders.map(o => o.platform))].length;
        document.getElementById('platform-trend').textContent = platformTrend >= 0 ? `+${platformTrend}` : platformTrend;
    }

    updateTrendIndicator(elementId, trendValue) {
        const element = document.getElementById(elementId);
        const numValue = parseFloat(trendValue);
        
        element.textContent = numValue >= 0 ? `+${Math.abs(numValue)}%` : `-${Math.abs(numValue)}%`;
        
        // Update trend class
        element.className = 'stat-trend';
        if (numValue > 0) {
            element.classList.add('trend-up');
        } else if (numValue < 0) {
            element.classList.add('trend-down');
        } else {
            element.classList.add('trend-stable');
        }
    }

    updateBreakdowns() {
        // Platform breakdown
        const platformStats = {};
        this.orders.forEach(order => {
            // Skip orders with empty/null platform
            if (!order.platform || order.platform.trim() === '') {
                return;
            }
            
            if (!platformStats[order.platform]) {
                platformStats[order.platform] = { orders: 0, revenue: 0 };
            }
            platformStats[order.platform].orders++;
            platformStats[order.platform].revenue += order.total_rm;
        });

        const platformContainer = document.getElementById('platform-breakdown');
        platformContainer.innerHTML = '';

        // Check if we have platform data
        if (Object.keys(platformStats).length === 0) {
            platformContainer.innerHTML = `
                <div style="text-align: center; color: #6b7280; padding: 1rem; font-style: italic;">
                    <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
                    Tiada data platform ditemui
                </div>
            `;
        } else {
            // Sort platforms by revenue
            const sortedPlatforms = Object.entries(platformStats)
                .sort(([,a], [,b]) => b.revenue - a.revenue);

            sortedPlatforms.forEach(([platform, stats]) => {
                const item = document.createElement('div');
                item.className = 'breakdown-item';
                const color = this.platformColors[platform] || '#6b7280';
                
                item.innerHTML = `
                    <div class="item-info">
                        <div class="item-indicator" style="background-color: ${color}"></div>
                        <span class="item-label">${platform}</span>
                    </div>
                    <div>
                        <span class="item-value">RM ${stats.revenue.toLocaleString()}</span>
                        <span class="item-count">(${stats.orders} orders)</span>
                    </div>
                `;
                platformContainer.appendChild(item);
            });
        }

        // Team breakdown
        const teamStats = {};
        this.orders.forEach(order => {
            // Skip orders with empty/null team_sale
            if (!order.team_sale || order.team_sale.trim() === '') {
                return;
            }
            
            if (!teamStats[order.team_sale]) {
                teamStats[order.team_sale] = { orders: 0, revenue: 0 };
            }
            teamStats[order.team_sale].orders++;
            teamStats[order.team_sale].revenue += order.total_rm;
        });

        const teamContainer = document.getElementById('team-breakdown');
        teamContainer.innerHTML = '';

        // Check if we have team data
        if (Object.keys(teamStats).length === 0) {
            teamContainer.innerHTML = `
                <div style="text-align: center; color: #6b7280; padding: 1rem; font-style: italic;">
                    <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
                    Tiada data team ditemui
                </div>
            `;
        } else {
            // Sort teams by revenue
            const sortedTeams = Object.entries(teamStats)
                .sort(([,a], [,b]) => b.revenue - a.revenue);

            sortedTeams.forEach(([team, stats], index) => {
                const item = document.createElement('div');
                item.className = 'breakdown-item';
                const color = this.teamColors[index % this.teamColors.length];
                
                item.innerHTML = `
                    <div class="item-info">
                        <div class="item-indicator" style="background-color: ${color}"></div>
                        <span class="item-label">${team}</span>
                    </div>
                    <div>
                        <span class="item-value">RM ${stats.revenue.toLocaleString()}</span>
                        <span class="item-count">(${stats.orders} orders)</span>
                    </div>
                `;
                teamContainer.appendChild(item);
            });
        }
    }

    // Gantikan fungsi updateRecentOrders() yang lama dengan yang ini
    updateRecentOrders() {
        // Logik baharu: tapis order dan sediakan setiap tab
        this.orders.sort((a, b) => b.createdAt - a.createdAt); // Pastikan order disusun dari terbaru ke terlama
        
        // **Nota Penting**: Pastikan nama di bawah ('Shopee', 'TikTok', 'Qilah', etc.)
        // sepadan dengan data sebenar dalam Firestore anda.
        this.renderOrdersForCategory('all', this.orders);
        this.renderOrdersForCategory('shopee', this.orders.filter(o => o.platform && o.platform.toLowerCase() === 'shopee'));
        this.renderOrdersForCategory('tiktok', this.orders.filter(o => o.platform && o.platform.toLowerCase() === 'tiktok'));
        this.renderOrdersForCategory('qilah', this.orders.filter(o => o.team_sale && o.team_sale.toLowerCase() === 'qilah'));
        this.renderOrdersForCategory('nisya', this.orders.filter(o => o.team_sale && o.team_sale.toLowerCase() === 'nisya'));
        this.renderOrdersForCategory('wiyah', this.orders.filter(o => o.team_sale && o.team_sale.toLowerCase() === 'wiyah'));

        // Paparkan tab pertama secara lalai
        document.querySelector('.tab-link[data-tab="all"]').click();
    }

    renderOrdersForCategory(category, orders, page = 1) {
        const tbody = document.getElementById(`recent-orders-tbody-${category}`);
        const paginationContainer = document.getElementById(`pagination-${category}`);
        if (!tbody || !paginationContainer) return;

        tbody.innerHTML = '';
        const ordersPerPage = 10; // Tentukan berapa order untuk dipaparkan per halaman
        const startIndex = (page - 1) * ordersPerPage;
        const endIndex = startIndex + ordersPerPage;
        const paginatedOrders = orders.slice(startIndex, endIndex);

        if (paginatedOrders.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" style="text-align: center; color: #6b7280; font-style: italic;">Tiada data order ditemui untuk kategori ini</td>`;
            tbody.appendChild(row);
            paginationContainer.innerHTML = ''; // Kosongkan pagination jika tiada order
            return;
        }

        paginatedOrders.forEach(order => {
            const row = document.createElement('tr');
            const platformClass = `platform-${order.platform.toLowerCase().replace(/\s+/g, '')}`;
            const typeClass = `type-${order.jenis_order.toLowerCase()}`;
            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ms-MY') : 'N/A';

            row.innerHTML = `
                <td><span class="order-code">${order.code_kain || 'N/A'}</span></td>
                <td>${orderDate}</td>
                <td>${order.nama_customer}</td>
                <td>${order.team_sale}</td>
                <td><span class="order-platform ${platformClass}">${order.platform}</span></td>
                <td><span class="order-type ${typeClass}">${order.jenis_order}</span></td>
                <td><span class="order-amount">RM ${order.total_rm.toLocaleString()}</span></td>
                <td>${order.nombor_po_invoice}</td>
            `;
            tbody.appendChild(row);
        });

        this.setupPagination(category, orders, page);
    }
    
    setupPagination(category, orders, currentPage) {
        const paginationContainer = document.getElementById(`pagination-${category}`);
        const ordersPerPage = 10;
        const totalPages = Math.ceil(orders.length / ordersPerPage);
        
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return; // Jangan tunjuk pagination jika hanya ada 1 halaman

        // Butang 'Previous'
        const prevButton = document.createElement('button');
        prevButton.innerHTML = `<i class="fas fa-chevron-left"></i> Previous`;
        prevButton.className = 'btn btn-outline btn-sm';
        if (currentPage === 1) {
            prevButton.disabled = true;
        }
        prevButton.addEventListener('click', () => {
            this.renderOrdersForCategory(category, orders, currentPage - 1);
        });
        
        // Paparan Info Halaman
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Halaman ${currentPage} / ${totalPages}`;
        pageInfo.className = 'page-info';

        // Butang 'Next'
        const nextButton = document.createElement('button');
        nextButton.innerHTML = `Next <i class="fas fa-chevron-right"></i>`;
        nextButton.className = 'btn btn-outline btn-sm';
        if (currentPage === totalPages) {
            nextButton.disabled = true;
        }
        nextButton.addEventListener('click', () => {
            this.renderOrdersForCategory(category, orders, currentPage + 1);
        });

        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(nextButton);
    }
    initCharts() {
        this.initOrderTrendChart();
        this.initOrderTimelineChart();
    }

    initOrderTrendChart() {
        const ctx = document.getElementById('orderTrendChart');
        if (!ctx) return;

        // Prepare data for last 7 days
        const chartData = this.prepareChartData(7);
        
        this.orderTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Orders',
                    data: chartData.orders,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'Revenue (RM)',
                    data: chartData.revenue,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#f9fafb',
                            font: { size: 12, weight: '600' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f9fafb',
                        bodyColor: '#f9fafb',
                        borderColor: 'rgba(51, 65, 85, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
                        ticks: { color: '#9ca3af', font: { size: 11, weight: '500' } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
                        ticks: { color: '#9ca3af', font: { size: 11, weight: '500' } }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: {
                            color: '#9ca3af',
                            font: { size: 11, weight: '500' },
                            callback: function(value) {
                                return 'RM ' + value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: { intersect: false, mode: 'index' }
            }
        });
    }

    initOrderTimelineChart() {
        const ctx = document.getElementById('orderTimelineChart');
        if (!ctx) return;

        // Prepare timeline data
        const timelineData = this.prepareTimelineData('daily');
        
        this.orderTimelineChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: timelineData.labels,
                datasets: [{
                    label: 'New Orders',
                    data: timelineData.newOrders,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }, {
                    label: 'Repeat Orders',
                    data: timelineData.repeatOrders,
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#f9fafb',
                            font: { size: 12, weight: '600' },
                            usePointStyle: true,
                            pointStyle: 'rect'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f9fafb',
                        bodyColor: '#f9fafb',
                        borderColor: 'rgba(51, 65, 85, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
                        ticks: { color: '#9ca3af', font: { size: 11, weight: '500' } }
                    },
                    y: {
                        grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
                        ticks: { color: '#9ca3af', font: { size: 11, weight: '500' } },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    prepareChartData(days) {
        const now = new Date();
        const labels = [];
        const orders = [];
        const revenue = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0];
            
            // Get orders for this date
            const dayOrders = this.orders.filter(order => 
                order.tarikh === dateStr || 
                (order.createdAt && order.createdAt.toDateString() === date.toDateString())
            );
            
            const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total_rm, 0);

            labels.push(date.toLocaleDateString('ms-MY', { weekday: 'short' }));
            orders.push(dayOrders.length);
            revenue.push(dayRevenue);
        }

        return { labels, orders, revenue };
    }

    prepareTimelineData(view) {
        const now = new Date();
        let labels = [];
        let newOrders = [];
        let repeatOrders = [];

        switch(view) {
            case 'daily':
                // Last 7 days
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
                    const dateStr = date.toISOString().split('T')[0];
                    
                    const dayOrders = this.orders.filter(order => 
                        order.tarikh === dateStr || 
                        (order.createdAt && order.createdAt.toDateString() === date.toDateString())
                    );
                    
                    const newCount = dayOrders.filter(o => o.jenis_order.toLowerCase().includes('new')).length;
                    const repeatCount = dayOrders.filter(o => o.jenis_order.toLowerCase().includes('repeat')).length;
                    
                    labels.push(date.toLocaleDateString('ms-MY', { weekday: 'short' }));
                    newOrders.push(newCount);
                    repeatOrders.push(repeatCount);
                }
                break;
                
            case 'weekly':
                // Last 4 weeks
                for (let i = 3; i >= 0; i--) {
                    const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
                    const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
                    
                    const weekOrders = this.orders.filter(order => {
                        const orderDate = order.createdAt || new Date(order.tarikh);
                        return orderDate >= weekStart && orderDate <= weekEnd;
                    });
                    
                    const newCount = weekOrders.filter(o => o.jenis_order.toLowerCase().includes('new')).length;
                    const repeatCount = weekOrders.filter(o => o.jenis_order.toLowerCase().includes('repeat')).length;
                    
                    labels.push(`Week ${4 - i}`);
                    newOrders.push(newCount);
                    repeatOrders.push(repeatCount);
                }
                break;
                
            case 'monthly':
                // Last 6 months
                for (let i = 5; i >= 0; i--) {
                    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                    
                    const monthOrders = this.orders.filter(order => {
                        const orderDate = order.createdAt || new Date(order.tarikh);
                        return orderDate >= monthDate && orderDate < nextMonth;
                    });
                    
                    const newCount = monthOrders.filter(o => o.jenis_order.toLowerCase().includes('new')).length;
                    const repeatCount = monthOrders.filter(o => o.jenis_order.toLowerCase().includes('repeat')).length;
                    
                    labels.push(monthDate.toLocaleDateString('ms-MY', { month: 'short' }));
                    newOrders.push(newCount);
                    repeatOrders.push(repeatCount);
                }
                break;
        }

        return { labels, newOrders, repeatOrders };
    }

    updateOrderTrendChart(period) {
        if (!this.orderTrendChart) return;

        const chartData = this.prepareChartData(parseInt(period));
        
        this.orderTrendChart.data.labels = chartData.labels;
        this.orderTrendChart.data.datasets[0].data = chartData.orders;
        this.orderTrendChart.data.datasets[1].data = chartData.revenue;
        this.orderTrendChart.update();
    }

    updateTimelineChart(view) {
        if (!this.orderTimelineChart) return;

        const timelineData = this.prepareTimelineData(view);
        
        this.orderTimelineChart.data.labels = timelineData.labels;
        this.orderTimelineChart.data.datasets[0].data = timelineData.newOrders;
        this.orderTimelineChart.data.datasets[1].data = timelineData.repeatOrders;
        this.orderTimelineChart.update();
    }

    showErrorState() {
        const elements = [
            'total-orders-today',
            'total-revenue-today', 
            'avg-order-today',
            'total-order-revenue',
            'total-order-count',
            'avg-order-value',
            'active-platforms'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Error';
                element.style.color = '#ef4444';
            }
        });

        // Show error in breakdown sections
        ['platform-breakdown', 'team-breakdown'].forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; color: #ef4444; padding: 1rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Error loading data
                    </div>
                `;
            }
        });

        // Show error in recent orders
        const tbody = document.getElementById('recent-orders-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #ef4444; font-style: italic;">
                        Error loading orders data
                    </td>
                </tr>
            `;
        }
    }
}

// Initialize when DOM is loaded and Firebase is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be initialized
    const initOrderAnalytics = () => {
        if (window.db) {
            console.log('Firebase detected, initializing Order Analytics...');
            new OrderAnalytics();
        } else {
            console.log('Waiting for Firebase to initialize...');
            // Check every 500ms instead of 1000ms for faster initialization
            setTimeout(initOrderAnalytics, 500);
        }
    };
    
    // Add a maximum wait time to prevent infinite waiting
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds maximum wait
    
    const initWithTimeout = () => {
        if (window.db) {
            console.log('Firebase detected, initializing Order Analytics...');
            new OrderAnalytics();
        } else if (attempts < maxAttempts) {
            attempts++;
            console.log(`Waiting for Firebase... Attempt ${attempts}/${maxAttempts}`);
            setTimeout(initWithTimeout, 500);
        } else {
            console.error('Firebase initialization timeout. Order Analytics could not be initialized.');
            // Show error state in UI
            const errorMsg = 'Firebase connection timeout. Please refresh the page.';
            
            // Show error in breakdowns
            ['platform-breakdown', 'team-breakdown'].forEach(id => {
                const container = document.getElementById(id);
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; color: #ef4444; padding: 1rem;">
                            <i class="fas fa-exclamation-triangle"></i><br>
                            ${errorMsg}
                        </div>
                    `;
                }
            });
        }
    };
    
    initWithTimeout();
});

// Export for potential use in other modules
export default OrderAnalytics;
// Enhanced PDF parsing function untuk menangkap detail saiz dengan lebih tepat
async function parsePdfInvoice(file) {
    if (typeof window.pdfjsLib === 'undefined' && typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library not found');
        throw new Error('PDF.js library tidak dimuatkan. Sila refresh halaman dan cuba lagi.');
    }

    const pdfLib = window.pdfjsLib || pdfjsLib;
    pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const fileReader = new FileReader();
    
    return new Promise((resolve, reject) => {
        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfLib.getDocument(typedarray).promise;
                let fullText = '';

                console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);

                // Extract text from all pages
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + ' ';
                }

                console.log('Full PDF text extracted:', fullText.substring(0, 1000));

                if (fullText.trim().length < 10) {
                    throw new Error('PDF ini mungkin adalah scan/gambar. Sila gunakan PDF yang mengandungi teks yang boleh dipilih.');
                }

                // ===== ENHANCED EXTRACTION UNTUK DESA MURNI BATIK =====
                
                // 1. Extract Invoice Number
                const invoiceRegex = /Invoice:\s*#(Inv-[\d-]+)/i;
                const invoiceMatch = fullText.match(invoiceRegex);
                
                // 2. Extract Date
                const dateRegex = /(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}/;
                const dateMatch = fullText.match(dateRegex);
                
                // 3. Extract Customer Name
                const customerRegex = /BILLING ADDRESS:\s*([^\n]+)/i;
                const customerMatch = fullText.match(customerRegex);
                
                // 4. Extract Contact Number
                const contactRegex = /Contact no:\s*([\d-]+)/i;
                const contactMatch = fullText.match(contactRegex);
                
                // 5. Extract Total Paid Amount
                const totalPaidRegex = /Total Paid:\s*RM\s*([\d,]+\.?\d*)/i;
                const totalPaidMatch = fullText.match(totalPaidRegex);
                
                // 6. Extract Customer Note/Team Sale
                const customerNoteRegex = /Customer Note:\s*\*(\w+)/i;
                const customerNoteMatch = fullText.match(customerNoteRegex);
                
                // 7. ENHANCED PRODUCT EXTRACTION dengan detail saiz
                const productLines = [];
                
                // Enhanced pattern untuk menangkap produk dengan saiz
                // Format: SKU ProductName (Size: X) Qty Price
                const enhancedProductRegex = /(BZ[LP]\d{2}[A-Z]{2})\s+([^(]+?)\s*\(\s*Size:\s*(\w+)\s*\)\s*(\d+)\s+RM\s*([\d,]+\.?\d*)/gi;
                
                let match;
                while ((match = enhancedProductRegex.exec(fullText)) !== null) {
                    const [, sku, productName, size, qty, price] = match;
                    
                    productLines.push({
                        sku: sku.trim(),
                        product_name: `${productName.trim()} (Size: ${size})`,
                        size: size.trim(),
                        quantity: parseInt(qty),
                        price: parseFloat(price.replace(/,/g, '')),
                        type: 'Unknown' // Will be determined by section
                    });
                }

                // Jika pattern enhanced tidak berjaya, cuba pattern lama
                if (productLines.length === 0) {
                    console.log('Enhanced pattern tidak berjaya, menggunakan pattern backup...');
                    
                    // Backup pattern untuk format yang berbeza
                    const backupRegex = /(BZ[LP]\d{2}[A-Z]{2})\s+([^0-9]+?)\s+(\d+)\s+RM\s*([\d,]+\.?\d*)/g;
                    
                    while ((match = backupRegex.exec(fullText)) !== null) {
                        const [, sku, productName, qty, price] = match;
                        
                        // Extract size dari product name jika ada
                        const sizeMatch = productName.match(/\(Size:\s*(\w+)\)/i) || 
                                         productName.match(/Size:\s*(\w+)/i) ||
                                         productName.match(/(\w+)\s*\)/);
                        
                        const size = sizeMatch ? sizeMatch[1] : 'Mixed';
                        
                        productLines.push({
                            sku: sku.trim(),
                            product_name: productName.trim(),
                            size: size,
                            quantity: parseInt(qty),
                            price: parseFloat(price.replace(/,/g, '')),
                            type: 'Unknown'
                        });
                    }
                }

                // Determine product type (Ready Stock vs Pre-Order) berdasarkan position dalam text
                const readyStockIndex = fullText.indexOf('Ready Stock');
                const preOrderIndex = fullText.indexOf('Pre-Order');
                
                productLines.forEach(product => {
                    const productIndex = fullText.indexOf(product.sku);
                    
                    if (readyStockIndex !== -1 && preOrderIndex !== -1) {
                        if (productIndex > readyStockIndex && productIndex < preOrderIndex) {
                            product.type = 'Ready Stock';
                        } else if (productIndex > preOrderIndex) {
                            product.type = 'Pre-Order';
                        }
                    } else if (readyStockIndex !== -1 && productIndex > readyStockIndex) {
                        product.type = 'Ready Stock';
                    } else {
                        product.type = 'Pre-Order';
                    }
                });

                console.log('Extracted products with sizes:', productLines);

                // Validate required data
                if (!invoiceMatch) {
                    throw new Error('Nombor invoice tidak ditemui. Pastikan PDF adalah invoice dari Desa Murni Batik.');
                }
                
                if (!totalPaidMatch) {
                    throw new Error('Total amount tidak ditemui dalam PDF.');
                }
                
                // Format date
                let formattedDate = new Date().toISOString().split('T')[0];
                if (dateMatch) {
                    const [day, month, year] = dateMatch[1].split('/');
                    formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }

                // Group products by SKU untuk summary
                const productGroups = {};
                productLines.forEach(product => {
                    if (!productGroups[product.sku]) {
                        productGroups[product.sku] = {
                            sku: product.sku,
                            name: product.product_name.split(' - ')[0] || product.product_name,
                            sizes: [],
                            totalQty: 0,
                            totalRevenue: 0
                        };
                    }
                    
                    productGroups[product.sku].sizes.push({
                        size: product.size,
                        qty: product.quantity,
                        price: product.price,
                        type: product.type
                    });
                    
                    productGroups[product.sku].totalQty += product.quantity;
                    productGroups[product.sku].totalRevenue += (product.quantity * product.price);
                });

                // Get dominant product (yang paling banyak quantity)
                let dominantProduct = null;
                let maxQty = 0;
                
                Object.values(productGroups).forEach(group => {
                    if (group.totalQty > maxQty) {
                        maxQty = group.totalQty;
                        dominantProduct = group;
                    }
                });

                const dominantSKU = dominantProduct ? dominantProduct.sku : 'MIXED';
                const dominantProductType = dominantProduct ? dominantProduct.name : 'Mixed Products';

                // Create comprehensive order object
                const order = {
                    // Basic order info
                    nombor_po_invoice: invoiceMatch[1].trim(),
                    tarikh: formattedDate,
                    nama_customer: customerMatch ? customerMatch[1].trim() : 'Customer dari PDF',
                    team_sale: customerNoteMatch ? customerNoteMatch[1].trim() : 'Manual',
                    nombor_phone: contactMatch ? contactMatch[1].trim() : '',
                    total_rm: parseFloat(totalPaidMatch[1].replace(/,/g, '')),
                    platform: 'Website Desa Murni',
                    jenis_order: dominantProductType,
                    code_kain: dominantSKU,
                    
                    // Enhanced: Detailed product information
                    products: Object.values(productGroups),
                    
                    // Additional statistics
                    total_quantity: productLines.reduce((sum, p) => sum + p.quantity, 0),
                    unique_products: Object.keys(productGroups).length,
                    unique_sizes: [...new Set(productLines.map(p => p.size))].length,
                    ready_stock_items: productLines.filter(p => p.type === 'Ready Stock').length,
                    pre_order_items: productLines.filter(p => p.type === 'Pre-Order').length,
                    
                    // Size distribution summary
                    size_distribution: this.calculateSizeDistribution(productLines),
                    
                    // Most popular size
                    most_popular_size: this.getMostPopularSize(productLines),
                    
                    // Metadata
                    createdAt: Timestamp.now(),
                    source: 'pdf_desa_murni_enhanced',
                    pdf_processed_at: new Date().toISOString(),
                    extraction_method: 'enhanced_size_parsing'
                };

                console.log('Final enhanced parsed order:', order);
                
                // Show enhanced preview
                showEnhancedExtractedPreview(order);
                
                resolve([order]);

            } catch (err) {
                console.error('Error parsing PDF:', err);
                reject(new Error(`Gagal memproses PDF: ${err.message}`));
            }
        };

        fileReader.onerror = (error) => {
            console.error('File reader error:', error);
            reject(new Error('Gagal membaca fail PDF. Pastikan fail tidak rosak.'));
        };
        
        fileReader.readAsArrayBuffer(file);
    });
}

// Helper function untuk kira size distribution
function calculateSizeDistribution(productLines) {
    const distribution = {};
    
    productLines.forEach(product => {
        if (!distribution[product.size]) {
            distribution[product.size] = {
                count: 0,
                quantity: 0,
                revenue: 0
            };
        }
        
        distribution[product.size].count++;
        distribution[product.size].quantity += product.quantity;
        distribution[product.size].revenue += (product.quantity * product.price);
    });
    
    return distribution;
}

// Helper function untuk dapatkan most popular size
function getMostPopularSize(productLines) {
    const sizeCount = {};
    
    productLines.forEach(product => {
        if (!sizeCount[product.size]) {
            sizeCount[product.size] = 0;
        }
        sizeCount[product.size] += product.quantity;
    });
    
    let mostPopular = { size: 'N/A', quantity: 0 };
    Object.entries(sizeCount).forEach(([size, qty]) => {
        if (qty > mostPopular.quantity) {
            mostPopular = { size, quantity: qty };
        }
    });
    
    return mostPopular;
}

// Enhanced preview function
function showEnhancedExtractedPreview(order) {
    const previewDiv = document.getElementById('extractedPreview');
    const previewContent = document.getElementById('previewContent');
    
    if (!previewDiv || !previewContent) return;
    
    // Create enhanced preview HTML
    let previewHTML = `
        <div class="pdf-summary">
            <div class="summary-badge">
                <i class="fas fa-file-pdf"></i>
                <span>Enhanced Data dari PDF Desa Murni Batik</span>
            </div>
            <div class="summary-stats">
                <div class="stat-item">Produk Unik: <strong>${order.unique_products}</strong></div>
                <div class="stat-item">Saiz Berbeza: <strong>${order.unique_sizes}</strong></div>
                <div class="stat-item">Total Qty: <strong>${order.total_quantity}</strong></div>
                <div class="stat-item">Jumlah: <strong>RM ${order.total_rm?.toFixed(2) || '0.00'}</strong></div>
            </div>
        </div>
        
        <div class="preview-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
            <div class="preview-section">
                <h4 style="color: #60a5fa; margin-bottom: 0.5rem;">
                    <i class="fas fa-info-circle"></i> Order Info
                </h4>
                <div class="preview-item">
                    <span class="preview-label">Invoice:</span>
                    <span class="preview-value">${order.nombor_po_invoice}</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Tarikh:</span>
                    <span class="preview-value">${order.tarikh}</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Customer:</span>
                    <span class="preview-value">${order.nama_customer}</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Team Sale:</span>
                    <span class="preview-value">${order.team_sale}</span>
                </div>
            </div>
            
            <div class="preview-section">
                <h4 style="color: #10b981; margin-bottom: 0.5rem;">
                    <i class="fas fa-chart-bar"></i> Size Analytics
                </h4>
                <div class="preview-item">
                    <span class="preview-label">Most Popular Size:</span>
                    <span class="preview-value" style="color: #10b981;">${order.most_popular_size.size} (${order.most_popular_size.quantity} unit)</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Ready Stock:</span>
                    <span class="preview-value">${order.ready_stock_items} items</span>
                </div>
                <div class="preview-item">
                    <span class="preview-label">Pre-Order:</span>
                    <span class="preview-value">${order.pre_order_items} items</span>
                </div>
            </div>
        </div>
    `;
    
    // Add detailed products table
    if (order.products && order.products.length > 0) {
        previewHTML += `
            <div style="margin-top: 1rem;">
                <h4 style="color: #60a5fa; margin-bottom: 0.5rem;">
                    <i class="fas fa-list"></i> Detail Produk & Saiz (${order.products.length} produk)
                </h4>
                <div class="csv-preview-table" style="max-height: 300px; overflow-y: auto;">
        `;
        
        order.products.forEach(product => {
            previewHTML += `
                <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(51, 65, 85, 0.3); border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <div>
                            <strong style="color: #e2e8f0;">${product.sku}</strong>
                            <div style="font-size: 0.8rem; color: #94a3b8;">${product.name}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: #10b981;">Total: ${product.totalQty} unit</div>
                            <div style="font-size: 0.8rem; color: #94a3b8;">RM ${product.totalRevenue.toFixed(2)}</div>
                        </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
            `;
            
            product.sizes.forEach(size => {
                const typeColor = size.type === 'Ready Stock' ? '#22c55e' : '#f59e0b';
                previewHTML += `
                    <span style="background-color: ${typeColor}; color: white; padding: 0.125rem 0.375rem; border-radius: 10px; font-size: 0.7rem; font-weight: 600;">
                        ${size.size}: ${size.qty} (${size.type})
                    </span>
                `;
            });
            
            previewHTML += `
                    </div>
                </div>
            `;
        });
        
        previewHTML += `
                </div>
            </div>
        `;
        
        // Add size distribution summary
        previewHTML += `
            <div style="margin-top: 1rem;">
                <h4 style="color: #8b5cf6; margin-bottom: 0.5rem;">
                    <i class="fas fa-chart-pie"></i> Size Distribution Summary
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        `;
        
        Object.entries(order.size_distribution).forEach(([size, data]) => {
            previewHTML += `
                <div style="background: rgba(139, 92, 246, 0.2); border: 1px solid #8b5cf6; padding: 0.5rem; border-radius: 6px; text-align: center;">
                    <div style="font-weight: 600; color: #8b5cf6;">Size ${size}</div>
                    <div style="font-size: 0.8rem; color: #cbd5e1;">${data.quantity} unit</div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">RM ${data.revenue.toFixed(2)}</div>
                </div>
            `;
        });
        
        previewHTML += `
                </div>
            </div>
        `;
    }
    
    previewContent.innerHTML = previewHTML;
    previewDiv.classList.add('show');
    
    // Auto-fill form with extracted data
    populateForm(order);
}