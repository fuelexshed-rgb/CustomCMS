import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type Props = {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  const { user, signOut } = useAuth()
  const [authorName, setAuthorName] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadName() {
      if (!user) {
        setAuthorName(null)
        return
      }
      const { data } = await supabase.from('profiles').select('author_name').eq('id', user.id).maybeSingle()
      if (!mounted) return
      setAuthorName(data?.author_name?.trim() || null)
    }
    void loadName()
    return () => {
      mounted = false
    }
  }, [user])

  const profileName = useMemo(() => {
    if (authorName) return authorName
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }, [authorName, user?.email])

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden>
            ◆
          </span>
          <span className="sidebar__name">News CMS</span>
        </div>
        <div className="sidebar__profile" aria-label="Profile">
          <div className="sidebar__avatar" aria-hidden>
            <svg viewBox="0 0 24 24" className="sidebar__avatar-icon" focusable="false">
              <path
                d="M12 12.75a4.75 4.75 0 1 0 0-9.5 4.75 4.75 0 0 0 0 9.5Zm0 2c-4.56 0-8.25 2.86-8.25 6.38 0 .34.28.62.62.62h15.26c.34 0 .62-.28.62-.62 0-3.52-3.69-6.38-8.25-6.38Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="sidebar__profile-meta">
            <span className="sidebar__profile-name">{profileName}</span>
            <span className="sidebar__profile-role">Author</span>
          </div>
        </div>
        <nav className="sidebar__nav">
          <NavLink to="/" end className={({ isActive }) => 'sidebar__link' + (isActive ? ' sidebar__link--active' : '')}>
            <span className="sidebar__link-icon" aria-hidden>
              ▤
            </span>
            Articles
          </NavLink>
          <NavLink
            to="/articles/new"
            className={({ isActive }) => 'sidebar__link' + (isActive ? ' sidebar__link--active' : '')}
          >
            <span className="sidebar__link-icon" aria-hidden>
              +
            </span>
            New article
          </NavLink>
        </nav>
        <div className="sidebar__footer">
          <ThemeToggle />
          <button type="button" className="btn btn-sidebar" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="app-shell__main">{children}</div>
    </div>
  )
}
