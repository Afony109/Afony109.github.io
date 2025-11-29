/**
 * Smart Contracts Module
 * Handles contract initialization and ABIs
 */

// Import ethers.js as ES module
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

import { CONFIG } from './config.js';

// Contract ABIs (Application Binary Interface)
// These define the functions we can call on the smart contracts

export const USDT_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function claimFromFaucet() external',
    'function canClaimFromFaucet(address user) view returns (bool canClaim, uint256 timeUntilNextClaim)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function totalSupply() view returns (uint256)'
];

export const TOKEN_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function oraclePrice() view returns (uint256)',
    'function mint(uint256 _wad) external',
    'function burn(uint256 _value) external',
    'function totalSupply() view returns (uint256)'
];

export const const STAKING_ABI = [
    'function stakeUsdt(uint256 amount) external',
    'function stakeArub(uint256 amount) external',
    'function unstakeUsdt(uint256 amount) external',
    'function unstakeArub(uint256 amount) external',
    'function claimRewards(bool compound) external',
    'function getUserInfo(address user) view returns (uint256 usdtStaked_, uint256 arubStaked_, uint256 pendingRewards_, uint256 totalClaimed_, uint256 lastStakeTime_, uint256 currentAPY_)',
    'function getPoolStats() view returns (uint256 totalUsdtStaked_, uint256 totalArubStaked_, uint256 totalUsdtStakers_, uint256 totalArubStakers_, uint256 totalStakers_, uint256 totalRewardsDistributed_, uint256 currentAPY_)',
    'function getAPYTiers() view returns (uint256[] memory thresholds, uint256[] memory apys)',
    'function getCurrentAPYTier() view returns (uint256 tier, uint256 threshold, uint256 apy, string memory description)',
    'function minStakeAmountUsdt() view returns (uint256)',
    'function minStakeAmountArub() view returns (uint256)'
];


// Contract instances (initialized after wallet connection)
export let usdtContract = null;
export let tokenContract = null;
export let stakingContract = null;

// Read-only contract instances (for public data without wallet connection)
let readOnlyProvider = null;
let readOnlyStakingContract = null;
let readOnlyTokenContract = null;

// Cache for USD/RUB exchange rate
let cachedUsdRubRate = null;
let lastRateFetchTime = 0;
const RATE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
const RPC_FALLBACKS = [
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://rpc.sepolia.org',
    'https://1rpc.io/sepolia',
    'https://sepolia.infura.io/v3/4eaba2c22421462eab401f71d5b2b5e5',
    'https://eth-sepolia.g.alchemy.com/v2/5Jxy1ozrFFV9rlJHW4xznilpqo4ZXNCF'
];

async function getWorkingProvider() {
    for (const url of RPC_FALLBACKS) {
        try {
            const provider = new ethers.providers.JsonRpcProvider(url);
            await Promise.race([
                provider.getBlockNumber(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 4000))
            ]);
            console.log('[RPC] Using:', url);
            return provider;
        } catch (e) {
            console.warn('[RPC] Failed:', url, '-', e?.message || e);
        }
    }
    throw new Error('No RPC available from fallback list');
}

/**
 * Initialize read-only contracts for public data
 */
export async function initReadOnlyContracts() {
    try {
        console.log('[CONTRACTS] Initializing read-only contracts...');

        readOnlyProvider = await getWorkingProvider();

        readOnlyStakingContract = new ethers.Contract(CONFIG.STAKING_ADDRESS, STAKING_ABI, readOnlyProvider);
        readOnlyTokenContract = new ethers.Contract(CONFIG.TOKEN_ADDRESS, TOKEN_ABI, readOnlyProvider);

        console.log('[CONTRACTS] Read-only contracts initialized');
        return true;
    } catch (error) {
        console.error('[CONTRACTS] Error initializing read-only contracts:', error);
        return false;
    }
}

/**
 * Initialize all smart contracts
 * @param {Object} provider - Ethers provider
 * @param {Object} signer - Ethers signer
 * @param {string} userAddress - Connected wallet address
 */
