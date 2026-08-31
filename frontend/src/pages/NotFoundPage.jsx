import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-8">
          The page you're looking for doesn't exist, or the link is broken.
        </p>
        <Link
          to="/dashboard"
          className="inline-block bg-emerald-400 hover:bg-emerald-300 text-gray-950 font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}