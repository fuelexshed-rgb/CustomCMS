import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { slugify } from '../lib/slug'
import { useAuth } from '../context/AuthContext'
import { RichTextEditor } from '../components/RichTextEditor'
import { ThemeToggle } from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'
import { uploadArticleImage } from '../lib/storageUpload'
import type { Category } from '../types'

export function ArticleEditPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new' || !id
  const { user } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()

  /** Set on each control — Chrome reads this for ::placeholder / -webkit-input-placeholder. */
  const dhivehiPlaceholderInk = useMemo((): CSSProperties => {
    const ink = theme === 'light' ? '#000000' : '#cbd5e1'
    return { ['--article-placeholder-ink' as string]: ink }
  }, [theme])

  const authorReadonlyStyle = useMemo((): CSSProperties => {
    if (theme !== 'light') return dhivehiPlaceholderInk
    return {
      ...dhivehiPlaceholderInk,
      color: '#000000',
      WebkitTextFillColor: '#000000',
      opacity: 1,
    }
  }, [theme, dhivehiPlaceholderInk])

  const [categories, setCategories] = useState<Category[]>([])
  const [authorName, setAuthorName] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [summary, setSummary] = useState('')
  const [bodyHtml, setBodyHtml] = useState('<p></p>')
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null)
  const [featuredUploading, setFeaturedUploading] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [catOpen, setCatOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')

  const loadMeta = useCallback(async () => {
    if (!user) return
    const [{ data: cats }, { data: prof }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('profiles').select('author_name').eq('id', user.id).maybeSingle(),
    ])
    setCategories((cats ?? []) as Category[])
    setAuthorName(prof?.author_name?.trim() ?? '')
  }, [user])

  const loadArticle = useCallback(async () => {
    if (!user || isNew || !id) return
    setLoading(true)
    const { data, error: qErr } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    setLoading(false)
    if (qErr || !data) {
      setError(qErr?.message ?? 'Article not found')
      return
    }
    setCategoryId(data.category_id ?? '')
    setTitle(data.title ?? '')
    setSlug(data.slug)
    setSummary(data.summary ?? '')
    setBodyHtml(data.body_html || '<p></p>')
    setFeaturedImageUrl(data.featured_image_url ?? null)
    setPublishedAt(data.published_at)
  }, [user, id, isNew])

  useEffect(() => {
    void loadMeta()
  }, [loadMeta])

  useEffect(() => {
    void loadArticle()
  }, [loadArticle])

  const save = async (publish: boolean) => {
    if (!user) return
    setError(null)
    const t = title.trim()
    if (!t) {
      setError('Please enter a title')
      return
    }
    const s = slug.trim()
    if (!s) {
      setError('Please enter a slug')
      return
    }
    setSaving(true)
    const payload = {
      user_id: user.id,
      category_id: categoryId || null,
      title: t,
      slug: s,
      summary: summary.trim() || null,
      body_html: bodyHtml,
      featured_image_url: featuredImageUrl || null,
      published_at: publish ? new Date().toISOString() : publishedAt,
    }
    if (isNew) {
      const insertPayload = {
        ...payload,
        published_at: publish ? new Date().toISOString() : null,
      }
      const { data, error: insErr } = await supabase.from('articles').insert(insertPayload).select('id').single()
      setSaving(false)
      if (insErr) {
        setError(insErr.code === '23505' ? 'That slug is already in use' : insErr.message)
        return
      }
      if (data?.id) navigate(`/articles/${data.id}`, { replace: true })
      return
    }
    if (!id) return
    const updatePayload = {
      category_id: payload.category_id,
      title: payload.title,
      slug: payload.slug,
      summary: payload.summary,
      body_html: payload.body_html,
      featured_image_url: payload.featured_image_url,
      published_at: publish ? new Date().toISOString() : publishedAt,
    }
    const { error: upErr } = await supabase.from('articles').update(updatePayload).eq('id', id).eq('user_id', user.id)
    setSaving(false)
    if (upErr) {
      setError(upErr.code === '23505' ? 'That slug is already in use' : upErr.message)
      return
    }
    if (publish) setPublishedAt(updatePayload.published_at ?? null)
    void loadArticle()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void save(false)
  }

  const addCategory = async (e: FormEvent) => {
    e.preventDefault()
    const name = catName.trim()
    const cs = catSlug.trim() || slugify(name)
    if (!name || !cs) {
      setError('Category name and slug are required')
      return
    }
    const { data, error: insErr } = await supabase.from('categories').insert({ name, slug: cs }).select('*').single()
    if (insErr) {
      setError(insErr.code === '23505' ? 'That category slug is already taken' : insErr.message)
      return
    }
    const row = data as Category
    setCategories((c) => [...c, row].sort((a, b) => a.name.localeCompare(b.name)))
    setCategoryId(row.id)
    setCatOpen(false)
    setCatName('')
    setCatSlug('')
  }

  if (loading) {
    return (
      <div className="layout">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/" className="btn btn-ghost">
          ← Dashboard
        </Link>
        <h1 className="topbar-title">{isNew ? 'New article' : 'Edit article'}</h1>
        <div className="topbar-actions">
          <ThemeToggle />
        </div>
      </header>

      <main className="main narrow">
        <form onSubmit={onSubmit} className="article-form">
          <div className="field">
            <label>Category</label>
            <div className="row-inline">
              <select
                className="input dhivehi"
                style={dhivehiPlaceholderInk}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                dir="rtl"
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setError(null)
                  setCatOpen(true)
                }}
              >
                + Add category
              </button>
            </div>
          </div>

          <div className="field">
            <label>Author</label>
            <input
              className="input dhivehi"
              value={authorName}
              readOnly
              dir="rtl"
              style={authorReadonlyStyle}
            />
          </div>

          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              className="input dhivehi"
              style={dhivehiPlaceholderInk}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Headline"
              dir="rtl"
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="slug">Slug</label>
            <input
              id="slug"
              className="input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="article-url-slug"
              dir="ltr"
              spellCheck={false}
            />
          </div>

          <div className="field">
            <label htmlFor="summary">Summary</label>
            <textarea
              id="summary"
              className="input dhivehi"
              style={dhivehiPlaceholderInk}
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Short summary (Dhivehi)"
              dir="rtl"
            />
          </div>

          <div className="field featured-image-field">
            <label htmlFor="featured-image-input">Featured image</label>
            <p className="field-hint muted">Shown on listings and social previews. JPEG, PNG, or WebP.</p>
            <div className="featured-image-row">
              <input
                id="featured-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="visually-hidden"
                disabled={featuredUploading || saving}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file || !file.type.startsWith('image/')) return
                  setError(null)
                  setFeaturedUploading(true)
                  void uploadArticleImage(file, 'featured')
                    .then((url) => setFeaturedImageUrl(url))
                    .catch((err: unknown) => {
                      setError(err instanceof Error ? err.message : 'Failed to upload image')
                    })
                    .finally(() => setFeaturedUploading(false))
                }}
              />
              <button
                type="button"
                className="btn"
                disabled={featuredUploading || saving}
                onClick={() => document.getElementById('featured-image-input')?.click()}
              >
                {featuredUploading ? 'Uploading…' : featuredImageUrl ? 'Replace image' : 'Choose image'}
              </button>
              {featuredImageUrl && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={featuredUploading || saving}
                  onClick={() => setFeaturedImageUrl(null)}
                >
                  Remove
                </button>
              )}
            </div>
            {featuredImageUrl && (
              <div className="featured-preview-wrap">
                <img src={featuredImageUrl} alt="" className="featured-preview" />
              </div>
            )}
          </div>

          <div className="field">
            <label>Body</label>
            <RichTextEditor
              key={id ?? 'new'}
              content={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Article body — Dhivehi RTL + Faruma; paste or drop images"
            />
          </div>

          {publishedAt && (
            <p className="muted">
              Published: {new Date(publishedAt).toLocaleString()}
            </p>
          )}

          {error && <p className="error-text">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save(true)}>
              {saving ? '…' : 'Publish'}
            </button>
          </div>
        </form>
      </main>

      {catOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card">
            <h2 className="modal-title">New category</h2>
            <form onSubmit={(e) => void addCategory(e)}>
              <div className="field">
                <label>Name</label>
                <input
                  className="input dhivehi"
                  style={dhivehiPlaceholderInk}
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  dir="rtl"
                />
              </div>
              <div className="field">
                <label>URL slug</label>
                <input
                  className="input"
                  value={catSlug}
                  onChange={(e) => setCatSlug(slugify(e.target.value))}
                  dir="ltr"
                />
              </div>
              <div className="row-inline">
                <button type="button" className="btn" onClick={() => setCatOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
