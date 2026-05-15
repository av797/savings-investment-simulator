# Savings & Investment Analyser/Simulator

# Personal Savings & Investment Analyser

## Overview
API-driven system for analysing savings behaviour and simulating investment strategies.

Want 1 section for savings calculations and 1 section for investment simulation

### Savings Sim
Proposed page for managing savings, planning out your regular costs every month

--> BUDGETING (Idea 1)
    - Monthly income and expense tracker
      - Fixed and variable costs, remaining amount calculated automatically
      - Savings rate shown vs recommended 20% rule
    - Leftover money pre-fills the simulator form
    - What-if scenarios — "what if I cut food budget by £100, how does that affect my goal?"

--> GOAL-BASED PLANNING (Idea 2)
    - Goal selector (house deposit, retirement, emergency fund, custom)
    - Recommendations based on selected goal
      - Suggested monthly amount and time horizon to hit target
    - Goal progress tracker

--> COMBINED FLOW (Idea 1 + 2)
    - Budget → Pick a goal → Simulate → Hand off surplus to investment page
    - System recommends savings split based on budget and goal
    - Auto-populates simulator with the result


### Investment Sim

--> WHAT IT DOES
    - Search and view real market data for stocks, ETFs, crypto and indexes
    - Simulate investing a fixed amount monthly into any asset
    - See projected outcomes based on historical performance
    - Get personalised asset recommendations based on your risk profile
      (carried over from your savings profile)

--> SIMULATIONS
    - Monthly investment simulator
      - How much would £X/month into the S&P 500 be worth in 20 years?
    - Scenario simulator
      - Best case, worst case and most likely outcome for any investment
      - Based on how the asset has historically behaved
    - Portfolio builder
      - Pick multiple assets and see how they perform together
      - See how spreading your money reduces risk

--> AI / PREDICTIONS
    - Short term trend forecasting using machine learning
      - Not a "buy this stock" signal
      - More of a "this asset has been trending up/down" indicator
    - Clearly labelled as experimental and not financial advice

--> PORTFOLIO TRACKER
    - Log what you actually own
    - Track how your investments are performing over time
    - Compare your portfolio against a benchmark like the S&P 500

--> DISCLAIMER
    - All simulations are based on historical data
    - Nothing on this platform is financial advice
    - Past performance does not guarantee future results

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
