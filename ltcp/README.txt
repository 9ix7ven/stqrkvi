LTC VAULT — Public Litecoin Address Dashboard

FILES
- index.html
- style.css
- script.js

INSTALL
1. Upload all three files to your website folder, for example:
   public_html/ltc/
2. Visit https://your-domain/ltc/
3. Enter a PUBLIC Litecoin address and click Load wallet.

FEATURES
- Current balance, total received, total sent, transaction count
- Recent transaction records with amount, timestamp and confirmation data
- Address copy, transaction filter, CSV export
- Automatic refresh every 60 seconds while the page is visible
- Best-effort LTC/USD price via CoinGecko
- Dark/pink responsive dashboard

SECURITY
- Read-only public-address lookup.
- Never enter a private key, seed phrase, wallet password or exchange login.
- This page does not send cryptocurrency and does not create transactions.
- Anyone can view blockchain activity for a public address.
- Public explorer APIs can rate-limit requests or change availability.
- API responses may be delayed. Always verify important information in an independent block explorer.

API SOURCES
- BlockCypher Litecoin mainnet address API
- CoinGecko simple price API

NOTES
- Transaction directions are inferred from the address transaction-reference data.
- Transaction amounts shown are address-related inputs/outputs, not necessarily the total value of a multi-output transaction.
- Price conversion is an estimate and is not a quote for executing a trade.
