/**
 * 🔧 КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
  */

const CONFIG = {
    // === 🔄 РЕЖИМ РАБОТЫ ===
    // 'local' - только localStorage (для тестов)
    // 'sheets' - синхронизация с Google Таблицей
    MODE: 'sheets',

    // === 📊 GOOGLE APPS SCRIPT ===
    // 🔗 ВСТАВЬТЕ СЮДА ВАШ URL (полученный после развертывания):
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwZYDn7ZnWBqJhj8iIOIbGEoPb8_Vft6YHbqKZj8GRMz8knwFXlS9GOOkKgsZT4fBI/exec',

    // Название листа в таблице (по умолчанию 'Лист1')
    SHEET_NAME: 'Лист1',

    // === 🎨 НАСТРОЙКИ ИНТЕРФЕЙСА ===
    TOAST_DURATION: 4000, // время показа уведомлений (мс)
    AUTO_RESET_DATE: true, // сбрасывать дату на "сегодня" после добавления записи
};