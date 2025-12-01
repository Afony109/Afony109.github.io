/**
 * Main Application Entry Point
 * Initializes all modules and manages global state
 */

import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

import { CONFIG, getCurrentTier } from './config.js';
import { initWalletModule, addTokenToWallet, connectWallet, disconnectWallet } from './wallet.js';
import { initTradingModule, buyTokens, sellTokens, setMaxBuy, setMaxSell } from './trading.js';
import { initStakingModule } from './staking.js';
import { initFaucetModule, claimFromFaucet } from './faucet.js';
import { showNotification, copyToClipboard, formatUSD, formatTokenAmount } from './ui.js';
import { getPoolStats, getArubPrice, initReadOnlyContracts, getTotalSupplyArub, getDetailedStats } from './contracts.js';
import {
    stakeUsdtTokens,
    stakeArubTokens,
    unstakeUsdtTokens,
    unstakeArubTokens,
    claimRewards,
    setMaxStakeUsdt,
    setMaxStakeArub,
    setMaxUnstakeUsdt,
    setMaxUnstakeArub
} from './staking-actions.js';

// === DASHBOARD CHARTS STATE (TVL) ===
let stakedChart = null;

// История TVL (стартовый сценарий, потом заменяем под реальный TVL)
const chartLabels = [
    'T-6', 'T-5', 'T-4',
    'T-3', 'T-2', 'T-1',
    'T0'
];

const chartStakedHistory = [
    52000,
    74000,
    91000,
    125000,
    167000,
    210000,
    277988
];

// флаг: уже ли мы пересчитали стартовый сценарий под реальный TVL
let tvlChartInitializedFromRealValue = false;

/**
 * Синхронизация графика USD/RUB на index.html
 * Использует глобальную функцию window.updateUsdRubPointFromArub(rate),
 * которую определяет скрипт на странице (Chart.js).
 */
function syncUsdRubChart(currentRate) {
    if (
        typeof window !== 'undefined' &&
        typeof window.updateUsdRubPointFromArub === 'function' &&
        typeof currentRate === 'number' &&
        Number.isFinite(currentRate) &&
        currentRate > 0
    ) {
        try {
            window.updateUsdRubPointFromArub(currentRate);
        } catch (err) {
            console.warn('[APP] Failed to sync USD/RUB chart:', err);
        }
    }
}

/**
 * Обновление графика TVL (Chart.js)
 */
function updateDashboardCharts(tvlUsd) {
    if (typeof Chart === 'undefined') {
        console.warn('[APP] Chart.js is not loaded, skip charts');
        return;
    }

    // 1️⃣ При первом реальном значении TVL перестраиваем "историю" как сценарий
    if (!tvlChartInitializedFromRealValue && tvlUsd && Number.isFinite(tvlUsd) && tvlUsd > 0) {
        const factors = [0.3, 0.45, 0.6, 0.75, 0.85, 0.95, 1.0];

        for (let i = 0; i < factors.length; i++) {
            chartStakedHistory[i] = Math.round(tvlUsd * factors[i]);
        }

        // Подправим подписи, чтобы выглядело как прошлые моменты времени
        const now = new Date();
        for (let i = factors.length - 1; i >= 0; i--) {
            const ts = new Date(now.getTime() - (factors.length - 1 - i) * 60 * 60 * 1000);
            chartLabels[i] = ts.toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        tvlChartInitializedFromRealValue = true;
    }

    // 2️⃣ Добавляем свежую точку по времени
    const label = new Date().toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    chartLabels.push(label);
    chartStakedHistory.push(tvlUsd);

    if (chartLabels.length > 50) {
        chartLabels.shift();
        chartStakedHistory.shift();
    }

    const stakedCanvas = document.getElementById('tvlChart');
    if (!stakedCanvas) return;

    if (!stakedChart) {
        stakedChart = new Chart(stakedCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'TVL, $',
                    data: chartStakedHistory,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    tension: 0.35,
                    borderColor: 'rgba(0, 158, 247, 1)',
                    backgroundColor: 'rgba(0, 158, 247, 0.15)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                return 'TVL: $' + context.parsed.y.toLocaleString('en-US');
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { display: false }
                    },
                    y: {
                        display: true,
                        ticks: {
                            callback: v => '$' + v.toLocaleString('en-US')
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                }
            }
        });
    } else {
        stakedChart.data.labels = chartLabels;
        stakedChart.data.datasets[0].data = chartStakedHistory;
        stakedChart.update('none');
    }
}

