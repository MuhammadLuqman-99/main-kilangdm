import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables for charts to prevent re-creation
let salesChartInstance = null;
let leadsChartInstance = null;

// Global variables for data storage
let allEcomData = [];
let allMarketData = [];
let allSalesTeamData = [];

// Filter state
let currentFilters = {
    startDate: null,
    endDate: null,
    agent: null
};

document.addEventListener('DOMContentLoaded', () => {
    // Tunggu sehingga 'db' sedia
    const dbReadyInterval = setInterval(() => {
        if (window.db) {
            clearInterval(dbReadyInterval);
            initializeFilters();
            fetchAndDisplayData();
        }
    }, 100);
});

function initializeFilters() {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('start-date').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];

    // Event listeners for filter controls
    document.getElementById('apply-filter').addEventListener('click', applyFilters);
    document.getElementById('clear-filter').addEventListener('click', clearFilters);
    
    // Auto-apply filter on date/agent change
    document.getElementById('start-date').addEventListener('change', applyFilters);
    document.getElementById('end-date').addEventListener('change', applyFilters);
    document.getElementById('agent-filter').addEventListener('change', applyFilters);
}

async function fetchAndDisplayData() {
    const db = window.db;
    if (!db) {
        console.error("Firestore is not initialized.");
        return;
    }

    try {
        // Show loading state
        showLoadingState();

        // 1. Fetch data from all collections concurrently
        const ecomQuery = query(collection(db, "ecommerceData"), orderBy("createdAt", "desc"));
        const marketQuery = query(collection(db, "marketingData"), orderBy("createdAt", "desc"));
        const salesTeamQuery = query(collection(db, "salesTeamData"), orderBy("createdAt", "desc"));

        const [ecomSnapshot, marketSnapshot, salesTeamSnapshot] = await Promise.all([
            getDocs(ecomQuery),
            getDocs(marketQuery),
            getDocs(salesTeamQuery)
        ]);

        // 2. Process and store all data globally
        allEcomData = ecomSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allMarketData = marketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allSalesTeamData = salesTeamSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. Populate agent filter dropdown
        populateAgentFilter();

        // 4. Apply initial filters and display data
        applyFilters();

    } catch (error) {
        console.error("Error fetching data: ", error);
        showErrorState();
    }
}

function populateAgentFilter() {
    const agentSelect = document.getElementById('agent-filter');
    const agents = [...new Set(allSalesTeamData.map(item => item.agent))].sort();
    
    // Clear existing options except "Semua Agent"
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
    currentFilters = {
        startDate: startDate,
        endDate: endDate,
        agent: selectedAgent
    };

    // Filter data based on current filters
    const filteredEcomData = filterData(allEcomData, startDate, endDate);
    const filteredMarketData = filterData(allMarketData, startDate, endDate);
    const filteredSalesTeamData = filterSalesTeamData(allSalesTeamData, startDate, endDate, selectedAgent);

    // Update displays
    updateActiveFiltersDisplay();
    calculateAndDisplayKPIs(filteredEcomData, filteredMarketData, filteredSalesTeamData);
    populateAllDataTable(filteredEcomData, filteredMarketData, filteredSalesTeamData);
    populateEcommerceTable(filteredEcomData);
    populateMarketingTable(filteredMarketData);
    populateSalesTeamTable(filteredSalesTeamData);
    createOrUpdateCharts(filteredEcomData, filteredSalesTeamData);
}

function filterData(data, startDate, endDate) {
    return data.filter(item => {
        const itemDate = new Date(item.tarikh);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        
        return true;
    });
}

