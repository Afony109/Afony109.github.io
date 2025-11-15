/**
 * Wallet Connection Module
 * Handles wallet connection, network switching, and EIP-6963 wallet detection
 */

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

    // Элементы меню кошелька
    const walletMenuToggle = document.getElementById('walletMenuToggle');
    const walletDisconnectBtn = document.getElementById('walletDisconnect');
    const walletViewOnExplorerBtn = document.getElementById('walletViewOnExplorer');

    // Кнопка-аватар открывает/закрывает меню
    if (walletMenuToggle) {
        walletMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWalletMenu();
        });
    }

    // Пункт "Відключити гаманець"
    if (walletDisconnectBtn) {
        walletDisconnectBtn.addEventListener('click', async () => {
            await disconnectWallet();
            closeWalletMenu();
        });
    }

    // Пункт "Відкрити в Etherscan"
    if (walletViewOnExplorerBtn) {
        walletViewOnExplorerBtn.addEventListener('click', () => {
            if (!userAddress) return;
            const url = getEtherscanLink(userAddress, 'address');
            window.open(url, '_blank');
            closeWalletMenu();
        });
    }

    // Закрывать меню по клику вне
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('walletMenu');
        const toggle = document.getElementById('walletMenuToggle');
        if (!menu || !toggle) return;

        if (!menu.contains(e.target) && !toggle.contains(e.target)) {
            menu.classList.remove('is-open');
        }
    });

    // Check if already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        console.log('[WALLET] Already connected:', window.ethereum.selectedAddress);
        connectWallet();
    }
}

/**
 * Handle EIP-6963 wallet announcements
 * @param {Event} event - Announcement event
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
 * Show wallet selector modal
 * @returns {Promise<Object>} Selected wallet provider
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

        // Add detected EIP-6963 wallets
        detectedWallets.forEach((wallet, index) => {
            const icon = wallet.info.icon || '🦊';

            // Debug logging
            console.log('[WALLET] Processing wallet:', wallet.info.name);
            console.log('[WALLET] Icon type:', typeof icon);
            console.log('[WALLET] Icon length:', icon?.length);
            console.log('[WALLET] Icon starts with:', icon?.substring(0, 30));

            const walletOption = document.createElement('div');
            walletOption.className = 'wallet-option';
            walletOption.dataset.walletIndex = index;

            const walletIconDiv = document.createElement('div');
            walletIconDiv.className = 'wallet-icon';

            // Check if icon is a valid data URL or http(s) URL
            // Support all data: URLs, not just data:image/
            const isImageUrl = typeof icon === 'string' && icon.length > 20 && (
                icon.startsWith('data:') ||
                icon.startsWith('http://') ||
                icon.startsWith('https://')
            );

            console.log('[WALLET]', wallet.info.name, '- isImageUrl:', isImageUrl);

            if (isImageUrl) {
                const img = document.createElement('img');
                img.src = icon;
                img.alt = wallet.info.name;

                // Fallback if image fails to load
                img.onerror = () => {
                    console.warn('[WALLET] Failed to load icon for', wallet.info.name);
                    walletIconDiv.innerHTML = '';
                    const span = document.createElement('span');
                    span.style.fontSize = '2em';
                    span.textContent = '🦊';
                    walletIconDiv.appendChild(span);
                };

                walletIconDiv.appendChild(img);
            } else {
                // If icon is emoji or other text
                const span = document.createElement('span');
                span.style.fontSize = '2em';
                span.textContent = icon;
                walletIconDiv.appendChild(span);
            }

            const walletName = document.createElement('div');
            walletName.className = 'wallet-name';

            // Безопасное/красивое имя
            let safeName = wallet.info.name || 'Wallet';

            // Обрезаем слишком длинные названия (например, с мусором или версиями)
            if (safeName.length > 30) {
                safeName = safeName.substring(0, 27) + '...';
            }

            walletName.textContent = safeName;

            walletOption.appendChild(walletIconDiv);
            walletOption.appendChild(walletName);
            modalContent.appendChild(walletOption);
        });

        // Fallback to window.ethereum if no wallets detected
        if (detectedWallets.length === 0 && window.ethereum) {
            const walletOption = document.createElement('div');
            walletOption.className = 'wallet-option';
            walletOption.dataset.walletType = 'ethereum';

            const walletIconDiv = document.createElement('div');
            walletIconDiv.className = 'wallet-icon';
            walletIconDiv.textContent = '🦊';

            const walletName = document.createElement('div');
            walletName.className = 'wallet-name';
            walletName.textContent = 'Browser Wallet (MetaMask)';

            walletOption.appendChild(walletIconDiv);
            walletOption.appendChild(walletName);
            modalContent.appendChild(walletOption);
        }

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary';
        cancelBtn.style.width = '100%';
        cancelBtn.style.marginTop = '20px';
        cancelBtn.textContent = 'Скасувати';
        cancelBtn.addEventListener('click', () => modal.remove());
        modalContent.appendChild(cancelBtn);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add click handlers
        modal.querySelectorAll('.wallet-option').forEach(option => {
            option.addEventListener('click', () => {
                const walletIndex = option.dataset.walletIndex;
                const walletType = option.dataset.walletType;

                let selectedProvider;

                if (walletIndex !== undefined) {
                    selectedProvider = detectedWallets[walletIndex].provider;
                } else if (walletType === 'ethereum') {
                    selectedProvider = window.ethereum;
                }

                modal.remove();
                resolve(selectedProvider);
            });
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(null);
            }
        });
    });
}

/**
 * Connect wallet and initialize contracts
 */
