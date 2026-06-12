import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api'

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

  const shortfall = goal.target_amount - sim.median_outcome
  const extraNeeded = shortfall > 0
    ? Math.ceil(shortfall / (goal.years * 12))
    : 0

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

  const goalsWithSims = data.goals.filter((g) => g.latest_simulation)

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
              const pct = (item.goal.monthly_allocation / data.total_monthly_allocation) * 100
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