function filterSalesTeamData(data, startDate, endDate, agent) {
    return data.filter(item => {
        const itemDate = new Date(item.tarikh);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        // Date filter
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        
        // Agent filter
        if (agent && item.agent !== agent) return false;
        
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
        agent: null
    };
    
    // Display all data
    calculateAndDisplayKPIs(allEcomData, allMarketData, allSalesTeamData);
    populateAllDataTable(allEcomData, allMarketData, allSalesTeamData);
    populateEcommerceTable(allEcomData);
    populateMarketingTable(allMarketData);
    populateSalesTeamTable(allSalesTeamData);
    createOrUpdateCharts(allEcomData, allSalesTeamData);
    updateActiveFiltersDisplay();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY');
}

function showLoadingState() {
    const loadingMessage = '<tr><td colspan="8" class="text-center p-8 text-blue-500">Memuatkan data...</td></tr>';
    document.getElementById('data-table-body').innerHTML = loadingMessage;
    document.getElementById('ecommerce-table-body').innerHTML = '<tr><td colspan="5" class="text-center p-8 text-blue-500">Memuatkan data eCommerce...</td></tr>';
    document.getElementById('marketing-table-body').innerHTML = '<tr><td colspan="5" class="text-center p-8 text-blue-500">Memuatkan data Marketing...</td></tr>';
    document.getElementById('salesteam-table-body').innerHTML = '<tr><td colspan="7" class="text-center p-8 text-blue-500">Memuatkan data Sales Team...</td></tr>';
}

function showErrorState() {
    const errorMessage = '<tr><td colspan="8" class="text-center p-8 text-red-500">Gagal memuatkan data. Rujuk konsol untuk ralat.</td></tr>';
    document.getElementById('data-table-body').innerHTML = errorMessage;
    document.getElementById('ecommerce-table-body').innerHTML = '<tr><td colspan="5" class="text-center p-8 text-red-500">Gagal memuatkan data eCommerce.</td></tr>';
    document.getElementById('marketing-table-body').innerHTML = '<tr><td colspan="5" class="text-center p-8 text-red-500">Gagal memuatkan data Marketing.</td></tr>';
    document.getElementById('salesteam-table-body').innerHTML = '<tr><td colspan="7" class="text-center p-8 text-red-500">Gagal memuatkan data Sales Team.</td></tr>';
}

function calculateAndDisplayKPIs(ecomData, marketData, salesTeamData) {
    // Calculate Total Sales
    const ecomSales = ecomData.reduce((sum, item) => sum + (item.sales || 0), 0);
    const teamSales = salesTeamData.reduce((sum, item) => sum + (item.sales || 0), 0);
    const totalSales = ecomSales + teamSales;
    const totalEntries = ecomData.length + salesTeamData.length;
    
    document.getElementById('total-sales').textContent = `RM ${totalSales.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('total-sales-count').textContent = `${totalEntries} entri`;

    // Calculate Average ROAS
    if (marketData.length > 0) {
        const totalRoas = marketData.reduce((sum, item) => sum + (item.roas || 0), 0);
        const avgRoas = totalRoas / marketData.length;
        document.getElementById('avg-roas').textContent = `${avgRoas.toFixed(2)}x`;
        document.getElementById('avg-roas-count').textContent = `${marketData.length} entri`;
    } else {
        document.getElementById('avg-roas').textContent = 'N/A';
        document.getElementById('avg-roas-count').textContent = '0 entri';
    }

    // Calculate Leads per Agent
    if (salesTeamData.length > 0) {
        const totalLeads = salesTeamData.reduce((sum, item) => sum + (item.leads || 0), 0);
        const uniqueAgents = new Set(salesTeamData.map(item => item.agent)).size;
        const leadsPerAgent = uniqueAgents > 0 ? totalLeads / uniqueAgents : 0;
        document.getElementById('leads-per-agent').textContent = `${leadsPerAgent.toFixed(1)}`;
        document.getElementById('leads-per-agent-count').textContent = `${uniqueAgents} agent`;
    } else {
        document.getElementById('leads-per-agent').textContent = 'N/A';
        document.getElementById('leads-per-agent-count').textContent = '0 agent';
    }
}

// Function untuk table gabungan (yang asal)
function populateAllDataTable(ecomData, marketData, salesTeamData) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Clear existing data

    const totalCount = ecomData.length + marketData.length + salesTeamData.length;
    document.getElementById('all-data-count').textContent = `${totalCount} entri`;

    if (totalCount === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-gray-500">Tiada data untuk dipaparkan dengan filter yang dipilih.</td></tr>`;
        return;
    }

    // Combine and sort all data by date for display
    const allData = [
        ...ecomData.map(d => ({ ...d, type: 'eCommerce' })),
        ...marketData.map(d => ({ ...d, type: 'Marketing' })),
        ...salesTeamData.map(d => ({ ...d, type: 'Sales Team' }))
    ].sort((a, b) => new Date(b.tarikh) - new Date(a.tarikh));

    allData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-700';
        
        let cells = `<td class="p-3">${item.tarikh}</td>`;
        
        if (item.type === 'eCommerce') {
            cells += `<td class="p-3"><span class="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">eCommerce</span></td>`;
            cells += `<td class="p-3">Sales: RM ${item.sales.toFixed(2)}</td>`;
            cells += `<td class="p-3">Orders: ${item.order}</td>`;
            cells += `<td class="p-3">AOV: RM ${item.avg_order.toFixed(2)}</td>`;
            cells += `<td class="p-3">Channel: ${item.channel}</td>`;
            cells += `<td class="p-3">-</td>`; // Empty for Metrik 5
            cells += `<td class="p-3">-</td>`; // Empty for Metrik 6
        } else if (item.type === 'Marketing') {
            cells += `<td class="p-3"><span class="bg-purple-500 text-white px-2 py-1 rounded-full text-xs">Marketing</span></td>`;
            cells += `<td class="p-3">Spend: RM ${item.spend.toFixed(2)}</td>`;
            cells += `<td class="p-3">ROAS: ${item.roas}x</td>`;
            cells += `<td class="p-3">Impressions: ${item.impressions.toLocaleString()}</td>`;
            cells += `<td class="p-3">-</td>`; // Empty for Metrik 4
            cells += `<td class="p-3">-</td>`; // Empty for Metrik 5
            cells += `<td class="p-3">-</td>`; // Empty for Metrik 6
        } else if (item.type === 'Sales Team') {
            cells += `<td class="p-3"><span class="bg-green-500 text-white px-2 py-1 rounded-full text-xs">Sales Team</span></td>`;
            cells += `<td class="p-3">Agent: ${item.agent}</td>`;
            cells += `<td class="p-3">Leads: ${item.leads}</td>`;
            cells += `<td class="p-3">Close Rate: ${item.close_rate}%</td>`;
            cells += `<td class="p-3">Sales: RM ${item.sales.toFixed(2)}</td>`;
            cells += `<td class="p-3">Warm: RM ${(item.warm || 0).toFixed(2)}</td>`;
            cells += `<td class="p-3">Cold: RM ${(item.cold || 0).toFixed(2)}</td>`;
        }
        
        row.innerHTML = cells;
        tableBody.appendChild(row);
    });
}

