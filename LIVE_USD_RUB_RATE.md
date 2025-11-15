# ✅ API для курсу USD/RUB в реальному часі

## 🎯 Що додано

Ціна ARUB тепер оновлюється автоматично з **актуального курсу USD/RUB** через безкоштовне API.

---

## 📡 Як це працює

### 1. **Live API Integration**

**API:** `https://api.exchangerate-api.com/v4/latest/USD`
- ✅ Безкоштовний
- ✅ Не потребує API ключа
- ✅ Оновлюється щохвилини
- ✅ Підтримує всі основні валюти

**Приклад відповіді:**
```json
{
  "base": "USD",
  "date": "2025-11-15",
  "rates": {
    "RUB": 80.75,
    "EUR": 0.85,
    "GBP": 0.73
    ...
  }
}
```

### 2. **Кешування**

Щоб не перевантажувати API, курс кешується на **5 хвилин**:

```javascript
// Cache variables
let cachedUsdRubRate = null;
let lastRateFetchTime = 0;
const RATE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check cache before fetching
if (cachedUsdRubRate && (now - lastRateFetchTime) < RATE_CACHE_DURATION) {
    return cachedUsdRubRate;
}
```

**Логіка:**
- Перший запит → отримати з API, закешувати
- Наступні запити (протягом 5 хв) → використати кеш
- Після 5 хв → новий запит до API

### 3. **Fallback на помилки**

Якщо API недоступне або повертає помилку:

```javascript
export async function getArubPrice() {
    // Try live API
    const liveRate = await fetchUsdRubRate();

    if (liveRate) {
        return liveRate; // ✅ Live rate from API
    }

    // Fallback to static value
    return CONFIG.FALLBACK.ARUB_PRICE_USDT; // ⚠️ Static 81.22
}
```

**Fallback значення:** 81.22 USDT (з `config.js`)

---

## 🔄 Послідовність отримання ціни

```
┌─────────────────────────────────┐
│  getArubPrice() викликається    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Перевірка кешу (5 хв)          │
└────────────┬────────────────────┘
             │
        ┌────┴────┐
        │         │
     [Є кеш]  [Немає кешу]
        │         │
        ▼         ▼
   [Повернути] ┌─────────────────┐
   [з кешу]    │ Запит до API    │
               └────────┬────────┘
                        │
                   ┌────┴────┐
                   │         │
              [Успішно] [Помилка]
                   │         │
                   ▼         ▼
           ┌──────────┐ ┌─────────┐
           │ Курс API │ │ Fallback│
           │ (80-81)  │ │ (81.22) │
           └──────────┘ └─────────┘
```

---

## 📊 Логи в консолі

### Перше завантаження (запит до API):
```
[CONTRACTS] Fetching live USD/RUB exchange rate...
[CONTRACTS] ✅ Live USD/RUB rate fetched: 80.75
[APP] 🪙 ARUB Price: 80.75 USDT
```

### Наступні оновлення (кеш):
```
[CONTRACTS] Using cached USD/RUB rate: 80.75
[APP] 🪙 ARUB Price: 80.75 USDT
```

### При помилці API:
```
[CONTRACTS] Fetching live USD/RUB exchange rate...
[CONTRACTS] ⚠️ Failed to fetch USD/RUB rate: API responded with status 500
[CONTRACTS] Using fallback USD/RUB rate: 81.22
[APP] 🪙 ARUB Price: 81.22 USDT
```

---

## 🛠️ Технічна реалізація

### Файл: `js/contracts.js`

