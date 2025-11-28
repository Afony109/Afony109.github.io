/**
 * Main Application Entry Point
 * Initializes all modules and manages global state
 */

// Import ethers.js as ES module
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

import { CONFIG, getCurrentTier } from './config.js';
import { initWalletModule, addTokenToWallet, connectWallet, disconnectWallet } from './wallet.js';
import { initTradingModule, buyTokens, sellTokens, setMaxBuy, setMaxSell } from './trading.js';
import { initStakingModule } from './staking.js';
import { initFaucetModule, claimFromFaucet } from './faucet.js';
import { showNotification, copyToClipboard, formatUSD, formatTokenAmount } from './ui.js';
import { getPoolStats, getArubPrice, initReadOnlyContracts, getTotalSupplyArub, getDetailedStats, getApyTiersOnChain } from './contracts.js';
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

// === DASHBOARD CHARTS STATE (TVL + USD/RUB) ===
let stakedChart = null;
let usdRubChart = null;

// Початкові статичні дані для графіка (плавний ріст TVL)
const chartLabels = [
    "01.09", "10.09", "20.09",
    "01.10", "10.10", "20.10",
    "01.11"
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

// Данные USD/RUB 2020-2030
// ИСТОРИЯ: красивая "горка" к 140 и плавный спуск
function getHistoryData(currentRate) {
    return [
        { x: new Date(2020, 0, 1).getTime(), y: 72.3 },
        { x: new Date(2021, 0, 1).getTime(), y: 73.7 },
        { x: new Date(2022, 0, 1).getTime(), y: 140 },    // 2022 — линия доходит до пика
        { x: new Date(2023, 0, 1).getTime(), y: 110 },    // 2023 — плавное снижение после пика
        { x: new Date(2024, 0, 1).getTime(), y: 92.8 },
        { x: new Date(2025, 0, 1).getTime(), y: currentRate }
    ];
}

// ПИК 2022 — 140 RUB (красная точка для подсветки)
const peak2022Data = [
    { x: new Date(2022, 0, 1).getTime(), y: 140 }
];

// Сценарий 2025-2030 - функция будет обновлять для 2025
function getScenarioData(currentRate) {
    return [
        { x: new Date(2025, 0, 1).getTime(), y: currentRate },
        { x: new Date(2026, 0, 1).getTime(), y: 200 },
        { x: new Date(2027, 0, 1).getTime(), y: 400 },
        { x: new Date(2028, 0, 1).getTime(), y: 500 },
        { x: new Date(2029, 0, 1).getTime(), y: 350 },
        { x: new Date(2030, 0, 1).getTime(), y: 250 }
    ];
}

/**
 * Get current USD/RUB rate from ARUB price
 */
function getCurrentRateFromArub() {
    const el = document.getElementById('arubPriceValue');
    if (!el) return null;

    const raw = el.textContent.trim().replace(',', '.').replace(/[^0-9.]/g, '');
    const value = parseFloat(raw);

    return isNaN(value) ? null : value;
}

/**
 * Initialize USD/RUB chart with ApexCharts
 */
function initUsdRubChart() {
    const chartElement = document.getElementById('dashPriceChart');
    if (!chartElement) {
        console.warn('[APP] USD/RUB chart element not found');
        return;
    }

    if (typeof ApexCharts === 'undefined') {
        console.warn('[APP] ApexCharts is not loaded');
        return;
    }

    // Получаем текущий курс из цены ARUB
    let currentRate = getCurrentRateFromArub();
    if (currentRate === null) {
        currentRate = 80.98; // fallback
    }

    // Текущая точка (2025)
    const currentPointData = [
        { x: new Date(2025, 0, 1).getTime(), y: currentRate }
    ];

    const options = {
        chart: {
            type: 'line',
            height: 220,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'Inter, sans-serif'
        },
        series: [
            {
                name: 'Історичний курс',
                data: getHistoryData(currentRate),
                type: 'line'
            },
            {
                name: 'Сценарій 2025–2030',
                data: getScenarioData(currentRate),
                type: 'line'
            },
            {
                name: `Поточний курс (${currentRate.toFixed(2)})`,
                data: currentPointData,
                type: 'scatter'
            },
            {
                name: 'Пік 2022 року (140)',
                data: peak2022Data,
                type: 'scatter'
            }
        ],
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: [2, 2, 0, 0],
            dashArray: [0, 6, 0, 0]
        },
        colors: ['#4a90e2', '#60a5fa', '#ffd700', '#ef4444'],
        xaxis: {
            type: 'datetime',
            labels: {
                format: 'yyyy',
                datetimeUTC: false,
                style: {
                    colors: '#8b94a8',
                    fontSize: '11px'
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: (val) => val ? val.toFixed(0) : '',
                style: {
                    colors: '#8b94a8',
                    fontSize: '11px'
                }
            },
            title: {
                text: 'Курс USD/RUB',
                style: {
                    color: '#8b94a8',
                    fontSize: '11px'
                }
            }
        },
        tooltip: {
            theme: 'dark',
            x: { format: 'yyyy' },
            y: {
                formatter: (val) => val ? val.toFixed(2) + ' ₽' : ''
            }
        },
        grid: {
            borderColor: 'rgba(255,255,255,0.06)',
            strokeDashArray: 4
        },
        markers: {
            size: [0, 0, 6, 7],
            hover: {
                size: [4, 4, 8, 9]
            }
        },
        legend: {
            show: true,
            labels: {
                colors: '#8b94a8'
            },
            markers: {
                width: 12,
                height: 2,
                radius: 0
            }
        }
    };

    usdRubChart = new ApexCharts(chartElement, options);
    usdRubChart.render();
    console.log('[APP] ✅ USD/RUB chart initialized with current rate:', currentRate);
}

/**
 * Update USD/RUB chart current point from ARUB price
 */
window.updateUsdRubPointFromArub = function() {
    const newRate = getCurrentRateFromArub();
    if (newRate === null || !usdRubChart) return;

    const currentPointData = [
        { x: new Date(2025, 0, 1).getTime(), y: newRate }
    ];

    // Update series
    usdRubChart.updateSeries([
        {
            name: 'Історичний курс',
            data: getHistoryData(newRate)
        },
        {
            name: 'Сценарій 2025–2030',
            data: getScenarioData(newRate)
        },
        {
            name: `Поточний курс (${newRate.toFixed(2)})`,
            data: currentPointData
        },
        {
            name: 'Пік 2022 року (140)',
            data: peak2022Data
        }
    ]);

    console.log('[APP] 📊 USD/RUB chart updated with new rate:', newRate);
};

/**
 * Update TVL chart (Chart.js)
 */
function updateDashboardCharts(tvlUsd) {
    if (typeof Chart === 'undefined') {
        console.warn('[APP] Chart.js is not loaded, skip charts');
        return;
    }

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
    if (!stakedCanvas) {
        return; // графики не на этой странице
    }

    // TVL chart
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
                    tension: 0.35, // згладжена лінія
                    borderColor: 'rgba(0, 158, 247, 1)',      // синій колір лінії
                    backgroundColor: 'rgba(0, 158, 247, 0.15)', // напівпрозора заливка
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
                            label: function(context) {
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
 * Initialize the application
 */
async function initApp() {
    console.log('='.repeat(60));
    console.log('ANTI RUB - Staking Platform');
    console.log('Initializing application...');
    console.log('='.repeat(60));

    try {
        // Initialize read-only contracts first (for public data)
        console.log('[APP] Initializing read-only contracts...');
        const readOnlySuccess = await initReadOnlyContracts();

        // Update stats immediately after read-only contracts are initialized
        if (readOnlySuccess) {
            console.log('[APP] Read-only contracts ready, fetching initial stats...');
            // Small delay to ensure contracts are fully ready
            setTimeout(() => {
                updateGlobalStats();
            }, 500);
        }

        // Initialize all modules
        console.log('[APP] Initializing wallet module...');
        initWalletModule();

        console.log('[APP] Initializing trading module...');
        initTradingModule();

        console.log('[APP] Initializing staking module...');
        initStakingModule();

        console.log('[APP] Initializing faucet module...');
        initFaucetModule();

        console.log('[APP] ✅ All modules initialized successfully');

        // Setup global event listeners
        setupGlobalEventListeners();

        // Setup scroll animations
        setupScrollAnimations();

        // Initialize USD/RUB chart (now using Chart.js in HTML)
        // console.log('[APP] Initializing USD/RUB chart...');
        // initUsdRubChart();

        // Update global stats periodically (every 30 seconds)
        setInterval(() => {
            updateGlobalStats();
        }, CONFIG.UI.STATS_UPDATE_INTERVAL);

        // Display welcome message
        console.log('[APP] 🎉 Application ready!');
        console.log('[APP] Network:', CONFIG.NETWORK.name);
        console.log('[APP] Chain ID:', CONFIG.NETWORK.chainIdDecimal);

    } catch (error) {
        console.error('[APP] ❌ Initialization error:', error);
        showNotification('❌ Помилка ініціалізації додатку', 'error');
    }
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Language switcher (if implemented)
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // TODO: Implement actual language switching
            showNotification('🌐 Мовна підтримка в розробці', 'info');
        });
    });

    // Listen for faucet claims to update other UIs
    window.addEventListener('faucetClaimed', () => {
        console.log('[APP] Faucet claimed, updating UIs...');
        const { userAddress } = window;
        if (userAddress) {
            // Trigger update for trading UI
            window.dispatchEvent(new CustomEvent('contractsInitialized', {
                detail: { userAddress }
            }));
        }
    });

    // Listen for contracts initialized to update global stats
    window.addEventListener('contractsInitialized', () => {
        console.log('[APP] Updating global stats...');
        updateGlobalStats();
    });
}

