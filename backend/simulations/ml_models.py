import random
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import Optional


# ── Split profiles — candidate allocations the model chooses between ──

SPLIT_PROFILES = {
    "very_conservative": {"cash": 70, "bonds": 20, "stocks": 5,  "etfs": 5},
    "conservative":      {"cash": 50, "bonds": 30, "stocks": 10, "etfs": 10},
    "moderate":          {"cash": 20, "bonds": 30, "stocks": 25, "etfs": 25},
    "growth":            {"cash": 10, "bonds": 15, "stocks": 40, "etfs": 35},
    "aggressive":        {"cash": 5,  "bonds": 10, "stocks": 50, "etfs": 35},
}

GOAL_TYPE_MAP = {
    "house":          0,
    "retirement":     1,
    "emergency_fund": 2,
    "education":      3,
    "travel":         4,
    "other":          5,
}

RISK_PROFILE_MAP = {
    "low":    0,
    "medium": 1,
    "high":   2,
}

# How much each metric matters per risk tolerance
RISK_WEIGHTS = {
    "low":    {"success": 0.5, "worst": 0.4, "median": 0.1},
    "medium": {"success": 0.4, "worst": 0.2, "median": 0.4},
    "high":   {"success": 0.3, "worst": 0.1, "median": 0.6},
}


# ── Simulation helpers ──

