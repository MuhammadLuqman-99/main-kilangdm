// Home button functionality
document.getElementById('homeBtn').addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Mobile menu toggle - Enhanced version
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('mobile-active');
            
            // Update icon
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                if (navLinks.classList.contains('mobile-active')) {
                    icon.className = 'fas fa-times';
                } else {
                    icon.className = 'fas fa-bars';
                }
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('mobile-active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
            }
        });
        
        // Close menu when clicking nav link
        navLinks.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav-link')) {
                navLinks.classList.remove('mobile-active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
            }
        });
    }
});

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ms-MY', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('current-time').textContent = timeString;
}

setInterval(updateCurrentTime, 1000);
updateCurrentTime();