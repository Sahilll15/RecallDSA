import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { initialSchedulingState, nextDateFrom } from "@/lib/spaced-repetition"
import { dedupeRevisionQueue } from "@/lib/revision-queue"
import { canonicalProblemKey } from "@/lib/problem-identity"

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get("filter") || "all"

    const where: any = {
      userId: session.user.id,
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 8)

    if (filter === "due" || filter === "today") {
      where.nextDate = { lt: endOfToday }
    } else if (filter === "week") {
      where.nextDate = { gte: endOfToday, lt: weekFromNow }
    } else if (filter === "overdue") {
      where.nextDate = { lt: today }
    }

    const revisions = await prisma.revision.findMany({
      where,
      include: {
        problem: {
          include: {
            repo: {
              select: {
                fullName: true,
              },
            },
            recallNote: true,
          },
        },
      },
      orderBy: { nextDate: "asc" },
    })

    // The same problem can exist under several paths; the queue shows it once.
    return NextResponse.json(dedupeRevisionQueue(revisions))
  } catch (error) {
    console.error("Failed to fetch revisions:", error)
    return NextResponse.json({ error: "Failed to fetch revisions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { problemId } = await request.json()
    
    if (!problemId) {
      return NextResponse.json({ error: "Problem ID is required" }, { status: 400 })
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { repo: true },
    })

    if (!problem || problem.repo.userId !== session.user.id) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 })
    }

    // This problem, or a sibling file of it, already being in the queue makes
    // this a duplicate rather than a new card. Re-adding must never restart the
    // ladder: the whole point of the schedule is that it only moves on a rating.
    const tracked = await prisma.revision.findMany({
      where: { userId: session.user.id },
      select: { id: true, problemId: true, problem: { select: { path: true } } },
    })
    const key = canonicalProblemKey(problem.path)
    const existing = tracked.find(
      (r) => r.problemId === problemId || canonicalProblemKey(r.problem.path) === key,
    )

    if (existing) {
      const revision = await prisma.revision.findUnique({ where: { id: existing.id } })
      return NextResponse.json({ ...revision, alreadyTracked: true })
    }

    const fresh = initialSchedulingState()

    const revision = await prisma.revision.create({
      data: {
        userId: session.user.id,
        problemId,
        nextDate: nextDateFrom(fresh.intervalDays),
        intervalDays: fresh.intervalDays,
      },
    })

    return NextResponse.json(revision)
  } catch (error) {
    console.error("Failed to create revision:", error)
    return NextResponse.json({ error: "Failed to create revision" }, { status: 500 })
  }
}

