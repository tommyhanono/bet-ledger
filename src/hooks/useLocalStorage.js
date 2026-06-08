import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  collection, doc, setDoc, deleteDoc, getDocs,
  onSnapshot, writeBatch, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

// ── Seed data ────────────────────────────────────────────────────────────────
const makeSeed = () => [
  { id: uuidv4(), category: 'casino',          type: 'Initial Balance', amount: -2000, date: '2024-01-01', platform: '', odds: null, session: null, notes: 'Starting deficit — Casino',           isInitialBalance: true },
  { id: uuidv4(), category: 'sports',          type: 'Initial Balance', amount: -500,  date: '2024-01-01', platform: '', odds: null, session: null, notes: 'Starting deficit — Sports Betting',    isInitialBalance: true },
  { id: uuidv4(), category: 'online-gambling', type: 'Initial Balance', amount: -1100, date: '2024-01-01', platform: 'Stake', odds: null, session: null, notes: 'Starting deficit — Stake',         isInitialBalance: true },
]

// ── localStorage helpers (local cache for fast loads) ────────────────────────
const localLoad  = (key) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null } catch { return null } }
const localSave  = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)) } catch {} }

// ── Firestore helpers ────────────────────────────────────────────────────────
const colRef = (userId) => collection(db, 'users', userId, 'entries')

const fsWrite = async (userId, entry) => {
  const clean = Object.fromEntries(
    Object.entries(entry).map(([k, v]) => [k, v === undefined ? null : v])
  )
  await setDoc(doc(db, 'users', userId, 'entries', entry.id), clean)
}

const fsDelete = async (userId, id) => {
  await deleteDoc(doc(db, 'users', userId, 'entries', id))
}

const fsBatch = async (userId, entries) => {
  const batch = writeBatch(db)
  entries.forEach(e => {
    const clean = Object.fromEntries(
      Object.entries(e).map(([k, v]) => [k, v === undefined ? null : v])
    )
    batch.set(doc(db, 'users', userId, 'entries', e.id), clean)
  })
  await batch.commit()
}

// ── Hook ─────────────────────────────────────────────────────────────────────
// userId     = e.g. 'tommy' (used as Firestore document path: users/tommy/entries/...)
// localKey   = e.g. 'betledger-v1-tommy' (localStorage cache key)
// freshStart = true → new account starts with 0 entries (no deficit seed)
export const useLocalStorage = (localKey = 'betledger-v1', userId = null, freshStart = false) => {
  const [entries, setEntries] = useState(() => localLoad(localKey) || [])
  const [synced, setSynced]   = useState(false)
  const [loading, setLoading] = useState(true)
  const skipNextSnapshot = useRef(false)

  // ── Subscribe to Firestore realtime updates ──────────────────────────────
  useEffect(() => {
    if (!userId) return
    setLoading(true)

    const unsub = onSnapshot(
      colRef(userId),
      (snap) => {
        if (skipNextSnapshot.current) { skipNextSnapshot.current = false; return }

        const docs = snap.docs.map(d => d.data())

        // First load: if Firestore is empty → seed with deficit (tommy) or empty (others)
        if (docs.length === 0 && !synced) {
          if (freshStart) {
            // Account starts completely empty — no seed data at all
            setEntries([])
            localSave(localKey, [])
            setSynced(true)
            setLoading(false)
            return
          }
          const cached = localLoad(localKey)
          const initial = cached && cached.length > 0 ? cached : makeSeed()
          fsBatch(userId, initial).catch(console.error)
          // onSnapshot will fire again with the seeded data
          return
        }

        const sorted = docs.sort((a, b) => a.date.localeCompare(b.date))
        setEntries(sorted)
        localSave(localKey, sorted)
        setSynced(true)
        setLoading(false)
      },
      (err) => {
        console.warn('Firestore offline, using local cache:', err.message)
        const cached = localLoad(localKey)
        if (cached) setEntries(cached)
        setLoading(false)
      }
    )

    return unsub
  }, [userId, localKey])

  // ── Optimistic update helper ─────────────────────────────────────────────
  const _set = useCallback((next, firestoreOp) => {
    setEntries((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      localSave(localKey, resolved)
      return resolved
    })
    if (userId && firestoreOp) {
      firestoreOp().catch(console.error)
    }
  }, [localKey, userId])

  // ── Public API ───────────────────────────────────────────────────────────
  const addEntry = useCallback((data) => {
    const entry = { id: uuidv4(), ...data, isInitialBalance: false }
    _set((prev) => [...prev, entry], () => fsWrite(userId, entry))
  }, [_set, userId])

  const editEntry = useCallback((id, data) => {
    setEntries((prev) => {
      const resolved = prev.map((e) => (e.id === id ? { ...e, ...data } : e))
      localSave(localKey, resolved)
      if (userId) {
        const updated = resolved.find(e => e.id === id)
        if (updated) fsWrite(userId, updated).catch(console.error)
      }
      return resolved
    })
  }, [userId, localKey])

  const deleteEntry = useCallback((id) => {
    _set((prev) => prev.filter((e) => e.id !== id), () => fsDelete(userId, id))
  }, [_set, userId])

  const resetAll = useCallback(async () => {
    const seed = freshStart ? [] : makeSeed()
    // Delete all existing docs in Firestore then write seed (if any)
    if (userId) {
      try {
        const snap = await getDocs(colRef(userId))
        const batch = writeBatch(db)
        snap.docs.forEach(d => batch.delete(d.ref))
        await batch.commit()
        if (seed.length > 0) await fsBatch(userId, seed)
      } catch (e) { console.error(e) }
    }
    _set(seed)
  }, [_set, userId, freshStart])

  const importEntries = useCallback(async (newEntries) => {
    if (userId) {
      try {
        const snap = await getDocs(colRef(userId))
        const batch = writeBatch(db)
        snap.docs.forEach(d => batch.delete(d.ref))
        await batch.commit()
        await fsBatch(userId, newEntries)
      } catch (e) { console.error(e) }
    }
    _set(newEntries)
  }, [_set, userId])

  return { entries, loading, synced, addEntry, editEntry, deleteEntry, resetAll, importEntries }
}
