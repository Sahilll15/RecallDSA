'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  delay?: number;
  showPercentage?: boolean;
}

export function ProgressBar({
  value,
  max,
  label,
  color = "bg-primary",
  delay = 0,
  showPercentage = true
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{value}</span>
          {showPercentage && (
            <span className="text-xs text-muted-foreground">({percentage}%)</span>
          )}
        </div>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 1,
            delay: delay + 0.2,
            ease: [0.21, 0.47, 0.32, 0.98]
          }}
          className={cn("h-full rounded-full", color)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </motion.div>
      </div>
    </motion.div>
  )
}

