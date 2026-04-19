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
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxkzfFpP0FKNIrKjib-m-NHrNpA1J9HWzfgv9_MGgAeefJ3ICz6lPNDZxglVDjnKrHm/exec',

    // Название листа в таблице (по умолчанию 'Лист1')
    SHEET_NAME: 'Лист1',

    // === 🎨 НАСТРОЙКИ ИНТЕРФЕЙСА ===
    TOAST_DURATION: 4000, // время показа уведомлений (мс)
    AUTO_RESET_DATE: true, // сбрасывать дату на "сегодня" после добавления записи
};