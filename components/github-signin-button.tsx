'use client';

import { useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { Github, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GithubSignInButtonProps {
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  fullWidth?: boolean;
}

export function GithubSignInButton({
  variant = 'default',
  size = 'lg',
  fullWidth = false,
}: GithubSignInButtonProps) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      signIn('github', { callbackUrl: '/dashboard' });
    });
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={fullWidth ? 'w-full' : undefined}
      onClick={handleClick}
      disabled={pending}
    >
      <Github className="mr-2 h-5 w-5" />
      {pending ? 'Connecting...' : 'Sign in with GitHub'}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
}
