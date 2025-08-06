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
 * ENHANCED PDF PARSER dengan Robust Detection System
 * Versi yang diperbaiki untuk menangani pelbagai format PDF Desa Murni Batik
 */

/**
 * Function untuk replace existing parsePdfInvoice
 * Kekalkan interface yang sama tetapi gunakan robust method
 */
async function parsePdfInvoice(file) {
    try {
        return await parsePdfInvoiceRobust(file);
    } catch (error) {
        console.error('Robust PDF parsing failed, trying legacy method...');
        // Fallback to original method if robust fails
        return await parsePdfInvoiceLegacy(file);
    }
}

/**
 * Legacy method sebagai fallback terakhir
 */
async function parsePdfInvoiceLegacy(file) {
    const pdfLib = window.pdfjsLib || pdfjsLib;
    pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const fileReader = new FileReader();
    
    return new Promise((resolve, reject) => {
        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfLib.getDocument(typedarray).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + ' ';
                }

                // Basic extraction dengan simple patterns
                const invoiceMatch = fullText.match(/Invoice:\s*#?([\w\d-]+)/i);
                const totalMatch = fullText.match(/Total.*?RM\s*([\d,]+\.?\d*)/i);
                const customerMatch = fullText.match(/(?:BILLING|Customer).*?:\s*([^\n\r]+)/i);

                if (!invoiceMatch || !totalMatch) {
                    throw new Error('Unable to extract basic invoice information');
                }

                // Create basic order object
                const order = {
                    nombor_po_invoice: invoiceMatch[1],
                    tarikh: new Date().toISOString().split('T')[0],
                    nama_customer: customerMatch ? customerMatch[1].trim() : 'Customer dari PDF',
                    team_sale: 'Manual',
                    nombor_phone: '',
                    total_rm: parseFloat(totalMatch[1].replace(/,/g, '')),
                    platform: 'Website Desa Murni',
                    jenis_order: 'Mixed Products',
                    code_kain: 'MIXED',
                    
                    // Basic structure
                    products: [{
                        sku: 'LEGACY',
                        product_name: 'Legacy PDF Import',
                        base_name: 'Legacy Products',
                        size: 'Mixed',
                        quantity: 1,
                        price: parseFloat(totalMatch[1].replace(/,/g, '')),
                        type: 'Legacy'
                    }],
                    structuredProducts: [{
                        name: 'Legacy Products',
                        sku: 'LEGACY',
                        totalQty: 1,
                        type: 'Legacy',
                        products: [],
                        sizeBreakdown: [{ size: 'Mixed', quantity: 1 }],
                        sizesObject: { 'Mixed': 1 }
                    }],
                    totalQuantity: 1,
                    uniqueSizes: ['Mixed'],
                    productCount: 1,
                    sizeCount: 1,
                    
                    createdAt: new Date(),
                    source: 'pdf_legacy_fallback',
                    pdf_processed_at: new Date().toISOString()
                };

                resolve([order]);

            } catch (err) {
                reject(new Error(`Legacy parsing failed: ${err.message}`));
            }
        };

        fileReader.onerror = (error) => {
            reject(new Error('Failed to read PDF file'));
        };
        
        fileReader.readAsArrayBuffer(file);
    });
}

/**
 * Testing function untuk debug purposes
 */
function testPdfPatterns(sampleText) {
    console.log('Testing PDF patterns with sample text...');
    
    const standardResult = extractUsingStandardRegex(sampleText);
    const fallbackResult = extractUsingFallbackPatterns(sampleText);
    
    console.log('Standard extraction:', standardResult);
    console.log('Fallback extraction:', fallbackResult);
    
    const merged = mergeExtractionResults(standardResult, {}, fallbackResult);
    console.log('Merged result:', merged);
    
    return merged;
}

// Export functions untuk integration
if (typeof window !== 'undefined') {
    window.parsePdfInvoiceRobust = parsePdfInvoiceRobust;
    window.parsePdfInvoice = parsePdfInvoice;
    window.testPdfPatterns = testPdfPatterns;
    window.debugPdfExtraction = debugPdfExtraction;
} 

