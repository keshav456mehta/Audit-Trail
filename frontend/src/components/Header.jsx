function Header({ light }) {
  return (
    <header className={`border-b relative ${light ? 'border-[#E8DFC9] bg-[#FAF6EE]/80' : 'border-[#262626] bg-black/60'} backdrop-blur-sm`}>
      <div className="max-w-2xl mx-auto px-6 py-8 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${light ? 'bg-[#C2703D] text-white' : 'bg-[#14B8A6] text-black'}`}>
          AT
        </div>
        <div>
          <h1 className={`text-lg font-semibold tracking-tight ${light ? 'text-[#3B3021] font-serif-warm' : 'text-[#E5E7EB]'}`}>
            Audit Trail
          </h1>
          <p className={`text-xs font-mono ${light ? 'text-[#8A7F6A]' : 'text-[#9CA3AF]'}`}>
            shipment event tracker
          </p>
        </div>
      </div>
    </header>
  )
}

export default Header
