const SECTIONS = [
  {
    id: 'what-we-collect',
    title: 'What we collect',
    body: 'When you create an account we store your email address and a hashed version of your password. When you set a goal, we store the goal name, target amount, timeline, monthly contribution, asset allocation, your age, your monthly income and your risk tolerance. When you run a simulation, we store the result so you can see your history. When you use the AI assistant or AI analysis, we store a daily count of how many requests you have made (to enforce the 25 per day limit).',
  },
  {
    id: 'what-we-dont',
    title: 'What we do not collect',
    body: 'We do not run third-party advertising, analytics or tracking scripts. We do not collect your real bank account details, your actual investment holdings or your real name beyond what you put in your account profile. We do not track you across other websites.',
  },
  {
    id: 'how-we-use-it',
    title: 'How we use it',
    body: 'Your data is used to power the features of the app. Your age, income and risk profile are fed into the allocation suggestion model. Your goals and simulation results are sent to the AI assistant so it can answer questions about your actual plan. Market data (stock and bond returns) is sourced from Yahoo Finance and is not tied to your account.',
  },
  {
    id: 'ai-features',
    title: 'AI features and third parties',
    body: 'When you use the AI assistant or AI analysis, the relevant context (your question, your goals, your simulation results, your current page) is sent to Groq, the inference provider that runs the language model. Groq processes the request and returns a response. Messages are not used to train future models. We enforce a limit of 25 AI requests per user per day.',
  },
  {
    id: 'storage',
    title: 'Where your data is stored',
    body: 'Account data, goals and simulations are stored in a PostgreSQL database hosted on Neon, a serverless Postgres provider. Passwords are hashed with bcrypt before storage. The database is only accessible from the backend server.',
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: 'You can delete your account at any time from the Settings page. Deleting your account permanently removes your email, all goals, all simulation results, all AI usage records and any uploaded profile photo. This action cannot be undone. You can also update your profile information at any time from Settings.',
  },
  {
    id: 'security',
    title: 'Security',
    body: 'We use bcrypt for password hashing, signed JSON Web Tokens for session authentication with a 60 minute expiry, rate limiting on authentication endpoints, account lockout after repeated failed logins, and an audit log of security-relevant events. We do not guarantee that any system is perfectly secure and you use the service at your own risk.',
  },
  {
    id: 'children',
    title: 'Children',
    body: 'The service is not directed at children under 18 and we do not knowingly collect data from anyone under 18. Accounts created with an age under 18 will be rejected.',
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: 'If we make material changes to this policy we will update the effective date below. Continued use of the service after a change indicates acceptance of the updated policy.',
  },
  {
    id: 'contact',
    title: 'Contact',
    body: 'If you have questions about this policy or your data, contact us at the email address listed on the project repository.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      <div className="mb-12">
        <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-3">Legal</p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          Privacy policy
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