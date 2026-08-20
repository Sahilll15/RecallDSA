import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { dedupeByCanonicalKey } from "@/lib/problem-identity"
import { dedupeRevisionQueue } from "@/lib/revision-queue"

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const repos = await prisma.repo.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    })

    const repoIds = repos.map((r) => r.id)

    // Counted per problem, not per file: one problem committed under two paths
    // is one problem everywhere in the product.
    const [problems, revisions] = await Promise.all([
      prisma.problem.findMany({
        where: { repoId: { in: repoIds } },
        select: { id: true, path: true, platform: true, difficulty: true, updatedAt: true },
      }),
      prisma.revision.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          nextDate: true,
          lastRevised: true,
          repetitions: true,
          createdAt: true,
          problem: { select: { path: true } },
        },
      }),
    ])

    const distinctProblems = dedupeByCanonicalKey(problems, (p) => p.path, (a, b) =>
      b.updatedAt > a.updatedAt ? b : a,
    )
    const totalProblems = distinctProblems.length
    const totalRevisions = dedupeRevisionQueue(revisions).length

    const tally = (key: "platform" | "difficulty") => {
      const counts = new Map<string | null, number>()
      for (const problem of distinctProblems) {
        counts.set(problem[key], (counts.get(problem[key]) ?? 0) + 1)
      }
      return [...counts.entries()].map(([value, count]) => ({ [key]: value, _count: count }))
    }

    const platformStats = tally("platform")
    const difficultyStats = tally("difficulty")

    return NextResponse.json({
      totalProblems,
      totalRevisions,
      platformStats,
      difficultyStats,
    })
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

