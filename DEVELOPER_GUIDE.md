# 👨‍💻 Developer Quick Start Guide

Guide for developers working on the ANTI RUB staking platform.

---

## 🚀 Getting Started (5 minutes)

### 1. Clone and Setup
```bash
# Clone repository (if from Git)
git clone https://github.com/your-username/antirub-staking.git
cd antirub-staking

# Or navigate to existing directory
cd "C:\Users\Admini\OneDrive\Документы\сайт тест"

# No npm install needed - it's a static site!
```

### 2. Start Development Server
```bash
# Python 3 (recommended)
python -m http.server 8000

# Or Python 2
python -m SimpleHTTPServer 8000

# Or Node.js
npx http-server -p 8000
```

### 3. Open in Browser
```
http://localhost:8000/index-new.html
```

### 4. Start Coding!
Open project in your favorite editor:
- **VS Code**: `code .`
- **Sublime**: `subl .`
- **Atom**: `atom .`

---

## 📁 Project Structure

```
📦 antirub-staking/
├── 📄 index-new.html          ← Main entry point
├── 📄 index.html              ← Old version (backup)
├── 📄 README.md               ← User documentation
├── 📄 DEPLOYMENT_GUIDE.md     ← Deployment instructions
├── 📄 DEPLOY_CHECKLIST.md     ← Deployment checklist
├── 📄 DEVELOPER_GUIDE.md      ← This file!
│
├── 📁 css/                    ← Stylesheets
│   ├── variables.css          ← Design tokens (colors, spacing)
│   ├── base.css               ← Base styles (layout, typography)
│   ├── components.css         ← Reusable components
│   ├── dashboard.css          ← Dashboard-specific styles
│   ├── ai-support.css         ← FAQ widget styles
│   └── responsive.css         ← Mobile breakpoints
│
├── 📁 js/                     ← JavaScript modules
│   ├── app.js                 ← ⚡ Main initializer
│   ├── config.js              ← 🔧 Configuration (EDIT THIS FIRST!)
│   ├── wallet.js              ← 💰 Wallet connection
│   ├── contracts.js           ← 📜 Smart contract ABIs
│   ├── trading.js             ← 💱 Buy/sell logic
│   ├── staking.js             ← 🔒 Staking UI
│   ├── staking-actions.js     ← 🔒 Staking operations
│   ├── faucet.js              ← 💧 USDT faucet
│   └── ui.js                  ← 🎨 UI utilities
│
└── 📁 tests/                  ← Testing
    ├── test-runner.html       ← Test UI
    └── test-config.js         ← Config tests
```

---

## 🔧 Development Workflow

### Making Changes

1. **Find the Right Module**
   ```
   Want to change...              Edit this file...
   ───────────────────────────────────────────────────
   Contract addresses          →  js/config.js
   Buy/sell logic              →  js/trading.js
   Staking interface           →  js/staking.js
   Wallet connection           →  js/wallet.js
   Button styles               →  css/components.css
   Colors/spacing              →  css/variables.css
   Mobile responsive           →  css/responsive.css
   ```

2. **Make Your Changes**
   ```bash
   # Edit the file
   code js/config.js

   # Save the file
   # Browser auto-refreshes (if using live server)
   ```

3. **Test Locally**
   ```bash
   # Open in browser
   http://localhost:8000/index-new.html

   # Check browser console (F12)
   # Look for errors

   # Test the feature you changed
   ```

4. **Run Tests**
   ```bash
   # Open test runner
   http://localhost:8000/tests/test-runner.html

   # Click "Run Tests"
   # Verify all pass
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "Fix: [describe what you fixed]"
   git push
   ```

---

## 🎨 Styling Guidelines

### Using CSS Variables
```css
/* Always use CSS variables from variables.css */

/* ✅ GOOD */
.my-component {
    color: var(--ukraine-blue);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
}

/* ❌ BAD - Don't hardcode */
.my-component {
    color: #0057B7;
    padding: 20px;
    border-radius: 12px;
}
```

### Component Structure
```css
/* Components should be self-contained */
.my-component {
    /* Layout */
    display: flex;
    gap: var(--spacing-md);

    /* Box model */
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);

    /* Visual */
    background: var(--card-bg);
    border: 2px solid var(--ukraine-blue);
    border-radius: var(--radius-lg);

    /* Animation */
    transition: var(--transition-normal);
}

.my-component:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
}
```

### Adding New Colors
```css
/* Edit css/variables.css */
:root {
    /* Add new color */
    --new-color: #FF6B00;

    /* Document its use */
    /* Usage: Warning banners, alert states */
}
```

---

## 💻 JavaScript Guidelines

