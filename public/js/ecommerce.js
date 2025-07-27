// ecommerce.js
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const checkDbReady = setInterval(() => {
    if (window.db) {
      clearInterval(checkDbReady); // hentikan loop
      initFormSubmission(window.db); // jalan fungsi utama
    }
  }, 100);
});

function initFormSubmission(db) {
  const form = document.getElementById('ecommerce-form');
  const feedbackMessage = document.getElementById('feedback-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    feedbackMessage.textContent = 'Menghantar data...';
    feedbackMessage.className = 'mt-4 text-center text-blue-400';

    const formData = {
      tarikh: form.tarikh.value,
      nama_team_sale: form.nama_team_sale.value,
      sales: parseFloat(form.sales.value),
      order: parseInt(form.order.value),
      avg_order: parseFloat(form.avg_order.value),
      channel: form.channel.value,
      userId: window.userId || "unknown",
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, "ecommerceData"), formData);
      console.log("Document written with ID:", docRef.id);
      feedbackMessage.textContent = 'Data berjaya dihantar!';
      feedbackMessage.className = 'mt-4 text-center text-green-400';
      form.reset();
    } catch (error) {
      console.error("Error adding document:", error);
      feedbackMessage.textContent = 'Gagal menghantar data.';
      feedbackMessage.className = 'mt-4 text-center text-red-400';
    }

    setTimeout(() => {
      feedbackMessage.textContent = '';
    }, 3000);
  });
}