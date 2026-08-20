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
  // Calendar-day diff: 2 hours ago is "Today", not "Yesterday".
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(target) - startOfDay(now)) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays === -1) return "Yesterday"
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
  
  return formatDate(date)
}

// Difficulty and platform read off semantic tokens so both themes stay legible.
export function getDifficultyColor(difficulty?: string | null): string {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "border-success/25 bg-success-soft text-success"
    case "medium":
      return "border-warning/25 bg-warning-soft text-warning"
    case "hard":
      return "border-destructive/25 bg-destructive-soft text-destructive"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

export function getPlatformColor(platform?: string | null): string {
  switch (platform?.toLowerCase()) {
    case "leetcode":
      return "border-warning/25 bg-warning-soft text-warning"
    case "gfg":
    case "geeksforgeeks":
      return "border-success/25 bg-success-soft text-success"
    case "codeforces":
    case "codechef":
    case "atcoder":
      return "border-info/25 bg-info-soft text-info"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

const ACRONYMS = new Set([
  "bst", "dp", "lru", "lfu", "api", "sql", "dns", "xor", "gcd", "lcm", "kmp",
  "dfs", "bfs", "dsu", "url", "ip", "css", "html", "json", "cpu", "io",
])

const TRAILING_ROMAN = /^(i{2,3}|iv|vi{0,3}|ix|xi{0,2})$/i

/**
 * Titles come from file slugs, so "permutations-ii" title-cases to
 * "Permutations Ii". Roman numerals only count at the end, where LeetCode puts
 * them, otherwise a problem about the letter V would get shouted.
 */
export function formatProblemTitle(title: string): string {
  const words = title.split(" ")

  return words
    .map((word, i) => {
      const lower = word.toLowerCase()
      if (ACRONYMS.has(lower)) return lower.toUpperCase()
      if (i === words.length - 1 && i > 0 && TRAILING_ROMAN.test(lower)) {
        return lower.toUpperCase()
      }
      return word
    })
    .join(" ")
}

/** Runs `worker` over `items` with a small concurrency cap, preserving order. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index], index)
    }
  })

  await Promise.all(runners)
  return results
}

