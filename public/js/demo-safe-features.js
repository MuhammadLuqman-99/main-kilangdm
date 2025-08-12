/**
 * DEMO: How to use Safe Features
 */

// Wait for safe modules to load
setTimeout(() => {
    
    // Demo notifications
    if (window.notify) {
        console.log('🎯 Testing safe notifications...');
        
        setTimeout(() => notify.success('Dashboard loaded successfully!'), 1000);
        setTimeout(() => notify.info('Data refreshed'), 3000);
        setTimeout(() => notify.warning('Network connection slow'), 5000);
    }

    // Demo loading
    if (window.loading) {
        console.log('⏳ Testing safe loading...');
        
        // Test button loading
        const testBtn = document.querySelector('.btn-primary');
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                await loading.wrap(
                    () => new Promise(resolve => setTimeout(resolve, 2000)),
                    { 
                        button: testBtn, 
                        text: 'Saving data...',
                        showOverlay: false
                    }
                );
                notify.success('Data saved successfully!');
            });
        }
    }

    // Demo safe module creation
    safeInit('dashboard-enhancements', ['notifications', 'loading'], function() {
        console.log('✅ Dashboard enhancements loaded with safe dependencies');
        
        return {
            showWelcome() {
                notify.info('Welcome to Enhanced Dashboard!');
            },
            
            async refreshData() {
                return loading.wrap(
                    async () => {
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        return { status: 'success', data: 'Fresh data!' };
                    },
                    { text: 'Refreshing dashboard...', showOverlay: true }
                );
            }
        };
    });

}, 1000);

console.log('🚀 Safe features demo loaded');