/**
 * VIEWPOINT - Stock Market Live Candlestick Binary Trading Engine
 * Real-time 60fps Japanese Candlestick Chart, Live Price Ticks & Up/Down Trades
 */
class StockTradingGame {
  constructor(canvasElement, uiCallbacks) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.ui = uiCallbacks;

    this.assets = {
      'BTC/INR': { name: 'Bitcoin / INR', price: 7845000, volatility: 350, decimal: 2 },
      'ETH/INR': { name: 'Ethereum / INR', price: 292000, volatility: 40, decimal: 2 },
      'NIFTY 50': { name: 'Nifty 50 Index', price: 24850, volatility: 4.5, decimal: 2 },
      'GOLD/INR': { name: 'Gold 24K / 10g', price: 74600, volatility: 8.0, decimal: 2 }
    };

    this.currentAssetKey = 'BTC/INR';
    this.currentPrice = this.assets[this.currentAssetKey].price;
    this.startDayPrice = this.currentPrice;
    this.candles = []; // [{ open, high, low, close, time }]
    this.activeTrades = []; // [{ id, asset, direction: 'CALL'|'PUT', entryPrice, amount, expiryTime, timeLeft }]

    this.candleDurationMs = 3000; // 3s per candle
    this.currentCandle = null;
    this.candleStartTime = Date.now();

    this.initCandles();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.startPriceLoop();
    this.startTradeLoop();
    this.renderLoop();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    let w = parent ? parent.clientWidth : 0;
    let h = parent ? parent.clientHeight : 0;
    if (!w || w < 50) w = 540;
    if (!h || h < 50) h = 380;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  setAsset(assetKey) {
    if (!this.assets[assetKey]) return;
    this.currentAssetKey = assetKey;
    this.currentPrice = this.assets[assetKey].price;
    this.startDayPrice = this.currentPrice;
    this.initCandles();
  }

  initCandles() {
    this.candles = [];
    let price = this.currentPrice;
    const count = 35;
    const vol = this.assets[this.currentAssetKey].volatility;

    for (let i = 0; i < count; i++) {
      const open = price;
      const delta = (Math.random() - 0.49) * vol * 2;
      const close = Math.max(open * 0.5, open + delta);
      const high = Math.max(open, close) + Math.random() * vol;
      const low = Math.min(open, close) - Math.random() * vol;
      price = close;
      this.candles.push({ open, high, low, close });
    }

    this.currentPrice = price;
    this.currentCandle = {
      open: price,
      high: price,
      low: price,
      close: price
    };
    this.candleStartTime = Date.now();
  }

  startPriceLoop() {
    setInterval(() => {
      const asset = this.assets[this.currentAssetKey];
      const vol = asset.volatility;
      const change = (Math.random() - 0.495) * (vol * 0.8);
      this.currentPrice = Math.max(1, this.currentPrice + change);

      // Update current candle
      if (this.currentCandle) {
        this.currentCandle.close = this.currentPrice;
        this.currentCandle.high = Math.max(this.currentCandle.high, this.currentPrice);
        this.currentCandle.low = Math.min(this.currentCandle.low, this.currentPrice);
      }

      // Check candle closure
      if (Date.now() - this.candleStartTime >= this.candleDurationMs) {
        this.candles.push({ ...this.currentCandle });
        if (this.candles.length > 40) this.candles.shift();

        this.currentCandle = {
          open: this.currentPrice,
          high: this.currentPrice,
          low: this.currentPrice,
          close: this.currentPrice
        };
        this.candleStartTime = Date.now();
      }

      if (this.ui && this.ui.onPriceTick) {
        const changePercent = ((this.currentPrice - this.startDayPrice) / this.startDayPrice) * 100;
        this.ui.onPriceTick({
          asset: this.currentAssetKey,
          price: this.currentPrice,
          changePercent: changePercent,
          isUp: changePercent >= 0
        });
      }
    }, 200);
  }

  async placeTrade(direction, amount, durationSec = 30) {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) return { success: false, msg: "Invalid amount" };

    if (!window.wallet.hasFunds(amount)) {
      return { success: false, msg: "Insufficient balance for this trade!" };
    }

