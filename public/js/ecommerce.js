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
/**
 * Mengendalikan fail yang diupload (sama ada dari klik atau drag-drop)
 * @param {File} file Objek fail yang akan diproses
 */
async function handleFile(file) {
    const processingIndicator = document.getElementById('processingIndicator');
    const successIndicator = document.getElementById('successIndicator');
    const uploadSection = document.querySelector('.upload-section');

    hideIndicators();
    
    uploadSection.style.display = 'none';
    processingIndicator.classList.add('show');

    try {
        let orders;
        let fileSource = 'unknown';

        // ---- LOGIK BAHARU BERMULA DI SINI ----
        if (file.type === 'application/pdf') {
            fileSource = 'PDF Invoice';
            orders = await parsePdfInvoice(file);
        
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            const fileText = await file.text();
            fileSource = detectSource(fileText);
            if (fileSource === 'unknown') {
                throw new Error('Format CSV tidak dikenali. Pastikan ia adalah fail dari Shopee, TikTok, atau templat manual.');
            }
            orders = parseCSV(fileText, fileSource);

        } else {
            throw new Error('Format fail tidak disokong. Sila muat naik fail CSV atau PDF sahaja.');
        }
        // ---- LOGIK BAHARU TAMAT ----

        if (!orders || orders.length === 0) {
            throw new Error('Tiada data order yang sah ditemui dalam fail.');
        }

        const { successCount, errorCount } = await saveOrdersToFirebase(orders);

        processingIndicator.classList.remove('show');
        
        const successTitle = document.getElementById('success-title');
        const successDetails = document.getElementById('success-details');

        if (successTitle && successDetails) {
            successTitle.textContent = 'Fail Anda Telah Berjaya Dihantar!';
            successDetails.textContent = `Ringkasan: ${successCount} order dari fail ${fileSource} telah disimpan. Gagal: ${errorCount}.`;
        }
        successIndicator.classList.add('show');

    } catch (error) {
        console.error('Ralat semasa memproses fail:', error);
        showFeedback(`Ralat: ${error.message}`, 'error');
        processingIndicator.classList.remove('show');
    } finally {
        setTimeout(() => {
            uploadSection.style.display = 'block';
            hideIndicators();
        }, 7000);
        
        document.getElementById('fileInput').value = '';
    }
}
/**
 * --- FUNGSI BAHARU UNTUK PDF ---
 * Mem-parse fail PDF invoice untuk mendapatkan data order.
 * @param {File} file Objek fail PDF.
 * @returns {Promise<Array<Object>>} Array yang mengandungi satu objek order dengan senarai produk.
 */
async function parsePdfInvoice(file) {
    // Tetapkan worker untuk pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://mozilla.github.io/pdf.js/build/pdf.worker.js`;

    const fileReader = new FileReader();
    
    return new Promise((resolve, reject) => {
        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';

                // Dapatkan teks dari semua mukasurat
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(item => item.str).join(' ');
                }

                // Corak (Regex) untuk mencari maklumat spesifik
                const invoiceRegex = /Invoice: (#Inv-[\w-]+)/;
                const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
                const totalRegex = /Total Paid:\s*(RM [\d,]+\.\d{2})/;
                const customerRegex = /BILLING ADDRESS: (.*?)\s+Jabatan/
                const noteRegex = /Customer Note:\s*\*(\w+)/; // Cth: *NISYA
                const productLineRegex = /([A-Z0-9]{7})\s*,Kemeja Batik DM.*?,\s*(\d+)\s*,(RM [\d,]+\.\d{2})|([A-Z0-9]{7})\s*,Kurung Alana.*?,\s*(\d+)\s*,(RM [\d,]+\.\d{2})/g;
                
                // Ekstrak data utama
                const invoiceMatch = fullText.match(invoiceRegex);
                const dateMatch = fullText.match(dateRegex);
                const totalMatch = fullText.match(totalRegex);
                const customerMatch = fullText.match(customerRegex);
                const noteMatch = fullText.match(noteRegex);

                if (!invoiceMatch) {
                    throw new Error('Nombor invoice tidak ditemui dalam PDF.');
                }
                
                // Ekstrak semua baris produk
                const products = [];
                let match;
                while ((match = productLineRegex.exec(fullText)) !== null) {
                    // Regex ini kompleks kerana format teks dari PDF tidak menentu
                    // Ia cuba menangkap SKU, Kuantiti, dan Harga
                     products.push({
                        sku: match[1] || match[4],
                        quantity: parseInt(match[2] || match[5], 10),
                        price: match[3] || match[6]
                    });
                }

                if (products.length === 0) {
                    throw new Error('Tiada produk ditemui dalam PDF. Pastikan format PDF betul.');
                }
                
                // Format tarikh ke YYYY-MM-DD
                let formattedDate = new Date().toISOString().split('T')[0];
                if (dateMatch) {
                    const [day, month, year] = dateMatch[1].split('/');
                    formattedDate = `${year}-${month}-${day}`;
                }

                // Gabungkan semua jadi satu order object
                const order = {
                    nombor_po_invoice: invoiceMatch[1].trim(), // cth: #Inv-100403-210725
                    tarikh: formattedDate,
                    nama_customer: customerMatch ? customerMatch[1].trim() : 'N/A', // cth: Azliza Awang Kechik@ Alias
                    team_sale: noteMatch ? noteMatch[1].trim() : 'N/A', // cth: NISYA
                    total_rm: totalMatch ? parseFloat(totalMatch[1].replace('RM', '').replace(',', '').trim()) : 0, // cth: 11842.00
                    platform: 'Manual PDF',
                    jenis_order: 'Multiple Items',
                    code_kain: 'Multiple SKUs',
                    products: products, // Simpan senarai produk
                    createdAt: Timestamp.now(),
                    source: 'pdf_invoice'
                };

                resolve([order]); // Balikkan sebagai array, sama seperti parser CSV

            } catch (err) {
                reject(err);
            }
        };

        fileReader.onerror = (error) => reject(error);
        fileReader.readAsArrayBuffer(file);
    });
}
/**
 * --- FUNGSI BAHARU ---
 * Mengesan sumber CSV (Shopee/TikTok) berdasarkan lajur pengepala (headers).
 * @param {string} csvText Kandungan teks dari fail CSV.
 * @returns {'shopee' | 'tiktok' | 'manual' | 'unknown'} Nama sumber yang dikesan.
 */
