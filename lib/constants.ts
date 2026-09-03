export const SUPPORTED_LANGUAGES = [
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "csharp", label: "C#" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
]

export const PLATFORMS = [
  { value: "leetcode", label: "LeetCode" },
  { value: "gfg", label: "GeeksforGeeks" },
  { value: "codeforces", label: "Codeforces" },
  { value: "codechef", label: "CodeChef" },
  { value: "atcoder", label: "AtCoder" },
  { value: "hackerrank", label: "HackerRank" },
  { value: "lld", label: "Low Level Design" },
]

export const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

export const PATTERNS = [
  { value: "arrays", label: "Arrays" },
  { value: "strings", label: "Strings" },
  { value: "two-pointers", label: "Two Pointers" },
  { value: "fast-slow-pointer", label: "Fast and Slow Pointer" },
  { value: "sliding-window", label: "Sliding Window" },
  { value: "binary-search", label: "Binary Search" },
  { value: "binary-search-on-answer", label: "Binary Search on Answer" },
  { value: "prefix-sum", label: "Prefix Sum" },
  { value: "hashing", label: "Hashing" },
  { value: "stack", label: "Stack" },
  { value: "monotonic-stack", label: "Monotonic Stack" },
  { value: "queue", label: "Queue" },
  { value: "linked-list", label: "Linked List" },
  { value: "recursion", label: "Recursion" },
  { value: "backtracking", label: "Backtracking" },
  { value: "dynamic-programming", label: "Dynamic Programming" },
  { value: "greedy", label: "Greedy" },
  { value: "sorting", label: "Sorting" },
  { value: "cyclic-sort", label: "Cyclic Sort" },
  { value: "intervals", label: "Intervals" },
  { value: "trees", label: "Trees" },
  { value: "bst", label: "Binary Search Tree" },
  { value: "heap", label: "Heap / Priority Queue" },
  { value: "k-way-merge", label: "K-way Merge" },
  { value: "two-heaps", label: "Two Heaps" },
  { value: "trie", label: "Trie" },
  { value: "graphs", label: "Graphs" },
  { value: "bfs", label: "BFS" },
  { value: "dfs", label: "DFS" },
  { value: "topological-sort", label: "Topological Sort" },
  { value: "union-find", label: "Union-Find" },
  { value: "bit-manipulation", label: "Bit Manipulation" },
  { value: "math", label: "Math" },
  { value: "matrix", label: "Matrix" },
  { value: "design", label: "Design a Data Structure" },
] as const

export function patternLabel(value: string | null | undefined): string {
  if (!value) return "Unclassified"
  return PATTERNS.find((p) => p.value === value)?.label ?? value
}

export const PROBLEMS_PER_PAGE = 20

// How far back a sync reads commit history to date each solution.
export const SOLVE_HISTORY_DAYS = 30
export const BACKFILL_MAX_DAYS = 30

