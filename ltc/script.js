/* LTC VAULT — public-address monitor. Never put wallet private keys or seed phrases here. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const CONFIG = {
    // This is a client-side access gate, not server-side authentication. See README.
    accessCode: "ilysmUnique@2329",
    wallets: {
      sanchez: { name: "SancheZ", address: "LfTAT8gjC6Gg6B5XyDqpfuiCCyvz9ioC48" },
      zero: { name: "zero", address: "LNnJKsd3cQLcdMezUov2KzQ2VtMmGocAc6" }
    },
    blockcypher: "https://api.blockcypher.com/v1/ltc/main/addrs/",
    priceApi: "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd,inr",
    satoshis: 100000000,
    refreshMs: 60000,
    txLimit: 50
  };
  const el = {
    login: $("#loginScreen"), loginForm: $("#loginForm"), code: $("#accessCode"), togglePassword: $("#togglePassword"), loginError: $("#loginError"), app: $("#app"), lock: $("#lockButton"),
    tabs: [...document.querySelectorAll(".wallet-tab")], refresh: $("#refreshButton"), copy: $("#copyAddress"), activeName: $("#activeWalletName"), activeAddress: $("#activeAddress"), explorer: $("#explorerLink"), historyExplorer: $("#historyExplorerLink"), addressStatus: $("#addressStatus"), status: $("#statusMessage"),
    balance: $("#balanceLtc"), usd: $("#balanceUsd"), inr: $("#balanceInr"), received: $("#totalReceived"), receivedFiat: $("#receivedFiat"), sent: $("#totalSent"), sentFiat: $("#sentFiat"), count: $("#transactionCount"), updated: $("#lastUpdated"), subtitle: $("#historySubtitle"), list: $("#transactionList"), summary: $("#transactionSummary"), filter: $("#transactionFilter"), search: $("#transactionSearch"), export: $("#exportButton"), chart: $("#activityChart"), marketPrice: $("#marketPrice"), priceUsd: $("#priceUsd"), priceInr: $("#priceInr"), toast: $("#toast"), footer: $("#footerClock")
  };
  let activeWallet = "sanchez", currentAddress = "", allTransactions = [], walletData = null, priceUsd = null, priceInr = null, refreshTimer = null, toastTimer = null, loading = false, seenByWallet = { sanchez: new Set(), zero: new Set() }, didInitialLoad = false;
  const fmtLtc = (n, digits = 8) => new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(Number(n || 0));
  const fmtUsd = (n) => Number.isFinite(n) ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n) : "—";
  const fmtInr = (n) => Number.isFinite(n) ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n) : "—";
  const satToLtc = (n) => Number(n || 0) / CONFIG.satoshis;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  function toast(msg) { el.toast.textContent = msg; el.toast.classList.add("is-visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove("is-visible"), 2600); }
  function setStatus(msg, kind = "") { el.status.textContent = msg; el.status.dataset.kind = kind; }
  function lockApp() { clearInterval(refreshTimer); el.app.classList.add("is-locked"); el.app.setAttribute("aria-hidden", "true"); el.login.style.display = "flex"; el.code.value = ""; el.loginError.textContent = ""; el.code.focus(); }
  function unlockApp() { el.login.style.display = "none"; el.app.classList.remove("is-locked"); el.app.setAttribute("aria-hidden", "false"); loadWallet(activeWallet); }
  el.loginForm.addEventListener("submit", (e) => { e.preventDefault(); if (el.code.value === CONFIG.accessCode) { unlockApp(); } else { el.loginError.textContent = "Incorrect access code. Please try again."; el.code.select(); } });
  el.togglePassword.addEventListener("click", () => { const show = el.code.type === "password"; el.code.type = show ? "text" : "password"; el.togglePassword.setAttribute("aria-label", show ? "Hide access code" : "Show access code"); });
  el.lock.addEventListener("click", lockApp);
  function isPlausibleAddress(a) { return /^(?:[LM3][a-km-zA-HJ-NP-Z1-9]{25,40}|ltc1[ac-hj-np-z02-9]{20,90})$/i.test(a); }
  async function fetchJson(url, label) {
    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) { if (res.status === 429) throw new Error(`${label} API rate limit reached. Wait a moment and refresh.`); if (res.status === 400 || res.status === 404) throw new Error(`${label} API rejected the request. Check the address and try again.`); throw new Error(`${label} API request failed (HTTP ${res.status}).`); }
    return res.json();
  }
  async function loadPrices() {
    try { const d = await fetchJson(CONFIG.priceApi, "Market price"); const usd = Number(d?.litecoin?.usd), inr = Number(d?.litecoin?.inr); if (usd > 0) priceUsd = usd; if (inr > 0) priceInr = inr; }
    catch (e) { console.warn(e.message); }
    renderMarket();
  }
  function renderMarket() { el.marketPrice.innerHTML = `${esc(fmtUsd(priceUsd))} <small>USD / LTC</small>`; el.priceUsd.textContent = fmtUsd(priceUsd); el.priceInr.textContent = fmtInr(priceInr); }
  function normalizeTransactions(w) {
    const confirmed = Array.isArray(w?.txrefs) ? w.txrefs : [], pending = Array.isArray(w?.unconfirmed_txrefs) ? w.unconfirmed_txrefs : [], combined = [...confirmed, ...pending], seen = new Set();
    return combined.filter(tx => { const k = `${tx.tx_hash || ""}:${tx.tx_input_n ?? ""}:${tx.tx_output_n ?? ""}:${tx.value ?? ""}`; if (seen.has(k)) return false; seen.add(k); return true; }).map(tx => {
      const isPending = !tx.confirmed || Number(tx.confirmations || 0) === 0 || pending.includes(tx);
      return { hash: String(tx.tx_hash || ""), amountSat: Math.abs(Number(tx.value || 0)), received: Number(tx.tx_input_n) === -1, pending: isPending, confirmations: Number(tx.confirmations || 0), timestamp: tx.confirmed || tx.received || tx.confirmed_time || null, blockHeight: Number(tx.block_height || 0) };
    }).sort((a,b) => (new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()) || b.blockHeight-a.blockHeight);
  }
  function dateParts(v) { if (!v) return { date:"Date unavailable", time:"" }; const d = new Date(v); if (Number.isNaN(d.getTime())) return { date:"Date unavailable", time:"" }; return { date:d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}), time:d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"}) }; }
  async function loadWallet(key, silent = false) {
    if (loading) return; activeWallet = key in CONFIG.wallets ? key : "sanchez"; const w = CONFIG.wallets[activeWallet]; currentAddress = w.address;
    el.tabs.forEach(t => { const on = t.dataset.wallet === activeWallet; t.classList.toggle("is-active", on); t.setAttribute("aria-pressed", String(on)); });
    el.activeName.textContent = w.name; el.activeAddress.textContent = w.address; el.explorer.href = el.historyExplorer.href = `https://blockchair.com/litecoin/address/${encodeURIComponent(w.address)}`;
    if (!isPlausibleAddress(w.address)) { setStatus("Configured address format is not valid.", "error"); return; }
    loading = true; el.refresh.disabled = true; setStatus(`Fetching ${w.name} wallet data…`, "loading"); el.addressStatus.textContent = "Connecting to public blockchain…";
    try {
      const [data] = await Promise.all([fetchJson(`${CONFIG.blockcypher}${encodeURIComponent(w.address)}?limit=${CONFIG.txLimit}`, "Blockchain"), loadPrices()]);
      walletData = data; allTransactions = normalizeTransactions(data); renderWallet(data); renderTransactions(); renderChart();
      el.addressStatus.textContent = "Public address loaded"; setStatus(`${w.name} wallet data loaded successfully.`, "success"); el.updated.textContent = `Updated ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`; el.footer.textContent = `LAST CHECK ${new Date().toLocaleTimeString()} · AUTO-REFRESH 60 SEC`;
      el.export.disabled = allTransactions.length === 0;
      const txIds = new Set(allTransactions.map(t => t.hash).filter(Boolean)); const previous = seenByWallet[activeWallet]; if (didInitialLoad && silent) { const newOnes = [...txIds].filter(id => !previous.has(id)); if (newOnes.length) toast(`${newOnes.length} new transaction reference(s) detected for ${w.name}.`); } else if (didInitialLoad && !silent) toast(`${w.name} wallet refreshed.`); seenByWallet[activeWallet] = txIds; didInitialLoad = true;
      clearInterval(refreshTimer); refreshTimer = setInterval(() => { if (!document.hidden && !loading) loadWallet(activeWallet, true); }, CONFIG.refreshMs);
    } catch (err) { console.error(err); setStatus(err.message || "Couldn't load wallet data. Check your connection.", "error"); el.addressStatus.textContent = "Data unavailable — try refresh"; if (!walletData) renderEmpty("Wallet data unavailable", "Check your connection or retry later. Public APIs can be rate-limited."); }
    finally { loading = false; el.refresh.disabled = false; }
  }
  function renderWallet(w) {
    const balance = Number(w.final_balance ?? w.balance ?? 0), received = Number(w.total_received || 0), sent = Number(w.total_sent || 0), count = Number(w.n_tx ?? w.final_n_tx ?? allTransactions.length);
    const ltc = satToLtc(balance), recvLtc = satToLtc(received), sentLtc = satToLtc(sent);
    el.balance.innerHTML = `${esc(fmtLtc(ltc))} <small>LTC</small>`; el.usd.textContent = `USD ${priceUsd ? fmtUsd(ltc * priceUsd) : "—"}`; el.inr.textContent = `INR ${priceInr ? fmtInr(ltc * priceInr) : "—"}`;
    el.received.innerHTML = `${esc(fmtLtc(recvLtc))} <small>LTC</small>`; el.receivedFiat.textContent = `USD ${priceUsd ? fmtUsd(recvLtc * priceUsd) : "—"} · INR ${priceInr ? fmtInr(recvLtc * priceInr) : "—"}`;
    el.sent.innerHTML = `${esc(fmtLtc(sentLtc))} <small>LTC</small>`; el.sentFiat.textContent = `USD ${priceUsd ? fmtUsd(sentLtc * priceUsd) : "—"} · INR ${priceInr ? fmtInr(sentLtc * priceInr) : "—"}`;
    el.count.textContent = Number.isFinite(count) ? count.toLocaleString("en-US") : "—"; el.subtitle.textContent = `${allTransactions.length} recent transaction references`; el.summary.textContent = `Showing ${allTransactions.length} fetched references · ${Number(w.n_tx || 0).toLocaleString("en-US")} total reported by API`;
  }
  function statusMarkup(tx) { if (tx.pending) return '<span class="tx-status tx-status--pending"><i></i> Unconfirmed</span>'; const n = tx.confirmations; return `<span class="tx-status tx-status--confirmed"><i></i>${n > 0 ? `${n.toLocaleString("en-US")} confirmation${n === 1 ? "" : "s"}` : "Confirmed"}</span>`; }
  function txMarkup(tx) {
    const type = tx.pending ? "pending" : tx.received ? "received" : "sent", title = tx.pending ? "Pending transaction" : tx.received ? "Received LTC" : "Sent LTC", amount = satToLtc(tx.amountSat), sign = tx.received ? "+" : "−", d = dateParts(tx.timestamp), short = tx.hash ? `${tx.hash.slice(0,10)}…${tx.hash.slice(-8)}` : "Transaction hash unavailable", url = tx.hash ? `https://blockchair.com/litecoin/transaction/${encodeURIComponent(tx.hash)}` : "https://blockchair.com/litecoin";
    const usd = priceUsd ? fmtUsd(amount * priceUsd) : "USD —", inr = priceInr ? fmtInr(amount * priceInr) : "INR —";
    return `<article class="transaction-row"><div class="transaction-main"><span class="tx-direction tx-direction--${type}" aria-hidden="true">${tx.received ? "↓" : "↑"}</span><div class="tx-details"><span class="tx-title">${title}</span><a class="tx-hash" href="${url}" target="_blank" rel="noopener noreferrer" title="${esc(tx.hash)}">${esc(short)}</a></div></div><div class="tx-date">${esc(d.date)}<small>${esc(d.time)}</small></div><div>${statusMarkup(tx)}</div><div class="tx-amount ${tx.received ? "tx-amount--received" : "tx-amount--sent"}">${sign}${esc(fmtLtc(amount))} <small>LTC</small><span class="tx-fiat">${esc(usd)}<br>${esc(inr)}</span></div></article>`;
  }
  function renderEmpty(title, description) { el.list.innerHTML = `<div class="empty-state"><span class="empty-icon">↗</span><strong>${esc(title)}</strong><p>${esc(description)}</p></div>`; }
  function getFiltered() { const f = el.filter.value, q = el.search.value.trim().toLowerCase(); return allTransactions.filter(tx => { if (f === "received" && (!tx.received || tx.pending)) return false; if (f === "sent" && (tx.received || tx.pending)) return false; if (f === "pending" && !tx.pending) return false; if (q && !tx.hash.toLowerCase().includes(q)) return false; return true; }); }
  function renderTransactions() { const rows = getFiltered(); if (!rows.length) { renderEmpty(allTransactions.length ? "No matching transactions" : "No transaction records", allTransactions.length ? "Try another filter or search term." : "No recent transaction references were returned for this address."); el.export.disabled = true; return; } el.list.innerHTML = rows.map(txMarkup).join(""); el.export.disabled = false; }
  function renderChart() {
    const buckets = Array.from({length:6}, (_,i) => ({label:["5+","4","3","2","1","Now"][i], incoming:0, outgoing:0}));
    const now = Date.now(); allTransactions.forEach(tx => { if (!tx.timestamp) return; const age = (now - new Date(tx.timestamp).getTime()) / 86400000; const idx = age < 1 ? 5 : age < 7 ? 4 : age < 30 ? 3 : age < 90 ? 2 : age < 180 ? 1 : 0; if (idx < 0 || idx > 5) return; if (tx.received) buckets[idx].incoming += tx.amountSat; else buckets[idx].outgoing += tx.amountSat; });
    const max = Math.max(1, ...buckets.flatMap(b => [b.incoming,b.outgoing])); el.chart.innerHTML = buckets.map(b => `<div class="chart-column" title="${b.label}: received ${fmtLtc(satToLtc(b.incoming))} LTC, sent ${fmtLtc(satToLtc(b.outgoing))} LTC"><span class="chart-bar chart-bar--in" style="height:${Math.max(3,b.incoming/max*100)}%"></span><span class="chart-bar chart-bar--out" style="height:${Math.max(3,b.outgoing/max*100)}%"></span><span class="chart-label">${b.label}</span></div>`).join("");
  }
  async function copyAddress() { try { await navigator.clipboard.writeText(currentAddress); toast(`${CONFIG.wallets[activeWallet].name} address copied.`); } catch (_) { const range = document.createRange(); range.selectNodeContents(el.activeAddress); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); toast("Address selected — copy it manually."); } }
  function exportCsv() { const rows = getFiltered(); if (!rows.length) return; const lines = [["wallet","address","transaction_hash","direction","amount_ltc","estimated_usd","estimated_inr","timestamp","confirmations","status"]]; rows.forEach(tx => { const amt = satToLtc(tx.amountSat); lines.push([CONFIG.wallets[activeWallet].name,currentAddress,tx.hash,tx.received?"received":"sent",amt.toFixed(8),priceUsd?(amt*priceUsd).toFixed(2):"",priceInr?(amt*priceInr).toFixed(2):"",tx.timestamp||"",tx.confirmations,tx.pending?"unconfirmed":"confirmed"]); }); const csv = lines.map(row => row.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\r\n"); const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"}), url = URL.createObjectURL(blob), a = document.createElement("a"); a.href=url; a.download=`ltc-${activeWallet}-transactions-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast("Filtered transaction history exported."); }
  el.tabs.forEach(t => t.addEventListener("click", () => { if (t.dataset.wallet !== activeWallet) loadWallet(t.dataset.wallet); })); el.refresh.addEventListener("click", () => loadWallet(activeWallet)); el.copy.addEventListener("click", copyAddress); el.filter.addEventListener("change", renderTransactions); el.search.addEventListener("input", renderTransactions); el.export.addEventListener("click", exportCsv);
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearInterval(refreshTimer); else if (!el.app.classList.contains("is-locked")) loadWallet(activeWallet, true); });
  renderMarket(); lockApp();
})();
