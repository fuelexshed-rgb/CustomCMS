import { supabase } from './supabase'

/** Upload to `article-images` bucket; returns public URL. */
export async function uploadArticleImage(
  file: File,
  kind: 'inline' | 'featured' = 'inline',
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const ext = file.type.split('/')[1] || 'png'
  const folder = kind === 'featured' ? 'featured' : 'inline'
  const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('article-images').upload(path, file, {
    contentType: file.type || 'image/png',
    upsert: false,
  })
  if (error) throw error
  const {
    data: { publicUrl },
  } = supabase.storage.from('article-images').getPublicUrl(path)
  return publicUrl
}
