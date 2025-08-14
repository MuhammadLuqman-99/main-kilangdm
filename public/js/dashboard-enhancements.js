// Dashboard-specific enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Enhanced search for dashboard
    document.addEventListener('search', (e) => {
        const searchTerm = e.detail.value.toLowerCase();
        console.log('Dashboard search:', searchTerm);
        
        // Filter visible cards/sections based on search
        if (!searchTerm) {
            // Show all sections
            document.querySelectorAll('section, .kpi-card, .metric-card').forEach(el => {
                el.style.display = '';
            });
        } else {
            // Filter based on text content
            document.querySelectorAll('.kpi-card, .metric-card').forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }
    });
    
    // Dashboard initialization completed - no console output needed
});

// Export functionality integration
document.addEventListener('click', (e) => {
    if (e.target.closest('.export-option')) {
        const option = e.target.closest('.export-option');
        const format = option.getAttribute('data-format');
        const source = option.getAttribute('data-source');
        
        if (typeof kilangDMEnhancements !== 'undefined') {
            console.log(`📊 Exporting ${source} data as ${format.toUpperCase()}...`);
        }
        
        // Close dropdown
        option.closest('.export-dropdown').classList.remove('show');
    }
});