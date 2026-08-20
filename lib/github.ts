import { Octokit } from "@octokit/rest"
import { detectPattern } from "./pattern-detection"
import { formatProblemTitle } from "./utils"

export { detectPattern }

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

  /**
   * Earliest commit date per file path within the window: when the solution was
   * actually written, which the sync's own timestamps cannot tell you.
   */
  async getSolveDates(
    owner: string,
    repo: string,
    sinceDays: number,
  ): Promise<Map<string, Date>> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()
    const solvedAt = new Map<string, Date>()

    try {
      const commits = await this.octokit.paginate(this.octokit.repos.listCommits, {
        owner,
        repo,
        since,
        per_page: 100,
      })

      // Each commit costs an extra API call to read its file list, so a busy
      // repo would otherwise burn the hourly rate limit on one sync.
      for (const commit of commits.slice(0, MAX_COMMITS_PER_SYNC)) {
        const detail = await this.octokit.repos.getCommit({
          owner,
          repo,
          ref: commit.sha,
        })
        const date = detail.data.commit.author?.date
        if (!date) continue
        const commitDate = new Date(date)

        for (const file of detail.data.files ?? []) {
          if (file.status === "removed" || !isCodeFile(file.filename)) continue
          const existing = solvedAt.get(file.filename)
          if (!existing || commitDate < existing) {
            solvedAt.set(file.filename, commitDate)
          }
        }
      }
    } catch (error) {
      console.error(`Failed to read commit history for ${owner}/${repo}:`, error)
    }

    return solvedAt
  }
}

/** Commits examined per solve-date lookup, to bound the API cost of a sync. */
const MAX_COMMITS_PER_SYNC = 300

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
  const title = formatProblemTitle(
    nameWithoutExt
      .replace(/^\d+[-_.\s]+/, "")
      .replace(/[-_]/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  )
  
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

