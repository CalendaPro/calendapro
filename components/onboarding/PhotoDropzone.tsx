'use client'

import { useEffect, useRef } from 'react'

export type LocalPhoto = {
  id: string
  file: File
  previewUrl: string
  name: string
}

/**
 * Compresse une image avec canvas
 * #35 - Compression avant upload
 */
async function compressImage(file: File): Promise<File> {
  // Si déjà petit (<500KB), pas besoin de compresser
  if (file.size < 500 * 1024) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      // Calcul des dimensions max (800x800)
      let { width, height } = img
      const MAX_SIZE = 800
      
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = (height / width) * MAX_SIZE
          width = MAX_SIZE
        } else {
          width = (width / height) * MAX_SIZE
          height = MAX_SIZE
        }
      }
      
      // Canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file) // Fallback
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      
      // Export avec qualité 0.85
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file) // Fallback
            return
          }
          // Créer nouveau fichier
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        'image/jpeg',
        0.85
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // Fallback sur erreur
    }
    
    img.src = url
  })
}

export default function PhotoDropzone({
  photos,
  onChange,
  disabled = false,
  label = 'Upload de photos',
}: {
  photos: LocalPhoto[]
  onChange: (next: LocalPhoto[]) => void
  disabled?: boolean
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const createdUrlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    return () => {
      for (const url of createdUrlsRef.current) URL.revokeObjectURL(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || disabled) return
    const arr = Array.from(fileList)
    if (arr.length === 0) return

    // #35 - Compresser les images avant création
    const compressedFiles = await Promise.all(
      arr.map(f => compressImage(f))
    )

    const created: LocalPhoto[] = compressedFiles.map(f => {
      const previewUrl = URL.createObjectURL(f)
      createdUrlsRef.current.add(previewUrl)
      return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file: f,
        previewUrl,
        name: f.name,
      }
    })

    onChange([...photos, ...created])
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addFiles(e.dataTransfer.files)
  }

  const removePhoto = (id: string) => {
    const next = photos.filter(p => p.id !== id)
    const removed = photos.find(p => p.id === id)
    if (removed) URL.revokeObjectURL(removed.previewUrl)
    onChange(next)
  }

  return (
    <div className="w-full">
      <div
        className={`rounded-2xl border border-dashed p-5 text-sm transition ${
          disabled ? 'opacity-50 pointer-events-none' : 'border-violet-200 bg-violet-50/40'
        }`}
        onDragOver={e => {
          e.preventDefault()
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-stone-800">{label}</p>
            <p className="text-xs text-stone-500 mt-1">Glissez-déposez vos photos ici, ou cliquez pour sélectionner.</p>
          </div>
          <div className="shrink-0 rounded-full bg-white border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">
            {photos.length} photo{photos.length > 1 ? 's' : ''}
          </div>
        </div>

        {photos.length === 0 ? null : (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {photos.slice(0, 9).map(p => (
              <div key={p.id} className="relative overflow-hidden rounded-xl border border-stone-100 bg-white">
                <img src={p.previewUrl} alt={p.name} className="w-full h-20 object-cover" />
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    removePhoto(p.id)
                  }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/70"
                  aria-label="Supprimer photo"
                >

                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
      </div>
    </div>
  )
}

