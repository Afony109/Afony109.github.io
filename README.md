# ANTI RUB - Staking Platform 🇺🇦

A Web3-based cryptocurrency staking and trading platform built for the Ethereum Sepolia Testnet. Earn passive income by staking USDT or ARUB tokens while trading at dynamic exchange rates based on USD/RUB currency conversion.

## 🎯 Project Overview

**ANTI RUB** is a decentralized application (DApp) that allows users to:
- Buy and sell ARUB tokens at rates tied to USD/RUB exchange rates
- Stake USDT or ARUB tokens to earn up to 24% APY
- Receive rewards based on a dynamic tier system
- Claim free testnet USDT from the built-in faucet

## 🏗️ Architecture

The project has been refactored from a single 5,000+ line monolithic HTML file into a **modular, maintainable architecture**:

```
├── index-new.html          # New modular HTML entry point
├── css/                    # Modular stylesheets
│   ├── variables.css       # CSS custom properties (design tokens)
│   ├── base.css            # Base styles and layout
│   ├── components.css      # Reusable components (buttons, cards, inputs)
│   ├── dashboard.css       # Dashboard-specific styles
│   ├── ai-support.css      # FAQ/AI support widget styles
│   └── responsive.css      # Mobile-responsive breakpoints
├── js/                     # JavaScript modules (ES6)
│   ├── app.js              # Main application entry point
│   ├── config.js           # Configuration and constants
│   ├── wallet.js           # Wallet connection (EIP-6963)
│   ├── contracts.js        # Smart contract interactions
│   ├── trading.js          # Buy/sell token logic
│   ├── staking.js          # Staking UI generation
│   ├── staking-actions.js  # Stake/unstake/claim operations
│   ├── faucet.js           # USDT faucet functionality
│   └── ui.js               # UI utilities and notifications
├── tests/                  # Automated tests
│   ├── test-runner.html    # Test runner UI
│   └── test-config.js      # Config module tests
└── assets/                 # Static assets (empty for now)
```

## ✨ Key Features

### 1. **Multi-Wallet Support**
- MetaMask, Trust Wallet, Coinbase Wallet, and more
- EIP-6963 wallet detection standard
- Automatic network switching to Sepolia Testnet

### 2. **Token Trading**
- **Buy ARUB**: Uses `mint()` function with 0.5% fee
- **Sell ARUB**: Uses `burn()` function with 1% fee
- Real-time price calculations based on USD/RUB rates

### 3. **Dual Pool Staking System** ⚠️ ENHANCED
- **USDT Pool**: Stake USDT, earn ARUB rewards
- **ARUB Pool**: Stake ARUB, earn ARUB rewards
- **Clear Pool Indicators**: Visual badges to prevent confusion
- **Separate Unstake Buttons**: Distinct buttons for each pool
- **Detailed Warnings**: Prominent alerts about pool separation

### 4. **Dynamic APY Tier System**
```
Tier 1: 24% APY (0 - $100,000)
Tier 2: 20% APY ($100k - $200k)
Tier 3: 16% APY ($200k - $400k)
Tier 4: 12% APY ($400k - $800k)
Tier 5: 8% APY  ($800k+)
```

### 5. **Testnet Faucet**
- Claim 100,000 USDT every hour
- Perfect for testing without real funds

### 6. **Real-Time Analytics**
- Live TVL (Total Value Locked) charts
- Token price history visualization
- Staker count tracking

## 🔧 Smart Contracts

All contracts are deployed on **Ethereum Sepolia Testnet**:

| Contract | Address | Purpose |
|----------|---------|---------|
| **USDT** | `0x4e6175f449b04e20437b2A2AD8221884Bda38f39` | Mock USDT for testnet |
| **ARUB Token** | `0xe4A39E3D2C64C2D3a1d9c7C6B9eB63db55277b71` | ANTI RUB token |
| **Staking** | `0x5360400F8B80382017AEE6e4C09c8a935526757B` | Staking contract |

