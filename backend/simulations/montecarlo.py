# =============================================================================
# Monte Carlo Simulation Engine
# Phase 3a will replace this placeholder with the full probabilistic engine.
#
# For now this runs a deterministic simulation and returns mock statistical
# outputs so the API works end-to-end before Phase 3a is built.
# =============================================================================

import random
from backend.simulations.simulation_math import run_simulation_yearly


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
) -> dict:
    """
    Run a Monte Carlo simulation for a goal.

    splits format:
    {
        "stocks": {"percentage": 80.0, "expected_return_override": None},
        "bonds":  {"percentage": 20.0, "expected_return_override": None},
    }

    Returns:
    {
        "scenario_count": 10000,
        "success_rate": 78.3,
        "median_outcome": 95000.0,
        "worst_10pct": 48000.0,
        "best_10pct": 145000.0,
        "yearly_breakdown": [
            {"year": 1, "p10_balance": ..., "median_balance": ..., "p90_balance": ..., "contributions": ...},
            ...
        ]
    }
    """
    # Compute blended expected return from splits (weighted average of means)
    blended_mean, blended_std = _blend_assumptions(splits)

    # Run N scenarios
    final_balances = []
    yearly_scenario_balances = [[] for _ in range(years)]  # per year, list of balances across scenarios

    for _ in range(scenario_count):
        balance = starting_balance
        for year_idx in range(years):
            # Draw a random annual return from normal distribution
            annual_return = random.gauss(blended_mean, blended_std)
            monthly_rate = annual_return / 12

            for _ in range(12):
                balance = balance * (1 + monthly_rate) + monthly_contribution

            yearly_scenario_balances[year_idx].append(balance)

        final_balances.append(balance)

    # Sort final balances to compute percentiles
    final_balances.sort()
    n = len(final_balances)

    success_count = sum(1 for b in final_balances if b >= target_amount)
    success_rate = round((success_count / n) * 100, 1)

    median_outcome = round(_percentile(final_balances, 50), 2)
    worst_10pct    = round(_percentile(final_balances, 10), 2)
    best_10pct     = round(_percentile(final_balances, 90), 2)

    # Build yearly breakdown using percentiles across scenarios
    yearly_breakdown = []
    total_contributions = starting_balance

    for year_idx, year_balances in enumerate(yearly_scenario_balances):
        year_num = year_idx + 1
        year_balances_sorted = sorted(year_balances)
        total_contributions += monthly_contribution * 12

        yearly_breakdown.append({
            "year": year_num,
            "p10_balance":     round(_percentile(year_balances_sorted, 10), 2),
            "median_balance":  round(_percentile(year_balances_sorted, 50), 2),
            "p90_balance":     round(_percentile(year_balances_sorted, 90), 2),
            "contributions":   round(total_contributions, 2),
        })

    return {
        "scenario_count": scenario_count,
        "success_rate":   success_rate,
        "median_outcome": median_outcome,
        "worst_10pct":    worst_10pct,
        "best_10pct":     best_10pct,
        "yearly_breakdown": yearly_breakdown,
    }


def _blend_assumptions(splits: dict) -> tuple[float, float]:
    """
    Compute weighted blended mean and std dev from asset class splits.
    Uses variance addition rule for combining standard deviations:
    blended_variance = sum(weight^2 * variance_i)
    """
    blended_mean = 0.0
    blended_variance = 0.0

    for asset_class, info in splits.items():
        weight = info["percentage"] / 100.0
        override = info.get("expected_return_override")

        defaults = ASSET_CLASS_DEFAULTS.get(asset_class, {"mean": 0.05, "std": 0.10})
        mean = override if override is not None else defaults["mean"]
        std  = defaults["std"]

        blended_mean     += weight * mean
        blended_variance += (weight ** 2) * (std ** 2)

    blended_std = blended_variance ** 0.5
    return blended_mean, blended_std


def _percentile(sorted_values: list, pct: float) -> float:
    """Return the value at the given percentile from a sorted list."""
    if not sorted_values:
        return 0.0
    idx = (pct / 100) * (len(sorted_values) - 1)
    lower = int(idx)
    upper = min(lower + 1, len(sorted_values) - 1)
    fraction = idx - lower
    return sorted_values[lower] + fraction * (sorted_values[upper] - sorted_values[lower])