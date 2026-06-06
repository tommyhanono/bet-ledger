import { parseISO, format, getDay } from 'date-fns'

export const CATEGORIES = ['casino', 'sports', 'online-gambling']

export const CATEGORY_LABELS = {
  casino: 'Casino',
  sports: 'Sports Betting',
  'online-gambling': 'Online Gambling',
}

export const CATEGORY_COLORS = {
  casino: '#f59e0b',
  sports: '#0ea5e9',
  'online-gambling': '#8b5cf6',
}

export const TYPE_SUGGESTIONS = {
  casino: ['Blackjack', 'Roulette', 'Poker', 'Slots', 'Baccarat', 'Craps'],
  sports: ['Moneyline', 'Spread', 'Parlay', 'Over/Under', 'Prop Bet', 'Futures'],
  'online-gambling': ['Crash', 'Mines', 'Dice', 'Plinko', 'Slots', 'Roulette', 'Blackjack', 'Stake Originals'],
}

const real = (entries) => entries.filter((e) => !e.isInitialBalance)

export const getTotalPnL = (entries) =>
  entries.reduce((sum, e) => sum + e.amount, 0)

export const getCategoryPnL = (entries, category) =>
  entries.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0)

export const getWinRate = (entries) => {
  const r = real(entries)
  if (!r.length) return 0
  const wins = r.filter((e) => e.amount > 0).length
  return (wins / r.length) * 100
}

export const getWinRateForCategory = (entries, category) => {
  const r = real(entries).filter((e) => e.category === category)
  if (!r.length) return 0
  return (r.filter((e) => e.amount > 0).length / r.length) * 100
}

export const getROI = (entries, category) => {
  const r = real(entries).filter((e) => !category || e.category === category)
  const totalWins = r.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0)
  const totalLosses = r.filter((e) => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0)
  if (!totalLosses) return null
  return (totalWins / totalLosses) * 100
}

export const getBreakeven = (entries) => {
  const total = getTotalPnL(entries)
  return total < 0 ? Math.abs(total) : 0
}

export const getInitialDeficit = (entries, category) => {
  const initials = entries.filter((e) => e.isInitialBalance && (!category || e.category === category))
  return Math.abs(initials.reduce((s, e) => s + e.amount, 0))
}

export const getCategoryProgress = (entries, category) => {
  const deficit = getInitialDeficit(entries, category)
  const nonInitialPnL = real(entries)
    .filter((e) => e.category === category)
    .reduce((s, e) => s + e.amount, 0)
  if (!deficit) return 100
  const progress = (nonInitialPnL / deficit) * 100
  return Math.min(100, Math.max(0, progress))
}

export const getRunningPnL = (entries) => {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const points = []
  let running = { casino: 0, sports: 0, 'online-gambling': 0, total: 0 }

  for (const e of sorted) {
    running[e.category] += e.amount
    running.total += e.amount
    points.push({ date: e.date, ...running })
  }
  return points
}

export const getMonthlyPnL = (entries) => {
  const map = {}
  for (const e of entries) {
    const month = format(parseISO(e.date), 'yyyy-MM')
    if (!map[month]) map[month] = { month, casino: 0, sports: 0, 'online-gambling': 0 }
    map[month][e.category] += e.amount
  }
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
}

export const getBiggestWins = (entries, n = 5) =>
  real(entries)
    .filter((e) => e.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n)

export const getBiggestLosses = (entries, n = 5) =>
  real(entries)
    .filter((e) => e.amount < 0)
    .sort((a, b) => a.amount - b.amount)
    .slice(0, n)

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const getBestDay = (entries) => {
  const map = {}
  for (const e of real(entries)) {
    const day = getDay(parseISO(e.date))
    if (!map[day]) map[day] = 0
    map[day] += e.amount
  }
  if (!Object.keys(map).length) return null
  const best = Object.entries(map).sort((a, b) => b[1] - a[1])[0]
  return { day: DAYS[best[0]], amount: best[1] }
}

export const getStreaks = (entries) => {
  const sorted = real(entries).sort((a, b) => a.date.localeCompare(b.date))
  let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0
  for (const e of sorted) {
    if (e.amount > 0) { curWin++; curLoss = 0 }
    else { curLoss++; curWin = 0 }
    if (curWin > maxWin) maxWin = curWin
    if (curLoss > maxLoss) maxLoss = curLoss
  }
  return { maxWin, maxLoss }
}

export const getMonthlySummary = (entries) => {
  const map = {}
  for (const e of entries) {
    const month = format(parseISO(e.date), 'yyyy-MM')
    if (!map[month]) map[month] = { month, entries: 0, wins: 0, losses: 0, net: 0 }
    if (!e.isInitialBalance) {
      map[month].entries++
      if (e.amount > 0) map[month].wins++
      else map[month].losses++
    }
    map[month].net += e.amount
  }
  return Object.values(map).sort((a, b) => b.month.localeCompare(a.month))
}