/**
 * Method 1: Standard regex-based extraction
 */
function extractUsingStandardRegex(fullText) {
    const data = {
        invoice: '',
        date: '',
        customer: '',
        teamSale: '',
        phone: '',
        totalAmount: 0,
        method: 'standard'
    };

    // Invoice patterns - multiple variations
    const invoicePatterns = [
        /Invoice:\s*#(Inv-[\d-]+)/i,
        /Invoice:\s*#([A-Z]*inv-[\d-]+)/i,
        /Invoice:\s*([#]?[A-Z]*inv[\d-]+)/i,
        /INVOICE[:\s]*#?([A-Z0-9-]+)/i
    ];
    
    for (const pattern of invoicePatterns) {
        const match = fullText.match(pattern);
        if (match) {
            data.invoice = match[1].trim();
            break;
        }
    }

    // Date patterns
    const datePatterns = [
        /(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}/,
        /(\d{1,2}\/\d{1,2}\/\d{4})/g,
        /(\d{4}-\d{2}-\d{2})/
    ];
    
    for (const pattern of datePatterns) {
        const match = fullText.match(pattern);
        if (match) {
            const dateStr = match[1];
            // Convert to YYYY-MM-DD format
            if (dateStr.includes('/')) {
                const [day, month, year] = dateStr.split('/');
                data.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
                data.date = dateStr;
            }
            break;
        }
    }

    // Customer patterns - more flexible
    const customerPatterns = [
        /BILLING ADDRESS:\s*([^\n\r]+?)(?:\s+(?:Jabatan|JABATAN|Pejabat|PEJABAT))/i,
        /BILLING ADDRESS:\s*([^\n\r]+?)(?:\s+[A-Z]{3,})/i,
        /BILLING ADDRESS:\s*([^\n\r\t]+)/i,
        /Customer[:\s]*([^\n\r]+)/i
    ];
    
    for (const pattern of customerPatterns) {
        const match = fullText.match(pattern);
        if (match && match[1].trim().length > 2) {
            data.customer = match[1].trim();
            break;
        }
    }

    // Phone patterns
    const phonePatterns = [
        /Contact no:\s*([\d\s\-\+\(\)]+)/i,
        /Phone[:\s]*([\d\s\-\+\(\)]+)/i,
        /Tel[:\s]*([\d\s\-\+\(\)]+)/i
    ];
    
    for (const pattern of phonePatterns) {
        const match = fullText.match(pattern);
        if (match) {
            data.phone = match[1].trim();
            break;
        }
    }

    // Total amount patterns
    const totalPatterns = [
        /Total Paid:\s*RM\s*([\d,]+\.?\d*)/i,
        /Total:\s*RM\s*([\d,]+\.?\d*)/i,
        /Amount:\s*RM\s*([\d,]+\.?\d*)/i,
        /TOTAL\s*RM\s*([\d,]+\.?\d*)/i
    ];
    
    for (const pattern of totalPatterns) {
        const match = fullText.match(pattern);
        if (match) {
            data.totalAmount = parseFloat(match[1].replace(/,/g, ''));
            break;
        }
    }

    // Team sale from customer note
    const teamPatterns = [
        /Customer Note:\s*[*#]?(\w+)/i,
        /Note:\s*[*#]?(\w+)/i,
        /Team[:\s]*(\w+)/i,
        /Agent[:\s]*(\w+)/i
    ];
    
    for (const pattern of teamPatterns) {
        const match = fullText.match(pattern);
        if (match) {
            data.teamSale = match[1].trim();
            break;
        }
    }

    return data;
}

/**
 * Method 2: Structured positioning-based extraction
 */
function extractUsingStructuredApproach(structuredText, fullText) {
    const data = {
        invoice: '',
        date: '',
        customer: '',
        teamSale: '',
        phone: '',
        totalAmount: 0,
        method: 'structured'
    };

    // Find text blocks that typically contain invoice info
    structuredText.forEach(page => {
        page.items.forEach((item, index) => {
            const text = item.text.toLowerCase();
            
            // Look for invoice number near "invoice" text
            if (text.includes('invoice') && !data.invoice) {
                // Check next few items for invoice number
                for (let i = index; i < Math.min(index + 5, page.items.length); i++) {
                    const nextItem = page.items[i];
                    if (nextItem && nextItem.text.match(/[#]?inv[\d-]+/i)) {
                        data.invoice = nextItem.text.replace('#', '').trim();
                        break;
                    }
                }
            }
            
            // Look for customer name after "BILLING ADDRESS"
            if (text.includes('billing address') && !data.customer) {
                // Check next few items
                for (let i = index + 1; i < Math.min(index + 3, page.items.length); i++) {
                    const nextItem = page.items[i];
                    if (nextItem && nextItem.text.length > 5 && 
                        !nextItem.text.match(/^\d+$/) && 
                        !nextItem.text.toLowerCase().includes('address')) {
                        data.customer = nextItem.text.trim();
                        break;
                    }
                }
            }
            
            // Look for total amount
            if ((text.includes('total paid') || text.includes('total:')) && !data.totalAmount) {
                // Check nearby items for RM amount
                for (let i = Math.max(0, index - 2); i < Math.min(index + 5, page.items.length); i++) {
                    const nearItem = page.items[i];
                    if (nearItem && nearItem.text.match(/RM\s*([\d,]+\.?\d*)/i)) {
                        const match = nearItem.text.match(/RM\s*([\d,]+\.?\d*)/i);
                        if (match) {
                            data.totalAmount = parseFloat(match[1].replace(/,/g, ''));
                            break;
                        }
                    }
                }
            }
        });
    });

    return data;
}

/**
 * Method 3: Fallback pattern matching untuk format yang berbeza
 */
function extractUsingFallbackPatterns(fullText) {
    const data = {
        invoice: '',
        date: '',
        customer: '',
        teamSale: '',
        phone: '',
        totalAmount: 0,
        method: 'fallback'
    };

    // Split text into lines untuk line-by-line analysis
    const lines = fullText.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        
        // Invoice detection dengan broader patterns
        if (!data.invoice && (line.toLowerCase().includes('invoice') || line.match(/inv[\d-]/i))) {
            const invoiceMatch = line.match(/([A-Z]*inv[\w\d-]+)/i);
            if (invoiceMatch) {
                data.invoice = invoiceMatch[1];
            }
        }
        
        // Customer name detection - look for names after address indicators
        if (!data.customer && (line.toLowerCase().includes('billing') || line.toLowerCase().includes('customer'))) {
            if (nextLine && nextLine.length > 5 && !nextLine.match(/^\d/) && !nextLine.toLowerCase().includes('address')) {
                data.customer = nextLine;
            }
        }
        
        // Total amount - broader search
        if (!data.totalAmount) {
            const amountMatch = line.match(/(?:total|amount|paid|rm)\s*:?\s*rm?\s*([\d,]+\.?\d*)/i);
            if (amountMatch) {
                const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
                if (amount > 10) { // Reasonable minimum amount
                    data.totalAmount = amount;
                }
            }
        }
        
        // Date detection
        if (!data.date) {
            const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
            if (dateMatch) {
                const [day, month, year] = dateMatch[1].split('/');
                data.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
    }

    return data;
}

/**
 * Merge hasil dari multiple extraction methods
 */
function mergeExtractionResults(standard, structured, fallback) {
    const merged = {
        invoice: '',
        date: '',
        customer: '',
        teamSale: '',
        phone: '',
        totalAmount: 0,
        usedMethods: []
    };

    // Priority: standard > structured > fallback
    const methods = [
        { data: standard, name: 'standard' },
        { data: structured, name: 'structured' },
        { data: fallback, name: 'fallback' }
    ];

    // Merge each field, taking first valid value
    ['invoice', 'date', 'customer', 'teamSale', 'phone'].forEach(field => {
        for (const method of methods) {
            if (!merged[field] && method.data[field] && method.data[field].trim() !== '') {
                merged[field] = method.data[field];
                if (!merged.usedMethods.includes(method.name)) {
                    merged.usedMethods.push(method.name);
                }
                break;
            }
        }
    });

    // For totalAmount, take highest reasonable value
    const amounts = methods.map(m => m.data.totalAmount).filter(amount => amount > 0);
    if (amounts.length > 0) {
        merged.totalAmount = Math.max(...amounts);
        const sourceMethod = methods.find(m => m.data.totalAmount === merged.totalAmount);
        if (sourceMethod && !merged.usedMethods.includes(sourceMethod.name)) {
            merged.usedMethods.push(sourceMethod.name);
        }
    }

    // Set defaults for missing required fields
    merged.date = merged.date || new Date().toISOString().split('T')[0];
    merged.customer = merged.customer || 'Customer dari PDF';
    merged.teamSale = merged.teamSale || 'Manual';

    return merged;
}

/**
 * Enhanced product extraction dengan multiple methods
 */
function extractProductsWithMultipleMethods(fullText, structuredText) {
    const products = [];
    
    // Method 1: Enhanced regex untuk Ready Stock dan Pre-Order
    const readyStockProducts = extractProductsFromSection(fullText, 'Ready Stock');
    const preOrderProducts = extractProductsFromSection(fullText, 'Pre-Order');
    
    products.push(...readyStockProducts, ...preOrderProducts);
    
    // Method 2: Fallback table detection jika method 1 gagal
    if (products.length === 0) {
        const tableProducts = extractProductsFromTables(structuredText);
        products.push(...tableProducts);
    }
    
    // Method 3: Line-by-line product detection
    if (products.length === 0) {
        const lineProducts = extractProductsFromLines(fullText);
        products.push(...lineProducts);
    }
    
    return products;
}

/**
 * Extract products from specific sections (Ready Stock/Pre-Order)
 */
function extractProductsFromSection(fullText, sectionType) {
    const products = [];
    
    const sectionRegex = new RegExp(`${sectionType}([\\s\\S]*?)(?:Pre-Order|Sub Total:|Total:|$)`, 'i');
    const sectionMatch = fullText.match(sectionRegex);
    
    if (!sectionMatch) return products;
    
    const sectionText = sectionMatch[1];
    
    // Multiple product line patterns
    const productPatterns = [
        // Pattern 1: Standard format
        /(BZ[LP]\d{2}[A-Z]{2})\s+(.+?)\s*-\s*\(Size:\s*([^)]+)\)\s+(\d+)\s+RM\s*([\d,]+\.?\d*)/g,
        
        // Pattern 2: Simplified format
        /(BZ[LP]\d{2}[A-Z]{2})\s+([^0-9]+?)\s+(\d+)\s+RM\s*([\d,]+\.?\d*)/g,
        
        // Pattern 3: More flexible format
        /([A-Z]{2,}[LP]?\d{2}[A-Z]{2})\s+(.+?)\s+(\d+)\s+RM\s*([\d,]+\.?\d*)/g
    ];
    
    for (const pattern of productPatterns) {
        let match;
        pattern.lastIndex = 0; // Reset regex
        
        while ((match = pattern.exec(sectionText)) !== null) {
            const sku = match[1];
            const productName = match[2].trim();
            
            let size = 'Unknown';
            let quantity, price;
            
            if (match.length === 6) {
                // Pattern 1 dengan size
                size = match[3];
                quantity = parseInt(match[4]);
                price = parseFloat(match[5].replace(/,/g, ''));
            } else {
                // Pattern 2/3 tanpa explicit size
                quantity = parseInt(match[3]);
                price = parseFloat(match[4].replace(/,/g, ''));
                
                // Try to extract size from product name
                const sizeMatch = productName.match(/\(Size:\s*([^)]+)\)|\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL)\b/i);
                if (sizeMatch) {
                    size = sizeMatch[1] || sizeMatch[2];
                }
            }
            
            if (sku && quantity > 0 && price > 0) {
                products.push({
                    sku: sku,
                    product_name: productName,
                    base_name: productName.replace(/\s*-\s*\(Size:[^)]+\)/i, '').trim(),
                    size: size,
                    quantity: quantity,
                    price: price,
                    type: sectionType
                });
            }
        }
        
        if (products.length > 0) break; // Stop if we found products
    }
    
    return products;
}

/**
 * Extract products from table structures menggunakan positioning
 */
function extractProductsFromTables(structuredText) {
    const products = [];
    
    // Look for table-like structures
    structuredText.forEach(page => {
        const items = page.items;
        
        // Find potential product rows by looking for SKU patterns
        items.forEach((item, index) => {
            if (item.text.match(/^BZ[LP]\d{2}[A-Z]{2}$/)) {
                // Found potential SKU, look for related data in nearby positions
                const sku = item.text;
                
                // Look for product name (usually next item or nearby)
                let productName = '';
                let quantity = 0;
                let price = 0;
                
                // Check next few items on similar Y position
                for (let i = index + 1; i < Math.min(index + 10, items.length); i++) {
                    const nextItem = items[i];
                    
                    // Product name (text without numbers)
                    if (!productName && nextItem.text.length > 5 && 
                        !nextItem.text.match(/^\d+$/) && 
                        !nextItem.text.match(/^RM/)) {
                        productName = nextItem.text;
                    }
                    
                    // Quantity (standalone number)
                    if (!quantity && nextItem.text.match(/^\d+$/) && 
                        parseInt(nextItem.text) > 0 && parseInt(nextItem.text) < 1000) {
                        quantity = parseInt(nextItem.text);
                    }
                    
                    // Price (RM amount)
                    if (!price && nextItem.text.match(/^RM\s*([\d,]+\.?\d*)$/)) {
                        const priceMatch = nextItem.text.match(/^RM\s*([\d,]+\.?\d*)$/);
                        price = parseFloat(priceMatch[1].replace(/,/g, ''));
                    }
                }
                
                if (productName && quantity > 0 && price > 0) {
                    // Extract size from product name
                    const sizeMatch = productName.match(/\(Size:\s*([^)]+)\)|\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL)\b/i);
                    const size = sizeMatch ? (sizeMatch[1] || sizeMatch[2]) : 'Unknown';
                    
                    products.push({
                        sku: sku,
                        product_name: productName,
                        base_name: productName.replace(/\s*-\s*\(Size:[^)]+\)/i, '').trim(),
                        size: size,
                        quantity: quantity,
                        price: price,
                        type: 'Standard'
                    });
                }
            }
        });
    });
    
    return products;
}

