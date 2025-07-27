// Import fungsi yang diperlukan dari Firestore SDK
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    if (window.db) {
        const db = window.db;
        const form = document.getElementById('followup-form');
        const feedbackMessage = document.getElementById('feedback-message');

        // Set tarikh hari ini sebagai default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('tarikh').value = today;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Tunjukkan mesej loading
            feedbackMessage.textContent = 'Menghantar data follow-up...';
            feedbackMessage.className = 'text-blue-400';

            // Kumpul data dari form
            const formData = {
                tarikh: form.tarikh.value,
                agent: form.agent.value.trim(),
                jenis_followup: form.jenis_followup.value.trim(),
                aktiviti_followup: form.aktiviti_followup.value.trim(),
                bilangan_customer: parseInt(form.bilangan_customer.value),
                status_followup: form.status_followup.value,
                catatan: form.catatan.value.trim() || null, // Optional field
                createdAt: serverTimestamp()
            };

            try {
                // Hantar data ke Firestore
                const docRef = await addDoc(collection(db, "salesFollowUpData"), formData);
                console.log("Follow-up document written with ID: ", docRef.id);
                
                // Tunjukkan mesej berjaya
                feedbackMessage.textContent = 'Data follow-up berjaya dihantar!';
                feedbackMessage.className = 'text-green-400';
                
                // Reset form
                form.reset();
                
                // Set tarikh hari ini lagi selepas reset
                document.getElementById('tarikh').value = today;

            } catch (error) {
                console.error("Error adding follow-up document: ", error);
                
                // Tunjukkan mesej ralat
                feedbackMessage.textContent = 'Gagal menghantar data follow-up. Sila cuba lagi.';
                feedbackMessage.className = 'text-red-400';
            }

            // Hilangkan mesej selepas 5 saat
            setTimeout(() => {
                feedbackMessage.textContent = '';
                feedbackMessage.className = '';
            }, 5000);
        });

        // Validasi real-time untuk bilangan customer
        const bilanganCustomerInput = document.getElementById('bilangan_customer');
        bilanganCustomerInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value < 1) {
                e.target.setCustomValidity('Bilangan customer mestilah sekurang-kurangnya 1');
            } else {
                e.target.setCustomValidity('');
            }
        });

        // Auto-resize untuk textarea
        const textareas = document.querySelectorAll('.form-textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
        });

    } else {
        console.error("Firestore 'db' instance not found.");
        
        // Tunjukkan mesej ralat jika Firebase tidak loaded
        const feedbackMessage = document.getElementById('feedback-message');
        feedbackMessage.textContent = 'Ralat: Database tidak tersambung. Sila refresh halaman.';
        feedbackMessage.className = 'text-red-400';
    }
});