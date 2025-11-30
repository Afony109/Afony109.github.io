/**
 * Staking Module - USDT & ARUB pools
 */

import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

import { CONFIG, getCurrentTier } from './config.js';
import {
    showNotification,
    showLoading,
    showLockedState,
    formatTokenAmount,
    formatUSD,
    createPoolBadge,
    createProgressBar,
    getErrorMessage,
    createInfoBanner
} from './ui.js';
import {
    getContracts,
    getUserBalances,
    getUserStakingInfo,
    getPoolStats,
    getArubPrice,
    checkUsdtAllowance,
    checkArubAllowance,
    approveUsdt,
    approveArub,
    getDetailedStats
} from './contracts.js';
import { getCurrentRate } from './trading.js'; // пока пусть будет, вдруг дальше пригодится

/* ===========================================================
   INIT
=========================================================== */

export function initStakingModule() {
    console.log('[STAKING] Initializing staking module...');

    window.addEventListener('contractsInitialized', async (event) => {
        const { userAddress } = event.detail;
        console.log('[STAKING] Contracts initialized, updating staking UI...');
        await updateStakingUI(userAddress);
    });

    setInterval(async () => {
        const { userAddress } = window;
        if (userAddress) {
            await updateStakingUI(userAddress);
        }
    }, CONFIG.UI.STATS_UPDATE_INTERVAL);
}

/* ===========================================================
   MAIN UI UPDATE
=========================================================== */

