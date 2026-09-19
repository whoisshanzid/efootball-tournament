import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

const TOKEN_KEY = 'ef_token'
const USERNAME_KEY = 'ef_username'

function readSession(key) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSession(key, value) {
  try {
    if (value == null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, value)
  } catch {}
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readSession(TOKEN_KEY))
  const [username, setUsername] = useState(() => readSession(USERNAME_KEY))
  const [isLoading, setIsLoading] = useState(() => Boolean(readSession(TOKEN_KEY)))

  const clearSession = useCallback(() => {
    writeSession(TOKEN_KEY, null)
    writeSession(USERNAME_KEY, null)
    setToken(null)
    setUsername(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    let cancelled = false
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (cancelled) return
        setUsername(data.username)
        writeSession(USERNAME_KEY, data.username)
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        clearSession()
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, clearSession])

  useEffect(() => {
    const handleUnauthorized = () => clearSession()
    window.addEventListener('ef:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('ef:unauthorized', handleUnauthorized)
  }, [clearSession])

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    writeSession(TOKEN_KEY, data.token)
    writeSession(USERNAME_KEY, data.username)
    setToken(data.token)
    setUsername(data.username)
    setIsLoading(false)
    return data
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setIsLoading(false)
  }, [clearSession])

  const updateUsername = useCallback((name) => {
    writeSession(USERNAME_KEY, name)
    setUsername(name)
  }, [])

  return (
    <AuthContext.Provider
      value={{ token, username, isAuthenticated: Boolean(token), isLoading, login, logout, updateUsername }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}