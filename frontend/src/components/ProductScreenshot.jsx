import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const fmt = (n) => `£${Math.round(n).toLocaleString()}`

function buildFanData() {
  const data = []
  const years = 20
  const monthly = 400
  const start  = 5000
  const target = 80000

  for (let y = 0; y <= years; y++) {
    const median = start * Math.pow(1.075, y) + monthly * 12 * ((Math.pow(1.075, y) - 1) / 0.075)
    const noise  = Math.min(0.35, 0.05 + y * 0.015)
    data.push({
      year:    `Y${y}`,
      p10:     Math.max(0, median * (1 - noise * 1.4)),
      p90:     median * (1 + noise * 1.4),
      median:  median,
      target:  target,
    })
  }
  return data
}

const FAN_DATA = buildFanData()

export default function ProductScreenshot() {
  return (
    <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-10 mb-24">
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-800 bg-gray-950/60">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
          <div className="ml-4 text-xs text-gray-500">goaliq.app / dashboard / house-deposit</div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Goal</p>
              <h3 className="text-white font-semibold text-lg">House deposit</h3>
              <p className="text-gray-500 text-sm">£400/mo · 20 year timeline</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Success rate</p>
              <p className="text-emerald-400 font-bold text-3xl">78%</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={FAN_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fanFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tickFormatter={fmt}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(v, name) => [fmt(v), name === 'target' ? 'Target' : name === 'median' ? 'Median' : name === 'p10' ? '10th percentile' : '90th percentile']}
                />
                <Area
                  type="monotone"
                  dataKey="p90"
                  stroke="none"
                  fill="url(#fanFill)"
                  stackId="1"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="p10"
                  stroke="none"
                  fill="#0a0a0a"
                  stackId="2"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="median"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="none"
                  isAnimationActive={false}
                />
                <ReferenceLine
                  y={80000}
                  stroke="#fbbf24"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: 'Target', fill: '#fbbf24', fontSize: 11, position: 'right' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-800 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-emerald-400" />
              Median outcome
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-400/20 border border-emerald-400/30" />
              10th - 90th percentile range
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-yellow-400 border-dashed" style={{ borderTop: '1.5px dashed #fbbf24' }} />
              Target
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}