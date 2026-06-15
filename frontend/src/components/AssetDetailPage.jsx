import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import api from '../api/client'

const ASSET_META = {
  stocks: { label: 'S&P 500',        color: '#60a5fa', emoji: '📈' },
  etfs:   { label: 'FTSE All-World', color: '#a78bfa', emoji: '🌍' },
  bonds:  { label: 'UK Gilts',       color: '#fbbf24', emoji: '🏦' },
  cash:   { label: 'Cash / Savings', color: '#9ca3af', emoji: '💰' },
}

const fmtPct    = (n) => n == null ? '—' : `${n > 0 ? '+' : ''}${Number(n).toFixed(2)}%`
const fmtPrice  = (n) => n == null ? '—' : Number(n).toLocaleString('en-GB', { maximumFractionDigits: 2 })
const fmtLarge  = (n) => {
  if (n == null) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString()}`
}

function CorrelationBar({ label, value, color }) {
  const pct    = ((value + 1) / 2) * 100
  const isPos  = value >= 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-xs w-24 flex-shrink-0">{ASSET_META[label]?.label || label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width:      `${Math.abs(value) * 100}%`,
            marginLeft: isPos ? '50%' : `${pct}%`,
            backgroundColor: isPos ? '#34d399' : '#f87171',
          }}
        />
      </div>
      <span className={`text-xs font-medium w-10 text-right ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
        {value.toFixed(2)}
      </span>
    </div>
  )
}

export default function AssetDetailPanel({ assetKey, onClose, summaryData }) {
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const meta    = ASSET_META[assetKey]
  const history = summaryData?.[assetKey]?.history || []

  useEffect(() => {
    if (!assetKey) return
    setLoading(true)
    setError('')
    setDetail(null)
    api.get(`/markets/detail/${assetKey}`)
      .then((res) => setDetail(res.data))
      .catch(() => setError('Failed to load asset detail'))
      .finally(() => setLoading(false))
  }, [assetKey])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <div
        className="fixed inset-0 bg-gray-950/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-gray-900 border-l border-gray-800 z-50 overflow-y-auto flex flex-col">

        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta?.emoji}</span>
            <div>
              <h2 className="text-white font-semibold">{meta?.label}</h2>
              <p className="text-gray-500 text-xs">{detail?.ticker || '...'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="m-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {detail && !loading && (
          <div className="flex-1 px-6 py-5 space-y-6">

            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-white">{fmtPrice(detail.price)}</p>
                <p className="text-gray-500 text-xs mt-0.5">{detail.currency} · {detail.exchange}</p>
              </div>
              {detail.change_pct != null && (
                <span className={`text-lg font-semibold ${detail.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtPct(detail.change_pct)} today
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Key stats</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '52w High',      value: fmtPrice(detail.week_52_high) },
                  { label: '52w Low',       value: fmtPrice(detail.week_52_low)  },
                  { label: 'P/E Ratio',     value: detail.pe_ratio   ? Number(detail.pe_ratio).toFixed(1)   : '—' },
                  { label: 'Forward P/E',   value: detail.forward_pe ? Number(detail.forward_pe).toFixed(1) : '—' },
                  { label: 'Market Cap',    value: fmtLarge(detail.market_cap)   },
                  { label: 'Beta',          value: detail.beta        ? Number(detail.beta).toFixed(2)        : '—' },
                  { label: 'YTD Return',    value: detail.ytd_return  ? fmtPct(detail.ytd_return * 100)      : '—' },
                  { label: 'Expense Ratio', value: detail.expense_ratio ? `${(detail.expense_ratio * 100).toFixed(2)}%` : '—' },
                  { label: 'Total Assets',  value: fmtLarge(detail.total_assets) },
                  { label: 'Yield',         value: detail.yield ? fmtPct(detail.yield * 100) : '—' },
                ].filter((s) => s.value !== '—').map((stat) => (
                  <div key={stat.label} className="bg-gray-800/60 rounded-xl p-3">
                    <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
                    <p className="text-white font-semibold text-sm">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div>
                <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Annual returns (30yr)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 10 }} interval={4} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip
                      formatter={(v) => [`${v.toFixed(2)}%`, 'Return']}
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <ReferenceLine y={0} stroke="#374151" />
                    <Bar dataKey="return_pct" fill={meta?.color} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {detail.top_holdings?.length > 0 && (
              <div>
                <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Top holdings</h3>
                <div className="space-y-2">
                  {detail.top_holdings.map((h, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-300 text-xs">{h.name}</span>
                          <span className="text-white text-xs font-medium">{h.weight.toFixed(2)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(h.weight * 4, 100)}%`, backgroundColor: meta?.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(detail.correlations || {}).length > 0 && (
              <div>
                <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Correlation with other assets</h3>
                <p className="text-gray-600 text-xs mb-3">Based on 30 years of annual returns. +1 = moves together, -1 = opposite.</p>
                <div className="space-y-3">
                  {Object.entries(detail.correlations).map(([ac, val]) => (
                    <CorrelationBar key={ac} label={ac} value={val} />
                  ))}
                </div>
              </div>
            )}

            {detail.description && detail.description.length < 600 && (
              <div>
                <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">About</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{detail.description}</p>
              </div>
            )}

            {detail.news?.length > 0 && (
              <div>
                <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Latest news</h3>
                <div className="space-y-2">
                  {detail.news.map((item, i) => (
                    item.title && (
                      <a
                        key={i}
                        href={item.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-xl p-3 transition-colors group"
                      >
                        <p className="text-gray-200 text-sm group-hover:text-white transition-colors leading-snug">
                          {item.title}
                        </p>
                        {item.publisher && (
                          <p className="text-gray-600 text-xs mt-1">{item.publisher}</p>
                        )}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-700 text-xs pb-4">
              Data via Yahoo Finance. For informational purposes only — not financial advice.
            </p>

          </div>
        )}
      </div>
    </>
  )
}