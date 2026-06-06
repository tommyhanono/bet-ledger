# 🎰 BetLedger

A personal gambling & betting tracker — log every session, visualize your P&L, and track your road to breakeven.

## 🔗 Links

- **Live app:** https://tommyhanono.github.io/bet-ledger/
- **GitHub repo:** https://github.com/tommyhanono/bet-ledger

---

## Features

- **Dashboard** — Total P&L, breakeven target, win rate, category recovery progress bars, running P&L line chart, monthly bar chart, recent activity
- **History** — Full sortable/filterable table of all entries with edit & delete; pagination, date range, platform and search filters
- **Analytics** — Win/loss pie charts, avg bet size, biggest wins/losses, best day of week, longest streaks, ROI by category, monthly summary table
- **Settings** — Export to CSV, import from CSV, full data reset

## Categories

| Category | Color | Game types |
|---|---|---|
| Casino | Gold | Blackjack, Roulette, Poker, Slots, Baccarat, Craps |
| Sports Betting | Sky Blue | Moneyline, Spread, Parlay, Over/Under, Prop Bet, Futures |
| Online Gambling | Violet | Crash, Mines, Dice, Plinko, Slots, Stake Originals |

## Data

All data is stored locally in the browser (`localStorage` key: `betledger-v1`). No backend, no account, fully offline after first load.

Pre-seeded with a **-$3,600 starting deficit:**
- Casino: -$2,000
- Sports Betting: -$500
- Online / Stake: -$1,100

## Tech Stack

- React 18 + Vite
- Tailwind CSS v3
- Recharts
- date-fns, uuid
- gh-pages (deployment)

## Local Development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```

Publishes to the `gh-pages` branch and updates the live site.
