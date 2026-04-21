import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import SiteBuilder from './SiteBuilder'

export default async function SiteCustomizePage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  return <SiteBuilder />
}
