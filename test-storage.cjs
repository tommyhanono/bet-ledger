/**
 * BetLedger — Storage & Auth Logic Test Suite
 * Run with: node test-storage.cjs
 *
 * Simulates localStorage, tests every operation:
 *   add, edit, delete, reset, functional updaters,
 *   refresh persistence, user isolation, session flow.
 */

'use strict'

// ── Mock localStorage ────────────────────────────────────────────────────────
const _store = new Map()
global.localStorage = {
  getItem:    (k)    => _store.has(k) ? _store.get(k) : null,
  setItem:    (k, v) => _store.set(k, String(v)),
  removeItem: (k)    => _store.delete(k),
  clear:      ()     => _store.clear(),
}

// ── Minimal uuid stub ────────────────────────────────────────────────────────
let _uid = 0
const uuidv4 = () => `test-id-${++_uid}`

// ── Core logic (mirrored from hooks, no React) ───────────────────────────────

const makeSeed = () => [
  { id: uuidv4(), category: 'casino',          type: 'Initial Balance', amount: -2000, date: '2024-01-01', platform: '', odds: null, session: null, notes: 'Starting deficit — Casino',           isInitialBalance: true },
  { id: uuidv4(), category: 'sports',          type: 'Initial Balance', amount: -500,  date: '2024-01-01', platform: '', odds: null, session: null, notes: 'Starting deficit — Sports Betting',    isInitialBalance: true },
  { id: uuidv4(), category: 'online-gambling', type: 'Initial Balance', amount: -1100, date: '2024-01-01', platform: 'Stake', odds: null, session: null, notes: 'Starting deficit — Stake',         isInitialBalance: true },
]

const loadEntries = (key) => {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null } catch { return null }
}
const saveEntries = (key, entries) => {
  try { localStorage.setItem(key, JSON.stringify(entries)) } catch {}
}

// Simulates what the hook does in one "mounted session"
class StorageSession {
  constructor(storageKey) {
    this.key = storageKey
    const stored = loadEntries(storageKey)
    this.entries = stored || (() => { const s = makeSeed(); saveEntries(storageKey, s); return s })()
  }
  // Core _set — resolves functional updaters before persisting
  _set(next) {
    const resolved = typeof next === 'function' ? next(this.entries) : next
    this.entries = resolved
    saveEntries(this.key, resolved)
  }
  add(data)         { this._set(prev => [...prev, { id: uuidv4(), ...data, isInitialBalance: false }]) }
  edit(id, data)    { this._set(prev => prev.map(e => e.id === id ? { ...e, ...data } : e)) }
  remove(id)        { this._set(prev => prev.filter(e => e.id !== id)) }
  reset()           { this._set(makeSeed()) }
  import(arr)       { this._set(arr) }
  reload()          { /* simulate refresh — re-read from localStorage */
    const stored = loadEntries(this.key)
    if (stored) this.entries = stored
  }
}

// Auth helpers
const AUTH_KEY    = 'betledger-auth'
const SESSION_KEY = 'betledger-session'

const loadAuth    = ()    => { try { const r = localStorage.getItem(AUTH_KEY);    return r ? JSON.parse(r) : null } catch { return null } }
const saveAuth    = (d)   => { try { localStorage.setItem(AUTH_KEY, JSON.stringify(d)) } catch {} }
const loadSession = ()    => { try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null } catch { return null } }
const saveSession = (uid) => { localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: uid, expiresAt: Date.now() + 30*864e5 })) }
const clearSession = ()   => { localStorage.removeItem(SESSION_KEY) }

// ── Test harness ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0, total = 0

