// Import fungsi yang diperlukan dari Firestore SDK
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // Initialize file upload functionality
    initializeFileUpload();
    
    // Initialize form submission
    if (window.db) {
        initializeFormSubmission();
    } else {
        console.error("Firestore 'db' instance not found.");
    }

    // Initialize phone formatting
    initializePhoneFormatting();
});

function initializeFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const processingIndicator = document.getElementById('processingIndicator');
    const successIndicator = document.getElementById('successIndicator');

    // Return if elements don't exist (for compatibility with existing pages)
    if (!uploadArea || !fileInput) return;

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop functionality
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
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showFeedback('File terlalu besar! Maksimum 10MB.', 'error');
            return;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            showFeedback('Format file tidak disokong! Gunakan PDF, JPG, PNG, atau TXT.', 'error');
            return;
        }

        // Show processing indicator if it exists
        if (processingIndicator) {
            processingIndicator.classList.add('show');
        }
        if (successIndicator) {
            successIndicator.classList.remove('show');
        }

        // Process file after delay (simulate processing time)
        setTimeout(() => {
            processFile(file);
        }, 2000);
    }

    function processFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const content = e.target.result;
            extractDataFromContent(content, file.type);
        };

        if (file.type.startsWith('image/')) {
            // For images, simulate OCR processing
            simulateImageOCR(file);
        } else if (file.type === 'application/pdf') {
            // For PDFs, simulate with sample data (in production, use PDF.js)
            simulatePDFExtraction();
        } else {
            // For text files
            reader.readAsText(file);
        }
    }

    function simulateImageOCR(file) {
        // Simulate OCR processing time
        setTimeout(() => {
            const sampleData = generateSampleData();
            populateFormFromExtractedData(sampleData);
        }, 1500);
    }

    function simulatePDFExtraction() {
        // Simulate PDF processing with actual invoice data
        const samplePDFContent = `INVOICE
Desa Murni Batik
Invoice: #Inv-100403-210725
21/07/2025 16:36

BILLING ADDRESS:
Azliza Awang Kechik@ Alias
Jabatan Pengurusan Modal Insan Tingkat 41

Contact no: 0104532013
Email: imanmaisarahh@gmail.com

BZL05DR Kemeja Batik DM - LZ5-4 ( Dark Purple ) - (Size: S) 3 RM 264.00
BZP05DR Kurung Alana PZ5-4 ( Dark Purple ) - (Size: M) 16 RM 1,408.00

Sub Total: RM 11,701.00
Shipment Fee: RM 141.00
Total Paid: RM 11,842.00
Customer Note:
*NISYA`;

        setTimeout(() => {
            extractDataFromContent(samplePDFContent, 'application/pdf');
        }, 1000);
    }

    function extractDataFromContent(content, fileType) {
        const extractedData = {};

        try {
            // Extract Invoice Number
            const invoiceMatch = content.match(/Invoice:\s*#?([A-Z0-9\-]+)/i);
            if (invoiceMatch) {
                extractedData.invoice = invoiceMatch[1];
            }

            // Extract Customer Name (from billing address)
            const customerMatch = content.match(/BILLING ADDRESS:\s*([A-Za-z\s@]+?)(?:\n|Jabatan)/i);
            if (customerMatch) {
                extractedData.customer = customerMatch[1].trim();
            }

            // Extract Phone Number
            const phoneMatch = content.match(/Contact no:\s*([0-9]+)/i);
            if (phoneMatch) {
                extractedData.phone = phoneMatch[1];
            }

            // Extract Total Paid
            const totalMatch = content.match(/Total Paid:\s*RM\s*([0-9,]+\.?[0-9]*)/i);
            if (totalMatch) {
                extractedData.total = totalMatch[1].replace(',', '');
            }

            // Extract Date
            const dateMatch = content.match(/(\d{2}\/\d{2}\/\d{4})/);
            if (dateMatch) {
                const dateParts = dateMatch[1].split('/');
                const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                extractedData.date = formattedDate;
            }

            // Extract Product Codes and analyze
            const productCodes = [];
            const productMatches = content.matchAll(/([A-Z]{3}\d{2}[A-Z]{2})\s+([^-]+(?:-[^-]+)*)\s*-.*?(?:Size:\s*([A-Z0-9]+)).*?(\d+)\s+RM\s*([0-9,]+\.?\d*)/gi);
            
            for (const match of productMatches) {
                productCodes.push({
                    code: match[1],
                    name: match[2].trim(),
                    size: match[3],
                    qty: parseInt(match[4]),
                    price: parseFloat(match[5].replace(',', ''))
                });
            }

            // Determine main product type
            if (productCodes.length > 0) {
                const mainProduct = productCodes[0];
                extractedData.codeKain = mainProduct.code;
                
                if (mainProduct.name.includes('Kemeja')) {
                    extractedData.jenisOrder = 'Kemeja Batik';
                } else if (mainProduct.name.includes('Kurung')) {
                    extractedData.jenisOrder = 'Baju Kurung';
                } else {
                    extractedData.jenisOrder = mainProduct.name;
                }
            }

            // Check for team indicator in customer note
            if (content.includes('*NISYA')) {
                extractedData.teamSale = 'Nisya';
            } else if (content.includes('*QILAH')) {
                extractedData.teamSale = 'Qilah';
            } else if (content.includes('*WIYAH')) {
                extractedData.teamSale = 'Wiyah';
            } else if (content.includes('*TIKTOK')) {
                extractedData.teamSale = 'Tiktok';
            } else if (content.includes('*SHOPEE')) {
                extractedData.teamSale = 'Shopee';
            }

            // Default platform for Desa Murni Batik
            extractedData.platform = 'Website Desa Murni';

            populateFormFromExtractedData(extractedData);

        } catch (error) {
            console.error('Error extracting data:', error);
            showFeedback('Gagal memproses invoice. Sila cuba lagi.', 'error');
            if (processingIndicator) {
                processingIndicator.classList.remove('show');
            }
        }
    }

    function generateSampleData() {
        // Generate sample data for image uploads
    function generateSampleData() {
        // Generate sample data for image uploads
        const sampleCustomers = [
            'Siti Aminah binti Abdullah',
            'Ahmad Faizal bin Hassan',
            'Nurul Aina binti Mohd Ali',
            'Muhammad Hafiz bin Omar'
        ];

        const sampleCodes = ['BZL05DR', 'BZP05DR', 'KTB001', 'BTK223'];
        const sampleOrders = ['Kemeja Batik', 'Baju Kurung', 'Kain Batik', 'Selendang'];

        return {
            invoice: 'INV-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(6, '0'),
            customer: sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)],
            phone: '01' + Math.floor(Math.random() * 9) + Math.floor(Math.random() * 90000000 + 10000000),
            total: (Math.random() * 2000 + 100).toFixed(2),
            date: new Date().toISOString().split('T')[0],
            codeKain: sampleCodes[Math.floor(Math.random() * sampleCodes.length)],
            jenisOrder: sampleOrders[Math.floor(Math.random() * sampleOrders.length)],
            platform: 'Website Desa Murni'
        };
    }

    function populateFormFromExtractedData(data) {
        // Hide processing, show success
        if (processingIndicator) {
            processingIndicator.classList.remove('show');
        }
        if (successIndicator) {
            successIndicator.classList.add('show');
            setTimeout(() => {
                successIndicator.classList.remove('show');
            }, 5000);
        }

        // Populate form fields
        if (data.invoice) {
            const invoiceField = document.getElementById('nombor_po_invoice');
            if (invoiceField) invoiceField.value = data.invoice;
        }
        
        if (data.customer) {
            const customerField = document.getElementById('nama_customer');
            if (customerField) customerField.value = data.customer;
        }
        
        if (data.phone) {
            // Format phone number
            let formattedPhone = data.phone;
            if (formattedPhone.length === 10 && formattedPhone.startsWith('01')) {
                formattedPhone = formattedPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
            }
            const phoneField = document.getElementById('nombor_phone');
            if (phoneField) phoneField.value = formattedPhone;
        }
        
        if (data.total) {
            const totalField = document.getElementById('total_rm');
            if (totalField) totalField.value = parseFloat(data.total.replace(',', ''));
        }
        
        if (data.platform) {
            const platformField = document.getElementById('platform');
            if (platformField) {
                // Check if option exists before setting
                const option = Array.from(platformField.options).find(opt => opt.value === data.platform);
                if (option) {
                    platformField.value = data.platform;
                } else {
                    // If exact match not found, try partial match
                    if (data.platform.includes('Website')) {
                        platformField.value = 'Website';
                    }
                }
            }
        }
        
        if (data.date) {
            const dateField = document.getElementById('tarikh');
            if (dateField) dateField.value = data.date;
        }
        
        if (data.codeKain) {
            const codeField = document.getElementById('code_kain');
            if (codeField) codeField.value = data.codeKain;
        }
        
        if (data.jenisOrder) {
            const orderField = document.getElementById('jenis_order');
            if (orderField) orderField.value = data.jenisOrder;
        }
        
        if (data.teamSale) {
            const teamField = document.getElementById('team_sale');
            if (teamField) {
                // Check if option exists before setting
                const option = Array.from(teamField.options).find(opt => opt.value === data.teamSale);
                if (option) {
                    teamField.value = data.teamSale;
                }
            }
        }

        // Show success feedback
        showFeedback('Invoice berjaya diproses! Data telah diisi ke dalam form.', 'success');

        // Log extracted data for debugging
        console.log('Extracted Data:', data);
    }
}

