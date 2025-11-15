# 🚀 Quick Deployment Checklist

Use this checklist before and after deployment to ensure everything works correctly.

---

## 📋 Pre-Deployment Checklist

### Local Testing
- [ ] Open `index-new.html` in browser - no errors
- [ ] Connect wallet (MetaMask) - successful connection
- [ ] Buy ARUB tokens - transaction completes
- [ ] Sell ARUB tokens - transaction completes
- [ ] Stake USDT - successful in USDT pool
- [ ] Stake ARUB - successful in ARUB pool
- [ ] Unstake from correct pool - no errors
- [ ] Claim rewards - works correctly
- [ ] Claim from faucet - receives 100k USDT
- [ ] Run tests: `tests/test-runner.html` - all pass
- [ ] Check browser console - no errors
- [ ] Test on mobile device - responsive design works

### Code Review
- [ ] All contract addresses in `js/config.js` are correct
- [ ] Network configuration matches target (Sepolia/Mainnet)
- [ ] No hardcoded values outside config
- [ ] All console.log debugging statements reviewed
- [ ] No sensitive information in code
- [ ] Comments are clear and helpful
- [ ] File structure is correct (css/, js/, tests/)

### File Preparation
- [ ] All CSS files present in `/css/`
- [ ] All JS modules present in `/js/`
- [ ] Test files present in `/tests/`
- [ ] README.md exists and is up to date
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] No unnecessary files (node_modules, .DS_Store, etc.)

---

## 🌐 Deployment Steps

### Choose Your Method

#### ✅ Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd "C:\Users\Admini\OneDrive\Документы\сайт тест"
vercel --prod
```

#### ✅ Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd "C:\Users\Admini\OneDrive\Документы\сайт тест"
netlify deploy --prod
```

#### ✅ GitHub Pages
```bash
# Initialize git (if needed)
git init

# Rename for GitHub Pages
mv index-new.html index.html

# Add and commit
git add .
git commit -m "Deploy: ANTI RUB v2.0"

# Push to GitHub
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main

# Enable GitHub Pages in repository settings
```

---

## ✅ Post-Deployment Checklist

### Immediate Testing (within 5 minutes)
- [ ] **Site loads**: Visit deployment URL
- [ ] **HTTPS works**: Check for padlock icon
- [ ] **No 404 errors**: All pages load
- [ ] **CSS loads**: Site has proper styling
- [ ] **JS loads**: Interactive features work
- [ ] **Console clean**: No errors in browser console

### Functionality Testing (10-15 minutes)
- [ ] **Wallet connects**: MetaMask/Trust Wallet works
- [ ] **Network detection**: Shows correct network (Sepolia)
- [ ] **Buy tokens**: Can purchase ARUB with USDT
- [ ] **Sell tokens**: Can sell ARUB for USDT
- [ ] **USDT staking**: Can stake in USDT pool
- [ ] **ARUB staking**: Can stake in ARUB pool
- [ ] **Pool separation**: Correct pool badges visible
- [ ] **Unstaking**: Works from correct pool only
- [ ] **Rewards claim**: Can claim pending rewards
- [ ] **Faucet**: Can claim testnet USDT
- [ ] **Charts display**: TVL and price charts visible
- [ ] **Real-time updates**: Data refreshes correctly

### Mobile Testing
- [ ] **Loads on mobile**: Site accessible on phone
- [ ] **Responsive layout**: No horizontal scroll
- [ ] **Buttons work**: All clickable elements functional
- [ ] **Wallet connects**: Mobile wallet (Trust, MetaMask mobile) works
- [ ] **Forms usable**: Input fields not too small
- [ ] **Navigation works**: Can scroll to all sections

### Cross-Browser Testing
- [ ] **Chrome**: All features work
- [ ] **Firefox**: All features work
- [ ] **Safari**: All features work
- [ ] **Edge**: All features work
- [ ] **Brave**: All features work

### Performance
- [ ] **Load time < 3s**: Site loads quickly
- [ ] **Lighthouse score > 80**: Run Chrome Lighthouse
- [ ] **No lag**: Smooth scrolling and interactions
- [ ] **Charts animate**: No choppy rendering

### Security
- [ ] **HTTPS enabled**: URL starts with https://
- [ ] **SSL certificate valid**: No browser warnings
- [ ] **Security headers**: Check with securityheaders.com
- [ ] **No mixed content**: All resources load via HTTPS
- [ ] **CSP configured**: Content Security Policy set (if applicable)

---

## 🔧 Configuration Verification