/**
 * Обновление текущего Tier по TVL
 */
function updateTierUSD(stakedArub, stakedUsdt, priceArub, apy) {
    const stakedArubUsd = (stakedArub / 1e6) * priceArub;
    const stakedUsdtUsd = stakedUsdt / 1e6;
    const tvl = stakedArubUsd + stakedUsdtUsd;

    let tier = 1;
    if (tvl < 100000) tier = 1;
    else if (tvl < 200000) tier = 2;
    else if (tvl < 400000) tier = 3;
    else if (tvl < 800000) tier = 4;
    else tier = 5;

    // заголовок слева
    const tierHeroEl = document.getElementById('dashHeroTier');
    if (tierHeroEl) {
        tierHeroEl.textContent = `Tier ${tier} (${apy}%)`;
    }

    // подсветка уровней справа
    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById(`tier-${i}`);
        if (!el) continue;

        if (i === tier) {
            el.classList.add('active');   // активный level
        } else {
            el.classList.remove('active');
        }
    }
}


/**
 * Обновление глобальной статистики (TVL, APY, стейкеры, цена и т.п.)
 */
async function updateGlobalStats() {
    console.log('[APP] 🔄 Updating global statistics...');

    try {
        const [poolStats, arubPriceInfo, totalSupply, detailedStats] = await Promise.all([
            getPoolStats(),
            getArubPrice(),
            getTotalSupplyArub(),
            getDetailedStats()
        ]);

        const arubPrice = arubPriceInfo.price;
        const arubPriceSource = arubPriceInfo.source;

        const tvlUsd = detailedStats.totalStakedUsdt + detailedStats.totalStakedArub * arubPrice;
        const tierInfo = getCurrentTier(tvlUsd);

        // Старые элементы (другие страницы)
        const elements = {
            globalTvl: document.getElementById('globalTvl'),
            globalApy: document.getElementById('globalApy'),
            globalStakers: document.getElementById('globalStakers'),
            globalArubPrice: document.getElementById('globalArubPrice'),
            totalSupplyArub: document.getElementById('totalSupplyArub'),
            totalStakedArub: document.getElementById('totalStakedArub'),
            totalStakedUsdt: document.getElementById('totalStakedUsdt'),
            totalRewards: document.getElementById('totalRewards'),
            arubPriceSource: document.getElementById('arubPriceSource')
        };

        const stakingElements = {
            totalTvl: document.getElementById('totalTvl'),
            currentApy: document.getElementById('currentApy'),
            totalStakers: document.getElementById('totalStakers'),
            arubPrice: document.getElementById('arubPrice')
        };

        if (elements.globalTvl) elements.globalTvl.textContent = formatUSD(tvlUsd);
        if (elements.globalApy) elements.globalApy.textContent = `${(tierInfo.apy / 100).toFixed(1)}%`;
        if (elements.globalStakers) elements.globalStakers.textContent = poolStats.totalStakers.toLocaleString();
        if (elements.globalArubPrice) elements.globalArubPrice.textContent = `${arubPrice.toFixed(2)} USDT`;

        if (elements.arubPriceSource) {
            let label = 'Backup ⚠️';
            let color = '#fbbf24';

            if (arubPriceSource === 'oracle' || arubPriceSource === 'forex-api') {
                label = arubPriceSource === 'oracle' ? 'Oracle' : 'Forex';
                color = '#80e29d';
            }

            elements.arubPriceSource.textContent = `Джерело курсу: ${label}`;
            elements.arubPriceSource.style.color = color;
        }

        if (stakingElements.totalTvl) stakingElements.totalTvl.textContent = formatUSD(tvlUsd);
        if (stakingElements.currentApy) stakingElements.currentApy.textContent = `${(tierInfo.apy / 100).toFixed(1)}%`;
        if (stakingElements.totalStakers) stakingElements.totalStakers.textContent = poolStats.totalStakers.toLocaleString();
        if (stakingElements.arubPrice) stakingElements.arubPrice.textContent = `${arubPrice.toFixed(2)} USDT`;

        if (elements.totalSupplyArub) {
            elements.totalSupplyArub.textContent = formatTokenAmount(totalSupply) + ' ARUB';
        }

        if (elements.totalStakedArub) {
            elements.totalStakedArub.textContent = formatTokenAmount(detailedStats.totalStakedArub) + ' ARUB';
        }

        if (elements.totalStakedUsdt) {
            elements.totalStakedUsdt.textContent = formatTokenAmount(detailedStats.totalStakedUsdt) + ' USDT';
        }

        if (elements.totalRewards && poolStats.totalRewardsDistributed) {
            const rewardsArub = parseFloat(
                ethers.utils.formatUnits(poolStats.totalRewardsDistributed, CONFIG.DECIMALS.ARUB)
            );
            elements.totalRewards.textContent = formatTokenAmount(rewardsArub) + ' ARUB';
        }

        // --- Новый дашборд на index.html ---

        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        const stakersCount = typeof poolStats.totalStakers === 'number'
            ? poolStats.totalStakers
            : 0;

        const stakedTokens = detailedStats.totalStakedArub;
        const stakedUsd = stakedTokens * arubPrice;

        const supplyTokens = totalSupply;
        const supplyUsd = supplyTokens * arubPrice;

        setText('arubPriceValue', arubPrice.toFixed(2));
        setText('dashHeroStakers', stakersCount.toLocaleString('en-US'));
        setText('dashHeroTvl', formatUSD(tvlUsd));

        // Синхронизация графика USD/RUB з ончейн-курсом (ціна ARUB)
        syncUsdRubChart(arubPrice);

        const apyPercent = (tierInfo.apy / 100).toFixed(1);
        const apyNum = parseFloat(apyPercent);

        const apyNoteEl = document.getElementById('apy-note');
        if (apyNoteEl) {
            let apyLabel;
            if (apyNum >= 20) {
                apyLabel = 'APY: <strong style="font-weight:600;">' + apyPercent + '%</strong> для ранніх користувачів';
            } else {
                apyLabel = 'APY: <strong style="font-weight:600;">' + apyPercent + '%</strong> річних';
            }
            apyNoteEl.innerHTML = apyLabel;
        }

        // 1. Total Supply ARUB
        setText('arub-supply', formatTokenAmount(supplyTokens) + ' ARUB');
        if (!isNaN(supplyUsd) && supplyUsd > 0) {
            setText('arub-supply-usd', formatUSD(supplyUsd));
        }

        // 2. Staked ARUB
        const stakedArubTokens = detailedStats.totalStakedArub;
        const stakedArubUsd = stakedArubTokens * arubPrice;
        setText('arub-staked', formatTokenAmount(stakedArubTokens) + ' ARUB');
        setText('arub-staked-usd', '≈ ' + formatUSD(stakedArubUsd));

        // 3. Staked USDT
        const stakedUsdtTokens = detailedStats.totalStakedUsdt;
        setText('usdt-staked', formatTokenAmount(stakedUsdtTokens) + ' USDT');
        setText('usdt-staked-usd', '≈ ' + formatUSD(stakedUsdtTokens));

        updateTierUSD(
            stakedArubTokens * 1e6,
            stakedUsdtTokens * 1e6,
            arubPrice,
            apyPercent
        );

        const loading = document.getElementById('dashLoadingText');
        const grid = document.getElementById('stats');
        if (loading) loading.textContent = 'Дані успішно оновлено.';
        if (grid) grid.style.display = 'grid';

        console.log('[APP] ✅ Global stats updated successfully!');
        console.log('[APP] 📊 TVL:', formatUSD(tvlUsd));
        console.log('[APP] 📈 APY:', `${(tierInfo.apy / 100).toFixed(1)}%`);
        console.log('[APP] 👥 Stakers:', poolStats.totalStakers);
        console.log('[APP] 🪙 ARUB Price:', `${arubPrice.toFixed(2)} USDT`);
        console.log('[APP] 💎 Total Supply:', formatTokenAmount(totalSupply), 'ARUB');
        console.log('[APP] 🔒 Staked ARUB:', formatTokenAmount(detailedStats.totalStakedArub), 'ARUB');
        console.log('[APP] 💵 Staked USDT:', formatTokenAmount(detailedStats.totalStakedUsdt), 'USDT');

        updateDashboardCharts(tvlUsd);
    } catch (error) {
        console.error('[APP] ❌ Error updating global stats:', error);

        const elements = {
            globalTvl: document.getElementById('globalTvl'),
            globalApy: document.getElementById('globalApy'),
            globalArubPrice: document.getElementById('globalArubPrice'),
            globalStakers: document.getElementById('globalStakers'),
            totalSupplyArub: document.getElementById('totalSupplyArub'),
            totalStakedArub: document.getElementById('totalStakedArub'),
            totalStakedUsdt: document.getElementById('totalStakedUsdt'),
            totalRewards: document.getElementById('totalRewards')
        };

        if (elements.globalTvl) elements.globalTvl.textContent = '—';
        if (elements.globalApy) elements.globalApy.textContent = '—';
        if (elements.globalArubPrice) elements.globalArubPrice.textContent = '—';
        if (elements.globalStakers) elements.globalStakers.textContent = '—';
    }
}

