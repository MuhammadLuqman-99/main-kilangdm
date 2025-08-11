// Security Manager for KilangDM Dashboard
// Handles input validation, XSS prevention, and security best practices

class SecurityManager {
    constructor() {
        this.sanitizers = new Map();
        this.validators = new Map();
        this.securityPolicies = new Map();
        this.blockedPatterns = new Set();
        this.isInitialized = false;
        
        this.initialize();
    }

    initialize() {
        if (this.isInitialized) return;
        
        // Set up security policies
        this.setupSecurityPolicies();
        
        // Initialize sanitizers
        this.setupSanitizers();
        
        // Initialize validators
        this.setupValidators();
        
        // Set up input monitoring
        this.setupInputMonitoring();
        
        // Set up CSP monitoring
        this.setupCSPMonitoring();
        
        this.isInitialized = true;
        
        if (window.logger) {
            window.logger.info('Security Manager initialized');
        }
    }

    setupSecurityPolicies() {
        // Define security policies for different input types
        this.securityPolicies.set('email', {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            maxLength: 254,
            allowedChars: /[a-zA-Z0-9@._-]/,
            sanitize: true
        });

        this.securityPolicies.set('phone', {
            pattern: /^[\+]?[0-9\s\-\(\)]{8,}$/,
            maxLength: 20,
            allowedChars: /[0-9\s\-\(\)\+]/,
            sanitize: true
        });

        this.securityPolicies.set('name', {
            pattern: /^[a-zA-Z\s\-']{2,50}$/,
            maxLength: 50,
            allowedChars: /[a-zA-Z\s\-']/,
            sanitize: true
        });

        this.securityPolicies.set('amount', {
            pattern: /^[0-9]+(\.[0-9]{1,2})?$/,
            maxLength: 15,
            allowedChars: /[0-9.]/,
            sanitize: true
        });

        this.securityPolicies.set('text', {
            pattern: /^[\w\s\-.,!?()]{1,1000}$/,
            maxLength: 1000,
            allowedChars: /[\w\s\-.,!?()]/,
            sanitize: true
        });

        // Blocked patterns for XSS and injection attacks
        this.blockedPatterns.add(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi);
        this.blockedPatterns.add(/javascript:/gi);
        this.blockedPatterns.add(/on\w+\s*=/gi);
        this.blockedPatterns.add(/data:text\/html/gi);
        this.blockedPatterns.add(/vbscript:/gi);
        this.blockedPatterns.add(/expression\s*\(/gi);
        this.blockedPatterns.add(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi);
        this.blockedPatterns.add(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi);
        this.blockedPatterns.add(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi);
    }

    setupSanitizers() {
        // HTML sanitizer
        this.sanitizers.set('html', (input) => {
            if (typeof input !== 'string') return '';
            
            // Remove all HTML tags
            let sanitized = input.replace(/<[^>]*>/g, '');
            
            // Remove blocked patterns
            this.blockedPatterns.forEach(pattern => {
                sanitized = sanitized.replace(pattern, '');
            });
            
            // Encode special characters
            sanitized = this.htmlEncode(sanitized);
            
            return sanitized;
        });

        // SQL injection sanitizer
        this.sanitizers.set('sql', (input) => {
            if (typeof input !== 'string') return '';
            
            // Remove SQL keywords and special characters
            const sqlKeywords = [
                'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
                'UNION', 'EXEC', 'EXECUTE', 'SCRIPT', 'DECLARE', 'CAST', 'CONVERT'
            ];
            
            let sanitized = input;
            sqlKeywords.forEach(keyword => {
                const regex = new RegExp(keyword, 'gi');
                sanitized = sanitized.replace(regex, '');
            });
            
            // Remove special characters
            sanitized = sanitized.replace(/[;'"\\]/g, '');
            
            return sanitized;
        });

        // XSS sanitizer
        this.sanitizers.set('xss', (input) => {
            if (typeof input !== 'string') return '';
            
            // Remove script tags and attributes
            let sanitized = input
                .replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/<script[^>]*>/gi, '')
                .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/vbscript:/gi, '');
            
            // Encode HTML entities
            sanitized = this.htmlEncode(sanitized);
            
            return sanitized;
        });

        // URL sanitizer
        this.sanitizers.set('url', (input) => {
            if (typeof input !== 'string') return '';
            
            // Only allow http, https, and relative URLs
            const allowedProtocols = /^(https?:\/\/|\/|\.\/|\.\.\/)/;
            if (!allowedProtocols.test(input)) {
                return '';
            }
            
            // Remove javascript: and data: URLs
            if (input.toLowerCase().startsWith('javascript:') || 
                input.toLowerCase().startsWith('data:')) {
                return '';
            }
            
            return input;
        });
    }

    setupValidators() {
        // Email validator
        this.validators.set('email', (input) => {
            const policy = this.securityPolicies.get('email');
            return this.validateInput(input, policy);
        });

        // Phone validator
        this.validators.set('phone', (input) => {
            const policy = this.securityPolicies.get('phone');
            return this.validateInput(input, policy);
        });

        // Name validator
        this.validators.set('name', (input) => {
            const policy = this.securityPolicies.get('name');
            return this.validateInput(input, policy);
        });

        // Amount validator
        this.validators.set('amount', (input) => {
            const policy = this.securityPolicies.get('amount');
            return this.validateInput(input, policy);
        });

        // Text validator
        this.validators.set('text', (input) => {
            const policy = this.securityPolicies.get('text');
            return this.validateInput(input, policy);
        });

        // Custom validator creator
        this.validators.set('custom', (input, customPolicy) => {
            return this.validateInput(input, customPolicy);
        });
    }

    setupInputMonitoring() {
        // Monitor form inputs for suspicious content
        document.addEventListener('input', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                this.monitorInput(event.target);
            }
        });

        // Monitor form submissions
        document.addEventListener('submit', (event) => {
            this.validateForm(event.target);
        });
    }

    setupCSPMonitoring() {
        // Monitor Content Security Policy violations
        if ('SecurityPolicyViolationEvent' in window) {
            document.addEventListener('securitypolicyviolation', (event) => {
                this.handleCSPViolation(event);
            });
        }
    }

    validateInput(input, policy) {
        if (!input || !policy) return false;
        
        const value = String(input).trim();
        
        // Check length
        if (value.length > policy.maxLength) {
            return { valid: false, error: `Input too long. Maximum ${policy.maxLength} characters allowed.` };
        }
        
        // Check pattern
        if (policy.pattern && !policy.pattern.test(value)) {
            return { valid: false, error: 'Input format is invalid.' };
        }
        
        // Check allowed characters
        if (policy.allowedChars && !policy.allowedChars.test(value)) {
            return { valid: false, error: 'Input contains invalid characters.' };
        }
        
        // Check for blocked patterns
        for (const pattern of this.blockedPatterns) {
            if (pattern.test(value)) {
                return { valid: false, error: 'Input contains blocked content.' };
            }
        }
        
        return { valid: true, value: value };
    }

    sanitizeInput(input, type = 'html') {
        const sanitizer = this.sanitizers.get(type);
        if (!sanitizer) {
            return this.sanitizers.get('html')(input);
        }
        
        return sanitizer(input);
    }

    htmlEncode(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    monitorInput(inputElement) {
        const value = inputElement.value;
        const type = inputElement.type || 'text';
        
        // Check for suspicious patterns
        let suspicious = false;
        let reason = '';
        
        this.blockedPatterns.forEach(pattern => {
            if (pattern.test(value)) {
                suspicious = true;
                reason = 'Blocked pattern detected';
            }
        });
        
        // Check for SQL injection attempts
        const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION'];
        sqlKeywords.forEach(keyword => {
            if (value.toUpperCase().includes(keyword)) {
                suspicious = true;
                reason = 'SQL injection attempt detected';
            }
        });
        
        if (suspicious) {
            this.handleSuspiciousInput(inputElement, reason);
            
            if (window.logger) {
                window.logger.warn(`Suspicious input detected: ${reason}`, {
                    element: inputElement.name || inputElement.id,
                    value: value.substring(0, 100),
                    type: type
                });
            }
        }
    }

    handleSuspiciousInput(inputElement, reason) {
        // Add visual warning
        inputElement.classList.add('input-warning');
        inputElement.style.borderColor = '#ef4444';
        
        // Show warning message
        this.showInputWarning(inputElement, reason);
        
        // Log the attempt
        this.logSecurityEvent('suspicious_input', {
            element: inputElement.name || inputElement.id,
            reason: reason,
            timestamp: Date.now()
        });
    }

    showInputWarning(inputElement, reason) {
        // Remove existing warning
        const existingWarning = inputElement.parentNode.querySelector('.input-warning-message');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        // Create warning message
        const warning = document.createElement('div');
        warning.className = 'input-warning-message';
        warning.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${reason}</span>
        `;
        warning.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        // Insert after input
        inputElement.parentNode.insertBefore(warning, inputElement.nextSibling);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
            inputElement.classList.remove('input-warning');
            inputElement.style.borderColor = '';
        }, 5000);
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;
        const errors = [];
        
        inputs.forEach(input => {
            const type = input.dataset.validationType || input.type || 'text';
            const validator = this.validators.get(type);
            
            if (validator) {
                const result = validator(input.value);
                if (!result.valid) {
                    isValid = false;
                    errors.push({
                        element: input,
                        error: result.error
                    });
                    
                    // Mark input as invalid
                    input.classList.add('input-error');
                } else {
                    input.classList.remove('input-error');
                }
            }
        });
        
        if (!isValid) {
            this.showFormErrors(errors);
            return false;
        }
        
        return true;
    }

    showFormErrors(errors) {
        // Clear existing error messages
        document.querySelectorAll('.form-error-message').forEach(msg => msg.remove());
        
        errors.forEach(error => {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'form-error-message';
            errorMsg.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>${error.error}</span>
            `;
            errorMsg.style.cssText = `
                color: #ef4444;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;
            
            error.element.parentNode.insertBefore(errorMsg, error.element.nextSibling);
        });
    }

    handleCSPViolation(event) {
        if (window.logger) {
            window.logger.warn('Content Security Policy violation:', {
                violatedDirective: event.violatedDirective,
                blockedURI: event.blockedURI,
                sourceFile: event.sourceFile,
                lineNumber: event.lineNumber
            });
        }
        
        this.logSecurityEvent('csp_violation', {
            directive: event.violatedDirective,
            blockedURI: event.blockedURI,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber,
            timestamp: Date.now()
        });
    }

    logSecurityEvent(type, data) {
        const securityLog = {
            type: type,
            data: data,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store in localStorage for debugging
        const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        existingLogs.push(securityLog);
        
        // Keep only last 100 logs
        if (existingLogs.length > 100) {
            existingLogs.splice(0, existingLogs.length - 100);
        }
        
        localStorage.setItem('security_logs', JSON.stringify(existingLogs));
        
        // Send to monitoring service if configured
        if (window.appConfig?.getFeature('securityMonitoring')) {
            this.sendToSecurityService(securityLog);
        }
    }

    sendToSecurityService(log) {
        // Placeholder for sending security events to monitoring service
        try {
            // Send to security monitoring service
            console.log('Security event logged:', log);
        } catch (error) {
            if (window.logger) {
                window.logger.warn('Failed to send security event:', error);
            }
        }
    }

    // Public methods
    validateAndSanitize(input, type = 'html') {
        const policy = this.securityPolicies.get(type);
        if (!policy) {
            return this.sanitizeInput(input, 'html');
        }
        
        const validation = this.validateInput(input, policy);
        if (!validation.valid) {
            return { valid: false, error: validation.error };
        }
        
        const sanitized = this.sanitizeInput(validation.value, type);
        return { valid: true, value: sanitized };
    }

    getSecurityReport() {
        const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        const recentLogs = logs.slice(-20);
        
        return {
            totalLogs: logs.length,
            recentLogs: recentLogs,
            blockedPatterns: Array.from(this.blockedPatterns).map(p => p.toString()),
            policies: Array.from(this.securityPolicies.keys()),
            timestamp: Date.now()
        };
    }

    clearSecurityLogs() {
        localStorage.removeItem('security_logs');
        if (window.logger) {
            window.logger.info('Security logs cleared');
        }
    }

    addCustomPolicy(name, policy) {
        this.securityPolicies.set(name, policy);
        if (window.logger) {
            window.logger.info(`Custom security policy added: ${name}`);
        }
    }

    addBlockedPattern(pattern) {
        this.blockedPatterns.add(pattern);
        if (window.logger) {
            window.logger.info('Blocked pattern added:', pattern);
        }
    }
}

// Initialize security manager
window.securityManager = new SecurityManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
}
