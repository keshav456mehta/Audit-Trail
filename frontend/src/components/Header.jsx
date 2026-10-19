function Header({ t, user, onLogout }) {
  return (
    <header className={`border-b relative backdrop-blur-sm ${t.light ? 'border-[#E8DFC9] bg-[#FAF6EE]/80' : 'border-[#262626] bg-black/60'}`}>
      <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm text-white"
          style={{ backgroundColor: t.accent, color: t.light ? '#fff' : '#000' }}
        >
          AT
        </div>
        <div className="flex-1">
          <h1 className={`text-lg font-semibold tracking-tight ${t.text}`}>Audit Trail</h1>
          <p className={`text-xs font-mono ${t.dim}`}>immutable shipment ledger</p>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono ${t.dim}`}>
              {user.username} · {user.role}
            </span>
            <button onClick={onLogout} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${t.btnGhost}`}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