export async function initializeContracts(provider, signer, userAddress) {
    try {
        console.log('[CONTRACTS] Initializing contracts...');
        console.log('[CONTRACTS] USDT:', CONFIG.USDT_ADDRESS);
        console.log('[CONTRACTS] ARUB:', CONFIG.TOKEN_ADDRESS);
        console.log('[CONTRACTS] STAKING:', CONFIG.STAKING_ADDRESS);

        // Initialize contract instances
        usdtContract = new ethers.Contract(CONFIG.USDT_ADDRESS, USDT_ABI, signer);
        tokenContract = new ethers.Contract(CONFIG.TOKEN_ADDRESS, TOKEN_ABI, signer);
        stakingContract = new ethers.Contract(CONFIG.STAKING_ADDRESS, STAKING_ABI, signer);

        console.log('[CONTRACTS] ✅ All contracts initialized successfully');

        // Verify contracts are working by calling a simple view function
        try {
            const [usdtDecimals, arubDecimals] = await Promise.all([
                usdtContract.decimals(),
                tokenContract.decimals()
            ]);

            console.log('[CONTRACTS] ✅ Contracts verified:');
            console.log('  - USDT decimals:', usdtDecimals);
            console.log('  - ARUB decimals:', arubDecimals);

        } catch (verifyError) {
            console.warn('[CONTRACTS] ⚠️ Could not verify contracts:', verifyError.message);
        }

        // Export contracts globally for other modules
        window.usdtContract = usdtContract;
        window.tokenContract = tokenContract;
        window.stakingContract = stakingContract;

        // Trigger UI updates
        const event = new CustomEvent('contractsInitialized', {
            detail: { usdtContract, tokenContract, stakingContract, userAddress }
        });
        window.dispatchEvent(event);

        return { usdtContract, tokenContract, stakingContract };

    } catch (error) {
        console.error('[CONTRACTS] ❌ Error initializing contracts:', error);
        throw new Error('Failed to initialize contracts: ' + error.message);
    }
}

/**
 * Get contract instances
 * @returns {Object} { usdtContract, tokenContract, stakingContract }
 */
export function getContracts() {
    return {
        usdtContract,
        tokenContract,
        stakingContract,
        isInitialized: !!(usdtContract && tokenContract && stakingContract)
    };
}

/**
 * Check if contracts are initialized
 * @returns {boolean}
 */
export function areContractsInitialized() {
    return !!(usdtContract && tokenContract && stakingContract);
}

/**
 * Get user balances for all tokens
 * @param {string} address - User address
 * @returns {Promise<Object>} { usdtBalance, arubBalance }
 */
export async function getUserBalances(address) {
    if (!areContractsInitialized()) {
        throw new Error('Contracts not initialized');
    }

    try {
        const [usdtBalance, arubBalance] = await Promise.all([
            usdtContract.balanceOf(address),
            tokenContract.balanceOf(address)
        ]);

        return {
            usdtBalance,
            arubBalance,
            usdtBalanceFormatted: ethers.utils.formatUnits(usdtBalance, CONFIG.DECIMALS.USDT),
            arubBalanceFormatted: ethers.utils.formatUnits(arubBalance, CONFIG.DECIMALS.ARUB)
        };
    } catch (error) {
        console.error('[CONTRACTS] Error getting balances:', error);
        return {
            usdtBalance: ethers.BigNumber.from(0),
            arubBalance: ethers.BigNumber.from(0),
            usdtBalanceFormatted: '0',
            arubBalanceFormatted: '0'
        };
    }
}

/**
 * Get user staking information
 * @param {string} address - User address
 * @returns {Promise<Object>} Staking info
 */
export async function getUserStakingInfo(address) {
    if (!stakingContract) {
        throw new Error('Staking contract not initialized');
    }

    try {
        const userInfo = await stakingContract.getUserInfo(address);

        return {
            stakedAmount: userInfo[0],
            pendingRewards: userInfo[1],
            totalClaimed: userInfo[2],
            lastStakeTime: userInfo[3],
            currentAPY: userInfo[4],
            stakedAmountFormatted: ethers.utils.formatUnits(userInfo[0], CONFIG.DECIMALS.ARUB),
            pendingRewardsFormatted: ethers.utils.formatUnits(userInfo[1], CONFIG.DECIMALS.ARUB)
        };
    } catch (error) {
        console.error('[CONTRACTS] Error getting staking info:', error);
        return {
            stakedAmount: ethers.BigNumber.from(0),
            pendingRewards: ethers.BigNumber.from(0),
            totalClaimed: ethers.BigNumber.from(0),
            lastStakeTime: 0,
            currentAPY: 0,
            stakedAmountFormatted: '0',
            pendingRewardsFormatted: '0'
        };
    }
}

/**
 * Get pool statistics
 * @returns {Promise<Object>} Pool stats
 */