export async function connectWallet() {
    try {
        console.log('[WALLET] Starting connection process...');

        // Show wallet selector if no provider selected
        if (!selectedWalletProvider) {
            console.log('[WALLET] No provider selected, showing selector...');
            selectedWalletProvider = await showWalletSelector();

            if (!selectedWalletProvider) {
                console.log('[WALLET] No wallet selected');
                return;
            }
        }

        showNotification('🔄 Підключення гаманця...', 'info');

        // Request accounts
        const accounts = await selectedWalletProvider.request({
            method: 'eth_requestAccounts'
        });

        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts returned from wallet');
        }

        userAddress = accounts[0];
        console.log('[WALLET] Connected:', userAddress);

        // Create ethers provider and signer
        provider = new ethers.providers.Web3Provider(selectedWalletProvider);
        signer = provider.getSigner();

        // Check network
        const network = await provider.getNetwork();
        console.log('[WALLET] Current network:', network.chainId);

        if (network.chainId !== CONFIG.NETWORK.chainIdDecimal) {
            console.log('[WALLET] Wrong network, switching...');
            await switchToEthereum();
        }

        // Initialize contracts
        await initializeContracts(provider, signer, userAddress);

        // Update UI
        updateConnectedUI();

        // Setup account change listener
        selectedWalletProvider.on('accountsChanged', handleAccountsChanged);

        // Setup network change listener
        selectedWalletProvider.on('chainChanged', handleChainChanged);

        showNotification('✅ Гаманець підключено!', 'success');

        // Export global variables for other modules
        window.userAddress = userAddress;
        window.provider = provider;
        window.signer = signer;

    } catch (error) {
        console.error('[WALLET] Connection error:', error);

        let errorMsg = 'Помилка підключення гаманця';

        if (error.code === 4001) {
            errorMsg = 'Підключення відхилено користувачем';
        } else if (error.code === -32002) {
            errorMsg = 'Запит на підключення вже відкрито в гаманці';
        } else if (error.message) {
            errorMsg = error.message;
        }

        showNotification(`❌ ${errorMsg}`, 'error');
    }
}

/**
 * Switch to Sepolia network
 */
export async function switchToEthereum() {
    try {
        console.log('[WALLET] Switching to Sepolia...');

        await selectedWalletProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFIG.NETWORK.chainId }],
        });

        console.log('[WALLET] ✅ Switched to Sepolia');
        showNotification('✅ Мережу змінено на Sepolia', 'success');

    } catch (error) {
        console.error('[WALLET] Switch network error:', error);

        // If network doesn't exist, try to add it
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

                showNotification('✅ Мережу Sepolia додано та активовано', 'success');
            } catch (addError) {
                console.error('[WALLET] Add network error:', addError);
                throw new Error('Не вдалося додати мережу Sepolia');
            }
        } else {
            throw error;
        }
    }
}

/**
 * Handle account changes
 * @param {Array} accounts - New accounts array
 */
function handleAccountsChanged(accounts) {
    console.log('[WALLET] Accounts changed:', accounts);

    if (accounts.length === 0) {
        // User disconnected wallet
        console.log('[WALLET] User disconnected');
        showNotification('⚠️ Гаманець відключено', 'error');
        resetWalletState();
    } else if (accounts[0] !== userAddress) {
        // User switched accounts
        console.log('[WALLET] Account switched from', userAddress, 'to', accounts[0]);
        showNotification('🔄 Акаунт змінено, перезавантаження...', 'info');

        // Reconnect with new account
        selectedWalletProvider = null;
        connectWallet();
    }
}

/**
 * Handle network/chain changes
 * @param {string} chainId - New chain ID
 */
