import { useState } from 'react'

const AUTH_KEY = 'betledger-auth'
const SESSION_KEY = 'betledger-session'
const SESSION_DAYS = 30
const LEGACY_KEY = 'betledger-v1'

// Default users seeded on first launch
// freshStart: true  → account begins with ZERO entries (empty slate)
// freshStart: false → account begins with Tommy's -$3,600 deficit seed
const DEFAULT_USERS = [
  {
    id: 'tommy',
    name: "Tommy's Account",
    password: 'tommyhanono987',
    storageKey: 'betledger-v1-tommy',
    createdAt: '2024-01-01T00:00:00.000Z',
    freshStart: false,
  },
  {
    id: 'testcenter',
    name: 'TestCenter',
    password: '1234567',
    storageKey: 'betledger-v1-testcenter',
    createdAt: '2024-01-01T00:00:00.000Z',
    freshStart: true,
  },
  {
    id: 'gabobas',
    name: 'Gabobas',
    password: 'Gabrielb23',
    storageKey: 'betledger-v1-gabobas',
    createdAt: '2024-01-01T00:00:00.000Z',
    freshStart: true,
  },
]

// Users that must always exist — added if missing (e.g. existing installs)
const REQUIRED_USERS = DEFAULT_USERS

// ── helpers ──────────────────────────────────────────────────────────────────

const loadAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const saveAuth = (data) => {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(data)) } catch {}
}

const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (s.expiresAt && Date.now() > s.expiresAt) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return s
  } catch {}
  return null
}

const saveSession = (userId) => {
  const s = { userId, expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 }
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)) } catch {}
}

const clearSession = () => {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}

// Migrate legacy data (betledger-v1) → tommy's storage key on first run
const migrateLegacy = (tommyKey) => {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy && !localStorage.getItem(tommyKey)) {
      localStorage.setItem(tommyKey, legacy)
    }
  } catch {}
}

// ── hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const [authData, setAuthDataState] = useState(() => {
    let data = loadAuth()
    if (!data) {
      data = { users: DEFAULT_USERS }
    }
    // Ensure every required user exists (handles existing installs)
    let changed = false
    for (const req of REQUIRED_USERS) {
      if (!data.users.find(u => u.id === req.id)) {
        data = { ...data, users: [...data.users, req] }
        changed = true
      }
    }
    saveAuth(data)
    // Migrate legacy data (betledger-v1) → tommy's key on first run
    const tommy = data.users.find(u => u.id === 'tommy')
    if (tommy) migrateLegacy(tommy.storageKey)
    return data
  })

  const [currentUserId, setCurrentUserId] = useState(() => {
    const session = loadSession()
    if (!session) return null
    const data = loadAuth()
    const exists = data?.users.find(u => u.id === session.userId)
    return exists ? session.userId : null
  })

  const _setAuth = (data) => {
    setAuthDataState(data)
    saveAuth(data)
  }

  const users = authData.users
  const currentUser = users.find(u => u.id === currentUserId) || null

  const login = (userId, password, remember) => {
    const user = users.find(u => u.id === userId)
    if (!user) return false
    if (user.password !== password) return false
    setCurrentUserId(userId)
    if (remember) saveSession(userId)
    else clearSession()
    return true
  }

  const logout = () => {
    setCurrentUserId(null)
    clearSession()
  }

  const addUser = (name, password) => {
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now()
    const newUser = {
      id,
      name,
      password,
      storageKey: `betledger-v1-${id}`,
      createdAt: new Date().toISOString(),
      freshStart: true, // new accounts always start at zero
    }
    _setAuth({ ...authData, users: [...users, newUser] })
    return newUser
  }

  const updateUserPassword = (userId, newPassword) => {
    _setAuth({
      ...authData,
      users: users.map(u => u.id === userId ? { ...u, password: newPassword } : u),
    })
  }

  const deleteUser = (userId) => {
    if (userId === 'tommy') return // protect main account
    _setAuth({ ...authData, users: users.filter(u => u.id !== userId) })
  }

  return {
    users,
    currentUser,
    currentUserId,
    login,
    logout,
    addUser,
    updateUserPassword,
    deleteUser,
  }
}
