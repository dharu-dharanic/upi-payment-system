# 💳 PayFlow — React Frontend

The user interface for the UPI Payment Simulation System.

---

## 📁 Project Structure

```
src/
├── api/
│   └── index.js               # Axios client with JWT interceptors + all API calls
├── context/
│   └── AuthContext.jsx        # Global auth state (login, logout, register)
├── hooks/
│   └── useAsync.js            # Reusable async + pagination hooks
├── utils/
│   └── index.js               # formatCurrency, formatDate, badge helpers
├── styles/
│   └── global.css             # Full design system (tokens, components, utilities)
├── components/
│   ├── common/
│   │   ├── Sidebar.jsx        # Collapsible nav (user + admin modes)
│   │   ├── AppLayout.jsx      # Shell with sidebar + outlet
│   │   └── ProtectedRoute.jsx # JWT guard & admin guard
│   ├── transactions/
│   │   └── SendMoneyModal.jsx # 3-step transfer flow (details → confirm → PIN)
│   └── wallet/
│       └── AddMoneyModal.jsx  # Bank → Wallet deposit modal
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx      # Balance + quick actions + recent txns
│   ├── WalletPage.jsx         # Balance, limits, UPI PIN setup
│   ├── TransactionsPage.jsx   # Filterable, paginated history
│   ├── BankAccountsPage.jsx   # Link/remove bank accounts
│   └── admin/
│       ├── AdminDashboardPage.jsx  # Charts + system stats
│       ├── AdminUsersPage.jsx      # Freeze/unfreeze users
│       └── AdminFlaggedPage.jsx    # Fraud-flagged transactions
└── App.jsx                    # Routes + Toaster setup
```

---

## 🚀 Quick Start

### Local development

```bash
cd upi-frontend

# 1. Install dependencies
npm install

# 2. Set backend URL
cp .env.example .env
# Edit .env: REACT_APP_API_URL=http://localhost:8080/api/v1

# 3. Start dev server
npm start
# → http://localhost:3000
```

### With Docker

```bash
docker build -t upi-frontend .
docker run -p 3000:80 upi-frontend
```

Or use the root `docker-compose.yml` (add a `frontend` service pointing to this folder).

---

## 🎨 Design System

Dark fintech theme with the following tokens (in `global.css`):

| Token | Value | Purpose |
|-------|-------|---------|
| `--bg-base` | `#080c14` | App background |
| `--bg-card` | `#111827` | Card surfaces |
| `--accent` | `#00d4aa` | Primary actions, success |
| `--danger` | `#ff4757` | Errors, debits |
| `--warning` | `#ffa502` | Flags, spent amounts |
| `--font-display` | Syne | Headings, amounts |
| `--font-body` | DM Sans | UI text |
| `--font-mono` | JetBrains Mono | Codes, references |

---

## 🔒 Key UX Features

### 3-Step Send Money Flow
1. **Details** — Enter receiver (UPI ID / phone / email) and amount
2. **Confirm** — Review details + see idempotency key
3. **PIN** — Enter UPI PIN to authorize

### Auto JWT Refresh
Axios interceptor silently refreshes access tokens using the refresh token before any 401 causes a logout.

### Idempotency
Every payment modal generates a unique `idempotencyKey` on mount. Safe to submit multiple times — server deduplicates.

### Role-based UI
Admin users see an extra "Admin" nav section and can access `/admin/*` routes. Regular users are redirected away from admin pages.

---

## 📱 Pages Overview

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Login with email/phone/UPI ID |
| `/register` | Public | New account creation |
| `/dashboard` | User | Balance + recent transactions |
| `/wallet` | User | Balance, limits, UPI PIN |
| `/transactions` | User | Full paginated history with search |
| `/bank-accounts` | User | Link/manage bank accounts |
| `/admin/dashboard` | Admin | System stats + charts |
| `/admin/users` | Admin | Freeze/unfreeze users |
| `/admin/flagged` | Admin | Fraud-flagged transactions |
