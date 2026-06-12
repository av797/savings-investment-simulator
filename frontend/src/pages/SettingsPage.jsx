import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const RISK_OPTIONS = [
  {
    value: 'low',
    label: 'Low',
    desc: 'I prefer safety over returns. I cannot afford to lose money.',
    icon: '🛡️',
  },
  {
    value: 'medium',
    label: 'Medium',
    desc: 'Balanced approach. Some risk is fine for better long-term returns.',
    icon: '⚖️',
  },
  {
    value: 'high',
    label: 'High',
    desc: 'I can handle volatility and short-term losses for maximum growth.',
    icon: '🚀',
  },
]

export default function SettingsPage() {
  const { user, loginUser, logoutUser } = useAuth()
  const navigate                        = useNavigate()
  const fileInputRef                    = useRef(null)

  const displayName = user?.email?.split('@')[0] || 'Account'

  const [form, setForm] = useState({
    age:            user?.age?.toString()            || '',
    monthly_income: user?.monthly_income?.toString() || '',
    risk_profile:   user?.risk_profile               || 'medium',
  })

  const [avatarPreview, setAvatarPreview]     = useState(user?.avatar || null)
  const [saving, setSaving]                   = useState(false)
  const [success, setSuccess]                 = useState(false)
  const [error, setError]                     = useState('')
  const [deleting, setDeleting]               = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess(false)
    setError('')
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }

    setUploadingAvatar(true)
    setError('')

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target.result
      setAvatarPreview(base64)
      try {
        const res = await api.patch('/users/me', { avatar: base64 })
        const token = localStorage.getItem('token')
        loginUser(token, res.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to upload photo')
        setAvatarPreview(user?.avatar || null)
      } finally {
        setUploadingAvatar(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true)
    setError('')
    try {
      const res = await api.patch('/users/me', { avatar: null })
      const token = localStorage.getItem('token')
      loginUser(token, res.data)
      setAvatarPreview(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove photo')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const payload = {}
      if (form.age)            payload.age            = parseInt(form.age)
      if (form.monthly_income) payload.monthly_income = parseFloat(form.monthly_income)
      if (form.risk_profile)   payload.risk_profile   = form.risk_profile

      const res = await api.patch('/users/me', payload)
      const token = localStorage.getItem('token')
      loginUser(token, res.data)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete('/users/me')
      logoutUser()
      navigate('/auth')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete account')
      setDeleting(false)
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
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Update your profile and preferences</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-white mb-5">Profile photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-emerald-400/10 border-2 border-emerald-400/20 flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-emerald-400 font-bold text-2xl">
                  {displayName[0]?.toUpperCase()}
                </span>
              )}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-gray-950/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div>
            <p className="text-white font-medium mb-1">{displayName}</p>
            <p className="text-gray-500 text-sm mb-3">{user?.email}</p>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {avatarPreview ? 'Change photo' : 'Upload photo'}
              </button>
              {avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="text-sm text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-gray-600 text-xs mt-2">JPG, PNG or GIF · Max 2MB</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-5">Financial profile</h2>
          <p className="text-sm text-gray-500 mb-5">
            This information is used by the AI suggestion model to recommend
            the right asset allocation for your goals.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Age</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                min="18"
                max="100"
                placeholder="28"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Monthly income (£)
                <span className="text-gray-600 ml-1">— used to validate goal allocations</span>
              </label>
              <input
                type="number"
                name="monthly_income"
                value={form.monthly_income}
                onChange={handleChange}
                min="0"
                placeholder="4000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3">Risk tolerance</label>
            <div className="space-y-2">
              {RISK_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    form.risk_profile === option.value
                      ? 'border-emerald-400 bg-emerald-400/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="risk_profile"
                    value={option.value}
                    checked={form.risk_profile === option.value}
                    onChange={handleChange}
                    className="mt-0.5 accent-emerald-400"
                  />
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{option.icon}</span>
                    <div>
                      <div className="text-white font-medium text-sm">{option.label}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{option.desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-2">How your profile is used</h3>
          <ul className="space-y-1.5 text-sm text-gray-500">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">→</span>
              <span>Monthly income validates that goal allocations stay within your budget</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">→</span>
              <span>Age and risk tolerance inform the AI split suggestion on each goal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">→</span>
              <span>Risk profile affects how the model weighs safety vs growth when suggesting allocations</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-400 text-sm">
            ✓ Settings saved successfully
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>

      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mt-6">
        <h2 className="font-semibold text-red-400 mb-1">Danger zone</h2>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and all associated goals and simulations. This cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium rounded-xl px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete my account'}
        </button>
      </div>

    </div>
  )
}