import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Modal from './components/Modal'
import LockScreen from './components/LockScreen'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useAuth } from './hooks/useAuth'

function AppInner({ currentUser, onLogout, authHook }) {
  const [page, setPage] = useState('dashboard')
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState(null)

  const { entries, addEntry, editEntry: updateEntry, deleteEntry, resetAll, importEntries } =
    useLocalStorage(currentUser.storageKey)

  const openAdd = () => { setEditEntry(null); setModalOpen(true) }
  const openEdit = (entry) => { setEditEntry(entry); setModalOpen(true) }
  const handleSave = (data) => {
    if (editEntry) updateEntry(editEntry.id, data)
    else addEntry(data)
  }

  return (
    <div className="flex w-full min-h-screen bg-[#0f1117]">
      <Sidebar page={page} setPage={setPage} />

      <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-6 overflow-y-auto max-w-screen-xl">
        {page === 'dashboard' && (
          <Dashboard entries={entries} onAddEntry={openAdd} onEdit={openEdit} />
        )}
        {page === 'history' && (
          <History entries={entries} onEdit={openEdit} onDelete={deleteEntry} />
        )}
        {page === 'analytics' && (
          <Analytics entries={entries} />
        )}
        {page === 'settings' && (
          <Settings
            entries={entries}
            onImport={importEntries}
            onReset={resetAll}
            currentUser={currentUser}
            authHook={authHook}
            onLogout={onLogout}
          />
        )}
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editEntry}
      />
    </div>
  )
}

function App() {
  const auth = useAuth()
  const { users, currentUser, login, logout } = auth

  if (!currentUser) {
    return <LockScreen users={users} onLogin={login} />
  }

  return <AppInner currentUser={currentUser} onLogout={logout} authHook={auth} />
}

export default App
