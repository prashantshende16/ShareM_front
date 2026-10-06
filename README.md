# F&O Market Screenshot Analysis UI (Frontend)

React + TypeScript + Tailwind CSS web dashboard for Futures & Options market screenshot technical analysis.

## Features
- Multi-timeframe screenshot uploader with image preview, zoom, replace, and delete
- Probability-based scenario cards (Bullish, Bearish, Sideways)
- Interactive Support & Resistance ladder with click-to-copy
- Original chart viewer with zoom, pan, and AI level annotations overlay
- Multi-timeframe synthesis (Daily -> 1H -> 15M -> 5M)
- Time-based price movements (5-15m, 15-30m, 30-60m, 1-2h)
- Potential trade setups (Direction, Entry, Stop Loss, Target 1, Target 2, Risk/Reward) or "NO TRADE"
- Analysis history with filters and side-by-side comparison
- F&O instrument watchlist (NIFTY 50, BANKNIFTY, SENSEX, RELIANCE, TCS, INFY)
- AI provider switcher (OpenAI, Gemini, Claude, Mock)

## Setup & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Application will run at `http://localhost:3000/`.

## Production Build
```bash
npm run build
npm run preview
```
