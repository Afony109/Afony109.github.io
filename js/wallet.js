/**
 * Wallet Connection Module
 * Handles wallet connection, network switching, and EIP-6963 wallet detection
 * Исправлено: теперь на Android/iOS всегда показывается список кошельков
 */

import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

import { CONFIG, shortenAddress, getEtherscanLink } from './config.js';
import { showNotification } from './ui.js';
import { initializeContracts } from './contracts.js';

// Global state
let selectedWalletProvider = null;
let userAddress = null;
let provider = null;
let signer = null;
const detectedWallets = [];

/**
 * Initialize wallet detection and listeners
 */
export function initWalletModule() {
    console.log('[WALLET] Initializing wallet module...');

    // Listen for EIP-6963 wallet announcements
    window.addEventListener('eip6963:announceProvider', handleWalletAnnouncement);

    // Request wallet providers
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Setup connect button listener
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }

    // Check if already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        console.log('[WALLET] Already connected:', window.ethereum.selectedAddress);
        connectWallet();
    }
}

/**
 * Handle EIP-6963 wallet announcements
 */
function handleWalletAnnouncement(event) {
    const { info, provider } = event.detail;
    console.log('[WALLET] Detected wallet:', info.name);

    detectedWallets.push({
        info,
        provider
    });
}

/**
 * ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ФУНКЦИЯ — теперь работает на Android!
 */
export async function showWalletSelector() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'wallet-modal';
        modal.id = 'walletSelectorModal';

        const modalContent = document.createElement('div');
        modalContent.className = 'wallet-modal-content';

        const title = document.createElement('h2');
        title.className = 'wallet-modal-title';
        title.textContent = 'Виберіть гаманець';
        modalContent.appendChild(title);

        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

        let hasOptions = false;

        // 1. Добавляем все кошельки, найденные через EIP-6963
        detectedWallets.forEach((wallet, index) => {
            hasOptions = true;
            const walletOption = createWalletOption(wallet.info, index);
            modalContent.appendChild(walletOption);
        });

        // 2. Fallback: если ничего не найдено — показываем популярные кошельки
        if (!hasOptions) {
            const mobileWallets = [
                { name: 'MetaMask', icon: 'https://metamask.io/images/favicon-32.png', deeplink: 'metamask://' },
                { name: 'Trust Wallet', icon: 'https://trustwallet.com/assets/images/favicon.png', deeplink: 'trust://' },
                { name: 'Coinbase Wallet', icon: 'https://wallet.coinbase.com/assets/favicon.ico', deeplink: 'cbwallet://' },
                { name: 'Rainbow', icon: 'https://rainbow.me/icon.png', deeplink: 'rainbow://' },
                { name: 'SafePal', icon: 'https://safepal.io/favicon.ico', deeplink: 'safepal://' },
                { name: 'Zerion', icon: 'https://zerion.io/favicon.ico', deeplink: 'zerion://' }
            ];

            const desktopWallets = [
                { name: 'MetaMask', icon: 'https://metamask.io/images/favicon-32.png', provider: window.ethereum },
                { name: 'Coinbase Wallet', icon: 'https://wallet.coinbase.com/assets/favicon.ico' },
                { name: 'Trust Wallet', icon: 'https://trustwallet.com/assets/images/favicon.png' }
            ];

            const walletsToShow = isMobile ? mobileWallets : desktopWallets;

            walletsToShow.forEach((w) => {
                hasOptions = true;
                const option = document.createElement('div');
                option.className = 'wallet-option';

                const iconDiv = document.createElement('div');
                iconDiv.className = 'wallet-icon';

                const img = document.createElement('img');
                img.src = w.icon;
                img.alt = w.name;
                img.style.width = '40px';
                img.style.height = '40px';
                img.onerror = () => {
                    iconDiv.textContent = 'WALLET';
                    iconDiv.style.fontSize = '1.2em';
                };
                iconDiv.appendChild(img);

                const nameDiv = document.createElement('div');
                nameDiv.className = 'wallet-name';
                nameDiv.textContent = w.name;

                option.appendChild(iconDiv);
                option.appendChild(nameDiv);
                modalContent.appendChild(option);

                // Обработчик клика
                option.addEventListener('click', () => {
                    if (isMobile && w.deeplink) {
                        // Пробуем открыть приложение
                        const url = w.deeplink + (w.deeplink.includes('?') ? '&' : '?') + 'url=' + encodeURIComponent(window.location.href);
                        window.location.href = url;

                        // Если через 2 сек. браузер всё ещё открыт — показываем подсказку
                        setTimeout(() => {
                            if (document.hasFocus()) {
                                showNotification(`Відкрийте сайт у додатку ${w.name}`, 'info');
                            }
                        }, 2000);

                        modal.remove();
                        resolve(null);
                    } else if (w.provider) {
                        modal.remove();
                        resolve(w.provider);
                    }
                });
            });
        }

        // Если вообще ничего не нашлось (крайне редко)
        if (!hasOptions) {
            const noWallet = document.createElement('div');
            noWallet.style.textAlign = 'center';
            noWallet.style.padding = '20px';
            noWallet.style.color = '#aaa';
            noWallet.innerHTML = 'Кошельки не найдены<br><small>Установите MetaMask или Trust Wallet</small>';
            modalContent.appendChild(noWallet);
        }

        // Кнопка "Скасувати"
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = 'Скасувати';
        cancelBtn.style.width = '100%';
        cancelBtn.style.marginTop = '20px';
        cancelBtn.onclick = () => {
            modal.remove();
            resolve(null);
        };
        modalContent.appendChild(cancelBtn);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Общий обработчик для EIP-6963 кошельков
        modalContent.addEventListener('click', (e) => {
            const option = e.target.closest('.wallet-option');
            if (!option) return;
            if (e.target.closest('button')) return;

            const index = option.dataset.walletIndex;
            if (index !== undefined) {
                modal.remove();
                resolve(detectedWallets[index].provider);
            }
        });

        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(null);
            }
        });
    });
}

