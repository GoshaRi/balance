# 💰 Finance Tracker for Mom

Приложение для учета личных финансов. Работает как PWA (можно установить на телефон).

## 📁 Структура

├── index.html                    # Разметка
├── manifest.json                 # PWA настройки
├── sw.js                         # Service Worker (офлайн)
├── .gitignore                    # Исключения для Git
├── css/
│   └── style.css                 # Стили
└── js/
    ├── config.js                 # 🔐 Настройки (НЕ коммитить!)
    ├── data.js                   # Работа с данными
    ├── ui.js                     # Отрисовка интерфейса
    └── app.js                    # Логика приложения

## 🚀 Быстрый старт

1. **Склонируйте репозиторий**
2. **Создайте конфиг:**
   ```bash
   cp js/config.example.js js/config.js
   ```
3. Откройте js/config.js и вставьте:
    - Ваш APPS_SCRIPT_URL из Google
4. Запустите локально (нужен сервер для PWA):
   # Python
    - python -m http.server 8000
   # или Node
    - npx serve .
5. Откройте http://localhost:8000

## 📱 Установка на телефон

1. Загрузите на GitHub Pages или любой HTTPS хостинг
2. Откройте ссылку в Chrome на Android
3. Меню (⋮) → "Добавить на главный экран"
4. Готово! Приложение появится среди иконок

🔧 Настройка Google Таблицы

1. Создайте таблицу с колонками: id | date | type | amount | desc
2. Откройте Расширения → Apps Script
3. Вставьте код из раздела ниже
4. Разверните как веб-приложение (доступ: "Все")
5. Скопируйте URL в js/config.js

## Код для Apps Script:

// Вставьте в Apps Script вашей таблицы
const SHEET_NAME = 'Лист1';

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const transactions = rows.map((row, i) => ({
    id: row[0] || Date.now() + i,
    date: row[1],
    type: row[2],
    amount: Number(row[3]),
    desc: row[4]
  })).filter(t => t.date);
  
  return ContentService.createTextOutput(JSON.stringify(transactions))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    sheet.appendRow([params.id || Date.now(), params.date, params.type, params.amount, params.desc]);
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

## ⚙️ Конфигурация (js/config.js)

const CONFIG = {
    MODE: 'sheets',              // 'local' или 'sheets'
    APPS_SCRIPT_URL: 'YOUR_URL_HERE',
    SHEET_NAME: 'Лист1',
    TOAST_DURATION: 4000,
    AUTO_RESET_DATE: true,
};

## ✅ Что работает
- Добавление доходов/расходов
- Парсинг ввода ("143 молоко")
- Голосовой ввод
- Редактирование записей
- Переключение месяцев
- Кэширование (localStorage)
- Синхронизация с Google Sheets
- PWA (установка на телефон)
- Офлайн-работа (Service Worker)

## 🐛 Известные проблемы

- Удаление из Google Sheets требует доработки скрипта
- Обновление записи в Sheets пока не реализовано

## 📋 Планы

- Экспорт данных в CSV
- Графики расходов по категориям
- Напоминания о регулярных платежах