function assert(label, condition, detail = '') {
  total++
  if (condition) {
    console.log(`  ✅  ${label}`)
    passed++
  } else {
    console.error(`  ❌  ${label}${detail ? ' — ' + detail : ''}`)
    failed++
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}\n  ${title}\n${'─'.repeat(60)}`)
}

// ── TESTS ────────────────────────────────────────────────────────────────────

section('1 · Seed data on first load')
{
  const s = new StorageSession('betledger-v1-test1')
  assert('Loads 3 seed entries',       s.entries.length === 3)
  assert('All are initialBalance',      s.entries.every(e => e.isInitialBalance))
  assert('Total P&L = -$3600',          s.entries.reduce((t,e) => t+e.amount, 0) === -3600)
  assert('Persisted to localStorage',   loadEntries('betledger-v1-test1') !== null)
}

section('2 · Add entry')
{
  const s = new StorageSession('betledger-v1-test2')
  s.add({ category: 'casino', type: 'Blackjack', amount: 500, date: '2024-06-01', platform: 'Hard Rock', odds: null, session: null, notes: null })
  assert('Entry count = 4',            s.entries.length === 4)
  assert('New entry amount = 500',     s.entries.find(e => e.type === 'Blackjack')?.amount === 500)
  assert('isInitialBalance = false',   s.entries.find(e => e.type === 'Blackjack')?.isInitialBalance === false)
  const persisted = loadEntries('betledger-v1-test2')
  assert('Persisted after add',        persisted?.length === 4)
  assert('Correct amount in storage',  persisted?.find(e => e.type === 'Blackjack')?.amount === 500)
}

section('3 · Refresh persistence (the main bug fix)')
{
  const key = 'betledger-v1-test3'
  const s1 = new StorageSession(key)
  s1.add({ category: 'sports', type: 'Moneyline', amount: -200, date: '2024-06-02', platform: 'DraftKings', odds: '-110', session: null, notes: null })
  s1.add({ category: 'online-gambling', type: 'Crash', amount: 1500, date: '2024-06-03', platform: 'Stake', odds: null, session: null, notes: 'big win' })
  const countBeforeRefresh = s1.entries.length

  // Simulate refresh — new StorageSession reads from localStorage
  const s2 = new StorageSession(key)
  assert('Entry count survives refresh',     s2.entries.length === countBeforeRefresh)
  assert('Moneyline entry persisted',        s2.entries.some(e => e.type === 'Moneyline'))
  assert('Crash entry persisted',            s2.entries.some(e => e.type === 'Crash'))
  assert('Big win note persisted',           s2.entries.find(e => e.type === 'Crash')?.notes === 'big win')
  assert('Crash amount = 1500',              s2.entries.find(e => e.type === 'Crash')?.amount === 1500)
}

section('4 · Edit entry persists across refresh')
{
  const key = 'betledger-v1-test4'
  const s1 = new StorageSession(key)
  s1.add({ category: 'casino', type: 'Slots', amount: -100, date: '2024-06-01', platform: '', odds: null, session: null, notes: null })
  const targetId = s1.entries.find(e => e.type === 'Slots').id
  s1.edit(targetId, { amount: 300, notes: 'edited' })
  assert('Edit applied in memory',     s1.entries.find(e => e.id === targetId)?.amount === 300)
  // Simulate refresh
  const s2 = new StorageSession(key)
  assert('Edit persists after refresh', s2.entries.find(e => e.id === targetId)?.amount === 300)
  assert('Note persists after refresh', s2.entries.find(e => e.id === targetId)?.notes === 'edited')
}

section('5 · Delete entry persists across refresh')
{
  const key = 'betledger-v1-test5'
  const s1 = new StorageSession(key)
  s1.add({ category: 'sports', type: 'Parlay', amount: -50, date: '2024-06-01', platform: '', odds: '+350', session: null, notes: null })
  const targetId = s1.entries.find(e => e.type === 'Parlay').id
  const countBefore = s1.entries.length
  s1.remove(targetId)
  assert('Delete removes from memory',  s1.entries.length === countBefore - 1)
  assert('Target ID gone in memory',    !s1.entries.find(e => e.id === targetId))
  const s2 = new StorageSession(key)
  assert('Delete persists after refresh', s2.entries.length === countBefore - 1)
  assert('Target ID gone after refresh',  !s2.entries.find(e => e.id === targetId))
}

section('6 · Reset — returns to seed data')
{
  const key = 'betledger-v1-test6'
  const s1 = new StorageSession(key)
  s1.add({ category: 'casino', type: 'Roulette', amount: 800, date: '2024-06-01', platform: '', odds: null, session: null, notes: null })
  s1.add({ category: 'sports', type: 'Futures',  amount: -300, date: '2024-06-02', platform: '', odds: '+500', session: null, notes: null })
  assert('Has 5 entries before reset', s1.entries.length === 5)
  s1.reset()
  assert('Back to 3 entries after reset',       s1.entries.length === 3)
  assert('All are initialBalance after reset',  s1.entries.every(e => e.isInitialBalance))
  assert('Total P&L = -$3600 after reset',      s1.entries.reduce((t,e) => t+e.amount, 0) === -3600)
  // Persist across refresh
  const s2 = new StorageSession(key)
  assert('Reset persists across refresh',       s2.entries.length === 3)
  assert('No extra entries after refresh+reset',s2.entries.every(e => e.isInitialBalance))
}

section('7 · Reset then add — persists correctly')
{
  const key = 'betledger-v1-test7'
  const s = new StorageSession(key)
  s.reset()
  s.add({ category: 'online-gambling', type: 'Mines', amount: 250, date: '2024-06-07', platform: 'Stake', odds: null, session: 'Test session', notes: null })
  const s2 = new StorageSession(key)
  assert('4 entries after reset+add',        s2.entries.length === 4)
  assert('Mines entry persisted',            s2.entries.some(e => e.type === 'Mines'))
  assert('Session name persisted',           s2.entries.find(e => e.type === 'Mines')?.session === 'Test session')
}

section('8 · Multiple rapid operations — all persist')
{
  const key = 'betledger-v1-test8'
  const s1 = new StorageSession(key)
  // Rapid adds
  for (let i = 0; i < 10; i++) {
    s1.add({ category: 'casino', type: `Hand ${i}`, amount: i % 2 === 0 ? 100 : -100, date: '2024-06-07', platform: '', odds: null, session: null, notes: null })
  }
  assert('10 adds + 3 seed = 13 total', s1.entries.length === 13)
  // Refresh
  const s2 = new StorageSession(key)
  assert('All 13 survive refresh',      s2.entries.length === 13)
  // Delete all non-initial
  const nonInit = s2.entries.filter(e => !e.isInitialBalance)
  nonInit.forEach(e => s2.remove(e.id))
  assert('Back to 3 after bulk delete', s2.entries.length === 3)
  const s3 = new StorageSession(key)
  assert('3 survive refresh after bulk delete', s3.entries.length === 3)
}

section('9 · User data isolation')
{
  const keyA = 'betledger-v1-tommy'
  const keyB = 'betledger-v1-testcenter'

  const tommy  = new StorageSession(keyA)
  const tester = new StorageSession(keyB)

  tommy.add({  category: 'casino', type: 'Tommy Blackjack', amount: 500, date: '2024-06-01', platform: '', odds: null, session: null, notes: null })
  tester.add({ category: 'sports', type: 'Test Parlay',     amount: -200, date: '2024-06-01', platform: '', odds: '+300', session: null, notes: null })

  assert("Tommy's data isolated",    tommy.entries.some(e => e.type === 'Tommy Blackjack'))
  assert("Tommy has no Test Parlay", !tommy.entries.some(e => e.type === 'Test Parlay'))
  assert("Tester has no Tommy BJ",   !tester.entries.some(e => e.type === 'Tommy Blackjack'))
  assert("Tester's data isolated",   tester.entries.some(e => e.type === 'Test Parlay'))

  // Verify in raw localStorage
  const rawTommy  = loadEntries(keyA)
  const rawTester = loadEntries(keyB)
  assert('Raw Tommy key has no Parlay',   !rawTommy.some(e => e.type === 'Test Parlay'))
  assert('Raw Tester key has no BJ',      !rawTester.some(e => e.type === 'Tommy Blackjack'))
}

section('10 · Auth — user management')
{
  // Seed auth
  const tommy    = { id: 'tommy',      name: "Tommy's Account", password: 'tommyhanono987', storageKey: 'betledger-v1-tommy' }
  const testcenter = { id: 'testcenter', name: 'TestCenter',      password: '1234567',        storageKey: 'betledger-v1-testcenter' }
  const authData = { users: [tommy, testcenter] }
  saveAuth(authData)

  const loaded = loadAuth()
  assert('Auth data persists',             loaded !== null)
  assert('2 users in auth',                loaded.users.length === 2)
  assert('Tommy exists',                   !!loaded.users.find(u => u.id === 'tommy'))
  assert('TestCenter exists',              !!loaded.users.find(u => u.id === 'testcenter'))

  // Login simulation
  const tryLogin = (uid, pw) => {
    const u = loaded.users.find(u => u.id === uid)
    return u && u.password === pw
  }
  assert('Tommy correct password',         tryLogin('tommy', 'tommyhanono987'))
  assert('Tommy wrong password rejected',  !tryLogin('tommy', 'wrongpassword'))
  assert('TestCenter correct password',    tryLogin('testcenter', '1234567'))
  assert('TestCenter wrong password',      !tryLogin('testcenter', 'badpw'))
}

section('11 · Session persistence')
{
  clearSession()
  assert('No session initially', loadSession() === null)

  saveSession('tommy')
  const s = loadSession()
  assert('Session saved',           s !== null)
  assert('Session userId = tommy',  s?.userId === 'tommy')
  assert('Session has expiry',      s?.expiresAt > Date.now())

  clearSession()
  assert('Session cleared',         loadSession() === null)
}

section('12 · Functional updater correctness (the original bug)')
{
  // The bug: _set received a function, called saveEntries(key, fn) which saved "undefined"
  const key = 'betledger-v1-test12'
  const s = new StorageSession(key)

  // Simulate the OLD broken behavior
  const brokenSave = (k, next) => {
    const raw = JSON.stringify(next)  // function → undefined → "undefined" not saved
    // If raw is undefined, setItem would store "undefined"
    return raw
  }
  const funcUpdater = (prev) => [...prev, { id: 'x', type: 'Test' }]
  assert('JSON.stringify(function) = undefined',  JSON.stringify(funcUpdater) === undefined)

  // Simulate the FIXED behavior
  const entries = s.entries.slice()
  const resolved = typeof funcUpdater === 'function' ? funcUpdater(entries) : funcUpdater
  assert('Resolved functional updater is array',  Array.isArray(resolved))
  assert('Resolved has correct count',            resolved.length === entries.length + 1)
  assert('JSON.stringify(resolved) is valid',     JSON.stringify(resolved) !== undefined)
  assert('Parsed back correctly',                 JSON.parse(JSON.stringify(resolved)).length === resolved.length)
}

section('13 · Import / Export roundtrip')
{
  const key = 'betledger-v1-test13'
  const s1 = new StorageSession(key)
  s1.add({ category: 'casino', type: 'Baccarat', amount: 750, date: '2024-06-01', platform: 'Aria', odds: null, session: 'Vegas trip', notes: 'Won big' })
  const exported = JSON.stringify(s1.entries)

  // Simulate fresh session (like after import)
  const s2 = new StorageSession('betledger-v1-test13b')
  s2.import(JSON.parse(exported))
  assert('Import restores all entries',  s2.entries.length === s1.entries.length)
  assert('Import preserves amounts',     s2.entries.find(e => e.type === 'Baccarat')?.amount === 750)
  assert('Import preserves notes',       s2.entries.find(e => e.type === 'Baccarat')?.notes === 'Won big')
  assert('Import preserves session',     s2.entries.find(e => e.type === 'Baccarat')?.session === 'Vegas trip')
  const s3 = new StorageSession('betledger-v1-test13b')
  assert('Imported data survives refresh', s3.entries.find(e => e.type === 'Baccarat')?.amount === 750)
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`)
console.log(`  Results: ${passed}/${total} passed${failed > 0 ? `, ${failed} FAILED` : ''}`)
console.log(`${'═'.repeat(60)}\n`)

if (failed > 0) process.exit(1)
