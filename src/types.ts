export type Profile = {
  id: string
  author_name: string | null
  updated_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  created_at: string
}

export type Article = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  slug: string
  summary: string | null
  body_html: string | null
  featured_image_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}
