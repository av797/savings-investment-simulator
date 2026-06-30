const fmt = (n) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP', maximumFractionDigits: 0
}).format(n)


function findCrossingYear(yearlyBreakdown, targetAmount) {
  if (!yearlyBreakdown?.length) return null
  for (const row of yearlyBreakdown) {
    if (row.median_balance >= targetAmount) {
      return row.year
    }
  }
  return null
}

export default function RetirementProjection({ goal, userAge, latestSim }) {
  if (goal.goal_type !== 'retirement') return null
  if (!userAge) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-2">Retirement age projection</h3>
        <p className="text-sm text-gray-500">
          Add your age in{' '}
          <a href="/settings" className="text-emerald-400 hover:text-emerald-300">Settings</a>
          {' '}to see when you'll hit this target.
        </p>
      </div>
    )
  }

  if (!latestSim?.yearly_breakdown?.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-2">Retirement age projection</h3>
        <p className="text-sm text-gray-500">
          Run a simulation to see your projected retirement age based on real data.
        </p>
      </div>
    )
  }

  const crossingYear = findCrossingYear(latestSim.yearly_breakdown, goal.target_amount)
  const statedYear    = goal.years
  const statedAge     = userAge + statedYear

  if (crossingYear === null) {
    // Never crosses within simulated range
    const finalYear    = latestSim.yearly_breakdown[latestSim.yearly_breakdown.length - 1]
    const shortfall    = goal.target_amount - finalYear.median_balance

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-1">Retirement age projection</h3>
        <p className="text-sm text-gray-500 mb-5">Based on your latest simulation's median outcome</p>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
          <p className="text-red-400 font-medium text-sm mb-2">
            Won't reach target within your {statedYear}-year plan
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            At your current contribution rate, the median outcome falls{' '}
            <span className="text-white font-semibold">{fmt(shortfall)}</span> short of{' '}
            {fmt(goal.target_amount)} by age {statedAge}. Consider increasing your monthly
            allocation or extending your timeline.
          </p>
        </div>
      </div>
    )
  }

  const projectedAge = userAge + crossingYear
  const isEarly       = crossingYear < statedYear
  const isLate        = crossingYear > statedYear
  const isOnTime       = crossingYear === statedYear
  const yearDiff       = Math.abs(crossingYear - statedYear)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="font-semibold text-white mb-1">Retirement age projection</h3>
      <p className="text-sm text-gray-500 mb-5">Based on your latest simulation's median outcome</p>

      <div className={`rounded-xl p-5 ${
        isEarly ? 'bg-emerald-400/10 border border-emerald-400/20' :
        isLate  ? 'bg-yellow-500/10 border border-yellow-500/20' :
        'bg-gray-800/50 border border-gray-700'
      }`}>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-white">Age {projectedAge}</span>
          {!isOnTime && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isEarly ? 'text-emerald-400 bg-emerald-400/15' : 'text-yellow-400 bg-yellow-400/15'
            }`}>
              {isEarly ? `${yearDiff} year${yearDiff !== 1 ? 's' : ''} early` : `${yearDiff} year${yearDiff !== 1 ? 's' : ''} late`}
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          {isOnTime && (
            <>At your current rate, you're projected to reach {fmt(goal.target_amount)} right on schedule, in year {crossingYear}.</>
          )}
          {isEarly && (
            <>Your median outcome crosses {fmt(goal.target_amount)} in year {crossingYear} — ahead of your planned {statedYear}-year timeline.</>
          )}
          {isLate && (
            <>Your median outcome doesn't cross {fmt(goal.target_amount)} until year {crossingYear} — later than your planned {statedYear}-year timeline.</>
          )}
        </p>
      </div>

      <p className="text-gray-700 text-xs mt-4">
        Based on the median path from your last Monte Carlo simulation. Actual outcomes vary —
        this isn't a guarantee.
      </p>
    </div>
  )
}