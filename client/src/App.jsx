import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Logo from './components/Logo'
import Home from './pages/Home'
import Players from './pages/Players'
import PlayerProfile from './pages/PlayerProfile'
import Knockout from './pages/Knockout'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import { useAuth } from './context/AuthContext'
import { APP_AUTHOR, APP_AUTHOR_URL, TOURNAMENT_NAME } from './config'

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Logo className="h-14 w-14 animate-pulse drop-shadow-lg" />
        <p className="text-sm text-muted">Checking session…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/player/:id" element={<PlayerProfile />} />
          <Route path="/knockout" element={<Knockout />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-line bg-night/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1 px-4 text-center sm:flex-row sm:justify-between sm:px-6">
          <p className="text-xs text-muted">{TOURNAMENT_NAME}</p>
          <p className="text-xs text-muted">
            Built by{' '}
            <a
              href={APP_AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline decoration-pitch/50 underline-offset-2 transition-colors hover:text-pitch"
            >
              {APP_AUTHOR}
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}