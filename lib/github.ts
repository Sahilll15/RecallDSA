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
      return []
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
  const title = nameWithoutExt
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
  
  const language = getLanguageFromExtension(filename)
  
  return { platform, difficulty, title, language }
}

export function isCodeFile(filename: string): boolean {
  const codeExtensions = [
    "cpp", "cc", "cxx", "c", "py", "java", "js", "ts",
    "go", "rs", "rb", "php", "cs", "kt", "swift"
  ]
  const ext = filename.split(".").pop()?.toLowerCase()
  return ext ? codeExtensions.includes(ext) : false
}