/**
 * Extract products from lines sebagai fallback terakhir
 */
function extractProductsFromLines(fullText) {
    const products = [];
    const lines = fullText.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);
    
    lines.forEach(line => {
        // Look for lines that contain both SKU and price
        if (line.match(/BZ[LP]\d{2}[A-Z]{2}/) && line.match(/RM\s*[\d,]+/)) {
            const skuMatch = line.match(/(BZ[LP]\d{2}[A-Z]{2})/);
            const priceMatch = line.match(/RM\s*([\d,]+\.?\d*)/);
            
            if (skuMatch && priceMatch) {
                const sku = skuMatch[1];
                const price = parseFloat(priceMatch[1].replace(/,/g, ''));
                
                // Extract quantity (number before RM)
                const quantityMatch = line.match(/(\d+)\s+RM/);
                const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
                
                // Extract product name (text between SKU and quantity)
                let productName = line
                    .replace(sku, '')
                    .replace(/RM\s*[\d,]+\.?\d*/, '')
                    .replace(/\d+\s*$/, '')
                    .trim();
                
                if (productName.length < 5) {
                    productName = `Product ${sku}`;
                }
                
                // Extract size
                const sizeMatch = productName.match(/\(Size:\s*([^)]+)\)|\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL)\b/i);
                const size = sizeMatch ? (sizeMatch[1] || sizeMatch[2]) : 'Unknown';
                
                products.push({
                    sku: sku,
                    product_name: productName,
                    base_name: productName.replace(/\s*-\s*\(Size:[^)]+\)/i, '').trim(),
                    size: size,
                    quantity: quantity,
                    price: price,
                    type: 'Standard'
                });
            }
        }
    });
    
    return products;
}