    try {
      const uid = window.wallet.activeUserId || window.wallet.activeTelegramId || '78912345';
      const apiBase = window.wallet.apiBaseUrl;
      let res = await fetch(`${apiBase}/api/games?action=stock_bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({
          action: 'stock_bet',
          userId: uid,
          direction: direction.toLowerCase(),
          amount: amount,
          entryPrice: this.currentPrice
        })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`${apiBase}/api/game/stock/bet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: uid,
            direction: direction.toLowerCase(),
            amount: amount,
            entry_price: this.currentPrice
          })
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.success && data.balance !== undefined) {
          window.wallet.setServerBalance(data.balance);
        } else {
          window.wallet.deduct(amount);
        }
      } else {
        window.wallet.deduct(amount);
      }
    } catch (e) {
      window.wallet.deduct(amount);
    }

    window.soundEngine.playBet();

    const trade = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 3),
      asset: this.currentAssetKey,
      direction, // 'CALL' or 'PUT'
      entryPrice: this.currentPrice,
      amount,
      durationSec,
      timeLeft: durationSec,
      payoutMultiplier: 1.90 // 90% profit payout
    };

    this.activeTrades.push(trade);

    if (this.ui && this.ui.onTradePlaced) {
      this.ui.onTradePlaced(this.activeTrades);
    }

    return { success: true, trade };
  }

  startTradeLoop() {
    setInterval(() => {
      if (this.activeTrades.length === 0) return;

      for (let i = this.activeTrades.length - 1; i >= 0; i--) {
        const t = this.activeTrades[i];
        t.timeLeft--;

        if (t.timeLeft <= 0) {
          this.settleTrade(t);
          this.activeTrades.splice(i, 1);
        }
      }

      if (this.ui && this.ui.onTradeUpdate) {
        this.ui.onTradeUpdate(this.activeTrades);
      }
    }, 1000);
  }

  settleTrade(trade) {
    const isCall = trade.direction === 'CALL';
    const isWin = isCall ? (this.currentPrice > trade.entryPrice) : (this.currentPrice < trade.entryPrice);
    const isTie = this.currentPrice === trade.entryPrice;

    let payout = 0;
    let multiplier = 0;

    if (isWin) {
      multiplier = trade.payoutMultiplier;
      payout = trade.amount * multiplier;
      window.wallet.addWin(payout);
      window.soundEngine.playGem(4);
    } else if (isTie) {
      multiplier = 1.0;
      payout = trade.amount;
      window.wallet.addWin(payout);
    } else {
      window.soundEngine.playBomb();
    }

    window.wallet.recordBet({
      game: `Stock ${trade.asset}`,
      bet: trade.amount,
      multiplier: multiplier,
      payout: payout,
      won: isWin
    });

    if (this.ui && this.ui.onTradeSettled) {
      this.ui.onTradeSettled({
        trade,
        won: isWin,
        isTie,
        payout,
        closePrice: this.currentPrice
      });
    }
  }

  renderLoop() {
    this.render();
    requestAnimationFrame(() => this.renderLoop());
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    const allCandles = [...this.candles];
    if (this.currentCandle) allCandles.push(this.currentCandle);
    if (allCandles.length === 0) return;

    // Find min / max price for scaling
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    allCandles.forEach(c => {
      minPrice = Math.min(minPrice, c.low);
      maxPrice = Math.max(maxPrice, c.high);
    });

    const padding = (maxPrice - minPrice) * 0.1 || 10;
    minPrice -= padding;
    maxPrice += padding;
    const priceRange = maxPrice - minPrice;

    const getY = (p) => h - ((p - minPrice) / priceRange) * (h - 60) - 30;

    // Draw Grid & Price Labels
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = '11px Inter, sans-serif';

    for (let i = 1; i <= 5; i++) {
      const gridY = (h / 6) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, gridY);
      this.ctx.lineTo(w - 70, gridY);
      this.ctx.stroke();

      const priceVal = maxPrice - (i / 6) * priceRange;
      this.ctx.fillText(priceVal.toFixed(1), w - 65, gridY + 4);
    }

    // Draw Candlesticks
    const candleWidth = Math.max(6, (w - 100) / allCandles.length);
    const spacing = candleWidth * 0.3;

    allCandles.forEach((c, idx) => {
      const x = idx * (candleWidth + spacing) + 20;
      const isGreen = c.close >= c.open;
      const color = isGreen ? '#10b981' : '#ef4444';

      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      // Wick
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(x + candleWidth / 2, highY);
      this.ctx.lineTo(x + candleWidth / 2, lowY);
      this.ctx.stroke();

      // Body
      this.ctx.fillStyle = color;
      const bodyY = Math.min(openY, closeY);
      const bodyH = Math.max(2, Math.abs(closeY - openY));
      this.ctx.fillRect(x, bodyY, candleWidth, bodyH);
    });

    // Draw Current Live Price Line
    const curY = getY(this.currentPrice);
    this.ctx.strokeStyle = '#00e701';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, curY);
    this.ctx.lineTo(w, curY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Live Price Tag
    this.ctx.fillStyle = '#00e701';
    this.ctx.fillRect(w - 80, curY - 10, 75, 20);
    this.ctx.fillStyle = '#0f212e';
    this.ctx.font = 'bold 11px Outfit, sans-serif';
    this.ctx.fillText(this.currentPrice.toFixed(1), w - 75, curY + 4);
  }
}

window.StockTradingGame = StockTradingGame;
