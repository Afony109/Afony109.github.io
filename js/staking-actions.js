/**
 * Staking Actions Module
 * Handles stake, unstake, and claim operations
 */

import { CONFIG } from './config.js';
import { showNotification, getErrorMessage } from './ui.js';
import { getContracts, checkUsdtAllowance, checkArubAllowance, approveUsdt, approveArub } from './contracts.js';
import { updateStakingUI } from './staking.js';

/**
 * Set max USDT for staking
 */
export async function setMaxStakeUsdt() {
    const { usdtContract } = getContracts();
    const { userAddress } = window;

    if (!usdtContract || !userAddress) return;

    try {
        const balance = await usdtContract.balanceOf(userAddress);
        const maxAmount = ethers.utils.formatUnits(balance, CONFIG.DECIMALS.USDT);

        const input = document.getElementById('stakeUsdtAmount');
        if (input) input.value = maxAmount;
    } catch (error) {
        console.error('[STAKING] Error setting max USDT:', error);
    }
}

/**
 * Set max ARUB for staking
 */
export async function setMaxStakeArub() {
    const { tokenContract } = getContracts();
    const { userAddress } = window;

    if (!tokenContract || !userAddress) return;

    try {
        const balance = await tokenContract.balanceOf(userAddress);
        const maxAmount = ethers.utils.formatUnits(balance, CONFIG.DECIMALS.ARUB);

        const input = document.getElementById('stakeArubAmount');
        if (input) input.value = maxAmount;
    } catch (error) {
        console.error('[STAKING] Error setting max ARUB:', error);
    }
}

/**
 * Set max USDT for unstaking
 */
export async function setMaxUnstakeUsdt() {
    const { stakingContract } = getContracts();
    const { userAddress } = window;

    if (!stakingContract || !userAddress) return;

    try {
        const userInfo = await stakingContract.getUserInfo(userAddress);
        const stakedAmount = userInfo[0];
        const maxAmount = ethers.utils.formatUnits(stakedAmount, CONFIG.DECIMALS.USDT);

        const input = document.getElementById('unstakeUsdtAmount');
        if (input) input.value = maxAmount;
    } catch (error) {
        console.error('[STAKING] Error setting max unstake USDT:', error);
    }
}

/**
 * Set max ARUB for unstaking
 */
export async function setMaxUnstakeArub() {
    const { stakingContract } = getContracts();
    const { userAddress } = window;

    if (!stakingContract || !userAddress) return;

    try {
        const userInfo = await stakingContract.getUserInfo(userAddress);
        const stakedAmount = userInfo[0];
        const maxAmount = ethers.utils.formatUnits(stakedAmount, CONFIG.DECIMALS.ARUB);

        const input = document.getElementById('unstakeArubAmount');
        if (input) input.value = maxAmount;
    } catch (error) {
        console.error('[STAKING] Error setting max unstake ARUB:', error);
    }
}

/**
 * Stake USDT tokens
 */
export async function stakeUsdtTokens() {
    const input = document.getElementById('stakeUsdtAmount');
    const amount = input?.value;

    if (!amount || parseFloat(amount) < CONFIG.STAKING.MIN_STAKE_USDT) {
        showNotification(`❌ Мінімальна сума для стейкінгу — ${CONFIG.STAKING.MIN_STAKE_USDT} USDT`, 'error');
        return;
    }

    const { userAddress } = window;
    if (!userAddress) {
        showNotification('❌ Спочатку підключіть гаманець', 'error');
        return;
    }

    const { usdtContract, stakingContract } = getContracts();
    if (!usdtContract || !stakingContract) {
        showNotification('❌ Контракти не ініціалізовані', 'error');
        return;
    }

    try {
        console.log('[STAKING] Starting USDT stake...');
        const amountWei = ethers.utils.parseUnits(amount, CONFIG.DECIMALS.USDT);

        showNotification('🔄 Перевірка дозволу USDT...', 'info');

        // Check and approve if needed
        const allowance = await checkUsdtAllowance(userAddress, CONFIG.STAKING_ADDRESS);
        if (allowance.lt(amountWei)) {
            showNotification('🔄 Схвалення USDT для стейкінгу...', 'info');
            await approveUsdt(CONFIG.STAKING_ADDRESS);
            showNotification('✅ USDT схвалено!', 'success');
        }

        showNotification('🔄 Стейкінг USDT...', 'info');

        const stakeTx = await stakingContract.stakeUsdt(amountWei);
        console.log('[STAKING] Stake TX:', stakeTx.hash);

        showNotification('⏳ Очікування підтвердження...', 'info');
        await stakeTx.wait();

        showNotification('✅ USDT успішно застейкано в USDT Pool!', 'success');

        input.value = '';
        await updateStakingUI(userAddress);

    } catch (error) {
        console.error('[STAKING] USDT stake error:', error);
        showNotification(`❌ Помилка стейкінгу USDT: ${getErrorMessage(error)}`, 'error');
    }
}

