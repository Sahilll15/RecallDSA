import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays === -1) return "Yesterday"
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
  
  return formatDate(date)
}

export function getDifficultyColor(difficulty?: string | null): string {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "text-green-600 bg-green-50 border-green-200"
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200"
    case "hard":
      return "text-red-600 bg-red-50 border-red-200"
    default:
      return "text-gray-600 bg-gray-50 border-gray-200"
  }
}

export function getPlatformColor(platform?: string | null): string {
  switch (platform?.toLowerCase()) {
    case "leetcode":
      return "text-orange-600 bg-orange-50 border-orange-200"
    case "gfg":
    case "geeksforgeeks":
      return "text-green-600 bg-green-50 border-green-200"
    case "codeforces":
      return "text-blue-600 bg-blue-50 border-blue-200"
    case "codechef":
      return "text-yellow-600 bg-yellow-50 border-yellow-200"
    default:
      return "text-purple-600 bg-purple-50 border-purple-200"
  }
}

