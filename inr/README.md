# FamApp INR Tracker

A local website dashboard for tracking FamApp (formerly FamPay) transactions. It includes balance calculations, transaction history, category breakdown, six-month activity chart, and CSV export.

## Important: live integration status

This project does **not** connect to a live FamApp account. No verified public API for reading an individual's FamApp balance and private transaction history was confirmed when this starter was prepared. The `/api/famapp/status` endpoint deliberately reports that live access is not configured.

To add live sync, first obtain written confirmation and API documentation for a supported, authorized integration from FamApp by Trio or an authorized provider. Implement that provider on the server side only. Do not reverse-engineer private mobile endpoints or ask users for their FamApp password, UPI PIN, OTP, or session cookies.

Official website: https://www.famapp.in/

## Requirements

- Node.js 18 or newer
- No npm dependencies required

## Run locally

1. Extract the ZIP.
2. Open a terminal in the extracted `famapp-inr-tracker` folder.
3. Run:

   ```bash
   npm start
   ```

4. Open http://localhost:3000

## Features

- Manually add income and expenses
- Calculates tracked balance as opening balance + income - expenses
- Search and filter transactions
- Delete individual entries or clear all local records
- Category-wise spending breakdown
- Monthly income vs expense chart for the last six months
- Export transaction records to CSV
- Responsive dark dashboard

## Data and limitations

- Transactions are saved in this browser's `localStorage`; they are not synced between devices.
- The balance is only as accurate as the transactions you enter. It is not a live FamApp balance.
- Do not enter PINs, OTPs, passwords, card details, or other authentication secrets.
- This is an independent project and is not affiliated with FamApp by Trio.