/**
 * Update tier display based on TVL
 */
function updateTierUSD(stakedArub, stakedUsdt, priceArub, apy) {
    const stakedArubUsd = (stakedArub / 1e6) * priceArub;
    const stakedUsdtUsd = stakedUsdt / 1e6;

    const tvl = stakedArubUsd + stakedUsdtUsd;

    let tier = 1;

    if (tvl < 100000) tier = 1;
    else if (tvl < 200000) tier = 2;
    else if (tvl < 400000) tier = 3;
    else tier = 4;

    // Update hero tier display
    const tierHeroEl = document.getElementById('dashHeroTier');
    if (tierHeroEl) {
        tierHeroEl.textContent = `Tier ${tier} (${apy}%)`;
    }

    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`tier-${i}`);
        if (el) {
            el.style.opacity = (i === tier) ? "1" : "0.45";
        }
    }
}

/**
 * Update global statistics
 */

async function updateGlobalStats() {
    console.log('[APP] 🔄 Updating global statistics...');

    try {
        // 1. Получаем данные с блокчейна
        const [poolStats, arubPriceInfo, totalSupply, detailedStats] = await Promise.all([
            getPoolStats(),
            getArubPrice(),
            getTotalSupplyArub(),
            getDetailedStats()
        ]);

        const arubPrice = arubPriceInfo.price;
        const arubPriceSource = arubPriceInfo.source;

        // 2. TVL в USD (USDT + ARUB)
        const tvlUsd =
            detailedStats.totalStakedUsdt +
            detailedStats.totalStakedArub * arubPrice;

        // 3. Текущий tier по TVL (для заголовка "Tier 1 / Tier 2...")
        const tierInfo = getCurrentTier(tvlUsd);

        // 4. APY всегда берём из КОНТРАКТА (basis points)
        let apyBps = poolStats.currentAPY || CONFIG.FALLBACK.APY; // 1200 = 12%
        const apyPercent = (apyBps / 100).toFixed(1);             // '12.0'
        const apyNum = parseFloat(apyPercent);

        // --- СТАРЫЙ UI / другие страницы ---

        const elements = {
            globalTvl:          document.getElementById('globalTvl'),
            globalApy:          document.getElementById('globalApy'),
            globalStakers:      document.getElementById('globalStakers'),
            globalArubPrice:    document.getElementById('globalArubPrice'),
            totalSupplyArub:    document.getElementById('totalSupplyArub'),
            totalStakedArub:    document.getElementById('totalStakedArub'),
            totalStakedUsdt:    document.getElementById('totalStakedUsdt'),
            totalRewards:       document.getElementById('totalRewards'),
            arubPriceSource:    document.getElementById('arubPriceSource')
        };

        const stakingElements = {
            totalTvl:     document.getElementById('totalTvl'),
            currentApy:   document.getElementById('currentApy'),
            totalStakers: document.getElementById('totalStakers'),
            arubPrice:    document.getElementById('arubPrice')
        };

        if (elements.globalTvl) {
            elements.globalTvl.textContent = formatUSD(tvlUsd);
        }

        if (elements.globalApy) {
            elements.globalApy.textContent = `${apyPercent}%`;
        }

        if (elements.globalStakers) {
            elements.globalStakers.textContent = poolStats.totalStakers.toLocaleString();
        }

        if (elements.globalArubPrice) {
            elements.globalArubPrice.textContent = `${arubPrice.toFixed(2)} USDT`;
        }

        if (elements.arubPriceSource) {
            const isOracle = arubPriceSource === 'oracle';
            const label = isOracle ? 'Oracle' : 'Backup';
            elements.arubPriceSource.textContent =
                `Джерело курсу: ${label}${isOracle ? '' : ' ⚠️'}`;
            elements.arubPriceSource.style.color = isOracle ? '#80e29d' : '#fbbf24';
        }

        if (stakingElements.totalTvl) {
            stakingElements.totalTvl.textContent = formatUSD(tvlUsd);
        }

        if (stakingElements.currentApy) {
            stakingElements.currentApy.textContent = `${apyPercent}%`;
        }

        if (stakingElements.totalStakers) {
            stakingElements.totalStakers.textContent = poolStats.totalStakers.toLocaleString();
        }

        if (stakingElements.arubPrice) {
            stakingElements.arubPrice.textContent = `${arubPrice.toFixed(2)} USDT`;
        }

        if (elements.totalSupplyArub) {
            elements.totalSupplyArub.textContent =
                formatTokenAmount(totalSupply) + ' ARUB';
        }

        if (elements.totalStakedArub) {
            elements.totalStakedArub.textContent =
                formatTokenAmount(detailedStats.totalStakedArub) + ' ARUB';
        }

        if (elements.totalStakedUsdt) {
            elements.totalStakedUsdt.textContent =
                formatTokenAmount(detailedStats.totalStakedUsdt) + ' USDT';
        }

        if (elements.totalRewards && poolStats.totalRewardsDistributed) {
            const rewardsArub = parseFloat(
                ethers.utils.formatUnits(
                    poolStats.totalRewardsDistributed,
                    CONFIG.DECIMALS.ARUB
                )
            );
            elements.totalRewards.textContent =
                formatTokenAmount(rewardsArub) + ' ARUB';
        }

        // --- НОВЫЙ DASHBOARD (hero + нижние карточки) ---

        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        const stakersCount =
            typeof poolStats.totalStakers === 'number'
                ? poolStats.totalStakers
                : 0;
        const stakersText = stakersCount.toLocaleString('en-US');

        const stakedTokens = detailedStats.totalStakedArub;
        const stakedUsd = stakedTokens * arubPrice;

        const supplyTokens = totalSupply;
        const supplyUsd = supplyTokens * arubPrice;

        // HERO
        setText('arubPriceValue', arubPrice.toFixed(2));
        setText('dashHeroStakers', stakersText);
        setText('dashHeroTvl', formatUSD(tvlUsd));

        // Обновить точку на USD/RUB графике
        if (window.updateUsdRubPointFromArub) {
            window.updateUsdRubPointFromArub();
        }

        // Обновляем левую карточку Tier / APY
        const currentTierLabel = document.getElementById('currentTierLabel');
        if (currentTierLabel) {
            const tierNumber = (tierInfo.tier || 0) + 1;
            currentTierLabel.textContent = `Tier ${tierNumber} (${apyPercent}%)`;
        }

        // Жёлтая подпись в hero под TVL
        const apyNoteEl = document.getElementById('apy-note');
        if (apyNoteEl) {
            let apyLabel = '';
            if (apyNum >= 20) {
                apyLabel =
                    'APY: <strong style="font-weight:600;">' +
                    apyPercent +
                    '%</strong> для ранніх користувачів';
            } else {
                apyLabel =
                    'APY: <strong style="font-weight:600;">' +
                    apyPercent +
                    '%</strong> річних';
            }
            apyNoteEl.innerHTML = apyLabel;
        }

        // Нижние карточки

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

        // Обновляем старый tier-блок (цветовая подсветка) на основе TVL
        updateTierUSD(
            stakedArubTokens * 1e6,
            stakedUsdtTokens * 1e6,
            arubPrice,
            apyPercent
        );

        // Статус загрузки
        const loading = document.getElementById('dashLoadingText');
        const grid = document.getElementById('stats');
        if (loading) loading.textContent = 'Дані успішно оновлено.';
        if (grid) grid.style.display = 'grid';

        // Логи
        console.log('[APP] ✅ Global stats updated successfully!');
        console.log('[APP] 📊 TVL:', formatUSD(tvlUsd));
        console.log('[APP] 📈 APY (on-chain):', `${apyPercent}%`);
        console.log('[APP] 👥 Stakers:', poolStats.totalStakers);
        console.log('[APP] 🪙 ARUB Price:', `${arubPrice.toFixed(2)} USDT`);
        console.log('[APP] 💎 Total Supply:', formatTokenAmount(totalSupply), 'ARUB');
        console.log('[APP] 🔒 Staked ARUB:', formatTokenAmount(detailedStats.totalStakedArub), 'ARUB');
        console.log('[APP] 💵 Staked USDT:', formatTokenAmount(detailedStats.totalStakedUsdt), 'USDT');

        updateDashboardCharts(tvlUsd);

        // Обновляем правую карточку уровней стейкінгу
        updateStakingLevelsUI(tvlUsd);
    } catch (error) {
        console.error('[APP] ❌ Error updating global stats:', error);

        const elements = {
            globalTvl:       document.getElementById('globalTvl'),
            globalApy:       document.getElementById('globalApy'),
            globalArubPrice: document.getElementById('globalArubPrice'),
            globalStakers:   document.getElementById('globalStakers'),
            totalSupplyArub: document.getElementById('totalSupplyArub'),
            totalStakedArub: document.getElementById('totalStakedArub'),
            totalStakedUsdt: document.getElementById('totalStakedUsdt'),
            totalRewards:    document.getElementById('totalRewards')
        };

        if (elements.globalTvl)       elements.globalTvl.textContent       = '—';
        if (elements.globalApy)       elements.globalApy.textContent       = '—';
        if (elements.globalArubPrice) elements.globalArubPrice.textContent = '—';
        if (elements.globalStakers)   elements.globalStakers.textContent   = '—';
    }
}


