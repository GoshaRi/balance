/**
 * 💾 DATA LAYER - Работа с данными
 * 
 * Отвечает за:
 * - Чтение/запись в localStorage
 * - Синхронизацию с Google Sheets (через Apps Script)
 * - Кэширование
 */

// Ключ для localStorage
const STORAGE_KEY = 'finance_cache_v1';

/**
 * Загрузка транзакций
 * @returns {Promise<Array>}
 */
async function loadTransactions() {
    if (CONFIG.MODE === 'sheets') {
        try {
            const response = await fetch(CONFIG.APPS_SCRIPT_URL);
            const data = await response.json();

            // Сохраняем в кэш на случай офлайна
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return data;
        } catch (err) {
            console.warn('⚠️ Не удалось загрузить из Sheets, использую кэш:', err);
            // Фоллбэк на localStorage
            return getLocalTransactions();
        }
    }
    return getLocalTransactions();
}

/**
 * Сохранение транзакции
 * @param {Object} tx - объект транзакции
 * @returns {Promise<boolean>}
 */
async function saveTransaction(tx) {
    // Сначала сохраняем локально (для мгновенного отклика)
    const local = getLocalTransactions();
    local.push(tx);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));

    if (CONFIG.MODE === 'sheets') {
        try {
            // Отправляем в таблицу (без ожидания ответа для скорости)
            fetch(CONFIG.APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // важно для Google Apps Script
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tx)
            }).catch(err => console.warn('⚠️ Ошибка синхронизации:', err));
        } catch (err) {
            console.warn('⚠️ Не удалось отправить в Sheets:', err);
        }
    }
    return true;
}

/**
 * Удаление транзакции
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
async function deleteTransaction(id) {
    // Удаляем локально
    let local = getLocalTransactions();
    local = local.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));

    // ⚠️ Удаление из Google Sheets через Apps Script требует доработки скрипта
    // Пока только локальное удаление
    return true;
}

/**
 * Обновление транзакции
 * @param {Object} tx 
 * @returns {Promise<boolean>}
 */
async function updateTransaction(tx) {
    let local = getLocalTransactions();
    const idx = local.findIndex(t => t.id === tx.id);

    if (idx !== -1) {
        local[idx] = tx;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(local));

        // Синхронизация с Sheets (требует доработки скрипта для update)
        if (CONFIG.MODE === 'sheets') {
            console.log('🔄 Обновление в Sheets пока не реализовано');
        }
        return true;
    }
    return false;
}

/**
 * Вспомогательная: получить данные из localStorage
 * @returns {Array}
 */
function getLocalTransactions() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

/**
 * Очистка кэша (для отладки)
 */
function clearCache() {
    localStorage.removeItem(STORAGE_KEY);
}