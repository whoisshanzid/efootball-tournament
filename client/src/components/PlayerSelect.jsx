import { useEffect, useMemo, useRef, useState } from 'react'

export default function PlayerSelect({
  players = [],
  value = '',
  onChange,
  label,
  placeholder = 'Search player…',
  excludeId = null,
}) {
  const [query, setQuery] = useState('')
  const [touched, setTouched] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef(null)

  const selectedPlayer = players.find((p) => String(p.id) === String(value)) || null

  useEffect(() => {
    if (selectedPlayer) {
      setQuery(selectedPlayer.name)
    } else {
      setQuery('')
    }
    setTouched(false)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [])

  const filterQuery = touched ? query.trim().toLowerCase() : ''

  const filtered = useMemo(() => {
    const q = filterQuery
    return players
      .filter((p) => String(p.id) !== String(excludeId))
      .filter((p) => {
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q) || (p.team || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const aStarts = q ? a.name.toLowerCase().startsWith(q) : false
        const bStarts = q ? b.name.toLowerCase().startsWith(q) : false
        if (aStarts !== bStarts) return aStarts ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      .slice(0, 7)
  }, [players, filterQuery, excludeId])

  useEffect(() => {
    setHighlight(0)
  }, [filtered, open])

  const select = (p) => {
    onChange(String(p.id))
    setQuery(p.name)
    setTouched(false)
    setOpen(false)
  }

  const clear = () => {
    onChange('')
    setQuery('')
    setTouched(false)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      setHighlight((h) => (filtered.length ? (h + 1) % filtered.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (filtered.length ? (h - 1 + filtered.length) % filtered.length : 0))
    } else if (e.key === 'Enter') {
      if (open && filtered[highlight]) {
        e.preventDefault()
        select(filtered[highlight])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setTouched(true)
              setOpen(true)
            }}
            onPointerDown={() => setOpen(true)}
            onMouseDown={() => setOpen(true)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full rounded-xl border border-line bg-panel-2 py-2.5 pl-3.5 pr-9 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pitch focus:ring-2 focus:ring-pitch/20"
          />
          {selectedPlayer && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                clear()
              }}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
              aria-label="Clear selection"
              title="Clear selection"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {open && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-line bg-panel shadow-xl shadow-black/30">
            {filtered.length === 0 ? (
              <p className="px-3.5 py-3 text-sm text-muted">
                No player matches “{query.trim()}”
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto p-1">
                {filtered.map((p, i) => {
                  const active = i === highlight
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault()
                          select(p)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          select(p)
                        }}
                        onMouseEnter={() => setHighlight(i)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                          active ? 'bg-pitch/15' : 'hover:bg-panel-2'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-black ${
                            active ? 'bg-pitch/20 text-pitch' : 'bg-panel-2 text-muted'
                          }`}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-ink">{p.name}</span>
                          {p.team && <span className="block truncate text-[11px] text-muted">{p.team}</span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </label>
  )
}