import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { groupByCanonicalKey } from "@/lib/problem-identity"

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
    const pattern = searchParams.get("pattern") || ""
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

    if (pattern) {
      where.pattern = pattern
    }

    // The library lists one row per problem. Two files for the same problem
    // collapse into a single row that reports how many files back it, so the
    // count here matches the count everywhere else in the product.
    const matching = await prisma.problem.findMany({
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
    })

    const grouped = groupByCanonicalKey(matching, (p) => p.path)

    const collapsed = [...grouped.values()].map((files) => {
      // Prefer the copy already being revised, then the most recently touched.
      const primary =
        files.find((f) => f.revisions.length > 0) ?? files[0]

      return {
        ...primary,
        fileCount: files.length,
        alternatePaths: files.filter((f) => f.id !== primary.id).map((f) => f.path),
      }
    })

    collapsed.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    const total = collapsed.length
    const problems = collapsed.slice((page - 1) * limit, page * limit)

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

