import axios from 'axios'

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

const TOKEN_KEY = 'audit-trail.token'
let memoryToken = null

// sessionStorage can throw (privacy mode, disabled storage), so always fall back to memory.
export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}

export function setToken(token) {
  memoryToken = token
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* memory fallback is enough */
  }
}

export function clearToken() {
  memoryToken = null
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* nothing to clear */
  }
}

export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message = 'Something went wrong', details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/** Normalises axios failures into ApiError so the UI never touches raw axios errors. */
export function toApiError(error) {
  if (error instanceof ApiError) return error
  const body = error?.response?.data
  if (error?.response) {
    return new ApiError({
      status: error.response.status,
      code: body?.error?.code ?? 'HTTP_ERROR',
      message: body?.error?.message ?? `Request failed (${error.response.status})`,
      details: body?.error?.details,
    })
  }
  if (error?.code === 'ECONNABORTED') {
    return new ApiError({ code: 'TIMEOUT', message: 'The server took too long to respond.' })
  }
  return new ApiError({ code: 'NETWORK', message: 'Cannot reach the server. Is the backend running?' })
}

export const http = axios.create({ baseURL: API_URL, timeout: 10_000 })

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let unauthorizedHandler = null
export const onUnauthorized = (handler) => {
  unauthorizedHandler = handler
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error?.config?.url?.includes('/auth/login')
    if (error?.response?.status === 401 && !isLogin && getToken()) {
      clearToken()
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

async function call(promise) {
  try {
    return (await promise).data
  } catch (error) {
    throw toApiError(error)
  }
}

const enc = encodeURIComponent

export const api = {
  login: (username, password) => call(http.post('/auth/login', { username, password })),
  me: () => call(http.get('/auth/me')),
  getShipment: (id, { version } = {}) =>
    call(http.get(`/shipment/${enc(id)}`, { params: version === undefined ? undefined : { version } })),
  getMetrics: (id) => call(http.get(`/shipment/${enc(id)}/metrics`)),
  verify: (id) => call(http.get(`/shipment/${enc(id)}/verify`)),
  listShipments: (params) => call(http.get('/shipment', { params })),
  stats: () => call(http.get('/stats/shipments')),
  move: (body) => call(http.post('/shipment/move', body)),
}