/**
 * Анимации при скролле
 */
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.staking-section, .stats-section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

/**
 * Инициализация всего приложения
 */
async function initApp() {
    console.log('='.repeat(60));
    console.log('ANTI RUB - Staking Platform');
    console.log('Initializing application...');
    console.log('='.repeat(60));

    try {
        console.log('[APP] Initializing read-only contracts...');
        const readOnlySuccess = await initReadOnlyContracts();

        if (readOnlySuccess) {
            console.log('[APP] Read-only contracts ready, fetching initial stats...');
            // Небольшая задержка, чтобы провайдер успел подтянуться
            setTimeout(() => {
                updateGlobalStats();
            }, 500);
        }

        console.log('[APP] Initializing wallet module...');
        initWalletModule();

        console.log('[APP] Initializing trading module...');
        initTradingModule();

        console.log('[APP] Initializing staking module...');
        initStakingModule();

        console.log('[APP] Initializing faucet module...');
        initFaucetModule();

        console.log('[APP] ✅ All modules initialized successfully');

        setupGlobalEventListeners();
        setupScrollAnimations();

        // Переодическое обновление статов
        setInterval(() => {
            updateGlobalStats();
        }, CONFIG.UI.STATS_UPDATE_INTERVAL);

        console.log('[APP] 🎉 Application ready!');
        console.log('[APP] Network:', CONFIG.NETWORK.name);
        console.log('[APP] Chain ID:', CONFIG.NETWORK.chainIdDecimal);
    } catch (error) {
        console.error('[APP] ❌ Initialization error:', error);
        showNotification('❌ Помилка ініціалізації додатку', 'error');
    }
}

