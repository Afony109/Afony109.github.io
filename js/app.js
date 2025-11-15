/**
 * Main Application Entry Point
 * Initializes all modules and manages global state
 */

import { CONFIG, getCurrentTier } from './config.js';
import { initWalletModule, addTokenToWallet } from './wallet.js';
import { initTradingModule, buyTokens, sellTokens, setMaxBuy, setMaxSell } from './trading.js';
import { initStakingModule } from './staking.js';
import { initFaucetModule, claimFromFaucet } from './faucet.js';
import { showNotification, copyToClipboard, formatUSD, formatTokenAmount } from './ui.js';
import { getPoolStats, getArubPrice, initReadOnlyContracts, getTotalSupplyArub, getDetailedStats } from './contracts.js';
import {
    stakeUsdtTokens,
    stakeArubTokens,
    unstakeUsdtTokens,
    unstakeArubTokens,
    claimRewards,
    setMaxStakeUsdt,
    setMaxStakeArub,
    setMaxUnstakeUsdt,
    setMaxUnstakeArub
} from './staking-actions.js';

/**
 * Initialize the application
 */
async function initApp() {
    console.log('='.repeat(60));
    console.log('ANTI RUB - Staking Platform');
    console.log('Initializing application...');
    console.log('='.repeat(60));

    try {
        // Initialize read-only contracts first (for public data)
        console.log('[APP] Initializing read-only contracts...');
        const readOnlySuccess = initReadOnlyContracts();

        // Update stats immediately after read-only contracts are initialized
        if (readOnlySuccess) {
            console.log('[APP] Read-only contracts ready, fetching initial stats...');
            // Small delay to ensure contracts are fully ready
            setTimeout(() => {
                updateGlobalStats();
            }, 500);
        }

        // Initialize all modules
        console.log('[APP] Initializing wallet module...');
        initWalletModule();

        console.log('[APP] Initializing trading module...');
        initTradingModule();

        console.log('[APP] Initializing staking module...');
        initStakingModule();

        console.log('[APP] Initializing faucet module...');
        initFaucetModule();

        console.log('[APP] ✅ All modules initialized successfully');

        // Setup global event listeners
        setupGlobalEventListeners();

        // Setup scroll animations
        setupScrollAnimations();

        // Update global stats periodically (every 30 seconds)
        setInterval(() => {
            updateGlobalStats();
        }, CONFIG.UI.STATS_UPDATE_INTERVAL);

        // Display welcome message
        console.log('[APP] 🎉 Application ready!');
        console.log('[APP] Network:', CONFIG.NETWORK.name);
        console.log('[APP] Chain ID:', CONFIG.NETWORK.chainIdDecimal);

    } catch (error) {
        console.error('[APP] ❌ Initialization error:', error);
        showNotification('❌ Помилка ініціалізації додатку', 'error');
    }
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Language switcher (if implemented)
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // TODO: Implement actual language switching
            showNotification('🌐 Мовна підтримка в розробці', 'info');
        });
    });

    // Listen for faucet claims to update other UIs
    window.addEventListener('faucetClaimed', () => {
        console.log('[APP] Faucet claimed, updating UIs...');
        const { userAddress } = window;
        if (userAddress) {
            // Trigger update for trading UI
            window.dispatchEvent(new CustomEvent('contractsInitialized', {
                detail: { userAddress }
            }));
        }
    });

    // Listen for contracts initialized to update global stats
    window.addEventListener('contractsInitialized', () => {
        console.log('[APP] Updating global stats...');
        updateGlobalStats();
    });
}

/**
 * Update global statistics
 */
