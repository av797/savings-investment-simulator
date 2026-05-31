import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGoal } from '../api'

const GOAL_TYPES = [
  { value: 'house',          label: 'House deposit',   icon: '🏠' },
  { value: 'retirement',     label: 'Retirement',      icon: '👴' },
  { value: 'emergency_fund', label: 'Emergency fund',  icon: '🛡️' },
  { value: 'education',      label: 'Education',       icon: '🎓' },
  { value: 'travel',         label: 'Travel',          icon: '✈️' },
  { value: 'other',          label: 'Other',           icon: '🎯' },
]

export default function NewGoalPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
      navigate(`/goals/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
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

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Goal type */}
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
                <span className="text-xl">{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
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

        {/* Target + current balance */}
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

        {/* Monthly + years */}
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
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
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

        {/* Inflation */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Inflation rate (%) <span className="text-gray-600">— 2% is typical</span>
          </label>
          <input
            type="number"
            name="inflation_rate"
            value={form.inflation_rate}
            onChange={handleChange}
            min="0"
            max="20"
            step="0.1"
            placeholder="2"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Notes <span className="text-gray-600">(optional)</span></label>
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
            disabled={loading}
            className="flex-2 bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold rounded-xl px-8 py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create goal →'}
          </button>
        </div>

      </form>
    </div>
  )
}