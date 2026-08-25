import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RecallSessionPage from './recall-client'

// See app/problems/page.tsx for why this wrapper exists.
export default async function Page() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')
  return <RecallSessionPage />
}
