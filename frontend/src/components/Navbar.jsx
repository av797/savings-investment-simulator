import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logoutUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/auth')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-400 rounded-md flex items-center justify-center">
            <span className="text-gray-950 font-black text-sm">W</span>
          </div>
          <span className="font-semibold text-white tracking-tight">WealthSim</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/report"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/report')
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Report
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden md:block">{user?.email}</span>
          <Link
            to="/settings"
            className={`text-sm transition-colors ${
              isActive('/settings')
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>

      </div>
    </nav>
  )
}