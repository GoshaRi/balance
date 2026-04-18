/**
 * 🔧 КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
 * 
 * ⚠️ ВАЖНО: Этот файл НЕ должен попадать в публичный репозиторий!
 * Добавьте его в .gitignore
 */

const CONFIG = {
    // === 🔄 РЕЖИМ РАБОТЫ ===
    // 'local' - только localStorage (для тестов)
    // 'sheets' - синхронизация с Google Таблицей
    MODE: 'sheets',

    // === 📊 GOOGLE APPS SCRIPT ===
    // 🔗 ВСТАВЬТЕ СЮДА ВАШ URL (полученный после развертывания):
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwXxUKW5Lx6hVlJqYjR5DrguCIrqDOl4ibVlY8VWiPJI1HCeTNYCVpQ8NGHa51q-Lv-/exec',

    // Название листа в таблице (по умолчанию 'Лист1')
    SHEET_NAME: 'Лист1',

    // === 🎨 НАСТРОЙКИ ИНТЕРФЕЙСА ===
    TOAST_DURATION: 4000, // время показа уведомлений (мс)
    AUTO_RESET_DATE: true, // сбрасывать дату на "сегодня" после добавления записи
};