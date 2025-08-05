// Fixed Enhanced Order Analytics untuk Structured Product Display
// Update untuk enhanced-order-detection.js

class EnhancedOrderAnalytics {
    constructor() {
        this.db = window.db;
        this.orderTrendChart = null;
        this.orderTimelineChart = null;
        this.orders = [];
        this.processedOrders = [];
        
        // Enhanced color schemes
        this.platformColors = {
            'Shopee': '#ff5e4d',
            'TikTok': '#000000', 
            'Lazada': '#ff9900',
            'Website': '#3b82f6',
            'Website Desa Murni': '#3b82f6',
            'WhatsApp': '#25d366',
            'Facebook': '#1877f2',
            'Instagram': '#e1306c',
            'Manual': '#64748b'
        };
        
        this.sizeColors = {
            'XS': '#ef4444',    // red
            'S': '#f59e0b',     // amber
            'M': '#10b981',     // emerald
            'L': '#3b82f6',     // blue
            'XL': '#8b5cf6',    // violet
            'XXL': '#8b5cf6',   // violet
            '2XL': '#ec4899',   // pink
            '3XL': '#06b6d4',   // cyan
            '4XL': '#84cc16',   // lime
            '5XL': '#f97316'    // orange
        };
        
        this.teamColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Enhanced Order Analytics...');
            this.setupEventListeners();
            await this.loadOrderData();
            this.initCharts();
            console.log('Enhanced Order Analytics initialized successfully');
        } catch (error) {
            console.error('Error initializing Enhanced Order Analytics:', error);
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

        // Tab switching functionality
        document.querySelectorAll('.tab-link').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Update active state
                document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update active content
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    async loadOrderData() {
        try {
            console.log('Loading order data from Firebase...');
            
            if (!this.db) {
                throw new Error('Firestore database not initialized');
            }

            this.showLoadingState();

            // Query orders from orderData collection
            const ordersQuery = query(
                collection(this.db, "orderData"),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(ordersQuery);
            this.orders = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const processedOrder = this.processOrderData(data, doc.id);
                this.orders.push(processedOrder);
            });

            console.log(`Loaded ${this.orders.length} orders from Firebase`);
            
            // Process orders for enhanced display
            this.processedOrders = this.orders.map(order => this.enhanceOrderForDisplay(order));
            
            // Update all components
            this.updateStatistics();
            this.updateBreakdowns();
            this.updateRecentOrders();
            this.updateTrendCalculations();

        } catch (error) {
            console.error('Error loading order data:', error);
            this.showErrorState();
        }
    }

    processOrderData(data, docId) {
        return {
            id: docId,
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
            nombor_po_invoice: data.nombor_po_invoice || '',
            
            // Enhanced fields untuk structured display
            structuredProducts: data.structuredProducts || [],
            products: data.products || [],
            totalQuantity: data.totalQuantity || data.total_quantity || 1,
            uniqueSizes: data.uniqueSizes || [],
            productCount: data.productCount || 0,
            sizeCount: data.sizeCount || 0,
            source: data.source || 'unknown'
        };
    }

    enhanceOrderForDisplay(order) {
        // Process enhanced data untuk display
        let displayProducts = [];
        let totalQuantity = 1;
        let uniqueSizes = [];

        if (order.structuredProducts && Array.isArray(order.structuredProducts) && order.structuredProducts.length > 0) {
            // Data dari enhanced PDF processing
            displayProducts = order.structuredProducts.map(product => ({
                name: product.name,
                sku: product.sku,
                totalQty: product.totalQty,
                sizes: product.sizeBreakdown || [],
                type: product.type || 'Standard'
            }));
            
            totalQuantity = order.totalQuantity || displayProducts.reduce((sum, p) => sum + p.totalQty, 0);
            uniqueSizes = order.uniqueSizes || this.extractUniqueSizesFromDisplay(displayProducts);
            
        } else if (order.products && Array.isArray(order.products) && order.products.length > 0) {
            // Fallback untuk data lama dengan products array
            displayProducts = this.createDisplayProductsFromRaw(order.products);
            totalQuantity = order.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
            uniqueSizes = this.extractUniqueSizesFromRaw(order.products);
            
        } else {
            // Standard order tanpa detailed breakdown
            displayProducts = [{
                name: order.jenis_order || order.code_kain || 'Standard Order',
                sku: order.code_kain || 'N/A',
                totalQty: 1,
                sizes: [{ size: 'Unknown', quantity: 1 }],
                type: 'Standard'
            }];
            totalQuantity = 1;
            uniqueSizes = ['Unknown'];
        }

        return {
            ...order,
            displayProducts,
            displayTotalQuantity: totalQuantity,
            displayUniqueSizes: uniqueSizes,
            productCount: displayProducts.length,
            sizeCount: uniqueSizes.length
        };
    }