/**
 * Stake ARUB tokens
 */
export async function stakeArubTokens() {
    const input = document.getElementById('stakeArubAmount');
    const amount = input?.value;

    if (!amount || parseFloat(amount) < CONFIG.STAKING.MIN_STAKE_ARUB) {
        showNotification(`❌ Мінімальна кількість для стейкінгу — ${CONFIG.STAKING.MIN_STAKE_ARUB} ARUB`, 'error');
        return;
    }

    const { userAddress } = window;
    if (!userAddress) {
        showNotification('❌ Спочатку підключіть гаманець', 'error');
        return;
    }

    const { tokenContract, stakingContract } = getContracts();
    if (!tokenContract || !stakingContract) {
        showNotification('❌ Контракти не ініціалізовані', 'error');
        return;
    }

    try {
        console.log('[STAKING] Starting ARUB stake...');
        const amountWei = ethers.utils.parseUnits(amount, CONFIG.DECIMALS.ARUB);

        showNotification('🔄 Перевірка дозволу ARUB...', 'info');

        // Check and approve if needed
        const allowance = await checkArubAllowance(userAddress, CONFIG.STAKING_ADDRESS);
        if (allowance.lt(amountWei)) {
            showNotification('🔄 Схвалення ARUB для стейкінгу...', 'info');
            await approveArub(CONFIG.STAKING_ADDRESS);
            showNotification('✅ ARUB схвалено!', 'success');
        }

        showNotification('🔄 Стейкінг ARUB...', 'info');

        const stakeTx = await stakingContract.stakeArub(amountWei);
        console.log('[STAKING] Stake TX:', stakeTx.hash);

        showNotification('⏳ Очікування підтвердження...', 'info');
        await stakeTx.wait();

        showNotification('✅ ARUB успішно застейкано в ARUB Pool!', 'success');

        input.value = '';
        await updateStakingUI(userAddress);

    } catch (error) {
        console.error('[STAKING] ARUB stake error:', error);
        showNotification(`❌ Помилка стейкінгу ARUB: ${getErrorMessage(error)}`, 'error');
    }
}

/**
 * Unstake USDT tokens
 */
export async function unstakeUsdtTokens() {
    const input = document.getElementById('unstakeUsdtAmount');
    const amount = input?.value;

    if (!amount || parseFloat(amount) <= 0) {
        showNotification('❌ Введіть коректну суму', 'error');
        return;
    }

    const { userAddress } = window;
    if (!userAddress) {
        showNotification('❌ Спочатку підключіть гаманець', 'error');
        return;
    }

    const { stakingContract } = getContracts();
    if (!stakingContract) {
        showNotification('❌ Контракт стейкінгу не ініціалізований', 'error');
        return;
    }

    try {
        console.log('[STAKING] Starting USDT unstake...');
        const amountWei = ethers.utils.parseUnits(amount, CONFIG.DECIMALS.USDT);

        showNotification('🔍 Перевірка можливості зняття...', 'info');

        // Estimate gas to check if transaction will succeed
        try {
            await stakingContract.estimateGas.unstakeUsdt(amountWei);
        } catch (gasError) {
            console.error('[STAKING] Gas estimation failed:', gasError);
            showNotification('❌ У вас немає застейканих USDT! Ваші токени застейкані в ARUB Pool. Використовуйте кнопку "🔓 Зняти з ARUB Pool"!', 'error');
            return;
        }

        showNotification('🔄 Зняття USDT з USDT Pool...', 'info');

        const unstakeTx = await stakingContract.unstakeUsdt(amountWei);
        console.log('[STAKING] Unstake TX:', unstakeTx.hash);

        showNotification('⏳ Очікування підтвердження...', 'info');
        await unstakeTx.wait();

        showNotification('✅ USDT успішно знято з USDT Pool!', 'success');

        input.value = '';
        await updateStakingUI(userAddress);

    } catch (error) {
        console.error('[STAKING] USDT unstake error:', error);
        showNotification(`❌ Помилка зняття USDT: ${getErrorMessage(error)}`, 'error');
    }
}

