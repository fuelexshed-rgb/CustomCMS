import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Props = {
  children: React.ReactNode
}

export function AuthorNameGate({ children }: Props) {
  const { user, loading: authLoading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [needsName, setNeedsName] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadProfile = useCallback(async () => {
    if (!user) {
      setChecking(false)
      return
    }
    const { data, error: qErr } = await supabase
      .from('profiles')
      .select('author_name')
      .eq('id', user.id)
      .maybeSingle()

    if (qErr) {
      setError(qErr.message)
      setChecking(false)
      return
    }

    const authorName = data?.author_name?.trim()
    setNeedsName(!authorName)
    setChecking(false)
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setChecking(false)
      return
    }
    void loadProfile()
  }, [authLoading, user, loadProfile])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your author name')
      return
    }
    setSaving(true)
    setError(null)
    const { error: upErr } = await supabase.from('profiles').upsert(
      { id: user.id, author_name: trimmed },
      { onConflict: 'id' },
    )
    setSaving(false)
    if (upErr) {
      setError(upErr.message)
      return
    }
    setNeedsName(false)
  }

  if (authLoading || checking) {
    return (
      <div className="shell">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (!user) return <>{children}</>

  return (
    <>
      {needsName && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="author-title">
          <div className="modal card modal-card-themed">
            <div className="modal-theme-corner">
              <ThemeToggle />
            </div>
            <h2 id="author-title" className="modal-title">
              Set your author name
            </h2>
            <p className="muted" style={{ marginTop: 0 }}>
              This name appears on your articles (Dhivehi is supported — RTL + A_Faruma in the editor).
            </p>
            <form onSubmit={(e) => void onSubmit(e)}>
              <label htmlFor="author-name">Author name</label>
              <input
                id="author-name"
                className="input dhivehi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                dir="rtl"
              />
              {error && <p className="error-text">{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '1rem' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