    createDisplayProductsFromRaw(rawProducts) {
        const productMap = new Map();

        rawProducts.forEach(product => {
            const baseName = this.extractBaseProductName(product.product_name || product.base_name);
            const size = product.size || this.extractSizeFromProductName(product.product_name);
            
            if (!productMap.has(baseName)) {
                productMap.set(baseName, {
                    name: baseName,
                    sku: product.sku,
                    totalQty: 0,
                    sizes: [],
                    type: product.type || 'Unknown'
                });
            }

            const productGroup = productMap.get(baseName);
            productGroup.totalQty += product.quantity || 0;
            
            // Add size information
            const existingSize = productGroup.sizes.find(s => s.size === size);
            if (existingSize) {
                existingSize.quantity += product.quantity || 0;
            } else {
                productGroup.sizes.push({
                    size: size || 'Unknown',
                    quantity: product.quantity || 0
                });
            }
        });

        return Array.from(productMap.values()).map(product => ({
            ...product,
            sizes: product.sizes.sort((a, b) => this.sortSizes(a.size, b.size))
        }));
    }

    extractBaseProductName(productName) {
        if (!productName) return 'Unknown Product';
        
        return productName
            .replace(/\s*-\s*\(Size:\s*[^)]+\)/gi, '')
            .replace(/\s*\(Size:\s*[^)]+\)/gi, '')
            .replace(/\s*-\s*(XS|S|M|L|XL|2XL|3XL|4XL|5XL)\s*$/gi, '')
            .trim() || productName;
    }

    extractSizeFromProductName(productName) {
        if (!productName) return 'Unknown';
        
        const sizeMatch = productName.match(/\(Size:\s*([^)]+)\)|Size:\s*([A-Z0-9]+)|\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL)\b/i);
        return sizeMatch ? (sizeMatch[1] || sizeMatch[2] || sizeMatch[3]).trim() : 'Unknown';
    }
    extractUniqueSizesFromDisplay(displayProducts) {
        const sizes = new Set();
        displayProducts.forEach(product => {
            if (product.sizes && Array.isArray(product.sizes)) {
                product.sizes.forEach(sizeObj => {
                    if (sizeObj.size && sizeObj.size !== 'Unknown') {
                        sizes.add(sizeObj.size);
                    }
                });
            }
        });
        return Array.from(sizes).sort(this.sortSizes);
    }

    extractUniqueSizesFromRaw(rawProducts) {
        const sizes = new Set();
        rawProducts.forEach(product => {
            const size = product.size || this.extractSizeFromProductName(product.product_name);
            if (size && size !== 'Unknown') sizes.add(size);
        });
        return Array.from(sizes).sort(this.sortSizes);
    }

    sortSizes(a, b) {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        
        return a.localeCompare(b);
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

        // Show loading in all table bodies
        const categories = ['all', 'shopee', 'tiktok', 'qilah', 'nisya', 'wiyah'];
        categories.forEach(category => {
            const tbody = document.getElementById(`recent-orders-tbody-${category}`);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="loading-placeholder" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>
                            Loading orders...
                        </td>
                    </tr>
                `;
            }
        });
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
        const activePlatforms = [...new Set(this.orders.map(order => order.platform).filter(p => p))].length;

        // Update summary stats
        this.updateElement('total-orders-today', todayOrders.length);
        this.updateElement('total-revenue-today', `RM ${todayRevenue.toLocaleString()}`);
        this.updateElement('avg-order-today', `RM ${todayAvg.toFixed(2)}`);

        // Update main stats
        this.updateElement('total-order-revenue', `RM ${totalRevenue.toLocaleString()}.00`);
        this.updateElement('total-order-count', totalOrders.toLocaleString());
        this.updateElement('avg-order-value', `RM ${avgOrderValue.toFixed(2)}`);
        this.updateElement('active-platforms', activePlatforms);

        // Update meta information
        this.updateElement('revenue-period', `daripada ${totalOrders} order`);
        this.updateElement('volume-period', `jumlah order`);
        this.updateElement('avg-period', `purata per order`);
        this.updateElement('platform-period', `platform aktif`);
    }

    updateTrendCalculations() {
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
        this.updateElement('platform-trend', platformTrend >= 0 ? `+${platformTrend}` : platformTrend);
    }

    updateTrendIndicator(elementId, trendValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
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
            if (!order.platform || order.platform.trim() === '') return;
            
            if (!platformStats[order.platform]) {
                platformStats[order.platform] = { orders: 0, revenue: 0 };
            }
            platformStats[order.platform].orders++;
            platformStats[order.platform].revenue += order.total_rm;
        });

        this.renderBreakdown('platform-breakdown', platformStats, 'Platform');

        // Team breakdown
        const teamStats = {};
        this.orders.forEach(order => {
            if (!order.team_sale || order.team_sale.trim() === '') return;
            
            if (!teamStats[order.team_sale]) {
                teamStats[order.team_sale] = { orders: 0, revenue: 0 };
            }
            teamStats[order.team_sale].orders++;
            teamStats[order.team_sale].revenue += order.total_rm;
        });

        this.renderBreakdown('team-breakdown', teamStats, 'Team');
    }

    renderBreakdown(containerId, stats, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (Object.keys(stats).length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #6b7280; padding: 1rem; font-style: italic;">
                    <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
                    Tiada data ${type.toLowerCase()} ditemui
                </div>
            `;
            return;
        }

        // Sort by revenue
        const sorted = Object.entries(stats).sort(([,a], [,b]) => b.revenue - a.revenue);

        sorted.forEach(([name, data], index) => {
            const item = document.createElement('div');
            item.className = 'breakdown-item';
            
            const color = type === 'Platform' ? 
                (this.platformColors[name] || '#6b7280') : 
                (this.teamColors[index % this.teamColors.length]);
            
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-indicator" style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; margin-right: 0.75rem;"></div>
                    <span class="item-label" style="color: #e2e8f0; font-weight: 500;">${name}</span>
                </div>
                <div style="text-align: right;">
                    <div class="item-value" style="color: #10b981; font-weight: 600;">RM ${data.revenue.toLocaleString()}</div>
                    <div class="item-count" style="color: #94a3b8; font-size: 0.8rem;">${data.orders} orders</div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    updateRecentOrders() {
        // Sort orders by date (newest first)
        this.processedOrders.sort((a, b) => b.createdAt - a.createdAt);
        
        // Render for each category
        this.renderOrdersForCategory('all', this.processedOrders);
        this.renderOrdersForCategory('shopee', this.processedOrders.filter(o => 
            o.platform && o.platform.toLowerCase().includes('shopee')));
        this.renderOrdersForCategory('tiktok', this.processedOrders.filter(o => 
            o.platform && (o.platform.toLowerCase().includes('tiktok') || o.platform.toLowerCase().includes('lazada'))));
        this.renderOrdersForCategory('qilah', this.processedOrders.filter(o => 
            o.team_sale && o.team_sale.toLowerCase().includes('qilah')));
        this.renderOrdersForCategory('nisya', this.processedOrders.filter(o => 
            o.team_sale && o.team_sale.toLowerCase().includes('nisya')));
        this.renderOrdersForCategory('wiyah', this.processedOrders.filter(o => 
            o.team_sale && o.team_sale.toLowerCase().includes('wiyah')));
    }

    renderOrdersForCategory(category, orders, page = 1) {
        const tbody = document.getElementById(`recent-orders-tbody-${category}`);
        const paginationContainer = document.getElementById(`pagination-${category}`);
        if (!tbody) return;

        tbody.innerHTML = '';
        const ordersPerPage = 10;
        const startIndex = (page - 1) * ordersPerPage;
        const endIndex = startIndex + ordersPerPage;
        const paginatedOrders = orders.slice(startIndex, endIndex);

        if (paginatedOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; color: #6b7280; font-style: italic; padding: 2rem;">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                        Tiada data order ditemui untuk kategori ini
                    </td>
                </tr>
            `;
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        paginatedOrders.forEach((order) => {
            const row = this.createEnhancedOrderRow(order);
            tbody.appendChild(row);
        });

        if (paginationContainer) {
            this.setupPagination(category, orders, page);
        }
    }

    createEnhancedOrderRow(order) {
        const row = document.createElement('tr');
        const orderDate = order.createdAt ? 
            new Date(order.createdAt).toLocaleDateString('ms-MY') : 
            (order.tarikh ? new Date(order.tarikh).toLocaleDateString('ms-MY') : 'N/A');

        // Generate platform class
        const platformClass = this.getPlatformClass(order.platform);
        
        // Generate enhanced product details HTML
        const productDetailsHTML = this.generateEnhancedProductDetailsHTML(order);

        row.innerHTML = `
            <td style="width: 30px;">
                <button class="expand-btn" onclick="toggleOrderDetails(this)" data-order-id="${order.id}">
                    <i class="fas fa-plus"></i>
                </button>
            </td>
            <td>
                <span class="invoice-number">${order.nombor_po_invoice || 'N/A'}</span>
            </td>
            <td>
                <span style="color: #cbd5e1; font-size: 0.875rem;">${orderDate}</span>
            </td>
            <td>
                <div style="color: #e2e8f0; font-weight: 500;">
                    ${order.nama_customer || 'N/A'}
                </div>
            </td>
            <td>
                <span style="color: #94a3b8; font-size: 0.875rem;">
                    ${order.team_sale || 'N/A'}
                </span>
            </td>
            <td>
                <span class="platform-badge ${platformClass}">
                    ${order.platform || 'N/A'}
                </span>
            </td>
            <td class="product-details">
                ${productDetailsHTML}
            </td>
            <td style="text-align: center;">
                <span style="color: #e2e8f0; font-weight: 600; font-size: 1.1rem;">
                    ${order.displayTotalQuantity}
                </span>
            </td>
            <td style="text-align: right;">
                <span class="amount-value">RM ${order.total_rm ? order.total_rm.toFixed(2) : '0.00'}</span>
            </td>
        `;
        
        return row;
    }

    generateEnhancedProductDetailsHTML(order) {
        const { displayProducts, productCount, sizeCount } = order;
        
        let html = `
            <div class="product-summary">
                <span class="product-count-badge">
                    <i class="fas fa-box"></i>
                    ${productCount} produk
                </span>
                <span style="color: #94a3b8; margin-left: 0.5rem; font-size: 0.8rem;">
                    ${sizeCount} saiz berbeza
                </span>
            </div>
            <div class="product-list">
        `;
        
        // Show first 3 products, then "show more" if needed
        const displayProductLimit = 3;
        const productsToShow = displayProducts.slice(0, displayProductLimit);
        
        productsToShow.forEach(product => {
            html += `
                <div class="product-item">
                    <div class="product-header">
                        <span class="product-name">${product.name}</span>
                        <span class="product-total-qty">${product.totalQty}</span>
                    </div>
                    <div class="size-breakdown">
                        ${this.generateSizeBadgesHTML(product.sizes)}
                    </div>
                </div>
            `;
        });
        
        if (displayProducts.length > displayProductLimit) {
            html += `
                <div style="text-align: center; margin-top: 0.5rem;">
                    <span style="color: #60a5fa; font-size: 0.75rem; font-style: italic;">
                        +${displayProducts.length - displayProductLimit} produk lagi...
                    </span>
                </div>
            `;
        }
        
        html += `</div>`;
        return html;
    }

    generateSizeBadgesHTML(sizes) {
        if (!sizes || sizes.length === 0) {
            return `<span class="size-badge" style="background-color: #64748b;">Mixed</span>`;
        }
        
        return sizes.map(sizeObj => {
            const bgColor = this.sizeColors[sizeObj.size] || '#64748b';
            return `<span class="size-badge" style="background-color: ${bgColor}; color: white;">
                ${sizeObj.size}: ${sizeObj.quantity}
            </span>`;
        }).join('');
    }

    getPlatformClass(platform) {
        if (!platform) return 'platform-default';
        
        const platformLower = platform.toLowerCase();
        if (platformLower.includes('shopee')) return 'platform-shopee';
        if (platformLower.includes('tiktok') || platformLower.includes('lazada')) return 'platform-tiktok';
        if (platformLower.includes('website')) return 'platform-website';
        
        return 'platform-default';
    }

    setupPagination(category, orders, currentPage) {
        const paginationContainer = document.getElementById(`pagination-${category}`);
        if (!paginationContainer) return;
        
        const ordersPerPage = 10;
        const totalPages = Math.ceil(orders.length / ordersPerPage);
        
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.innerHTML = `<i class="fas fa-chevron-left"></i> Previous`;
        prevButton.className = 'btn btn-outline btn-sm';
        if (currentPage === 1) {
            prevButton.disabled = true;
        }
        prevButton.addEventListener('click', () => {
            this.renderOrdersForCategory(category, orders, currentPage - 1);
        });
        
        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Halaman ${currentPage} / ${totalPages}`;
        pageInfo.className = 'page-info';

        // Next button
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
                    pointRadius: 6
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
                            font: { size: 12, weight: '600' }
                        }
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
                }
            }
        });
    }

    initOrderTimelineChart() {
        const ctx = document.getElementById('orderTimelineChart');
        if (!ctx) return;

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
                    borderRadius: 6
                }, {
                    label: 'Repeat Orders',
                    data: timelineData.repeatOrders,
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    borderRadius: 6
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
                            font: { size: 12, weight: '600' }
                        }
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
        // Simplified version
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            newOrders: [5, 8, 12, 7, 15, 10, 6],
            repeatOrders: [2, 3, 5, 4, 8, 6, 3]
        };
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

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
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

        // Show error in all table bodies
        const categories = ['all', 'shopee', 'tiktok', 'qilah', 'nisya', 'wiyah'];
        categories.forEach(category => {
            const tbody = document.getElementById(`recent-orders-tbody-${category}`);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; color: #ef4444; font-style: italic;">
                            Error loading orders data
                        </td>
                    </tr>
                `;
            }
        });
    }
}

// Initialize when DOM is loaded and Firebase is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, waiting for Firebase...');
    
    let attempts = 0;
    const maxAttempts = 20;
    
    const initWithTimeout = () => {
        if (window.db) {
            console.log('Firebase detected, initializing Enhanced Order Analytics...');
            window.enhancedOrderAnalytics = new EnhancedOrderAnalytics();
        } else if (attempts < maxAttempts) {
            attempts++;
            console.log(`Waiting for Firebase... Attempt ${attempts}/${maxAttempts}`);
            setTimeout(initWithTimeout, 500);
        } else {
            console.error('Firebase initialization timeout.');
            
            // Show timeout error
            const errorMsg = 'Firebase connection timeout. Please refresh the page.';
            
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

            const categories = ['all', 'shopee', 'tiktok', 'qilah', 'nisya', 'wiyah'];
            categories.forEach(category => {
                const tbody = document.getElementById(`recent-orders-tbody-${category}`);
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="9" style="text-align: center; color: #ef4444; padding: 2rem;">
                                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                                ${errorMsg}
                            </td>
                        </tr>
                    `;
                }
            });
        }
    };
    
    initWithTimeout();
});

