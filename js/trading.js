/* TRADING.JS — WORKING FIXED VERSION */

import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

import { CONFIG, calculateBuyAmount, calculateSellAmount } from './config.js';
import { showNotification, showLoading, showLockedState, formatTokenAmount, getErrorMessage } from './ui.js';
import { getContracts, getUserBalances, getArubPrice, checkUsdtAllowance, approveUsdt } from './contracts.js';

let currentRate = CONFIG.FALLBACK.ARUB_PRICE_USDT;

/* INIT */
export function initTradingModule() {
    window.addEventListener('contractsInitialized', async (event) => {
        await updateTradingUI(event.detail.userAddress);
    });

    setInterval(async () => {
        try {
            const priceInfo = await getArubPrice();
            currentRate = priceInfo.price;
        } catch (e) {
            console.error(e);
        }
    }, CONFIG.UI.PRICE_UPDATE_INTERVAL);
}

/* UPDATE UI */
export async function updateTradingUI(userAddress) {
    const el = document.getElementById('tradingInterface');
    if (!el) return;

    if (!userAddress) {
        showLockedState(el, 'Підключіть гаманець для торгівлі токенами');
        return;
    }

    showLoading(el, 'Завантаження даних торгівлі...');

    try {
        const { usdtBalance, arubBalance } = await getUserBalances(userAddress);
        const priceInfo = await getArubPrice();
        currentRate = priceInfo.price;

        el.innerHTML = `
            <div class="staking-grid">

                <!-- BUY CARD -->
                <div class="staking-card">
                    <div class="card-header"><h3 class="card-title">Купити ARUB</h3></div>

                    <div class="input-group">
                        <label class="input-label">Сума USDT</label>
                        <div class="input-wrapper">
                            <input id="buyAmount" type="number" step="0.01" min="1" class="input-field" placeholder="0.00">
                            <button class="max-btn" onclick="window.setMaxBuy()">MAX</button>
                        </div>
                    </div>

                    <div class="info-row"><span>Отримаєте:</span><span id="buyReceiveAmount">0 ARUB</span></div>
                    <div class="info-row"><span>Комісія:</span><span id="buyFeeAmount">0 USDT</span></div>
                    <div class="info-row"><span>Ваш баланс USDT:</span><span>${formatTokenAmount(usdtBalance,6)}</span></div>
                    <div class="info-row"><span>Ціна ARUB:</span><span>${currentRate.toFixed(2)} USDT</span></div>

                    <button class="action-btn" onclick="window.buyTokens()">Купити ARUB</button>
                </div>

                <!-- SELL CARD -->
                <div class="staking-card">
                    <div class="card-header"><h3 class="card-title">Продати ARUB</h3></div>

                    <div class="input-group">
                        <label class="input-label">Кількість ARUB</label>
                        <div class="input-wrapper">
                            <input id="sellAmount" type="number" step="0.01" min="0" class="input-field" placeholder="0.00">
                            <button class="max-btn" onclick="window.setMaxSell()">MAX</button>
                        </div>
                    </div>

                    <div class="info-row"><span>Отримаєте:</span><span id="sellReceiveAmount">0 USDT</span></div>
                    <div class="info-row"><span>Комісія:</span><span id="sellFeeAmount">0 USDT</span></div>
                    <div class="info-row"><span>Ваш баланс ARUB:</span><span>${formatTokenAmount(arubBalance,6)}</span></div>
                    <div class="info-row"><span>Ціна ARUB:</span><span>${currentRate.toFixed(2)} USDT</span></div>

                    <button class="action-btn" onclick="window.sellTokens()">Продати ARUB</button>
                </div>

            </div>
        `;

        document.getElementById('buyAmount').addEventListener('input', updateBuyCalc);
        document.getElementById('sellAmount').addEventListener('input', updateSellCalc);

    } catch (error) {
        el.innerHTML = `<p style="color:red">${getErrorMessage(error)}</p>`;
        console.error(error);
    }
}

/* CALCULATIONS */
function updateBuyCalc() {
    const input = parseFloat(document.getElementById('buyAmount').value) || 0;
    const out = document.getElementById('buyReceiveAmount');
    const fee = document.getElementById('buyFeeAmount');

    if (input <= 0) {
        out.textContent = '0 ARUB';
        fee.textContent = '0 USDT';
        return;
    }

    const calc = calculateBuyAmount(input, currentRate);
    out.textContent = calc.arubReceived.toFixed(6) + ' ARUB';
    fee.textContent = calc.fee.toFixed(4) + ' USDT';
}

function updateSellCalc() {
    const input = parseFloat(document.getElementById('sellAmount').value) || 0;
    const out = document.getElementById('sellReceiveAmount');
    const fee = document.getElementById('sellFeeAmount');

    if (input <= 0) {
        out.textContent = '0 USDT';
        fee.textContent = '0 USDT';
        return;
    }

    const calc = calculateSellAmount(input, currentRate);
    out.textContent = calc.usdtReceived.toFixed(4) + ' USDT';
    fee.textContent = calc.fee.toFixed(4) + ' USDT';
}

/* MAX BUTTONS */
export async function setMaxBuy() {
    const { usdtContract } = getContracts();
    const { userAddress } = window;

    const bal = await usdtContract.balanceOf(userAddress);
    const amt = ethers.utils.formatUnits(bal,6);

    document.getElementById('buyAmount').value = amt;
    updateBuyCalc();
}

export async function setMaxSell() {
    const { tokenContract } = getContracts();
    const { userAddress } = window;

    const bal = await tokenContract.balanceOf(userAddress);
    const amt = ethers.utils.formatUnits(bal,6);

    document.getElementById('sellAmount').value = amt;
    updateSellCalc();
}

/* BUY TOKENS */
export async function buyTokens() {
    const amount = parseFloat(document.getElementById('buyAmount').value);
    if (!amount || amount < 1) return showNotification('❌ Мінімум 1 USDT','error');

    const { userAddress } = window;
    const { tokenContract } = getContracts();

    /* считаем по той же формуле, что UI */
    const calc = calculateBuyAmount(amount, currentRate);
    const arub = calc.arubReceived;

    const arubWei = ethers.utils.parseUnits(arub.toFixed(6),6);

    const tx = await tokenContract.mintTo(userAddress, arubWei);
    await tx.wait();

    showNotification('✅ Куплено!', 'success');
    document.getElementById('buyAmount').value = '';
    updateBuyCalc();
}

/* SELL TOKENS */
export async function sellTokens() {
    const amount = parseFloat(document.getElementById('sellAmount').value);
    if (!amount || amount <= 0) return showNotification('❌ Некоректно', 'error');

    const { tokenContract } = getContracts();
    const arubWei = ethers.utils.parseUnits(amount.toFixed(6),6);

    const tx = await tokenContract.burn(arubWei);
    await tx.wait();

    showNotification('🔥 Спалено!', 'success');
    document.getElementById('sellAmount').value = '';
    updateSellCalc();
}

/* expose */
window.buyTokens = buyTokens;
window.sellTokens = sellTokens;
window.setMaxBuy = setMaxBuy;
window.setMaxSell = setMaxSell;
