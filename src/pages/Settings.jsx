import { useState, useRef } from 'react'
import { formatDate } from '../utils/formatters'

export default function Settings({ entries, onImport, onReset }) {
  const [resetText, setResetText] = useState('')
  const [showResetDialog, setShowResetDialog] = useState(false)
  const fileRef = useRef()

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

  return (
    <div className="fade-in space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your data and preferences</p>
      </div>

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
          <p>{entries.length} total entries stored locally in your browser.</p>
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
