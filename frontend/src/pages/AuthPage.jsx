import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login, register, getMe } from '../api'
import DisclaimerModal from '../components/DisclaimerModal'

export default function AuthPage() {
  const [mode, setMode]                 = useState('login')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const { loginUser }                   = useAuth()
  const navigate                        = useNavigate()
  const [pendingAuth, setPendingAuth] = useState(null)

  const [form, setForm] = useState({
    email: '', password: '', age: '', monthly_income: '', risk_profile: 'medium',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'register') {
      if (!form.age) {
        setError('Please enter your age to continue')
        setLoading(false)
        return
      }
      if (parseInt(form.age) < 18) {
        setError('You must be 18 or older to create an account')
        setLoading(false)
        return
      }
    }

    try {
      if (mode === 'login') {
        const res   = await login(form.email, form.password)
        localStorage.setItem('token', res.data.access_token)
        const meRes = await getMe()
        loginUser(res.data.access_token, meRes.data)
        navigate('/dashboard')
      } else {
        await register({
          email:          form.email,
          password:       form.password,
          age:            form.age ? parseInt(form.age) : null,
          monthly_income: form.monthly_income ? parseFloat(form.monthly_income) : null,
          risk_profile:   form.risk_profile,
        })
        const res   = await login(form.email, form.password)
        localStorage.setItem('token', res.data.access_token)
        const meRes = await getMe()
        setPendingAuth({ token: res.data.access_token, userData: meRes.data })
        setShowDisclaimer(true)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

    const handleDisclaimerAccept = () => {
      loginUser(pendingAuth.token, pendingAuth.userData)
      setShowDisclaimer(false)
      navigate('/dashboard')
    }

  return (
    <>
      {showDisclaimer && <DisclaimerModal onAccept={handleDisclaimerAccept} />}

      <div className="min-h-screen bg-gray-950 flex">

        <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gray-900 border-r border-gray-800 p-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-400 rounded-md flex items-center justify-center">
              <span className="text-gray-950 font-black text-sm">G</span>
            </div>
            <span className="font-semibold text-white text-lg tracking-tight">GoalIQ</span>
          </div>

          <div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Your financial<br />
              future, <span className="text-emerald-400">simulated.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              Set goals, model your asset allocation, and run Monte Carlo simulations
              grounded in 30 years of real market data.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Scenarios per run', value: '10,000' },
              { label: 'Years of market data', value: '30+' },
              { label: 'Asset classes', value: '4' },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="text-2xl font-bold text-emerald-400">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">

            <div className="flex items-center gap-2 mb-10 lg:hidden">
              <div className="w-8 h-8 bg-emerald-400 rounded-md flex items-center justify-center">
                <span className="text-gray-950 font-black text-sm">G</span>
              </div>
              <span className="font-semibold text-white text-lg">GoalIQ</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-gray-400 mb-8">
              {mode === 'login'
                ? 'Sign in to your account to continue'
                : 'Start simulating your financial future'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">Age</label>
                      <input
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={handleChange}
                        required
                        min="18"
                        max="120"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
                        placeholder="28"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">Monthly income (£)</label>
                      <input
                        type="number"
                        name="monthly_income"
                        value={form.monthly_income}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
                        placeholder="4000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Risk profile</label>
                    <select
                      name="risk_profile"
                      value={form.risk_profile}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
                    >
                      <option value="low">Low — I prefer safety</option>
                      <option value="medium">Medium — balanced approach</option>
                      <option value="high">High — I can handle volatility</option>
                    </select>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs leading-relaxed">
                      By creating an account you acknowledge that GoalIQ is not regulated financial advice.
                      You'll see a full disclaimer before accessing the platform.
                    </p>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>

          </div>
        </div>
      </div>
    </>
  )
}