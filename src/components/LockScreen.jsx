import { useState } from 'react'

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#0ea5e9',
]

export default function LockScreen({ users, onLogin }) {
  const [selectedUser, setSelectedUser] = useState(users[0]?.id || '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const user = users.find(u => u.id === selectedUser)

  const handleSubmit = (e) => {
    e.preventDefault()
    const ok = onLogin(selectedUser, password, remember)
    if (!ok) {
      setError('Incorrect password. Try again.')
      setPassword('')
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }
  }

  const avatarColor = (id) => AVATAR_COLORS[users.findIndex(u => u.id === id) % AVATAR_COLORS.length]
  const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0c13]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-violet-600/5 blur-3xl" />
      </div>

      <div className={`relative w-full max-w-sm mx-4 ${shake ? 'animate-shake' : ''}`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-3xl">🎰</span>
            <span className="font-heading font-bold text-2xl text-white tracking-tight">BetLedger</span>
          </div>
          <p className="text-sm text-slate-500">Gambling & Betting Tracker</p>
        </div>

        <div className="bg-[#1a1d27] border border-white/8 rounded-2xl p-7 shadow-2xl">
          {/* User selector (only if multiple users) */}
          {users.length > 1 && (
            <div className="mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Select account</p>
              <div className="flex gap-3 flex-wrap justify-center">
                {users.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setSelectedUser(u.id); setError(''); setPassword('') }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                      selectedUser === u.id ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : 'hover:bg-white/5'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-heading font-bold text-white"
                      style={{ background: avatarColor(u.id) }}
                    >
                      {initials(u.name)}
                    </div>
                    <span className="text-xs text-slate-400 max-w-16 truncate text-center">{u.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Single user avatar (when only 1 user) */}
          {users.length === 1 && user && (
            <div className="flex flex-col items-center mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-heading font-bold text-white mb-2"
                style={{ background: avatarColor(user.id) }}
              >
                {initials(user.name)}
              </div>
              <p className="font-heading font-semibold text-white">{user.name}</p>
            </div>
          )}

          {/* Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">
                Password
                {users.length > 1 && user && (
                  <span className="ml-1 text-slate-600">— {user.name}</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  autoComplete="current-password"
                  // Use the user's name as username hint for browser password manager
                  name={`password-${selectedUser}`}
                  id={`password-${selectedUser}`}
                  placeholder="Enter password"
                  autoFocus
                  className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-400 mt-1.5">{error}</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setRemember(r => !r)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  remember ? 'bg-blue-600 border-blue-600' : 'border-white/20 bg-transparent'
                }`}
              >
                {remember && <span className="text-white text-xs leading-none">✓</span>}
              </div>
              <span className="text-sm text-slate-400">Remember me for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={!password}
              className="w-full py-3 rounded-xl font-heading font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/30"
            >
              Unlock
            </button>
          </form>

          {/* Browser save password hint */}
          <p className="text-center text-xs text-slate-600 mt-4">
            Save password in your browser to use Face ID / Touch ID
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.55s ease-in-out; }
      `}</style>
    </div>
  )
}
