#!/usr/bin/env node

/**
 * Build Script for KilangDM Dashboard
 * Handles production build process and optimization
 */

const fs = require('fs');
const path = require('path');

class BuildManager {
    constructor() {
        this.sourceDir = 'public';
        this.buildDir = 'dist';
        this.version = this.getVersion();
    }

    getVersion() {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.version;
    }

    async build() {
        console.log('🚀 Starting build process...');
        console.log(`📦 Version: ${this.version}`);
        
        try {
            // Create build directory
            this.ensureBuildDirectory();
            
            // Copy source files
            await this.copySourceFiles();
            
            // Optimize files
            await this.optimizeFiles();
            
            // Generate build manifest
            this.generateBuildManifest();
            
            console.log('✅ Build completed successfully!');
            console.log(`📁 Build output: ${this.buildDir}/`);
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }

    ensureBuildDirectory() {
        if (!fs.existsSync(this.buildDir)) {
            fs.mkdirSync(this.buildDir, { recursive: true });
        }
        
        // Clean build directory
        const files = fs.readdirSync(this.buildDir);
        for (const file of files) {
            const filePath = path.join(this.buildDir, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(filePath);
            }
        }
        
        console.log('🧹 Build directory cleaned');
    }

    async copySourceFiles() {
        const copyRecursive = (src, dest) => {
            if (fs.lstatSync(src).isDirectory()) {
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest, { recursive: true });
                }
                
                const files = fs.readdirSync(src);
                for (const file of files) {
                    const srcPath = path.join(src, file);
                    const destPath = path.join(dest, file);
                    copyRecursive(srcPath, destPath);
                }
            } else {
                fs.copyFileSync(src, dest);
            }
        };

        copyRecursive(this.sourceDir, this.buildDir);
        console.log('📋 Source files copied');
    }

    async optimizeFiles() {
        // Optimize HTML files
        const htmlFiles = this.findFiles('**/*.html');
        for (const file of htmlFiles) {
            await this.optimizeHtml(file);
        }

        // Optimize CSS files
        const cssFiles = this.findFiles('**/*.css');
        for (const file of cssFiles) {
            await this.optimizeCss(file);
        }

        // Optimize JS files
        const jsFiles = this.findFiles('**/*.js');
        for (const file of jsFiles) {
            await this.optimizeJs(file);
        }

        console.log('⚡ Files optimized');
    }

    findFiles(pattern) {
        const files = [];
        const searchDir = (dir, pattern) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    searchDir(fullPath, pattern);
                } else if (pattern === '**/*.html' && item.endsWith('.html')) {
                    files.push(fullPath);
                } else if (pattern === '**/*.css' && item.endsWith('.css')) {
                    files.push(fullPath);
                } else if (pattern === '**/*.js' && item.endsWith('.js')) {
                    files.push(fullPath);
                }
            }
        };
        
        searchDir(this.buildDir, pattern);
        return files;
    }

    async optimizeHtml(filePath) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove comments (except important ones)
        content = content.replace(/<!--(?!\[if|<!\[endif).*?-->/gs, '');
        
        // Remove extra whitespace
        content = content.replace(/\s+/g, ' ');
        content = content.replace(/>\s+</g, '><');
        
        fs.writeFileSync(filePath, content);
    }

    async optimizeCss(filePath) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove comments
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove extra whitespace
        content = content.replace(/\s+/g, ' ');
        content = content.replace(/;\s*}/g, '}');
        content = content.replace(/:\s*/g, ':');
        content = content.replace(/;\s*/g, ';');
        
        fs.writeFileSync(filePath, content);
    }

    async optimizeJs(filePath) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove console.log statements in production
        if (this.isProductionBuild()) {
            content = content.replace(/console\.(log|debug|info)\([^)]*\);?\s*/g, '');
        }
        
        // Remove comments
        content = content.replace(/\/\/.*$/gm, '');
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove extra whitespace
        content = content.replace(/\s+/g, ' ');
        
        fs.writeFileSync(filePath, content);
    }

    isProductionBuild() {
        return process.env.NODE_ENV === 'production';
    }

    generateBuildManifest() {
        const manifest = {
            version: this.version,
            buildTime: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            files: this.getBuildFileList()
        };

        const manifestPath = path.join(this.buildDir, 'build-manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        
        console.log('📋 Build manifest generated');
    }

    getBuildFileList() {
        const files = [];
        const scanDir = (dir, basePath = '') => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relativePath = path.join(basePath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDir(fullPath, relativePath);
                } else {
                    files.push({
                        path: relativePath,
                        size: stat.size,
                        modified: stat.mtime.toISOString()
                    });
                }
            }
        };
        
        scanDir(this.buildDir);
        return files;
    }
}

// CLI interface
if (require.main === module) {
    const buildManager = new BuildManager();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'build':
            buildManager.build();
            break;
        case 'clean':
            if (fs.existsSync(buildManager.buildDir)) {
                fs.rmSync(buildManager.buildDir, { recursive: true, force: true });
                console.log('🧹 Build directory cleaned');
            }
            break;
        default:
            console.log('Usage: node build.js [build|clean]');
            console.log('  build  - Create production build');
            console.log('  clean  - Clean build directory');
            break;
    }
}

module.exports = BuildManager;
