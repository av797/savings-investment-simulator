import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDashboard, deleteGoal } from '../api'
import { useAuth } from '../context/AuthContext'

const GOAL_ICONS = {
  house:          '🏠',
  retirement:     '👴',
  emergency_fund: '🛡️',
  education:      '🎓',
  travel:         '✈️',
  other:          '🎯',
}

const fmt = (n) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

function SuccessBadge({ rate }) {
  if (rate === null || rate === undefined) return <span className="text-gray-500 text-sm">No simulation</span>
  const color = rate >= 75 ? 'text-emerald-400' : rate >= 50 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-2xl font-bold ${color}`}>{rate}%</span>
}

function GoalCard({ item, onDelete, isWeakest }) {
  const { goal, latest_simulation, progress_pct } = item
  const navigate = useNavigate()

  return (
    <div
      className={`bg-gray-900 border rounded-2xl p-6 cursor-pointer hover:border-gray-600 transition-all ${
        isWeakest ? 'border-red-500/40' : 'border-gray-800'
      }`}
      onClick={() => navigate(`/goals/${goal.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{GOAL_ICONS[goal.goal_type] || '🎯'}</span>
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

      {/* Target + progress */}
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

      {/* Success rate */}
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

      {/* Splits preview */}
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}</p>
        </div>
        <Link
          to="/goals/new"
          className="bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          + New goal
        </Link>
      </div>

      {/* Summary stats */}
      {data && (
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

      {/* Goals grid */}
      {data?.goals?.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-gray-800 rounded-2xl">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-white font-semibold mb-2">No goals yet</h3>
          <p className="text-gray-500 mb-6">Create your first financial goal to get started</p>
          <Link
            to="/goals/new"
            className="bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Create a goal
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.goals.map((item) => (
            <GoalCard
              key={item.goal.id}
              item={item}
              isWeakest={item.goal.id === data.weakest_goal_id && data.goals.length > 1}
              onDelete={load}
            />
          ))}
        </div>
      )}

    </div>
  )
}