export async function getPoolStats() {
    // Try to use regular contract first, fallback to read-only
    const contract = stakingContract || readOnlyStakingContract;

    if (!contract) {
        console.warn('[CONTRACTS] No staking contract available');
        return {
            totalStaked: ethers.BigNumber.from(0),
            totalStakers: 0,
            totalRewardsDistributed: ethers.BigNumber.from(0),
            currentAPY: CONFIG.FALLBACK.APY,
            totalStakes: 0,
            totalUnstakes: 0,
            totalClaims: 0,
            totalStakedFormatted: '0'
        };
    }

    try {
        const stats = await contract.getPoolStats();

        // Новий контракт ARUBStakingV2:
        // getPoolStats() returns:
        // 0: totalUsdtStaked
        // 1: totalArubStaked
        // 2: totalUsdtStakers
        // 3: totalArubStakers
        // 4: totalStakers
        // 5: totalRewardsDistributed
        // 6: currentAPY (basis points)
        const totalUsdtStaked = stats[0];
        const totalArubStaked = stats[1];
        const totalStakers = stats[4].toNumber();
        const totalRewardsDistributed = stats[5];
        const currentAPY = stats[6].toNumber();

        const totalStakedCombined = totalUsdtStaked.add(totalArubStaked);

        return {
            totalStaked: totalStakedCombined,
            totalStakers,
            totalRewardsDistributed,
            currentAPY,
            totalStakes: 0,
            totalUnstakes: 0,
            totalClaims: 0,
            totalStakedFormatted: ethers.utils.formatUnits(totalStakedCombined, CONFIG.DECIMALS.ARUB)
        };
    } catch (error) {
        console.error('[CONTRACTS] Error getting pool stats:', error);
        return {
            totalStaked: ethers.BigNumber.from(0),
            totalStakers: 0,
            totalRewardsDistributed: ethers.BigNumber.from(0),
            currentAPY: CONFIG.FALLBACK.APY,
            totalStakes: 0,
            totalUnstakes: 0,
            totalClaims: 0,
            totalStakedFormatted: '0'
        };
    }
}

/**
 * Fetch current USD/RUB exchange rate from API
 * @returns {Promise<number|null>} Exchange rate or null if failed
 */
async function fetchUsdRubRate() {
    // Check cache first
    const now = Date.now();
    if (cachedUsdRubRate && (now - lastRateFetchTime) < RATE_CACHE_DURATION) {
        console.log('[CONTRACTS] Using cached USD/RUB rate:', cachedUsdRubRate);
        return cachedUsdRubRate;
    }

    try {
        console.log('[CONTRACTS] Fetching live USD/RUB exchange rate...');

        // Use exchangerate-api.com (free, no API key required)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        const rate = data.rates.RUB;

        if (!rate || typeof rate !== 'number') {
            throw new Error('Invalid rate data received');
        }

        // Cache the rate
        cachedUsdRubRate = rate;
        lastRateFetchTime = now;

        console.log('[CONTRACTS] ✅ Live USD/RUB rate fetched:', rate);
        return rate;

    } catch (error) {
        console.warn('[CONTRACTS] ⚠️ Failed to fetch USD/RUB rate:', error.message);
        return null;
    }
}

/**
 * Get current ARUB price from contract
 * @returns {Promise<number>} Price in USDT (привязано до курсу USD/RUB)
 */
export async function getArubPrice() {
    // 1) Основний варіант — живий форекс USD/RUB
    const liveRate = await fetchUsdRubRate();
    if (liveRate) {
        return { price: liveRate, source: 'forex-api' };
    }

    // 2) Резервний варіант — ончейн-оракул з токен-контракту (якщо доступний)
    const contract = tokenContract || readOnlyTokenContract;

    const formatRate = (bn) => {
        try {
            const num = parseFloat(ethers.utils.formatUnits(bn, CONFIG.DECIMALS.USDT));
            return Number.isFinite(num) && num > 0 ? num : null;
        } catch (err) {
            console.warn('[CONTRACTS] Failed to format rate:', err);
            return null;
        }
    };

    if (contract) {
        try {
            if (contract.currentRate) {
                const rateBn = await contract.currentRate();
                const rate = formatRate(rateBn);
                if (rate !== null) {
                    return { price: rate, source: 'oracle' };
                }
            }

            if (contract.oraclePrice) {
                const rateBn = await contract.oraclePrice();
                const rate = formatRate(rateBn);
                if (rate !== null) {
                    return { price: rate, source: 'oracle' };
                }
            }
        } catch (error) {
            console.error('[CONTRACTS] On-chain rate fetch failed', {
                code: error?.code,
                data: error?.data,
                message: error?.message
            });
        }
    }

    // 3) Якщо все впало — беремо статичний fallback з конфига
    console.warn('[CONTRACTS] Using fallback USD/RUB rate:', CONFIG.FALLBACK.ARUB_PRICE_USDT);
    return { price: CONFIG.FALLBACK.ARUB_PRICE_USDT, source: 'fallback' };
}
/**
 * Get total supply of ARUB tokens
 * @returns {Promise<number>} Total supply
 */
