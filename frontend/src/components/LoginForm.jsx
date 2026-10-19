import { useState } from 'react'

function LoginForm({ onLogin, t }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onLogin(username, password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={`max-w-sm mx-auto rounded-xl border p-6 space-y-4 ${t.card}`} aria-label="Sign in">
      <h2 className={`text-base font-semibold ${t.text}`}>Sign in</h2>
      <label className="block">
        <span className={`text-xs ${t.dim}`}>Username</span>
        <input
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={`mt-1 w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 ${t.input}`}
        />
      </label>
      <label className="block">
        <span className={`text-xs ${t.dim}`}>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-1 w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 ${t.input}`}
        />
      </label>
      {error && (
        <p role="alert" className={`text-sm rounded-lg px-3 py-2 ${t.danger}`}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !username || !password}
        className={`w-full font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors ${t.btn}`}
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      {import.meta.env.DEV && (
        <p className={`text-xs ${t.faint}`}>After <span className="font-mono">npm run seed</span>: operator / operator-pass-123</p>
      )}
    </form>
  )
}

export default LoginForm
