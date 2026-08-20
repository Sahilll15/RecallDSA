'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Code2, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Header({
  user,
}: {
  user?: { name?: string | null; email?: string | null };
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/problems', label: 'Problems' },
    { href: '/revision', label: 'Revision' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-80"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded border border-primary/40 bg-primary/10">
              <Code2 className="h-3.5 w-3.5 text-primary" />
            </span>
            <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
              recalldsa<span className="cursor-blink text-primary">_</span>
            </span>
          </Link>

          {/* Active route gets a rule under it, not a filled pill: the nav stays
              quiet next to the page's own primary action. */}
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative -my-4 flex h-14 items-center text-sm transition-colors',
                    active
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* The header only renders on middleware-protected pages, so the controls
            must not depend on a `user` prop most pages never pass. */}
        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground sm:inline-block">
              {user.name || user.email}
            </span>
          )}
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="hidden md:flex"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign Out
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <nav className="container flex flex-col gap-1 py-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex min-h-11 items-center rounded-md px-3 text-sm transition-colors',
                    pathname === link.href
                      ? 'bg-accent font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="justify-start mt-1"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign Out
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
