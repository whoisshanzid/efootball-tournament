import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../api/client'
import PlayerForm from '../components/PlayerForm'
import MatchForm from '../components/MatchForm'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'players', label: 'Players', icon: '👤' },
  { id: 'matches', label: 'Matches', icon: '⚽' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminDashboard() {
  const { username, updateUsername } = useAuth()
  const [tab, setTab] = useState('players')
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [editingMatch, setEditingMatch] = useState(null)
  const [deletingPlayer, setDeletingPlayer] = useState(null)
  const [deletingMatch, setDeletingMatch] = useState(null)
  const [busy, setBusy] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [matchQuery, setMatchQuery] = useState('')
  const [createFormVersion, setCreateFormVersion] = useState(0)

  const loadPlayers = useCallback(async () => {
    try {
      const { data } = await api.get('/players')
      setPlayers(data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load players'))
    } finally {
      setLoadingPlayers(false)
    }
  }, [])

  const loadMatches = useCallback(async () => {
    try {
      const { data } = await api.get('/matches')
      setMatches(data.filter((m) => (m.stage || 'GROUP') === 'GROUP'))
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load matches'))
    } finally {
      setLoadingMatches(false)
    }
  }, [])

  useEffect(() => {
    loadPlayers()
    loadMatches()
  }, [loadPlayers, loadMatches])

  const visibleMatches = useMemo(() => {
    const q = matchQuery.trim().toLowerCase()
    if (!q) return matches
    return matches.filter(
      (m) =>
        m.home?.name?.toLowerCase().includes(q) || m.away?.name?.toLowerCase().includes(q)
    )
  }, [matches, matchQuery])

  const resetForms = () => {
    setEditingPlayer(null)
    setEditingMatch(null)
  }

  const handlePlayerSubmit = async (data, initial) => {
    setBusy(true)
    try {
      if (initial) {
        await api.put(`/players/${initial.id}`, data)
        toast.success('Player updated')
      } else {
        await api.post('/players', data)
        toast.success('Player added')
      }
      resetForms()
      await loadPlayers()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleMatchSubmit = async (data, initial) => {
    setBusy(true)
    try {
      if (initial) {
        await api.put(`/matches/${initial.id}`, data)
        toast.success('Match updated')
      } else {
        await api.post('/matches', data)
        toast.success('Match created')
        setCreateFormVersion((v) => v + 1)
        setMatchQuery('')
      }
      resetForms()
      await Promise.all([loadMatches(), loadPlayers()])
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const confirmDeletePlayer = async () => {
    if (!deletingPlayer) return
    setBusy(true)
    try {
      await api.delete(`/players/${deletingPlayer.id}`)
      toast.success(`"${deletingPlayer.name}" deleted`)
      setDeletingPlayer(null)
      resetForms()
      await Promise.all([loadPlayers(), loadMatches()])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete player'))
    } finally {
      setBusy(false)
    }
  }

  const confirmDeleteMatch = async () => {
    if (!deletingMatch) return
    setBusy(true)
    try {
      await api.delete(`/matches/${deletingMatch.id}`)
      toast.success('Match deleted')
      setDeletingMatch(null)
      resetForms()
      await loadMatches()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete match'))
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateCredentials = async (e) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error('Current password is required')
      return
    }
    if (newPassword && newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      const { data } = await api.put('/auth/credentials', {
        currentPassword,
        username: newUsername.trim() || undefined,
        password: newPassword || undefined,
      })
      updateUsername(data.username)
      toast.success('Login credentials updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setNewUsername('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update credentials'))
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pitch focus:ring-2 focus:ring-pitch/20'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Manage players and matches</p>
        </div>
        <div className="flex rounded-xl border border-line bg-panel p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id)
                resetForms()
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-pitch text-night' : 'text-muted hover:text-ink'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'players' && (
        <div className="space-y-5">
          <PlayerForm
            initial={editingPlayer}
            onSubmit={(data) => handlePlayerSubmit(data, editingPlayer)}
            onCancel={editingPlayer ? () => setEditingPlayer(null) : null}
            submitting={busy}
          />

          <div className="overflow-hidden rounded-2xl border border-line bg-panel/60">
            <div className="flex items-center justify-between border-b border-line bg-panel-2/60 px-5 py-3.5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted">
                All Players ({players.length})
              </h3>
            </div>
            {loadingPlayers ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-panel-2" />
                ))}
              </div>
            ) : players.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">
                No players yet. Add your first player above!
              </p>
            ) : (
              <ul className="divide-y divide-line/60">
                {players.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-panel-2/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{p.name}</p>
                      <p className="truncate text-xs text-muted">
                        {p.team || 'No team'} · {p._count.homeMatches + p._count.awayMatches} matches
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => setEditingPlayer(p)}
                        className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-pitch"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingPlayer(p)}
                        className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'matches' && (
        <div className="space-y-5">
          <MatchForm
            key={`create-${createFormVersion}`}
            players={players}
            onSubmit={(data) => handleMatchSubmit(data, null)}
            submitting={busy}
          />

          <div className="overflow-hidden rounded-2xl border border-line bg-panel/60">
            <div className="flex flex-col gap-3 border-b border-line bg-panel-2/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted">
                All Matches ({visibleMatches.length}
                {matchQuery.trim() ? ` of ${matches.length}` : ''})
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={matchQuery}
                  onChange={(e) => setMatchQuery(e.target.value)}
                  placeholder="Search by player name…"
                  className="w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pitch focus:ring-2 focus:ring-pitch/20 sm:w-52"
                />
                {matchQuery.trim() && (
                  <button
                    onClick={() => setMatchQuery('')}
                    className="rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {loadingMatches ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-panel-2" />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">
                No matches yet. Create one above!
              </p>
            ) : visibleMatches.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">
                No matches found for “{matchQuery.trim()}”.
              </p>
            ) : (
              <ul className="divide-y divide-line/60">
                {visibleMatches.map((m) => {
                  const played = m.played && m.homeScore != null && m.awayScore != null

                  if (editingMatch?.id === m.id) {
                    return (
                      <li key={m.id} className="p-4 sm:p-5">
                        <MatchForm
                          players={players}
                          initial={m}
                          onSubmit={(data) => handleMatchSubmit(data, m)}
                          onCancel={() => setEditingMatch(null)}
                          submitting={busy}
                        />
                      </li>
                    )
                  }

                  return (
                    <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-panel-2/40 sm:flex-nowrap">
                      <span className="shrink-0 rounded-md border border-line bg-panel-2 px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted">
                        #{m.id}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="max-w-[130px] truncate font-semibold text-ink">{m.home.name}</span>
                        <span className="shrink-0 rounded-lg border border-line bg-panel-2 px-2.5 py-1 text-sm font-black tracking-wider text-ink">
                          {played ? `${m.homeScore} - ${m.awayScore}` : 'vs'}
                        </span>
                        <span className="max-w-[130px] truncate font-semibold text-ink">{m.away.name}</span>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          played ? 'bg-pitch/15 text-pitch' : 'bg-panel-2 text-muted'
                        }`}
                      >
                        {played ? 'Played' : 'Upcoming'}
                      </span>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => setEditingMatch(m)}
                          className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-pitch"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingMatch(m)}
                          className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="mx-auto max-w-xl">
          <form
            onSubmit={handleUpdateCredentials}
            className="rounded-2xl border border-line bg-panel/60 p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pitch/15 text-xl">
                🔐
              </span>
              <div>
                <h3 className="font-bold text-ink">Change Login Credentials</h3>
                <p className="text-xs text-muted">
                  Currently logged in as <span className="font-semibold text-pitch">{username}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Current Password *</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">New Username (optional)</span>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder={username}
                  className={inputClass}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">New Password (optional)</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">Confirm New Password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !currentPassword}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-pitch to-pitch-dark py-2.5 text-sm font-bold text-night shadow-lg shadow-pitch/20 transition-all hover:shadow-pitch/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save Credentials'}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              Enter your current password to confirm the change. Your login session stays active.
            </p>
          </form>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deletingPlayer)}
        title="Delete player?"
        message={`"${deletingPlayer?.name}" and all of their matches will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete Player"
        onConfirm={confirmDeletePlayer}
        onCancel={() => setDeletingPlayer(null)}
        busy={busy}
      />
      <ConfirmModal
        open={Boolean(deletingMatch)}
        title="Delete match?"
        message={`${deletingMatch?.home?.name} vs ${deletingMatch?.away?.name} will be permanently deleted.`}
        confirmLabel="Delete Match"
        onConfirm={confirmDeleteMatch}
        onCancel={() => setDeletingMatch(null)}
        busy={busy}
      />
    </div>
  )
}