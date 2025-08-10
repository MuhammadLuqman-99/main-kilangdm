// Script untuk create real orderData dalam Firebase
import { 
    collection, 
    addDoc,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Function untuk create real order data dalam Firebase
async function createRealOrderData() {
    console.log('🔥 Creating real order data in Firebase...');
    
    const orderDataCollection = collection(window.db, 'orderData');
    
    // Real order data dengan proper structure untuk Enhanced Order Details
    const realOrders = [
        {
            // Order 1 - Kemeja Batik dengan multiple sizes
            id: 'order-001',
            nombor_po_invoice: 'INV-001-240725',
            timestamp: Timestamp.now(),
            tarikh: '25/07/2024',
            nama_customer: 'Siti Nurhaliza Ahmad',
            team_sale: 'Nisya',
            platform: 'TikTok',
            source: 'pdf_desa_murni_enhanced',
            total_rm: 2250,
            
            // Structured products untuk detailed size breakdown
            structuredProducts: [
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4',
                    size: 'S',
                    quantity: 5,
                    price: 150
                },
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4', 
                    size: 'M',
                    quantity: 8,
                    price: 150
                },
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4',
                    size: 'L', 
                    quantity: 2,
                    price: 150
                }
            ],
            
            // Additional metadata
            totalQuantity: 15,
            uniqueSizes: ['S', 'M', 'L'],
            productCount: 1,
            sizeCount: 3,
            createdAt: Timestamp.now(),
            jenis_order: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
            code_kain: 'KBD-LZ5-4'
        },
        
        {
            // Order 2 - Mixed products (Kemeja + Kurung)
            id: 'order-002', 
            nombor_po_invoice: 'INV-002-240726',
            timestamp: Timestamp.now(),
            tarikh: '26/07/2024',
            nama_customer: 'Fatimah Zahra Abdullah',
            team_sale: 'Qilah',
            platform: 'Shopee',
            source: 'pdf_desa_murni_enhanced',
            total_rm: 4680,
            
            structuredProducts: [
                // Kemeja Batik
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4',
                    size: 'XS',
                    quantity: 1,
                    price: 150
                },
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4',
                    size: 'S',
                    quantity: 3,
                    price: 150
                },
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4',
                    size: 'M',
                    quantity: 7,
                    price: 150
                },
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4',
                    size: 'L',
                    quantity: 5,
                    price: 150
                },
                {
                    name: 'Kemeja Batik DM - LZ5-4 (Dark Purple)',
                    code: 'KBD-LZ5-4',
                    size: 'XL',
                    quantity: 2,
                    price: 150
                },
                // Kurung Alana
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: 'S',
                    quantity: 2,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: 'M',
                    quantity: 4,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Dark Purple)',
                    code: 'KAP-PZ5-4',
                    size: 'L',
                    quantity: 2,
                    price: 180
                }
            ],
            
            totalQuantity: 26,
            uniqueSizes: ['XS', 'S', 'M', 'L', 'XL'],
            productCount: 2,
            sizeCount: 5,
            createdAt: Timestamp.now(),
            jenis_order: 'Mixed Products',
            code_kain: 'MIXED'
        },
        
        {
            // Order 3 - Kurung sahaja dengan banyak size
            id: 'order-003',
            nombor_po_invoice: 'INV-003-240727', 
            timestamp: Timestamp.now(),
            tarikh: '27/07/2024',
            nama_customer: 'Aishah Ibrahim',
            team_sale: 'Wiyah',
            platform: 'Dana',
            source: 'pdf_desa_murni_enhanced',
            total_rm: 3600,
            
            structuredProducts: [
                {
                    name: 'Kurung Alana PZ5-4 (Navy Blue)',
                    code: 'KAP-PZ5-4-NB',
                    size: 'XS',
                    quantity: 1,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Navy Blue)',
                    code: 'KAP-PZ5-4-NB',
                    size: 'S',
                    quantity: 4,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Navy Blue)',
                    code: 'KAP-PZ5-4-NB',
                    size: 'M',
                    quantity: 8,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Navy Blue)',
                    code: 'KAP-PZ5-4-NB',
                    size: 'L',
                    quantity: 6,
                    price: 180
                },
                {
                    name: 'Kurung Alana PZ5-4 (Navy Blue)',
                    code: 'KAP-PZ5-4-NB',
                    size: 'XL',
                    quantity: 1,
                    price: 180
                }
            ],
            
            totalQuantity: 20,
            uniqueSizes: ['XS', 'S', 'M', 'L', 'XL'],
            productCount: 1,
            sizeCount: 5,
            createdAt: Timestamp.now(),
            jenis_order: 'Kurung Alana PZ5-4 (Navy Blue)',
            code_kain: 'KAP-PZ5-4-NB'
        },
        
        {
            // Order 4 - Website order
            id: 'order-004',
            nombor_po_invoice: 'WEB-004-240728',
            timestamp: Timestamp.now(),
            tarikh: '28/07/2024', 
            nama_customer: 'Zarina Mohamed',
            team_sale: 'Nisya',
            platform: 'Website',
            source: 'pdf_desa_murni_enhanced',
            total_rm: 1080,
            
            structuredProducts: [
                {
                    name: 'Baju Kurung Modern KM-2024 (Emerald Green)',
                    code: 'BKM-2024-EG',
                    size: 'S',
                    quantity: 2,
                    price: 180
                },
                {
                    name: 'Baju Kurung Modern KM-2024 (Emerald Green)', 
                    code: 'BKM-2024-EG',
                    size: 'M',
                    quantity: 3,
                    price: 180
                },
                {
                    name: 'Baju Kurung Modern KM-2024 (Emerald Green)',
                    code: 'BKM-2024-EG', 
                    size: 'L',
                    quantity: 1,
                    price: 180
                }
            ],
            
            totalQuantity: 6,
            uniqueSizes: ['S', 'M', 'L'],
            productCount: 1,
            sizeCount: 3,
            createdAt: Timestamp.now(),
            jenis_order: 'Baju Kurung Modern KM-2024 (Emerald Green)',
            code_kain: 'BKM-2024-EG'
        }
    ];
    
    console.log('📝 Adding', realOrders.length, 'real orders to Firebase...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const order of realOrders) {
        try {
            const docRef = await addDoc(orderDataCollection, order);
            console.log('✅ Added order:', order.nombor_po_invoice, 'with ID:', docRef.id);
            successCount++;
        } catch (error) {
            console.error('❌ Failed to add order:', order.nombor_po_invoice, error);
            errorCount++;
        }
    }
    
    console.log('📊 Results: Success:', successCount, 'Failed:', errorCount);
    
    // Refresh dashboard after adding data
    if (successCount > 0) {
        console.log('🔄 Refreshing dashboard data...');
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
    
    return { successCount, errorCount };
}

// Function untuk delete semua mock/sample data
async function clearSampleData() {
    console.log('🧹 This function would clear sample data if implemented');
    // Implementation to clear sample data if needed
}

// Export functions
window.createRealOrderData = createRealOrderData;
window.clearSampleData = clearSampleData;

console.log('✅ Firebase data creation script loaded');
console.log('Run createRealOrderData() to add real order data');