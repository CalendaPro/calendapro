import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import TemplateMinimal from '@/components/templates/TemplateMinimal'
import TemplateVisuel from '@/components/templates/TemplateVisuel'
import TemplateDirect from '@/components/templates/TemplateDirect'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const isPublished = (profile as any).is_published
  if (isPublished === false) notFound()

  const template = ((profile as any).template as string | undefined) ?? 'minimal'
  const accentColor = ((profile as any).accent_color as string | undefined) ?? '#7c3aed'

  const serverSupabase = createServerSupabaseClient()

  const { data: services } = await serverSupabase
    .from('services')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: true })

  const prefix = `${profile.id}/`
  const { data: photoList } = await serverSupabase.storage.from('pro-photos').list(prefix)
  const items = Array.isArray(photoList) ? photoList : []

  const photos = await Promise.all(
    items.map(async (it: any) => {
      const name = it?.name ?? ''
      if (!name) return null
      const path = `${prefix}${name}`.replace(/^\//, '')

      const { data: signed } = await serverSupabase.storage.from('pro-photos').createSignedUrl(path, 60 * 60)
      const signedUrl = (signed as any)?.signedUrl as string | undefined

      if (signedUrl) return { url: signedUrl, path }

      const { data: pub } = serverSupabase.storage.from('pro-photos').getPublicUrl(path)
      const url = pub?.publicUrl
      if (!url) return null

      return { url, path }
    }),
  )

  const safePhotos = photos.filter(Boolean) as Array<{ url: string; path?: string }>

  const Template = template === 'direct' ? TemplateDirect : template === 'visual' ? TemplateVisuel : TemplateMinimal

  return (
    <Template
      profile={profile as any}
      accentColor={accentColor}
      photos={safePhotos}
      services={(services ?? []) as any}
    />
  )
}