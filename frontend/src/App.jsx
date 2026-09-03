import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import GoalDetailPage from './pages/GoalDetailPage'
import NewGoalPage from './pages/NewGoalPage'
import ReportPage from './pages/ReportPage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import MarketsPage from './pages/MarketsPage'
import ChatBot from './components/ChatBot'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

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

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/goals/new" element={
        <ProtectedRoute><AppShell><NewGoalPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/goals/:id" element={
        <ProtectedRoute><AppShell><GoalDetailPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/report" element={
        <ProtectedRoute><AppShell><ReportPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><AppShell><SettingsPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/help" element={
        <ProtectedRoute><AppShell><HelpPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/markets" element={
        <ProtectedRoute><AppShell><MarketsPage /></AppShell></ProtectedRoute>
      } />
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function ChatBotGate() {
  const { user } = useAuth()
  if (!user) return null
  return <ChatBot />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-950 text-gray-100">
          <AppRoutes />
          <ChatBotGate />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}