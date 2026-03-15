def run_simulation(starting_balance, monthly_contribution, expected_return, years, inflation_rate=0.0):
    """
    Returns nominal final value, inflation-adjusted final value,
    total contributions, and interest earned.
    expected_return and inflation_rate are decimals e.g. 0.07 = 7%
    """
    P = starting_balance
    PMT = monthly_contribution
    r = expected_return / 12  # monthly rate
    n = years * 12

    if r == 0:
        final_value = P + PMT * n
    else:
        final_value = P * (1 + r)**n + PMT * (((1 + r)**n - 1) / r)

    total_contributions = P + PMT * n
    interest_earned = final_value - total_contributions
    real_final_value = final_value / ((1 + inflation_rate) ** years) if inflation_rate > 0 else final_value

    return final_value, real_final_value, total_contributions, interest_earned


def run_simulation_yearly(starting_balance, monthly_contribution, expected_return, years, inflation_rate=0.0):
    """
    Returns a year-by-year breakdown including inflation-adjusted balances.
    expected_return and inflation_rate are decimals e.g. 0.07 = 7%
    """
    P = starting_balance
    PMT = monthly_contribution
    r = expected_return / 12
    breakdown = []
    balance = P

    for year in range(1, years + 1):
        for _ in range(12):
            balance = balance * (1 + r) + PMT

        total_contributions = P + PMT * (year * 12)
        interest_earned = balance - total_contributions
        real_balance = balance / ((1 + inflation_rate) ** year) if inflation_rate > 0 else balance

        breakdown.append({
            "year": year,
            "balance": round(balance, 2),
            "real_balance": round(real_balance, 2),
            "total_contributions": round(total_contributions, 2),
            "interest_earned": round(interest_earned, 2),
        })

    return breakdown


def calculate_score(starting_balance, monthly_contribution, expected_return, years, inflation_rate, monthly_income) -> int:
    score = 0

    # Return rate realism (25pts)
    if 0.05 <= expected_return <= 0.08:
        score += 25
    elif 0.08 < expected_return <= 0.12:
        score += 12

    # Savings rate (25pts)
    if monthly_income and monthly_income > 0:
        rate = monthly_contribution / monthly_income
        if rate >= 0.20:
            score += 25
        elif rate >= 0.10:
            score += 12
        else:
            score += 5

    # Time horizon (20pts)
    if years >= 25:
        score += 20
    elif years >= 15:
        score += 12
    elif years >= 10:
        score += 6

    # Inflation awareness (15pts)
    if inflation_rate and inflation_rate > 0:
        score += 15

    # Starting balance (15pts)
    if starting_balance >= 10000:
        score += 15
    elif starting_balance >= 1000:
        score += 8
    elif starting_balance > 0:
        score += 3

    return score