// Global function for expand/collapse order details
window.toggleOrderDetails = function(button) {
    const icon = button.querySelector('i');
    const row = button.closest('tr');
    const orderId = button.dataset.orderId;
    
    if (icon.classList.contains('fa-plus')) {
        // Expand
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus');
        button.classList.add('expanded');
        
        console.log('Expanding details for order:', orderId);
        
    } else {
        // Collapse
        icon.classList.remove('fa-minus');
        icon.classList.add('fa-plus');
        button.classList.remove('expanded');
        
        console.log('Collapsing details for order:', orderId);
    }
    
    // Animation effect
    button.style.transform = 'scale(0.9)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
};

// Global function for viewing invoice details
window.viewInvoiceDetails = function(orderId) {
    console.log('Viewing invoice details for order:', orderId);
    
    if (window.enhancedOrderAnalytics) {
        const order = window.enhancedOrderAnalytics.orders.find(o => o.id === orderId);
        if (order) {
            console.log('Order details:', order);
            // Show modal or navigate to detail page
        }
    }
};

// Export for potential use in other modules
export default EnhancedOrderAnalytics;// Fixed Enhanced Order Analytics untuk Structured Product Display
// Update untuk enhanced-order-detection.js

class EnhancedOrderAnalytics {
    constructor() {
        this.db = window.db;
        this.orderTrendChart = null;
        this.orderTimelineChart = null;
        this.orders = [];
        this.processedOrders = [];
        
        // Enhanced color schemes
        this.platformColors = {
            'Shopee': '#ff5e4d',
            'TikTok': '#000000', 
            'Lazada': '#ff9900',
            'Website': '#3b82f6',
            'Website Desa Murni': '#3b82f6',
            'WhatsApp': '#25d366',
            'Facebook': '#1877f2',
            'Instagram': '#e1306c',
            'Manual': '#64748b'
        };
        
        this.sizeColors = {
            'XS': '#ef4444',    // red
            'S': '#f59e0b',     // amber
            'M': '#10b981',     // emerald
            'L': '#3b82f6',     // blue
            'XL': '#8b5cf6',    // violet
            'XXL': '#8b5cf6',   // violet
            '2XL': '#ec4899',   // pink
            '3XL': '#06b6d4',   // cyan
            '4XL': '#84cc16',   // lime
            '5XL': '#f97316'    // orange
        };
        
        this.teamColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Enhanced Order Analytics...');
            this.setupEventListeners();
            await this.loadOrderData();
            this.initCharts();
            console.log('Enhanced Order Analytics initialized successfully');
        } catch (error) {
            console.error('Error initializing Enhanced Order Analytics:', error);
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

        // Tab switching functionality
        document.querySelectorAll('.tab-link').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Update active state
                document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update active content
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    async loadOrderData() {
        try {
            console.log('Loading order data from Firebase...');
            
            if (!this.db) {
                throw new Error('Firestore database not initialized');
            }

            this.showLoadingState();

            // Query orders from orderData collection
            const ordersQuery = query(
                collection(this.db, "orderData"),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(ordersQuery);
            this.orders = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const processedOrder = this.processOrderData(data, doc.id);
                this.orders.push(processedOrder);
            });

            console.log(`Loaded ${this.orders.length} orders from Firebase`);
            
            // Process orders for enhanced display
            this.processedOrders = this.orders.map(order => this.enhanceOrderForDisplay(order));
            
            // Update all components
            this.updateStatistics();
            this.updateBreakdowns();
            this.updateRecentOrders();
            this.updateTrendCalculations();

        } catch (error) {
            console.error('Error loading order data:', error);
            this.showErrorState();
        }
    }