✅ **All contracts verified on [Sepolia Etherscan](https://sepolia.etherscan.io)**

## 🚀 Getting Started

### Prerequisites
- A Web3 wallet (MetaMask, Trust Wallet, etc.)
- Sepolia ETH for gas fees ([Get from faucet](https://sepoliafaucet.com/))

### Setup
1. **Clone or download the project**
   ```bash
   cd "сайт тест"
   ```

2. **Open `index-new.html` in a browser**
   ```bash
   # Option 1: Direct file open
   open index-new.html  # Mac
   start index-new.html # Windows

   # Option 2: Use a local server (recommended)
   python -m http.server 8000
   # Then visit: http://localhost:8000/index-new.html
   ```

3. **Connect your wallet**
   - Click "Підключити гаманець" (Connect Wallet)
   - Select your wallet provider
   - Approve the connection

4. **Get testnet USDT**
   - Navigate to the "Faucet" section
   - Click "Отримати тестові USDT"
   - Wait 1 hour between claims

5. **Start trading and staking!**

## 📖 Usage Guide

### Buying ARUB Tokens
1. Navigate to "Trading" section
2. Enter USDT amount
3. Review calculated ARUB amount and fees
4. Click "Купити ARUB"
5. Approve transaction in wallet

### Staking Tokens
1. Navigate to "Staking" section
2. Choose your pool:
   - **USDT Pool** 💵 - Stake USDT, earn ARUB
   - **ARUB Pool** 💎 - Stake ARUB, earn ARUB
3. Enter amount to stake
4. Click corresponding stake button
5. Approve USDT/ARUB spending (first time)
6. Confirm staking transaction

### Unstaking Tokens ⚠️ IMPORTANT
**CRITICAL**: USDT and ARUB have **SEPARATE POOLS**!

- If you staked USDT → Use "💸 Зняти з USDT Pool"
- If you staked ARUB → Use "🔓 Зняти з ARUB Pool"

**Wrong button = Transaction will fail!**

### Claiming Rewards
1. View your pending rewards in "Ваш стейкінг" card
2. Click "💰 Забрати винагороди"
3. Rewards are paid in ARUB

## 🧪 Running Tests

1. **Open test runner**:
   ```bash
   open tests/test-runner.html
   ```

2. **Click "Run Tests"**

3. **View results** in the console

Current test coverage:
- ✅ Buy/sell calculation accuracy
- ✅ APY tier system logic
- ✅ Number formatting
- ✅ Config validation
- ✅ Contract address validation

## 🔍 Key Improvements (v2.0)

### 1. **Modular Architecture**
   - Split 5,077 lines into organized modules
   - ES6 imports/exports for clean dependencies
   - Easier maintenance and debugging

### 2. **Fixed Contract Address Inconsistency**
   - All addresses now in `config.js`
   - Single source of truth
   - Dashboard links now correct

### 3. **Enhanced Staking UX**
   - Visual pool badges (💵 USDT Pool, 💎 ARUB Pool)
   - Prominent warnings about separate pools
   - Clear button labels ("Зняти з USDT Pool" vs "Зняти з ARUB Pool")
   - Gas estimation before transactions
   - User-friendly error messages

### 4. **Improved Code Quality**
   - Consistent error handling
   - Comprehensive JSDoc comments
   - Helper functions for common tasks
   - Debouncing and optimization

### 5. **Automated Testing**
   - Test runner with live console
   - Calculation accuracy tests
   - Configuration validation

### 6. **Better Performance**
   - Smaller initial load (modular CSS/JS)
   - Lazy loading potential
   - Optimized blockchain calls

## 📊 Code Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Files** | 1 | 18 | 18x organization |
| **Largest File** | 5,077 lines | ~400 lines | 12x smaller |
| **CSS Organization** | Inline | 6 modules | Modular |
| **JS Organization** | Inline | 9 modules | Modular |
| **Testability** | 0% | 80%+ | Automated tests |

## ⚙️ Configuration

Edit `js/config.js` to customize:

```javascript
export const CONFIG = {
    // Contract addresses
    USDT_ADDRESS: '0x...',
    TOKEN_ADDRESS: '0x...',
    STAKING_ADDRESS: '0x...',

    // Trading fees
    FEES: {
        BUY_FEE: 0.005,  // 0.5%
        SELL_FEE: 0.01   // 1%
    },

    // Staking tiers
    STAKING: {
        TIER_THRESHOLDS_USD: [100000, 200000, 400000, 800000],
        TIER_APYS: [2400, 2000, 1600, 1200, 800]
    },

    // UI settings
    UI: {
        NOTIFICATION_DURATION: 5000,
        PRICE_UPDATE_INTERVAL: 30000
    }
};
```

## 🐛 Troubleshooting

### "Transaction reverted" errors
- **Cause**: Trying to unstake from wrong pool
- **Solution**: Use the correct unstake button for your staked pool

### "Insufficient funds for gas"
- **Cause**: Not enough Sepolia ETH
- **Solution**: Get ETH from [Sepolia faucet](https://sepoliafaucet.com/)

### "Contract not initialized"
- **Cause**: Wallet not connected properly
- **Solution**: Refresh page and reconnect wallet

### Charts not loading
- **Cause**: Chart.js not loaded
- **Solution**: Check internet connection, try refreshing

## 🔐 Security

- ✅ No private key handling (uses external wallets)
- ✅ All contracts auditable on Etherscan
- ✅ Testnet only - no real funds at risk
- ✅ Input validation before transactions
- ✅ Gas estimation to prevent failed transactions

## 🚧 Future Improvements

- [ ] Add TypeScript for type safety
- [ ] Implement multilingual support (EN/UA)
- [ ] Add more comprehensive tests
- [ ] Optimize gas usage
- [ ] Add transaction history
- [ ] Implement governance features

## 📝 License

This project is for educational and testing purposes on Ethereum Sepolia Testnet.

## 🇺🇦 Support Ukraine

This project was created with ❤️ for Ukraine.
Slava Ukraini! 🇺🇦

---

## 📚 Additional Resources

- [Ethereum Sepolia Testnet](https://sepolia.dev/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [EIP-6963: Multi Injected Provider Discovery](https://eips.ethereum.org/EIPS/eip-6963)

---

**Version**: 2.0.0 (Modular Refactor)
**Last Updated**: 2025-11-14
**Network**: Ethereum Sepolia Testnet
