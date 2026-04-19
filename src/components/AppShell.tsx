import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '../context/AuthContext'

type Props = {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  const { signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden>
            ◆
          </span>
          <span className="sidebar__name">News CMS</span>
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
