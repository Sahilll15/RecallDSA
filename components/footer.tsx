'use client';

import { Github, Linkedin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <div className="flex flex-col items-center gap-1 md:items-start">
            <p className="text-xs text-muted-foreground">
              Built by{' '}
              <span className="font-medium text-foreground">Sahil Chalke</span>
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} DSA Revisier
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/Sahilll15/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Link>
            <Link
              href="https://www.linkedin.com/in/sahilchalke/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Linkedin className="h-4 w-4" />
              <span className="sr-only">LinkedIn</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