/**
 * Обновляет правую карточку "Рівні стейкінгу (USD)" на основе ончейн-тиеров.
 * Если контракт недоступен — используется CONFIG.STAKING.
 */
async function updateStakingLevelsUI(tvlUsd) {
    try {
        const onChain = await getApyTiersOnChain();

        const thresholds =
            onChain && Array.isArray(onChain.thresholds) && onChain.thresholds.length
                ? onChain.thresholds
                : CONFIG.STAKING.TIER_THRESHOLDS_USD;

        const apys =
            onChain && Array.isArray(onChain.apys) && onChain.apys.length
                ? onChain.apys
                : CONFIG.STAKING.TIER_APYS.map(v => v / 100);

        // определяем текущий tier по тому же принципу, что и слева
        let currentTierIndex = 0;
        for (let i = 0; i < thresholds.length; i++) {
            if (tvlUsd < thresholds[i]) {
                currentTierIndex = i;
                break;
            }
            if (i === thresholds.length - 1 && tvlUsd >= thresholds[i]) {
                currentTierIndex = thresholds.length;
            }
        }

        const items = [
            document.getElementById('tier-1'),
            document.getElementById('tier-2'),
            document.getElementById('tier-3'),
            document.getElementById('tier-4'),
            document.getElementById('tier-5')
        ];

        const formatUsd = (v) =>
            '$' + Math.round(v).toLocaleString('en-US');

        for (let i = 0; i < items.length; i++) {
            const li = items[i];
            if (!li) continue;

            if (i >= apys.length) {
                li.style.display = 'none';
                continue;
            }

            li.style.display = '';
            li.classList.remove('active-tier');

            const start = i === 0 ? 0 : thresholds[Math.min(i - 1, thresholds.length - 1)];
            const end   = i < thresholds.length ? thresholds[i] : null;

            let rangeText;
            if (end == null) {
                rangeText = `> ${formatUsd(start)}`;
            } else {
                rangeText = `${formatUsd(start)} — ${formatUsd(end)}`;
            }

            const apyStr = apys[i].toFixed(1);

            li.innerHTML = `Tier ${i + 1}: ${rangeText} → <b>${apyStr}% APY</b>`;

            if (i === currentTierIndex) {
                li.classList.add('active-tier');
            }
        }
    } catch (error) {
        console.error('[APP] Error updating staking levels UI:', error);
    }
}

