const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬛' },
  { id: 'history', label: 'History', icon: '📋' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ page, setPage }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-[#13151f] border-r border-white/5 min-h-screen sticky top-0">
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎰</span>
            <span className="font-heading font-bold text-xl text-white tracking-tight">BetLedger</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Gambling & Betting Tracker</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left
                ${page === item.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/5">
          <p className="text-xs text-slate-600">v1.0.0</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#13151f] border-t border-white/5 flex">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors
              ${page === item.id ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </>
  )
}
