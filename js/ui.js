/**
 * UI Module
 * Handles UI updates, notifications, and common UI functions
 */

// Import ethers.js as ES module
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

import { CONFIG } from './config.js';

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - 'success', 'error', 'info', or 'warning'
 * @param {number} duration - Duration in milliseconds
 */
export function showNotification(message, type = 'info', duration = CONFIG.UI.NOTIFICATION_DURATION) {
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(400px)';

        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

/**
 * Show loading spinner in an element
 * @param {HTMLElement} element - Element to show loading in
 * @param {string} message - Loading message
 */
export function showLoading(element, message = 'Завантаження...') {
    if (!element) return;

    element.innerHTML = `
        <div style="text-align: center; padding: 60px; color: var(--gray);">
            <div class="loading" style="width: 40px; height: 40px; margin: 0 auto 20px;"></div>
            <p style="font-size: 1.2em;">${message}</p>
        </div>
    `;
}

/**
 * Show locked state (wallet not connected)
 * @param {HTMLElement} element - Element to show locked state in
 * @param {string} message - Lock message
 */
export function showLockedState(element, message = 'Підключіть гаманець') {
    if (!element) return;

    element.innerHTML = `
        <div style="text-align: center; padding: 60px; color: var(--gray);">
            <div style="font-size: 3em; margin-bottom: 20px;">🔒</div>
            <p style="font-size: 1.3em;">${message}</p>
        </div>
    `;
}

/**
 * Copy text to clipboard and show notification
 * @param {string} text - Text to copy
 * @param {string} successMessage - Success notification message
 */
export async function copyToClipboard(text, successMessage = '✅ Скопійовано!') {
    try {
        await navigator.clipboard.writeText(text);
        showNotification(successMessage, 'success');
    } catch (error) {
        console.error('[UI] Copy error:', error);
        showNotification('❌ Помилка копіювання', 'error');
    }
}

/**
 * Format token amount to display string
 * @param {BigNumber|number|string} value - BigNumber, number or string value
 * @param {number} decimals - Token decimals (only used for BigNumber)
 * @param {number} displayDecimals - Display decimal places
 * @returns {string} Formatted string
 */
export function formatTokenAmount(value, decimals = 6, displayDecimals = 2) {
    if (!value || value === 0) return '0';

    try {
        let num;

        // Check if it's already a number
        if (typeof value === 'number') {
            num = value;
        }
        // Check if it's a string number
        else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
            num = parseFloat(value);
        }
        // Otherwise assume it's a BigNumber
        else if (value._isBigNumber || ethers.BigNumber.isBigNumber(value)) {
            const formatted = ethers.utils.formatUnits(value, decimals);
            num = parseFloat(formatted);
        }
        // Fallback
        else {
            num = parseFloat(value);
        }

        // Format with locale
        return num.toLocaleString('en-US', {
            minimumFractionDigits: displayDecimals,
            maximumFractionDigits: displayDecimals
        });
    } catch (error) {
        console.error('[UI] Format error:', error);
        return '0';
    }
}

/**
 * Format USD amount with $ sign
 * @param {number} amount - USD amount
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted USD string
 */
export function formatUSD(amount, decimals = 2) {
    return `$${amount.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })}`;
}

/**
 * Update element text content safely
 * @param {string} elementId - Element ID
 * @param {string} content - Text content
 */
export function updateElementText(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = content;
    }
}

/**
 * Update element HTML safely
 * @param {string} elementId - Element ID
 * @param {string} html - HTML content
 */
export function updateElementHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = html;
    }
}

/**
 * Create pool badge element
 * @param {string} poolType - 'usdt' or 'arub'
 * @returns {string} HTML string for badge
 */
export function createPoolBadge(poolType) {
    const isUsdt = poolType.toLowerCase() === 'usdt';
    const icon = isUsdt ? '💵' : '💎';
    const label = isUsdt ? 'USDT Pool' : 'ARUB Pool';

    return `<span class="pool-badge ${poolType.toLowerCase()}">${icon} ${label}</span>`;
}

/**
 * Create info banner HTML
 * @param {string} message - Banner message
 * @param {string} type - 'info', 'warning', 'success', or 'error'
 * @returns {string} HTML string
 */
export function createInfoBanner(message, type = 'info') {
    const colors = {
        info: { bg: 'rgba(0,87,183,0.15)', border: 'var(--ukraine-blue)' },
        warning: { bg: 'rgba(255,165,0,0.15)', border: '#ff6b00' },
        success: { bg: 'rgba(16,185,129,0.15)', border: '#10b981' },
        error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444' }
    };

    const { bg, border } = colors[type] || colors.info;

    return `
        <div style="background: ${bg}; border-left: 4px solid ${border}; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="color: var(--gray); line-height: 1.6; margin: 0;">${message}</p>
        </div>
    `;
}

