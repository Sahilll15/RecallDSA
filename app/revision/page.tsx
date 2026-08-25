import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RevisionPage from './revision-client'

// See app/problems/page.tsx for why this wrapper exists.
export default async function Page() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')
  return <RevisionPage />
}
