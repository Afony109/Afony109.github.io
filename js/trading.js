/**
 * Trading Module
 * Handles buying and selling of ARUB tokens
 */

import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

import { CONFIG, calculateBuyAmount, calculateSellAmount } from './config.js';
import {
    showNotification,
    showLoading,
    showLockedState,
    formatTokenAmount,
    getErrorMessage
} from './ui.js';
import {
    getContracts,
    getUserBalances,
    getArubPrice,
    checkUsdtAllowance,
    approveUsdt
} from './contracts.js';

let currentRate = CONFIG.FALLBACK.ARUB_PRICE_USDT;

/* ===================== INIT ===================== */

export function initTradingModule() {
    console.log('[TRADING] Initializing trading module...');

    window.addEventListener('contractsInitialized', async (event) => {
        const { userAddress } = event.detail;
        await updateTradingUI(userAddress);
    });

    // периодическое обновление курса
    setInterval(async () => {
        try {
            const priceInfo = await getArubPrice();
            currentRate = priceInfo.price;
        } catch (e) {
            console.error('[TRADING] Error updating price:', e);
        }
    }, CONFIG.UI.PRICE_UPDATE_INTERVAL);
}

/* ===================== UI RENDER ===================== */

export async function updateTradingUI(userAddress) {
    const tradingInterface = document.getElementById('tradingInterface');
    if (!tradingInterface) return;

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

                <!-- BUY CARD -->
                <div class="staking-card">
                    <div class="card-header">
                        <div class="card-icon">💰</div>
                        <h3 class="card-title">Купити ARUB</h3>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Сума USDT</label>
                        <div class="input-wrapper">
                            <input
                                id="buyAmount"
                                type="number"
                                step="0.01"
                                min="1"
                                class="input-field"
                                placeholder="0.00"
                            >
                            <button class="max-btn" onclick="window.setMaxBuy()">MAX</button>
                        </div>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Отримаєте:</span>
                        <span class="info-value" id="buyReceiveAmount">0 ARUB</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Комісія (0.5%):</span>
                        <span class="info-value" id="buyFeeAmount">0 USDT</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Ваш баланс USDT:</span>
                        <span class="info-value">
                            ${formatTokenAmount(usdtBalance, CONFIG.DECIMALS.USDT)} USDT
                        </span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Ціна ARUB:</span>
                        <span class="info-value">${currentRate.toFixed(2)} USDT</span>
                    </div>

                    <button class="action-btn" onclick="window.buyTokens()">
                        💰 Купити ARUB
                    </button>
                </div>

                <!-- SELL CARD -->
                <div class="staking-card">
                    <div class="card-header">
                        <div class="card-icon">💵</div>
                        <h3 class="card-title">Продати ARUB</h3>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Кількість ARUB</label>
                        <div class="input-wrapper">
                            <input
                                id="sellAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                class="input-field"
                                placeholder="0.00"
                            >
                            <button class="max-btn" onclick="window.setMaxSell()">MAX</button>
                        </div>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Отримаєте:</span>
                        <span class="info-value" id="sellReceiveAmount">0 USDT</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Комісія (1%):</span>
                        <span class="info-value" id="sellFeeAmount">0 USDT</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Ваш баланс ARUB:</span>
                        <span class="info-value">
                            ${formatTokenAmount(arubBalance, CONFIG.DECIMALS.ARUB)} ARUB
                        </span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Ціна ARUB:</span>
                        <span class="info-value">${currentRate.toFixed(2)} USDT</span>
                    </div>

                    <button class="action-btn" onclick="window.sellTokens()">
                        💵 Продати ARUB
                    </button>
                </div>

            </div>
        `;

        const buyInput = document.getElementById('buyAmount');
        const sellInput = document.getElementById('sellAmount');

        if (buyInput) buyInput.addEventListener('input', updateBuyCalculation);
        if (sellInput) sellInput.addEventListener('input', updateSellCalculation);

    } catch (error) {
        console.error('[TRADING] Error updating trading UI:', error);
        tradingInterface.innerHTML = `
            <div style="text-align:center;padding:40px;color:var(--red);">
                <p>Помилка завантаження інтерфейсу торгівлі</p>
                <p style="color:var(--gray);margin-top:10px;">${getErrorMessage(error)}</p>
            </div>
        `;
    }
}

/* ===================== CALCULATIONS (UI) ===================== */

function updateBuyCalculation() {
    const inputEl = document.getElementById('buyAmount');
    const receiveEl = document.getElementById('buyReceiveAmount');
    const feeEl = document.getElementById('buyFeeAmount');

    if (!inputEl || !receiveEl || !feeEl) return;

    const amount = parseFloat(inputEl.value) || 0;
    if (amount <= 0) {
        receiveEl.textContent = '0 ARUB';
        feeEl.textContent = '0 USDT';
        return;
    }

    const calc = calculateBuyAmount(amount, currentRate);
    receiveEl.textContent = `${calc.arubReceived.toFixed(6)} ARUB`;
    feeEl.textContent = `${calc.fee.toFixed(4)} USDT`;
}

function updateSellCalculation() {
    const inputEl = document.getElementById('sellAmount');
    const receiveEl = document.getElementById('sellReceiveAmount');
    const feeEl = document.getElementById('sellFeeAmount');

    if (!inputEl || !receiveEl || !feeEl) return;

    const amount = parseFloat(inputEl.value) || 0;
    if (amount <= 0) {
        receiveEl.textContent = '0 USDT';
        feeEl.textContent = '0 USDT';
        return;
    }

    const calc = calculateSellAmount(amount, currentRate);
    receiveEl.textContent = `${calc.usdtReceived.toFixed(4)} USDT`;
    feeEl.textContent = `${calc.fee.toFixed(4)} USDT`;
}

/* ===================== MAX BUTTONS ===================== */

export async function setMaxBuy() {
    const { usdtContract } = getContracts();
    const { userAddress } = window;
    if (!usdtContract || !userAddress) return;

    try {
        const balance = await usdtContract.balanceOf(userAddress);
        const maxAmount = ethers.utils.formatUnits(balance, CONFIG.DECIMALS.USDT);

        const input = document.getElementById('buyAmount');
        if (input) {
            input.value = maxAmount;
            updateBuyCalculation();
        }
    } catch (e) {
        console.error('[TRADING] Error setMaxBuy:', e);
    }
}

export async function setMaxSell() {
    const { tokenContract } = getContracts();
    const { userAddress } = window;
    if (!tokenContract || !userAddress) return;

    try {
        const balance = await tokenContract.balanceOf(userAddress);
        const maxAmount = ethers.utils.formatUnits(balance, CONFIG.DECIMALS.ARUB);

        const input = document.getElementById('sellAmount');
        if (input) {
            input.value = maxAmount;
            updateSellCalculation();
        }
    } catch (e) {
        console.error('[TRADING] Error setMaxSell:', e);
    }
}

/* ===================== BUY / SELL ===================== */

export async function buyTokens() {
    const input = document.getElementById('buyAmount');
    const amountStr = input?.value?.trim() || '';
    const usdtAmount = parseFloat(amountStr);

    if (!amountStr || !Number.isFinite(usdtAmount) || usdtAmount < 1) {
        showNotification('❌ Мінімальна сума для купівлі — 1 USDT', 'error');
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
        // Актуализируем курс и пересчитываем как в UI
        const priceInfo = await getArubPrice();
        currentRate = priceInfo.price;

        const calc = calculateBuyAmount(usdtAmount, currentRate);
        const arubToMint = calc.arubReceived;
        if (arubToMint <= 0) {
            showNotification('❌ Розрахована кількість ARUB = 0', 'error');
            return;
        }

        const arubWei = ethers.utils.parseUnits(
            arubToMint.toFixed(CONFIG.DECIMALS.ARUB),
            CONFIG.DECIMALS.ARUB
        );

        showNotification('🔄 Купівля ARUB за поточним курсом...', 'info');

        // mintTo на адресу користувача — минтим РАССЧИТАННОЕ количество ARUB
        const tx = await tokenContract.mintTo(userAddress, arubWei);
        await tx.wait();

        showNotification('✅ ARUB успішно куплено!', 'success');

        input.value = '';
        updateBuyCalculation();
        await updateTradingUI(userAddress);
    } catch (e) {
        console.error('[TRADING] Buy error:', e);
        showNotification(`❌ Помилка купівлі: ${getErrorMessage(e)}`, 'error');
    }
}

export async function sellTokens() {
    const input = document.getElementById('sellAmount');
    const amountStr = input?.value?.trim() || '';
    const arubAmount = parseFloat(amountStr);

    if (!amountStr || !Number.isFinite(arubAmount) || arubAmount <= 0) {
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
        const amountWei = ethers.utils.parseUnits(
            arubAmount.toFixed(CONFIG.DECIMALS.ARUB),
            CONFIG.DECIMALS.ARUB
        );

        showNotification('🔄 Продаж ARUB (burn)...', 'info');

        const tx = await tokenContract.burn(amountWei);
        await tx.wait();

        showNotification('✅ ARUB успішно спалено!', 'success');

        input.value = '';
        updateSellCalculation();
        await updateTradingUI(userAddress);
    } catch (e) {
        console.error('[TRADING] Sell error:', e);
        showNotification(`❌ Помилка продажу: ${getErrorMessage(e)}`, 'error');
    }
}

/* ===================== EXPORT FOR STAKING ===================== */

export function getCurrentRate() {
    return currentRate;
}

/* ===================== GLOBAL HANDLERS ===================== */

window.setMaxBuy = setMaxBuy;
window.setMaxSell = setMaxSell;
window.buyTokens = buyTokens;
window.sellTokens = sellTokens;
window.calculateBuyAmount = updateBuyCalculation;
window.calculateSellAmount = updateSellCalculation;