// Вспомогательная функция для создания опции кошелька (EIP-6963)
function createWalletOption(info, index) {
    const walletOption = document.createElement('div');
    walletOption.className = 'wallet-option';
    walletOption.dataset.walletIndex = index;

    const walletIconDiv = document.createElement('div');
    walletIconDiv.className = 'wallet-icon';

    const iconStr = String(info.icon || 'WALLET').trim();
    const isImageUrl = iconStr.startsWith('data:') || iconStr.startsWith('http://') || iconStr.startsWith('https://');

    if (isImageUrl) {
        const img = document.createElement('img');
        img.src = iconStr;
        img.alt = info.name || 'Wallet';
        img.onerror = () => {
            walletIconDiv.innerHTML = '';
            walletIconDiv.textContent = 'WALLET';
        };
        walletIconDiv.appendChild(img);
    } else {
        walletIconDiv.textContent = iconStr || 'WALLET';
        walletIconDiv.style.fontSize = '2em';
    }

    const walletName = document.createElement('div');
    walletName.className = 'wallet-name';
    let safeName = info.name || 'Unknown Wallet';
    if (safeName.length > 30) safeName = safeName.substring(0, 27) + '...';
    walletName.textContent = safeName;

    walletOption.appendChild(walletIconDiv);
    walletOption.appendChild(walletName);

    return walletOption;
}

/**
 * Connect wallet and initialize contracts
 */
export async function connectWallet() {
    try {
        console.log('[WALLET] Starting connection process...');

        if (!selectedWalletProvider) {
            console.log('[WALLET] No provider selected, showing selector...');
            selectedWalletProvider = await showWalletSelector();

            if (!selectedWalletProvider) {
                console.log('[WALLET] No wallet selected');
                return;
            }
        }

        showNotification('Підключення гаманця...', 'info');

        const accounts = await selectedWalletProvider.request({
            method: 'eth_requestAccounts'
        });

        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts returned from wallet');
        }

        userAddress = accounts[0];
        console.log('[WALLET] Connected:', userAddress);

        provider = new ethers.providers.Web3Provider(selectedWalletProvider);
        signer = provider.getSigner();

        const network = await provider.getNetwork();
        console.log('[WALLET] Current network:', network.chainId);

        if (network.chainId !== CONFIG.NETWORK.chainIdDecimal) {
            console.log('[WALLET] Wrong network, switching...');
            await switchToEthereum();
        }

        await initializeContracts(provider, signer, userAddress);
        updateConnectedUI();

        selectedWalletProvider.on('accountsChanged', handleAccountsChanged);
        selectedWalletProvider.on('chainChanged', handleChainChanged);

        showNotification('Гаманець підключено!', 'success');

        window.userAddress = userAddress;
        window.provider = provider;
        window.signer = signer;

    } catch (error) {
        console.error('[WALLET] Connection error:', error);

        let errorMsg = 'Помилка підключення гаманця';
        if (error.code === 4001) errorMsg = 'Підключення відхилено користувачем';
        else if (error.code === -32002) errorMsg = 'Запит вже відкрито в гаманці';
        else if (error.message) errorMsg = error.message;

        showNotification(`Помилка: ${errorMsg}`, 'error');
    }
}

