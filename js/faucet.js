/**
 * Faucet Module
 * Handles USDT faucet for testnet
 */

import { CONFIG } from './config.js';
import { showNotification, showLoading, showLockedState, formatTokenAmount, formatDuration, getErrorMessage } from './ui.js';
import { getContracts, getUserBalances } from './contracts.js';

/**
 * Initialize faucet module
 */
export function initFaucetModule() {
    console.log('[FAUCET] Initializing faucet module...');

    // Listen for contract initialization
    window.addEventListener('contractsInitialized', async (event) => {
        const { userAddress } = event.detail;
        console.log('[FAUCET] Contracts initialized, updating faucet UI...');
        await updateFaucetUI(userAddress);
    });
}

/**
 * Update faucet UI
 * @param {string} userAddress - User wallet address
 */
export async function updateFaucetUI(userAddress) {
    const faucetInterface = document.getElementById('faucetInterface');
    if (!faucetInterface) {
        console.warn('[FAUCET] Faucet interface element not found');
        return;
    }

    if (!userAddress) {
        showLockedState(faucetInterface, 'Підключіть гаманець для отримання тестових USDT');
        return;
    }

    showLoading(faucetInterface, 'Завантаження даних faucet...');

    try {
        const { usdtContract } = getContracts();
        if (!usdtContract) {
            throw new Error('USDT contract not initialized');
        }

        const [canClaim, timeLeft] = await usdtContract.canClaimFromFaucet(userAddress);
        const { usdtBalance } = await getUserBalances(userAddress);

        const minutesLeft = Math.ceil(timeLeft / 60);
        const timeLeftFormatted = formatDuration(timeLeft);

        faucetInterface.innerHTML = `
            <div class="staking-grid" style="grid-template-columns: 1fr;">
                <div class="staking-card" style="max-width: 700px; margin: 0 auto;">
                    <div class="card-header" style="justify-content: center;">
                        <div class="card-icon">💰</div>
                        <h3 class="card-title">USDT Faucet</h3>
                    </div>

                    <div style="text-align: center; padding: 30px 0;">
                        <div style="font-size: 4em; margin-bottom: 20px;">💸</div>
                        <h3 style="font-size: 2em; margin-bottom: 15px; color: var(--ukraine-yellow);">
                            Отримайте ${CONFIG.FAUCET.AMOUNT.toLocaleString()} USDT
                        </h3>
                        <p style="color: var(--gray); font-size: 1.1em; line-height: 1.8; max-width: 500px; margin: 0 auto;">
                            Безкоштовно отримайте тестові USDT кожну годину для тестування платформи на Sepolia Testnet
                        </p>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Ваш баланс USDT:</span>
                        <span class="info-value">${formatTokenAmount(usdtBalance, CONFIG.DECIMALS.USDT)} USDT</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Сума за раз:</span>
                        <span class="info-value">${CONFIG.FAUCET.AMOUNT.toLocaleString()} USDT</span>
                    </div>

                    <div class="info-row">
                        <span class="info-label">Очікування між запитами:</span>
                        <span class="info-value">${CONFIG.FAUCET.COOLDOWN_HOURS} година</span>
                    </div>

                    ${!canClaim ? `
                        <div style="background: rgba(255,165,0,0.15); border-left: 4px solid #ff6b00; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                                <div style="font-size: 2em;">⏱️</div>
                                <div>
                                    <div style="color: #ff6b00; font-weight: 600; font-size: 1.1em;">Зачекайте до наступного запиту</div>
                                    <div style="color: var(--gray); margin-top: 5px;">
                                        Залишилось: <strong style="color: white;">${timeLeftFormatted}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div style="background: rgba(16,185,129,0.15); border-left: 4px solid #10b981; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="font-size: 2em;">✅</div>
                                <div style="color: #10b981; font-weight: 600; font-size: 1.1em;">
                                    Готово до отримання! Натисніть кнопку нижче.
                                </div>
                            </div>
                        </div>
                    `}

                    <button class="action-btn"
                            onclick="window.claimFromFaucet()"
                            ${!canClaim ? 'disabled' : ''}
                            style="${!canClaim ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                        ${canClaim ? '💸 Отримати тестові USDT' : `⏱️ Зачекайте ${minutesLeft} хв`}
                    </button>

                    <div style="background: rgba(0,87,183,0.1); padding: 20px; border-radius: 10px; margin-top: 20px;">
                        <h4 style="color: var(--ukraine-blue); margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.5em;">💡</span>
                            Як використовувати USDT?
                        </h4>
                        <ul style="color: var(--gray); line-height: 2; padding-left: 20px;">
                            <li>Купуйте токен ARUB за поточним курсом USDT/RUB</li>
                            <li>Стейкайте USDT для отримання винагород в ARUB</li>
                            <li>Продавайте ARUB назад за USDT</li>
                            <li>Тестуйте всі функції платформи без ризику</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <p style="color: var(--gray); font-size: 0.9em;">
                            🔗 Це тестова мережа Sepolia. Токени не мають реальної вартості.
                        </p>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('[FAUCET] Error updating faucet UI:', error);
        faucetInterface.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--red);">
                <div style="font-size: 3em; margin-bottom: 20px;">⚠️</div>
                <p style="font-size: 1.3em;">Помилка завантаження інтерфейсу faucet</p>
                <p style="color: var(--gray); margin-top: 10px;">${getErrorMessage(error)}</p>
            </div>
        `;
    }
}

/**
 * Claim from faucet
 */
export async function claimFromFaucet() {
    const { userAddress } = window;
    if (!userAddress) {
        showNotification('❌ Спочатку підключіть гаманець', 'error');
        return;
    }

    const { usdtContract } = getContracts();
    if (!usdtContract) {
        showNotification('❌ USDT контракт не ініціалізований', 'error');
        return;
    }

    try {
        const [canClaim, timeLeft] = await usdtContract.canClaimFromFaucet(userAddress);

        if (!canClaim) {
            const minutes = Math.ceil(timeLeft / 60);
            showNotification(`⏱️ Зачекайте ще ${minutes} хвилин`, 'error');
            return;
        }

        showNotification('🔄 Отримання тестових USDT...', 'info');

        const tx = await usdtContract.claimFromFaucet();
        console.log('[FAUCET] Claim TX:', tx.hash);

        showNotification('⏳ Очікування підтвердження...', 'info');
        await tx.wait();

        showNotification(`✅ Отримано ${CONFIG.FAUCET.AMOUNT.toLocaleString()} USDT!`, 'success');

        await updateFaucetUI(userAddress);

        // Also update trading UI to show new balance
        const tradingUpdateEvent = new Event('faucetClaimed');
        window.dispatchEvent(tradingUpdateEvent);

    } catch (error) {
        console.error('[FAUCET] Claim error:', error);
        showNotification(`❌ Помилка отримання USDT: ${getErrorMessage(error)}`, 'error');
    }
}

// Expose function globally for onclick handler
window.claimFromFaucet = claimFromFaucet;