export async function getTotalSupplyArub() {
    const contract = tokenContract || readOnlyTokenContract;

    if (!contract) {
        console.warn('[CONTRACTS] No token contract available');
        return 0;
    }

    try {
        const supply = await contract.totalSupply();
        return parseFloat(ethers.utils.formatUnits(supply, CONFIG.DECIMALS.ARUB));
    } catch (error) {
        console.error('[CONTRACTS] Error getting ARUB total supply:', error);
        return 0;
    }
}

/**
 * Get detailed staking statistics
 * @returns {Promise<Object>} Detailed stats
 */
export async function getDetailedStats() {
    const stakingContractInstance = stakingContract || readOnlyStakingContract;
    const usdtContractInstance = usdtContract || (readOnlyProvider ? new ethers.Contract(CONFIG.USDT_ADDRESS, USDT_ABI, readOnlyProvider) : null);
    const arubContractInstance = tokenContract || readOnlyTokenContract;

    if (!stakingContractInstance) {
        console.warn('[CONTRACTS] No staking contract available');
        return {
            totalStakedUsdt: 0,
            totalStakedArub: 0
        };
    }

    try {
        // Get token balances on staking contract address
        // This shows how much USDT and ARUB are locked in the staking contract
        const promises = [];

        if (usdtContractInstance) {
            promises.push(usdtContractInstance.balanceOf(CONFIG.STAKING_ADDRESS));
        } else {
            promises.push(Promise.resolve(ethers.BigNumber.from(0)));
        }

        if (arubContractInstance) {
            promises.push(arubContractInstance.balanceOf(CONFIG.STAKING_ADDRESS));
        } else {
            promises.push(Promise.resolve(ethers.BigNumber.from(0)));
        }

        const [usdtBalance, arubBalance] = await Promise.all(promises);

        return {
            totalStakedUsdt: parseFloat(ethers.utils.formatUnits(usdtBalance, CONFIG.DECIMALS.USDT)),
            totalStakedArub: parseFloat(ethers.utils.formatUnits(arubBalance, CONFIG.DECIMALS.ARUB))
        };
    } catch (error) {
        console.error('[CONTRACTS] Error getting detailed stats:', error);
        return {
            totalStakedUsdt: 0,
            totalStakedArub: 0
        };
    }
}

/**
 * Check USDT allowance for a spender
 * @param {string} owner - Owner address
 * @param {string} spender - Spender address
 * @returns {Promise<BigNumber>} Allowance amount
 */
export async function checkUsdtAllowance(owner, spender) {
    if (!usdtContract) {
        throw new Error('USDT contract not initialized');
    }

    try {
        return await usdtContract.allowance(owner, spender);
    } catch (error) {
        console.error('[CONTRACTS] Error checking USDT allowance:', error);
        return ethers.BigNumber.from(0);
    }
}

/**
 * Check ARUB allowance for a spender
 * @param {string} owner - Owner address
 * @param {string} spender - Spender address
 * @returns {Promise<BigNumber>} Allowance amount
 */
export async function checkArubAllowance(owner, spender) {
    if (!tokenContract) {
        throw new Error('ARUB contract not initialized');
    }

    try {
        return await tokenContract.allowance(owner, spender);
    } catch (error) {
        console.error('[CONTRACTS] Error checking ARUB allowance:', error);
        return ethers.BigNumber.from(0);
    }
}

/**
 * Approve USDT spending
 * @param {string} spender - Spender address
 * @param {BigNumber} amount - Amount to approve
 * @returns {Promise<Object>} Transaction receipt
 */
export async function approveUsdt(spender, amount = ethers.constants.MaxUint256) {
    if (!usdtContract) {
        throw new Error('USDT contract not initialized');
    }

    console.log('[CONTRACTS] Approving USDT for:', spender);
    const tx = await usdtContract.approve(spender, amount);
    console.log('[CONTRACTS] Approval TX:', tx.hash);

    const receipt = await tx.wait();
    console.log('[CONTRACTS] ✅ USDT approved');

    return receipt;
}

/**
 * Approve ARUB spending
 * @param {string} spender - Spender address
 * @param {BigNumber} amount - Amount to approve
 * @returns {Promise<Object>} Transaction receipt
 */
export async function approveArub(spender, amount = ethers.constants.MaxUint256) {
    if (!tokenContract) {
        throw new Error('ARUB contract not initialized');
    }

    console.log('[CONTRACTS] Approving ARUB for:', spender);
    const tx = await tokenContract.approve(spender, amount);
    console.log('[CONTRACTS] Approval TX:', tx.hash);

    const receipt = await tx.wait();
    console.log('[CONTRACTS] ✅ ARUB approved');

    return receipt;
}
