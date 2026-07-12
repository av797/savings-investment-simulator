-- GoalIQ Database Schema
-- Generated from current models.py

CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    email            VARCHAR(255) UNIQUE NOT NULL,
    password_hash    VARCHAR NOT NULL,
    age              INTEGER,
    risk_profile     TEXT,
    monthly_income   NUMERIC,
    is_active        BOOLEAN DEFAULT TRUE,
    avatar           TEXT,
    created_at       TIMESTAMP DEFAULT NOW(),
    last_login       TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(id),
    account_type TEXT,
    provider     TEXT,
    currency     TEXT,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id          SERIAL PRIMARY KEY,
    account_id  INTEGER REFERENCES accounts(id),
    date        DATE,
    amount      NUMERIC,
    category    TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS goals (
    id                 SERIAL PRIMARY KEY,
    user_id            INTEGER REFERENCES users(id) NOT NULL,
    name               TEXT NOT NULL,
    goal_type          TEXT DEFAULT 'other',
    target_amount      NUMERIC NOT NULL,
    monthly_allocation NUMERIC NOT NULL,
    years              INTEGER NOT NULL,
    inflation_rate     NUMERIC DEFAULT 0.0,
    current_balance    NUMERIC DEFAULT 0.0,
    status             TEXT DEFAULT 'active',
    notes              TEXT,
    created_at         TIMESTAMP DEFAULT NOW(),
    updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_splits (
    id                       SERIAL PRIMARY KEY,
    goal_id                  INTEGER REFERENCES goals(id) NOT NULL,
    asset_class              TEXT NOT NULL,
    percentage               NUMERIC NOT NULL,
    expected_return_override NUMERIC
);

CREATE TABLE IF NOT EXISTS simulations (
    id                          SERIAL PRIMARY KEY,
    goal_id                     INTEGER REFERENCES goals(id) NOT NULL,
    run_at                      TIMESTAMP DEFAULT NOW(),
    scenario_count              INTEGER DEFAULT 10000,
    success_rate                NUMERIC,
    median_outcome              NUMERIC,
    worst_10pct                 NUMERIC,
    best_10pct                  NUMERIC,
    snapshot_target_amount      NUMERIC,
    snapshot_monthly_allocation NUMERIC,
    snapshot_years              INTEGER,
    snapshot_inflation_rate     NUMERIC,
    snapshot_splits             TEXT
);

CREATE TABLE IF NOT EXISTS simulation_yearly_breakdown (
    id             SERIAL PRIMARY KEY,
    simulation_id  INTEGER REFERENCES simulations(id) NOT NULL,
    year           INTEGER NOT NULL,
    p10_balance    NUMERIC,
    median_balance NUMERIC,
    p90_balance    NUMERIC,
    contributions  NUMERIC
);

CREATE TABLE IF NOT EXISTS market_returns (
    id          SERIAL PRIMARY KEY,
    date        DATE,
    asset_class TEXT,
    return_pct  NUMERIC
);