/**
 * Setup scroll animations
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

    // Observe all sections
    document.querySelectorAll('.staking-section, .stats-section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

/**
 * Global functions for HTML onclick handlers
 */
// Wallet functions
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.addTokenToWallet = addTokenToWallet;
window.addArubToMetaMask = () => addTokenToWallet('ARUB');
window.addUsdtToMetaMask = () => addTokenToWallet('USDT');
window.copyTokenAddress = () => copyToClipboard(CONFIG.TOKEN_ADDRESS, '✅ Адресу токена скопійовано!');

// Trading functions
window.buyTokens = buyTokens;
window.sellTokens = sellTokens;
window.setMaxBuy = setMaxBuy;
window.setMaxSell = setMaxSell;

// Staking functions
window.stakeUsdtTokens = stakeUsdtTokens;
window.stakeArubTokens = stakeArubTokens;
window.unstakeUsdtTokens = unstakeUsdtTokens;
window.unstakeArubTokens = unstakeArubTokens;
window.claimRewards = claimRewards;
window.setMaxStakeUsdt = setMaxStakeUsdt;
window.setMaxStakeArub = setMaxStakeArub;
window.setMaxUnstakeUsdt = setMaxUnstakeUsdt;
window.setMaxUnstakeArub = setMaxUnstakeArub;

// Faucet functions
window.claimFromFaucet = claimFromFaucet;

// Helper function for scroll to section
window.scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Log version info
console.log('[APP] Version: 2.0.0 (Modular Refactor)');
console.log('[APP] Build: ' + new Date().toISOString());

export { initApp };
