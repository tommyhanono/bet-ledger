import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import CategoryBadge from '../components/CategoryBadge'
import { formatCurrency, formatDate, formatMonth } from '../utils/formatters'
import {
  getWinRateForCategory, getROI, getBiggestWins, getBiggestLosses,
  getBestDay, getStreaks, getMonthlySummary,
  CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS,
} from '../utils/analytics'

const chartTooltip = {
  contentStyle: { background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
}

const Section = ({ title, children }) => (
  <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5">
    <h3 className="font-heading font-semibold text-white mb-4 text-base">{title}</h3>
    {children}
  </div>
)

export default function Analytics({ entries }) {
  const real = entries.filter(e => !e.isInitialBalance)

  const winData = useMemo(() =>
    CATEGORIES.map(cat => {
      const catReal = real.filter(e => e.category === cat)
      const wins = catReal.filter(e => e.amount > 0).length
      const losses = catReal.filter(e => e.amount < 0).length
      return { cat, wins, losses }
    }),
    [real]
  )

  const avgBetData = useMemo(() =>
    CATEGORIES.map(cat => {
      const catReal = real.filter(e => e.category === cat)
      const avg = catReal.length ? catReal.reduce((s, e) => s + Math.abs(e.amount), 0) / catReal.length : 0
      return { name: CATEGORY_LABELS[cat], avg, color: CATEGORY_COLORS[cat] }
    }),
    [real]
  )

  const bigWins = useMemo(() => getBiggestWins(real), [real])
  const bigLosses = useMemo(() => getBiggestLosses(real), [real])
  const bestDay = useMemo(() => getBestDay(real), [real])
  const streaks = useMemo(() => getStreaks(real), [real])
  const monthly = useMemo(() => getMonthlySummary(entries), [entries])

  const bestCat = useMemo(() => {
    const catPnL = CATEGORIES.map(cat => ({
      cat,
      pnl: real.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    }))
    return catPnL.sort((a, b) => b.pnl - a.pnl)[0]
  }, [real])

  if (!real.length) {
    return (
      <div className="fade-in flex items-center justify-center h-64 text-slate-500">
        <p>Add some entries to see analytics</p>
      </div>
    )
  }

  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Deep dive into your betting patterns</p>
      </div>

      {/* Row 1: Win/Loss pies + Avg bet */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Section title="Win / Loss by Category">
          <div className="grid grid-cols-3 gap-2">
            {winData.map(({ cat, wins, losses }) => {
              const data = [
                { name: 'Wins', value: wins },
                { name: 'Losses', value: losses },
              ]
              return (
                <div key={cat} className="flex flex-col items-center">
                  <p className="text-xs text-slate-500 mb-2 text-center">{CATEGORY_LABELS[cat]}</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={data} cx="50%" cy="50%" outerRadius={45} dataKey="value" strokeWidth={0}>
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip {...chartTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-slate-400 mt-1">
                    {wins}W / {losses}L
                  </p>
                </div>
              )
            })}
          </div>
        </Section>

        <Section title="Average Bet Size by Category">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={avgBetData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v.toFixed(0)}`} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
              <Tooltip {...chartTooltip} formatter={(v) => [formatCurrency(v), 'Avg Bet']} />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                {avgBetData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* Row 2: Biggest wins / losses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Biggest 5 Wins 🏆">
          {bigWins.length === 0 ? (
            <p className="text-slate-500 text-sm">No wins yet</p>
          ) : (
            <div className="space-y-2">
              {bigWins.map((e, i) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-600">#{i + 1}</span>
                    <div>
                      <p className="text-sm text-slate-300">{e.type}</p>
                      <p className="text-xs text-slate-600">{formatDate(e.date)}</p>
                    </div>
                  </div>
                  <span className="font-heading font-bold text-green-400">+{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Biggest 5 Losses 📉">
          {bigLosses.length === 0 ? (
            <p className="text-slate-500 text-sm">No losses yet</p>
          ) : (
            <div className="space-y-2">
              {bigLosses.map((e, i) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-600">#{i + 1}</span>
                    <div>
                      <p className="text-sm text-slate-300">{e.type}</p>
                      <p className="text-xs text-slate-600">{formatDate(e.date)}</p>
                    </div>
                  </div>
                  <span className="font-heading font-bold text-red-400">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Row 3: Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Best Day</p>
          <p className="font-heading text-xl font-bold text-amber-400">{bestDay?.day || '—'}</p>
          {bestDay && <p className="text-xs text-slate-500 mt-1">Avg net: {formatCurrency(bestDay.amount)}</p>}
        </div>
        <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Win Streak / Loss Streak</p>
          <p className="font-heading text-xl font-bold">
            <span className="text-green-400">{streaks.maxWin}W</span>
            <span className="text-slate-600 mx-2">/</span>
            <span className="text-red-400">{streaks.maxLoss}L</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Longest consecutive</p>
        </div>
        <div className="bg-[#1a1d27] border border-white/8 rounded-xl p-5 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Best Category</p>
          {bestCat && (
            <>
              <div className="flex justify-center mb-1">
                <CategoryBadge category={bestCat.cat} size="md" />
              </div>
              <p className={`font-heading font-bold text-lg ${bestCat.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {bestCat.pnl >= 0 ? '+' : ''}{formatCurrency(bestCat.pnl)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Row 4: ROI + Monthly table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Section title="ROI by Category">
          <div className="space-y-4">
            {CATEGORIES.map(cat => {
              const roi = getROI(real, cat)
              const wr = getWinRateForCategory(real, cat)
              const color = CATEGORY_COLORS[cat]
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <CategoryBadge category={cat} />
                    <span className="font-heading font-medium" style={{ color }}>
                      {roi === null ? 'N/A' : `${roi.toFixed(1)}% ROI`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Win Rate: {wr.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, wr)}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        <Section title="Monthly Summary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Month', 'Entries', 'Wins', 'Losses', 'Net P&L'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-xs text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map(m => (
                  <tr key={m.month} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="py-2 px-2 text-slate-400 text-xs">{m.month}</td>
                    <td className="py-2 px-2 text-slate-300">{m.entries}</td>
                    <td className="py-2 px-2 text-green-400">{m.wins}</td>
                    <td className="py-2 px-2 text-red-400">{m.losses}</td>
                    <td className={`py-2 px-2 font-heading font-semibold ${m.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {m.net >= 0 ? '+' : ''}{formatCurrency(m.net)}
                    </td>
                  </tr>
                ))}
                {monthly.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-500 text-xs">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  )
}
