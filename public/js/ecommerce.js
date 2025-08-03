// Import fungsi Firestore yang diperlukan
import { 
    collection, 
    addDoc,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Pastikan kod ini berjalan selepas DOM dimuatkan sepenuhnya
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking dependencies...');
    
    // Function to check if all dependencies are loaded
    function checkDependencies() {
        const hasFirebase = window.db !== undefined;
        const hasPdfJs = typeof pdfjsLib !== 'undefined';
        
        console.log('Firebase loaded:', hasFirebase);
        console.log('PDF.js loaded:', hasPdfJs);
        
        if (hasFirebase) {
            setupEventListeners();
            return true;
        }
        return false;
    }
    
    // Try immediately
    if (!checkDependencies()) {
        // Wait a bit for Firebase to load
        let attempts = 0;
        const maxAttempts = 10;
        
        const waitForDependencies = setInterval(() => {
            attempts++;
            console.log(`Attempt ${attempts}: Waiting for dependencies...`);
            
            if (checkDependencies() || attempts >= maxAttempts) {
                clearInterval(waitForDependencies);
                
                if (attempts >= maxAttempts && !window.db) {
                    console.error('Firebase failed to load after maximum attempts');
                    showFeedback('Ralat: Gagal berhubung dengan pangkalan data.', 'error');
                }
            }
        }, 500);
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

    hideIndicators();
    
    uploadSection.style.display = 'none';
    processingIndicator.classList.add('show');

    try {
        let orders;
        let fileSource = 'unknown';

        // Check file type and process accordingly
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
 * Mem-parse fail PDF invoice untuk mendapatkan data order.
 * @param {File} file Objek fail PDF.
 * @returns {Promise<Array<Object>>} Array yang mengandungi satu objek order dengan senarai produk.
 */
async function parsePdfInvoice(file) {
    // Check if pdf.js is loaded from the global scope
    if (typeof window.pdfjsLib === 'undefined' && typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library not found');
        throw new Error('PDF.js library tidak dimuatkan. Sila refresh halaman dan cuba lagi.');
    }

    // Use the correct reference to pdfjsLib
    const pdfLib = window.pdfjsLib || pdfjsLib;
    
    // Set worker for pdf.js with correct path
    pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const fileReader = new FileReader();
    
    return new Promise((resolve, reject) => {
        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfLib.getDocument(typedarray).promise;
                let fullText = '';

                console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);

                // Get text from all pages
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + ' ';
                    console.log(`Page ${i} text length: ${pageText.length}`);
                }

                console.log('Full PDF text extracted:', fullText.substring(0, 1000)); // Debug log - show more text

                // If no text found, it might be a scanned PDF
                if (fullText.trim().length < 10) {
                    throw new Error('PDF ini mungkin adalah scan/gambar. Sila gunakan PDF yang mengandungi teks yang boleh dipilih.');
                }

                // ===== EXTRACT DATA BERDASARKAN FORMAT DESA MURNI BATIK =====
                
                // 1. Extract Invoice Number - lebih specific untuk format Desa Murni
                const invoiceRegex = /Invoice:\s*#(Inv-[\d-]+)/i;
                const invoiceMatch = fullText.match(invoiceRegex);
                
                // 2. Extract Date - format dd/mm/yyyy hh:mm
                const dateRegex = /(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}/;
                const dateMatch = fullText.match(dateRegex);
                
                // 3. Extract Customer Name - dari BILLING ADDRESS
                const customerRegex = /BILLING ADDRESS:\s*([^\n]+)/i;
                const customerMatch = fullText.match(customerRegex);
                
                // 4. Extract Contact Number
                const contactRegex = /Contact no:\s*([\d-]+)/i;
                const contactMatch = fullText.match(contactRegex);
                
                // 5. Extract Total Paid Amount
                const totalPaidRegex = /Total Paid:\s*RM\s*([\d,]+\.?\d*)/i;
                const totalPaidMatch = fullText.match(totalPaidRegex);
                
                // 6. Extract Customer Note/Team Sale
                const customerNoteRegex = /Customer Note:\s*\*(\w+)/i;
                const customerNoteMatch = fullText.match(customerNoteRegex);
                
                // 7. Extract Product Information - ambil semua SKU yang ada
                const productLines = [];
                
                // Pattern untuk Ready Stock products
                const readyStockRegex = /Ready Stock([\s\S]*?)(?:Pre-Order|Sub Total|$)/i;
                const readyStockMatch = fullText.match(readyStockRegex);
                
                // Pattern untuk Pre-Order products  
                const preOrderRegex = /Pre-Order([\s\S]*?)(?:Sub Total|Total Paid|$)/i;
                const preOrderMatch = fullText.match(preOrderRegex);
                
                // Function to extract products from text section
                function extractProducts(text, type) {
                    const products = [];
                    // Pattern: SKU ProductName Qty Price
                    const productRegex = /(BZ[LP]\d{2}[A-Z]{2})\s+([^0-9]+?)\s+(\d+)\s+RM\s*([\d,]+\.?\d*)/g;
                    
                    let match;
                    while ((match = productRegex.exec(text)) !== null) {
                        products.push({
                            sku: match[1],
                            product_name: match[2].trim(),
                            quantity: parseInt(match[3]),
                            price: parseFloat(match[4].replace(/,/g, '')),
                            type: type
                        });
                    }
                    return products;
                }
                
                // Extract products from both sections
                if (readyStockMatch) {
                    productLines.push(...extractProducts(readyStockMatch[1], 'Ready Stock'));
                }
                
                if (preOrderMatch) {
                    productLines.push(...extractProducts(preOrderMatch[1], 'Pre-Order'));
                }

                console.log('Extracted data:', {
                    invoice: invoiceMatch?.[1],
                    date: dateMatch?.[1],
                    customer: customerMatch?.[1],
                    contact: contactMatch?.[1],
                    totalPaid: totalPaidMatch?.[1],
                    customerNote: customerNoteMatch?.[1],
                    productsCount: productLines.length
                });

                // Validate required data
                if (!invoiceMatch) {
                    throw new Error('Nombor invoice tidak ditemui. Pastikan PDF adalah invoice dari Desa Murni Batik.');
                }
                
                if (!totalPaidMatch) {
                    throw new Error('Total amount tidak ditemui dalam PDF.');
                }
                
                // Format date to YYYY-MM-DD
                let formattedDate = new Date().toISOString().split('T')[0];
                if (dateMatch) {
                    const [day, month, year] = dateMatch[1].split('/');
                    formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }

                // Get dominant SKU (yang paling banyak quantity)
                let dominantSKU = 'MIXED';
                let dominantProductType = 'Mixed Products';
                
                if (productLines.length > 0) {
                    // Group by SKU and sum quantities
                    const skuGroups = {};
                    productLines.forEach(product => {
                        if (!skuGroups[product.sku]) {
                            skuGroups[product.sku] = { 
                                qty: 0, 
                                name: product.product_name.split(' - ')[0] 
                            };
                        }
                        skuGroups[product.sku].qty += product.quantity;
                    });
                    
                    // Find dominant SKU
                    let maxQty = 0;
                    Object.keys(skuGroups).forEach(sku => {
                        if (skuGroups[sku].qty > maxQty) {
                            maxQty = skuGroups[sku].qty;
                            dominantSKU = sku;
                            dominantProductType = skuGroups[sku].name;
                        }
                    });
                }

                // Create comprehensive order object
                const order = {
                    // Required fields for form
                    nombor_po_invoice: invoiceMatch[1].trim(),
                    tarikh: formattedDate,
                    nama_customer: customerMatch ? customerMatch[1].trim() : 'Customer dari PDF',
                    team_sale: customerNoteMatch ? customerNoteMatch[1].trim() : 'Manual',
                    nombor_phone: contactMatch ? contactMatch[1].trim() : '',
                    total_rm: parseFloat(totalPaidMatch[1].replace(/,/g, '')),
                    platform: 'Website Desa Murni',
                    jenis_order: dominantProductType,
                    code_kain: dominantSKU,
                    
                    // Additional extracted data
                    products: productLines,
                    ready_stock_count: productLines.filter(p => p.type === 'Ready Stock').length,
                    pre_order_count: productLines.filter(p => p.type === 'Pre-Order').length,
                    total_quantity: productLines.reduce((sum, p) => sum + p.quantity, 0),
                    
                    // Metadata
                    createdAt: Timestamp.now(),
                    source: 'pdf_desa_murni',
                    pdf_processed_at: new Date().toISOString()
                };

                console.log('Final parsed order:', order);
                
                // Show preview of extracted data
                showExtractedPreview(order);
                
                resolve([order]);

            } catch (err) {
                console.error('Error parsing PDF:', err);
                reject(new Error(`Gagal memproses PDF: ${err.message}`));
            }
        };

        fileReader.onerror = (error) => {
            console.error('File reader error:', error);
            reject(new Error('Gagal membaca fail PDF. Pastikan fail tidak rosak.'));
        };
        
        fileReader.readAsArrayBuffer(file);
    });
}

