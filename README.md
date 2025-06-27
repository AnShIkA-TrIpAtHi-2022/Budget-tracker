# 💰 Budget Tracker PWA

A comprehensive personal budget tracking Progressive Web Application built with React.js, featuring dark mode, offline support, and beautiful analytics.

## ✨ Features

### 🏠 Core Functionality
- **Expense Management**: Add, edit, and delete expenses with real-time updates
- **Smart Categories**: Predefined and custom categories with color coding
- **Recurring Expenses**: Automated monthly/weekly/yearly transactions
- **Advanced Analytics**: Interactive charts and spending insights
- **PDF Export**: Generate detailed monthly/weekly reports

### 🎨 User Experience
- **Dark Mode**: Beautiful dark theme with system preference detection
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **PWA Ready**: Installable app with offline capabilities
- **Real-time Updates**: Instant UI updates with local state management
- **Smooth Animations**: Polished transitions and micro-interactions

### 📊 Analytics & Insights
- **Pie Charts**: Category-wise expense distribution
- **Bar Charts**: Daily and weekly spending patterns
- **Line Charts**: Monthly trend analysis
- **Budget Tracking**: Monitor spending against set budgets
- **No-Expense Days**: Track spending-free days

## 🚀 Tech Stack

- **Frontend**: React.js 19+ with Vite
- **Styling**: Tailwind CSS with custom components
- **Charts**: Chart.js with react-chartjs-2
- **PDF**: jsPDF for report generation
- **Date Handling**: date-fns for date manipulation
- **Icons**: Lucide React for consistent iconography
- **PWA**: Service Worker + Web App Manifest

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Open the app in your browser
2. Click the install button (➕) in the address bar
3. Follow the installation prompts

### Mobile (iOS/Android)
1. Open the app in Safari/Chrome
2. Tap the share button
3. Select "Add to Home Screen"

## 🎯 Usage Guide

### Adding Expenses
1. Navigate to the "Add Expense" tab
2. Fill in the date, amount, category, and optional remarks
3. Click "Add Expense" to save

### Managing Categories
1. Go to the "Categories" tab
2. Add new categories with custom colors
3. Edit or delete existing categories

### Setting Up Recurring Expenses
1. Visit the "Recurring" tab
2. Add monthly bills like rent, utilities, etc.
3. Set the cycle (weekly/monthly/yearly)

### Viewing Analytics
1. Open the "Analytics" tab
2. Explore interactive charts and spending insights

### Exporting Reports
1. Go to the "Export" tab
2. Select time period and export to PDF

## 🔧 Data Storage

The app uses localStorage for client-side data persistence. All data remains on your device.

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

⭐ Built with React.js, Tailwind CSS, and Chart.js for comprehensive budget tracking!

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
