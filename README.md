# 📈 Real-time Stock Tracker

A pure JavaScript stock price tracker with technical analysis indicators. Features real-time price simulation, alerts, and comprehensive portfolio analytics.

## ✨ Features

- 📊 Real-time Price Tracking - Live price updates with realistic market simulation
- 📈 Technical Indicators - RSI, MACD, SMA, EMA, Bollinger Bands
- 🚨 Price Alerts - Set target prices and get notifications
- 📋 Watchlist Management - Add/remove stocks from your portfolio
- 📊 Performance Analytics - Track returns, volatility, and trends
- 💾 Data Export/Import - Save and restore your tracking data

## 🚀 Quick Start

node stock-tracker.js


## 🎮 Usage

### Basic Commands
// Add stocks to watchlist
tracker.addToWatchlist('AAPL');           // Basic tracking
tracker.addToWatchlist('TSLA', 250);     // With price alert

// Remove stocks
tracker.removeFromWatchlist('AAPL');

// Get performance report
tracker.getPerformanceReport('TSLA', 7); // 7-day analysis

// Control tracking
tracker.start();  // Start real-time updates
tracker.stop();   // Pause tracking


### Data Management
```javascript
// Export your data
const data = tracker.exportData();

// Import data
tracker.importData(data);
```
Note: This project uses simulated data for demonstration. For production use, integrate with real market data providers.