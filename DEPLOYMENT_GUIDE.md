# 🚀 Deployment Guide - ANTI RUB Staking Platform

Complete guide for deploying the ANTI RUB staking platform to various hosting providers.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Options](#deployment-options)
3. [Method 1: GitHub Pages (Free)](#method-1-github-pages-free)
4. [Method 2: Vercel (Free, Recommended)](#method-2-vercel-free-recommended)
5. [Method 3: Netlify (Free)](#method-3-netlify-free)
6. [Method 4: Traditional Web Hosting](#method-4-traditional-web-hosting)
7. [Method 5: IPFS (Decentralized)](#method-5-ipfs-decentralized)
8. [Post-Deployment Configuration](#post-deployment-configuration)
9. [Custom Domain Setup](#custom-domain-setup)
10. [Troubleshooting](#troubleshooting)

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] **All files are present** in the project directory
- [ ] **Tests pass** (open `tests/test-runner.html` and verify)
- [ ] **Contract addresses verified** on Sepolia Etherscan
- [ ] **Wallet connection tested** locally
- [ ] **All links work** (trading, staking, faucet)
- [ ] **Mobile responsive** checked on different screen sizes
- [ ] **No console errors** in browser DevTools

### Quick Test Locally

```bash
# Navigate to project directory
cd "C:\Users\Admini\OneDrive\Документы\сайт тест"

# Start local server
python -m http.server 8000

# Open in browser: http://localhost:8000/index-new.html
# Test all features:
# - Connect wallet
# - Buy/sell tokens
# - Stake/unstake
# - Claim from faucet
```

---

## 🌐 Deployment Options

| Method | Cost | Difficulty | Speed | Best For |
|--------|------|------------|-------|----------|
| **GitHub Pages** | Free | Easy | Fast | Quick deployment |
| **Vercel** | Free | Easy | Very Fast | Production (Recommended) |
| **Netlify** | Free | Easy | Very Fast | Production |
| **Traditional Hosting** | Paid | Medium | Medium | Full control |
| **IPFS** | Free | Hard | Slow | Decentralization |

---

## Method 1: GitHub Pages (Free)

**Perfect for**: Quick deployment, version control

### Step 1: Create GitHub Repository

```bash
# Initialize git (if not already done)
cd "C:\Users\Admini\OneDrive\Документы\сайт тест"
git init

# Create .gitignore
echo "node_modules/" > .gitignore
echo ".DS_Store" >> .gitignore
echo "*.log" >> .gitignore
```

### Step 2: Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: ANTI RUB v2.0 modular refactor"

# Create repository on GitHub.com, then:
git remote add origin https://github.com/YOUR-USERNAME/antirub-staking.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **main** branch
4. Select **/ (root)** folder
5. Click **Save**

### Step 4: Update File References

**Important**: Rename `index-new.html` to `index.html` for GitHub Pages:

```bash
# In your local repository
mv index-new.html index.html
git add .
git commit -m "Rename index-new.html to index.html for GitHub Pages"
git push
```

### Step 5: Access Your Site

Your site will be available at:
```
https://YOUR-USERNAME.github.io/antirub-staking/
```

**⏱️ Deployment Time**: 2-5 minutes

---

## Method 2: Vercel (Free, Recommended)

**Perfect for**: Production deployment, automatic HTTPS, global CDN

### Step 1: Prepare Project

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "name": "antirub-staking",
  "builds": [
    {
      "src": "index-new.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Step 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd "C:\Users\Admini\OneDrive\Документы\сайт тест"
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name: antirub-staking
# - Directory: ./
# - Override settings? No
```

### Step 3: Deploy via Vercel Dashboard (Alternative)

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (leave empty)
   - **Output Directory**: ./
5. Click **Deploy**

### Step 4: Set Index Page

After deployment:
1. Go to **Settings** → **General**
2. Find **Root Directory**
3. Set index page: `index-new.html`

Or rename `index-new.html` to `index.html` before deploying.

**Your site**: `https://antirub-staking.vercel.app`

**⏱️ Deployment Time**: 1-2 minutes

### Automatic Deployments

Vercel automatically deploys on every git push:
```bash
git add .
git commit -m "Update staking UI"
git push
# Vercel auto-deploys!
```

---

## Method 3: Netlify (Free)

**Perfect for**: Drag-and-drop deployment, form handling

### Option A: Drag and Drop

1. Go to [netlify.com](https://www.netlify.com)
2. Sign up / Login
3. Click **Sites** → **Add new site** → **Deploy manually**
4. Drag your entire project folder
5. Wait for deployment ✅

**Your site**: `https://random-name-12345.netlify.app`

### Option B: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize and deploy
cd "C:\Users\Admini\OneDrive\Документы\сайт тест"
netlify init

# Deploy
netlify deploy --prod
```

### Step 2: Configure

Create `netlify.toml` in project root:

```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index-new.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Step 3: Continuous Deployment

Connect to GitHub for auto-deployment:
1. **Site settings** → **Build & deploy**
2. Link to GitHub repository
3. Every push = automatic deployment

**⏱️ Deployment Time**: 1-2 minutes

---

## Method 4: Traditional Web Hosting

**Perfect for**: Full control, custom server configuration

### Supported Hosts
- ✅ Hostinger
- ✅ Bluehost
- ✅ SiteGround
- ✅ DigitalOcean
- ✅ Any host with static file support

### Step 1: Prepare Files

```bash
# Create deployment package
cd "C:\Users\Admini\OneDrive\Документы\сайт тест"

# Rename index-new.html to index.html
copy index-new.html index.html

# Create ZIP archive (Windows)
# Right-click project folder → Send to → Compressed (zipped) folder
```

### Step 2: Upload via FTP/SFTP

**Using FileZilla** (recommended):

1. Download [FileZilla Client](https://filezilla-project.org/)
2. Connect to your server:
   - Host: `ftp.yourhost.com`
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21 (FTP) or 22 (SFTP)
3. Navigate to `public_html` or `www` folder
4. Upload all project files

### Step 3: Upload via cPanel

1. Login to cPanel
2. Open **File Manager**
3. Navigate to `public_html`
4. Click **Upload**
5. Select your ZIP file
6. Extract the ZIP file
7. Move contents from subfolder to `public_html`

### Step 4: Set Permissions

Ensure correct file permissions:
```bash
# Via SSH
chmod 644 *.html
chmod 644 *.css
chmod 644 *.js
chmod 755 css/ js/ tests/
```

### Step 5: Configure .htaccess (Optional)

Create `.htaccess` in root directory:

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

**Your site**: `https://yourdomain.com`

**⏱️ Deployment Time**: 10-30 minutes

---

## Method 5: IPFS (Decentralized)

**Perfect for**: Censorship resistance, decentralization

### Using Fleek

1. Go to [fleek.co](https://fleek.co)
2. Sign up with GitHub
3. Click **Add new site**
4. Connect GitHub repository
5. Configure:
   - Build command: (none)
   - Publish directory: `./`
6. Click **Deploy site**

**Your site**: `https://your-site.on.fleek.co`
**IPFS hash**: `ipfs://Qm...`

### Using Pinata

```bash
# Install IPFS CLI
# Download from: https://docs.ipfs.tech/install/

# Add folder to IPFS
ipfs add -r "C:\Users\Admini\OneDrive\Документы\сайт тест"

# Get CID (Content Identifier)
# Example: QmXYZ123...

# Pin to Pinata
# Upload folder at: https://app.pinata.cloud
```

**Access via**:
- `https://gateway.pinata.cloud/ipfs/YOUR-CID`
- `https://cloudflare-ipfs.com/ipfs/YOUR-CID`

**⏱️ Deployment Time**: 5-15 minutes

---

## 🔧 Post-Deployment Configuration

### 1. Update Contract Addresses (if needed)

If you deploy to mainnet, update `js/config.js`:

```javascript
export const CONFIG = {
    // MAINNET ADDRESSES (update these!)
    USDT_ADDRESS: '0xYOUR-MAINNET-USDT-ADDRESS',
    TOKEN_ADDRESS: '0xYOUR-MAINNET-TOKEN-ADDRESS',
    STAKING_ADDRESS: '0xYOUR-MAINNET-STAKING-ADDRESS',

    NETWORK: {
        name: 'Ethereum Mainnet',
        chainId: '0x1', // Mainnet
        chainIdDecimal: 1,
        // ... update RPC URLs
    }
};
```

### 2. Enable Analytics (Optional)

Add Google Analytics to `index-new.html` (before `</head>`):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. Add Security Headers

Verify security headers are set:
```bash
# Test headers
curl -I https://your-domain.com
```

Should include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### 4. Test All Features

After deployment, test:
- [ ] **Homepage loads** correctly
- [ ] **Wallet connection** works
- [ ] **Trading** (buy/sell) functions
- [ ] **Staking** (both pools) works
- [ ] **Unstaking** from correct pool
- [ ] **Faucet** claim works
- [ ] **Charts** display correctly
- [ ] **Mobile responsive** on phone
- [ ] **All links** work
- [ ] **No console errors**

---

## 🌍 Custom Domain Setup

### For Vercel

1. Go to **Settings** → **Domains**
2. Add your domain: `antirub.com`
3. Configure DNS:

```
# Add these DNS records at your domain registrar:
Type    Name    Value
CNAME   www     cname.vercel-dns.com
A       @       76.76.21.21
```

### For Netlify

1. Go to **Domain settings**
2. Add custom domain
3. Configure DNS:

```
# Netlify DNS records:
Type    Name    Value
CNAME   www     your-site.netlify.app
A       @       75.2.60.5
```

### For GitHub Pages

1. Create `CNAME` file in root:
```bash
echo "antirub.com" > CNAME
git add CNAME
git commit -m "Add custom domain"
git push
```

2. Configure DNS:
```
Type    Name    Value
CNAME   www     YOUR-USERNAME.github.io
A       @       185.199.108.153
A       @       185.199.109.153
A       @       185.199.110.153
A       @       185.199.111.153
```

### SSL Certificate

All modern hosts provide **free SSL certificates** via Let's Encrypt:
- **Vercel**: Automatic
- **Netlify**: Automatic
- **GitHub Pages**: Automatic (after DNS propagation)
- **cPanel**: Enable in SSL/TLS section

---

## 🐛 Troubleshooting

### Issue: White Screen After Deployment

**Cause**: Incorrect file paths

**Solution**:
```javascript
// Check console for errors
// If you see 404 errors for CSS/JS files:

// Option 1: Use absolute paths
<link rel="stylesheet" href="/css/variables.css">

// Option 2: Check file structure
// All files must be in correct folders:
// /css/, /js/, /tests/
```

### Issue: Wallet Won't Connect

**Cause**: HTTPS required for Web3

**Solution**:
- Use HTTPS (not HTTP)
- Check browser console for errors
- Ensure MetaMask is installed

### Issue: Contract Functions Fail

**Cause**: Wrong network or addresses

**Solution**:
```javascript
// Verify in js/config.js:
1. Contract addresses are correct
2. Network chain ID matches (Sepolia = 11155111)
3. RPC URLs are working
```

### Issue: 404 Error on Reload

**Cause**: Server doesn't handle SPA routing

**Solution for Netlify**:
```toml
# In netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Solution for Vercel**:
```json
// In vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### Issue: Charts Not Loading

**Cause**: Chart.js CDN blocked or failed

**Solution**:
```html
<!-- Use different CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>

<!-- Or download and host locally -->
```

### Issue: Slow Loading

**Cause**: Large file sizes

**Solution**:
```bash
# Minify CSS/JS (future improvement)
# Enable compression in .htaccess
# Use CDN for external libraries
# Enable browser caching
```

---

## 📊 Deployment Comparison

| Feature | GitHub Pages | Vercel | Netlify | Traditional |
|---------|--------------|--------|---------|-------------|
| **Cost** | Free | Free | Free | $3-10/mo |
| **SSL** | Auto | Auto | Auto | Manual/Auto |
| **CDN** | ✅ | ✅ | ✅ | ❌ (usually) |
| **Auto Deploy** | ✅ | ✅ | ✅ | ❌ |
| **Custom Domain** | ✅ | ✅ | ✅ | ✅ |
| **Build Step** | ❌ | ✅ | ✅ | ❌ |
| **Serverless** | ❌ | ✅ | ✅ | ❌ |
| **Speed** | Fast | Very Fast | Very Fast | Varies |

**Recommendation**: Use **Vercel** or **Netlify** for production.

---

## ✅ Final Checklist

Before going live:

- [ ] **Test locally** first
- [ ] **Run automated tests** (all pass)
- [ ] **Check contract addresses** in config.js
- [ ] **Verify network settings** (Sepolia/Mainnet)
- [ ] **Test wallet connection** on deployment
- [ ] **Test all features** (trading, staking, faucet)
- [ ] **Check mobile responsive**
- [ ] **Verify SSL certificate** (HTTPS)
- [ ] **Set up custom domain** (optional)
- [ ] **Enable analytics** (optional)
- [ ] **Create backup** of codebase
- [ ] **Document deployment URL**
- [ ] **Share with users!** 🎉

---

## 🎉 Deployment Complete!

Your ANTI RUB staking platform is now live!

**Next Steps**:
1. Monitor for errors in browser console
2. Track user feedback
3. Update contract addresses if deploying to mainnet
4. Add more features as needed

**Support Ukraine!** 🇺🇦

---

## 📞 Need Help?

Common resources:
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **GitHub Pages**: https://pages.github.com
- **MetaMask Issues**: https://metamask.io/support

---

*Last Updated: 2025-11-14*
*Version: 2.0.0*
*Network: Ethereum Sepolia Testnet*