/**
 * Mengesan sumber CSV (Shopee/TikTok) berdasarkan lajur pengepala (headers).
 * @param {string} csvText Kandungan teks dari fail CSV.
 * @returns {'shopee' | 'tiktok' | 'manual' | 'unknown'} Nama sumber yang dikesan.
 */
function detectSource(csvText) {
    const firstLine = csvText.split('\n')[0].trim();
    const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));

    // Criteria for detecting Shopee file
    const isShopee = headers.includes('Order ID') && headers.includes('Recipient') && headers.includes('Seller SKU');
    if (isShopee) {
        return 'shopee';
    }

    // Criteria for detecting TikTok file
    const isTiktok = headers.includes('Order Number') && headers.includes('Buyer Name') && headers.includes('SKU');
    if (isTiktok) {
        return 'tiktok';
    }

    // Criteria for detecting manual template file
    const isManual = headers.includes('code_kain') && headers.includes('nombor_po_invoice');
    if (isManual) {
        return 'manual';
    }
    
    return 'unknown';
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
                    nombor_phone: rawData['Phone'] || '',
                    team_sale: 'Shopee',
                    platform: 'Shopee'
                };
                if (rawData['Created Time']) {
                    const [datePart] = rawData['Created Time'].split(' ');
                    const [day, month, year] = datePart.split('/');
                    order.tarikh = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                break;

            case 'tiktok':
                order = {
                    nama_customer: rawData['Buyer Name'],
                    total_rm: parseFloat(rawData['Total Price']) || 0,
                    jenis_order: rawData['Product Name'],
                    nombor_po_invoice: rawData['Order Number'],
                    code_kain: rawData['SKU'],
                    nombor_phone: rawData['Phone Number'] || '',
                    team_sale: 'Tiktok',
                    platform: 'Lazada'
                };
                if (rawData['Created At']) {
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
                    nombor_phone: rawData['nombor_phone'] || '',
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

/**
 * Memaparkan preview data yang diekstrak dari PDF
 * @param {Object} order Data order yang diekstrak
 */
function showExtractedPreview(order) {
    const previewDiv = document.getElementById('extractedPreview');
    const previewContent = document.getElementById('previewContent');
    
    if (!previewDiv || !previewContent) return;
    
    // Create preview HTML
    let previewHTML = `
        <div class="pdf-summary">
            <div class="summary-badge">
                <i class="fas fa-file-pdf"></i>
                <span>Data dari PDF Desa Murni Batik</span>
            </div>
            <div class="summary-stats">
                <div class="stat-item">Total Produk: <strong>${order.products?.length || 0}</strong></div>
                <div class="stat-item">Kuantiti: <strong>${order.total_quantity || 0}</strong></div>
                <div class="stat-item">Jumlah: <strong>RM ${order.total_rm?.toFixed(2) || '0.00'}</strong></div>
            </div>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Invoice:</span>
            <span class="preview-value">${order.nombor_po_invoice}</span>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Tarikh:</span>
            <span class="preview-value">${order.tarikh}</span>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Customer:</span>
            <span class="preview-value">${order.nama_customer}</span>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Phone:</span>
            <span class="preview-value">${order.nombor_phone || 'Tidak ditemui'}</span>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Team Sale:</span>
            <span class="preview-value">${order.team_sale}</span>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Platform:</span>
            <span class="preview-value">${order.platform}</span>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Jenis Order:</span>
            <span class="preview-value">${order.jenis_order}</span>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Code Kain (Dominan):</span>
            <span class="preview-value">${order.code_kain}</span>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Total Amount:</span>
            <span class="preview-value">RM ${order.total_rm?.toFixed(2)}</span>
        </div>
    `;
    
    // Add products table if available
    if (order.products && order.products.length > 0) {
        previewHTML += `
            <div style="margin-top: 1rem;">
                <h4 style="color: #60a5fa; margin-bottom: 0.5rem;">
                    <i class="fas fa-list"></i> Senarai Produk (${order.products.length})
                </h4>
                <div class="csv-preview-table" style="max-height: 200px; overflow-y: auto;">
                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Produk</th>
                                <th>Qty</th>
                                <th>Harga</th>
                                <th>Jenis</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        order.products.forEach(product => {
            previewHTML += `
                <tr>
                    <td>${product.sku}</td>
                    <td style="font-size: 0.7rem;">${product.product_name.substring(0, 30)}...</td>
                    <td>${product.quantity}</td>
                    <td>RM ${product.price.toFixed(2)}</td>
                    <td><span style="font-size: 0.7rem; color: ${product.type === 'Ready Stock' ? '#22c55e' : '#f59e0b'}">${product.type}</span></td>
                </tr>
            `;
        });
        
        previewHTML += `
                        </tbody>
                    </table>
                </div>
                <div class="preview-footer">
                    Ready Stock: ${order.ready_stock_count} | Pre-Order: ${order.pre_order_count}
                </div>
            </div>
        `;
    }
    
    previewContent.innerHTML = previewHTML;
    previewDiv.classList.add('show');
    
    // Auto-fill form with extracted data
    populateForm(order);
}

/**
 * Auto-populate form dengan data yang diekstrak
 * @param {Object} order Data order
 */
function populateForm(order) {
    const fields = [
        'tarikh', 'nombor_po_invoice', 'nama_customer', 
        'team_sale', 'nombor_phone', 'jenis_order', 
        'code_kain', 'total_rm', 'platform'
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element && order[field]) {
            element.value = order[field];
            
            // Add visual feedback
            element.style.background = 'rgba(34, 197, 94, 0.1)';
            element.style.borderColor = '#22c55e';
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                element.style.background = '';
                element.style.borderColor = '';
            }, 3000);
        }
    });
    
    // Show success message
    showFeedback('Data PDF berjaya diekstrak dan diisi ke dalam form!', 'success');
}