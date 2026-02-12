def run_simulation(starting_balance, monthly_contribution, expected_return, years):
    """
    Calculate final value, total contributions, and interest earned
    """
    P = starting_balance
    PMT = monthly_contribution
    r = expected_return / 100 / 12
    n = years * 12

    if r == 0:
        final_value = P + PMT * n
    else:
        final_value = P * (1 + r)**n + PMT * (((1 + r)**n - 1) / r)

    total_contributions = P + PMT * n
    interest_earned = final_value - total_contributions

    return final_value, total_contributions, interest_earned
