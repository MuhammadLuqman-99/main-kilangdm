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
/**
 * ENHANCED PDF PARSER - Fixed untuk structured display
 * Mem-parse fail PDF invoice dengan structured product breakdown
 */
async function parsePdfInvoice(file) {
    // Check if pdf.js is loaded
    if (typeof window.pdfjsLib === 'undefined' && typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library not found');
        throw new Error('PDF.js library tidak dimuatkan. Sila refresh halaman dan cuba lagi.');
    }

    const pdfLib = window.pdfjsLib || pdfjsLib;
    pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const fileReader = new FileReader();
    
    return new Promise((resolve, reject) => {
        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfLib.getDocument(typedarray).promise;
                let fullText = '';

                console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);

                // Extract text from all pages
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + ' ';
                }

                console.log('Full PDF text extracted:', fullText.substring(0, 500));

                if (fullText.trim().length < 10) {
                    throw new Error('PDF ini mungkin adalah scan/gambar. Sila gunakan PDF yang mengandungi teks yang boleh dipilih.');
                }

                // ===== ENHANCED DATA EXTRACTION =====
                
                // 1. Extract Invoice Number
                const invoiceRegex = /Invoice:\s*#(Inv-[\d-]+)/i;
                const invoiceMatch = fullText.match(invoiceRegex);
                
                // 2. Extract Date
                const dateRegex = /(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}/;
                const dateMatch = fullText.match(dateRegex);
                
                // 3. Extract Customer Name
                const customerRegex = /BILLING ADDRESS:\s*([^\n\r]+?)(?:\s+Jabatan|\s+[A-Z]{2,}|\s*$)/i;
                const customerMatch = fullText.match(customerRegex);
                
                // 4. Extract Contact Number
                const contactRegex = /Contact no:\s*([\d-]+)/i;
                const contactMatch = fullText.match(contactRegex);
                
                // 5. Extract Total Paid Amount
                const totalPaidRegex = /Total Paid:\s*RM\s*([\d,]+\.?\d*)/i;
                const totalPaidMatch = fullText.match(totalPaidRegex);
                
                // 6. Extract Team Sale
                const customerNoteRegex = /Customer Note:\s*\*(\w+)/i;
                const customerNoteMatch = fullText.match(customerNoteRegex);

                // ===== ENHANCED PRODUCT PARSING =====
                const enhancedProducts = [];
                
                // Extract Ready Stock Products dengan detailed parsing
                const readyStockRegex = /Ready Stock([\s\S]*?)(?:Pre-Order|Sub Total:|Total:|$)/i;
                const readyStockMatch = fullText.match(readyStockRegex);
                
                if (readyStockMatch) {
                    const readyStockProducts = parseProductSection(readyStockMatch[1], 'Ready Stock');
                    enhancedProducts.push(...readyStockProducts);
                }
                
                // Extract Pre-Order Products
                const preOrderRegex = /Pre-Order([\s\S]*?)(?:Sub Total:|Total:|$)/i;
                const preOrderMatch = fullText.match(preOrderRegex);
                
                if (preOrderMatch) {
                    const preOrderProducts = parseProductSection(preOrderMatch[1], 'Pre-Order');
                    enhancedProducts.push(...preOrderProducts);
                }

                console.log('Enhanced products extracted:', enhancedProducts.length);

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

                // ===== CREATE STRUCTURED ORDER OBJECT =====
                const structuredProducts = createStructuredProducts(enhancedProducts);
                const totalQuantity = enhancedProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
                const uniqueSizes = extractUniqueSizes(enhancedProducts);

                const order = {
                    // Basic order info
                    nombor_po_invoice: invoiceMatch[1].trim(),
                    tarikh: formattedDate,
                    nama_customer: customerMatch ? customerMatch[1].trim() : 'Customer dari PDF',
                    team_sale: customerNoteMatch ? customerNoteMatch[1].trim() : 'Manual',
                    nombor_phone: contactMatch ? contactMatch[1].trim() : '',
                    total_rm: parseFloat(totalPaidMatch[1].replace(/,/g, '')),
                    platform: 'Website Desa Murni',
                    jenis_order: getDominantProductName(structuredProducts),
                    code_kain: getDominantSKU(structuredProducts),
                    
                    // ===== STRUCTURED DATA FOR ENHANCED DISPLAY =====
                    products: enhancedProducts, // Raw product data
                    structuredProducts: structuredProducts, // For display
                    totalQuantity: totalQuantity,
                    uniqueSizes: uniqueSizes,
                    productCount: structuredProducts.length,
                    sizeCount: uniqueSizes.length,
                    
                    // Metadata
                    createdAt: Timestamp.now(),
                    source: 'pdf_desa_murni_enhanced',
                    pdf_processed_at: new Date().toISOString()
                };

                console.log('Final structured order:', {
                    invoice: order.nombor_po_invoice,
                    customer: order.nama_customer,
                    products: order.productCount,
                    totalQty: order.totalQuantity,
                    structuredProducts: order.structuredProducts
                });
                
                // Show enhanced preview
                showEnhancedExtractedPreview(order);
                
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
 * Create structured products untuk display dalam table
 * @param {Array} products Raw products array
 * @returns {Array} Structured products for display
 */
function createStructuredProducts(products) {
    const productGroups = new Map();
    
    // Group products by base name
    products.forEach(product => {
        const baseName = product.base_name || product.product_name;
        
        if (!productGroups.has(baseName)) {
            productGroups.set(baseName, {
                name: baseName,
                sku: product.sku,
                totalQty: 0,
                sizes: new Map(),
                type: product.type,
                products: []
            });
        }
        
        const group = productGroups.get(baseName);
        group.totalQty += product.quantity;
        group.products.push(product);
        
        // Add to sizes map
        if (group.sizes.has(product.size)) {
            group.sizes.set(product.size, group.sizes.get(product.size) + product.quantity);
        } else {
            group.sizes.set(product.size, product.quantity);
        }
    });
    
    // Convert to array dengan sorted sizes
    const structuredProducts = Array.from(productGroups.values()).map(group => ({
        ...group,
        sizeBreakdown: Array.from(group.sizes.entries())
            .map(([size, qty]) => ({ size, quantity: qty }))
            .sort((a, b) => sortSizes(a.size, b.size))
    }));
    
    return structuredProducts;
}

/**
 * Parse product section dengan enhanced detection
 * @param {string} sectionText Text dari section Ready Stock atau Pre-Order
 * @param {string} type Type produk (Ready Stock / Pre-Order)
 * @returns {Array} Array of parsed products
 */
function parseProductSection(sectionText, type) {
    const products = [];
    console.log(`Parsing ${type} section:`, sectionText.substring(0, 200));
    
    // Enhanced regex untuk match product lines
    // Pattern: SKU ProductName - (Size: X) Qty RM Price
    const productLineRegex = /(BZ[LP]\d{2}[A-Z]{2})\s+(.+?)\s*-\s*\(Size:\s*([^)]+)\)\s+(\d+)\s+RM\s*([\d,]+\.?\d*)/g;
    
    let match;
    while ((match = productLineRegex.exec(sectionText)) !== null) {
        const [, sku, productName, size, quantity, price] = match;
        
        products.push({
            sku: sku.trim(),
            product_name: `${productName.trim()} - (Size: ${size.trim()})`,
            base_name: productName.trim(),
            size: size.trim(),
            quantity: parseInt(quantity),
            price: parseFloat(price.replace(/,/g, '')),
            type: type
        });
    }
    
    // Fallback regex jika format berbeza
    if (products.length === 0) {
        const fallbackRegex = /(BZ[LP]\d{2}[A-Z]{2})\s+([^0-9]+?)\s+(\d+)\s+RM\s*([\d,]+\.?\d*)/g;
        
        while ((match = fallbackRegex.exec(sectionText)) !== null) {
            const [, sku, productName, quantity, price] = match;
            
            // Extract size dari product name jika ada
            const sizeMatch = productName.match(/\(Size:\s*([^)]+)\)|\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL)\b/i);
            const extractedSize = sizeMatch ? (sizeMatch[1] || sizeMatch[2]) : 'Unknown';
            
            products.push({
                sku: sku.trim(),
                product_name: productName.trim(),
                base_name: productName.replace(/\s*-\s*\(Size:[^)]+\)/i, '').trim(),
                size: extractedSize,
                quantity: parseInt(quantity),
                price: parseFloat(price.replace(/,/g, '')),
                type: type
            });
        }
    }
    
    console.log(`Extracted ${products.length} products from ${type} section`);
    return products;
}
function extractUniqueSizes(products) {
    const sizes = new Set();
    products.forEach(product => {
        if (product.size && product.size !== 'Unknown') {
            sizes.add(product.size);
        }
    });
    
    return Array.from(sizes).sort(sortSizes);
}

