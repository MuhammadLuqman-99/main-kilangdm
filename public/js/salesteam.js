// Import fungsi yang diperlukan dari Firestore SDK
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    if (window.db) {
        const db = window.db;
        const form = document.getElementById('salesteam-form');
        const feedbackMessage = document.getElementById('feedback-message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            feedbackMessage.textContent = 'Menghantar data...';
            feedbackMessage.className = 'text-blue-400';

            const formData = {
                tarikh: form.tarikh.value,
                agent: form.agent.value,
                leads: parseInt(form.leads.value),
                close_rate: parseFloat(form.close_rate.value),
                sales: parseFloat(form.sales.value),
                warm: parseFloat(form.warm.value),
                cold: parseFloat(form.cold.value),
                createdAt: serverTimestamp()
            };

            try {
                const docRef = await addDoc(collection(db, "salesTeamData"), formData);
                console.log("Document written with ID: ", docRef.id);
                
                feedbackMessage.textContent = 'Data berjaya dihantar!';
                feedbackMessage.className = 'text-green-400';
                form.reset();

            } catch (error) {
                console.error("Error adding document: ", error);
                feedbackMessage.textContent = 'Gagal menghantar data. Sila cuba lagi.';
                feedbackMessage.className = 'text-red-400';
            }

            setTimeout(() => {
                feedbackMessage.textContent = '';
            }, 3000);
        });
    } else {
        console.error("Firestore 'db' instance not found.");
    }
});
