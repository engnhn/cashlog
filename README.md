# Cashlog

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6.svg)
![Framework](https://img.shields.io/badge/framework-React-61DAFB.svg)
![Desktop](https://img.shields.io/badge/platform-Electron-47848F.svg)
![Database](https://img.shields.io/badge/database-Dexie.js-orange.svg)

> "Money flows. Track it honestly."

**Cashlog** is a privacy-first, desktop personal finance application built on strict principles: Your financial data lives on your machine, encrypted and never leaves without your permission. No cloud sync. No third-party analytics. Just you and your numbers.

## The Problem

Most finance apps want your data in their cloud. They promise convenience but deliver surveillance. Features require subscriptions. Privacy is negotiable. When managing personal finances, these trade-offs are unacceptable.

We don't want clever marketing about "insights powered by AI." We want a tool that records transactions, projects cash flow, and gets out of the way.

## The Solution

This application is built on honest constraints:

1. **Local-First Architecture**: All data stored locally in IndexedDB via Dexie.js. Your transactions never touch a server.
2. **Multi-Currency Support**: Track finances in USD ($), TRY (₺), or EUR (€) with proper locale-awareness.
3. **Recurring Transactions**: Bills and income repeat automatically. Define once, project forever.
4. **Cash Flow Projection**: See your future balance day-by-day. Know when money gets tight before it happens.

## Features

### Core Functionality
- **Transaction Management**: Income and expenses with categories, dates, and descriptions
- **Recurring Transactions**: Daily, weekly, monthly, or yearly schedules with optional end dates
- **Multi-Wallet Support**: Cash, bank accounts, and credit cards with individual balances
- **Bills & Loans**: Track recurring payments with progress indicators for installment loans
- **Financial Calendar**: Visual month view showing transactions and projected balances
- **Cash Flow Analysis**: Day-by-day balance projection highlighting critical periods

### Technical Highlights
- **Offline-First**: Works completely offline, no internet required
- **Type-Safe**: Built with TypeScript for reliability
- **Reactive UI**: State management with Dexie React Hooks
- **Dark Theme**: Professional, eye-comfortable design
- **Internationalization**: English and Turkish language support

## Architecture

The application follows a clean, layered architecture:

- **UI Layer** (React + TypeScript): Components styled with vanilla CSS for maximum control
- **State Layer** (Dexie React Hooks): Reactive queries with automatic re-renders
- **Data Layer** (Dexie.js IndexedDB): Client-side database with schema versioning
- **Business Logic** (TypeScript utilities): Pure functions for calculations and projections

Key design decisions:
- **No framework lock-in**: Vanilla CSS instead of Tailwind for flexibility
- **Minimal dependencies**: Only essential libraries, no bloat
- **Fail-fast validation**: Runtime type checking at data boundaries

## Installation

### Prerequisites
- Node.js 18+ and npm

### Build from Source

```bash
# Clone repository
git clone https://github.com/enginhan/cashlog.git
cd cashlog

# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Package as desktop app
npm run build
# Electron distributables will be in dist/ folder
```

## Usage

### Basic Workflow

1. **Add Wallets**: Create accounts for cash, bank, or credit cards
2. **Record Transactions**: Log income and expenses as they happen
3. **Set Up Recurring Items**: Define bills that repeat monthly
4. **Project Cash Flow**: View future balance to plan ahead
5. **Review Calendar**: See financial activity in monthly view

### Recurring Transactions

Create a transaction that repeats automatically:

1. Click "Add Transaction"
2. Enable "Recurring" toggle
3. Select frequency (daily/weekly/monthly/yearly)
4. Set start date
5. Choose end date or select "Until Canceled"

The transaction will appear on all applicable days in Calendar and Cash Flow views.

### Currency Selection

Change display currency in Settings:
- USD ($): Symbol before amount
- EUR (€): Symbol before amount
- TRY (₺): Symbol after amount

All amounts throughout the app update immediately.

## Development

### Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (Currency)
├── db/              # Database schema and setup
├── locales/         # i18n translation files
├── pages/           # Main application views
└── utils/           # Business logic and calculations
```

### Running Tests

```bash
npm test
```

### Code Style

The codebase follows these principles:
- **Explicit over implicit**: No magic, clear code paths
- **Types everywhere**: TypeScript strict mode enabled
- **Pure functions**: Business logic isolated from UI
- **Minimal comments**: Code should explain itself

## Contributing

Keep it simple. PRs should:
1. Solve one problem clearly
2. Include TypeScript types
3. Maintain offline-first architecture
4. Avoid adding dependencies unless critical

## License

MIT

---

Built with focus. No distractions.