function handleChainChanged(chainId) {
    console.log('[WALLET] Chain changed to:', chainId);
    showNotification('🔄 Мережу змінено, перезавантаження...', 'info');

    // Reload page to reinitialize with new network
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

/**
 * Toggle wallet menu visibility
 */
function toggleWalletMenu() {
    const menu = document.getElementById('walletMenu');
    if (menu) {
        menu.classList.toggle('is-open');
    }
}

/**
 * Close wallet menu
 */
function closeWalletMenu() {
    const menu = document.getElementById('walletMenu');
    if (menu) {
        menu.classList.remove('is-open');
    }
}

/**
 * Update UI to show connected state
 */
function updateConnectedUI() {
    const connectBtn = document.getElementById('connectBtn');
    const walletMenuToggle = document.getElementById('walletMenuToggle');
    const walletMenuAddress = document.getElementById('walletMenuAddress');

    if (connectBtn && userAddress) {
        connectBtn.textContent = shortenAddress(userAddress);
        connectBtn.style.background = 'linear-gradient(45deg, #10b981, #00ff7f)';
    }

    if (walletMenuToggle) {
        walletMenuToggle.hidden = false; // показать аватар
    }

    if (walletMenuAddress && userAddress) {
        walletMenuAddress.textContent = shortenAddress(userAddress);
    }
}

/**
 * Manually disconnect wallet from dApp
 */
export async function disconnectWallet() {
    console.log('[WALLET] Manual disconnect requested');

    try {
        if (selectedWalletProvider && selectedWalletProvider.removeListener) {
            selectedWalletProvider.removeListener('accountsChanged', handleAccountsChanged);
            selectedWalletProvider.removeListener('chainChanged', handleChainChanged);
        }
    } catch (err) {
        console.warn('[WALLET] Error removing listeners on disconnect:', err);
    }

    resetWalletState();
    showNotification('⚠️ Гаманець відключено', 'info');
}

/**
 * Reset wallet state on disconnect
 */
function resetWalletState() {
    const walletMenuToggle = document.getElementById('walletMenuToggle');
    const walletMenuAddress = document.getElementById('walletMenuAddress');
    const walletMenu = document.getElementById('walletMenu');

    if (walletMenuToggle) {
        walletMenuToggle.hidden = true;
    }
    if (walletMenuAddress) {
        walletMenuAddress.textContent = '—';
    }
    if (walletMenu) {
        walletMenu.classList.remove('is-open');
    }

    userAddress = null;
    provider = null;
    signer = null;
    selectedWalletProvider = null;

    window.userAddress = null;
    window.provider = null;
    window.signer = null;

    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.textContent = 'Підключити гаманець';
        connectBtn.style.background = '';
    }

    // Reset UI to disconnected state
    const tradingInterface = document.getElementById('tradingInterface');
    if (tradingInterface) {
        tradingInterface.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--gray);">
                <div style="font-size: 3em; margin-bottom: 20px;">🔒</div>
                <p style="font-size: 1.3em;">Підключіть гаманець для торгівлі токенами</p>
            </div>
        `;
    }

    const stakingInterface = document.getElementById('stakingInterface');
    if (stakingInterface) {
        stakingInterface.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--gray);">
                <div style="font-size: 3em; margin-bottom: 20px;">🔒</div>
                <p style="font-size: 1.3em;">Підключіть гаманець для стейкінгу</p>
            </div>
        `;
    }

    const faucetInterface = document.getElementById('faucetInterface');
    if (faucetInterface) {
        faucetInterface.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--gray);">
                <div style="font-size: 3em; margin-bottom: 20px;">🔒</div>
                <p style="font-size: 1.3em;">Підключіть гаманець для отримання тестових USDT</p>
            </div>
        `;
    }
}

/**
 * Get current wallet state
 * @returns {Object} { userAddress, provider, signer, isConnected }
 */
export function getWalletState() {
    return {
        userAddress,
        provider,
        signer,
        selectedWalletProvider,
        isConnected: !!userAddress
    };
}

/**
 * Add token to wallet (MetaMask, Trust Wallet, etc.)
 * @param {string} tokenType - 'ARUB' or 'USDT'
 */
export async function addTokenToWallet(tokenType) {
    try {
        let walletProvider = selectedWalletProvider;

        // If not connected, show wallet selector
        if (!walletProvider) {
            console.log('[WALLET] Not connected, showing selector...');
            window.dispatchEvent(new Event('eip6963:requestProvider'));
            await new Promise(resolve => setTimeout(resolve, 500));

            walletProvider = await showWalletSelector();

            if (!walletProvider) {
                console.log('[WALLET] Wallet selection cancelled');
                return;
            }

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

        console.log(`[WALLET] Adding ${tokenType} to wallet...`);

        const wasAdded = await walletProvider.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: tokenConfig
            }
        });

        if (wasAdded) {
            showNotification(`✅ ${tokenType} успішно додано до гаманця!`, 'success');
        } else {
            showNotification('⚠️ Додавання токену відхилено', 'warning');
        }

    } catch (error) {
        console.error(`[WALLET] Error adding ${tokenType}:`, error);
        showNotification(`❌ Помилка додавання ${tokenType}: ${error.message}`, 'error');
    }
}

// Export for global access
export { selectedWalletProvider, userAddress, provider, signer };
