import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CLUB_NAME } from '../config'
import Logo from './Logo'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { isAuthenticated, username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-pitch/15 text-pitch' : 'text-muted hover:bg-panel-2 hover:text-ink'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-night/80 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <Logo className="h-10 w-10 drop-shadow-lg transition-transform group-hover:scale-105" />
          <span className="hidden text-sm font-bold tracking-wide sm:block">
            {CLUB_NAME.split(' ')[0]}{' '}
            <span className="bg-gradient-to-r from-pitch to-white bg-clip-text text-transparent">
              {CLUB_NAME.split(' ').slice(1).join(' ')}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <NavLink to="/" className={linkClass} end>
            Point Table
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
              <span className="ml-1 hidden items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs text-muted md:flex">
                <span className="h-2 w-2 rounded-full bg-pitch" />
                {username}
              </span>
              <button
                onClick={handleLogout}
                className="ml-1 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  )
}