function initializeFormSubmission() {
    const db = window.db;
    const form = document.getElementById('order-form');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        showFeedback('Menghantar data order...', 'info');

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
            
            showFeedback('Data order berjaya dihantar! ✅', 'success');
            
            // Reset form after successful submission
            setTimeout(() => {
                form.reset();
                const dateField = document.getElementById('tarikh');
                if (dateField) dateField.valueAsDate = new Date();
                
                // Hide success indicators
                const successIndicator = document.getElementById('successIndicator');
                if (successIndicator) successIndicator.classList.remove('show');
            }, 2000);

        } catch (error) {
            console.error("Error adding order document: ", error);
            showFeedback('Gagal menghantar data order. Sila cuba lagi. ❌', 'error');
        }
    });
}

function showFeedback(message, type) {
    const feedbackMessage = document.getElementById('feedback-message');
    
    if (!feedbackMessage) return;
    
    feedbackMessage.textContent = message;
    
    // Remove existing classes
    feedbackMessage.className = 'mt-4 text-center';
    
    // Add type-specific classes
    switch(type) {
        case 'success':
            feedbackMessage.classList.add('text-green-400');
            break;
        case 'error':
            feedbackMessage.classList.add('text-red-400');
            break;
        case 'info':
            feedbackMessage.classList.add('text-blue-400');
            break;
        default:
            feedbackMessage.classList.add('text-gray-400');
    }
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        feedbackMessage.textContent = '';
    }, 5000);
}

