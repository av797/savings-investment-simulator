import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const ASSET_CLASSES = [
  { name: 'S&P 500',        desc: 'US equities',        avg: '+10.7%', color: '#60a5fa' },
  { name: 'FTSE All-World', desc: 'Global ETF',          avg: '+8.2%',  color: '#a78bfa' },
  { name: 'UK Gilts',       desc: 'Government bonds',    avg: '+3.4%',  color: '#fbbf24' },
  { name: 'Cash',           desc: 'Savings rate proxy',  avg: '+2.8%',  color: '#9ca3af' },
]

const STEPS = [
  {
    label: 'Step 1',
    title: 'Set a goal',
    desc:  "Pick what you're saving for: a house, retirement, something else. Set your target, timeline and monthly contribution. Inflation is pulled from live World Bank data.",
  },
  {
    label: 'Step 2',
    title: 'Choose how to invest',
    desc:  'Drag sliders to split your money across stocks, ETFs, bonds and cash, or ask the AI to suggest an allocation based on your age, risk tolerance and goal type.',
  },
  {
    label: 'Step 3',
    title: 'Run the simulation',
    desc:  '10,000 scenarios using 30 years of real annual returns, including 2008, 2020 and 2022. See the range of outcomes, then adjust if the numbers look off.',
  },
]

function useScrollReveal(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sr-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: options.threshold ?? 0.1, rootMargin: options.rootMargin ?? '0px 0px -40px 0px' }
    )

    const targets = el.querySelectorAll('[data-reveal]')
    targets.forEach((t) => observer.observe(t))

    return () => observer.disconnect()
  }, [])

  return ref
}

