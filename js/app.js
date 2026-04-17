const CONFIG = {
  CLIENT_ID: '',
  API_KEY: '',
  SPREADSHEET_ID: ''
};

let currentMonth = new Date();
let entries = [];
let isAuthenticated = false;

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

function formatMonth(date) {
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDate(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatAmount(amount, type) {
  return type === 'income' ? `+${amount} ₽` : `−${amount} ₽`;
}

function parseInput(str) {
  const match = str.match(/^(\d+)\s+(.+)$/);
  if (!match) return null;
  return {
    amount: parseInt(match[1], 10),
    description: match[2].trim()
  };
}

function filterByMonth(entries, date) {
  return entries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
  });
}

function calcStats(entries) {
  const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const expense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  return { income, expense, balance: income - expense };
}

function render() {
  document.getElementById('currentMonth').textContent = formatMonth(currentMonth);

  const monthEntries = filterByMonth(entries, currentMonth);
  const stats = calcStats(monthEntries);

  document.getElementById('balance').textContent = `${stats.balance} ₽`;
  const balanceEl = document.getElementById('balance');
  balanceEl.className = 'balance ' + (stats.balance >= 0 ? 'positive' : 'negative');

  document.getElementById('income').textContent = `+${stats.income} ₽`;
  document.getElementById('expense').textContent = `−${stats.expense} ₽`;

  const list = document.getElementById('historyList');
  list.innerHTML = monthEntries.slice(0, 20).map(e => `
    <li>
      <span class="date">${formatDate(e.date)}</span>
      <span class="description">${e.description}</span>
      <span class="amount ${e.type}">${formatAmount(e.amount, e.type)}</span>
    </li>
  `).join('');
}

document.getElementById('input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const type = e.target.dataset.type || 'expense';
    const parsed = parseInput(e.target.value);
    if (parsed) {
      addEntry(parsed.amount, parsed.description, type);
      e.target.value = '';
    }
  }
});

document.getElementById('btnIncome').addEventListener('click', () => {
  const input = document.getElementById('input');
  const parsed = parseInput(input.value);
  if (parsed) {
    addEntry(parsed.amount, parsed.description, 'income');
    input.value = '';
  }
});

document.getElementById('btnExpense').addEventListener('click', () => {
  const input = document.getElementById('input');
  const parsed = parseInput(input.value);
  if (parsed) {
    addEntry(parsed.amount, parsed.description, 'expense');
    input.value = '';
  }
});

document.getElementById('prevMonth').addEventListener('click', () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  render();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  render();
});

function addEntry(amount, description, type) {
  const entry = {
    date: new Date().toISOString(),
    amount,
    description,
    type
  };
  entries.push(entry);
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveToCache();
  render();
}

function saveToCache() {
  localStorage.setItem('balance_entries', JSON.stringify(entries));
}

function loadFromCache() {
  const cached = localStorage.getItem('balance_entries');
  if (cached) {
    entries = JSON.parse(cached);
    render();
  }
}

async function init() {
  loadFromCache();
  render();
}

init();