### Network Configuration
```javascript
// Verify in js/config.js:

// For TESTNET (Sepolia):
NETWORK: {
    name: 'Sepolia',
    chainId: '0xaa36a7',
    chainIdDecimal: 11155111
}

// For MAINNET (if deploying to production):
NETWORK: {
    name: 'Ethereum Mainnet',
    chainId: '0x1',
    chainIdDecimal: 1
}
```

### Contract Addresses
```javascript
// Verify these match Etherscan:
USDT_ADDRESS: '0x4e6175f449b04e20437b2A2AD8221884Bda38f39'
TOKEN_ADDRESS: '0xe4A39E3D2C64C2D3a1d9c7C6B9eB63db55277b71'
STAKING_ADDRESS: '0x5360400F8B80382017AEE6e4C09c8a935526757B'
```

### Verify on Etherscan
- [ ] Open Sepolia Etherscan: https://sepolia.etherscan.io
- [ ] Check USDT contract: Verify address matches
- [ ] Check ARUB contract: Verify address matches
- [ ] Check Staking contract: Verify address matches
- [ ] Verify contracts are verified on Etherscan
- [ ] Check recent transactions: Ensure contracts are active

---

## 📊 Monitoring (First 24 Hours)

### Metrics to Track
- [ ] **Page views**: How many visitors?
- [ ] **Wallet connections**: How many wallets connected?
- [ ] **Transactions**: Any failed transactions?
- [ ] **Error rate**: Any errors in console logs?
- [ ] **Load time**: Consistently fast?
- [ ] **Mobile usage**: % of mobile visitors?

### User Feedback
- [ ] Ask 3-5 users to test the site
- [ ] Collect feedback on UX
- [ ] Note any confusion points
- [ ] Check for any bugs reported
- [ ] Monitor social media mentions

---

## 🐛 Common Issues & Quick Fixes

### Issue: White Screen
```bash
# Check browser console for errors
# Usually: incorrect file paths

# Fix: Ensure all files uploaded
# Verify folder structure: /css/, /js/, /tests/
```

### Issue: Wallet Won't Connect
```bash
# Verify HTTPS is enabled
# Check MetaMask is installed
# Verify network in config.js matches

# Test with different wallet
# Check browser console for specific error
```

### Issue: Transactions Fail
```bash
# Verify contract addresses correct
# Check user has enough Sepolia ETH for gas
# Verify network is Sepolia (not Mainnet)
# Check contract is not paused

# Test transactions on Etherscan first
```

### Issue: Charts Don't Load
```bash
# Verify Chart.js CDN is accessible
# Check browser console for 404 errors
# Try different CDN URL

# Alternative CDN:
# https://cdn.jsdelivr.net/npm/chart.js
```

---

## 🔄 Update Deployment

When you make changes:

```bash
# Test locally first
python -m http.server 8000
# Visit: http://localhost:8000/index-new.html

# Run tests
# Open tests/test-runner.html - verify all pass

# Commit changes
git add .
git commit -m "Update: [describe changes]"
git push

# For Vercel/Netlify: Auto-deploys!
# For GitHub Pages: Wait 2-5 minutes
# For traditional hosting: Re-upload files via FTP
```

---

## 📞 Emergency Rollback

If something goes wrong:

### Vercel
```bash
# View deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Netlify
```bash
# In Netlify dashboard:
# Deploys → Click on previous deploy → Publish deploy
```

### GitHub Pages
```bash
# Revert to previous commit
git log  # Find previous commit hash
git revert [commit-hash]
git push
```

### Traditional Hosting
```bash
# Re-upload backup files via FTP
# Or restore from hosting backup
```

---

## ✅ Final Sign-Off

Deployment is complete when:

- [x] All pre-deployment checks passed
- [x] Deployment method completed successfully
- [x] All post-deployment checks passed
- [x] Mobile and cross-browser tested
- [x] Performance is acceptable
- [x] Security verified
- [x] Team notified of deployment
- [x] Deployment URL documented
- [x] Monitoring set up
- [x] Backup created

**Deployed by**: _________________
**Date**: _________________
**Deployment URL**: _________________
**Version**: 2.0.0

---

## 🎉 Success!

Your ANTI RUB staking platform is live!

**Share the URL with your community!**

**Slava Ukraini!** 🇺🇦

---

## 📋 Quick Command Reference

```bash
# Test locally
python -m http.server 8000

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod

# Push to GitHub
git add . && git commit -m "Deploy" && git push

# Check site status
curl -I https://your-domain.com

# View deployment logs (Vercel)
vercel logs

# View deployment logs (Netlify)
netlify logs
```

---

*Keep this checklist handy for all future deployments!*
