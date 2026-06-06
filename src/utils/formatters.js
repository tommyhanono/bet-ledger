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
