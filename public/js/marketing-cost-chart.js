import { collection, getDocs, query, orderBy, where, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// GANTIKAN FUNGSI INI DALAM marketing-cost-chart.js

export async function createMarketingCostChart() {
    const ctx = document.getElementById('costPerLeadChart');
    if (!ctx) return;

    try {
        // Gabungkan data dari kedua-dua query
        const marketingQuery = query(
            collection(window.db, "marketingData"),
            where("type", "==", "lead_semasa"),
            orderBy("createdAt", "desc"),
            limit(50) // Ambil lebih banyak data untuk memastikan ada padanan
        );
        
        const salesQuery = query(
            collection(window.db, "salesTeamData"),
            where("type", "==", "lead"),
            orderBy("createdAt", "desc"),
            limit(50) // Ambil lebih banyak data untuk memastikan ada padanan
        );

        const [marketingSnapshot, salesSnapshot] = await Promise.all([
            getDocs(marketingQuery),
            getDocs(salesQuery)
        ]);

        // Struktur untuk menggabungkan data
        const combinedData = {};

        // 1. Proses data perbelanjaan (marketing spend)
        marketingSnapshot.forEach((doc) => {
            const data = doc.data();
            const key = `${data.tarikh}_${data.team_sale}`;
            
            if (!combinedData[key]) {
                combinedData[key] = {
                    date: data.tarikh,
                    team: data.team_sale,
                    totalSpend: 0,
                    totalLeads: 0
                };
            }
            combinedData[key].totalSpend += (parseFloat(data.spend) || 0);
        });

        // 2. Proses data leads dari sales team
        salesSnapshot.forEach((doc) => {
            const data = doc.data();
            const key = `${data.tarikh}_${data.team}`;

            if (!combinedData[key]) {
                combinedData[key] = {
                    date: data.tarikh,
                    team: data.team,
                    totalSpend: 0,
                    totalLeads: 0
                };
            }
            combinedData[key].totalLeads += (parseInt(data.total_lead) || 0);
        });

        // 3. Kira Cost Per Lead dan tapis data yang relevan
        const analysisArray = Object.values(combinedData)
            .filter(item => item.totalSpend > 0 && item.totalLeads > 0) // Hanya ambil jika ada spend DAN leads
            .map(item => ({
                ...item,
                costPerLead: item.totalSpend / item.totalLeads
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-14); // Tunjuk 14 entri terakhir yang sah

        // Semak jika ada data untuk dipaparkan
        if (analysisArray.length === 0) {
            console.warn('Tiada data yang sepadan ditemui untuk carta Cost Per Lead.');
            const chartContainer = ctx.getContext('2d');
            chartContainer.clearRect(0, 0, ctx.width, ctx.height);
            chartContainer.fillStyle = '#9CA3AF';
            chartContainer.font = '16px Inter';
            chartContainer.textAlign = 'center';
            chartContainer.fillText(
                'Tiada data perbelanjaan dan leads yang sepadan.',
                ctx.width / 2,
                ctx.height / 2
            );
            updateCostAnalysisSummary([]); // Kosongkan summary
            return;
        }

        // Sediakan data untuk chart
        const labels = analysisArray.map(item => {
            const date = new Date(item.date);
            return `${date.getDate()}/${date.getMonth() + 1} - ${item.team}`;
        });
        
        const costPerLeadData = analysisArray.map(item => item.costPerLead.toFixed(2));
        const totalSpendData = analysisArray.map(item => item.totalSpend);
        const totalLeadsData = analysisArray.map(item => item.totalLeads);

        // Musnahkan chart lama jika ada
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        // Lukis chart baru
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cost per Lead (RM)',
                        data: costPerLeadData,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Total Spend (RM)',
                        data: totalSpendData,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1',
                        hidden: true // Sembunyikan secara lalai untuk chart lebih kemas
                    },
                    {
                        label: 'Total Leads',
                        data: totalLeadsData,
                        type: 'bar',
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: '#22C55E',
                        borderWidth: 1,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Analisis Kos Per Lead (Spend vs Leads)',
                        font: { size: 16, weight: '600' },
                        color: '#F9FAFB',
                        padding: { top: 10, bottom: 20 }
                    },
                    legend: {
                        labels: { 
                            color: '#D1D5DB',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        // Opsyen tooltip anda sebelum ini adalah baik, jadi ia dikekalkan
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#9CA3AF', maxRotation: 45, minRotation: 0 },
                        grid: { color: 'rgba(75, 85, 99, 0.3)' }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Cost per Lead (RM)', color: '#3B82F6' },
                        ticks: { color: '#3B82F6', callback: value => 'RM ' + value.toFixed(0) },
                        grid: { color: 'rgba(59, 130, 246, 0.2)' }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: 'Total Spend (RM)', color: '#EF4444' },
                        ticks: { color: '#EF4444', callback: value => 'RM ' + value.toFixed(0) },
                        grid: { drawOnChartArea: false },
                    },
                    y2: {
                        type: 'linear',
                        display: false, // Tidak perlu tunjuk paksi untuk bar
                    }
                }
            }
        });

        updateCostAnalysisSummary(analysisArray);

    } catch (error) {
        console.error('Error creating marketing cost chart:', error);
        const chartContainer = ctx.getContext('2d');
        chartContainer.fillText('Gagal memuatkan data carta kos.', ctx.width / 2, ctx.height / 2);
    }
}