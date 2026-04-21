'use client'

import React from 'react'
import DashboardShell from './DashboardShell'

interface DashboardLayoutWrapperProps {
  children: React.ReactNode
  userName: string
  userEmail: string
}

export function DashboardLayoutWrapper({ 
  children, 
  userName, 
  userEmail
}: DashboardLayoutWrapperProps) {
  return (
    <DashboardShell userName={userName} userEmail={userEmail}>
      {children}
    </DashboardShell>
  )
}