async function updateGlobalStats() {
    console.log('[APP] 🔄 Updating global statistics...');

    try {
        // Get all data in parallel from blockchain
        const [poolStats, arubPrice, totalSupply, detailedStats] = await Promise.all([
            getPoolStats(),
            getArubPrice(),
            getTotalSupplyArub(),
            getDetailedStats()
        ]);

        // Calculate TVL in USD (both USDT and ARUB pools)
        const tvlUsd = (detailedStats.totalStakedUsdt) + (detailedStats.totalStakedArub * arubPrice);

        // Get current tier info
        const tierInfo = getCurrentTier(tvlUsd);

        // Update DOM elements
        const elements = {
            globalTvl: document.getElementById('globalTvl'),
            globalApy: document.getElementById('globalApy'),
            globalStakers: document.getElementById('globalStakers'),
            globalArubPrice: document.getElementById('globalArubPrice'),
            totalSupplyArub: document.getElementById('totalSupplyArub'),
            totalStakedArub: document.getElementById('totalStakedArub'),
            totalStakedUsdt: document.getElementById('totalStakedUsdt'),
            totalRewards: document.getElementById('totalRewards')
        };

        // Elements for staking.html (separate staking page)
        const stakingElements = {
            totalTvl: document.getElementById('totalTvl'),
            currentApy: document.getElementById('currentApy'),
            totalStakers: document.getElementById('totalStakers'),
            arubPrice: document.getElementById('arubPrice')
        };

        // Update main stats
        if (elements.globalTvl) {
            elements.globalTvl.textContent = formatUSD(tvlUsd);
        }

        if (elements.globalApy) {
            elements.globalApy.textContent = `${(tierInfo.apy / 100).toFixed(1)}%`;
        }

        if (elements.globalStakers) {
            elements.globalStakers.textContent = poolStats.totalStakers.toLocaleString();
        }

        if (elements.globalArubPrice) {
            elements.globalArubPrice.textContent = `${arubPrice.toFixed(2)} USDT`;
        }

        // Mirror stats to staking.html if these elements exist
        if (stakingElements.totalTvl) {
            stakingElements.totalTvl.textContent = formatUSD(tvlUsd);
        }

        if (stakingElements.currentApy) {
            stakingElements.currentApy.textContent = `${(tierInfo.apy / 100).toFixed(1)}%`;
        }

        if (stakingElements.totalStakers) {
            stakingElements.totalStakers.textContent = poolStats.totalStakers.toLocaleString();
        }

        if (stakingElements.arubPrice) {
            stakingElements.arubPrice.textContent = `${arubPrice.toFixed(2)} USDT`;
        }

        // Update token stats
        if (elements.totalSupplyArub) {
            elements.totalSupplyArub.textContent = formatTokenAmount(totalSupply) + ' ARUB';
        }

        if (elements.totalStakedArub) {
            elements.totalStakedArub.textContent = formatTokenAmount(detailedStats.totalStakedArub) + ' ARUB';
        }

        if (elements.totalStakedUsdt) {
            elements.totalStakedUsdt.textContent = formatTokenAmount(detailedStats.totalStakedUsdt) + ' USDT';
        }

        if (elements.totalRewards) {
            const rewardsArub = parseFloat(ethers.utils.formatUnits(poolStats.totalRewardsDistributed, CONFIG.DECIMALS.ARUB));
            elements.totalRewards.textContent = formatTokenAmount(rewardsArub) + ' ARUB';
        }

        console.log('[APP] ✅ Global stats updated successfully!');
        console.log('[APP] 📊 TVL:', formatUSD(tvlUsd));
        console.log('[APP] 📈 APY:', `${(tierInfo.apy / 100).toFixed(1)}%`);
        console.log('[APP] 👥 Stakers:', poolStats.totalStakers);
        console.log('[APP] 🪙 ARUB Price:', `${arubPrice.toFixed(2)} USDT`);
        console.log('[APP] 💎 Total Supply:', formatTokenAmount(totalSupply), 'ARUB');
        console.log('[APP] 🔒 Staked ARUB:', formatTokenAmount(detailedStats.totalStakedArub), 'ARUB');
        console.log('[APP] 💵 Staked USDT:', formatTokenAmount(detailedStats.totalStakedUsdt), 'USDT');

    } catch (error) {
        console.error('[APP] ❌ Error updating global stats:', error);

        // Set fallback values with error indicator
        const elements = {
            globalTvl: document.getElementById('globalTvl'),
            globalApy: document.getElementById('globalApy'),
            globalArubPrice: document.getElementById('globalArubPrice'),
            globalStakers: document.getElementById('globalStakers'),
            totalSupplyArub: document.getElementById('totalSupplyArub'),
            totalStakedArub: document.getElementById('totalStakedArub'),
            totalStakedUsdt: document.getElementById('totalStakedUsdt'),
            totalRewards: document.getElementById('totalRewards')
        };

        // Elements for staking.html (fallback values)
        const stakingElements = {
            totalTvl: document.getElementById('totalTvl'),
            currentApy: document.getElementById('currentApy'),
            totalStakers: document.getElementById('totalStakers'),
            arubPrice: document.getElementById('arubPrice')
        };

        if (elements.globalTvl) elements.globalTvl.textContent = '$0';
        if (elements.globalApy) elements.globalApy.textContent = '20.0%';
        if (elements.globalArubPrice) elements.globalArubPrice.textContent = '81.22 USDT';

        // Mirror fallbacks to staking.html elements
        if (stakingElements.totalTvl) stakingElements.totalTvl.textContent = '$0';
        if (stakingElements.currentApy) stakingElements.currentApy.textContent = '20.0%';
        if (stakingElements.totalStakers) stakingElements.totalStakers.textContent = '0';
        if (stakingElements.arubPrice) stakingElements.arubPrice.textContent = '81.22 USDT';
        if (elements.globalStakers) elements.globalStakers.textContent = '0';
        if (elements.totalSupplyArub) elements.totalSupplyArub.textContent = '0 ARUB';
        if (elements.totalStakedArub) elements.totalStakedArub.textContent = '0 ARUB';
        if (elements.totalStakedUsdt) elements.totalStakedUsdt.textContent = '0 USDT';
        if (elements.totalRewards) elements.totalRewards.textContent = '0 ARUB';
    }
}

/**
 * Setup scroll animations
 */
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('.staking-section, .stats-section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

/**
 * Global functions for HTML onclick handlers
 */
// Wallet functions
window.addArubToMetaMask = () => addTokenToWallet('ARUB');
window.addUsdtToMetaMask = () => addTokenToWallet('USDT');
window.copyTokenAddress = () => copyToClipboard(CONFIG.TOKEN_ADDRESS, '✅ Адресу токена скопійовано!');

// Trading functions
window.buyTokens = buyTokens;
window.sellTokens = sellTokens;
window.setMaxBuy = setMaxBuy;
window.setMaxSell = setMaxSell;

// Staking functions
window.stakeUsdtTokens = stakeUsdtTokens;
window.stakeArubTokens = stakeArubTokens;
window.unstakeUsdtTokens = unstakeUsdtTokens;
window.unstakeArubTokens = unstakeArubTokens;
window.claimRewards = claimRewards;
window.setMaxStakeUsdt = setMaxStakeUsdt;
window.setMaxStakeArub = setMaxStakeArub;
window.setMaxUnstakeUsdt = setMaxUnstakeUsdt;
window.setMaxUnstakeArub = setMaxUnstakeArub;

// Faucet functions
window.claimFromFaucet = claimFromFaucet;

// Helper function for scroll to section
window.scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Log version info
console.log('[APP] Version: 2.0.0 (Modular Refactor)');
console.log('[APP] Build: ' + new Date().toISOString());

export { initApp };
