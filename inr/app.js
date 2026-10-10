const STORAGE_KEY = "famtrack.transactions.v1";
const OPENING_KEY = "famtrack.openingBalance.v1";
const $ = (id) => document.getElementById(id);
const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
const today = () => new Date().toISOString().slice(0, 10);
let transactions = loadTransactions();

function loadTransactions() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }
function safeNumber(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function totals() {
  const income = transactions.filter(t => t.type === "income").reduce((s,t) => s + safeNumber(t.amount), 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s,t) => s + safeNumber(t.amount), 0);
  const opening = safeNumber(localStorage.getItem(OPENING_KEY));
  const month = new Date().toISOString().slice(0,7);
  const monthSpend = transactions.filter(t => t.type === "expense" && t.date.startsWith(month)).reduce((s,t) => s + safeNumber(t.amount), 0);
  return { income, expenses, balance: opening + income - expenses, monthSpend };
}
function renderStats() {
  const t = totals();
  $("balance").textContent = currency(t.balance);
  $("income").textContent = currency(t.income);
  $("expenses").textContent = currency(t.expenses);
  $("monthSpend").textContent = currency(t.monthSpend);
}
function renderRows() {
  const query = $("search").value.trim().toLowerCase();
  const type = $("filterType").value;
  const filtered = [...transactions].filter(t => (type === "all" || t.type === type) &&
    [t.description,t.category,t.reference,t.date].join(" ").toLowerCase().includes(query))
    .sort((a,b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const tbody = $("transactionRows");
  tbody.innerHTML = "";
  $("emptyState").classList.toggle("hidden", filtered.length > 0);
  $("rowCount").textContent = `${filtered.length} transaction${filtered.length === 1 ? "" : "s"}`;
  filtered.forEach(t => {
    const tr = document.createElement("tr");
    const isIncome = t.type === "income";
    const icon = isIncome ? "↙" : "↗";
    const amountText = `${isIncome ? "+" : "−"}${currency(t.amount)}`;
    tr.innerHTML = `<td><div class="tx-name"><div class="tx-icon ${isIncome ? "income" : ""}">${icon}</div><div><div class="tx-title"></div><div class="tx-ref"></div></div></div></td><td><span class="category-tag"></span></td><td></td><td class="amount-cell ${isIncome ? "income" : "expense"}"></td><td><button class="delete-btn" title="Delete transaction" aria-label="Delete transaction">×</button></td>`;
    tr.querySelector(".tx-title").textContent = t.description;
    tr.querySelector(".tx-ref").textContent = t.reference || (isIncome ? "Money received" : "Money spent");
    tr.children[1].firstChild.textContent = t.category;
    tr.children[2].textContent = new Date(`${t.date}T12:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
    tr.children[3].textContent = amountText;
    tr.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Delete this local transaction?")) {
        transactions = transactions.filter(x => x.id !== t.id); save(); render();
      }
    });
    tbody.appendChild(tr);
  });
}
function renderCategories() {
  const groups = {};
  transactions.filter(t => t.type === "expense").forEach(t => groups[t.category] = (groups[t.category] || 0) + safeNumber(t.amount));
  const entries = Object.entries(groups).sort((a,b) => b[1]-a[1]);
  const total = entries.reduce((s,x) => s+x[1],0);
  const box = $("categoryBreakdown");
  box.innerHTML = "";
  if (!entries.length) { box.innerHTML = '<p class="muted">Add expenses to see categories.</p>'; return; }
  entries.forEach(([name, amount]) => {
    const row = document.createElement("div");
    row.className = "category-row";
    const label = document.createElement("span"); label.className = "category-label"; label.textContent = name;
    const value = document.createElement("span"); value.className = "category-amount"; value.textContent = currency(amount);
    const track = document.createElement("div"); track.className = "bar-track";
    const fill = document.createElement("div"); fill.className = "bar-fill"; fill.style.width = `${total ? amount/total*100 : 0}%`;
    track.appendChild(fill); row.append(label,value,track); box.appendChild(row);
  });
}
function renderMonthly() {
  const now = new Date();
  const months = [];
  for (let i=5;i>=0;i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    months.push({key,label:d.toLocaleDateString("en-IN",{month:"short"})});
  }
  const data = months.map(m => {
    const rows = transactions.filter(t => t.date.startsWith(m.key));
    return {...m, income:rows.filter(t=>t.type==="income").reduce((s,t)=>s+safeNumber(t.amount),0), expense:rows.filter(t=>t.type==="expense").reduce((s,t)=>s+safeNumber(t.amount),0)};
  });
  const max = Math.max(1,...data.flatMap(d=>[d.income,d.expense]));
  const chart = $("monthlyChart"); chart.innerHTML = "";
  data.forEach(d => {
    const col = document.createElement("div"); col.className = "month-col";
    const bars = document.createElement("div"); bars.className = "bars";
    const inc = document.createElement("div"); inc.className = "bar income-bar"; inc.style.height = `${Math.max(d.income ? 4 : 2, d.income/max*100)}%`; inc.title = `Income: ${currency(d.income)}`;
    const exp = document.createElement("div"); exp.className = "bar expense-bar"; exp.style.height = `${Math.max(d.expense ? 4 : 2, d.expense/max*100)}%`; exp.title = `Expenses: ${currency(d.expense)}`;
    bars.append(inc,exp);
    const label = document.createElement("div"); label.className = "month-label"; label.textContent = d.label;
    col.append(bars,label); chart.appendChild(col);
  });
}
function render() { renderStats(); renderRows(); renderCategories(); renderMonthly(); }
function toggleForm(show) { $("transactionForm").classList.toggle("hidden", !show); if(show) $("description").focus(); }
$("date").value = today();
$("addToggle").addEventListener("click", () => toggleForm($("transactionForm").classList.contains("hidden")));
$("emptyAdd").addEventListener("click", () => toggleForm(true));
$("cancelAdd").addEventListener("click", () => { $("transactionForm").reset(); $("date").value=today(); toggleForm(false); });
$("transactionForm").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number($("amount").value);
  if (!Number.isFinite(amount) || amount <= 0) return alert("Enter an amount greater than zero.");
  transactions.push({
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    type: $("type").value,
    amount: Math.round(amount*100)/100,
    description: $("description").value.trim(),
    category: $("category").value,
    date: $("date").value,
    reference: $("reference").value.trim(),
    createdAt: Date.now()
  });
  save(); $("transactionForm").reset(); $("date").value=today(); toggleForm(false); render();
});
$("search").addEventListener("input", renderRows);
$("filterType").addEventListener("change", renderRows);
$("clearBtn").addEventListener("click", () => {
  if (confirm("Clear every transaction saved in this browser? This cannot be undone.")) {
    transactions=[]; save(); render();
  }
});
$("exportBtn").addEventListener("click", () => {
  const rows = [["date","type","amount_inr","description","category","reference"], ...transactions.map(t=>[t.date,t.type,t.amount,t.description,t.category,t.reference||""])];
  const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href=url; a.download="famapp-transactions.csv"; a.click(); URL.revokeObjectURL(url);
});
fetch("/api/famapp/status").then(r=>r.json()).then(data => {
  $("integrationStatus").textContent = data.liveIntegrationAvailable ? "Official integration configured" : "Official API access not configured";
}).catch(() => $("integrationStatus").textContent = "Status endpoint unavailable");
render();
