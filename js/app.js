/**
 * 🚀 APP LAYER - Основная логика и обработчики
 * 
 * Связывает UI и Data слои
 */

// Глобальное состояние
const state = {
    currentDate: new Date(),        // Месяц для отображения
    selectedDate: new Date(),       // Дата для новой записи
    transactions: [],               // Загруженные данные
    editMode: false,                // Режим редактирования
    editingId: null,                // ID редактируемой записи
};

// Инициализация
async function init() {
    // Загружаем данные
    state.transactions = await loadTransactions();

    // Обновляем UI
    updateUI(state.transactions, state.currentDate);
    updateCalendarButton(state.selectedDate);

    // Добавляем тестовые данные если пусто
    if (state.transactions.length === 0 && CONFIG.MODE === 'local') {
        addSampleData();
    }

    console.log('✅ Приложение загружено. Режим:', CONFIG.MODE);
}

/**
 * Добавить тестовые данные (для демо)
 */
function addSampleData() {
    const today = formatDateISO(new Date());
    const samples = [
        { id: 1, date: today, type: 'income', amount: 28000, desc: 'пенсия' },
        { id: 2, date: today, type: 'income', amount: 9000, desc: 'аванс' },
        { id: 3, date: today, type: 'expense', amount: 5653, desc: 'квартплата' },
        { id: 4, date: today, type: 'expense', amount: 3129, desc: 'продукты, молоко, хлеб' },
        { id: 5, date: today, type: 'expense', amount: 1549, desc: 'продукты, кефир, чай' },
        { id: 6, date: today, type: 'expense', amount: 143, desc: 'молоко, коржик' },
    ];
    samples.forEach(tx => saveTransaction(tx));
    state.transactions = getLocalTransactions();
    updateUI(state.transactions, state.currentDate);
}

/**
 * Парсинг ввода
 */
function parseInput(text) {
    const clean = text.replace(/[^a-zA-Zа-яА-Я0-9\s.,-]/g, '').trim();
    const numMatch = clean.match(/(\d+)/);

    if (!numMatch) return { valid: false, error: 'Не найдена сумма' };

    const amount = parseInt(numMatch[1]);
    let desc = clean.replace(numMatch[1], '').replace(/\s+/g, ' ').trim();
    desc = desc.replace(/^[.,]+|[.,]+$/g, '');

    if (!desc) return { valid: false, error: 'Не указано описание' };
    return { valid: true, amount, desc };
}

/**
 * Добавить новую транзакцию
 */
async function addTransaction(type) {
    const parsed = parseInput(els.inputField.value);
    if (!parsed.valid) {
        showToast('⚠️ ' + parsed.error);
        return;
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    triggerHaptic(); // Вибро при нажатии
    setButtonLoading(type, true); // Включаем спиннер и блокировку
    // ------------------------

    const tx = {
        id: Date.now(),
        date: formatDateISO(state.selectedDate),
        type,
        amount: parsed.amount,
        desc: parsed.desc
    };

    try {
        const result = await saveTransaction(tx);

        if (result && result.success) {
            state.transactions.push(tx);
            updateUI(state.transactions, state.currentDate);

            els.inputField.value = '';
            if (CONFIG.AUTO_RESET_DATE) {
                state.selectedDate = new Date();
                updateCalendarButton(state.selectedDate);
            }
            showToast('✅ Запись добавлена');
        } else {
            showToast('⚠️ Ошибка: ' + (result?.error || 'Не удалось добавить'));
        }
    } catch (err) {
        showToast('⚠️ Ошибка сети');
    } finally {
        // --- ЗАВЕРШЕНИЕ ИЗМЕНЕНИЙ ---
        setButtonLoading(type, false); // Выключаем спиннер в любом случае
        // ----------------------------
    }
}


/**
 * Начало редактирования записи
 */
function startEdit(id) {
    if (!state.editMode) return;

    // Приводим к строке, чтобы сравнение всегда было точным
    if (String(state.editingId) === String(id)) return;

    state.editingId = id;
    showToast('✏️ Редактирование. Измените и нажмите ✓');

    // ВАЖНО: Перерисовываем интерфейс, чтобы появились инпуты
    updateUI(state.transactions, state.currentDate);

    // Фокус на поле описания
    setTimeout(() => {
        const field = document.getElementById(`edit-desc-${id}`);
        if (field) field.focus();
    }, 100);
}

/**
 * Изменить дату в редактируемой записи (фикс для мобильных)
 */
function editDate(id) {
    const tx = state.transactions.find(t => String(t.id) === String(id));
    if (!tx) return;

    const picker = document.getElementById('hiddenDatePicker');
    if (!picker) return;

    // 1. Сначала подготавливаем данные
    picker.value = tx.date.split('T')[0];

    // 2. Сразу вешаем обработчик
    picker.onchange = (e) => {
        if (e.target.value) {
            tx.date = e.target.value;
            updateTransaction(tx);
            // Для корректного показа в уведомлении добавляем время T00:00:00
            showToast(`📅 Дата изменена: ${formatDate(new Date(tx.date + 'T00:00:00'))}`);
            updateUI(state.transactions, state.currentDate);
        }
        picker.onchange = null;
    };

    // 3. Вызываем календарь БЕЗ задержек (прямо в потоке клика)
    try {
        if (picker.showPicker) {
            picker.showPicker();
        } else {
            picker.click();
        }
    } catch (err) {
        // Если браузер всё еще капризничает, пробуем через click
        picker.click();
    }
}

/**
 * Сохранить изменения в записи
 */
function saveEdit(id) {
    const amountInput = document.getElementById(`edit-amount-${id}`);
    const descInput = document.getElementById(`edit-desc-${id}`);

    // Если поля не найдены, прерываем выполнение
    if (!amountInput || !descInput) return;

    const newAmount = parseInt(amountInput.value);
    const newDesc = descInput.value.trim();

    if (!newAmount || newAmount <= 0) {
        showToast('⚠️ Введите корректную сумму');
        return;
    }
    if (!newDesc) {
        showToast('⚠️ Введите описание');
        return;
    }

    // Ищем транзакцию, приводя оба ID к строке (защита от длинных чисел)
    const tx = state.transactions.find(t => String(t.id) === String(id));

    if (tx) {
        tx.amount = newAmount;
        tx.desc = newDesc;
        // Отправляем обновленные данные в кэш и в Google Таблицы
        updateTransaction(tx);
        triggerHaptic();
        showToast('✅ Изменения сохранены');
    }

    // Выходим из режима редактирования строки и обновляем UI
    state.editingId = null;
    updateUI(state.transactions, state.currentDate);
}

/**
 * Удалить транзакцию
 */
async function handleDelete(id) {
    const tx = state.transactions.find(t => String(t.id) === String(id));
    if (!tx) return;

    console.log('handleDelete start', id);
    if (confirm(`Удалить: "${tx.desc}" ${tx.amount} ₽?`)) {
        triggerHaptic();
        console.log('confirm OK');
        const result = await deleteTransaction(id);
        console.log('deleteTransaction result:', result);

        if (result && result.success) {
            state.transactions = state.transactions.filter(t => String(t.id) !== String(id));
            if (state.editingId === id) state.editingId = null;
            updateUI(state.transactions, state.currentDate);
            showToast('🗑️ Запись удалена');
        } else {
            // Откат удаления
            showToast('⚠️ Ошибка: ' + (result?.error || 'Не удалось удалить'));
        }
    }
}

/**
 * Голосовой ввод
 */
function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Создаем объект строго в момент клика
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';

    // На Андроиде true иногда работает стабильнее, не давая обрывать связь
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
        showToast('🎙️ Слушаю...');
        if (els.micBtn) els.micBtn.style.boxShadow = '0 0 15px rgba(255,0,0,0.5)';
    };

    recognition.onresult = (event) => {
        // Берем самый свежий результат
        const result = event.results[event.results.length - 1][0].transcript;
        if (els.inputField) {
            els.inputField.value = result;
        }
    };

    recognition.onerror = (err) => {
        console.log('Voice Error:', err.error);
        if (err.error === 'not-allowed') alert('Дайте разрешение под замочком!');
    };

    recognition.onend = () => {
        if (els.micBtn) els.micBtn.style.boxShadow = '';
        showToast('✅ Готово');
    };

    recognition.start();
}


