import { useState, useEffect } from 'react'
import { CATEGORY_LABELS, CATEGORY_COLORS, TYPE_SUGGESTIONS } from '../utils/analytics'
import { todayISO, nowTime } from '../utils/formatters'

const PLATFORMS = ['Stake', 'DraftKings', 'Hard Rock', 'BetMGM', 'FanDuel', 'PointsBet', 'Caesars', 'MGM Grand', 'Bellagio', 'Aria']

const EMPTY = {
  category: 'casino',
  type: '',
  result: 'loss',
  amount: '',
  date: todayISO(),
  time: nowTime(),
  platform: '',
  odds: '',
  session: '',
  notes: '',
}

export default function Modal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          ...EMPTY,
          ...initial,
          result: initial.amount >= 0 ? 'win' : 'loss',
          amount: String(Math.abs(initial.amount)),
          time: initial.time || '',
        })
      } else {
        setForm({ ...EMPTY, date: todayISO(), time: nowTime() })
      }
      setErrors({})
    }
  }, [open, initial])

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const validate = () => {
    const e = {}
    if (!form.category) e.category = 'Required'
    if (!form.type.trim()) e.type = 'Required'
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Enter a positive number'
    if (!form.date) e.date = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const amount = form.result === 'win' ? Number(form.amount) : -Number(form.amount)
    onSave({
      category: form.category,
      type: form.type.trim(),
      amount,
      date: form.date,
      time: form.time || null,
      platform: form.platform.trim() || null,
      odds: form.category === 'sports' && form.odds.trim() ? form.odds.trim() : null,
      session: form.session.trim() || null,
      notes: form.notes.trim() || null,
    })
    onClose()
  }

  if (!open) return null

  const suggestions = TYPE_SUGGESTIONS[form.category] || []
  const catColor = CATEGORY_COLORS[form.category]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1a1d27] border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="font-heading text-lg font-semibold text-white">
            {initial ? 'Edit Entry' : 'Add Entry'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none transition-colors">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { set('category', val); set('type', '') }}
                  className="py-2 px-3 rounded-lg border text-xs font-medium transition-all"
                  style={form.category === val
                    ? { borderColor: CATEGORY_COLORS[val], color: CATEGORY_COLORS[val], background: `${CATEGORY_COLORS[val]}18` }
                    : { borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="relative">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Type {errors.type && <span className="text-red-400 ml-1">{errors.type}</span>}</label>
            <input
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. Blackjack, Parlay..."
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d27] border border-white/10 rounded-lg overflow-hidden z-10 shadow-xl">
                {suggestions.filter(s => !form.type || s.toLowerCase().includes(form.type.toLowerCase())).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => set('type', s)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Win / Loss */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Result</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set('result', 'win')}
                className={`py-3 rounded-xl font-heading font-bold text-base transition-all border ${form.result === 'win' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'border-white/10 text-slate-500 hover:border-green-500/30'}`}
              >
                WIN
              </button>
              <button
                type="button"
                onClick={() => set('result', 'loss')}
                className={`py-3 rounded-xl font-heading font-bold text-base transition-all border ${form.result === 'loss' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-white/10 text-slate-500 hover:border-red-500/30'}`}
              >
                LOSS
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Amount (USD) {errors.amount && <span className="text-red-400 ml-1">{errors.amount}</span>}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Date {errors.date && <span className="text-red-400 ml-1">{errors.date}</span>}</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Time <span className="text-slate-600">(optional)</span></label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Platform <span className="text-slate-600">(optional)</span></label>
            <input
              value={form.platform}
              onChange={(e) => set('platform', e.target.value)}
              list="platforms"
              placeholder="Stake, DraftKings, Hard Rock..."
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
            <datalist id="platforms">
              {PLATFORMS.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          {/* Odds (sports only) */}
          {form.category === 'sports' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Odds <span className="text-slate-600">(optional, e.g. -110, +250)</span></label>
              <input
                value={form.odds}
                onChange={(e) => set('odds', e.target.value)}
                placeholder="-110"
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          )}

          {/* Session */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Session <span className="text-slate-600">(optional)</span></label>
            <input
              value={form.session}
              onChange={(e) => set('session', e.target.value)}
              placeholder="e.g. Friday night casino"
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Notes <span className="text-slate-600">(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl font-heading font-semibold text-sm text-white transition-all"
              style={{ background: `${catColor}cc`, boxShadow: `0 0 20px ${catColor}30` }}
            >
              {initial ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
