import { format, parseISO } from 'date-fns'

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

export const formatDate = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export const formatDateShort = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'MMM d')
  } catch {
    return dateStr
  }
}

export const formatMonth = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'MMM yyyy')
  } catch {
    return dateStr
  }
}

export const formatPercent = (value, decimals = 1) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`

export const todayISO = () => new Date().toISOString().split('T')[0]

export const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export const formatDateTime = (dateStr, timeStr) => {
  const d = formatDate(dateStr)
  if (!timeStr) return d
  // Convert HH:mm to 12h format
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${d} · ${h12}:${String(m).padStart(2,'0')} ${ampm}`
}
