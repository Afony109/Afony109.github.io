/**
 * TRADING MODULE — FIXED VERSION FOR ArubToken (mint ONLY)
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

/* ===========================================================
   INIT
=========================================================== */

export function initTradingModule() {
    console.log('[TRADING] Initializing trading module...');

    window.addEventListener('contractsInitialized', async (event) => {
        const { userAddress } = event.detail;
        await updateTradingUI(userAddress);
    });

    setInterval(async () => {
        try {
            const priceInfo = await getArubPrice();
            currentRate = priceInfo.price;
        } catch (e) {
            console.error('[TRADING] Price update error:', e);
        }
    }, CONFIG.UI.PRICE_UPDATE_INTERVAL);
}

/* ===========================================================
   UI RENDER
=========================================================== */

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

                <!-- BUY -->
                <div class="staking-card">
                    <div class="card-header"><h3 class="card-title">Купити ARUB</h3></div>

                    <div class="input-group">
                        <label>Сума USDT</label>
                        <div class="input-wrapper">
                            <input id="buyAmount" type="number" step="0.01" min="1" class="input-field">
                            <button class="max-btn" onclick="window.setMaxBuy()">MAX</button>
                        </div>
                    </div>

                    <div class="info-row"><span>Отримаєте:</span><span id="buyReceiveAmount">0 ARUB</span></div>
                    <div class="info-row"><span>Комісія:</span><span id="buyFeeAmount">0 USDT</span></div>
                    <div class="info-row"><span>Ваш баланс USDT:</span><span>
                        ${formatTokenAmount(usdtBalance, CONFIG.DECIMALS.USDT)} USDT</span></div>
                    <div class="info-row"><span>Ціна ARUB:</span><span>${currentRate.toFixed(2)} USDT</span></div>

                    <button class="action-btn" onclick="window.buyTokens()">Купити ARUB</button>
                </div>

                <!-- SELL -->
                <div class="staking-card">
                    <div class="card-header"><h3 class="card-title">Продати ARUB</h3></div>

                    <div class="input-group">
                        <label>Кількість ARUB</label>
                        <div class="input-wrapper">
                            <input id="sellAmount" type="number" step="0.01" min="0" class="input-field">
                            <button class="max-btn" onclick="window.setMaxSell()">MAX</button>
                        </div>
                    </div>

                    <div class="info-row"><span>Отримаєте:</span><span id="sellReceiveAmount">0 USDT</span></div>
                    <div class="info-row"><span>Комісія:</span><span id="sellFeeAmount">0 USDT</span></div>
                    <div class="info-row"><span>Ваш баланс ARUB:</span><span>
                        ${formatTokenAmount(arubBalance, CONFIG.DECIMALS.ARUB)} ARUB</span></div>
                    <div class="info-row"><span>Ціна ARUB:</span><span>${currentRate.toFixed(2)} USDT</span></div>

                    <button class="action-btn" onclick="window.sellTokens()">Продати ARUB</button>
                </div>

            </div>
        `;

        document.getElementById('buyAmount').addEventListener('input', updateBuyCalculation);
        document.getElementById('sellAmount').addEventListener('input', updateSellCalculation);

    } catch (error) {
        console.error('[TRADING] UI error:', error);
        tradingInterface.innerHTML = `<p style="color:red">${getErrorMessage(error)}</p>`;
    }
}

/* ===========================================================
   CALCULATIONS
=========================================================== */

function updateBuyCalculation() {
    const amount = parseFloat(document.getElementById('buyAmount').value) || 0;
    const receiveEl = document.getElementById('buyReceiveAmount');
    const feeEl = document.getElementById('buyFeeAmount');

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
    const amount = parseFloat(document.getElementById('sellAmount').value) || 0;
    const receiveEl = document.getElementById('sellReceiveAmount');
    const feeEl = document.getElementById('sellFeeAmount');

    if (amount <= 0) {
        receiveEl.textContent = '0 USDT';
        feeEl.textContent = '0 USDT';
        return;
    }

    const calc = calculateSellAmount(amount, currentRate);
    receiveEl.textContent = `${calc.usdtReceived.toFixed(4)} USDT`;
    feeEl.textContent = `${calc.fee.toFixed(4)} USDT`;
}

/* ===========================================================
   MAX BUTTONS
=========================================================== */

export async function setMaxBuy() {
    const { userAddress } = window;
    const { usdtContract } = getContracts();

    const rawBalance = await usdtContract.balanceOf(userAddress);
    const balance = ethers.utils.formatUnits(rawBalance, CONFIG.DECIMALS.USDT);

    const input = document.getElementById('buyAmount');
    input.value = balance;
    updateBuyCalculation();
}

export async function setMaxSell() {
    const { userAddress } = window;
    const { tokenContract } = getContracts();

    const rawBalance = await tokenContract.balanceOf(userAddress);
    const balance = ethers.utils.formatUnits(rawBalance, CONFIG.DECIMALS.ARUB);

    const input = document.getElementById('sellAmount');
    input.value = balance;
    updateSellCalculation();
}

/* ===========================================================
   BUY TOKENS
=========================================================== */

export async function buyTokens() {
    const input = document.getElementById('buyAmount');
    const usdtAmount = parseFloat(input.value);

    if (!usdtAmount || usdtAmount < 1) {
        showNotification('❌ Мінімальна сума — 1 USDT', 'error');
        return;
    }

    const { userAddress } = window;
    const { tokenContract } = getContracts();

    try {
        const priceInfo = await getArubPrice();
        currentRate = priceInfo.price;

        const calc = calculateBuyAmount(usdtAmount, currentRate);
        const arubAmount = calc.arubReceived;

        const arubWei = ethers.utils.parseUnits(
            arubAmount.toFixed(CONFIG.DECIMALS.ARUB),
            CONFIG.DECIMALS.ARUB
        );

        showNotification('🔄 Купівля ARUB...', 'info');

        // ✔ твой контракт имеет только mint(amount)
        const tx = await tokenContract.mint(arubWei);
        await tx.wait();

        showNotification('✅ ARUB успішно куплено!', 'success');

        input.value = '';
        updateBuyCalculation();
        await updateTradingUI(userAddress);

    } catch (err) {
        console.error('[TRADING] Buy error:', err);
        showNotification('❌ Помилка купівлі: ' + getErrorMessage(err), 'error');
    }
}

/* ===========================================================
   SELL TOKENS
=========================================================== */

export async function sellTokens() {
    const input = document.getElementById('sellAmount');
    const arubAmount = parseFloat(input.value);

    if (!arubAmount || arubAmount <= 0) {
        showNotification('❌ Введіть коректну кількість ARUB', 'error');
        return;
    }

    const { userAddress } = window;
    const { tokenContract } = getContracts();

    try {
        const arubWei = ethers.utils.parseUnits(
            arubAmount.toFixed(CONFIG.DECIMALS.ARUB),
            CONFIG.DECIMALS.ARUB
        );

        showNotification('🔥 Спалювання ARUB...', 'info');

        const tx = await tokenContract.burn(arubWei);
        await tx.wait();

        showNotification('🔥 ARUB успішно спалено!', 'success');

        input.value = '';
        updateSellCalculation();
        await updateTradingUI(userAddress);

    } catch (err) {
        console.error('[TRADING] Sell error:', err);
        showNotification('❌ Помилка продажу: ' + getErrorMessage(err), 'error');
    }
}

/* ===========================================================
   EXPORT FOR STAKING
=========================================================== */
export function getCurrentRate() {
    return currentRate;
}

/* ===========================================================
   WINDOW
=========================================================== */

window.buyTokens = buyTokens;
window.sellTokens = sellTokens;
window.setMaxBuy = setMaxBuy;
window.setMaxSell = setMaxSell;
window.calculateBuyAmount = updateBuyCalculation;
window.calculateSellAmount = updateSellCalculation;
