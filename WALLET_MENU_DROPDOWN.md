# ✅ Додано виїжджаюче меню гаманця з аватаром

## 🎯 Що додано

Після підключення гаманця з'являється круглий аватар 🧑‍💻 біля кнопки з адресою. При кліку на аватар відкривається випадаюче меню з діями:

- 📍 **Адреса гаманця** (скорочена)
- 🔗 **Відкрити в Etherscan** - перегляд адреси в блокчейн-експлорері
- 🚪 **Відключити гаманець** (червона кнопка) - відключення без перезавантаження сторінки

---

## 📋 Зміни

### 1. HTML (index-new.html)

**Було:**
```html
<div class="nav-right">
    <div class="lang-switcher">
        <button class="lang-btn active">🇺🇦 UA</button>
        <button class="lang-btn">🇬🇧 EN</button>
    </div>
    <button class="connect-btn" id="connectBtn">Підключити гаманець</button>
</div>
```

**Стало:**
```html
<div class="nav-right">
    <div class="lang-switcher">
        <button class="lang-btn active">🇺🇦 UA</button>
        <button class="lang-btn">🇬🇧 EN</button>
    </div>

    <!-- Wallet button + avatar dropdown -->
    <div class="wallet-dropdown">
        <button class="connect-btn" id="connectBtn">Підключити гаманець</button>

        <!-- Кнопка-аватар, показывается только когда кошелёк подключён -->
        <button
            class="wallet-avatar-btn"
            id="walletMenuToggle"
            aria-label="Меню гаманця"
            hidden
        >
            🧑‍💻
        </button>

        <!-- Выпадающее меню -->
        <div class="wallet-menu" id="walletMenu">
            <div class="wallet-menu-address" id="walletMenuAddress">—</div>
            <button class="wallet-menu-item" id="walletViewOnExplorer">
                🔗 Відкрити в Etherscan
            </button>
            <button class="wallet-menu-item wallet-menu-item-danger" id="walletDisconnect">
                🚪 Відключити гаманець
            </button>
        </div>
    </div>
</div>
```

### 2. CSS (css/components.css)

Додано нові стилі після блоку `.wallet-icon`:

```css
/* ===== Wallet dropdown near address ===== */
.wallet-dropdown {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Кнопка-аватар */
.wallet-avatar-btn {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: radial-gradient(circle at top, var(--ukraine-blue), #111827);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.1em;
    padding: 0;
    outline: none;
    transition: var(--transition-fast);
}

.wallet-avatar-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0, 87, 183, 0.5);
}

/* Меню по умолчанию скрыто */
.wallet-menu {
    position: absolute;
    right: 0;
    top: 120%;
    min-width: 220px;
    padding: 10px;
    background: rgba(0,0,0,0.95);
    border-radius: 14px;
    border: 1px solid rgba(0,87,183,0.6);
    box-shadow: 0 16px 40px rgba(0,0,0,0.85);
    display: flex;
    flex-direction: column;
    gap: 6px;
    opacity: 0;
    transform: translateY(6px);
    pointer-events: none;
    transition: opacity var(--transition-fast), transform var(--transition-fast);
    z-index: 2000;
}

/* Когда открыто */
.wallet-menu.is-open {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

/* Адрес в меню */
.wallet-menu-address {
    font-size: 0.9em;
    color: var(--gray);
    padding: 4px 6px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.12);
    word-break: break-all;
}

/* Пункты меню */
.wallet-menu-item {
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: #fff;
    font-size: 0.95em;
    padding: 8px 6px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    gap: 6px;
    align-items: center;
    transition: var(--transition-fast);
}

.wallet-menu-item:hover {
    background: rgba(0,87,183,0.4);
}

.wallet-menu-item-danger {
    color: #f97373;
}

.wallet-menu-item-danger:hover {
    background: rgba(239, 68, 68, 0.25);
}
```

### 3. JavaScript (js/wallet.js)

#### 3.1. Імпорт getEtherscanLink

```javascript
import { CONFIG, shortenAddress, getEtherscanLink } from './config.js';
```

#### 3.2. Функції управління меню

Додано перед `updateConnectedUI()`:

```javascript
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
```

#### 3.3. Оновлено updateConnectedUI()

```javascript
function updateConnectedUI() {
    const connectBtn = document.getElementById('connectBtn');
    const walletMenuToggle = document.getElementById('walletMenuToggle');
    const walletMenuAddress = document.getElementById('walletMenuAddress');

    if (connectBtn && userAddress) {
        connectBtn.textContent = shortenAddress(userAddress);
        connectBtn.style.background = 'linear-gradient(45deg, #10b981, #00ff7f)';
    }

    if (walletMenuToggle) {
        walletMenuToggle.hidden = false; // показати аватар
    }

    if (walletMenuAddress && userAddress) {
        walletMenuAddress.textContent = shortenAddress(userAddress);
    }
}
```

#### 3.4. Додано disconnectWallet()

Додано перед `resetWalletState()`:

```javascript
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
```

#### 3.5. Оновлено resetWalletState()

На початку функції додано:

```javascript
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

    // ... решта коду
}
```

#### 3.6. Розширено initWalletModule()

Після блоку підключення кнопки додано:

```javascript
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
```

---

## 🎨 Візуальний дизайн

### До підключення:
```
[🇺🇦 UA] [🇬🇧 EN] [Підключити гаманець]
```

### Після підключення:
```
[🇺🇦 UA] [🇬🇧 EN] [0x1234...AB56] [🧑‍💻]
                                      ↓ (клік)
                              ┌──────────────────┐
                              │ 0x1234...AB56    │
                              ├──────────────────┤
                              │ 🔗 Відкрити в... │
                              │ 🚪 Відключити... │
                              └──────────────────┘
```