    processOrderData(data, docId) {
        return {
            id: docId,
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
            nombor_po_invoice: data.nombor_po_invoice || '',
            
            // Enhanced fields untuk structured display
            structuredProducts: data.structuredProducts || [],
            products: data.products || [],
            totalQuantity: data.totalQuantity || data.total_quantity || 1,
            uniqueSizes: data.uniqueSizes || [],
            productCount: data.productCount || 0,
            sizeCount: data.sizeCount || 0,
            source: data.source || 'unknown'
        };
    }

    enhanceOrderForDisplay(order) {
        // Process enhanced data untuk display
        let displayProducts = [];
        let totalQuantity = 1;
        let uniqueSizes = [];

        if (order.structuredProducts && Array.isArray(order.structuredProducts) && order.structuredProducts.length > 0) {
            // Data dari enhanced PDF processing
            displayProducts = order.structuredProducts.map(product => ({
                name: product.name,
                sku: product.sku,
                totalQty: product.totalQty,
                sizes: product.sizeBreakdown || [],
                type: product.type || 'Standard'
            }));
            
            totalQuantity = order.totalQuantity || displayProducts.reduce((sum, p) => sum + p.totalQty, 0);
            uniqueSizes = order.uniqueSizes || this.extractUniqueSizesFromDisplay(displayProducts);
            
        } else if (order.products && Array.isArray(order.products) && order.products.length > 0) {
            // Fallback untuk data lama dengan products array
            displayProducts = this.createDisplayProductsFromRaw(order.products);
            totalQuantity = order.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
            uniqueSizes = this.extractUniqueSizesFromRaw(order.products);
            
        } else {
            // Standard order tanpa detailed breakdown
            displayProducts = [{
                name: order.jenis_order || order.code_kain || 'Standard Order',
                sku: order.code_kain || 'N/A',
                totalQty: 1,
                sizes: [{ size: 'Unknown', quantity: 1 }],
                type: 'Standard'
            }];
            totalQuantity = 1;
            uniqueSizes = ['Unknown'];
        }

        return {
            ...order,
            displayProducts,
            displayTotalQuantity: totalQuantity,
            displayUniqueSizes: uniqueSizes,
            productCount: displayProducts.length,
            sizeCount: uniqueSizes.length
        };
    }

