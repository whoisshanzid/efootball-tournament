import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/client'
import { CLUB_NAME, TOURNAMENT_NAME } from '../config'
import Logo from '../components/Logo'

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated && !isLoading) {
    navigate('/admin', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      toast.success('Welcome back, admin!')
      const from = location.state?.from?.pathname || '/admin'
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-12">
      <Logo className="mb-4 h-20 w-20 drop-shadow-2xl" />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-pitch">{TOURNAMENT_NAME}</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Admin Login</h1>
      <p className="mt-1.5 text-sm text-muted">{CLUB_NAME} · Sign in to manage players and matches</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full space-y-4 rounded-2xl border border-line bg-panel/60 p-6"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pitch focus:ring-2 focus:ring-pitch/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pitch focus:ring-2 focus:ring-pitch/20"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-pitch py-2.5 text-sm font-bold text-night transition-colors hover:bg-pitch-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}