### Особливості дизайну:

**Аватар:**
- Круглий 38x38px
- Градієнт синій → темно-сірий
- Hover: підняття + тінь
- Hidden за замовчуванням

**Меню:**
- Прозоре чорне тло (95% непрозорість)
- Округлі кути 14px
- Синя рамка з тінню
- Анімація появи (opacity + transform)
- Z-index: 2000 (над іншими елементами)

**Пункти меню:**
- Hover: синє підсвічування
- "Відключити" червоний з червоним hover
- Плавні переходи

---

## 🔄 Поведінка

### 1. Відкриття меню:
- Клік по аватару → `toggleWalletMenu()`
- Додає клас `.is-open` → opacity: 1, transform: 0

### 2. Закриття меню:
- Клік поза меню → `closeWalletMenu()`
- Клік на пункт меню → автоматично закривається
- Прибирає клас `.is-open` → opacity: 0, pointer-events: none

### 3. Відкриття в Etherscan:
- Формує URL: `https://sepolia.etherscan.io/address/0x...`
- Відкриває в новій вкладці
- Закриває меню

### 4. Відключення:
- Викликає `disconnectWallet()`
- Видаляє listeners для `accountsChanged`, `chainChanged`
- Викликає `resetWalletState()`:
  - Очищає змінні (userAddress, provider, signer)
  - Ховає аватар (hidden = true)
  - Закриває меню
  - Повертає кнопку "Підключити гаманець"
  - Очищає UI (trading, staking, faucet інтерфейси)
- Показує notification "Гаманець відключено"

---

## 📁 Змінені файли

1. ✅ `index-new.html` - додано HTML структуру меню
2. ✅ `css/components.css` - додано стилі
3. ✅ `js/wallet.js` - додано логіку меню та disconnectWallet()

---

## 🧪 Тестування

### 1. Перезавантаж сторінку
```bash
Ctrl+F5
```

### 2. Підключи гаманець
- Натисни "Підключити гаманець"
- Вибери гаманець
- Підтверди підключення

### 3. Перевір аватар
- ✅ З'явився аватар 🧑‍💻
- ✅ Кнопка стала зеленою з адресою

### 4. Відкрий меню
- Клікни по аватару
- ✅ Меню з'являється з анімацією
- ✅ Показана скорочена адреса

### 5. Відкрий Etherscan
- Клікни "🔗 Відкрити в Etherscan"
- ✅ Відкрилась нова вкладка з Sepolia Etherscan
- ✅ Меню закрилось

### 6. Відключи гаманець
- Відкрий меню знову
- Клікни "🚪 Відключити гаманець"
- ✅ Показано notification "Гаманець відключено"
- ✅ Аватар зник
- ✅ Кнопка повернулась до "Підключити гаманець"
- ✅ UI повернувся до стану "Підключіть гаманець"

### 7. Закриття по клікуобраза меню
- Підключи гаманець знову
- Відкрий меню
- Клікни поза меню
- ✅ Меню закрилось

---

## ⚙️ Технічні деталі

### Event Listeners

**initWalletModule():**
```javascript
// 1. Click на аватар
walletMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation(); // Не спрацьовує закриття меню
    toggleWalletMenu();
});

// 2. Click на "Відключити"
walletDisconnectBtn.addEventListener('click', async () => {
    await disconnectWallet();
    closeWalletMenu();
});

// 3. Click на "Etherscan"
walletViewOnExplorerBtn.addEventListener('click', () => {
    const url = getEtherscanLink(userAddress, 'address');
    window.open(url, '_blank');
    closeWalletMenu();
});

// 4. Click поза меню (на document)
document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove('is-open');
    }
});
```

### Відключення listeners при disconnect

```javascript
if (selectedWalletProvider && selectedWalletProvider.removeListener) {
    selectedWalletProvider.removeListener('accountsChanged', handleAccountsChanged);
    selectedWalletProvider.removeListener('chainChanged', handleChainChanged);
}
```

Це важливо щоб уникнути витоків пам'яті та неочікуваної поведінки після відключення.

---

## 🎯 Переваги

### 1. **UX покращення** ✅
- Швидкий доступ до адреси
- Відключення без перезавантаження
- Зручний перегляд в Etherscan

### 2. **Чистий код** ✅
- Модульна структура
- Event delegation
- Cleanup listeners

### 3. **Accessibility** ✅
- `aria-label` на кнопці аватара
- Keyboard navigation підтримується (клавіша Tab)
- Логічний порядок фокусування

### 4. **Анімації** ✅
- Плавне відкриття/закриття
- Hover ефекти
- Професійний вигляд

### 5. **Адаптивність** ✅
- Працює на всіх розмірах екрану
- Menu позиціонується right: 0 (завжди в межах екрану)

---

## 🐛 Можливі проблеми та рішення

### Меню не закривається
**Причина:** Event listener на document не спрацьовує
**Рішення:** Перевір чи `e.stopPropagation()` викликається тільки на аватарі

### Аватар не з'являється
**Причина:** `hidden` атрибут не знімається
**Рішення:** Перевір чи `walletMenuToggle.hidden = false` викликається в `updateConnectedUI()`

### Меню "стрибає"
**Причина:** Змінюється висота контенту
**Рішення:** Додай `min-height` або фіксовану висоту пунктам меню

---

🇺🇦 **Slava Ukraini! Меню гаманця готове!**

*Додано: 2025-11-15*
*Версія: 2.2.0*
