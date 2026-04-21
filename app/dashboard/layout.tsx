import React from 'react'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardLayoutWrapper } from './DashboardLayoutWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user
  try {
    user = await currentUser()
  } catch (error) {
    redirect('/sign-in')
  }
  if (!user) redirect('/sign-in')

  const userName = user.firstName ?? user.username ?? 'Compte'
  const userEmail = user.emailAddresses[0]?.emailAddress ?? ''

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: var(--dl-bg, #f8f7f4); font-family: 'DM Sans', sans-serif; }
        html, body, * { transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease; }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
      <DashboardLayoutWrapper userName={userName} userEmail={userEmail}>
        {children}
      </DashboardLayoutWrapper>
    </>
  )
}