export async function updateStakingUI(userAddress) {
    const stakingInterface = document.getElementById('stakingInterface');
    if (!stakingInterface) {
        console.warn('[STAKING] Staking interface element not found');
        return;
    }

    if (!userAddress) {
        showLockedState(stakingInterface, 'Підключіть гаманець для стейкінгу');
        return;
    }

    showLoading(stakingInterface, 'Завантаження даних стейкінгу...');

    try {
        const [
            { usdtBalance, arubBalance },
            stakingInfo,
            poolStats,
            arubPriceInfo,
            detailedStats
        ] = await Promise.all([
            getUserBalances(userAddress),
            getUserStakingInfo(userAddress),
            getPoolStats(),
            getArubPrice(),
            getDetailedStats()
        ]);

        const arubPrice = arubPriceInfo.price;

        // общая стоимость TVL (все юзеры)
        const totalStakedValueInUsd =
            detailedStats.totalStakedUsdt + (detailedStats.totalStakedArub * arubPrice);

        const tierInfo = getCurrentTier(totalStakedValueInUsd);

        // прогресс до след. tier
        let progressPercent = 0;
        let nextTierInfo = null;

        if (tierInfo.tier < CONFIG.STAKING.TIER_THRESHOLDS_USD.length) {
            const prevThreshold = tierInfo.tier > 0
                ? CONFIG.STAKING.TIER_THRESHOLDS_USD[tierInfo.tier - 1]
                : 0;
            const currentThreshold = CONFIG.STAKING.TIER_THRESHOLDS_USD[tierInfo.tier];
            const tierRange = currentThreshold - prevThreshold;
            const progress = totalStakedValueInUsd - prevThreshold;

            progressPercent = tierRange > 0 ? (progress / tierRange) * 100 : 0;
            progressPercent = Math.max(0, Math.min(progressPercent, 100));

            const remaining = Math.max(0, currentThreshold - totalStakedValueInUsd);
            nextTierInfo = {
                threshold: currentThreshold,
                remaining,
                nextAPY: tierInfo.nextApy
            };
        } else {
            progressPercent = 100;
        }

        // сохраним значения стейка юзера глобально для MAX
        window.__userUsdtStakedFormatted = stakingInfo.usdtStakedFormatted;
        window.__userArubStakedFormatted = stakingInfo.arubStakedFormatted;

        stakingInterface.innerHTML = generateStakingHTML({
            usdtBalance,
            arubBalance,
            stakingInfo,
            poolStats,
            arubPrice,
            tierInfo,
            progressPercent,
            nextTierInfo,
            totalStakedValueInUsd
        });

    } catch (error) {
        console.error('[STAKING] Error updating staking UI:', error);
        stakingInterface.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--red);">
                <div style="font-size: 3em; margin-bottom: 20px;">⚠️</div>
                <p style="font-size: 1.3em;">Помилка завантаження інтерфейсу стейкінгу</p>
                <p style="color: var(--gray); margin-top: 10px;">${getErrorMessage(error)}</p>
            </div>
        `;
    }
}

/* ===========================================================
   HTML GENERATION
=========================================================== */

function generateStakingHTML(data) {
    const {
        usdtBalance,
        arubBalance,
        stakingInfo,
        poolStats,
        arubPrice,
        tierInfo,
        progressPercent,
        nextTierInfo,
        totalStakedValueInUsd
    } = data;

    const currentAPY = tierInfo.apy / 100;

    // ВАЖНО: тут отдельно стейк по USDT и ARUB
    const userUsdtStaked = parseFloat(stakingInfo.usdtStakedFormatted || '0');
    const userArubStaked = parseFloat(stakingInfo.arubStakedFormatted || '0');
    const userTotalValueUsd = userUsdtStaked + userArubStaked * arubPrice;

    const tiersHTML = CONFIG.STAKING.TIER_APYS.map((apy, index) => {
        const isActive = index === tierInfo.tier;
        const tierAPY = apy / 100;

        let rangeText;
        if (index === 0) {
            rangeText = `До ${formatUSD(CONFIG.STAKING.TIER_THRESHOLDS_USD[index], 0)}`;
        } else if (index === CONFIG.STAKING.TIER_APYS.length - 1) {
            rangeText = `${formatUSD(CONFIG.STAKING.TIER_THRESHOLDS_USD[index - 1], 0)}+`;
        } else {
            rangeText = `${formatUSD(
                CONFIG.STAKING.TIER_THRESHOLDS_USD[index - 1],
                0
            )} - ${formatUSD(CONFIG.STAKING.TIER_THRESHOLDS_USD[index], 0)}`;
        }

        return `
            <div style="background:${isActive ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.3)'};padding:20px;border-radius:15px;border:2px solid ${
                isActive ? 'var(--ukraine-yellow)' : 'rgba(255,255,255,0.1)'
            };transition:all .3s;${isActive ? 'box-shadow:0 8px 25px rgba(255,215,0,0.3);' : ''}">
                <div style="text-align:center;">
                    <div style="font-size:.9em;color:var(--gray);margin-bottom:8px;">
                        Tier ${index + 1} ${isActive ? '🔥' : ''}
                    </div>
                    <div style="font-size:2.2em;font-weight:bold;color:${
                        isActive ? 'var(--ukraine-yellow)' : '#888'
                    };margin:10px 0;">
                        ${tierAPY.toFixed(0)}%
                    </div>
                    <div style="font-size:.85em;color:var(--gray);line-height:1.4;">
                        ${rangeText}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <!-- APY Banner -->
        <div style="background:linear-gradient(135deg,rgba(0,87,183,.2),rgba(255,215,0,.2));border:2px solid var(--ukraine-blue);border-radius:20px;padding:40px;margin-bottom:40px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-50%;right:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,215,0,.1) 0%,transparent 70%);animation:rotate 20s linear infinite;"></div>
            <div style="position:relative;z-index:1;">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;margin-bottom:30px;">
                    <div>
                        <div style="display:flex;align-items:center;gap:15px;margin-bottom:10px;">
                            <span style="font-size:1.5em;">📊</span>
                            <span style="font-size:1.8em;font-weight:bold;">Динамічний APY</span>
                        </div>
                        <div style="color:var(--ukraine-yellow);font-size:1.1em;font-weight:600;">
                            Tier ${tierInfo.tier + 1}: Поточний рівень винагороди
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:3.5em;font-weight:bold;background:linear-gradient(45deg,var(--ukraine-blue),var(--ukraine-yellow));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;">
                            ${currentAPY.toFixed(0)}%
                        </div>
                        <div style="color:var(--ukraine-yellow);font-size:1em;margin-top:5px;">
                            Поточний APY
                        </div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:15px;margin-bottom:30px;">
                    ${tiersHTML}
                </div>

                ${createProgressBar(progressPercent, 'Прогрес до наступного рівня')}

                ${
                    nextTierInfo && nextTierInfo.remaining > 0
                        ? `
                    <div style="margin-top:15px;padding:15px;background:rgba(255,215,0,.1);border-left:4px solid var(--ukraine-yellow);border-radius:8px;">
                        <div style="color:var(--gray);font-size:.9em;margin-bottom:5px;">До наступного рівня:</div>
                        <div style="font-size:1.2em;color:var(--ukraine-yellow);font-weight:600;">
                            ${formatUSD(nextTierInfo.remaining, 0)} до ${(nextTierInfo.nextAPY / 100).toFixed(0)}% APY
                        </div>
                    </div>
                `
                        : `
                    <div style="margin-top:15px;padding:15px;background:rgba(255,215,0,.15);border-left:4px solid var(--ukraine-yellow);border-radius:8px;">
                        <div style="color:var(--ukraine-yellow);font-size:1.1em;font-weight:600;">
                            🏆 Досягнуто максимальний рівень! APY: ${currentAPY.toFixed(0)}%
                        </div>
                    </div>
                `
                }

                ${createInfoBanner(`
                    💡 <span style="color:white;font-weight:600;">Чим раніше застейкаєте</span> - тим вищий APY!
                    APY залежить від <span style="color:var(--ukraine-yellow);font-weight:600;">загальної вартості застейканих активів у доларах</span> (USDT + ARUB за поточним курсом).
                    <br><br>
                    💰 Всього застейкано: <strong>${formatUSD(totalStakedValueInUsd, 0)}</strong> |
                    📊 Ціна ARUB: <strong>${arubPrice.toFixed(2)} USDT</strong>
                `, 'info')}
            </div>
        </div>

        <div class="staking-grid">
            <!-- STAKE USDT -->
            <div class="staking-card">
                <div class="card-header">
                    <div class="card-icon">💵</div>
                    <h3 class="card-title">
                        Застейкати USDT
                        ${createPoolBadge('usdt')}
                    </h3>
                </div>

                <div class="input-group">
                    <label class="input-label">Сума USDT</label>
                    <div class="input-wrapper">
                        <input type="number" class="input-field" id="stakeUsdtAmount"
                               placeholder="0.00" step="0.01"
                               min="${CONFIG.STAKING.MIN_STAKE_USDT}">
                        <button class="max-btn" onclick="window.setMaxStakeUsdt()">MAX</button>
                    </div>
                </div>

                <div class="info-row">
                    <span class="info-label">Ваш баланс USDT:</span>
                    <span class="info-value">
                        ${formatTokenAmount(usdtBalance, CONFIG.DECIMALS.USDT)} USDT
                    </span>
                </div>

                <div class="info-row">
                    <span class="info-label">Поточний APY:</span>
                    <span class="info-value" style="color:#10b981;">${currentAPY.toFixed(0)}%</span>
                </div>

                <div class="info-row">
                    <span class="info-label">Мінімум для стейкінгу:</span>
                    <span class="info-value">${CONFIG.STAKING.MIN_STAKE_USDT} USDT</span>
                </div>

                ${createInfoBanner(
                    '💵 Стейкайте USDT (1 USDT = $1) для отримання винагород в ARUB!',
                    'info'
                )}

                <button class="action-btn" onclick="window.stakeUsdtTokens()">
                    💵 Застейкати в USDT Pool
                </button>
            </div>

            <!-- STAKE ARUB -->
            <div class="staking-card">
                <div class="card-header">
                    <div class="card-icon">💎</div>
                    <h3 class="card-title">
                        Застейкати ARUB
                        ${createPoolBadge('arub')}
                    </h3>
                </div>

                <div class="input-group">
                    <label class="input-label">Кількість ARUB</label>
                    <div class="input-wrapper">
                        <input type="number" class="input-field" id="stakeArubAmount"
                               placeholder="0.00" step="0.01"
                               min="${CONFIG.STAKING.MIN_STAKE_ARUB}">
                        <button class="max-btn" onclick="window.setMaxStakeArub()">MAX</button>
                    </div>
                </div>

                <div class="info-row">
                    <span class="info-label">Ваш баланс ARUB:</span>
                    <span class="info-value">
                        ${formatTokenAmount(arubBalance, CONFIG.DECIMALS.ARUB)} ARUB
                    </span>
                </div>

                <div class="info-row">
                    <span class="info-label">Поточний APY:</span>
                    <span class="info-value" style="color:#10b981;">${currentAPY.toFixed(0)}%</span>
                </div>

                <div class="info-row">
                    <span class="info-label">Мінімум для стейкінгу:</span>
                    <span class="info-value">${CONFIG.STAKING.MIN_STAKE_ARUB} ARUB</span>
                </div>

                ${createInfoBanner(
                    '💎 Стейкайте ARUB для отримання нагород в ARUB!',
                    'warning'
                )}

                <button class="action-btn" onclick="window.stakeArubTokens()">
                    💎 Застейкати в ARUB Pool
                </button>
            </div>

            <!-- USER STAKING INFO -->
            <div class="staking-card">
                <div class="card-header">
                    <div class="card-icon">📊</div>
                    <h3 class="card-title">Ваш стейкінг</h3>
                </div>

                <div style="text-align:center;padding:20px 0;">
                    <div style="font-size:2.2em;font-weight:bold;background:linear-gradient(45deg,var(--ukraine-blue),var(--ukraine-yellow));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px;">
                        ${formatUSD(userTotalValueUsd, 0)}
                    </div>
                    <div style="color:var(--gray);font-size:1em;margin-bottom:10px;">
                        Загальна вартість стейкінгу (USDT + ARUB)
                    </div>

                    <div style="font-size:.95em;color:var(--gray);line-height:1.6;">
                        USDT в стейкінгу:
                        <span style="color:white;font-weight:600;">
                            ${stakingInfo.usdtStakedFormatted} USDT
                        </span><br>
                        ARUB в стейкінгу:
                        <span style="color:white;font-weight:600;">
                            ${stakingInfo.arubStakedFormatted} ARUB
                        </span>
                    </div>
                </div>

                <div class="info-row">
                    <span class="info-label">Винагороди:</span>
                    <span class="info-value">
                        ${stakingInfo.pendingRewardsFormatted} ARUB
                    </span>
                </div>

                <div class="info-row">
                    <span class="info-label">Ваш APY:</span>
                    <span class="info-value" style="color:#10b981;">
                        ${currentAPY.toFixed(0)}%
                    </span>
                </div>

                <button class="action-btn"
                        onclick="window.claimRewards()"
                        ${stakingInfo.pendingRewards.isZero() ? 'disabled' : ''}>
                    💰 Забрати винагороди
                </button>
            </div>

            <!-- WARNING ABOUT POOLS -->
            <div style="grid-column:1/-1;background:linear-gradient(135deg,rgba(255,165,0,.2),rgba(255,69,0,.2));border:3px solid #ff6b00;border-radius:20px;padding:30px;box-shadow:0 10px 40px rgba(255,107,0,.3);">
                <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px;">
                    <div style="font-size:4em;">⚠️</div>
                    <div>
                        <h3 style="color:#ff6b00;font-size:1.8em;margin:0 0 10px 0;font-weight:800;">КРИТИЧНО ВАЖЛИВО!</h3>
                        <p style="color:white;font-size:1.1em;margin:0;line-height:1.6;">
                            USDT та ARUB мають <strong>окремі пули</strong> стейкінгу.
                        </p>
                    </div>
                </div>
                ${createInfoBanner(
                    'Якщо спробувати зняти токени не з того пулу, транзакція буде відхилена (execution reverted).',
                    'error'
                )}
            </div>

            <!-- UNSTAKE USDT -->
            <div class="staking-card">
                <div class="card-header">
                    <div class="card-icon">💸</div>
                    <h3 class="card-title">
                        Зняти USDT
                        ${createPoolBadge('usdt')}
                    </h3>
                </div>

                <div class="input-group">
                    <label class="input-label">Сума USDT</label>
                    <div class="input-wrapper">
                        <input type="number" class="input-field"
                               id="unstakeUsdtAmount"
                               value="${stakingInfo.usdtStakedFormatted}"
                               step="0.01" min="0">
                        <button class="max-btn" onclick="window.setMaxUnstakeUsdt()">MAX</button>
                    </div>
                </div>

                ${createInfoBanner(`
                    1️⃣ Натисніть <strong>MAX</strong>, щоб підставити ваш стейк USDT<br>
                    2️⃣ Натисніть <strong>💸 Зняти з USDT Pool</strong>
                `, 'info')}

                <button class="action-btn" onclick="window.unstakeUsdtTokens()">
                    💸 Зняти з USDT Pool
                </button>
            </div>

            <!-- UNSTAKE ARUB -->
            <div class="staking-card">
                <div class="card-header">
                    <div class="card-icon">🔓</div>
                    <h3 class="card-title">
                        Зняти ARUB
                        ${createPoolBadge('arub')}
                    </h3>
                </div>

                <div class="input-group">
                    <label class="input-label">Кількість ARUB</label>
                    <div class="input-wrapper">
                        <input type="number" class="input-field"
                               id="unstakeArubAmount"
                               value="${stakingInfo.arubStakedFormatted}"
                               step="0.01" min="0">
                        <button class="max-btn" onclick="window.setMaxUnstakeArub()">MAX</button>
                    </div>
                </div>

                ${createInfoBanner(`
                    1️⃣ Натисніть <strong>MAX</strong>, щоб підставити ваш стейк ARUB<br>
                    2️⃣ Натисніть <strong>🔓 Зняти з ARUB Pool</strong>
                `, 'warning')}

                <button class="action-btn" onclick="window.unstakeArubTokens()">
                    🔓 Зняти з ARUB Pool
                </button>
            </div>
        </div>
    `;
}

/* ===========================================================
   STAKE / UNSTAKE / CLAIM ACTIONS
=========================================================== */

export async function stakeUsdtTokens() {
    const input = document.getElementById('stakeUsdtAmount');
    const value = parseFloat(input?.value || '0');

    if (!value || value < CONFIG.STAKING.MIN_STAKE_USDT) {
        showNotification(`❌ Мінімум для стейкінгу: ${CONFIG.STAKING.MIN_STAKE_USDT} USDT`, 'error');
        return;
    }

    const { userAddress } = window;
    const { stakingContract } = getContracts();
    if (!userAddress || !stakingContract) {
        showNotification('❌ Контракти не ініціалізовані', 'error');
        return;
    }

    try {
        const amountWei = ethers.utils.parseUnits(
            value.toFixed(CONFIG.DECIMALS.USDT),
            CONFIG.DECIMALS.USDT
        );

        showNotification('🔄 Перевірка дозволу USDT...', 'info');
        const allowance = await checkUsdtAllowance(userAddress, CONFIG.STAKING_ADDRESS);

        if (allowance.lt(amountWei)) {
            await approveUsdt(CONFIG.STAKING_ADDRESS);
        }

        showNotification('🔄 Стейкінг USDT...', 'info');
        const tx = await stakingContract.stakeUsdt(amountWei);
        await tx.wait();

        showNotification('✅ USDT застейкано!', 'success');
        input.value = '';
        await updateStakingUI(userAddress);
    } catch (e) {
        console.error('[STAKING] stakeUsdtTokens error:', e);
        showNotification('❌ Помилка стейкінгу USDT: ' + getErrorMessage(e), 'error');
    }
}

export async function stakeArubTokens() {
    const input = document.getElementById('stakeArubAmount');
    const value = parseFloat(input?.value || '0');

    if (!value || value < CONFIG.STAKING.MIN_STAKE_ARUB) {
        showNotification(`❌ Мінімум для стейкінгу: ${CONFIG.STAKING.MIN_STAKE_ARUB} ARUB`, 'error');
        return;
    }

    const { userAddress } = window;
    const { stakingContract } = getContracts();
    if (!userAddress || !stakingContract) {
        showNotification('❌ Контракти не ініціалізовані', 'error');
        return;
    }

    try {
        const amountWei = ethers.utils.parseUnits(
            value.toFixed(CONFIG.DECIMALS.ARUB),
            CONFIG.DECIMALS.ARUB
        );

        showNotification('🔄 Перевірка дозволу ARUB...', 'info');
        const allowance = await checkArubAllowance(userAddress, CONFIG.STAKING_ADDRESS);

        if (allowance.lt(amountWei)) {
            await approveArub(CONFIG.STAKING_ADDRESS);
        }

        showNotification('🔄 Стейкінг ARUB...', 'info');
        const tx = await stakingContract.stakeArub(amountWei);
        await tx.wait();

        showNotification('✅ ARUB застейкано!', 'success');
        input.value = '';
        await updateStakingUI(userAddress);
    } catch (e) {
        console.error('[STAKING] stakeArubTokens error:', e);
        showNotification('❌ Помилка стейкінгу ARUB: ' + getErrorMessage(e), 'error');
    }
}

export async function unstakeUsdtTokens() {
    const input = document.getElementById('unstakeUsdtAmount');
    const value = parseFloat(input?.value || '0');

    if (!value || value <= 0) {
        showNotification('❌ Введіть суму USDT для зняття', 'error');
        return;
    }

    const { userAddress } = window;
    const { stakingContract } = getContracts();
    if (!userAddress || !stakingContract) {
        showNotification('❌ Контракти не ініціалізовані', 'error');
        return;
    }

    try {
        const amountWei = ethers.utils.parseUnits(
            value.toFixed(CONFIG.DECIMALS.USDT),
            CONFIG.DECIMALS.USDT
        );

        showNotification('🔄 Зняття USDT зі стейкінгу...', 'info');
        const tx = await stakingContract.unstakeUsdt(amountWei);
        await tx.wait();

        showNotification('✅ USDT знято зі стейкінгу!', 'success');
        input.value = '';
        await updateStakingUI(userAddress);
    } catch (e) {
        console.error('[STAKING] unstakeUsdtTokens error:', e);
        showNotification('❌ Помилка зняття USDT: ' + getErrorMessage(e), 'error');
    }
}

export async function unstakeArubTokens() {
    const input = document.getElementById('unstakeArubAmount');
    const value = parseFloat(input?.value || '0');

    if (!value || value <= 0) {
        showNotification('❌ Введіть кількість ARUB для зняття', 'error');
        return;
    }

    const { userAddress } = window;
    const { stakingContract } = getContracts();
    if (!userAddress || !stakingContract) {
        showNotification('❌ Контракти не ініціалізовані', 'error');
        return;
    }

    try {
        const amountWei = ethers.utils.parseUnits(
            value.toFixed(CONFIG.DECIMALS.ARUB),
            CONFIG.DECIMALS.ARUB
        );

        showNotification('🔄 Зняття ARUB зі стейкінгу...', 'info');
        const tx = await stakingContract.unstakeArub(amountWei);
        await tx.wait();

        showNotification('✅ ARUB знято зі стейкінгу!', 'success');
        input.value = '';
        await updateStakingUI(userAddress);
    } catch (e) {
        console.error('[STAKING] unstakeArubTokens error:', e);
        showNotification('❌ Помилка зняття ARUB: ' + getErrorMessage(e), 'error');
    }
}

export async function claimRewards() {
    const { userAddress } = window;
    const { stakingContract } = getContracts();
    if (!userAddress || !stakingContract) {
        showNotification('❌ Контракти не ініціалізовані', 'error');
        return;
    }

    try {
        showNotification('🔄 Забір винагород...', 'info');
        const tx = await stakingContract.claimRewards(false); // без компаунду
        await tx.wait();

        showNotification('✅ Винагороди забрано!', 'success');
        await updateStakingUI(userAddress);
    } catch (e) {
        console.error('[STAKING] claimRewards error:', e);
        showNotification('❌ Помилка отримання винагород: ' + getErrorMessage(e), 'error');
    }
}

/* ===========================================================
   MAX HELPERS
=========================================================== */

export function setMaxStakeUsdt() {
    const { usdtBalanceFormatted } = window || {};
    const el = document.getElementById('stakeUsdtAmount');
    if (el && window.usdtContract && window.userAddress) {
        // пусть юзер сам ограничивает, тут оставим как есть
    }
}

export function setMaxStakeArub() {
    const el = document.getElementById('stakeArubAmount');
    // можно доработать по желанию (использовать баланс ARUB)
}

export function setMaxUnstakeUsdt() {
    const el = document.getElementById('unstakeUsdtAmount');
    if (el) el.value = window.__userUsdtStakedFormatted || '0';
}

export function setMaxUnstakeArub() {
    const el = document.getElementById('unstakeArubAmount');
    if (el) el.value = window.__userArubStakedFormatted || '0';
}

/* ===========================================================
   WINDOW BINDINGS
=========================================================== */

window.stakeUsdtTokens = stakeUsdtTokens;
window.stakeArubTokens = stakeArubTokens;
window.unstakeUsdtTokens = unstakeUsdtTokens;
window.unstakeArubTokens = unstakeArubTokens;
window.claimRewards = claimRewards;
window.setMaxUnstakeUsdt = setMaxUnstakeUsdt;
window.setMaxUnstakeArub = setMaxUnstakeArub;
window.setMaxStakeUsdt = setMaxStakeUsdt;
window.setMaxStakeArub = setMaxStakeArub;
