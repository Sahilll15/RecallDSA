import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GitHubService, parseRepoFullName, parseProblemInfo, isCodeFile } from "@/lib/github"

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id || !session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { repoId } = await request.json()
    
    if (!repoId) {
      return NextResponse.json({ error: "Repository ID is required" }, { status: 400 })
    }

    const repo = await prisma.repo.findUnique({
      where: { id: repoId, userId: session.user.id },
    })

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    const { owner, repo: repoName } = parseRepoFullName(repo.fullName)
    const github = new GitHubService(session.accessToken)
    
    const tree = await github.getRepoTree(owner, repoName, repo.defaultBranch)
    
    const codeFiles = tree.filter(
      (item) => item.type === "blob" && item.path && isCodeFile(item.path)
    )

    let added = 0
    let updated = 0

    for (const file of codeFiles) {
      if (!file.path || !file.sha) continue

      const filename = file.path.split("/").pop()!
      const { platform, difficulty, title, language } = parseProblemInfo(file.path, filename)

      const existing = await prisma.problem.findUnique({
        where: {
          repoId_path: {
            repoId: repo.id,
            path: file.path,
          },
        },
      })

      if (existing) {
        if (existing.sha !== file.sha) {
          await prisma.problem.update({
            where: { id: existing.id },
            data: {
              sha: file.sha,
              title,
              platform,
              difficulty,
              language,
              updatedAt: new Date(),
            },
          })
          updated++
        }
      } else {
        await prisma.problem.create({
          data: {
            repoId: repo.id,
            path: file.path,
            sha: file.sha,
            title,
            platform,
            difficulty,
            language,
          },
        })
        added++
      }
    }

    return NextResponse.json({ added, updated, total: codeFiles.length })
  } catch (error) {
    console.error("Failed to sync repo:", error)
    return NextResponse.json({ error: "Failed to sync repository" }, { status: 500 })
  }
}

