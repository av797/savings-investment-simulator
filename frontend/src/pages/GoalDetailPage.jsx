import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import {
  getGoal, setSplits, runSimulation, getSimulationHistory, deleteGoal
} from '../api'
import api from '../api/client'

const fmt = (n) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP', maximumFractionDigits: 0
}).format(n)

const ASSET_CLASSES = [
  { value: 'stocks', label: 'Stocks',  desc: 'S&P 500 — high risk, high return',       color: 'bg-blue-400' },
  { value: 'etfs',   label: 'ETFs',    desc: 'FTSE All-World — diversified, moderate',  color: 'bg-purple-400' },
  { value: 'bonds',  label: 'Bonds',   desc: 'UK Gilts — low risk, steady return',      color: 'bg-yellow-400' },
  { value: 'cash',   label: 'Cash',    desc: 'UK savings rate — very low risk',         color: 'bg-gray-400' },
]

function SplitEditor({ goalId, initialSplits, onSaved }) {
  const [splits, setSplitsState] = useState(
    initialSplits.length > 0
      ? initialSplits.reduce((acc, s) => ({ ...acc, [s.asset_class]: s.percentage }), {})
      : { stocks: 60, bonds: 20, cash: 20, etfs: 0 }
  )
  const [saving, setSaving]         = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [error, setError]           = useState('')

  const total = Object.values(splits).reduce((a, b) => a + Number(b), 0)

  const handleChange = (asset, value) => {
    setSplitsState({ ...splits, [asset]: Number(value) })
    setError('')
    setSuggestion(null)
  }

  const handleSuggest = async () => {
    setSuggesting(true)
    setError('')
    try {
      const res = await api.post(`/goals/${goalId}/suggest-split`)
      const { splits: suggested, profile, reasoning } = res.data
      // Apply suggested splits to sliders
      setSplitsState({
        stocks: suggested.stocks || 0,
        etfs:   suggested.etfs   || 0,
        bonds:  suggested.bonds  || 0,
        cash:   suggested.cash   || 0,
      })
      setSuggestion({ profile, reasoning })
    } catch (err) {
      setError('Could not get suggestion')
    } finally {
      setSuggesting(false)
    }
  }

  const handleSave = async () => {
    if (Math.abs(total - 100) > 0.01) {
      setError(`Percentages must sum to 100. Currently: ${total}%`)
      return
    }
    setSaving(true)
    try {
      const splitsArray = Object.entries(splits)
        .filter(([, pct]) => pct > 0)
        .map(([asset_class, percentage]) => ({ asset_class, percentage }))
      await setSplits(goalId, splitsArray)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save splits')
    } finally {
      setSaving(false)
    }
  }

  const profileLabels = {
    very_conservative: 'Very Conservative',
    conservative:      'Conservative',
    moderate:          'Moderate',
    growth:            'Growth',
    aggressive:        'Aggressive',
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-white">Asset allocation</h3>
        <button
          onClick={handleSuggest}
          disabled={suggesting}
          className="text-xs bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/30 text-emerald-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {suggesting ? 'Thinking...' : '✨ AI suggestion'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-5">How to invest each month toward this goal</p>

      {suggestion && (
        <div className="mb-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
              {profileLabels[suggestion.profile]} profile
            </span>
          </div>
          <p className="text-xs text-gray-400">{suggestion.reasoning}</p>
          <p className="text-xs text-gray-500 mt-1">Sliders updated — adjust if needed, then save.</p>
        </div>
      )}

      <div className="space-y-4">
        {ASSET_CLASSES.map((asset) => (
          <div key={asset.value}>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-white text-sm font-medium">{asset.label}</span>
                <span className="text-gray-500 text-xs ml-2">{asset.desc}</span>
              </div>
              <span className="text-emerald-400 font-semibold text-sm w-12 text-right">
                {splits[asset.value] || 0}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={splits[asset.value] || 0}
              onChange={(e) => handleChange(asset.value, e.target.value)}
              className="w-full accent-emerald-400"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-800">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Total allocated</span>
          <span className={total === 100 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
            {total}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${total > 100 ? 'bg-red-400' : 'bg-emerald-400'}`}
            style={{ width: `${Math.min(total, 100)}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || total !== 100}
        className="mt-4 w-full bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-gray-950 font-semibold rounded-xl py-2.5 transition-colors text-sm"
      >
        {saving ? 'Saving...' : 'Save allocation'}
      </button>
    </div>
  )
}

function FanChart({ breakdown, target }) {
  if (!breakdown || breakdown.length === 0) return null

  const data = breakdown.map((d) => ({
    year:          `Year ${d.year}`,
    p10:           Math.round(d.p10_balance),
    median:        Math.round(d.median_balance),
    p90:           Math.round(d.p90_balance),
    contributions: Math.round(d.contributions),
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm">
        <p className="text-gray-400 mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex justify-between gap-6">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="text-white font-medium">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="p90grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="p10grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f87171" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} tick={{ fill: '#6b7280', fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={target} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: 'Target', fill: '#fbbf24', fontSize: 11 }} />
        <Area type="monotone" dataKey="p90"          name="Best 10%"      stroke="#34d399" fill="url(#p90grad)" strokeWidth={1.5} />
        <Area type="monotone" dataKey="median"       name="Median"        stroke="#60a5fa" fill="none"          strokeWidth={2} />
        <Area type="monotone" dataKey="p10"          name="Worst 10%"     stroke="#f87171" fill="url(#p10grad)" strokeWidth={1.5} />
        <Area type="monotone" dataKey="contributions" name="Contributions" stroke="#6b7280" fill="none" strokeDasharray="3 3" strokeWidth={1} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function GoalDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [goal, setGoal]               = useState(null)
  const [simHistory, setSimHistory]   = useState([])
  const [latestSim, setLatestSim]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [simLoading, setSimLoading]   = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [error, setError]             = useState('')

  const load = async () => {
    try {
      const [goalRes, histRes] = await Promise.all([
        getGoal(id),
        getSimulationHistory(id),
      ])
      setGoal(goalRes.data)
      setSimHistory(histRes.data)
      if (histRes.data.length > 0) setLatestSim(histRes.data[0])
    } catch {
      setError('Failed to load goal')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleSimulate = async () => {
    setSimLoading(true)
    setError('')
    try {
      const res = await runSimulation(id)
      setLatestSim(res.data)
      
      const histRes = await getSimulationHistory(id)
      setSimHistory(histRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Simulation failed')
    } finally {
      setSimLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${goal.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteGoal(id)
      navigate('/dashboard')
    } catch {
      setError('Failed to delete goal')
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error && !goal) return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-red-400">{error}</div>
  )

  const successColor = latestSim
    ? latestSim.success_rate >= 75 ? 'text-emerald-400'
    : latestSim.success_rate >= 50 ? 'text-yellow-400'
    : 'text-red-400'
    : 'text-gray-500'

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      <div className="flex items-start justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white text-sm transition-colors mb-3 flex items-center gap-1"
          >
            ← Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">{goal.name}</h1>
          <p className="text-gray-400 mt-1">
            {fmt(goal.target_amount)} target · {goal.years} years · {fmt(goal.monthly_allocation)}/month
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-gray-500 hover:text-red-400 transition-colors"
        >
          {deleting ? 'Deleting...' : 'Delete goal'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="space-y-6">

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Goal summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Target',       value: fmt(goal.target_amount) },
                { label: 'Saved so far', value: fmt(goal.current_balance) },
                { label: 'Monthly',      value: fmt(goal.monthly_allocation) },
                { label: 'Timeline',     value: `${goal.years} years` },
                { label: 'Inflation',    value: `${(goal.inflation_rate * 100).toFixed(1)}%` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-gray-500 text-sm">{row.label}</span>
                  <span className="text-white text-sm font-medium">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Progress</span>
                <span>{Math.min(((goal.current_balance / goal.target_amount) * 100), 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${Math.min((goal.current_balance / goal.target_amount) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <SplitEditor
            goalId={id}
            initialSplits={goal.splits || []}
            onSaved={load}
          />

        </div>

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-white">Monte Carlo simulation</h3>
                <p className="text-sm text-gray-500">10,000 scenarios using real market data</p>
              </div>
              <button
                onClick={handleSimulate}
                disabled={simLoading || !goal.splits?.length}
                className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-gray-950 font-semibold px-5 py-2 rounded-xl transition-colors text-sm"
              >
                {simLoading ? 'Running...' : 'Run simulation'}
              </button>
            </div>

            {!goal.splits?.length && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Set your asset allocation first, then run a simulation
              </div>
            )}

            {latestSim && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Success rate',   value: `${latestSim.success_rate}%`,  color: successColor },
                    { label: 'Median outcome', value: fmt(latestSim.median_outcome), color: 'text-white' },
                    { label: 'Worst 10%',      value: fmt(latestSim.worst_10pct),    color: 'text-red-400' },
                    { label: 'Best 10%',       value: fmt(latestSim.best_10pct),     color: 'text-emerald-400' },
                  ].map((m) => (
                    <div key={m.label} className="bg-gray-800/50 rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                      <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <FanChart
                  breakdown={latestSim.yearly_breakdown || []}
                  target={goal.target_amount}
                />
              </>
            )}

            {error && (
              <div className="mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {simHistory.length > 1 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Simulation history</h3>
              <div className="space-y-2">
                {simHistory.map((sim) => (
                  <div key={sim.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="text-sm text-gray-400">
                      {new Date(sim.run_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={
                        sim.success_rate >= 75 ? 'text-emerald-400' :
                        sim.success_rate >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }>
                        {sim.success_rate}% success
                      </span>
                      <span className="text-gray-500">{fmt(sim.median_outcome)} median</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}