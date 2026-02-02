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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/payment/quote` | Get USD→COP quote |
| POST | `/api/payment/process` | Create payment |
| GET | `/api/payment/status/:id` | Get payment status |
| GET | `/api/payment/balances` | Get account balances |

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
    participant UDP as UserDataPage<br/>(Frontend)
    participant CP as ConfirmationPage<br/>(Frontend)
    participant BE as Backend<br/>(NestJS)
    participant SA as Supra API
    participant SEP as Supra External<br/>Payment Page

    Note over ES,SA: FASE 1: QUOTE (Cotización USD → COP)
    
    ES->>QP: Redirect: ?amount=349
    activate QP
    QP->>QP: Read ?amount from URL
    QP->>QP: Display: "Pay $349.00 USD"
    QP->>QP: User clicks "Get Quote"
    
    QP->>BE: POST /api/payment/quote<br/>{usdAmount: 349}
    activate BE
    
    BE->>BE: ensureValidToken()
    alt Token expired or missing
        BE->>SA: POST /v1/auth/token<br/>{clientId, clientSecret}
        activate SA
        SA-->>BE: {token, expires_in}
        deactivate SA
        BE->>BE: Cache token + expiration
    end
    
    BE->>SA: POST /v1/exchange/quote<br/>{initialCurrency: USD,<br/>finalCurrency: COP,<br/>initialAmount: 34900}<br/>Authorization: Bearer token
    activate SA
    SA->>SA: Calculate exchange rate
    SA-->>BE: {quoteId, exchangeRate,<br/>finalAmount: 1450350,<br/>expiresAt}
    deactivate SA
    
    BE->>BE: Convert amounts (÷100)<br/>Canonical log
    BE-->>QP: {usdAmount: 349,<br/>copAmount: 1450.35,<br/>exchangeRate: 4155.87,<br/>quoteId, expiresAt}
    deactivate BE
    
    QP->>QP: Display quote result
    QP->>QP: User can re-quote<br/>(repeat if needed)
    QP->>QP: User clicks "Continue"
    QP->>UDP: navigate('/user-data',<br/>{state: {quoteId, ...}})
    deactivate QP

    Note over ES,SA: FASE 2: PAYMENT CREATION (Crear pago)
    
    activate UDP
    UDP->>UDP: Receive quoteId from state
    UDP->>UDP: Display form
    UDP->>UDP: User fills form:<br/>fullName, documentType,<br/>document, email, cellPhone
    UDP->>UDP: User clicks "Pay Now"
    
    UDP->>BE: POST /api/payment/process<br/>{quoteId, ...userData}
    activate BE
    BE->>BE: Validate DTO
    BE->>BE: Generate referenceId<br/>(randomUUID)
    BE->>BE: ensureValidToken()
    
    BE->>SA: POST /v1/payin/payment<br/>{currency: COP, amount,<br/>quoteId, ...userData,<br/>redirectUrl:<br/>"localhost:5173/confirmation",<br/>referenceId}<br/>Authorization: Bearer token
    activate SA
    SA->>SA: Create payment<br/>Generate paymentLink
    SA-->>BE: {id: paymentId,<br/>paymentLink,<br/>status: PENDING}
    deactivate SA
    
    BE->>BE: Canonical log
    BE-->>UDP: {paymentId,<br/>paymentLink,<br/>status}
    deactivate BE
    
    UDP->>UDP: localStorage.setItem(<br/>'pendingPaymentId',<br/>paymentId)
    UDP->>SEP: window.location.href<br/>= paymentLink
    deactivate UDP

    Note over ES,SA: FASE 3: EXTERNAL PAYMENT
    
    activate SEP
    SEP->>SEP: User completes payment<br/>on Supra's interface
    SEP->>SEP: Payment processed
    SEP->>CP: Redirect to:<br/>localhost:5173/confirmation<br/>(NO params)
    deactivate SEP

    Note over ES,SA: FASE 4: CONFIRMATION (Verificar estado)
    
    activate CP
    CP->>CP: useEffect on mount
    CP->>CP: paymentId =<br/>localStorage.getItem(<br/>'pendingPaymentId')
    
    alt No paymentId found
        CP->>CP: Show error & return
    end
    
    CP->>CP: Show loading:<br/>"Checking payment status..."
    
    CP->>BE: GET /api/payment/status/:paymentId
    activate BE
    BE->>BE: ensureValidToken()
    
    BE->>SA: GET /v1/payin/payment/:id<br/>Authorization: Bearer token
    activate SA
    SA->>SA: Retrieve payment status
    SA-->>BE: {id, status: PAID,<br/>amount: 349.00,<br/>currency: COP,<br/>createdAt}
    deactivate SA
    
    BE->>BE: Canonical log
    BE-->>CP: {id, status,<br/>amount, currency,<br/>createdAt}
    deactivate BE
    
    alt status === PAID
        CP->>CP: Show success<br/>Display amount<br/>localStorage.removeItem
    else status === PENDING
        CP->>CP: Show pending<br/>Refresh button
    else status === FAILED
        CP->>CP: Show error<br/>Return to start
    end
    deactivate CP
```

## Key Technical Decisions

1. **Factor 100:** All amounts multiplied by 100 for Supra API
2. **localStorage:** Used to persist paymentId across Supra redirect
3. **Token per operation:** Fresh token for each Supra API call
4. **Canonical logging:** One log per operation at the end
5. **Integration tests:** Focus on user flows, not unit tests
