export const TOKEN_KEY = 'vendorbridge_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(path, { ...options, headers })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const errorJson = await response.json()
      message = errorJson?.error || errorJson?.message || message
    } catch {
      // ignore non-json errors
    }
    throw new Error(message)
  }
  return response.json()
}

