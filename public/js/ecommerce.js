// Import fungsi yang diperlukan dari Firestore SDK
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    if (window.db) {
        const db = window.db;
        const form = document.getElementById('order-form');
        const feedbackMessage = document.getElementById('feedback-message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            feedbackMessage.textContent = 'Menghantar data order...';
            feedbackMessage.className = 'text-blue-400';

            const orderData = {
                tarikh: form.tarikh.value,
                code_kain: form.code_kain.value,
                nombor_po_invoice: form.nombor_po_invoice.value,
                nama_customer: form.nama_customer.value,
                team_sale: form.team_sale.value,
                nombor_phone: form.nombor_phone.value,
                jenis_order: form.jenis_order.value,
                total_rm: parseFloat(form.total_rm.value),
                platform: form.platform.value,
                createdAt: serverTimestamp()
            };

            try {
                const docRef = await addDoc(collection(db, "orderData"), orderData);
                console.log("Order document written with ID: ", docRef.id);
                
                feedbackMessage.textContent = 'Data order berjaya dihantar!';
                feedbackMessage.className = 'text-green-400';
                form.reset();

            } catch (error) {
                console.error("Error adding order document: ", error);
                feedbackMessage.textContent = 'Gagal menghantar data order. Sila cuba lagi.';
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