/**
 * Create progress bar HTML
 * @param {number} percent - Progress percentage (0-100)
 * @param {string} label - Progress label
 * @returns {string} HTML string
 */
export function createProgressBar(percent, label = '') {
    const clampedPercent = Math.max(0, Math.min(percent, 100));

    return `
        <div style="margin: 20px 0;">
            ${label ? `<div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: var(--gray); font-size: 0.95em;">${label}</span>
                <span style="color: var(--ukraine-yellow); font-weight: 600; font-size: 0.95em;">${clampedPercent.toFixed(1)}%</span>
            </div>` : ''}
            <div style="height: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; position: relative;">
                <div style="height: 100%; width: ${clampedPercent}%; background: linear-gradient(90deg, var(--ukraine-blue), var(--ukraine-yellow)); border-radius: 10px; transition: width 0.5s ease; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite;"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create stat card HTML
 * @param {Object} options - Card options
 * @returns {string} HTML string
 */
export function createStatCard({ icon, label, value, subValue, badge }) {
    return `
        <article class="dashboard-stat-card">
            <div class="dashboard-stat-label">${icon} ${label}</div>
            <div class="dashboard-stat-value">${value}</div>
            ${subValue ? `<div class="dashboard-stat-sub">${subValue}</div>` : ''}
            ${badge ? `<div class="dashboard-pill-small">${badge}</div>` : ''}
        </article>
    `;
}

/**
 * Create modal HTML
 * @param {Object} options - Modal options
 * @returns {HTMLElement} Modal element
 */
export function createModal({ title, content, buttons = [] }) {
    const modal = document.createElement('div');
    modal.className = 'wallet-modal';

    let buttonsHTML = '';
    buttons.forEach(btn => {
        const btnClass = btn.type === 'primary' ? 'btn-primary' : 'btn-secondary';
        buttonsHTML += `
            <button class="${btnClass}" data-action="${btn.action}" style="flex: 1;">
                ${btn.label}
            </button>
        `;
    });

    modal.innerHTML = `
        <div class="wallet-modal-content">
            <h2 class="wallet-modal-title">${title}</h2>
            <div style="color: var(--gray); line-height: 1.8; margin-bottom: 30px;">
                ${content}
            </div>
            ${buttonsHTML ? `<div style="display: flex; gap: 15px;">${buttonsHTML}</div>` : ''}
        </div>
    `;

    // Add button handlers
    buttons.forEach(btn => {
        const button = modal.querySelector(`[data-action="${btn.action}"]`);
        if (button && btn.handler) {
            button.addEventListener('click', () => {
                btn.handler();
                modal.remove();
            });
        }
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    return modal;
}

/**
 * Show confirmation modal
 * @param {Object} options - Confirmation options
 * @returns {Promise<boolean>} True if confirmed
 */
export function showConfirmation({ title, message, confirmText = 'Підтвердити', cancelText = 'Скасувати' }) {
    return new Promise((resolve) => {
        const modal = createModal({
            title,
            content: message,
            buttons: [
                {
                    label: cancelText,
                    type: 'secondary',
                    action: 'cancel',
                    handler: () => resolve(false)
                },
                {
                    label: confirmText,
                    type: 'primary',
                    action: 'confirm',
                    handler: () => resolve(true)
                }
            ]
        });

        document.body.appendChild(modal);
    });
}

/**
 * Animate number change
 * @param {HTMLElement} element - Element to animate
 * @param {number} from - Start value
 * @param {number} to - End value
 * @param {number} duration - Animation duration in ms
 */
export function animateNumber(element, from, to, duration = 1000) {
    if (!element) return;

    const startTime = performance.now();
    const diff = to - from;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (easeOutQuad)
        const eased = 1 - (1 - progress) * (1 - progress);

        const current = from + (diff * eased);
        element.textContent = current.toFixed(2);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Scroll to element smoothly
 * @param {string} elementId - Element ID to scroll to
 */
export function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if in viewport
 */
export function isInViewport(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Format time duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds} секунд`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} хвилин`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
        return remainingMinutes > 0
            ? `${hours} год ${remainingMinutes} хв`
            : `${hours} годин`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return remainingHours > 0
        ? `${days} дн ${remainingHours} год`
        : `${days} днів`;
}

/**
 * Get transaction error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
    if (error.code === 4001) {
        return 'Транзакцію відхилено користувачем';
    }

    if (error.code === 'INSUFFICIENT_FUNDS') {
        return 'Недостатньо коштів для оплати gas';
    }

    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return 'Неможливо виконати транзакцію. Перевірте параметри';
    }

    if (error.code === -32002) {
        return 'Запит вже відкрито в гаманці';
    }

    if (error.reason) {
        return error.reason;
    }

    if (error.message) {
        // Clean up technical error messages
        const msg = error.message;
        if (msg.includes('execution reverted')) {
            return 'Транзакція відхилена контрактом';
        }
        return msg;
    }

    return 'Невідома помилка';
}
