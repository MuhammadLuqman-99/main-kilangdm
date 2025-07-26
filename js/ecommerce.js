// Import fungsi yang diperlukan dari Firestore SDK
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // Pastikan 'db' dari skrip inline di HTML sudah sedia
    if (window.db) {
        const db = window.db;
        const form = document.getElementById('ecommerce-form');
        const feedbackMessage = document.getElementById('feedback-message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Tunjukkan mesej 'loading'
            feedbackMessage.textContent = 'Menghantar data...';
            feedbackMessage.className = 'text-blue-400';

            // Dapatkan data dari borang
            const formData = {
                tarikh: form.tarikh.value,
                sales: parseFloat(form.sales.value),
                order: parseInt(form.order.value),
                avg_order: parseFloat(form.avg_order.value),
                channel: form.channel.value,
                createdAt: serverTimestamp() // Tambah timestamp untuk susunan
            };

            try {
                // Hantar data ke koleksi 'ecommerceData' di Firestore
                const docRef = await addDoc(collection(db, "ecommerceData"), formData);
                console.log("Document written with ID: ", docRef.id);
                
                // Beri maklum balas positif
                feedbackMessage.textContent = 'Data berjaya dihantar!';
                feedbackMessage.className = 'text-green-400';
                form.reset();

            } catch (error) {
                console.error("Error adding document: ", error);
                // Beri maklum balas negatif
                feedbackMessage.textContent = 'Gagal menghantar data. Sila cuba lagi.';
                feedbackMessage.className = 'text-red-400';
            }

            // Hilangkan mesej selepas 3 saat
            setTimeout(() => {
                feedbackMessage.textContent = '';
            }, 3000);
        });
    } else {
        console.error("Firestore 'db' instance not found. Make sure Firebase is initialized correctly in your HTML.");
    }
});
