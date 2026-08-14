import { Octokit } from "@octokit/rest"

export class GitHubService {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken })
  }

  async getUserRepos() {
    const response = await this.octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    })
    return response.data
  }

  async getRepoContents(owner: string, repo: string, path: string = "", branch: string = "main") {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      })
      return response.data
    } catch (error) {
      return null
    }
  }

  /** Returns null when the tree cannot be read (bad token, missing repo/branch). */
  async getRepoTree(owner: string, repo: string, branch: string = "main") {
    try {
      const response = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: "true",
      })
      return response.data.tree
    } catch (error) {
      console.error(`Failed to read tree for ${owner}/${repo}@${branch}:`, error)
      return null
    }
  }

  async getFileContent(owner: string, repo: string, path: string, branch: string = "main") {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      })
      
      if (Array.isArray(response.data) || response.data.type !== "file") {
        return null
      }

      const content = Buffer.from(response.data.content, "base64").toString("utf-8")
      return {
        content,
        sha: response.data.sha,
      }
    } catch (error) {
      return null
    }
  }

  async getRepo(owner: string, repo: string) {
    const response = await this.octokit.repos.get({ owner, repo })
    return response.data
  }
}

export function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/")
  return { owner, repo }
}

export function getLanguageFromExtension(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    c: "c",
    py: "python",
    java: "java",
    js: "javascript",
    ts: "typescript",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    cs: "csharp",
    kt: "kotlin",
    swift: "swift",
  }
  return ext ? langMap[ext] || ext : null
}

const PATTERN_KEYWORDS: Array<[string, string[]]> = [
  ["binary-search-on-answer", ["binary-search-on-answer", "bs-on-answer", "search-on-answer"]],
  ["binary-search", ["binary-search", "binarysearch", "binary_search"]],
  ["two-pointers", ["two-pointer", "twopointer", "two_pointer"]],
  ["sliding-window", ["sliding-window", "slidingwindow", "sliding_window"]],
  ["prefix-sum", ["prefix-sum", "prefixsum", "prefix_sum"]],
  ["monotonic-stack", ["monotonic-stack", "monotonicstack", "monotonic_stack"]],
  ["linked-list", ["linked-list", "linkedlist", "linked_list"]],
  ["dynamic-programming", ["dynamic-programming", "dp/", "/dp", "\\dp", "dynamicprogramming"]],
  ["backtracking", ["backtracking", "backtrack"]],
  ["topological-sort", ["topological", "toposort"]],
  ["union-find", ["union-find", "unionfind", "disjoint-set", "dsu"]],
  ["bit-manipulation", ["bit-manipulation", "bitmanip", "bitwise", "bit_manipulation"]],
  ["intervals", ["interval"]],
  ["recursion", ["recursion", "recursive"]],
  ["hashing", ["hashing", "hashmap", "hash-map", "hash_map", "hashtable"]],
  ["greedy", ["greedy"]],
  ["sorting", ["sorting", "/sort", "\\sort"]],
  ["heap", ["heap", "priority-queue", "priorityqueue", "priority_queue"]],
  ["trie", ["trie"]],
  ["bst", ["/bst", "\\bst", "binary-search-tree"]],
  ["trees", ["tree"]],
  ["graphs", ["graph"]],
  ["bfs", ["/bfs", "\\bfs", "breadth-first"]],
  ["dfs", ["/dfs", "\\dfs", "depth-first"]],
  ["matrix", ["matrix", "/grid", "\\grid"]],
  ["queue", ["queue"]],
  ["stack", ["stack"]],
  ["strings", ["string"]],
  ["math", ["/math", "\\math"]],
  ["arrays", ["array"]],
]

export function detectPattern(path: string): string | null {
  const pathLower = path.toLowerCase()
  for (const [pattern, keywords] of PATTERN_KEYWORDS) {
    if (keywords.some((kw) => pathLower.includes(kw))) return pattern
  }
  return null
}

export function parseProblemInfo(path: string, filename: string) {
  const pathLower = path.toLowerCase()

  let platform: string | null = null
  if (pathLower.includes("leetcode")) platform = "leetcode"
  else if (pathLower.includes("gfg") || pathLower.includes("geeksforgeeks")) platform = "gfg"
  else if (pathLower.includes("codeforces")) platform = "codeforces"
  else if (pathLower.includes("codechef")) platform = "codechef"
  else if (pathLower.includes("atcoder")) platform = "atcoder"
  else if (pathLower.includes("hackerrank")) platform = "hackerrank"
  
  let difficulty: string | null = null
  if (pathLower.includes("/easy/") || pathLower.includes("\\easy\\")) difficulty = "easy"
  else if (pathLower.includes("/medium/") || pathLower.includes("\\medium\\")) difficulty = "medium"
  else if (pathLower.includes("/hard/") || pathLower.includes("\\hard\\")) difficulty = "hard"
  
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "")
  // LeetHub-style names lead with the problem number: "0001-two-sum" -> "Two Sum"
  const title = nameWithoutExt
    .replace(/^\d+[-_.\s]+/, "")
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
  
  const language = getLanguageFromExtension(filename)
  const pattern = detectPattern(path)

  return { platform, difficulty, title, language, pattern }
}

export function isCodeFile(filename: string): boolean {
  const codeExtensions = [
    "cpp", "cc", "cxx", "c", "py", "java", "js", "ts",
    "go", "rs", "rb", "php", "cs", "kt", "swift"
  ]
  const ext = filename.split(".").pop()?.toLowerCase()
  return ext ? codeExtensions.includes(ext) : false
}

