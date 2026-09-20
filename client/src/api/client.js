import axios from 'axios'

function resolveApiUrl() {
  const raw = import.meta.env.VITE_API_URL || ''
  if (!raw) return '/api'
  const base = raw.replace(/\/+$/, '')
  return base.endsWith('/api') ? base : `${base}/api`
}

const API_URL = resolveApiUrl()

const TOKEN_KEY = 'ef_token'
const USERNAME_KEY = 'ef_username'

function readSession(key) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USERNAME_KEY)
  } catch {}
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = readSession(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      if (!isLoginRequest) {
        clearSession()
        window.dispatchEvent(new Event('ef:unauthorized'))
      }
    }
    if (!error.response && error.request) {
      console.error('[api] Request failed before a response was received', {
        url: error.config?.url,
        method: (error.config?.method || '').toUpperCase(),
        baseURL: error.config?.baseURL,
        code: error.code,
        message: error.message,
        tokenSent: Boolean(error.config?.headers?.Authorization),
      })
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(error, fallback = 'Something went wrong') {
  const msg = error?.response?.data?.error || error?.message || fallback
  if (!error?.response && error?.request) {
    const method = (error.config?.method || 'get').toUpperCase()
    const url = error.config?.url || error.config?.baseURL || '(unknown)'
    return `${msg} — ${method} ${url}: no server response (network/CORS). Hard-refresh the browser (clear site data) and re-login, then retry.`
  }
  return msg
}

export default api