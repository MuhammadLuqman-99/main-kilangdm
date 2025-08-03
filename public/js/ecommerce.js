// Import fungsi Firestore yang diperlukan
import { 
    collection, 
    addDoc,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Pastikan kod ini berjalan selepas DOM dimuatkan sepenuhnya
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan Firebase sudah sedia untuk digunakan
    if (window.db) {
        setupEventListeners();
    } else {
        // Tunggu seketika jika Firebase lambat dimuatkan
        setTimeout(() => {
            if (window.db) {
                setupEventListeners();
            } else {
                console.error('Firebase gagal dimuatkan.');
                showFeedback('Ralat: Gagal berhubung dengan pangkalan data.', 'error');
            }
        }, 2000);
    }
});

// Fungsi utama untuk menyediakan semua event listener
function setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const orderForm = document.getElementById('order-form');

    // 1. Mengaktifkan klik pada kawasan upload
    uploadArea.addEventListener('click', () => fileInput.click());

    // 2. Mengendalikan fail yang dipilih melalui dialog
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // 3. Mengaktifkan fungsi drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // 4. Mengendalikan penghantaran borang manual
    if (orderForm) {
        orderForm.addEventListener('submit', handleFormSubmit);
    }
}

/**
 * Mengendalikan fail yang diupload (sama ada dari klik atau drag-drop)
 * @param {File} file Objek fail yang akan diproses
 */
async function handleFile(file) {
    const processingIndicator = document.getElementById('processingIndicator');
    const successIndicator = document.getElementById('successIndicator');
    const uploadSection = document.querySelector('.upload-section');

    // Reset sebarang mesej sebelumnya
    hideIndicators();
    
    // Tunjukkan penunjuk "processing"
    uploadSection.style.display = 'none';
    processingIndicator.classList.add('show');

    try {
        const fileText = await file.text();
        const fileSource = document.getElementById('file-source').value;
        
        // Semak jenis fail, hanya proses CSV
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            throw new Error('Sila muat naik fail berformat CSV sahaja.');
        }

        const orders = parseCSV(fileText, fileSource);
        if (orders.length === 0) {
            throw new Error('Tiada data order yang sah ditemui dalam fail CSV.');
        }

        const { successCount, errorCount } = await saveOrdersToFirebase(orders);

        // Tunjukkan mesej kejayaan
        processingIndicator.classList.remove('show');
        successIndicator.querySelector('p').textContent = `Proses selesai! ${successCount} order berjaya disimpan, ${errorCount} gagal.`;
        successIndicator.classList.add('show');

    } catch (error) {
        console.error('Ralat semasa memproses fail:', error);
        showFeedback(`Ralat: ${error.message}`, 'error');
    } finally {
        // Kembalikan UI ke keadaan asal selepas 5 saat
        setTimeout(() => {
            uploadSection.style.display = 'block';
            hideIndicators();
        }, 5000);
        
        // Reset input fail untuk membenarkan upload fail yang sama semula
        document.getElementById('fileInput').value = '';
    }
}

/**
 * Mem-parse teks CSV kepada array of order objects berdasarkan sumber
 * @param {string} csvText Kandungan teks dari fail CSV
 * @param {string} source Sumber fail (shopee, tiktok, manual)
 * @returns {Array<Object>} Array yang mengandungi objek order
 */
