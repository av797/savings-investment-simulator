import { useState } from 'react'
import api from '../api/client'

const fmt = (n) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP', maximumFractionDigits: 0
}).format(n)

const PROFILE_LABELS = {
  very_conservative: 'Very Conservative',
  conservative:      'Conservative',
  moderate:          'Moderate',
  growth:            'Growth',
  aggressive:        'Aggressive',
}

function SuccessRing({ rate }) {
  const color = rate >= 75 ? '#34d399' : rate >= 50 ? '#fbbf24' : '#f87171'
  const label = rate >= 75 ? 'On track' : rate >= 50 ? 'At risk' : 'Needs attention'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle
            cx="48" cy="48" r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - rate / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">{rate}%</span>
        </div>
      </div>
      <span className="text-xs mt-2 font-medium" style={{ color }}>{label}</span>
    </div>
  )
}

export default function GoalAnalysisCard({ goalId, latestSimSuccessRate }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const runAnalysis = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post(`/goals/${goalId}/analyse`)
      setAnalysis(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">AI Analysis</h3>
          <p className="text-sm text-gray-500">Personalised suggestions based on your goal</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-gray-950 font-semibold px-4 py-2 rounded-xl transition-colors text-sm flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              Analysing...
            </>
          ) : (
            <>✨ {analysis ? 'Re-analyse' : 'Analyse goal'}</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-8 text-gray-600 text-sm border border-dashed border-gray-800 rounded-xl">
          Run analysis to get AI-powered suggestions for improving this goal
        </div>
      )}

      {analysis && (
        <div className="space-y-5">

          <div className="flex items-center gap-6 p-4 bg-gray-800/40 rounded-xl">
            <SuccessRing rate={analysis.current_rate} />
            <div className="flex-1">
              <p className="text-white font-medium mb-1">Current success probability</p>
              <p className="text-gray-400 text-sm">
                {analysis.on_track
                  ? "Your goal is on track — keep it up."
                  : `You need to improve your plan to reliably hit ${fmt(analysis.median_outcome)} by your target date.`
                }
              </p>
              <div className="flex gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-500">Median outcome</p>
                  <p className="text-white font-semibold text-sm">{fmt(analysis.median_outcome)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Worst 10%</p>
                  <p className="text-red-400 font-semibold text-sm">{fmt(analysis.worst_10pct)}</p>
                </div>
              </div>
            </div>
          </div>

          {analysis.ai_suggestion && (
            <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">✨ AI Suggestion</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{analysis.ai_suggestion}</p>
            </div>
          )}

          {analysis.extra_monthly_needed != null && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium text-sm mb-1">Increase monthly contribution</p>
                  <p className="text-gray-400 text-xs">
                    Adding <span className="text-white font-semibold">{fmt(analysis.extra_monthly_needed)}/month</span> would
                    push your success rate to <span className="text-emerald-400 font-semibold">{analysis.rate_with_extra}%</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xs text-gray-500">New total</p>
                  <p className="text-emerald-400 font-bold">
                    {fmt(analysis.extra_monthly_needed + parseFloat(analysis.extra_monthly_needed))}
                  </p>
                </div>
              </div>
            </div>
          )}

          {analysis.split_suggestion && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <p className="text-white font-medium text-sm mb-2">
                Switch to a {PROFILE_LABELS[analysis.split_suggestion.profile]} allocation
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.entries(analysis.split_suggestion.splits)
                  .filter(([, pct]) => pct > 0)
                  .map(([ac, pct]) => (
                    <span key={ac} className="text-xs bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full border border-gray-600">
                      {ac} {pct}%
                    </span>
                  ))
                }
              </div>
              <p className="text-gray-400 text-xs">
                This allocation would improve your success rate by approximately{' '}
                <span className="text-emerald-400 font-semibold">+{analysis.split_suggestion.improvement}%</span>
                {' '}based on 30 years of real market data.
              </p>
            </div>
          )}

          {analysis.on_track && !analysis.split_suggestion && (
            <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4 text-center">
              <p className="text-emerald-400 font-medium mb-1">✓ Goal is well funded</p>
              <p className="text-gray-400 text-sm">
                Your current plan gives you a strong probability of success. Keep contributing consistently.
              </p>
            </div>
          )}

          <p className="text-gray-700 text-xs">
            Analysis based on 2,000 simulated scenarios using real historical market data.
            Not financial advice.
          </p>
        </div>
      )}
    </div>
  )
}