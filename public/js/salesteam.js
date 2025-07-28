// Import fungsi yang diperlukan dari Firestore SDK
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    if (window.db) {
        const db = window.db;
        
        // Borang Lead Handler
        const leadForm = document.getElementById('lead-form');
        const leadFeedback = document.getElementById('lead-feedback');

        // Real-time validation untuk Lead form
        const validateLeadNumbers = () => {
            const totalLeadInput = leadForm.total_lead;
            const coldInput = leadForm.cold;
            const warmInput = leadForm.warm;
            const hotInput = leadForm.hot;

            if (totalLeadInput.value && coldInput.value && warmInput.value && hotInput.value) {
                const totalLead = parseInt(totalLeadInput.value) || 0;
                const cold = parseInt(coldInput.value) || 0;
                const warm = parseInt(warmInput.value) || 0;
                const hot = parseInt(hotInput.value) || 0;
                const totalColdWarmHot = cold + warm + hot;

                if (totalColdWarmHot !== totalLead && totalLead > 0) {
                    leadFeedback.textContent = `Jumlah: Cold (${cold}) + Warm (${warm}) + Hot (${hot}) = ${totalColdWarmHot} ≠ Total Lead (${totalLead})`;
                    leadFeedback.className = 'text-yellow-400 text-sm';
                } else if (totalColdWarmHot === totalLead && totalLead > 0) {
                    leadFeedback.textContent = `✓ Jumlah betul: ${totalColdWarmHot} = Total Lead`;
                    leadFeedback.className = 'text-green-400 text-sm';
                } else {
                    leadFeedback.textContent = '';
                }
            }
        };

        // Add event listeners untuk real-time validation
        ['total_lead', 'cold', 'warm', 'hot'].forEach(fieldName => {
            leadForm[fieldName].addEventListener('input', validateLeadNumbers);
        });

        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const totalLead = parseInt(leadForm.total_lead.value);
            const cold = parseInt(leadForm.cold.value);
            const warm = parseInt(leadForm.warm.value);
            const hot = parseInt(leadForm.hot.value);
            
            // Validation: Check if Cold + Warm + Hot = Total Lead
            const totalColdWarmHot = cold + warm + hot;
            
            if (totalColdWarmHot !== totalLead) {
                leadFeedback.textContent = `Jumlah Cold (${cold}) + Warm (${warm}) + Hot (${hot}) = ${totalColdWarmHot} tidak sama dengan Total Lead (${totalLead}). Sila betulkan.`;
                leadFeedback.className = 'text-red-400';
                
                setTimeout(() => {
                    leadFeedback.textContent = '';
                }, 5000);
                return; // Stop form submission
            }

            leadFeedback.textContent = 'Menghantar data lead...';
            leadFeedback.className = 'text-blue-400';

            const leadData = {
                tarikh: leadForm.tarikh.value,
                masa: leadForm.masa.value,
                team: leadForm.team.value,
                total_lead: totalLead,
                cold: cold,
                warm: warm,
                hot: hot,
                type: 'lead',
                createdAt: serverTimestamp()
            };

            try {
                const docRef = await addDoc(collection(db, "salesTeamData"), leadData);
                console.log("Lead document written with ID: ", docRef.id);
                
                leadFeedback.textContent = 'Data lead berjaya dihantar!';
                leadFeedback.className = 'text-green-400';
                leadForm.reset();

            } catch (error) {
                console.error("Error adding lead document: ", error);
                leadFeedback.textContent = 'Gagal menghantar data lead. Sila cuba lagi.';
                leadFeedback.className = 'text-red-400';
            }

            setTimeout(() => {
                leadFeedback.textContent = '';
            }, 3000);
        });

        // Borang Power Metrics Handler
        const metricsForm = document.getElementById('metrics-form');
        const metricsFeedback = document.getElementById('metrics-feedback');

        metricsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            metricsFeedback.textContent = 'Menghantar power metrics...';
            metricsFeedback.className = 'text-blue-400';

            const metricsData = {
                tarikh: metricsForm.tarikh.value,
                team: metricsForm.team.value,
                total_lead_bulan: parseInt(metricsForm.total_lead_bulan.value),
                total_close_bulan: parseInt(metricsForm.total_close_bulan.value),
                total_sale_bulan: parseFloat(metricsForm.total_sale_bulan.value),
                type: 'power_metrics',
                createdAt: serverTimestamp()
            };

            try {
                const docRef = await addDoc(collection(db, "salesTeamData"), metricsData);
                console.log("Metrics document written with ID: ", docRef.id);
                
                metricsFeedback.textContent = 'Power metrics berjaya dihantar!';
                metricsFeedback.className = 'text-green-400';
                metricsForm.reset();

            } catch (error) {
                console.error("Error adding metrics document: ", error);
                metricsFeedback.textContent = 'Gagal menghantar power metrics. Sila cuba lagi.';
                metricsFeedback.className = 'text-red-400';
            }

            setTimeout(() => {
                metricsFeedback.textContent = '';
            }, 3000);
        });

    } else {
        console.error("Firestore 'db' instance not found.");
    }
});