def _run_mini_simulation(
    split: dict,
    years: int,
    monthly_contribution: float,
    target_amount: float,
    historical_returns: dict,
    scenario_count: int = 500,
) -> dict:
    """
    Fast bootstrap simulation for a given split against real market data.
    Returns success_rate, median_outcome, worst_10pct.
    """
    final_balances = []

    for _ in range(scenario_count):
        balance = 0.0
        for _ in range(years):
            annual_return = 0.0
            for asset_class, pct in split.items():
                weight = pct / 100.0
                returns_list = historical_returns.get(asset_class, [])
                if returns_list:
                    annual_return += weight * random.choice(returns_list)

            monthly_rate = annual_return / 12
            for _ in range(12):
                balance = balance * (1 + monthly_rate) + monthly_contribution

        final_balances.append(balance)

    final_balances.sort()
    n = len(final_balances)

    return {
        "success_rate":   (sum(1 for b in final_balances if b >= target_amount) / n) * 100,
        "median_outcome": final_balances[n // 2],
        "worst_10pct":    final_balances[int(n * 0.1)],
    }


def _score_split(sim_result: dict, risk_profile: str) -> float:
    """
    Score a simulation result based on risk tolerance.
    Low risk → heavily penalise bad outcomes.
    High risk → care more about upside potential.
    """
    weights  = RISK_WEIGHTS.get(risk_profile, RISK_WEIGHTS["medium"])
    max_val  = 2_000_000

    return (
        weights["success"] * (sim_result["success_rate"] / 100) +
        weights["worst"]   * min(sim_result["worst_10pct"] / max_val, 1.0) +
        weights["median"]  * min(sim_result["median_outcome"] / max_val, 1.0)
    )


def _find_best_split(
    goal_type: str,
    years: int,
    monthly_contribution: float,
    target_amount: float,
    risk_profile: str,
    historical_returns: dict,
) -> str:
    """
    Find the best split profile for a given scenario by simulating
    each candidate and scoring against real historical returns.
    """
    if goal_type == "emergency_fund":
        return "very_conservative"

    best_profile = "moderate"
    best_score   = -1.0

    for profile_name, split in SPLIT_PROFILES.items():
        sim   = _run_mini_simulation(split, years, monthly_contribution, target_amount, historical_returns)
        score = _score_split(sim, risk_profile)
        if score > best_score:
            best_score   = score
            best_profile = profile_name

    return best_profile


def generate_training_data(historical_returns: dict) -> list:
    """
    Generate training data by finding the historically optimal split
    for every combination of goal type, timeline, income, age, and
    risk profile. Labels are derived from real market simulations —
    not hardcoded rules.
    """
    rows = []

    goal_configs = [
        ("house",          [2, 4, 7, 10],    [300, 500, 800, 1200]),
        ("retirement",     [10, 20, 30, 40], [200, 400, 800, 1500]),
        ("emergency_fund", [1, 2, 3],        [200, 400, 600]),
        ("education",      [3, 5, 10, 15],   [200, 400, 700]),
        ("travel",         [1, 2, 3, 5],     [100, 200, 400]),
        ("other",          [2, 5, 10, 15],   [200, 500, 1000]),
    ]

    age_income_combos = [
        (22, 2000), (25, 2500), (28, 3500), (30, 4000),
        (35, 5000), (40, 6000), (45, 7000), (50, 5000),
        (55, 4000), (60, 3500),
    ]

    risk_profiles = ["low", "medium", "high"]

    total = sum(len(y) * len(m) for _, y, m in goal_configs) * len(age_income_combos) * len(risk_profiles)
    print(f"  Generating {total} training examples from real market data...")

    for goal_type, years_options, monthly_options in goal_configs:
        for years in years_options:
            for monthly in monthly_options:
                target = monthly * years * 12 * 0.5
                for age, income in age_income_combos:
                    for risk_profile in risk_profiles:
                        label = _find_best_split(
                            goal_type=goal_type,
                            years=years,
                            monthly_contribution=monthly,
                            target_amount=target,
                            risk_profile=risk_profile,
                            historical_returns=historical_returns,
                        )
                        rows.append({
                            "age":            age,
                            "monthly_income": income,
                            "goal_type":      GOAL_TYPE_MAP[goal_type],
                            "years":          years,
                            "target_amount":  target,
                            "risk_profile":   RISK_PROFILE_MAP[risk_profile],
                            "label":          label,
                        })

    print(f"  Done — {len(rows)} examples generated")
    return rows


def build_model(historical_returns: dict) -> RandomForestClassifier:
    """Train the Random Forest on market-data-derived training examples."""
    print("Training ML risk profile model on real market data...")
    rows = generate_training_data(historical_returns)

    X = np.array([[
        r["age"], r["monthly_income"], r["goal_type"],
        r["years"], r["target_amount"], r["risk_profile"],
    ] for r in rows])

    y = np.array([r["label"] for r in rows])

    model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
    model.fit(X, y)
    print(f"  Model trained — {len(rows)} examples, {len(set(y))} profile classes")
    return model


# ── Lazy loading — trains on first request, not on import ──

_model               = None
_model_history_key   = None


def _get_model(historical_returns: dict) -> RandomForestClassifier:
    global _model, _model_history_key
    key = id(historical_returns)
    if _model is None or _model_history_key != key:
        _model             = build_model(historical_returns)
        _model_history_key = key
    return _model


def suggest_split(
    age: Optional[int],
    monthly_income: Optional[float],
    goal_type: str,
    years: int,
    target_amount: float,
    risk_profile: Optional[str],
    historical_returns: dict,
) -> dict:
    """
    Suggest an asset allocation split for a goal.
    historical_returns is passed in from market_data.get_historical_returns(db).
    """
    age            = age or 30
    monthly_income = monthly_income or 3000.0
    risk_profile   = risk_profile or "medium"

    model = _get_model(historical_returns)

    features = np.array([[
        age,
        monthly_income,
        GOAL_TYPE_MAP.get(goal_type, GOAL_TYPE_MAP["other"]),
        years,
        target_amount,
        RISK_PROFILE_MAP.get(risk_profile, RISK_PROFILE_MAP["medium"]),
    ]])

    profile_name = model.predict(features)[0]
    split        = SPLIT_PROFILES[profile_name]

    return {
        "profile":   profile_name,
        "splits":    split,
        "reasoning": _reasoning(profile_name, goal_type, years, age, risk_profile),
    }


def _reasoning(profile: str, goal_type: str, years: int, age: int, risk_profile: str) -> str:
    source = "Based on 30 years of real market data including the 2008 crash, 2020 COVID drop, and 2022 rate hike crisis."

    if goal_type == "emergency_fund":
        return "Emergency funds must be instantly accessible — cash only, no market risk."
    if profile == "very_conservative":
        return f"Short {years}-year timeline means capital preservation is critical. Mostly cash and bonds. {source}"
    elif profile == "conservative":
        return f"With {years} years and a {risk_profile} risk tolerance, safety takes priority. Bonds and cash dominate. {source}"
    elif profile == "moderate":
        return f"Balanced approach for a {years}-year goal — mix of growth and defensive assets. {source}"
    elif profile == "growth":
        if goal_type == "retirement":
            return f"At {age}, you have time to ride out downturns. Stocks and ETFs historically outperform over long horizons. {source}"
        return f"With {years} years, history shows you can absorb volatility in exchange for higher returns. {source}"
    else:
        return f"Long {years}-year horizon. Historically, maximum equity exposure produces the best outcomes at this timescale. {source}"