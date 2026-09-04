import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDashboard } from '../api'
import { useAuth } from '../context/AuthContext'
import GoalIcon from '../components/GoalIcon'

const fmt = (n) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

function SuccessBadge({ rate }) {
  if (rate === null || rate === undefined) return <span className="text-gray-500 text-sm">No simulation</span>
  const color = rate >= 75 ? 'text-emerald-400' : rate >= 50 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-2xl font-bold ${color}`}>{rate}%</span>
}

function GoalCard({ item, isWeakest }) {
  const { goal, latest_simulation, progress_pct } = item
  const navigate = useNavigate()

  return (
    <div
      className={`bg-gray-900 border rounded-2xl p-6 cursor-pointer hover:border-gray-600 transition-all ${
        isWeakest ? 'border-red-500/40' : 'border-gray-800'
      }`}
      onClick={() => navigate(`/goals/${goal.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 flex-shrink-0">
            <GoalIcon type={goal.goal_type} className="w-[18px] h-[18px]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{goal.name}</h3>
            <p className="text-sm text-gray-500">{goal.years} year{goal.years !== 1 ? 's' : ''} · {fmt(goal.monthly_allocation)}/mo</p>
          </div>
        </div>
        {isWeakest && (
          <span className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-1 rounded-full">
            Needs attention
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-white">{fmt(goal.current_balance)} <span className="text-gray-500">of {fmt(goal.target_amount)}</span></span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all"
            style={{ width: `${Math.min(progress_pct, 100)}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-500 mt-1">{progress_pct}%</div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <div>
          <div className="text-xs text-gray-500 mb-1">Success probability</div>
          <SuccessBadge rate={latest_simulation?.success_rate} />
        </div>
        {latest_simulation && (
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Median outcome</div>
            <div className="text-white font-semibold">{fmt(latest_simulation.median_outcome)}</div>
          </div>
        )}
      </div>

      {goal.splits?.length > 0 && (
        <div className="flex gap-1 mt-4">
          {goal.splits.map((s) => (
            <div
              key={s.asset_class}
              className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full"
            >
              {s.asset_class} {s.percentage}%
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OnboardingChecklist({ hasGoals, hasSimulation }) {
  const steps = [
    { label: 'Account created', done: true },
    { label: 'Create your first goal', done: hasGoals },
    { label: 'Run your first simulation', done: hasSimulation },
  ]
  const completed = steps.filter((s) => s.done).length
  const allDone = completed === steps.length

  if (allDone) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">Getting started</p>
        <p className="text-xs text-gray-500">{completed}/{steps.length}</p>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              step.done ? 'bg-emerald-400 text-gray-950' : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}>
              {step.done ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-[10px] font-bold">{i + 1}</span>
              )}
            </div>
            <span className={`text-sm ${step.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OnboardingWalkthrough() {
  const steps = [
    {
      num:    '1',
      title:  'Set a goal',
      desc:   'Pick what you\'re saving for — a house, retirement, an emergency fund, anything with a number and a timeline.',
      cta:    'Create a goal',
      to:     '/goals/new',
      accent: 'emerald',
    },
    {
      num:    '2',
      title:  'Choose how to invest',
      desc:   'Split your monthly contribution across stocks, ETFs, bonds, and cash. We\'s suggest a mix based on your timeline.',
      cta:    null,
      to:     null,
      accent: 'blue',
    },
    {
      num:    '3',
      title:  'Run a simulation',
      desc:   'We\'ll run 10,000 scenarios using 30 years of real market data, including the crash years, so you see realistic ranges, not best-case guesses.',
      cta:    null,
      to:     null,
      accent: 'blue',
    },
  ]

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 rounded-2xl p-8 md:p-10">
      <div className="max-w-2xl mb-10">
        <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-3">Welcome to GoalIQ</p>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
          Plan a financial goal in three steps
        </h2>
        <p className="text-gray-400 leading-relaxed">
          GoalIQ runs thousands of simulations using real historical market data so you can see the realistic range of outcomes — not just an optimistic single number.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step) => {
          const colors = {
            emerald: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
            blue:    'bg-blue-400/10 text-blue-400 border-blue-400/20',
          }
          return (
            <div key={step.num} className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold mb-4 ${colors[step.accent]}`}>
                {step.num}
              </div>
              <h3 className="text-white font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{step.desc}</p>
              {step.cta && step.to && (
                <Link
                  to={step.to}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {step.cta}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const { user }              = useAuth()

  const load = async () => {
    try {
      const res = await getDashboard()
      setData(res.data)
    } catch {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-red-400">{error}</div>
  )

  const hasGoals      = (data?.goals?.length ?? 0) > 0
  const hasSimulation = data?.goals?.some((g) => g.latest_simulation !== null) ?? false

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}</p>
        </div>
        {hasGoals && (
          <Link
            to="/goals/new"
            className="bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            + New goal
          </Link>
        )}
      </div>

      <OnboardingChecklist hasGoals={hasGoals} hasSimulation={hasSimulation} />

      {data && hasGoals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total monthly', value: `£${data.total_monthly_allocation.toLocaleString()}` },
            { label: 'Total target', value: fmt(data.total_target) },
            { label: 'Total saved', value: fmt(data.total_current_balance) },
            {
              label: 'Overall confidence',
              value: data.overall_confidence !== null ? `${data.overall_confidence}%` : '—',
              highlight: true,
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.highlight ? 'text-emerald-400' : 'text-white'}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasGoals ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.goals.map((item) => (
            <GoalCard
              key={item.goal.id}
              item={item}
              isWeakest={item.goal.id === data.weakest_goal_id && data.goals.length > 1}
            />
          ))}
        </div>
      ) : (
        <OnboardingWalkthrough />
      )}

    </div>
  )
}