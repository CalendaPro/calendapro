'use client'

import { useState } from 'react'

export default function WidgetCopyButton({
  code,
  label,
}: {
  code: string
  label: string
}) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
    >
      {copied ? '✓ Copié !' : label}
    </button>
  )
}