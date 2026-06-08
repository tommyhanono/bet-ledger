import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import CategoryBadge from '../components/CategoryBadge'
import { formatCurrency, formatDate, formatDateShort, formatMonth } from '../utils/formatters'
import {
  getTotalPnL, getCategoryPnL, getWinRate, getBreakeven,
  getRunningPnL, getMonthlyPnL, getCategoryProgress, getInitialDeficit,
  CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS,
} from '../utils/analytics'

const AmountCell = ({ amount }) => (
  <span className={`font-heading font-semibold ${amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
    {amount >= 0 ? '+' : ''}{formatCurrency(amount)}
  </span>
)

const StatCard = ({ label, value, sub, valueClass = '' }) => (
  <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5">
    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</p>
    <p className={`font-heading text-2xl font-bold ${valueClass}`}>{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
)

const chartTooltipStyle = {
  contentStyle: { background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
}

export default function Dashboard({ entries, onAddEntry, onEdit }) {
  const real = entries.filter((e) => !e.isInitialBalance)
  const totalPnL = getTotalPnL(entries)
  const winRate = getWinRate(entries)
  const breakeven = getBreakeven(entries)

  const runningData = useMemo(() => getRunningPnL(entries), [entries])
  const monthlyData = useMemo(() => getMonthlyPnL(entries), [entries])
  const recent = useMemo(() =>
    [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [entries]
  )

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Your betting overview at a glance</p>
        </div>
        <button
          onClick={onAddEntry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-heading font-semibold text-sm transition-all shadow-lg shadow-blue-900/30"
        >
          + Add Entry
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total P&L"
          value={formatCurrency(totalPnL)}
          valueClass={totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}
          sub="All categories combined"
        />
        <StatCard
          label="Breakeven Target"
          value={breakeven > 0 ? `${formatCurrency(breakeven)}` : 'In the green!'}
          valueClass={breakeven > 0 ? 'text-amber-400' : 'text-green-400'}
          sub={breakeven > 0 ? 'Needed to break even' : 'Profitable overall'}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          valueClass={winRate >= 50 ? 'text-green-400' : 'text-red-400'}
          sub={`${real.filter(e => e.amount > 0).length}W / ${real.filter(e => e.amount < 0).length}L`}
        />
        <StatCard
          label="Total Entries"
          value={real.length}
          sub={`${entries.length} total including initial`}
        />
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const catPnL = getCategoryPnL(entries, cat)
          const catEntries = real.filter((e) => e.category === cat)
          const progress = getCategoryProgress(entries, cat)
          const deficit = getInitialDeficit(entries, cat)
          const color = CATEGORY_COLORS[cat]
          return (
            <div key={cat} className="bg-[#1a1d27] border border-white/8 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <CategoryBadge category={cat} size="md" />
                <span className={`font-heading font-bold text-lg ${catPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {catPnL >= 0 ? '+' : ''}{formatCurrency(catPnL)}
                </span>
              </div>
              <p className="text-xs text-slate-500">{catEntries.length} entries</p>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Recovery progress</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: color }}
                  />
                </div>
                {deficit > 0 && (
                  <p className="text-xs text-slate-600 mt-1">Initial deficit: {formatCurrency(-deficit)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Running P&L */}
        <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5">
          <h3 className="font-heading font-semibold text-white mb-4">Running P&L Over Time</h3>
          {runningData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={runningData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={formatDateShort} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [formatCurrency(v)]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
                <Line type="monotone" dataKey="casino" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Casino" />
                <Line type="monotone" dataKey="sports" stroke="#0ea5e9" strokeWidth={1.5} dot={false} name="Sports" />
                <Line type="monotone" dataKey="online-gambling" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="Online" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              Not enough data — add more entries to see the chart
            </div>
          )}
        </div>

        {/* Monthly P&L */}
        <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5">
          <h3 className="font-heading font-semibold text-white mb-4">Monthly P&L</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v.slice(0, 7)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [formatCurrency(v)]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="casino" fill="#f59e0b" name="Casino" radius={[2,2,0,0]} />
                <Bar dataKey="sports" fill="#0ea5e9" name="Sports" radius={[2,2,0,0]} />
                <Bar dataKey="online-gambling" fill="#8b5cf6" name="Online" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-white">Recent Activity</h3>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm mb-3">No entries yet</p>
            <button onClick={onAddEntry} className="text-blue-400 hover:text-blue-300 text-sm underline">Add your first entry</button>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/3 transition-colors cursor-pointer"
                onClick={() => !e.isInitialBalance && onEdit(e)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-slate-600 flex-shrink-0 w-28">
                    {formatDate(e.date)}
                    {e.time && <span className="block text-slate-700">{
                      (() => { const [h,m] = e.time.split(':').map(Number); const ap = h>=12?'PM':'AM'; return `${h%12||12}:${String(m).padStart(2,'0')} ${ap}` })()
                    }</span>}
                  </span>
                  <CategoryBadge category={e.category} />
                  <span className="text-sm text-slate-300 truncate">{e.type}</span>
                  {e.isInitialBalance && (
                    <span className="text-xs text-slate-600 border border-slate-700 rounded px-1">INITIAL</span>
                  )}
                </div>
                <AmountCell amount={e.amount} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
