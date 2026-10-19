import { THEMES } from '../theme'

function ThemeSwitch({ theme, onChange, t }) {
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={`inline-flex gap-1 p-1 rounded-xl border ${t.light ? 'border-[#E8DFC9] bg-white/60' : 'border-[#262626] bg-[#0F0F0F]/60'}`}
    >
      {THEMES.map((option) => {
        const active = theme === option.id
        return (
          <button
            key={option.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors ${
              active
                ? t.light
                  ? 'bg-[#3B3021] text-white'
                  : 'bg-white text-black'
                : t.light
                  ? 'text-[#8A7F6A] hover:bg-[#F0E9D8]'
                  : 'text-[#9CA3AF] hover:bg-[#1F2937]'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: option.swatch }} />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default ThemeSwitch
