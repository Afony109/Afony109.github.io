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
            currentRate = await getArubPrice();
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
        currentRate = await getArubPrice();

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
                            💡 <strong style="color: white;">Як це працює:</strong> При продажу ARUB використовується функція <code style="color: var(--ukraine-yellow);">burn()</code>.
                            Ваші ARUB токени спалюються, і ви отримуєте USDT за поточним курсом.
                            Комісія ${CONFIG.FEES.SELL_FEE * 100}% утримується для стабільності системи.
                        </p>
                    </div>

                    <button class="action-btn" onclick="window.sellTokens()">
                        💵 Продати ARUB
                    </button>
                </div>
            </div>
        `;

        // Setup input listeners for real-time calculations
        const buyInput = document.getElementById('buyAmount');
        const sellInput = document.getElementById('sellAmount');

        if (buyInput) {
            buyInput.addEventListener('input', updateBuyCalculation);
        }

        if (sellInput) {
            sellInput.addEventListener('input', updateSellCalculation);
        }

    } catch (error) {
        console.error('[TRADING] Error updating trading UI:', error);
        tradingInterface.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--red);">
                <div style="font-size: 3em; margin-bottom: 20px;">⚠️</div>
                <p style="font-size: 1.3em;">Помилка завантаження інтерфейсу торгівлі</p>
                <p style="color: var(--gray); margin-top: 10px;">${getErrorMessage(error)}</p>
            </div>
        `;
    }
}

/**
 * Update buy calculation display
 */
function updateBuyCalculation() {
    const buyAmountInput = document.getElementById('buyAmount');
    const receiveEl = document.getElementById('buyReceiveAmount');
    const feeEl = document.getElementById('buyFeeAmount');

    if (!buyAmountInput || !receiveEl || !feeEl) return;

    const amount = parseFloat(buyAmountInput.value) || 0;

    if (amount > 0) {
        const calc = calculateBuyAmount(amount, currentRate);
        receiveEl.textContent = `${calc.arubReceived.toFixed(6)} ARUB`;
        feeEl.textContent = `${calc.fee.toFixed(4)} USDT`;
    } else {
        receiveEl.textContent = '0';
        feeEl.textContent = '0 USDT';
    }
}

/**
 * Update sell calculation display
 */
function updateSellCalculation() {
    const sellAmountInput = document.getElementById('sellAmount');
    const receiveEl = document.getElementById('sellReceiveAmount');
    const feeEl = document.getElementById('sellFeeAmount');

    if (!sellAmountInput || !receiveEl || !feeEl) return;

    const amount = parseFloat(sellAmountInput.value) || 0;

    if (amount > 0) {
        const calc = calculateSellAmount(amount, currentRate);
        receiveEl.textContent = `${calc.usdtReceived.toFixed(4)} USDT`;
        feeEl.textContent = `${calc.fee.toFixed(4)} USDT`;
    } else {
        receiveEl.textContent = '0';
        feeEl.textContent = '0 USDT';
    }
}

/**
 * Set max USDT for buying
 */
export async function setMaxBuy() {
    const { usdtContract } = getContracts();
    const { userAddress } = window;

    if (!usdtContract || !userAddress) return;

    try {
        const balance = await usdtContract.balanceOf(userAddress);
        const maxAmount = ethers.utils.formatUnits(balance, CONFIG.DECIMALS.USDT);

        const buyInput = document.getElementById('buyAmount');
        if (buyInput) {
            buyInput.value = maxAmount;
            updateBuyCalculation();
        }
    } catch (error) {
        console.error('[TRADING] Error setting max buy:', error);
    }
}

/**
 * Set max ARUB for selling
 */
export async function setMaxSell() {
    const { tokenContract } = getContracts();
    const { userAddress } = window;

    if (!tokenContract || !userAddress) return;

    try {
        const balance = await tokenContract.balanceOf(userAddress);
        const maxAmount = ethers.utils.formatUnits(balance, CONFIG.DECIMALS.ARUB);

        const sellInput = document.getElementById('sellAmount');
        if (sellInput) {
            sellInput.value = maxAmount;
            updateSellCalculation();
        }
    } catch (error) {
        console.error('[TRADING] Error setting max sell:', error);
    }
}

