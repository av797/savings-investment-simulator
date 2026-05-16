import random
from typing import Optional

# ── Hardcoded fallback assumptions ──
# Used when market_returns table is empty (Phase 3a behaviour).
# Phase 3b replaces these with real data from market_data.py.

ASSET_CLASS_DEFAULTS = {
    "cash":   {"mean": 0.025, "std": 0.005},
    "bonds":  {"mean": 0.040, "std": 0.050},
    "stocks": {"mean": 0.070, "std": 0.150},
    "etfs":   {"mean": 0.065, "std": 0.120},
}


def run_monte_carlo(
    starting_balance: float,
    monthly_contribution: float,
    years: int,
    inflation_rate: float,
    target_amount: float,
    splits: dict,
    scenario_count: int = 10000,
    historical_returns: Optional[dict] = None,  # injected from market_data.py
) -> dict:

    use_bootstrap = historical_returns is not None and len(historical_returns) > 0

    # Pre-blend assumptions if using normal distribution fallback
    if not use_bootstrap:
        blended_mean, blended_std = _blend_normal_assumptions(splits)

    # Run N scenarios
    final_balances = []
    yearly_scenario_balances = [[] for _ in range(years)]

    for _ in range(scenario_count):
        balance = starting_balance

        for year_idx in range(years):
            if use_bootstrap:
                # ── Bootstrap mode: sample from real historical returns ──
                annual_return = _blend_bootstrap_return(splits, historical_returns)
            else:
                # ── Fallback mode: draw from normal distribution ──
                annual_return = random.gauss(blended_mean, blended_std)

            monthly_rate = annual_return / 12

            for _ in range(12):
                balance = balance * (1 + monthly_rate) + monthly_contribution

            yearly_scenario_balances[year_idx].append(balance)

        final_balances.append(balance)

    # ── Compute statistics ──
    final_balances.sort()
    n = len(final_balances)

    success_count = sum(1 for b in final_balances if b >= target_amount)
    success_rate  = round((success_count / n) * 100, 1)

    median_outcome = round(_percentile(final_balances, 50), 2)
    worst_10pct    = round(_percentile(final_balances, 10), 2)
    best_10pct     = round(_percentile(final_balances, 90), 2)

    # ── Build yearly fan chart breakdown ──
    yearly_breakdown = []
    total_contributions = starting_balance

    for year_idx, year_balances in enumerate(yearly_scenario_balances):
        year_num = year_idx + 1
        year_balances_sorted = sorted(year_balances)
        total_contributions += monthly_contribution * 12

        yearly_breakdown.append({
            "year":           year_num,
            "p10_balance":    round(_percentile(year_balances_sorted, 10), 2),
            "median_balance": round(_percentile(year_balances_sorted, 50), 2),
            "p90_balance":    round(_percentile(year_balances_sorted, 90), 2),
            "contributions":  round(total_contributions, 2),
        })

    return {
        "scenario_count": scenario_count,
        "success_rate":   success_rate,
        "median_outcome": median_outcome,
        "worst_10pct":    worst_10pct,
        "best_10pct":     best_10pct,
        "yearly_breakdown": yearly_breakdown,
    }


# ── Helpers ──

def _blend_normal_assumptions(splits: dict) -> tuple[float, float]:
    """
    Compute weighted blended mean and std dev from hardcoded asset class assumptions.
    Uses variance addition rule: blended_variance = sum(weight^2 * variance_i)
    """
    blended_mean     = 0.0
    blended_variance = 0.0

    for asset_class, info in splits.items():
        weight   = info["percentage"] / 100.0
        override = info.get("expected_return_override")

        defaults = ASSET_CLASS_DEFAULTS.get(asset_class, {"mean": 0.05, "std": 0.10})
        mean = override if override is not None else defaults["mean"]
        std  = defaults["std"]

        blended_mean     += weight * mean
        blended_variance += (weight ** 2) * (std ** 2)

    return blended_mean, blended_variance ** 0.5


def _blend_bootstrap_return(splits: dict, historical_returns: dict) -> float:
    """
    For each asset class, draw a random return from real historical data
    and blend by weight. Each asset class draws independently.
    """
    blended = 0.0

    for asset_class, info in splits.items():
        weight   = info["percentage"] / 100.0
        override = info.get("expected_return_override")

        if override is not None:
            annual_return = override
        else:
            returns_list = historical_returns.get(asset_class, [])
            if returns_list:
                annual_return = random.choice(returns_list)
            else:
                annual_return = ASSET_CLASS_DEFAULTS.get(asset_class, {}).get("mean", 0.05)

        blended += weight * annual_return

    return blended


def _percentile(sorted_values: list, pct: float) -> float:
    """Return the value at the given percentile from a sorted list."""
    if not sorted_values:
        return 0.0
    idx      = (pct / 100) * (len(sorted_values) - 1)
    lower    = int(idx)
    upper    = min(lower + 1, len(sorted_values) - 1)
    fraction = idx - lower
    return sorted_values[lower] + fraction * (sorted_values[upper] - sorted_values[lower])