/**
 * Sort sizes dalam logical order
 * @param {string} a First size
 * @param {string} b Second size
 * @returns {number} Sort comparison
 */
function sortSizes(a, b) {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    const indexA = sizeOrder.indexOf(a);
    const indexB = sizeOrder.indexOf(b);
    
    if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
    }
    
    return a.localeCompare(b);
}

/**
 * Get dominant product name untuk display
 * @param {Array} structuredProducts Structured products
 * @returns {string} Dominant product name
 */
function getDominantProductName(structuredProducts) {
    if (structuredProducts.length === 0) return 'Mixed Products';
    
    // Find product dengan highest total quantity
    const dominant = structuredProducts.reduce((max, current) => 
        current.totalQty > max.totalQty ? current : max
    );
    
    return dominant.name;
}

/**
 * Get dominant SKU untuk display
 * @param {Array} structuredProducts Structured products
 * @returns {string} Dominant SKU
 */
function getDominantSKU(structuredProducts) {
    if (structuredProducts.length === 0) return 'MIXED';
    
    const dominant = structuredProducts.reduce((max, current) => 
        current.totalQty > max.totalQty ? current : max
    );
    
    return dominant.sku;
}

/**
 * Enhanced preview display dengan structured data
 * @param {Object} order Enhanced order object
 */