### Module Structure
```javascript
/**
 * My Module
 * Description of what this module does
 */

import { CONFIG } from './config.js';
import { showNotification } from './ui.js';

// Module state (if needed)
let moduleState = null;

/**
 * Initialize module
 */
export function initMyModule() {
    console.log('[MY-MODULE] Initializing...');
    // Setup code
}

/**
 * Public function with JSDoc
 * @param {string} param - Parameter description
 * @returns {boolean} - What it returns
 */
export function myFunction(param) {
    // Implementation
    return true;
}

// Private helper function (not exported)
function helperFunction() {
    // Only used internally
}

// Export for global access (if needed for HTML onclick)
window.myFunction = myFunction;
```

### Error Handling
```javascript
// Always use try-catch for async operations
async function doSomething() {
    try {
        console.log('[MODULE] Starting operation...');

        const result = await someAsyncOperation();

        console.log('[MODULE] ✅ Success:', result);
        showNotification('✅ Operation successful', 'success');

        return result;

    } catch (error) {
        console.error('[MODULE] ❌ Error:', error);

        const message = getErrorMessage(error);
        showNotification(`❌ ${message}`, 'error');

        throw error; // Re-throw if needed
    }
}
```

### Blockchain Interactions
```javascript
// Always check contracts are initialized
async function interactWithContract() {
    const { tokenContract } = getContracts();

    if (!tokenContract) {
        showNotification('❌ Contract not initialized', 'error');
        return;
    }

    try {
        // Estimate gas first
        const gasEstimate = await tokenContract.estimateGas.someFunction();
        console.log('[CONTRACT] Gas estimate:', gasEstimate.toString());

        // Send transaction
        showNotification('🔄 Sending transaction...', 'info');
        const tx = await tokenContract.someFunction();

        console.log('[CONTRACT] TX hash:', tx.hash);

        // Wait for confirmation
        showNotification('⏳ Waiting for confirmation...', 'info');
        await tx.wait();

        showNotification('✅ Transaction confirmed!', 'success');

    } catch (error) {
        console.error('[CONTRACT] Error:', error);
        showNotification(`❌ ${getErrorMessage(error)}`, 'error');
    }
}
```

---

## 🔧 Configuration Management

### Editing Config

**File**: `js/config.js`

```javascript
export const CONFIG = {
    // Contract addresses - VERIFY ON ETHERSCAN!
    USDT_ADDRESS: '0x...',    // ← Change here
    TOKEN_ADDRESS: '0x...',   // ← Change here
    STAKING_ADDRESS: '0x...', // ← Change here

    // Network settings
    NETWORK: {
        name: 'Sepolia',           // ← Network name
        chainId: '0xaa36a7',       // ← Hex chain ID
        chainIdDecimal: 11155111,  // ← Decimal chain ID
    },

    // Trading fees
    FEES: {
        BUY_FEE: 0.005,  // 0.5%
        SELL_FEE: 0.01   // 1%
    },

    // Staking tiers
    STAKING: {
        TIER_THRESHOLDS_USD: [100000, 200000, 400000, 800000],
        TIER_APYS: [2400, 2000, 1600, 1200, 800]
    }
};
```

### Adding New Config Values
```javascript
// 1. Add to CONFIG object
export const CONFIG = {
    // ...existing config...

    // New setting
    MY_NEW_SETTING: {
        value1: 'something',
        value2: 123
    }
};

// 2. Use in other modules
import { CONFIG } from './config.js';

const myValue = CONFIG.MY_NEW_SETTING.value1;
```

---

## 🧪 Testing

### Running Tests
```bash
# Open test runner in browser
http://localhost:8000/tests/test-runner.html

# Click "Run Tests"
# All tests should pass ✅
```

### Writing New Tests
```javascript
// Edit tests/test-config.js

testSuite.test('My new test', function() {
    const result = myFunction(input);

    this.assertEqual(result, expected, 'Should return expected value');
    this.assert(result > 0, 'Result should be positive');
});
```

### Test Types
```javascript
// Equality
this.assertEqual(actual, expected, 'message');

// Truthy
this.assert(condition, 'message');

// Numeric comparison (with tolerance)
this.assertClose(actual, expected, 0.01, 'message');
```

---

## 🐛 Debugging

### Browser Console
```javascript
// Add debugging statements
console.log('[MODULE] Variable:', variable);
console.error('[MODULE] Error:', error);
console.warn('[MODULE] Warning:', warning);

// Use breakpoints
debugger; // Execution pauses here
```

### Network Tab
```
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check for:
   - Failed requests (404, 500)
   - Slow requests (>1s)
   - Blocked requests
```

### Common Issues

**Issue: Function not defined**
```javascript
// ❌ BAD - Not exported
function myFunction() { }

// ✅ GOOD - Exported
export function myFunction() { }

// ✅ GOOD - Available globally for onclick
window.myFunction = myFunction;
```

**Issue: Module not found**
```javascript
// ❌ BAD - Wrong path
import { CONFIG } from 'config.js';

// ✅ GOOD - Correct relative path
import { CONFIG } from './config.js';
```