    createDisplayProductsFromRaw(rawProducts) {
        const productMap = new Map();

        rawProducts.forEach(product => {
            const baseName = this.extractBaseProductName(product.product_name || product.base_name);
            const size = product.size || this.extractSizeFromProductName(product.product_name);
            
            if (!productMap.has(baseName)) {
                productMap.set(baseName, {
                    name: baseName,
                    sku: product.sku,
                    totalQty: 0,
                    sizes: [],
                    type: product.type || 'Unknown'
                });
            }

            const productGroup = productMap.get(baseName);
            productGroup.totalQty += product.quantity || 0;
            
            // Add size information
            const existingSize = productGroup.sizes.find(s => s.size === size);
            if (existingSize) {
                existingSize.quantity += product.quantity || 0;
            } else {
                productGroup.sizes.push({
                    size: size || 'Unknown',
                    quantity: product.quantity || 0
                });
            }
        });

        return Array.from(productMap.values()).map(product => ({
            ...product,
            sizes: product.sizes.sort((a, b) => this.sortSizes(a.size, b.size))
        }));
    }

    extractBaseProductName(productName) {
        if (!productName) return 'Unknown Product';
        
        return productName
            .replace(/\s*-\s*\(Size:\s*[^)]+\)/gi, '')
            .replace(/\s*\(Size:\s*[^)]+\)/gi, '')
            .replace(/\s*-\s*(XS|S|M|L|XL|2XL|3XL|4XL|5XL)\s*$/gi, '')
            .trim() || productName;
    }

    extractSizeFromProductName(productName) {
        if (!productName) return 'Unknown';
        
        const sizeMatch = productName.match(/\(Size:\s*([^)]+)\)|Size:\s*([A-Z0-9]+)|\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL)\b/i);
        return sizeMatch ? (sizeMatch[1] || sizeMatch[2] || sizeMatch[3]).trim() : 'Unknown';
    }

    extractUniqueSizesFromDisplay(displayProducts) {
        const sizes = new Set();
        displayProducts.forEach(product => {
            if (product.sizes && Array.isArray(product.sizes)) {
                product.