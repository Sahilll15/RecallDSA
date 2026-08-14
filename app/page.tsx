import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HomeClient } from './home-client';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'Could not start GitHub sign-in. Please try again.',
  OAuthCallback: 'GitHub sign-in was interrupted. Please try again.',
  Callback: 'Something went wrong finishing sign-in. Please try again.',
  OAuthAccountNotLinked: 'This GitHub account is linked to a different login.',
  AccessDenied: 'GitHub sign-in was denied.',
  Configuration: 'Sign-in is misconfigured on the server. Check the auth environment variables.',
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  const { error } = await searchParams;
  const authError = error
    ? (AUTH_ERROR_MESSAGES[error] ?? 'Sign-in failed. Please try again.')
    : null;

  return <HomeClient authError={authError} />;
}
