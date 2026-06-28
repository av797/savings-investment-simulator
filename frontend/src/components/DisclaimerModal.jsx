export default function DisclaimerModal({ onAccept }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">

        <div className="w-12 h-12 bg-yellow-400/10 border border-yellow-400/20 rounded-xl flex items-center justify-center mb-6">
          <span className="text-2xl">⚠️</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Before you get started</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          GoalIQ is a financial planning tool, not a regulated financial service. Please read this before using the platform.
        </p>

        <div className="space-y-3 mb-8">
          {[
            {
              icon: '📊',
              text: 'Simulations use historical market data. Past performance does not guarantee future results.',
            },
            {
              icon: '🤖',
              text: 'AI-generated suggestions are based on mathematical models, not personal financial advice.',
            },
            {
              icon: '⚖️',
              text: 'GoalIQ is not regulated by the FCA or any financial authority. Nothing here is a recommendation to buy, sell, or hold any investment.',
            },
            {
              icon: '👤',
              text: 'For decisions involving significant money, consult a qualified financial adviser.',
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
              <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
              <p className="text-gray-300 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onAccept}
          className="w-full bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold rounded-xl py-3 transition-colors text-sm"
        >
          I understand — take me to my dashboard
        </button>

        <p className="text-gray-600 text-xs text-center mt-4">
          You can review this notice at any time in Settings
        </p>

      </div>
    </div>
  )
}