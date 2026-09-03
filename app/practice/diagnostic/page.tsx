import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DiagnosticClient } from './diagnostic-client';

export default async function DiagnosticPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  return <DiagnosticClient user={session.user} />;
}
