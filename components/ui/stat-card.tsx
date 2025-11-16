'use client';

import * as React from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  valueColor?: string;
  delay?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  valueColor,
  delay = 0,
  trend
}: StatCardProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card/95 to-card/80 shadow-soft backdrop-blur-sm transition-all duration-300">
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2.5 rounded-lg transition-all duration-300", iconBgColor)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className={cn("text-3xl font-bold tracking-tight", valueColor || "text-foreground")}>
              {value}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: delay,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      whileHover={{ 
        y: -6,
        transition: { duration: 0.2 }
      }}
      className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card/95 to-card/80 shadow-soft backdrop-blur-sm transition-all duration-300 hover:shadow-large hover:border-primary/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            className={cn("p-2.5 rounded-lg transition-all duration-300", iconBgColor)}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Icon className={cn("h-5 w-5", iconColor)} />
          </motion.div>
          
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.2 }}
              className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </motion.div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.1 }}
          >
            <h3 className={cn(
              "text-3xl font-bold tracking-tight transition-colors duration-300",
              valueColor || "text-foreground group-hover:text-primary"
            )}>
              {value}
            </h3>
          </motion.div>
          {description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.15 }}
              className="text-xs text-muted-foreground mt-1"
            >
              {description}
            </motion.p>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  )
}

