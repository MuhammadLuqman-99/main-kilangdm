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