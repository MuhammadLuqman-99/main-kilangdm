# 🚀 KilangDM Dashboard

A comprehensive analytics dashboard for KilangDM with Firebase integration, featuring real-time data visualization, order management, and marketing analytics.

## ✨ Features

- 📊 **Real-time Analytics Dashboard** - Comprehensive business intelligence
- 🛒 **Order Management System** - PDF invoice parsing and order tracking
- 📈 **Marketing Analytics** - Cost analysis, ROI tracking, and performance metrics
- 👥 **Sales Team Management** - Performance tracking and team analytics
- 📱 **Responsive Design** - Mobile-first approach with PWA support
- 🔥 **Firebase Integration** - Real-time database and authentication
- 📊 **Interactive Charts** - Chart.js powered visualizations
- 🎨 **Modern UI/UX** - Professional design with dark theme

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Build Tool**: Custom Node.js build script
- **PWA**: Service Worker, Manifest

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kilangdm/dashboard.git
   cd dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `public/js/config.js` with your Firebase credentials
   - Or set environment variables

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5000
   ```

## 📦 Build & Deploy

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run build:prod
```

### Deploy to Firebase
```bash
# Development deployment
npm run deploy

# Production deployment
npm run deploy:prod
```

### Clean Build Directory
```bash
npm run clean
```

## 🔧 Configuration

### Environment Configuration

The app automatically detects the environment and applies appropriate settings:

- **Development** (`localhost`, `127.0.0.1`): Full debugging, verbose logging
- **Staging** (`*.firebaseapp.com`): Limited logging, performance monitoring
- **Production** (custom domain): Error-only logging, optimized performance

### Manual Debug Toggle

Enable debug mode in production:
```javascript
// In browser console
toggleDebug();
```

### Firebase Configuration

Update `public/js/config.js` with your Firebase project settings:

```javascript
firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    // ... other config
}
```

## 📁 Project Structure

```
dashboard/
├── public/                 # Web assets
│   ├── js/                # JavaScript modules
│   ├── style/             # CSS stylesheets
│   ├── dashboard.html     # Main dashboard
│   ├── ecommerce.html     # Order management
│   └── marketing.html     # Marketing analytics
├── build.js               # Build script
├── package.json           # Dependencies and scripts
├── firebase.json          # Firebase configuration
└── README.md             # This file
```

## 🔍 Key JavaScript Modules

- **`config.js`** - Environment configuration and settings
- **`logger.js`** - Centralized logging with production controls
- **`firebase-config.js`** - Firebase initialization and management
- **`dashboard.js`** - Main dashboard functionality
- **`marketing-cost-chart.js`** - Marketing analytics charts
- **`export-manager.js`** - Data export functionality

## 🎯 Usage

### Dashboard Navigation

1. **Home** - Overview and key metrics
2. **Order Dashboard** - Order management and tracking
3. **Borang Order** - PDF invoice processing
4. **Marketing** - Marketing analytics and ROI
5. **Sales Team** - Team performance metrics
6. **Follow Up** - Customer follow-up management

### Key Features

- **PDF Invoice Processing**: Drag & drop PDF files for automatic order extraction
- **Real-time Updates**: Live data synchronization with Firebase
- **Responsive Design**: Optimized for all device sizes
- **Export Functionality**: CSV, Excel, and PDF export options
- **Advanced Filtering**: Date ranges, team filters, and custom criteria

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Connection Failed**
   - Check internet connection
   - Verify Firebase configuration
   - Check browser console for errors

2. **Charts Not Loading**
   - Ensure Chart.js is loaded
   - Check data availability
   - Verify DOM elements exist

3. **Mobile Menu Issues**
   - Clear browser cache
   - Check mobile-optimization.js
   - Verify CSS media queries

### Debug Mode

Enable debug mode for troubleshooting:
```javascript
// In browser console
toggleDebug();
```

## 📊 Performance Optimization

### Production Build

The production build automatically:
- Removes console.log statements
- Minifies CSS and JavaScript
- Optimizes HTML structure
- Generates build manifest

### Environment-Specific Features

- **Development**: Full debugging, performance monitoring
- **Staging**: Limited logging, performance monitoring
- **Production**: Minimal logging, optimized performance

## 🔒 Security

- Firebase security rules for data access
- Environment-based configuration
- No sensitive data in client-side code
- Secure API key management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the troubleshooting section

## 🗺️ Roadmap

- [ ] User authentication and roles
- [ ] Advanced reporting features
- [ ] API rate limiting
- [ ] Performance monitoring
- [ ] Automated testing
- [ ] CI/CD pipeline

---

**Built with ❤️ by the KilangDM Team**