// Function untuk table eCommerce sahaja
function populateEcommerceTable(ecomData) {
    const tableBody = document.getElementById('ecommerce-table-body');
    tableBody.innerHTML = ''; // Clear existing data

    document.getElementById('ecommerce-data-count').textContent = `${ecomData.length} entri`;

    if (ecomData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-500">Tiada data eCommerce untuk dipaparkan dengan filter yang dipilih.</td></tr>`;
        return;
    }

    // Sort by date (latest first)
    const sortedData = ecomData.sort((a, b) => new Date(b.tarikh) - new Date(a.tarikh));

    sortedData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-blue-900/20';
        
        row.innerHTML = `
            <td class="p-3">${item.tarikh}</td>
            <td class="p-3">RM ${item.sales.toFixed(2)}</td>
            <td class="p-3">${item.order}</td>
            <td class="p-3">RM ${item.avg_order.toFixed(2)}</td>
            <td class="p-3">${item.channel}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Function untuk table Marketing sahaja
function populateMarketingTable(marketData) {
    const tableBody = document.getElementById('marketing-table-body');
    tableBody.innerHTML = ''; // Clear existing data

    document.getElementById('marketing-data-count').textContent = `${marketData.length} entri`;

    if (marketData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-500">Tiada data Marketing untuk dipaparkan dengan filter yang dipilih.</td></tr>`;
        return;
    }

    // Sort by date (latest first)
    const sortedData = marketData.sort((a, b) => new Date(b.tarikh) - new Date(a.tarikh));

    sortedData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-purple-900/20';
        
        row.innerHTML = `
            <td class="p-3">${item.tarikh}</td>
            <td class="p-3">RM ${item.spend.toFixed(2)}</td>
            <td class="p-3">${item.roas}x</td>
            <td class="p-3">${item.impressions.toLocaleString()}</td>
            <td class="p-3">${item.clicks ? item.clicks.toLocaleString() : 'N/A'}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Function untuk table Sales Team sahaja
function populateSalesTeamTable(salesTeamData) {
    const tableBody = document.getElementById('salesteam-table-body');
    tableBody.innerHTML = ''; // Clear existing data

    document.getElementById('salesteam-data-count').textContent = `${salesTeamData.length} entri`;

    if (salesTeamData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-8 text-gray-500">Tiada data Sales Team untuk dipaparkan dengan filter yang dipilih.</td></tr>`;
        return;
    }

    // Sort by date (latest first)
    const sortedData = salesTeamData.sort((a, b) => new Date(b.tarikh) - new Date(a.tarikh));

    sortedData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-green-900/20';
        
        row.innerHTML = `
            <td class="p-3">${item.tarikh}</td>
            <td class="p-3">${item.agent}</td>
            <td class="p-3">${item.leads}</td>
            <td class="p-3">${item.close_rate}%</td>
            <td class="p-3">RM ${item.sales.toFixed(2)}</td>
            <td class="p-3">RM ${(item.warm || 0).toFixed(2)}</td>
            <td class="p-3">RM ${(item.cold || 0).toFixed(2)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function createOrUpdateCharts(ecomData, salesTeamData) {
    // Sales Bar Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    const salesByDate = {};
    [...ecomData, ...salesTeamData].forEach(item => {
        if (!salesByDate[item.tarikh]) {
            salesByDate[item.tarikh] = { ecom: 0, team: 0 };
        }
        if (item.channel) { // eCommerce data
            salesByDate[item.tarikh].ecom += item.sales;
        } else { // Sales Team data
            salesByDate[item.tarikh].team += item.sales;
        }
    });

    const sortedDates = Object.keys(salesByDate).sort((a, b) => new Date(a) - new Date(b));
    
    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(salesCtx, {
        type: 'bar',
        data: {
            labels: sortedDates,
            datasets: [
                {
                    label: 'eCommerce Sales',
                    data: sortedDates.map(date => salesByDate[date].ecom),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Sales Team Sales',
                    data: sortedDates.map(date => salesByDate[date].team),
                    backgroundColor: 'rgba(34, 197, 94, 0.7)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: { 
            responsive: true,
            scales: { 
                y: { 
                    beginAtZero: true, 
                    ticks: { color: '#9CA3AF' } 
                }, 
                x: { 
                    ticks: { color: '#9CA3AF' } 
                } 
            }, 
            plugins: { 
                legend: { 
                    labels: { color: '#D1D5DB' } 
                },
                title: {
                    display: true,
                    text: currentFilters.startDate || currentFilters.endDate || currentFilters.agent ? 
                          'Graf Jualan (Filtered)' : 'Graf Jualan (Semua Data)',
                    color: '#D1D5DB'
                }
            } 
        }
    });

    // Leads Pie Chart
    const leadsCtx = document.getElementById('leadsChart').getContext('2d');
    const leadsByAgent = salesTeamData.reduce((acc, item) => {
        acc[item.agent] = (acc[item.agent] || 0) + item.leads;
        return acc;
    }, {});

    if (leadsChartInstance) leadsChartInstance.destroy();
    leadsChartInstance = new Chart(leadsCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(leadsByAgent),
            datasets: [{
                label: 'Total Leads',
                data: Object.values(leadsByAgent),
                backgroundColor: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1'],
                hoverOffset: 4
            }]
        },
        options: { 
            responsive: true,
            plugins: { 
                legend: { 
                    position: 'top', 
                    labels: { color: '#D1D5DB' } 
                },
                title: {
                    display: true,
                    text: currentFilters.agent ? 
                          `Leads untuk ${currentFilters.agent}` : 
                          (currentFilters.startDate || currentFilters.endDate ? 
                           'Agihan Leads (Filtered)' : 'Agihan Leads (Semua Data)'),
                    color: '#D1D5DB'
                }
            } 
        }
    });
}