import { useState, useEffect, useRef, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import api from '../api/client'

const fmt = (n) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP', maximumFractionDigits: 0
}).format(n)

function DeltaBadge({ base, current }) {
  if (base === null || base === undefined || current === null || current === undefined) return null
  const delta = current - base
  const pct   = base !== 0 ? ((delta / Math.abs(base)) * 100) : 0
  const pos   = delta >= 0
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 ${
      pos ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'
    }`}>
      {pos ? '+' : ''}{fmt(delta)} ({pct >= 0 ? '+' : ''}{pct.toFixed(0)}%)
    </span>
  )
}

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

export default function WhatIfSandbox({ goalId, goal, splits }) {
  const baseMonthly = parseFloat(goal.monthly_allocation)
  const baseYears   = goal.years

  const [extraMonthly, setExtraMonthly] = useState(0)
  const [extraYears,   setExtraYears]   = useState(0)
  const [result,       setResult]       = useState(null)
  const [baseResult,   setBaseResult]   = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  const debounceRef = useRef(null)

  const fetchWhatIf = useCallback(async (extraM, extraY) => {
    setError('')
    try {
      const res = await api.post(`/goals/${goalId}/whatif`, {
        extra_monthly: extraM,
        extra_years:   extraY,
      })
      return res.data
    } catch (err) {
      setError(err.response?.data?.detail || 'Simulation failed')
      return null
    }
  }, [goalId])

  useEffect(() => {
    fetchWhatIf(0, 0).then((data) => {
      if (data) {
        setBaseResult(data)
        setResult(data)
      }
      setLoading(false)
    })
  }, [fetchWhatIf])

  useEffect(() => {
    if (extraMonthly === 0 && extraYears === 0) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const data = await fetchWhatIf(extraMonthly, extraYears)
      if (data) setResult(data)
    }, 80)
    return () => clearTimeout(debounceRef.current)
  }, [extraMonthly, extraYears, fetchWhatIf])

  const isChanged = extraMonthly !== 0 || extraYears !== 0
  const chartData = (result?.yearly_breakdown || []).map((d) => ({
    year:          `Yr ${d.year}`,
    p10:           Math.round(d.p10),
    median:        Math.round(d.median),
    p90:           Math.round(d.p90),
    contributions: Math.round(d.contributions),
  }))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="font-semibold text-white">What-if sandbox</h3>
          <p className="text-sm text-gray-500">
            Uses the same bootstrap simulation as your saved runs — just not recorded
          </p>
        </div>
        {isChanged && (
          <button
            onClick={() => { setExtraMonthly(0); setExtraYears(0); setResult(baseResult) }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 ml-4"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-5 mt-6 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Monthly contribution</label>
            <div className="flex items-center">
              <span className="text-white font-semibold text-sm">
                {fmt(baseMonthly + extraMonthly)}/mo
              </span>
              {extraMonthly !== 0 && (
                <span className={`text-xs ml-2 ${extraMonthly > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {extraMonthly > 0 ? '+' : ''}{fmt(extraMonthly)}
                </span>
              )}
            </div>
          </div>
          <input
            type="range"
            min={-Math.min(baseMonthly - 50, 500)}
            max={2000}
            step={50}
            value={extraMonthly}
            onChange={(e) => setExtraMonthly(Number(e.target.value))}
            className="w-full accent-emerald-400"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{fmt(Math.max(50, baseMonthly - 500))}/mo</span>
            <span className="text-gray-700">{fmt(baseMonthly)}/mo current</span>
            <span>{fmt(baseMonthly + 2000)}/mo</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Time horizon</label>
            <div className="flex items-center">
              <span className="text-white font-semibold text-sm">
                {baseYears + extraYears} year{(baseYears + extraYears) !== 1 ? 's' : ''}
              </span>
              {extraYears !== 0 && (
                <span className={`text-xs ml-2 ${extraYears > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {extraYears > 0 ? '+' : ''}{extraYears}yr
                </span>
              )}
            </div>
          </div>
          <input
            type="range"
            min={-Math.min(baseYears - 1, 5)}
            max={20}
            step={1}
            value={extraYears}
            onChange={(e) => setExtraYears(Number(e.target.value))}
            className="w-full accent-emerald-400"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{Math.max(1, baseYears - 5)}yr</span>
            <span className="text-gray-700">{baseYears}yr current</span>
            <span>{baseYears + 20}yr</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {result && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              {
                label:    'Success rate',
                value:    `${result.success_rate}%`,
                rawValue: result.success_rate,
                rawBase:  baseResult?.success_rate,
                color:    result.success_rate >= 75 ? 'text-emerald-400' : result.success_rate >= 50 ? 'text-yellow-400' : 'text-red-400',
                isRate:   true,
              },
              {
                label:    'Median outcome',
                value:    fmt(result.median_outcome),
                rawValue: result.median_outcome,
                rawBase:  baseResult?.median_outcome,
                color:    'text-white',
              },
              {
                label:    'Worst 10%',
                value:    fmt(result.worst_10pct),
                rawValue: result.worst_10pct,
                rawBase:  baseResult?.worst_10pct,
                color:    'text-red-400',
              },
              {
                label:    'Best 10%',
                value:    fmt(result.best_10pct),
                rawValue: result.best_10pct,
                rawBase:  baseResult?.best_10pct,
                color:    'text-emerald-400',
              },
            ].map((m) => (
              <div key={m.label} className="bg-gray-800/50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                <div className={`text-base font-bold ${m.color}`}>{m.value}</div>
                {isChanged && baseResult && (
                  m.isRate ? (
                    <span className={`text-xs font-medium ${
                      m.rawValue - m.rawBase >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {m.rawValue - m.rawBase >= 0 ? '+' : ''}{(m.rawValue - m.rawBase).toFixed(1)}%
                    </span>
                  ) : (
                    <DeltaBadge base={m.rawBase} current={m.rawValue} />
                  )
                )}
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="wif-p90" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wif-p10" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f87171" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={parseFloat(goal.target_amount)}
                  stroke="#fbbf24"
                  strokeDasharray="4 4"
                  label={{ value: 'Target', fill: '#fbbf24', fontSize: 10 }}
                />
                <Area type="monotone" dataKey="p90"           name="Best 10%"      stroke="#34d399" fill="url(#wif-p90)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="median"        name="Median"        stroke="#60a5fa" fill="none"          strokeWidth={2}   dot={false} />
                <Area type="monotone" dataKey="p10"           name="Worst 10%"     stroke="#f87171" fill="url(#wif-p10)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="contributions" name="Contributions" stroke="#4b5563" fill="none" strokeDasharray="3 3" strokeWidth={1} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </>
      )}

      <p className="text-gray-700 text-xs mt-4">
        2,000 scenarios · bootstrap resampling from 30 years of real returns · not saved to history
      </p>
    </div>
  )
}