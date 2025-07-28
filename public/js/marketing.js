// Import fungsi yang diperlukan dari Firestore SDK
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    if (window.db) {
        const db = window.db;
        
        // Borang Lead Semasa Handler
        const leadSemasaForm = document.getElementById('lead-semasa-form');
        const leadFeedback = document.getElementById('lead-feedback');

        leadSemasaForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            leadFeedback.textContent = 'Menghantar data lead semasa...';
            leadFeedback.className = 'text-blue-400';

            const leadSemasaData = {
                tarikh: leadSemasaForm.tarikh.value,
                masa: leadSemasaForm.masa.value,
                spend: parseFloat(leadSemasaForm.spend.value),
                team_sale: leadSemasaForm.team_sale.value,
                type: 'lead_semasa',
                createdAt: serverTimestamp()
            };

            try {
                const docRef = await addDoc(collection(db, "marketingData"), leadSemasaData);
                console.log("Lead Semasa document written with ID: ", docRef.id);
                
                leadFeedback.textContent = 'Data lead semasa berjaya dihantar!';
                leadFeedback.className = 'text-green-400';
                leadSemasaForm.reset();

            } catch (error) {
                console.error("Error adding lead semasa document: ", error);
                leadFeedback.textContent = 'Gagal menghantar data lead semasa. Sila cuba lagi.';
                leadFeedback.className = 'text-red-400';
            }

            setTimeout(() => {
                leadFeedback.textContent = '';
            }, 3000);
        });

        // Borang Detail Ads Handler
        const detailAdsForm = document.getElementById('detail-ads-form');
        const adsFeedback = document.getElementById('ads-feedback');

        detailAdsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            adsFeedback.textContent = 'Menghantar detail ads...';
            adsFeedback.className = 'text-blue-400';

            const detailAdsData = {
                tarikh: detailAdsForm.tarikh.value,
                team_sale: detailAdsForm.team_sale.value,
                campaign_name: detailAdsForm.campaign_name.value,
                ads_setname: detailAdsForm.ads_setname.value,
                audience: detailAdsForm.audience.value,
                jenis_video: detailAdsForm.jenis_video.value,
                cta_video: detailAdsForm.cta_video.value,
                jenis_kain: detailAdsForm.jenis_kain.value,
                impressions: parseInt(detailAdsForm.impressions.value),
                link_click: parseInt(detailAdsForm.link_click.value),
                unique_link_click: parseInt(detailAdsForm.unique_link_click.value),
                reach: parseInt(detailAdsForm.reach.value),
                frequency: parseFloat(detailAdsForm.frequency.value),
                ctr: parseFloat(detailAdsForm.ctr.value),
                cpc: parseFloat(detailAdsForm.cpc.value),
                cpm: parseFloat(detailAdsForm.cpm.value),
                cost: parseFloat(detailAdsForm.cost.value),
                lead_dari_team_sale: parseInt(detailAdsForm.lead_dari_team_sale.value),
                amount_spent: parseFloat(detailAdsForm.amount_spent.value),
                type: 'detail_ads',
                createdAt: serverTimestamp()
            };

            try {
                const docRef = await addDoc(collection(db, "marketingData"), detailAdsData);
                console.log("Detail Ads document written with ID: ", docRef.id);
                
                adsFeedback.textContent = 'Detail ads berjaya dihantar!';
                adsFeedback.className = 'text-green-400';
                detailAdsForm.reset();

            } catch (error) {
                console.error("Error adding detail ads document: ", error);
                adsFeedback.textContent = 'Gagal menghantar detail ads. Sila cuba lagi.';
                adsFeedback.className = 'text-red-400';
            }

            setTimeout(() => {
                adsFeedback.textContent = '';
            }, 3000);
        });

    } else {
        console.error("Firestore 'db' instance not found.");
    }
});