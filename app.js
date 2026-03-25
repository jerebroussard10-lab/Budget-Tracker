const STORAGE_KEY = 'budget_tracker_transactions';

let transactions = loadTransactions();

const balanceEl       = document.getElementById('balance');
const totalIncomeEl   = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const listEl          = document.getElementById('transaction-list');
const form            = document.getElementById('transaction-form');
const clearBtn        = document.getElementById('clear-all');

function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function updateSummary() {
  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance  = income - expenses;

  balanceEl.textContent       = formatCurrency(balance);
  totalIncomeEl.textContent   = formatCurrency(income);
  totalExpensesEl.textContent = formatCurrency(expenses);

  balanceEl.style.color = balance < 0 ? '#c0392b' : '#1a1a2e';
}

function renderList() {
  if (transactions.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No transactions yet. Add one above!</li>';
    return;
  }

  listEl.innerHTML = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(t => `
      <li class="transaction-item ${t.type}" data-id="${t.id}">
        <div class="transaction-info">
          <span class="transaction-description">${escapeHtml(t.description)}</span>
          <span class="transaction-meta">${capitalize(t.category)} &middot; ${formatDate(t.date)}</span>
        </div>
        <div class="transaction-right">
          <span class="transaction-amount">${t.type === 'expense' ? '-' : '+'}${formatCurrency(t.amount)}</span>
          <button class="btn-delete" data-id="${t.id}" title="Delete">&times;</button>
        </div>
      </li>
    `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function addTransaction(description, amount, type, category) {
  transactions.push({
    id: crypto.randomUUID(),
    description,
    amount,
    type,
    category,
    date: new Date().toISOString(),
  });
  saveTransactions();
  render();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  render();
}

function render() {
  updateSummary();
  renderList();
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const description = document.getElementById('description').value.trim();
  const amount      = parseFloat(document.getElementById('amount').value);
  const type        = document.getElementById('type').value;
  const category    = document.getElementById('category').value;

  if (!description || isNaN(amount) || amount <= 0) return;

  addTransaction(description, amount, type, category);
  form.reset();
});

listEl.addEventListener('click', e => {
  const btn = e.target.closest('.btn-delete');
  if (btn) deleteTransaction(btn.dataset.id);
});

clearBtn.addEventListener('click', () => {
  if (transactions.length === 0) return;
  if (confirm('Clear all transactions? This cannot be undone.')) {
    transactions = [];
    saveTransactions();
    render();
  }
});

render();
