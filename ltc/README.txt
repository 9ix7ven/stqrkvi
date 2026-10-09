LTC VAULT — FINAL PUBLIC LITECOIN MONITOR

FILES
- index.html
- style.css
- script.js

DEPLOY
1. Upload all three files into the same website directory, for example public_html/ltc/.
2. Open https://your-domain/ltc/.
3. Enter the configured dashboard access code to open the page.
4. Use the SancheZ and zero tabs to switch between the two preset public Litecoin addresses.

PRECONFIGURED PUBLIC ADDRESSES
- SancheZ: LfTAT8gjC6Gg6B5XyDqpfuiCCyvz9ioC48
- zero: LNnJKsd3cQLcdMezUov2KzQ2VtMmGocAc6

FEATURES
- Access-code screen (client-side gate; details below)
- Two named wallet tabs with copy-address and explorer links
- Balance, lifetime received/sent, transaction counts
- Estimated LTC, USD and INR values for wallet totals and transaction rows
- LTC/USD and LTC/INR indicative market prices
- Recent transaction list with hash links, timestamps, confirmations and pending state
- Search by transaction hash, filters, CSV export
- Recent activity chart based on the loaded transaction references
- Automatic refresh every 60 seconds while the page is open
- New transaction-reference alerts while the dashboard is open
- Responsive black/neon-pink UI

IMPORTANT SECURITY LIMITATION
The access code is checked in browser JavaScript, so it is NOT secure authentication. Anyone who can inspect the site's source files can discover the code and bypass the screen. Use this only as a visual/private-use gate. If this dashboard must be protected from other visitors, put it behind real server-side authentication (for example, a server with sessions/password hashing or your hosting provider's directory password protection). Do not rely on this client-side gate to protect confidential information.

SAFETY / DATA NOTES
- This is read-only. It cannot send LTC and does not need a private key, seed phrase, or wallet login.
- Public blockchain addresses and their activity are public information.
- Fiat amounts are estimates using current CoinGecko spot prices and are not trade quotes.
- API requests may be delayed, unavailable, or rate-limited.
- The chart groups the currently loaded transaction references into broad age buckets; it is not a complete accounting statement.
- BlockCypher transaction references are address-related values and do not always equal the entire transaction's value.

API SOURCES
- BlockCypher Litecoin mainnet address API
- CoinGecko simple price API
