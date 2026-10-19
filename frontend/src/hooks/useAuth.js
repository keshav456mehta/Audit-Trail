import { useCallback, useEffect, useState } from 'react'
import { api, clearToken, getToken, onUnauthorized, setToken } from '../api/client'

/** status: 'checking' (validating a stored token) | 'anonymous' | 'authenticated' */
export function useAuth() {
  const [state, setState] = useState({ status: getToken() ? 'checking' : 'anonymous', user: null })

  useEffect(() => {
    onUnauthorized(() => setState({ status: 'anonymous', user: null }))
    if (!getToken()) return undefined

    let cancelled = false
    api
      .me()
      .then(({ user }) => !cancelled && setState({ status: 'authenticated', user }))
      .catch(() => {
        if (cancelled) return
        clearToken()
        setState({ status: 'anonymous', user: null })
      })
    return () => {
      cancelled = true
      onUnauthorized(null)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const { token, user } = await api.login(username, password)
    setToken(token)
    setState({ status: 'authenticated', user })
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setState({ status: 'anonymous', user: null })
  }, [])

  return { ...state, login, logout }
}
