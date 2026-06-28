import { useState } from 'react'

export default function DisclaimerModal({ onAccept }) {
  const [accepted, setAccepted] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">

        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-white mb-1">A quick note before you start</h2>
          <p className="text-gray-500 text-xs">GoalIQ is a planning tool, not a regulated financial service.</p>
        </div>

        <div className="h-px bg-gray-800 mx-6" />

        <div className="px-6 py-4 space-y-2">
          {[
            { label: 'Simulations use real historical data', desc: 'Past performance does not guarantee future results. Markets can and do behave differently to history.' },
            { label: 'Not financial advice', desc: 'Nothing on this platform is a recommendation to buy, sell, or hold any investment. GoalIQ is not FCA regulated.' },
            { label: 'AI suggestions are a starting point', desc: 'The split suggestions and analysis are model-generated. They are not personalised advice from a human adviser.' },
            { label: 'Big decisions need a professional', desc: 'If you are making significant financial commitments, speak to a qualified financial adviser first.' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl px-3 py-2.5 bg-gray-800/40">
              <p className="text-white text-xs font-medium mb-0.5">{item.label}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="h-px bg-gray-800 mx-6" />

        <div className="px-6 py-4">
          <label className="flex items-start gap-3 cursor-pointer group mb-4">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                accepted
                  ? 'bg-emerald-400 border-emerald-400'
                  : 'border-gray-600 bg-gray-800 group-hover:border-gray-500'
              }`}>
                {accepted && (
                  <svg className="w-2.5 h-2.5 text-gray-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-gray-400 text-xs leading-relaxed">
              I understand that GoalIQ is not regulated financial advice and that all simulations are based on historical data
            </span>
          </label>

          <button
            onClick={onAccept}
            disabled={!accepted}
            className="w-full bg-emerald-400 hover:bg-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed text-gray-950 font-semibold rounded-xl py-2.5 transition-all text-sm"
          >
            Take me to my dashboard →
          </button>
        </div>

      </div>
    </div>
  )
}