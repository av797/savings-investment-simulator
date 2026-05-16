from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import random

FALLBACK_DEFAULTS = {
    "cash":   {"mean": 0.025, "std": 0.005},
    "bonds":  {"mean": 0.040, "std": 0.050},
    "stocks": {"mean": 0.070, "std": 0.150},
    "etfs":   {"mean": 0.065, "std": 0.120},
}


def get_asset_assumptions(db: Session) -> dict:
    """
    Compute mean and std dev for each asset class from the market_returns table.
    Returns a dict in the same format as ASSET_CLASS_DEFAULTS in monte_carlo.py:

    {
        "stocks": {"mean": 0.107, "std": 0.172},
        "bonds":  {"mean": 0.034, "std": 0.068},
        ...
    }

    Returns and std are in decimal form (0.07 = 7%).
    Falls back to hardcoded defaults if the table is empty.
    """
    result = db.execute(text("""
        SELECT
            asset_class,
            AVG(return_pct)                                    AS mean_pct,
            STDDEV(return_pct)                                 AS std_pct,
            COUNT(*)                                           AS years
        FROM market_returns
        GROUP BY asset_class
    """)).fetchall()

    if not result:
        return FALLBACK_DEFAULTS

    assumptions = {}
    for row in result:
        asset_class = row[0]
        mean_pct    = float(row[1])  # e.g. 10.7 (percent)
        std_pct     = float(row[2])  # e.g. 17.2 (percent)

        assumptions[asset_class] = {
            "mean": round(mean_pct / 100, 6),  # convert to decimal: 10.7 → 0.107
            "std":  round(std_pct  / 100, 6),  # convert to decimal: 17.2 → 0.172
        }

    # Fill in any missing asset classes with fallback defaults
    for asset_class, defaults in FALLBACK_DEFAULTS.items():
        if asset_class not in assumptions:
            assumptions[asset_class] = defaults

    return assumptions


def get_historical_returns(db: Session) -> dict:
    """
    Returns all historical annual returns per asset class as lists of decimals.
    Used for bootstrap resampling in the Monte Carlo engine.

    {
        "stocks": [0.263, -0.194, 0.286, -0.371, ...],
        "bonds":  [0.012, -0.245, 0.034, ...],
        ...
    }
    """
    result = db.execute(text("""
        SELECT asset_class, return_pct
        FROM market_returns
        ORDER BY asset_class, date
    """)).fetchall()

    historical = {}
    for row in result:
        asset_class = row[0]
        return_pct  = float(row[1]) / 100  # convert percent to decimal

        if asset_class not in historical:
            historical[asset_class] = []
        historical[asset_class].append(return_pct)

    return historical


def bootstrap_annual_return(historical_returns: list) -> float:
    """
    Draw a single annual return by randomly sampling from real historical returns.
    This is bootstrap resampling — more realistic than a normal distribution
    because it uses the actual distribution of past returns including crash years.
    """
    if not historical_returns:
        return 0.0
    return random.choice(historical_returns)


def blend_bootstrap_return(splits: dict, historical: dict) -> float:
    """
    For a given set of asset splits, draw a bootstrapped annual return
    for each asset class and blend them by weight.

    splits format:
    {
        "stocks": {"percentage": 70.0, "expected_return_override": None},
        "cash":   {"percentage": 30.0, "expected_return_override": None},
    }

    Returns a single blended annual return as a decimal e.g. 0.082
    """
    blended = 0.0

    for asset_class, info in splits.items():
        weight   = info["percentage"] / 100.0
        override = info.get("expected_return_override")

        if override is not None:
            # User has set a custom return assumption — use it directly
            annual_return = override
        else:
            returns_list = historical.get(asset_class, [])
            if returns_list:
                annual_return = bootstrap_annual_return(returns_list)
            else:
                # Fall back to hardcoded default mean if no historical data
                annual_return = FALLBACK_DEFAULTS.get(asset_class, {}).get("mean", 0.05)

        blended += weight * annual_return

    return blended