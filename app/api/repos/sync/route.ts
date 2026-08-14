import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GitHubService, parseRepoFullName, parseProblemInfo, isCodeFile } from "@/lib/github"
import { initialSchedulingState, nextDateFrom } from "@/lib/spaced-repetition"
import { SOLVE_HISTORY_DAYS } from "@/lib/constants"

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

    if (tree === null) {
      return NextResponse.json(
        { error: "Could not read the repository tree. Check the repo still exists and your GitHub access." },
        { status: 502 }
      )
    }

    const codeFiles = tree.filter(
      (item) => item.type === "blob" && item.path && isCodeFile(item.path)
    )

    const solveDates = await github.getSolveDates(owner, repoName, SOLVE_HISTORY_DAYS)

    const existingProblems = await prisma.problem.findMany({
      where: { repoId: repo.id },
      select: { id: true, path: true, sha: true },
    })
    const existingByPath = new Map(existingProblems.map((p) => [p.path, p]))
    const treePaths = new Set(codeFiles.map((f) => f.path!))

    // First import of a repo would flood the queue with hundreds of due
    // revisions, so only files added on later syncs get auto-scheduled.
    const autoSchedule = existingProblems.length > 0

    let added = 0
    let updated = 0
    let scheduled = 0

    for (const file of codeFiles) {
      if (!file.path || !file.sha) continue

      const filename = file.path.split("/").pop()!
      const { platform, difficulty, title, language, pattern } = parseProblemInfo(file.path, filename)

      const existing = existingByPath.get(file.path)
      const solvedAt = solveDates.get(file.path) ?? null

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
              pattern,
              ...(solvedAt ? { solvedAt } : {}),
              updatedAt: new Date(),
            },
          })
          updated++
        } else if (solvedAt) {
          await prisma.problem.update({
            where: { id: existing.id },
            data: { solvedAt },
          })
        }
      } else {
        const fresh = initialSchedulingState()
        await prisma.problem.create({
          data: {
            repoId: repo.id,
            path: file.path,
            sha: file.sha,
            title,
            platform,
            difficulty,
            language,
            pattern,
            solvedAt,
            ...(autoSchedule
              ? {
                  revisions: {
                    create: {
                      userId: session.user.id,
                      nextDate: nextDateFrom(fresh.intervalDays),
                      intervalDays: fresh.intervalDays,
                    },
                  },
                }
              : {}),
          },
        })
        added++
        if (autoSchedule) scheduled++
      }
    }

    const stalePaths = existingProblems
      .filter((p) => !treePaths.has(p.path))
      .map((p) => p.path)

    const { count: removed } = await prisma.problem.deleteMany({
      where: { repoId: repo.id, path: { in: stalePaths } },
    })

    return NextResponse.json({ added, updated, removed, scheduled, total: codeFiles.length })
  } catch (error) {
    console.error("Failed to sync repo:", error)
    return NextResponse.json({ error: "Failed to sync repository" }, { status: 500 })
  }
}

