import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPlan } from '@/lib/subscription'

const BUCKET = 'pro-photos'
const LIMITS: Record<'free' | 'premium' | 'infinity', number> = {
  free: 2,
  premium: 5,
  infinity: Infinity,
}

function sanitizeObjectPath(prefix: string, maybePath: string) {
  const clean = maybePath.replace(/^[\/]+/, '')
  if (!clean.startsWith(prefix)) return null
  return clean
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const plan = await getUserPlan(userId)
  const limit = LIMITS[plan]

  const form = await request.formData()
  const filesRaw = form.getAll('files')
  const files = filesRaw.filter(Boolean)

  if (files.length === 0) {
    return NextResponse.json({ error: 'Aucun fichier envoyé' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const prefix = `${userId}/`

  // Count existing objects for this user
  const { data: existingList } = await supabase.storage.from(BUCKET).list(prefix)
  const existingCount = Array.isArray(existingList) ? existingList.length : 0

  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - existingCount)
  if (limit !== Infinity && remaining === 0) {
    return NextResponse.json({ error: `Limite atteinte (${limit})` }, { status: 403 })
  }

  const allowedFiles = remaining === Infinity ? files : files.slice(0, remaining)

  const uploaded: { path: string }[] = []
  const timestamp = Date.now()

  for (let i = 0; i < allowedFiles.length; i++) {
    const f = allowedFiles[i] as any
    if (!f?.name) continue

    const objectPath = `${prefix}${timestamp}-${String(f.name).replace(/[^\w.\- ]/g, '_')}`
    const fullPath = objectPath.replace(/^\//, '')

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fullPath, f, {
        contentType: f.type || undefined,
        upsert: false,
      })

    if (error) {
      console.error('upload pro-photos:', error)
      return NextResponse.json({ error: 'Upload impossible' }, { status: 500 })
    }

    uploaded.push({ path: fullPath })
  }

  return NextResponse.json({
    uploaded,
    limit: limit === Infinity ? null : limit,
  })
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { paths?: string[]; path?: string }
  const paths = body.paths ?? (body.path ? [body.path] : [])
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: 'Chemin manquant' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const prefix = `${userId}/`

  const sanitized = paths
    .map(p => sanitizeObjectPath(prefix, String(p)))
    .filter(Boolean) as string[]

  if (sanitized.length === 0) {
    return NextResponse.json({ error: 'Chemins invalides' }, { status: 400 })
  }

  const { error } = await supabase.storage.from(BUCKET).remove(sanitized)
  if (error) {
    console.error('remove pro-photos:', error)
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 500 })
  }

  return NextResponse.json({ success: true, removed: sanitized.length })
}

// Bonus: pour afficher la galerie dans le dashboard (non demandé, mais utile)
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const prefix = `${userId}/`

  const { data: existingList } = await supabase.storage.from(BUCKET).list(prefix)
  const items = Array.isArray(existingList) ? existingList : []

  // Keep ordering stable (prefix already contains userId; timestamp is in filename)
  const photos = await Promise.all(
    items
    .map(it => {
      const name = (it as any).name ?? ''
      const path = `${prefix}${name}`.replace(/^\//, '')
      return { path }
    })
    .filter(p => p.path.length > 0)
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(async p => {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(p.path, 60 * 60)
      const signedUrl = (signed as any)?.signedUrl as string | undefined
      if (signedUrl) return { ...p, url: signedUrl }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(p.path)
      return { ...p, url: pub?.publicUrl as string | undefined }
    }),
  )

  const safePhotos = photos.filter(p => typeof p.url === 'string') as Array<{ path: string; url: string }>

  return NextResponse.json({ photos: safePhotos })
}

