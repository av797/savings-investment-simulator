import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api'
import api from '../api/client'

const fmt = (n) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP', maximumFractionDigits: 0
}).format(n)

const GOAL_ICONS = {
  house: '🏠', retirement: '👴', emergency_fund: '🛡️',
  education: '🎓', travel: '✈️', other: '🎯',
}

function RiskWarning({ goal, sim }) {
  if (!sim) return null
  if (sim.success_rate >= 75) return null
  const shortfall   = goal.target_amount - sim.median_outcome
  const extraNeeded = shortfall > 0 ? Math.ceil(shortfall / (goal.years * 12)) : 0
  return (
    <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
      <div className="flex items-start gap-2">
        <span>⚠️</span>
        <div className="text-sm">
          <p className="text-yellow-400 font-medium mb-1">
            {sim.success_rate < 50 ? 'High risk of shortfall' : 'Moderate risk of shortfall'}
          </p>
          <p className="text-gray-400">
            {sim.success_rate}% chance of reaching {fmt(goal.target_amount)}.
            {extraNeeded > 0 && ` Consider increasing monthly allocation by ~${fmt(extraNeeded)} to improve odds.`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Combined contribution schedule ──

function buildCombinedSchedule(goalSchedules) {
  // goalSchedules: [{ goalId, goalName, data: { schedule: [...] } }]
  const maxYears = Math.max(...goalSchedules.map((g) => g.data.schedule.length))
  const baseCalendarYear = goalSchedules[0]?.data.schedule[0]?.calendar_year ?? new Date().getFullYear()

  const rows = []
  for (let yearIdx = 0; yearIdx < maxYears; yearIdx++) {
    const perGoal = goalSchedules.map((g) => {
      const row = g.data.schedule[yearIdx]
      return {
        goalId:   g.goalId,
        goalName: g.goalName,
        active:   !!row,
        required: row ? row.required_monthly : 0,
        current:  row ? row.current_monthly  : 0,
        status:   row ? row.status : null,
      }
    })

    const totalRequired = perGoal.reduce((sum, g) => sum + g.required, 0)
    const totalCurrent  = perGoal.reduce((sum, g) => sum + g.current, 0)
    const totalGap      = totalRequired - totalCurrent

    rows.push({
      year:         yearIdx + 1,
      calendarYear: baseCalendarYear + yearIdx,
      perGoal,
      totalRequired,
      totalCurrent,
      totalGap,
      status: totalGap <= 0 ? 'on_track' : totalGap <= 150 ? 'underfunding' : 'at_risk',
    })
  }
  return rows
}

function TotalStatusPill({ status, gap }) {
  if (status === 'on_track') return (
    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
      On track
    </span>
  )
  if (status === 'underfunding') return (
    <span className="text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">
      +{fmt(gap)} needed
    </span>
  )
  return (
    <span className="text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">
      +{fmt(gap)} needed
    </span>
  )
}

function CombinedContributionSchedule({ eligibleGoals }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [combined, setCombined] = useState(null)
  const [goalSchedules, setGoalSchedules] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.all(
        eligibleGoals.map((item) =>
          api.get(`/goals/${item.goal.id}/contribution-schedule`)
            .then((res) => ({ goalId: item.goal.id, goalName: item.goal.name, data: res.data }))
        )
      )
      setGoalSchedules(results)
      setCombined(buildCombinedSchedule(results))
    } catch {
      setError('Failed to load combined schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (!open && !combined) load()
    setOpen(!open)
  }

  const downloadCSV = () => {
    if (!combined || !goalSchedules) return

    const goalNames = goalSchedules.map((g) => g.goalName)
    const headers = [
      'Year', 'Calendar Year',
      ...goalNames.flatMap((name) => [`${name} Required (£)`, `${name} Current (£)`]),
      'Total Required (£)', 'Total Current (£)', 'Combined Gap (£)', 'Status',
    ]

    const rows = combined.map((row) => {
      const perGoalCells = row.perGoal.flatMap((g) => [
        g.active ? g.required.toFixed(2) : '',
        g.active ? g.current.toFixed(2) : '',
      ])
      return [
        row.year,
        row.calendarYear,
        ...perGoalCells,
        row.totalRequired.toFixed(2),
        row.totalCurrent.toFixed(2),
        row.totalGap.toFixed(2),
        row.status === 'on_track' ? 'On track' : row.status === 'underfunding' ? 'Underfunding' : 'At risk',
      ]
    })

    const csv  = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `goaliq_combined_plan_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!eligibleGoals.length) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-8">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-800/30 transition-colors"
      >
        <div className="text-left">
          <h2 className="font-semibold text-white">Combined contribution schedule</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            What you need across all goals, year by year
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {combined && goalSchedules && (
            <>
              <div className="flex items-center justify-end mb-4">
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-400/10 px-3 py-1.5 rounded-lg"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Year</th>
                      {goalSchedules.map((g) => (
                        <th key={g.goalId} className="text-right text-xs text-gray-500 font-medium pb-2 pr-4">
                          {g.goalName}
                        </th>
                      ))}
                      <th className="text-right text-xs text-gray-400 font-semibold pb-2 pr-4">Total required</th>
                      <th className="text-left text-xs text-gray-500 font-medium pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combined.map((row) => (
                      <tr key={row.year} className="border-b border-gray-800/50 last:border-0">
                        <td className="py-2.5 pr-4">
                          <span className="text-white font-medium">{row.calendarYear}</span>
                          <span className="text-gray-600 text-xs ml-1">yr {row.year}</span>
                        </td>
                        {row.perGoal.map((g) => (
                          <td key={g.goalId} className="py-2.5 pr-4 text-right">
                            {g.active ? (
                              <span className={
                                g.required > g.current ? 'text-yellow-400' : 'text-gray-400'
                              }>
                                {fmt(g.required)}/mo
                              </span>
                            ) : (
                              <span className="text-gray-700">—</span>
                            )}
                          </td>
                        ))}
                        <td className="py-2.5 pr-4 text-right font-semibold text-white">
                          {fmt(row.totalRequired)}/mo
                        </td>
                        <td className="py-2.5">
                          <TotalStatusPill status={row.status} gap={row.totalGap} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-gray-700 text-xs mt-4">
                Required monthly per goal calculated using each goal's blended historical return. Goals marked "—" have already reached the end of their timeline. Not a guarantee.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReportPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-red-400">{error}</div>
  )

  if (!data?.goals?.length) return (
    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
      <div className="text-4xl mb-4">📊</div>
      <h3 className="text-white font-semibold mb-2">No goals yet</h3>
      <p className="text-gray-500 mb-6">Create some goals and run simulations to see your report</p>
      <Link to="/goals/new" className="bg-emerald-400 text-gray-950 font-semibold px-6 py-2.5 rounded-xl text-sm">
        Create a goal
      </Link>
    </div>
  )

  const goalsWithSims  = data.goals.filter((g) => g.latest_simulation)
  const eligibleGoals  = data.goals.filter((g) => g.goal.splits?.length > 0)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">Financial plan report</h1>
        <p className="text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
        <h2 className="font-semibold text-white mb-5">Overall status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total monthly saving', value: fmt(data.total_monthly_allocation) },
            { label: 'Combined target',      value: fmt(data.total_target) },
            { label: 'Total saved so far',   value: fmt(data.total_current_balance) },
            {
              label: 'Overall confidence',
              value: data.overall_confidence !== null ? `${data.overall_confidence}%` : '—',
              highlight: true,
            },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.highlight ? 'text-emerald-400' : 'text-white'}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-sm text-gray-400 mb-2">Monthly budget allocation</div>
          <div className="flex rounded-full overflow-hidden h-3">
            {data.goals.map((item, i) => {
              const pct    = (item.goal.monthly_allocation / data.total_monthly_allocation) * 100
              const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-purple-400', 'bg-yellow-400', 'bg-red-400']
              return (
                <div
                  key={item.goal.id}
                  className={`${colors[i % colors.length]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${item.goal.name}: ${fmt(item.goal.monthly_allocation)}/mo`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {data.goals.map((item, i) => {
              const colors = ['text-emerald-400', 'text-blue-400', 'text-purple-400', 'text-yellow-400', 'text-red-400']
              return (
                <div key={item.goal.id} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className={`font-bold ${colors[i % colors.length]}`}>■</span>
                  {item.goal.name} — {fmt(item.goal.monthly_allocation)}/mo
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {data.weakest_goal_id && goalsWithSims.length > 0 && (() => {
        const weakest = data.goals.find((g) => g.goal.id === data.weakest_goal_id)
        if (!weakest || weakest.latest_simulation?.success_rate >= 75) return null
        return (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="text-red-400 font-semibold mb-1">Attention needed</p>
                <p className="text-gray-400 text-sm">
                  Your <strong className="text-white">{weakest.goal.name}</strong> goal has the lowest
                  success probability at <strong className="text-red-400">{weakest.latest_simulation?.success_rate}%</strong>.
                  Consider increasing your monthly allocation or adjusting your asset split.
                </p>
                <Link
                  to={`/goals/${data.weakest_goal_id}`}
                  className="inline-block mt-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Review this goal →
                </Link>
              </div>
            </div>
          </div>
        )
      })()}

      <CombinedContributionSchedule eligibleGoals={eligibleGoals} />

      <div className="space-y-6">
        <h2 className="font-semibold text-white">Goal breakdown</h2>

        {data.goals.map((item) => {
          const { goal, latest_simulation, progress_pct } = item
          const sim = latest_simulation

          return (
            <div key={goal.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{GOAL_ICONS[goal.goal_type] || '🎯'}</span>
                  <div>
                    <h3 className="font-semibold text-white">{goal.name}</h3>
                    <p className="text-sm text-gray-500">
                      {goal.years} year target · {fmt(goal.monthly_allocation)}/month
                    </p>
                  </div>
                </div>
                <Link
                  to={`/goals/${goal.id}`}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Edit →
                </Link>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-400">Progress toward {fmt(goal.target_amount)}</span>
                  <span className="text-white">{fmt(goal.current_balance)} ({progress_pct}%)</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${Math.min(progress_pct, 100)}%` }}
                  />
                </div>
              </div>

              {goal.splits?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {goal.splits.map((s) => (
                    <span key={s.asset_class} className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full border border-gray-700">
                      {s.asset_class} {s.percentage}%
                    </span>
                  ))}
                </div>
              )}

              {sim ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Success rate',   value: `${sim.success_rate}%`,  color: sim.success_rate >= 75 ? 'text-emerald-400' : sim.success_rate >= 50 ? 'text-yellow-400' : 'text-red-400' },
                    { label: 'Median outcome', value: fmt(sim.median_outcome), color: 'text-white' },
                    { label: 'Worst 10%',      value: fmt(sim.worst_10pct),    color: 'text-red-400' },
                    { label: 'Best 10%',       value: fmt(sim.best_10pct),     color: 'text-emerald-400' },
                  ].map((m) => (
                    <div key={m.label} className="bg-gray-800/50 rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                      <div className={`text-base font-bold ${m.color}`}>{m.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-800/30 rounded-xl p-3 text-center">
                  No simulation run yet —{' '}
                  <Link to={`/goals/${goal.id}`} className="text-emerald-400 hover:text-emerald-300">
                    run one now
                  </Link>
                </div>
              )}

              <RiskWarning goal={goal} sim={sim} />
            </div>
          )
        })}
      </div>

      <div className="mt-10 p-5 border border-gray-800 rounded-2xl text-xs text-gray-600 leading-relaxed">
        <strong className="text-gray-500">Disclaimer:</strong> All simulations are based on historical market data
        and Monte Carlo modelling. Past performance does not guarantee future results. Nothing on this platform
        constitutes financial advice. Always consult a qualified financial advisor before making investment decisions.
      </div>

    </div>
  )
}