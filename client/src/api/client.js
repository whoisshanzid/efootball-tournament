import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

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
    return Promise.reject(error)
  }
)

export function getErrorMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.error || error?.message || fallback
}

export default api