/**
 * Глобальные слушатели и хелперы
 */
function setupGlobalEventListeners() {
    // Плавный скролл по якорям
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Переключатель языка (заглушка)
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showNotification('🌐 Мовна підтримка в розробці', 'info');
        });
    });

    // После faucet → обновляем UI
    window.addEventListener('faucetClaimed', () => {
        console.log('[APP] Faucet claimed, updating UIs...');
        const { userAddress } = window;
        if (userAddress) {
            window.dispatchEvent(new CustomEvent('contractsInitialized', {
                detail: { userAddress }
            }));
        }
    });

    // Контракты инициализировались → обновляем статы
    window.addEventListener('contractsInitialized', () => {
        console.log('[APP] Updating global stats (contractsInitialized)...');
        updateGlobalStats();
    });
}

/**
 * Глобальные функции для HTML-обработчиков
 */
// Wallet
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.addTokenToWallet = addTokenToWallet;
window.addArubToMetaMask = () => addTokenToWallet('ARUB');
window.addUsdtToMetaMask = () => addTokenToWallet('USDT');
window.copyTokenAddress = () =>
    copyToClipboard(CONFIG.TOKEN_ADDRESS, '✅ Адресу токена скопійовано!');

// Trading
window.buyTokens = buyTokens;
window.sellTokens = sellTokens;
window.setMaxBuy = setMaxBuy;
window.setMaxSell = setMaxSell;

// Staking
window.stakeUsdtTokens = stakeUsdtTokens;
window.stakeArubTokens = stakeArubTokens;
window.unstakeUsdtTokens = unstakeUsdtTokens;
window.unstakeArubTokens = unstakeArubTokens;
window.claimRewards = claimRewards;
window.setMaxStakeUsdt = setMaxStakeUsdt;
window.setMaxStakeArub = setMaxStakeArub;
window.setMaxUnstakeUsdt = setMaxUnstakeUsdt;
window.setMaxUnstakeArub = setMaxUnstakeArub;

// Faucet
window.claimFromFaucet = claimFromFaucet;

// Хелпер для скролла
window.scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};

// Старт приложения
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

console.log('[APP] Version: 2.0.0 (Modular Refactor)');
console.log('[APP] Build: ' + new Date().toISOString());

export { initApp };