**Issue: Contract call fails**
```javascript
// Always check:
1. Contract address correct in config.js?
2. Network correct (Sepolia vs Mainnet)?
3. Wallet connected?
4. Enough gas (Sepolia ETH)?
5. Contract function exists in ABI?
```

---

## 🚀 Common Tasks

### Adding a New Feature

1. **Plan the feature**
   - Which module(s) need changes?
   - New module needed?
   - UI changes needed?

2. **Update code**
   ```bash
   # Create new module (if needed)
   touch js/my-feature.js

   # Or edit existing module
   code js/existing-module.js
   ```

3. **Add to app.js**
   ```javascript
   // js/app.js
   import { initMyFeature } from './my-feature.js';

   function initApp() {
       // ...
       initMyFeature(); // Add initialization
       // ...
   }
   ```

4. **Update HTML** (if needed)
   ```html
   <!-- index-new.html -->
   <section id="my-feature">
       <!-- New feature UI -->
   </section>
   ```

5. **Test thoroughly**
   - Local testing
   - Write tests if applicable
   - Cross-browser testing

### Changing Contract Addresses

```javascript
// 1. Edit js/config.js
export const CONFIG = {
    TOKEN_ADDRESS: '0xNEW_ADDRESS_HERE'
};

// 2. Verify on Etherscan
// Visit: https://sepolia.etherscan.io/address/0xNEW_ADDRESS_HERE

// 3. Test all contract interactions
// - Buy tokens
// - Sell tokens
// - Stake
// - Unstake
// - Claim rewards
```

### Updating Styles

```css
/* 1. Find the right CSS file */
/*    Variables: css/variables.css */
/*    Components: css/components.css */
/*    Specific feature: css/[feature].css */

/* 2. Make changes using variables */
.my-element {
    color: var(--ukraine-blue);
    padding: var(--spacing-lg);
}

/* 3. Test responsive */
/*    Check mobile view (F12 → Toggle device toolbar) */
```

---

## 📦 Building for Production

Currently, the project is static (no build step needed).

### Optional: Add Build Tools

If you want minification, bundling, etc:

```bash
# Install build tools
npm init -y
npm install --save-dev vite

# Add to package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## 🤝 Contributing

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-new-feature

# 2. Make changes
# ... edit files ...

# 3. Test locally
# Run tests, check console, test features

# 4. Commit with clear message
git add .
git commit -m "Add: New staking pool feature

- Added BUSD pool support
- Updated UI with new pool badge
- Added tests for BUSD calculations
"

# 5. Push to remote
git push origin feature/my-new-feature

# 6. Create Pull Request on GitHub
```

### Commit Message Format

```
Type: Short description (50 chars max)

Longer description if needed (wrap at 72 chars)
- Bullet points for details
- What changed
- Why it changed

Fixes #123
```

**Types**:
- `Add`: New feature
- `Fix`: Bug fix
- `Update`: Improve existing feature
- `Refactor`: Code restructure
- `Docs`: Documentation only
- `Test`: Add/update tests
- `Style`: CSS/formatting changes

---

## 📚 Resources

### Documentation
- **Ethers.js**: https://docs.ethers.org/v5/
- **Web3 Development**: https://ethereum.org/en/developers/
- **MetaMask**: https://docs.metamask.io/
- **EIP-6963**: https://eips.ethereum.org/EIPS/eip-6963

### Tools
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Sepolia Etherscan**: https://sepolia.etherscan.io/
- **Remix IDE**: https://remix.ethereum.org/
- **Hardhat**: https://hardhat.org/

### Testing
- **MetaMask Test**: https://metamask.github.io/test-dapp/
- **Web3 Modal**: https://web3modal.com/

---

## 🆘 Getting Help

### Checklist Before Asking

- [ ] Checked browser console for errors
- [ ] Read error message carefully
- [ ] Searched codebase for similar code
- [ ] Checked this guide
- [ ] Tried debugging with console.log
- [ ] Verified contract addresses correct
- [ ] Tested in different browser

### Where to Ask

1. **Check existing issues** on GitHub
2. **Read documentation** (README, this guide)
3. **Search Stack Overflow**
4. **Create new issue** with details:
   - What you're trying to do
   - What's happening
   - Error messages (full text)
   - Browser console logs
   - Steps to reproduce

---

## ✅ Daily Development Checklist

- [ ] **Start dev server**: `python -m http.server 8000`
- [ ] **Open browser**: http://localhost:8000/index-new.html
- [ ] **Open DevTools**: F12 (check console for errors)
- [ ] **Make changes**: Edit relevant module
- [ ] **Test changes**: Refresh browser, test feature
- [ ] **Run tests**: Open test runner, verify pass
- [ ] **Commit work**: Clear commit message
- [ ] **Push changes**: `git push`

---

## 🎉 You're Ready!

Start coding and building amazing features!

**Questions?** Check the README or create an issue.

**Slava Ukraini!** 🇺🇦

---

*Happy Coding! 👨‍💻*
