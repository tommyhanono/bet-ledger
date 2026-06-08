import { useState, useMemo } from 'react'
import CategoryBadge from '../components/CategoryBadge'
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters'
import { CATEGORIES } from '../utils/analytics'

const PAGE_SIZE = 25

const COLS = [
  { key: 'date', label: 'Date & Time' },
  { key: 'category', label: 'Category' },
  { key: 'type', label: 'Type' },
  { key: 'platform', label: 'Platform' },
  { key: 'odds', label: 'Odds' },
  { key: 'amount', label: 'Amount' },
  { key: 'session', label: 'Session' },
]

export default function History({ entries, onEdit, onDelete }) {
  const [sort, setSort] = useState({ key: 'date', dir: -1 })
  const [filter, setFilter] = useState({ cats: [], winLoss: 'all', platform: '', search: '', dateFrom: '', dateTo: '' })
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(null)

  const platforms = useMemo(() => [...new Set(entries.map(e => e.platform).filter(Boolean))], [entries])

  const filtered = useMemo(() => {
    let r = [...entries]
    if (filter.cats.length) r = r.filter(e => filter.cats.includes(e.category))
    if (filter.winLoss === 'win') r = r.filter(e => e.amount > 0)
    if (filter.winLoss === 'loss') r = r.filter(e => e.amount < 0)
    if (filter.platform) r = r.filter(e => e.platform === filter.platform)
    if (filter.search) {
      const q = filter.search.toLowerCase()
      r = r.filter(e => (e.type || '').toLowerCase().includes(q) || (e.notes || '').toLowerCase().includes(q))
    }
    if (filter.dateFrom) r = r.filter(e => e.date >= filter.dateFrom)
    if (filter.dateTo) r = r.filter(e => e.date <= filter.dateTo)
    return r
  }, [entries, filter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sort.key] ?? ''
      const bv = b[sort.key] ?? ''
      if (av < bv) return -sort.dir
      if (av > bv) return sort.dir
      // Tiebreak on date: use time as secondary sort
      if (sort.key === 'date') {
        const at = a.time ?? '00:00'
        const bt = b.time ?? '00:00'
        if (at < bt) return -sort.dir
        if (at > bt) return sort.dir
      }
      return 0
    })
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const netPnL = filtered.reduce((s, e) => s + e.amount, 0)

  const toggleSort = (key) => {
    setSort(prev => prev.key === key ? { key, dir: -prev.dir } : { key, dir: -1 })
    setPage(1)
  }

  const toggleCat = (cat) => {
    setFilter(prev => ({
      ...prev,
      cats: prev.cats.includes(cat) ? prev.cats.filter(c => c !== cat) : [...prev.cats, cat],
    }))
    setPage(1)
  }

  const SortIcon = ({ k }) => {
    if (sort.key !== k) return <span className="text-slate-700 ml-1">↕</span>
    return <span className="text-blue-400 ml-1">{sort.dir === 1 ? '↑' : '↓'}</span>
  }

  return (
    <div className="fade-in space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">History</h1>
        <p className="text-sm text-slate-500 mt-1">All entries — sort, filter, and manage</p>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 mr-1">Category:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${filter.cats.includes(cat) ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' : 'border-white/10 text-slate-500 hover:border-white/20'}`}
            >
              {cat === 'online-gambling' ? 'Online' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
          <div className="flex gap-1 ml-2">
            {['all', 'win', 'loss'].map(v => (
              <button
                key={v}
                onClick={() => { setFilter(p => ({ ...p, winLoss: v })); setPage(1) }}
                className={`text-xs px-3 py-1 rounded-full border transition-all capitalize ${filter.winLoss === v ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' : 'border-white/10 text-slate-500 hover:border-white/20'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            value={filter.search}
            onChange={e => { setFilter(p => ({ ...p, search: e.target.value })); setPage(1) }}
            placeholder="Search type, notes..."
            className="flex-1 min-w-40 bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
          />
          <select
            value={filter.platform}
            onChange={e => { setFilter(p => ({ ...p, platform: e.target.value })); setPage(1) }}
            className="bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/40"
          >
            <option value="">All platforms</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" value={filter.dateFrom} onChange={e => { setFilter(p => ({ ...p, dateFrom: e.target.value })); setPage(1) }}
            className="bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/40" />
          <input type="date" value={filter.dateTo} onChange={e => { setFilter(p => ({ ...p, dateTo: e.target.value })); setPage(1) }}
            className="bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/40" />
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{filtered.length} entries</span>
        <span>
          Net P&L: <span className={`font-heading font-semibold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL)}
          </span>
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#1a1d27] border border-white/8 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {COLS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                  >
                    {col.label}<SortIcon k={col.key} />
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">No entries match your filters</td></tr>
              )}
              {pageData.map(e => (
                <>
                  <tr
                    key={e.id}
                    className="border-b border-white/3 hover:bg-white/3 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  >
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      <span>{formatDate(e.date)}</span>
                      {e.time && <span className="block text-slate-600 text-xs mt-0.5">{
                        (() => { const [h,m] = e.time.split(':').map(Number); const ap = h>=12?'PM':'AM'; return `${h%12||12}:${String(m).padStart(2,'0')} ${ap}` })()
                      }</span>}
                    </td>
                    <td className="px-4 py-3"><CategoryBadge category={e.category} /></td>
                    <td className="px-4 py-3 text-slate-300">
                      {e.type}
                      {e.isInitialBalance && <span className="ml-2 text-xs text-slate-600 border border-slate-700 rounded px-1">INITIAL</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{e.platform || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{e.odds || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-heading font-semibold ${e.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {e.amount >= 0 ? '+' : ''}{formatCurrency(e.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-32 truncate">{e.session || '—'}</td>
                    <td className="px-4 py-3">
                      {!e.isInitialBalance && (
                        <div className="flex gap-1">
                          <button
                            onClick={ev => { ev.stopPropagation(); onEdit(e) }}
                            className="p-1.5 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                          >✏️</button>
                          <button
                            onClick={ev => { ev.stopPropagation(); onDelete(e.id) }}
                            className="p-1.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                          >🗑️</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expanded === e.id && e.notes && (
                    <tr key={`${e.id}-exp`} className="bg-white/2">
                      <td colSpan={8} className="px-6 py-3 text-sm text-slate-400 italic">{e.notes}</td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
