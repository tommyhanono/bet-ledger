import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const makeSeed = () => [
  {
    id: uuidv4(),
    category: 'casino',
    type: 'Initial Balance',
    amount: -2000,
    date: '2024-01-01',
    platform: '',
    odds: null,
    session: null,
    notes: 'Starting deficit — Casino',
    isInitialBalance: true,
  },
  {
    id: uuidv4(),
    category: 'sports',
    type: 'Initial Balance',
    amount: -500,
    date: '2024-01-01',
    platform: '',
    odds: null,
    session: null,
    notes: 'Starting deficit — Sports Betting',
    isInitialBalance: true,
  },
  {
    id: uuidv4(),
    category: 'online-gambling',
    type: 'Initial Balance',
    amount: -1100,
    date: '2024-01-01',
    platform: 'Stake',
    odds: null,
    session: null,
    notes: 'Starting deficit — Stake / Online Gambling',
    isInitialBalance: true,
  },
]

const loadEntries = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const saveEntries = (key, entries) => {
  try {
    localStorage.setItem(key, JSON.stringify(entries))
  } catch {}
}

// storageKey is provided by the logged-in user object (e.g. 'betledger-v1-tommy')
export const useLocalStorage = (storageKey = 'betledger-v1') => {
  const [entries, setEntries] = useState(() => {
    const stored = loadEntries(storageKey)
    if (stored) return stored
    const seed = makeSeed()
    saveEntries(storageKey, seed)
    return seed
  })

  const _set = useCallback((next) => {
    setEntries(next)
    saveEntries(storageKey, next)
  }, [storageKey])

  const addEntry = useCallback((data) => {
    _set((prev) => [...prev, { id: uuidv4(), ...data, isInitialBalance: false }])
  }, [_set])

  const editEntry = useCallback((id, data) => {
    _set((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)))
  }, [_set])

  const deleteEntry = useCallback((id) => {
    _set((prev) => prev.filter((e) => e.id !== id))
  }, [_set])

  const resetAll = useCallback(() => {
    _set(makeSeed())
  }, [_set])

  const importEntries = useCallback((newEntries) => {
    _set(newEntries)
  }, [_set])

  return { entries, addEntry, editEntry, deleteEntry, resetAll, importEntries }
}
