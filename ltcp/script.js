/* LTC VAULT
 * Read-only Litecoin address monitor.
 * Public address only: never add private keys or seed phrases here.
 */
(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const API = {
    blockcypher: "https://api.blockcypher.com/v1/ltc/main/addrs/",
    price: "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd"
  };
  const SATOSHIS_PER_LTC = 100_000_000;
  const REFRESH_INTERVAL_MS = 60_000;
  const TX_LIMIT = 50;
  const STORAGE_KEY = "ltcVaultPublicAddress";

  const el = {
    form: $("#addressForm"),
    input: $("#addressInput"),
    clear: $("#clearInput"),
    load: $("#loadButton"),
    refresh: $("#refreshButton"),
    copy: $("#copyAddress"),
    status: $("#statusMessage"),
    hint: $("#addressHint"),
    balance: $("#balanceLtc"),
    usd: $("#balanceUsd"),
    received: $("#totalReceived"),
    sent: $("#totalSent"),
    count: $("#transactionCount"),
    updated: $("#lastUpdated"),
    subtitle: $("#historySubtitle"),
    list: $("#transactionList"),
    summary: $("#transactionSummary"),
    filter: $("#transactionFilter"),
    export: $("#exportButton"),
    explorer: $("#explorerLink"),
    toast: $("#toast"),
    footerClock: $("#footerClock")
  };

  let currentAddress = "";
  let allTransactions = [];
  let currentWalletData = null;
  let ltcPriceUsd = null;
  let refreshTimer = null;
  let toastTimer = null;
  let isLoading = false;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function formatLtc(satoshis, maximumFractionDigits = 8) {
    const value = Number(satoshis || 0) / SATOSHIS_PER_LTC;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits
    }).format(value);
  }

  function formatLtcNumber(ltc, maximumFractionDigits = 8) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits
    }).format(Number(ltc || 0));
  }

  function formatUsd(value) {
    if (!Number.isFinite(value)) return "USD value unavailable";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatDate(value) {
    if (!value) return { date: "Date unavailable", time: "" };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { date: "Date unavailable", time: "" };
    return {
      date: date.toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric"
      }),
      time: date.toLocaleTimeString(undefined, {
        hour: "2-digit", minute: "2-digit"
      })
    };
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      el.toast.classList.remove("is-visible");
    }, 2500);
  }

  function setStatus(message, kind = "") {
    el.status.textContent = message;
    el.status.dataset.kind = kind;
  }

  function setLoading(loading, message = "") {
    isLoading = loading;
    el.load.disabled = loading;
    el.refresh.disabled = loading;
    el.load.querySelector("span").textContent = loading ? "Loading…" : "Load wallet";
    document.body.classList.toggle("is-loading", loading);
    if (message) setStatus(message, loading ? "loading" : "");
  }

  function isPlausibleLitecoinAddress(address) {
    const value = address.trim();
    // Legacy P2PKH (L), P2SH (M or 3), and native SegWit (ltc1).
    // Actual checksum/validity is ultimately checked by the API.
    return /^(?:[LM3][a-km-zA-HJ-NP-Z1-9]{25,40}|ltc1[ac-hj-np-z02-9]{20,90})$/i.test(value);
  }

  async function fetchJson(url, label) {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        throw new Error("Address was not found or the API rejected it. Check the public LTC address.");
      }
      if (response.status === 429) {
        throw new Error("The blockchain API rate limit was reached. Wait a little, then try again.");
      }
      throw new Error(`${label} request failed (HTTP ${response.status}). Try again shortly.`);
    }

    return response.json();
  }

  async function fetchPrice() {
    try {
      const data = await fetchJson(API.price, "Price");
      const price = Number(data?.litecoin?.usd);
      if (Number.isFinite(price) && price > 0) {
        ltcPriceUsd = price;
      }
    } catch (error) {
      console.warn("LTC market price unavailable:", error.message);
    }
    return ltcPriceUsd;
  }

  async function loadWallet(address, options = {}) {
    const normalized = address.trim();
    if (!normalized) {
      setStatus("Enter a public LTC address to begin.", "error");
      el.input.focus();
      return;
    }

    if (!isPlausibleLitecoinAddress(normalized)) {
      setStatus("That address format doesn't look like a Litecoin address. Check it and try again.", "error");
      return;
    }

    if (isLoading) return;

    currentAddress = normalized;
    setLoading(true, "Connecting to public blockchain data…");
    el.copy.disabled = false;
    el.export.disabled = true;

    try {
      const addressUrl = `${API.blockcypher}${encodeURIComponent(normalized)}?limit=${TX_LIMIT}`;
      const [walletResult] = await Promise.all([
        fetchJson(addressUrl, "Blockchain"),
        fetchPrice()
      ]);

      currentWalletData = walletResult;
      allTransactions = normalizeTransactions(walletResult);
      renderWallet(walletResult);
      renderTransactions();

      el.input.value = normalized;
      el.explorer.href = `https://blockchair.com/litecoin/address/${encodeURIComponent(normalized)}`;
      el.hint.textContent = "Loaded public address. No private key was requested or used.";
      el.copy.disabled = false;
      el.export.disabled = allTransactions.length === 0;
      setStatus("Wallet data loaded successfully.", "success");
      el.footerClock.textContent = `LAST CHECK ${new Date().toLocaleTimeString()}`;

      try {
        localStorage.setItem(STORAGE_KEY, normalized);
      } catch (_) {
        // Storage can be disabled; dashboard still works.
      }

      if (!options.silent) showToast("Wallet data refreshed. ♡");
      scheduleRefresh();
    } catch (error) {
      console.error(error);
      setStatus(error.message || "Couldn't load wallet data. Check your connection and try again.", "error");
      if (!currentWalletData) renderEmpty("Couldn't load this wallet", "Check the address and internet connection, then try again.");
    } finally {
      setLoading(false);
    }
  }

  function normalizeTransactions(wallet) {
    const confirmed = Array.isArray(wallet?.txrefs) ? wallet.txrefs : [];
    const unconfirmed = Array.isArray(wallet?.unconfirmed_txrefs) ? wallet.unconfirmed_txrefs : [];
    const combined = [...confirmed, ...unconfirmed];

    const seen = new Set();
    return combined
      .filter((tx) => {
        const key = `${tx.tx_hash || ""}:${tx.tx_input_n ?? ""}:${tx.tx_output_n ?? ""}:${tx.value ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((tx) => {
        const isUnconfirmed = !tx.confirmed || Number(tx.confirmations || 0) === 0 || unconfirmed.includes(tx);
        // In BlockCypher TXRefs, tx_input_n === -1 indicates an output received by this address.
        const isReceived = Number(tx.tx_input_n) === -1;
        const timestamp = tx.confirmed || tx.received || tx.confirmed_time || null;

        return {
          hash: String(tx.tx_hash || ""),
          amountSatoshis: Math.abs(Number(tx.value || 0)),
          isReceived,
          pending: isUnconfirmed,
          confirmations: Number(tx.confirmations || 0),
          timestamp,
          blockHeight: Number(tx.block_height || 0)
        };
      })
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA || b.blockHeight - a.blockHeight;
      });
  }

  function renderWallet(wallet) {
    const balance = Number(wallet.final_balance ?? wallet.balance ?? 0);
    const received = Number(wallet.total_received || 0);
    const sent = Number(wallet.total_sent || 0);
    const count = Number(wallet.n_tx ?? wallet.final_n_tx ?? allTransactions.length);

    el.balance.innerHTML = `${escapeHtml(formatLtc(balance))} <small>LTC</small>`;
    el.received.innerHTML = `${escapeHtml(formatLtc(received))} <small>LTC</small>`;
    el.sent.innerHTML = `${escapeHtml(formatLtc(sent))} <small>LTC</small>`;
    el.count.textContent = Number.isFinite(count) ? count.toLocaleString("en-US") : "—";

    if (ltcPriceUsd) {
      el.usd.textContent = formatUsd((balance / SATOSHIS_PER_LTC) * ltcPriceUsd);
    } else {
      el.usd.textContent = "Market price unavailable";
    }

    el.updated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    el.subtitle.textContent = `${allTransactions.length} recent transaction records`;
    el.summary.textContent = `Address activity · ${Number(wallet.n_tx || 0).toLocaleString("en-US")} total transaction records reported`;
  }

  function statusMarkup(tx) {
    if (tx.pending) {
      return '<span class="tx-status tx-status--pending"><i></i> Unconfirmed</span>';
    }
    const confirmations = tx.confirmations;
    const label = confirmations > 0
      ? `${confirmations.toLocaleString("en-US")} confirmation${confirmations === 1 ? "" : "s"}`
      : "Confirmed";
    return `<span class="tx-status tx-status--confirmed"><i></i>${escapeHtml(label)}</span>`;
  }

  function transactionMarkup(tx) {
    const direction = tx.pending ? "pending" : (tx.isReceived ? "received" : "sent");
    const title = tx.pending ? "Pending transaction" : (tx.isReceived ? "Received LTC" : "Sent LTC");
    const symbol = tx.isReceived ? "↓" : "↑";
    const date = formatDate(tx.timestamp);
    const amount = formatLtcNumber(tx.amountSatoshis / SATOSHIS_PER_LTC);
    const sign = tx.isReceived ? "+" : "−";
    const hashShort = tx.hash ? `${tx.hash.slice(0, 10)}…${tx.hash.slice(-8)}` : "Transaction hash unavailable";
    const txUrl = tx.hash
      ? `https://blockchair.com/litecoin/transaction/${encodeURIComponent(tx.hash)}`
      : "https://blockchair.com/litecoin";

    return `
      <article class="transaction-row">
        <div class="transaction-main">
          <span class="tx-direction tx-direction--${direction}" aria-hidden="true">${symbol}</span>
          <div class="tx-details">
            <span class="tx-title">${title}</span>
            <a class="tx-hash" href="${txUrl}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(tx.hash)}">${escapeHtml(hashShort)}</a>
          </div>
        </div>
        <div class="tx-date">${escapeHtml(date.date)}<small>${escapeHtml(date.time)}</small></div>
        <div>${statusMarkup(tx)}</div>
        <div class="tx-amount ${tx.isReceived ? "tx-amount--received" : "tx-amount--sent"}">${sign}${escapeHtml(amount)} <small>LTC</small></div>
      </article>
    `;
  }

  function renderEmpty(title, description) {
    el.list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">↗</span>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(description)}</p>
      </div>
    `;
  }

  function renderTransactions() {
    const filter = el.filter.value;
    let transactions = [...allTransactions];

    if (filter === "received") transactions = transactions.filter((tx) => tx.isReceived && !tx.pending);
    if (filter === "sent") transactions = transactions.filter((tx) => !tx.isReceived && !tx.pending);
    if (filter === "pending") transactions = transactions.filter((tx) => tx.pending);

    if (!transactions.length) {
      renderEmpty(
        allTransactions.length ? "No matching transactions" : "No transaction records",
        allTransactions.length ? "Try another filter to see other activity." : "No recent transactions were returned for this address."
      );
      return;
    }

    el.list.innerHTML = transactions.map(transactionMarkup).join("");
    el.export.disabled = transactions.length === 0;
  }

  async function copyAddress() {
    if (!currentAddress) return;

    try {
      await navigator.clipboard.writeText(currentAddress);
      showToast("Public address copied.");
    } catch (_) {
      el.input.focus();
      el.input.select();
      const copied = document.execCommand("copy");
      showToast(copied ? "Public address copied." : "Select and copy the address manually.");
    }
  }

  function exportCsv() {
    if (!allTransactions.length) return;

    const rows = [
      ["transaction_hash", "direction", "amount_ltc", "date", "confirmations", "status"]
    ];

    allTransactions.forEach((tx) => {
      rows.push([
        tx.hash,
        tx.isReceived ? "received" : "sent",
        (tx.amountSatoshis / SATOSHIS_PER_LTC).toFixed(8),
        tx.timestamp || "",
        tx.confirmations,
        tx.pending ? "unconfirmed" : "confirmed"
      ]);
    });

    const csv = rows.map((row) => row.map((cell) => {
      const value = String(cell ?? "").replace(/"/g, '""');
      return `"${value}"`;
    }).join(",")).join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ltc-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Transaction CSV exported.");
  }

  function scheduleRefresh() {
    window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(() => {
      if (currentAddress && !document.hidden && !isLoading) {
        loadWallet(currentAddress, { silent: true });
      }
    }, REFRESH_INTERVAL_MS);
  }

  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    loadWallet(el.input.value);
  });

  el.refresh.addEventListener("click", () => {
    if (currentAddress) loadWallet(currentAddress);
    else {
      setStatus("Enter a public LTC address first.", "error");
      el.input.focus();
    }
  });

  el.clear.addEventListener("click", () => {
    el.input.value = "";
    el.input.focus();
  });

  el.copy.addEventListener("click", copyAddress);
  el.filter.addEventListener("change", renderTransactions);
  el.export.addEventListener("click", exportCsv);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearInterval(refreshTimer);
    } else if (currentAddress) {
      loadWallet(currentAddress, { silent: true });
    }
  });

  // Restore only the public address, never secret wallet material.
  try {
    const savedAddress = localStorage.getItem(STORAGE_KEY);
    if (savedAddress && isPlausibleLitecoinAddress(savedAddress)) {
      el.input.value = savedAddress;
      loadWallet(savedAddress, { silent: true });
    }
  } catch (_) {
    // Private browsing or disabled storage is fine.
  }
})();
