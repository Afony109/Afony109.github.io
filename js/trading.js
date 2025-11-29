/**
 * Trading Module
 * Handles buying and selling of ARUB tokens
 */

// Import ethers.js as ES module
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

import { CONFIG, calculateBuyAmount, calculateSellAmount } from './config.js';
import { showNotification, showLoading, showLockedState, formatTokenAmount, formatUSD, getErrorMessage } from './ui.js';
import { getContracts, getUserBalances, getArubPrice, checkUsdtAllowance, approveUsdt } from './contracts.js';

let currentRate = CONFIG.FALLBACK.ARUB_PRICE_USDT;

/**
 * Initialize trading module
 */
export function initTradingModule() {
    console.log('[TRADING] Initializing trading module...');

    // Listen for contract initialization
    window.addEventListener('contractsInitialized', async (event) => {
        const { userAddress } = event.detail;
        console.log('[TRADING] Contracts initialized, updating trading UI...');
        await updateTradingUI(userAddress);
    });

    // Update price periodically
    setInterval(async () => {
        try {
            const priceInfo = await getArubPrice();
            currentRate = priceInfo.price;
            console.log('[TRADING] Updated ARUB price:', currentRate);
        } catch (error) {
            console.error('[TRADING] Error updating price:', error);
        }
    }, CONFIG.UI.PRICE_UPDATE_INTERVAL);
}

/**
 * Update trading UI with user balances and trading interface
 * @param {string} userAddress - User wallet address
 */
export async function updateTradingUI(userAddress) {
    const tradingInterface = document.getElementById('tradingInterface');
    if (!tradingInterface) {
        console.warn('[TRADING] Trading interface element not found');
        return;
    }

    if (!userAddress) {
        showLockedState(tradingInterface, 'Підключіть гаманець для торгівлі токенами');
        return;
    }

    showLoading(tradingInterface, 'Завантаження даних торгівлі...');

    try {
        const { usdtBalance, arubBalance } = await getUserBalances(userAddress);
        const priceInfo = await getArubPrice();
        currentRate = priceInfo.price;

        tradingInterface.innerHTML = `
            <div class="staking-grid">
                <!-- Buy ARUB Card -->
                <div class="staking-card">
                    <div class="card-header">
                        <div class="card-icon">💰</div>
                        <h3 class="card-title">Купити ARUB</h3>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Сума USDT для купівлі</label>
                        <div class="input-wrapper">
                            <input type="number"
                                   class="input-field"
                                   id="buyAmount"
                                   placeholder="0.00"
                                   step="0.01"
                                   min="1">
                            <button class="max-btn" onclick="window.setMaxBuy()">MAX</button>
                        </div>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Отримаєте ARUB:</span>
                        <span class="info-value" id="buyReceiveAmount">0</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Комісія (0.5%):</span>
                        <span class="info-value" id="buyFeeAmount">0 USDT</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Ваш баланс USDT:</span>
                        <span class="info-value">${formatTokenAmount(usdtBalance, CONFIG.DECIMALS.USDT)} USDT</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Ціна ARUB:</span>
                        <span class="info-value">${currentRate.toFixed(2)} USDT</span>
                    </div>

                    <div style="background: rgba(0,87,183,0.1); padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <p style="color: var(--gray); font-size: 0.9em; line-height: 1.6; margin: 0;">
                            💡 <strong style="color: white;">Як це працює:</strong> При купівлі ARUB використовується функція <code style="color: var(--ukraine-yellow);">mint()</code>.
                            Ваші USDT переводяться на контракт токена, і ви отримуєте ARUB за поточним курсом USDT/RUB.
                            Комісія ${CONFIG.FEES.BUY_FEE * 100}% йде на розвиток проекту.
                        </p>
                    </div>

                    <button class="action-btn" onclick="window.buyTokens()">
                        💰 Купити ARUB
                    </button>
                </div>

                <!-- Sell ARUB Card -->
                <div class="staking-card">
                    <div class="card-header">
                        <div class="card-icon">💵</div>
                        <h3 class="card-title">Продати ARUB</h3>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Кількість ARUB для продажу</label>
                        <div class="input-wrapper">
                            <input type="number"
                                   class="input-field"
                                   id="sellAmount"
                                   placeholder="0.00"
                                   step="0.01"
                                   min="0">
                            <button class="max-btn" onclick="window.setMaxSell()">MAX</button>
                        </div>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Отримаєте USDT:</span>
                        <span class="info-value" id="sellReceiveAmount">0</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Комісія (1%):</span>
                        <span class="info-value" id="sellFeeAmount">0 USDT</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Ваш баланс ARUB:</span>
                        <span class="info-value">${formatTokenAmount(arubBalance, CONFIG.DECIMALS.ARUB)} ARUB</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Ціна ARUB:</span>
                        <span class="info-value">${currentRate.toFixed(2)} USDT</span>
                    </div>

                    <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <p style="color: var(--gray); font-size: 0.9em; line-height: 1.6; margin: 0;">
                            💡 <strong style="color: white;">Як це працює:</strong> При продажу ARUB використовується функція <code style="color: var(--ukraine-yellow);">burn
