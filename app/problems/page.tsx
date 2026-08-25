import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProblemsPage from './problems-client'

// A Server Component wrapper, not `export const dynamic` on the client file
// (which App Router silently ignores there): calling auth() reads cookies,
// which itself forces this route dynamic and stops Vercel's CDN from serving
// a cached, unauthenticated shell in place of middleware's redirect.
export default async function Page() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')
  return <ProblemsPage />
}
