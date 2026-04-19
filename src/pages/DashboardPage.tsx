import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Article } from '../types'

type Row = Pick<
  Article,
  | 'id'
  | 'title'
  | 'slug'
  | 'featured_image_url'
  | 'summary'
  | 'published_at'
  | 'updated_at'
  | 'category_id'
> & {
  categories: { name: string } | { name: string }[] | null
}

function categoryLabel(
  categories: Row['categories'],
): string {
  if (!categories) return '—'
  const row = Array.isArray(categories) ? categories[0] : categories
  return row?.name?.trim() || '—'
}

export function DashboardPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: qErr } = await supabase
      .from('articles')
      .select(
        'id, title, slug, featured_image_url, summary, published_at, updated_at, category_id, categories(name)',
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    setLoading(false)
    if (qErr) {
      setError(qErr.message)
      return
    }
    setRows((data ?? []) as Row[])
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Articles</h1>
          <p className="page-header__meta">Manage drafts and published stories</p>
        </div>
        <div className="page-header__actions">
          <Link to="/articles/new" className="btn btn-primary">
            New article
          </Link>
        </div>
      </header>

      <section className="app-panel">
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <div className="table-wrap">
            <table className="data-table data-table--ui">
              <thead>
                <tr>
                  <th className="th-thumb">Image</th>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No articles yet. Create one to get started.
                    </td>
                  </tr>
                )}
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="td-thumb">
                      {a.featured_image_url ? (
                        <img src={a.featured_image_url} alt="" className="dashboard-thumb" />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="dhivehi">{a.title?.trim() || '—'}</td>
                    <td>
                      <code className="slug-pill">{a.slug}</code>
                    </td>
                    <td className="dhivehi">{categoryLabel(a.categories)}</td>
                    <td>
                      <span className={a.published_at ? 'status-pill status-pill--live' : 'status-pill'}>
                        {a.published_at ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>{a.published_at ? new Date(a.published_at).toLocaleString() : '—'}</td>
                    <td>
                      <Link to={`/articles/${a.id}`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  )
}