/**
 * Basic product extraction untuk cases yang sangat simple
 */
function extractBasicProducts(fullText) {
    // Create basic product entry jika tiada detailed products ditemui
    const totalMatch = fullText.match(/Total Paid:\s*RM\s*([\d,]+\.?\d*)/i) ||
                      fullText.match(/Total:\s*RM\s*([\d,]+\.?\d*)/i);
    
    if (totalMatch) {
        const amount = parseFloat(totalMatch[1].replace(/,/g, ''));
        
        return [{
            sku: 'MIXED',
            product_name: 'Mixed Products dari PDF',
            base_name: 'Mixed Products',
            size: 'Mixed',
            quantity: 1,
            price: amount,
            type: 'Standard'
        }];
    }
    
    return [];
}

/**
 * Create Firestore-compatible structured products (NO MAP OBJECTS)
 * @param {Array} products Raw products array
 * @returns {Array} Structured products for display (plain objects only)
 */
function createFirestoreCompatibleProducts(products) {
    const productGroups = {}; // Use plain object instead of Map
    
    // Group products by base name
    products.forEach(product => {
        const baseName = product.base_name || product.product_name;
        
        if (!productGroups[baseName]) {
            productGroups[baseName] = {
                name: baseName,
                sku: product.sku,
                totalQty: 0,
                sizes: {}, // Use plain object instead of Map
                type: product.type,
                products: []
            };
        }
        
        const group = productGroups[baseName];
        group.totalQty += product.quantity;
        group.products.push(product);
        
        // Add to sizes object
        if (group.sizes[product.size]) {
            group.sizes[product.size] += product.quantity;
        } else {
            group.sizes[product.size] = product.quantity;
        }
    });
    
    // Convert to array dengan sorted sizes (plain objects only)
    const structuredProducts = Object.values(productGroups).map(group => ({
        name: group.name,
        sku: group.sku,
        totalQty: group.totalQty,
        type: group.type,
        products: group.products,
        sizeBreakdown: Object.entries(group.sizes)
            .map(([size, qty]) => ({ size, quantity: qty }))
            .sort((a, b) => sortSizes(a.size, b.size)),
        // Store sizes as plain object for Firestore
        sizesObject: group.sizes
    }));
    
    return structuredProducts;
}