function initializePhoneFormatting() {
    // Auto-format phone number as user types
    const phoneInput = document.getElementById('nombor_phone');
    
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length >= 3) {
            if (value.length <= 6) {
                value = value.replace(/(\d{3})(\d{0,3})/, '$1-$2');
            } else {
                value = value.replace(/(\d{3})(\d{3})(\d{0,4})/, '$1-$2-$3');
            }
        }
        
        e.target.value = value.substring(0, 12); // Limit to 12 characters (xxx-xxx-xxxx)
    });

    // Auto-format total amount
    const totalInput = document.getElementById('total_rm');
    
    if (!totalInput) return;
    
    totalInput.addEventListener('blur', function(e) {
        let value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            e.target.value = value.toFixed(2);
        }
    });
}

// Global function for clearing form (called from HTML)
window.clearForm = function() {
    const form = document.getElementById('order-form');
    if (form) {
        form.reset();
        const dateField = document.getElementById('tarikh');
        if (dateField) dateField.valueAsDate = new Date();
        
        const feedbackMessage = document.getElementById('feedback-message');
        if (feedbackMessage) feedbackMessage.textContent = '';
        
        const successIndicator = document.getElementById('successIndicator');
        if (successIndicator) successIndicator.classList.remove('show');
    }
}

// Export functions if needed
export { initializeFileUpload, initializeFormSubmission, showFeedback };}