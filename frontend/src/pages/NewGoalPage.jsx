import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGoal, deleteGoal } from '../api'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import GoalIcon from '../components/GoalIcon'
import ConfirmModal from '../components/ConfirmModal'

const GOAL_TYPES = [
  { value: 'house',          label: 'House deposit' },
  { value: 'retirement',     label: 'Retirement' },
  { value: 'emergency_fund', label: 'Emergency fund' },
  { value: 'education',      label: 'Education' },
  { value: 'travel',         label: 'Travel' },
  { value: 'other',          label: 'Other' },
]

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States',  flag: '🇺🇸' },
  { code: 'EU', name: 'Euro Area',      flag: '🇪🇺' },
  { code: 'CA', name: 'Canada',         flag: '🇨🇦' },
  { code: 'AU', name: 'Australia',      flag: '🇦🇺' },
  { code: 'IN', name: 'India',          flag: '🇮🇳' },
  { code: 'JP', name: 'Japan',          flag: '🇯🇵' },
  { code: 'SG', name: 'Singapore',      flag: '🇸🇬' },
]

export default function NewGoalPage() {
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [selectedCountry, setSelectedCountry] = useState('GB')
  const [inflationData, setInflationData]     = useState(null)
  const [inflationLoading, setInflationLoading] = useState(false)

  const [pendingWarning, setPendingWarning] = useState(null)
  const [resolvingWarning, setResolvingWarning] = useState(false)

  const [form, setForm] = useState({
    name:               '',
    goal_type:          'other',
    target_amount:      '',
    monthly_allocation: '',
    years:              '',
    current_balance:    '',
    inflation_rate:     '2',
    notes:              '',
  })

  // Fetch inflation when country changes
  useEffect(() => {
    const fetchInflation = async () => {
      setInflationLoading(true)
      try {
        const res = await api.get(`/inflation/${selectedCountry}`)
        const rate = res.data.inflation_rate
        setInflationData(res.data)
        if (rate !== null) {
          setForm((prev) => ({ ...prev, inflation_rate: rate.toFixed(1) }))
        }
      } catch {
        setInflationData(null)
      } finally {
        setInflationLoading(false)
      }
    }
    fetchInflation()
  }, [selectedCountry])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const monthlyIncome    = user?.monthly_income ? parseFloat(user.monthly_income) : null
  const allocationValue  = parseFloat(form.monthly_allocation) || 0
  const exceedsIncome    = monthlyIncome && allocationValue > monthlyIncome
  const incomeWarning    = exceedsIncome
    ? `Monthly allocation exceeds your income of £${monthlyIncome.toLocaleString()}`
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (exceedsIncome) {
      setError(`Monthly allocation cannot exceed your monthly income of £${monthlyIncome.toLocaleString()}`)
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await createGoal({
        name:               form.name,
        goal_type:          form.goal_type,
        target_amount:      parseFloat(form.target_amount),
        monthly_allocation: parseFloat(form.monthly_allocation),
        years:              parseInt(form.years),
        current_balance:    parseFloat(form.current_balance || 0),
        inflation_rate:     parseFloat(form.inflation_rate || 0) / 100,
        notes:              form.notes || null,
      })

      if (res.data.warning) {
        setPendingWarning({ id: res.data.id, warning: res.data.warning })
        setLoading(false)
        return
      }

      navigate(`/goals/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create goal')
      setLoading(false)
    }
  }

  const handleKeepGoal = () => {
    navigate(`/goals/${pendingWarning.id}`)
  }

  const handleDiscardGoal = async () => {
    setResolvingWarning(true)
    try {
      await deleteGoal(pendingWarning.id)
    } finally {
      setResolvingWarning(false)
      setPendingWarning(null)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-16 md:pt-10 pb-10">

      <ConfirmModal
        open={!!pendingWarning}
        title="Heads up"
        message={pendingWarning?.warning ? `${pendingWarning.warning}\n\nThe goal has been created. Keep it, or discard it and adjust the numbers?` : ''}
        confirmLabel="Keep it"
        cancelLabel={resolvingWarning ? 'Discarding...' : 'Discard'}
        onConfirm={handleKeepGoal}
        onCancel={handleDiscardGoal}
      />

      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white text-sm transition-colors mb-4 flex items-center gap-1"
        >
          ← Back to dashboard
        </button>
        <h1 className="text-3xl font-bold text-white">New goal</h1>
        <p className="text-gray-400 mt-1">Define what you're saving toward</p>
      </div>

      {monthlyIncome && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">Your monthly income</span>
          <span className="text-white font-semibold">£{monthlyIncome.toLocaleString()}/month</span>
        </div>
      )}

      {!monthlyIncome && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
          <p className="text-yellow-400 text-sm">
            ⚠️ You haven't set a monthly income yet.{' '}
            <button
              onClick={() => navigate('/settings')}
              className="underline hover:text-yellow-300 transition-colors"
            >
              Add it in Settings
            </button>{' '}
            to enable income validation.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="block text-sm text-gray-400 mb-3">Goal type</label>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm({ ...form, goal_type: type.value })}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-all ${
                  form.goal_type === type.value
                    ? 'border-emerald-400 bg-emerald-400/10 text-white'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                }`}
              >
                <GoalIcon type={type.value} className="w-5 h-5" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Goal name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. House deposit, Retirement fund"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Target amount (£)</label>
            <input
              type="number"
              name="target_amount"
              value={form.target_amount}
              onChange={handleChange}
              required
              min="1"
              placeholder="60000"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Current balance (£)</label>
            <input
              type="number"
              name="current_balance"
              value={form.current_balance}
              onChange={handleChange}
              min="0"
              placeholder="0"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Monthly allocation (£)</label>
            <input
              type="number"
              name="monthly_allocation"
              value={form.monthly_allocation}
              onChange={handleChange}
              required
              min="1"
              placeholder="500"
              className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                exceedsIncome
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-gray-700 focus:border-emerald-400'
              }`}
            />
            {incomeWarning && (
              <p className="text-red-400 text-xs mt-1">{incomeWarning}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Time horizon (years)</label>
            <input
              type="number"
              name="years"
              value={form.years}
              onChange={handleChange}
              required
              min="1"
              max="50"
              placeholder="10"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <label className="block text-sm text-gray-400">Inflation rate</label>

          <div className="flex items-center gap-2">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>

            {inflationLoading ? (
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin inline-block" />
                Fetching...
              </span>
            ) : inflationData?.inflation_rate != null ? (
              <span className="text-xs bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 px-2.5 py-1 rounded-full">
                Latest CPI: {inflationData.inflation_rate}%
              </span>
            ) : (
              <span className="text-xs text-gray-600">No recent data</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              name="inflation_rate"
              value={form.inflation_rate}
              onChange={handleChange}
              min="0"
              max="20"
              step="0.1"
              className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
            <span className="text-gray-500 text-sm">% — edit to override</span>
          </div>
          <p className="text-gray-600 text-xs">
            Pre-filled from latest World Bank CPI data. Adjust if needed.
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Notes <span className="text-gray-600">(optional)</span>
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any notes about this goal..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl px-4 py-2.5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || exceedsIncome}
            className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold rounded-xl px-8 py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create goal →'}
          </button>
        </div>

      </form>
    </div>
  )
}