/**
 * Parse product section dengan enhanced detection
 * @param {string} sectionText Text dari section Ready Stock atau Pre-Order
 * @param {string} type Type produk (Ready Stock / Pre-Order)
 * @returns {Array} Array of parsed products (plain objects only)
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
        
        // Create plain object (no Map, no complex objects)
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
            
            // Create plain object (no Map, no complex objects)
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
 * Enhanced debugging function untuk troubleshooting
 */
function debugPdfExtraction(fullText, extractionResults) {
    console.log('=== PDF EXTRACTION DEBUG ===');
    console.log('Full text length:', fullText.length);
    console.log('First 1000 characters:', fullText.substring(0, 1000));
    console.log('Extraction results:', extractionResults);
    
    // Check for common patterns
    const patterns = {
        'Invoice patterns': /invoice/gi,
        'Amount patterns': /rm\s*[\d,]+/gi,
        'Product patterns': /bz[lp]\d{2}[a-z]{2}/gi,
        'Size patterns': /size:\s*[a-z0-9]+/gi,
        'Date patterns': /\d{1,2}\/\d{1,2}\/\d{4}/gi
    };
    
    Object.entries(patterns).forEach(([name, pattern]) => {
        const matches = fullText.match(pattern);
        console.log(`${name}:`, matches ? matches.length : 0, 'matches');
        if (matches && matches.length > 0) {
            console.log('Sample matches:', matches.slice(0, 3));
        }
    });
    
    console.log('=== END DEBUG ===');
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

/**
 * Detect source of CSV file
 */
function detectSource(csvText) {
    const headers = csvText.split('\n')[0].toLowerCase();
    
    if (headers.includes('recipient') && headers.includes('order id')) {
        return 'shopee';
    } else if (headers.includes('buyer name') && headers.includes('order number')) {
        return 'tiktok';
    } else if (headers.includes('tarikh') && headers.includes('code_kain')) {
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

// Export functions untuk integration
window.parsePdfInvoice = parsePdfInvoice;
window.showEnhancedExtractedPreview = showEnhancedExtractedPreview;