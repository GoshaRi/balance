/**
 * 🎨 UI LAYER - Отображение интерфейса
 * 
 * Отвечает за:
 * - Рендеринг компонентов
 * - Анимации
 * - Уведомления
 */

// DOM элементы
const els = {
    monthLabel: document.getElementById('monthLabel'),
    balance: document.getElementById('balance'),
    totalIncome: document.getElementById('totalIncome'),
    totalExpense: document.getElementById('totalExpense'),
    dynamicVal: document.getElementById('dynamicVal'),
    dynamicArrow: document.getElementById('dynamicArrow'),
    inputField: document.getElementById('inputField'),
    calendarBtn: document.getElementById('calendarBtn'),
    historyList: document.getElementById('historyList'),
    historyCard: document.getElementById('historyCard'),
    editToggleBtn: document.getElementById('editToggleBtn'),
    editIcon: document.getElementById('editIcon'),
    closeIcon: document.getElementById('closeIcon'),
    toast: document.getElementById('toast'),
};

/**
 * Форматирование суммы
 */
const formatMoney = (num) => new Intl.NumberFormat('ru-RU').format(num) + ' ₽';

/**
 * Форматирование даты для отображения
 */
const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

/**
 * Форматирование даты в ISO
 */
const formatDateISO = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Ключ месяца для фильтрации
 */
const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * Название месяца для отображения
 */
const getMonthName = (date) => date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

/**
 * Проверка: сегодня ли дата
 */
const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

/**
 * Показать уведомление
 */
function showToast(msg, duration = CONFIG.TOAST_DURATION) {
    const icons = { '✅': '✨', '✏️': '📝', '🗑️': '🗑️', '📅': '📅', '⚠️': '⚠️' };
    const firstChar = msg.charAt(0);
    const icon = icons[firstChar] || 'ℹ️';

    els.toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), duration);
}

/**
 * Обновить весь UI
 */
function updateUI(transactions, currentDate) {
    const key = getMonthKey(currentDate);
    const monthTx = transactions
        .filter(t => t.date && t.date.startsWith(key))
        .sort((a, b) => b.id - a.id);

    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const balance = income - expense;
    const dynamic = balance;

    els.monthLabel.textContent = getMonthName(currentDate);
    els.balance.textContent = formatMoney(balance);
    els.totalIncome.textContent = '+' + formatMoney(income);
    els.totalExpense.textContent = '-' + formatMoney(expense);

    els.dynamicVal.textContent = (dynamic >= 0 ? '+' : '') + formatMoney(dynamic);
    els.dynamicArrow.textContent = dynamic >= 0 ? '↑' : '↓';
    els.dynamicArrow.style.color = dynamic >= 0 ? 'var(--dynamic)' : 'var(--expense)';

    renderHistory(monthTx, state.editingId);
}

/**
 * Рендер истории
 */
function renderHistory(transactions, editingId) {
    if (transactions.length === 0) {
        els.historyList.innerHTML = '<div class="empty-state">Нет операций за этот месяц</div>';
        return;
    }

    els.historyList.innerHTML = transactions.map(t => {
        // Сравнение через == чтобы не зависеть от типа данных
        if (editingId == t.id) {
            // Режим редактирования
            return `
                <div class="history-item">
                    <div class="edit-inline">
                        <!-- ДОБАВИЛИ КАВЫЧКИ -->
                        <button class="edit-date-btn" onclick="window.editDate('${t.id}')" title="Изменить дату">
                            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        </button>
                        <input type="number" class="edit-amount" id="edit-amount-${t.id}" value="${t.amount}" placeholder="Сумма">
                        <input type="text" class="edit-desc" id="edit-desc-${t.id}" value="${t.desc}" placeholder="Описание">
                        <!-- ДОБАВИЛИ КАВЫЧКИ -->
                        <button class="edit-save-btn" onclick="window.saveEdit('${t.id}')" title="Сохранить">
                            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Обычный вид
            // ДОБАВИЛИ КАВЫЧКИ В startEdit
            return `
                <div class="history-item" onclick="window.startEdit('${t.id}')">
                    <div class="item-content">
                        <div class="item-left">
                            <span class="item-date">${formatDate(t.date)}</span>
                            <span class="item-desc">${t.desc}</span>
                        </div>
                        <span class="item-amount ${t.type === 'income' ? 'inc' : 'exp'}">
                            ${t.type === 'income' ? '+' : '-'}${formatMoney(t.amount).replace(' ₽', '')} ₽
                        </span>
                    </div>
                    <button class="delete-btn" onclick="event.stopPropagation(); window.handleDelete('${t.id}')" title="Удалить">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
        }
    }).join('');
}


/**
 * Обновить состояние кнопки календаря
 */
function updateCalendarButton(selectedDate) {
    if (isToday(selectedDate)) {
        els.calendarBtn.classList.remove('active');
        els.calendarBtn.title = 'Выбрать дату';
    } else {
        els.calendarBtn.classList.add('active');
        els.calendarBtn.title = `Дата: ${formatDate(selectedDate)}`;
    }
}

/**
 * Переключить режим редактирования
 */
function toggleEditMode(isActive) {
    if (isActive) {
        els.historyCard.classList.add('edit-mode');
        els.editIcon.style.display = 'none';
        els.closeIcon.style.display = 'block';
        showToast('✏️ Нажмите на запись для редактирования');
    } else {
        els.historyCard.classList.remove('edit-mode');
        els.editIcon.style.display = 'block';
        els.closeIcon.style.display = 'none';
        showToast('Редактирование завершено');
    }
}