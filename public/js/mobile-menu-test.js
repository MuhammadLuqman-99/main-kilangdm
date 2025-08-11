// Mobile Menu Test Script - Debug mobile menu issues
console.log('🔧 Mobile Menu Debug Script loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Testing mobile menu functionality...');
    
    // Check if elements exist
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    console.log('Mobile Menu Button:', mobileMenuBtn);
    console.log('Nav Links:', navLinks);
    
    if (mobileMenuBtn) {
        console.log('✅ Mobile menu button found');
        console.log('Button styles:', window.getComputedStyle(mobileMenuBtn));
        console.log('Button display:', window.getComputedStyle(mobileMenuBtn).display);
        console.log('Button visibility:', window.getComputedStyle(mobileMenuBtn).visibility);
        console.log('Button z-index:', window.getComputedStyle(mobileMenuBtn).zIndex);
        
        // Add click test
        mobileMenuBtn.addEventListener('click', function(e) {
            console.log('🟢 Mobile menu button clicked!', e);
            console.log('Nav links before toggle:', navLinks.classList.contains('mobile-active'));
            
            // Force toggle for testing
            if (navLinks.classList.contains('mobile-active')) {
                navLinks.classList.remove('mobile-active');
                console.log('🔴 Menu closed');
            } else {
                navLinks.classList.add('mobile-active');
                console.log('🟢 Menu opened');
            }
        });
        
        // Test touch events specifically
        mobileMenuBtn.addEventListener('touchstart', function(e) {
            console.log('👆 Touch start detected on mobile menu button');
        });
        
        mobileMenuBtn.addEventListener('touchend', function(e) {
            console.log('👆 Touch end detected on mobile menu button');
        });
        
    } else {
        console.log('❌ Mobile menu button NOT found');
    }
    
    if (navLinks) {
        console.log('✅ Nav links found');
        console.log('Nav links styles:', window.getComputedStyle(navLinks));
    } else {
        console.log('❌ Nav links NOT found');
    }
    
    // Check viewport
    console.log('📐 Viewport width:', window.innerWidth);
    console.log('📐 Viewport height:', window.innerHeight);
    console.log('📱 User agent:', navigator.userAgent);
    
    // Test CSS media queries
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    console.log('📱 Mobile media query matches:', mobileQuery.matches);
    
    // Add viewport change listener
    window.addEventListener('resize', function() {
        console.log('📐 Viewport changed to:', window.innerWidth, 'x', window.innerHeight);
        console.log('📱 Mobile query now matches:', window.matchMedia('(max-width: 768px)').matches);
    });
});