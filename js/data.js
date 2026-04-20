/**
 * 💾 DATA LAYER - Работа с данными
 * 
 * Отвечает за:
 * - Чтение/запись в localStorage
 * - Синхронизацию с Google Sheets (через Apps Script)
 * - Кэширование
 */

// Ключи для localStorage
const STORAGE_KEY = 'finance_cache_v1';
const DEVICE_ID_KEY = 'device_id';

/**
 * Получить или создать UUID устройства
 * @returns {string}
 */
function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id && typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
}

/**
 * Загрузка транзакций
 * @returns {Promise<Array>}
 */
async function loadTransactions() {
    if (CONFIG.MODE === 'sheets') {
        try {
            const deviceId = getDeviceId();
            const url = CONFIG.APPS_SCRIPT_URL + '?deviceId=' + deviceId;
            const response = await fetch(url);
            const result = await response.json();

            if (result && result.error === 'device_not_registered') {
                console.warn('⚠️ Устройство не зарегистрировано. UUID:', result.deviceId);
                alert('Устройство не зарегистрировано.\nВаш UUID: ' + result.deviceId + '\nСообщите этот код владельцу.');
                return getLocalTransactions();
            }

            if (result && result.error) {
                throw new Error(result.error);
            }

            const data = result;

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
            const deviceId = getDeviceId();
            const params = new URLSearchParams({
                deviceId,
                action: 'add',
                id: tx.id,
                date: tx.date,
                type: tx.type,
                amount: tx.amount,
                desc: tx.desc
            });
            const url = CONFIG.APPS_SCRIPT_URL + '?' + params;

            const response = await fetch(url);
            const result = await response.json();

            if (result && result.error) {
                // Откат локального изменения при ошибке
                const updated = getLocalTransactions().filter(t => t.id !== tx.id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return { success: false, error: result.error };
            }

            return { success: true };
        } catch (err) {
            console.warn('⚠️ Ошибка синхронизации:', err);
            return { success: false, error: err.message };
        }
    }
    return { success: true };
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