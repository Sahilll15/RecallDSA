'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GradientTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  animate?: boolean;
}

export function GradientText({
  as: Component = 'span',
  animate = false,
  className,
  children,
  ...props
}: GradientTextProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Solid ink, not bg-clip-text: gradient headings read as template filler
  // and break in forced-colors / high-contrast modes.
  const content = (
    <Component
      className={cn("text-foreground font-bold tracking-tight", className)}
      {...props}
    >
      {children}
    </Component>
  );

  if (!mounted) {
    return content;
  }

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

