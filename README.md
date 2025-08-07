# KilangDM - Sistem Pengurusan Data Perniagaan

Platform lengkap untuk memantau prestasi eCommerce, Marketing, dan Sales Team dengan dashboard yang powerful dan mudah digunakan.

## 🚀 Ciri-ciri Utama

- **Dashboard Komprehensif** - Pantau semua metrik penting dalam satu tempat
- **Pengurusan eCommerce** - Jejak jualan, pesanan, dan AOV dari semua saluran
- **Analitik Marketing** - Monitor ROAS, spend, impressions dan klik untuk optimasi kempen
- **Prestasi Sales Team** - Jejak leads, close rate, dan prestasi individual
- **Data Masa Nyata** - Sinkronisasi automatik dengan Firebase
- **Penapisan Lanjutan** - Filter data mengikut tarikh, agent, atau jenis data

## 📁 Struktur Projek

```
dashboard/
├── public/
│   ├── index.html          # Halaman utama/landing page
│   ├── dashboard.html      # Dashboard utama
│   ├── dashboardbo.html    # Dashboard untuk back office
│   ├── ecommerce.html      # Pengurusan data eCommerce
│   ├── marketing.html      # Pengurusan data marketing
│   ├── salesteam.html      # Pengurusan data sales team
│   ├── followup.html       # Sistem follow-up
│   ├── test.html          # Halaman ujian
│   ├── js/                # JavaScript files
│   │   ├── dashboard.js
│   │   ├── ecommerce.js
│   │   ├── marketing.js
│   │   ├── salesteam.js
│   │   ├── followup.js
│   │   ├── enhanced-filter.js
│   │   ├── enhanced-order-detection.js
│   │   ├── improvements.js
│   │   ├── marketing-cost-chart.js
│   │   ├── ready-sync.js
│   │   └── ...
│   └── style/             # CSS files
│       ├── style.css
│       ├── enhanced-dashboard.css
│       ├── improvements.css
│       └── marketing.css
├── dash.css               # CSS utama
├── dash.js               # JavaScript utama
├── firebase.json         # Konfigurasi Firebase
├── package.json          # Dependencies
└── README.md             # Dokumentasi ini
```

## 🛠️ Teknologi

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework CSS**: Tailwind CSS
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Font**: Inter (Google Fonts)

## ⚡ Quick Start

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi Firebase**
   - Setup Firebase project
   - Update konfigurasi Firebase dalam kod JavaScript
   - Deploy menggunakan Firebase CLI

4. **Buka aplikasi**
   - Development: Buka `public/index.html` dalam browser
   - Production: Access via Firebase hosting URL

## 📱 Halaman-halaman Utama

### 🏠 Landing Page (`index.html`)
- Paparan utama KilangDM
- Navigasi ke dashboard dan ciri-ciri
- Akses pantas ke semua modul

### 📊 Dashboard (`dashboard.html`)
- Overview prestasi keseluruhan
- Chart dan graf real-time
- Ringkasan metrik penting

### 🛒 eCommerce (`ecommerce.html`)
- Input data jualan
- Pengurusan pesanan
- Analisis AOV dan conversion

### 📈 Marketing (`marketing.html`)
- Input data iklan dan kempen
- Monitoring ROAS dan spend
- Analisis impressions dan clicks

### 👥 Sales Team (`salesteam.html`)
- Input data agent dan leads
- Tracking close rate
- Prestasi individual team

### 📋 Follow-up (`followup.html`)
- Sistem follow-up pelanggan
- Task management
- Status tracking

## 🔧 Development

### Prerequisites
- Node.js (v14 atau lebih tinggi)
- npm atau yarn
- Firebase CLI
- Browser moden (Chrome, Firefox, Safari, Edge)

### Setup Development Environment
```bash
# Install Tailwind CSS (sudah included via CDN)
npm install -D tailwindcss

# Start development server (optional)
npx serve public
```

### Firebase Configuration
Pastikan konfigurasi Firebase dalam fail JavaScript adalah betul:

```javascript
const firebaseConfig = {
  // Your Firebase config
};
```

## 📈 Data Structure

Sistem menggunakan Firebase Firestore dengan koleksi:
- `ecommerce` - Data jualan dan pesanan
- `marketing` - Data iklan dan kempen
- `salesteam` - Data agent dan leads
- `followups` - Data follow-up pelanggan

## 🎨 Styling

Projek menggunakan:
- **Tailwind CSS** untuk utility-first styling
- **Custom CSS** untuk komponen khusus
- **Inter Font** dari Google Fonts
- **Gradient backgrounds** untuk visual appeal

## 🚀 Deployment

### Firebase Hosting
```bash
# Login ke Firebase
firebase login

# Initialize project
firebase init hosting

# Deploy
firebase deploy
```

### Manual Hosting
Upload semua fail dalam folder `public/` ke web server anda.

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

## 📝 License

Projek ini menggunakan ISC License.

## 📞 Support

Untuk support atau pertanyaan:
- Buka issue dalam repository
- Hubungi development team

---

**KilangDM** - Sistem Pengurusan Data Perniagaan © 2024