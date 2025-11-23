/**
 * Configuration Module
 * Contains all contract addresses, network settings, and constants
 *
 * ⚠️ IMPORTANT: Contract addresses are for Sepolia Testnet only!
 * These are the CORRECT and VERIFIED addresses - do not change without verification.
 */

export const CONFIG = {
   // ===== CONTRACT ADDRESSES (Sepolia Testnet) =====
USDT_ADDRESS: '0x803ce0BDEb8C811E1Dd12a7ed6765FC2ACe46EcA',
TOKEN_ADDRESS: '0x1B1196164AF755a24A04B5141c4Ba6ee2694fb8E', // ARUB Token
STAKING_ADDRESS: '0xc773B28eaB28cD701EfB16Ce16f269e678BD9119', // ARUB Staking Final

    // ===== NETWORK CONFIGURATION =====
    NETWORK: {
        name: 'Sepolia',
        chainId: '0xaa36a7', // 11155111 in decimal
        chainIdDecimal: 11155111,
        rpcUrls: [
            'https://rpc.sepolia.org',
            'https://ethereum-sepolia-rpc.publicnode.com',
            'https://1rpc.io/sepolia'
        ],
        blockExplorer: 'https://sepolia.etherscan.io',
        nativeCurrency: {
            name: 'Sepolia ETH',
            symbol: 'ETH',
            decimals: 18
        }
    },

    // ===== TRADING FEES =====
    FEES: {
        BUY_FEE: 0.005,  // 0.5%
        SELL_FEE: 0.01   // 1%
    },

    // ===== STAKING CONFIGURATION =====
    STAKING: {
        MIN_STAKE_USDT: 10,     // Minimum 10 USDT
        MIN_STAKE_ARUB: 0.1,    // Minimum 0.1 ARUB

        // APY Tier System (in basis points: 2400 = 24%)
        TIER_THRESHOLDS_USD: [100000, 200000, 400000, 800000], // $100k, $200k, $400k, $800k
        TIER_APYS: [2400, 2000, 1600, 1200, 800],              // 24%, 20%, 16%, 12%, 8%

        // Pool types
        POOL_USDT: 'usdt',
        POOL_ARUB: 'arub'
    },

    // ===== FAUCET CONFIGURATION =====
    FAUCET: {
        AMOUNT: 100000,          // 100,000 USDT per claim
        COOLDOWN_HOURS: 1        // 1 hour cooldown
    },

    // ===== TOKEN DECIMALS =====
    DECIMALS: {
        USDT: 6,
        ARUB: 6,
        ETH: 18
    },

    // ===== UI CONFIGURATION =====
    UI: {
        NOTIFICATION_DURATION: 5000,  // 5 seconds
        PRICE_UPDATE_INTERVAL: 30000, // 30 seconds
        STATS_UPDATE_INTERVAL: 30000  // 30 seconds
    },

    // ===== EXTERNAL LINKS =====
   LINKS: {
    ARUB_ETHERSCAN: 'https://sepolia.etherscan.io/address/0x1B1196164AF755a24A04B5141c4Ba6ee2694fb8E',
    STAKING_ETHERSCAN: 'https://sepolia.etherscan.io/address/0xc773B28eaB28cD701EfB16Ce16f269e678BD9119',
    USDT_ETHERSCAN: 'https://sepolia.etherscan.io/address/0x803ce0BDEb8C811E1Dd12a7ed6765FC2ACe46EcA',
    ...
}
        DEXSCREENER: 'https://dexscreener.com/ethereum/sepolia',
        GITHUB: 'https://github.com/afony109/antirub-staking'
    },

    // ===== FALLBACK VALUES =====
    FALLBACK: {
        ARUB_PRICE_USDT: 81.22,  // Fallback ARUB price in USDT if live APIs fail
        APY: 2400                // Fallback APY (24%)
    }
};

/**
 * Helper function to format contract address for display
 * @param {string} address - Full contract address
 * @returns {string} Shortened address (0x1234...5678)
 */
export function shortenAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get Etherscan link for an address
 * @param {string} address - Contract or wallet address
 * @param {string} type - 'address' or 'tx'
 * @returns {string} Full Etherscan URL
 */
export function getEtherscanLink(address, type = 'address') {
    return `${CONFIG.NETWORK.blockExplorer}/${type}/${address}`;
}

/**
 * Validate if an address is a valid Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get current APY tier based on total staked USD value
 * @param {number} totalStakedUsd - Total value staked in USD
 * @returns {Object} { tier, apy, threshold }
 */
export function getCurrentTier(totalStakedUsd) {
    const { TIER_THRESHOLDS_USD, TIER_APYS } = CONFIG.STAKING;

    let tier = 0;
    for (let i = 0; i < TIER_THRESHOLDS_USD.length; i++) {
        if (totalStakedUsd < TIER_THRESHOLDS_USD[i]) {
            tier = i;
            break;
        }
    }

    // If exceeded all thresholds, we're in the last tier
    if (totalStakedUsd >= TIER_THRESHOLDS_USD[TIER_THRESHOLDS_USD.length - 1]) {
        tier = TIER_THRESHOLDS_USD.length;
    }

    return {
        tier,
        apy: TIER_APYS[tier],
        threshold: tier < TIER_THRESHOLDS_USD.length ? TIER_THRESHOLDS_USD[tier] : null,
        nextApy: tier < TIER_APYS.length - 1 ? TIER_APYS[tier + 1] : null
    };
}

/**
 * Format number with thousands separators
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(num, decimals = 2) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Calculate buy amount after fees
 * @param {number} usdtAmount - USDT amount to spend
 * @param {number} arubPrice - Current ARUB price in USDT
 * @returns {Object} { arubReceived, fee, amountAfterFee }
 */
export function calculateBuyAmount(usdtAmount, arubPrice) {
    const fee = usdtAmount * CONFIG.FEES.BUY_FEE;
    const amountAfterFee = usdtAmount - fee;
    const arubReceived = amountAfterFee / arubPrice;

    return {
        arubReceived,
        fee,
        amountAfterFee
    };
}

/**
 * Calculate sell amount after fees
 * @param {number} arubAmount - ARUB amount to sell
 * @param {number} arubPrice - Current ARUB price in USDT
 * @returns {Object} { usdtReceived, fee, valueBeforeFee }
 */
export function calculateSellAmount(arubAmount, arubPrice) {
    const valueBeforeFee = arubAmount * arubPrice;
    const fee = valueBeforeFee * CONFIG.FEES.SELL_FEE;
    const usdtReceived = valueBeforeFee - fee;

    return {
        usdtReceived,
        fee,
        valueBeforeFee
    };
}

// Export as default for convenience
export default CONFIG;
