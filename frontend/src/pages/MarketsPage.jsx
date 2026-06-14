import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import api from '../api/client'

// ── Helpers ──

const fmtPct = (n) => (n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)}%`)
const fmtPrice = (n) => (n == null ? '—' : n.toLocaleString('en-GB', { maximumFractionDigits: 2 }))

const ASSET_META = {
  stocks: { label: 'S&P 500',          color: '#60a5fa', emoji: '📈' },
  etfs:   { label: 'FTSE All-World',   color: '#a78bfa', emoji: '🌍' },
  bonds:  { label: 'UK Gilts',         color: '#fbbf24', emoji: '🏦' },
  cash:   { label: 'Cash / Savings',   color: '#9ca3af', emoji: '💰' },
}

const ASSET_KEYS = ['stocks', 'etfs', 'bonds', 'cash']


// ── Sub-components ──

function LiveStrip({ indices }) {
  if (!indices) return null
  return (
    <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
      {Object.entries(indices).map(([name, data]) => (
        <div key={name} className="flex items-center gap-2 flex-shrink-0">
          <span className="text-gray-400 text-xs">{name}</span>
          <span className="text-white text-sm font-medium">{fmtPrice(data.price)}</span>
          {data.change_pct != null && (
            <span className={`text-xs font-medium ${data.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmtPct(data.change_pct)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function AssetCard({ assetKey, summary, live }) {
  const meta    = ASSET_META[assetKey]
  const data    = summary?.[assetKey]
  const liveData = live?.assets?.[assetKey]
  if (!data) return null

  const changePct = liveData?.change_pct

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{meta.emoji}</span>
            <span className="text-white font-semibold text-sm">{meta.label}</span>
          </div>
          <p className="text-gray-500 text-xs">{data.description || ''}</p>
        </div>
        {changePct != null && (
          <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
            changePct >= 0
              ? 'bg-emerald-400/10 text-emerald-400'
              : 'bg-red-400/10 text-red-400'
          }`}>
            {fmtPct(changePct)} today
          </span>
        )}
      </div>

      {/* Live price */}
      {liveData?.price && (
        <div className="mb-4 pb-4 border-b border-gray-800">
          <p className="text-2xl font-bold text-white">{fmtPrice(liveData.price)}</p>
          <p className="text-gray-500 text-xs mt-0.5">Current price</p>
        </div>
      )}

      {/* Historical stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Avg annual return', value: fmtPct(data.mean_return), color: data.mean_return >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Volatility (std)',  value: fmtPct(data.volatility),  color: 'text-white' },
          { label: 'Best year',         value: fmtPct(data.best_year),   color: 'text-emerald-400' },
          { label: 'Worst year',        value: fmtPct(data.worst_year),  color: 'text-red-400' },
          { label: 'Positive years',    value: `${data.positive_pct}%`,  color: 'text-white' },
          { label: 'Years of data',     value: `${data.years_of_data}`,  color: 'text-white' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800/50 rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
            <p className={`font-semibold text-sm ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CumulativeChart({ summary }) {
  if (!summary) return null

  // Merge all asset classes into one array keyed by year
  const yearMap = {}
  ASSET_KEYS.forEach((key) => {
    const series = summary[key]?.cumulative || []
    series.forEach(({ year, value }) => {
      if (!yearMap[year]) yearMap[year] = { year }
      yearMap[year][key] = value
    })
  })

  const data = Object.values(yearMap).sort((a, b) => a.year - b.year)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm">
        <p className="text-gray-400 mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.dataKey} className="flex justify-between gap-6">
            <span style={{ color: p.color }}>{ASSET_META[p.dataKey]?.label}</span>
            <span className="text-white font-medium">{p.value?.toFixed(0)}</span>
          </div>
        ))}
        <p className="text-gray-600 text-xs mt-2">Starting value: 100</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="font-semibold text-white mb-1">Cumulative growth (1994 = 100)</h3>
      <p className="text-sm text-gray-500 mb-6">£100 invested at the start — how much would it be worth?</p>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {ASSET_KEYS.map((key) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ASSET_META[key].color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={ASSET_META[key].color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: ASSET_META[value]?.color, fontSize: 12 }}>
                {ASSET_META[value]?.label}
              </span>
            )}
          />
          {ASSET_KEYS.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={ASSET_META[key].color}
              fill={`url(#grad-${key})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function AnnualReturnsChart({ summary, selectedAsset }) {
  const data = summary?.[selectedAsset]?.history || []
  if (!data.length) return null

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const val = payload[0].value
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className={`font-semibold ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {fmtPct(val)}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="font-semibold text-white mb-1">Annual returns — {ASSET_META[selectedAsset]?.label}</h3>
      <p className="text-sm text-gray-500 mb-6">Every year since 1994 — including crash years</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: '#6b7280', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#374151" />
          <Bar
            dataKey="return_pct"
            radius={[2, 2, 0, 0]}
            fill={ASSET_META[selectedAsset]?.color}
            // Red for negative years
            label={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


// ── Main page ──

export default function MarketsPage() {
  const [summary, setSummary]           = useState(null)
  const [live, setLive]                 = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [liveLoading, setLiveLoading]   = useState(true)
  const [error, setError]               = useState('')
  const [selectedAsset, setSelectedAsset] = useState('stocks')

  useEffect(() => {
    api.get('/markets/summary')
      .then((res) => setSummary(res.data))
      .catch(() => setError('Failed to load market data'))
      .finally(() => setSummaryLoading(false))

    api.get('/markets/live')
      .then((res) => setLive(res.data))
      .catch(() => {}) // live prices are non-critical
      .finally(() => setLiveLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Markets</h1>
        <p className="text-gray-400 mt-1">
          30 years of real market data — the same data that powers your simulations
        </p>
      </div>

      {/* Live indices strip */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Live indices</span>
          {liveLoading && (
            <span className="text-xs text-gray-600 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border border-gray-600 border-t-transparent rounded-full animate-spin inline-block" />
              Fetching prices...
            </span>
          )}
        </div>
        {live?.indices ? (
          <LiveStrip indices={live.indices} />
        ) : !liveLoading ? (
          <p className="text-gray-600 text-sm">Live prices unavailable</p>
        ) : null}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-8">
          {error}
        </div>
      )}

      {summaryLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Asset cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {ASSET_KEYS.map((key) => (
              <AssetCard
                key={key}
                assetKey={key}
                summary={summary}
                live={live}
              />
            ))}
          </div>

          {/* Cumulative growth chart */}
          <div className="mb-8">
            <CumulativeChart summary={summary} />
          </div>

          {/* Annual returns chart with asset selector */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {ASSET_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedAsset(key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedAsset === key
                      ? 'text-gray-950 font-semibold'
                      : 'text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800'
                  }`}
                  style={selectedAsset === key ? { backgroundColor: ASSET_META[key].color } : {}}
                >
                  {ASSET_META[key].label}
                </button>
              ))}
            </div>
            <AnnualReturnsChart summary={summary} selectedAsset={selectedAsset} />
          </div>

          {/* Data disclaimer */}
          <div className="p-5 border border-gray-800 rounded-2xl text-xs text-gray-600 leading-relaxed">
            <strong className="text-gray-500">Data sources:</strong> Annual returns sourced from Yahoo Finance
            (^GSPC, VWRL.L, IGLT.L, ERNS.L) with Bank of England base rate backfill for cash pre-2000.
            Live prices via Yahoo Finance. All data is for informational purposes only and does not
            constitute financial advice.
          </div>
        </>
      )}
    </div>
  )
}