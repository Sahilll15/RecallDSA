import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const platform = searchParams.get("platform") || ""
    const difficulty = searchParams.get("difficulty") || ""
    const language = searchParams.get("language") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const repos = await prisma.repo.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    })

    const repoIds = repos.map((r) => r.id)

    const where: any = {
      repoId: { in: repoIds },
    }

    if (search) {
      where.title = { contains: search, mode: "insensitive" }
    }

    if (platform) {
      where.platform = platform
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (language) {
      where.language = language
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        include: {
          repo: {
            select: {
              fullName: true,
              defaultBranch: true,
            },
          },
          revisions: {
            where: { userId: session.user.id },
            select: {
              id: true,
              nextDate: true,
              lastRevised: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.problem.count({ where }),
    ])

    return NextResponse.json({
      problems,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Failed to fetch problems:", error)
    return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 })
  }
}

