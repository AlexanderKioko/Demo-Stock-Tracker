class StockTracker {
    constructor() {
        this.watchlist = new Map();
        this.priceHistory = new Map();
        this.indicators = new Map();
        this.alerts = [];
        this.isRunning = false;
        this.updateInterval = 5000; // 5 seconds
        this.maxHistoryLength = 200;
    }

    // Simulate real-time price data (replace with actual API in production)
    generatePriceData(symbol, lastPrice = null) {
        const basePrice = lastPrice || this.getRandomPrice(symbol);
        const volatility = this.getVolatility(symbol);
        const change = (Math.random() - 0.5) * volatility * basePrice;
        const newPrice = Math.max(0.01, basePrice + change);
        
        return {
            symbol: symbol,
            price: Math.round(newPrice * 100) / 100,
            timestamp: Date.now(),
            volume: Math.floor(Math.random() * 1000000) + 100000,
            high: Math.max(basePrice, newPrice),
            low: Math.min(basePrice, newPrice),
            open: basePrice
        };
    }

    getRandomPrice(symbol) {
        const basePrices = {
            'AAPL': 175,
            'GOOGL': 140,
            'MSFT': 380,
            'TSLA': 250,
            'AMZN': 145,
            'META': 320,
            'NVDA': 450,
            'SPY': 440,
            'BTC': 43000,
            'ETH': 2500
        };
        return basePrices[symbol] || 100;
    }

    getVolatility(symbol) {
        const volatilities = {
            'AAPL': 0.02,
            'GOOGL': 0.025,
            'MSFT': 0.02,
            'TSLA': 0.08,
            'AMZN': 0.03,
            'META': 0.04,
            'NVDA': 0.06,
            'SPY': 0.015,
            'BTC': 0.05,
            'ETH': 0.06
        };
        return volatilities[symbol] || 0.03;
    }

    // Add stock to watchlist
    addToWatchlist(symbol, alertPrice = null) {
        symbol = symbol.toUpperCase();
        this.watchlist.set(symbol, {
            symbol: symbol,
            alertPrice: alertPrice,
            addedAt: Date.now()
        });
        
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, []);
        }
        
        console.log(`Added ${symbol} to watchlist${alertPrice ? ` with alert at $${alertPrice}` : ''}`);
        return true;
    }

    // Remove stock from watchlist
    removeFromWatchlist(symbol) {
        symbol = symbol.toUpperCase();
        if (this.watchlist.delete(symbol)) {
            console.log(`❌ Removed ${symbol} from watchlist`);
            return true;
        }
        console.log(`❓ ${symbol} not found in watchlist`);
        return false;
    }

    // Update price data
    updatePrices() {
        for (let [symbol, config] of this.watchlist) {
            const history = this.priceHistory.get(symbol);
            const lastPrice = history.length > 0 ? history[history.length - 1].price : null;
            const newData = this.generatePriceData(symbol, lastPrice);
            
            // Add to history
            history.push(newData);
            if (history.length > this.maxHistoryLength) {
                history.shift();
            }
            
            // Check alerts
            if (config.alertPrice && this.shouldAlert(newData.price, config.alertPrice)) {
                this.triggerAlert(symbol, newData.price, config.alertPrice);
            }
            
            // Calculate technical indicators
            this.calculateIndicators(symbol);
        }
    }

    // Calculate technical indicators
    calculateIndicators(symbol) {
        const history = this.priceHistory.get(symbol);
        if (history.length < 20) return;

        const prices = history.map(data => data.price);
        const volumes = history.map(data => data.volume);
        
        const indicators = {
            sma20: this.calculateSMA(prices, 20),
            sma50: this.calculateSMA(prices, 50),
            ema12: this.calculateEMA(prices, 12),
            ema26: this.calculateEMA(prices, 26),
            rsi: this.calculateRSI(prices, 14),
            macd: this.calculateMACD(prices),
            bollinger: this.calculateBollingerBands(prices, 20, 2),
            volume: volumes[volumes.length - 1],
            volumeAvg: this.calculateSMA(volumes, 20)
        };
        
        this.indicators.set(symbol, indicators);
    }

    // Simple Moving Average
    calculateSMA(prices, period) {
        if (prices.length < period) return null;
        const slice = prices.slice(-period);
        return slice.reduce((sum, price) => sum + price, 0) / period;
    }

    // Exponential Moving Average
    calculateEMA(prices, period) {
        if (prices.length < period) return null;
        
        const multiplier = 2 / (period + 1);
        let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
        
        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return ema;
    }

    // Relative Strength Index
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) {
                gains += change;
            } else {
                losses -= change;
            }
        }
        
        let avgGain = gains / period;
        let avgLoss = losses / period;
        
        for (let i = period + 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) {
                avgGain = ((avgGain * (period - 1)) + change) / period;
                avgLoss = (avgLoss * (period - 1)) / period;
            } else {
                avgGain = (avgGain * (period - 1)) / period;
                avgLoss = ((avgLoss * (period - 1)) - change) / period;
            }
        }
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    // MACD (Moving Average Convergence Divergence)
    calculateMACD(prices) {
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        
        if (!ema12 || !ema26) return null;
        
        const macdLine = ema12 - ema26;
        return {
            macd: macdLine,
            ema12: ema12,
            ema26: ema26
        };
    }

    // Bollinger Bands
    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        const sma = this.calculateSMA(prices, period);
        if (!sma) return null;
        
        const slice = prices.slice(-period);
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        return {
            upper: sma + (standardDeviation * stdDev),
            middle: sma,
            lower: sma - (standardDeviation * stdDev)
        };
    }

    // Alert system
    shouldAlert(currentPrice, alertPrice) {
        return Math.abs(currentPrice - alertPrice) / alertPrice < 0.01; // Within 1%
    }

    triggerAlert(symbol, currentPrice, alertPrice) {
        const alert = {
            symbol: symbol,
            currentPrice: currentPrice,
            alertPrice: alertPrice,
            timestamp: Date.now(),
            message: `🚨 ALERT: ${symbol} reached $${currentPrice} (target: $${alertPrice})`
        };
        
        this.alerts.push(alert);
        console.log(alert.message);
    }

    // Display current portfolio status
    displayPortfolio() {
        console.clear();
        console.log('📈 REAL-TIME STOCK TRACKER');
        console.log('=' .repeat(80));
        
        if (this.watchlist.size === 0) {
            console.log('📭 No stocks in watchlist. Use addToWatchlist("SYMBOL") to start tracking.');
            return;
        }
        
        for (let [symbol] of this.watchlist) {
            const history = this.priceHistory.get(symbol);
            const indicators = this.indicators.get(symbol);
            
            if (history.length === 0) continue;
            
            const current = history[history.length - 1];
            const previous = history.length > 1 ? history[history.length - 2] : current;
            const change = current.price - previous.price;
            const changePercent = (change / previous.price) * 100;
            
            console.log(`\n🎯 ${symbol}`);
            console.log(`   Price: $${current.price.toFixed(2)} ${change >= 0 ? '📈' : '📉'} ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`);
            console.log(`   Volume: ${current.volume.toLocaleString()}`);
            
            if (indicators) {
                console.log(`   SMA20: $${indicators.sma20?.toFixed(2) || 'N/A'}`);
                console.log(`   RSI: ${indicators.rsi?.toFixed(2) || 'N/A'} ${this.getRSISignal(indicators.rsi)}`);
                
                if (indicators.bollinger) {
                    const bb = indicators.bollinger;
                    const position = current.price > bb.upper ? '⬆️' : current.price < bb.lower ? '⬇️' : '➡️';
                    console.log(`   Bollinger: ${position} Upper: $${bb.upper.toFixed(2)} Lower: $${bb.lower.toFixed(2)}`);
                }
                
                if (indicators.macd) {
                    const signal = indicators.macd.macd > 0 ? '🟢' : '🔴';
                    console.log(`   MACD: ${signal} ${indicators.macd.macd.toFixed(4)}`);
                }
            }
        }
        
        // Show recent alerts
        if (this.alerts.length > 0) {
            console.log('\n🔔 RECENT ALERTS:');
            this.alerts.slice(-3).forEach(alert => {
                const time = new Date(alert.timestamp).toLocaleTimeString();
                console.log(`   [${time}] ${alert.message}`);
            });
        }
        
        console.log(`\n⏰ Last updated: ${new Date().toLocaleTimeString()}`);
        console.log('=' .repeat(80));
    }

    getRSISignal(rsi) {
        if (!rsi) return '';
        if (rsi > 70) return '🔴 Overbought';
        if (rsi < 30) return '🟢 Oversold';
        return '🟡 Neutral';
    }

    // Performance analysis
    getPerformanceReport(symbol, days = 7) {
        symbol = symbol.toUpperCase();
        const history = this.priceHistory.get(symbol);
        if (!history || history.length < 2) {
            console.log(`❓ No data available for ${symbol}`);
            return;
        }
        
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        const recentHistory = history.filter(data => data.timestamp > cutoffTime);
        
        if (recentHistory.length < 2) {
            console.log(`❓ Not enough data for ${days}-day analysis of ${symbol}`);
            return;
        }
        
        const prices = recentHistory.map(data => data.price);
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const highPrice = Math.max(...prices);
        const lowPrice = Math.min(...prices);
        
        const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
        const volatility = this.calculateVolatilityFromPrices(prices);
        
        console.log(`\n📊 ${symbol} - ${days} Day Performance Report`);
        console.log(`   Starting Price: $${firstPrice.toFixed(2)}`);
        console.log(`   Current Price: $${lastPrice.toFixed(2)}`);
        console.log(`   Total Return: ${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`);
        console.log(`   High: $${highPrice.toFixed(2)}`);
        console.log(`   Low: $${lowPrice.toFixed(2)}`);
        console.log(`   Volatility: ${(volatility * 100).toFixed(2)}%`);
    }

    calculateVolatilityFromPrices(prices) {
        if (prices.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    // Start real-time tracking
    start() {
        if (this.isRunning) {
            console.log('🔄 Tracker is already running');
            return;
        }
        
        console.log('Starting real-time stock tracker...');
        this.isRunning = true;
        
        this.intervalId = setInterval(() => {
            this.updatePrices();
            this.displayPortfolio();
        }, this.updateInterval);
    }

    // Stop tracking
    stop() {
        if (!this.isRunning) {
            console.log('Tracker is not running');
            return;
        }
        
        console.log('Stopping stock tracker...');
        this.isRunning = false;
        clearInterval(this.intervalId);
    }

    // Export data
    exportData() {
        const exportData = {
            watchlist: Array.from(this.watchlist.entries()),
            priceHistory: Array.from(this.priceHistory.entries()),
            alerts: this.alerts,
            exportedAt: Date.now()
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // Import data
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            this.watchlist = new Map(data.watchlist);
            this.priceHistory = new Map(data.priceHistory);
            this.alerts = data.alerts || [];
            console.log('Data imported successfully');
        } catch (error) {
            console.log('Error importing data:', error.message);
        }
    }
}

// Demo function to showcase the tracker
function runDemo() {
    const tracker = new StockTracker();
    
    console.log('🎯 Stock Tracker Demo Starting...\n');
    
    // Add some popular stocks to watchlist
    tracker.addToWatchlist('AAPL', 180);
    tracker.addToWatchlist('GOOGL');
    tracker.addToWatchlist('TSLA', 200);
    tracker.addToWatchlist('BTC', 45000);
    
    // Start tracking
    tracker.start();
    
    // Set up demo commands
    console.log('\n📝 Available Commands:');
    console.log('tracker.addToWatchlist("SYMBOL", alertPrice)  - Add stock to watchlist');
    console.log('tracker.removeFromWatchlist("SYMBOL")        - Remove stock');
    console.log('tracker.getPerformanceReport("SYMBOL", days) - Get performance report');
    console.log('tracker.stop()                               - Stop tracking');
    console.log('tracker.start()                              - Resume tracking');
    console.log('tracker.exportData()                         - Export all data');
    
    // Make tracker globally available for interaction
    if (typeof window !== 'undefined') {
        window.tracker = tracker;
    } else if (typeof global !== 'undefined') {
        global.tracker = tracker;
    }
    
    return tracker;
}

// Auto-start demo if run directly
if (typeof module !== 'undefined' && require.main === module) {
    runDemo();
}

// Export for use as module
if (typeof module !== 'undefined') {
    module.exports = { StockTracker, runDemo };
}