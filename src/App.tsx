import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthorNameGate } from './components/AuthorNameGate'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ArticleEditPage } from './pages/ArticleEditPage'

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="shell">
        <p className="muted">Loading…</p>
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <AuthorNameGate>{children}</AuthorNameGate>
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route
          path="/"
          element={
            <Protected>
              <DashboardPage />
            </Protected>
          }
        />
        <Route
          path="/articles/:id"
          element={
            <Protected>
              <ArticleEditPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

function LoginGate() {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="shell">
        <p className="muted">Loading…</p>
      </div>
    )
  }
  if (session) return <Navigate to="/" replace />
  return <LoginPage />
}
