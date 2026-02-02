# THT Payment Collections Portal

Payment collection portal where external systems redirect users to pay USD amounts, collected in COP through Supra API.

## Tech Stack

- **Backend:** NestJS + TypeScript
- **Frontend:** React + Vite + TypeScript
- **Package Manager:** pnpm

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Backend

```bash
cd backend
pnpm install
cp .env.example .env  # Configure your credentials
pnpm run start:dev
```

Server runs on `http://localhost:3000`

### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm run dev
```

App runs on `http://localhost:5173`

## Environment Variables

### Backend (.env)

```
PORT=3000
SUPRA_API_URL=<supra_api_endpoint>
SUPRA_CLIENT_ID=<your_client_id>
SUPRA_SECRET=<your_secret>
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:3000
```

## API Endpoints

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| GET    | `/health`                 | Health check         |
| POST   | `/api/payment/quote`      | Get USD→COP quote    |
| POST   | `/api/payment/process`    | Create payment       |
| GET    | `/api/payment/status/:id` | Get payment status   |
| GET    | `/api/payment/balances`   | Get account balances |

## Testing

```bash
cd backend
make test-e2e
```

## User Flow

Entry point: `http://localhost:5173/quote?amount=349`

```mermaid
sequenceDiagram
    participant ES as External System<br/>(Amazon)
    participant QP as QuotePage<br/>(Frontend)
    participant CP as ConfirmationPage<br/>(Frontend)
    participant BE as Backend<br/>(NestJS)
    participant SA as Supra API
    participant SEP as Supra External<br/>Payment Page

    Note over ES,SEP: FASE 1: QUOTE (Cotización USD → COP)

    ES->>QP: Redirect: ?amount=349
    activate QP
    QP->>QP: Read ?amount from URL
    QP->>QP: Display: "Pay $349.00 USD"
    QP->>QP: User clicks "Get Quote"

    QP->>BE: POST /api/payment/quote<br/>{amount: 34900}
    activate BE

    BE->>SA: POST /v1/auth/token
    activate SA
    SA-->>BE: {token}
    deactivate SA

    BE->>SA: POST /v1/exchange/quote<br/>{initialCurrency: USD,<br/>finalCurrency: COP,<br/>initialAmount: 34900}
    activate SA
    SA-->>BE: {quoteId, exchangeRate,<br/>finalAmount, expiresAt}
    deactivate SA

    BE-->>QP: {quoteId, finalAmount,<br/>transactionCost, totalCost,<br/>exchangeRate, expiresAt}
    deactivate BE

    QP->>QP: Display quote + 45s timer
    QP->>QP: User fills form:<br/>fullName, documentType,<br/>document, email, cellPhone

    Note over ES,SEP: FASE 2: PAYMENT CREATION

    QP->>QP: User clicks "Proceed to Payment"

    QP->>BE: POST /api/payment/process<br/>{quoteId, fullName,<br/>documentType, document,<br/>email, cellPhone}
    activate BE

    BE->>SA: POST /v1/auth/token
    activate SA
    SA-->>BE: {token}
    deactivate SA

    BE->>SA: GET /v1/exchange/quote/:id<br/>(validate quote)
    activate SA
    SA-->>BE: {quote details}
    deactivate SA

    BE->>SA: POST /v1/auth/token
    activate SA
    SA-->>BE: {token}
    deactivate SA

    BE->>SA: POST /v1/payin/payment<br/>{currency: COP, amount,<br/>quoteId, userData,<br/>redirectUrl}
    activate SA
    SA-->>BE: {paymentId, paymentLink,<br/>status: CREATED}
    deactivate SA

    BE-->>QP: {paymentId, paymentLink,<br/>status}
    deactivate BE

    QP->>QP: localStorage.setItem(<br/>'pendingPaymentId', paymentId)
    QP->>SEP: window.location.href = paymentLink
    deactivate QP

    Note over ES,SEP: FASE 3: EXTERNAL PAYMENT

    activate SEP
    SEP->>SEP: User completes payment<br/>on Supra's interface
    SEP->>CP: Redirect to:<br/>localhost:5173/confirmation
    deactivate SEP

    Note over ES,SEP: FASE 4: CONFIRMATION

    activate CP
    CP->>CP: paymentId = localStorage.getItem(<br/>'pendingPaymentId')

    alt No paymentId found
        CP->>CP: Show error
    end

    CP->>BE: GET /api/payment/status/:paymentId
    activate BE
    BE->>SA: POST /v1/auth/token
    activate SA
    SA-->>BE: {token}
    deactivate SA
    BE->>SA: GET /v1/payin/payment/:id
    activate SA
    SA-->>BE: {status, amount, ...}
    deactivate SA
    BE-->>CP: {paymentId, status,<br/>amount, currency, ...}
    deactivate BE

    CP->>BE: GET /api/payment/balances
    activate BE
    BE->>SA: POST /v1/auth/token
    activate SA
    SA-->>BE: {token}
    deactivate SA
    BE->>SA: GET /v1/payout/user/balances
    activate SA
    SA-->>BE: [{currency, amount}, ...]
    deactivate SA
    BE-->>CP: {usd, cop}
    deactivate BE

    alt status === PAID
        CP->>CP: Show success<br/>localStorage.removeItem
    else status === PENDING/EXPIRED
        CP->>CP: Show status message
    end
    deactivate CP
```

## Key Technical Decisions

1. **Factor 100:** All amounts multiplied by 100 for Supra API
2. **localStorage:** Used to persist paymentId across Supra redirect
3. **Token per operation:** Fresh token for each Supra API call
4. **Canonical logging:** One log per operation at the end
5. **Integration tests:** Focus on user flows, not unit tests