/**
 * Unstake ARUB tokens
 */
export async function unstakeArubTokens() {
    const input = document.getElementById('unstakeArubAmount');
    const amount = input?.value;

    if (!amount || parseFloat(amount) <= 0) {
        showNotification('❌ Введіть коректну суму', 'error');
        return;
    }

    const { userAddress } = window;
    if (!userAddress) {
        showNotification('❌ Спочатку підключіть гаманець', 'error');
        return;
    }

    const { stakingContract } = getContracts();
    if (!stakingContract) {
        showNotification('❌ Контракт стейкінгу не ініціалізований', 'error');
        return;
    }

    try {
        console.log('[STAKING] Starting ARUB unstake...');
        const amountWei = ethers.utils.parseUnits(amount, CONFIG.DECIMALS.ARUB);

        showNotification('🔍 Перевірка можливості зняття...', 'info');

        // Estimate gas to check if transaction will succeed
        try {
            await stakingContract.estimateGas.unstakeArub(amountWei);
        } catch (gasError) {
            console.error('[STAKING] Gas estimation failed:', gasError);
            showNotification('❌ У вас немає застейканих ARUB! Ваші токени застейкані в USDT Pool. Використовуйте кнопку "💸 Зняти з USDT Pool"!', 'error');
            return;
        }

        showNotification('🔄 Зняття ARUB з ARUB Pool...', 'info');

        const unstakeTx = await stakingContract.unstakeArub(amountWei);
        console.log('[STAKING] Unstake TX:', unstakeTx.hash);

        showNotification('⏳ Очікування підтвердження...', 'info');
        await unstakeTx.wait();

        showNotification('✅ ARUB успішно знято з ARUB Pool! Винагороди автоматично отримано.', 'success');

        input.value = '';
        await updateStakingUI(userAddress);

    } catch (error) {
        console.error('[STAKING] ARUB unstake error:', error);
        showNotification(`❌ Помилка зняття ARUB: ${getErrorMessage(error)}`, 'error');
    }
}

/**
 * Claim staking rewards
 */
export async function claimRewards() {
    const { userAddress } = window;
    if (!userAddress) {
        showNotification('❌ Спочатку підключіть гаманець', 'error');
        return;
    }

    const { stakingContract } = getContracts();
    if (!stakingContract) {
        showNotification('❌ Контракт стейкінгу не ініціалізований', 'error');
        return;
    }

    try {
        showNotification('🔄 Отримання винагород...', 'info');

        const claimTx = await stakingContract.claimRewards(false); // false = don't compound
        console.log('[STAKING] Claim TX:', claimTx.hash);

        showNotification('⏳ Очікування підтвердження...', 'info');
        await claimTx.wait();

        showNotification('✅ Винагороди успішно отримано!', 'success');

        await updateStakingUI(userAddress);

    } catch (error) {
        console.error('[STAKING] Claim error:', error);
        showNotification(`❌ Помилка отримання винагород: ${getErrorMessage(error)}`, 'error');
    }
}

// Expose functions globally for onclick handlers
window.setMaxStakeUsdt = setMaxStakeUsdt;
window.setMaxStakeArub = setMaxStakeArub;
window.setMaxUnstakeUsdt = setMaxUnstakeUsdt;
window.setMaxUnstakeArub = setMaxUnstakeArub;
window.stakeUsdtTokens = stakeUsdtTokens;
window.stakeArubTokens = stakeArubTokens;
window.unstakeUsdtTokens = unstakeUsdtTokens;
window.unstakeArubTokens = unstakeArubTokens;
window.claimRewards = claimRewards;
