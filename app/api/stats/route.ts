import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const [totalProblems, totalRevisions, platformStats, difficultyStats] = await Promise.all([
      prisma.problem.count({
        where: { repoId: { in: repoIds } },
      }),
      prisma.revision.count({
        where: { userId: session.user.id },
      }),
      prisma.problem.groupBy({
        by: ["platform"],
        where: { repoId: { in: repoIds } },
        _count: true,
      }),
      prisma.problem.groupBy({
        by: ["difficulty"],
        where: { repoId: { in: repoIds } },
        _count: true,
      }),
    ])

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

