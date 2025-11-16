import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HomeClient } from './home-client';

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return <HomeClient />;
}
