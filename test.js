import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables for charts to prevent re-creation
let salesChartInstance = null;
let leadsChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Tunggu sehingga 'db' sedia
    const dbReadyInterval = setInterval(() => {
        if (window.db) {
            clearInterval(dbReadyInterval);
            fetchAndDisplayData();
        }
    }, 100);
});

async function fetchAndDisplayData() {
    const db = window.db;
    if (!db) {
        console.error("Firestore is not initialized.");
        return;
    }

    try {
        // 1. Fetch data from all collections concurrently
        const ecomQuery = query(collection(db, "ecommerceData"), orderBy("createdAt", "desc"));
        const marketQuery = query(collection(db, "marketingData"), orderBy("createdAt", "desc"));
        const salesTeamQuery = query(collection(db, "salesTeamData"), orderBy("createdAt", "desc"));

        const [ecomSnapshot, marketSnapshot, salesTeamSnapshot] = await Promise.all([
            getDocs(ecomQuery),
            getDocs(marketQuery),
            getDocs(salesTeamQuery)
        ]);

        // 2. Process data
        const ecomData = ecomSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const marketData = marketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const salesTeamData = salesTeamSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. Calculate and display KPIs
        calculateAndDisplayKPIs(ecomData, marketData, salesTeamData);

        // 4. Populate data table
        populateTable(ecomData, marketData, salesTeamData);

        // 5. Create or update charts
        createOrUpdateCharts(ecomData, salesTeamData);

    } catch (error) {
        console.error("Error fetching data: ", error);
        document.getElementById('data-table-body').innerHTML = `<tr><td colspan="6" class="text-center p-8 text-red-500">Gagal memuatkan data. Rujuk konsol untuk ralat.</td></tr>`;
    }
}

function calculateAndDisplayKPIs(ecomData, marketData, salesTeamData) {
    // Calculate Total Sales
    const ecomSales = ecomData.reduce((sum, item) => sum + (item.sales || 0), 0);
    const teamSales = salesTeamData.reduce((sum, item) => sum + (item.sales || 0), 0);
    const totalSales = ecomSales + teamSales;
    document.getElementById('total-sales').textContent = `RM ${totalSales.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Calculate Average ROAS
    if (marketData.length > 0) {
        const totalRoas = marketData.reduce((sum, item) => sum + (item.roas || 0), 0);
        const avgRoas = totalRoas / marketData.length;
        document.getElementById('avg-roas').textContent = `${avgRoas.toFixed(2)}x`;
    } else {
        document.getElementById('avg-roas').textContent = 'N/A';
    }

    // Calculate Leads per Agent
    if (salesTeamData.length > 0) {
        const totalLeads = salesTeamData.reduce((sum, item) => sum + (item.leads || 0), 0);
        const uniqueAgents = new Set(salesTeamData.map(item => item.agent)).size;
        const leadsPerAgent = uniqueAgents > 0 ? totalLeads / uniqueAgents : 0;
        document.getElementById('leads-per-agent').textContent = `${leadsPerAgent.toFixed(1)}`;
    } else {
        document.getElementById('leads-per-agent').textContent = 'N/A';
    }
}

function populateTable(ecomData, marketData, salesTeamData) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Clear existing data

   /*  if (ecomData.length === 0 && marketData.length === 0 && salesTeamData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-gray-500">Tiada data untuk dipaparkan.</td></tr>`;
        return;
    } */
   // Guna untuk tambah kan collum di dashboard
   if (ecomData.length === 0 && marketData.length === 0 && salesTeamData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-gray-500">Tiada data untuk dipaparkan.</td></tr>`;
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
             cells += `<td class="p-3">Warm: ${item.warm}</td>`; // FIXED: Added Warm
            cells += `<td class="p-3">Cold: ${item.cold}</td>`; // FIXED: Added Cold
        }
        
        row.innerHTML = cells;
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
        options: { scales: { y: { beginAtZero: true, ticks: { color: '#9CA3AF' } }, x: { ticks: { color: '#9CA3AF' } } }, plugins: { legend: { labels: { color: '#D1D5DB' } } } }
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
        options: { plugins: { legend: { position: 'top', labels: { color: '#D1D5DB' } } } }
    });
}