function showEnhancedExtractedPreview(order) {
    const previewDiv = document.getElementById('extractedPreview');
    const previewContent = document.getElementById('previewContent');
    
    if (!previewDiv || !previewContent) return;
    
    let previewHTML = `
        <div class="pdf-summary">
            <div class="summary-badge">
                <i class="fas fa-file-pdf"></i>
                <span>Enhanced Data dari PDF Desa Murni Batik</span>
            </div>
            <div class="summary-stats">
                <div class="stat-item">Products: <strong>${order.productCount}</strong></div>
                <div class="stat-item">Total Qty: <strong>${order.totalQuantity}</strong></div>
                <div class="stat-item">Unique Sizes: <strong>${order.sizeCount}</strong></div>
                <div class="stat-item">Amount: <strong>RM ${order.total_rm?.toFixed(2)}</strong></div>
            </div>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Invoice:</span>
            <span class="preview-value">${order.nombor_po_invoice}</span>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Customer:</span>
            <span class="preview-value">${order.nama_customer}</span>
        </div>
        
        <div class="preview-item">
            <span class="preview-label">Team Sale:</span>
            <span class="preview-value">${order.team_sale}</span>
        </div>
    `;
    
    // Add structured products breakdown
    if (order.structuredProducts && order.structuredProducts.length > 0) {
        previewHTML += `
            <div style="margin-top: 1.5rem;">
                <h4 style="color: #60a5fa; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-layer-group"></i> 
                    Product Breakdown (${order.structuredProducts.length} jenis)
                </h4>
        `;
        
        order.structuredProducts.forEach((product, index) => {
            previewHTML += `
                <div style="background: rgba(59, 130, 246, 0.1); border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; border-left: 3px solid #3b82f6;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <div>
                            <strong style="color: #e2e8f0;">${product.name}</strong>
                            <div style="color: #94a3b8; font-size: 0.8rem;">SKU: ${product.sku} | Type: ${product.type}</div>
                        </div>
                        <span style="background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: 600;">
                            Total: ${product.totalQty}
                        </span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
            `;
            
            // Add size badges
            product.sizeBreakdown.forEach(size => {
                const sizeColor = getSizeColor(size.size);
                previewHTML += `
                    <span style="background: ${sizeColor}; color: white; padding: 0.125rem 0.5rem; border-radius: 8px; font-size: 0.7rem; font-weight: 600;">
                        ${size.size}: ${size.quantity}
                    </span>
                `;
            });
            
            previewHTML += `
                    </div>
                </div>
            `;
        });
        
        previewHTML += `</div>`;
    }
    
    previewContent.innerHTML = previewHTML;
    previewDiv.classList.add('show');
    
    // Auto-fill form dengan extracted data
    populateForm(order);
}

/**
 * Get color untuk size badge
 * @param {string} size Size string
 * @returns {string} Color hex code
 */
function getSizeColor(size) {
    const sizeColors = {
        'XS': '#ef4444',   // red
        'S': '#f59e0b',    // amber
        'M': '#10b981',    // emerald
        'L': '#3b82f6',    // blue
        'XL': '#8b5cf6',   // violet
        '2XL': '#ec4899',  // pink
        '3XL': '#06b6d4',  // cyan
        '4XL': '#84cc16',  // lime
        '5XL': '#f97316'   // orange
    };
    
    return sizeColors[size] || '#64748b'; // default gray
}

// Export functions untuk integration
window.parsePdfInvoice = parsePdfInvoice;
window.showEnhancedExtractedPreview = showEnhancedExtractedPreview;
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
                    platform: 'Tiktok'
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