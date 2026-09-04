const SECTIONS = [
  {
    id: 'what-this-is',
    title: 'What this service is',
    body: 'GoalIQ is an educational tool that runs Monte Carlo simulations of savings and investment plans using historical market data. It is a planning aid, not a brokerage, custodian, financial adviser or investment manager. We do not hold, transmit or execute any of your money.',
  },
  {
    id: 'not-advice',
    title: 'Not financial advice',
    body: 'Nothing on this platform is personalised financial advice. The simulations use historical data and make simplifying assumptions: constant monthly contributions, no taxes, no fees, no transaction costs, no withdrawals and no rebalancing. Real outcomes will differ. For decisions about your money, consult a qualified financial adviser regulated in your jurisdiction.',
  },
  {
    id: 'no-guarantees',
    title: 'No guarantees on outcomes',
    body: 'A 75% success rate means that in roughly three quarters of the simulated market scenarios, the plan reached its target. It is not a probability guarantee and it is not a forecast. Past market performance does not predict future results.',
  },
  {
    id: 'accounts',
    title: 'Your account',
    body: 'You are responsible for keeping your password secure. You must provide accurate information at registration. We may suspend or terminate accounts that provide false information, attempt to abuse the service, or interfere with other users.',
  },
  {
    id: 'ai-features',
    title: 'AI features',
    body: 'The AI assistant and AI analysis features are provided by third-party language model inference (Groq). Responses are generated automatically and may be inaccurate, incomplete or out of date. Do not act on AI-generated advice without independent verification. AI usage is capped at 25 requests per user per day.',
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: 'You agree not to attempt to disrupt the service, access data that does not belong to you, reverse-engineer the application, use the service for any unlawful purpose, or use automated tools to make requests at a rate that exceeds normal personal use.',
  },
  {
    id: 'service-changes',
    title: 'Changes to the service',
    body: 'We may add, modify or remove features at any time. We may suspend the service temporarily for maintenance. We may discontinue the service entirely with reasonable notice. Where reasonable, we will preserve user data ahead of any discontinuation.',
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: 'The service is provided as is and as available. To the fullest extent permitted by law, we disclaim all warranties, express or implied. We are not liable for any indirect, incidental, special, consequential or punitive damages arising from your use of the service. Nothing in these terms excludes liability that cannot be excluded by law.',
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    body: 'These terms are governed by the laws of England and Wales. Any disputes will be resolved in the courts of England and Wales.',
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: 'If we make material changes to these terms we will update the effective date below. Continued use of the service after a change indicates acceptance of the updated terms.',
  },
  {
    id: 'contact',
    title: 'Contact',
    body: 'For questions about these terms, contact us at the email address listed on the project repository.',
  },
]

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      <div className="mb-12">
        <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-3">Legal</p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          Terms of service
        </h1>
        <p className="text-gray-500 text-sm">Effective date: today</p>
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

        <div className="space-y-10 min-w-0">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-gray-800">
                {section.title}
              </h2>
              <p className="text-gray-400 leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}