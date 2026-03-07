def run_simulation(starting_balance, monthly_contribution, expected_return, years):
    """
    Calculate final value, total contributions, and interest earned.
    expected_return should be a decimal e.g. 0.07 for 7%
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

    return final_value, total_contributions, interest_earned


def run_simulation_yearly(starting_balance, monthly_contribution, expected_return, years):
    """
    Returns a year-by-year breakdown of the simulation.
    expected_return should be a decimal e.g. 0.07 for 7%
    """
    P = starting_balance
    PMT = monthly_contribution
    r = expected_return / 12  # monthly rate

    breakdown = []
    balance = P

    for year in range(1, years + 1):
        for _ in range(12):
            balance = balance * (1 + r) + PMT

        total_contributions = P + PMT * (year * 12)
        interest_earned = balance - total_contributions

        breakdown.append({
            "year": year,
            "balance": round(balance, 2),
            "total_contributions": round(total_contributions, 2),
            "interest_earned": round(interest_earned, 2),
        })

    return breakdown