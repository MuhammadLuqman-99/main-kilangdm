// Telegram Bot Integration for Dashboard
class TelegramBot {
    constructor() {
        this.botToken = '8269216222:AAG1cNvAYcwfCQYfq5eUcdbbun1M0tdQVYk';
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
        this.chatId = '8269216222'; // Fixed Chat ID
        this.isEnabled = true;
        this.messageQueue = [];
        this.isProcessing = false;
        
        this.init();
    }

    async init() {
        try {
            // Test bot connection
            await this.testConnection();
            
            if (window.logger) {
                window.logger.info('Telegram bot initialized successfully');
            } else {
                console.log('Telegram bot initialized successfully');
            }
        } catch (error) {
            if (window.logger) {
                window.logger.error('Failed to initialize Telegram bot:', error);
            } else {
                console.error('Failed to initialize Telegram bot:', error);
            }
            this.isEnabled = false;
        }
    }

    async testConnection() {
        const response = await fetch(`${this.baseUrl}/getMe`);
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error('Invalid bot token or connection failed');
        }
        
        return data.result;
    }

    async sendMessage(text, chatId = null, options = {}) {
        if (!this.isEnabled) {
            console.warn('Telegram bot is disabled');
            return null;
        }

        const targetChatId = chatId || this.chatId;
        if (!targetChatId) {
            console.warn('No chat ID provided for Telegram message');
            return null;
        }

        const messageData = {
            chat_id: targetChatId,
            text: text,
            parse_mode: options.parseMode || 'HTML',
            disable_web_page_preview: options.disableWebPagePreview || true,
            ...options
        };

        try {
            const response = await fetch(`${this.baseUrl}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            const result = await response.json();
            
            if (!result.ok) {
                throw new Error(result.description || 'Failed to send message');
            }

            return result.result;
        } catch (error) {
            if (window.logger) {
                window.logger.error('Failed to send Telegram message:', error);
            } else {
                console.error('Failed to send Telegram message:', error);
            }
            throw error;
        }
    }

    // Queue message for batch sending
    queueMessage(text, chatId = null, options = {}) {
        this.messageQueue.push({ text, chatId, options });
        this.processQueue();
    }

    async processQueue() {
        if (this.isProcessing || this.messageQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            try {
                await this.sendMessage(message.text, message.chatId, message.options);
                // Rate limiting - wait 100ms between messages
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                // Log error but continue processing queue
                console.error('Error processing queued message:', error);
            }
        }

        this.isProcessing = false;
    }

    // Format dashboard data for Telegram
    formatDashboardUpdate(data) {
        const { type, payload, timestamp } = data;
        const time = new Date(timestamp).toLocaleString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            hour12: true
        });

        switch (type) {
            case 'new_order':
                return `🛒 <b>Pesanan Baru</b>\n\n` +
                       `📅 Masa: ${time}\n` +
                       `💰 Jumlah: RM${payload.amount || 'N/A'}\n` +
                       `👤 Pelanggan: ${payload.customer || 'N/A'}\n` +
                       `📦 Produk: ${payload.product || 'N/A'}\n` +
                       `🆔 Order ID: ${payload.orderId || 'N/A'}`;

            case 'payment_received':
                return `💳 <b>Pembayaran Diterima</b>\n\n` +
                       `📅 Masa: ${time}\n` +
                       `💰 Jumlah: RM${payload.amount || 'N/A'}\n` +
                       `👤 Pelanggan: ${payload.customer || 'N/A'}\n` +
                       `🆔 Payment ID: ${payload.paymentId || 'N/A'}`;

            case 'sales_summary':
                return `📊 <b>Ringkasan Jualan Harian</b>\n\n` +
                       `📅 Tarikh: ${time.split(',')[0]}\n` +
                       `💰 Jumlah Jualan: RM${payload.totalSales || '0'}\n` +
                       `🛒 Jumlah Pesanan: ${payload.totalOrders || '0'}\n` +
                       `👥 Pelanggan Baru: ${payload.newCustomers || '0'}`;

            case 'marketing_update':
                return `📢 <b>Kemaskini Marketing</b>\n\n` +
                       `📅 Masa: ${time}\n` +
                       `🎯 Kempen: ${payload.campaign || 'N/A'}\n` +
                       `💰 Kos: RM${payload.cost || 'N/A'}\n` +
                       `📈 ROI: ${payload.roi || 'N/A'}%`;

            default:
                return `📋 <b>Kemaskini Dashboard</b>\n\n` +
                       `📅 Masa: ${time}\n` +
                       `📝 Data: ${JSON.stringify(payload, null, 2)}`;
        }
    }

    // Send dashboard notification
    async sendDashboardNotification(data, chatId = null) {
        if (!this.isEnabled) return;

        try {
            const message = this.formatDashboardUpdate(data);
            await this.sendMessage(message, chatId);
            
            if (window.logger) {
                window.logger.info('Dashboard notification sent to Telegram');
            }
        } catch (error) {
            if (window.logger) {
                window.logger.error('Failed to send dashboard notification:', error);
            }
        }
    }

    // Set default chat ID
    setChatId(chatId) {
        this.chatId = chatId;
        localStorage.setItem('telegram_chat_id', chatId);
    }

    // Get chat ID from storage
    getChatId() {
        return this.chatId || localStorage.getItem('telegram_chat_id');
    }

    // Enable/disable bot
    setEnabled(enabled) {
        this.isEnabled = enabled;
        localStorage.setItem('telegram_bot_enabled', enabled.toString());
    }

    // Check if bot is enabled
    isEnabledCheck() {
        const stored = localStorage.getItem('telegram_bot_enabled');
        return stored !== null ? stored === 'true' : this.isEnabled;
    }
}

// Create global instance
window.telegramBot = new TelegramBot();

// Listen for Firebase data changes and send notifications
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be ready
    window.addEventListener('firebaseReady', function() {
        if (window.db && window.telegramBot) {
            setupFirebaseListeners();
        }
    });
});

async function setupFirebaseListeners() {
    try {
        const { onSnapshot, collection, query, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        
        // Listen for new orders
        const ordersQuery = query(
            collection(window.db, 'orders'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
        
        onSnapshot(ordersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const orderData = change.doc.data();
                    window.telegramBot.sendDashboardNotification({
                        type: 'new_order',
                        payload: {
                            orderId: change.doc.id,
                            amount: orderData.amount,
                            customer: orderData.customerName,
                            product: orderData.productName
                        },
                        timestamp: orderData.timestamp?.toDate() || new Date()
                    });
                }
            });
        });

        // Listen for payment updates
        const paymentsQuery = query(
            collection(window.db, 'payments'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
        
        onSnapshot(paymentsQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const paymentData = change.doc.data();
                    window.telegramBot.sendDashboardNotification({
                        type: 'payment_received',
                        payload: {
                            paymentId: change.doc.id,
                            amount: paymentData.amount,
                            customer: paymentData.customerName
                        },
                        timestamp: paymentData.timestamp?.toDate() || new Date()
                    });
                }
            });
        });

        if (window.logger) {
            window.logger.info('Firebase listeners setup for Telegram notifications');
        }
    } catch (error) {
        if (window.logger) {
            window.logger.error('Failed to setup Firebase listeners:', error);
        }
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramBot;
}