function parseCSV(csvText, source) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return []; // Perlu sekurang-kurangnya 1 baris header dan 1 baris data

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);
    const orders = [];

    dataRows.forEach(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length !== headers.length) return; // Abaikan baris yang tidak sepadan

        const rawData = headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});

        let order = {};
        let isValid = true;

        switch (source) {
            case 'shopee':
                // Pemetaan lajur untuk format Shopee
                order = {
                    nama_customer: rawData['Recipient'],
                    total_rm: parseFloat(rawData['Order Amount']) || 0,
                    jenis_order: rawData['Product Name'],
                    nombor_po_invoice: rawData['Order ID'],
                    code_kain: rawData['Seller SKU'],
                    team_sale: 'Shopee',
                    platform: 'Shopee'
                };
                // Proses tarikh dari format "14/07/2025 14:33"
                if (rawData['Created Time']) {
                    const [datePart] = rawData['Created Time'].split(' ');
                    const [day, month, year] = datePart.split('/');
                    order.tarikh = `${year}-${month}-${day}`;
                }
                break;

            case 'tiktok':
                // Pemetaan lajur untuk format TikTok (andaian)
                order = {
                    nama_customer: rawData['Buyer Name'],
                    total_rm: parseFloat(rawData['Order Total']) || 0,
                    jenis_order: rawData['Product Title'],
                    nombor_po_invoice: rawData['Order Number'],
                    code_kain: rawData['SKU'],
                    team_sale: 'Tiktok',
                    platform: 'Lazada' // Platform TikTok tiada dalam form, jadi guna Lazada sebagai contoh
                };
                if (rawData['Order Date']) {
                    order.tarikh = new Date(rawData['Order Date']).toISOString().split('T')[0];
                }
                break;

            case 'manual':
                 // Pemetaan untuk format template manual
                order = {
                    tarikh: rawData['tarikh'],
                    code_kain: rawData['code_kain'],
                    nombor_po_invoice: rawData['nombor_po_invoice'],
                    nama_customer: rawData['nama_customer'],
                    team_sale: rawData['team_sale'],
                    nombor_phone: rawData['nombor_phone'],
                    jenis_order: rawData['jenis_order'],
                    total_rm: parseFloat(rawData['total_rm']) || 0,
                    platform: rawData['platform']
                };
                break;

            default:
                isValid = false;
        }

        if (isValid && order.nombor_po_invoice) {
            // Tambah nilai lalai dan metadata
            order.tarikh = order.tarikh || new Date().toISOString().split('T')[0];
            order.createdAt = Timestamp.now();
            order.source = `csv_${source}`; // e.g., csv_shopee
            orders.push(order);
        }
    });

    return orders;
}

/**
 * Menyimpan array of orders ke dalam Firestore
 * @param {Array<Object>} orders Array objek order
 * @returns {Promise<{successCount: number, errorCount: number}>} Bilangan kejayaan dan kegagalan
 */
async function saveOrdersToFirebase(orders) {
    const ordersCollection = collection(window.db, 'orderData');
    let successCount = 0;
    let errorCount = 0;

    const promises = orders.map(order => 
        addDoc(ordersCollection, order)
            .then(() => successCount++)
            .catch(err => {
                console.error('Gagal menyimpan order:', order.nombor_po_invoice, err);
                errorCount++;
            })
    );

    await Promise.all(promises);
    return { successCount, errorCount };
}

/**
 * Mengendalikan penghantaran borang secara manual
 * @param {Event} e Objek event dari submit
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const orderData = Object.fromEntries(formData.entries());

    // Tukar nilai total_rm kepada number
    orderData.total_rm = parseFloat(orderData.total_rm);

    // Tambah metadata
    orderData.createdAt = Timestamp.now();
    orderData.source = 'manual_form';

    try {
        const ordersCollection = collection(window.db, 'orderData');
        await addDoc(ordersCollection, orderData);
        showFeedback('Order berjaya dihantar!', 'success');
        form.reset();
        document.getElementById('tarikh').valueAsDate = new Date(); // Set tarikh kembali kepada hari ini
    } catch (error) {
        console.error('Ralat menghantar borang:', error);
        showFeedback('Gagal menghantar order. Sila cuba lagi.', 'error');
    }
}

/**
 * Memaparkan mesej maklum balas kepada pengguna
 * @param {string} message Mesej untuk dipaparkan
 * @param {'success' | 'error' | 'info'} type Jenis mesej
 */
function showFeedback(message, type) {
    const feedbackDiv = document.getElementById('feedback-message');
    feedbackDiv.textContent = message;
    feedbackDiv.className = `feedback-message show ${type}`;
    
    // Sembunyikan mesej selepas 5 saat
    setTimeout(() => {
        feedbackDiv.className = 'feedback-message';
    }, 5000);
}

/**
 * Menyembunyikan semua penunjuk proses upload
 */
function hideIndicators() {
    document.getElementById('processingIndicator').classList.remove('show');
    document.getElementById('successIndicator').classList.remove('show');
}