**1. Кеш змінні (рядки 61-64):**
```javascript
let cachedUsdRubRate = null;
let lastRateFetchTime = 0;
const RATE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

**2. Функція отримання курсу (рядки 286-326):**
```javascript
async function fetchUsdRubRate() {
    // Check cache first
    const now = Date.now();
    if (cachedUsdRubRate && (now - lastRateFetchTime) < RATE_CACHE_DURATION) {
        console.log('[CONTRACTS] Using cached USD/RUB rate:', cachedUsdRubRate);
        return cachedUsdRubRate;
    }

    try {
        console.log('[CONTRACTS] Fetching live USD/RUB exchange rate...');

        // Use exchangerate-api.com (free, no API key required)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        const rate = data.rates.RUB;

        if (!rate || typeof rate !== 'number') {
            throw new Error('Invalid rate data received');
        }

        // Cache the rate
        cachedUsdRubRate = rate;
        lastRateFetchTime = now;

        console.log('[CONTRACTS] ✅ Live USD/RUB rate fetched:', rate);
        return rate;

    } catch (error) {
        console.warn('[CONTRACTS] ⚠️ Failed to fetch USD/RUB rate:', error.message);
        return null;
    }
}
```

**3. Оновлена getArubPrice() (рядки 328-346):**
```javascript
export async function getArubPrice() {
    // ARUB прив'язаний до USD/RUB курсу
    // 1 ARUB = USD/RUB rate (наприклад ~81 USDT при курсі 81 RUB за 1 USD)

    // Try to get live rate from API
    const liveRate = await fetchUsdRubRate();

    if (liveRate) {
        return liveRate;
    }

    // Fallback to static value if API fails
    console.warn('[CONTRACTS] Using fallback USD/RUB rate:', CONFIG.FALLBACK.ARUB_PRICE_USDT);
    return CONFIG.FALLBACK.ARUB_PRICE_USDT;
}
```

---

## ⚡ Переваги

### 1. **Актуальність** ✅
- Курс оновлюється кожні 5 хвилин
- Дані з реального ринку
- Немає ручних оновлень

### 2. **Продуктивність** ✅
- Кешування зменшує навантаження
- Тільки 1 API запит на 5 хвилин
- Швидка відповідь з кешу

### 3. **Надійність** ✅
- Fallback при помилках API
- Не блокує роботу сайту
- Завжди показує ціну (live або fallback)

### 4. **Безкоштовно** ✅
- Не потребує API ключа
- Без обмежень запитів (для розумного використання)
- Можна замінити на інше API якщо потрібно

---

## 🔄 Частота оновлення

### На сайті:
- **Глобальна статистика:** кожні 30 секунд (`updateGlobalStats()`)
- **API курс:** кешується на 5 хвилин
- **Результат:** курс оновлюється кожні 5 хв, але статистика показує його кожні 30 сек

### Timeline:
```
0:00  → API запит (80.75)    ✅ Live
0:30  → updateGlobalStats()  ✅ Cached (80.75)
1:00  → updateGlobalStats()  ✅ Cached (80.75)
1:30  → updateGlobalStats()  ✅ Cached (80.75)
2:00  → updateGlobalStats()  ✅ Cached (80.75)
2:30  → updateGlobalStats()  ✅ Cached (80.75)
3:00  → updateGlobalStats()  ✅ Cached (80.75)
3:30  → updateGlobalStats()  ✅ Cached (80.75)
4:00  → updateGlobalStats()  ✅ Cached (80.75)
4:30  → updateGlobalStats()  ✅ Cached (80.75)
5:00  → API запит (80.82)    ✅ Live (новий курс)
```

---

## 🌐 Альтернативні API (якщо потрібно)

### 1. **Exchangerate.host** (безкоштовний, без ключа)
```javascript
const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=RUB');
const rate = data.rates.RUB;
```

### 2. **Fixer.io** (потрібен безкоштовний ключ)
```javascript
const apiKey = 'YOUR_API_KEY';
const response = await fetch(`https://api.fixer.io/latest?access_key=${apiKey}&base=USD&symbols=RUB`);
```

### 3. **CurrencyAPI** (потрібен ключ)
```javascript
const apiKey = 'YOUR_API_KEY';
const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&base_currency=USD&currencies=RUB`);
```

**Зараз використовується:** exchangerate-api.com (найпростіший, безкоштовний)

---

## 🧪 Як перевірити

### 1. Відкрийте сайт:
```
http://localhost:8000/index-new.html
```

### 2. Відкрийте консоль (F12)

### 3. Подивіться на логи:
```
[CONTRACTS] Fetching live USD/RUB exchange rate...
[CONTRACTS] ✅ Live USD/RUB rate fetched: 80.75
[APP] 🪙 ARUB Price: 80.75 USDT
```

### 4. Перезавантажте сторінку через 30 сек:
```
[CONTRACTS] Using cached USD/RUB rate: 80.75
[APP] 🪙 ARUB Price: 80.75 USDT
```

### 5. Через 5+ хвилин побачите новий запит до API

---

## 📝 Змінені файли

1. ✅ `js/contracts.js` - додано fetchUsdRubRate() та кеш
2. ✅ `js/config.js` - оновлено коментар для fallback
3. ✅ `LIVE_USD_RUB_RATE.md` - документація

---

## 💡 Можливі покращення

### 1. **WebSocket для реального часу**
Замість HTTP запитів кожні 5 хв, можна використати WebSocket для миттєвого оновлення.

### 2. **Множинні джерела**
Запитувати курс з декількох API та брати середнє значення для точності.

### 3. **UI індикатор**
Показувати користувачу коли курс востаннє оновлювався:
```
🪙 ARUB Price: 80.75 USDT (оновлено 2 хв тому)
```

### 4. **Історія курсу**
Зберігати історію курсів в localStorage та показувати графік.

---

## ✅ Результат

### Було:
- ❌ Статичний курс 81.22 (застарів)
- ❌ Ручне оновлення в коді
- ❌ Неточна ціна

### Стало:
- ✅ **Живий курс з API** (оновлюється автоматично)
- ✅ Кешування для продуктивності
- ✅ Fallback при помилках
- ✅ Точна ціна ARUB в реальному часі
- ✅ Логи для моніторингу

---

🇺🇦 **Slava Ukraini! Курс ARUB тепер оновлюється автоматично!**

*Додано: 2025-11-15*
*Версія: 2.1.0*