/**
 * Buy ARUB tokens (mint)
 */
export async function buyTokens() {
    const buyInput = document.getElementById('buyAmount');
    const amount = buyInput?.value;

    if (!amount || parseFloat(amount) < 1) {
        showNotification('❌ Мінімальна сума для купівлі — 1 USDT', 'error');
        return;
    }

    const { userAddress } = window;
    if (!userAddress) {
        showNotification('❌ Спочатку підключіть гаманець', 'error');
        return;
    }

    const { usdtContract, tokenContract } = getContracts();
    if (!usdtContract || !tokenContract) {
        showNotification('❌ Контракти не ініціалізовані', 'error');
        return;
    }

    try {
        console.log('[TRADING] Starting buy process...');
        const amountWei = ethers.utils.parseUnits(amount, CONFIG.DECIMALS.USDT);

        showNotification('🔄 Перевірка дозволу USDT...', 'info');

        // Check and approve USDT if needed
        const allowance = await checkUsdtAllowance(userAddress, CONFIG.TOKEN_ADDRESS);
        if (allowance.lt(amountWei)) {
            showNotification('🔄 Схвалення USDT для контракту токена...', 'info');
            await approveUsdt(CONFIG.TOKEN_ADDRESS);
            showNotification('✅ USDT схвалено!', 'success');
        }

        showNotification('🔄 Купівля ARUB через mint()...', 'info');

        // Call mint() function
        const mintTx = await tokenContract.mint(amountWei);
        console.log('[TRADING] Mint TX:', mintTx.hash);

        showNotification('⏳ Очікування підтвердження...', 'info');
        await mintTx.wait();

        showNotification('✅ ARUB успішно куплено!', 'success');

        // Reset form and update UI
        buyInput.value = '';
        document.getElementById('buyReceiveAmount').textContent = '0';
        document.getElementById('buyFeeAmount').textContent = '0 USDT';

        await updateTradingUI(userAddress);

    } catch (error) {
        console.error('[TRADING] Buy error:', error);
        showNotification(`❌ Помилка купівлі: ${getErrorMessage(error)}`, 'error');
    }
}

/**
 * Sell ARUB tokens (burn)
 */
export async function sellTokens() {
    const sellInput = document.getElementById('sellAmount');
    const amount = sellInput?.value;

    if (!amount || parseFloat(amount) <= 0) {
        showNotification('❌ Введіть коректну кількість ARUB', 'error');
        return;
    }

    const { userAddress } = window;
    if (!userAddress) {
        showNotification('❌ Спочатку підключіть гаманець', 'error');
        return;
    }

    const { tokenContract } = getContracts();
    if (!tokenContract) {
        showNotification('❌ Контракт токена не ініціалізований', 'error');
        return;
    }

    try {
        console.log('[TRADING] Starting sell process...');
        const amountWei = ethers.utils.parseUnits(amount, CONFIG.DECIMALS.ARUB);

        showNotification('🔄 Продаж ARUB через burn()...', 'info');

        // Call burn() function
        const burnTx = await tokenContract.burn(amountWei);
        console.log('[TRADING] Burn TX:', burnTx.hash);

        showNotification('⏳ Очікування підтвердження...', 'info');
        await burnTx.wait();

        showNotification('✅ ARUB успішно продано!', 'success');

        // Reset form and update UI
        sellInput.value = '';
        document.getElementById('sellReceiveAmount').textContent = '0';
        document.getElementById('sellFeeAmount').textContent = '0 USDT';

        await updateTradingUI(userAddress);

    } catch (error) {
        console.error('[TRADING] Sell error:', error);
        showNotification(`❌ Помилка продажу: ${getErrorMessage(error)}`, 'error');
    }
}

// Export current rate getter
export function getCurrentRate() {
    return currentRate;
}

// Expose functions globally for onclick handlers
window.setMaxBuy = setMaxBuy;
window.setMaxSell = setMaxSell;
window.buyTokens = buyTokens;
window.sellTokens = sellTokens;
window.calculateBuyAmount = updateBuyCalculation;
window.calculateSellAmount = updateSellCalculation;
