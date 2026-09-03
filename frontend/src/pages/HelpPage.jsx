import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting started',
    blocks: [
      {
        heading: 'How GoalIQ works',
        body: (
          <>
            <p>
              GoalIQ helps you plan a financial goal — saving for a house, building retirement, an emergency fund, or anything else with a number and a timeline. You tell it how much you want, by when, and how much you can set aside each month. GoalIQ then runs thousands of simulations using <strong>30 years of real historical market data</strong> (1994–2024) to show you the realistic range of outcomes — not just a single optimistic projection.
            </p>
          </>
        ),
      },
      {
        heading: 'The three steps',
        body: (
          <ol className="list-decimal list-inside space-y-2 text-gray-400 leading-relaxed">
            <li><strong className="text-white">Set a goal</strong> — pick a target amount, a timeline, and how much you can invest each month.</li>
            <li><strong className="text-white">Choose how to invest</strong> — split your monthly contribution across stocks, ETFs, bonds, and cash. GoalIQ suggests a starting mix based on your timeline.</li>
            <li><strong className="text-white">Run a simulation</strong> — see the range of outcomes, the chance of hitting your target, and what to change if the odds aren't where you want them.</li>
          </ol>
        ),
      },
    ],
  },
  {
    id: 'goal-types',
    title: 'Goal types',
    blocks: [
      {
        heading: 'House',
        body: (
          <>
            <p>
              Saving for a property deposit. Typically a 3–7 year timeline. Most users run a more conservative allocation here because the target date is fixed and short.
            </p>
          </>
        ),
      },
      {
        heading: 'Retirement',
        body: (
          <>
            <p>
              Long-horizon (15–40 years). The simulation accounts for inflation and projects a retirement age from the median outcome.
            </p>
          </>
        ),
      },
      {
        heading: 'Emergency fund',
        body: (
          <>
            <p>
              Short-term (under 3 years). GoalIQ always suggests keeping this in cash — you'll see "very conservative" allocation regardless of input.
            </p>
          </>
        ),
      },
      {
        heading: 'Education, travel, other',
        body: (
          <>
            <p>
              Treated as a flexible medium-term goal. Default allocation leans conservative for travel (1–3 years) and moderate for education (5–15 years).
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: 'monte-carlo',
    title: 'How the simulation works',
    blocks: [
      {
        heading: 'What Monte Carlo means',
        body: (
          <>
            <p>
              Instead of predicting a single outcome, GoalIQ runs your plan <strong>10,000 times</strong>. Each run takes a different path through history — sometimes drawing on the 2008 crash, sometimes the 2020 COVID drop, sometimes the strong 2010s. After all 10,000 runs, you get a distribution of possible outcomes: the median (most likely middle), and the 10th and 90th percentiles (the realistic low and high).
            </p>
          </>
        ),
      },
      {
        heading: 'Why real historical data matters',
        body: (
          <>
            <p>
              Most "compound interest" calculators assume returns follow a smooth bell curve. Real markets don't — they have fat tails and sudden crashes that a normal distribution would say are essentially impossible. GoalIQ uses <strong>bootstrap resampling</strong> from real annual returns, which preserves the actual shape of history including the bad years.
            </p>
          </>
        ),
      },
      {
        heading: 'What the success rate means',
        body: (
          <>
            <p>
              It's the percentage of the 10,000 simulated scenarios where your portfolio reached or exceeded your target amount by your target year. A 75% success rate means you would have hit your goal in roughly three-quarters of possible market futures — not a guarantee, but a useful signal.
            </p>
          </>
        ),
      },
      {
        heading: 'Reading the fan chart',
        body: (
          <>
            <p>
              The shaded area on the goal chart shows the range between the 10th and 90th percentile outcomes over time. The solid line is the median. The further apart the bands spread, the more uncertain the outcome — which is normal as the timeline extends.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: 'asset-classes',
    title: 'Asset classes',
    blocks: [
      {
        heading: 'Stocks',
        body: <p>Highest long-term expected return, highest volatility. Includes individual equities and equity-heavy funds.</p>,
      },
      {
        heading: 'ETFs',
        body: <p>Lower-cost diversified exposure. Treated separately from individual stocks in simulations, with slightly less variance.</p>,
      },
      {
        heading: 'Bonds',
        body: <p>Lower return, lower volatility. Useful for dampening swings and stabilising a portfolio close to the target date.</p>,
      },
      {
        heading: 'Cash',
        body: <p>Lowest return, lowest risk. Backed by historical base-rate data (Bank of England base rate for GBP).</p>,
      },
    ],
  },
  {
    id: 'ai-features',
    title: 'AI features',
    blocks: [
      {
        heading: 'Allocation suggestions',
        body: (
          <>
            <p>
              The suggested allocation button on a goal uses a <strong>Random Forest model</strong> trained on real market outcomes across thousands of (age, income, risk profile, timeline) combinations. It picks from five named profiles — very conservative to aggressive — based on what's most likely to succeed given your inputs.
            </p>
          </>
        ),
      },
      {
        heading: 'AI analysis',
        body: (
          <>
            <p>
              On any goal detail page, the AI analysis card performs a binary search: it iteratively checks how much extra monthly contribution is needed to reach a 75% success rate, then asks a language model to summarise the recommendation in plain English. You're capped at 25 AI calls per day.
            </p>
          </>
        ),
      },
      {
        heading: 'AI chatbot',
        body: (
          <>
            <p>
              The floating chat in the bottom-right is context-aware — it knows which page you're on, your goals, and your simulations. Ask it things like "which goal needs the most attention?" or "how did bonds perform in 2008?".
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: 'tips',
    title: 'Tips for using GoalIQ well',
    blocks: [
      {
        heading: 'Run the simulation after every change',
        body: <p>Updates only show up when you re-run. The simulation is fast — usually under a second.</p>,
      },
      {
        heading: 'Watch the report page, not just one goal',
        body: <p>If you have multiple goals, the report page shows your combined monthly contribution across all of them. Useful for making sure you're not overcommitting.</p>,
      },
      {
        heading: 'A low success rate is information, not a verdict',
        body: <p>It tells you the plan needs adjusting. Either up the monthly amount, lengthen the timeline, or take more risk — the AI analysis will tell you which has the biggest effect.</p>,
      },
      {
        heading: 'Use the what-if sandbox to play',
        body: <p>On any goal detail page, drag the sliders under "What if" to see instant re-runs without saving. A great way to understand which lever actually moves the needle.</p>,
      },
    ],
  },
  {
    id: 'disclaimer',
    title: 'A note on what this is',
    blocks: [
      {
        heading: 'Not financial advice',
        body: (
          <>
            <p>
              GoalIQ is an educational tool. The simulations are based on historical data and make simplifying assumptions (constant monthly contributions, no taxes, no fees, no withdrawals). They are not a forecast and they are not personalised financial advice. For real decisions about your money, talk to a qualified adviser.
            </p>
          </>
        ),
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      <div className="mb-12">
        <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-3">Help & documentation</p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          Everything you need to use GoalIQ well
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
          A practical guide to what GoalIQ does, how the simulations work, and how to read the numbers — without the jargon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-10">

        <aside className="md:sticky md:top-20 md:self-start">
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-12 min-w-0">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-gray-800">
                {section.title}
              </h2>
              <div className="space-y-8">
                {section.blocks.map((block, i) => (
                  <div key={i}>
                    <h3 className="text-base font-semibold text-white mb-2">{block.heading}</h3>
                    <div className="text-gray-400 leading-relaxed space-y-3">{block.body}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-12">
            <h3 className="text-white font-semibold mb-2">Still have questions?</h3>
            <p className="text-gray-400 text-sm mb-4">
              The AI chatbot in the bottom-right is context-aware — it can see your goals and simulations, and it knows what page you're on.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Go to dashboard
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}