export default function HomePage() {
  const statsRef  = useScrollReveal()
  const stepsRef  = useScrollReveal()
  const assetsRef = useScrollReveal()
  const agentRef  = useScrollReveal()
  const ctaRef    = useScrollReveal()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      <style>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(32px);
          transition:
            opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        [data-reveal].sr-visible {
          opacity: 1;
          transform: translateY(0);
        }
        [data-reveal][data-delay="1"] { transition-delay: 0.07s; }
        [data-reveal][data-delay="2"] { transition-delay: 0.14s; }
        [data-reveal][data-delay="3"] { transition-delay: 0.21s; }
        [data-reveal][data-delay="4"] { transition-delay: 0.28s; }

        @media (prefers-reduced-motion: reduce) {
          [data-reveal] {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>

      <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-400 rounded flex items-center justify-center">
              <span className="text-gray-950 font-black text-xs">G</span>
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">GoalIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-gray-400 hover:text-white text-sm transition-colors">
              Sign in
            </Link>
            <Link
              to="/auth"
              className="bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold text-sm px-4 py-1.5 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-28 pb-24">
        <div className="max-w-3xl">
          <p className="text-emerald-400 text-sm font-medium mb-5 tracking-wide uppercase">
            Goal-based financial planning
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.08] mb-6 tracking-tight">
            Know where your money<br />
            ends up before it gets there.
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-xl mb-10">
            GoalIQ runs 10,000 simulations of your savings plan using real market data going back 30 years.
            Not a calculator, not a guess. A proper look at the range of things that could happen.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/auth"
              className="bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-bold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Start for free
            </Link>
            <a
              href="#how-it-works"
              className="text-gray-400 hover:text-white text-sm transition-colors underline underline-offset-4"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-800" ref={statsRef}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10,000', label: 'Scenarios per run' },
              { value: '30 yrs', label: 'Market data' },
              { value: '4',      label: 'Asset classes' },
              { value: '8',      label: 'Country inflation feeds' },
            ].map((s, i) => (
              <div key={s.label} data-reveal data-delay={i + 1}>
                <div className="text-3xl font-bold text-white mb-0.5">{s.value}</div>
                <div className="text-gray-500 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24" ref={stepsRef}>
        <div data-reveal>
          <h2 className="text-2xl font-bold text-white mb-2">How it works</h2>
          <p className="text-gray-500 text-sm mb-14">Three steps from a blank page to a working simulation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-800 rounded-2xl overflow-hidden">
          {STEPS.map((step, i) => (
            <div
              key={step.label}
              className="bg-gray-950 p-8"
              data-reveal
              data-delay={i + 1}
            >
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">{step.label}</p>
              <h3 className="text-white font-semibold text-lg mb-3">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-800" ref={assetsRef}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div data-reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Grounded in real data</h2>
              <p className="text-gray-500 text-sm max-w-md">
                Simulations use actual annual returns sourced from Yahoo Finance, not assumed averages.
                That includes crash years like 2008 and 2022.
              </p>
            </div>
            <p className="text-gray-600 text-xs shrink-0">30-year avg annual return</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ASSET_CLASSES.map((ac, i) => (
              <div
                key={ac.name}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5"
                data-reveal
                data-delay={i + 1}
              >
                <p className="text-white font-semibold text-sm mb-0.5">{ac.name}</p>
                <p className="text-gray-500 text-xs mb-5">{ac.desc}</p>
                <p className="font-bold text-2xl" style={{ color: ac.color }}>{ac.avg}</p>
              </div>
            ))}
          </div>

          <p className="text-gray-700 text-xs mt-4">
            ^GSPC, VWRL.L, IGLT.L, ERNS.L via Yahoo Finance · Bank of England base rate backfill pre-2000 · Informational only
          </p>
        </div>
      </section>

      <section className="border-t border-gray-800" ref={agentRef}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

            <div data-reveal>
              <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-5">Assistant</p>
              <h2 className="text-2xl font-bold text-white mb-4">
                Ask questions about your actual plan
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                The built-in assistant reads your goals, simulation results and market data directly.
                Ask why your retirement goal sits at 52%, or what bonds returned in 2008, and it answers
                from your real numbers instead of a generic script.
              </p>
              <p className="text-gray-600 text-xs">Not regulated financial advice.</p>
            </div>

            <div
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
              data-reveal
              data-delay="1"
            >
              <div className="flex items-center gap-2 pb-4 border-b border-gray-800 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-gray-400 text-xs">GoalIQ Assistant</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-emerald-400 text-gray-950 text-sm px-4 py-2.5 rounded-2xl rounded-br-sm font-medium max-w-[80%]">
                    Am I on track for retirement?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-200 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[85%] leading-relaxed">
                    Your retirement goal has a 78% success rate, which is solid. Your house deposit is at 52% though, worth a look. Adding around £150/month would push it above 75%.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-emerald-400 text-gray-950 text-sm px-4 py-2.5 rounded-2xl rounded-br-sm font-medium max-w-[80%]">
                    What did stocks return in 2008?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-200 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[85%] leading-relaxed">
                    The S&P 500 returned about -38.5% that year. That crash is baked into your simulations, which is why your success rate already accounts for a bad run like it.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-800" ref={ctaRef}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-xl" data-reveal>
            <h2 className="text-3xl font-bold text-white mb-4">
              Free to use. No card needed.
            </h2>
            <p className="text-gray-400 text-base mb-8">
              Create an account, set a goal and run your first simulation in under five minutes.
            </p>
            <Link
              to="/auth"
              className="inline-block bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-bold text-sm px-8 py-3.5 rounded-xl transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-400 rounded flex items-center justify-center">
              <span className="text-gray-950 font-black text-[10px]">G</span>
            </div>
            <span className="text-white font-semibold text-sm">GoalIQ</span>
          </div>
          <p className="text-gray-600 text-xs max-w-sm">
            Nothing on this platform is financial advice. Simulations use historical data.
            Past performance doesn't guarantee future results.
          </p>
          <div className="flex gap-5 text-sm text-gray-500">
            <Link to="/auth" className="hover:text-gray-300 transition-colors">Sign in</Link>
            <Link to="/auth" className="hover:text-gray-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}