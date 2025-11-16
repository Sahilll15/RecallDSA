import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GitHubService, parseRepoFullName } from "@/lib/github"
import crypto from "crypto"

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const repos = await prisma.repo.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { problems: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json(repos)
  } catch (error) {
    console.error("Failed to fetch connected repos:", error)
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id || !session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { fullName, defaultBranch = "main" } = await request.json()
    
    if (!fullName) {
      return NextResponse.json({ error: "Repository name is required" }, { status: 400 })
    }

    const { owner, repo } = parseRepoFullName(fullName)
    const github = new GitHubService(session.accessToken)
    
    const repoData = await github.getRepo(owner, repo)
    
    const webhookSecret = crypto.randomBytes(32).toString("hex")
    
    const newRepo = await prisma.repo.upsert({
      where: {
        userId_fullName: {
          userId: session.user.id,
          fullName,
        },
      },
      update: {
        defaultBranch: repoData.default_branch || defaultBranch,
      },
      create: {
        userId: session.user.id,
        fullName,
        defaultBranch: repoData.default_branch || defaultBranch,
        webhookSecret,
      },
    })

    return NextResponse.json(newRepo)
  } catch (error) {
    console.error("Failed to connect repo:", error)
    return NextResponse.json({ error: "Failed to connect repository" }, { status: 500 })
  }
}