/**
 * Switch to Sepolia network
 */
export async function switchToEthereum() {
    try {
        await selectedWalletProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFIG.NETWORK.chainId }],
        });
        showNotification('Мережу змінено на Sepolia', 'success');
    } catch (error) {
        if (error.code === 4902) {
            try {
                await selectedWalletProvider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: CONFIG.NETWORK.chainId,
                        chainName: CONFIG.NETWORK.name,
                        nativeCurrency: CONFIG.NETWORK.nativeCurrency,
                        rpcUrls: CONFIG.NETWORK.rpcUrls,
                        blockExplorerUrls: [CONFIG.NETWORK.blockExplorer]
                    }]
                });
                showNotification('Мережу Sepolia додано та активовано', 'success');
            } catch (addError) {
                throw new Error('Не вдалося додати мережу Sepolia');
            }
        } else {
            throw error;
        }
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        showNotification('Гаманець відключено', 'error');
        resetWalletState();
    } else if (accounts[0] !== userAddress) {
        showNotification('Акаунт змінено, перезавантаження...', 'info');
        selectedWalletProvider = null;
        connectWallet();
    }
}

function handleChainChanged(chainId) {
    showNotification('Мережу змінено, перезавантаження...', 'info');
    setTimeout(() => window.location.reload(), 1000);
}

function updateConnectedUI() {
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn && userAddress) {
        connectBtn.textContent = shortenAddress(userAddress);
    }
    if (window.onWalletConnected && userAddress) {
        window.onWalletConnected(userAddress);
    }
}

export async function disconnectWallet() {
    try {
        if (selectedWalletProvider && selectedWalletProvider.removeListener) {
            selectedWalletProvider.removeListener('accountsChanged', handleAccountsChanged);
            selectedWalletProvider.removeListener('chainChanged', handleChainChanged);
        }
    } catch (err) { console.warn(err); }

    resetWalletState();
    showNotification('Гаманець відключено', 'info');
}

function resetWalletState() {
    userAddress = null;
    provider = null;
    signer = null;
    selectedWalletProvider = null;

    window.userAddress = null;
    window.provider = null;
    window.signer = null;

    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) connectBtn.textContent = 'Підключити гаманець';

    if (window.onWalletDisconnected) window.onWalletDisconnected();

    // Сброс интерфейсов
    ['tradingInterface', 'stakingInterface', 'faucetInterface'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `<div style="text-align:center;padding:60px;color:var(--gray)">
                <div style="font-size:3em;margin-bottom:20px">Locked</div>
                <p style="font-size:1.3em">Підключіть гаманець</p>
            </div>`;
        }
    });
}

export function getWalletState() {
    return { userAddress, provider, signer, selectedWalletProvider, isConnected: !!userAddress };
}

export async function addTokenToWallet(tokenType) {
    try {
        let walletProvider = selectedWalletProvider;
        if (!walletProvider) {
            walletProvider = await showWalletSelector();
            if (!walletProvider) return;
            selectedWalletProvider = walletProvider;
        }

        const tokenConfig = tokenType === 'ARUB' ? {
            address: CONFIG.TOKEN_ADDRESS,
            symbol: 'ARUB',
            decimals: CONFIG.DECIMALS.ARUB,
            image: 'https://raw.githubusercontent.com/afony109/antirub-staking/main/arub-logo.png'
        } : {
            address: CONFIG.USDT_ADDRESS,
            symbol: 'USDT',
            decimals: CONFIG.DECIMALS.USDT,
            image: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
        };

        const wasAdded = await walletProvider.request({
            method: 'wallet_watchAsset',
            params: { type: 'ERC20', options: tokenConfig }
        });

        showNotification(wasAdded ? `${tokenType} додано до гаманця!` : 'Додавання відхилено', wasAdded ? 'success' : 'warning');
    } catch (error) {
        console.error(error);
        showNotification(`Помилка додавання ${tokenType}`, 'error');
    }
}

export { selectedWalletProvider, userAddress, provider, signer };
