# Savings & Investment Analyser/Simulator

# Personal Savings & Investment Analyser

## Overview
API-driven system for analysing savings behaviour and simulating investment strategies.

Want 1 section for savings calculations and 1 section for investment simulation

## Architecture
Streamlit → FastAPI → PostgreSQL → ML & Simulation

## Tech Stack
PostgreSQL, FastAPI, Streamlit, pandas, scikit-learn

## Roadmap
- Data ingestion
- Savings forecasting
- Investment simulation

## Database Tables

### Users
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NOT NULL | Auto-increment |
| email | text | - | - |
| age | integer | - | - |
| risk_profile | text | - | - |
| monthly_income | numeric | - | - |
| created_at | timestamp | - | now() |
| is_active | boolean | - | true |
| password_hash | text | NOT NULL | - |
| last_login | timestamp | - | - |

**Primary Key:** id  
**Referenced by:** accounts, simulations

### Accounts
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NOT NULL | Auto-increment |
| user_id | integer | - | - |
| account_type | text | - | - |
| provider | text | - | - |
| currency | text | - | - |
| created_at | timestamp | - | now() |

**Primary Key:** id  
**Foreign Key:** user_id → users(id)  
**Referenced by:** transactions

### Transactions
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NOT NULL | Auto-increment |
| account_id | integer | - | - |
| date | date | - | - |
| amount | numeric | - | - |
| category | text | - | - |
| description | text | - | - |

**Primary Key:** id  
**Foreign Key:** account_id → accounts(id)

### Simulations
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NOT NULL | Auto-increment |
| user_id | integer | - | - |
| strategy_name | text | - | - |
| starting_balance | numeric | - | - |
| monthly_contribution | numeric | - | - |
| expected_return | numeric | - | - |
| final_value | numeric | - | - |
| created_at | timestamp | - | now() |

**Primary Key:** id  
**Foreign Key:** user_id → users(id)

### Market Returns
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NOT NULL | Auto-increment |
| date | date | - | - |
| asset_class | text | - | - |
| return_pct | numeric | - | - |

**Primary Key:** id
