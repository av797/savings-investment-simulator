CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT,
    age INT,
    risk_profile TEXT,
    monthly_income NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    account_type TEXT,
    provider TEXT,
    currency TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES accounts(id),
    date DATE,
    amount NUMERIC,
    category TEXT,
    description TEXT
);

CREATE TABLE market_returns (
    id SERIAL PRIMARY KEY,
    date DATE,
    asset_class TEXT,
    return_pct NUMERIC
);

CREATE TABLE simulations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    strategy_name TEXT,
    starting_balance NUMERIC,
    monthly_contribution NUMERIC,
    expected_return NUMERIC,
    final_value NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);
