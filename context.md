STEP 1 — Define Your Core Features
**Savings & Investment Simulator — Context**

## Overview

This project provides two core features:

- A deterministic Savings Calculator (compound interest + monthly contributions)
- An Investment Simulator (uses expected returns; can extend with volatility later)
- Ability for users to save, list, and delete past simulations

## Data Models

Suggested core tables:

- **users**: id, email, password_hash, age, risk_profile, monthly_income, is_active, created_at, last_login
- **simulations**: id, user_id (FK→users.id), type ("savings"|"investment"), strategy_name, starting_balance, monthly_contribution, years, expected_return, final_value, created_at
- **transactions** (optional): id, account_id, date, amount, category, description
- **market_returns** (optional): id, date, asset_class, return_pct

## API Endpoints (Roadmap)

### Auth
- `POST /users` — create user
- `POST /users/login` — login (upgrade to JWT later)
- `GET /me` — (future) authenticated user info

### Savings
- `POST /savings/calculate` — calculate results without saving
- `POST /savings` — save a savings simulation (authenticated)
- `GET /savings` — list saved savings for the user

### Investments
- `POST /investments/calculate` — run simulation using expected return or mapped risk profile
- `POST /investments` — save an investment simulation
- `GET /investments` — list saved investment simulations

### Simulations (generic)
- `GET /simulations` — list all simulations for user
- `DELETE /simulations/{id}` — delete a saved simulation

## Calculation Logic

Use monthly-compounded math. The core formula is:

Inline: $FV = P(1+r)^t + PMT\\cdot\\frac{(1+r)^t - 1}{r}$

Where:
- $P$ = initial principal
- $PMT$ = monthly contribution
- $r$ = monthly interest rate (annual_percent / 100 / 12)
- $t$ = number of months (years * 12)

Edge case: if $r = 0$ then $FV = P + PMT\\cdot t$.

## Example Request / Response

Request body for calculation endpoints:

```json
{
  "starting_balance": 1000,
  "monthly_contribution": 500,
  "expected_return": 4,
  "years": 10
}
```

Example response:

```json
{
  "final_value": 82000.00,
  "total_contributions": 61000.00,
  "interest_earned": 21000.00
}
```

## Implementation Plan (Concrete Steps)

1. Add `simulations` DB model and migration
2. Add Pydantic schemas: `SavingsInput`, `InvestmentInput`, `SimulationOut`
3. Implement `POST /savings/calculate` and `POST /investments/calculate` (no DB)
4. Add endpoints to save/list/delete simulations (require auth)
5. Add JWT authentication and protect save/list endpoints

If you want, I can: create the Pydantic schemas, add the routers, and scaffold migrations next.
