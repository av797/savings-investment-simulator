import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import AssetDetailPanel from '../components/AssetDetailPage'
import api from '../api/client'


const fmtPct   = (n) => n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)}%`
const fmtPrice = (n) => n == null ? '—' : n.toLocaleString('en-GB', { maximumFractionDigits: 2 })

const ASSET_META = {
  stocks: { label: 'S&P 500',        color: '#60a5fa', emoji: '📈' },
  etfs:   { label: 'FTSE All-World', color: '#a78bfa', emoji: '🌍' },
  bonds:  { label: 'UK Gilts',       color: '#fbbf24', emoji: '🏦' },
  cash:   { label: 'Cash / Savings', color: '#9ca3af', emoji: '💰' },
}

const ASSET_KEYS = ['stocks', 'etfs', 'bonds', 'cash']

const TABS = ['Overview', 'News']


function LiveStrip({ indices }) {
  if (!indices) return null
  return (
    <div className="flex gap-6 overflow-x-auto pb-1">
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
  const meta     = ASSET_META[assetKey]
  const data     = summary?.[assetKey]
  const liveData = live?.assets?.[assetKey]
  if (!data) return null
  const changePct = liveData?.change_pct

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{meta.emoji}</span>
            <span className="text-white font-semibold text-sm">{meta.label}</span>
          </div>
          <p className="text-gray-500 text-xs">{data.description || ''}</p>
        </div>
        {changePct != null && (
          <span className={`text-sm font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
            changePct >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
          }`}>
            {fmtPct(changePct)} today
          </span>
        )}
      </div>
      {liveData?.price && (
        <div className="mb-4 pb-4 border-b border-gray-800">
          <p className="text-2xl font-bold text-white">{fmtPrice(liveData.price)}</p>
          <p className="text-gray-500 text-xs mt-0.5">Current price</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Avg annual return', value: fmtPct(data.mean_return),   color: data.mean_return >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Volatility (std)',  value: fmtPct(data.volatility),    color: 'text-white' },
          { label: 'Best year',         value: fmtPct(data.best_year),     color: 'text-emerald-400' },
          { label: 'Worst year',        value: fmtPct(data.worst_year),    color: 'text-red-400' },
          { label: 'Positive years',    value: `${data.positive_pct}%`,    color: 'text-white' },
          { label: 'Years of data',     value: `${data.years_of_data}`,    color: 'text-white' },
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
  const yearMap = {}
  ASSET_KEYS.forEach((key) => {
    summary[key]?.cumulative?.forEach(({ year, value }) => {
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
          <Legend formatter={(value) => (
            <span style={{ color: ASSET_META[value]?.color, fontSize: 12 }}>
              {ASSET_META[value]?.label}
            </span>
          )} />
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
          <Bar dataKey="return_pct" radius={[2, 2, 0, 0]} fill={ASSET_META[selectedAsset]?.color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function NewsTab() {
  const [news, setNews]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    Promise.allSettled(
      ASSET_KEYS.map((key) =>
        api.get(`/markets/detail/${key}`).then((res) => ({
          assetKey: key,
          items:    res.data.news || [],
        }))
      )
    ).then((results) => {
      const merged = []
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { assetKey, items } = result.value
          items.forEach((item) => {
            if (item.title) merged.push({ ...item, assetKey })
          })
        }
      })
      const seen  = new Set()
      const deduped = merged.filter((item) => {
        if (seen.has(item.title)) return false
        seen.add(item.title)
        return true
      })
      setNews(deduped)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? news : news.filter((n) => n.assetKey === filter)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!news.length) return (
    <div className="text-center py-16 text-gray-600">No news available right now</div>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white bg-gray-800/50'
          }`}
        >
          All
        </button>
        {ASSET_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === key ? 'text-gray-950 font-semibold' : 'text-gray-400 hover:text-white bg-gray-800/50'
            }`}
            style={filter === key ? { backgroundColor: ASSET_META[key].color } : {}}
          >
            {ASSET_META[key].emoji} {ASSET_META[key].label}
          </button>
        ))}
        <span className="text-gray-600 text-xs ml-auto">{filtered.length} articles</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item, i) => (
          <a
            key={i}
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-5 transition-all group flex flex-col gap-3"
          >
            {/* Asset tag */}
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: `${ASSET_META[item.assetKey]?.color}18`,
                  color:            ASSET_META[item.assetKey]?.color,
                }}
              >
                {ASSET_META[item.assetKey]?.emoji} {ASSET_META[item.assetKey]?.label}
              </span>
              <svg
                className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>

            <p className="text-gray-200 text-sm font-medium leading-snug group-hover:text-white transition-colors">
              {item.title}
            </p>
            {item.publisher && (
              <p className="text-gray-600 text-xs mt-auto">{item.publisher}</p>
            )}
          </a>
        ))}
      </div>

      {!filtered.length && (
        <div className="text-center py-12 text-gray-600 text-sm">
          No news for {ASSET_META[filter]?.label} right now
        </div>
      )}
    </div>
  )
}

export default function MarketsPage() {
  const [summary, setSummary]               = useState(null)
  const [live, setLive]                     = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [liveLoading, setLiveLoading]       = useState(true)
  const [error, setError]                   = useState('')
  const [selectedAsset, setSelectedAsset]   = useState('stocks')
  const [panelAsset, setPanelAsset]         = useState(null)
  const [activeTab, setActiveTab]           = useState('Overview')

  useEffect(() => {
    api.get('/markets/summary')
      .then((res) => setSummary(res.data))
      .catch(() => setError('Failed to load market data'))
      .finally(() => setSummaryLoading(false))

    api.get('/markets/live')
      .then((res) => setLive(res.data))
      .catch(() => {})
      .finally(() => setLiveLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Markets</h1>
        <p className="text-gray-400 mt-1">
          30 years of real market data — the same data that powers your simulations
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Live indices</span>
          {liveLoading && (
            <span className="text-xs text-gray-600 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border border-gray-600 border-t-transparent rounded-full animate-spin inline-block" />
              Fetching prices...
            </span>
          )}
        </div>
        {live?.indices
          ? <LiveStrip indices={live.indices} />
          : !liveLoading
            ? <p className="text-gray-600 text-sm">Live prices unavailable</p>
            : null
        }
      </div>

      <div className="flex items-center gap-1 border-b border-gray-800 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-8">
          {error}
        </div>
      )}

      {activeTab === 'Overview' && (
        summaryLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {ASSET_KEYS.map((key) => (
                <div
                  key={key}
                  onClick={() => setPanelAsset(key)}
                  className="cursor-pointer group"
                >
                  <AssetCard assetKey={key} summary={summary} live={live} />
                  <p className="text-center text-xs text-gray-600 group-hover:text-emerald-400 transition-colors mt-2">
                    Click for details →
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <CumulativeChart summary={summary} />
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
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

            <div className="p-5 border border-gray-800 rounded-2xl text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-500">Data sources:</strong> Annual returns sourced from Yahoo Finance
              (^GSPC, VWRL.L, IGLT.L, ERNS.L) with Bank of England base rate backfill for cash pre-2000.
              Live prices via Yahoo Finance. All data is for informational purposes only and does not
              constitute financial advice.
            </div>
          </>
        )
      )}

      {activeTab === 'News' && <NewsTab />}

      {panelAsset && (
        <AssetDetailPanel
          assetKey={panelAsset}
          summaryData={summary}
          onClose={() => setPanelAsset(null)}
        />
      )}

    </div>
  )
}