/**
 * Открыть календарь для выбора даты (фикс для мобильных)
 */
function openCalendar() {
    // Используем уже созданный скрытый инпут
    const picker = document.getElementById('hiddenDatePicker');
    if (!picker) return;

    // Устанавливаем текущую выбранную дату из состояния (ГГГГ-ММ-ДД)
    picker.value = state.selectedDate.toISOString().split('T')[0];

    picker.onchange = (e) => {
        if (e.target.value) {
            // Устанавливаем дату с учетом локального времени (T00:00:00)
            state.selectedDate = new Date(e.target.value + 'T00:00:00');
            updateCalendarButton(state.selectedDate);
            showToast(`📅 Дата: ${formatDate(state.selectedDate)}`);
        }
        picker.onchange = null;
    };

    // Вызываем календарь напрямую (без таймаутов для Android/iOS)
    try {
        if (picker.showPicker) {
            picker.showPicker();
        } else {
            picker.focus();
            picker.click();
        }
    } catch (err) {
        picker.click();
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    init();

    // Кнопки добавления
    document.getElementById('btnIncome').onclick = () => addTransaction('income');
    document.getElementById('btnExpense').onclick = () => addTransaction('expense');

    // Переключение режима редактирования
    els.editToggleBtn.onclick = () => {
        state.editMode = !state.editMode;
        toggleEditMode(state.editMode);
        if (!state.editMode) {
            state.editingId = null;
            updateUI(state.transactions, state.currentDate);
        }
    };

    // Календарь и голос
    if (els.calendarBtn) els.calendarBtn.onclick = openCalendar;
    if (els.micBtn) els.micBtn.onclick = startVoiceInput;

    // Переключение месяцев
    document.getElementById('prevMonth').onclick = () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        updateUI(state.transactions, state.currentDate);
    };
    document.getElementById('nextMonth').onclick = () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        updateUI(state.transactions, state.currentDate);
    };
    // Свайп по карточке баланса
    const card = document.querySelector('.balance-card');
    let xDown = null;

    card.addEventListener('touchstart', e => {
        xDown = e.touches[0].clientX;
    }, { passive: true });

    card.addEventListener('touchend', e => {
        if (!xDown) return;
        let xUp = e.changedTouches[0].clientX;
        let xDiff = xDown - xUp;

        if (Math.abs(xDiff) > 50) { // порог свайпа
            if (xDiff > 0) {
                // Свайп влево -> следующий месяц
                state.currentDate.setMonth(state.currentDate.getMonth() + 1);
            } else {
                // Свайп вправо -> предыдущий месяц
                state.currentDate.setMonth(state.currentDate.getMonth() - 1);
            }
            updateUI(state.transactions, state.currentDate);
        }
        xDown = null;
    }, { passive: true });

    // Enter в поле ввода
    els.inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTransaction('expense');
    });
});

// Экспорт функций для inline-обработчиков в HTML
window.startEdit = startEdit;
window.editDate = editDate;
window.saveEdit = saveEdit;
window.handleDelete = handleDelete;