import { useState, useRef } from 'react'

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#0ea5e9', '#ec4899', '#14b8a6']
const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const avatarColor = (users, id) => AVATAR_COLORS[users.findIndex(u => u.id === id) % AVATAR_COLORS.length]

export default function Settings({ entries, onImport, onReset, currentUser, authHook, onLogout }) {
  const [resetText, setResetText] = useState('')
  const [showResetDialog, setShowResetDialog] = useState(false)
  const fileRef = useRef()

  // Account management state
  const [showAddUser, setShowAddUser] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPwConfirm, setNewPwConfirm] = useState('')
  const [addError, setAddError] = useState('')
  const [changePwMode, setChangePwMode] = useState(null)
  const [newPwChange, setNewPwChange] = useState('')
  const [pwChangeError, setPwChangeError] = useState('')
  const [showPwFor, setShowPwFor] = useState(null) // userId whose password is revealed

  const { users, addUser, updateUserPassword, deleteUser } = authHook || {}
  const isAdmin = currentUser?.isAdmin === true

  const exportCSV = () => {
    const headers = ['id', 'date', 'category', 'type', 'amount', 'platform', 'odds', 'session', 'notes', 'isInitialBalance']
    const rows = entries.map(e =>
      headers.map(h => {
        const v = e[h]
        if (v === null || v === undefined) return ''
        if (typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n')))
          return `"${v.replace(/"/g, '""')}"`
        return String(v)
      }).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `betledger-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const lines = ev.target.result.trim().split('\n')
        const headers = lines[0].split(',')
        const data = lines.slice(1).map(line => {
          const vals = line.split(',')
          const obj = {}
          headers.forEach((h, i) => {
            let v = (vals[i] || '').trim().replace(/^"|"$/g, '')
            if (h === 'amount') v = parseFloat(v) || 0
            else if (h === 'isInitialBalance') v = v === 'true'
            else if (v === '') v = null
            obj[h] = v
          })
          return obj
        })
        onImport(data)
        alert(`Imported ${data.length} entries successfully`)
      } catch {
        alert('Failed to parse CSV. Please use a BetLedger export file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    if (resetText !== 'RESET') return
    onReset()
    setShowResetDialog(false)
    setResetText('')
  }

  const handleAddUser = () => {
    setAddError('')
    if (!newName.trim()) return setAddError('Name is required')
    if (newPw.length < 4) return setAddError('Password must be at least 4 characters')
    if (newPw !== newPwConfirm) return setAddError('Passwords do not match')
    addUser(newName.trim(), newPw)
    setNewName(''); setNewPw(''); setNewPwConfirm(''); setShowAddUser(false)
  }

  const handleChangePassword = (userId) => {
    setPwChangeError('')
    if (newPwChange.length < 4) return setPwChangeError('Min. 4 characters')
    updateUserPassword(userId, newPwChange)
    setChangePwMode(null); setNewPwChange('')
  }

  return (
    <div className="fade-in space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin ? 'Admin panel — full account control' : 'Manage your data and preferences'}
        </p>
      </div>

      {/* ── ADMIN: Full account management ─────────────────────────── */}
      {isAdmin && (
        <div className="bg-[#1a1d27] border border-amber-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-white">Account Management</h3>
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">Admin</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{users?.length} accounts — {users?.length === 1 ? 'just you' : `${users.length - 1} other${users.length > 2 ? 's' : ''}`}</p>
            </div>
            {!showAddUser && (
              <button
                onClick={() => setShowAddUser(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all font-medium"
              >
                + New Account
              </button>
            )}
          </div>

          {/* User list — admin view */}
          <div className="space-y-3">
            {users && users.map(u => (
              <div key={u.id} className={`p-3 rounded-xl border transition-all ${u.id === currentUser?.id ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5'}`}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-heading font-bold text-white flex-shrink-0"
                    style={{ background: avatarColor(users, u.id) }}
                  >
                    {initials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{u.name}</p>
                      {u.id === currentUser?.id && <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">You</span>}
                      {u.isAdmin && <span className="text-xs text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full">Admin</span>}
                      {u.freshStart ? <span className="text-xs text-slate-600 px-1">Fresh start</span> : <span className="text-xs text-slate-600 px-1">Has seed</span>}
                    </div>
                    {/* Password reveal — admin only */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600">Password:</span>
                      <span className="text-xs font-mono text-slate-400">
                        {showPwFor === u.id ? u.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => setShowPwFor(showPwFor === u.id ? null : u.id)}
                        className="text-xs text-slate-600 hover:text-slate-300 transition-colors"
                      >
                        {showPwFor === u.id ? 'hide' : 'show'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setChangePwMode(changePwMode === u.id ? null : u.id); setNewPwChange(''); setPwChangeError('') }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
                      title="Change password"
                    >🔑</button>
                    {u.id !== 'tommy' && (
                      <button
                        onClick={() => { if (window.confirm(`Delete "${u.name}"? Their data will remain in Firebase but they won't be able to log in.`)) deleteUser(u.id) }}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                        title="Delete account"
                      >🗑️</button>
                    )}
                  </div>
                </div>
                {/* Inline password change form */}
                {changePwMode === u.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newPwChange}
                      onChange={e => { setNewPwChange(e.target.value); setPwChangeError('') }}
                      placeholder="New password"
                      className="flex-1 bg-[#0f1117] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
                    />
                    <button onClick={() => handleChangePassword(u.id)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all">Save</button>
                    <button onClick={() => { setChangePwMode(null); setNewPwChange('') }} className="text-xs px-2 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all">✕</button>
                  </div>
                )}
                {pwChangeError && changePwMode === u.id && <p className="text-xs text-red-400 mt-1">{pwChangeError}</p>}
              </div>
            ))}
          </div>

          {/* Add new account form */}
          {showAddUser && (
            <div className="mt-4 p-4 bg-[#0f1117] rounded-xl border border-white/8 space-y-3">
              <p className="text-sm font-medium text-white">Create New Account</p>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Name (e.g. Maria)"
                className="w-full bg-[#1a1d27] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
              />
              <input
                type="text"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#1a1d27] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
              />
              <input
                type="text"
                value={newPwConfirm}
                onChange={e => setNewPwConfirm(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-[#1a1d27] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
              />
              <p className="text-xs text-slate-600">New account starts at $0. You can share the password with your friend.</p>
              {addError && <p className="text-xs text-red-400">{addError}</p>}
              <div className="flex gap-2">
                <button onClick={handleAddUser} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all">Create Account</button>
                <button onClick={() => { setShowAddUser(false); setNewName(''); setNewPw(''); setNewPwConfirm(''); setAddError('') }} className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-all">Cancel</button>
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/5">
            <button onClick={onLogout} className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <span>🚪</span> Sign out of {currentUser?.name}
            </button>
          </div>
        </div>
      )}

      {/* ── REGULAR USER: own account only ─────────────────────────── */}
      {!isAdmin && (
        <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5">
          <h3 className="font-heading font-semibold text-white mb-4">My Account</h3>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-base font-heading font-bold text-white"
              style={{ background: users ? avatarColor(users, currentUser?.id) : '#3b82f6' }}
            >
              {initials(currentUser?.name || '?')}
            </div>
            <div>
              <p className="font-medium text-white">{currentUser?.name}</p>
              <p className="text-xs text-slate-500">Personal account</p>
            </div>
          </div>

          {/* Change own password */}
          {changePwMode === currentUser?.id ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">New password:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPwChange}
                  onChange={e => { setNewPwChange(e.target.value); setPwChangeError('') }}
                  placeholder="New password"
                  className="flex-1 bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
                />
                <button onClick={() => handleChangePassword(currentUser.id)} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-all">Save</button>
                <button onClick={() => { setChangePwMode(null); setNewPwChange('') }} className="px-2 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-sm transition-all">✕</button>
              </div>
              {pwChangeError && <p className="text-xs text-red-400">{pwChangeError}</p>}
            </div>
          ) : (
            <button
              onClick={() => setChangePwMode(currentUser?.id)}
              className="text-sm px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
            >
              🔑 Change my password
            </button>
          )}

          <div className="mt-5 pt-4 border-t border-white/5">
            <button onClick={onLogout} className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <span>🚪</span> Sign out of {currentUser?.name}
            </button>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5">
        <h3 className="font-heading font-semibold text-white mb-1">Export Data</h3>
        <p className="text-sm text-slate-500 mb-4">Download all {entries.length} entries as a CSV file.</p>
        <button
          onClick={exportCSV}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-heading font-semibold transition-all"
        >
          Download CSV
        </button>
      </div>

      {/* Import */}
      <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5">
        <h3 className="font-heading font-semibold text-white mb-1">Import Data</h3>
        <p className="text-sm text-slate-500 mb-4">Import entries from a BetLedger CSV export. This will replace all current data.</p>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-sm font-heading font-medium transition-all"
        >
          Choose CSV File
        </button>
      </div>

      {/* Reset */}
      <div className="bg-[#1a1d27] border border-red-500/20 rounded-xl p-5">
        <h3 className="font-heading font-semibold text-white mb-1">Reset All Data</h3>
        <p className="text-sm text-slate-500 mb-4">Permanently delete all entries and reset to the initial seed data. This cannot be undone.</p>
        {!showResetDialog ? (
          <button
            onClick={() => setShowResetDialog(true)}
            className="px-5 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-heading font-medium transition-all"
          >
            Reset All Data
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400 font-medium">Type <strong>RESET</strong> to confirm:</p>
            <input
              value={resetText}
              onChange={e => setResetText(e.target.value)}
              placeholder="RESET"
              className="w-full bg-[#0f1117] border border-red-500/30 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={resetText !== 'RESET'}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-heading font-semibold transition-all"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => { setShowResetDialog(false); setResetText('') }}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5">
        <h3 className="font-heading font-semibold text-white mb-3">About BetLedger</h3>
        <div className="space-y-2 text-sm text-slate-500">
          <p>Version 1.0.0</p>
          <p>{entries.length} entries synced to Firebase.</p>
          <p>
            <a
              href="https://github.com/tommyhanono/bet-ledger"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              View on GitHub →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
