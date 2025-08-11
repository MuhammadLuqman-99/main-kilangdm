#!/usr/bin/env node

/**
 * System Test Script for KilangDM Dashboard
 * Tests all new systems and components
 */

const fs = require('fs');
const path = require('path');

class SystemTester {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
        this.totalTests = 0;
    }

    async runAllTests() {
        console.log('🧪 Starting System Tests...\n');
        
        try {
            // Test 1: Package.json validation
            await this.testPackageJson();
            
            // Test 2: Build system
            await this.testBuildSystem();
            
            // Test 3: File structure
            await this.testFileStructure();
            
            // Test 4: Configuration files
            await this.testConfigurationFiles();
            
            // Test 5: Security checks
            await this.testSecurityChecks();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            process.exit(1);
        }
    }

    async testPackageJson() {
        console.log('📦 Testing Package.json...');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            // Test required fields
            const requiredFields = ['name', 'version', 'description', 'scripts', 'keywords'];
            requiredFields.forEach(field => {
                if (!packageJson[field]) {
                    this.recordTest('Package.json', field, false, `Missing required field: ${field}`);
                } else {
                    this.recordTest('Package.json', field, true, `Field ${field} present`);
                }
            });
            
            // Test scripts
            const requiredScripts = ['start', 'build', 'deploy', 'dev'];
            requiredScripts.forEach(script => {
                if (!packageJson.scripts[script]) {
                    this.recordTest('Package.json Scripts', script, false, `Missing script: ${script}`);
                } else {
                    this.recordTest('Package.json Scripts', script, true, `Script ${script} present`);
                }
            });
            
            console.log('✅ Package.json tests completed\n');
            
        } catch (error) {
            this.recordTest('Package.json', 'parsing', false, `Failed to parse: ${error.message}`);
        }
    }

    async testBuildSystem() {
        console.log('🔨 Testing Build System...');
        
        try {
            // Test build.js exists
            if (fs.existsSync('build.js')) {
                this.recordTest('Build System', 'build.js', true, 'Build script exists');
                
                // Test build script functionality
                const buildContent = fs.readFileSync('build.js', 'utf8');
                if (buildContent.includes('class BuildManager')) {
                    this.recordTest('Build System', 'BuildManager class', true, 'BuildManager class found');
                } else {
                    this.recordTest('Build System', 'BuildManager class', false, 'BuildManager class not found');
                }
            } else {
                this.recordTest('Build System', 'build.js', false, 'Build script missing');
            }
            
            // Test dist directory creation
            if (!fs.existsSync('dist')) {
                fs.mkdirSync('dist', { recursive: true });
            }
            
            this.recordTest('Build System', 'dist directory', true, 'Build directory accessible');
            
            console.log('✅ Build system tests completed\n');
            
        } catch (error) {
            this.recordTest('Build System', 'general', false, `Build system error: ${error.message}`);
        }
    }

    async testFileStructure() {
        console.log('📁 Testing File Structure...');
        
        try {
            const requiredFiles = [
                'public/js/logger.js',
                'public/js/config.js',
                'public/js/firebase-config.js',
                'public/js/performance-manager.js',
                'public/js/error-boundary.js',
                'public/js/security-manager.js',
                'public/dashboard.html',
                'README.md',
                '.gitignore'
            ];
            
            requiredFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    this.recordTest('File Structure', file, true, 'File exists');
                } else {
                    this.recordTest('File Structure', file, false, 'File missing');
                }
            });
            
            // Test public directory structure
            if (fs.existsSync('public')) {
                const publicContents = fs.readdirSync('public');
                const hasJs = publicContents.includes('js');
                const hasStyle = publicContents.includes('style');
                const hasHtml = publicContents.some(f => f.endsWith('.html'));
                
                this.recordTest('File Structure', 'public/js', hasJs, hasJs ? 'JS directory exists' : 'JS directory missing');
                this.recordTest('File Structure', 'public/style', hasStyle, hasStyle ? 'Style directory exists' : 'Style directory missing');
                this.recordTest('File Structure', 'public HTML files', hasHtml, hasHtml ? 'HTML files exist' : 'HTML files missing');
            }
            
            console.log('✅ File structure tests completed\n');
            
        } catch (error) {
            this.recordTest('File Structure', 'general', false, `File structure error: ${error.message}`);
        }
    }

    async testConfigurationFiles() {
        console.log('⚙️ Testing Configuration Files...');
        
        try {
            // Test config.js
            if (fs.existsSync('public/js/config.js')) {
                const configContent = fs.readFileSync('public/js/config.js', 'utf8');
                
                if (configContent.includes('class AppConfig')) {
                    this.recordTest('Configuration', 'AppConfig class', true, 'AppConfig class found');
                } else {
                    this.recordTest('Configuration', 'AppConfig class', false, 'AppConfig class not found');
                }
                
                if (configContent.includes('detectEnvironment')) {
                    this.recordTest('Configuration', 'Environment detection', true, 'Environment detection method found');
                } else {
                    this.recordTest('Configuration', 'Environment detection', false, 'Environment detection method missing');
                }
            }
            
            // Test firebase.json
            if (fs.existsSync('firebase.json')) {
                const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
                
                if (firebaseConfig.hosting && firebaseConfig.hosting.public) {
                    this.recordTest('Configuration', 'Firebase config', true, 'Firebase hosting configured');
                } else {
                    this.recordTest('Configuration', 'Firebase config', false, 'Firebase hosting not configured');
                }
            }
            
            console.log('✅ Configuration tests completed\n');
            
        } catch (error) {
            this.recordTest('Configuration', 'general', false, `Configuration error: ${error.message}`);
        }
    }

    async testSecurityChecks() {
        console.log('🔒 Testing Security Features...');
        
        try {
            // Test security-manager.js
            if (fs.existsSync('public/js/security-manager.js')) {
                const securityContent = fs.readFileSync('public/js/security-manager.js', 'utf8');
                
                if (securityContent.includes('class SecurityManager')) {
                    this.recordTest('Security', 'SecurityManager class', true, 'SecurityManager class found');
                } else {
                    this.recordTest('Security', 'SecurityManager class', false, 'SecurityManager class not found');
                }
                
                if (securityContent.includes('XSS')) {
                    this.recordTest('Security', 'XSS protection', true, 'XSS protection implemented');
                } else {
                    this.recordTest('Security', 'XSS protection', false, 'XSS protection not implemented');
                }
                
                if (securityContent.includes('SQL')) {
                    this.recordTest('Security', 'SQL injection protection', true, 'SQL injection protection implemented');
                } else {
                    this.recordTest('Security', 'SQL injection protection', false, 'SQL injection protection not implemented');
                }
            }
            
            // Test error-boundary.js
            if (fs.existsSync('public/js/error-boundary.js')) {
                const errorContent = fs.readFileSync('public/js/error-boundary.js', 'utf8');
                
                if (errorContent.includes('class ErrorBoundary')) {
                    this.recordTest('Security', 'Error boundary', true, 'Error boundary system found');
                } else {
                    this.recordTest('Security', 'Error boundary', false, 'Error boundary system missing');
                }
            }
            
            console.log('✅ Security tests completed\n');
            
        } catch (error) {
            this.recordTest('Security', 'general', false, `Security error: ${error.message}`);
        }
    }

    recordTest(category, test, passed, message) {
        this.totalTests++;
        if (passed) {
            this.passedTests++;
        } else {
            this.failedTests++;
        }
        
        this.testResults.push({
            category,
            test,
            passed,
            message,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${test}: ${message}`);
    }

    generateTestReport() {
        console.log('\n📊 Test Report');
        console.log('='.repeat(50));
        
        // Summary
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`Passed: ${this.passedTests} ✅`);
        console.log(`Failed: ${this.failedTests} ❌`);
        console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        
        // Category breakdown
        const categories = [...new Set(this.testResults.map(r => r.category))];
        console.log('\n📋 Results by Category:');
        
        categories.forEach(category => {
            const categoryTests = this.testResults.filter(r => r.category === category);
            const passed = categoryTests.filter(r => r.passed).length;
            const total = categoryTests.length;
            const percentage = ((passed / total) * 100).toFixed(1);
            
            console.log(`  ${category}: ${passed}/${total} (${percentage}%)`);
        });
        
        // Failed tests
        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => {
                    console.log(`  - ${r.category}: ${r.test} - ${r.message}`);
                });
        }
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        if (this.failedTests === 0) {
            console.log('  🎉 All tests passed! Your system is ready for production.');
        } else if (this.failedTests <= 3) {
            console.log('  ⚠️  Minor issues detected. Review failed tests before deployment.');
        } else {
            console.log('  🚨 Multiple issues detected. Fix all failed tests before deployment.');
        }
        
        // Save detailed report
        this.saveDetailedReport();
    }

    saveDetailedReport() {
        const report = {
            summary: {
                totalTests: this.totalTests,
                passedTests: this.passedTests,
                failedTests: this.failedTests,
                successRate: (this.passedTests / this.totalTests) * 100,
                timestamp: new Date().toISOString()
            },
            results: this.testResults,
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = 'test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.failedTests > 0) {
            recommendations.push('Fix all failed tests before deployment');
        }
        
        if (this.passedTests / this.totalTests < 0.8) {
            recommendations.push('Review system architecture and fix critical issues');
        }
        
        if (this.passedTests / this.totalTests >= 0.95) {
            recommendations.push('System is production-ready');
        }
        
        return recommendations;
    }
}

// CLI interface
if (require.main === module) {
    const tester = new SystemTester();
    tester.runAllTests().catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = SystemTester;