function detectSource(csvText) {
    const firstLine = csvText.split('\n')[0].trim();
    const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));

    // Kriteria untuk mengesan fail Shopee
    const isShopee = headers.includes('Order ID') && headers.includes('Recipient') && headers.includes('Seller SKU');
    if (isShopee) {
        return 'shopee';
    }

    // Kriteria untuk mengesan fail TikTok (berdasarkan fail yang diupload)
    const isTiktok = headers.includes('Order Number') && headers.includes('Buyer Name') && headers.includes('SKU');
    if (isTiktok) {
        return 'tiktok';
    }

    // Kriteria untuk mengesan fail template manual
    const isManual = headers.includes('code_kain') && headers.includes('nombor_po_invoice');
    if (isManual) {
        return 'manual';
    }
    
    return 'unknown'; // Jika tiada format yang sepadan
}


/**
 * Mem-parse teks CSV kepada array of order objects berdasarkan sumber
 * @param {string} csvText Kandungan teks dari fail CSV
 * @param {string} source Sumber fail (shopee, tiktok, manual)
 * @returns {Array<Object>} Array yang mengandungi objek order
 */
function parseCSV(csvText, source) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);
    const orders = [];

    dataRows.forEach(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length !== headers.length) return;

        const rawData = headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});

        let order = {};
        let isValid = true;

        switch (source) {
            case 'shopee':
                order = {
                    nama_customer: rawData['Recipient'],
                    total_rm: parseFloat(rawData['Order Amount']) || 0,
                    jenis_order: rawData['Product Name'],
                    nombor_po_invoice: rawData['Order ID'],
                    code_kain: rawData['Seller SKU'],
                    team_sale: 'Shopee',
                    platform: 'Shopee'
                };
                if (rawData['Created Time']) {
                    const [datePart] = rawData['Created Time'].split(' ');
                    const [day, month, year] = datePart.split('/');
                    order.tarikh = `${year}-${month}-${day}`;
                }
                break;

            case 'tiktok':
                 order = {
                    nama_customer: rawData['Buyer Name'],
                    total_rm: parseFloat(rawData['Total Price']) || 0, // 'Total Price' dalam fail contoh
                    jenis_order: rawData['Product Name'],
                    nombor_po_invoice: rawData['Order Number'],
                    code_kain: rawData['SKU'],
                    nombor_phone: rawData['Phone Number'], // 'Phone Number' dalam fail contoh
                    team_sale: 'Tiktok',
                    platform: 'Lazada' // Platform TikTok tiada dalam form, jadi guna Lazada sebagai contoh
                };
                if (rawData['Created At']) { // 'Created At' dalam fail contoh
                    order.tarikh = new Date(rawData['Created At']).toISOString().split('T')[0];
                }
                break;

            case 'manual':
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
            order.tarikh = order.tarikh || new Date().toISOString().split('T')[0];
            order.createdAt = Timestamp.now();
            order.source = `csv_${source}`;
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

    orderData.total_rm = parseFloat(orderData.total_rm);
    orderData.createdAt = Timestamp.now();
    orderData.source = 'manual_form';

    try {
        const ordersCollection = collection(window.db, 'orderData');
        await addDoc(ordersCollection, orderData);
        showFeedback('Order berjaya dihantar!', 'success');
        form.reset();
        document.getElementById('tarikh').valueAsDate = new Date();
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