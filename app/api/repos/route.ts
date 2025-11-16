import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"

export async function GET() {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const github = new GitHubService(session.accessToken)
    const repos = await github.getUserRepos()
    
    return NextResponse.json(repos)
  } catch (error) {
    console.error("Failed to fetch repos:", error)
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 })
  }
}

