import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import GoalDetailPage from './pages/GoalDetailPage'
import NewGoalPage from './pages/NewGoalPage'
import ReportPage from './pages/ReportPage'
import SettingsPage from './pages/SettingsPage'
import Navbar from './components/Navbar'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Navbar /><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/goals/new" element={
          <ProtectedRoute><Navbar /><NewGoalPage /></ProtectedRoute>
        } />
        <Route path="/goals/:id" element={
          <ProtectedRoute><Navbar /><GoalDetailPage /></ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute><Navbar /><ReportPage /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><Navbar /><SettingsPage /></ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}