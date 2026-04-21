'use client'

import React from 'react'
import ModernLayout from './layouts/ModernLayout'

interface Props {
  children: React.ReactNode
  userName: string
  userEmail: string
}

// Unified Dashboard Shell - Modern Premium is the only layout
export default function DashboardShell({ children, userName, userEmail }: Props) {
  return <ModernLayout children={children} userName={userName} userEmail={userEmail} />
}
