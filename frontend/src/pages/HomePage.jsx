import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: '🎯',
    title: 'Goal-based planning',
    desc: 'Set targets for house deposits, retirement, education or anything else. Track progress and stay on course.',
  },
  {
    icon: '📊',
    title: 'Monte Carlo simulation',
    desc: '10,000 scenarios per run using 30 years of real market data — not guesswork, not averages.',
  },
  {
    icon: '✨',
    title: 'AI split suggestion',
    desc: 'Our ML model recommends the right asset allocation for your goal, timeline and risk tolerance.',
  },
  {
    icon: '🤖',
    title: 'AI Agent',
    desc: 'Ask anything about your goals or the markets. The AI Agent knows your actual data and gives real answers.',
  },
  {
    icon: '📈',
    title: 'Live market data',
    desc: '30 years of annual returns, live prices, top holdings and news for stocks, ETFs, bonds and cash.',
  },
  {
    icon: '🌍',
    title: 'Inflation-adjusted',
    desc: 'Live CPI data from the World Bank for 8 countries — so your projections reflect real purchasing power.',
  },
]

const STEPS = [
  {
    number: '01',
    title:  'Create a goal',
    desc:   'Choose a goal type, set your target amount, timeline and monthly contribution. Inflation is pre-filled from live data.',
  },
  {
    number: '02',
    title:  'Set your allocation',
    desc:   'Drag the sliders to split your monthly investment across stocks, ETFs, bonds and cash — or let the AI suggest a split.',
  },
  {
    number: '03',
    title:  'Run your simulation',
    desc:   'See 10,000 possible futures for your goal. Get AI-powered suggestions if your success rate needs improving.',
  },
]

const STATS = [
  { value: '10,000',  label: 'Scenarios per simulation' },
  { value: '30+',     label: 'Years of market data' },
  { value: '4',       label: 'Asset classes' },
  { value: '8',       label: 'Countries supported' },
]

const ASSET_CLASSES = [
  { emoji: '📈', name: 'S&P 500',        desc: 'US large-cap equities',   avg: '+10.7%', color: 'text-blue-400'   },
  { emoji: '🌍', name: 'FTSE All-World', desc: 'Global diversified ETF',  avg: '+8.2%',  color: 'text-purple-400' },
  { emoji: '🏦', name: 'UK Gilts',       desc: 'UK government bonds',     avg: '+3.4%',  color: 'text-yellow-400' },
  { emoji: '💰', name: 'Cash / Savings', desc: 'UK savings rate proxy',   avg: '+2.8%',  color: 'text-gray-400'   },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-400 rounded-md flex items-center justify-center">
              <span className="text-gray-950 font-black text-sm">G</span>
            </div>
            <span className="font-semibold text-white tracking-tight">GoalIQ</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          Powered by 30 years of real market data
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Your financial goals,<br />
          <span className="text-emerald-400">intelligently simulated.</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Set goals, model your asset allocation, and run Monte Carlo simulations
          grounded in real market history — with an AI Agent that knows your plan.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/auth"
            className="bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-bold text-base px-8 py-3.5 rounded-xl transition-colors"
          >
            Start for free →
          </Link>
          <a
            href="#how-it-works"
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-colors border border-gray-700"
          >
            See how it works
          </a>
        </div>
      </section>

      <section className="border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-emerald-400 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">How it works</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            From goal to simulation in three steps
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-full h-px bg-gradient-to-r from-emerald-400/30 to-transparent" />
              )}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="text-5xl font-black text-emerald-400/20 mb-4">{step.number}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-900/30 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything you need</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Built for people who want to take their finances seriously
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Real data, not assumptions</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Your simulations are powered by 30 years of actual annual returns —
            including every crash and recovery
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {ASSET_CLASSES.map((ac) => (
            <div key={ac.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{ac.emoji}</span>
                <span className="text-white font-semibold text-sm">{ac.name}</span>
              </div>
              <p className="text-gray-500 text-xs mb-3">{ac.desc}</p>
              <div className="pt-3 border-t border-gray-800">
                <p className="text-gray-500 text-xs">30yr avg annual return</p>
                <p className={`text-xl font-bold ${ac.color}`}>{ac.avg}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 text-xs">
          Data sourced from Yahoo Finance (^GSPC, VWRL.L, IGLT.L, ERNS.L) · For informational purposes only
        </p>
      </section>

      <section className="bg-gray-900/30 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
              🤖 AI Agent
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ask anything about your financial plan
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              GoalIQ's AI Agent knows your actual goals, simulation results and market data.
              Ask "am I on track for retirement?" or "how did bonds perform in 2008?" and get
              real answers grounded in your data — not generic advice.
            </p>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-left max-w-md mx-auto">
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-emerald-400 text-gray-950 text-sm px-4 py-2.5 rounded-2xl rounded-br-sm font-medium max-w-[80%]">
                    Am I on track with my goals?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-100 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[80%] leading-relaxed">
                    Your retirement fund has a 78% success rate — looking strong! Your house deposit goal is at 52% and could use attention. Consider increasing your monthly allocation by £150 to push it above 75%.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Start planning smarter
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
          Free to use. No credit card required. Your goals, simulated with real market data.
        </p>
        <Link
          to="/auth"
          className="bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-bold text-lg px-10 py-4 rounded-xl transition-colors inline-block"
        >
          Get started free →
        </Link>
      </section>

      <footer className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-400 rounded-md flex items-center justify-center">
                <span className="text-gray-950 font-black text-xs">G</span>
              </div>
              <span className="text-white font-semibold text-sm">GoalIQ</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link to="/auth" className="hover:text-gray-300 transition-colors">Sign in</Link>
              <Link to="/auth" className="hover:text-gray-300 transition-colors">Get started</Link>
            </div>
            <p className="text-gray-600 text-xs text-center md:text-right max-w-sm">
              Nothing on this platform constitutes financial advice.
              All simulations are based on historical data. Past performance
              does not guarantee future results.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}